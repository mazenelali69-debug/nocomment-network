import React from "react"

export default function DashboardPage() {
  return (
    <div>
      <div className="page-header">
        <div className="eyebrow">NETWORK OPERATIONS</div>
        <h1 className="page-title">Dashboard</h1>
        <p className="page-text">
          Premium responsive shell for NoComment ISP with enterprise navigation.
        </p>
      </div>

      <div className="hero-panel">
        <div>
          <div className="hero-kicker">CORE STATUS</div>
          <div className="hero-title">NoComment ISP Control Surface</div>
          <div className="hero-text">
            This is the new visual direction. Next step is filling it with real widgets,
            alarms, maps, device cards and topology modules.
          </div>
        </div>
        <div className="hero-badge-wrap">
          <div className="hero-badge">ONLINE</div>
        </div>
      </div>

      <div className="card-grid">
        <div className="stat-card premium-stat-card">
          <div className="stat-label">Frontend Port</div>
          <div className="stat-value">4040</div>
          <div className="stat-sub">Dedicated service port</div>
        </div>

        <div className="stat-card premium-stat-card">
          <div className="stat-label">Layout Mode</div>
          <div className="stat-value">Adaptive</div>
          <div className="stat-sub">Desktop, tablet and mobile responsive</div>
        </div>

        <div className="stat-card premium-stat-card">
          <div className="stat-label">UI Status</div>
          <div className="stat-value">Phase 1</div>
          <div className="stat-sub">Premium redesign started</div>
        </div>
      </div>
    </div>
  )
}
