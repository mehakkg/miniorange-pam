// Audit & Compliance dashboard tab + End User Portal + Endpoint Security sub-portal

// ============ Audit & Compliance Tab (lives inside DashboardScreen) ============
const AuditComplianceView = () => {
  const [reportTab, setReportTab] = React.useState("recordings");
  const [showSchedule, setShowSchedule] = React.useState(false);

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <StatCard icon="people"      label="Active users"        value="142"  change="+8 this week"/>
        <StatCard icon="sessions"    label="Active sessions"     value="4"    change="3 SSH · 1 DB"/>
        <StatCard icon="file-text"   label="Recordings (7d)"     value="412"  change="8.4 GB · 100% retention"/>
        <StatCard icon="check-circle" label="Audit readiness"     value="92%" change="SOC 2 + PCI · 4 gaps"/>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16 }}>
        <div className="card">
          <div className="card-header"><span className="h-card">Resources accessed (last 14 days)</span><div style={{ flex: 1 }}/><span className="t-tiny">Across all types</span></div>
          <div style={{ padding: 20 }}><MiniBarChart/></div>
        </div>
        <div className="card">
          <div className="card-header"><span className="h-card">Executed commands</span><div style={{ flex: 1 }}/><span className="t-tiny">Last 24h</span></div>
          <div style={{ padding: 20, display: "flex", alignItems: "center", gap: 24 }}>
            <DonutChart success={87} fail={13}/>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
              <LegendRow color="var(--success)" label="Successful" value="2,347" pct="87%"/>
              <LegendRow color="var(--danger)"  label="Failed / blocked" value="351" pct="13%"/>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><span className="h-card">Top accessed resources</span></div>
        <table className="table">
          <thead><tr><th>Resource</th><th>Type</th><th>Sessions (30d)</th><th>Unique users</th><th>Avg duration</th><th>Recording</th></tr></thead>
          <tbody>
            {[
              { res: "prod-db-primary",        type: "PostgreSQL", count: 287, users: 12, dur: "23m" },
              { res: "auth-server-01",         type: "Linux",      count: 192, users: 8,  dur: "11m" },
              { res: "k8s-control-plane-aws",  type: "Kubernetes", count: 154, users: 6,  dur: "34m" },
            ].map((r, i) => (
              <tr key={i}>
                <td><span className="t-mono" style={{ color: "var(--fg-1)", fontWeight: 500 }}>{r.res}</span></td>
                <td><span className="badge">{r.type}</span></td>
                <td className="t-mono" style={{ color: "var(--fg-2)" }}>{r.count}</td>
                <td className="t-mono" style={{ color: "var(--fg-2)" }}>{r.users}</td>
                <td className="t-mono" style={{ color: "var(--fg-3)" }}>{r.dur}</td>
                <td><span className="badge badge-success"><Icon name="check" size={10}/> On</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Reports */}
      <div className="card">
        <div className="card-header">
          <span className="h-card">Reports</span>
          <div style={{ flex: 1 }}/>
          <button className="btn btn-sm" onClick={() => setShowSchedule(true)}><Icon name="clock" size={11}/> Schedule a report</button>
          <button className="btn btn-sm"><Icon name="download" size={11}/> Export bundle</button>
          <button className="btn btn-sm btn-primary"><Icon name="plus" size={11}/> New report</button>
        </div>
        <div style={{ padding: "8px 20px 0", borderBottom: "1px solid var(--border-subtle)", display: "flex", gap: 4 }}>
          {[
            { id: "recordings", label: "Session recordings" },
            { id: "standard",   label: "Standard reports" },
            { id: "scheduled",  label: "Scheduled reports", count: 4 },
            { id: "custom",     label: "Custom" },
          ].map(t => (
            <button key={t.id} onClick={() => setReportTab(t.id)} style={{
              padding: "8px 12px", marginBottom: -1, border: "none", background: "transparent",
              color: reportTab === t.id ? "var(--fg-1)" : "var(--fg-3)",
              font: "500 13px/1 var(--font-sans)",
              borderBottom: `2px solid ${reportTab === t.id ? "var(--brand)" : "transparent"}`,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
            }}>{t.label}{t.count && <span className="badge badge-brand" style={{ fontSize: 10 }}>{t.count}</span>}</button>
          ))}
        </div>
        {reportTab === "recordings"  && <RecordingsTable/>}
        {reportTab === "standard"    && <StandardReportsList/>}
        {reportTab === "scheduled"   && <ScheduledReportsList onNew={() => setShowSchedule(true)}/>}
        {reportTab === "custom"      && <CustomReportsList/>}
      </div>

      {showSchedule && <ScheduleReportModal onClose={() => setShowSchedule(false)}/>}
    </>
  );
};

const MiniBarChart = () => {
  const data = [42, 56, 38, 72, 64, 88, 76, 91, 67, 82, 79, 95, 88, 102];
  const max = Math.max(...data);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 140, paddingTop: 10 }}>
      {data.map((v, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <div style={{ width: "100%", height: `${(v/max)*100}%`, background: "var(--brand)", borderRadius: "3px 3px 0 0", opacity: 0.5 + (i/data.length)*0.5 }}/>
          <span className="t-tiny" style={{ color: "var(--fg-4)", fontSize: 10 }}>{i % 2 === 0 ? `D${i+1}` : ""}</span>
        </div>
      ))}
    </div>
  );
};

const DonutChart = ({ success, fail }) => {
  const r = 36, c = 2 * Math.PI * r;
  const successLen = (success/100) * c;
  return (
    <svg width="100" height="100" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r={r} fill="none" stroke="var(--bg-surface-2)" strokeWidth="14"/>
      <circle cx="50" cy="50" r={r} fill="none" stroke="var(--success)" strokeWidth="14"
        strokeDasharray={`${successLen} ${c}`} strokeDashoffset={c/4} transform="rotate(-90 50 50)"/>
      <text x="50" y="48" textAnchor="middle" fontSize="14" fontWeight="600" fill="var(--fg-1)">{success}%</text>
      <text x="50" y="62" textAnchor="middle" fontSize="9" fill="var(--fg-4)">success</text>
    </svg>
  );
};

const LegendRow = ({ color, label, value, pct }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
    <span style={{ width: 8, height: 8, borderRadius: 2, background: color, flex: "none" }}/>
    <span style={{ flex: 1, fontSize: 12.5, color: "var(--fg-2)" }}>{label}</span>
    <span className="t-mono" style={{ fontSize: 12, color: "var(--fg-3)" }}>{value}</span>
    <span className="t-mono" style={{ fontSize: 12, color: "var(--fg-1)", fontWeight: 600, width: 36, textAlign: "right" }}>{pct}</span>
  </div>
);

const RecordingsTable = () => (
  <table className="table">
    <thead><tr><th>Session</th><th>User</th><th>Resource</th><th>Started</th><th>Duration</th><th>Size</th><th>Tags</th><th></th></tr></thead>
    <tbody>
      {SEED_SESSIONS.filter(s => s.status === "ended").concat([
        { id: "SES-87432", user: "Olivia Brookes", resource: "auth-server-01", duration: "18m 40s", started: "Yesterday 14:22" },
        { id: "SES-87311", user: "Marcus Chen", resource: "prod-db-primary", duration: "1h 12m", started: "2 days ago" },
      ]).map((s, i) => (
        <tr key={i}>
          <td><span className="t-mono t-tiny">{s.id}</span></td>
          <td><div className="row"><Avatar name={s.user} size={20}/><span style={{ color: "var(--fg-1)", fontWeight: 500 }}>{s.user}</span></div></td>
          <td><span className="t-mono">{s.resource}</span></td>
          <td className="t-tiny" style={{ color: "var(--fg-3)" }}>{s.started}</td>
          <td className="t-mono">{s.duration}</td>
          <td className="t-mono t-tiny" style={{ color: "var(--fg-3)" }}>{(Math.random()*40+5).toFixed(1)} MB</td>
          <td>{i % 3 === 0 && <span className="badge badge-warning">flagged</span>}</td>
          <td style={{ textAlign: "right" }}>
            <button className="btn btn-ghost btn-sm"><Icon name="play" size={11}/> Replay</button>
            <button className="btn btn-ghost btn-sm btn-icon"><Icon name="download" size={12}/></button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

const StandardReportsList = () => (
  <div style={{ padding: 16, display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
    {[
      { name: "Server Access Report",       desc: "Who accessed which server, when, and for how long",                 size: "PDF · CSV · 12 fields" },
      { name: "Password Rotation Report",   desc: "Rotation history, success/failure rate, age distribution",          size: "PDF · CSV · 9 fields" },
      { name: "Privileged Account Inventory", desc: "All admin, service, and break-glass accounts across resources",   size: "CSV · XLSX · 14 fields" },
      { name: "Session Recording Index",    desc: "Recordings with metadata, retention status, and integrity hashes",  size: "JSON · CSV · 11 fields" },
      { name: "Approval Audit Trail",       desc: "All JIT requests, approvers, decisions, and SLA performance",       size: "PDF · CSV · 10 fields" },
      { name: "Break-glass Events",         desc: "Emergency access events with justifications and post-incident reviews", size: "PDF · 8 fields" },
    ].map((r, i) => (
      <div key={i} style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 14, display: "flex", flexDirection: "column", gap: 6, background: "var(--bg-surface)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Icon name="file-text" size={14} color="var(--brand-fg)"/>
          <span style={{ font: "600 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{r.name}</span>
        </div>
        <p style={{ margin: 0, fontSize: 12, color: "var(--fg-3)" }}>{r.desc}</p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
          <span className="t-tiny" style={{ color: "var(--fg-4)" }}>{r.size}</span>
          <div style={{ display: "flex", gap: 6 }}>
            <button className="btn btn-sm btn-ghost"><Icon name="play" size={11}/> Run now</button>
            <button className="btn btn-sm"><Icon name="download" size={11}/> Export</button>
          </div>
        </div>
      </div>
    ))}
  </div>
);

const ScheduledReportsList = ({ onNew }) => (
  <table className="table">
    <thead><tr><th>Report</th><th>Frequency</th><th>Recipients</th><th>Format</th><th>Last run</th><th>Next run</th><th>Status</th><th></th></tr></thead>
    <tbody>
      {[
        { name: "Weekly SOC 2 Evidence",      freq: "Every Monday 06:00",  rec: "compliance@northwind.com, +2", fmt: "PDF + CSV", last: "3 days ago",  next: "in 4d 6h",  ok: true },
        { name: "Daily Privileged Sessions",  freq: "Daily 23:55",          rec: "security-leads",                fmt: "CSV",        last: "Today",        next: "in 6h",     ok: true },
        { name: "Monthly PCI Report",         freq: "1st of month",         rec: "auditors@northwind.com",        fmt: "PDF",        last: "5 days ago",  next: "in 25 days", ok: true },
        { name: "Quarterly Access Review",    freq: "1st of quarter 09:00", rec: "managers, security-team",       fmt: "XLSX",       last: "Apr 1",       next: "Jul 1",     ok: false, err: "Last run failed: SMTP timeout" },
      ].map((r, i) => (
        <tr key={i}>
          <td><div><div style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{r.name}</div></div></td>
          <td className="t-tiny" style={{ color: "var(--fg-3)" }}>{r.freq}</td>
          <td className="t-tiny" style={{ color: "var(--fg-3)" }}>{r.rec}</td>
          <td><span className="badge">{r.fmt}</span></td>
          <td className="t-tiny" style={{ color: "var(--fg-3)" }}>{r.last}</td>
          <td className="t-tiny" style={{ color: "var(--fg-2)" }}>{r.next}</td>
          <td>{r.ok ? <span className="badge badge-success">Active</span> : <span className="badge badge-danger" title={r.err}>Failed</span>}</td>
          <td style={{ textAlign: "right" }}>
            <button className="btn btn-ghost btn-sm">Run now</button>
            <button className="btn btn-ghost btn-sm btn-icon"><Icon name="more-h" size={13}/></button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

const CustomReportsList = () => (
  <div style={{ padding: 16 }}>
    <EmptyState icon="file-text" title="No custom reports yet"
      description="Build a custom report by combining session, credential, ticket, and policy data with your own filters."
      action={<button className="btn btn-primary"><Icon name="plus" size={13}/> Create custom report</button>}/>
  </div>
);

const ScheduleReportModal = ({ onClose }) => {
  const [name, setName]       = React.useState("Weekly Privileged Access Summary");
  const [type, setType]       = React.useState("Server Access Report");
  const [freq, setFreq]       = React.useState("weekly");
  const [day, setDay]         = React.useState("Monday");
  const [time, setTime]       = React.useState("06:00");
  const [format, setFormat]   = React.useState(new Set(["PDF","CSV"]));
  const [recipients, setRec]  = React.useState("compliance@northwind.com, security@northwind.com");
  const toggleFormat = f => setFormat(s => { const n = new Set(s); n.has(f) ? n.delete(f) : n.add(f); return n; });

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="card" style={{
        width: 560, maxHeight: "85vh", overflow: "auto",
        background: "var(--bg-surface)", border: "1px solid var(--border)",
        borderRadius: 10, boxShadow: "var(--shadow-lg)",
      }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
          <Icon name="clock" size={16} color="var(--brand-fg)"/>
          <span style={{ font: "600 15px/1 var(--font-sans)", color: "var(--fg-1)", flex: 1 }}>Schedule a report</span>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><Icon name="x" size={14}/></button>
        </div>
        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="field"><label className="field-label">Schedule name</label><input className="input" value={name} onChange={e => setName(e.target.value)}/></div>
          <div className="field"><label className="field-label">Report type</label>
            <select className="input" value={type} onChange={e => setType(e.target.value)}>
              {["Server Access Report","Password Rotation Report","Privileged Account Inventory","Session Recording Index","Approval Audit Trail","Break-glass Events","Custom Report"].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <div className="field"><label className="field-label">Frequency</label>
              <select className="input" value={freq} onChange={e => setFreq(e.target.value)}>
                <option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option>
              </select>
            </div>
            {freq === "weekly" && <div className="field"><label className="field-label">Day</label>
              <select className="input" value={day} onChange={e => setDay(e.target.value)}>
                {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map(d => <option key={d}>{d}</option>)}
              </select>
            </div>}
            {freq === "monthly" && <div className="field"><label className="field-label">Day of month</label>
              <input className="input" value="1"/></div>}
            <div className="field"><label className="field-label">Time</label><input className="input" type="time" value={time} onChange={e => setTime(e.target.value)}/></div>
          </div>
          <div className="field"><label className="field-label">Format</label>
            <div style={{ display: "flex", gap: 8 }}>
              {["PDF","CSV","XLSX","JSON"].map(f => (
                <button key={f} type="button" onClick={() => toggleFormat(f)} className="btn btn-sm" style={{
                  background: format.has(f) ? "var(--brand-soft)" : "var(--bg-surface)",
                  color: format.has(f) ? "var(--brand-fg)" : "var(--fg-2)",
                  borderColor: format.has(f) ? "transparent" : "var(--border)",
                }}>{f}</button>
              ))}
            </div>
          </div>
          <div className="field"><label className="field-label">Recipients</label><input className="input" value={recipients} onChange={e => setRec(e.target.value)} placeholder="comma-separated emails"/><span className="field-help">Reports are also archived in the Reports tab.</span></div>
        </div>
        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={onClose}><Icon name="check" size={12}/> Schedule report</button>
        </div>
      </div>
    </div>
  );
};

window.AuditComplianceView = AuditComplianceView;
