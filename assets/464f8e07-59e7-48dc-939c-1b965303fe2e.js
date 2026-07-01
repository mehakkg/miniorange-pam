// People — Roles list, Create/Edit Role (full page), Role detail, Profile Fields, CSV Import

const CAPABILITIES = [
  { cat: "resources", label: "Resources", icon: "resources", subs: [
    { id: "view-all",   label: "View all resources",   hasEdit: true },
    { id: "view-my",    label: "View my resources only", hasEdit: false },
    { id: "add-edit",   label: "Add / edit resources", hasEdit: true },
    { id: "delete",     label: "Delete resources",     hasEdit: true },
    { id: "allocate",   label: "Allocate resources to users", hasEdit: true },
    { id: "test",       label: "Test resource connection", hasEdit: true },
  ]},
  { cat: "credentials", label: "Credentials", icon: "credentials", subs: [
    { id: "view",       label: "View credential list", hasEdit: true },
    { id: "add-edit",   label: "Add / edit credentials", hasEdit: true },
    { id: "delete",     label: "Delete credentials", hasEdit: true },
    { id: "rotate",     label: "Rotate passwords", hasEdit: true },
    { id: "details",    label: "View credential details (display name only)", hasEdit: false },
    { id: "configure",  label: "Configure rotation policies", hasEdit: true },
  ]},
  { cat: "policies", label: "Policies", icon: "policies", subs: [
    { id: "view",       label: "View policies", hasEdit: true },
    { id: "create",     label: "Create / edit policies", hasEdit: true },
    { id: "delete",     label: "Delete policies", hasEdit: true },
  ]},
  { cat: "tickets", label: "Access & Tickets", icon: "tickets", subs: [
    { id: "view",       label: "View all tickets", hasEdit: true },
    { id: "approve",    label: "Approve / reject tickets", hasEdit: true },
    { id: "create",     label: "Create tickets", hasEdit: true },
    { id: "revoke",     label: "Revoke access", hasEdit: true },
    { id: "configure",  label: "Configure ticket settings", hasEdit: true },
  ]},
  { cat: "sessions", label: "Sessions", icon: "sessions", subs: [
    { id: "view",       label: "View live sessions", hasEdit: true },
    { id: "terminate",  label: "Terminate sessions", hasEdit: true },
    { id: "recordings", label: "View session recordings", hasEdit: true },
    { id: "download",   label: "Download session recordings", hasEdit: true },
  ]},
  { cat: "people", label: "People", icon: "people", subs: [
    { id: "view",       label: "View users", hasEdit: true },
    { id: "add-edit",   label: "Add / edit users", hasEdit: true },
    { id: "delete",     label: "Delete users", hasEdit: true },
    { id: "groups",     label: "Manage groups", hasEdit: true },
    { id: "roles",      label: "Manage roles", hasEdit: true },
  ]},
  { cat: "discovery", label: "Discovery", icon: "discovery", subs: [
    { id: "view",       label: "View discovery results", hasEdit: true },
    { id: "run",        label: "Run scans", hasEdit: true },
    { id: "onboard",    label: "Onboard discovered assets", hasEdit: true },
  ]},
  { cat: "certificates", label: "Certificates", icon: "certificates", subs: [
    { id: "view",       label: "View certificates", hasEdit: true },
    { id: "manage",     label: "Create / upload / sign certificates", hasEdit: true },
    { id: "delete",     label: "Delete certificates", hasEdit: true },
  ]},
  { cat: "reports", label: "Reports & Audit", icon: "file-text", subs: [
    { id: "view",       label: "View reports", hasEdit: true },
    { id: "export",     label: "Export reports", hasEdit: true },
    { id: "schedule",   label: "Schedule reports", hasEdit: true },
  ]},
  { cat: "settings", label: "System Settings", icon: "settings", subs: [
    { id: "view",       label: "View settings", hasEdit: true },
    { id: "edit",       label: "Edit system settings", hasEdit: true },
    { id: "vault",      label: "Manage vault configuration", hasEdit: true },
    { id: "siem",       label: "Manage SIEM configuration", hasEdit: true },
    { id: "api",        label: "Manage API keys", hasEdit: true },
  ]},
  { cat: "endpoint", label: "Endpoint Security", icon: "endpoint", subs: [
    { id: "view",       label: "View endpoint dashboard", hasEdit: true },
    { id: "apps",       label: "Manage app policies", hasEdit: true },
    { id: "devices",    label: "Manage endpoint devices", hasEdit: true },
  ]},
];

const totalCaps = CAPABILITIES.reduce((sum, c) => sum + c.subs.length, 0);

// ============= ROLES LIST =============
const PeopleRolesTab = ({ onView, onCreate, onEdit, onDuplicate }) => {
  const [dismissed, setDismissed] = React.useState(false);
  const system = window.SYSTEM_ROLES || [];
  const custom = window.CUSTOM_ROLES || [];
  const RoleCard = ({ r, isSystem }) => (
    <div style={{ padding: 14, border: "1px solid var(--border)", borderRadius: 8, background: "var(--bg-surface)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
        <div>
          <div style={{ font: "600 14px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{r.display}</div>
          <div className="t-mono" style={{ font: "500 11.5px/1 var(--font-mono)", color: "var(--fg-4)", marginTop: 4 }}>{r.name}</div>
        </div>
        <span style={{ padding: "2px 8px", borderRadius: 999, background: "var(--bg-surface-2)", color: "var(--fg-2)", font: "500 11.5px/1.5 var(--font-sans)" }}>{r.users} user{r.users === 1 ? "" : "s"}</span>
      </div>
      <div style={{ font: "400 12px/1.5 var(--font-sans)", color: "var(--fg-3)", marginBottom: 12 }}>{r.desc}</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <button className="btn btn-sm" onClick={() => onView(r)}>View capabilities</button>
        {!isSystem && <button className="btn btn-sm" onClick={() => onEdit(r)}>Edit</button>}
        <button className="btn btn-sm" onClick={() => onDuplicate(r)}>Duplicate</button>
        {!isSystem && <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger-fg)" }}>Delete</button>}
      </div>
    </div>
  );
  return (
    <div style={{ flex: 1, overflow: "auto" }}>
      <div style={{ padding: "16px 24px 8px", display: "flex", alignItems: "center" }}>
        <div style={{ flex: 1 }}/>
        <button className="btn btn-primary" onClick={onCreate}><Icon name="plus" size={13}/> Create role</button>
      </div>
      {!dismissed && (
        <div style={{ margin: "0 24px 16px", padding: 14, background: "var(--brand-soft)", borderRadius: 8, display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{ width: 32, height: 32, borderRadius: 6, background: "var(--bg-app)", color: "var(--brand-fg)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Icon name="info" size={16}/></div>
          <div style={{ flex: 1, font: "400 12.5px/1.5 var(--font-sans)", color: "var(--fg-2)" }}>
            <strong style={{ color: "var(--fg-1)" }}>Roles define what a user can do in PAM.</strong> Each user has one role. Capabilities within a role control which sections of PAM they can access and what actions they can take.
          </div>
          <button className="btn btn-ghost btn-icon" onClick={() => setDismissed(true)}><Icon name="x" size={12}/></button>
        </div>
      )}

      <div style={{ padding: "0 24px 16px" }}>
        <div style={{ font: "600 11px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 4 }}>Default roles</div>
        <div style={{ font: "400 12px/1.5 var(--font-sans)", color: "var(--fg-3)", marginBottom: 12 }}>These roles are created by PAM and cannot be deleted. They can be duplicated to create custom variations.</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
          {system.map(r => <RoleCard key={r.id} r={r} isSystem/>)}
        </div>
      </div>

      <div style={{ padding: "0 24px 24px" }}>
        <div style={{ font: "600 11px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 12 }}>Custom roles</div>
        {custom.length === 0 ? (
          <div style={{ padding: 32, border: "1px dashed var(--border)", borderRadius: 8, textAlign: "center" }}>
            <div style={{ font: "500 13.5px/1.4 var(--font-sans)", color: "var(--fg-1)", marginBottom: 4 }}>No custom roles yet</div>
            <div style={{ font: "400 12.5px/1.5 var(--font-sans)", color: "var(--fg-3)", marginBottom: 14 }}>Create a role for team-specific needs like "DB Admin" or "L1 Support".</div>
            <button className="btn btn-primary btn-sm" onClick={onCreate}><Icon name="plus" size={11}/> Create role</button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
            {custom.map(r => <RoleCard key={r.id} r={r} isSystem={false}/>)}
          </div>
        )}
      </div>
    </div>
  );
};

// ============= CREATE / EDIT ROLE — FULL PAGE =============
const RoleEditorPage = ({ initial, onCancel, onSave, mode = "create" }) => {
  const [name, setName] = React.useState(initial?.name || "");
  const [display, setDisplay] = React.useState(initial?.display || "");
  const [desc, setDesc] = React.useState(initial?.desc || "");
  const [dupFrom, setDupFrom] = React.useState("");
  const [caps, setCaps] = React.useState(initial?.caps || {});
  const [collapsed, setCollapsed] = React.useState(new Set());
  const [toast, setToast] = React.useState(null);

  const allRoles = [...(window.SYSTEM_ROLES || []), ...(window.CUSTOM_ROLES || [])];

  const toggleCap = (cat, subId, dim = "view") => {
    setCaps(prev => {
      const next = { ...prev };
      next[cat] = [...(next[cat] || [])];
      const flag = dim === "view" ? subId : `${subId}-edit`;
      if (next[cat].includes(flag)) {
        next[cat] = next[cat].filter(x => x !== flag);
        // if removing view, also drop edit
        if (dim === "view") next[cat] = next[cat].filter(x => x !== `${subId}-edit`);
      } else {
        next[cat].push(flag);
        // if adding edit, auto-add view
        if (dim === "edit" && !next[cat].includes(subId)) {
          next[cat].push(subId);
          setToast(`View is required for Edit — auto-enabled.`);
          setTimeout(() => setToast(null), 2200);
        }
      }
      return next;
    });
  };

  const isViewChecked = (cat, subId) => (caps[cat] || []).includes(subId);
  const isEditChecked = (cat, subId) => (caps[cat] || []).includes(`${subId}-edit`);

  const selectAllCat = (cat, subs) => {
    const allOn = subs.every(s => isViewChecked(cat, s.id) && (!s.hasEdit || isEditChecked(cat, s.id)));
    if (allOn) {
      setCaps(prev => ({ ...prev, [cat]: [] }));
    } else {
      const all = subs.flatMap(s => s.hasEdit ? [s.id, `${s.id}-edit`] : [s.id]);
      setCaps(prev => ({ ...prev, [cat]: all }));
    }
  };

  const countForCat = (cat, subs) => subs.filter(s => isViewChecked(cat, s.id)).length;
  const totalSelected = CAPABILITIES.reduce((sum, c) => sum + countForCat(c.cat, c.subs), 0);

  const onDuplicate = (rid) => {
    const r = allRoles.find(x => x.id === rid);
    if (r) { setCaps(r.caps || {}); setToast(`Pre-filled capabilities from ${r.display}`); setTimeout(() => setToast(null), 2200); }
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, font: "400 12px/1 var(--font-sans)", color: "var(--fg-4)" }}>
            <a href="#" onClick={e => { e.preventDefault(); onCancel(); }} style={{ color: "var(--brand-fg)" }}>People</a> <Icon name="chevron-right" size={10}/>
            <a href="#" onClick={e => { e.preventDefault(); onCancel(); }} style={{ color: "var(--brand-fg)" }}>Roles</a> <Icon name="chevron-right" size={10}/>
            <span>{mode === "edit" ? `Edit role — ${initial?.display}` : "Create role"}</span>
          </div>
          <h1 style={{ font: "600 22px/1.2 var(--font-sans)", color: "var(--fg-1)", margin: "6px 0 0" }}>{mode === "edit" ? "Edit role" : "Create role"}</h1>
        </div>
        <button className="btn" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary" disabled={!name.trim() || !display.trim()} onClick={() => onSave({ name, display, desc, caps })}>Save role</button>
      </div>

      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 260px", overflow: "hidden" }}>
        <div className="scroll-area" style={{ overflow: "auto", padding: 24 }}>
          {/* STEP 1 */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ font: "600 11px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 12 }}>Step 1 · Role identity</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="Role name" required hint="Internal identifier — e.g. 'dba-readonly'. No spaces.">
                <input className="input t-mono" value={name} onChange={e => setName(e.target.value.toLowerCase().replace(/\s+/g, "-"))} placeholder="dba-readonly"/>
              </Field>
              <Field label="Display name" required hint="What users see — e.g. 'Database Read-Only Admin'. Appears on role badges.">
                <input className="input" value={display} onChange={e => setDisplay(e.target.value)} placeholder="Database Read-Only Admin"/>
              </Field>
              <Field label="Description"><textarea className="input" rows={2} value={desc} onChange={e => setDesc(e.target.value)} placeholder="Describe this role so admins know when to assign it."/></Field>
              <Field label="Duplicate from existing role" hint="Pre-fills capabilities. You can then adjust.">
                <Select value={dupFrom} onChange={v => { setDupFrom(v); if (v) onDuplicate(v); }} options={[["", "Don't duplicate"], ...allRoles.map(r => [r.id, r.display])]}/>
              </Field>
            </div>
          </div>

          {/* STEP 2 — Matrix */}
          <div>
            <div style={{ font: "600 11px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6 }}>Step 2 · Capabilities</div>
            <div style={{ font: "400 12.5px/1.5 var(--font-sans)", color: "var(--fg-3)", marginBottom: 12 }}>Select what users in this role can do. Capabilities are grouped by section.</div>

            <div className="card" style={{ overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 100px", padding: "10px 14px", background: "var(--bg-surface-2)", borderBottom: "1px solid var(--border)", font: "500 11px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.5 }}>
                <span>Capability</span>
                <span style={{ textAlign: "center" }}>Can View</span>
                <span style={{ textAlign: "center" }}>Can Edit / Act</span>
              </div>

              {CAPABILITIES.map(c => {
                const isCollapsed = collapsed.has(c.cat);
                const count = countForCat(c.cat, c.subs);
                const allOn = c.subs.every(s => isViewChecked(c.cat, s.id) && (!s.hasEdit || isEditChecked(c.cat, s.id)));
                return (
                  <div key={c.cat} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <div onClick={() => setCollapsed(s => { const n = new Set(s); n.has(c.cat) ? n.delete(c.cat) : n.add(c.cat); return n; })} style={{
                      padding: "10px 14px", display: "grid", gridTemplateColumns: "1fr 100px 100px", alignItems: "center",
                      background: "var(--bg-surface)", cursor: "pointer",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Icon name={isCollapsed ? "chevron-right" : "chevron-down"} size={11} color="var(--fg-4)"/>
                        <Icon name={c.icon} size={14} color="var(--fg-3)"/>
                        <span style={{ font: "600 13px/1 var(--font-sans)", color: "var(--fg-1)" }}>{c.label}</span>
                        {count > 0 && <span style={{ padding: "1px 7px", borderRadius: 999, background: "var(--brand-soft)", color: "var(--brand-fg)", font: "500 10.5px/1.5 var(--font-sans)" }}>{count} of {c.subs.length}</span>}
                      </div>
                      <div style={{ textAlign: "center" }} onClick={e => { e.stopPropagation(); selectAllCat(c.cat, c.subs); }}>
                        <input type="checkbox" checked={allOn} onChange={() => {}} style={{ accentColor: "var(--brand)" }} title="Select all"/>
                      </div>
                      <div style={{ textAlign: "center", color: "var(--fg-4)", font: "500 11px/1 var(--font-sans)" }}>—</div>
                    </div>
                    {!isCollapsed && c.subs.map(s => (
                      <div key={s.id} style={{ padding: "8px 14px 8px 38px", display: "grid", gridTemplateColumns: "1fr 100px 100px", alignItems: "center", background: "var(--bg-app)" }}>
                        <span style={{ font: "400 12.5px/1.4 var(--font-sans)", color: "var(--fg-2)" }}>{s.label}</span>
                        <div style={{ textAlign: "center" }}><input type="checkbox" checked={isViewChecked(c.cat, s.id)} onChange={() => toggleCap(c.cat, s.id, "view")} style={{ accentColor: "var(--brand)" }}/></div>
                        <div style={{ textAlign: "center" }}>
                          {s.hasEdit ? <input type="checkbox" checked={isEditChecked(c.cat, s.id)} onChange={() => toggleCap(c.cat, s.id, "edit")} style={{ accentColor: "var(--brand)" }}/> : <span style={{ color: "var(--fg-4)" }}>—</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sticky summary */}
        <div style={{ borderLeft: "1px solid var(--border)", background: "var(--bg-surface)", padding: 20, overflow: "auto" }}>
          <div style={{ font: "600 11px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 12 }}>Role summary</div>
          <div style={{ font: "600 16px/1.3 var(--font-sans)", color: "var(--fg-1)", marginBottom: 4 }}>{display || "Untitled role"}</div>
          <div className="t-mono" style={{ font: "500 11.5px/1 var(--font-mono)", color: "var(--fg-4)" }}>{name || "—"}</div>
          <div style={{ marginTop: 18, padding: 12, background: "var(--bg-app)", borderRadius: 6, border: "1px solid var(--border)" }}>
            <div style={{ font: "500 11px/1 var(--font-sans)", color: "var(--fg-4)" }}>Capabilities selected</div>
            <div style={{ font: "600 26px/1 var(--font-sans)", color: "var(--brand-fg)", marginTop: 6 }}>{totalSelected}<span style={{ color: "var(--fg-4)", font: "500 14px/1 var(--font-sans)" }}> / {totalCaps}</span></div>
          </div>
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 6 }}>
            {CAPABILITIES.map(c => {
              const n = countForCat(c.cat, c.subs);
              return <div key={c.cat} style={{ display: "flex", alignItems: "center", gap: 8, font: "500 12px/1 var(--font-sans)", color: n > 0 ? "var(--fg-1)" : "var(--fg-4)" }}>
                <Icon name={c.icon} size={12}/>
                <span style={{ flex: 1 }}>{c.label}</span>
                <span style={{ color: n > 0 ? "var(--brand-fg)" : "var(--fg-4)" }}>{n}</span>
              </div>;
            })}
          </div>
          {mode === "edit" && initial && (
            <div style={{ marginTop: 18, padding: 12, background: "var(--bg-app)", borderRadius: 6, border: "1px solid var(--border)" }}>
              <div style={{ font: "500 11px/1 var(--font-sans)", color: "var(--fg-4)" }}>Users with this role</div>
              <div style={{ font: "600 18px/1 var(--font-sans)", color: "var(--fg-1)", marginTop: 4 }}>{initial.users}</div>
            </div>
          )}
        </div>
      </div>

      {toast && <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", padding: "10px 16px", background: "var(--fg-1)", color: "var(--bg-app)", borderRadius: 6, font: "500 12.5px/1 var(--font-sans)", zIndex: 100 }}>{toast}</div>}
    </div>
  );
};

// ============= ROLE DETAIL — READ ONLY MATRIX =============
const RoleDetailView = ({ role, onClose, onEdit, onDuplicate }) => (
  <>
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.2)", zIndex: 40 }}/>
    <aside style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 560, background: "var(--bg-app)", borderLeft: "1px solid var(--border)", zIndex: 41, display: "flex", flexDirection: "column", boxShadow: "var(--shadow-lg)" }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ font: "600 17px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{role.display}</div>
          <div className="t-mono" style={{ font: "500 11.5px/1 var(--font-mono)", color: "var(--fg-4)", marginTop: 4 }}>{role.name}</div>
          <div style={{ marginTop: 8, font: "400 12.5px/1.5 var(--font-sans)", color: "var(--fg-3)" }}>{role.desc}</div>
          <div style={{ marginTop: 8, padding: "2px 8px", display: "inline-block", borderRadius: 999, background: "var(--bg-surface-2)", color: "var(--fg-2)", font: "500 11px/1.5 var(--font-sans)" }}>{role.users} user{role.users === 1 ? "" : "s"}</div>
        </div>
        <button className="btn btn-ghost btn-icon" onClick={onClose}><Icon name="x" size={14}/></button>
      </div>

      {role.system && (
        <div style={{ margin: "12px 20px", padding: 10, background: "var(--brand-soft)", borderRadius: 6, font: "400 12px/1.5 var(--font-sans)", color: "var(--brand-fg)" }}>
          This is a default PAM role and cannot be edited. <a href="#" onClick={e => { e.preventDefault(); onDuplicate(role); }} style={{ color: "var(--brand-fg)", fontWeight: 600 }}>Duplicate it</a> to create a custom version.
        </div>
      )}

      <div className="scroll-area" style={{ flex: 1, overflow: "auto", padding: "0 20px 20px" }}>
        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px", padding: "10px 12px", background: "var(--bg-surface-2)", borderBottom: "1px solid var(--border)", font: "500 11px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.5 }}>
            <span>Capability</span>
            <span style={{ textAlign: "center" }}>View</span>
            <span style={{ textAlign: "center" }}>Edit</span>
          </div>
          {CAPABILITIES.map(c => {
            const has = role.caps[c.cat] || [];
            const anyView = c.subs.some(s => has.includes(s.id));
            if (!anyView) return null;
            return (
              <div key={c.cat} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <div style={{ padding: "8px 12px", background: "var(--bg-surface)", display: "flex", alignItems: "center", gap: 8 }}>
                  <Icon name={c.icon} size={12} color="var(--fg-3)"/>
                  <span style={{ font: "600 12.5px/1 var(--font-sans)", color: "var(--fg-1)" }}>{c.label}</span>
                </div>
                {c.subs.filter(s => has.includes(s.id)).map(s => (
                  <div key={s.id} style={{ padding: "6px 12px 6px 32px", display: "grid", gridTemplateColumns: "1fr 80px 80px", alignItems: "center" }}>
                    <span style={{ font: "400 12px/1.4 var(--font-sans)", color: "var(--fg-2)" }}>{s.label}</span>
                    <span style={{ textAlign: "center", color: "var(--success-fg)" }}>✓</span>
                    <span style={{ textAlign: "center", color: has.includes(`${s.id}-edit`) ? "var(--success-fg)" : "var(--fg-4)" }}>{has.includes(`${s.id}-edit`) ? "✓" : "—"}</span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 8, background: "var(--bg-surface)" }}>
        <button className="btn" onClick={() => onDuplicate(role)}>Duplicate</button>
        <div style={{ flex: 1 }}/>
        {!role.system && <button className="btn btn-primary" onClick={() => onEdit(role)}>Edit role</button>}
      </div>
    </aside>
  </>
);

// ============= PROFILE FIELDS =============
const ProfileFieldsTab = () => {
  const [addOpen, setAddOpen] = React.useState(false);
  const fields = window.PROFILE_FIELDS || [];
  const [dismissed, setDismissed] = React.useState(false);
  return (
    <div style={{ flex: 1, overflow: "auto" }}>
      <div style={{ padding: "16px 24px 8px", display: "flex", alignItems: "center" }}>
        <div style={{ flex: 1 }}/>
        <button className="btn btn-primary" onClick={() => setAddOpen(true)}><Icon name="plus" size={13}/> Add field</button>
      </div>
      {!dismissed && (
        <div style={{ margin: "0 24px 16px", padding: 14, background: "var(--brand-soft)", borderRadius: 8, display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{ width: 32, height: 32, borderRadius: 6, background: "var(--bg-app)", color: "var(--brand-fg)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Icon name="info" size={16}/></div>
          <div style={{ flex: 1, font: "400 12.5px/1.5 var(--font-sans)", color: "var(--fg-2)" }}>
            <strong style={{ color: "var(--fg-1)" }}>Profile fields appear on each user's record.</strong> You can control whether they're shown during user creation and on the user's own profile page.
          </div>
          <button className="btn btn-ghost btn-icon" onClick={() => setDismissed(true)}><Icon name="x" size={12}/></button>
        </div>
      )}

      <table className="table">
        <thead><tr><th style={{ width: 32 }}><input type="checkbox" style={{ accentColor: "var(--brand)" }}/></th><th>Field name</th><th>Type</th><th>Default value</th><th>On Add User form</th><th>On User Profile</th><th>Required</th><th></th></tr></thead>
        <tbody>{fields.map(f => (
          <tr key={f.id}>
            <td><input type="checkbox" style={{ accentColor: "var(--brand)" }}/></td>
            <td><span style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{f.label}</span></td>
            <td><span className="badge">{f.type}</span></td>
            <td>{f.defaultVal === "—" ? <span style={{ color: "var(--fg-4)" }}>—</span> : <span style={{ padding: "1px 7px", borderRadius: 4, background: "var(--bg-surface-2)", font: "500 11.5px/1.6 var(--font-sans)", color: "var(--fg-2)" }}>{f.defaultVal}</span>}</td>
            <td>{f.onAdd ? <Icon name="check" size={13} color="var(--success-fg)"/> : <span style={{ color: "var(--fg-4)" }}>—</span>}</td>
            <td>{f.onProfile ? <Icon name="check" size={13} color="var(--success-fg)"/> : <span style={{ color: "var(--fg-4)" }}>—</span>}</td>
            <td>{f.required ? <Icon name="check" size={13} color="var(--success-fg)"/> : <span style={{ color: "var(--fg-4)" }}>—</span>}</td>
            <td style={{ textAlign: "right" }}><button className="btn btn-ghost btn-sm btn-icon"><Icon name="more-h" size={13}/></button></td>
          </tr>
        ))}</tbody>
      </table>

      {addOpen && <AddProfileFieldModal onClose={() => setAddOpen(false)}/>}
    </div>
  );
};

const AddProfileFieldModal = ({ onClose }) => {
  const [label, setLabel] = React.useState("");
  const [type, setType] = React.useState("Text");
  const [defaultVal, setDefaultVal] = React.useState("");
  const [onAdd, setOnAdd] = React.useState(false);
  const [onProfile, setOnProfile] = React.useState(true);
  const [required, setRequired] = React.useState(false);
  const [options, setOptions] = React.useState([""]);

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 60 }}/>
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 460, maxWidth: "92vw", background: "var(--bg-app)", border: "1px solid var(--border)", borderRadius: 10, boxShadow: "var(--shadow-lg)", zIndex: 61 }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center" }}>
          <div style={{ flex: 1, font: "600 15px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>Add Profile Field</div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><Icon name="x" size={14}/></button>
        </div>
        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label="Field label" required hint="What admins and users see"><input className="input" value={label} onChange={e => setLabel(e.target.value)} placeholder="Department"/></Field>
          <Field label="Field type" required>
            <Select value={type} onChange={setType} options={[["Text","Text"],["Dropdown","Dropdown"],["Number","Number"],["Date","Date"],["Toggle","Toggle"]]}/>
          </Field>
          {type === "Dropdown" && (
            <Field label="Options">
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {options.map((o, i) => (
                  <div key={i} style={{ display: "flex", gap: 6 }}>
                    <input className="input" value={o} onChange={e => { const next = [...options]; next[i] = e.target.value; setOptions(next); }} placeholder={`Option ${i + 1}`}/>
                    {options.length > 1 && <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setOptions(options.filter((_, j) => j !== i))}><Icon name="x" size={11}/></button>}
                  </div>
                ))}
                <button className="btn btn-ghost btn-sm" style={{ alignSelf: "flex-start", color: "var(--brand-fg)" }} onClick={() => setOptions([...options, ""])}><Icon name="plus" size={11}/> Add option</button>
              </div>
            </Field>
          )}
          <Field label="Default value">
            {type === "Toggle" ? <Toggle value={defaultVal === "On"} onChange={v => setDefaultVal(v ? "On" : "Off")} label="On"/> :
             type === "Date"   ? <input className="input" type="date" value={defaultVal} onChange={e => setDefaultVal(e.target.value)}/> :
             type === "Number" ? <input className="input" type="number" value={defaultVal} onChange={e => setDefaultVal(e.target.value)}/> :
             <input className="input" value={defaultVal} onChange={e => setDefaultVal(e.target.value)}/>}
          </Field>
          <div className="card" style={{ padding: 12, background: "var(--bg-surface-2)", display: "flex", flexDirection: "column", gap: 10 }}>
            <Toggle value={onAdd} onChange={setOnAdd} label="Visible on Add User form"/>
            <Toggle value={onProfile} onChange={setOnProfile} label="Visible on User Profile"/>
            <Toggle value={required} onChange={setRequired} label="Required"/>
          </div>
        </div>
        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 8, justifyContent: "flex-end", background: "var(--bg-surface)" }}>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={!label.trim()} onClick={onClose}>Add field</button>
        </div>
      </div>
    </>
  );
};

// ============= CSV IMPORT =============
const PeopleCSVImport = ({ onClose }) => {
  const [stage, setStage] = React.useState(1);
  const [progress, setProgress] = React.useState(0);
  const rows = [
    { row: 1, name: "Anjali Patel", email: "anjali@securecorp.com", role: "End User", groups: "Dev Team", status: "valid" },
    { row: 2, name: "Karan Singh",  email: "karan@securecorp.com",  role: "Operator", groups: "DevOps Team", status: "valid" },
    { row: 3, name: "Neha Gupta",   email: "neha@securecorp.com",   role: "dba",      groups: "DBA", status: "warning", note: "Role 'dba' not found in PAM — will default to End User" },
    { row: 7, name: "Priya Sharma", email: "priya@securecorp.com",  role: "Operator", groups: "DevOps Team", status: "warning", note: "Email already exists — will update existing user" },
    { row: 12, name: "Vikram Joshi",email: "",                       role: "Operator", groups: "—", status: "error", note: "Missing email — cannot import" },
  ];
  const valid = rows.filter(r => r.status === "valid").length;
  const warns = rows.filter(r => r.status === "warning").length;
  const errors = rows.filter(r => r.status === "error").length;

  const startImport = () => {
    setStage(4); let p = 0;
    const iv = setInterval(() => {
      p += Math.random() * 18 + 5;
      if (p >= 100) { p = 100; clearInterval(iv); setProgress(100); setTimeout(() => setStage(5), 400); }
      else setProgress(p);
    }, 240);
  };

  return <Panel title="Import users via CSV" onClose={onClose}>
    <div className="scroll-area" style={{ flex: 1, overflow: "auto", padding: "20px 24px", maxWidth: 720, margin: "0 auto", width: "100%" }}>
      <div style={{ font: "600 11px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 10 }}>Step 1 · Download template</div>
      <div className="card" style={{ padding: 14, marginBottom: 18, display: "flex", alignItems: "center", gap: 12 }}>
        <Icon name="file-text" size={18} color="var(--brand-fg)"/>
        <div style={{ flex: 1 }}>
          <div style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>Users CSV template</div>
          <div style={{ font: "400 11.5px/1.4 var(--font-sans)", color: "var(--fg-3)", marginTop: 2 }}>
            <strong>Required:</strong> Full Name · Email · Role · Groups (comma-separated)<br/>
            <strong>Optional:</strong> Phone · Department · custom profile fields by label
          </div>
        </div>
        <button className="btn btn-sm">Download template</button>
      </div>

      <div style={{ font: "600 11px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 10 }}>Step 2 · Upload file</div>
      {stage === 1 ? (
        <div style={{ border: "2px dashed var(--border)", borderRadius: 8, padding: 32, textAlign: "center", marginBottom: 18 }}>
          <Icon name="upload" size={28} color="var(--fg-4)"/>
          <div style={{ marginTop: 10, font: "500 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>Drag and drop CSV file here</div>
          <button className="btn btn-primary btn-sm" style={{ marginTop: 10 }} onClick={() => setStage(2)}>Browse files</button>
        </div>
      ) : stage >= 2 && (
        <div className="card" style={{ padding: 14, marginBottom: 18, display: "flex", alignItems: "center", gap: 12, background: "var(--success-soft)" }}>
          <Icon name="check-circle" size={16} color="var(--success-fg)"/>
          <div style={{ flex: 1, font: "500 13px/1.3 var(--font-sans)", color: "var(--success-fg)" }}>users-batch-may-2026.csv — 47 users detected</div>
          <button className="btn btn-ghost btn-sm" onClick={() => setStage(1)}>Replace</button>
        </div>
      )}

      {stage >= 2 && stage <= 3 && (
        <>
          <div style={{ font: "600 11px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 10 }}>Step 3 · Preview</div>
          <div style={{ marginBottom: 10, display: "flex", gap: 8 }}>
            <span style={{ padding: "2px 8px", borderRadius: 999, background: "var(--success-soft)", color: "var(--success-fg)", font: "500 11.5px/1.5 var(--font-sans)" }}>{valid} valid</span>
            <span style={{ padding: "2px 8px", borderRadius: 999, background: "var(--warning-soft)", color: "var(--warning-fg)", font: "500 11.5px/1.5 var(--font-sans)" }}>{warns} warnings</span>
            <span style={{ padding: "2px 8px", borderRadius: 999, background: "var(--danger-soft)", color: "var(--danger-fg)", font: "500 11.5px/1.5 var(--font-sans)" }}>{errors} error</span>
          </div>
          <div className="card" style={{ overflow: "hidden", marginBottom: 18 }}>
            <table className="table">
              <thead><tr><th>Row</th><th>Full name</th><th>Email</th><th>Role</th><th>Groups</th><th>Issue</th></tr></thead>
              <tbody>{rows.map(r => (
                <tr key={r.row} style={{ background: r.status === "warning" ? "var(--warning-soft)" : r.status === "error" ? "var(--danger-soft)" : "transparent" }}>
                  <td className="t-mono t-tiny" style={{ color: "var(--fg-3)" }}>Row {r.row}</td>
                  <td style={{ font: "500 12.5px/1 var(--font-sans)", color: "var(--fg-1)" }}>{r.name}</td>
                  <td className="t-mono t-tiny" style={{ color: "var(--fg-2)" }}>{r.email || <span style={{ color: "var(--danger-fg)" }}>missing</span>}</td>
                  <td>{r.role}</td>
                  <td style={{ fontSize: 12 }}>{r.groups}</td>
                  <td style={{ font: "400 12px/1.4 var(--font-sans)", color: r.status === "warning" ? "var(--warning-fg)" : r.status === "error" ? "var(--danger-fg)" : "var(--fg-3)" }}>{r.status === "valid" ? "✓ OK" : r.note}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </>
      )}

      {stage === 4 && (
        <div style={{ padding: 20, textAlign: "center" }}>
          <div style={{ font: "500 14px/1.4 var(--font-sans)", color: "var(--fg-1)", marginBottom: 10 }}>Importing {valid + warns} users…</div>
          <div style={{ height: 6, background: "var(--bg-surface-2)", borderRadius: 999, overflow: "hidden", marginBottom: 8 }}><div style={{ width: `${progress}%`, height: "100%", background: "var(--brand)" }}/></div>
          <div style={{ font: "400 12px/1 var(--font-sans)", color: "var(--fg-3)" }}>{Math.round((valid + warns) * progress / 100)} / {valid + warns} imported</div>
        </div>
      )}

      {stage === 5 && (
        <div style={{ padding: 20, marginBottom: 18 }}>
          <div style={{ padding: 14, background: "var(--success-soft)", borderRadius: 6, color: "var(--success-fg)", font: "500 13px/1.5 var(--font-sans)", marginBottom: 8 }}>✓ {valid} users imported successfully</div>
          <div style={{ padding: 14, background: "var(--warning-soft)", borderRadius: 6, color: "var(--warning-fg)", font: "500 13px/1.5 var(--font-sans)", marginBottom: 8 }}>⚠ {warns} imported with warnings</div>
          <div style={{ padding: 14, background: "var(--danger-soft)", borderRadius: 6, color: "var(--danger-fg)", font: "500 13px/1.5 var(--font-sans)" }}>✗ {errors} skipped due to error — Row 12 missing email</div>
        </div>
      )}
    </div>
    <div style={{ borderTop: "1px solid var(--border)", padding: "12px 24px", display: "flex", gap: 8, background: "var(--bg-surface)" }}>
      <button className="btn btn-ghost" onClick={onClose}>{stage === 5 ? "Close" : "Cancel"}</button>
      <div style={{ flex: 1 }}/>
      {stage === 2 && <button className="btn btn-primary" onClick={() => setStage(3)}>Continue</button>}
      {stage === 3 && <button className="btn btn-primary" disabled={errors > 0} onClick={startImport}>Import {valid + warns} valid users</button>}
      {stage === 5 && <button className="btn btn-primary" onClick={onClose}>Done</button>}
    </div>
  </Panel>;
};

Object.assign(window, { PeopleRolesTab, RoleEditorPage, RoleDetailView, ProfileFieldsTab, PeopleCSVImport, CAPABILITIES });
