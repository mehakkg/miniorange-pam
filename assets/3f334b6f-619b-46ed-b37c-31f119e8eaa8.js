// Resources V2 — List view (compact, scalable) with All / My tabs
// Stats strip is now a slim, horizontally-scrolling segmented filter that
// scales to many resource types without dominating vertical space.

const TYPE_META = {
  linux:    { label: "Linux",      icon: "server",     bucket: "linux"    },
  windows:  { label: "Windows",    icon: "server",     bucket: "windows"  },
  database: { label: "Database",   icon: "database",   bucket: "database" },
  web:      { label: "Web app",    icon: "web",        bucket: "web"      },
  desktop:  { label: "Desktop",    icon: "desktop",    bucket: "desktop"  },
  cloud:    { label: "Cloud",      icon: "cloud",      bucket: "cloud"    },
  k8s:      { label: "Kubernetes", icon: "cloud",      bucket: "k8s"      },
  network:  { label: "Network",    icon: "server",     bucket: "network"  },
};

const CRIT_STYLE = {
  critical: { bg: "var(--danger-soft)",  fg: "var(--danger-fg)"  },
  high:     { bg: "var(--warning-soft)", fg: "var(--warning-fg)" },
  medium:   { bg: "var(--bg-surface-2)", fg: "var(--fg-2)"       },
  low:      { bg: "var(--bg-surface-2)", fg: "var(--fg-3)"       },
};

const ConnStatus = ({ s }) => {
  const map = {
    reachable:   { dot: "var(--success)", label: "Reachable",   color: "var(--success-fg)" },
    unreachable: { dot: "var(--danger)",  label: "Unreachable", color: "var(--danger-fg)" },
    untested:    { dot: "var(--fg-4)",    label: "Untested",    color: "var(--fg-3)" },
  };
  const m = map[s] || map.untested;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: m.color }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: m.dot }}/>{m.label}
    </span>
  );
};

// Compact, scalable filter chip — one row, horizontal scroll if overflowed.
const FilterChip = ({ icon, label, count, active, onClick, accent }) => (
  <button onClick={onClick} style={{
    display: "inline-flex", alignItems: "center", gap: 7,
    padding: "5px 10px 5px 9px", borderRadius: 999,
    border: `1px solid ${active ? "var(--brand)" : "var(--border)"}`,
    background: active ? "var(--brand-soft)" : "var(--bg-surface)",
    color: active ? "var(--brand-fg)" : "var(--fg-2)",
    cursor: "pointer", font: "500 12px/1 var(--font-sans)",
    flex: "none", height: 28,
  }}>
    {icon && <Icon name={icon} size={12} color={active ? "var(--brand-fg)" : (accent || "var(--fg-3)")}/>}
    <span>{label}</span>
    <span style={{
      font: "600 11px/1 var(--font-sans)",
      color: active ? "var(--brand-fg)" : "var(--fg-3)",
      background: active ? "rgba(255,255,255,0.5)" : "var(--bg-surface-2)",
      padding: "2px 6px", borderRadius: 999, minWidth: 18, textAlign: "center",
    }}>{count}</span>
  </button>
);

// Enrich seed with extra columns the spec calls for
const enrich = (r) => ({
  ...r,
  port: r.type === "linux" ? 22 : r.type === "windows" ? 3389 : r.type === "database" ? (r.os.startsWith("PostgreSQL") ? 5432 : r.os.startsWith("MongoDB") ? 27017 : r.os.startsWith("Redis") ? 6379 : 3306) : 443,
  conn: r.status === "rotation-failed" ? "unreachable" : r.status === "stale-cred" ? "untested" : "reachable",
  lastAccessed: ["2 hours ago","45 minutes ago","yesterday","3 days ago","just now","6 hours ago","1 day ago","12 minutes ago","4 days ago","2 weeks ago","3 hours ago","never"][parseInt(r.id.slice(-1))] || "1 hour ago",
});

const ResourcesV2List = ({ empty, onOpen, onAdd }) => {
  const [tab, setTab] = React.useState("all");   // "all" | "my"
  const [q, setQ] = React.useState("");
  const [bucket, setBucket] = React.useState("all");
  const [selected, setSelected] = React.useState(new Set());
  const [filters, setFilters] = React.useState({ crit: "any", env: "any", status: "any" });
  const [columnsOpen, setColumnsOpen] = React.useState(false);
  const [toast, setToast] = React.useState(null);
  const [duplicateOf, setDuplicateOf] = React.useState(null);
  const [deleteOf, setDeleteOf] = React.useState(null);
  const [allocOf, setAllocOf] = React.useState(null);

  const ALL_COLS = [
    { id: "display",   label: "Display name",   required: true,  defaultOn: true },
    { id: "type",      label: "Type",           required: false, defaultOn: true },
    { id: "host",      label: "Host",           required: false, defaultOn: true },
    { id: "port",      label: "Port",           required: false, defaultOn: true },
    { id: "conn",      label: "Connection",     required: false, defaultOn: true },
    { id: "crit",      label: "Criticality",    required: false, defaultOn: true },
    { id: "env",       label: "Environment",    required: false, defaultOn: true },
    { id: "creds",     label: "Credentials",    required: false, defaultOn: true },
    { id: "active",    label: "Active sessions",required: false, defaultOn: true },
    { id: "last",      label: "Last accessed",  required: false, defaultOn: true },
    { id: "created",   label: "Created date",   required: false, defaultOn: false },
    { id: "owner",     label: "Owner",          required: false, defaultOn: false },
    { id: "tags",      label: "Tags",           required: false, defaultOn: false },
  ];
  const [visibleCols, setVisibleCols] = React.useState(new Set(ALL_COLS.filter(c => c.defaultOn).map(c => c.id)));
  const showCol = (id) => visibleCols.has(id);
  const toggleCol = (id) => setVisibleCols(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const resetCols = () => setVisibleCols(new Set(ALL_COLS.filter(c => c.defaultOn).map(c => c.id)));

  const all = (empty ? [] : SEED_RESOURCES).map(enrich);

  // For "my" tab we treat a subset as the current user's allocations
  const MY_IDS = new Set(["RES-2841","RES-2840","RES-2837","RES-2832","RES-2831"]);
  const source = tab === "my" ? all.filter(r => MY_IDS.has(r.id)) : all;

  // Count per type bucket — scales as types are added
  const typeBuckets = [
    { id: "linux",    icon: "server",   label: "Linux" },
    { id: "windows",  icon: "server",   label: "Windows" },
    { id: "database", icon: "database", label: "Databases" },
    { id: "web",      icon: "web",      label: "Web apps" },
    { id: "cloud",    icon: "cloud",    label: "Cloud" },
    { id: "k8s",      icon: "cloud",    label: "Kubernetes" },
    { id: "desktop",  icon: "desktop",  label: "Desktop" },
    { id: "network",  icon: "server",   label: "Network" },
  ].map(b => ({ ...b, count: source.filter(r => r.type === b.id).length }));

  let rows = source;
  if (bucket !== "all") rows = rows.filter(r => r.type === bucket);
  if (q) {
    const lq = q.toLowerCase();
    rows = rows.filter(r => [r.name, r.host, r.os, r.env].some(v => String(v).toLowerCase().includes(lq)));
  }
  if (filters.crit !== "any")   rows = rows.filter(r => r.criticality === filters.crit);
  if (filters.env !== "any")    rows = rows.filter(r => r.env === filters.env);
  if (filters.status !== "any") rows = rows.filter(r => r.conn === filters.status);

  const allChecked = rows.length > 0 && rows.every(r => selected.has(r.id));
  const toggleAll = () => setSelected(s => new Set(allChecked ? [] : rows.map(r => r.id)));
  const toggle = (id) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const hasSel = selected.size > 0;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <PageHeader
        title="Resources"
        description="The anchor entity. Credentials, policies, and access all attach here."
        actions={<>
          <button className="btn"><Icon name="upload" size={13}/> Import</button>
          <button className="btn btn-primary" onClick={onAdd}><Icon name="plus" size={13}/> Add resource</button>
        </>}
      />

      {/* Sub-nav: All / My resources */}
      <div style={{ padding: "0 24px", borderBottom: "1px solid var(--border)", display: "flex", gap: 4 }}>
        {[
          { id: "all", label: "All resources", count: all.length },
          { id: "my",  label: "My resources",  count: all.filter(r => MY_IDS.has(r.id)).length },
        ].map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setBucket("all"); setSelected(new Set()); }} style={{
            padding: "10px 14px", marginBottom: -1, border: "none", background: "transparent",
            color: tab === t.id ? "var(--fg-1)" : "var(--fg-3)",
            font: `${tab === t.id ? 600 : 500} 13px/1 var(--font-sans)`,
            borderBottom: `2px solid ${tab === t.id ? "var(--brand)" : "transparent"}`,
            cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
          }}>
            {t.label}
            <span style={{
              font: "500 11px/1 var(--font-sans)",
              color: tab === t.id ? "var(--brand-fg)" : "var(--fg-4)",
              background: tab === t.id ? "var(--brand-soft)" : "var(--bg-surface-2)",
              padding: "2px 6px", borderRadius: 999,
            }}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* Compact stats / type filter strip */}
      {!empty && (
        <div style={{
          padding: "10px 24px", borderBottom: "1px solid var(--border-subtle)",
          display: "flex", gap: 6, alignItems: "center", overflowX: "auto",
          maskImage: "linear-gradient(to right, black calc(100% - 24px), transparent)",
        }}>
          <FilterChip label="All" count={source.length} active={bucket === "all"} onClick={() => setBucket("all")}/>
          <div style={{ width: 1, height: 18, background: "var(--border)", flex: "none", margin: "0 2px" }}/>
          {typeBuckets.filter(b => b.count > 0 || bucket === b.id).map(b => (
            <FilterChip key={b.id} icon={b.icon} label={b.label} count={b.count}
              active={bucket === b.id} onClick={() => setBucket(b.id)}/>
          ))}
        </div>
      )}

      {/* Toolbar / Bulk action bar */}
      <div style={{ padding: "10px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", background: hasSel ? "var(--brand-soft)" : "transparent" }}>
        {hasSel ? <>
          <span style={{ font: "600 13px/1 var(--font-sans)", color: "var(--brand-fg)" }}>{selected.size} selected</span>
          <div style={{ flex: 1 }}/>
          <button className="btn btn-sm"><Icon name="check-circle" size={12}/> Test connection</button>
          <button className="btn btn-sm"><Icon name="key" size={12}/> Allocate</button>
          <button className="btn btn-sm"><Icon name="download" size={12}/> Export</button>
          <button className="btn btn-sm" style={{ color: "var(--danger-fg)" }}><Icon name="trash" size={12}/> Delete</button>
          <button className="btn btn-sm btn-ghost" onClick={() => setSelected(new Set())}>Clear</button>
        </> : <>
          <div style={{ position: "relative", width: 260 }}>
            <Icon name="search" size={13} color="var(--fg-4)" style={{ position: "absolute", left: 10, top: 11 }}/>
            <input className="input" value={q} onChange={e => setQ(e.target.value)} placeholder={tab === "my" ? "Search my resources…" : "Search resources…"} style={{ paddingLeft: 30, height: 32, fontSize: 12.5 }}/>
          </div>
          <FilterDropdown label="Criticality" value={filters.crit}   onChange={v => setFilters(f => ({...f, crit: v}))}   options={[["any","Any"],["critical","Critical"],["high","High"],["medium","Medium"],["low","Low"]]}/>
          <FilterDropdown label="Environment" value={filters.env}    onChange={v => setFilters(f => ({...f, env: v}))}    options={[["any","Any"],["production","Production"],["staging","Staging"],["development","Dev"]]}/>
          <FilterDropdown label="Status"      value={filters.status} onChange={v => setFilters(f => ({...f, status: v}))} options={[["any","Any"],["reachable","Reachable"],["unreachable","Unreachable"],["untested","Untested"]]}/>
          <div style={{ flex: 1 }}/>
          {tab === "all" && <>
            <div style={{ position: "relative" }}>
              <button className="btn btn-sm" onClick={() => setColumnsOpen(o => !o)}><Icon name="columns" size={11}/> Columns</button>
              {columnsOpen && (<>
                <div onClick={() => setColumnsOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }}/>
                <div style={{ position: "absolute", top: "calc(100% + 4px)", right: 0, zIndex: 41, width: 220, background: "var(--bg-app)", border: "1px solid var(--border)", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.10)", padding: 4 }}>
                  <div style={{ padding: "6px 10px 8px", font: "600 11px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.6, borderBottom: "1px solid var(--border-subtle)", marginBottom: 4 }}>Show / hide columns</div>
                  {ALL_COLS.map(c => (
                    <label key={c.id} style={{ display: "flex", alignItems: "center", gap: 9, padding: "6px 10px", borderRadius: 5, cursor: c.required ? "not-allowed" : "pointer", opacity: c.required ? 0.55 : 1 }}>
                      <input type="checkbox" checked={visibleCols.has(c.id)} disabled={c.required} onChange={() => !c.required && toggleCol(c.id)} style={{ accentColor: "var(--brand)" }}/>
                      <span style={{ flex: 1, font: "500 12.5px/1 var(--font-sans)", color: "var(--fg-1)" }}>{c.label}</span>
                      {c.required && <Icon name="lock" size={10} color="var(--fg-4)"/>}
                    </label>
                  ))}
                  <div style={{ borderTop: "1px solid var(--border-subtle)", padding: "6px 10px" }}>
                    <button className="btn btn-ghost btn-sm" style={{ padding: 0, color: "var(--brand-fg)" }} onClick={resetCols}>Reset to default</button>
                  </div>
                </div>
              </>)}
            </div>
          </>}
        </>}
      </div>

      <div className="scroll-area" style={{ flex: 1, overflow: "auto" }}>
        {rows.length === 0 ? (
          empty ? (
            <EmptyState icon="resources" title={tab === "my" ? "You don't have access to any resources yet" : "No resources added yet"}
              description={tab === "my" ? "Request access from your security admin, or check Tickets if you have a request in flight." :
                "Add your first server, database, or application to start managing privileged access."}
              action={tab === "all" ? <button className="btn btn-primary" onClick={onAdd}><Icon name="plus" size={13}/> Add resource</button> : null}
            />
          ) : (
            <div style={{ padding: "60px 20px", textAlign: "center", color: "var(--fg-3)" }}>
              <Icon name="search" size={28} color="var(--fg-4)"/>
              <div style={{ marginTop: 10, font: "500 14px/1.4 var(--font-sans)", color: "var(--fg-2)" }}>No resources match those filters</div>
              <button className="btn btn-sm" style={{ marginTop: 14 }} onClick={() => { setQ(""); setBucket("all"); setFilters({crit:"any",env:"any",status:"any"}); }}>Reset filters</button>
            </div>
          )
        ) : tab === "my" ? (
          <MyResourcesTable rows={rows} onOpen={onOpen}/>
        ) : (
          <AllResourcesTable
            rows={rows} allCount={all.length}
            selected={selected} toggle={toggle} toggleAll={toggleAll} allChecked={allChecked}
            onOpen={onOpen} showCol={showCol}
            onTest={(r) => setToast({ kind: "success", text: `Connection to ${r.host}:${r.port} succeeded` })}
            onAllocate={(r) => setAllocOf(r)}
            onViewAllocated={(r) => onOpen(r)}
            onEdit={(r) => onOpen(r)}
            onDuplicate={(r) => setDuplicateOf(r)}
            onDelete={(r) => setDeleteOf(r)}
          />
        )}
      </div>
      {toast && <Toast {...toast} onClose={() => setToast(null)}/>}
      {allocOf && <AllocatePanel resource={allocOf} onClose={() => setAllocOf(null)} onAllocated={() => setToast({ kind: "success", text: `Access allocated on ${allocOf.name}` })}/>}
      {duplicateOf && <ConfirmModal title={`Duplicate ${duplicateOf.name}?`} body="Opens Add Resource pre-filled with this resource's values." confirmLabel="Continue" onClose={() => setDuplicateOf(null)} onConfirm={() => setToast({ kind: "info", text: "Add Resource opened with pre-filled values" })}/>}
      {deleteOf && <ConfirmModal title={`Delete ${deleteOf.name}?`} body={`This will remove the resource and its access allocations. Active sessions will not be terminated immediately.`} warning={`${deleteOf.credCount || 0} credentials are linked to this resource. They will remain in the vault but be unlinked.`} confirmLabel="Delete resource" danger onClose={() => setDeleteOf(null)} onConfirm={() => setToast({ kind: "success", text: `${deleteOf.name} deleted` })}/>}
    </div>
  );
};

// ---- All resources: full admin table ----
const AllResourcesTable = ({ rows, allCount, selected, toggle, toggleAll, allChecked, onOpen, showCol = () => true, onTest, onAllocate, onViewAllocated, onEdit, onDuplicate, onDelete }) => (
  <>
    <table className="table">
      <thead><tr>
        <th style={{ width: 32 }}><input type="checkbox" checked={allChecked} onChange={toggleAll} style={{ accentColor: "var(--brand)" }}/></th>
        <th>Display name</th>
        {showCol("type")    && <th>Type</th>}
        {showCol("host")    && <th>Host</th>}
        {showCol("port")    && <th>Port</th>}
        {showCol("conn")    && <th>Connection</th>}
        {showCol("crit")    && <th>Criticality</th>}
        {showCol("env")     && <th>Environment</th>}
        {showCol("creds")   && <th>Credentials</th>}
        {showCol("active")  && <th>Active</th>}
        {showCol("last")    && <th>Last accessed</th>}
        {showCol("created") && <th>Created</th>}
        {showCol("owner")   && <th>Owner</th>}
        {showCol("tags")    && <th>Tags</th>}
        <th></th>
      </tr></thead>
      <tbody>
        {rows.map(r => (
          <tr key={r.id} onClick={() => onOpen(r)} style={{ cursor: "pointer" }}>
            <td onClick={e => e.stopPropagation()}><input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)} style={{ accentColor: "var(--brand)" }}/></td>
            <td>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <ResourceTypeIcon type={r.type} size={28}/>
                <div>
                  <div style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--brand-fg)" }}>{r.name}</div>
                  <div className="t-tiny" style={{ color: "var(--fg-4)" }}>{r.os}</div>
                </div>
              </div>
            </td>
            {showCol("type")    && <td><span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--fg-2)" }}><Icon name={TYPE_META[r.type]?.icon || "server"} size={13} color="var(--fg-3)"/>{TYPE_META[r.type]?.label || r.type}</span></td>}
            {showCol("host")    && <td className="t-mono" style={{ fontSize: 12, color: "var(--fg-2)" }}>{r.host}</td>}
            {showCol("port")    && <td className="t-mono" style={{ fontSize: 12, color: "var(--fg-3)" }}>{r.port}</td>}
            {showCol("conn")    && <td>{
              window.ZTNAListBadge && window.ztnaStore && window.ztnaStore.resourceAssignments.some(a => a.resource === r.name && !window.ztnaStore.resourceReachable(a.siteId))
                ? <ZTNAListBadge resourceName={r.name}/>
                : <ConnStatus s={r.conn}/>
            }</td>}
            {showCol("crit")    && <td><span className="badge" style={{ background: CRIT_STYLE[r.criticality].bg, color: CRIT_STYLE[r.criticality].fg, borderColor: "transparent", textTransform: "capitalize" }}>{r.criticality}</span></td>}
            {showCol("env")     && <td><span className="badge" style={{ textTransform: "capitalize" }}>{r.env}</span></td>}
            {showCol("creds")   && <td style={{ color: "var(--fg-2)" }}>{r.credCount === 0 ? <span style={{ color: "var(--fg-4)" }}>—</span> : `${r.credCount} cred${r.credCount===1?"":"s"}`}</td>}
            {showCol("active")  && <td>{r.sessions > 0 ? <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><span className="dot dot-success pulse-dot"/>{r.sessions} active</span> : <span style={{ color: "var(--fg-4)" }}>—</span>}</td>}
            {showCol("last")    && <td className="t-tiny" style={{ color: "var(--fg-3)" }}>{r.lastAccessed}</td>}
            {showCol("created") && <td className="t-tiny" style={{ color: "var(--fg-3)" }}>Apr 12, 2026</td>}
            {showCol("owner")   && <td className="t-tiny" style={{ color: "var(--fg-3)" }}>Platform team</td>}
            {showCol("tags")    && <td><span className="t-tiny" style={{ color: "var(--fg-3)" }}>prod, pci</span></td>}
            <td onClick={e => e.stopPropagation()} style={{ textAlign: "right" }}>
              <RowMenu items={[
                { label: "Test connection", icon: "check-circle", onClick: () => onTest && onTest(r) },
                { label: "Allocate", icon: "plus", onClick: () => onAllocate && onAllocate(r) },
                { label: "View allocated", icon: "people", onClick: () => onViewAllocated && onViewAllocated(r) },
                { label: "Edit", icon: "edit", onClick: () => onEdit && onEdit(r) },
                { label: "Duplicate", icon: "copy", onClick: () => onDuplicate && onDuplicate(r) },
                { divider: true },
                { label: "Delete", icon: "trash", danger: true, onClick: () => onDelete && onDelete(r) },
              ]}/>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    <div style={{ padding: "12px 24px", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", color: "var(--fg-4)", fontSize: 12 }}>
      <span>Showing {rows.length} of {allCount} resources</span>
      <div style={{ flex: 1 }}/>
      <button className="btn btn-sm btn-ghost">Previous</button>
      <button className="btn btn-sm btn-ghost">Next</button>
    </div>
  </>
);

// ---- My resources: end-user oriented, focus on connect ----
const MY_META = {
  "RES-2841": { window: "JIT 4h",         until: "Expires in 02:14:38", grant: "Manager + Security", canConnect: true,  policy: "Production Database",     credsAvail: 1 },
  "RES-2840": { window: "Lifelong",       until: "Standing access",     grant: "DevOps group",        canConnect: true,  policy: "Linux Server Admin",      credsAvail: 1 },
  "RES-2837": { window: "Working hours",  until: "Until 18:00 today",   grant: "On-call group",       canConnect: true,  policy: "Linux Server Admin",      credsAvail: 1 },
  "RES-2832": { window: "JIT 3h",         until: "Expires in 00:41:12", grant: "Self-requested",      canConnect: true,  policy: "K8s Production Cluster",  credsAvail: 1 },
  "RES-2831": { window: "Lifelong",       until: "Standing access",     grant: "Default for devs",    canConnect: true,  policy: "Dev Sandbox Access",      credsAvail: 1 },
};

const MyResourcesTable = ({ rows, onOpen }) => (
  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 12, padding: 20 }}>
    {rows.map(r => {
      const m = MY_META[r.id] || { window: "Allocated", until: "—", grant: "—", canConnect: false, policy: "—", credsAvail: 0 };
      const expiring = m.until.startsWith("Expires");
      return (
        <div key={r.id} className="card" style={{ display: "flex", flexDirection: "column", cursor: "pointer", padding: 0 }} onClick={() => onOpen(r)}>
          <div style={{ padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: 12 }}>
            <ResourceTypeIcon type={r.type} size={36}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ font: "600 13.5px/1.3 var(--font-sans)", color: "var(--fg-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</div>
              <div className="t-mono t-tiny" style={{ color: "var(--fg-4)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.host}:{r.port}</div>
              <div style={{ marginTop: 6, display: "flex", gap: 4, flexWrap: "wrap" }}>
                <span className="badge" style={{ background: CRIT_STYLE[r.criticality].bg, color: CRIT_STYLE[r.criticality].fg, borderColor: "transparent", textTransform: "capitalize" }}>{r.criticality}</span>
                <span className="badge" style={{ textTransform: "capitalize" }}>{r.env}</span>
              </div>
            </div>
          </div>
          <div style={{ padding: "10px 16px", borderTop: "1px solid var(--border-subtle)", background: "var(--bg-surface-2)", display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, font: "500 11.5px/1 var(--font-sans)", color: "var(--fg-3)" }}>
              <Icon name="clock" size={11} color="var(--fg-4)"/>
              <span>{m.window}</span>
              <span style={{ flex: 1 }}/>
              <span style={{ color: expiring ? "var(--warning-fg)" : "var(--fg-4)", fontWeight: expiring ? 600 : 500 }}>{m.until}</span>
            </div>
            <div style={{ font: "400 11px/1.3 var(--font-sans)", color: "var(--fg-4)" }}>via {m.grant} · {m.policy}</div>
          </div>
          <div style={{ padding: 10, borderTop: "1px solid var(--border-subtle)", display: "flex", gap: 6 }} onClick={e => e.stopPropagation()}>
            <button className="btn btn-sm btn-primary" style={{ flex: 1 }} disabled={!m.canConnect}><Icon name="terminal" size={11}/> Connect</button>
            <button className="btn btn-sm" onClick={() => onOpen(r)}>Details</button>
            <button className="btn btn-sm btn-ghost btn-icon"><Icon name="more-h" size={13}/></button>
          </div>
        </div>
      );
    })}
  </div>
);

const FilterDropdown = ({ label, value, options, onChange }) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  const selected = options.find(o => o[0] === value);
  const cleared = options[0] ? options[0][0] : "any";
  const isActive = value !== cleared && value !== "any" && value !== "Any" && value !== "All";
  const displayLabel = isActive ? `${label}: ${selected ? selected[1] : value}` : `${label}: ${selected ? selected[1] : "Any"}`;
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        onMouseEnter={e => e.currentTarget.style.background = "var(--bg-surface-2)"}
        onMouseLeave={e => e.currentTarget.style.background = "var(--bg-app)"}
        style={{
          height: 32, padding: "0 10px",
          background: "var(--bg-app)",
          border: `${isActive ? 1.5 : 1}px solid ${isActive ? "var(--brand)" : "var(--border)"}`,
          color: isActive ? "var(--fg-1)" : "var(--fg-3)",
          font: `${isActive ? 600 : 400} 13px/1 var(--font-sans)`,
          borderRadius: 6, cursor: "pointer",
          display: "inline-flex", alignItems: "center", gap: 6,
      }}>
        {displayLabel}
        {isActive ? (
          <span onClick={e => { e.stopPropagation(); onChange(cleared); }} style={{ display: "inline-flex", padding: 2, marginRight: -2, color: "var(--brand-fg)", cursor: "pointer" }}><Icon name="x" size={11}/></span>
        ) : (
          <Icon name="chevron-down" size={11} color="var(--fg-4)"/>
        )}
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, minWidth: 180, background: "var(--bg-app)", border: "1px solid var(--border)", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.10)", padding: 4, zIndex: 20 }}>
          {options.map(([v, l]) => (
            <button key={v} onClick={() => { onChange(v); setOpen(false); }} style={{
              display: "flex", width: "100%", padding: "8px 10px", border: "none", background: v === value ? "var(--bg-surface-2)" : "transparent",
              color: v === value ? "var(--fg-1)" : "var(--fg-2)", textAlign: "left",
              font: `${v === value ? 600 : 400} 12.5px/1 var(--font-sans)`,
              borderRadius: 4, cursor: "pointer",
            }}>{l}</button>
          ))}
        </div>
      )}
    </div>
  );
};

window.ResourcesV2List = ResourcesV2List;
window.TYPE_META = TYPE_META;
window.CRIT_STYLE = CRIT_STYLE;
window.ConnStatus = ConnStatus;
window.FilterDropdown = FilterDropdown;
