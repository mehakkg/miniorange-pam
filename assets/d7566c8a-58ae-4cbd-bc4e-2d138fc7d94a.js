// Resource Add Panel — V3 rewrite.
// Panel-based slide-in with two admin flows:
//   • Manual — 3-step wizard: Resource + Root credential → Review PAM
//     configuration → Confirm. PAM infers rotation policy, local-account
//     handling, and reconciliation account from env × criticality and the
//     root credential type. Only the root credential itself requires
//     deliberate admin input; everything else is a reviewable override.
//   • Bulk — after CSV / AD / network scan seeds a candidate list, the
//     admin edits per-row criticality, supplies a root credential
//     (individual or shared), and submits. Every row is onboarded through
//     the same PAM-inferred path in the background; the result screen
//     reports per-row outcomes with a retry that only re-runs failures.

const PANEL_BACKDROP = {
  position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.45)",
  zIndex: 100, display: "flex", justifyContent: "flex-end",
  animation: "fadeIn 180ms ease",
};
const PANEL_BODY = {
  width: "min(960px, 92vw)", height: "100%", background: "var(--bg-app)",
  display: "flex", flexDirection: "column",
  boxShadow: "-8px 0 32px rgba(0,0,0,0.18)",
  animation: "slideInR 240ms cubic-bezier(.2,.7,.2,1)",
};

const Panel = ({ title, onClose, children, footer, back }) => (
  <div style={PANEL_BACKDROP} onClick={onClose}>
    <div style={PANEL_BODY} onClick={e => e.stopPropagation()}>
      <header style={{
        height: 56, padding: "0 24px", borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", gap: 10, flex: "none",
      }}>
        {back && <button className="btn btn-ghost btn-sm btn-icon" onClick={back} title="Back"><Icon name="chevron-left" size={14}/></button>}
        <h2 style={{ font: "600 15px/1 var(--font-sans)", color: "var(--fg-1)", margin: 0 }}>{title}</h2>
        <div style={{ flex: 1 }}/>
        <button className="btn btn-ghost btn-sm btn-icon" onClick={onClose} title="Close"><Icon name="close" size={14}/></button>
      </header>
      <div className="scroll-area" style={{ flex: 1, overflow: "auto" }}>{children}</div>
      {footer && <footer style={{ borderTop: "1px solid var(--border)", padding: "12px 24px", display: "flex", alignItems: "center", gap: 10, flex: "none", background: "var(--bg-surface)" }}>{footer}</footer>}
    </div>
  </div>
);

// Generic step indicator — pass the step number + a list of { n, label }.
const StepIndicator = ({ step, steps }) => (
  <div style={{ display: "flex", alignItems: "center", padding: "16px 24px", gap: 8, borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-surface)" }}>
    {steps.map((s, i) => {
      const done = step > s.n;
      const active = step === s.n;
      return (
        <React.Fragment key={s.n}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 22, height: 22, borderRadius: "50%",
              background: done ? "var(--success)" : active ? "var(--brand)" : "var(--bg-surface-2)",
              color: done || active ? "#fff" : "var(--fg-3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              font: "600 11px/1 var(--font-sans)", flex: "none",
              border: !done && !active ? "1px solid var(--border)" : "none",
            }}>{done ? <Icon name="check" size={11} color="#fff"/> : s.n}</div>
            <span style={{ font: `${active ? 600 : 500} 12.5px/1 var(--font-sans)`, color: active ? "var(--fg-1)" : done ? "var(--fg-2)" : "var(--fg-4)" }}>{s.label}</span>
          </div>
          {i < steps.length - 1 && <div style={{ flex: 1, height: 1, background: done ? "var(--success)" : "var(--border)", maxWidth: 64 }}/>}
        </React.Fragment>
      );
    })}
  </div>
);

const Field = ({ label, required, hint, error, children }) => (
  <label style={{ display: "block" }}>
    <div style={{ font: "500 12px/1.4 var(--font-sans)", color: "var(--fg-2)", marginBottom: 6 }}>
      {label}{required && <span style={{ color: "var(--danger-fg)", marginLeft: 2 }}>*</span>}
    </div>
    {children}
    {error && <div style={{ font: "400 11.5px/1.4 var(--font-sans)", color: "var(--danger-fg)", marginTop: 5, display: "flex", gap: 4, alignItems: "flex-start" }}>
      <Icon name="alert-circle" size={11} color="var(--danger-fg)" style={{ marginTop: 2 }}/><span>{error}</span>
    </div>}
    {hint && !error && <div style={{ font: "400 11.5px/1.4 var(--font-sans)", color: "var(--fg-4)", marginTop: 4 }}>{hint}</div>}
  </label>
);

const Pill = ({ active, onClick, icon, children }) => (
  <button type="button" onClick={onClick} style={{
    padding: "10px 16px", borderRadius: 8, gap: 8, display: "inline-flex", alignItems: "center",
    border: `1px solid ${active ? "var(--brand)" : "var(--border)"}`,
    background: active ? "var(--brand-soft)" : "var(--bg-surface)",
    color: active ? "var(--brand-fg)" : "var(--fg-2)",
    font: "500 13px/1 var(--font-sans)", cursor: "pointer",
  }}>
    {icon && <Icon name={icon} size={14}/>}{children}
  </button>
);

const Segmented = ({ value, options, onChange }) => (
  <div style={{ display: "inline-flex", padding: 3, background: "var(--bg-surface-2)", border: "1px solid var(--border)", borderRadius: 7, gap: 2 }}>
    {options.map(o => (
      <button key={o.value} type="button" onClick={() => onChange(o.value)} style={{
        padding: "6px 14px", border: "none", borderRadius: 5, cursor: "pointer",
        background: value === o.value ? "var(--bg-surface)" : "transparent",
        color: value === o.value ? "var(--fg-1)" : "var(--fg-3)",
        font: "500 12.5px/1 var(--font-sans)",
        boxShadow: value === o.value ? "0 1px 2px rgba(0,0,0,0.06), 0 0 0 1px var(--border)" : "none",
      }}>{o.label}</button>
    ))}
  </div>
);

// ─── Entry-method picker (unchanged from the previous build) ────────────────
const EntryMethodCards = ({ onPick }) => {
  const groups = [
    { label: "Single resource", cards: [{ id: "manual", icon: "edit", title: "Add manually", sub: "Configure one server, database, or app by entering its details", cta: "Continue" }] },
    { label: "Discover at scale", cards: [
      { id: "scan",   icon: "discovery", title: "Network scan",        sub: "Sweep an IP range or subnet to find unmanaged assets", cta: "Set up scan",  badge: "Recommended" },
      { id: "cloud",  icon: "cloud",     title: "Cloud discovery",     sub: "Pull resources from AWS, Azure, GCP via connected accounts", cta: "Choose provider" },
      { id: "ad",     icon: "people",    title: "Import from AD",      sub: "Pull machines from your connected Active Directory", cta: "Import" },
      { id: "k8s",    icon: "cloud",     title: "Kubernetes clusters", sub: "Discover workloads and nodes from a kubeconfig",     cta: "Connect cluster" },
    ]},
    { label: "Bulk import", cards: [
      { id: "csv",    icon: "file-text", title: "CSV upload",       sub: "Upload a spreadsheet using our template", cta: "Upload file" },
      { id: "api",    icon: "key",       title: "API / Terraform",  sub: "Programmatic onboarding via REST or Terraform provider", cta: "View docs" },
    ]},
  ];
  const Card = ({ c }) => (
    <button onClick={() => onPick(c.id)} style={{
      position: "relative",
      background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 8,
      padding: 16, cursor: "pointer", textAlign: "left",
      display: "flex", flexDirection: "column", gap: 10, minHeight: 152,
      transition: "all 120ms ease",
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--brand)"; e.currentTarget.style.background = "var(--brand-soft)"; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--bg-surface)"; }}
    >
      {c.badge && <span className="badge badge-brand" style={{ position: "absolute", top: 12, right: 12 }}>{c.badge}</span>}
      <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--brand-soft)", color: "var(--brand-fg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name={c.icon} size={16}/>
      </div>
      <div>
        <div style={{ font: "600 13.5px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{c.title}</div>
        <div style={{ font: "400 12px/1.5 var(--font-sans)", color: "var(--fg-3)", marginTop: 3 }}>{c.sub}</div>
      </div>
      <div style={{ flex: 1 }}/>
      <div style={{ font: "500 12px/1 var(--font-sans)", color: "var(--brand-fg)", display: "flex", alignItems: "center", gap: 4 }}>
        {c.cta} <Icon name="chevron-right" size={11}/>
      </div>
    </button>
  );
  return (
    <div style={{ padding: 28, maxWidth: 880, margin: "0 auto" }}>
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ font: "600 16px/1.3 var(--font-sans)", color: "var(--fg-1)", margin: 0 }}>How do you want to add resources?</h3>
        <p style={{ font: "400 13px/1.5 var(--font-sans)", color: "var(--fg-3)", margin: "6px 0 0" }}>Pick a method based on where your assets live and how many you need to onboard.</p>
      </div>
      {groups.map(g => (
        <div key={g.label} style={{ marginBottom: 22 }}>
          <div style={{ font: "600 11px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10 }}>{g.label}</div>
          <div style={{ display: "grid", gridTemplateColumns: g.cards.length === 1 ? "1fr" : "repeat(2, 1fr)", gap: 10 }}>
            {g.cards.map(c => <Card key={c.id} c={c}/>)}
          </div>
        </div>
      ))}
    </div>
  );
};

const Select = window.Select || (({ value, options, onChange }) => (
  <select className="input" value={value} onChange={e => onChange(e.target.value)} style={{ height: 36 }}>
    {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
  </select>
));
window.Select = Select;

const Toggle = ({ value, onChange, label, hint }) => (
  <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
    <button type="button" onClick={() => onChange(!value)} style={{
      width: 34, height: 20, borderRadius: 10, padding: 2,
      background: value ? "var(--brand)" : "var(--bg-surface-2)",
      border: `1px solid ${value ? "var(--brand)" : "var(--border)"}`,
      cursor: "pointer", display: "flex", alignItems: "center",
      justifyContent: value ? "flex-end" : "flex-start", flex: "none",
      transition: "all 120ms",
    }}>
      <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 2px rgba(0,0,0,0.2)" }}/>
    </button>
    <div>
      <div style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{label}</div>
      {hint && <div style={{ font: "400 11.5px/1.4 var(--font-sans)", color: "var(--fg-4)", marginTop: 3, maxWidth: 480 }}>{hint}</div>}
    </div>
  </div>
);

const Disclosure = ({ label, children, defaultOpen }) => {
  const [open, setOpen] = React.useState(!!defaultOpen);
  return (
    <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: 14 }}>
      <button type="button" onClick={() => setOpen(!open)} style={{
        background: "transparent", border: "none", padding: 0,
        font: "500 12.5px/1 var(--font-sans)", color: "var(--fg-2)",
        cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
      }}>
        <Icon name={open ? "chevron-down" : "chevron-right"} size={11}/>{label}
      </button>
      {open && <div style={{ marginTop: 14 }}>{children}</div>}
    </div>
  );
};

// ─── PAM-suggested tag ──────────────────────────────────────────────────────
// Small brand-tinted outline pill placed next to any field/card PAM auto-
// filled from inference. Signals "this was inferred, override if you want."
const PamSuggestedTag = () => (
  <span style={{
    display: "inline-flex", alignItems: "center", gap: 4,
    padding: "3px 8px", borderRadius: 10,
    border: "1px solid var(--brand)", background: "var(--bg-app)",
    font: "600 10px/1 var(--font-sans)", color: "var(--brand-fg)",
    letterSpacing: 0.5, textTransform: "uppercase",
    whiteSpace: "nowrap",
  }}>
    <Icon name="sparkles" size={9} color="var(--brand-fg)"/>
    PAM-suggested
  </span>
);

// Callout used at the top of the Root-credential section. Brand-left-border
// styling communicates "this is the one thing you must supply yourself."
const HelperCallout = ({ children }) => (
  <div style={{
    borderLeft: "3px solid var(--brand)",
    background: "var(--brand-soft)",
    color: "var(--brand-fg)",
    padding: "10px 14px",
    font: "400 12.5px/1.5 var(--font-sans)",
    borderRadius: 3,
  }}>{children}</div>
);

// ─── Credential Source Picker ─────────────────────────────────────────────
// One component, three outcomes: mint a new credential, attach an existing
// vaulted one, or claim a Discovered one (found on the network but not yet
// vaulted). Renders everywhere a resource-creation flow needs a root
// credential — the wizard's Step 1, and per-row in bulk import panels. The
// three outcomes surface downstream on result tables as the state chips
// New / Vaulted (linked) / Discovered (claimed) so admins see the same
// vocabulary regardless of which entry method they used.
//
// Value shape:
//   null                                              — no selection yet
//   { mode: "new",    username, credType, secret }    — Create new
//   { mode: "attach", credentialId, credentialDisplay } — Use existing → Attach
//   { mode: "claim",  discoveredId, discoveredDisplay } — Use existing → Claim & vault

const DISCOVERED_CREDS = [
  { id: "d-1", display: "admin@10.0.5.4",             type: "Password", foundOn: "auth-server-01",           foundVia: "Network scan",    foundAt: "12h ago" },
  { id: "d-2", display: "pi@raspberry-pi.internal",   type: "Password", foundOn: "raspberry-pi.internal",    foundVia: "Discovery scan",  foundAt: "2 days ago" },
  { id: "d-3", display: "svc-legacy@10.0.5.11",       type: "SSH Key",  foundOn: "old-web-01",                foundVia: "Network scan",    foundAt: "3 days ago" },
];

// Recently used picks — scoped to the admin's own last few Attach/Claim
// actions across every resource. Single shared list (not per-resource) —
// the point of Fix 4 is the bulk-rollout case where the same service-
// account credential is reused across many servers without re-searching.
// Seeded with two demo entries so the chip strip is visible in the state.
if (!globalThis.__PAM_RECENT_PICKS) {
  globalThis.__PAM_RECENT_PICKS = [
    { mode: "attach", credentialId: "c-005", credentialDisplay: "ssh-key-deploy",  credentialType: "SSH Key" },
    { mode: "attach", credentialId: "c-002", credentialDisplay: "linux-ssh-admin", credentialType: "Password" },
  ];
}
const pushRecentPick = (pick) => {
  if (!globalThis.__PAM_RECENT_PICKS) globalThis.__PAM_RECENT_PICKS = [];
  const key = (p) => p.mode === "attach" ? `c:${p.credentialId}` : p.mode === "claim" ? `d:${p.discoveredId}` : null;
  const k = key(pick);
  if (!k) return;
  globalThis.__PAM_RECENT_PICKS = [pick, ...globalThis.__PAM_RECENT_PICKS.filter(p => key(p) !== k)].slice(0, 3);
};

// Fix 1 — compatibility rule. Resource type × credential type. Cheap heuristic,
// not exhaustive. If the resource type is unknown, everything counts as
// compatible so nothing gets accidentally demoted.
const isCredCompatibleWithResource = (cred, resource) => {
  const rt = resource?.type;
  const ct = cred.type;
  if (!rt) return true;
  if (rt === "server")   return ct === "SSH Key" || ct === "Password";
  if (rt === "database") return ct === "Password";
  if (rt === "web")      return ct === "App Secret" || ct === "Password";
  if (rt === "cloud")    return ct === "Password" || (cred.tags || []).includes("cloud-iam");
  return true;
};
const isDiscoveredCompatibleWithResource = (disc, resource) => {
  const rt = resource?.type;
  const dt = disc.type;
  if (!rt) return true;
  if (rt === "server")   return dt === "SSH Key" || dt === "Password";
  if (rt === "database") return dt === "Password";
  if (rt === "web")      return dt === "Password";
  if (rt === "cloud")    return dt === "Password";
  return true;
};

const CredentialSourcePicker = ({ value, onChange, resourceContext, compact, existingOnly, launchContext = "manual", discoveryHost }) => {
  // existingOnly locks the picker to Use-existing. Used by the Break-glass
  // tab's add flow: a credential must already be vaulted before it can be
  // flagged for emergency use — an unvaulted credential can't be marked
  // break-glass-eligible, so hiding the Create-new tab is the right guard.
  const currentMode = value?.mode || "new";
  // Fix 5 — default opening state depends on where the picker was launched:
  //   "manual"             — Vaulted (existing behavior)
  //   "bulk-apply"         — Vaulted (bulk-apply reuses one across many)
  //   "bulk-discovery-row" — Discovered pre-filtered to that host
  //   "break-glass"        — existingOnly forces "existing" already
  const initialTab = existingOnly
    ? "existing"
    : (launchContext === "bulk-apply" || launchContext === "bulk-discovery-row")
      ? "existing"
      : (currentMode === "new" ? "new" : "existing");
  const [tab, setTab] = React.useState(initialTab);
  const [search, setSearch] = React.useState(launchContext === "bulk-discovery-row" && discoveryHost ? discoveryHost : "");
  // For bulk-discovery-row, Discovered is the primary section (shown first,
  // pre-filtered to the host); Vaulted collapses behind a "Show N vaulted" toggle.
  const discoveryFirst = launchContext === "bulk-discovery-row";
  const [showAllVaulted, setShowAllVaulted] = React.useState(!discoveryFirst);
  const [showAllDiscovered, setShowAllDiscovered] = React.useState(false);

  const vaulted = (globalThis.CREDS || []).map(c => ({
    id: c.id, display: c.display, type: c.type, owner: c.owner, resourceCount: (c.resources || []).length,
    resources: c.resources || [], tags: c.tags || [],
  }));
  const q = search.trim().toLowerCase();
  const searchFilter = (str) => q ? str.toLowerCase().includes(q) : true;
  const vaultedMatched = vaulted.filter(c => searchFilter(c.display + " " + (c.owner || "") + " " + c.type));
  const discoveredMatched = DISCOVERED_CREDS.filter(d => searchFilter(d.display + " " + d.foundOn) && (
    // For bulk-discovery-row, additionally hard-scope to the discovery host —
    // once search is manually edited, this stops applying because searchFilter
    // above will already have narrowed the list.
    !discoveryHost || !q || d.foundOn.toLowerCase().includes(discoveryHost.toLowerCase())
  ));

  // Fix 1 — split each list into compatible (with the resource being created)
  // vs everything else. Never remove — grouping only, always reachable.
  const [vaultedCompat, vaultedOther] = vaultedMatched.reduce((acc, c) => {
    acc[isCredCompatibleWithResource(c, resourceContext) ? 0 : 1].push(c);
    return acc;
  }, [[], []]);
  const [discCompat, discOther] = discoveredMatched.reduce((acc, d) => {
    acc[isDiscoveredCompatibleWithResource(d, resourceContext) ? 0 : 1].push(d);
    return acc;
  }, [[], []]);

  const emitAndTrack = (pick) => { onChange(pick); pushRecentPick(pick); };
  const setNew = (patch) => onChange({
    mode: "new",
    username: value?.username || "",
    credType: value?.credType || "password",
    secret: value?.secret || "",
    ...patch,
  });
  const attach = (c) => emitAndTrack({ mode: "attach", credentialId: c.id, credentialDisplay: c.display, credentialType: c.type });
  const claim  = (d) => emitAndTrack({ mode: "claim",  discoveredId: d.id, discoveredDisplay: d.display, credentialType: d.type });

  // Recently used chips — resolve saved picks against current vault + discovered.
  const recentPicks = (globalThis.__PAM_RECENT_PICKS || []).map(p => {
    if (p.mode === "attach") {
      const hit = vaulted.find(v => v.id === p.credentialId);
      return hit ? { ...p, hitVaulted: hit } : null;
    }
    if (p.mode === "claim") {
      const hit = DISCOVERED_CREDS.find(d => d.id === p.discoveredId);
      return hit ? { ...p, hitDiscovered: hit } : null;
    }
    return null;
  }).filter(Boolean);

  const criticality = (resourceContext?.criticality || "").toLowerCase();
  const critImpact = criticality === "critical" || criticality === "high";

  const VaultedRow = ({ c }) => {
    const selected = value?.mode === "attach" && value?.credentialId === c.id;
    const unowned = !c.owner;
    const alreadyAttached = c.resourceCount > 0;
    return (
      <div>
        <button type="button" onClick={() => attach(c)} style={{
          width: "100%", display: "flex", alignItems: "center", gap: 10,
          padding: "10px 12px",
          border: `1px solid ${selected ? "var(--brand)" : "var(--border)"}`,
          background: selected ? "var(--brand-soft)" : "var(--bg-app)",
          borderRadius: 6, cursor: "pointer", textAlign: "left",
        }}>
          <Icon name={c.type === "SSH Key" ? "key" : "lock"} size={13} color="var(--brand-fg)"/>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ font: `${selected ? 600 : 500} 13px/1.3 var(--font-sans)`, color: "var(--fg-1)" }}>{c.display}</span>
              <span style={{ font: "400 11px/1 var(--font-sans)", color: "var(--fg-4)" }}>· {c.type}</span>
              {/* Fix 3 — unowned flag with criticality-scaled emphasis. Never
                  blocks selection; visibility only. */}
              {unowned && (
                <span className={critImpact ? "badge badge-danger" : "badge"} style={{ gap: 4 }}>
                  <Icon name="alert-triangle" size={10}/> No owner assigned
                </span>
              )}
            </div>
            <div style={{ font: "400 11.5px/1.4 var(--font-sans)", color: "var(--fg-4)", marginTop: 2 }}>
              {c.owner || "Unassigned"} · {c.resourceCount} resource{c.resourceCount === 1 ? "" : "s"}
            </div>
          </div>
          <span style={{ font: "600 11.5px/1 var(--font-sans)", color: "var(--brand-fg)", padding: "4px 10px", border: "1px solid var(--brand)", borderRadius: 999 }}>
            {selected ? "Selected" : "Attach"}
          </span>
        </button>
        {/* Fix 2 — consequence line for reuse. Only shown when the row is
            SELECTED (not hovered) and the cred already has attached resources.
            Not a blocking dialog — inline context that turns Attach from a
            blind click into an informed one. This is where the shared-credential
            (Dependent/Subscriber) relationship gets created. */}
        {selected && alreadyAttached && (
          <div style={{ marginTop: 6, padding: "8px 10px 8px 22px", background: "var(--brand-soft)", borderLeft: "3px solid var(--brand)", borderRadius: 4, font: "400 12px/1.5 var(--font-sans)", color: "var(--brand-fg)" }}>
            <strong style={{ color: "var(--brand-fg)" }}>Currently on {c.resources.slice(0, 2).join(", ")}{c.resources.length > 2 ? ` +${c.resources.length - 2} more` : ""}.</strong> Attaching here makes this a shared credential across {c.resourceCount + 1} resources — they'll rotate together.
          </div>
        )}
      </div>
    );
  };

  const DiscoveredRow = ({ d }) => {
    const selected = value?.mode === "claim" && value?.discoveredId === d.id;
    return (
      <button type="button" onClick={() => claim(d)} style={{
        width: "100%", display: "flex", alignItems: "center", gap: 10,
        padding: "10px 12px",
        border: `1px solid ${selected ? "var(--brand)" : "var(--border)"}`,
        background: selected ? "var(--brand-soft)" : "var(--bg-app)",
        borderRadius: 6, cursor: "pointer", textAlign: "left",
      }}>
        <Icon name="eye" size={13} color="var(--warning-fg)"/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div>
            <span className="t-mono" style={{ font: `${selected ? 600 : 500} 12.5px/1.3 var(--font-sans)`, color: "var(--fg-1)" }}>{d.display}</span>
            <span style={{ marginLeft: 8, font: "400 11px/1 var(--font-sans)", color: "var(--fg-4)" }}>· {d.type}</span>
          </div>
          <div style={{ font: "400 11.5px/1.4 var(--font-sans)", color: "var(--fg-4)", marginTop: 2 }}>Found via {d.foundVia} · {d.foundAt} · on {d.foundOn}</div>
        </div>
        <span style={{ font: "600 11.5px/1 var(--font-sans)", color: "var(--brand-fg)", padding: "4px 10px", border: "1px solid var(--brand)", borderRadius: 999 }}>
          {selected ? "Selected" : "Claim & vault"}
        </span>
      </button>
    );
  };

  const SectionHeader = ({ label, count, hint }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
      <span style={{ font: "600 10.5px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.6 }}>{label}</span>
      <span className="badge">{count}</span>
      {hint && <span style={{ font: "400 11px/1.4 var(--font-sans)", color: "var(--fg-4)" }}>{hint}</span>}
    </div>
  );

  const VaultedSection = (
    <div>
      <SectionHeader
        label={launchContext === "bulk-discovery-row" ? "Vaulted" : "Vaulted"}
        count={vaultedMatched.length}
        hint={launchContext === "bulk-discovery-row" ? null : "Already managed by PAM · reuse without re-entering the secret"}
      />
      {vaultedMatched.length === 0 ? (
        <div style={{ padding: 14, textAlign: "center", font: "400 12px/1.5 var(--font-sans)", color: "var(--fg-4)" }}>
          {q ? `No vaulted credentials match "${search}".` : "No vaulted credentials yet."}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {vaultedCompat.length > 0 && (
            <>
              {resourceContext?.type && vaultedOther.length > 0 && (
                <div style={{ font: "500 11px/1.3 var(--font-sans)", color: "var(--fg-4)", padding: "2px 4px" }}>
                  Matches this resource · <strong style={{ color: "var(--fg-2)" }}>{vaultedCompat.length}</strong>
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: compact ? 180 : 240, overflowY: "auto", paddingRight: 4 }}>
                {vaultedCompat.map(c => <VaultedRow key={c.id} c={c}/>)}
              </div>
            </>
          )}
          {vaultedOther.length > 0 && (
            <div style={{ marginTop: vaultedCompat.length ? 4 : 0 }}>
              {resourceContext?.type && vaultedCompat.length > 0 ? (
                <button type="button" onClick={() => setShowAllVaulted(x => !x)} style={{
                  width: "100%", padding: "8px 10px",
                  border: "1px dashed var(--border)", background: "transparent",
                  color: "var(--brand-fg)", borderRadius: 6, cursor: "pointer",
                  font: "500 12px/1 var(--font-sans)", textAlign: "left",
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                  <Icon name={showAllVaulted ? "chevron-down" : "chevron-right"} size={11} color="var(--brand-fg)"/>
                  {showAllVaulted ? `Hide other vaulted credentials` : `Show all ${vaultedOther.length} other vaulted credential${vaultedOther.length === 1 ? "" : "s"} →`}
                </button>
              ) : null}
              {(showAllVaulted || !resourceContext?.type || vaultedCompat.length === 0) && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6, maxHeight: compact ? 180 : 240, overflowY: "auto", paddingRight: 4 }}>
                  {vaultedOther.map(c => <VaultedRow key={c.id} c={c}/>)}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );

  const DiscoveredSection = (
    <div>
      <SectionHeader
        label="Discovered"
        count={discoveredMatched.length}
        hint={launchContext === "bulk-discovery-row" ? `On ${discoveryHost || "this host"} · claim to manage` : "Found on the network but not yet vaulted · claim to manage"}
      />
      {discoveredMatched.length === 0 ? (
        <div style={{ padding: 14, textAlign: "center", font: "400 12px/1.5 var(--font-sans)", color: "var(--fg-4)" }}>
          {q ? `No discovered credentials match "${search}".` : "No discovered credentials yet."}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {discCompat.length > 0 && (
            <>
              {resourceContext?.type && discOther.length > 0 && (
                <div style={{ font: "500 11px/1.3 var(--font-sans)", color: "var(--fg-4)", padding: "2px 4px" }}>
                  Matches this resource · <strong style={{ color: "var(--fg-2)" }}>{discCompat.length}</strong>
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: compact ? 140 : 200, overflowY: "auto", paddingRight: 4 }}>
                {discCompat.map(d => <DiscoveredRow key={d.id} d={d}/>)}
              </div>
            </>
          )}
          {discOther.length > 0 && (
            <div style={{ marginTop: discCompat.length ? 4 : 0 }}>
              {resourceContext?.type && discCompat.length > 0 ? (
                <button type="button" onClick={() => setShowAllDiscovered(x => !x)} style={{
                  width: "100%", padding: "8px 10px",
                  border: "1px dashed var(--border)", background: "transparent",
                  color: "var(--brand-fg)", borderRadius: 6, cursor: "pointer",
                  font: "500 12px/1 var(--font-sans)", textAlign: "left",
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                  <Icon name={showAllDiscovered ? "chevron-down" : "chevron-right"} size={11} color="var(--brand-fg)"/>
                  {showAllDiscovered ? "Hide other discovered credentials" : `Show all ${discOther.length} other discovered credential${discOther.length === 1 ? "" : "s"} →`}
                </button>
              ) : null}
              {(showAllDiscovered || !resourceContext?.type || discCompat.length === 0) && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6, maxHeight: compact ? 140 : 200, overflowY: "auto", paddingRight: 4 }}>
                  {discOther.map(d => <DiscoveredRow key={d.id} d={d}/>)}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {!existingOnly && (
        <div>
          <Segmented value={tab} onChange={setTab} options={[
            { value: "new",      label: "Create new" },
            { value: "existing", label: "Use existing" },
          ]}/>
          <div style={{ font: "400 11.5px/1.4 var(--font-sans)", color: "var(--fg-4)", marginTop: 6 }}>
            {tab === "new"
              ? "Provide the root credential PAM will use to onboard this resource. It's vaulted immediately."
              : "Reuse a credential that's already vaulted, or claim one PAM has discovered on the network."}
          </div>
        </div>
      )}

      {tab === "new" && !existingOnly && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Field label="Root / admin username" required>
            <input className="input t-mono" value={value?.username || ""} onChange={e => setNew({ username: e.target.value })} placeholder="root · postgres · Administrator"/>
          </Field>
          <Field label="Credential type">
            <Segmented value={value?.credType || "password"} onChange={v => setNew({ credType: v })} options={[
              { value: "password", label: "Password" },
              { value: "sshkey",   label: "SSH Key" },
            ]}/>
          </Field>
          {(value?.credType || "password") === "password" ? (
            <Field label="Password" required>
              <input className="input t-mono" type="password" value={value?.secret || ""} onChange={e => setNew({ secret: e.target.value })} placeholder="Enter password"/>
            </Field>
          ) : (
            <Field label="SSH private key" required hint="Paste PEM-formatted key contents. PAM stores this in the vault immediately.">
              <textarea className="input t-mono" rows={compact ? 2 : 4} value={value?.secret || ""} onChange={e => setNew({ secret: e.target.value })} placeholder={"-----BEGIN RSA PRIVATE KEY-----\n..."}/>
            </Field>
          )}
        </div>
      )}

      {tab === "existing" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Fix 4 — recently used chips. Above Vaulted/Discovered. Scoped to
              the admin's own recent Attach/Claim actions across all resources
              (single shared list). Directly serves the bulk-rollout case. */}
          {recentPicks.length > 0 && (
            <div>
              <div style={{ font: "600 10.5px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6 }}>Recently used</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {recentPicks.map((p, i) => {
                  const isVaulted = p.mode === "attach";
                  const active = isVaulted
                    ? (value?.mode === "attach" && value?.credentialId === p.credentialId)
                    : (value?.mode === "claim" && value?.discoveredId === p.discoveredId);
                  const label = isVaulted ? p.credentialDisplay : p.discoveredDisplay;
                  return (
                    <button key={i} type="button" onClick={() => isVaulted ? attach(p.hitVaulted) : claim(p.hitDiscovered)} style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      padding: "5px 10px",
                      border: `1px solid ${active ? "var(--brand)" : "var(--border)"}`,
                      background: active ? "var(--brand-soft)" : "var(--bg-app)",
                      color: active ? "var(--brand-fg)" : "var(--fg-2)",
                      borderRadius: 999, cursor: "pointer",
                      font: `${active ? 600 : 500} 12px/1.2 var(--font-sans)`,
                    }}>
                      <Icon name={isVaulted ? (p.credentialType === "SSH Key" ? "key" : "lock") : "eye"} size={11} color={active ? "var(--brand-fg)" : (isVaulted ? "var(--brand-fg)" : "var(--warning-fg)")}/>
                      {label}
                      <span style={{ font: "400 10.5px/1 var(--font-sans)", opacity: 0.7 }}>· {isVaulted ? "Attach" : "Claim"}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ position: "relative" }}>
            <Icon name="search" size={13} color="var(--fg-4)" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}/>
            <input className="input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by display name, owner, or discovered host…" style={{ paddingLeft: 30 }}/>
            {launchContext === "bulk-discovery-row" && discoveryHost && (
              <div style={{ marginTop: 4, font: "400 11.5px/1.4 var(--font-sans)", color: "var(--fg-4)" }}>
                Pre-filtered to <strong style={{ color: "var(--fg-2)" }}>{discoveryHost}</strong> · clear the search to see everything.
              </div>
            )}
          </div>

          {/* Fix 5 — bulk-discovery-row context puts Discovered first so the
              claimable local accounts show up before Vaulted. All other
              contexts keep Vaulted first. */}
          {discoveryFirst ? <>{DiscoveredSection}{VaultedSection}</> : <>{VaultedSection}{DiscoveredSection}</>}
        </div>
      )}
    </div>
  );
};

// Small chip used in result tables to signal what happened per-row: was the
// credential newly minted, attached to a vaulted one, or claimed from
// discovered? Same vocabulary across every entry method.
const CredentialOutcomeChip = ({ source }) => {
  if (!source) return null;
  const map = {
    new:    { label: "New credential",       cls: "badge badge-brand" },
    attach: { label: "Attached to Vaulted",  cls: "badge badge-success" },
    claim:  { label: "Claimed & vaulted",    cls: "badge badge-warning" },
  };
  const m = map[source.mode];
  if (!m) return null;
  return <span className={m.cls} style={{ gap: 4 }}>{m.label}</span>;
};

const credentialSourceValid = (v) => {
  if (!v) return false;
  if (v.mode === "new") return !!(v.username && v.secret);
  if (v.mode === "attach") return !!v.credentialId;
  if (v.mode === "claim")  return !!v.discoveredId;
  return false;
};

const credentialSourceSummary = (v) => {
  if (!v) return "None selected";
  if (v.mode === "new")    return `New · ${v.username || "(no username)"} (${v.credType === "sshkey" ? "SSH key" : "password"}, vaulted on create)`;
  if (v.mode === "attach") return `Attached · ${v.credentialDisplay}`;
  if (v.mode === "claim")  return `Claimed · ${v.discoveredDisplay}`;
  return "None selected";
};

// ─── Type-aware defaults for Step 1 ─────────────────────────────────────────
const TYPE_PORT_DEFAULT = { server: 22, database: 5432, web: 443, cloud: 443 };
const TYPE_HOST_PLACEHOLDER = {
  server:   "e.g. 10.42.18.7 or auth01.kestrel.internal",
  database: "e.g. db.internal:5432",
  web:      "e.g. https://admin.example.com",
  cloud:    "e.g. eks.us-east-1:443",
};

// ─── PAM inference catalogs ─────────────────────────────────────────────────
const ADD_ROTATION_POLICIES = [
  { id: "prod-daily",  name: "Prod-Daily-Rotation",   detail: "rotates every 24 hours", scopeSummary: "Production · Critical" },
  { id: "prod-weekly", name: "Prod-Weekly-Rotation",  detail: "rotates every 7 days",   scopeSummary: "Production · High" },
  { id: "std-30d",     name: "Std-30d-Rotation",      detail: "rotates every 30 days",  scopeSummary: "Medium / Low / non-prod" },
  { id: "manual",      name: "Manual only",           detail: "never auto-rotates — vault reveals only", scopeSummary: "Only for targets that don't support automated rotation" },
];

const RECON_ACCOUNTS = [
  { id: "backup-reconciliation-01",  name: "backup-reconciliation-01",  scope: "manages 24 other resources in this environment" },
  { id: "backup-reconciliation-dev", name: "backup-reconciliation-dev", scope: "manages 9 resources in Development" },
  { id: "reconciliation-jumpbox",    name: "reconciliation-jumpbox",    scope: "manages 6 bastion / jumpbox hosts" },
];

const cap = (s) => s ? s[0].toUpperCase() + s.slice(1) : s;

const pickRotationPolicy = (env, crit) => {
  if (env === "production" && crit === "critical") return "prod-daily";
  if (env === "production" && crit === "high")     return "prod-weekly";
  return "std-30d";
};
const pickReconAccount = (env) => env === "development" ? "backup-reconciliation-dev" : "backup-reconciliation-01";
const rotationReason = (env, crit, policyId) => {
  if (policyId === "prod-daily")  return `Selected because this resource is tagged ${cap(env)} + ${cap(crit)}.`;
  if (policyId === "prod-weekly") return `Selected for ${cap(env)} resources at ${cap(crit)} criticality — daily rotation isn't required.`;
  if (policyId === "std-30d")     return `${cap(env)} / ${cap(crit)} resources use the standard monthly cadence.`;
  return "Manual only — you opted out of automated rotation.";
};

// ─── Step 1 · Resource details + Root credential ────────────────────────────
const NewStep1RootCred = ({ data, setData }) => {
  const setType = (t) => setData(d => ({ ...d, type: t, port: TYPE_PORT_DEFAULT[t] || 22 }));
  const patch = (key, val) => setData(d => ({ ...d, [key]: val }));
  return (
    <div style={{ padding: "22px 24px 8px", maxWidth: 760, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <div style={{ font: "600 11px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 14 }}>Resource details</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Field label="Display name" required>
            <input className="input" value={data.name} onChange={e => patch("name", e.target.value)} placeholder="e.g. prod-db-primary"/>
          </Field>
          <Field label="Type" required>
            <Segmented value={data.type} onChange={setType} options={[
              { value: "server",   label: "Server" },
              { value: "database", label: "Database" },
              { value: "web",      label: "Web app" },
              { value: "cloud",    label: "Cloud" },
            ]}/>
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14 }}>
            <Field label="Host / endpoint" required>
              <input className="input" value={data.host} onChange={e => patch("host", e.target.value)} placeholder={TYPE_HOST_PLACEHOLDER[data.type]}/>
            </Field>
            <Field label="Port" hint={`Default: ${TYPE_PORT_DEFAULT[data.type]}`}>
              <input className="input t-mono" type="number" value={data.port} onChange={e => patch("port", +e.target.value)}/>
            </Field>
          </div>
          <Field label="Environment" required>
            <Segmented value={data.env} onChange={v => patch("env", v)} options={[
              { value: "production",  label: "Production" },
              { value: "staging",     label: "Staging" },
              { value: "development", label: "Development" },
            ]}/>
          </Field>
          <Field label="Criticality" required>
            <Segmented value={data.criticality} onChange={v => patch("criticality", v)} options={[
              { value: "critical", label: "Critical" },
              { value: "high",     label: "High" },
              { value: "medium",   label: "Medium" },
              { value: "low",      label: "Low" },
            ]}/>
          </Field>
        </div>
      </div>

      <div>
        <div style={{ font: "600 11px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 12 }}>Root credential</div>
        <HelperCallout>
          <strong>This is the only credential you need to provide manually.</strong> PAM will configure rotation, admin account mapping, and access level from this in the next step.
        </HelperCallout>
        <div style={{ marginTop: 14 }}>
          <CredentialSourcePicker
            value={data.credentialSource}
            onChange={(v) => patch("credentialSource", v)}
            resourceContext={{ name: data.name, type: data.type, criticality: data.criticality, env: data.env }}
            launchContext="manual"
          />
        </div>
      </div>
    </div>
  );
};

// ─── Step 2 · Review PAM configuration ──────────────────────────────────────
const NewStep2ReviewConfig = ({ data, setData }) => {
  const patch = (key, val) => setData(d => ({ ...d, [key]: val }));
  const [expanded, setExpanded] = React.useState(null);
  const currentRotation = ADD_ROTATION_POLICIES.find(p => p.id === data.rotationPolicyId) || ADD_ROTATION_POLICIES[0];
  const currentRecon = RECON_ACCOUNTS.find(a => a.id === data.reconciliationAccountId) || RECON_ACCOUNTS[0];

  const ConfigCard = ({ id, icon, title, subtitle, children }) => (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, minWidth: 0, flex: 1 }}>
          <div style={{ width: 26, height: 26, borderRadius: 6, background: "var(--brand-soft)", color: "var(--brand-fg)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
            <Icon name={icon} size={13}/>
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ font: "600 13.5px/1.35 var(--font-sans)", color: "var(--fg-1)" }}>{title}</div>
            {subtitle && <div style={{ font: "400 12px/1.5 var(--font-sans)", color: "var(--fg-3)", marginTop: 3 }}>{subtitle}</div>}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: "none" }}>
          <PamSuggestedTag/>
          <button className="btn btn-sm btn-ghost" onClick={() => setExpanded(expanded === id ? null : id)}>
            {expanded === id ? "Close" : "Edit"}
          </button>
        </div>
      </div>
      {expanded === id && (
        <div style={{ marginTop: 14, borderTop: "1px solid var(--border-subtle)", paddingTop: 14 }}>
          {children}
        </div>
      )}
    </div>
  );

  const RadioRow = ({ selected, primary, secondary, onClick }) => (
    <button onClick={onClick} style={{
      padding: 10, border: `1px solid ${selected ? "var(--brand)" : "var(--border)"}`,
      background: selected ? "var(--brand-soft)" : "var(--bg-app)",
      borderRadius: 6, cursor: "pointer", textAlign: "left",
      display: "flex", alignItems: "center", gap: 10, width: "100%",
    }}>
      <span style={{ width: 12, height: 12, borderRadius: "50%", border: `2px solid ${selected ? "var(--brand)" : "var(--border-strong)"}`, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
        {selected && <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--brand)" }}/>}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{primary}</div>
        {secondary && <div style={{ font: "400 11.5px/1.3 var(--font-sans)", color: "var(--fg-4)", marginTop: 2 }}>{secondary}</div>}
      </div>
    </button>
  );

  // Fix 3 — conditional Local Accounts group. Only rendered for Types where
  // OS-level local accounts are a meaningful concept — Server resources
  // primarily. Hidden for Web app, Cloud, and (default) Database — for DBs
  // the ephemeral-OS-account pattern doesn't map cleanly to DB-level service
  // accounts, so defaulting to hide is the safer call.
  //
  // Backend dependency: engineering confirms the exact Type list this
  // applies to. Once confirmed, update the whitelist below or move the
  // decision into an authoritative TYPE_META lookup.
  const supportsLocalAccounts = data.type === "server";

  // Fix 2 — auto-extend pattern. When standing-local-accounts override is
  // ON, the root-credential's rotation policy also governs those standing
  // accounts (they don't need an independently configurable cadence in this
  // MVP). Rotation card surfaces this so the admin sees the dependency
  // instead of guessing whether rotation still applies.
  //
  // Flag as an eng dependency: if local accounts need their own rotation
  // cadence, flip this to the separate-policy pattern (nested picker under
  // the Ephemeral card scoped to standing accounts only).
  const standingOverride = supportsLocalAccounts && data.localAccountMode === "standing";

  const GroupLabel = ({ children }) => (
    <div style={{ font: "600 10.5px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.7, padding: "8px 4px 6px" }}>{children}</div>
  );

  return (
    <div style={{ padding: "22px 24px", maxWidth: 760, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <div style={{ font: "600 14px/1.3 var(--font-sans)", color: "var(--fg-1)", marginBottom: 4 }}>Here's what PAM will configure</div>
        <div style={{ font: "400 12.5px/1.5 var(--font-sans)", color: "var(--fg-3)" }}>
          Based on the resource type and root credential you provided. Review and override anything below — nothing here requires your input unless you want to change it.
        </div>
      </div>

      {/* Fix 1 — Root credential group. Rotation + Reconciliation both govern
          the standing root credential entered in Step 1; they belong together.
          Always rendered regardless of resource Type — every resource has a
          root credential that needs rotation + reconciliation logic. */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <GroupLabel>Root credential</GroupLabel>

        <ConfigCard
          id="rotation" icon="rotate-cw"
          title={`${currentRotation.name} — ${currentRotation.detail}`}
          subtitle={rotationReason(data.env, data.criticality, data.rotationPolicyId)}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {ADD_ROTATION_POLICIES.map(p => (
              <RadioRow key={p.id} selected={p.id === data.rotationPolicyId}
                primary={`${p.name} · ${p.detail}`} secondary={p.scopeSummary}
                onClick={() => { patch("rotationPolicyId", p.id); setExpanded(null); }}/>
            ))}
          </div>
        </ConfigCard>

        {/* Fix 2 — auto-extend note. Only appears when the standing-local-
            accounts override is on. Explicit, on-screen resolution of what
            was previously an unstated dependency. */}
        {standingOverride && (
          <div style={{ margin: "-4px 0 0 40px", padding: "8px 10px", background: "var(--brand-soft)", borderLeft: "3px solid var(--brand)", borderRadius: 4, font: "400 12px/1.5 var(--font-sans)", color: "var(--brand-fg)" }}>
            <strong>{currentRotation.name}</strong> will also apply to standing local accounts under this resource — they rotate on the same cadence as the root credential.
          </div>
        )}

        <ConfigCard
          id="recon" icon="shield"
          title={`${currentRecon.name} will handle password rotation for this resource.`}
          subtitle={`This reconciliation account already ${currentRecon.scope}.`}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {RECON_ACCOUNTS.map(a => (
              <RadioRow key={a.id} selected={a.id === data.reconciliationAccountId}
                primary={a.name} secondary={a.scope}
                onClick={() => { patch("reconciliationAccountId", a.id); setExpanded(null); }}/>
            ))}
          </div>
        </ConfigCard>
      </div>

      {/* Fix 3 — Local accounts group. Rendered only for Types where OS-level
          local accounts are how access is mediated. See supportsLocalAccounts
          note above for the eng confirmation TODO. */}
      {supportsLocalAccounts && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
          <GroupLabel>Local accounts</GroupLabel>
          <ConfigCard
            id="local" icon="user-plus"
            title={data.localAccountMode === "ephemeral"
              ? "Local accounts will be created just-in-time and destroyed after each session (ephemeral)."
              : "Standing local accounts — created once and reused across sessions."}
            subtitle={data.localAccountMode === "ephemeral"
              ? "Ephemeral is the recommended default — reduces lateral-movement blast radius."
              : "Standing accounts persist between sessions. Use only when a target requires it."}
          >
            <Toggle
              value={data.localAccountMode === "standing"}
              onChange={v => patch("localAccountMode", v ? "standing" : "ephemeral")}
              label="Allow standing local accounts instead"
              hint="Opt out of ephemeral mode. Standing accounts persist after the session ends — required only for a small set of targets that reject just-in-time provisioning. When on, the root credential's rotation policy also covers these accounts."
            />
          </ConfigCard>
        </div>
      )}
    </div>
  );
};

// ─── Step 3 · Confirm ──────────────────────────────────────────────────────
const NewStep3Confirm = ({ data }) => {
  const rotation = ADD_ROTATION_POLICIES.find(p => p.id === data.rotationPolicyId) || ADD_ROTATION_POLICIES[0];
  const recon = RECON_ACCOUNTS.find(a => a.id === data.reconciliationAccountId) || RECON_ACCOUNTS[0];
  return (
    <div style={{ padding: "22px 24px", maxWidth: 720, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <div style={{ font: "600 14px/1.3 var(--font-sans)", color: "var(--fg-1)", marginBottom: 4 }}>Confirm what's being onboarded</div>
        <div style={{ font: "400 12.5px/1.5 var(--font-sans)", color: "var(--fg-3)" }}>
          This is the last step before the resource is live. Nothing is created until you confirm.
        </div>
      </div>

      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "170px 1fr", rowGap: 14, columnGap: 20 }}>
          <ConfirmRow label="Resource" value={<span><strong style={{ color: "var(--fg-1)" }}>{data.name || "(untitled)"}</strong> · {cap(data.type)} · {cap(data.env)} · {cap(data.criticality)}</span>}/>
          <ConfirmRow label="Host / port" value={<span className="t-mono" style={{ fontSize: 12.5 }}>{data.host}:{data.port}</span>}/>
          <ConfirmRow label="Root credential" value={
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <CredentialOutcomeChip source={data.credentialSource}/>
              <span>{credentialSourceSummary(data.credentialSource)}</span>
            </span>
          }/>
          <ConfirmRow label="Rotation" value={`${rotation.name} (${rotation.detail})`}/>
          <ConfirmRow label="Local accounts" value={data.localAccountMode === "ephemeral" ? "Ephemeral — created on access, destroyed after session" : "Standing — persist across sessions"}/>
          <ConfirmRow label="Reconciliation account" value={recon.name}/>
          <ConfirmRow label="System users discovered" value={<span style={{ color: "var(--fg-4)" }}>0 — populates after the first discovery scan</span>}/>
        </div>
      </div>

      <div style={{ padding: 12, background: "var(--bg-surface-2)", borderRadius: 6, font: "400 12px/1.5 var(--font-sans)", color: "var(--fg-3)", display: "flex", gap: 8, alignItems: "flex-start" }}>
        <Icon name="info" size={13} color="var(--fg-4)"/>
        <div>
          The resource will appear in the Resources list as <strong style={{ color: "var(--fg-1)" }}>Pending</strong> immediately, and transition to active once the first connection test succeeds.
        </div>
      </div>
    </div>
  );
};

const ConfirmRow = ({ label, value }) => <>
  <div style={{ font: "600 11px/1.3 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.6 }}>{label}</div>
  <div style={{ font: "400 13px/1.5 var(--font-sans)", color: "var(--fg-1)" }}>{value}</div>
</>;

// ─── Bulk import panel ─────────────────────────────────────────────────────
// Same panel handles the CSV, AD, and (later) network-scan bulk paths — they
// only differ in the source label and how the candidate list is seeded.
const BULK_MOCK_DISCOVERED = [
  { id: "d1", name: "auth-server-01",         type: "server",   host: "auth01.kestrel.internal",    env: "production",  criticality: "critical" },
  { id: "d2", name: "data-warehouse-bastion", type: "server",   host: "warehouse-bastion.internal", env: "production",  criticality: "high" },
  { id: "d3", name: "ledger-mongo-cluster",   type: "database", host: "ledger-mongo:27017",         env: "production",  criticality: "high" },
  { id: "d4", name: "dev-jumpbox",            type: "server",   host: "dev-jumpbox.internal",       env: "development", criticality: "low" },
];

const BulkImportPanel = ({ source, onClose, onDone }) => {
  const [phase, setPhase] = React.useState("edit");
  // Every row keeps a `credentialSource` — same shape the picker emits. Rows
  // without a credentialSource are skipped at onboard time. This unifies the
  // three outcomes (new / attach / claim) into one field the caller can
  // inspect once instead of three parallel inputs.
  const [rows, setRows] = React.useState(BULK_MOCK_DISCOVERED.map(r => ({
    ...r, selected: true, credentialSource: null,
  })));
  const [pickerFor, setPickerFor] = React.useState(null); // null | { rowId } | { bulk: true }
  const [pickerDraft, setPickerDraft] = React.useState(null);
  const [results, setResults] = React.useState([]);

  const setRow = (id, patch) => setRows(rs => rs.map(r => r.id === id ? { ...r, ...patch } : r));

  const openRowPicker = (rowId) => {
    const row = rows.find(r => r.id === rowId);
    setPickerDraft(row?.credentialSource || null);
    // Per-row picker on a discovery result opens on Discovered pre-filtered to
    // that host — the local account claimable on that specific target is the
    // most likely pick.
    setPickerFor({ rowId, launchContext: "bulk-discovery-row", discoveryHost: row?.host });
  };
  const openBulkPicker = () => {
    // Bulk-apply starts blank — the admin picks an existing credential to
    // attach to every selected row in one motion. Opens on Vaulted because
    // reusing one existing credential across many rows is the intent here,
    // not claiming newly discovered ones.
    setPickerDraft(null);
    setPickerFor({ bulk: true, launchContext: "bulk-apply" });
  };
  const applyPicker = () => {
    if (!pickerDraft || !credentialSourceValid(pickerDraft)) return;
    if (pickerFor?.bulk) {
      // Apply to every currently-selected row. Skip rows that already have
      // a per-row override — the admin sees which rows changed on the next
      // review pass rather than silently overwriting.
      setRows(rs => rs.map(r => r.selected ? { ...r, credentialSource: pickerDraft } : r));
    } else if (pickerFor?.rowId) {
      setRow(pickerFor.rowId, { credentialSource: pickerDraft });
    }
    setPickerFor(null);
    setPickerDraft(null);
  };
  const closePicker = () => { setPickerFor(null); setPickerDraft(null); };

  const runOnboarding = (retryOnly) => {
    const target = retryOnly
      ? rows.filter(r => r.selected && results.find(x => x.id === r.id && x.status === "failed"))
      : rows.filter(r => r.selected);
    setPhase("running");
    setTimeout(() => {
      const out = target.map(r => {
        if (!credentialSourceValid(r.credentialSource)) return { id: r.id, name: r.name, status: "skipped", reason: "no root credential provided", credentialSource: null };
        if (r.name === "ledger-mongo-cluster")           return { id: r.id, name: r.name, status: "failed",  reason: "root credential could not authenticate", retryable: true, credentialSource: r.credentialSource };
        return { id: r.id, name: r.name, status: "success", credentialSource: r.credentialSource };
      });
      setResults(prev => retryOnly ? prev.map(p => out.find(o => o.id === p.id) || p) : out);
      setPhase("result");
    }, 900);
  };

  const selectedCount = rows.filter(r => r.selected).length;
  const selectedWithCred = rows.filter(r => r.selected && credentialSourceValid(r.credentialSource)).length;
  const failedCount = results.filter(r => r.status === "failed").length;
  const sourceLabel = source === "csv" ? "CSV" : source === "ad" ? "Active Directory" : "scan";

  return (
    <Panel
      title={`Bulk onboard — ${sourceLabel}`}
      onClose={onClose}
      footer={phase === "edit" ? (
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <div style={{ flex: 1 }}/>
          <span className="t-tiny" style={{ color: "var(--fg-4)", fontWeight: 400 }}>{selectedCount} of {rows.length} selected</span>
          <button className="btn btn-primary" disabled={selectedCount === 0} onClick={() => runOnboarding(false)} style={{ opacity: selectedCount ? 1 : 0.5 }}>
            Onboard selected ({selectedCount})
          </button>
        </>
      ) : phase === "result" ? (
        <>
          {failedCount > 0 && <button className="btn" onClick={() => runOnboarding(true)}><Icon name="rotate-cw" size={12}/> Retry failed ({failedCount})</button>}
          <div style={{ flex: 1 }}/>
          <button className="btn btn-primary" onClick={() => onDone(results.filter(r => r.status === "success").length)}>Done</button>
        </>
      ) : null}
    >
      {phase === "edit" && (
        <div style={{ padding: 20 }}>
          <div style={{ maxWidth: 940, margin: "0 auto" }}>
            <div style={{ marginBottom: 14, font: "400 12.5px/1.5 var(--font-sans)", color: "var(--fg-3)" }}>
              {sourceLabel === "CSV"
                ? "Preview of resources parsed from your CSV. Review each row, edit its criticality if needed, and set the root credential."
                : "Discovered from " + sourceLabel + ". Review each row, edit its criticality if needed, and set the root credential."}
              {" "}Each row is onboarded through the same PAM-inferred configuration path as a single-resource add — you only supply the root credential here.
            </div>

            {/* Bulk-apply toolbar — the highest setup-time reduction in the whole
                bulk flow. Pick one existing credential once, apply to every
                selected row. Nothing else on the row is changed. */}
            <div style={{ padding: "10px 14px", marginBottom: 14, background: "var(--bg-surface-2)", borderRadius: 6, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ font: "500 12.5px/1.4 var(--font-sans)", color: "var(--fg-2)" }}>
                <strong style={{ color: "var(--fg-1)" }}>{selectedCount}</strong> of {rows.length} selected · <strong style={{ color: selectedWithCred === selectedCount ? "var(--success-fg)" : "var(--warning-fg)" }}>{selectedWithCred}</strong> have a credential
              </span>
              <div style={{ flex: 1 }}/>
              <button className="btn btn-sm" disabled={selectedCount === 0} onClick={openBulkPicker} style={{ opacity: selectedCount ? 1 : 0.5 }}>
                <Icon name="key" size={11}/> Apply existing credential to selected rows
              </button>
            </div>

            <div className="card">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: 32 }}><input type="checkbox" checked={rows.length > 0 && rows.every(r => r.selected)} onChange={e => setRows(rs => rs.map(r => ({ ...r, selected: e.target.checked })))}/></th>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Host</th>
                    <th>Environment</th>
                    <th style={{ width: 120 }}>Criticality</th>
                    <th>Credential</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.id} style={{ opacity: r.selected ? 1 : 0.5 }}>
                      <td><input type="checkbox" checked={r.selected} onChange={e => setRow(r.id, { selected: e.target.checked })}/></td>
                      <td><span style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{r.name}</span></td>
                      <td><span className="badge">{cap(r.type)}</span></td>
                      <td className="t-mono" style={{ fontSize: 12, color: "var(--fg-3)" }}>{r.host}</td>
                      <td><span className="badge">{cap(r.env)}</span></td>
                      <td>
                        <select className="input" style={{ height: 30, padding: "0 8px", font: "400 12.5px/1 var(--font-sans)" }} value={r.criticality} onChange={e => setRow(r.id, { criticality: e.target.value })}>
                          <option value="critical">Critical</option>
                          <option value="high">High</option>
                          <option value="medium">Medium</option>
                          <option value="low">Low</option>
                        </select>
                      </td>
                      <td>
                        {credentialSourceValid(r.credentialSource) ? (
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => openRowPicker(r.id)}
                            style={{ font: "500 12px/1.3 var(--font-sans)", padding: "4px 8px", textAlign: "left", display: "inline-flex", alignItems: "center", gap: 6, flexWrap: "wrap", maxWidth: 320 }}
                          >
                            <CredentialOutcomeChip source={r.credentialSource}/>
                            <span style={{ color: "var(--fg-2)" }}>{credentialSourceSummary(r.credentialSource)}</span>
                            <Icon name="edit" size={10} color="var(--fg-4)"/>
                          </button>
                        ) : (
                          <button className="btn btn-sm" onClick={() => openRowPicker(r.id)} style={{ font: "500 12px/1 var(--font-sans)" }}>
                            <Icon name="plus" size={11}/> Set credential
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Picker modal — one component, two entry points (per-row + bulk). The
          modal chrome is here rather than inside the picker so the picker
          stays reusable in non-modal contexts (like Step 1 of the manual
          wizard, where it's inline). */}
      {pickerFor && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={closePicker}>
          <div style={{ width: 640, maxHeight: "88vh", background: "var(--bg-app)", borderRadius: 10, boxShadow: "0 24px 64px rgba(0,0,0,0.25)", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: 20, borderBottom: "1px solid var(--border)" }}>
              <h2 style={{ font: "600 15px/1.3 var(--font-sans)", color: "var(--fg-1)", margin: 0 }}>
                {pickerFor.bulk
                  ? `Set credential for ${selectedCount} selected row${selectedCount === 1 ? "" : "s"}`
                  : `Set credential — ${rows.find(r => r.id === pickerFor.rowId)?.name}`}
              </h2>
              <div style={{ font: "400 12px/1.5 var(--font-sans)", color: "var(--fg-3)", marginTop: 4 }}>
                {pickerFor.bulk
                  ? "Attaching a Vaulted credential is the fastest path — same credential, every selected row. Every row still gets its own per-row review on the result screen."
                  : "Choose one path: mint a new credential, attach an existing Vaulted one, or claim a Discovered one PAM has found on the network."}
              </div>
            </div>
            <div style={{ padding: 20, overflowY: "auto", flex: 1 }}>
              <CredentialSourcePicker
                value={pickerDraft}
                onChange={setPickerDraft}
                compact
                launchContext={pickerFor?.launchContext}
                discoveryHost={pickerFor?.discoveryHost}
                resourceContext={pickerFor?.rowId ? (() => {
                  const r = rows.find(x => x.id === pickerFor.rowId);
                  return r ? { name: r.name, type: r.type, criticality: r.criticality, env: r.env } : null;
                })() : null}
              />
            </div>
            <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end", gap: 8, background: "var(--bg-surface)" }}>
              <button className="btn" onClick={closePicker}>Cancel</button>
              <button className="btn btn-primary" onClick={applyPicker} disabled={!credentialSourceValid(pickerDraft)}>
                {pickerFor.bulk ? `Apply to ${selectedCount} row${selectedCount === 1 ? "" : "s"}` : "Set credential"}
              </button>
            </div>
          </div>
        </div>
      )}

      {phase === "running" && (
        <div style={{ padding: 60, textAlign: "center" }}>
          <Icon name="rotate-cw" size={32} color="var(--brand-fg)"/>
          <div style={{ marginTop: 14, font: "500 14px/1.4 var(--font-sans)", color: "var(--fg-2)" }}>Onboarding {selectedCount} resources…</div>
          <div style={{ marginTop: 6, font: "400 12.5px/1.5 var(--font-sans)", color: "var(--fg-4)" }}>PAM is applying inferred rotation policies, reconciliation accounts, and local-account handling per row.</div>
        </div>
      )}

      {phase === "result" && (
        <div style={{ padding: 20 }}>
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <div style={{ marginBottom: 14, font: "400 13px/1.5 var(--font-sans)", color: "var(--fg-2)" }}>
              <strong>{results.filter(r => r.status === "success").length}</strong> onboarded ·
              {" "}<strong style={{ color: failedCount ? "var(--danger-fg)" : "inherit" }}>{failedCount}</strong> failed ·
              {" "}<strong>{results.filter(r => r.status === "skipped").length}</strong> skipped
            </div>
            <div className="card">
              <table className="table">
                <thead><tr><th style={{ width: 32 }}></th><th>Resource</th><th style={{ width: 170 }}>Credential outcome</th><th>Status</th><th style={{ textAlign: "right" }}></th></tr></thead>
                <tbody>
                  {results.map(r => (
                    <tr key={r.id}>
                      <td>
                        {r.status === "success" && <Icon name="check-circle" size={15} color="var(--success-fg)"/>}
                        {r.status === "failed"  && <Icon name="alert-circle" size={15} color="var(--danger-fg)"/>}
                        {r.status === "skipped" && <Icon name="circle" size={15} color="var(--fg-4)"/>}
                      </td>
                      <td><span style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{r.name}</span></td>
                      <td>
                        {/* Per-row credential-outcome chip — same New / Vaulted /
                            Discovered vocabulary the interactive picker uses.
                            Applies across every entry method (Manual, Network scan,
                            AD, CSV, API) so an admin reviewing results reads one
                            consistent state language regardless of how the row was
                            created. */}
                        {r.credentialSource
                          ? <CredentialOutcomeChip source={r.credentialSource}/>
                          : <span style={{ font: "400 11.5px/1.4 var(--font-sans)", color: "var(--fg-4)" }}>—</span>}
                      </td>
                      <td style={{ font: "400 12.5px/1.4 var(--font-sans)", color: r.status === "failed" ? "var(--danger-fg)" : r.status === "success" ? "var(--success-fg)" : "var(--fg-4)" }}>
                        {r.status === "success" && "Onboarded successfully"}
                        {r.status === "failed"  && `Failed: ${r.reason}`}
                        {r.status === "skipped" && `Skipped: ${r.reason}`}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {r.status === "failed" && <button className="btn btn-sm">Edit credential</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </Panel>
  );
};

// ─── Manual add — 3-step wizard ────────────────────────────────────────────
const NewManualAdd = ({ onClose, onCreated }) => {
  const [step, setStep] = React.useState(1);
  const [data, setData] = React.useState({
    name: "", type: "server", host: "", port: 22,
    env: "production", criticality: "medium",
    // Credential Source Picker output — null until the admin selects. See
    // CredentialSourcePicker for the shape (mode: new | attach | claim).
    credentialSource: null,
    rotationPolicyId: "prod-daily",
    localAccountMode: "ephemeral",
    reconciliationAccountId: "backup-reconciliation-01",
  });
  // If the admin hasn't touched Step 2, keep the PAM-suggested picks in sync
  // with env/criticality. Once they touch Step 2, freeze — the admin has
  // overridden and we shouldn't clobber their choice on the way back to Step 1.
  const [pamOverridden, setPamOverridden] = React.useState(false);
  React.useEffect(() => {
    if (pamOverridden) return;
    setData(d => ({
      ...d,
      rotationPolicyId: pickRotationPolicy(d.env, d.criticality),
      reconciliationAccountId: pickReconAccount(d.env),
    }));
  }, [data.env, data.criticality, pamOverridden]);

  const stepMeta = [
    { n: 1, label: "Resource & root" },
    { n: 2, label: "Review PAM configuration" },
    { n: 3, label: "Confirm" },
  ];
  const step1Valid = data.name && data.host && credentialSourceValid(data.credentialSource);
  const canProceed = step === 1 ? step1Valid : true;

  const confirmClose = () => {
    const hasInput = data.name || data.host || !!data.credentialSource;
    if (hasInput && !confirm("Discard this resource? Nothing has been saved yet.")) return;
    onClose();
  };

  return (
    <Panel title="Add resource" onClose={confirmClose} back={step > 1 ? () => setStep(step - 1) : null}>
      <StepIndicator step={step} steps={stepMeta}/>
      {step === 1 && <NewStep1RootCred data={data} setData={setData}/>}
      {step === 2 && <NewStep2ReviewConfig data={data} setData={(fnOrObj) => { setPamOverridden(true); setData(fnOrObj); }}/>}
      {step === 3 && <NewStep3Confirm data={data}/>}
      <div style={{ borderTop: "1px solid var(--border)", padding: "12px 24px", display: "flex", alignItems: "center", gap: 10, background: "var(--bg-surface)", flex: "none" }}>
        <button className="btn btn-ghost" onClick={confirmClose}>Cancel</button>
        <div style={{ flex: 1 }}/>
        {step > 1 && <button className="btn" onClick={() => setStep(step - 1)}>← Back</button>}
        {step < 3 && <button className="btn btn-primary" disabled={!canProceed} onClick={() => setStep(step + 1)} style={{ opacity: canProceed ? 1 : 0.5 }}>Next →</button>}
        {step === 3 && <button className="btn btn-primary" onClick={() => onCreated({ ...data, status: "pending" })}>
          <Icon name="check" size={12} color="#fff"/> Confirm and create resource
        </button>}
      </div>
    </Panel>
  );
};

// ─── Main dispatcher — Entry method → manual / bulk / discovery landings ──
const ResourceAddPanel = ({ onClose, onCreated }) => {
  const [method, setMethod] = React.useState(null);

  if (!method) {
    return <Panel title="Add resource" onClose={onClose}>
      <EntryMethodCards onPick={(id) => {
        if (id === "manual") setMethod("manual");
        else if (id === "scan") onClose("scan");
        else setMethod(id);
      }}/>
      <div style={{ borderTop: "1px solid var(--border)", padding: "12px 24px", textAlign: "right", background: "var(--bg-surface)" }}>
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
      </div>
    </Panel>;
  }

  if (method === "manual") return <NewManualAdd onClose={onClose} onCreated={onCreated}/>;
  if (method === "csv")    return <BulkImportPanel source="csv" onClose={onClose} onDone={n => onCreated({ bulk: true, count: n })}/>;
  if (method === "ad")     return <BulkImportPanel source="ad"  onClose={onClose} onDone={n => onCreated({ bulk: true, count: n })}/>;

  if (method === "cloud") {
    return <Panel title="Cloud discovery" onClose={onClose} back={() => setMethod(null)}>
      <div style={{ padding: 28, maxWidth: 680, margin: "0 auto" }}>
        <div style={{ font: "400 13px/1.5 var(--font-sans)", color: "var(--fg-3)", marginBottom: 18 }}>
          Choose a cloud provider to scan. We'll pull EC2/VM, RDS/database, IAM users with privileged roles, and Kubernetes resources from the accounts you've connected.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 18 }}>
          {[
            { id: "aws",   label: "AWS",   sub: "2 accounts connected", connected: true },
            { id: "azure", label: "Azure", sub: "1 tenant connected",   connected: true },
            { id: "gcp",   label: "GCP",   sub: "Not connected",        connected: false },
          ].map(p => (
            <div key={p.id} style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 14, background: "var(--bg-surface)" }}>
              <div style={{ font: "600 13px/1 var(--font-sans)", color: "var(--fg-1)" }}>{p.label}</div>
              <div style={{ font: "400 12px/1.4 var(--font-sans)", color: p.connected ? "var(--success-fg)" : "var(--fg-4)", marginTop: 4 }}>{p.sub}</div>
              <button className="btn btn-sm" style={{ marginTop: 10, width: "100%" }} disabled={!p.connected}>{p.connected ? "Scan" : "Connect first"}</button>
            </div>
          ))}
        </div>
        <Field label="Resource types to discover">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["Compute (EC2/VM)","Databases (RDS/SQL)","IAM users","Kubernetes"].map(l => <Pill key={l} active>{l}</Pill>)}
          </div>
        </Field>
        <div style={{ display: "flex", gap: 8, marginTop: 20, justifyContent: "flex-end" }}>
          <button className="btn btn-ghost" onClick={() => setMethod(null)}>Back</button>
          <button className="btn btn-primary"><Icon name="cloud" size={13}/> Start discovery</button>
        </div>
      </div>
    </Panel>;
  }

  if (method === "k8s") {
    return <Panel title="Connect Kubernetes cluster" onClose={onClose} back={() => setMethod(null)}>
      <div style={{ padding: 28, maxWidth: 560, margin: "0 auto" }}>
        <Field label="Cluster name" required><input className="input" placeholder="prod-eks-us-east"/></Field>
        <Field label="Kubeconfig" hint="Upload kubeconfig or paste the cluster details below">
          <div style={{ border: "2px dashed var(--border)", borderRadius: 8, padding: 24, textAlign: "center" }}>
            <Icon name="upload" size={20} color="var(--fg-4)"/>
            <div style={{ marginTop: 6, font: "500 12.5px/1 var(--font-sans)", color: "var(--fg-2)" }}>Drop kubeconfig here</div>
            <button className="btn btn-sm" style={{ marginTop: 10 }}>Choose file</button>
          </div>
        </Field>
        <div style={{ display: "flex", gap: 8, marginTop: 18, justifyContent: "flex-end" }}>
          <button className="btn btn-ghost" onClick={() => setMethod(null)}>Back</button>
          <button className="btn btn-primary">Connect cluster</button>
        </div>
      </div>
    </Panel>;
  }

  if (method === "api") {
    return <Panel title="API / Terraform onboarding" onClose={onClose} back={() => setMethod(null)}>
      <div style={{ padding: 28, maxWidth: 640, margin: "0 auto" }}>
        <div style={{ font: "400 13px/1.5 var(--font-sans)", color: "var(--fg-3)", marginBottom: 16 }}>Manage resources as code with the Terraform provider, or push them via REST.</div>
        <pre style={{ background: "var(--bg-surface-2)", border: "1px solid var(--border)", borderRadius: 8, padding: 14, font: "12px/1.5 var(--font-mono)", color: "var(--fg-2)", overflow: "auto" }}>{`resource "miniorange_pam_resource" "web_prod_01" {
  name        = "web-prod-01"
  type        = "linux"
  host        = "10.42.0.18"
  criticality = "high"
  environment = "production"
  policy      = "linux-server-admin"
}`}</pre>
        <div style={{ display: "flex", gap: 8, marginTop: 18, justifyContent: "flex-end" }}>
          <button className="btn">View full docs</button>
          <button className="btn btn-primary">Generate API token</button>
        </div>
      </div>
    </Panel>;
  }

  return null;
};

Object.assign(window, {
  ResourceAddPanel, Panel, Field, Pill, Segmented, Toggle, Select, Disclosure, StepIndicator, PamSuggestedTag,
});
