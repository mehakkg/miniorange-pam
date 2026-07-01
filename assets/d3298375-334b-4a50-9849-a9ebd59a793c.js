// Audit Dashboard — restyled to match admin-portal design language
// (PageHeader, StatCard, .card + .card-header + .h-card, .table, .badge, .dot)

const AuditDashboardV4 = () => {
  const [view, setView] = React.useState("overview"); // overview | sessions | compliance
  const [range, setRange] = React.useState("7d");
  const [state, setState] = React.useState("default"); // default | healthy | critical | empty | loading
  const [activityFilter, setActivityFilter] = React.useState("All");

  const isHealthy = state === "healthy";
  const isCritical = state === "critical";
  const isEmpty = state === "empty";
  const isLoading = state === "loading";

  return (
    <div className="scroll-area" style={{ flex: 1, overflow: "auto" }}>
      <PageHeader
        title="Audit dashboard"
        description="Privileged access overview for Northwind Financial. Every metric links to the screen where you can act on it."
        actions={<>
          <RangePicker value={range} onChange={setRange}/>
          <button className="btn" onClick={() => {
            const order = ["default","critical","healthy","empty","loading"];
            setState(order[(order.indexOf(state) + 1) % order.length]);
          }} title="Cycle state (demo)">State: {state}</button>
          <button className="btn"><Icon name="shield-check" size={13}/> Generate evidence bundle</button>
        </>}
      />

      {/* View tabs */}
      <div style={{ padding: "12px 24px 0", borderBottom: "1px solid var(--border)", display: "flex", gap: 4 }}>
        {[
          { id: "overview",   label: "Overview" },
          { id: "sessions",   label: "Session activity" },
          { id: "compliance", label: "Compliance health" },
        ].map(t => (
          <button key={t.id} onClick={() => setView(t.id)} style={{
            padding: "8px 14px", marginBottom: -1,
            border: "none", background: "transparent",
            color: view === t.id ? "var(--fg-1)" : "var(--fg-3)",
            font: "500 13px/1 var(--font-sans)",
            borderBottom: `2px solid ${view === t.id ? "var(--brand)" : "transparent"}`,
            cursor: "pointer",
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
        {view === "overview" && <OverviewView {...{ isHealthy, isCritical, isEmpty, isLoading }}/>}
        {view === "sessions" && <SessionsView {...{ isEmpty, isLoading }}/>}
        {view === "compliance" && <ComplianceView {...{ isHealthy, isEmpty, isLoading }}/>}
      </div>
    </div>
  );
};

// ============ OVERVIEW VIEW ============

const OverviewView = ({ isHealthy, isCritical, isEmpty, isLoading }) => {
  const flagged = isHealthy || isEmpty ? [] : [
    { id: "f-1", score: 91, level: "Critical", desc: "rm -rf executed on auth-server-01 at 2:47 AM", user: "Marcus Chen", resource: "auth-server-01", ts: "6h ago" },
    { id: "f-2", score: 72, level: "High",     desc: "Same user accessed 4 critical resources in 35 minutes", user: "Priya Iyer", resource: "Multiple", ts: "Today 09:15 AM" },
  ];

  return (
    <>
      {/* LIVE strip */}
      <div className="row" style={{ marginBottom: -4 }}>
        <span className="dot dot-success pulse-dot"/>
        <span className="t-micro">Live · right now</span>
        <span className="t-tiny" style={{ color: "var(--fg-4)" }}>· reflects the current moment, not the date range</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <StatCard
          icon="sessions" label="Active sessions"
          value={isEmpty ? "0" : "4"}
          change={isEmpty ? "No active sessions" : "All 4 recording"}
          tone={isEmpty ? "muted" : "default"}
          link={!isEmpty && "View live sessions"}
          healthy={isHealthy}
        />
        <StatCard
          icon="users" label="Active users"
          value={isEmpty ? "0" : "3"}
          change={isEmpty ? "—" : "Connected now"}
          tone={isEmpty ? "muted" : "default"}
          link={!isEmpty && "View live sessions"}
          healthy={isHealthy}
        />
        <StatCard
          icon="tickets" label="Pending approvals"
          value={isEmpty ? "0" : "4"}
          change={isEmpty ? "No pending tickets" : (isHealthy ? "All within SLA" : "2 overdue · SLA exceeded")}
          tone={isEmpty ? "muted" : (isHealthy ? "default" : "danger")}
          link={!isEmpty && "Review tickets"}
          healthy={isHealthy}
        />
        <StatCard
          icon="alert-triangle" label="Open flags"
          value={isHealthy || isEmpty ? "0" : "2"}
          change={isHealthy ? "Nothing flagged" : isEmpty ? "—" : "1 critical · 1 high"}
          tone={isHealthy || isEmpty ? "default" : "warning"}
          link={!isHealthy && !isEmpty && "Review flagged"}
          healthy={isHealthy}
        />
      </div>

      {isHealthy && (
        <div className="card" style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, background: "var(--success-soft)", borderColor: "transparent" }}>
          <Icon name="check-circle" size={16} color="var(--success-fg)"/>
          <span style={{ font: "500 13px/1.4 var(--font-sans)", color: "var(--success-fg)" }}>All systems nominal · no flagged activity · recording coverage 100% · all credentials on rotation schedule</span>
          <div style={{ flex: 1 }}/>
          <span className="t-tiny" style={{ color: "var(--success-fg)", opacity: 0.85 }}>Last checked May 18, 11:42 AM IST</span>
        </div>
      )}

      {/* Period overview */}
      <div className="row-between" style={{ marginTop: 4 }}>
        <span className="t-micro">Period · May 12 – May 18, 2026</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
        {isLoading ? Array.from({ length: 5 }).map((_, i) => <SkelStatCard key={i}/>) : (
          isEmpty ? <>
            <StatCard icon="sessions" label="Total sessions" value="0" change="No sessions yet" tone="muted"/>
            <StatCard icon="video" label="Recordings" value="0" change="0% coverage" tone="muted"/>
            <StatCard icon="terminal" label="Command executions" value="0" change="—" tone="muted"/>
            <StatCard icon="tickets" label="Access requests" value="0" change="—" tone="muted"/>
            <StatCard icon="refresh" label="Credential rotations" value="0" change="—" tone="muted"/>
          </> : <>
            <StatCard icon="sessions" label="Total sessions" value="126" change="↑ 14% vs prior period" tone="success"/>
            <StatCard icon="video" label="Recordings" value="124" change="98.4% coverage · on target" tone="success"/>
            <StatCard icon="terminal" label="Command executions" value="481" change="14 failed · 2.9% fail rate"/>
            <StatCard icon="tickets" label="Access requests" value="18" change="14 approved · 3 rejected · 1 pending"/>
            <StatCard icon="refresh" label="Credential rotations" value="34" change="2 rotations failed" tone="danger"/>
          </>
        )}
      </div>

      {/* Flagged activity */}
      {flagged.length > 0 && (
        <div className="card">
          <div className="card-header">
            <Icon name="alert-triangle" size={15} color="var(--danger-fg)"/>
            <span className="h-card">Flagged activity{isCritical ? " · requires attention" : ""}</span>
            <span className="badge badge-danger">{flagged.length}</span>
            <div style={{ flex: 1 }}/>
            <button className="btn btn-ghost btn-sm">View all</button>
          </div>
          <table className="table">
            <thead><tr><th style={{ width: 110 }}>Risk</th><th>Event</th><th>User · Resource</th><th style={{ width: 110 }}>When</th><th style={{ width: 200, textAlign: "right" }}></th></tr></thead>
            <tbody>
              {flagged.map(f => <FlagRow key={f.id} f={f}/>)}
            </tbody>
          </table>
        </div>
      )}

      {/* Two-column charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 16 }}>
        {isLoading ? <SkelCard tall/> : (
          <div className="card">
            <div className="card-header">
              <span className="h-card">Session activity</span>
              <div style={{ flex: 1 }}/>
              <span className="t-tiny">Last 7 days</span>
              <button className="btn btn-ghost btn-sm"><Icon name="download" size={12}/></button>
            </div>
            <div style={{ padding: 20 }}>
              {isEmpty ? <EmptyChart msg="No session data for this period" sub="Sessions will appear here once users start accessing resources." cta="Complete setup →"/> : <>
                <SessionBarChart/>
                <div style={{ display: "flex", gap: 16, marginTop: 12, fontSize: 12 }}>
                  <LegendItem color="var(--brand)" label="SSH/SFTP" n={64}/>
                  <LegendItem color="var(--info)" label="Database" n={38}/>
                  <LegendItem color="#7c3aed" label="Web App" n={18}/>
                  <LegendItem color="var(--warning)" label="RDP" n={6}/>
                </div>
              </>}
            </div>
            {!isEmpty && (
              <div style={{ borderTop: "1px solid var(--border-subtle)" }}>
                <div className="card-header" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <span className="t-tiny" style={{ textTransform: "uppercase", letterSpacing: 0.6, color: "var(--fg-4)" }}>Top 3 most accessed</span>
                </div>
                {[
                  { rank: 1, name: "prod-db-primary", type: "Database", count: 42 },
                  { rank: 2, name: "auth-server-01", type: "Linux SSH", count: 31 },
                  { rank: 3, name: "oracle-reporting", type: "Database", count: 18 },
                ].map((r, i) => (
                  <div key={r.rank} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 20px", borderTop: i === 0 ? "none" : "1px solid var(--border-subtle)" }}>
                    <span className="t-tiny" style={{ width: 20, color: "var(--fg-4)" }}>#{r.rank}</span>
                    <span className="t-mono" style={{ color: "var(--fg-1)", flex: 1, fontWeight: 500 }}>{r.name}</span>
                    <span className="badge">{r.type}</span>
                    <span style={{ color: "var(--fg-2)", fontSize: 12, width: 80, textAlign: "right" }}>{r.count} sessions</span>
                    <button className="btn btn-ghost btn-sm">View</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {isLoading ? <><SkelCard/><SkelCard/></> : <>
            <CoverageCard value={isEmpty ? 0 : 98.4} target={95} subtotal={isEmpty ? "0 of 0 sessions" : "124 of 126 sessions recorded"} detail={isEmpty ? null : "2 sessions not recorded · dev-web-portal (×2)"} link="Set recording policy"/>
            <CommandsCard total={isEmpty ? 0 : 481} success={isEmpty ? 0 : 467} fail={isEmpty ? 0 : 14}/>
          </>}
        </div>
      </div>

      {/* Access governance signals */}
      <div className="card">
        <div className="card-header"><span className="h-card">Access governance</span><div style={{ flex: 1 }}/><span className="t-tiny">Current state</span></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }}>
          {isEmpty ? <>
            <GovBlock label="Standing privileges" value="—" status="Not configured" tone="muted"/>
            <GovBlock label="Credential rotation" value="—" status="Not configured" tone="muted" noBorder/>
            <GovBlock label="Certificate expiry" value="—" status="Not configured" tone="muted" noBorder/>
            <GovBlock label="Policy coverage" value="—" status="Not configured" tone="muted" noBorder/>
          </> : isHealthy ? <>
            <GovBlock label="Users with no access expiry" value="0" status="None" tone="success" link="Review allocations"/>
            <GovBlock label="Credentials on schedule" value="98%" status="Healthy" tone="success" link="Rotation health" noBorder/>
            <GovBlock label="Certs expiring in 30 days" value="0" status="None expiring" tone="success" link="View certificates" noBorder/>
            <GovBlock label="Resources without policy" value="0" status="All covered" tone="success" link="Assign policies" noBorder/>
          </> : <>
            <GovBlock label="Users with no access expiry" value="3" status="3 users · review" tone="warning" link="Review allocations"/>
            <GovBlock label="Credentials on schedule" value="94.1%" status="At risk · below 95%" tone="warning" link="Rotation health" noBorder/>
            <GovBlock label="Certs expiring in 30 days" value="1" status="1 critical · 6 days" tone="danger" link="View certificates" noBorder/>
            <GovBlock label="Resources without policy" value="0" status="All covered" tone="success" link="Assign policies" noBorder/>
          </>}
        </div>
      </div>

      {/* Recent activity */}
      <RecentActivityCard isEmpty={isEmpty} isCritical={isCritical}/>
    </>
  );
};

// ============ SESSIONS VIEW ============

const SessionsView = ({ isEmpty }) => (
  <>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
      <StatCard icon="sessions" label="Sessions (7d)"     value={isEmpty ? "0" : "126"} change="↑ 14% vs prior"/>
      <StatCard icon="video"    label="Recording coverage" value={isEmpty ? "—" : "98.4%"} change="On target ≥ 95%" tone="success"/>
      <StatCard icon="terminal" label="Commands executed"  value={isEmpty ? "0" : "481"} change="14 failed · 2.9%"/>
      <StatCard icon="fire"     label="Break-glass events" value={isEmpty ? "0" : "1"}   change="3 days ago · oracle-reporting" tone="warning"/>
    </div>

    <div className="card">
      <div className="card-header">
        <span className="h-card">Session activity</span>
        <div style={{ flex: 1 }}/>
        <button className="btn btn-sm"><Icon name="download" size={12}/> Export CSV</button>
      </div>
      <div style={{ padding: 20 }}>
        {isEmpty ? <EmptyChart msg="No session data for this period" sub="Sessions will appear once users start accessing resources." cta="Complete setup →"/> : <SessionBarChart tall/>}
      </div>
    </div>

    <div className="card">
      <div className="card-header"><span className="h-card">Recent sessions</span><div style={{ flex: 1 }}/><button className="btn btn-ghost btn-sm">View all</button></div>
      <table className="table">
        <thead><tr><th>User</th><th>Resource</th><th>Protocol</th><th>Started</th><th>Duration</th><th>Recording</th><th></th></tr></thead>
        <tbody>
          {(isEmpty ? [] : [
            { user: "Priya Iyer", resource: "prod-db-primary", proto: "SSH", started: "11:34", duration: "8 min", rec: "active" },
            { user: "Marcus Chen", resource: "auth-server-01", proto: "SSH", started: "02:47", duration: "1h 18m", rec: "flagged" },
            { user: "Rohan Mehta", resource: "auth-server-01", proto: "SSH", started: "11:18", duration: "24 min", rec: "active" },
            { user: "Arjun Bansal", resource: "oracle-reporting", proto: "SSH", started: "May 15", duration: "3h 41m", rec: "saved", breakGlass: true },
            { user: "Aditya Kulkarni", resource: "dev-web-portal", proto: "RDP", started: "May 15", duration: "1h 12m", rec: "saved" },
          ]).map((s, i) => (
            <tr key={i}>
              <td><div className="row"><Avatar name={s.user} size={22}/><span style={{ color: "var(--fg-1)", fontWeight: 500 }}>{s.user}</span></div></td>
              <td><span className="t-mono" style={{ color: "var(--fg-2)" }}>{s.resource}</span>{s.breakGlass && <span className="badge badge-danger" style={{ marginLeft: 6 }}>Break-glass</span>}</td>
              <td><span className="badge">{s.proto}</span></td>
              <td className="t-mono" style={{ color: "var(--fg-3)" }}>{s.started}</td>
              <td className="t-mono" style={{ color: "var(--fg-3)" }}>{s.duration}</td>
              <td>{s.rec === "active" ? <span className="badge badge-success"><span className="dot dot-success pulse-dot"/> Recording</span>
                  : s.rec === "flagged" ? <span className="badge badge-danger">Flagged</span>
                  : <span className="badge badge-info">Saved</span>}</td>
              <td style={{ textAlign: "right" }}><button className="btn btn-ghost btn-sm">{s.rec === "active" ? "Monitor" : "Replay"}</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      {isEmpty && <div style={{ padding: 32, textAlign: "center", color: "var(--fg-4)", fontSize: 13 }}>No sessions in this period.</div>}
    </div>
  </>
);

// ============ COMPLIANCE VIEW ============

const ComplianceView = ({ isHealthy, isEmpty }) => (
  <>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
      <StatCard icon="check-circle" label="Audit readiness"    value={isEmpty ? "—" : "92%"} change={isEmpty ? "—" : "SOC 2 + PCI · 4 gaps"} tone={isHealthy ? "success" : "default"}/>
      <StatCard icon="refresh"      label="Rotation success"   value={isEmpty ? "—" : (isHealthy ? "98%" : "94.1%")} change={isHealthy ? "Healthy" : "Below 95% target"} tone={isHealthy ? "success" : "warning"}/>
      <StatCard icon="certificates" label="Certs expiring < 30d" value={isEmpty ? "—" : (isHealthy ? "0" : "1")} change={isHealthy ? "None expiring" : "1 critical · 6 days"} tone={isHealthy ? "success" : "danger"}/>
      <StatCard icon="shield"       label="Resources w/o policy" value={isEmpty ? "—" : "0"} change="All covered" tone="success"/>
    </div>

    <div className="card">
      <div className="card-header"><span className="h-card">Compliance posture by control area</span><div style={{ flex: 1 }}/><span className="t-tiny">Source: SOC 2 + PCI-DSS</span></div>
      <table className="table">
        <thead><tr><th>Control area</th><th style={{ width: 120 }}>Status</th><th>Detail</th><th style={{ width: 140 }}>Last verified</th><th style={{ width: 80, textAlign: "right" }}></th></tr></thead>
        <tbody>
          {(isEmpty ? [] : [
            { area: "Privileged session recording", status: "ok", detail: "98.4% coverage · 2 sessions not recorded", verified: "Today, 11:42" },
            { area: "Credential rotation policy",    status: isHealthy ? "ok" : "warn", detail: isHealthy ? "98% on schedule" : "94.1% on schedule · 2 failures last 7 days", verified: "Today, 11:42" },
            { area: "JIT / least-privilege",          status: isHealthy ? "ok" : "warn", detail: isHealthy ? "0 standing privileges" : "3 users with no access expiry", verified: "Today, 11:42" },
            { area: "Certificate management",         status: isHealthy ? "ok" : "fail", detail: isHealthy ? "All certs valid 30d+" : "1 cert expires in 6 days · api.securecorp.com", verified: "Today, 11:42" },
            { area: "Policy coverage",                status: "ok", detail: "All 142 resources covered by an active policy", verified: "Today, 11:42" },
            { area: "Audit log retention",            status: "ok", detail: "365-day retention · hash-chained · last verified clean", verified: "Today, 06:00" },
          ]).map((r, i) => (
            <tr key={i}>
              <td style={{ color: "var(--fg-1)", fontWeight: 500 }}>{r.area}</td>
              <td>{r.status === "ok" ? <span className="badge badge-success"><span className="dot dot-success"/> Pass</span>
                  : r.status === "warn" ? <span className="badge badge-warning"><span className="dot dot-warning"/> At risk</span>
                  : <span className="badge badge-danger"><span className="dot dot-danger"/> Fail</span>}</td>
              <td style={{ color: "var(--fg-3)", fontSize: 12.5 }}>{r.detail}</td>
              <td className="t-mono" style={{ color: "var(--fg-4)" }}>{r.verified}</td>
              <td style={{ textAlign: "right" }}><button className="btn btn-ghost btn-sm">Open</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      {isEmpty && <div style={{ padding: 32, textAlign: "center", color: "var(--fg-4)", fontSize: 13 }}>Controls will appear once PAM setup is complete.</div>}
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <div className="card">
        <div className="card-header"><span className="h-card">Evidence bundles</span><div style={{ flex: 1 }}/><button className="btn btn-sm"><Icon name="plus" size={12}/> Build new</button></div>
        <div>
          {[
            { framework: "SOC 2 Type II", period: "Q1 2025", built: "3 days ago" },
            { framework: "PCI-DSS 4.0",   period: "Q1 2025", built: "1 week ago" },
            { framework: "ISO 27001:2022",period: "FY 2025", built: "2 weeks ago" },
          ].map((b, i) => (
            <div key={i} style={{ padding: "12px 20px", borderTop: i === 0 ? "none" : "1px solid var(--border-subtle)", display: "flex", alignItems: "center", gap: 10 }}>
              <Icon name="shield-check" size={16} color="var(--success-fg)"/>
              <div style={{ flex: 1 }}>
                <div style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{b.framework}</div>
                <div className="t-tiny" style={{ color: "var(--fg-4)" }}>{b.period} · built {b.built}</div>
              </div>
              <button className="btn btn-ghost btn-sm"><Icon name="download" size={12}/></button>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-header"><span className="h-card">Scheduled reports</span><div style={{ flex: 1 }}/><button className="btn btn-sm">Manage</button></div>
        <div>
          {[
            { name: "Weekly access review",  to: "secops@northwind.com", next: "Monday, 9:00 AM" },
            { name: "Monthly SOC 2 evidence", to: "compliance@northwind.com", next: "Jun 1, 6:00 AM" },
            { name: "Daily failed logins",   to: "secops@northwind.com", next: "Tomorrow, 6:00 AM" },
          ].map((r, i) => (
            <div key={i} style={{ padding: "12px 20px", borderTop: i === 0 ? "none" : "1px solid var(--border-subtle)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Icon name="clock" size={13} color="var(--fg-3)"/>
                <span style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{r.name}</span>
              </div>
              <div className="t-tiny" style={{ color: "var(--fg-4)", marginTop: 3, marginLeft: 21 }}>→ {r.to} · next run {r.next}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </>
);

// ============ Shared components ============

const StatCard = ({ label, value, change, tone = "default", icon, link, healthy }) => {
  const changeColor =
    tone === "danger" ? "var(--danger-fg)" :
    tone === "warning" ? "var(--warning-fg)" :
    tone === "success" ? "var(--success-fg)" :
    tone === "muted" ? "var(--fg-4)" : "var(--fg-3)";
  const iconBg = tone === "danger" ? "var(--danger-soft)" : tone === "warning" ? "var(--warning-soft)" : tone === "success" ? "var(--success-soft)" : "var(--bg-surface-2)";
  const iconFg = tone === "danger" ? "var(--danger-fg)"  : tone === "warning" ? "var(--warning-fg)"  : tone === "success" ? "var(--success-fg)"  : "var(--fg-2)";
  return (
    <div className="card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8, position: "relative", opacity: tone === "muted" ? 0.7 : 1 }}>
      {healthy && <Icon name="check-circle" size={14} color="var(--success-fg)" style={{ position: "absolute", top: 12, right: 12 }}/>}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {icon && <div style={{ width: 28, height: 28, borderRadius: 6, background: iconBg, color: iconFg, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name={icon} size={14}/></div>}
        <div className="t-tiny" style={{ flex: 1 }}>{label}</div>
      </div>
      <div style={{ font: "600 26px/1.1 var(--font-sans)", color: "var(--fg-1)", letterSpacing: "-0.4px" }}>{value}</div>
      {change && <div style={{ fontSize: 12, color: changeColor }}>{change}</div>}
      {link && <a href="#" style={{ font: "500 12px/1 var(--font-sans)", color: "var(--brand-fg)", marginTop: 2 }}>{link} →</a>}
    </div>
  );
};

const RangePicker = ({ value, onChange }) => {
  const opts = [["1d","Today"],["7d","7 days"],["30d","30 days"],["90d","90 days"],["custom","Custom"]];
  return (
    <div style={{ display: "inline-flex", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
      {opts.map(([k, l], i) => (
        <button key={k} onClick={() => onChange(k)} style={{
          padding: "0 10px", height: 32, border: "none", borderLeft: i === 0 ? "none" : "1px solid var(--border)",
          background: value === k ? "var(--brand)" : "var(--bg-surface)",
          color: value === k ? "var(--fg-on-accent)" : "var(--fg-2)",
          font: `${value === k ? 600 : 500} 12px/1 var(--font-sans)`, cursor: "pointer",
        }}>{l}</button>
      ))}
    </div>
  );
};

const FlagRow = ({ f }) => (
  <tr>
    <td>
      {f.level === "Critical"
        ? <span className="badge badge-danger" style={{ fontWeight: 600 }}>{f.score} Critical</span>
        : f.level === "High"
        ? <span className="badge badge-warning">{f.score} High</span>
        : <span className="badge badge-info">{f.score} Medium</span>}
    </td>
    <td style={{ color: "var(--fg-1)", fontWeight: 500 }}>{f.desc}</td>
    <td>
      <div className="row">
        <Avatar name={f.user} size={20}/>
        <span>{f.user}</span>
        <Icon name="arrow-right" size={11} color="var(--fg-4)"/>
        <span className="t-mono" style={{ color: "var(--fg-2)", fontSize: 12 }}>{f.resource}</span>
      </div>
    </td>
    <td className="t-tiny" style={{ color: "var(--fg-4)" }}>{f.ts}</td>
    <td style={{ textAlign: "right" }}>
      <button className="btn btn-sm btn-primary">Review</button>
      <button className="btn btn-sm btn-ghost" style={{ marginLeft: 4 }}>Mark reviewed</button>
    </td>
  </tr>
);

const SessionBarChart = ({ tall }) => {
  const data = [[14,7,3,1],[18,10,4,2],[12,5,2,1],[20,12,5,2],[8,4,2,0],[24,14,6,2],[16,8,3,1]];
  const labels = ["May 12","May 13","May 14","May 15","May 16","May 17","May 18"];
  const colors = ["var(--brand)","var(--info)","#7c3aed","var(--warning)"];
  const max = 30;
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: tall ? 240 : 160 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <div style={{ width: "100%", display: "flex", flexDirection: "column-reverse", alignItems: "stretch", flex: 1, borderRadius: "3px 3px 0 0", overflow: "hidden" }}>
            {d.map((v, j) => v > 0 && <div key={j} title={`${labels[i]}: ${v}`} style={{ height: `${(v / max) * 100}%`, background: colors[j] }}/>)}
          </div>
          <span className="t-tiny" style={{ color: "var(--fg-4)" }}>{labels[i].slice(4)}</span>
        </div>
      ))}
    </div>
  );
};

const LegendItem = ({ color, label, n }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--fg-2)" }}>
    <span style={{ width: 9, height: 9, borderRadius: 2, background: color }}/>
    <span>{label}</span><span style={{ color: "var(--fg-4)" }}>· {n}</span>
  </span>
);

const CoverageCard = ({ value, target, subtotal, detail, link }) => {
  const tone = value >= 95 ? "success" : value >= 85 ? "warning" : "danger";
  const fill = value >= 95 ? "var(--success)" : value >= 85 ? "var(--warning)" : "var(--danger)";
  return (
    <div className="card">
      <div className="card-header"><span className="h-card">Recording coverage</span><div style={{ flex: 1 }}/><span className={`badge badge-${tone}`}>{value >= 95 ? "On target" : "Below target"}</span></div>
      <div style={{ padding: 20 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 12 }}>
          <span style={{ font: "600 32px/1 var(--font-sans)", color: "var(--fg-1)", letterSpacing: "-0.5px" }}>{value}%</span>
          <span className="t-tiny" style={{ color: "var(--fg-3)" }}>· target {target}%</span>
        </div>
        <div style={{ position: "relative", height: 6, borderRadius: 9999, overflow: "hidden", background: "var(--bg-surface-2)" }}>
          <div style={{ width: `${value}%`, height: "100%", background: fill }}/>
          <div style={{ position: "absolute", top: -3, bottom: -3, left: `${target}%`, width: 1, background: "var(--fg-3)" }}/>
        </div>
        <div className="t-small" style={{ marginTop: 12, color: "var(--fg-2)" }}>{subtotal}</div>
        {detail && <div className="t-tiny" style={{ marginTop: 4, color: "var(--warning-fg)" }}>{detail}</div>}
        {link && <a href="#" style={{ display: "inline-block", marginTop: 8, font: "500 12px/1 var(--font-sans)", color: "var(--brand-fg)" }}>{link} →</a>}
      </div>
    </div>
  );
};

const CommandsCard = ({ total, success, fail }) => {
  const failPct = total > 0 ? (fail / total) * 100 : 0;
  return (
    <div className="card">
      <div className="card-header"><span className="h-card">Command executions</span><div style={{ flex: 1 }}/><span className="t-tiny">Last 7 days</span></div>
      <div style={{ padding: 20 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 12 }}>
          <span style={{ font: "600 32px/1 var(--font-sans)", color: "var(--fg-1)", letterSpacing: "-0.5px" }}>{total}</span>
          <span className="t-tiny" style={{ color: failPct > 10 ? "var(--warning-fg)" : "var(--fg-3)" }}>· {failPct.toFixed(1)}% failed</span>
        </div>
        <div style={{ display: "flex", height: 6, borderRadius: 9999, overflow: "hidden", background: "var(--bg-surface-2)" }}>
          {success > 0 && <div style={{ flex: success, background: "var(--success)" }}/>}
          {fail > 0 && <div style={{ flex: fail, background: "var(--danger)" }}/>}
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 12, fontSize: 12 }}>
          <span style={{ color: "var(--fg-2)" }}><span className="dot dot-success" style={{ marginRight: 6 }}/>Success {success}</span>
          <span style={{ color: "var(--fg-2)" }}><span className="dot dot-danger" style={{ marginRight: 6 }}/>Failed {fail}</span>
        </div>
        <a href="#" style={{ display: "inline-block", marginTop: 12, font: "500 12px/1 var(--font-sans)", color: "var(--brand-fg)" }}>View command log →</a>
      </div>
    </div>
  );
};

const GovBlock = ({ label, value, status, tone, link, noBorder }) => {
  const toneFg =
    tone === "success" ? "var(--success-fg)" :
    tone === "warning" ? "var(--warning-fg)" :
    tone === "danger"  ? "var(--danger-fg)"  : "var(--fg-4)";
  const dotCls =
    tone === "success" ? "dot-success" :
    tone === "warning" ? "dot-warning" :
    tone === "danger"  ? "dot-danger"  : "";
  return (
    <div style={{ padding: 20, borderLeft: noBorder ? "none" : "0", borderRight: "1px solid var(--border-subtle)" }}>
      <div className="t-tiny" style={{ marginBottom: 8 }}>{label}</div>
      <div style={{ font: "600 26px/1.1 var(--font-sans)", color: "var(--fg-1)", letterSpacing: "-0.4px" }}>{value}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
        {dotCls && <span className={`dot ${dotCls}`}/>}
        <span style={{ font: "500 12px/1.4 var(--font-sans)", color: toneFg }}>{status}</span>
      </div>
      {link && <a href="#" style={{ display: "inline-block", marginTop: 8, font: "500 12px/1 var(--font-sans)", color: "var(--brand-fg)" }}>{link} →</a>}
    </div>
  );
};

const RecentActivityCard = ({ isEmpty, isCritical }) => {
  if (isEmpty) {
    return (
      <div className="card">
        <div className="card-header"><span className="h-card">Recent activity</span></div>
        <div style={{ padding: 36, textAlign: "center" }}>
          <div style={{ font: "500 13.5px/1.4 var(--font-sans)", color: "var(--fg-2)" }}>No activity recorded yet</div>
          <div className="t-tiny" style={{ marginTop: 6, color: "var(--fg-4)" }}>Events will appear here once users access resources.</div>
          <button className="btn btn-primary btn-sm" style={{ marginTop: 14 }}>Complete PAM setup →</button>
        </div>
      </div>
    );
  }
  // pin break-glass to top if critical
  const feed = isCritical
    ? [...RECENT_FEED].sort((a, b) => (a.type === "bg" ? -1 : b.type === "bg" ? 1 : 0))
    : RECENT_FEED;
  return (
    <div className="card">
      <div className="card-header">
        <span className="h-card">Recent activity</span>
        <div style={{ flex: 1 }}/>
        <select className="select" style={{ height: 28, fontSize: 12, width: 110 }}>
          <option>All events</option><option>Sessions</option><option>Credentials</option><option>Access</option><option>System</option>
        </select>
        <button className="btn btn-ghost btn-sm">View all</button>
      </div>
      <table className="table">
        <thead><tr><th style={{ width: 32 }}></th><th>Event</th><th>Actor → Target</th><th style={{ width: 100 }}>Risk</th><th style={{ width: 110 }}>When</th></tr></thead>
        <tbody>
          {feed.map((e, i) => <ActivityRow key={i} e={e}/>)}
        </tbody>
      </table>
      <div style={{ padding: "10px 20px", borderTop: "1px solid var(--border-subtle)", textAlign: "center" }}>
        <button className="btn btn-ghost btn-sm">Load more</button>
      </div>
    </div>
  );
};

const ICON_FOR = { session: "sessions", access_ok: "check-circle", access_no: "x", command: "zap", credential: "lock", bg: "fire", alert: "alert-triangle", rotation: "refresh", cert: "shield-check" };
const COLOR_FOR = { session: "var(--brand-fg)", access_ok: "var(--success-fg)", access_no: "var(--danger-fg)", command: "var(--warning-fg)", credential: "var(--info-fg)", bg: "var(--danger-fg)", alert: "var(--warning-fg)", rotation: "var(--info-fg)", cert: "var(--warning-fg)" };
const BG_FOR    = { session: "var(--brand-soft)", access_ok: "var(--success-soft)", access_no: "var(--danger-soft)", command: "var(--warning-soft)", credential: "var(--info-soft)", bg: "var(--danger-soft)", alert: "var(--warning-soft)", rotation: "var(--info-soft)", cert: "var(--warning-soft)" };

const RECENT_FEED = [
  { type: "session",    desc: "Session started",            actor: "Priya Iyer",      target: "prod-db-primary",     detail: "SSH · recording", ts: "8 min ago" },
  { type: "access_ok",  desc: "Access request approved",    actor: "Rohan Mehta",     target: "auth-server-01",      detail: "4h window", ts: "12 min ago" },
  { type: "command",    desc: "rm -rf command blocked",     actor: "Marcus Chen",     target: "auth-server-01",      detail: null, ts: "6h ago", risk: 91, level: "Critical" },
  { type: "rotation",   desc: "Password rotated",           actor: "PAM automated",   target: "prod-db-root",        detail: "Success", ts: "2h ago" },
  { type: "credential", desc: "Credential drift detected",  actor: "PAM detection",   target: "oracle-dba-01",       detail: "vault mismatch", ts: "1d ago", risk: 45, level: "Medium" },
  { type: "bg",         desc: "Break-glass access granted", actor: "Arjun Bansal",    target: "oracle-reporting",    detail: "4h window", ts: "3d ago", risk: 67, level: "High" },
  { type: "access_ok",  desc: "Access request approved",    actor: "Aditya Kulkarni", target: "dev-web-portal",      detail: "2h window", ts: "3d ago" },
  { type: "alert",      desc: "Login failed · 3 attempts",  actor: "Unknown",         target: "oracle-dba-01",       detail: "from 115.160.215.254", ts: "4d ago" },
  { type: "rotation",   desc: "Rotation failed",            actor: "PAM automated",   target: "windows-svc-account", detail: "Auth rejected", ts: "4d ago", risk: 45, level: "Medium" },
  { type: "credential", desc: "New credential created",     actor: "Arjun Bansal",    target: "linux-ssh-admin",     detail: null, ts: "5d ago" },
];

const ActivityRow = ({ e }) => {
  const isBG = e.type === "bg";
  return (
    <tr style={isBG ? { background: "color-mix(in oklch, var(--danger-soft) 60%, transparent)" } : null}>
      <td>
        <div style={{ width: 24, height: 24, borderRadius: 6, background: BG_FOR[e.type], color: COLOR_FOR[e.type], display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name={ICON_FOR[e.type]} size={12}/>
        </div>
      </td>
      <td>
        <div style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{e.desc}{isBG && <span className="badge badge-danger" style={{ marginLeft: 8 }}>Break-glass</span>}</div>
        {e.detail && <div className="t-tiny" style={{ color: "var(--fg-4)", marginTop: 2 }}>{e.detail}</div>}
      </td>
      <td>
        <div className="row">
          <span style={{ color: "var(--fg-2)", fontSize: 12.5 }}>{e.actor}</span>
          <Icon name="arrow-right" size={11} color="var(--fg-4)"/>
          <span className="t-mono" style={{ color: "var(--fg-2)" }}>{e.target}</span>
        </div>
      </td>
      <td>
        {e.risk ? (
          e.level === "Critical" ? <span className="badge badge-danger" style={{ fontWeight: 600 }}>{e.risk} Critical</span>
          : e.level === "High"   ? <span className="badge badge-warning">{e.risk} High</span>
          : <span className="badge badge-info">{e.risk} Medium</span>
        ) : <span className="t-tiny" style={{ color: "var(--fg-5)" }}>—</span>}
      </td>
      <td className="t-tiny" style={{ color: "var(--fg-4)" }}>{e.ts}</td>
    </tr>
  );
};

// ============ Empty / skeleton ============

const SkelStatCard = () => (
  <div className="card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 28, height: 28, borderRadius: 6, background: "var(--bg-surface-2)" }}/>
      <div style={{ width: 90, height: 8, background: "var(--bg-surface-2)", borderRadius: 4 }}/>
    </div>
    <div style={{ width: 70, height: 22, background: "var(--bg-surface-2)", borderRadius: 4 }}/>
    <div style={{ width: "80%", height: 8, background: "var(--bg-surface-2)", borderRadius: 4 }}/>
  </div>
);

const SkelCard = ({ tall }) => (
  <div className="card" style={{ height: tall ? 360 : 180, padding: 20 }}>
    <div style={{ width: 120, height: 10, background: "var(--bg-surface-2)", borderRadius: 4 }}/>
    <div style={{ width: "100%", height: tall ? 280 : 100, background: "var(--bg-surface-2)", borderRadius: 6, marginTop: 16 }}/>
  </div>
);

const EmptyChart = ({ msg, sub, cta }) => (
  <div style={{ padding: "48px 20px", textAlign: "center" }}>
    <Icon name="bar-chart" size={28} color="var(--fg-5)"/>
    <div style={{ font: "500 13.5px/1.4 var(--font-sans)", color: "var(--fg-2)", marginTop: 10 }}>{msg}</div>
    <div className="t-tiny" style={{ color: "var(--fg-4)", marginTop: 4 }}>{sub}</div>
    <a href="#" style={{ display: "inline-block", marginTop: 10, font: "500 12.5px/1 var(--font-sans)", color: "var(--brand-fg)" }}>{cta}</a>
  </div>
);

window.AuditDashboardV2 = AuditDashboardV4;
window.AuditDashboardV3 = AuditDashboardV4;
window.AuditDashboardV4 = AuditDashboardV4;
