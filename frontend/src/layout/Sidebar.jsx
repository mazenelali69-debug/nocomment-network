import React from "react"
import { NavLink } from "react-router-dom"

function linkClass({ isActive }) {
  return isActive ? "nav-link active" : "nav-link"
}

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  return (
    <>
      <div
        className={mobileOpen ? "mobile-overlay show" : "mobile-overlay"}
        onClick={() => setMobileOpen(false)}
      />

      <aside className={mobileOpen ? "sidebar mobile-open premium-sidebar" : "sidebar premium-sidebar"}>
        <div className="brand-box premium-brand-box sidebar-brand">
          <div className="brand-mark wifi-mark">◉</div>
          <div>
            <div className="brand-title">NoCommentISP</div>
            <div className="brand-subtitle">Secure console access</div>
          </div>
        </div>

        <nav className="nav-list">
          <NavLink to="/dashboard" className={linkClass} onClick={() => setMobileOpen(false)}>
            Dashboard
          </NavLink>

          <NavLink to="/aviat" className={linkClass} onClick={() => setMobileOpen(false)}>
            Aviat WTM4200
          </NavLink>

          <NavLink to="/jetstream" className={linkClass} onClick={() => setMobileOpen(false)}>
            TP-Link JetStream
          </NavLink>

          <NavLink to="/mikrotik" className={linkClass} onClick={() => setMobileOpen(false)}>
            Mikrotik
          </NavLink>
        </nav>

        <div className="sidebar-footer premium-sidebar-footer">
          <div className="status-dot"></div>
          <span>Core UI Online</span>
        </div>
      </aside>
    </>
  )
}
