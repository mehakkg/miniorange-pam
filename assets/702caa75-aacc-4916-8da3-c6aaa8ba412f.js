// Audit portal — main entry. Replaces the old AuditDashboardScreen and routes
// the new audit nav (Dashboard / Reports / Sessions Live + Recorded / Scheduled / Bundles).

const AuditPortalV2 = ({ nav = "audit-dashboard" }) => {
  const [openReport, setOpenReport] = React.useState(null);
  const [openSession, setOpenSession] = React.useState(null);
  const [playingSession, setPlayingSession] = React.useState(null);
  const [createBundle, setCreateBundle] = React.useState(false);
  const [openBundle, setOpenBundle] = React.useState(null);

  // Full-screen states take over the whole portal area
  if (playingSession) return <SessionPlayer session={playingSession} onClose={() => setPlayingSession(null)}/>;
  if (createBundle)    return <EvidenceBundleCreate onClose={() => setCreateBundle(false)}/>;
  if (openBundle)      return <EvidenceBundleDetail bundle={openBundle} onClose={() => setOpenBundle(null)}/>;
  if (openReport)      return <ReportView report={openReport} onClose={() => setOpenReport(null)} onOpenSession={setOpenSession}/>;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
      {nav === "audit-dashboard" && <AuditDashboardV2/>}
      {nav === "audit-reports"   && <ReportsLanding onOpen={setOpenReport}/>}
      {nav === "audit-sessions-live"     && <LiveSessionsTab/>}
      {nav === "audit-sessions-recorded" && <RecordedSessionsTab onPlay={setPlayingSession}/>}
      {nav === "audit-scheduled" && <ScheduledReportsTab/>}
      {nav === "audit-evidence"  && <EvidenceBundlesV2 onCreate={() => setCreateBundle(true)} onOpen={setOpenBundle}/>}
      {nav === "audit-breakglass" && <BreakGlassReviewList/>}
      {openSession && <SessionDetailPanel session={openSession} onClose={() => setOpenSession(null)} onPlay={(s) => { setOpenSession(null); setPlayingSession(s); }}/>}
    </div>
  );
};

// Updated nav for the Audit portal sidebar (Sessions split into live/recorded)
const AUDIT_NAV_V2 = [
  { id: "audit-dashboard", icon: "dashboard", label: "Audit Dashboard" },
  { id: "audit-reports",   icon: "file-text", label: "Reports" },
  { id: "audit-sessions-live",     icon: "sessions", label: "Live Sessions" },
  { id: "audit-sessions-recorded", icon: "sessions", label: "Recorded Sessions" },
  { id: "audit-scheduled", icon: "clock",     label: "Scheduled Reports" },
  { id: "audit-evidence",  icon: "shield-check", label: "Evidence Bundles" },
  { id: "audit-breakglass", icon: "fire", label: "Break-Glass Review" },
];

const AuditSidebarV2 = ({ active, onNav, collapsed }) => (
  <aside style={{
    width: collapsed ? "var(--sidebar-w-collapsed)" : "var(--sidebar-w)",
    background: "var(--bg-sidebar)", borderRight: "1px solid var(--border)",
    display: "flex", flexDirection: "column", flex: "none",
    transition: "width 180ms ease", overflow: "hidden",
  }}>
    <div style={{
      height: "var(--topbar-h)", padding: collapsed ? "0" : "0 16px",
      display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-start",
      borderBottom: "1px solid var(--border)", gap: 8,
    }}>
      {collapsed ? <BrandMark size={24}/> : <>
        <Logo size={22}/>
        <span style={{ font: "500 11px/1 var(--font-sans)", color: "var(--success-fg)", padding: "3px 7px", background: "var(--success-soft)", borderRadius: 4, marginLeft: 4 }}>Audit</span>
      </>}
    </div>
    <div style={{ flex: 1, padding: "10px 8px" }}>
      {!collapsed && <div style={{ font: "500 10.5px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.7, padding: "12px 10px 6px" }}>Audit & Compliance</div>}
      {AUDIT_NAV_V2.map(it => {
        const isActive = active === it.id;
        return (
          <div key={it.id} onClick={() => onNav(it.id)} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: collapsed ? "8px" : "8px 10px",
            margin: "1px 0", borderRadius: 6,
            background: isActive ? "var(--brand-soft)" : "transparent",
            color: isActive ? "var(--brand-fg)" : "var(--fg-2)",
            cursor: "pointer", font: "500 13px/1 var(--font-sans)",
          }}>
            <Icon name={it.icon} size={16}/>
            {!collapsed && <span style={{ flex: 1 }}>{it.label}</span>}
          </div>
        );
      })}
    </div>
  </aside>
);

Object.assign(window, { AuditPortalV2, AuditSidebarV2, AUDIT_NAV_V2 });
