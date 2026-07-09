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
      { id: "site-mumbai",    name: "AWS Mumbai VPC",       environment: "AWS",     region: "ap-south-1",  description: "Primary APAC region — ledger + auth + reporting DBs live here.", createdAt: now - 45 * 86400000 },
      { id: "site-frankfurt", name: "On-prem Frankfurt DC", environment: "On-prem", region: "eu-central-1", description: "European data-residency workloads.", createdAt: now - 21 * 86400000 },
      { id: "site-tokyo",     name: "Azure Tokyo",          environment: "Azure",   region: "japaneast",    description: "Recently added — no connector deployed yet.",                  createdAt: now - 2 * 86400000 },
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
    open: null,          // 'concept' | 'site-detail' | 'add-site' | 'add-connector' | 'setup-flow' | 'troubleshoot' | 'cert-renew'
    detailSiteId: null,
    troubleConnectorId: null,
    renewConnectorId: null,

    emit: () => listeners.forEach(fn => fn()),
    subscribe: (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
    getNow: () => now,   // deterministic clock for the demo

    // ── mutators ───────────────────────────────────────────
    openConcept:      () => { store.open = "concept";      store.emit(); },
    openSiteDetail:   (id) => { store.detailSiteId = id; store.open = "site-detail"; store.emit(); },
    close:            () => { store.open = null; store.detailSiteId = null; store.troubleConnectorId = null; store.renewConnectorId = null; store.emit(); },

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
              <button className="btn btn-sm" onClick={() => window.pamToast && window.pamToast("Add-connector flow arrives in Phase 2", "info")}>+ Add connector</button>
            </div>
            {conns.length === 0 ? (
              <div style={{ padding: 14, background: "var(--bg-surface-2)", borderRadius: 6, font: "400 12.5px/1.5 var(--font-sans)", color: "var(--fg-3)", textAlign: "center" }}>
                No connectors deployed yet. Add one to activate this site.
              </div>
            ) : conns.map(c => <ZTNAConnectorRow key={c.id} c={c} compact/>)}
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
        </div>
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
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: compact ? "8px 10px" : "10px 12px", background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: 6, marginBottom: 6 }}>
      <ZTNADot status={status}/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
          <span className="t-mono" style={{ font: "500 12.5px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{c.name}</span>
          <span style={{ padding: "1px 7px", background: "var(--bg-surface-2)", color: "var(--fg-3)", borderRadius: 4, font: "500 10.5px/1.4 var(--font-sans)" }}>{c.platform}</span>
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
        <button className="btn btn-sm" onClick={() => window.pamToast && window.pamToast("Troubleshoot panel arrives in Phase 3", "info")} style={{ color: "var(--danger-fg)", borderColor: "var(--danger-fg)" }}>
          Troubleshoot →
        </button>
      )}
      {certSoon && status !== "offline" && (
        <button className="btn btn-sm" onClick={() => window.pamToast && window.pamToast("Cert renewal flow arrives in Phase 3", "info")}>
          Renew →
        </button>
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

  return (
    <div className="card" style={{ borderLeft: `3px solid ${accent}`, padding: 16, marginBottom: 14 }}>
      {/* Card header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <button onClick={() => window.ztnaStore.openSiteDetail(site.id)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", font: "700 15px/1.2 var(--font-sans)", color: "var(--fg-1)" }}>{site.name}</button>
        <span style={{ padding: "1px 7px", background: "var(--bg-surface-2)", color: "var(--fg-3)", borderRadius: 4, font: "500 10.5px/1.4 var(--font-sans)" }}>{site.environment}</span>
        <ZTNAStatusBadge status={status}/>
        {status === "partial" && <span className="t-tiny" style={{ color: "var(--warning-fg)", fontWeight: 500 }}>{onlineCount}/{totalCount} connectors online</span>}
        <div style={{ flex: 1 }}/>
        <button className="btn btn-sm" onClick={() => window.ztnaStore.openSiteDetail(site.id)}><Icon name="edit" size={12}/></button>
        <button className="btn btn-sm" onClick={() => window.pamToast && window.pamToast("Add-connector flow arrives in Phase 2", "info")}>+ Add connector</button>
      </div>

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
              <button className="btn btn-sm btn-primary" onClick={() => window.pamToast && window.pamToast("Setup flow arrives in Phase 2", "info")}>+ Add connector</button>
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
      <button className="btn btn-primary" onClick={() => window.pamToast && window.pamToast("Setup flow arrives in Phase 2", "info")}>
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
        action={!isEmpty && (
          <button className="btn btn-primary" onClick={() => window.pamToast && window.pamToast("Add-site flow arrives in Phase 2", "info")}>
            + Add site
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

      {/* Overlays / panels */}
      {store.open === "concept"     && <ZTNAConceptPanel/>}
      {store.open === "site-detail" && <ZTNASiteDetailPanel/>}
    </div>
  );
};

Object.assign(window, {
  ZTNAConnectorsPage,
  ZTNAConceptPanel,
  ZTNASiteDetailPanel,
  ZTNASiteCard,
  ZTNAConnectorRow,
  ZTNAStatusBadge,
  ZTNADot,
  ZTNAEmptyState,
  ZTNAAlertBanner,
});
