// People — Groups, Roles, Profile Fields, CSV Import

// ============= GROUPS =============
const PeopleGroupsTab = ({ onOpenGroup, onAddGroup }) => {
  const [q, setQ] = React.useState("");
  const [source, setSource] = React.useState("All");
  const [selected, setSelected] = React.useState(new Set());
  const [columnsOpen, setColumnsOpen] = React.useState(false);

  const ALL = window.PEOPLE_GROUPS || [];
  let rows = ALL;
  if (q) rows = rows.filter(g => [g.display, g.name, g.description].some(v => v.toLowerCase().includes(q.toLowerCase())));
  if (source !== "All") rows = rows.filter(g => g.source === source);

  const ad = ALL.filter(g => g.source === "AD").length;
  const manual = ALL.filter(g => g.source === "Manual").length;

  const ALL_COLS = [
    { id: "display", label: "Group name", required: true },
    { id: "name",    label: "Display name (ID)", required: false },
    { id: "desc",    label: "Description", required: false },
    { id: "source",  label: "Source", required: false },
    { id: "members", label: "Members", required: true },
    { id: "resources", label: "Resources", required: false },
    { id: "role",    label: "Role mapping", required: false },
    { id: "modified",label: "Last modified", required: false },
  ];
  const [visibleCols, setVisibleCols] = React.useState(new Set(ALL_COLS.map(c => c.id)));
  const show = (id) => visibleCols.has(id);
  const toggleCol = (id) => setVisibleCols(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const allChecked = rows.length > 0 && rows.every(r => selected.has(r.id));
  const toggleSel = (id) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSelected(allChecked ? new Set() : new Set(rows.map(r => r.id)));

  return (
    <>
      <div style={{ padding: "14px 24px", borderBottom: "1px solid var(--border-subtle)", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        <KPICard label="Total groups" value={ALL.length}/>
        <KPICard label="Synced from AD" value={ad} accent="var(--brand-fg)"/>
        <KPICard label="Manual" value={manual} accent="var(--fg-2)"/>
      </div>

      <div style={{ padding: "10px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ position: "relative", width: 260 }}>
          <Icon name="search" size={13} color="var(--fg-4)" style={{ position: "absolute", left: 10, top: 11 }}/>
          <input className="input" value={q} onChange={e => setQ(e.target.value)} placeholder="Search groups…" style={{ paddingLeft: 30, height: 32, fontSize: 12.5 }}/>
        </div>
        <FilterDropdown label="Source" value={source} onChange={setSource} options={[["All","All"],["AD","AD"],["Manual","Manual"]]}/>
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

      <div style={{ flex: 1, overflow: "auto" }}>
        {rows.length === 0 ? (
          <EmptyState icon="people" title={ALL.length === 0 ? "No groups created yet" : "No groups match those filters"}
            description={ALL.length === 0 ? "Groups let you manage access for multiple users at once. Assign a group to resources instead of individual users." : ""}
            action={ALL.length === 0 ? <button className="btn btn-primary" onClick={onAddGroup}><Icon name="plus" size={11}/> Add group</button> : null}/>
        ) : (
          <table className="table">
            <thead><tr>
              <th style={{ width: 32 }}><input type="checkbox" checked={allChecked} onChange={toggleAll} style={{ accentColor: "var(--brand)" }}/></th>
              {show("display") && <th>Group name</th>}
              {show("name")    && <th>Display name (ID)</th>}
              {show("desc")    && <th>Description</th>}
              {show("source")  && <th>Source</th>}
              {show("members") && <th>Members</th>}
              {show("resources") && <th>Resources</th>}
              {show("role")    && <th>Role mapping</th>}
              {show("modified")&& <th>Last modified</th>}
              <th></th>
            </tr></thead>
            <tbody>{rows.map(g => (
              <tr key={g.id} onClick={() => onOpenGroup(g.id)} style={{ cursor: "pointer" }}>
                <td onClick={e => e.stopPropagation()}><input type="checkbox" checked={selected.has(g.id)} onChange={() => toggleSel(g.id)} style={{ accentColor: "var(--brand)" }}/></td>
                {show("display") && <td><span style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--brand-fg)" }}>{g.display}</span></td>}
                {show("name")    && <td className="t-mono" style={{ fontSize: 12, color: "var(--fg-3)" }}>{g.name}</td>}
                {show("desc")    && <td title={g.description} style={{ fontSize: 12.5, color: "var(--fg-2)", maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.description}</td>}
                {show("source")  && <td><SourceBadge source={g.source}/></td>}
                {show("members") && <td><span style={{ font: "500 12.5px/1 var(--font-sans)", color: "var(--brand-fg)" }}>{g.members} members</span></td>}
                {show("resources") && <td><span style={{ fontSize: 12.5, color: "var(--fg-2)" }} title={`${g.resources} resources`}>{g.resources}</span></td>}
                {show("role")    && <td>{g.role ? <RoleBadge role={g.role}/> : <span style={{ color: "var(--fg-4)" }}>—</span>}</td>}
                {show("modified")&& <td className="t-tiny" style={{ color: "var(--fg-3)" }}>{g.modified}</td>}
                <td onClick={e => e.stopPropagation()} style={{ textAlign: "right" }}><button className="btn btn-ghost btn-sm btn-icon"><Icon name="more-h" size={13}/></button></td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </>
  );
};

const GroupAddPanel = ({ onClose, onCreated }) => {
  const [success, setSuccess] = React.useState(false);
  const [data, setData] = React.useState({ display: "", name: "", description: "", role: null, members: [] });

  React.useEffect(() => {
    if (data.display && !data.name) {
      setData(d => ({...d, name: d.display.toLowerCase().replace(/[^a-z0-9]+/g, "-")}));
    }
  }, [data.display]);

  if (success) return <Panel title="Group created" onClose={onClose}>
    <div style={{ padding: 28, maxWidth: 460, margin: "0 auto", textAlign: "center" }}>
      <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--success-soft)", color: "var(--success-fg)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}><Icon name="check" size={26}/></div>
      <div style={{ font: "600 16px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{data.display} created with {data.members.length} member{data.members.length === 1 ? "" : "s"}</div>
      <div style={{ marginTop: 18, display: "flex", gap: 8, justifyContent: "center" }}>
        <button className="btn btn-primary" onClick={onClose}>View group</button>
        <button className="btn" onClick={() => { setData({ display: "", name: "", description: "", role: null, members: [] }); setSuccess(false); }}>Create another</button>
      </div>
    </div>
  </Panel>;

  const allRoles = [...(window.SYSTEM_ROLES || []), ...(window.CUSTOM_ROLES || [])];
  const allUsers = window.PEOPLE_USERS || [];

  return <Panel title="Add Group" onClose={onClose}>
    <div className="scroll-area" style={{ flex: 1, overflow: "auto", padding: "20px 24px", maxWidth: 680, margin: "0 auto", width: "100%" }}>
      <Field label="Display name" required hint="The name shown throughout PAM — e.g. 'DevOps Team' or 'DB Admins'">
        <input className="input" value={data.display} onChange={e => setData({...data, display: e.target.value})} placeholder="DevOps Team"/>
      </Field>
      <Field label="Group name" required hint="Internal identifier. Use lowercase, no spaces — e.g. 'devops-team'">
        <input className="input t-mono" value={data.name} onChange={e => setData({...data, name: e.target.value})} placeholder="devops-team"/>
      </Field>
      <Field label="Description" hint="What is this group for? E.g. 'Engineers who need access to production databases'">
        <textarea className="input" rows={2} value={data.description} onChange={e => setData({...data, description: e.target.value})}/>
      </Field>

      <div style={{ borderTop: "1px solid var(--border-subtle)", margin: "14px 0" }}/>
      <Toggle value={!!data.role} onChange={v => setData({...data, role: v ? "End User" : null})} label="Map this group to a role" hint="All members of this group will inherit the capabilities of the selected role."/>
      {data.role && (
        <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
          {allRoles.map(r => {
            const active = data.role === r.display;
            return <button key={r.id} type="button" onClick={() => setData({...data, role: r.display})} style={{
              padding: 10, border: `1px solid ${active ? "var(--brand)" : "var(--border)"}`,
              background: active ? "var(--brand-soft)" : "var(--bg-surface)",
              borderRadius: 6, cursor: "pointer", textAlign: "left",
            }}>
              <div style={{ font: "600 12.5px/1.3 var(--font-sans)", color: active ? "var(--brand-fg)" : "var(--fg-1)" }}>{r.display}</div>
              <div style={{ font: "400 11px/1.4 var(--font-sans)", color: "var(--fg-3)", marginTop: 3 }}>{r.desc}</div>
            </button>;
          })}
        </div>
      )}

      <div style={{ borderTop: "1px solid var(--border-subtle)", margin: "14px 0" }}/>
      <Field label="Members">
        <div style={{ padding: 8, border: "1px solid var(--border)", borderRadius: 6, background: "var(--bg-surface)", display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center", minHeight: 36 }}>
          {data.members.map(uid => {
            const u = allUsers.find(x => x.id === uid);
            return <span key={uid} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px 2px 4px", borderRadius: 999, background: "var(--brand-soft)", color: "var(--brand-fg)", font: "500 12px/1.5 var(--font-sans)" }}>
              <Avatar name={u?.name} size={18}/>
              {u?.name}
              <button onClick={() => setData({...data, members: data.members.filter(x => x !== uid)})} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 0, color: "var(--brand-fg)", display: "inline-flex" }}><Icon name="x" size={10}/></button>
            </span>;
          })}
          <Select value="" onChange={v => { if (v && !data.members.includes(v)) setData({...data, members: [...data.members, v]}); }} options={[["", "Search by name or email…"], ...allUsers.filter(u => !data.members.includes(u.id)).map(u => [u.id, `${u.name} — ${u.email}`])]}/>
        </div>
      </Field>
    </div>
    <div style={{ borderTop: "1px solid var(--border)", padding: "12px 24px", display: "flex", gap: 8, justifyContent: "flex-end", background: "var(--bg-surface)" }}>
      <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
      <button className="btn btn-primary" disabled={!data.display.trim() || !data.name.trim()} onClick={() => { setSuccess(true); onCreated?.(data); }}>Create Group</button>
    </div>
  </Panel>;
};

const GroupDetailPanel = ({ groupId, onClose }) => {
  const g = (window.PEOPLE_GROUPS || []).find(x => x.id === groupId);
  if (!g) return null;
  const memberUsers = (window.PEOPLE_USERS || []).filter(u => u.groups.includes(g.display));
  const [search, setSearch] = React.useState("");
  const filteredMembers = search ? memberUsers.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())) : memberUsers;

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.18)", zIndex: 40 }}/>
      <aside style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 520, background: "var(--bg-app)", borderLeft: "1px solid var(--border)", zIndex: 41, display: "flex", flexDirection: "column", boxShadow: "var(--shadow-lg)" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 8, background: "var(--brand-soft)", color: "var(--brand-fg)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="people" size={18}/></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ font: "600 17px/1.3 var(--font-sans)", color: "var(--fg-1)", margin: 0 }}>{g.display}</h2>
            <div style={{ marginTop: 6, display: "flex", gap: 6 }}>
              <SourceBadge source={g.source}/>
              <span style={{ padding: "2px 8px", borderRadius: 999, background: "var(--bg-surface-2)", color: "var(--fg-2)", font: "500 11px/1.5 var(--font-sans)" }}>{g.members} members</span>
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><Icon name="x" size={14}/></button>
        </div>

        <div className="scroll-area" style={{ flex: 1, overflow: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 22 }}>
          <Section title="Group info">
            <DetailRow k="Display name">{g.display}</DetailRow>
            <DetailRow k="Group name">{g.name}</DetailRow>
            <DetailRow k="Description">{g.description}</DetailRow>
            <DetailRow k="Source">{g.source === "AD" ? `AD (synced from securecorp.local)` : "Manual"}</DetailRow>
            <DetailRow k="Role mapping">{g.role ? <RoleBadge role={g.role}/> : <span style={{ color: "var(--fg-4)" }}>None — group has no role <a href="#" style={{ color: "var(--brand-fg)", marginLeft: 6 }}>Map to role</a></span>}</DetailRow>
            <DetailRow k="Created">{g.created}</DetailRow>
            <DetailRow k="Last modified">{g.modified}</DetailRow>
          </Section>

          <Section title={`Members (${memberUsers.length})`}>
            <div style={{ position: "relative", marginBottom: 10 }}>
              <Icon name="search" size={12} color="var(--fg-4)" style={{ position: "absolute", left: 10, top: 11 }}/>
              <input className="input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search within group…" style={{ paddingLeft: 28, height: 32, fontSize: 12.5 }}/>
            </div>
            {filteredMembers.length === 0 ? (
              <div style={{ padding: 18, textAlign: "center", color: "var(--fg-3)", fontSize: 12.5, border: "1px dashed var(--border)", borderRadius: 6 }}>No members</div>
            ) : (
              <table className="table" style={{ border: "1px solid var(--border)", borderRadius: 6 }}>
                <tbody>{filteredMembers.map(u => (
                  <tr key={u.id}>
                    <td><div style={{ display: "flex", alignItems: "center", gap: 8 }}><Avatar name={u.name} size={22}/><span style={{ fontWeight: 500, fontSize: 12.5 }}>{u.name}</span></div></td>
                    <td style={{ fontSize: 12, color: "var(--fg-3)" }}>{u.email}</td>
                    <td><RoleBadge role={u.role}/></td>
                    <td><PeopleStatusBadge status={u.status}/></td>
                    <td style={{ textAlign: "right" }}><button className="btn btn-ghost btn-icon btn-sm" title="Remove from group"><Icon name="x" size={11}/></button></td>
                  </tr>
                ))}</tbody>
              </table>
            )}
            <button className="btn btn-sm" style={{ marginTop: 10 }}><Icon name="plus" size={11}/> Add member</button>
          </Section>

          <Section title={`Resource access (${g.resources} resources)`}>
            {g.resources === 0 ? (
              <div style={{ padding: 18, textAlign: "center", color: "var(--fg-3)", fontSize: 12.5, border: "1px dashed var(--border)", borderRadius: 6 }}>No resources allocated to this group. Allocate via the Resources section.</div>
            ) : (
              <table className="table" style={{ border: "1px solid var(--border)", borderRadius: 6 }}>
                <thead><tr><th>Resource</th><th>Type</th><th>Env</th><th>Window</th><th>Credential</th></tr></thead>
                <tbody>
                  {[
                    { res: "prod-db-01", type: "DB", env: "Prod", win: "Anytime", cred: "prod-db-root" },
                    { res: "ssh-server-linux", type: "Server", env: "Prod", win: "Mon–Fri 09–19", cred: "linux-ssh-admin" },
                    { res: "k8s-control-plane-aws", type: "Cloud", env: "Prod", win: "Anytime", cred: "k8s-cluster-admin" },
                  ].slice(0, Math.min(3, g.resources)).map((r, i) => (
                    <tr key={i}>
                      <td><span className="t-mono" style={{ fontSize: 12, color: "var(--brand-fg)", fontWeight: 500 }}>{r.res}</span></td>
                      <td><span className="badge">{r.type}</span></td>
                      <td><span className="badge">{r.env}</span></td>
                      <td className="t-tiny" style={{ color: "var(--fg-2)" }}>{r.win}</td>
                      <td className="t-mono" style={{ fontSize: 12, color: "var(--fg-2)" }}>{r.cred}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Section>

          <Section title="Activity">
            {[
              { ts: g.modified, txt: "Member added: Aditya Kulkarni", icon: "plus" },
              { ts: "3 days ago", txt: "Member removed: Vivek Rao by Arjun Bansal", icon: "x" },
              { ts: "1 week ago", txt: `Allocated to prod-db-01 with Anytime window`, icon: "key" },
              { ts: g.created, txt: `Role mapping set to ${g.role || "none"} by Arjun Bansal`, icon: "shield" },
            ].map((ev, i, arr) => (
              <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0", position: "relative" }}>
                {i < arr.length - 1 && <div style={{ position: "absolute", left: 9, top: 24, bottom: -8, width: 1, background: "var(--border)" }}/>}
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--bg-surface-2)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none", zIndex: 1 }}>
                  <Icon name={ev.icon} size={10} color="var(--fg-3)"/>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ font: "500 12px/1.4 var(--font-sans)", color: "var(--fg-1)" }}>{ev.txt}</div>
                  <div style={{ font: "400 11px/1 var(--font-sans)", color: "var(--fg-4)", marginTop: 2 }}>{ev.ts}</div>
                </div>
              </div>
            ))}
          </Section>
        </div>
      </aside>
    </>
  );
};

Object.assign(window, { PeopleGroupsTab, GroupAddPanel, GroupDetailPanel });
