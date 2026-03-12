const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 4041;
const CONFIG_PATH = path.join(__dirname, "config", "aviat-oids.json");

const PING_TARGETS = {
  thgv: { label: "THGV", ip: "112.24.30.1" },
  aviat: { label: "Aviat WTM4200", ip: "155.15.59.4" },
  edgeA: { label: "TP-Link JetStream", ip: "10.88.88.254" },
  edgeB: { label: "TP-Link JetStream", ip: "88.88.88.254" },
};

const MAX_SPARK_POINTS = 20;

function loadConfig() {
  const txt = fs.readFileSync(CONFIG_PATH, "utf8");
  return JSON.parse(txt);
}

function snmpGet(ip, community, oid) {
  return new Promise((resolve, reject) => {
    execFile(
      "snmpget",
      ["-v2c", "-c", community, ip, oid],
      { windowsHide: true, timeout: 10000 },
      (err, stdout, stderr) => {
        if (err) {
          reject(new Error((stderr || err.message || "snmpget failed").trim()));
          return;
        }

        const out = String(stdout || "").trim();
        const match = out.match(/=\s*\w+(?:\:\s*|\s+)(.+)$/i);

        if (!match) {
          reject(new Error(`Unexpected SNMP output for ${oid}: ${out}`));
          return;
        }

        resolve(match[1].trim());
      }
    );
  });
}

function parseCounter(v) {
  const m = String(v).match(/-?\d+/);
  if (!m) return null;
  return Number(m[0]);
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function severityFromUtil(util) {
  if (util >= 85) return "high";
  if (util >= 60) return "medium";
  return "normal";
}

function pingOnce(ip) {
  return new Promise((resolve) => {
    execFile(
      "ping",
      ["-n", "1", "-w", "1000", ip],
      { windowsHide: true, timeout: 3000 },
      (err, stdout, _stderr) => {
        const out = String(stdout || "");
        const match = out.match(/time[=<]\s*(\d+)\s*ms/i);
        if (match) {
          resolve({
            ok: true,
            latencyMs: Number(match[1]),
          });
          return;
        }

        resolve({
          ok: false,
          latencyMs: null,
          error: err ? err.message : "Ping failed",
        });
      }
    );
  });
}

const state = {
  initialized: false,
  lastPollAt: null,
  tick: 0,
  deviceIp: null,
  pollSeconds: 3,
  capacitySummary: {
    uplinkMbps: 3000,
    switchAMbps: 1000,
    switchBMbps: 1000,
  },
  interfaces: {},
  ping: {},
  error: null,
};

function ensureInterfaceState(key, cfg) {
  if (!state.interfaces[key]) {
    state.interfaces[key] = {
      key,
      label: cfg.label,
      ifIndex: cfg.ifIndex,
      ifName: cfg.ifName,
      capacityMbps: cfg.capacityMbps,
      inOid: cfg.inOid,
      outOid: cfg.outOid,
      prevIn: null,
      prevOut: null,
      prevTs: null,
      rxMbps: 0,
      txMbps: 0,
      totalMbps: 0,
      utilizationPct: 0,
      status: "INIT",
      severity: "normal",
      rawIn: null,
      rawOut: null,
    };
  }
  return state.interfaces[key];
}

function ensurePingState(key, cfg) {
  if (!state.ping[key]) {
    state.ping[key] = {
      key,
      label: cfg.label,
      ip: cfg.ip,
      lastLatencyMs: null,
      lastOk: false,
      points: [],
      status: "INIT",
    };
  }
  return state.ping[key];
}

async function pollSnmp() {
  const cfg = loadConfig();

  state.deviceIp = cfg.deviceIp;
  state.pollSeconds = Number(cfg.pollSeconds || 3);
  state.capacitySummary = {
    uplinkMbps: Number(cfg.interfaces?.uplink?.capacityMbps || 3000),
    switchAMbps: Number(cfg.interfaces?.switchA?.capacityMbps || 1000),
    switchBMbps: Number(cfg.interfaces?.switchB?.capacityMbps || 1000),
  };

  const now = Date.now();
  const jobs = [];

  for (const [key, ifaceCfg] of Object.entries(cfg.interfaces || {})) {
    const iface = ensureInterfaceState(key, ifaceCfg);

    jobs.push(
      Promise.all([
        snmpGet(cfg.deviceIp, cfg.community, ifaceCfg.inOid),
        snmpGet(cfg.deviceIp, cfg.community, ifaceCfg.outOid),
      ]).then(([inVal, outVal]) => {
        const inCounter = parseCounter(inVal);
        const outCounter = parseCounter(outVal);

        iface.rawIn = inCounter;
        iface.rawOut = outCounter;

        if (
          iface.prevIn !== null &&
          iface.prevOut !== null &&
          iface.prevTs !== null &&
          inCounter !== null &&
          outCounter !== null
        ) {
          let dt = (now - iface.prevTs) / 1000;
          if (dt <= 0) dt = state.pollSeconds || 3;

          let deltaIn = inCounter - iface.prevIn;
          let deltaOut = outCounter - iface.prevOut;

          if (deltaIn < 0) deltaIn = 0;
          if (deltaOut < 0) deltaOut = 0;

          const rxMbps = (deltaIn * 8) / dt / 1000000;
          const txMbps = (deltaOut * 8) / dt / 1000000;
          const totalMbps = rxMbps + txMbps;
          const util = iface.capacityMbps > 0 ? (totalMbps / iface.capacityMbps) * 100 : 0;

          iface.rxMbps = round2(rxMbps);
          iface.txMbps = round2(txMbps);
          iface.totalMbps = round2(totalMbps);
          iface.utilizationPct = round2(clamp(util, 0, 999));
          iface.severity = severityFromUtil(iface.utilizationPct);
          iface.status = "ONLINE";
        } else {
          iface.rxMbps = 0;
          iface.txMbps = 0;
          iface.totalMbps = 0;
          iface.utilizationPct = 0;
          iface.severity = "normal";
          iface.status = "WARMUP";
        }

        iface.prevIn = inCounter;
        iface.prevOut = outCounter;
        iface.prevTs = now;
      })
    );
  }

  await Promise.all(jobs);
}

async function pollPing() {
  const jobs = Object.entries(PING_TARGETS).map(async ([key, cfg]) => {
    const item = ensurePingState(key, cfg);
    const result = await pingOnce(cfg.ip);

    item.lastOk = result.ok;
    item.lastLatencyMs = result.latencyMs;
    item.status = result.ok ? "ONLINE" : "LOSS";

    if (result.ok && Number.isFinite(result.latencyMs)) {
      item.points.push(result.latencyMs);
      if (item.points.length > MAX_SPARK_POINTS) {
        item.points = item.points.slice(item.points.length - MAX_SPARK_POINTS);
      }
    } else {
      item.points.push(null);
      if (item.points.length > MAX_SPARK_POINTS) {
        item.points = item.points.slice(item.points.length - MAX_SPARK_POINTS);
      }
    }
  });

  await Promise.all(jobs);
}

let polling = false;

async function safePoll() {
  if (polling) return;
  polling = true;
  try {
    await pollSnmp();
    await pollPing();
    state.initialized = true;
    state.lastPollAt = Date.now();
    state.tick += 1;
    state.error = null;
  } catch (err) {
    state.error = err.message || String(err);
  } finally {
    polling = false;
  }
}

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "aviat-backend",
    port: PORT,
    config: CONFIG_PATH,
    pollSeconds: state.pollSeconds,
    initialized: state.initialized,
    tick: state.tick,
    error: state.error,
  });
});

app.get("/api/aviat/status", (_req, res) => {
  res.json({
    ok: !state.error,
    error: state.error,
    deviceIp: state.deviceIp,
    pollSeconds: state.pollSeconds,
    tick: state.tick,
    lastPollAt: state.lastPollAt,
    capacities: state.capacitySummary,
    cards: {
      uplink: state.interfaces.uplink || null,
      switchB: state.interfaces.switchB || null,
      switchA: state.interfaces.switchA || null,
    },
    ping: state.ping,
  });
});

app.listen(PORT, async () => {
  console.log(`Aviat backend listening on http://127.0.0.1:${PORT}`);
  console.log(`Using config: ${CONFIG_PATH}`);
  await safePoll();
  setInterval(safePoll, Math.max(1000, (state.pollSeconds || 3) * 1000));
});
