// Policies, Access Allocation, Tickets, Discovery, Sessions, etc.

// ============ Policies ============
const PoliciesScreen = ({ empty }) => {
  const [q, setQ] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState("all");
  let rows = empty ? [] : SEED_POLICIES;
  if (typeFilter !== "all") rows = rows.filter(p => p.type.toLowerCase() === typeFilter);
  rows = useFiltered(rows, q, ["name","type"]);
  const types = ["all", ...new Set(SEED_POLICIES.map(p => p.type.toLowerCase()))];
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <PageHeader title="Policies" description="Unified policy library — SSH, RDP, database, web, password, and rotation rules in one place. Type is now a filter, not a separate page."
        actions={<><button className="btn"><Icon name="copy" size={13}/> Duplicate from template</button><button className="btn btn-primary"><Icon name="plus" size={13}/> New policy</button></>}/>
      <div style={{ padding: "12px 24px 0", borderBottom: "1px solid var(--border)", display: "flex", gap: 4, flexWrap: "wrap" }}>
        {types.map(t => (
          <button key={t} onClick={() => setTypeFilter(t)} style={{
            padding: "6px 12px", marginBottom: -1, border: "none", background: "transparent",
            color: typeFilter === t ? "var(--fg-1)" : "var(--fg-3)",
            font: "500 13px/1 var(--font-sans)", textTransform: "capitalize",
            borderBottom: `2px solid ${typeFilter === t ? "var(--brand)" : "transparent"}`,
            cursor: "pointer",
          }}>{t === "all" ? "All" : t.toUpperCase()}</button>
        ))}
      </div>
      <ListToolbar search={q} onSearch={setQ} filterLabels={["Recording","JIT","Approval"]}/>
      <div className="scroll-area" style={{ flex: 1, overflow: "auto" }}>
        {rows.length === 0 ? (
          <EmptyState icon="policies" title="No policies yet" description="Policies define when, how, and under what conditions privileged access is allowed. Start with a template."
            action={<button className="btn btn-primary"><Icon name="plus" size={13}/> New policy</button>}/>
        ) : (
          <table className="table">
            <thead><tr><th>Policy</th><th>Type</th><th>Scope</th><th>Recording</th><th>JIT</th><th>Approval</th><th>Updated</th><th></th></tr></thead>
            <tbody>
              {rows.map(p => (
                <tr key={p.id}>
                  <td><div><div style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{p.name}</div><div className="t-mono t-tiny" style={{ color: "var(--fg-4)" }}>{p.id}</div></div></td>
                  <td><span className="badge badge-brand">{p.type}</span></td>
                  <td style={{ color: "var(--fg-2)" }}>{p.scope}</td>
                  <td>{p.recording ? <span className="badge badge-success"><Icon name="check" size={10}/> On</span> : <span className="badge">Off</span>}</td>
                  <td>{p.jit ? <span className="badge badge-brand">Required</span> : <span style={{ color: "var(--fg-4)" }}>—</span>}</td>
                  <td style={{ color: p.approval === "Break-glass" ? "var(--danger-fg)" : "var(--fg-2)" }}>{p.approval}</td>
                  <td className="t-tiny" style={{ color: "var(--fg-3)" }}>{p.updated}</td>
                  <td style={{ textAlign: "right" }}><button className="btn btn-ghost btn-sm btn-icon"><Icon name="more-h" size={14}/></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

// ============ Access Allocation ============
const AllocationScreen = ({ empty }) => {
  const allocations = empty ? [] : [
    { resource: "prod-db-primary", subject: "devops", subjectType: "Group", credential: "postgres-prod-su", policy: "Production Database", window: "Mon–Fri 09:00–19:00", expires: "—", inherited: false },
    { resource: "prod-db-primary", subject: "Marcus Chen", subjectType: "User", credential: "postgres-prod-su", policy: "Production Database (JIT)", window: "Anytime", expires: "in 2h · TKT-2104", inherited: false },
    { resource: "auth-server-01", subject: "sec-admins", subjectType: "Group", credential: "auth01-root", policy: "Production SSH Access", window: "Anytime", expires: "—", inherited: false },
    { resource: "ledger-mongo-cluster", subject: "Priya Iyer", subjectType: "User", credential: "ledger-mongo-admin", policy: "Emergency SSH Override", window: "Anytime", expires: "in 3h 42m · Break-glass", inherited: false },
    { resource: "k8s-control-plane-aws", subject: "devops", subjectType: "Group", credential: "k8s-cluster-admin", policy: "Production SSH Access", window: "Anytime", expires: "—", inherited: false },
    { resource: "data-warehouse-bastion", subject: "on-call", subjectType: "Group", credential: "bastion-jumpkey", policy: "Linux Server Admin", window: "Anytime", expires: "—", inherited: true },
  ];
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <PageHeader title="Access allocation" description="Who can access what, with which credential, under which policy, and for how long. The unified mapping layer."
        actions={<><button className="btn"><Icon name="download" size={13}/> Export matrix</button><button className="btn btn-primary"><Icon name="plus" size={13}/> Allocate access</button></>}/>
      <ListToolbar search="" onSearch={() => {}} filterLabels={["Resource","Subject","Policy","Window"]}/>
      <div className="scroll-area" style={{ flex: 1, overflow: "auto" }}>
        {allocations.length === 0 ? (
          <EmptyState icon="allocation" title="No access allocated" description="Connect resources, credentials, and people. PAM enforces the resulting access window automatically."
            action={<button className="btn btn-primary"><Icon name="plus" size={13}/> Allocate access</button>}/>
        ) : (
          <table className="table">
            <thead><tr><th>Resource</th><th>Subject</th><th>Credential</th><th>Policy</th><th>Window</th><th>Expires</th><th></th></tr></thead>
            <tbody>{allocations.map((a, i) => (
              <tr key={i}>
                <td><span className="t-mono" style={{ color: "var(--fg-1)", fontWeight: 500 }}>{a.resource}</span></td>
                <td><div className="row">{a.subjectType === "User" ? <Avatar name={a.subject} size={20}/> : <Icon name="people" size={13} color="var(--fg-3)"/>}<span style={{ color: "var(--fg-1)", fontWeight: 500 }}>{a.subject}</span><span className="badge">{a.subjectType}</span>{a.inherited && <span className="t-tiny" style={{ color: "var(--fg-4)" }}>inherited</span>}</div></td>
                <td className="t-mono t-tiny" style={{ color: "var(--fg-2)" }}>{a.credential}</td>
                <td style={{ color: "var(--fg-2)" }}>{a.policy}</td>
                <td className="t-tiny" style={{ color: "var(--fg-3)" }}>{a.window}</td>
                <td><span className="t-tiny" style={{ color: a.expires.includes("Break-glass") ? "var(--danger-fg)" : a.expires.includes("h") ? "var(--warning-fg)" : "var(--fg-4)", fontWeight: 500 }}>{a.expires}</span></td>
                <td style={{ textAlign: "right" }}><button className="btn btn-ghost btn-sm btn-icon"><Icon name="more-h" size={14}/></button></td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  );
};

// ============ Tickets & Approvals ============
const TicketsScreen = ({ empty }) => {
  const [tab, setTab] = React.useState("queue");
  const [selected, setSelected] = React.useState(null);
  const rows = empty ? [] : SEED_TICKETS;
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <PageHeader title="Tickets & approvals" description="JIT requests, access tickets, and break-glass events — with multi-level approvals and abnormal-pattern flagging."
        actions={<><button className="btn"><Icon name="fire" size={13} color="var(--danger-fg)"/> Break-glass</button><button className="btn btn-primary"><Icon name="plus" size={13}/> Request access</button></>}/>
      <div style={{ padding: "12px 24px 0", borderBottom: "1px solid var(--border)", display: "flex", gap: 4 }}>
        {[
          { id: "queue",    label: "Pending", count: rows.filter(t => t.status === "pending").length },
          { id: "approved", label: "Approved" },
          { id: "denied",   label: "Denied" },
          { id: "all",      label: "All" },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "8px 14px", marginBottom: -1, border: "none", background: "transparent",
            color: tab === t.id ? "var(--fg-1)" : "var(--fg-3)",
            font: "500 13px/1 var(--font-sans)",
            borderBottom: `2px solid ${tab === t.id ? "var(--brand)" : "transparent"}`,
            cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
          }}>{t.label}{t.count != null && <span className="badge badge-brand">{t.count}</span>}</button>
        ))}
      </div>
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <div style={{ flex: selected ? "0 0 480px" : 1, overflow: "auto", borderRight: selected ? "1px solid var(--border)" : "none" }}>
          {rows.length === 0 ? (
            <EmptyState icon="tickets" title="No tickets" description="JIT requests, break-glass events, and access tickets will appear here."
              action={<button className="btn btn-primary"><Icon name="plus" size={13}/> Request access</button>}/>
          ) : (
            <table className="table">
              <thead><tr><th>Ticket</th><th>Type</th><th>Requester</th><th>Resource</th><th>Duration</th><th>Status</th><th>SLA</th></tr></thead>
              <tbody>{rows.filter(t => tab === "all" || t.status === tab).map(t => (
                <tr key={t.id} className={selected === t.id ? "selected" : ""} onClick={() => setSelected(t.id)} style={{ cursor: "pointer" }}>
                  <td><div className="row"><span className="t-mono t-tiny" style={{ color: "var(--fg-3)" }}>{t.id}</span>{t.flagged && <Icon name="fire" size={12} color="var(--warning-fg)"/>}</div></td>
                  <td><span className="badge" style={{ background: t.type === "Break-glass" ? "var(--danger-soft)" : t.type === "JIT request" ? "var(--brand-soft)" : "var(--bg-surface-2)", color: t.type === "Break-glass" ? "var(--danger-fg)" : t.type === "JIT request" ? "var(--brand-fg)" : "var(--fg-2)", borderColor: "transparent" }}>{t.type}</span></td>
                  <td><div className="row"><Avatar name={t.requester} size={20}/><span style={{ color: "var(--fg-1)", fontWeight: 500 }}>{t.requester}</span></div></td>
                  <td className="t-mono t-tiny" style={{ color: "var(--fg-2)" }}>{t.resource}</td>
                  <td className="t-tiny" style={{ color: "var(--fg-3)" }}>{t.duration}</td>
                  <td>
                    {t.status === "pending" && <span className="badge badge-warning">Pending</span>}
                    {t.status === "approved" && <span className="badge badge-success">Approved</span>}
                    {t.status === "denied" && <span className="badge badge-danger">Denied</span>}
                  </td>
                  <td className="t-tiny" style={{ color: t.sla.includes("min") ? "var(--danger-fg)" : "var(--fg-3)", fontWeight: 500 }}>{t.sla}</td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>
        {selected && <TicketDetailPane ticket={rows.find(t => t.id === selected)} onClose={() => setSelected(null)}/>}
      </div>
    </div>
  );
};

const TicketDetailPane = ({ ticket, onClose }) => {
  const [duration, setDuration] = React.useState(ticket.duration);
  return (
    <div style={{ flex: 1, overflow: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div className="row"><span className="t-mono t-tiny" style={{ color: "var(--fg-4)" }}>{ticket.id}</span><span className="badge" style={{ background: ticket.type === "Break-glass" ? "var(--danger-soft)" : "var(--brand-soft)", color: ticket.type === "Break-glass" ? "var(--danger-fg)" : "var(--brand-fg)", borderColor: "transparent" }}>{ticket.type}</span></div>
          <h2 className="h-title" style={{ marginTop: 4 }}>{ticket.requester} requests access to {ticket.resource}</h2>
        </div>
        <button className="btn btn-ghost btn-icon" onClick={onClose}><Icon name="x" size={14}/></button>
      </div>

      {ticket.flagged && (
        <div style={{ padding: 12, background: "var(--warning-soft)", color: "var(--warning-fg)", borderRadius: 6, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <Icon name="fire" size={16}/>
          <div><div style={{ font: "600 13px/1.3 var(--font-sans)" }}>Abnormal pattern flagged</div><div style={{ fontSize: 12.5, marginTop: 2 }}>5 critical-resource requests from this user in the last 30 minutes — 3× the 30-day average.</div></div>
        </div>
      )}

      <div className="card">
        <div className="card-header"><span className="h-card">Justification</span></div>
        <div style={{ padding: 20, fontSize: 13.5, color: "var(--fg-2)", lineHeight: 1.6 }}>{ticket.reason}</div>
      </div>

      <div className="card">
        <div className="card-header"><span className="h-card">Approval</span></div>
        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="field">
            <label className="field-label">Granted duration</label>
            <div className="row">
              {["30m","1h","2h","4h","8h"].map(d => (
                <button key={d} onClick={() => setDuration(d)} className="btn btn-sm" style={{
                  background: duration === d ? "var(--brand-soft)" : "var(--bg-surface)",
                  color: duration === d ? "var(--brand-fg)" : "var(--fg-2)",
                  borderColor: duration === d ? "transparent" : "var(--border)",
                }}>{d}</button>
              ))}
            </div>
            <span className="field-help">Original request: {ticket.duration}. Admin can shorten before approving.</span>
          </div>
          <div className="field">
            <label className="field-label">Approval chain</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { name: "Manager: Hiroshi Tanaka", state: "approved", time: "12:43" },
                { name: "Security: You", state: "pending", time: null },
              ].map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: 10, border: "1px solid var(--border)", borderRadius: 6 }}>
                  <Icon name={s.state === "approved" ? "check-circle" : "clock"} size={16} color={s.state === "approved" ? "var(--success)" : "var(--warning-fg)"}/>
                  <span style={{ flex: 1, font: "500 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{s.name}</span>
                  <span className="t-tiny" style={{ color: "var(--fg-4)" }}>{s.time || "Awaiting"}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="row">
            <button className="btn btn-primary" style={{ flex: 1 }}><Icon name="check" size={13}/> Approve {duration}</button>
            <button className="btn" style={{ flex: 1 }}>Modify</button>
            <button className="btn btn-danger" style={{ flex: 1 }}>Deny</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============ Discovery & Triage ============
const DiscoveryScreen = ({ empty }) => {
  const [scanning, setScanning] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [selected, setSelected] = React.useState(new Set());
  const rows = empty ? [] : SEED_DISCOVERY;
  const startScan = () => {
    setScanning(true); setProgress(0);
    const iv = setInterval(() => {
      setProgress(p => { const n = p + 12 + Math.random()*10; if (n >= 100) { clearInterval(iv); setScanning(false); return 100; } return n; });
    }, 250);
  };
  const toggle = id => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <PageHeader title="Discovery & triage" description="Find unmanaged accounts on your infrastructure. Score by criticality, bulk-onboard, hand off to the vault."
        actions={<><button className="btn"><Icon name="cloud" size={13}/> Cloud scan</button><button className="btn btn-primary" onClick={startScan} disabled={scanning}>{scanning ? <><Spinner size={13} color="#fff"/> Scanning…</> : <><Icon name="discovery" size={13}/> New network scan</>}</button></>}/>
      {scanning && (
        <div style={{ padding: "12px 24px", borderBottom: "1px solid var(--border)", background: "var(--brand-soft)" }}>
          <div className="row"><Spinner size={14} color="var(--brand)"/><span style={{ flex: 1, fontSize: 13, color: "var(--fg-1)", fontWeight: 500 }}>Scanning 10.42.0.0/16 — {Math.round(progress)}% complete</span><span className="t-tiny" style={{ color: "var(--fg-3)" }}>{Math.floor(progress/3)} hosts found</span></div>
          <div style={{ height: 4, marginTop: 8, background: "rgba(255,255,255,0.6)", borderRadius: 9999, overflow: "hidden" }}><div style={{ height: "100%", width: `${progress}%`, background: "var(--brand)", transition: "width 200ms" }}/></div>
        </div>
      )}
      <ListToolbar search="" onSearch={() => {}} filterLabels={["Type","Criticality","Flag"]}
        rightExtras={selected.size > 0 && <><span className="t-tiny">{selected.size} selected</span><button className="btn btn-sm btn-primary"><Icon name="arrow-right" size={11}/> Onboard selected</button></>}/>
      <div className="scroll-area" style={{ flex: 1, overflow: "auto" }}>
        {rows.length === 0 ? (
          <EmptyState icon="discovery" title="Nothing discovered yet" description="Run a network scan to find unmanaged privileged accounts on your infrastructure."
            action={<button className="btn btn-primary" onClick={startScan}><Icon name="discovery" size={13}/> Start a network scan</button>}/>
        ) : (
          <table className="table">
            <thead><tr><th style={{ width: 32 }}><input type="checkbox" style={{ accentColor: "var(--brand)" }}/></th><th>Host</th><th>Type</th><th>Accounts</th><th>Flags</th><th>Criticality</th><th>Discovered</th><th></th></tr></thead>
            <tbody>{rows.map(d => (
              <tr key={d.id}>
                <td><input type="checkbox" checked={selected.has(d.id)} onChange={() => toggle(d.id)} style={{ accentColor: "var(--brand)" }}/></td>
                <td><div><div style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{d.hostname}</div><div className="t-mono t-tiny" style={{ color: "var(--fg-4)" }}>{d.host}</div></div></td>
                <td><div className="row"><ResourceTypeIcon type={d.type} size={22}/><span style={{ textTransform: "capitalize", fontSize: 12.5 }}>{d.type}</span></div></td>
                <td style={{ color: "var(--fg-2)" }}>{d.accounts}</td>
                <td><div className="row" style={{ flexWrap: "wrap", gap: 4 }}>{d.flags.map(f => <span key={f} className="badge" style={{ background: f === "root-key" || f === "privileged" ? "var(--danger-soft)" : "var(--warning-soft)", color: f === "root-key" || f === "privileged" ? "var(--danger-fg)" : "var(--warning-fg)", borderColor: "transparent" }}>{f}</span>)}{d.flags.length === 0 && <span style={{ color: "var(--fg-4)" }}>—</span>}</div></td>
                <td><div className="row"><div style={{ width: 48, height: 6, borderRadius: 9999, background: "var(--bg-surface-2)", overflow: "hidden" }}><div style={{ height: "100%", width: `${d.criticality}%`, background: d.criticality > 80 ? "var(--danger)" : d.criticality > 60 ? "var(--warning)" : "var(--success)" }}/></div><span className="t-mono t-tiny" style={{ color: d.criticality > 80 ? "var(--danger-fg)" : "var(--fg-2)", fontWeight: 500 }}>{d.criticality}</span></div></td>
                <td className="t-tiny" style={{ color: "var(--fg-3)" }}>{d.scanned}</td>
                <td style={{ textAlign: "right" }}><button className="btn btn-sm">Onboard</button></td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  );
};

// ============ Sessions & Monitoring ============
const SessionsScreen = ({ empty }) => {
  const [tab, setTab] = React.useState("live");
  const rows = empty ? [] : SEED_SESSIONS;
  const live = rows.filter(s => s.status === "active");
  const recorded = rows.filter(s => s.status === "ended");
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <PageHeader title="Sessions & monitoring" description="Live and recorded privileged sessions. All proxied — no raw passwords ever shown to users."
        actions={<><button className="btn"><Icon name="download" size={13}/> Export evidence bundle</button></>}/>
      <div style={{ padding: "12px 24px 0", borderBottom: "1px solid var(--border)", display: "flex", gap: 4 }}>
        {[{ id: "live", label: "Live", count: live.length, dot: true }, { id: "recorded", label: "Recorded", count: recorded.length }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "8px 14px", marginBottom: -1, border: "none", background: "transparent",
            color: tab === t.id ? "var(--fg-1)" : "var(--fg-3)",
            font: "500 13px/1 var(--font-sans)",
            borderBottom: `2px solid ${tab === t.id ? "var(--brand)" : "transparent"}`,
            cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
          }}>{t.dot && <span className="dot dot-success pulse-dot"/>}{t.label} <span className="badge">{t.count}</span></button>
        ))}
      </div>
      <ListToolbar search="" onSearch={() => {}} filterLabels={["User","Resource","Protocol"]}/>
      <div className="scroll-area" style={{ flex: 1, overflow: "auto" }}>
        {(tab === "live" ? live : recorded).length === 0 ? (
          <EmptyState icon="sessions" title={`No ${tab} sessions`} description={tab === "live" ? "Live sessions will appear here as users launch them." : "Recorded sessions are kept according to your retention policy."}/>
        ) : (
          <table className="table">
            <thead><tr><th>Session</th><th>User</th><th>Resource</th><th>Protocol</th><th>Duration</th><th>Recording</th><th>Started</th><th></th></tr></thead>
            <tbody>{(tab === "live" ? live : recorded).map(s => (
              <tr key={s.id}>
                <td><div className="row"><span className="t-mono t-tiny" style={{ color: "var(--fg-3)" }}>{s.id}</span>{s.flagged && <span className="badge badge-danger">{s.flagged}</span>}</div></td>
                <td><div className="row"><Avatar name={s.user} size={22}/><span style={{ color: "var(--fg-1)", fontWeight: 500 }}>{s.user}</span></div></td>
                <td className="t-mono" style={{ color: "var(--fg-2)" }}>{s.resource}</td>
                <td><span className="badge">{s.protocol}</span></td>
                <td className="t-mono" style={{ color: "var(--fg-2)" }}>{s.duration}</td>
                <td>{s.recording ? <span className="badge badge-success"><Icon name="check" size={10}/> On</span> : <span className="badge badge-warning">Off</span>}</td>
                <td className="t-tiny" style={{ color: "var(--fg-3)" }}>{s.started}</td>
                <td style={{ textAlign: "right" }}>
                  {tab === "live"
                    ? <><button className="btn btn-ghost btn-sm">Monitor</button><button className="btn btn-ghost btn-sm" style={{ color: "var(--danger-fg)" }}>Terminate</button></>
                    : <button className="btn btn-ghost btn-sm"><Icon name="play" size={11}/> Replay</button>}
                </td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  );
};

// ============ Generic stub for remaining nav items ============
const StubScreen = ({ title, description, icon }) => (
  <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
    <PageHeader title={title} description={description}/>
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <EmptyState icon={icon} title={`${title} — coming up next`} description="This experience will be designed in the next iteration. Use Tweaks to toggle empty / populated states for the live screens."/>
    </div>
  </div>
);

window.PoliciesScreen = PoliciesScreen;
window.AllocationScreen = AllocationScreen;
window.TicketsScreen = TicketsScreen;
window.DiscoveryScreen = DiscoveryScreen;
window.SessionsScreen = SessionsScreen;
window.StubScreen = StubScreen;
