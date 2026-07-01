// Policies V2 — Detail panel + Bulk Apply + Version History panels

const PolicyDetailPanel = ({ policyId, onClose, onVersionHistory, onBulkApply, onEdit }) => {
  const p = (window.POLICIES_V2 || []).find(x => x.id === policyId);
  if (!p) return null;
  // Always read-only; editing happens on a dedicated full page.

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.18)", zIndex: 40 }}/>
      <aside style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 520, background: "var(--bg-app)", borderLeft: "1px solid var(--border)", zIndex: 41, display: "flex", flexDirection: "column", boxShadow: "var(--shadow-lg)" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ font: "600 17px/1.3 var(--font-sans)", color: "var(--fg-1)", margin: 0 }}>{p.name}</h2>
            <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
              <POL_TYPE_BADGE type={p.type}/>
              <POL_STATUS_BADGE status={p.status}/>
              <span style={{ padding: "2px 8px", borderRadius: 999, background: "var(--bg-surface-2)", color: "var(--fg-2)", font: "500 11px/1.5 var(--font-sans)" }}>{p.resources.length} resource{p.resources.length === 1 ? "" : "s"}</span>
              {p.activeSessions > 0 && <span style={{ padding: "2px 8px", borderRadius: 999, background: "var(--success-soft)", color: "var(--success-fg)", font: "500 11px/1.5 var(--font-sans)" }}>● {p.activeSessions} active sessions</span>}
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><Icon name="x" size={14}/></button>
        </div>

        <div className="scroll-area" style={{ flex: 1, overflow: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 22 }}>

          <PolSection title="Identity">
            <PolRow k="Description">{editing ? <textarea className="input" rows={2} value={draft.description} onChange={e => setDraft({...draft, description: e.target.value})}/> : p.description}</PolRow>
            <PolRow k="Type"><span style={{ color: "var(--fg-3)" }}><Icon name="lock" size={10}/> {POL_TYPES[p.type]?.label}</span></PolRow>
            <PolRow k="Status">{editing ? <Select value={draft.status} onChange={v => setDraft({...draft, status: v})} options={[["Active","Active"],["Draft","Draft"],["Archived","Archived"]]}/> : <POL_STATUS_BADGE status={p.status}/>}</PolRow>
            <PolRow k="Created">{p.createdOn} by {p.createdBy}</PolRow>
            <PolRow k="Last modified">{p.modifiedOn} by {p.modifiedBy}</PolRow>
          </PolSection>

          <PolSection title="Settings">
            <PolicySettings type={p.type} settings={editing ? draft.settings : p.settings} setSettings={(s) => setDraft({...draft, settings: s})} editing={editing}/>
          </PolSection>

          {(p.type === "SSH" || p.type === "RDP") && (
            <PolSection title="Command Restrictions">
              <CommandRestrictionsList commands={editing ? draft.commands : p.commands} setCommands={(c) => setDraft({...draft, commands: c})} editing={editing}/>
            </PolSection>
          )}

          {p.type === "SSH" && p.settings.fileTransfer && (
            <PolSection title="File transfer rules">
              <FileTransferRulesReadOnly rules={(editing ? draft.ftRules : p.ftRules) || [
                { id: "fr-1", name: "Allow engineering team", effect: "Allow", paths: [{ path: "/var/data/reports/" }], opsFiles: ["Download","Upload","Open"], opsFolders: ["List contents","Create"] },
                { id: "fr-2", name: "Block restricted subdirectories", effect: "Deny", paths: [{ path: "/var/data/reports/archive/" }, { path: "/var/data/reports/temp/" }], opsFiles: ["Download","Upload","Delete","Rename","Open"], opsFolders: ["List contents","Create","Delete","Rename"] },
              ]} defaultAccess={p.ftDefault || "deny"}/>
            </PolSection>
          )}

          <PolSection title={`Bound Resources (${p.resources.length})`}>
            {p.resources.length === 0 ? (
              <div style={{ padding: 14, border: "1px dashed var(--border)", borderRadius: 6, font: "400 12.5px/1.5 var(--font-sans)", color: "var(--fg-3)", textAlign: "center" }}>
                Not applied to any resource yet.
                <div style={{ marginTop: 10 }}><button className="btn btn-sm btn-primary" onClick={() => onBulkApply(p)}><Icon name="plus" size={11}/> Apply to resources</button></div>
              </div>
            ) : (
              <>
                <table className="table" style={{ border: "1px solid var(--border)", borderRadius: 6 }}>
                  <thead><tr><th>Resource</th><th>Type</th><th>Status</th><th>Last session</th></tr></thead>
                  <tbody>{p.resources.slice(0, 5).map((rn, i) => (
                    <tr key={rn}>
                      <td className="t-mono" style={{ fontSize: 12, color: "var(--brand-fg)", fontWeight: 500 }}>{rn}</td>
                      <td><span className="badge">{p.type === "Password" ? "Credential" : p.type === "Database" ? "Database" : p.type === "Web" ? "Web" : "Server"}</span></td>
                      <td><span style={{ display: "inline-flex", alignItems: "center", gap: 5, font: "500 12px/1 var(--font-sans)", color: "var(--success-fg)" }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--success-fg)" }}/>Active</span></td>
                      <td className="t-tiny" style={{ color: "var(--fg-3)" }}>{i === 0 ? "12 min ago" : i === 1 ? "2 hours ago" : "Yesterday"}</td>
                    </tr>
                  ))}</tbody>
                </table>
                {p.resources.length > 5 && <div style={{ marginTop: 8, font: "500 12px/1 var(--font-sans)", color: "var(--fg-4)" }}>+ {p.resources.length - 5} more</div>}
                <button className="btn btn-sm" style={{ marginTop: 10 }} onClick={() => onBulkApply(p)}><Icon name="plus" size={11}/> Apply to more resources</button>
              </>
            )}
          </PolSection>

          <PolSection title="Activity & Version History">
            <div style={{ display: "flex", flexDirection: "column" }}>
              {p.versions.slice(0, 5).map((v, i, arr) => (
                <div key={v.v} style={{ display: "flex", gap: 10, padding: "8px 0", position: "relative" }}>
                  {i < arr.length - 1 && <div style={{ position: "absolute", left: 9, top: 24, bottom: -8, width: 1, background: "var(--border)" }}/>}
                  <div style={{ width: 20, height: 20, borderRadius: "50%", background: v.current ? "var(--brand-soft)" : "var(--bg-surface-2)", color: v.current ? "var(--brand-fg)" : "var(--fg-3)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none", zIndex: 1, font: "600 9px/1 var(--font-sans)" }}>v{v.v}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ font: "500 12px/1.4 var(--font-sans)", color: "var(--fg-1)" }}>{v.note} {v.current && <span style={{ color: "var(--brand-fg)", fontWeight: 600 }}>· Current</span>}</div>
                    <div style={{ font: "400 11px/1 var(--font-sans)", color: "var(--fg-4)", marginTop: 2 }}>{v.ts} · by {v.by}</div>
                  </div>
                </div>
              ))}
            </div>
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 10, padding: 0, color: "var(--brand-fg)" }} onClick={() => onVersionHistory(p)}>View full version history →</button>
          </PolSection>

        </div>

        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 8, background: "var(--bg-surface)" }}>
          {!editing ? <>
            <button className="btn" onClick={() => setEditing(true)}><Icon name="edit" size={11}/> Edit</button>
            <button className="btn"><Icon name="copy" size={11}/> Duplicate</button>
            <button className="btn" onClick={() => onBulkApply(p)}>Apply to resources</button>
            <div style={{ flex: 1 }}/>
            <button className="btn btn-ghost" style={{ color: "var(--danger-fg)" }} disabled={p.resources.length > 0} title={p.resources.length > 0 ? "Unbind resources first" : ""}>Archive</button>
          </> : <>
            <button className="btn btn-ghost" onClick={() => { setDraft(p); setEditing(false); }}>Cancel</button>
            <div style={{ flex: 1 }}/>
            <button className="btn btn-primary" onClick={() => setEditing(false)}>Save changes</button>
          </>}
        </div>
      </aside>
    </>
  );
};

const PolSection = ({ title, children }) => (
  <div>
    <div style={{ font: "600 10.5px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 12 }}>{title}</div>
    {children}
  </div>
);

const PolRow = ({ k, children }) => (
  <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 12, padding: "5px 0", alignItems: "center" }}>
    <span style={{ font: "400 12px/1.5 var(--font-sans)", color: "var(--fg-4)" }}>{k}</span>
    <span style={{ font: "400 12.5px/1.5 var(--font-sans)", color: "var(--fg-1)" }}>{children}</span>
  </div>
);

const PolicySettings = ({ type, settings, setSettings, editing }) => {
  const set = (k, v) => editing && setSettings({...settings, [k]: v});

  if (type === "SSH" || type === "RDP") return <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
    <SetRow label="Session recording">{editing ? <Segmented value={settings.recording} onChange={v => set("recording", v)} options={[{value:"on",label:"Enabled"},{value:"off",label:"Disabled"},{value:"inherits",label:"Inherits global"}]}/> : <span style={{ color: settings.recording === "on" ? "var(--success-fg)" : "var(--fg-4)" }}>{settings.recording === "on" ? "✓ Enabled" : settings.recording === "off" ? "✗ Disabled" : "Inherits global"}</span>}</SetRow>
    <SetRow label="MFA required">{editing ? <Toggle value={settings.mfa} onChange={v => set("mfa", v)} label={settings.mfa ? "Yes" : "No"}/> : (settings.mfa ? "✓ Yes" : "✗ No")}</SetRow>
    <SetRow label="Session timeout">{editing ? <input className="input" type="number" value={settings.sessionTimeout} onChange={e => set("sessionTimeout", +e.target.value)} style={{ width: 90 }}/> : `${settings.sessionTimeout} min`}</SetRow>
    <SetRow label="Idle timeout">{editing ? <input className="input" type="number" value={settings.idleTimeout} onChange={e => set("idleTimeout", +e.target.value)} style={{ width: 90 }}/> : `${settings.idleTimeout} min`}</SetRow>
    <SetRow label="Clipboard transfer">{editing ? <Toggle value={settings.clipboard} onChange={v => set("clipboard", v)}/> : (settings.clipboard ? "✓ Allowed" : "✗ Blocked")}</SetRow>
    <SetRow label="File transfer">{editing ? <Toggle value={settings.fileTransfer} onChange={v => set("fileTransfer", v)}/> : (settings.fileTransfer ? "✓ Allowed" : "✗ Blocked")}</SetRow>
    <SetRow label="Concurrent sessions / user">{editing ? <input className="input" type="number" value={settings.concurrent} onChange={e => set("concurrent", +e.target.value)} style={{ width: 80 }}/> : settings.concurrent}</SetRow>
    <SetRow label="Source IPs">{settings.sources && settings.sources.length > 0 ? <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>{settings.sources.map(s => <span key={s} className="t-mono" style={{ padding: "1px 7px", borderRadius: 4, background: "var(--bg-surface-2)", font: "500 11px/1.6 var(--font-mono)" }}>{s}</span>)}</div> : <span style={{ color: "var(--fg-4)" }}>Any</span>}</SetRow>
    <SetRow label="Time window">{editing ? <Segmented value={settings.timeWindow} onChange={v => set("timeWindow", v)} options={[{value:"always",label:"Always"},{value:"business",label:"Business hours"},{value:"custom",label:"Custom"}]}/> : (settings.timeWindow === "always" ? "Always" : settings.timeWindow === "business" ? "Business hours (Mon–Fri 09–18)" : "Custom schedule")}</SetRow>
    {type === "RDP" && <>
      <SetRow label="Recording quality">{editing ? <Select value={settings.recordingQuality || "Medium"} onChange={v => set("recordingQuality", v)} options={[["Low","Low"],["Medium","Medium"],["High","High"]]}/> : (settings.recordingQuality || "Medium")}</SetRow>
      <SetRow label="Audio recording">{settings.audio ? "✓ Enabled" : "✗ Disabled"}</SetRow>
      <SetRow label="Printer access">{settings.printer ? "✓ Allowed" : "✗ Blocked"}</SetRow>
      <SetRow label="USB access">{settings.usb ? "✓ Allowed" : "✗ Blocked"}</SetRow>
    </>}
  </div>;

  if (type === "Web") return <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
    <SetRow label="Session recording">{settings.recording === "on" ? "✓ Enabled" : "✗ Disabled"}</SetRow>
    <SetRow label="MFA required">{settings.mfa ? "✓ Yes" : "✗ No"}</SetRow>
    <SetRow label="URL allow-list">{settings.urlAllow.length > 0 ? settings.urlAllow.join(", ") : <span style={{ color: "var(--fg-4)" }}>Any</span>}</SetRow>
    <SetRow label="URL block-list">{settings.urlBlock.length > 0 ? settings.urlBlock.join(", ") : <span style={{ color: "var(--fg-4)" }}>None</span>}</SetRow>
    <SetRow label="Form auto-fill">{settings.formAutofill ? "✓ Allowed" : "✗ Blocked"}</SetRow>
    <SetRow label="Downloads">{settings.downloads ? "✓ Allowed" : "✗ Blocked"}</SetRow>
    <SetRow label="Uploads">{settings.uploads ? "✓ Allowed" : "✗ Blocked"}</SetRow>
  </div>;

  if (type === "Database") return <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
    <SetRow label="Query log">{settings.recording === "on" ? "✓ Enabled" : "✗ Disabled"}</SetRow>
    <SetRow label="MFA required">{settings.mfa ? "✓ Yes" : "✗ No"}</SetRow>
    <SetRow label="Approval required for">
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        {Object.entries(settings.queryApproval || {}).filter(([k, v]) => v).map(([k]) => <span key={k} className="badge badge-warning">{k}</span>)}
        {Object.values(settings.queryApproval || {}).every(v => !v) && <span style={{ color: "var(--fg-4)" }}>None</span>}
      </div>
    </SetRow>
    <SetRow label="Row limit">{settings.rowLimit.toLocaleString()}</SetRow>
    <SetRow label="Data export">{settings.dataExport ? "✓ Allowed" : "✗ Blocked"}</SetRow>
    <SetRow label="Allowed schemas">{settings.schemas && settings.schemas.length > 0 ? settings.schemas.join(", ") : "Any"}</SetRow>
  </div>;

  if (type === "Password") return <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
    <SetRow label="Rotation interval">Every {settings.interval} {settings.intervalUnit}</SetRow>
    <SetRow label="Time window">{settings.windowFrom} – {settings.windowTo}</SetRow>
    <SetRow label="Days allowed">{settings.weekdays.join(", ")}</SetRow>
    <SetRow label="Skip if active session">{settings.skipActive ? "✓ Yes" : "✗ No"}</SetRow>
    <SetRow label="Validate after rotation">{settings.validate ? "✓ Yes" : "✗ No"}</SetRow>
    <SetRow label="Retry attempts">{settings.retries}</SetRow>
    <SetRow label="Notify on failure">{settings.notifyOnFail ? "✓ Yes" : "✗ No"}</SetRow>
  </div>;

  return null;
};

const SetRow = ({ label, children }) => (
  <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 12, alignItems: "center", padding: "4px 0", font: "400 12.5px/1.5 var(--font-sans)" }}>
    <span style={{ color: "var(--fg-4)" }}>{label}</span>
    <span style={{ color: "var(--fg-1)" }}>{children}</span>
  </div>
);

const CommandRestrictionsList = ({ commands, setCommands, editing }) => {
  const [adding, setAdding] = React.useState(false);
  const [draft, setDraft] = React.useState("");
  const [bulkOpen, setBulkOpen] = React.useState(false);
  const [bulkText, setBulkText] = React.useState("");

  const add = () => { if (draft.trim()) { setCommands([...commands, draft.trim()]); setDraft(""); setAdding(false); } };
  const remove = (i) => setCommands(commands.filter((_, j) => j !== i));
  const move = (i, dir) => {
    const next = [...commands];
    const t = i + dir;
    if (t < 0 || t >= next.length) return;
    [next[i], next[t]] = [next[t], next[i]];
    setCommands(next);
  };

  if (commands.length === 0 && !adding && !bulkOpen) return (
    <div>
      <div style={{ padding: 14, border: "1px dashed var(--border)", borderRadius: 6, font: "400 12.5px/1.5 var(--font-sans)", color: "var(--fg-3)", textAlign: "center" }}>
        No blocked commands.
      </div>
      {editing && <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
        <button className="btn btn-sm" onClick={() => setAdding(true)}><Icon name="plus" size={11}/> Add command</button>
        <button className="btn btn-sm btn-ghost" onClick={() => setBulkOpen(true)} style={{ color: "var(--brand-fg)" }}>Import from file</button>
      </div>}
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, border: "1px solid var(--border)", borderRadius: 6, padding: 4 }}>
        {commands.map((c, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 4, background: "var(--bg-surface)" }}>
            <span style={{ font: "500 10.5px/1 var(--font-mono)", color: "var(--fg-4)", width: 18 }}>{i + 1}.</span>
            {editing && <span style={{ display: "inline-flex", flexDirection: "column", gap: 1 }}>
              <button className="btn btn-ghost btn-icon btn-sm" style={{ width: 16, height: 14, padding: 0 }} onClick={() => move(i, -1)}><Icon name="chevron-up" size={9}/></button>
              <button className="btn btn-ghost btn-icon btn-sm" style={{ width: 16, height: 14, padding: 0 }} onClick={() => move(i, 1)}><Icon name="chevron-down" size={9}/></button>
            </span>}
            <span className="t-mono" style={{ flex: 1, font: "500 12px/1.4 var(--font-mono)", color: "var(--fg-1)" }}>{c}</span>
            {editing && <button className="btn btn-ghost btn-icon btn-sm" onClick={() => remove(i)} style={{ color: "var(--danger-fg)" }}><Icon name="x" size={10}/></button>}
          </div>
        ))}
      </div>
      {editing && !adding && (
        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
          <button className="btn btn-sm" onClick={() => setAdding(true)}><Icon name="plus" size={11}/> Add command</button>
          <button className="btn btn-sm btn-ghost" onClick={() => setBulkOpen(true)} style={{ color: "var(--brand-fg)" }}>Import from file</button>
        </div>
      )}
      {editing && adding && (
        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
          <input className="input t-mono" autoFocus value={draft} onChange={e => setDraft(e.target.value)} placeholder="rm -rf /" onKeyDown={e => e.key === "Enter" && add()}/>
          <button className="btn btn-sm btn-primary" onClick={add}>Add</button>
          <button className="btn btn-sm btn-ghost" onClick={() => { setAdding(false); setDraft(""); }}>Cancel</button>
        </div>
      )}
      {editing && bulkOpen && (
        <div style={{ marginTop: 10, padding: 12, border: "1px solid var(--border)", borderRadius: 6, background: "var(--bg-surface)" }}>
          <div style={{ font: "500 12px/1.4 var(--font-sans)", color: "var(--fg-2)", marginBottom: 6 }}>One command per line</div>
          <textarea className="input t-mono" rows={4} value={bulkText} onChange={e => setBulkText(e.target.value)} placeholder="rm -rf /\nshutdown\ndd if=/dev/zero" style={{ font: "12px/1.4 var(--font-mono)" }}/>
          <div style={{ display: "flex", gap: 6, marginTop: 6, justifyContent: "flex-end" }}>
            <button className="btn btn-sm btn-ghost" onClick={() => { setBulkOpen(false); setBulkText(""); }}>Cancel</button>
            <button className="btn btn-sm btn-primary" onClick={() => { setCommands([...commands, ...bulkText.split("\n").map(s => s.trim()).filter(Boolean)]); setBulkText(""); setBulkOpen(false); }}>Add all</button>
          </div>
        </div>
      )}
    </div>
  );
};

// ===== BULK APPLY PANEL =====
const PolicyBulkApplyPanel = ({ policy, onClose }) => {
  const [type, setType] = React.useState("Any");
  const [env, setEnv] = React.useState("Any");
  const [q, setQ] = React.useState("");
  const [selected, setSelected] = React.useState(new Set(policy.resources));
  const [phase, setPhase] = React.useState("idle");
  const [progress, setProgress] = React.useState(0);

  const all = (window.SEED_RESOURCES || []);
  let rows = all;
  if (type !== "Any") rows = rows.filter(r => r.type === type.toLowerCase());
  if (env !== "Any") rows = rows.filter(r => r.env === env.toLowerCase());
  if (q) rows = rows.filter(r => r.name.toLowerCase().includes(q.toLowerCase()));

  const toggle = (n) => setSelected(s => { const x = new Set(s); x.has(n) ? x.delete(n) : x.add(n); return x; });

  const apply = () => {
    setPhase("running"); setProgress(0);
    const iv = setInterval(() => setProgress(p => { const n = p + 12 + Math.random() * 10; if (n >= 100) { clearInterval(iv); setPhase("done"); return 100; } return n; }), 220);
  };

  return <Panel title={`Apply ${policy.name} to resources`} onClose={onClose}>
    {phase === "idle" && (
      <>
        <div className="scroll-area" style={{ flex: 1, overflow: "auto", padding: "16px 24px" }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <div style={{ position: "relative", flex: 1 }}>
              <Icon name="search" size={13} color="var(--fg-4)" style={{ position: "absolute", left: 10, top: 11 }}/>
              <input className="input" value={q} onChange={e => setQ(e.target.value)} placeholder="Search resources…" style={{ paddingLeft: 30, height: 32 }}/>
            </div>
            <FilterDropdown label="Type" value={type} onChange={setType} options={[["Any","Any"],["linux","Linux"],["windows","Windows"],["database","Database"],["web","Web"]]}/>
            <FilterDropdown label="Env" value={env} onChange={setEnv} options={[["Any","Any"],["production","Production"],["staging","Staging"],["development","Dev"]]}/>
          </div>
          <table className="table">
            <thead><tr><th></th><th>Resource</th><th>Type</th><th>Currently bound to</th></tr></thead>
            <tbody>{rows.map(r => {
              const alreadyOnThis = policy.resources.includes(r.name);
              const otherPolicy = !alreadyOnThis && r.id === "RES-2841" ? "Production Database — Strict" : null;
              return (
                <tr key={r.id} onClick={() => !alreadyOnThis && toggle(r.name)} style={{ cursor: alreadyOnThis ? "default" : "pointer", opacity: alreadyOnThis ? 0.6 : 1 }}>
                  <td><input type="checkbox" checked={selected.has(r.name) || alreadyOnThis} disabled={alreadyOnThis} onChange={() => toggle(r.name)} style={{ accentColor: "var(--brand)" }}/></td>
                  <td><span className="t-mono" style={{ fontSize: 12, color: "var(--fg-1)", fontWeight: 500 }}>{r.name}</span></td>
                  <td><span className="badge" style={{ textTransform: "capitalize" }}>{r.type}</span></td>
                  <td className="t-tiny" style={{ color: "var(--fg-3)" }}>
                    {alreadyOnThis ? <span style={{ color: "var(--success-fg)" }}>✓ Already uses this policy</span> :
                     otherPolicy ? <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "var(--warning-fg)" }} title="Switching will end active sessions"><Icon name="alert-circle" size={11}/> {otherPolicy}</span> :
                     <span style={{ color: "var(--fg-4)" }}>No policy</span>}
                  </td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
        <div style={{ padding: "12px 24px", borderTop: "1px solid var(--border)", display: "flex", gap: 8, justifyContent: "flex-end", background: "var(--bg-surface)" }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={apply}>Apply to {selected.size - policy.resources.filter(r => selected.has(r)).length} resource{selected.size === 1 ? "" : "s"}</button>
        </div>
      </>
    )}
    {phase === "running" && (
      <div style={{ padding: 32, textAlign: "center" }}>
        <div style={{ font: "500 14px/1.4 var(--font-sans)", color: "var(--fg-1)", marginBottom: 14 }}>Applying policy…</div>
        <div style={{ height: 6, background: "var(--bg-surface-2)", borderRadius: 999, overflow: "hidden" }}><div style={{ width: `${progress}%`, height: "100%", background: "var(--brand)" }}/></div>
      </div>
    )}
    {phase === "done" && (
      <>
        <div style={{ padding: 32, textAlign: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--success-soft)", color: "var(--success-fg)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}><Icon name="check" size={26}/></div>
          <div style={{ font: "600 16px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>Policy applied</div>
          <div style={{ marginTop: 8, font: "400 13px/1.5 var(--font-sans)", color: "var(--fg-3)" }}>Applied to {selected.size} resources · 2 sessions on prior policies ended.</div>
        </div>
        <div style={{ padding: "12px 24px", borderTop: "1px solid var(--border)", textAlign: "right", background: "var(--bg-surface)" }}>
          <button className="btn btn-primary" onClick={onClose}>Done</button>
        </div>
      </>
    )}
  </Panel>;
};

// ===== VERSION HISTORY PANEL =====
const PolicyVersionHistoryPanel = ({ policy, onClose }) => {
  const [openV, setOpenV] = React.useState(null);
  const [showAll, setShowAll] = React.useState(false);

  return <Panel title={`Version history — ${policy.name}`} onClose={onClose}>
    <div className="scroll-area" style={{ flex: 1, overflow: "auto", padding: 20 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {policy.versions.map(v => (
          <div key={v.v} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
            <div onClick={() => setOpenV(openV === v.v ? null : v.v)} style={{ padding: "12px 0", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
              <div style={{ width: 30, height: 30, borderRadius: 6, background: v.current ? "var(--brand-soft)" : "var(--bg-surface-2)", color: v.current ? "var(--brand-fg)" : "var(--fg-3)", display: "flex", alignItems: "center", justifyContent: "center", font: "600 11px/1 var(--font-sans)", flex: "none" }}>v{v.v}</div>
              <div style={{ flex: 1 }}>
                <div style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{v.note} {v.current && <span style={{ color: "var(--brand-fg)", fontSize: 11, marginLeft: 4 }}>Current</span>}</div>
                <div style={{ font: "400 11.5px/1 var(--font-sans)", color: "var(--fg-4)", marginTop: 2 }}>{v.ts} · by {v.by}</div>
              </div>
              <Icon name={openV === v.v ? "chevron-down" : "chevron-right"} size={11} color="var(--fg-4)"/>
            </div>
            {openV === v.v && (
              <div style={{ padding: "0 0 14px 42px" }}>
                <div style={{ padding: 12, background: "var(--bg-surface-2)", borderRadius: 6, marginBottom: 10 }}>
                  <div style={{ font: "600 11px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>Changes</div>
                  {v.v === 5 ? <DiffRow field="Idle timeout" old="15 min" new="10 min"/> :
                   v.v === 4 ? <DiffRow field="Blocked commands" old="rm -rf / · shutdown -h now · dd if=/dev/zero · mkfs.*" new="rm -rf / · shutdown -h now · dd if=/dev/zero · mkfs.* · userdel root"/> :
                   v.v === 3 ? <DiffRow field="Source IPs" old="Any" new="10.0.0.0/8 · 192.168.0.0/16"/> :
                   v.v === 2 ? <DiffRow field="Session recording" old="Disabled" new="Enabled"/> :
                   <div style={{ font: "400 12.5px/1.5 var(--font-sans)", color: "var(--fg-3)" }}>Created from template</div>}
                  <button className="btn btn-ghost btn-sm" style={{ padding: 0, color: "var(--brand-fg)", marginTop: 6 }} onClick={() => setShowAll(s => !s)}>{showAll ? "Hide" : "Show"} all fields</button>
                </div>
                {!v.current && <div style={{ display: "flex", gap: 6 }}>
                  <button className="btn btn-sm">Restore this version</button>
                  <button className="btn btn-sm btn-ghost">Export as JSON</button>
                </div>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  </Panel>;
};

const DiffRow = ({ field, old: oldVal, new: newVal }) => (
  <div style={{ font: "400 12px/1.5 var(--font-sans)", marginBottom: 4 }}>
    <span style={{ color: "var(--fg-4)" }}>{field}: </span>
    <span style={{ color: "var(--danger-fg)", textDecoration: "line-through" }}>{oldVal}</span>
    <span style={{ color: "var(--fg-4)" }}> → </span>
    <span style={{ color: "var(--success-fg)" }}>{newVal}</span>
  </div>
);

Object.assign(window, { PolicyDetailPanel, PolicyBulkApplyPanel, PolicyVersionHistoryPanel, PolicySettings, CommandRestrictionsList });

const FileTransferRulesReadOnly = ({ rules, defaultAccess }) => (
  <div>
    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", background: "var(--bg-surface-2)", borderRadius: 4, marginBottom: 10, font: "400 12px/1.4 var(--font-sans)", color: "var(--fg-3)" }}>
      <Icon name="info" size={11}/>Default access: <span style={{ color: "var(--fg-1)", fontWeight: 500 }}>{defaultAccess === "deny" ? "Deny all unless allowed by rule" : "Allow all unless denied by rule"}</span>
    </div>
    {rules.map((r, i) => (
      <div key={r.id} style={{ padding: "10px 12px", border: "1px solid var(--border)", borderLeft: `3px solid ${r.effect === "Allow" ? "var(--success-fg)" : "var(--danger-fg)"}`, borderRadius: 6, marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <span style={{ font: "600 11px/1 var(--font-sans)", color: "var(--fg-4)" }}>#{i + 1}</span>
          <span style={{ padding: "2px 8px", borderRadius: 4, background: r.effect === "Allow" ? "var(--success-soft)" : "var(--danger-soft)", color: r.effect === "Allow" ? "var(--success-fg)" : "var(--danger-fg)", font: "600 11px/1.5 var(--font-sans)" }}>{r.effect}</span>
          <span style={{ font: "600 12.5px/1 var(--font-sans)", color: "var(--fg-1)" }}>{r.name}</span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>
          {r.paths.map((p, j) => <span key={j} className="t-mono" style={{ padding: "1px 7px", borderRadius: 4, background: "var(--bg-surface-2)", font: "500 11.5px/1.6 var(--font-mono)", color: "var(--fg-2)" }}>{p.path}</span>)}
        </div>
        <div style={{ font: "400 11.5px/1.5 var(--font-sans)", color: "var(--fg-3)" }}>
          <strong style={{ color: "var(--fg-2)" }}>Files:</strong> {r.opsFiles.length ? r.opsFiles.join(" · ") : "—"} · <strong style={{ color: "var(--fg-2)" }}>Folders:</strong> {r.opsFolders.length ? r.opsFolders.join(" · ") : "—"}
        </div>
      </div>
    ))}
  </div>
);

window.FileTransferRulesReadOnly = FileTransferRulesReadOnly;
