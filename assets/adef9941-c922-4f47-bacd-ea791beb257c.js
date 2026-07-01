// People — Users list (main entry) + Tab router

const PeopleV2 = ({ empty }) => {
  const [tab, setTab] = React.useState("users");
  const [q, setQ] = React.useState("");
  const [filters, setFilters] = React.useState({ role: "Any", group: "Any", source: "Any", status: "Any", mfa: "Any" });
  const [selected, setSelected] = React.useState(new Set());
  const [columnsOpen, setColumnsOpen] = React.useState(false);
  const [importOpen, setImportOpen] = React.useState(false);

  const [showAddUser, setShowAddUser] = React.useState(false);
  const [showAddGroup, setShowAddGroup] = React.useState(false);
  const [showCSV, setShowCSV] = React.useState(false);
  const [openUserId, setOpenUserId] = React.useState(null);
  const [openGroupId, setOpenGroupId] = React.useState(null);
  const [showSyncErrors, setShowSyncErrors] = React.useState(false);

  // role editing
  const [roleEditor, setRoleEditor] = React.useState(null); // null | { mode: 'create'|'edit', initial }
  const [roleView, setRoleView] = React.useState(null);

  const users = empty ? [] : (window.PEOPLE_USERS || []);
  let userRows = users;
  if (q) userRows = userRows.filter(u => [u.name, u.email, u.role, ...u.groups].some(v => String(v).toLowerCase().includes(q.toLowerCase())));
  if (filters.role !== "Any")    userRows = userRows.filter(u => u.role === filters.role);
  if (filters.group !== "Any")   userRows = userRows.filter(u => u.groups.includes(filters.group));
  if (filters.source !== "Any")  userRows = userRows.filter(u => u.source === filters.source);
  if (filters.status !== "Any")  userRows = userRows.filter(u => u.status === filters.status.toLowerCase());
  if (filters.mfa !== "Any")     userRows = userRows.filter(u => u.mfa === filters.mfa.toLowerCase());

  const ALL_COLS = [
    { id: "name",      label: "Name",       required: true },
    { id: "email",     label: "Email",      required: false },
    { id: "role",      label: "Role",       required: true },
    { id: "groups",    label: "Groups",     required: false },
    { id: "source",    label: "Source",     required: false },
    { id: "resources", label: "Resources",  required: false },
    { id: "lastLogin", label: "Last login", required: false },
    { id: "mfa",       label: "MFA",        required: false },
    { id: "status",    label: "Status",     required: true },
  ];
  const [visibleCols, setVisibleCols] = React.useState(new Set(ALL_COLS.map(c => c.id)));
  const show = (id) => visibleCols.has(id);
  const toggleCol = (id) => setVisibleCols(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const counts = {
    total: users.length,
    active: users.filter(u => u.status === "active").length,
    inactive: users.filter(u => u.status === "inactive" || u.status === "locked").length,
    pendingMFA: users.filter(u => u.mfa === "pending").length,
    syncErr: (window.SYNC_ERRORS || []).length,
  };

  const allChecked = userRows.length > 0 && userRows.every(r => selected.has(r.id));
  const toggleSel = (id) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSelected(allChecked ? new Set() : new Set(userRows.map(r => r.id)));

  // ROLE EDITOR full-page mode replaces the screen
  if (roleEditor) {
    return <RoleEditorPage
      mode={roleEditor.mode}
      initial={roleEditor.initial}
      onCancel={() => setRoleEditor(null)}
      onSave={(data) => setRoleEditor(null)}
    />;
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
      <PageHeader
        title="People"
        description="Users, groups, roles, and profile fields. Identity is the source of truth for access — a user must exist with a role before they can be allocated resources."
        actions={tab === "users" ? <>
          <div style={{ position: "relative" }}>
            <button className="btn" onClick={() => setImportOpen(o => !o)}><Icon name="upload" size={13}/> Import <Icon name="chevron-down" size={10}/></button>
            {importOpen && <>
              <div onClick={() => setImportOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 30 }}/>
              <div style={{ position: "absolute", top: "calc(100% + 4px)", right: 0, zIndex: 31, width: 220, background: "var(--bg-app)", border: "1px solid var(--border)", borderRadius: 8, boxShadow: "var(--shadow-lg)", padding: 4 }}>
                <button className="btn btn-ghost btn-sm" style={{ width: "100%", justifyContent: "flex-start" }} onClick={() => { setImportOpen(false); setShowCSV(true); }}><Icon name="upload" size={11}/> Import via CSV</button>
                <button className="btn btn-ghost btn-sm" style={{ width: "100%", justifyContent: "flex-start" }}><Icon name="refresh" size={11}/> Sync from AD now</button>
              </div>
            </>}
          </div>
          <button className="btn btn-primary" onClick={() => setShowAddUser(true)}><Icon name="plus" size={13}/> Add user</button>
        </> : tab === "groups" ? <button className="btn btn-primary" onClick={() => setShowAddGroup(true)}><Icon name="plus" size={13}/> Add group</button> : null}
      />

      {/* Tabs */}
      <TabBar
        active={tab}
        onChange={setTab}
        tabs={[
          { id: "users",  label: "Users",          weight: 1 },
          { id: "groups", label: "Groups",         weight: 2 },
          { separator: true },
          { id: "roles",  label: "Roles",          weight: 3 },
          { id: "fields", label: "Profile Fields", weight: 3 },
        ]}
      />

      {/* USERS TAB */}
      {tab === "users" && (
        <>
          <div style={{ padding: "14px 24px", borderBottom: "1px solid var(--border-subtle)", display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
            <KPICard label="Total users"      value={counts.total}/>
            <KPICard label="Active"           value={counts.active}     accent="var(--success-fg)"/>
            <KPICard label="Inactive"          value={counts.inactive}   accent="var(--fg-3)"/>
            <KPICard label="Pending MFA setup" value={counts.pendingMFA} accent="var(--warning-fg)" active={filters.mfa === "Pending"} onClick={() => setFilters({...filters, mfa: filters.mfa === "Pending" ? "Any" : "Pending"})}/>
            <KPICard label="Sync errors"      value={counts.syncErr}    accent="var(--danger-fg)"  onClick={() => setShowSyncErrors(true)}/>
          </div>

          {counts.syncErr > 0 && (
            <div style={{ margin: "12px 24px 0", padding: 12, background: "var(--warning-soft)", borderRadius: 6, display: "flex", alignItems: "center", gap: 10 }}>
              <Icon name="alert-circle" size={14} color="var(--warning-fg)"/>
              <div style={{ flex: 1, font: "400 12.5px/1.5 var(--font-sans)", color: "var(--warning-fg)" }}>
                <strong>{counts.syncErr} users failed to sync</strong> from Active Directory. Resolve errors to ensure correct access.
              </div>
              <button className="btn btn-sm" onClick={() => setShowSyncErrors(true)}>Review sync errors →</button>
            </div>
          )}

          <div style={{ padding: "10px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <div style={{ position: "relative", width: 240 }}>
              <Icon name="search" size={13} color="var(--fg-4)" style={{ position: "absolute", left: 10, top: 11 }}/>
              <input className="input" value={q} onChange={e => setQ(e.target.value)} placeholder="Search users…" style={{ paddingLeft: 30, height: 32, fontSize: 12.5 }}/>
            </div>
            <FilterDropdown label="Role"   value={filters.role}   onChange={v => setFilters({...filters, role: v})}   options={[["Any","Any"], ...[...(window.SYSTEM_ROLES || []), ...(window.CUSTOM_ROLES || [])].map(r => [r.display, r.display])]}/>
            <FilterDropdown label="Group"  value={filters.group}  onChange={v => setFilters({...filters, group: v})}  options={[["Any","Any"], ...(window.PEOPLE_GROUPS || []).map(g => [g.display, g.display])]}/>
            <FilterDropdown label="Source" value={filters.source} onChange={v => setFilters({...filters, source: v})} options={[["Any","Any"],["Manual","Manual"],["AD","AD"],["SSO","SSO"],["CSV","CSV"]]}/>
            <FilterDropdown label="Status" value={filters.status} onChange={v => setFilters({...filters, status: v})} options={[["Any","Any"],["Active","Active"],["Inactive","Inactive"],["Locked","Locked"]]}/>
            <FilterDropdown label="MFA"    value={filters.mfa}    onChange={v => setFilters({...filters, mfa: v})}    options={[["Any","Any"],["Enabled","Enabled"],["Pending","Pending"],["Disabled","Disabled"]]}/>
            <div style={{ flex: 1 }}/>
            <div style={{ position: "relative" }}>
              <button className="btn btn-sm btn-icon" onClick={() => setColumnsOpen(o => !o)}><Icon name="columns" size={12}/></button>
              {columnsOpen && <>
                <div onClick={() => setColumnsOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 30 }}/>
                <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 31, width: 240, background: "var(--bg-app)", border: "1px solid var(--border)", borderRadius: 8, boxShadow: "var(--shadow-lg)", padding: 6 }}>
                  <div style={{ padding: "6px 10px 8px", font: "600 10.5px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.6, borderBottom: "1px solid var(--border-subtle)", marginBottom: 4 }}>Shown columns</div>
                  {ALL_COLS.map(c => (
                    <label key={c.id} style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 10px", borderRadius: 5, cursor: c.required ? "not-allowed" : "pointer", opacity: c.required ? 0.55 : 1 }}>
                      <input type="checkbox" checked={visibleCols.has(c.id)} disabled={c.required} onChange={() => !c.required && toggleCol(c.id)} style={{ accentColor: "var(--brand)" }}/>
                      <span style={{ flex: 1, font: "500 12.5px/1 var(--font-sans)", color: "var(--fg-1)" }}>{c.label}</span>
                      {c.required && <span style={{ font: "500 10px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.5 }}>Required</span>}
                    </label>
                  ))}
                </div>
              </>}
            </div>
          </div>

          {selected.size > 0 && (
            <div style={{ padding: "10px 24px", background: "var(--brand-soft)", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ font: "600 12.5px/1 var(--font-sans)", color: "var(--brand-fg)" }}>{selected.size} selected</span>
              <div style={{ flex: 1 }}/>
              <button className="btn btn-sm">Assign role</button>
              <button className="btn btn-sm">Add to group</button>
              <button className="btn btn-sm">Enable</button>
              <button className="btn btn-sm">Disable</button>
              <button className="btn btn-sm">Export</button>
              <button className="btn btn-sm" style={{ color: "var(--danger-fg)" }}>Delete</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelected(new Set())}>Clear</button>
            </div>
          )}

          <div style={{ flex: 1, overflow: "auto" }}>
            {userRows.length === 0 ? (
              users.length === 0 ? (
                <EmptyState icon="people" title="No users in PAM yet" description="Add users manually, import via CSV, or sync from your Active Directory."
                  action={<><button className="btn btn-primary" onClick={() => setShowAddUser(true)}><Icon name="plus" size={11}/> Add user</button><button className="btn">Sync from AD</button></>}/>
              ) : (
                <div style={{ padding: 48, textAlign: "center", color: "var(--fg-3)" }}>
                  <Icon name="search" size={24} color="var(--fg-4)"/>
                  <div style={{ marginTop: 10, font: "500 13.5px/1.4 var(--font-sans)", color: "var(--fg-2)" }}>No users match those filters</div>
                </div>
              )
            ) : (
              <table className="table">
                <thead><tr>
                  <th style={{ width: 32 }}><input type="checkbox" checked={allChecked} onChange={toggleAll} style={{ accentColor: "var(--brand)" }}/></th>
                  {show("name")      && <th>Name</th>}
                  {show("email")     && <th>Email</th>}
                  {show("role")      && <th>Role</th>}
                  {show("groups")    && <th>Groups</th>}
                  {show("source")    && <th>Source</th>}
                  {show("resources") && <th>Resources</th>}
                  {show("lastLogin") && <th>Last login</th>}
                  {show("mfa")       && <th>MFA</th>}
                  {show("status")    && <th>Status</th>}
                  <th></th>
                </tr></thead>
                <tbody>{userRows.map(u => (
                  <tr key={u.id} onClick={() => setOpenUserId(u.id)} style={{ cursor: "pointer" }}>
                    <td onClick={e => e.stopPropagation()}><input type="checkbox" checked={selected.has(u.id)} onChange={() => toggleSel(u.id)} style={{ accentColor: "var(--brand)" }}/></td>
                    {show("name")      && <td><div style={{ display: "flex", alignItems: "center", gap: 9 }}><Avatar name={u.name} size={26}/><div><div style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--brand-fg)" }}>{u.name}</div><div className="t-tiny" style={{ color: "var(--fg-4)", marginTop: 1 }}>{u.jobTitle}</div></div></div></td>}
                    {show("email")     && <td className="t-tiny" style={{ color: "var(--fg-2)" }}>{u.email}</td>}
                    {show("role")      && <td><RoleBadge role={u.role}/></td>}
                    {show("groups")    && <td><GroupChips groups={u.groups}/></td>}
                    {show("source")    && <td><SourceBadge source={u.source}/></td>}
                    {show("resources") && <td><span title={`${u.resources} resources`} style={{ fontSize: 12.5, color: "var(--fg-2)" }}>{u.resources} resources</span></td>}
                    {show("lastLogin") && <td className="t-tiny" style={{ color: u.lastLogin === "Never" ? "var(--fg-4)" : "var(--fg-3)" }}>{u.lastLogin}</td>}
                    {show("mfa")       && <td><MFABadge state={u.mfa}/></td>}
                    {show("status")    && <td><PeopleStatusBadge status={u.status}/></td>}
                    <td onClick={e => e.stopPropagation()} style={{ textAlign: "right" }}><RowMenu items={[
                      { label: "View profile", icon: "eye", onClick: () => setOpenUserId(u.id) },
                      { label: "Edit", icon: "edit", onClick: () => setOpenUserId(u.id) },
                      { label: "Assign role", icon: "shield", onClick: () => {} },
                      { label: "Add to group", icon: "people", onClick: () => {} },
                      { label: "Reset password", icon: "key", onClick: () => {} },
                      { divider: true },
                      { label: u.status === "active" ? "Disable user" : "Re-activate", icon: "lock", onClick: () => {} },
                      { label: "Delete", icon: "trash", danger: true, onClick: () => {} },
                    ]}/></td>
                  </tr>
                ))}</tbody>
              </table>
            )}
          </div>
        </>
      )}

      {tab === "groups" && <PeopleGroupsTab onOpenGroup={setOpenGroupId} onAddGroup={() => setShowAddGroup(true)}/>}
      {tab === "roles"  && <PeopleRolesTab onView={r => setRoleView(r)} onCreate={() => setRoleEditor({ mode: "create" })} onEdit={r => setRoleEditor({ mode: "edit", initial: r })} onDuplicate={r => setRoleEditor({ mode: "create", initial: { ...r, name: "", display: "", users: 0 } })}/>}
      {tab === "fields" && <ProfileFieldsTab/>}

      {showAddUser    && <PeopleAddUserPanel onClose={() => setShowAddUser(false)}/>}
      {showAddGroup   && <GroupAddPanel onClose={() => setShowAddGroup(false)}/>}
      {showCSV        && <PeopleCSVImport onClose={() => setShowCSV(false)}/>}
      {openUserId     && <UserDetailPanel userId={openUserId} onClose={() => setOpenUserId(null)}/>}
      {openGroupId    && <GroupDetailPanel groupId={openGroupId} onClose={() => setOpenGroupId(null)}/>}
      {showSyncErrors && <SyncErrorsPanel onClose={() => setShowSyncErrors(false)}/>}
      {roleView       && <RoleDetailView role={roleView} onClose={() => setRoleView(null)} onEdit={r => { setRoleView(null); setRoleEditor({ mode: "edit", initial: r }); }} onDuplicate={r => { setRoleView(null); setRoleEditor({ mode: "create", initial: { ...r, name: "", display: "", users: 0 } }); }}/>}
    </div>
  );
};

window.PeopleV2 = PeopleV2;
