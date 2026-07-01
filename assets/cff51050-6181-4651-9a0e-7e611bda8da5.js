// Audit Portal — focused view of audit-relevant surfaces
// Same shell & data as admin, but with a compliance-oriented nav

const AUDIT_NAV = [
  { id: "audit-dashboard", icon: "dashboard", label: "Audit dashboard" },
  { id: "audit-reports",   icon: "file-text", label: "Reports" },
  { id: "audit-sessions",  icon: "sessions",  label: "Sessions & recordings" },
  { id: "audit-scheduled", icon: "clock",     label: "Scheduled reports" },
  { id: "audit-evidence",  icon: "shield-check", label: "Evidence bundles" },
];

const AuditSidebar = ({ active, onNav, collapsed }) => (
  <aside style={{
    width: collapsed ? "var(--sidebar-w-collapsed)" : "var(--sidebar-w)",
    background: "var(--bg-sidebar)", borderRight: "1px solid var(--border)",
    display: "flex", flexDirection: "column", flex: "none",
    transition: "width 180ms ease", overflow: "hidden",
  }}>
    <div style={{
      height: "var(--topbar-h)", padding: collapsed ? "0" : "0 16px",
      display: "flex", alignItems: "center",
      justifyContent: collapsed ? "center" : "flex-start",
      borderBottom: "1px solid var(--border)", gap: 8,
    }}>
      {collapsed ? <BrandMark size={24}/> : <>
        <Logo size={22}/>
        <span style={{ font: "500 11px/1 var(--font-sans)", color: "var(--success-fg)", padding: "3px 7px", background: "var(--success-soft)", borderRadius: 4, marginLeft: 4 }}>Audit</span>
      </>}
    </div>
    <div style={{ flex: 1, padding: "10px 8px" }}>
      {!collapsed && <div style={{ font: "500 10.5px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.7, padding: "12px 10px 6px" }}>Compliance</div>}
      {AUDIT_NAV.map(it => {
        const isActive = active === it.id;
        return (
          <div key={it.id} onClick={() => onNav(it.id)} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: collapsed ? "8px" : "8px 10px",
            justifyContent: collapsed ? "center" : "flex-start",
            margin: "1px 0", borderRadius: 6,
            background: isActive ? "var(--brand-soft)" : "transparent",
            color: isActive ? "var(--brand-fg)" : "var(--fg-2)",
            cursor: "pointer", font: "500 13px/1 var(--font-sans)",
          }}>
            <Icon name={it.icon} size={16}/>
            {!collapsed && <span style={{ flex: 1, whiteSpace: "nowrap" }}>{it.label}</span>}
          </div>
        );
      })}
    </div>
  </aside>
);

const AuditDashboardScreen = () => (
  <div className="scroll-area" style={{ flex: 1, overflow: "auto" }}>
    <PageHeader title="Audit & compliance" description="Compliance-grade visibility into every privileged session and access decision."
      actions={<><button className="btn"><Icon name="download" size={13}/> Export bundle</button><button className="btn btn-primary"><Icon name="plus" size={13}/> New report</button></>}/>
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <AuditComplianceView/>
    </div>
  </div>
);

const EvidenceBundlesScreen = () => (
  <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
    <PageHeader title="Evidence bundles" description="Pre-packaged audit evidence for SOC 2, PCI-DSS, ISO 27001, and HIPAA. Each bundle is hash-signed and includes a chain-of-custody manifest."
      actions={<button className="btn btn-primary"><Icon name="plus" size={13}/> Build new bundle</button>}/>
    <div className="scroll-area" style={{ flex: 1, overflow: "auto", padding: 24 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
        {[
          { framework: "SOC 2 Type II",       period: "Q1 2025", controls: "CC6.1 / CC6.6 / CC7.2 (12 controls)", size: "248 MB", built: "3 days ago", verified: true },
          { framework: "PCI-DSS 4.0",         period: "Q1 2025", controls: "Req 7 / Req 8 / Req 10 (9 controls)", size: "172 MB", built: "1 week ago", verified: true },
          { framework: "ISO 27001:2022",      period: "FY 2025", controls: "A.5 / A.8 / A.9 (14 controls)",       size: "311 MB", built: "2 weeks ago", verified: true },
          { framework: "HIPAA Security Rule", period: "Q1 2025", controls: "164.308 / 164.312 (8 controls)",     size: "194 MB", built: "5 days ago",  verified: true },
        ].map((b, i) => (
          <div key={i} className="card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 7, background: "var(--success-soft)", color: "var(--success-fg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="shield-check" size={18}/>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ font: "600 13.5px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{b.framework}</div>
                <div className="t-tiny" style={{ color: "var(--fg-4)" }}>{b.period}</div>
              </div>
              {b.verified && <Icon name="check-circle" size={16} color="var(--success)" title="SHA-256 hash verified"/>}
            </div>
            <div style={{ fontSize: 12, color: "var(--fg-3)" }}>{b.controls}</div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--fg-4)" }}>
              <span>{b.size}</span>
              <span>Built {b.built}</span>
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
              <button className="btn btn-sm" style={{ flex: 1 }}><Icon name="download" size={11}/> Download</button>
              <button className="btn btn-sm btn-ghost"><Icon name="more-h" size={13}/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

window.AuditSidebar = AuditSidebar;
window.AuditDashboardScreen = AuditDashboardScreen;
window.EvidenceBundlesScreen = EvidenceBundlesScreen;
window.AUDIT_NAV = AUDIT_NAV;
