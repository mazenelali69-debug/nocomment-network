import React, { useEffect, useState } from "react";
import "./AviatPage.css";

const API_URL = "/api/aviat/status";

function fmtMbps(v) {
  return Number.isFinite(v) ? `${v.toFixed(2)} Mbps` : "--";
}

function fmtPct(v) {
  return Number.isFinite(v) ? `${v.toFixed(1)}%` : "--";
}

function fmtMs(v) {
  return Number.isFinite(v) ? `${v.toFixed(0)} ms` : "--";
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function totalOf(cards) {
  return ["uplink", "switchA", "switchB"].reduce((a, k) => a + Number(cards?.[k]?.totalMbps || 0), 0);
}

function maxUtil(cards) {
  return Math.max(
    Number(cards?.uplink?.utilizationPct || 0),
    Number(cards?.switchA?.utilizationPct || 0),
    Number(cards?.switchB?.utilizationPct || 0)
  );
}

function sevKey(util) {
  if (!Number.isFinite(util)) return "normal";
  if (util >= 85) return "high";
  if (util >= 60) return "medium";
  return "normal";
}

function sevLabel(util) {
  const s = sevKey(util);
  if (s === "high") return "Critical";
  if (s === "medium") return "Warning";
  return "Stable";
}

function avgLatency(points = []) {
  const clean = points.filter(v => Number.isFinite(v));
  if (!clean.length) return null;
  return clean.reduce((a, b) => a + b, 0) / clean.length;
}

function lossPct(points = []) {
  if (!points.length) return 0;
  const lost = points.filter(v => !Number.isFinite(v)).length;
  return (lost / points.length) * 100;
}

function pingState(points = [], lastOk = false) {
  const loss = lossPct(points);
  if (!lastOk || loss >= 40) return "loss";
  const avg = avgLatency(points);
  if (!Number.isFinite(avg)) return "loss";
  if (avg >= 80) return "high";
  if (avg >= 30) return "medium";
  return "normal";
}

function Sparkline({ points = [] }) {
  const width = 160;
  const height = 32;
  const clean = points.filter(v => Number.isFinite(v));
  const min = clean.length ? Math.min(...clean) : 0;
  const max = clean.length ? Math.max(...clean) : 10;
  const span = Math.max(1, max - min);

  const plotted = points.map((v, i) => {
    const x = (i / Math.max(1, points.length - 1)) * width;
    const safe = Number.isFinite(v) ? v : max;
    const y = height - (((safe - min) / span) * (height - 10) + 5);
    return { x, y };
  });

  const d = plotted.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");

  return (
    <div className="aviat-clean2-spark">
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <path d={d || ""} className="aviat-clean2-spark-line" />
      </svg>
    </div>
  );
}

function PingChip({ ping }) {
  const avg = avgLatency(ping?.points || []);
  const loss = lossPct(ping?.points || []);
  const state = pingState(ping?.points || [], ping?.lastOk);

  return (
    <div className={`aviat-clean2-ping ${state}`}>
      <span className="dot"></span>
      <span>{fmtMs(avg)}</span>
      <span className="sep">•</span>
      <span>{loss.toFixed(0)}% loss</span>
    </div>
  );
}

function Metric({ label, value, tone = "normal" }) {
  return (
    <div className={`aviat-clean2-metric ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Node({ cls, label, title, ip, value, ping, sev }) {
  return (
    <div className={`aviat-clean2-node ${cls} ${sev || ""}`}>
      <div className="aviat-clean2-node-label">{label}</div>
      <div className="aviat-clean2-node-title">{title}</div>
      <div className="aviat-clean2-node-ip">{ip}</div>
      {value ? <div className="aviat-clean2-node-value">{value}</div> : null}
      <PingChip ping={ping} />
    </div>
  );
}

function RxTxBars({ rx, tx, capacity }) {
  const cap = Number(capacity || 0);
  const rxPct = cap > 0 ? clamp((Number(rx || 0) / cap) * 100, 0, 100) : 0;
  const txPct = cap > 0 ? clamp((Number(tx || 0) / cap) * 100, 0, 100) : 0;

  return (
    <div className="aviat-clean2-bars">
      <div className="aviat-clean2-bars-row">
        <span>RX</span>
        <strong>{fmtMbps(rx)}</strong>
      </div>
      <div className="aviat-clean2-bar-shell">
        <div className="aviat-clean2-bar rx" style={{ width: `${rxPct}%` }} />
      </div>

      <div className="aviat-clean2-bars-row">
        <span>TX</span>
        <strong>{fmtMbps(tx)}</strong>
      </div>
      <div className="aviat-clean2-bar-shell">
        <div className="aviat-clean2-bar tx" style={{ width: `${txPct}%` }} />
      </div>
    </div>
  );
}

function LinkPanel({ side, title, ip, data, ping }) {
  if (!data) {
    return (
      <div className="aviat-clean2-panel">
        <div className="aviat-clean2-panel-head">
          <div>
            <div className="aviat-clean2-panel-side">{side}</div>
            <div className="aviat-clean2-panel-title">{title}</div>
            <div className="aviat-clean2-panel-ip">{ip}</div>
          </div>
          <div className="aviat-clean2-badge high">No Data</div>
        </div>
      </div>
    );
  }

  const util = clamp(Number(data.utilizationPct || 0), 0, 100);
  const sev = sevKey(util);

  return (
    <div className={`aviat-clean2-panel ${sev}`}>
      <div className="aviat-clean2-panel-head">
        <div>
          <div className="aviat-clean2-panel-side">{side}</div>
          <div className="aviat-clean2-panel-title">{title}</div>
          <div className="aviat-clean2-panel-ip">{ip}</div>
        </div>

        <div className="aviat-clean2-panel-badges">
          <div className="aviat-clean2-badge ok">{data.status || "Online"}</div>
          <div className={`aviat-clean2-badge ${sev}`}>{sevLabel(util)}</div>
        </div>
      </div>

      <div className="aviat-clean2-panel-main">
        <div>
          <div className="aviat-clean2-total">{fmtMbps(data.totalMbps)}</div>
          <div className="aviat-clean2-total-sub">Real-time Throughput</div>
        </div>

        <div className={`aviat-clean2-util ${sev}`}>
          <span>Utilization</span>
          <strong>{fmtPct(util)}</strong>
        </div>
      </div>

      <div className="aviat-clean2-progress-shell">
        <div className={`aviat-clean2-progress ${sev}`} style={{ width: `${util}%` }} />
      </div>

      <RxTxBars rx={data.rxMbps} tx={data.txMbps} capacity={data.capacityMbps} />

      <div className="aviat-clean2-grid">
        <div><span>Capacity</span><strong>{data.capacityMbps} Mbps</strong></div>
        <div><span>Load</span><strong>{sevLabel(util)}</strong></div>
      </div>

      <div className="aviat-clean2-panel-bottom">
        <PingChip ping={ping} />
        <Sparkline points={ping?.points || []} />
      </div>
    </div>
  );
}

function Topology({ cards, ping }) {
  const u = cards?.uplink;
  const a = cards?.switchA;
  const b = cards?.switchB;

  return (
    <div className="aviat-clean2-map">
      <div className="aviat-clean2-map-head">
        <div>
          <div className="aviat-clean2-map-kicker">Live Topology</div>
          <div className="aviat-clean2-map-title">Aviat Radio Distribution</div>
        </div>

        <div className="aviat-clean2-map-stats">
          <div className="aviat-clean2-map-stat">
            <span>Northbound</span>
            <strong>{fmtMbps(Number(u?.rxMbps || 0) + Number(u?.txMbps || 0))}</strong>
          </div>
          <div className="aviat-clean2-map-stat">
            <span>Southbound</span>
            <strong>{fmtMbps(Number(a?.totalMbps || 0) + Number(b?.totalMbps || 0))}</strong>
          </div>
        </div>
      </div>

      <div className="aviat-clean2-stage">
        <div className="aviat-clean2-link v"></div>
        <div className="aviat-clean2-link l"></div>
        <div className="aviat-clean2-link r"></div>

        <Node
          cls="internet"
          label="THGV"
          title="Internet Core"
          ip="112.24.30.1"
          ping={ping?.thgv}
        />

        <Node
          cls="radio"
          label="Uplink"
          title="Aviat WTM4200"
          ip="155.15.59.4"
          value={fmtMbps(u?.totalMbps)}
          ping={ping?.aviat}
          sev={sevKey(u?.utilizationPct)}
        />

        <Node
          cls="edge-a"
          label="Edge A"
          title="TP-Link JetStream"
          ip="10.88.88.254"
          value={fmtMbps(a?.totalMbps)}
          ping={ping?.edgeA}
          sev={sevKey(a?.utilizationPct)}
        />

        <Node
          cls="edge-b"
          label="Edge B"
          title="TP-Link JetStream"
          ip="88.88.88.254"
          value={fmtMbps(b?.totalMbps)}
          ping={ping?.edgeB}
          sev={sevKey(b?.utilizationPct)}
        />
      </div>
    </div>
  );
}

export default function AviatPage() {
  const [payload, setPayload] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const res = await fetch(API_URL, { cache: "no-store" });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Aviat API error");
      setPayload(json);
      setError("");
    } catch (err) {
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, []);

  const cards = payload?.cards || {};
  const total = totalOf(cards);
  const peak = maxUtil(cards);
  const overall = sevKey(peak);

  return (
    <div className="aviat-clean2-page">
      <div className="aviat-clean2-header">
        <div>
          <div className="aviat-clean2-eyebrow">Aviat WTM4200 • Live Operations</div>
          <div className="aviat-clean2-title">Aviat Link Monitor</div>
          <div className="aviat-clean2-sub">
            Device {payload?.deviceIp || "--"} • Poll {payload?.pollSeconds || 3}s • Tick {payload?.tick ?? "--"}
          </div>
        </div>

        <div className="aviat-clean2-metrics">
          <Metric label="Total Traffic" value={fmtMbps(total)} />
          <Metric label="Peak Util" value={fmtPct(peak)} tone={overall} />
          <Metric label="State" value={error ? "API Issue" : sevLabel(peak)} tone={error ? "high" : overall} />
        </div>
      </div>

      <Topology cards={cards} ping={payload?.ping || {}} />

      <div className="aviat-clean2-panels">
        <LinkPanel side="Uplink" title="Aviat WTM4200" ip="155.15.59.4" data={cards.uplink} ping={payload?.ping?.aviat} />
        <LinkPanel side="Switch A" title="TP-Link JetStream" ip="10.88.88.254" data={cards.switchA} ping={payload?.ping?.edgeA} />
        <LinkPanel side="Switch B" title="TP-Link JetStream" ip="88.88.88.254" data={cards.switchB} ping={payload?.ping?.edgeB} />
      </div>

      <div className="aviat-clean2-footer">
        <div className="aviat-clean2-badge soft">Device: {payload?.deviceIp || "--"}</div>
        <div className="aviat-clean2-badge soft">Tick: {payload?.tick ?? "--"}</div>
        <div className="aviat-clean2-badge soft">Poll: {payload?.pollSeconds || 3}s</div>
        {loading ? <div className="aviat-clean2-badge medium">Loading</div> : null}
        {error ? <div className="aviat-clean2-badge high">{error}</div> : <div className="aviat-clean2-badge ok">Live</div>}
      </div>
    </div>
  );
}
