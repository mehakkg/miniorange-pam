// ZTNA Connectors — sites, connectors, and the health signals that flow from
// them to resources and the dashboard. Phase 1 builds the management surface
// (Surface A) and the concept explainer (Surface C). Phase 2 will wire the
// setup flow (Surface D) and resource-side integration (Surface E); Phase 3
// covers resource-detail health (Surface F) and failure/recovery states
// (Surface G).
//
// Every color and pattern here maps to existing PAM design tokens — no new
// tokens introduced. Health palette:
//   Online     → var(--success-fg) (~#0F6E56 teal)
//   Degraded   → var(--warning-fg) (~#B8560A amber)
//   Offline    → var(--danger-fg)  (~#C0392B red)
//   Not-enrolled → var(--fg-4)     (~#6B6966 gray)

const ZTNA_HEARTBEAT_WINDOW_MS = 90 * 1000;   // >90s since last heartbeat → offline
const ZTNA_CERT_EXPIRING_DAYS  = 30;

// =========================================================
// STORE
// =========================================================
(function () {
  const listeners = new Set();
  const now = new Date("2026-07-09T10:00:00Z").getTime();  // stable "now" for demo

  const store = {
    sites: [
      { id: "site-mumbai",    name: "AWS Mumbai VPC",       environment: "AWS",     region: "ap-south-1",  description: "Primary APAC region — ledger + auth + reporting DBs live here.", createdAt: now - 45 * 86400000, preferredConnectorId: "conn-mumbai-1" },
      { id: "site-frankfurt", name: "On-prem Frankfurt DC", environment: "On-prem", region: "eu-central-1", description: "European data-residency workloads.", createdAt: now - 21 * 86400000, preferredConnectorId: null },
      { id: "site-tokyo",     name: "Azure Tokyo",          environment: "Azure",   region: "japaneast",    description: "Recently added — no connector deployed yet.",                  createdAt: now - 2 * 86400000, preferredConnectorId: null },
    ],

    connectors: [
      { id: "conn-mumbai-1",    siteId: "site-mumbai",    name: "mumbai-connector-01",    platform: "Linux",   lastHeartbeatMs: now - 12_000,         certExpiresAt: now + 305 * 86400000, heartbeatIntervalSec: 60, latencyMs: 42 },
      { id: "conn-mumbai-2",    siteId: "site-mumbai",    name: "mumbai-connector-02",    platform: "Linux",   lastHeartbeatMs: now - (2 * 3600 * 1000 + 14 * 60000), certExpiresAt: now + 195 * 86400000, heartbeatIntervalSec: 60, latencyMs: null },
      { id: "conn-frankfurt-1", siteId: "site-frankfurt", name: "frankfurt-connector-01", platform: "Linux",   lastHeartbeatMs: now - 8_000,          certExpiresAt: now + 12 * 86400000,  heartbeatIntervalSec: 60, latencyMs: 68 },
    ],

    // Resource → site assignments. Populated fully in Phase 2 (from resource
    // wizard) — seeded now so the summary strip and site cards show meaningful
    // "resources using this site" counts and reachability.
    resourceAssignments: [
      { resource: "prod-db-primary",    siteId: "site-mumbai" },
      { resource: "auth-server-01",     siteId: "site-mumbai" },
      { resource: "oracle-reporting",   siteId: "site-mumbai" },
      { resource: "dev-web-portal",     siteId: "site-frankfurt" },
      { resource: "ledger-mongo-cluster", siteId: "site-frankfurt" },
    ],

    // Health events — populated over time as connectors change state.
    events: [
      { ts: now - 8_000,                                       siteId: "site-frankfurt", connectorId: "conn-frankfurt-1", kind: "heartbeat", message: "Heartbeat received" },
      { ts: now - 12_000,                                      siteId: "site-mumbai",    connectorId: "conn-mumbai-1",    kind: "heartbeat", message: "Heartbeat received" },
      { ts: now - (2 * 3600 * 1000 + 14 * 60000),              siteId: "site-mumbai",    connectorId: "conn-mumbai-2",    kind: "offline",   message: "Connector went offline — heartbeat window exceeded" },
      { ts: now - 3 * 86400000,                                siteId: "site-mumbai",    connectorId: "conn-mumbai-1",    kind: "cert-renew", message: "Certificate renewed" },
      { ts: now - 5 * 86400000,                                siteId: "site-frankfurt", connectorId: "conn-frankfurt-1", kind: "created",   message: "Connector enrolled" },
    ],

    // Panel state — the ZTNA surface uses several slide-in and full-page
    // routes. Panel type + payload is centralized here so any component can
    // command navigation.
    open: null,          // 'concept' | 'site-detail' | 'setup-flow' | 'cert-renew' | 'troubleshoot'
    detailSiteId: null,
    renewConnectorId: null,
    troubleConnectorId: null,

    // Setup flow state (Surface D). Populated when open === "setup-flow".
    setup: null,         // { entry: "new-site" | "existing-site", step, siteId, siteDraft, connectorDrafts[], heartbeatSec, certMonths, deployments[], status }

    emit: () => listeners.forEach(fn => fn()),
    subscribe: (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
    getNow: () => now,   // deterministic clock for the demo

    // ── mutators ───────────────────────────────────────────
    openConcept:      () => { store.open = "concept";      store.emit(); },
    openSiteDetail:   (id) => { store.detailSiteId = id; store.open = "site-detail"; store.emit(); },
    openRenew:        (connId) => { store.renewConnectorId = connId; store.open = "cert-renew"; store.emit(); },
    openTroubleshoot: (connId) => { store.troubleConnectorId = connId; store.open = "troubleshoot"; store.emit(); },
    // Demo helper — flips an offline connector back online, as if the admin
    // restarted the process and its heartbeat resumed. The troubleshoot
    // panel's live-status poll picks this up on its next tick.
    simulateReconnect: (connId) => {
      store.connectors = store.connectors.map(c => c.id === connId ? { ...c, lastHeartbeatMs: now, latencyMs: 51 } : c);
      const c = store.connectors.find(cc => cc.id === connId);
      if (c) store.events = [{ ts: now, siteId: c.siteId, connectorId: connId, kind: "heartbeat", message: "Connector reconnected — heartbeat resumed" }, ...store.events];
      store.emit();
    },
    // Setup flow entry points:
    //   openSetupNewSite()          — full 4-step flow, starting at Create site
    //   openSetupExistingSite(id)   — 3-step flow (Configure → Deploy → Confirm) for an already-created site
    openSetupNewSite: () => {
      store.setup = { entry: "new-site", step: 1, siteDraft: { name: "", environment: "AWS", region: "", description: "" }, connectorDrafts: [{ name: "", platform: "Linux" }], heartbeatSec: 60, certMonths: 12, deployments: null, status: "idle" };
      store.open = "setup-flow";
      store.emit();
    },
    openSetupExistingSite: (siteId) => {
      const site = store.sites.find(s => s.id === siteId);
      store.setup = { entry: "existing-site", step: 1, siteId, siteDraft: site, connectorDrafts: [{ name: "", platform: "Linux" }], heartbeatSec: 60, certMonths: 12, deployments: null, status: "idle" };
      store.open = "setup-flow";
      store.emit();
    },
    setupUpdate: (patch) => { store.setup = { ...store.setup, ...patch }; store.emit(); },
    setupUpdateSite: (patch) => { store.setup = { ...store.setup, siteDraft: { ...store.setup.siteDraft, ...patch } }; store.emit(); },
    // Multi-connector drafts: a site can be created with several connectors
    // in one run (redundancy from day one). Each draft is name + platform;
    // heartbeat and cert validity are shared across the batch.
    setupUpdateConnectorAt: (idx, patch) => {
      store.setup = { ...store.setup, connectorDrafts: store.setup.connectorDrafts.map((d, i) => i === idx ? { ...d, ...patch } : d) };
      store.emit();
    },
    setupAddConnectorDraft: () => {
      store.setup = { ...store.setup, connectorDrafts: [...store.setup.connectorDrafts, { name: "", platform: "Linux" }] };
      store.emit();
    },
    setupRemoveConnectorDraft: (idx) => {
      if (store.setup.connectorDrafts.length <= 1) return;   // a site needs at least one connector
      store.setup = { ...store.setup, connectorDrafts: store.setup.connectorDrafts.filter((_, i) => i !== idx) };
      store.emit();
    },
    setupNext: () => { store.setup = { ...store.setup, step: store.setup.step + 1 }; store.emit(); },
    setupBack: () => { store.setup = { ...store.setup, step: Math.max(1, store.setup.step - 1) }; store.emit(); },
    _mintToken: (siteId, connectorId) =>
      `eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify({ site: siteId, connector: connectorId, iat: Date.now(), exp: Date.now() + 24 * 3600 * 1000 })).replace(/=+$/, "")}.demo-signature-${Math.random().toString(36).slice(2, 10)}`,
    // Generate one enrollment token PER connector draft; persist the site +
    // all connector records so "deploy later" keeps everything in
    // Not-enrolled state rather than silently discarding.
    setupGenerateToken: () => {
      const s = store.setup;
      let siteId = s.siteId;
      if (s.entry === "new-site" && !siteId) {
        siteId = "site-" + Math.random().toString(36).slice(2, 8);
        store.sites = [...store.sites, { id: siteId, name: s.siteDraft.name, environment: s.siteDraft.environment, region: s.siteDraft.region, description: s.siteDraft.description, createdAt: now, preferredConnectorId: null }];
      }
      const deployments = s.connectorDrafts.map(d => {
        const connectorId = "conn-" + Math.random().toString(36).slice(2, 8);
        store.connectors = [...store.connectors, {
          id: connectorId, siteId, name: d.name, platform: d.platform,
          heartbeatIntervalSec: s.heartbeatSec,
          lastHeartbeatMs: 0,               // offline until first heartbeat
          certExpiresAt: now + s.certMonths * 30 * 86400000,
          latencyMs: null, enrolling: true,
        }];
        return { connectorId, name: d.name, platform: d.platform, token: store._mintToken(siteId, connectorId), status: "waiting" };
      });
      store.setup = { ...store.setup, siteId, deployments, step: s.entry === "new-site" ? 3 : 2, status: "waiting", waitStartTs: Date.now() };
      // Simulate each connector dialing in, staggered so multi-connector runs
      // show individual progress rather than all flipping at once.
      store._setupTimers = deployments.map((d, i) => setTimeout(() => store._completeDeployment(d.connectorId), 6000 + i * 2500));
      store.emit();
    },
    _completeDeployment: (connectorId) => {
      const s = store.setup;
      if (!s || !s.deployments || !s.deployments.some(d => d.connectorId === connectorId)) return;
      store.connectors = store.connectors.map(c => c.id === connectorId ? { ...c, lastHeartbeatMs: now, enrolling: false, latencyMs: 45 } : c);
      store.events = [{ ts: now, siteId: s.siteId, connectorId, kind: "created", message: "Connector enrolled" }, ...store.events];
      const deployments = s.deployments.map(d => d.connectorId === connectorId ? { ...d, status: "connected" } : d);
      const allConnected = deployments.every(d => d.status === "connected");
      store.setup = { ...s, deployments, status: allConnected ? "connected" : s.status };
      store.emit();
      if (allConnected) {
        setTimeout(() => {
          if (!store.setup || store.setup.siteId !== s.siteId) return;
          store.setup = { ...store.setup, step: store.setup.entry === "new-site" ? 4 : 3 };
          store.emit();
        }, 1500);
      }
    },
    setupForceTimeout: () => {
      if (!store.setup) return;
      store.setup = { ...store.setup, status: "timeout" };
      store.emit();
    },
    setupRegenerateToken: (connectorId) => {
      if (!store.setup || !store.setup.deployments) return;
      store.setup = { ...store.setup, deployments: store.setup.deployments.map(d => d.connectorId === connectorId ? { ...d, token: store._mintToken(store.setup.siteId, connectorId) } : d), status: "waiting" };
      store.emit();
    },
    setupSimulateConnect: (connectorId) => {
      // Demo override. With an id → connect that one; without → connect all
      // outstanding ones.
      if (!store.setup || !store.setup.deployments) return;
      (store._setupTimers || []).forEach(t => clearTimeout(t));
      store._setupTimers = [];
      const targets = connectorId ? [connectorId] : store.setup.deployments.filter(d => d.status === "waiting").map(d => d.connectorId);
      targets.forEach(id => store._completeDeployment(id));
    },

    // ── deletion ───────────────────────────────────────────
    // Destructive paths are commanded from confirm modals in the UI — the
    // store just executes and logs. Deleting a connector revokes its cert
    // (record removal implies revocation in this prototype).
    deleteConnector: (connId) => {
      const c = store.connectors.find(cc => cc.id === connId);
      if (!c) return;
      store.connectors = store.connectors.filter(cc => cc.id !== connId);
      // Clear preferred-connector pointers at both levels.
      store.sites = store.sites.map(s => s.preferredConnectorId === connId ? { ...s, preferredConnectorId: null } : s);
      store.events = [{ ts: now, siteId: c.siteId, connectorId: connId, kind: "deleted", message: `Connector ${c.name} deleted — certificate revoked` }, ...store.events];
      if (store.renewConnectorId === connId) { store.renewConnectorId = null; store.open = null; }
      if (store.troubleConnectorId === connId) { store.troubleConnectorId = null; store.open = null; }
      store.emit();
    },
    deleteSite: (siteId) => {
      const site = store.sites.find(s => s.id === siteId);
      if (!site) return;
      store.sites = store.sites.filter(s => s.id !== siteId);
      store.connectors = store.connectors.filter(c => c.siteId !== siteId);
      // Resources assigned here lose their ZTNA routing — they will surface
      // as unrouted, not silently rerouted somewhere else.
      store.resourceAssignments = store.resourceAssignments.filter(a => a.siteId !== siteId);
      store.events = store.events.filter(e => e.siteId !== siteId);
      if (store.detailSiteId === siteId) { store.detailSiteId = null; store.open = null; }
      store.emit();
    },
    setSitePreferredConnector: (siteId, connId) => {
      store.sites = store.sites.map(s => s.id === siteId ? { ...s, preferredConnectorId: connId || null } : s);
      store.emit();
    },
    // Certificate renewal simulation
    renewGenerate: (months) => {
      const c = store.connectors.find(cc => cc.id === store.renewConnectorId);
      if (!c) return;
      store.renewMonths = months;
      store.renewStatus = "waiting";
      store.emit();
      setTimeout(() => {
        if (store.renewConnectorId !== c.id) return;
        store.connectors = store.connectors.map(cc => cc.id === c.id ? { ...cc, certExpiresAt: now + months * 30 * 86400000 } : cc);
        store.events = [{ ts: now, siteId: c.siteId, connectorId: c.id, kind: "cert-renew", message: `Certificate renewed — valid ${months} months` }, ...store.events];
        store.renewStatus = "done";
        store.emit();
      }, 4000);
    },
    close: () => {
      (store._setupTimers || []).forEach(t => clearTimeout(t));
      store._setupTimers = [];
      store.open = null; store.detailSiteId = null; store.renewConnectorId = null;
      store.troubleConnectorId = null;
      store.renewStatus = null; store.renewMonths = null;
      // Leave setup state intact if the flow is in "waiting" state — user
      // chose deploy-later. Otherwise clear it so a fresh flow starts clean.
      if (store.setup && store.setup.status !== "waiting" && store.setup.status !== "timeout") store.setup = null;
      store.emit();
    },

    // ── health computation ─────────────────────────────────
    // Connector status is derived from lastHeartbeatMs + cert data. Sites
    // aggregate their connectors' status per the spec's roll-up rules.
    connectorStatus: (c) => {
      if (!c) return "unknown";
      const stale = (now - c.lastHeartbeatMs) > ZTNA_HEARTBEAT_WINDOW_MS;
      if (stale) return "offline";
      if (c.certExpiresAt <= now) return "cert-expired";
      if (c.latencyMs != null && c.latencyMs > 500) return "degraded";
      return "online";
    },
    certDaysLeft: (c) => Math.floor((c.certExpiresAt - now) / 86400000),
    certExpiringSoon: (c) => store.certDaysLeft(c) <= ZTNA_CERT_EXPIRING_DAYS && store.certDaysLeft(c) > 0,

    siteConnectors: (siteId) => store.connectors.filter(c => c.siteId === siteId),
    siteResources:  (siteId) => store.resourceAssignments.filter(a => a.siteId === siteId),
    siteStatus: (siteId) => {
      const conns = store.siteConnectors(siteId);
      if (conns.length === 0) return "not-enrolled";
      const statuses = conns.map(c => store.connectorStatus(c));
      if (statuses.every(s => s === "offline" || s === "cert-expired")) return "offline";
      if (statuses.some(s => s === "offline"))                            return "partial";
      if (statuses.some(s => s === "degraded" || s === "cert-expired"))   return "degraded";
      return "online";
    },
    // Given a resource assigned to a site, its reachability is determined by
    // whether the site has at least one online connector.
    resourceReachable: (siteId) => {
      const conns = store.siteConnectors(siteId);
      return conns.some(c => store.connectorStatus(c) === "online");
    },

    fmtHeartbeat: (c) => {
      const s = Math.floor((now - c.lastHeartbeatMs) / 1000);
      if (s < 60)   return `${s} sec ago`;
      if (s < 3600) return `${Math.floor(s / 60)} min ${s % 60} sec ago`;
      const h = Math.floor(s / 3600);
      const m = Math.floor((s % 3600) / 60);
      return `${h}h ${m}m ago`;
    },
    fmtCert: (c) => {
      const d = store.certDaysLeft(c);
      if (d <= 0) return "Expired";
      if (d < 30) return `Expires in ${d} days`;
      return `Expires ${new Date(c.certExpiresAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}`;
    },
    fmtRelDate: (ts) => {
      const s = Math.floor((now - ts) / 1000);
      if (s < 60)     return `${s} sec ago`;
      if (s < 3600)   return `${Math.floor(s / 60)} min ago`;
      if (s < 86400)  return `${Math.floor(s / 3600)}h ago`;
      return `${Math.floor(s / 86400)}d ago`;
    },
  };

  window.ztnaStore = store;
  window.useZtna = function () {
    const [, force] = React.useReducer(x => x + 1, 0);
    React.useEffect(() => store.subscribe(force), []);
    return store;
  };
})();

// =========================================================
// SHARED HEALTH VISUALS
// =========================================================

// Palette lookup — one place, keyed by status string.
const ZTNA_STATUS = {
  online:        { dot: "var(--success-fg)", fg: "var(--success-fg)", bg: "var(--success-soft)", label: "Online",       glyph: "●" },
  degraded:      { dot: "var(--warning-fg)", fg: "var(--warning-fg)", bg: "var(--warning-soft)", label: "Degraded",     glyph: "●" },
  partial:       { dot: "var(--warning-fg)", fg: "var(--warning-fg)", bg: "var(--warning-soft)", label: "Partial",      glyph: "●" },
  offline:       { dot: "var(--danger-fg)",  fg: "var(--danger-fg)",  bg: "var(--danger-soft)",  label: "Offline",      glyph: "✗" },
  "not-enrolled":{ dot: "var(--fg-4)",       fg: "var(--fg-3)",       bg: "var(--bg-surface-2)", label: "Not enrolled", glyph: "○" },
  "cert-expired":{ dot: "var(--danger-fg)",  fg: "var(--danger-fg)",  bg: "var(--danger-soft)",  label: "Cert expired", glyph: "✗" },
};

const ZTNAStatusBadge = ({ status, size = "md" }) => {
  const s = ZTNA_STATUS[status] || ZTNA_STATUS["not-enrolled"];
  const pad = size === "sm" ? "1px 8px" : "3px 10px";
  const font = size === "sm" ? "500 11px/1.4" : "600 11.5px/1.4";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: pad, borderRadius: 999, background: s.bg, color: s.fg, font: `${font} var(--font-sans)` }}>
      <span aria-hidden="true">{s.glyph}</span> {s.label}
    </span>
  );
};

// Colored dot used inline (in tables, inside connector rows).
const ZTNADot = ({ status, size = 8 }) => {
  const s = ZTNA_STATUS[status] || ZTNA_STATUS["not-enrolled"];
  return <span style={{ width: size, height: size, borderRadius: "50%", background: s.dot, display: "inline-block", flex: "none" }}/>;
};

// Delete confirmation — consequence-forward, red only on the commit button.
// `consequence` is the line that spells out what breaks; keep it specific
// ("2 resources become unreachable"), never generic ("are you sure?").
const ZTNADeleteModal = ({ title, body, consequence, confirmLabel, onConfirm, onClose }) => (
  <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 340, background: "rgba(15,23,42,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
    <div onClick={e => e.stopPropagation()} style={{ width: 460, maxWidth: "94vw", background: "#fff", borderRadius: 8, boxShadow: "0 24px 60px rgba(0,0,0,0.35)", overflow: "hidden" }}>
      <div style={{ padding: "16px 20px 0" }}>
        <div style={{ font: "700 15px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{title}</div>
        <div style={{ font: "400 12.5px/1.5 var(--font-sans)", color: "var(--fg-3)", marginTop: 6 }}>{body}</div>
        {consequence && (
          <div style={{ marginTop: 12, padding: 10, background: "var(--danger-soft)", color: "var(--danger-fg)", borderLeft: "3px solid var(--danger-fg)", borderRadius: "0 4px 4px 0", font: "500 12px/1.5 var(--font-sans)" }}>
            {consequence}
          </div>
        )}
      </div>
      <div style={{ padding: "14px 20px", marginTop: 8, display: "flex", gap: 8, justifyContent: "flex-end", background: "var(--bg-surface)", borderTop: "1px solid var(--border)" }}>
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn" onClick={onConfirm} style={{ background: "var(--danger-fg)", color: "#fff", borderColor: "transparent", fontWeight: 600 }}>{confirmLabel}</button>
      </div>
    </div>
  </div>
);

// =========================================================
// CONCEPT EXPLAINER PANEL (Surface C)
// =========================================================
// Triggered from anywhere via ztnaStore.openConcept(). Not a modal —
// slides in from the right at 480px like other PAM detail panels.
const ZTNAConceptPanel = () => (
  <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.35)", display: "flex", justifyContent: "flex-end" }}
       onClick={() => window.ztnaStore.close()}>
    <aside onClick={e => e.stopPropagation()} style={{ width: 480, maxWidth: "100vw", background: "#fff", height: "100%", display: "flex", flexDirection: "column", boxShadow: "-24px 0 60px rgba(0,0,0,0.14)" }}>
      <div style={{ padding: "16px 22px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ flex: 1, font: "700 15px/1.2 var(--font-sans)", color: "var(--fg-1)" }}>How ZTNA connectors work</div>
        <button className="btn btn-ghost btn-icon" onClick={() => window.ztnaStore.close()} aria-label="Close"><Icon name="x" size={14}/></button>
      </div>

      <div className="scroll-area" style={{ flex: 1, overflow: "auto", padding: 22, display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Diagram — three roles connected by an outbound arrow */}
        <div style={{ padding: 18, background: "var(--bg-surface)", borderRadius: 8, border: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ width: 60, height: 60, borderRadius: 12, background: "var(--brand-soft)", color: "var(--brand-fg)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 6 }}>
                <Icon name="shield" size={24} color="var(--brand-fg)"/>
              </div>
              <div style={{ font: "600 11.5px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>PAM</div>
              <div className="t-tiny" style={{ color: "var(--fg-4)" }}>Cloud</div>
            </div>
            <div style={{ flex: 1.4, position: "relative", height: 60 }}>
              <div style={{ position: "absolute", top: "50%", left: 0, right: 0, borderTop: "2px dashed var(--brand-fg)", transform: "translateY(-50%)" }}/>
              <div style={{ position: "absolute", top: 4, left: "50%", transform: "translateX(-50%)", font: "500 10.5px/1 var(--font-sans)", color: "var(--brand-fg)", background: "var(--bg-surface)", padding: "0 6px" }}>
                Outbound tunnel
              </div>
              <div style={{ position: "absolute", bottom: 4, left: "50%", transform: "translateX(-50%)", font: "500 10.5px/1 var(--font-sans)", color: "var(--fg-3)" }}>← dials out</div>
            </div>
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ width: 60, height: 60, borderRadius: 12, background: "var(--bg-surface-2)", color: "var(--fg-2)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 6, border: "1px dashed var(--fg-4)" }}>
                <Icon name="server" size={24} color="var(--fg-2)"/>
              </div>
              <div style={{ font: "600 11.5px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>Connector</div>
              <div className="t-tiny" style={{ color: "var(--fg-4)" }}>Inside your network</div>
            </div>
          </div>
          <div style={{ marginTop: 14, padding: 10, background: "var(--success-soft)", borderRadius: 6, font: "500 12px/1.4 var(--font-sans)", color: "var(--success-fg)", textAlign: "center" }}>
            The connector dials <strong>OUT</strong>. No inbound ports required on your firewall.
          </div>
        </div>

        {/* Three-row explanation */}
        {[
          { n: 1, t: "PAM can't reach private IPs directly",             b: "Firewalls block inbound traffic. That's a feature, not a bug — but it means PAM needs a way in that doesn't open your network." },
          { n: 2, t: "A connector is a small process you run inside",    b: "It calls out to PAM over an encrypted tunnel. You install it once, per network location." },
          { n: 3, t: "Once connected, PAM routes to any assigned resource", b: "Assign resources to a site, and PAM handles which connector to use — including failover if you deploy more than one." },
        ].map(row => (
          <div key={row.n} style={{ display: "flex", gap: 12 }}>
            <div style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--brand-soft)", color: "var(--brand-fg)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none", font: "700 12px/1 var(--font-sans)" }}>{row.n}</div>
            <div>
              <div style={{ font: "600 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{row.t}</div>
              <div style={{ font: "400 12.5px/1.5 var(--font-sans)", color: "var(--fg-3)", marginTop: 3 }}>{row.b}</div>
            </div>
          </div>
        ))}

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 6 }}>
          <button className="btn btn-primary" onClick={() => { window.ztnaStore.close(); window.pamToast && window.pamToast("Setup flow arrives in Phase 2 — coming next", "info"); }}>
            Set up a connector →
          </button>
          <button className="btn btn-ghost" onClick={() => window.ztnaStore.close()} style={{ color: "var(--fg-3)" }}>
            Skip — I'll set this up later
          </button>
        </div>
      </div>
    </aside>
  </div>
);

// =========================================================
// SITE DETAIL PANEL (opens on click of site card header)
// =========================================================
const ZTNASiteDetailPanel = () => {
  const store = window.useZtna();
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const site = store.sites.find(s => s.id === store.detailSiteId);
  if (!site) return null;
  const status  = store.siteStatus(site.id);
  const conns   = store.siteConnectors(site.id);
  const events  = store.events.filter(e => e.siteId === site.id).sort((a, b) => b.ts - a.ts).slice(0, 20);
  const resCount = store.siteResources(site.id).length;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.35)", display: "flex", justifyContent: "flex-end" }}
         onClick={() => window.ztnaStore.close()}>
      <aside onClick={e => e.stopPropagation()} style={{ width: 480, maxWidth: "100vw", background: "#fff", height: "100%", display: "flex", flexDirection: "column", boxShadow: "-24px 0 60px rgba(0,0,0,0.14)" }}>
        <div style={{ padding: "16px 22px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ font: "700 15px/1.2 var(--font-sans)", color: "var(--fg-1)" }}>{site.name}</div>
            <div style={{ font: "400 12px/1.4 var(--font-sans)", color: "var(--fg-3)", marginTop: 2 }}>{site.environment} · {site.region || "—"}</div>
          </div>
          <ZTNAStatusBadge status={status}/>
          <button className="btn btn-ghost btn-icon" onClick={() => window.ztnaStore.close()} aria-label="Close"><Icon name="x" size={14}/></button>
        </div>

        <div className="scroll-area" style={{ flex: 1, overflow: "auto", padding: 22, display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Section 1 — details */}
          <section>
            <div style={{ font: "600 10.5px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10 }}>Site details</div>
            <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", rowGap: 8, columnGap: 12, font: "400 12.5px/1.5 var(--font-sans)" }}>
              <span style={{ color: "var(--fg-4)" }}>Display name</span><span style={{ color: "var(--fg-1)", fontWeight: 500 }}>{site.name}</span>
              <span style={{ color: "var(--fg-4)" }}>Environment</span><span style={{ color: "var(--fg-1)" }}>{site.environment}</span>
              <span style={{ color: "var(--fg-4)" }}>Region</span><span style={{ color: "var(--fg-1)" }}>{site.region || "—"}</span>
              <span style={{ color: "var(--fg-4)" }}>Created</span><span style={{ color: "var(--fg-1)" }}>{new Date(site.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
              <span style={{ color: "var(--fg-4)" }}>Resources</span><span style={{ color: "var(--fg-1)" }}>{resCount}</span>
            </div>
            {site.description && (
              <div style={{ marginTop: 12, padding: 10, background: "var(--bg-surface-2)", borderRadius: 6, font: "400 12px/1.5 var(--font-sans)", color: "var(--fg-2)" }}>
                {site.description}
              </div>
            )}
          </section>

          {/* Section 2 — connectors */}
          <section>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ font: "600 10.5px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.6 }}>Connectors ({conns.length})</div>
              <button className="btn btn-sm" onClick={() => window.ztnaStore.openSetupExistingSite(site.id)}>+ Add connector</button>
            </div>
            {conns.length === 0 ? (
              <div style={{ padding: 14, background: "var(--bg-surface-2)", borderRadius: 6, font: "400 12.5px/1.5 var(--font-sans)", color: "var(--fg-3)", textAlign: "center" }}>
                No connectors deployed yet. Add one to activate this site.
              </div>
            ) : <>
              {conns.map(c => <ZTNAConnectorRow key={c.id} c={c} compact/>)}
              {/* Preferred connector — site-level setting. PAM routes new
                  sessions through the preferred connector when healthy and
                  fails over to any other online connector when not. */}
              <div style={{ marginTop: 10 }}>
                <Field label="Preferred connector" hint="PAM routes through this connector when healthy, and fails over to others in the site automatically.">
                  <select className="input" value={site.preferredConnectorId || ""} onChange={e => window.ztnaStore.setSitePreferredConnector(site.id, e.target.value)}>
                    <option value="">Automatic — PAM picks a healthy connector</option>
                    {conns.map(c => {
                      const st = store.connectorStatus(c);
                      return <option key={c.id} value={c.id}>{ZTNA_STATUS[st]?.glyph || "●"} {c.name} · {ZTNA_STATUS[st]?.label}</option>;
                    })}
                  </select>
                </Field>
              </div>
            </>}
          </section>

          {/* Section 3 — health events */}
          <section>
            <div style={{ font: "600 10.5px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10 }}>Health events · last 7 days</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {events.map((e, i) => {
                const eventColor = e.kind === "offline" ? "var(--danger-fg)" : e.kind === "cert-renew" ? "var(--success-fg)" : e.kind === "heartbeat" ? "var(--fg-4)" : "var(--brand-fg)";
                return (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: 8, background: "var(--bg-surface)", borderRadius: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: eventColor, marginTop: 6, flex: "none" }}/>
                    <div style={{ flex: 1 }}>
                      <div style={{ font: "500 12px/1.4 var(--font-sans)", color: "var(--fg-1)" }}>{e.message}</div>
                      <div className="t-tiny" style={{ color: "var(--fg-4)", marginTop: 2 }}>{window.ztnaStore.fmtRelDate(e.ts)} · {store.connectors.find(c => c.id === e.connectorId)?.name || "system"}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Danger zone */}
          <section style={{ border: "1px solid var(--danger)", borderRadius: 8, padding: 14, background: "color-mix(in oklch, var(--danger) 4%, transparent)" }}>
            <div style={{ font: "600 10.5px/1 var(--font-sans)", color: "var(--danger-fg)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>Danger zone</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1, font: "400 12px/1.5 var(--font-sans)", color: "var(--fg-3)" }}>
                Delete this site, its {conns.length} connector{conns.length === 1 ? "" : "s"}, and unassign {resCount} resource{resCount === 1 ? "" : "s"}.
              </div>
              <button className="btn btn-sm" onClick={() => setConfirmDelete(true)} style={{ color: "var(--danger-fg)", borderColor: "var(--danger-fg)" }}>Delete site</button>
            </div>
          </section>
        </div>

        {confirmDelete && (
          <ZTNADeleteModal
            title={`Delete site ${site.name}?`}
            body={`The site and its ${conns.length} connector record${conns.length === 1 ? "" : "s"} are removed, and all connector certificates are revoked. Deployed connector processes on your hosts stop connecting but are not uninstalled.`}
            consequence={resCount > 0 ? `${resCount} resource${resCount === 1 ? "" : "s"} routed through this site lose ZTNA routing and become unreachable until reassigned.` : null}
            confirmLabel="Delete site"
            onConfirm={() => { setConfirmDelete(false); window.ztnaStore.deleteSite(site.id); window.pamToast && window.pamToast(`Site ${site.name} deleted`, "info"); }}
            onClose={() => setConfirmDelete(false)}
          />
        )}
      </aside>
    </div>
  );
};

// =========================================================
// CONNECTOR ROW — used in site cards AND site detail panel
// =========================================================
const ZTNAConnectorRow = ({ c, compact }) => {
  const store = window.ztnaStore;
  const status = store.connectorStatus(c);
  const s = ZTNA_STATUS[status];
  const certSoon = store.certExpiringSoon(c);
  const daysLeft = store.certDaysLeft(c);
  const site = store.sites.find(ss => ss.id === c.siteId);
  const isPreferred = site?.preferredConnectorId === c.id;
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  // Deleting the site's only ONLINE connector strands its resources — the
  // consequence line must say so, not a generic "are you sure".
  const siteConns = store.siteConnectors(c.siteId);
  const otherOnline = siteConns.some(cc => cc.id !== c.id && store.connectorStatus(cc) === "online");
  const affected = store.siteResources(c.siteId).length;
  const consequence = !otherOnline && affected > 0
    ? `This is the only online connector in ${site?.name}. Deleting it leaves ${affected} resource${affected === 1 ? "" : "s"} unreachable until another connector comes online.`
    : siteConns.length === 1
      ? `This is the only connector in ${site?.name} — the site becomes Not enrolled.`
      : null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: compact ? "8px 10px" : "10px 12px", background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: 6, marginBottom: 6 }}>
      <ZTNADot status={status}/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
          <span className="t-mono" style={{ font: "500 12.5px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{c.name}</span>
          <span style={{ padding: "1px 7px", background: "var(--bg-surface-2)", color: "var(--fg-3)", borderRadius: 4, font: "500 10.5px/1.4 var(--font-sans)" }}>{c.platform}</span>
          {isPreferred && (
            <span style={{ padding: "1px 7px", background: "var(--brand-soft)", color: "var(--brand-fg)", borderRadius: 4, font: "600 10.5px/1.4 var(--font-sans)" }}>★ Preferred</span>
          )}
          {certSoon && (
            <span style={{ padding: "1px 7px", background: "var(--warning-soft)", color: "var(--warning-fg)", borderRadius: 4, font: "500 10.5px/1.4 var(--font-sans)" }}>
              Cert expires in {daysLeft} days
            </span>
          )}
          {status === "cert-expired" && (
            <span style={{ padding: "1px 7px", background: "var(--danger-soft)", color: "var(--danger-fg)", borderRadius: 4, font: "500 10.5px/1.4 var(--font-sans)" }}>
              Cert expired
            </span>
          )}
        </div>
        <div className="t-tiny" style={{ color: "var(--fg-4)" }}>
          <span style={{ color: status === "offline" ? "var(--danger-fg)" : "var(--fg-4)", fontWeight: status === "offline" ? 500 : 400 }}>Last heartbeat: {store.fmtHeartbeat(c)}</span>
          {" · "}{store.fmtCert(c)}
        </div>
      </div>
      {status === "offline" && (
        <button className="btn btn-sm" onClick={() => window.ztnaStore.openTroubleshoot(c.id)} style={{ color: "var(--danger-fg)", borderColor: "var(--danger-fg)" }}>
          Troubleshoot →
        </button>
      )}
      {certSoon && status !== "offline" && (
        <button className="btn btn-sm" onClick={() => window.ztnaStore.openRenew(c.id)}>
          Renew →
        </button>
      )}
      <button className="btn btn-ghost btn-sm btn-icon" title="Delete connector" onClick={() => setConfirmDelete(true)} style={{ color: "var(--fg-4)" }}>
        <Icon name="trash" size={13}/>
      </button>
      {confirmDelete && (
        <ZTNADeleteModal
          title={`Delete connector ${c.name}?`}
          body={`The connector record is removed from ${site?.name || "its site"} and its enrollment certificate is revoked immediately. The process on your host stops connecting but is not uninstalled.`}
          consequence={consequence}
          confirmLabel="Delete connector"
          onConfirm={() => { setConfirmDelete(false); window.ztnaStore.deleteConnector(c.id); window.pamToast && window.pamToast(`Connector ${c.name} deleted`, "info"); }}
          onClose={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
};

// =========================================================
// SITE CARD — the primary object in the management page
// =========================================================
const ZTNASiteCard = ({ site }) => {
  const store = window.ztnaStore;
  const status = store.siteStatus(site.id);
  const conns  = store.siteConnectors(site.id);
  const assigned = store.siteResources(site.id);
  const onlineCount = conns.filter(c => store.connectorStatus(c) === "online").length;
  const totalCount  = conns.length;
  const accent = status === "online" ? "var(--success-fg)" : status === "offline" ? "var(--danger-fg)" : status === "not-enrolled" ? "var(--fg-4)" : "var(--warning-fg)";
  // Sites with problems start expanded — the admin needs to see what's wrong.
  // Healthy sites start collapsed to keep the page scannable.
  const [expanded, setExpanded] = React.useState(status !== "online");
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  return (
    <div className="card" style={{ borderLeft: `3px solid ${accent}`, padding: 16, marginBottom: 14 }}>
      {/* Card header — click anywhere to toggle; site name opens detail */}
      <div onClick={() => setExpanded(e => !e)} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: expanded ? 14 : 0, cursor: "pointer" }}>
        <Icon name={expanded ? "chevron-down" : "chevron-right"} size={14} color="var(--fg-4)"/>
        <button onClick={e => { e.stopPropagation(); window.ztnaStore.openSiteDetail(site.id); }} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", font: "700 15px/1.2 var(--font-sans)", color: "var(--fg-1)" }}>{site.name}</button>
        <span style={{ padding: "1px 7px", background: "var(--bg-surface-2)", color: "var(--fg-3)", borderRadius: 4, font: "500 10.5px/1.4 var(--font-sans)" }}>{site.environment}</span>
        <ZTNAStatusBadge status={status}/>
        {status === "partial" && <span className="t-tiny" style={{ color: "var(--warning-fg)", fontWeight: 500 }}>{onlineCount}/{totalCount} connectors online</span>}
        {!expanded && (
          <span className="t-tiny" style={{ color: "var(--fg-4)" }}>
            {totalCount} connector{totalCount === 1 ? "" : "s"} · {assigned.length} resource{assigned.length === 1 ? "" : "s"}{site.region ? ` · ${site.region}` : ""}
          </span>
        )}
        <div style={{ flex: 1 }}/>
        <button className="btn btn-sm" onClick={e => { e.stopPropagation(); window.ztnaStore.openSiteDetail(site.id); }}><Icon name="edit" size={12}/></button>
        <button className="btn btn-sm" onClick={e => { e.stopPropagation(); window.ztnaStore.openSetupExistingSite(site.id); }}>+ Add connector</button>
        <button className="btn btn-ghost btn-sm btn-icon" title="Delete site" onClick={e => { e.stopPropagation(); setConfirmDelete(true); }} style={{ color: "var(--fg-4)" }}>
          <Icon name="trash" size={13}/>
        </button>
      </div>

      {confirmDelete && (
        <ZTNADeleteModal
          title={`Delete site ${site.name}?`}
          body={`The site and its ${totalCount} connector record${totalCount === 1 ? "" : "s"} are removed, and all connector certificates are revoked. Deployed connector processes on your hosts stop connecting but are not uninstalled.`}
          consequence={assigned.length > 0 ? `${assigned.length} resource${assigned.length === 1 ? "" : "s"} routed through this site lose${assigned.length === 1 ? "s" : ""} ZTNA routing and become${assigned.length === 1 ? "s" : ""} unreachable until reassigned.` : null}
          confirmLabel="Delete site"
          onConfirm={() => { setConfirmDelete(false); window.ztnaStore.deleteSite(site.id); window.pamToast && window.pamToast(`Site ${site.name} deleted`, "info"); }}
          onClose={() => setConfirmDelete(false)}
        />
      )}

      {expanded && <>

      {/* All-offline banner */}
      {status === "offline" && (
        <div style={{ marginBottom: 12, padding: 10, background: "var(--danger-soft)", borderLeft: "3px solid var(--danger-fg)", borderRadius: "0 4px 4px 0", font: "500 12.5px/1.4 var(--font-sans)", color: "var(--danger-fg)" }}>
          ⚑ All connectors offline — {assigned.length} resource{assigned.length === 1 ? "" : "s"} unreachable
        </div>
      )}

      {/* Two-column body */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, minHeight: 60 }}>
        {/* Left — connectors */}
        <div>
          <div style={{ font: "600 10.5px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>Connectors ({totalCount})</div>
          {conns.length === 0 ? (
            <div style={{ padding: 12, background: "var(--bg-surface-2)", borderRadius: 6, textAlign: "center" }}>
              <div style={{ font: "500 12.5px/1.4 var(--font-sans)", color: "var(--fg-2)" }}>No connectors deployed</div>
              <div style={{ font: "400 11.5px/1.4 var(--font-sans)", color: "var(--fg-4)", margin: "4px 0 8px" }}>Resources assigned here cannot be reached.</div>
              <button className="btn btn-sm btn-primary" onClick={() => window.ztnaStore.openSetupExistingSite(site.id)}>+ Add connector</button>
            </div>
          ) : conns.map(c => <ZTNAConnectorRow key={c.id} c={c}/>)}
        </div>

        {/* Right — resources */}
        <div>
          <div style={{ font: "600 10.5px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>Resources using this site ({assigned.length})</div>
          {assigned.length === 0 ? (
            <div style={{ padding: 12, background: "var(--bg-surface-2)", borderRadius: 6, font: "400 12px/1.5 var(--font-sans)", color: "var(--fg-4)", textAlign: "center" }}>
              No resources assigned to this site yet.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {assigned.map(a => {
                const reachable = store.resourceReachable(site.id);
                return (
                  <div key={a.resource} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: 4 }}>
                    <Icon name={a.resource.includes("db") || a.resource.includes("mongo") || a.resource.includes("oracle") ? "database" : "server"} size={13} color="var(--fg-3)"/>
                    <span className="t-mono" style={{ flex: 1, font: "500 12px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{a.resource}</span>
                    <span style={{ font: "500 11px/1.3 var(--font-sans)", color: reachable ? "var(--success-fg)" : "var(--danger-fg)" }}>
                      {reachable ? "● reachable" : "✗ unreachable"}
                    </span>
                  </div>
                );
              })}
              {assigned.length > 5 && <button className="btn btn-sm btn-ghost" style={{ marginTop: 4, color: "var(--brand-fg)" }}>View all {assigned.length} →</button>}
            </div>
          )}
        </div>
      </div>

      {/* Card footer */}
      <div style={{ marginTop: 14, paddingTop: 10, borderTop: "1px solid var(--border-subtle)", display: "flex", gap: 14, font: "400 11.5px/1.4 var(--font-sans)", color: "var(--fg-4)" }}>
        <span>Created {new Date(site.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
        <span>·</span>
        <span>Region: {site.region || "—"}</span>
        <span>·</span>
        <span>Last active: {conns.length ? store.fmtHeartbeat(conns.reduce((a, b) => a.lastHeartbeatMs > b.lastHeartbeatMs ? a : b)) : "—"}</span>
      </div>
      </>}
    </div>
  );
};

// =========================================================
// EMPTY STATE
// =========================================================
const ZTNAEmptyState = () => (
  <div style={{ padding: "60px 32px", maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
    {/* Inline SVG illustration — two shapes connected by a tunnel */}
    <svg width="260" height="120" viewBox="0 0 260 120" style={{ marginBottom: 20 }}>
      <rect x="10"   y="30" width="80" height="60" rx="8" fill="var(--brand-soft)" stroke="var(--brand-fg)" strokeWidth="1.5"/>
      <text x="50"   y="65" textAnchor="middle" font-family="var(--font-sans)" font-size="12" font-weight="600" fill="var(--brand-fg)">PAM</text>
      <text x="50"   y="80" textAnchor="middle" font-family="var(--font-sans)" font-size="9" fill="var(--brand-fg)">Cloud</text>
      <path d="M 92 60 L 168 60" stroke="var(--brand-fg)" strokeWidth="1.5" strokeDasharray="4 4" fill="none"/>
      <polygon points="168,60 162,56 162,64" fill="var(--brand-fg)"/>
      <text x="130" y="52" textAnchor="middle" font-family="var(--font-sans)" font-size="9" fill="var(--brand-fg)">Connector tunnel</text>
      <rect x="170"  y="30" width="80" height="60" rx="8" fill="var(--bg-surface-2)" stroke="var(--fg-4)" strokeWidth="1.5" strokeDasharray="4 4"/>
      <text x="210"  y="65" textAnchor="middle" font-family="var(--font-sans)" font-size="12" font-weight="600" fill="var(--fg-2)">Your network</text>
      <text x="210"  y="80" textAnchor="middle" font-family="var(--font-sans)" font-size="9" fill="var(--fg-3)">Private</text>
    </svg>

    <h2 style={{ font: "700 20px/1.2 var(--font-sans)", color: "var(--fg-1)", margin: 0 }}>Connect PAM to your private network</h2>
    <div style={{ maxWidth: 460, margin: "12px auto 22px", textAlign: "left", display: "flex", flexDirection: "column", gap: 10 }}>
      {[
        "Create a site to represent a private network location.",
        "Deploy a connector inside that network — no inbound ports needed.",
        "Assign resources to the site so PAM can reach them.",
      ].map((t, i) => (
        <div key={i} style={{ display: "flex", gap: 10 }}>
          <div style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--brand-soft)", color: "var(--brand-fg)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none", font: "700 11px/1 var(--font-sans)" }}>{i + 1}</div>
          <div style={{ font: "400 13px/1.5 var(--font-sans)", color: "var(--fg-2)" }}>{t}</div>
        </div>
      ))}
    </div>

    <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
      <button className="btn btn-primary" onClick={() => window.ztnaStore.openSetupNewSite()}>
        + Create your first site
      </button>
      <button className="btn btn-ghost" onClick={() => window.ztnaStore.openConcept()}>
        How connectors work →
      </button>
    </div>
  </div>
);

// =========================================================
// SUMMARY STRIP — 3 KPI-style cards
// =========================================================
const ZTNASummaryStrip = ({ store }) => {
  const sites      = store.sites;
  const conns      = store.connectors;
  const online     = conns.filter(c => store.connectorStatus(c) === "online").length;
  const offline    = conns.filter(c => store.connectorStatus(c) === "offline").length;
  const siteIssues = sites.filter(s => store.siteStatus(s.id) !== "online").length;
  const usingZtna  = store.resourceAssignments;
  const unreachable = usingZtna.filter(a => !store.resourceReachable(a.siteId)).length;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, padding: "14px 24px", borderBottom: "1px solid var(--border-subtle)" }}>
      <KPICard label="Sites" value={sites.length} accent={siteIssues > 0 ? "var(--warning-fg)" : undefined}
        sub={<span style={{ color: siteIssues > 0 ? "var(--warning-fg)" : "var(--fg-4)" }}>{sites.length - siteIssues} online · {siteIssues} with issues</span>}/>
      <KPICard label="Connectors" value={conns.length} accent={offline > 0 ? "var(--danger-fg)" : undefined}
        sub={<span style={{ color: offline > 0 ? "var(--danger-fg)" : "var(--fg-4)" }}>{online} online · {offline} offline</span>}/>
      <KPICard label="Resources using ZTNA" value={usingZtna.length} accent={unreachable > 0 ? "var(--danger-fg)" : undefined}
        sub={<span style={{ color: unreachable > 0 ? "var(--danger-fg)" : "var(--fg-4)" }}>{unreachable > 0 ? `${unreachable} unreachable — connector issue` : "All reachable"}</span>}/>
    </div>
  );
};

// =========================================================
// ALERT BANNER — shown when connectors affect resources
// =========================================================
const ZTNAAlertBanner = ({ store }) => {
  const affectedSites = store.sites.filter(s => {
    const st = store.siteStatus(s.id);
    return (st === "offline" || st === "partial") && store.siteResources(s.id).length > 0;
  });
  const expiringCerts = store.connectors.filter(c => store.certExpiringSoon(c));
  if (affectedSites.length === 0 && expiringCerts.length === 0) return null;

  const unreachableCount = affectedSites.reduce((sum, s) => {
    const anyOnline = store.siteConnectors(s.id).some(c => store.connectorStatus(c) === "online");
    return sum + (anyOnline ? 0 : store.siteResources(s.id).length);
  }, 0);

  return (
    <div style={{ margin: "12px 24px 0", display: "flex", flexDirection: "column", gap: 8 }}>
      {unreachableCount > 0 && (
        <div style={{ padding: 12, background: "var(--danger-soft)", borderLeft: "3px solid var(--danger-fg)", borderRadius: "0 6px 6px 0", display: "flex", alignItems: "center", gap: 10, font: "500 12.5px/1.4 var(--font-sans)", color: "var(--danger-fg)" }}>
          <Icon name="alert-triangle" size={14} color="var(--danger-fg)"/>
          <span style={{ flex: 1 }}>
            <strong>{unreachableCount} resource{unreachableCount === 1 ? "" : "s"} unreachable</strong> — connectors offline in {affectedSites.filter(s => !store.siteConnectors(s.id).some(c => store.connectorStatus(c) === "online")).map(s => s.name).join(", ") || "one site"}
          </span>
          <button className="btn btn-sm" onClick={() => {
            const first = affectedSites[0];
            document.getElementById("ztna-site-" + first.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}>Fix now →</button>
        </div>
      )}
      {expiringCerts.length > 0 && (
        <div style={{ padding: 12, background: "var(--warning-soft)", borderLeft: "3px solid var(--warning-fg)", borderRadius: "0 6px 6px 0", display: "flex", alignItems: "center", gap: 10, font: "500 12.5px/1.4 var(--font-sans)", color: "var(--warning-fg)" }}>
          <Icon name="alert-circle" size={14} color="var(--warning-fg)"/>
          <span style={{ flex: 1 }}>
            <strong>{expiringCerts.length} connector certificate{expiringCerts.length === 1 ? "" : "s"}</strong> expire within 30 days
          </span>
          <button className="btn btn-sm" onClick={() => {
            const first = expiringCerts[0];
            document.getElementById("ztna-site-" + first.siteId)?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}>Review →</button>
        </div>
      )}
    </div>
  );
};

// =========================================================
// MANAGEMENT PAGE (Surface A)
// =========================================================
const ZTNAConnectorsPage = () => {
  const store = window.useZtna();
  const isEmpty = store.sites.length === 0;
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <PageHeader
        title="ZTNA Connectors"
        description="Connect PAM to private networks without opening inbound ports. Deploy connectors inside your network — they dial out to PAM."
        actions={!isEmpty && (
          <button className="btn btn-primary" onClick={() => window.ztnaStore.openSetupNewSite()}>
            <Icon name="plus" size={13}/> Add site
          </button>
        )}
      />

      {isEmpty ? (
        <div style={{ flex: 1, overflow: "auto" }}>
          <ZTNAEmptyState/>
        </div>
      ) : (
        <>
          <ZTNASummaryStrip store={store}/>
          <ZTNAAlertBanner store={store}/>
          <div className="scroll-area" style={{ flex: 1, overflow: "auto", padding: "16px 24px" }}>
            {store.sites.map(site => (
              <div key={site.id} id={"ztna-site-" + site.id}>
                <ZTNASiteCard site={site}/>
              </div>
            ))}
          </div>
        </>
      )}

    </div>
  );
};

// =========================================================
// GLOBAL CONTROLLER — mounted once at app root. Renders ZTNA overlays
// regardless of which page the user is on, so surfaces like the resource
// wizard can command ztnaStore.openSetupNewSite() and get a working flow.
// =========================================================
const ZTNAController = () => {
  const store = window.useZtna();
  return (
    <>
      {store.open === "concept"     && <ZTNAConceptPanel/>}
      {store.open === "site-detail" && <ZTNASiteDetailPanel/>}
      {store.open === "setup-flow"  && <ZTNASetupFlow/>}
      {store.open === "cert-renew"  && <ZTNACertRenewPanel/>}
      {store.open === "troubleshoot" && <ZTNATroubleshootPanel/>}
    </>
  );
};

// =========================================================
// SETUP FLOW (Surface D) — full-page, not a panel.
// Progress indicator adapts to entry point:
//   entry === "new-site":       [1 Create site] [2 Configure] [3 Deploy] [4 Confirm]
//   entry === "existing-site":  [1 Configure]   [2 Deploy]    [3 Confirm]
// =========================================================

const ZTNA_SETUP_STEPS = {
  "new-site":      ["Create site",       "Configure connector", "Deploy",             "Confirm"],
  "existing-site": ["Configure connector", "Deploy",            "Confirm"],
};

const ZTNAStepIndicator = ({ entry, step }) => {
  const labels = ZTNA_SETUP_STEPS[entry];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "18px 32px", borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-app)" }}>
      {labels.map((l, i) => {
        const n = i + 1;
        const done = n < step, active = n === step;
        return (
          <React.Fragment key={l}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 24, height: 24, borderRadius: "50%",
                background: done ? "var(--brand-fg)" : active ? "var(--brand-soft)" : "var(--bg-surface-2)",
                color: done ? "#fff" : active ? "var(--brand-fg)" : "var(--fg-4)",
                display: "flex", alignItems: "center", justifyContent: "center",
                font: "700 11.5px/1 var(--font-sans)",
                border: active ? "1.5px solid var(--brand-fg)" : "none",
              }}>{done ? "✓" : n}</div>
              <span style={{ font: `${active ? 600 : 500} 12.5px/1 var(--font-sans)`, color: active ? "var(--fg-1)" : done ? "var(--fg-2)" : "var(--fg-4)" }}>{l}</span>
            </div>
            {i < labels.length - 1 && <div style={{ flex: "0 0 40px", height: 1, background: done ? "var(--brand-fg)" : "var(--border)" }}/>}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// -------- Step 1 (new-site) · Create site --------
const ZTNASetupCreateSite = ({ s }) => (
  <div style={{ maxWidth: 640, margin: "32px auto", padding: "0 32px", display: "flex", flexDirection: "column", gap: 20 }}>
    <div>
      <h1 style={{ font: "700 22px/1.2 var(--font-sans)", color: "var(--fg-1)", margin: 0 }}>Create a site</h1>
      <p style={{ font: "400 13.5px/1.5 var(--font-sans)", color: "var(--fg-3)", margin: "6px 0 0" }}>A site represents a private network location — like a VPC, data center, or office network.</p>
    </div>

    <Field label="Site display name" required hint="Use a name that makes sense to your team — this is how the site appears on resources.">
      <input className="input" autoFocus value={s.siteDraft.name} onChange={e => window.ztnaStore.setupUpdateSite({ name: e.target.value })} placeholder="e.g. AWS Mumbai VPC, Frankfurt DC, HQ On-prem"/>
    </Field>

    <Field label="Network / region" hint="Cloud region, on-prem site label, or leave empty.">
      <input className="input" value={s.siteDraft.region} onChange={e => window.ztnaStore.setupUpdateSite({ region: e.target.value })} placeholder="e.g. ap-south-1, eu-central-1, on-prem"/>
    </Field>

    <Field label="Environment" required>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
        {["AWS", "Azure", "GCP", "On-prem", "Other"].map(e => (
          <button key={e} onClick={() => window.ztnaStore.setupUpdateSite({ environment: e })} style={{
            padding: "10px 8px", border: `1.5px solid ${s.siteDraft.environment === e ? "var(--brand-fg)" : "var(--border)"}`,
            background: s.siteDraft.environment === e ? "var(--brand-soft)" : "#fff",
            color: s.siteDraft.environment === e ? "var(--brand-fg)" : "var(--fg-2)",
            font: `${s.siteDraft.environment === e ? 700 : 500} 12.5px/1 var(--font-sans)`,
            borderRadius: 6, cursor: "pointer",
          }}>{e}</button>
        ))}
      </div>
    </Field>

    <Field label="Description" hint="What resources live in this network? Helps other admins understand the site's scope.">
      <textarea className="input" rows={3} value={s.siteDraft.description} onChange={e => window.ztnaStore.setupUpdateSite({ description: e.target.value })} placeholder="e.g. Primary APAC region — ledger + auth + reporting DBs."/>
    </Field>
  </div>
);

// -------- Configure connector step (supports multiple drafts) --------
const ZTNASetupConfigureConnector = ({ s, siteName }) => (
  <div style={{ maxWidth: 640, margin: "32px auto", padding: "0 32px", display: "flex", flexDirection: "column", gap: 20 }}>
    <div>
      <h1 style={{ font: "700 22px/1.2 var(--font-sans)", color: "var(--fg-1)", margin: 0 }}>Configure connector{s.connectorDrafts.length > 1 ? "s" : ""}</h1>
      <p style={{ font: "400 13.5px/1.5 var(--font-sans)", color: "var(--fg-3)", margin: "6px 0 0" }}>Add connector records in PAM. You'll deploy each in the next step — two or more give the site failover from day one.</p>
    </div>
    <div style={{ padding: "8px 12px", background: "var(--bg-surface-2)", borderRadius: 6, font: "500 12px/1.4 var(--font-sans)", color: "var(--fg-2)" }}>
      Site: <strong>{siteName}</strong> · <ZTNADot status="online"/>
    </div>

    {s.connectorDrafts.map((d, i) => (
      <div key={i} className="card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ font: "600 11px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.6 }}>Connector {i + 1}</span>
          <div style={{ flex: 1 }}/>
          {s.connectorDrafts.length > 1 && (
            <button className="btn btn-ghost btn-sm btn-icon" title="Remove this connector" onClick={() => window.ztnaStore.setupRemoveConnectorDraft(i)} style={{ color: "var(--fg-4)" }}>
              <Icon name="trash" size={12}/>
            </button>
          )}
        </div>
        <Field label="Connector display name" required hint={i === 0 ? "Use a descriptive name — e.g. region + sequence." : null}>
          <input className="input" autoFocus={i === s.connectorDrafts.length - 1} value={d.name} onChange={e => window.ztnaStore.setupUpdateConnectorAt(i, { name: e.target.value })} placeholder={`e.g. mumbai-connector-0${i + 1}`}/>
        </Field>
        <Field label="Platform" required>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {[
              { v: "Linux",   hint: "Recommended for most server environments" },
              { v: "Windows", hint: "For Windows Server environments" },
              { v: "Docker",  hint: "For containerized environments" },
            ].map(p => {
              const sel = d.platform === p.v;
              return (
                <button key={p.v} onClick={() => window.ztnaStore.setupUpdateConnectorAt(i, { platform: p.v })} style={{
                  padding: 12, border: `1.5px solid ${sel ? "var(--brand-fg)" : "var(--border)"}`,
                  background: sel ? "var(--brand-soft)" : "#fff", textAlign: "left",
                  borderRadius: 8, cursor: "pointer", display: "flex", flexDirection: "column", gap: 4,
                }}>
                  <span style={{ font: `${sel ? 700 : 600} 12.5px/1 var(--font-sans)`, color: sel ? "var(--brand-fg)" : "var(--fg-1)" }}>{p.v}</span>
                  <span style={{ font: "400 11px/1.4 var(--font-sans)", color: "var(--fg-3)" }}>{p.hint}</span>
                </button>
              );
            })}
          </div>
        </Field>
      </div>
    ))}

    <button className="btn" onClick={() => window.ztnaStore.setupAddConnectorDraft()} style={{ alignSelf: "flex-start" }}>
      <Icon name="plus" size={12}/> Add another connector
    </button>

    {/* Shared across every connector created in this run */}
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
      <Field label="Heartbeat interval" hint="Applies to all connectors above. Lower = faster failure detection.">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input className="input" type="number" value={s.heartbeatSec} onChange={e => window.ztnaStore.setupUpdate({ heartbeatSec: +e.target.value })} style={{ width: 100 }}/>
          <span style={{ font: "500 12px/1 var(--font-sans)", color: "var(--fg-3)" }}>seconds</span>
        </div>
      </Field>
      <Field label="Certificate validity" hint="PAM auto-generates a certificate per connector.">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input className="input" type="number" value={s.certMonths} onChange={e => window.ztnaStore.setupUpdate({ certMonths: +e.target.value })} style={{ width: 100 }}/>
          <span style={{ font: "500 12px/1 var(--font-sans)", color: "var(--fg-3)" }}>months</span>
        </div>
      </Field>
    </div>
  </div>
);

// -------- Deploy step — one token card per connector --------
const ZTNADeploymentCard = ({ s, d }) => {
  const [copied, setCopied] = React.useState(false);
  const [altOpen, setAltOpen] = React.useState(false);
  const command = `curl -sSL https://pam.northwind.com/install/connector.sh | \\
  bash -s -- --token ${d.token} \\
  --site ${s.siteId} \\
  --connector ${d.name}`;
  const winCommand = `Invoke-WebRequest https://pam.northwind.com/install/connector.ps1 -OutFile connector.ps1
.\\connector.ps1 -Token '${d.token}' -Site '${s.siteId}' -Connector '${d.name}'`;
  const dockerCommand = `docker run -d --name pam-connector --restart=always \\
  -e PAM_TOKEN=${d.token} \\
  -e PAM_SITE=${s.siteId} \\
  -e PAM_CONNECTOR=${d.name} \\
  pam/connector:latest`;
  const primary = d.platform === "Windows" ? winCommand : d.platform === "Docker" ? dockerCommand : command;
  const connected = d.status === "connected";

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden", border: `2px solid ${connected ? "var(--success-fg)" : "var(--brand-fg)"}` }}>
      <div style={{ padding: "10px 16px", background: connected ? "var(--success-soft)" : "var(--brand-soft)", display: "flex", alignItems: "center", gap: 10 }}>
        <span className="t-mono" style={{ font: "700 12px/1 var(--font-sans)", color: connected ? "var(--success-fg)" : "var(--brand-fg)" }}>{d.name}</span>
        <span style={{ padding: "1px 7px", background: "rgba(255,255,255,0.6)", color: "var(--fg-3)", borderRadius: 4, font: "500 10.5px/1.4 var(--font-sans)" }}>{d.platform}</span>
        <div style={{ flex: 1 }}/>
        {connected ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, font: "700 12px/1 var(--font-sans)", color: "var(--success-fg)" }}>✓ Connected</span>
        ) : (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, font: "500 11.5px/1 var(--font-sans)", color: "var(--brand-fg)" }}>
            <Spinner size={11}/> Waiting…
            <button className="btn btn-sm" onClick={() => window.ztnaStore.setupSimulateConnect(d.connectorId)} style={{ fontSize: 10.5, marginLeft: 4 }}>[Demo] Connect</button>
          </span>
        )}
      </div>
      {!connected && <>
        <pre style={{ margin: 0, padding: 14, background: "#0F1115", color: "#DFE3E8", font: "500 12px/1.6 var(--font-mono)", overflow: "auto", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{primary}</pre>
        <div style={{ padding: 10, display: "flex", gap: 8, background: "var(--bg-surface)" }}>
          <button className="btn btn-primary btn-sm" onClick={() => { navigator.clipboard.writeText(primary); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
            <Icon name="copy" size={12}/> {copied ? "Copied ✓" : "Copy command"}
          </button>
          <button className="btn btn-sm" onClick={() => { if (confirm("This will invalidate the current token for " + d.name + ". Only do this if you've lost the command.")) window.ztnaStore.setupRegenerateToken(d.connectorId); }}>
            Regenerate token
          </button>
          <div style={{ flex: 1 }}/>
          <button className="btn btn-sm btn-ghost" onClick={() => setAltOpen(!altOpen)}>
            Show alternatives {altOpen ? "↑" : "↓"}
          </button>
        </div>
        {altOpen && (
          <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 10, borderTop: "1px solid var(--border-subtle)" }}>
            {[["Linux (bash)", command], ["Windows (PowerShell)", winCommand], ["Docker", dockerCommand]].map(([label, cmd]) => (
              <div key={label}>
                <div style={{ font: "600 11px/1.4 var(--font-sans)", color: "var(--fg-3)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
                <pre style={{ margin: 0, padding: 10, background: "var(--bg-surface-2)", color: "var(--fg-1)", font: "500 11.5px/1.5 var(--font-mono)", borderRadius: 4, overflow: "auto", whiteSpace: "pre-wrap" }}>{cmd}</pre>
              </div>
            ))}
          </div>
        )}
      </>}
    </div>
  );
};

const ZTNASetupDeploy = ({ s, siteName }) => {
  const deployments = s.deployments || [];
  const connectedCount = deployments.filter(d => d.status === "connected").length;
  return (
    <div style={{ maxWidth: 800, margin: "32px auto", padding: "0 32px", display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <h1 style={{ font: "700 22px/1.2 var(--font-sans)", color: "var(--fg-1)", margin: 0 }}>Deploy your connector{deployments.length > 1 ? "s" : ""}</h1>
        <p style={{ font: "400 13.5px/1.5 var(--font-sans)", color: "var(--fg-3)", margin: "6px 0 0" }}>
          Run {deployments.length > 1 ? "each command on its own host" : "this command"} inside your private network. Connectors dial out to PAM automatically.
        </p>
      </div>

      <div style={{ padding: "8px 12px", background: "var(--bg-surface-2)", borderRadius: 6, font: "500 12px/1.4 var(--font-sans)", color: "var(--fg-2)", display: "flex", alignItems: "center", gap: 8 }}>
        <span>Site: <strong>{siteName}</strong> · {deployments.length} connector{deployments.length === 1 ? "" : "s"}</span>
        <div style={{ flex: 1 }}/>
        {deployments.length > 1 && (
          <span style={{ font: "600 12px/1 var(--font-sans)", color: connectedCount === deployments.length ? "var(--success-fg)" : "var(--brand-fg)" }}>
            {connectedCount}/{deployments.length} connected
          </span>
        )}
      </div>

      <div style={{ padding: 10, background: "var(--warning-soft)", color: "var(--warning-fg)", borderRadius: 4, font: "500 12px/1.5 var(--font-sans)", display: "flex", alignItems: "flex-start", gap: 8 }}>
        <Icon name="alert-circle" size={13} color="var(--warning-fg)"/>
        <span>Tokens are single-use and valid for 24 hours. Once a connector connects successfully, its token is invalidated. Do not share these tokens.</span>
      </div>

      {deployments.map(d => <ZTNADeploymentCard key={d.connectorId} s={s} d={d}/>)}

      {s.status === "timeout" && (
        <div style={{ padding: 14, background: "#fff", border: "1px solid var(--warning-fg)", borderRadius: 8 }}>
          <div style={{ font: "600 13.5px/1.3 var(--font-sans)", color: "var(--warning-fg)" }}>Taking longer than expected? Common reasons:</div>
          <ul style={{ font: "400 12.5px/1.6 var(--font-sans)", color: "var(--fg-2)", margin: "8px 0 0 18px" }}>
            <li>Are you running the command as root / with sudo?</li>
            <li>Can the VM reach pam.northwind.com on port 443 outbound?</li>
            <li>Is the VM's system clock correct? Token validation requires accurate time.</li>
          </ul>
          <div style={{ marginTop: 10 }}>
            <button className="btn btn-sm">View troubleshooting guide →</button>
          </div>
        </div>
      )}

      <div style={{ textAlign: "center", marginTop: 4 }}>
        <button className="btn btn-ghost" onClick={() => window.ztnaStore.close()} style={{ color: "var(--fg-3)" }}>
          I'll deploy {deployments.length > 1 ? "these" : "this"} later →
        </button>
        <div style={{ font: "400 11.5px/1.4 var(--font-sans)", color: "var(--fg-4)", marginTop: 4 }}>
          Your site + connector record{deployments.length === 1 ? "" : "s"} will be saved in Not-enrolled state. Tokens remain valid for 24 hours.
        </div>
      </div>
    </div>
  );
};

// -------- Confirm step --------
const ZTNASetupConfirm = ({ s, siteName }) => {
  const site = window.ztnaStore.sites.find(ss => ss.id === s.siteId);
  const connectors = (s.deployments || []).map(d => window.ztnaStore.connectors.find(c => c.id === d.connectorId)).filter(Boolean);
  const first = connectors[0];
  return (
    <div style={{ maxWidth: 720, margin: "48px auto", padding: "0 32px", display: "flex", flexDirection: "column", gap: 22, textAlign: "center" }}>
      <div>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "var(--success-soft)", color: "var(--success-fg)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 32, marginBottom: 12 }}>✓</div>
        <h1 style={{ font: "700 24px/1.2 var(--font-sans)", color: "var(--fg-1)", margin: 0 }}>{siteName} is ready</h1>
        <div style={{ font: "400 13.5px/1.5 var(--font-sans)", color: "var(--fg-3)", margin: "8px auto 0", maxWidth: 460 }}>
          {connectors.length > 1 ? `All ${connectors.length} connectors are online — the site has failover from day one.` : "Your connector is online."} Assign resources to this site to start routing through it.
        </div>
      </div>

      <div className="card" style={{ padding: 16, border: "2px solid var(--success-fg)", textAlign: "left" }}>
        <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", rowGap: 8, columnGap: 12, font: "400 12.5px/1.5 var(--font-sans)" }}>
          <span style={{ color: "var(--fg-4)" }}>Site</span><span style={{ color: "var(--fg-1)", fontWeight: 500 }}>{siteName} <ZTNAStatusBadge status="online" size="sm"/></span>
          {connectors.map(c => (
            <React.Fragment key={c.id}>
              <span style={{ color: "var(--fg-4)" }}>Connector</span>
              <span className="t-mono">{c.name} <span style={{ color: "var(--fg-4)" }}>({c.platform})</span> <ZTNAStatusBadge status="online" size="sm"/></span>
            </React.Fragment>
          ))}
          <span style={{ color: "var(--fg-4)" }}>Last heartbeat</span><span style={{ color: "var(--fg-1)" }}>just now</span>
          <span style={{ color: "var(--fg-4)" }}>Certificate{connectors.length > 1 ? "s" : ""}</span><span style={{ color: "var(--fg-1)" }}>Valid until {first ? new Date(first.certExpiresAt).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "—"}</span>
        </div>
      </div>

      <div>
        <div style={{ font: "600 10.5px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 12, textAlign: "left" }}>What's next</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {[
            { icon: "server",   title: "Assign your first resource", body: "Tell PAM which resources live in this site.",  cta: "Go to Resources →", onClick: () => window.pamToast && window.pamToast("Resource wizard integration lives on the Resources page — try adding a new resource with a private IP", "info") },
            { icon: "plus",     title: "Add another connector",       body: "Redundancy protects against single-connector outages.", cta: "Add connector →", onClick: () => window.ztnaStore.openSetupExistingSite(s.siteId) },
            { icon: "database", title: "Configure more sites",        body: "You can have sites for different networks.",  cta: "Add another site →", onClick: () => window.ztnaStore.openSetupNewSite() },
          ].map((c, i) => (
            <div key={i} className="card" style={{ padding: 14, textAlign: "left", display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ width: 32, height: 32, borderRadius: 6, background: "var(--brand-soft)", color: "var(--brand-fg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name={c.icon} size={16} color="var(--brand-fg)"/>
              </div>
              <div style={{ font: "600 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{c.title}</div>
              <div style={{ font: "400 12px/1.5 var(--font-sans)", color: "var(--fg-3)", flex: 1 }}>{c.body}</div>
              <button className="btn btn-sm" onClick={c.onClick} style={{ alignSelf: "flex-start", marginTop: 4 }}>{c.cta}</button>
            </div>
          ))}
        </div>
      </div>

      <button className="btn" onClick={() => window.ztnaStore.close()} style={{ alignSelf: "center", marginTop: 8, padding: "10px 18px" }}>
        Done
      </button>
    </div>
  );
};

// -------- Setup flow shell --------
const ZTNASetupFlow = () => {
  const store = window.useZtna();
  const s = store.setup;
  if (!s) return null;
  const siteName = s.entry === "new-site" ? (s.siteDraft?.name || "Untitled site") : (store.sites.find(ss => ss.id === s.siteId)?.name || "");

  // Compute which body to render given the entry + step.
  let body = null;
  if (s.entry === "new-site") {
    if (s.step === 1) body = <ZTNASetupCreateSite s={s}/>;
    if (s.step === 2) body = <ZTNASetupConfigureConnector s={s} siteName={siteName}/>;
    if (s.step === 3) body = <ZTNASetupDeploy s={s} siteName={siteName}/>;
    if (s.step === 4) body = <ZTNASetupConfirm s={s} siteName={siteName}/>;
  } else {
    if (s.step === 1) body = <ZTNASetupConfigureConnector s={s} siteName={siteName}/>;
    if (s.step === 2) body = <ZTNASetupDeploy s={s} siteName={siteName}/>;
    if (s.step === 3) body = <ZTNASetupConfirm s={s} siteName={siteName}/>;
  }

  // Footer only shows on non-final, non-token steps. Step 3 (deploy) has its
  // own "I'll deploy later" affordance so the standard footer is hidden.
  const isDeployStep  = (s.entry === "new-site" && s.step === 3) || (s.entry === "existing-site" && s.step === 2);
  const isConfirmStep = (s.entry === "new-site" && s.step === 4) || (s.entry === "existing-site" && s.step === 3);
  const nextDisabled = (() => {
    if (s.entry === "new-site" && s.step === 1) return !s.siteDraft.name.trim();
    if ((s.entry === "new-site" && s.step === 2) || (s.entry === "existing-site" && s.step === 1)) return s.connectorDrafts.some(d => !d.name.trim());
    return false;
  })();

  const onNext = () => {
    // Configure step → generate token + advance to Deploy
    const configureStep = (s.entry === "new-site" && s.step === 2) || (s.entry === "existing-site" && s.step === 1);
    if (configureStep) { window.ztnaStore.setupGenerateToken(); return; }
    window.ztnaStore.setupNext();
  };

  // Right-side drawer — same treatment as the Resources and Credentials add
  // panels (backdrop + 960px slide-in), not a full-page takeover. Closing by
  // backdrop click is intentionally allowed except while a token is live on
  // screen — there, "I'll deploy this later" is the explicit exit.
  const backdropClose = () => { if (!isDeployStep) window.ztnaStore.close(); };
  return (
    <div onClick={backdropClose} style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(15, 23, 42, 0.45)", display: "flex", justifyContent: "flex-end", animation: "fadeIn 180ms ease" }}>
      <div onClick={e => e.stopPropagation()} style={{ width: "min(960px, 92vw)", height: "100%", background: "var(--bg-app)", display: "flex", flexDirection: "column", boxShadow: "-8px 0 32px rgba(0,0,0,0.18)", animation: "slideInR 240ms cubic-bezier(.2,.7,.2,1)" }}>
        {/* Drawer header */}
        <header style={{ height: 56, padding: "0 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10, flex: "none" }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: "var(--brand-soft)", color: "var(--brand-fg)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
            <Icon name="globe" size={14} color="var(--brand-fg)"/>
          </div>
          <div>
            <h2 style={{ font: "600 15px/1 var(--font-sans)", color: "var(--fg-1)", margin: 0 }}>{s.entry === "new-site" ? "Add site" : "Add connector"}</h2>
            <div style={{ font: "400 11.5px/1.3 var(--font-sans)", color: "var(--fg-4)", marginTop: 3 }}>{s.entry === "new-site" ? "New site + connector" : `Site: ${siteName}`}</div>
          </div>
          <div style={{ flex: 1 }}/>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => window.ztnaStore.close()} title="Close"><Icon name="close" size={14}/></button>
        </header>

        <ZTNAStepIndicator entry={s.entry} step={s.step}/>

        <div className="scroll-area" style={{ flex: 1, overflow: "auto" }}>
          {body}
        </div>

        {!isDeployStep && !isConfirmStep && (
          <footer style={{ padding: "12px 24px", borderTop: "1px solid var(--border)", display: "flex", gap: 8, background: "var(--bg-surface)", flex: "none" }}>
            <button className="btn btn-ghost" onClick={() => window.ztnaStore.close()}>Cancel</button>
            <div style={{ flex: 1 }}/>
            {s.step > 1 && <button className="btn" onClick={() => window.ztnaStore.setupBack()}>← Back</button>}
            <button className="btn btn-primary" disabled={nextDisabled} onClick={onNext} style={nextDisabled ? { opacity: 0.5, cursor: "not-allowed" } : {}}>
              {(s.entry === "new-site" && s.step === 2) || (s.entry === "existing-site" && s.step === 1) ? "Generate enrollment token →" : "Next →"}
            </button>
          </footer>
        )}
      </div>
    </div>
  );
};

// =========================================================
// CERTIFICATE RENEWAL PANEL (Surface G · cert-expiring flow)
// =========================================================
const ZTNACertRenewPanel = () => {
  const store = window.useZtna();
  const c = store.connectors.find(cc => cc.id === store.renewConnectorId);
  const [months, setMonths] = React.useState(12);
  if (!c) return null;
  const site = store.sites.find(s => s.id === c.siteId);
  const daysLeft = store.certDaysLeft(c);
  const command = `curl -sSL https://pam.northwind.com/install/renew.sh | bash -s -- \\
  --connector ${c.name} \\
  --months ${months}`;
  const [copied, setCopied] = React.useState(false);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.35)", display: "flex", justifyContent: "flex-end" }} onClick={() => window.ztnaStore.close()}>
      <aside onClick={e => e.stopPropagation()} style={{ width: 480, maxWidth: "100vw", background: "#fff", height: "100%", display: "flex", flexDirection: "column", boxShadow: "-24px 0 60px rgba(0,0,0,0.14)" }}>
        <div style={{ padding: "16px 22px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ font: "700 15px/1.2 var(--font-sans)", color: "var(--fg-1)" }}>Renew certificate</div>
            <div className="t-mono t-tiny" style={{ color: "var(--fg-3)", marginTop: 2 }}>{c.name} · {site?.name}</div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={() => window.ztnaStore.close()} aria-label="Close"><Icon name="x" size={14}/></button>
        </div>

        <div className="scroll-area" style={{ flex: 1, overflow: "auto", padding: 22, display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ padding: 12, background: daysLeft <= 0 ? "var(--danger-soft)" : "var(--warning-soft)", color: daysLeft <= 0 ? "var(--danger-fg)" : "var(--warning-fg)", borderRadius: 6, font: "500 12.5px/1.4 var(--font-sans)" }}>
            {daysLeft <= 0
              ? "⚑ Certificate expired. The connector cannot verify its identity."
              : `⚠ Current cert expires in ${daysLeft} days (${new Date(c.certExpiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}).`}
          </div>

          {store.renewStatus === "done" ? (
            <div style={{ padding: 16, background: "var(--success-soft)", borderRadius: 6, textAlign: "center" }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--success-fg)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 8 }}>✓</div>
              <div style={{ font: "600 13.5px/1.3 var(--font-sans)", color: "var(--success-fg)" }}>Certificate renewed</div>
              <div style={{ font: "400 12px/1.5 var(--font-sans)", color: "var(--success-fg)", marginTop: 4 }}>Valid until {new Date(c.certExpiresAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</div>
            </div>
          ) : store.renewStatus === "waiting" ? (
            <>
              <div style={{ padding: 12, background: "var(--bg-surface)", border: "2px solid var(--brand-fg)", borderRadius: 8 }}>
                <div style={{ font: "600 11px/1 var(--font-sans)", color: "var(--brand-fg)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>Run this on the connector host</div>
                <pre style={{ margin: 0, padding: 10, background: "#0F1115", color: "#DFE3E8", font: "500 11.5px/1.5 var(--font-mono)", borderRadius: 4, overflow: "auto", whiteSpace: "pre-wrap" }}>{command}</pre>
                <button className="btn btn-sm btn-primary" style={{ marginTop: 8 }} onClick={() => { navigator.clipboard.writeText(command); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
                  <Icon name="copy" size={11}/> {copied ? "Copied ✓" : "Copy command"}
                </button>
              </div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, font: "500 12.5px/1 var(--font-sans)", color: "var(--brand-fg)" }}>
                <Spinner size={12}/> Waiting for connector to apply new certificate…
              </div>
            </>
          ) : (
            <>
              <Field label="New cert validity">
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input className="input" type="number" value={months} onChange={e => setMonths(+e.target.value)} style={{ width: 100 }}/>
                  <span style={{ font: "500 12px/1 var(--font-sans)", color: "var(--fg-3)" }}>months</span>
                </div>
              </Field>
              <button className="btn btn-primary" onClick={() => window.ztnaStore.renewGenerate(months)}>
                Generate renewal certificate
              </button>
            </>
          )}
        </div>
      </aside>
    </div>
  );
};

// =========================================================
// SITE PICKER (Surface E · resource wizard)
// Public API: <ZTNASitePicker value={siteId} onChange={fn} />
// =========================================================
const ZTNASitePicker = ({ value, onChange, connectorId, onConnectorChange }) => {
  const store = window.useZtna();
  const sites = store.sites;
  if (sites.length === 0) {
    return (
      <div style={{ padding: 14, background: "var(--bg-surface-2)", borderRadius: 6, textAlign: "center" }}>
        <div style={{ font: "600 12.5px/1.4 var(--font-sans)", color: "var(--fg-2)" }}>No sites configured</div>
        <div style={{ font: "400 12px/1.5 var(--font-sans)", color: "var(--fg-4)", margin: "4px 0 10px" }}>Create a site and deploy a connector before assigning resources.</div>
        <button className="btn btn-sm btn-primary" onClick={() => window.ztnaStore.openSetupNewSite()}>
          Set up your first site →
        </button>
      </div>
    );
  }
  const selectedSite = sites.find(s => s.id === value);
  const siteConns = selectedSite ? store.siteConnectors(selectedSite.id) : [];
  const chosenConn = siteConns.find(c => c.id === connectorId);
  const chosenOffline = chosenConn && store.connectorStatus(chosenConn) !== "online";
  return (
    <>
      {/* Site change resets connectorId in the PARENT's onChange — do not also
          call onConnectorChange here; it fires against the stale routing
          object and clobbers the siteId that was just set. */}
      <select className="input" value={value || ""} onChange={e => onChange(e.target.value)}>
        <option value="">Which site is this resource behind?</option>
        {sites.map(s => {
          const conns = store.siteConnectors(s.id);
          const status = store.siteStatus(s.id);
          const onlineCount = conns.filter(c => store.connectorStatus(c) === "online").length;
          return (
            <option key={s.id} value={s.id}>
              {ZTNA_STATUS[status]?.glyph || "●"} {s.name} · {s.environment} · {conns.length} connectors ({onlineCount}/{conns.length} online)
            </option>
          );
        })}
      </select>

      {selectedSite && <ZTNASiteHealthCard siteId={selectedSite.id}/>}

      {/* Preferred connector for THIS resource. Automatic is the default and
          the recommended path — PAM load-balances and fails over within the
          site. Pinning a specific connector is a preference: PAM still fails
          over to other online connectors if the preferred one goes down. */}
      {selectedSite && siteConns.length > 0 && onConnectorChange && (
        <div style={{ marginTop: 10 }}>
          <Field label="Preferred connector" hint="PAM routes this resource through the preferred connector when healthy, and fails over to other connectors in the site automatically.">
            <select className="input" value={connectorId || ""} onChange={e => onConnectorChange(e.target.value)}>
              <option value="">
                Automatic — PAM picks a healthy connector{selectedSite.preferredConnectorId ? ` (site default: ${siteConns.find(c => c.id === selectedSite.preferredConnectorId)?.name || "—"})` : " (recommended)"}
              </option>
              {siteConns.map(c => {
                const st = store.connectorStatus(c);
                return <option key={c.id} value={c.id}>{ZTNA_STATUS[st]?.glyph || "●"} {c.name} · {c.platform} · {ZTNA_STATUS[st]?.label}</option>;
              })}
            </select>
          </Field>
          {chosenOffline && (
            <div style={{ marginTop: 6, padding: 10, background: "var(--warning-soft)", color: "var(--warning-fg)", borderRadius: 4, font: "500 12px/1.5 var(--font-sans)" }}>
              ⚠ {chosenConn.name} is currently {store.connectorStatus(chosenConn) === "offline" ? "offline" : "unhealthy"}. Sessions will fail over to other online connectors in {selectedSite.name} until it recovers.
            </div>
          )}
        </div>
      )}
    </>
  );
};

// -------- Site health card shown below the picker --------
const ZTNASiteHealthCard = ({ siteId }) => {
  const store = window.useZtna();
  const site = store.sites.find(s => s.id === siteId);
  if (!site) return null;
  const status = store.siteStatus(siteId);
  const conns = store.siteConnectors(siteId);
  const online = conns.filter(c => store.connectorStatus(c) === "online").length;
  const offline = conns.filter(c => store.connectorStatus(c) === "offline").length;
  const accent = status === "online" ? "var(--success-fg)" : status === "offline" || status === "not-enrolled" ? "var(--danger-fg)" : "var(--warning-fg)";

  return (
    <div style={{ marginTop: 10, border: `1px solid var(--border)`, borderLeft: `3px solid ${accent}`, borderRadius: "0 6px 6px 0", padding: 12, background: "#fff" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span style={{ font: "600 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{site.name}</span>
        <span style={{ padding: "1px 7px", background: "var(--bg-surface-2)", color: "var(--fg-3)", borderRadius: 4, font: "500 10.5px/1.4 var(--font-sans)" }}>{site.environment}</span>
        <div style={{ flex: 1 }}/>
        <ZTNAStatusBadge status={status} size="sm"/>
      </div>
      <div style={{ font: "400 12px/1.5 var(--font-sans)", color: "var(--fg-3)" }}>
        {conns.length} connector{conns.length === 1 ? "" : "s"} · <span style={{ color: "var(--success-fg)", fontWeight: 500 }}>{online} online</span>{offline > 0 && <>, <span style={{ color: "var(--danger-fg)", fontWeight: 500 }}>{offline} offline</span></>}
      </div>
      {status === "partial" && (
        <div style={{ marginTop: 10, padding: 10, background: "var(--warning-soft)", color: "var(--warning-fg)", borderRadius: 4, font: "500 12px/1.5 var(--font-sans)" }}>
          ⚠ {offline} of {conns.length} connectors are offline. Resource may be unreachable if online connector fails.
          <div style={{ marginTop: 4 }}><a href="#" onClick={e => { e.preventDefault(); const oc = conns.find(c => store.connectorStatus(c) === "offline"); if (oc) window.ztnaStore.openTroubleshoot(oc.id); }} style={{ color: "var(--warning-fg)", textDecoration: "underline", fontWeight: 600 }}>Fix →</a></div>
        </div>
      )}
      {status === "offline" && (
        <div style={{ marginTop: 10, padding: 10, background: "var(--danger-soft)", color: "var(--danger-fg)", borderRadius: 4, font: "500 12px/1.5 var(--font-sans)" }}>
          ⚑ All connectors offline. Resource will be unreachable until at least one comes back online.
        </div>
      )}
      {status === "not-enrolled" && (
        <div style={{ marginTop: 10, padding: 10, background: "var(--danger-soft)", color: "var(--danger-fg)", borderRadius: 4, font: "500 12px/1.5 var(--font-sans)" }}>
          ⚑ No connectors deployed in this site. Resource will be unreachable until a connector is added.
          <div style={{ marginTop: 4 }}><a href="#" onClick={e => { e.preventDefault(); window.ztnaStore.openSetupExistingSite(siteId); }} style={{ color: "var(--danger-fg)", textDecoration: "underline", fontWeight: 600 }}>Add connector to {site.name} →</a></div>
        </div>
      )}
    </div>
  );
};

// =========================================================
// NETWORK ROUTING SECTION — the block dropped into the resource wizard.
// Usage: <ZTNANetworkRoutingSection ipHint={host} resourceContext={{type, port}} value={draft.routing} onChange={...}/>
//
// Three routing modes. Jump server is a distinct trust model from ZTNA —
// customer-owned bastion vs PAM-owned connector — so it is a peer pill,
// not a sub-option. Selecting it reveals a JUMP HOST CREDENTIAL block
// (the second credential the double-hop genuinely requires) directly
// below this section, before the Root Credential block.
//
// BACKEND DEPENDENCY (flagged in spec as open items — confirm with Mohit):
//   1. End-to-end double-hop support per protocol/resource type.
//   2. Whether jump-host protocol compatibility can be checked live; the
//      warning below is a static heuristic (SSH bastion + RDP target).
//   3. Whether session recording covers the full jump-host→target path
//      or only the final hop.
// =========================================================
const ZTNA_PRIVATE_IP = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/;

// Empty jump-credential draft. mode: "new" | "existing".
const ZTNA_EMPTY_JUMP = { mode: "new", host: "", port: 22, username: "", credType: "password", secret: "", existingId: null };

// Validity check for the jump credential — exposed on window so the
// wizard's step gate (NewManualAdd.step1Valid) can call it without
// importing anything.
const ztnaJumpValid = (routing) => {
  if (!routing || routing.method !== "jump") return true;
  const j = routing.jump || {};
  if (j.mode === "existing") return !!j.existingId;
  return !!(j.host && j.port && j.username && j.secret);
};
window.ztnaJumpValid = ztnaJumpValid;

// Static protocol heuristic: an SSH bastion (port 22 or SSH-key auth)
// cannot natively proxy an RDP target (port 3389). PAM can't see the
// bastion's real forwarding config, so this warns rather than blocks.
const ztnaJumpProtocolConflict = (jump, resourceContext) => {
  if (!jump || !resourceContext) return null;
  const jumpIsSsh = jump.credType === "sshkey" || +jump.port === 22;
  const targetIsRdp = +resourceContext.port === 3389;
  if (jumpIsSsh && targetIsRdp) return "Windows/RDP";
  return null;
};

const ZTNANetworkRoutingSection = ({ ipHint, resourceContext, value, onChange }) => {
  // Value shape: { method: "direct" | "ztna" | "jump", siteId, jump }
  const v = value || { method: "direct", siteId: "", jump: null };
  const isPrivate = ipHint && ZTNA_PRIVATE_IP.test(ipHint);
  const jump = v.jump || ZTNA_EMPTY_JUMP;
  const setJump = (patch) => onChange({ ...v, jump: { ...jump, ...patch } });
  const conflict = v.method === "jump" ? ztnaJumpProtocolConflict(jump, resourceContext) : null;

  // Vaulted credentials usable for a bastion login — Password or SSH Key only.
  const [q, setQ] = React.useState("");
  const vaulted = (window.CREDS || []).filter(c => (c.type === "Password" || c.type === "SSH Key") &&
    (!q || `${c.display} ${c.username} ${c.resource || ""}`.toLowerCase().includes(q.toLowerCase())));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ font: "600 10.5px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.7 }}>Network routing</div>
      <div style={{ font: "400 12px/1.5 var(--font-sans)", color: "var(--fg-3)" }}>
        If this resource is inside a private network, PAM needs a connector to reach it.
      </div>

      {isPrivate && v.method === "direct" && (
        <div style={{ padding: 10, background: "var(--brand-soft)", color: "var(--brand-fg)", borderLeft: "3px solid var(--brand-fg)", borderRadius: "0 4px 4px 0", font: "500 12px/1.5 var(--font-sans)" }}>
          Private IP detected — a ZTNA connector may be required to reach this resource.
          <a href="#" onClick={e => { e.preventDefault(); window.ztnaStore.openConcept(); }} style={{ display: "inline-block", marginLeft: 6, color: "var(--brand-fg)", textDecoration: "underline" }}>What's a ZTNA connector?</a>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        {[
          { v: "direct", label: "Direct",             hint: "PAM reaches resource without connector" },
          { v: "ztna",   label: "Via ZTNA connector",  hint: "PAM routes through a connector inside a private network" },
          { v: "jump",   label: "Via jump server",     hint: "PAM authenticates through a bastion host you already manage, then reaches the resource from there" },
        ].map(o => {
          const sel = v.method === o.v;
          return (
            <button key={o.v} onClick={() => onChange({ ...v, method: o.v, jump: o.v === "jump" ? (v.jump || ZTNA_EMPTY_JUMP) : v.jump })} style={{
              padding: 12, border: `1.5px solid ${sel ? "var(--brand-fg)" : "var(--border)"}`,
              background: sel ? "var(--brand-soft)" : "#fff",
              textAlign: "left", borderRadius: 6, cursor: "pointer",
              display: "flex", flexDirection: "column", gap: 4,
            }}>
              <span style={{ font: `${sel ? 700 : 600} 13px/1 var(--font-sans)`, color: sel ? "var(--brand-fg)" : "var(--fg-1)" }}>{o.label}</span>
              <span style={{ font: "400 11.5px/1.4 var(--font-sans)", color: "var(--fg-3)" }}>{o.hint}</span>
            </button>
          );
        })}
      </div>

      {v.method === "ztna" && (
        <div style={{ marginTop: 4 }}>
          <div style={{ font: "500 12px/1.4 var(--font-sans)", color: "var(--fg-2)", marginBottom: 6 }}>Which site is this resource behind?</div>
          <ZTNASitePicker
            value={v.siteId}
            onChange={siteId => onChange({ ...v, siteId, connectorId: "" })}
            connectorId={v.connectorId}
            onConnectorChange={connectorId => onChange({ ...v, connectorId })}
          />
        </div>
      )}

      {v.method === "jump" && (
        <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ font: "600 10.5px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.7 }}>Jump host credential</div>
          <div style={{ padding: 10, background: "var(--brand-soft)", color: "var(--brand-fg)", borderLeft: "3px solid var(--brand-fg)", borderRadius: "0 4px 4px 0", font: "500 12px/1.5 var(--font-sans)" }}>
            PAM will authenticate into this jump host first, then use the root credential below to reach the resource.
          </div>

          {/* Create new / Use existing — mirrors the Root Credential picker's split */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              { m: "new",      label: "Create new",   hint: "Enter the bastion's connection details" },
              { m: "existing", label: "Use existing",  hint: "Pick an already-vaulted credential" },
            ].map(o => {
              const sel = jump.mode === o.m;
              return (
                <button key={o.m} onClick={() => setJump({ mode: o.m })} style={{
                  padding: 10, border: `1.5px solid ${sel ? "var(--brand-fg)" : "var(--border)"}`,
                  background: sel ? "var(--brand-soft)" : "#fff",
                  textAlign: "left", borderRadius: 6, cursor: "pointer",
                  display: "flex", flexDirection: "column", gap: 3,
                }}>
                  <span style={{ font: `${sel ? 700 : 600} 12.5px/1 var(--font-sans)`, color: sel ? "var(--brand-fg)" : "var(--fg-1)" }}>{o.label}</span>
                  <span style={{ font: "400 11px/1.4 var(--font-sans)", color: "var(--fg-3)" }}>{o.hint}</span>
                </button>
              );
            })}
          </div>

          {jump.mode === "new" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
                <Field label="Jump host / IP" required>
                  <input className="input t-mono" value={jump.host} onChange={e => setJump({ host: e.target.value })} placeholder="e.g. bastion.internal or 10.0.0.5"/>
                </Field>
                <Field label="Port" required>
                  <input className="input t-mono" type="number" value={jump.port} onChange={e => setJump({ port: +e.target.value })}/>
                </Field>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Username" required>
                  <input className="input" value={jump.username} onChange={e => setJump({ username: e.target.value })} placeholder="e.g. pam-svc"/>
                </Field>
                <Field label="Credential type" required>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    {[{ t: "password", label: "Password" }, { t: "sshkey", label: "SSH Key" }].map(o => {
                      const sel = jump.credType === o.t;
                      return (
                        <button key={o.t} onClick={() => setJump({ credType: o.t, port: o.t === "sshkey" ? 22 : jump.port })} style={{
                          padding: "9px 8px", border: `1.5px solid ${sel ? "var(--brand-fg)" : "var(--border)"}`,
                          background: sel ? "var(--brand-soft)" : "#fff",
                          color: sel ? "var(--brand-fg)" : "var(--fg-2)",
                          font: `${sel ? 700 : 500} 12px/1 var(--font-sans)`,
                          borderRadius: 6, cursor: "pointer",
                        }}>{o.label}</button>
                      );
                    })}
                  </div>
                </Field>
              </div>
              <Field label={jump.credType === "sshkey" ? "Private key" : "Password"} required>
                {jump.credType === "sshkey"
                  ? <textarea className="input t-mono" rows={3} value={jump.secret} onChange={e => setJump({ secret: e.target.value })} placeholder="-----BEGIN OPENSSH PRIVATE KEY-----"/>
                  : <input className="input" type="password" value={jump.secret} onChange={e => setJump({ secret: e.target.value })} placeholder="••••••••••••"/>}
              </Field>
            </div>
          ) : (
            <div>
              <input className="input" value={q} onChange={e => setQ(e.target.value)} placeholder="Search vaulted credentials…"/>
              <div style={{ marginTop: 8, border: "1px solid var(--border)", borderRadius: 6, overflow: "hidden", maxHeight: 200, overflowY: "auto" }}>
                {vaulted.length === 0 ? (
                  <div style={{ padding: 14, font: "400 12px/1.5 var(--font-sans)", color: "var(--fg-4)", textAlign: "center" }}>
                    No vaulted Password or SSH Key credentials match. Bastion logins must be one of those two types.
                  </div>
                ) : vaulted.slice(0, 8).map(c => {
                  const sel = jump.existingId === c.id;
                  return (
                    <button key={c.id} onClick={() => setJump({ existingId: c.id })} style={{
                      display: "flex", alignItems: "center", gap: 10, width: "100%",
                      padding: "9px 12px", border: "none", borderBottom: "1px solid var(--border-subtle)",
                      background: sel ? "var(--brand-soft)" : "transparent", cursor: "pointer", textAlign: "left",
                    }}>
                      <Icon name={c.type === "SSH Key" ? "key" : "lock"} size={13} color="var(--fg-3)"/>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="t-mono" style={{ font: "500 12.5px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{c.display}</div>
                        <div className="t-tiny" style={{ color: "var(--fg-4)" }}>{c.type} · {c.username}{c.resource ? ` · ${c.resource}` : ""}</div>
                      </div>
                      {sel && <Icon name="check" size={13} color="var(--brand-fg)"/>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Protocol compatibility — warning, never a block. PAM can't see
              the bastion's real forwarding config. */}
          {conflict && (
            <div style={{ padding: 10, background: "var(--warning-soft)", color: "var(--warning-fg)", borderLeft: "3px solid var(--warning-fg)", borderRadius: "0 4px 4px 0", font: "500 12px/1.5 var(--font-sans)" }}>
              ⚠ This jump host may not support proxying to a {conflict} target. Confirm your bastion supports protocol forwarding for this resource type before continuing.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// =========================================================
// TROUBLESHOOT PANEL (Surface G · connector offline)
// Three sequential diagnostic cards + live status that polls every 10s.
// Each step has the exact command to run and the output to expect —
// the admin never has to leave PAM to know what "healthy" looks like.
// =========================================================
const ZTNATroubleshootPanel = () => {
  const store = window.useZtna();
  const c = store.connectors.find(cc => cc.id === store.troubleConnectorId);
  const [checked, setChecked] = React.useState({});
  const [pollTick, setPollTick] = React.useState(0);
  const [escalOpen, setEscalOpen] = React.useState(false);
  // Live status poll — every 10 seconds re-read connector status. The store
  // emit on simulateReconnect() also re-renders immediately, so the poll is
  // mostly belt-and-braces (and matches the spec's 10s cadence).
  React.useEffect(() => {
    const t = setInterval(() => setPollTick(x => x + 1), 10000);
    return () => clearInterval(t);
  }, []);
  if (!c) return null;
  const site = store.sites.find(s => s.id === c.siteId);
  const status = store.connectorStatus(c);
  const online = status === "online";

  const steps = [
    {
      id: "vm", title: "Is the VM running?",
      body: "SSH into your connector host and check if the connector process is running.",
      cmd: "systemctl status pam-connector",
      expect: 'Active: active (running)',
    },
    {
      id: "reach", title: "Can the VM reach PAM?",
      body: "The connector needs outbound HTTPS to PAM. Verify from the host:",
      cmd: "curl -v https://pam.northwind.com/healthz",
      expect: "HTTP 200",
    },
    {
      id: "restart", title: "Restart the connector",
      body: "After restarting, watch for this status in PAM — it should turn green within 60 seconds.",
      cmd: "systemctl restart pam-connector",
      expect: null,
    },
  ];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.35)", display: "flex", justifyContent: "flex-end" }} onClick={() => window.ztnaStore.close()}>
      <aside onClick={e => e.stopPropagation()} style={{ width: 480, maxWidth: "100vw", background: "#fff", height: "100%", display: "flex", flexDirection: "column", boxShadow: "-24px 0 60px rgba(0,0,0,0.14)" }}>
        <div style={{ padding: "16px 22px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ font: "700 15px/1.2 var(--font-sans)", color: "var(--fg-1)" }}>Connector offline — {c.name}</div>
            <div className="t-tiny" style={{ color: "var(--fg-3)", marginTop: 2 }}>{site?.name}</div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={() => window.ztnaStore.close()} aria-label="Close"><Icon name="x" size={14}/></button>
        </div>

        <div className="scroll-area" style={{ flex: 1, overflow: "auto", padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
          {!online && (
            <div style={{ padding: 12, background: "var(--danger-soft)", color: "var(--danger-fg)", borderRadius: 6, font: "500 12.5px/1.5 var(--font-sans)" }}>
              Last heartbeat: {store.fmtHeartbeat(c)} (expected every {c.heartbeatIntervalSec} seconds)
            </div>
          )}

          {/* Diagnostic steps */}
          {!online && steps.map((s, i) => (
            <div key={s.id} className="card" style={{ padding: 14, opacity: checked[s.id] ? 0.75 : 1 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", background: checked[s.id] ? "var(--success-fg)" : "var(--bg-surface-2)", color: checked[s.id] ? "#fff" : "var(--fg-3)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none", font: "700 11px/1 var(--font-sans)" }}>
                  {checked[s.id] ? "✓" : i + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ font: "600 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{s.title}</div>
                  <div style={{ font: "400 12px/1.5 var(--font-sans)", color: "var(--fg-3)", marginTop: 3 }}>{s.body}</div>
                  <pre style={{ margin: "8px 0 0", padding: 10, background: "#0F1115", color: "#DFE3E8", font: "500 11.5px/1.5 var(--font-mono)", borderRadius: 4, overflow: "auto", whiteSpace: "pre-wrap" }}>{s.cmd}</pre>
                  {s.expect && (
                    <div style={{ marginTop: 6, font: "400 11.5px/1.4 var(--font-sans)", color: "var(--fg-4)" }}>
                      Expected: <span className="t-mono" style={{ color: "var(--success-fg)" }}>{s.expect}</span>
                    </div>
                  )}
                  <label style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 8, cursor: "pointer", font: "500 12px/1 var(--font-sans)", color: "var(--fg-2)" }}>
                    <input type="checkbox" checked={!!checked[s.id]} onChange={() => setChecked(p => ({ ...p, [s.id]: !p[s.id] }))} style={{ accentColor: "var(--brand-fg)" }}/>
                    Mark as checked
                  </label>
                </div>
              </div>
            </div>
          ))}

          {/* Live status */}
          <div style={{ padding: 14, border: `1px solid ${online ? "var(--success-fg)" : "var(--border)"}`, borderRadius: 8, background: online ? "var(--success-soft)" : "var(--bg-surface)" }}>
            {online ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--success-fg)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>✓</div>
                <div style={{ font: "600 13px/1.3 var(--font-sans)", color: "var(--success-fg)" }}>Online — {c.name} reconnected</div>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Spinner size={13}/>
                <div style={{ flex: 1 }}>
                  <div style={{ font: "600 12.5px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>Connector status: ✗ Offline</div>
                  <div className="t-tiny" style={{ color: "var(--fg-4)", marginTop: 2 }}>Still waiting for heartbeat… checking every 10 seconds</div>
                </div>
                <button className="btn btn-sm" onClick={() => window.ztnaStore.simulateReconnect(c.id)} style={{ fontSize: 11 }}>[Demo] Simulate reconnect</button>
              </div>
            )}
          </div>

          {/* Escalation */}
          {!online && (
            <div>
              <button className="btn btn-ghost btn-sm" onClick={() => setEscalOpen(!escalOpen)} style={{ color: "var(--fg-3)" }}>
                Something else wrong? {escalOpen ? "↑" : "↓"}
              </button>
              {escalOpen && (
                <div style={{ marginTop: 8, padding: 12, background: "var(--bg-surface-2)", borderRadius: 6, font: "400 12px/1.6 var(--font-sans)", color: "var(--fg-2)" }}>
                  <div>· Check connector logs: <span className="t-mono">journalctl -u pam-connector -n 100</span></div>
                  <div>· Verify the enrollment certificate has not been revoked (Connectors → {c.name} → certificate).</div>
                  <div>· If the host was re-imaged, re-enroll with a fresh token — the old identity will not reconnect.</div>
                  <div style={{ marginTop: 8 }}>
                    <a href="#" onClick={e => e.preventDefault()} style={{ color: "var(--brand-fg)", textDecoration: "underline", fontWeight: 500 }}>Open connector documentation →</a>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {online && (
          <div style={{ padding: "12px 22px", borderTop: "1px solid var(--border)", background: "var(--bg-surface)", textAlign: "right" }}>
            <button className="btn btn-primary" onClick={() => window.ztnaStore.close()}>Close</button>
          </div>
        )}
      </aside>
    </div>
  );
};

// =========================================================
// ZTNA ROUTING ROW (Surface F) — dropped into the resource detail
// Security Posture card. Reads the resource's site assignment from the
// store; renders nothing for resources that route direct.
// States: reachable · degraded · unreachable · not configured
// =========================================================
const ZTNARoutingRow = ({ resourceName }) => {
  const store = window.useZtna();
  const assignment = store.resourceAssignments.find(a => a.resource === resourceName);
  if (!assignment) return null;
  const site = store.sites.find(s => s.id === assignment.siteId);
  if (!site) return null;
  const siteStatus = store.siteStatus(site.id);
  const view = siteStatus === "online" ? { status: "online",        label: "Reachable" }
             : siteStatus === "not-enrolled" ? { status: "not-enrolled", label: "Not configured" }
             : siteStatus === "offline" ? { status: "offline",      label: "Unreachable" }
             : { status: "degraded", label: "Degraded" };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", font: "400 12.5px/1.4 var(--font-sans)" }}>
      <span style={{ color: "var(--fg-4)", width: 110, flex: "none" }}>ZTNA Routing</span>
      <ZTNADot status={view.status}/>
      <span className="t-mono" style={{ color: "var(--fg-1)", fontWeight: 500 }}>{site.name}</span>
      <span style={{ color: ZTNA_STATUS[view.status].fg, fontWeight: 500 }}>— {view.label}</span>
      <div style={{ flex: 1 }}/>
      <a href="#" onClick={e => { e.preventDefault(); window.ztnaStore.openSiteDetail(site.id); }} style={{ font: "500 11.5px/1 var(--font-sans)", color: "var(--brand-fg)" }}>View connectors →</a>
    </div>
  );
};

// =========================================================
// RESOURCE UNREACHABLE BANNER (Surface F) — shown at the top of the
// resource detail page when the assigned site can't reach the resource.
// Distinct copy per failure mode (offline vs not-enrolled), per spec.
// =========================================================
const ZTNAResourceBanner = ({ resourceName }) => {
  const store = window.useZtna();
  const assignment = store.resourceAssignments.find(a => a.resource === resourceName);
  if (!assignment) return null;
  const site = store.sites.find(s => s.id === assignment.siteId);
  if (!site) return null;
  const siteStatus = store.siteStatus(site.id);
  if (siteStatus === "online" || siteStatus === "degraded") return null;

  if (siteStatus === "not-enrolled") {
    return (
      <div style={{ margin: "0 0 14px", padding: 12, background: "var(--bg-surface-2)", borderLeft: "3px solid var(--fg-4)", borderRadius: "0 6px 6px 0", display: "flex", alignItems: "center", gap: 10, font: "500 12.5px/1.5 var(--font-sans)", color: "var(--fg-2)" }}>
        <span style={{ color: "var(--fg-4)" }}>○</span>
        <span style={{ flex: 1 }}>
          ZTNA connector not configured — <strong>{site.name}</strong> has no active connectors. This resource will be unreachable until a connector is deployed.
        </span>
        <button className="btn btn-sm btn-primary" onClick={() => window.ztnaStore.openSetupExistingSite(site.id)}>Deploy a connector →</button>
      </div>
    );
  }

  // partial-with-no-online or full offline → unreachable
  const anyOnline = store.siteConnectors(site.id).some(c => store.connectorStatus(c) === "online");
  if (anyOnline) return null;
  const offlineConn = store.siteConnectors(site.id).find(c => store.connectorStatus(c) === "offline");
  return (
    <div style={{ margin: "0 0 14px", padding: 12, background: "var(--danger-soft)", borderLeft: "3px solid var(--danger-fg)", borderRadius: "0 6px 6px 0", display: "flex", alignItems: "center", gap: 10, font: "500 12.5px/1.5 var(--font-sans)", color: "var(--danger-fg)" }}>
      <Icon name="alert-triangle" size={14} color="var(--danger-fg)"/>
      <span style={{ flex: 1 }}>
        <strong>This resource is unreachable</strong> — connector offline in {site.name}. Active sessions may have dropped. New sessions cannot be established.
      </span>
      {offlineConn && <button className="btn btn-sm" onClick={() => window.ztnaStore.openTroubleshoot(offlineConn.id)} style={{ color: "var(--danger-fg)", borderColor: "var(--danger-fg)" }}>Fix connector issue →</button>}
    </div>
  );
};

// =========================================================
// RESOURCES-LIST CONNECTION BADGE (Surface F) — compact variant for
// the Resources table Connection column. Returns null for non-ZTNA
// resources so the existing cell content stands.
// =========================================================
const ZTNAListBadge = ({ resourceName }) => {
  const store = window.useZtna();
  const assignment = store.resourceAssignments.find(a => a.resource === resourceName);
  if (!assignment) return null;
  const reachable = store.resourceReachable(assignment.siteId);
  if (reachable) return null;   // healthy ZTNA routing needs no callout in the list
  return (
    <span style={{ display: "inline-flex", flexDirection: "column", gap: 1 }}>
      <span style={{ font: "600 11px/1.3 var(--font-sans)", color: "var(--danger-fg)" }}>✗ Unreachable</span>
      <span style={{ font: "500 9.5px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.5 }}>ZTNA</span>
    </span>
  );
};

// =========================================================
// DASHBOARD SIGNALS (Surface F) — compact alert lines for the admin
// dashboard's Operational tab. Renders nothing when everything is healthy.
// =========================================================
const ZTNADashboardSignals = () => {
  const store = window.useZtna();
  const signals = [];
  store.sites.forEach(site => {
    const conns = store.siteConnectors(site.id);
    const anyOnline = conns.some(c => store.connectorStatus(c) === "online");
    const offline = conns.filter(c => store.connectorStatus(c) === "offline");
    const affected = store.siteResources(site.id).length;
    if (!anyOnline && offline.length > 0 && affected > 0) {
      signals.push({ kind: "danger", text: `${affected} resource${affected === 1 ? "" : "s"} unreachable — ${offline[0].name} offline`, action: () => window.ztnaStore.openTroubleshoot(offline[0].id), actionLabel: "Troubleshoot →" });
    }
  });
  const expiring = store.connectors.filter(c => store.certExpiringSoon(c));
  if (expiring.length > 0) {
    signals.push({ kind: "warning", text: `${expiring.length} connector certificate${expiring.length === 1 ? "" : "s"} expire${expiring.length === 1 ? "s" : ""} in ${store.certDaysLeft(expiring[0])} days`, action: () => window.ztnaStore.openRenew(expiring[0].id), actionLabel: "Renew →" });
  }
  if (signals.length === 0) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
      {signals.map((s, i) => (
        <div key={i} style={{ padding: "9px 12px", background: s.kind === "danger" ? "var(--danger-soft)" : "var(--warning-soft)", color: s.kind === "danger" ? "var(--danger-fg)" : "var(--warning-fg)", borderRadius: 6, display: "flex", alignItems: "center", gap: 8, font: "500 12px/1.4 var(--font-sans)" }}>
        <Icon name={s.kind === "danger" ? "alert-triangle" : "alert-circle"} size={13} color={s.kind === "danger" ? "var(--danger-fg)" : "var(--warning-fg)"}/>
          <span style={{ flex: 1 }}>{s.text}</span>
          <button className="btn btn-sm" onClick={s.action} style={{ fontSize: 11 }}>{s.actionLabel}</button>
        </div>
      ))}
    </div>
  );
};

Object.assign(window, {
  ZTNAConnectorsPage,
  ZTNAController,
  ZTNADeleteModal,
  ZTNATroubleshootPanel,
  ZTNARoutingRow,
  ZTNAResourceBanner,
  ZTNAListBadge,
  ZTNADashboardSignals,
  ZTNAConceptPanel,
  ZTNASiteDetailPanel,
  ZTNASiteCard,
  ZTNAConnectorRow,
  ZTNAStatusBadge,
  ZTNADot,
  ZTNAEmptyState,
  ZTNAAlertBanner,
  ZTNASetupFlow,
  ZTNAStepIndicator,
  ZTNACertRenewPanel,
  ZTNASitePicker,
  ZTNASiteHealthCard,
  ZTNANetworkRoutingSection,
});
