// App shell: sidebar (5-phase IA) + topbar

const NAV_GROUPS = [
{ label: "Overview", items: [
  { id: "dashboard", icon: "dashboard", label: "Dashboard" },
  { id: "tickets", icon: "tickets", label: "Tickets & Approvals", badge: 4 }]
},
{ label: "Setup", items: [
  { id: "resources", icon: "resources", label: "Resources" },
  { id: "credentials", icon: "credentials", label: "Credentials" },
  { id: "people", icon: "people", label: "People" },
  { id: "certificates", icon: "certificates", label: "Certificates" }]
},
{ label: "Access control", items: [
  { id: "policies", icon: "policies", label: "Policies" },
  { id: "allocation", icon: "allocation", label: "Access allocation" }]
},
{ label: "Security ops", items: [
  { id: "discovery", icon: "discovery", label: "Discovery & triage", badge: 6 },
  { id: "sessions", icon: "sessions", label: "Sessions & monitoring", live: 4 },
  { id: "endpoint", icon: "endpoint", label: "Endpoint Security", expandable: true, children: [
    { id: "ep-dashboard", label: "Overview" },
    { id: "ep-apps", label: "App management" },
    { id: "ep-policies", label: "Policy management" },
    { id: "ep-devices", label: "Endpoint manager" },
    { id: "ep-audits", label: "Audits" },
    { id: "ep-tickets", label: "Tickets" }]
  }]
},
{ label: "Identity config", items: [
  { id: "auth", icon: "auth", label: "Authentication" },
  { id: "twofactor", icon: "twofactor", label: "Two-factor" }]
},
{ label: "System", items: [
  { id: "ztna", icon: "globe", label: "ZTNA Connectors" },
  { id: "settings", icon: "settings", label: "Settings" },
  { id: "customization", icon: "customization", label: "Customization" }]
}];


const Sidebar = ({ active, onNav, collapsed, onToggleCollapse }) => {
  return (
    <aside style={{
      width: collapsed ? "var(--sidebar-w-collapsed)" : "var(--sidebar-w)",
      background: "var(--bg-sidebar)",
      borderRight: "1px solid var(--border)",
      display: "flex", flexDirection: "column",
      flex: "none",
      transition: "width 180ms ease",
      overflow: "hidden"
    }}>
      {/* Brand */}
      <div style={{
        height: "var(--topbar-h)",
        padding: collapsed ? "0" : "0 16px",
        display: "flex", alignItems: "center",
        justifyContent: collapsed ? "center" : "flex-start",
        borderBottom: "1px solid var(--border)"
      }}>
        {collapsed ? <BrandMark size={24} /> : <Logo size={22} />}
      </div>

      {/* Nav */}
      <div className="scroll-area" style={{ flex: 1, padding: "10px 8px", overflowY: "auto" }}>
        {NAV_GROUPS.map((g, gi) =>
        <div key={gi} style={{ marginBottom: 4 }}>
            {!collapsed &&
          <div style={{
            font: "500 10.5px/1 var(--font-sans)",
            color: "var(--fg-4)",
            textTransform: "uppercase", letterSpacing: 0.7,
            padding: "12px 10px 6px"
          }}>{g.label}</div>
          }
            {collapsed && gi > 0 &&
          <div style={{ height: 1, background: "var(--border-subtle)", margin: "8px 6px" }} />
          }
            {g.items.map((it) => {
            const isActive = active === it.id || it.children && it.children.some((c) => c.id === active);
            const isExpanded = it.expandable && (isActive || it.children?.some((c) => c.id === active));
            return (
              <React.Fragment key={it.id}>
                <div onClick={() => onNav(it.expandable ? it.children[0].id : it.id)}
                className="tooltip" data-tip={collapsed ? it.label : undefined}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: collapsed ? "8px" : "7px 10px",
                  justifyContent: collapsed ? "center" : "flex-start",
                  margin: "1px 0",
                  borderRadius: 6,
                  background: isActive && !it.expandable ? "var(--brand-soft)" : "transparent",
                  color: isActive ? "var(--brand-fg)" : "var(--fg-2)",
                  cursor: "pointer",
                  font: "500 13px/1 var(--font-sans)",
                  transition: "background 100ms"
                }}
                onMouseEnter={(e) => {if (!isActive || it.expandable) e.currentTarget.style.background = "var(--bg-surface-hover)";}}
                onMouseLeave={(e) => {if (!isActive || it.expandable) e.currentTarget.style.background = "transparent";}}>
                  
                  <Icon name={it.icon} size={16} />
                  {!collapsed && <span style={{ flex: 1, whiteSpace: "nowrap" }}>{it.label}</span>}
                  {!collapsed && it.expandable && <Icon name={isExpanded ? "chevron-down" : "chevron-right"} size={11} color="var(--fg-4)" />}
                  {!collapsed && it.badge &&
                  <span style={{
                    background: "var(--brand)", color: "#fff",
                    font: "600 10px/1 var(--font-sans)",
                    padding: "2px 6px", borderRadius: 9999, minWidth: 16, textAlign: "center"
                  }}>{it.badge}</span>
                  }
                  {!collapsed && it.live &&
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <span className="dot dot-success pulse-dot" style={{ width: 6, height: 6 }} />
                      <span style={{ font: "500 11px/1 var(--font-sans)", color: "var(--fg-3)" }}>{it.live}</span>
                    </span>
                  }
                </div>
                {!collapsed && isExpanded && it.children && it.children.map((c) =>
                <div key={c.id} onClick={() => onNav(c.id)} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "6px 10px 6px 36px", margin: "1px 0", borderRadius: 6,
                  background: active === c.id ? "var(--brand-soft)" : "transparent",
                  color: active === c.id ? "var(--brand-fg)" : "var(--fg-3)",
                  cursor: "pointer", font: "500 12.5px/1 var(--font-sans)"
                }}
                onMouseEnter={(e) => {if (active !== c.id) e.currentTarget.style.background = "var(--bg-surface-hover)";}}
                onMouseLeave={(e) => {if (active !== c.id) e.currentTarget.style.background = "transparent";}}>
                  {c.label}</div>
                )}
                </React.Fragment>);

          })}
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <div style={{
        padding: "8px",
        borderTop: "1px solid var(--border)",
        display: "flex", justifyContent: collapsed ? "center" : "flex-end"
      }}>
        <button className="btn btn-ghost btn-sm btn-icon" onClick={onToggleCollapse}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
          <Icon name={collapsed ? "chevron-right" : "panel-left"} size={14} />
        </button>
      </div>
    </aside>);

};

const Topbar = ({ user, theme, onToggleTheme, onOpenSearch, pageTitle, currentPortal, onPortalChange }) => {
  const [switcherOpen, setSwitcherOpen] = React.useState(false);
  const switcherRef = React.useRef(null);

  React.useEffect(() => {
    const close = (e) => {if (switcherRef.current && !switcherRef.current.contains(e.target)) setSwitcherOpen(false);};
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const portals = [
  { id: "admin", label: "Admin", desc: "Operations, security, identity", icon: "shield", accent: "var(--brand-fg)" },
  { id: "audit", label: "Audit & Compliance", desc: "Recordings, reports, evidence", icon: "file-text", accent: "var(--success-fg)" },
  { id: "enduser", label: "End user", desc: "My access & sessions", icon: "people", accent: "var(--fg-2)" }];

  const current = portals.find((p) => p.id === currentPortal) || portals[0];

  return (
    <header style={{
      height: "var(--topbar-h)",
      borderBottom: "1px solid var(--border)",
      background: "var(--bg-app)",
      display: "flex", alignItems: "center", gap: 12,
      padding: "0 20px", flex: "none"
    }}>
      {/* Portal switcher */}
      <div ref={switcherRef} style={{ position: "relative" }}>
        <button className="btn btn-ghost" onClick={() => setSwitcherOpen(!switcherOpen)} style={{
          padding: "6px 10px", gap: 8,
          background: switcherOpen ? "var(--bg-surface-2)" : "transparent",
          border: "1px solid var(--border)"
        }}>
          <Icon name={current.icon} size={14} color={current.accent} />
          <span style={{ font: "600 13px/1 var(--font-sans)", color: "var(--fg-1)" }}>{current.label}</span>
          <Icon name="chevron-down" size={13} color="var(--fg-4)" />
        </button>
        {switcherOpen &&
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0,
          width: 320, background: "var(--bg-surface)",
          border: "1px solid var(--border)", borderRadius: 8,
          boxShadow: "var(--shadow-lg)", padding: 6, zIndex: 30
        }}>
            <div style={{ padding: "8px 10px 6px", font: "500 10.5px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.7 }}>Switch portal</div>
            {portals.map((p) => {
            const active = p.id === currentPortal;
            return (
              <button key={p.id} onClick={() => {onPortalChange(p.id);setSwitcherOpen(false);}} style={{
                display: "flex", alignItems: "center", gap: 12, width: "100%",
                padding: 10, border: "none", background: active ? "var(--brand-soft)" : "transparent",
                borderRadius: 6, cursor: "pointer", textAlign: "left",
                marginBottom: 2
              }}
              onMouseEnter={(e) => {if (!active) e.currentTarget.style.background = "var(--bg-surface-hover)";}}
              onMouseLeave={(e) => {if (!active) e.currentTarget.style.background = "transparent";}}>
                
                  <div style={{ width: 32, height: 32, borderRadius: 6, background: "var(--bg-surface-2)", color: p.accent, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                    <Icon name={p.icon} size={15} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ font: "600 13px/1.3 var(--font-sans)", color: active ? "var(--brand-fg)" : "var(--fg-1)" }}>{p.label}</div>
                    <div style={{ fontSize: 11.5, color: "var(--fg-4)", marginTop: 1 }}>{p.desc}</div>
                  </div>
                  {active && <Icon name="check" size={14} color="var(--brand-fg)" />}
                </button>);

          })}
          </div>
        }
      </div>

      {pageTitle &&
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 600, color: "var(--fg-1)" }}>
          {pageTitle}
        </div>
      }
      <div style={{ flex: 1 }} />

      {/* Break-glass */}
      {currentPortal === "admin" && (() => {
        const bg = window.useBreakGlass ? window.useBreakGlass() : null;
        const active = bg && bg.active;
        return (
          <button className="btn" onClick={() => { if (!window.bgStore) return; active ? window.bgStore.openMonitor() : window.bgStore.openTrigger(); }} style={{
            background: active ? "#7B3EA8" : "color-mix(in oklch, #7B3EA8 13%, transparent)",
            color: active ? "#fff" : "#7B3EA8",
            borderColor: "transparent", fontWeight: 600, position: "relative",
            animation: active ? "bgPulse 2s infinite" : "none"
          }}>
            <Icon name="fire" size={13} /> {active ? "Active break-glass" : "Break-glass"}
            {active && <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#fff", marginLeft: 2 }}/>}
          </button>
        );
      })()}

      <button className="btn btn-ghost" onClick={onOpenSearch} style={{
        justifyContent: "flex-start",
        background: "var(--bg-surface-2)", borderColor: "var(--border)",
        color: "var(--fg-3)", fontWeight: 400, width: "300px"
      }}>
        <Icon name="search" size={14} />
        <span style={{ flex: 1, textAlign: "left" }}>Search resources, users, sessions…</span>
        <span className="kbd">⌘K</span>
      </button>
      <button className="btn btn-ghost btn-icon" title="Toggle theme" onClick={onToggleTheme}>
        <Icon name={theme === "dark" ? "sun" : "moon"} size={15} />
      </button>
      <button className="btn btn-ghost btn-icon" title="Notifications">
        <Icon name="bell" size={15} />
      </button>
      <div style={{ width: 1, height: 22, background: "var(--border)" }} />
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 4px 4px 4px", borderRadius: 6, cursor: "pointer" }}>
        <Avatar name={user.name} size={26} />
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
          <span style={{ font: "600 12.5px/1.2 var(--font-sans)", color: "var(--fg-1)" }}>{user.name}</span>
          <span style={{ font: "400 11px/1.2 var(--font-sans)", color: "var(--fg-4)" }}>{user.role} · {user.org}</span>
        </div>
        <Icon name="chevron-down" size={14} color="var(--fg-4)" />
      </div>
    </header>);

};

// Page header with breadcrumb + actions
const PageHeader = ({ breadcrumb = [], title, description, actions }) =>
<div style={{ padding: "20px 24px 0", borderBottom: "1px solid var(--border)" }}>
    {breadcrumb.length > 0 &&
  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, fontSize: 12, color: "var(--fg-4)" }}>
        {breadcrumb.map((b, i) =>
    <React.Fragment key={i}>
            <span style={{ color: i === breadcrumb.length - 1 ? "var(--fg-2)" : "var(--fg-4)" }}>{b}</span>
            {i < breadcrumb.length - 1 && <Icon name="chevron-right" size={11} color="var(--fg-5)" />}
          </React.Fragment>
    )}
      </div>
  }
    <div style={{ display: "flex", alignItems: "flex-start", gap: 16, paddingBottom: 16 }}>
      <div style={{ flex: 1 }}>
        <h1 className="h-title">{title}</h1>
        {description && <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--fg-3)" }}>{description}</p>}
      </div>
      {actions && <div style={{ display: "flex", gap: 8 }}>{actions}</div>}
    </div>
  </div>;


// Empty state
const EmptyState = ({ icon = "info", title, description, action }) =>
<div style={{
  padding: "64px 32px", textAlign: "center",
  display: "flex", flexDirection: "column", alignItems: "center", gap: 12
}}>
    <div style={{
    width: 48, height: 48, borderRadius: 12,
    background: "var(--bg-surface-2)", border: "1px solid var(--border)",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "var(--fg-3)"
  }}>
      <Icon name={icon} size={22} />
    </div>
    <div style={{ font: "600 15px/1.4 var(--font-sans)", color: "var(--fg-1)" }}>{title}</div>
    {description && <div style={{ font: "400 13px/1.5 var(--font-sans)", color: "var(--fg-3)", maxWidth: 380 }}>{description}</div>}
    {action && <div style={{ marginTop: 4 }}>{action}</div>}
  </div>;


Object.assign(window, { Sidebar, Topbar, PageHeader, EmptyState, NAV_GROUPS });