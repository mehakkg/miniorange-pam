// Credentials — Main list screen (All Credentials tab + sub-tab routing)

const CredentialsV2 = ({ empty }) => {
  const [tab, setTab] = React.useState("all");
  const [q, setQ] = React.useState("");
  const [filters, setFilters] = React.useState({ nature: "Any", ownership: "Any", mgmt: "Any", status: "Any", resource: "Any", owner: "Any" });
  const [selected, setSelected] = React.useState(new Set());
  const [openId, setOpenId] = React.useState(null);
  const [showAdd, setShowAdd] = React.useState(false);
  const [showCsv, setShowCsv] = React.useState(false);
  const [rotateId, setRotateId] = React.useState(null);
  const [driftId, setDriftId] = React.useState(null);
  const [columnsOpen, setColumnsOpen] = React.useState(false);
  const [importOpen, setImportOpen] = React.useState(false);
  const [exportOpen, setExportOpen] = React.useState(false);
  const [assignOwner, setAssignOwner] = React.useState(null);
  const [deleteCred, setDeleteCred] = React.useState(null);
  const [auditCred, setAuditCred] = React.useState(null);
  const [bulkRotate, setBulkRotate] = React.useState(false);
  const [testingId, setTestingId] = React.useState(null);
  const [editId, setEditId] = React.useState(null);
  const [dupData, setDupData] = React.useState(null);
  const [newIds, setNewIds] = React.useState(new Set());

  const flashNew = (id) => { setNewIds(s => new Set([...s, id])); setTimeout(() => setNewIds(s => { const n = new Set(s); n.delete(id); return n; }), 3000); };

  const runTest = (c) => {
    setTestingId(c.id);
    setTimeout(() => {
      setTestingId(null);
      const ok = c.rotation !== "failed" && c.resources.length > 0;
      if (ok) window.pamToast(`✓ ${c.display} — authentication successful on ${c.resources[0]}`);
      else window.pamToast(`✗ ${c.display} — authentication failed${c.resources.length ? " · account may be locked" : " · no resources linked"}`, "error", { action: { label: "Fix →", onClick: () => setOpenId(c.id) } });
    }, 1600);
  };

  const ALL_COLS = [
    { id: "name",       label: "Display name",   required: true },
    { id: "type",       label: "Type",           required: false },
    { id: "username",   label: "Username",       required: false },
    { id: "resources",  label: "Resources",      required: false },
    { id: "owner",      label: "Owner",          required: false },
    { id: "sensitivity",label: "Sensitivity",    required: false },
    { id: "nonviewable",label: "Non-viewable",   required: false },
    { id: "adminAcct",  label: "Admin account",  required: false },
    { id: "policy",     label: "Rotation policy",required: false },
    { id: "lastRotated",label: "Last rotated",   required: false },
    { id: "status",     label: "Rotation status",required: true },
  ];
  const [visibleCols, setVisibleCols] = React.useState(new Set(ALL_COLS.map(c => c.id)));
  const show = (id) => visibleCols.has(id);
  const toggleCol = (id) => setVisibleCols(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const liveCreds = window.useCreds();
  const all = empty ? [] : liveCreds;
  let rows = all;
  if (q) { const lq = q.toLowerCase(); rows = rows.filter(c => [c.display, c.username, c.owner || "", ...c.tags].some(v => String(v).toLowerCase().includes(lq))); }
  // Nature — cred kind. Password / SSH Key / App Secret map to existing type field.
  // Cloud-IAM = credentials tagged aws-*, azure-*, gcp-* or ending in -iam.
  // Certificate reference = tags include "cert" or type === "Certificate".
  const natureOf = (c) => {
    if (c.type === "SSH Key") return "SSH Key";
    if (c.type === "App Secret") return "App Secret";
    if (c.type === "Certificate" || (c.tags || []).includes("cert")) return "Certificate reference";
    if (/^(aws|azure|gcp)-/i.test(c.display || "") || (c.tags || []).includes("cloud-iam")) return "Cloud-IAM";
    return "Password";
  };
  // Ownership — Individual = has a human owner. Non-human = service account
  // display starting with svc- / bot- / integration name. Shared = no owner
  // assigned OR generic name like root-*.
  const ownershipOf = (c) => {
    if (/^(svc|bot|integration)-/i.test(c.display || "")) return "Non-human";
    if (!c.owner || /^root/i.test(c.display || "")) return "Shared";
    return "Individual";
  };
  // Management state — how PAM handles the cred lifecycle.
  const mgmtOf = (c) => {
    if ((c.tags || []).includes("break-glass")) return "Break-glass";
    if ((c.tags || []).includes("reconciliation") || /reconciliation/i.test(c.display || "")) return "Reconciliation";
    if ((c.tags || []).includes("federated-sso") || c.login === "SSO") return "Federated-SSO";
    if (c.rotation === "no-policy" || !c.policy) return "Ad-hoc-Unmanaged";
    return "Vaulted-Managed";
  };
  if (filters.nature !== "Any")     rows = rows.filter(c => natureOf(c) === filters.nature);
  if (filters.ownership !== "Any")  rows = rows.filter(c => ownershipOf(c) === filters.ownership);
  if (filters.mgmt !== "Any")       rows = rows.filter(c => mgmtOf(c) === filters.mgmt);
  if (filters.status === "Healthy")  rows = rows.filter(c => c.rotation === "healthy");
  if (filters.status === "Overdue")  rows = rows.filter(c => c.rotation === "overdue");
  if (filters.status === "Failed")   rows = rows.filter(c => c.rotation === "failed");
  if (filters.status === "Drifted")  rows = rows.filter(c => c.rotation === "drifted");
  if (filters.status === "No policy")rows = rows.filter(c => c.rotation === "no-policy");

  const counts = {
    total: all.length,
    healthy: all.filter(c => c.rotation === "healthy").length,
    overdue: all.filter(c => c.rotation === "overdue" || c.rotation === "failed").length,
    drifted: all.filter(c => c.rotation === "drifted").length,
    noPolicy: all.filter(c => c.rotation === "no-policy").length,
  };

  const activeChips = Object.entries(filters).filter(([k, v]) => v !== "Any");
  const allChecked = rows.length > 0 && rows.every(r => selected.has(r.id));
  const toggleSel = (id) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSelected(allChecked ? new Set() : new Set(rows.map(r => r.id)));

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
      <PageHeader
        title="Credentials"
        description="The vault. Server passwords, SSH keys, application secrets. No raw password is ever shown to a user — PAM injects at session time."
        actions={<>
          <div style={{ position: "relative" }}>
            <button className="btn" onClick={() => setImportOpen(o => !o)}><Icon name="upload" size={13}/> Import / Export <Icon name="chevron-down" size={10}/></button>
            {importOpen && (
              <>
                <div onClick={() => setImportOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 30 }}/>
                <div style={{ position: "absolute", top: "calc(100% + 4px)", right: 0, zIndex: 31, width: 220, background: "var(--bg-app)", border: "1px solid var(--border)", borderRadius: 8, boxShadow: "var(--shadow-lg)", padding: 4 }}>
                  <button className="btn btn-ghost btn-sm" style={{ width: "100%", justifyContent: "flex-start" }} onClick={() => { setImportOpen(false); setShowCsv(true); }}><Icon name="upload" size={11}/> Import via CSV</button>
                  <button className="btn btn-ghost btn-sm" style={{ width: "100%", justifyContent: "flex-start" }}><Icon name="download" size={11}/> Export to CSV</button>
                  <button className="btn btn-ghost btn-sm" style={{ width: "100%", justifyContent: "flex-start" }}><Icon name="discovery" size={11}/> Import from Discovery</button>
                </div>
              </>
            )}
          </div>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}><Icon name="plus" size={13}/> Add credential</button>
        </>}
      />

      {/* Sub-tabs */}
      <TabBar
        active={tab}
        onChange={setTab}
        tabs={[
          { id: "all",      label: "All credentials",      weight: 1 },
          { id: "ssh",      label: "SSH Keys",             weight: 2 },
          { id: "secret",   label: "Application Secrets",  weight: 2 },
          { id: "cloudiam", label: "Cloud/IAM Accounts",   weight: 2 },
          { id: "recon",    label: "Reconciliation",       weight: 2 },
          { id: "bg",       label: "Break-glass",          weight: 2 },
          { separator: true },
          { id: "health",   label: "Health",               weight: 3 },
        ]}
      />

      {tab === "ssh"      && <SSHKeysTab onOpen={setOpenId} onAdd={() => setShowAdd(true)}/>}
      {tab === "secret"   && <AppSecretsTab onOpen={setOpenId} onAdd={() => setShowAdd(true)}/>}
      {tab === "cloudiam" && <CloudIAMTab onAdd={() => setShowAdd(true)}/>}
      {tab === "recon"    && <ReconciliationTab/>}
      {tab === "bg"       && <BreakGlassCredsTab/>}
      {tab === "health"   && <RotationHealthTab/>}

      {tab === "all" && (
        <>
          {/* KPI strip */}
          <div style={{ padding: "14px 24px", borderBottom: "1px solid var(--border-subtle)", display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
            <KPICard label="Total credentials" value={counts.total} active={filters.status === "Any"} onClick={() => setFilters({...filters, status: "Any"})}/>
            <KPICard label="Rotation healthy"  value={counts.healthy} accent="var(--success-fg)" active={filters.status === "Healthy"} onClick={() => setFilters({...filters, status: "Healthy"})}/>
            <KPICard label="Rotation overdue"  value={counts.overdue} accent="var(--danger-fg)"  active={filters.status === "Overdue"} onClick={() => setFilters({...filters, status: "Overdue"})}/>
            <KPICard label="Drifted"            value={counts.drifted} accent="var(--warning-fg)" active={filters.status === "Drifted"} onClick={() => setFilters({...filters, status: "Drifted"})}/>
            <KPICard label="No policy set"     value={counts.noPolicy} accent="var(--fg-3)"      active={filters.status === "No policy"} onClick={() => setFilters({...filters, status: "No policy"})}/>
          </div>

          {/* Ownership breakdown strip — compact secondary, sits directly below the
              primary KPI cards. Ownership was already a dropdown filter but nothing on
              the page told the admin it was a meaningful cut of the data, so it got
              ignored. This strip gives the axis a visible entry point without adding
              another full-size stat card. Each count is clickable and applies the
              corresponding Ownership filter, the same way a tab applies its filter.
              Management state stays dropdown-only — its most important state
              (No policy set) is already a primary stat card, and the rest are better
              understood through their dedicated tabs (Reconciliation, Break-glass). */}
          <div style={{ padding: "8px 24px", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", background: "var(--bg-surface)" }}>
            <span style={{ font: "600 10.5px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.7 }}>Ownership</span>
            {[
              { key: "Individual", label: "Individual" },
              { key: "Shared",     label: "Shared" },
              { key: "Non-human",  label: "Non-human" },
            ].map((o, i, arr) => {
              const value = all.filter(c => ownershipOf(c) === o.key).length;
              const active = filters.ownership === o.key;
              return (
                <React.Fragment key={o.key}>
                  <button
                    onClick={() => setFilters({ ...filters, ownership: active ? "Any" : o.key })}
                    style={{
                      background: active ? "var(--brand-soft)" : "transparent",
                      color: active ? "var(--brand-fg)" : "var(--fg-2)",
                      border: active ? "1px solid var(--brand)" : "1px solid transparent",
                      borderRadius: 4,
                      padding: "4px 10px",
                      cursor: "pointer",
                      font: `${active ? 600 : 500} 12.5px/1.2 var(--font-sans)`,
                      display: "inline-flex", alignItems: "baseline", gap: 6,
                    }}
                    title={active ? `Clear ${o.label} filter` : `Filter to ${o.label} ownership`}
                  >
                    {o.label}: <strong style={{ color: active ? "var(--brand-fg)" : "var(--fg-1)", fontWeight: 700 }}>{value}</strong>
                  </button>
                  {i < arr.length - 1 && <span style={{ color: "var(--fg-4)", font: "400 12px/1 var(--font-sans)" }}>·</span>}
                </React.Fragment>
              );
            })}
            {filters.ownership !== "Any" && (
              <button
                onClick={() => setFilters({ ...filters, ownership: "Any" })}
                className="btn btn-ghost btn-sm"
                style={{ marginLeft: "auto", padding: "2px 10px", color: "var(--fg-3)" }}
              >
                Clear
              </button>
            )}
          </div>

          {/* Toolbar */}
          <div style={{ padding: "10px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <div style={{ position: "relative", width: 240 }}>
              <Icon name="search" size={13} color="var(--fg-4)" style={{ position: "absolute", left: 10, top: 11 }}/>
              <input className="input" value={q} onChange={e => setQ(e.target.value)} placeholder="Search credentials…" style={{ paddingLeft: 30, height: 32, fontSize: 12.5 }}/>
            </div>
            {/* "Type" filter label matches the TYPE column header exactly — same word,
                same case convention as the table. Options reorder: SSH Key / App Secret
                / Cloud-IAM come first because each has a corresponding tab (SSH Keys /
                Application Secrets / Cloud/IAM Accounts) — matching that left-to-right
                tab sequence means an admin scanning the tab bar and the dropdown reads
                the same mental model twice. Password and Certificate reference have no
                dedicated tab, so they sit at the end.

                Rule for future additions: a new type only earns its own tab if it needs
                a distinct stat header and proactive banner (SSH Keys shows Stale /
                Orphaned counts, Cloud/IAM shows Root accounts vaulted). If a new type
                would just be All-Credentials filtered by Type=X with no additional
                computed context, keep it dropdown-only — no tab. */}
            <FilterDropdown label="Type"             value={filters.nature}    onChange={v => setFilters({...filters, nature: v})}    options={[["Any","Any"],["SSH Key","SSH Key"],["App Secret","App Secret"],["Cloud-IAM","Cloud-IAM"],["Password","Password"],["Certificate reference","Certificate"]]}/>
            <FilterDropdown label="Ownership"        value={filters.ownership} onChange={v => setFilters({...filters, ownership: v})} options={[["Any","Any"],["Individual","Individual"],["Shared","Shared"],["Non-human","Non-human"]]}/>
            <FilterDropdown label="Management state" value={filters.mgmt}      onChange={v => setFilters({...filters, mgmt: v})}      options={[["Any","Any"],["Vaulted-Managed","Vaulted-Managed"],["Ad-hoc-Unmanaged","Ad-hoc-Unmanaged"],["Federated-SSO","Federated-SSO"],["Reconciliation","Reconciliation"],["Break-glass","Break-glass"]]}/>
            <FilterDropdown label="Status"           value={filters.status}    onChange={v => setFilters({...filters, status: v})}    options={[["Any","Any"],["Healthy","Healthy"],["Overdue","Overdue"],["Failed","Failed"],["Drifted","Drifted"],["No policy","No policy"]]}/>
            <FilterDropdown label="Resource"         value={filters.resource}  onChange={v => setFilters({...filters, resource: v})}  options={[["Any","Any"],["prod-db-01","prod-db-01"],["ssh-server-linux","ssh-server-linux"]]}/>
            <FilterDropdown label="Owner"            value={filters.owner}     onChange={v => setFilters({...filters, owner: v})}     options={[["Any","Any"],["Arjun Bansal","Arjun Bansal"],["Priya Nair","Priya Nair"]]}/>
            <div style={{ flex: 1 }}/>
            <button className="btn btn-sm" onClick={() => selected.size > 0 ? setBulkRotate(true) : window.pamToast("Select one or more credentials to bulk rotate", "info")}><Icon name="refresh" size={11}/> Bulk rotate</button>
            <div style={{ position: "relative" }}>
              <button className="btn btn-sm" onClick={() => setExportOpen(o => !o)}><Icon name="download" size={11}/> Export <Icon name="chevron-down" size={9}/></button>
              {exportOpen && (<>
                <div onClick={() => setExportOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 30 }}/>
                <div style={{ position: "absolute", top: "calc(100% + 4px)", right: 0, zIndex: 31, width: 180, background: "var(--bg-app)", border: "1px solid var(--border)", borderRadius: 8, boxShadow: "var(--shadow-lg)", padding: 4 }}>
                  <button className="btn btn-ghost btn-sm" style={{ width: "100%", justifyContent: "flex-start" }} onClick={() => { setExportOpen(false); window.pamToast("Credentials list exported"); }}><Icon name="download" size={11}/> Export as CSV</button>
                  <button className="btn btn-ghost btn-sm" style={{ width: "100%", justifyContent: "flex-start" }} onClick={() => { setExportOpen(false); window.pamToast("Credentials list exported"); }}><Icon name="download" size={11}/> Export as PDF</button>
                </div>
              </>)}
            </div>
            <div style={{ position: "relative" }}>
              <button className="btn btn-sm btn-icon" onClick={() => setColumnsOpen(o => !o)} title="Customize columns"><Icon name="columns" size={12}/></button>
              {columnsOpen && (
                <>
                  <div onClick={() => setColumnsOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 30 }}/>
                  <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 31, width: 240, background: "var(--bg-app)", border: "1px solid var(--border)", borderRadius: 8, boxShadow: "var(--shadow-lg)", padding: 6 }}>
                    <div style={{ padding: "6px 10px 8px", font: "600 10.5px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.6, borderBottom: "1px solid var(--border-subtle)", marginBottom: 4 }}>Shown columns</div>
                    {ALL_COLS.map(c => (
                      <label key={c.id} style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 10px", cursor: c.required ? "not-allowed" : "pointer", borderRadius: 5, opacity: c.required ? 0.55 : 1 }}>
                        <input type="checkbox" checked={visibleCols.has(c.id)} disabled={c.required} onChange={() => !c.required && toggleCol(c.id)} style={{ accentColor: "var(--brand)" }}/>
                        <span style={{ flex: 1, font: "500 12.5px/1 var(--font-sans)", color: "var(--fg-1)" }}>{c.label}</span>
                        {c.required && <span style={{ font: "500 10px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.5 }}>Required</span>}
                      </label>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Filter chip strip */}
          {activeChips.length > 0 && (
            <div style={{ padding: "8px 24px", borderBottom: "1px solid var(--border-subtle)", display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
              {activeChips.map(([k, v]) => <ChipFilter key={k} label={`${k}: ${v}`} onRemove={() => setFilters({...filters, [k]: "Any"})}/>)}
              <button className="btn btn-ghost btn-sm" style={{ padding: "2px 10px", color: "var(--fg-3)" }} onClick={() => setFilters({ nature: "Any", ownership: "Any", mgmt: "Any", status: "Any", resource: "Any", owner: "Any" })}>Clear all</button>
            </div>
          )}

          {/* Bulk action bar */}
          {selected.size > 0 && (
            <div style={{ padding: "10px 24px", background: "var(--brand-soft)", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ font: "600 12.5px/1 var(--font-sans)", color: "var(--brand-fg)" }}>{selected.size} selected</span>
              <div style={{ flex: 1 }}/>
              <button className="btn btn-sm" onClick={() => setBulkRotate(true)}><Icon name="refresh" size={11}/> Rotate now</button>
              <button className="btn btn-sm" onClick={() => { const first = rows.find(r => selected.has(r.id)); if (first) setAssignOwner(first); }}>Assign owner</button>
              <button className="btn btn-sm" onClick={() => window.pamToast("Credentials list exported")}>Export</button>
              <button className="btn btn-sm" style={{ color: "var(--danger-fg)" }} onClick={() => { const first = rows.find(r => selected.has(r.id)); if (first) setDeleteCred(first); }}>Delete</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelected(new Set())}>Clear</button>
            </div>
          )}

          {/* Table */}
          <div style={{ flex: 1, overflow: "auto" }}>
            {rows.length === 0 ? (
              empty || all.length === 0 ? (
                <EmptyState icon="lock" title="No credentials in the vault yet"
                  description="Add credentials manually, import via CSV, or onboard from discovered accounts."
                  action={<><button className="btn btn-primary" onClick={() => setShowAdd(true)}><Icon name="plus" size={11}/> Add credential</button><button className="btn"><Icon name="discovery" size={11}/> Import from Discovery</button></>}/>
              ) : (
                <div style={{ padding: 48, textAlign: "center", color: "var(--fg-3)" }}>
                  <Icon name="search" size={24} color="var(--fg-4)"/>
                  <div style={{ marginTop: 10, font: "500 13.5px/1.4 var(--font-sans)", color: "var(--fg-2)" }}>No credentials match those filters</div>
                </div>
              )
            ) : (
              <table className="table">
                <thead><tr>
                  <th style={{ width: 32 }}><input type="checkbox" checked={allChecked} onChange={toggleAll} style={{ accentColor: "var(--brand)" }}/></th>
                  {show("name")        && <th>Display name</th>}
                  {show("type")        && <th>Type</th>}
                  {show("username")    && <th>Username</th>}
                  {show("resources")   && <th>Resources</th>}
                  {show("owner")       && <th>Owner</th>}
                  {show("sensitivity") && <th>Sensitivity</th>}
                  {show("nonviewable") && <th>Non-viewable</th>}
                  {show("adminAcct")   && <th>Admin account</th>}
                  {show("policy")      && <th>Rotation policy</th>}
                  {show("lastRotated") && <th>Last rotated</th>}
                  {show("status")      && <th>Rotation status</th>}
                  <th></th>
                </tr></thead>
                <tbody>{rows.map(c => (
                  <tr key={c.id} onClick={() => setOpenId(c.id)} style={{ cursor: "pointer", background: newIds.has(c.id) ? "var(--brand-soft)" : undefined, transition: "background 0.6s ease" }}>
                    <td onClick={e => e.stopPropagation()}><input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleSel(c.id)} style={{ accentColor: "var(--brand)" }}/></td>
                    {show("name")        && <td><span style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--brand-fg)" }}>{c.display}</span></td>}
                    {show("type")        && <td><CRED_TYPE_BADGE type={c.type}/></td>}
                    {show("username")    && <td>{c.username === "—" ? <span style={{ color: "var(--fg-4)" }}>—</span> : <MaskedField value={c.username}/>}</td>}
                    {show("resources")   && <td><span style={{ padding: "2px 8px", borderRadius: 999, background: "var(--bg-surface-2)", font: "500 11.5px/1.5 var(--font-sans)", color: "var(--fg-2)" }} title={c.resources.join(", ")}>{c.resources.length} resource{c.resources.length === 1 ? "" : "s"}</span></td>}
                    {show("owner")       && <td>{c.owner ? <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Avatar name={c.owner} size={20}/><span style={{ fontSize: 12.5 }}>{c.owner}</span></span> : <span style={{ color: "var(--fg-4)", fontSize: 12.5 }}>Unassigned</span>}</td>}
                    {show("sensitivity") && <td><SensitivityBadge level={c.sensitivity}/></td>}
                    {show("nonviewable") && <td>{c.nonViewable ? <span title="Non-viewable" style={{ color: "var(--success-fg)" }}>🔒</span> : <span style={{ color: "var(--fg-4)" }}>—</span>}</td>}
                    {show("adminAcct")   && <td className="t-tiny" style={{ color: c.adminAcct ? "var(--fg-2)" : "var(--fg-4)" }}>{c.adminAcct || "Not set"}</td>}
                    {show("policy")      && <td className="t-tiny" style={{ color: c.policy ? "var(--fg-2)" : "var(--fg-4)" }}>{c.policy || "None"}</td>}
                    {show("lastRotated") && <td className="t-tiny" style={{ color: c.lastRotated === "Never" ? "var(--fg-4)" : c.rotation === "failed" || c.rotation === "drifted" ? "var(--danger-fg)" : "var(--fg-3)" }}>{c.lastRotated}</td>}
                    {show("status")      && <td><span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><RotationDot status={c.rotation}/><span style={{ font: "500 12px/1 var(--font-sans)", color: "var(--fg-2)" }}>{c.rotation === "healthy" ? "Healthy" : c.rotation === "overdue" ? "Overdue" : c.rotation === "failed" ? "Failed" : c.rotation === "drifted" ? "Drifted" : "No policy"}</span></span></td>}
                    <td onClick={e => e.stopPropagation()} style={{ textAlign: "right" }}>
                      {testingId === c.id ? <span style={{ display: "inline-flex", alignItems: "center", gap: 6, font: "500 11.5px/1 var(--font-sans)", color: "var(--fg-3)" }}><Spinner size={12}/> Testing…</span>
                       : c.rotation === "drifted" ? <button className="btn btn-sm" onClick={() => setDriftId(c.id)}>Reconcile</button> : <RowMenu items={[
                        { label: "Edit", icon: "edit", onClick: () => { setEditId(c.id); setOpenId(c.id); } },
                        { label: "Rotate now", icon: "refresh", disabled: !c.adminAcct, onClick: () => setRotateId(c.id) },
                        { label: "Test credential", icon: "check-circle", onClick: () => runTest(c) },
                        { label: "View history", icon: "history", onClick: () => setAuditCred(c.id) },
                        { label: "Assign owner", icon: "user", onClick: () => setAssignOwner(c) },
                        { label: "Duplicate", icon: "copy", onClick: () => { setDupData({ ...c, display: "Copy of " + c.display }); setShowAdd(true); } },
                        { divider: true },
                        { label: "Delete", icon: "trash", danger: true, onClick: () => setDeleteCred(c) },
                      ]}/>}
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            )}
          </div>
        </>
      )}

      {openId   && <CredentialDetailPanel credId={openId} startEdit={editId === openId} onClose={() => { setOpenId(null); setEditId(null); }} onRotate={(id) => { setRotateId(id); }} onDrift={(id) => { setOpenId(null); setDriftId(id); }} onHistory={(id) => setAuditCred(id)} onAssignOwner={(c) => setAssignOwner(c)} onDelete={(c) => setDeleteCred(c)}/>}
      {rotateId && <RotateNowModal credId={rotateId} onClose={() => setRotateId(null)} onComplete={(id) => { window.credStore.update(id, { rotation: "healthy", lastRotated: "just now" }); window.pamToast("Credential rotated successfully"); }}/>}
      {driftId  && <DriftPanel credId={driftId} onClose={() => setDriftId(null)}/>}
      {showAdd  && <CredAddPanel prefill={dupData} onClose={() => { setShowAdd(false); setDupData(null); }} onCreated={(data) => { const cred = window.buildCredFromAddData(data); window.credStore.add(cred); flashNew(cred.id); window.pamToast(`${cred.display} added to vault`); }}/>}
      {showCsv  && <CSVImportPanel onClose={() => setShowCsv(false)}/>}
      {assignOwner && <AssignOwnerModal cred={assignOwner} onClose={() => setAssignOwner(null)} onSave={(owner) => { window.credStore.update(assignOwner.id, { owner }); window.pamToast(`Owner assigned — ${owner}`); }}/>}
      {deleteCred && <DeleteCredModal cred={deleteCred} onClose={() => setDeleteCred(null)} onConfirm={() => { window.credStore.remove(deleteCred.id); if (openId === deleteCred.id) setOpenId(null); window.pamToast(`${deleteCred.display} deleted from vault`); }}/>}
      {auditCred && <CredAuditTrailPanel credId={auditCred} onClose={() => setAuditCred(null)}/>}
      {bulkRotate && <BulkRotateModal creds={rows.filter(r => selected.has(r.id))} onClose={() => setBulkRotate(false)} onDone={() => setSelected(new Set())}/>}
    </div>
  );
};

window.CredentialsV2 = CredentialsV2;
