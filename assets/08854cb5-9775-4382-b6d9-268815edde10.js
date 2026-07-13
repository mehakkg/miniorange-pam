// App root — handles routing between login, wizard, and four portal views

// Import script tags for Sessions V2 components are added in index.html
// Components load to window scope via Object.assign

const App = () => {
  const [tweaks, setTweak] = useTweaks(/*EDITMODE-BEGIN*/{
    "theme": "light",
    "sidebarCollapsed": false,
    "emptyState": false,
    "stage": "app",
    "portal": "admin"
  }/*EDITMODE-END*/);

  // Apply theme to document
  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", tweaks.theme);
  }, [tweaks.theme]);

  const [stage, setStage] = React.useState(tweaks.stage || "app");
  React.useEffect(() => { if (tweaks.stage) setStage(tweaks.stage); }, [tweaks.stage]);

  // Emergency entry — reachable via the bookmarkable #emergency hash (stands
  // in for the /emergency path in this static prototype) or the global
  // window.__enterEmergency() hook used from in-app entry points. Renders the
  // dedicated dark flow with no standard PAM chrome.
  // Emergency entry is reachable two ways: the clean bookmarkable path
  // /emergency (a Vercel rewrite serves index.html there) or the #emergency
  // hash fallback. Either matches.
  const readEmergency = () => typeof window !== "undefined" && (/emergency/i.test(window.location.hash) || /\/emergency\/?$/i.test(window.location.pathname));
  const [emergency, setEmergency] = React.useState(readEmergency());
  const [emStart, setEmStart] = React.useState("login");   // "login" (direct URL) | "form" (Path B, already authed)
  const [emRedirect, setEmRedirect] = React.useState(false);
  React.useEffect(() => {
    const onHash = () => setEmergency(readEmergency());
    window.addEventListener("hashchange", onHash);
    window.__enterEmergency = () => { try { window.location.hash = "emergency"; } catch (e) {} setEmStart("login"); setEmergency(true); };
    // Path B — standard-login → emergency redirect. Demo trigger surfaces the
    // modal-priority card over the normal shell.
    window.__emShowRedirect = () => setEmRedirect(true);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const [portal, setPortal] = React.useState(tweaks.portal || "admin");
  React.useEffect(() => { if (tweaks.portal) setPortal(tweaks.portal); }, [tweaks.portal]);

  // Per-portal active nav state
  const [adminNav,    setAdminNav]    = React.useState("dashboard");
  const [auditNav,    setAuditNav]    = React.useState("audit-dashboard");
  const [endpointNav, setEndpointNav] = React.useState("ep-dashboard");
  const [enduserNav,  setEnduserNav]  = React.useState("eu-dashboard");

  const [openResource, setOpenResource] = React.useState(null);
  const [showAddPanel, setShowAddPanel] = React.useState(false);
  const [showScan, setShowScan] = React.useState(false);

  // User identity changes per portal
  const userByPortal = {
    admin:    { name: "Aria Chen",    role: "Security Admin",    org: "Northwind Financial" },
    audit:    { name: "Dana Whitley", role: "Compliance Auditor", org: "Northwind Financial" },
    endpoint: { name: "Marcus Reed",  role: "Endpoint Engineer",  org: "Northwind Financial" },
    enduser:  { name: "Priya Shah",   role: "Senior Developer",   org: "Northwind Financial" },
  };
  const user = userByPortal[portal];

  const onPortalChange = (id) => {
    setPortal(id);
    setTweak("portal", id);
    setOpenResource(null);
  };

  // Tweaks panel
  const tweaksUI = (
    <TweaksPanel title="Tweaks">
      <TweakSection title="Appearance">
        <TweakRadio label="Theme" value={tweaks.theme} onChange={v => setTweak("theme", v)}
          options={[{ value: "light", label: "Light" }, { value: "dark", label: "Dark" }]}/>
        <TweakToggle label="Collapsed sidebar" value={tweaks.sidebarCollapsed} onChange={v => setTweak("sidebarCollapsed", v)}/>
      </TweakSection>
      <TweakSection title="Data state">
        <TweakToggle label="Show empty states" value={tweaks.emptyState} onChange={v => setTweak("emptyState", v)} hint="Toggle on to see first-run / no-data UI"/>
      </TweakSection>
      <TweakSection title="Portal">
        <TweakSelect label="Active portal" value={portal} onChange={v => onPortalChange(v)}
          options={[
            { value: "admin",    label: "Admin" },
            { value: "audit",    label: "Audit & Compliance" },
            { value: "endpoint", label: "Endpoint Security" },
            { value: "enduser",  label: "End user" },
          ]}/>
      </TweakSection>
      <TweakSection title="Flow">
        <TweakRadio label="Stage" value={stage} onChange={v => { setStage(v); setTweak("stage", v); }}
          options={[
            { value: "login",  label: "Login" },
            { value: "wizard", label: "Wizard" },
            { value: "app",    label: "App" },
          ]}/>
      </TweakSection>
    </TweaksPanel>
  );

  // ---- Emergency entry (intercepts everything) ----
  if (emergency && window.EmergencyEntryFlow) {
    return React.createElement(window.EmergencyEntryFlow, {
      startScreen: emStart,
      onExit: () => {
        try {
          if (window.location.hash) window.location.hash = "";
          // If we arrived via the /emergency path, drop back to root so the
          // standard app shows and a refresh won't re-enter emergency mode.
          if (/\/emergency\/?$/i.test(window.location.pathname)) window.history.replaceState({}, "", "/");
        } catch (e) {}
        setEmStart("login"); setEmergency(false);
      },
    });
  }

  // ---- Login stage ----
  if (stage === "login") {
    return <>
      <LoginScreen onSuccess={() => { setStage("wizard"); setTweak("stage", "wizard"); }}/>
      {tweaksUI}
    </>;
  }

  // ---- Wizard stage ----
  if (stage === "wizard") {
    return <>
      <WizardHost onComplete={() => { setStage("app"); setTweak("stage", "app"); }}
                  onSkip={() => { setStage("app"); setTweak("stage", "app"); }}/>
      {tweaksUI}
    </>;
  }

  // ---- Admin portal screens ----
  const renderAdmin = () => {
    if (showScan) return <NetworkScanFlow onClose={() => setShowScan(false)} onAddSelected={() => { setShowScan(false); }}/>;
    if (openResource) return <ResourceDetailV2 resource={openResource} onBack={() => setOpenResource(null)}/>;
    switch (adminNav) {
      case "dashboard":    return <DashboardScreen/>;
      case "tickets":      return <TicketsScreenV2 empty={tweaks.emptyState}/>;
      case "resources":    return <ResourcesV2List empty={tweaks.emptyState} onOpen={setOpenResource} onAdd={() => setShowAddPanel(true)} onScan={() => setShowScan(true)}/>;
      case "credentials":  return <CredentialsV2 empty={tweaks.emptyState}/>;
      case "people":       return <PeopleV2 empty={tweaks.emptyState}/>;
      case "policies":     return <PoliciesV2 empty={tweaks.emptyState}/>;
      case "allocation":   return <AllocationScreenV2 empty={tweaks.emptyState}/>;
      case "discovery":    return <DiscoveryScreen empty={tweaks.emptyState}/>;
      case "sessions":     return React.createElement(window.SessionsScreenV2 || (() => null));
      case "ep-dashboard": return <EndpointDashboard/>;
      case "ep-apps":      return <EndpointAppsScreen empty={tweaks.emptyState}/>;
      case "ep-policies":  return <EndpointPoliciesScreen empty={tweaks.emptyState}/>;
      case "ep-devices":   return <EndpointDevicesScreen empty={tweaks.emptyState}/>;
      case "ep-audits":    return <EndpointAuditsScreen empty={tweaks.emptyState}/>;
      case "ep-tickets":   return <EndpointTicketsScreen empty={tweaks.emptyState}/>;
      case "certificates": return <CertificatesV2 empty={tweaks.emptyState}/>;
      case "auth":         return <AuthenticationScreen empty={tweaks.emptyState}/>;
      case "twofactor":    return <TwoFactorScreen/>;
      case "breakglass":   return React.createElement(window.BGDashboard || (() => null));
      case "ztna":         return React.createElement(window.ZTNAConnectorsPage || (() => null));
      case "settings":     return <SettingsScreen/>;
      case "customization":return <CustomizationScreen/>;
      default:             return <DashboardScreen/>;
    }
  };

  // ---- Audit portal screens ----
  const renderAudit = () => {
    switch (auditNav) {
      case "audit-dashboard": return <AuditDashboardScreen/>;
      case "audit-reports":   return <StubScreen title="Reports" description="Generated compliance reports — SOC 2, PCI-DSS, ISO 27001, HIPAA. Filter by framework, period, and control." icon="file-text"/>;
      case "audit-sessions":  return React.createElement(window.SessionsScreenV2 || (() => null));
      case "audit-scheduled": return <StubScreen title="Scheduled reports" description="Automated report generation and delivery — weekly, monthly, quarterly cadences with email distribution lists." icon="clock"/>;
      case "audit-evidence":  return <EvidenceBundlesScreen/>;
      default:                return <AuditDashboardScreen/>;
    }
  };

  // ---- Endpoint Security portal screens ----
  const renderEndpoint = () => {
    switch (endpointNav) {
      case "ep-dashboard": return <EndpointDashboard/>;
      case "ep-apps":      return <EndpointAppsScreen empty={tweaks.emptyState}/>;
      case "ep-policies":  return <EndpointPoliciesScreen empty={tweaks.emptyState}/>;
      case "ep-devices":   return <EndpointDevicesScreen empty={tweaks.emptyState}/>;
      case "ep-audits":    return <EndpointAuditsScreen empty={tweaks.emptyState}/>;
      case "ep-tickets":   return <EndpointTicketsScreen empty={tweaks.emptyState}/>;
      default:             return <EndpointDashboard/>;
    }
  };

  // ---- End user portal screens ----
  const renderEndUser = () => {
    switch (enduserNav) {
      case "eu-dashboard": return <EndUserDashboard/>;
      case "eu-resources": return <MyResourcesScreen empty={tweaks.emptyState}/>;
      case "eu-tickets":   return <TicketsScreenV3 empty={tweaks.emptyState} defaultView="mine" personaLock="enduser"/>;
      case "eu-settings":  return <EndUserSettingsScreen/>;
      default:             return <EndUserDashboard/>;
    }
  };

  // Pick sidebar + content per portal
  let sidebar, main, screenLabel;
  if (portal === "admin") {
    sidebar = <Sidebar
      active={adminNav}
      onNav={(id) => { setAdminNav(id); setOpenResource(null); }}
      collapsed={tweaks.sidebarCollapsed}
      onToggleCollapse={() => setTweak("sidebarCollapsed", !tweaks.sidebarCollapsed)}
    />;
    main = renderAdmin();
    screenLabel = "Admin Portal";
  } else if (portal === "audit") {
    sidebar = <AuditSidebarV2
      active={auditNav}
      onNav={setAuditNav}
      collapsed={tweaks.sidebarCollapsed}
    />;
    main = <AuditPortalV2 nav={auditNav}/>;
    screenLabel = "Audit Portal";
  } else if (portal === "endpoint") {
    sidebar = <EndpointSidebar
      active={endpointNav}
      onNav={setEndpointNav}
      collapsed={tweaks.sidebarCollapsed}
    />;
    main = renderEndpoint();
    screenLabel = "Endpoint Security Portal";
  } else {
    sidebar = <EndUserSidebar
      active={enduserNav}
      onNav={setEnduserNav}
      collapsed={tweaks.sidebarCollapsed}
    />;
    main = renderEndUser();
    screenLabel = "End User Portal";
  }

  return <>
    <div style={{
      display: "flex", height: "100vh", width: "100vw",
      background: "var(--bg-app)", color: "var(--fg-1)",
      overflow: "hidden",
    }} data-screen-label={screenLabel}>
      {sidebar}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
        <Topbar
          user={user}
          theme={tweaks.theme}
          onToggleTheme={() => setTweak("theme", tweaks.theme === "dark" ? "light" : "dark")}
          onOpenSearch={() => {}}
          currentPortal={portal}
          onPortalChange={onPortalChange}
        />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, background: "var(--bg-app)" }}>
          {main}
        </div>
      </div>
    </div>
    {tweaksUI}
    {portal === "admin" && window.BreakGlassController && React.createElement(window.BreakGlassController)}
    {portal === "admin" && window.ZTNAController && React.createElement(window.ZTNAController)}
    {emRedirect && window.EmRedirectModal && React.createElement(window.EmRedirectModal, {
      onGo: () => { setEmRedirect(false); setEmStart("form"); setEmergency(true); },
      onDismiss: () => setEmRedirect(false),
    })}
    {showAddPanel && <ResourceAddPanel
      onClose={(intent) => {
        setShowAddPanel(false);
        if (intent === "scan") setShowScan(true);
      }}
      onCreated={(data) => { setShowAddPanel(false); }}
    />}
  </>;
};

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
