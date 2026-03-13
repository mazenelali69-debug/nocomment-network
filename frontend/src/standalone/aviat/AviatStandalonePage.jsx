import React from "react";

const interfaceCards = [
  {
    key: "radio1",
    title: "Radio 1",
    ifName: "Radio1",
    capacity: "3 Gbps",
    rx: 742.4,
    tx: 688.9,
    total: 1431.3,
    utilization: 47.7,
    severity: "normal",
    status: "ONLINE",
  },
  {
    key: "switchA",
    title: "Switch A",
    ifName: "TenGigE1/2",
    capacity: "1 Gbps",
    rx: 412.6,
    tx: 238.4,
    total: 651.0,
    utilization: 65.1,
    severity: "medium",
    status: "ONLINE",
  },
  {
    key: "switchB",
    title: "Switch B",
    ifName: "TenGigE1/1",
    capacity: "1 Gbps",
    rx: 801.1,
    tx: 122.8,
    total: 923.9,
    utilization: 92.4,
    severity: "high",
    status: "ONLINE",
  },
];

const pingCards = [
  { key: "thgv", title: "THGV", ip: "112.24.30.1", latency: 12, status: "ONLINE" },
  { key: "aviat", title: "Aviat WTM4200", ip: "155.15.59.4", latency: 4, status: "ONLINE" },
  { key: "edgeA", title: "JetStream A", ip: "10.88.88.254", latency: 2, status: "ONLINE" },
  { key: "edgeB", title: "JetStream B", ip: "88.88.88.254", latency: null, status: "LOSS" },
];

function classNames(...items) {
  return items.filter(Boolean).join(" ");
}

function SeverityBadge({ value }) {
  return (
    <span className={classNames("aviat-standalone-badge", `aviat-standalone-badge-${String(value).toLowerCase()}`)}>
      {value}
    </span>
  );
}

function StatusBadge({ value }) {
  const safe = String(value).toLowerCase() === "online" ? "ok" : "loss";
  return (
    <span className={classNames("aviat-standalone-badge", `aviat-standalone-badge-${safe}`)}>
      {value}
    </span>
  );
}

function Stat({ label, value, sub }) {
  return (
    <div className="aviat-standalone-stat">
      <div className="aviat-standalone-stat-label">{label}</div>
      <div className="aviat-standalone-stat-value">{value}</div>
      {sub ? <div className="aviat-standalone-stat-sub">{sub}</div> : null}
    </div>
  );
}

function InterfaceCard({ item }) {
  return (
    <section className="aviat-standalone-panel aviat-standalone-card">
      <div className="aviat-standalone-card-head">
        <div>
          <div className="aviat-standalone-eyebrow">Interface</div>
          <h3>{item.title}</h3>
          <div className="aviat-standalone-muted">{item.ifName}</div>
        </div>
        <div className="aviat-standalone-card-badges">
          <StatusBadge value={item.status} />
          <SeverityBadge value={item.severity} />
        </div>
      </div>

      <div className="aviat-standalone-stats-grid">
        <Stat label="RX" value={`${item.rx} Mbps`} />
        <Stat label="TX" value={`${item.tx} Mbps`} />
        <Stat label="TOTAL" value={`${item.total} Mbps`} />
        <Stat label="CAPACITY" value={item.capacity} />
      </div>

      <div className="aviat-standalone-util-block">
        <div className="aviat-standalone-util-row">
          <span>Utilization</span>
          <strong>{item.utilization}%</strong>
        </div>
        <div className="aviat-standalone-progress">
          <div
            className="aviat-standalone-progress-bar"
            style={{ width: `${Math.min(item.utilization, 100)}%` }}
          />
        </div>
      </div>
    </section>
  );
}

function PingCard({ item }) {
  return (
    <section className="aviat-standalone-panel aviat-standalone-ping-card">
      <div className="aviat-standalone-ping-top">
        <div>
          <div className="aviat-standalone-eyebrow">Ping Target</div>
          <h3>{item.title}</h3>
          <div className="aviat-standalone-muted">{item.ip}</div>
        </div>
        <StatusBadge value={item.status} />
      </div>

      <div className="aviat-standalone-ping-latency">
        {item.latency === null ? "No reply" : `${item.latency} ms`}
      </div>
    </section>
  );
}

export default function AviatStandalonePage() {
  return (
    <main className="aviat-standalone-page">
      <style>{`
        .aviat-standalone-page {
          width: 100%;
          min-height: 100vh;
          padding: 32px;
          background:
            radial-gradient(circle at top, rgba(26, 91, 255, 0.22), transparent 35%),
            linear-gradient(180deg, #08111f 0%, #0b1424 40%, #0f172a 100%);
          color: #e5eefc;
          font-family: Inter, Segoe UI, Arial, sans-serif;
          box-sizing: border-box;
        }

        .aviat-standalone-page * {
          box-sizing: border-box;
        }

        .aviat-standalone-wrap {
          width: 100%;
          max-width: 100%;
          margin: 0 auto;
        }

        .aviat-standalone-panel {
          border: 1px solid rgba(148, 163, 184, 0.18);
          background: rgba(15, 23, 42, 0.78);
          backdrop-filter: blur(10px);
          border-radius: 22px;
          box-shadow: 0 14px 40px rgba(0, 0, 0, 0.26);
        }

        .aviat-standalone-hero {
          display: grid;
          grid-template-columns: 1.8fr 1fr;
          gap: 20px;
          padding: 28px;
          margin-bottom: 22px;
        }

        .aviat-standalone-hero h1 {
          margin: 8px 0 10px;
          font-size: 38px;
          line-height: 1.05;
        }

        .aviat-standalone-hero-text {
          margin: 0;
          color: #9fb0ca;
          max-width: 760px;
          line-height: 1.6;
        }

        .aviat-standalone-hero-side {
          display: grid;
          gap: 12px;
        }

        .aviat-standalone-eyebrow {
          font-size: 12px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #7dd3fc;
        }

        .aviat-standalone-muted {
          color: #8ea2c0;
        }

        .aviat-standalone-summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 16px;
          margin-bottom: 28px;
        }

        .aviat-standalone-summary-card {
          padding: 18px;
        }

        .aviat-standalone-summary-label {
          color: #93a6c4;
          font-size: 13px;
          margin-bottom: 8px;
        }

        .aviat-standalone-summary-value {
          font-size: 24px;
          font-weight: 700;
        }

        .aviat-standalone-section-block {
          margin-bottom: 28px;
        }

        .aviat-standalone-section-head {
          margin-bottom: 16px;
        }

        .aviat-standalone-section-head h2 {
          margin: 0 0 6px;
          font-size: 24px;
        }

        .aviat-standalone-section-head p {
          margin: 0;
          color: #91a4c3;
        }

        .aviat-standalone-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 16px;
        }

        .aviat-standalone-card,
        .aviat-standalone-ping-card {
          padding: 20px;
        }

        .aviat-standalone-card-head,
        .aviat-standalone-ping-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 14px;
          margin-bottom: 18px;
        }

        .aviat-standalone-card h3,
        .aviat-standalone-ping-card h3 {
          margin: 6px 0 4px;
          font-size: 22px;
        }

        .aviat-standalone-card-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: flex-end;
        }

        .aviat-standalone-stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .aviat-standalone-stat {
          padding: 14px;
          border-radius: 16px;
          background: rgba(30, 41, 59, 0.78);
          border: 1px solid rgba(148, 163, 184, 0.14);
        }

        .aviat-standalone-stat-label {
          color: #8ea2c0;
          font-size: 12px;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .aviat-standalone-stat-value {
          font-size: 22px;
          font-weight: 700;
        }

        .aviat-standalone-stat-sub {
          margin-top: 6px;
          color: #8ea2c0;
          font-size: 12px;
        }

        .aviat-standalone-util-block {
          margin-top: 18px;
        }

        .aviat-standalone-util-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          color: #c6d4ea;
        }

        .aviat-standalone-progress {
          height: 12px;
          width: 100%;
          background: rgba(51, 65, 85, 0.85);
          border-radius: 999px;
          overflow: hidden;
        }

        .aviat-standalone-progress-bar {
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, #38bdf8 0%, #3b82f6 55%, #8b5cf6 100%);
        }

        .aviat-standalone-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 78px;
          padding: 7px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .aviat-standalone-badge-ok,
        .aviat-standalone-badge-normal {
          background: rgba(34, 197, 94, 0.16);
          color: #86efac;
          border: 1px solid rgba(34, 197, 94, 0.35);
        }

        .aviat-standalone-badge-medium {
          background: rgba(245, 158, 11, 0.16);
          color: #fcd34d;
          border: 1px solid rgba(245, 158, 11, 0.35);
        }

        .aviat-standalone-badge-high,
        .aviat-standalone-badge-loss {
          background: rgba(239, 68, 68, 0.16);
          color: #fca5a5;
          border: 1px solid rgba(239, 68, 68, 0.35);
        }

        .aviat-standalone-ping-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 16px;
        }

        .aviat-standalone-ping-latency {
          margin-top: 26px;
          font-size: 32px;
          font-weight: 800;
        }

        @media (max-width: 1200px) {
          .aviat-standalone-cards-grid,
          .aviat-standalone-ping-grid,
          .aviat-standalone-summary-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .aviat-standalone-hero {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 720px) {
          .aviat-standalone-page {
            padding: 16px;
          }

          .aviat-standalone-cards-grid,
          .aviat-standalone-ping-grid,
          .aviat-standalone-summary-grid,
          .aviat-standalone-stats-grid {
            grid-template-columns: 1fr;
          }

          .aviat-standalone-hero h1 {
            font-size: 28px;
          }
        }
      `}</style>

      <div className="aviat-standalone-wrap">
        <section className="aviat-standalone-panel aviat-standalone-hero">
          <div>
            <div className="aviat-standalone-eyebrow">NoComment Network</div>
            <h1>Aviat Monitoring Standalone</h1>
            <p className="aviat-standalone-hero-text">
              Independent Aviat prototype page inside the same project, isolated from
              the old Aviat page, sidebar wiring, and current backend integration.
            </p>
          </div>

          <div className="aviat-standalone-hero-side">
            <Stat label="DEVICE" value="155.15.59.4" sub="Mock device target" />
            <Stat label="POLL" value="3 sec" sub="Prototype refresh profile" />
            <Stat label="MODE" value="Standalone Route" sub="Inside same frontend project" />
          </div>
        </section>

        <section className="aviat-standalone-summary-grid">
          <div className="aviat-standalone-panel aviat-standalone-summary-card">
            <div className="aviat-standalone-summary-label">Backend Link</div>
            <div className="aviat-standalone-summary-value">DISCONNECTED</div>
          </div>
          <div className="aviat-standalone-panel aviat-standalone-summary-card">
            <div className="aviat-standalone-summary-label">Layout Link</div>
            <div className="aviat-standalone-summary-value">NONE</div>
          </div>
          <div className="aviat-standalone-panel aviat-standalone-summary-card">
            <div className="aviat-standalone-summary-label">Router Link</div>
            <div className="aviat-standalone-summary-value">ISOLATED</div>
          </div>
          <div className="aviat-standalone-panel aviat-standalone-summary-card">
            <div className="aviat-standalone-summary-label">Data Source</div>
            <div className="aviat-standalone-summary-value">MOCK</div>
          </div>
        </section>

        <section className="aviat-standalone-section-block">
          <div className="aviat-standalone-section-head">
            <h2>Traffic Interfaces</h2>
            <p>Clean isolated cards for Aviat throughput preview.</p>
          </div>
          <div className="aviat-standalone-cards-grid">
            {interfaceCards.map((item) => (
              <InterfaceCard key={item.key} item={item} />
            ))}
          </div>
        </section>

        <section className="aviat-standalone-section-block">
          <div className="aviat-standalone-section-head">
            <h2>Ping Targets</h2>
            <p>Simple mock latency layout inside the main frontend app.</p>
          </div>
          <div className="aviat-standalone-ping-grid">
            {pingCards.map((item) => (
              <PingCard key={item.key} item={item} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

