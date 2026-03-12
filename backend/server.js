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

function severityFromUtil(util) {
  if (util >= 85) return "high";
  if (util >= 60) return "medium";
  return "normal";
}

async function pollOnce() {
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

  state.initialized = true;
  state.lastPollAt = now;
  state.tick += 1;
  state.error = null;
}

let polling = false;

async function safePoll() {
  if (polling) return;
  polling = true;
  try {
    await pollOnce();
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
  const uplink = state.interfaces.uplink || null;
  const switchB = state.interfaces.switchB || null;
  const switchA = state.interfaces.switchA || null;

  res.json({
    ok: !state.error,
    error: state.error,
    deviceIp: state.deviceIp,
    pollSeconds: state.pollSeconds,
    tick: state.tick,
    lastPollAt: state.lastPollAt,
    capacities: state.capacitySummary,
    cards: {
      uplink,
      switchB,
      switchA,
    },
  });
});

app.listen(PORT, async () => {
  console.log(`Aviat backend listening on http://127.0.0.1:${PORT}`);
  console.log(`Using config: ${CONFIG_PATH}`);
  await safePoll();
  setInterval(safePoll, Math.max(1000, (state.pollSeconds || 3) * 1000));
});
