// Policies V2 — Main list + tab router

const PoliciesV2 = ({ empty }) => {
  const [tab, setTab] = React.useState("all");
  const [q, setQ] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState("Any");
  const [statusFilter, setStatusFilter] = React.useState("Any");
  const [selected, setSelected] = React.useState(new Set());
  const [openId, setOpenId] = React.useState(null);
  const [showCreate, setShowCreate] = React.useState(false);
  const [showTemplates, setShowTemplates] = React.useState(false);
  const [showVersionHistory, setShowVersionHistory] = React.useState(null);
  const [showBulkApply, setShowBulkApply] = React.useState(null);
  const [columnsOpen, setColumnsOpen] = React.useState(false);
  const [showAlertBanner, setShowAlertBanner] = React.useState(true);
  const [toast, setToast] = React.useState(null);

  const all = empty ? [] : (window.POLICIES_V2 || []);

  // Filter by tab
  let rows = all;
  if (tab === "ssh")      rows = rows.filter(p => p.type === "SSH");
  else if (tab === "rdp") rows = rows.filter(p => p.type === "RDP");
  else if (tab === "web") rows = rows.filter(p => p.type === "Web");
  else if (tab === "db")  rows = rows.filter(p => p.type === "Database");
  else if (tab === "pwd") rows = rows.filter(p => p.type === "Password");

  if (q) rows = rows.filter(p => [p.name, p.description, p.type].some(v => v.toLowerCase().includes(q.toLowerCase())));
  if (typeFilter !== "Any") rows = rows.filter(p => p.type === typeFilter);
  if (statusFilter !== "Any") rows = rows.filter(p => p.status === statusFilter);

  // KPIs
  const totalPolicies = all.length;
  const resourcesWithoutPolicy = 2; // Simulated count
  const activeSessions = all.reduce((s, p) => s + (p.activeSessions || 0), 0);
  const recentlyModified = all.filter(p => p.modifiedOn.includes("Apr 28") || p.modifiedOn.includes("Apr 26")).length;

  const ALL_COLS = [
    { id: "name",      label: "Policy Name", required: true },
    { id: "type",      label: "Type",        required: true },
    { id: "status",    label: "Status",      required: false },
    { id: "resources", label: "Resources",   required: false },
    { id: "recording", label: "Recording",   required: false },
    { id: "mfa",       label: "MFA",         required: false },
    { id: "modified",  label: "Last modified",required: false },
    { id: "active",    label: "Active sessions",required: false },
  ];
  const [visibleCols, setVisibleCols] = React.useState(new Set(ALL_COLS.map(c => c.id)));
  const show = (id) => visibleCols.has(id);
  const toggleCol = (id) => setVisibleCols(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const allChecked = rows.length > 0 && rows.every(r => selected.has(r.id));
  const toggleSel = (id) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSelected(allChecked ? new Set() : new Set(rows.map(r => r.id)));

  if (showCreate) return <PolicyCreatePage onClose={() => setShowCreate(false)}/>;

  const openPolicy = (window.POLICIES_V2 || []).find(p => p.id === openId);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
      <PageHeader
        title="Policies"
        description="The rulebook layer. Every privileged session, every credential rotation, every break-glass event obeys a policy."
        actions={<>
          <button className="btn" onClick={() => setShowTemplates(true)}><Icon name="file-text" size={13}/> Templates</button>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Icon name="plus" size={13}/> Create Policy</button>
        </>}
      />

      {/* Tabs */}
      <TabBar
        active={tab}
        onChange={setTab}
        tabs={[
          { id: "all", label: "All Policies", weight: 1 },
          { id: "ssh", label: "SSH/SFTP",     weight: 2 },
          { id: "rdp", label: "RDP/VNC",      weight: 2 },
          { id: "web", label: "Web Application", weight: 2 },
          { id: "db",  label: "Database",     weight: 2 },
          { separator: true },
          { id: "pwd",  label: "Password Rotation", weight: 3 },
          { id: "rec",  label: "Recording Settings", weight: 3 },
        ]}
      />

      {tab === "rec" && <RecordingSettingsTab/>}

      {tab !== "rec" && (
        <>
          {/* KPIs */}
          <div style={{ padding: "14px 24px", borderBottom: "1px solid var(--border-subtle)", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            <KPICard label="Total policies" value={totalPolicies}/>
            <KPICard label="Resources without policy" value={resourcesWithoutPolicy} accent="var(--danger-fg)"/>
            <KPICard label="Active sessions" value={activeSessions} accent="var(--success-fg)"/>
            <KPICard label="Recently modified" value={recentlyModified}/>
          </div>

          {/* Alert banner */}
          {showAlertBanner && resourcesWithoutPolicy > 0 && (
            <div style={{ margin: "12px 24px 0", padding: 12, background: "var(--danger-soft)", borderRadius: 6, display: "flex", alignItems: "center", gap: 10, borderLeft: "3px solid var(--danger-fg)" }}>
              <Icon name="alert-circle" size={14} color="var(--danger-fg)"/>
              <div style={{ flex: 1, font: "400 12.5px/1.5 var(--font-sans)", color: "var(--danger-fg)" }}>
                <strong>⚑ {resourcesWithoutPolicy} resources don't have an active policy.</strong> Privileged access on these resources is uncontrolled.
              </div>
              <button className="btn btn-sm">Assign policies →</button>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowAlertBanner(false)}><Icon name="x" size={11}/></button>
            </div>
          )}

          {/* Toolbar */}
          <div style={{ padding: "10px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <div style={{ position: "relative", width: 240 }}>
              <Icon name="search" size={13} color="var(--fg-4)" style={{ position: "absolute", left: 10, top: 11 }}/>
              <input className="input" value={q} onChange={e => setQ(e.target.value)} placeholder="Search policies…" style={{ paddingLeft: 30, height: 32, fontSize: 12.5 }}/>
            </div>
            {tab === "all" && <FilterDropdown label="Type" value={typeFilter} onChange={setTypeFilter} options={[["Any","Any"],["SSH","SSH"],["RDP","RDP"],["Web","Web"],["Database","Database"],["Password","Password"]]}/>}
            <FilterDropdown label="Status" value={statusFilter} onChange={setStatusFilter} options={[["Any","Any"],["Active","Active"],["Draft","Draft"],["Archived","Archived"]]}/>
            <div style={{ flex: 1 }}/>
            <button className="btn btn-sm">Bulk apply</button>
            <button className="btn btn-sm"><Icon name="download" size={11}/> Export</button>
            <div style={{ position: "relative" }}>
              <button className="btn btn-sm btn-icon" onClick={() => setColumnsOpen(o => !o)}><Icon name="columns" size={12}/></button>
              {columnsOpen && (<>
                <div onClick={() => setColumnsOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 30 }}/>
                <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 31, width: 240, background: "var(--bg-app)", border: "1px solid var(--border)", borderRadius: 8, boxShadow: "var(--shadow-lg)", padding: 6 }}>
                  <div style={{ padding: "6px 10px 8px", font: "600 10.5px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.6, borderBottom: "1px solid var(--border-subtle)", marginBottom: 4 }}>Shown columns</div>
                  {ALL_COLS.map(c => (
                    <label key={c.id} style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 10px", borderRadius: 5, cursor: c.required ? "not-allowed" : "pointer", opacity: c.required ? 0.55 : 1 }}>
                      <input type="checkbox" checked={visibleCols.has(c.id)} disabled={c.required} onChange={() => !c.required && toggleCol(c.id)} style={{ accentColor: "var(--brand)" }}/>
                      <span style={{ flex: 1, font: "500 12.5px/1 var(--font-sans)", color: "var(--fg-1)" }}>{c.label}</span>
                    </label>
                  ))}
                </div>
              </>)}
            </div>
          </div>

          {selected.size > 0 && (
            <div style={{ padding: "10px 24px", background: "var(--brand-soft)", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ font: "600 12.5px/1 var(--font-sans)", color: "var(--brand-fg)" }}>{selected.size} selected</span>
              <div style={{ flex: 1 }}/>
              <button className="btn btn-sm">Apply to resources</button>
              <button className="btn btn-sm">Archive</button>
              <button className="btn btn-sm">Export</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelected(new Set())}>Clear</button>
            </div>
          )}

          <div style={{ flex: 1, overflow: "auto" }}>
            {rows.length === 0 ? (
              <EmptyState icon="policies" title="No policies in this view"
                description="Create a policy or pick a different tab."
                action={<button className="btn btn-primary" onClick={() => setShowCreate(true)}><Icon name="plus" size={11}/> Create policy</button>}/>
            ) : (
              <table className="table">
                <thead><tr>
                  <th style={{ width: 32 }}><input type="checkbox" checked={allChecked} onChange={toggleAll} style={{ accentColor: "var(--brand)" }}/></th>
                  {show("name")      && <th>Policy Name</th>}
                  {show("type")      && <th>Type</th>}
                  {show("status")    && <th>Status</th>}
                  {show("resources") && <th>Resources bound</th>}
                  {show("recording") && <th>Recording</th>}
                  {show("mfa")       && <th>MFA</th>}
                  {show("modified")  && <th>Last modified</th>}
                  {show("active")    && <th>Active sessions</th>}
                  <th></th>
                </tr></thead>
                <tbody>{rows.map(p => (
                  <tr key={p.id} onClick={() => setOpenId(p.id)} style={{ cursor: "pointer" }}>
                    <td onClick={e => e.stopPropagation()}><input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSel(p.id)} style={{ accentColor: "var(--brand)" }}/></td>
                    {show("name")      && <td><span style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--brand-fg)" }}>{p.name}</span></td>}
                    {show("type")      && <td><POL_TYPE_BADGE type={p.type}/></td>}
                    {show("status")    && <td><POL_STATUS_BADGE status={p.status}/></td>}
                    {show("resources") && <td><span title={p.resources.join(", ")} style={{ padding: "2px 8px", borderRadius: 999, background: "var(--bg-surface-2)", font: "500 11.5px/1.5 var(--font-sans)", color: "var(--fg-2)" }}>{p.resources.length} resource{p.resources.length === 1 ? "" : "s"}</span></td>}
                    {show("recording") && <td>{p.settings.recording === "on" ? <span style={{ color: "var(--success-fg)" }}>✓</span> : p.settings.recording === "off" ? <span style={{ color: "var(--fg-4)" }}>✗</span> : <span style={{ font: "500 11.5px/1 var(--font-sans)", color: "var(--fg-3)" }}>Inherits</span>}</td>}
                    {show("mfa")       && <td>{p.settings.mfa ? <span style={{ color: "var(--success-fg)" }}>✓</span> : <span style={{ color: "var(--fg-4)" }}>✗</span>}</td>}
                    {show("modified")  && <td className="t-tiny" style={{ color: "var(--fg-3)" }}>{p.modifiedOn}<br/><span style={{ color: "var(--fg-4)" }}>by {p.modifiedBy}</span></td>}
                    {show("active")    && <td>{p.activeSessions > 0 ? <span style={{ display: "inline-flex", alignItems: "center", gap: 5, font: "500 12px/1 var(--font-sans)", color: "var(--success-fg)" }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--success-fg)" }}/>{p.activeSessions}</span> : <span style={{ color: "var(--fg-4)" }}>—</span>}</td>}
                    <td onClick={e => e.stopPropagation()} style={{ textAlign: "right" }}><RowMenu items={[
                      { label: "View", icon: "eye", onClick: () => setOpenId(p.id) },
                      { label: "Edit", icon: "edit", onClick: () => setOpenId(p.id) },
                      { label: "Duplicate", icon: "copy", onClick: () => setShowCreate(true) },
                      { label: "Apply to resources", icon: "plus", onClick: () => setShowBulkApply(p) },
                      { label: "View version history", icon: "history", onClick: () => setShowVersionHistory(p) },
                      { divider: true },
                      { label: "Archive", icon: "lock", disabled: p.resources.length > 0, onClick: () => {} },
                      { label: "Delete", icon: "trash", danger: true, disabled: p.resources.length > 0, onClick: () => {} },
                    ]}/></td>
                  </tr>
                ))}</tbody>
              </table>
            )}
          </div>
        </>
      )}

      {openId && <PolicyDetailPanel policyId={openId} onClose={() => setOpenId(null)} onVersionHistory={(p) => { setOpenId(null); setShowVersionHistory(p); }} onBulkApply={(p) => { setOpenId(null); setShowBulkApply(p); }} onEdit={(p) => { setOpenId(null); setShowCreate(true); }}/>}
      {showTemplates && <PolicyTemplatesPanel onClose={() => setShowTemplates(false)} onUseTemplate={(t) => { setShowTemplates(false); setShowCreate(true); }}/>}
      {showVersionHistory && <PolicyVersionHistoryPanel policy={showVersionHistory} onClose={() => setShowVersionHistory(null)}/>}
      {showBulkApply && <PolicyBulkApplyPanel policy={showBulkApply} onClose={() => setShowBulkApply(null)}/>}
      {toast && <Toast {...toast} onClose={() => setToast(null)}/>}
    </div>
  );
};

window.PoliciesV2 = PoliciesV2;
