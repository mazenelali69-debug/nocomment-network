import React, { useEffect, useState } from "react"

const API_URL = "/api/aviat/status"

function fmtMbps(v) {
  return Number.isFinite(v) ? `${v.toFixed(2)} Mbps` : "--"
}

function fmtPct(v) {
  return Number.isFinite(v) ? `${v.toFixed(2)}%` : "--"
}

function sevKey(util) {
  if (!Number.isFinite(util)) return "normal"
  if (util >= 85) return "high"
  if (util >= 60) return "medium"
  return "normal"
}

function sevLabel(util) {
  const s = sevKey(util)
  if (s === "high") return "HIGH"
  if (s === "medium") return "WARN"
  return "NORMAL"
}

function totalOf(cards) {
  return ["uplink", "switchA", "switchB"].reduce((a, k) => a + Number(cards?.[k]?.totalMbps || 0), 0)
}

function maxUtil(cards) {
  return Math.max(
    Number(cards?.uplink?.utilizationPct || 0),
    Number(cards?.switchA?.utilizationPct || 0),
    Number(cards?.switchB?.utilizationPct || 0)
  )
}

function LinkCard({ title, side, data }) {
  if (!data) {
    return (
      <div className="aviat-compact-card">
        <div className="aviat-compact-head">
          <div>
            <div className="aviat-compact-kicker">{side}</div>
            <div className="aviat-compact-title">{title}</div>
          </div>
          <div className="aviat-pill crit">NO DATA</div>
        </div>
      </div>
    )
  }

  const sev = sevKey(data.utilizationPct)

  return (
    <div className={`aviat-compact-card ${sev}`}>
      <div className="aviat-compact-head">
        <div>
          <div className="aviat-compact-kicker">{side}</div>
          <div className="aviat-compact-title">{title}</div>
          <div className="aviat-compact-sub">{data.ifName} • ifIndex {data.ifIndex}</div>
        </div>

        <div className="aviat-compact-badges">
          <div className="aviat-pill ok">{data.status}</div>
          <div className={`aviat-pill ${sev}`}>{sevLabel(data.utilizationPct)}</div>
        </div>
      </div>

      <div className="aviat-compact-main-number">{fmtMbps(data.totalMbps)}</div>
      <div className="aviat-compact-main-caption">TOTAL</div>

      <div className="aviat-compact-metrics">
        <div><span>RX</span><strong>{fmtMbps(data.rxMbps)}</strong></div>
        <div><span>TX</span><strong>{fmtMbps(data.txMbps)}</strong></div>
        <div><span>UTIL</span><strong>{fmtPct(data.utilizationPct)}</strong></div>
        <div><span>CAP</span><strong>{data.capacityMbps} Mbps</strong></div>
      </div>

      <div className="aviat-compact-bar-shell">
        <div className={`aviat-compact-bar ${sev}`} style={{ width: `${Math.max(0, Math.min(100, data.utilizationPct || 0))}%` }} />
      </div>
    </div>
  )
}

function Topology({ cards }) {
  const u = cards?.uplink
  const a = cards?.switchA
  const b = cards?.switchB

  const su = sevKey(u?.utilizationPct)
  const sa = sevKey(a?.utilizationPct)
  const sb = sevKey(b?.utilizationPct)

  return (
    <div className="aviat-beast-topology">
      <div className="aviat-beast-head">
        <div>
          <div className="aviat-beast-kicker">TOPOLOGY</div>
          <div className="aviat-beast-title">Aviat Distribution</div>
        </div>
        <div className="aviat-beast-legend">
          <span className="aviat-dot blue"></span><span>Normal</span>
          <span className="aviat-dot amber"></span><span>Warn</span>
          <span className="aviat-dot red"></span><span>High</span>
        </div>
      </div>

      <div className="aviat-beast-canvas">
        <div className="aviat-grid"></div>

        <div className="aviat-node beast internet">
          <div className="n-k">UPSTREAM</div>
          <div className="n-t">INTERNET</div>
        </div>

        <div className={`aviat-line vertical ${su}`}>
          <span className="p p1"></span><span className="p p2"></span><span className="p p3"></span>
        </div>

        <div className={`aviat-node beast radio ${su}`}>
          <div className="n-k">RADIO CORE</div>
          <div className="n-t">RADIO1</div>
          <div className="n-v">{fmtMbps(u?.totalMbps)}</div>
          <div className="n-s">{fmtPct(u?.utilizationPct)}</div>
        </div>

        <div className={`aviat-line left ${sa}`}>
          <span className="p p1"></span><span className="p p2"></span><span className="p p3"></span>
        </div>

        <div className={`aviat-line right ${sb}`}>
          <span className="p p1"></span><span className="p p2"></span><span className="p p3"></span>
        </div>

        <div className={`aviat-node beast swa ${sa}`}>
          <div className="n-k">EDGE A</div>
          <div className="n-t">SWITCH A</div>
          <div className="n-v">{fmtMbps(a?.totalMbps)}</div>
          <div className="n-s">{fmtPct(a?.utilizationPct)}</div>
        </div>

        <div className={`aviat-node beast swb ${sb}`}>
          <div className="n-k">EDGE B</div>
          <div className="n-t">SWITCH B</div>
          <div className="n-v">{fmtMbps(b?.totalMbps)}</div>
          <div className="n-s">{fmtPct(b?.utilizationPct)}</div>
        </div>
      </div>
    </div>
  )
}

export default function AviatPage() {
  const [payload, setPayload] = useState(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

  async function load() {
    try {
      const res = await fetch(API_URL, { cache: "no-store" })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error || "Aviat API error")
      setPayload(json)
      setError("")
    } catch (err) {
      setError(err.message || "Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const t = setInterval(load, 3000)
    return () => clearInterval(t)
  }, [])

  const cards = payload?.cards || {}
  const total = totalOf(cards)
  const peak = maxUtil(cards)
  const overall = sevKey(peak)

  return (
    <div className="aviat-beast-page">
      <div className="aviat-beast-master">
        <div className="aviat-beast-master-left">
          <div className="aviat-beast-eyebrow">AVIAT WTM4200 • LIVE OPERATIONS</div>
          <div className="aviat-beast-big">Aviat Radio Link Monitor</div>
          <div className="aviat-beast-sub">
            Device {payload?.deviceIp || "--"} • Poll {payload?.pollSeconds || 3}s • Tick {payload?.tick ?? "--"}
          </div>
        </div>

        <div className="aviat-beast-master-right">
          <div className="aviat-master-box">
            <span>TOTAL</span>
            <strong>{fmtMbps(total)}</strong>
          </div>
          <div className="aviat-master-box">
            <span>PEAK UTIL</span>
            <strong>{fmtPct(peak)}</strong>
          </div>
          <div className={`aviat-master-box status ${overall}`}>
            <span>STATE</span>
            <strong>{error ? "API ISSUE" : sevLabel(peak)}</strong>
          </div>
        </div>
      </div>

      <Topology cards={cards} />

      <div className="aviat-compact-grid">
        <LinkCard title="Radio1 Uplink" side="RADIO CORE" data={cards.uplink} />
        <LinkCard title="Switch A" side="EDGE PATH A" data={cards.switchA} />
        <LinkCard title="Switch B" side="EDGE PATH B" data={cards.switchB} />
      </div>

      <div className="aviat-bottom-mini">
        <div className="aviat-pill soft">Device: {payload?.deviceIp || "--"}</div>
        <div className="aviat-pill soft">Tick: {payload?.tick ?? "--"}</div>
        <div className="aviat-pill soft">Poll: {payload?.pollSeconds || 3}s</div>
        {loading ? <div className="aviat-pill warn">LOADING</div> : null}
        {error ? <div className="aviat-pill crit">{error}</div> : <div className="aviat-pill ok">LIVE</div>}
      </div>
    </div>
  )
}
