import React, { useState } from "react"
import Sidebar from "./Sidebar"

export default function AppShell({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="app-shell premium-app-shell">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      <div className="app-main">
        <div className="topbar premium-topbar">
          <button className="mobile-menu-btn" onClick={() => setMobileOpen(!mobileOpen)}>
            ☰
          </button>

          <div>
            <div className="topbar-title">NoComment ISP</div>
            <div className="topbar-subtitle">Enterprise network operations console</div>
          </div>

          <div className="topbar-right-badge">
            <span className="status-live-dot"></span>
            <span>Core Online</span>
          </div>
        </div>

        <div className="page-content">{children}</div>
      </div>
    </div>
  )
}
