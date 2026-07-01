// Policies — SSH/SFTP File Transfer Controls + Command Restrictions builder
// Inline expanding sections inside Step 2 of the policy create flow.

// ============================================================
// FILE TRANSFER CONTROLS
// ============================================================
const FileTransferControls = ({ rules, setRules, defaultAccess, setDefaultAccess }) => {
  const [expanded, setExpanded] = React.useState(rules.length === 0 ? null : -1);
  const addRule = () => {
    const id = `rule-${Date.now()}`;
    setRules([...rules, { id, name: "", effect: "Allow", subject: "all", subjects: [], paths: [], opsFiles: [], opsFolders: [] }]);
    setExpanded(id);
  };
  const update = (id, patch) => setRules(rules.map(r => r.id === id ? { ...r, ...patch } : r));
  const remove = (id) => setRules(rules.filter(r => r.id !== id));
  const move = (id, dir) => {
    const i = rules.findIndex(r => r.id === id);
    const j = i + dir;
    if (j < 0 || j >= rules.length) return;
    const next = [...rules];
    [next[i], next[j]] = [next[j], next[i]];
    setRules(next);
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ font: "600 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>File transfer controls</span>
        <span style={{ font: "400 11.5px/1 var(--font-sans)", color: "var(--fg-4)" }}>Applies to SFTP · SMB · FTP sessions only</span>
      </div>
      <div style={{ font: "400 12px/1.5 var(--font-sans)", color: "var(--fg-3)", marginBottom: 18 }}>Define what users can do with files and folders during file-transfer sessions.</div>

      {/* Default access */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ font: "500 12px/1.4 var(--font-sans)", color: "var(--fg-2)", marginBottom: 6 }}>Default access</div>
        <Segmented value={defaultAccess} onChange={setDefaultAccess}
          options={[{ value: "deny", label: "Deny all (recommended)" }, { value: "allow", label: "Allow all" }]}/>
        <div style={{ marginTop: 6, font: "400 11.5px/1.5 var(--font-sans)", color: "var(--fg-3)" }}>
          {defaultAccess === "deny" ? "All file access is blocked unless a rule below explicitly allows it." : "All file access is permitted unless a rule below explicitly denies it."}
        </div>
        {defaultAccess === "allow" && (
          <div style={{ marginTop: 8, padding: "8px 10px", background: "var(--warning-soft)", color: "var(--warning-fg)", borderRadius: 4, font: "500 12px/1.4 var(--font-sans)", display: "flex", alignItems: "center", gap: 6 }}>
            <Icon name="alert-circle" size={12}/> Permissive — add deny rules for sensitive paths.
          </div>
        )}
      </div>

      {/* Access rules header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <div>
          <div style={{ font: "500 12px/1.4 var(--font-sans)", color: "var(--fg-2)" }}>Access rules</div>
          <div style={{ font: "400 11.5px/1.4 var(--font-sans)", color: "var(--fg-4)", marginTop: 2 }}>Rules run top to bottom — first match wins. Drag to reorder.</div>
        </div>
        <button className="btn btn-sm" onClick={addRule}><Icon name="plus" size={11}/> Add rule</button>
      </div>

      <div style={{ marginTop: 12 }}>
        {rules.length === 0 ? (
          <div style={{ padding: 22, textAlign: "center", border: "1px dashed var(--border)", borderRadius: 6 }}>
            <div style={{ font: "500 13px/1.4 var(--font-sans)", color: "var(--fg-2)" }}>No rules yet</div>
            <div style={{ font: "400 11.5px/1.5 var(--font-sans)", color: "var(--fg-4)", marginTop: 4 }}>
              {defaultAccess === "deny" ? "Without rules, all file access is denied." : "Without rules, all file access is permitted."}
            </div>
            <button onClick={addRule} className="btn btn-sm" style={{ marginTop: 10 }}><Icon name="plus" size={11}/> Add your first rule</button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {rules.map((r, i) => (
              <FTRuleCard key={r.id} rule={r} index={i} rules={rules}
                expanded={expanded === r.id}
                onToggle={() => setExpanded(expanded === r.id ? null : r.id)}
                update={(patch) => update(r.id, patch)}
                remove={() => remove(r.id)}
                move={(dir) => move(r.id, dir)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const FTRuleCard = ({ rule, index, rules, expanded, onToggle, update, remove, move }) => {
  if (!expanded) return (
    <div style={{ background: "var(--bg-app)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ color: "var(--fg-4)", cursor: "grab" }}>⠿</span>
        <span style={{ font: "500 11px/1 var(--font-sans)", color: "var(--fg-4)", width: 22 }}>#{index + 1}</span>
        <EffectBadge effect={rule.effect}/>
        <button onClick={onToggle} style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer", font: "600 13px/1 var(--font-sans)", color: rule.name ? "var(--fg-1)" : "var(--fg-4)" }}>{rule.name || "Untitled rule"}</button>
        <div style={{ flex: 1 }}/>
        <button className="btn btn-ghost btn-sm" onClick={onToggle}>Edit</button>
        <RowMenu items={[
          { label: "Edit", icon: "edit", onClick: onToggle },
          { label: "Duplicate", icon: "copy", onClick: () => {} },
          { divider: true },
          { label: "Delete", icon: "trash", danger: true, onClick: remove },
        ]}/>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "90px 1fr", gap: "4px 12px", font: "400 12px/1.5 var(--font-sans)", paddingLeft: 38 }}>
        <span style={{ color: "var(--fg-4)" }}>Apply to</span>
        <span style={{ color: "var(--fg-2)" }}>{rule.subject === "all" ? "All users" : `${(rule.subjects || []).length || 0} users/groups`}</span>
        <span style={{ color: "var(--fg-4)" }}>Paths</span>
        <span style={{ color: "var(--fg-2)" }}>{rule.paths.length === 0 ? <span style={{ color: "var(--fg-4)" }}>None selected</span> : <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>{rule.paths.map((p, j) => <span key={j} className="t-mono" style={{ padding: "1px 7px", borderRadius: 4, background: "var(--bg-surface-2)", font: "500 11px/1.6 var(--font-mono)", color: "var(--fg-2)" }}>{p.path || "—"}{p.customFiles?.length || p.customFolders?.length ? <span style={{ color: "var(--brand-fg)" }}> · custom</span> : null}</span>)}</div>}</span>
        <span style={{ color: "var(--fg-4)" }}>Files</span>
        <span style={{ color: "var(--fg-2)" }}>{rule.opsFiles.length === 0 ? <span style={{ color: "var(--fg-4)" }}>None</span> : rule.opsFiles.join(" · ")}</span>
        <span style={{ color: "var(--fg-4)" }}>Folders</span>
        <span style={{ color: "var(--fg-2)" }}>{rule.opsFolders.length === 0 ? <span style={{ color: "var(--fg-4)" }}>None</span> : rule.opsFolders.join(" · ")}</span>
      </div>
    </div>
  );

  // Expanded
  const conflict = rules.find(o => o.id !== rule.id && o.paths.some(op => rule.paths.some(rp => rp.path && rp.path === op.path)) && o.effect !== rule.effect);
  const canSave = rule.name && rule.paths.length > 0 && rule.paths.some(p => p.path) && (rule.opsFiles.length + rule.opsFolders.length > 0);

  const addPath = (preset) => update({ paths: [...rule.paths, { path: preset || "", scope: "recursive", applies: "files-folders" }] });
  const updatePath = (i, patch) => update({ paths: rule.paths.map((p, j) => j === i ? { ...p, ...patch } : p) });
  const removePath = (i) => update({ paths: rule.paths.filter((_, j) => j !== i) });

  return (
    <div style={{ background: "var(--bg-app)", border: `1px solid var(--border)`, borderLeft: `3px solid ${rule.effect === "Allow" ? "var(--success-fg)" : "var(--danger-fg)"}`, borderRadius: 8, padding: 18, display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ color: "var(--fg-4)", cursor: "grab" }}>⠿</span>
        <span style={{ font: "600 11px/1 var(--font-sans)", color: "var(--fg-4)" }}>#{index + 1}</span>
        <EffectBadge effect={rule.effect}/>
        <span style={{ flex: 1 }}/>
        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => move(-1)} disabled={index === 0}><Icon name="chevron-up" size={11}/></button>
        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => move(1)} disabled={index === rules.length - 1}><Icon name="chevron-down" size={11}/></button>
        <button className="btn btn-ghost btn-icon btn-sm" onClick={onToggle}><Icon name="x" size={12}/></button>
      </div>

      {/* Name */}
      <div>
        <div style={{ font: "500 12px/1.4 var(--font-sans)", color: "var(--fg-2)", marginBottom: 6 }}>Rule name <span style={{ color: "var(--danger-fg)" }}>*</span></div>
        <input className="input" value={rule.name} onChange={e => update({ name: e.target.value })} placeholder="e.g. Allow engineering team — /var/data/"/>
        <div style={{ font: "400 11px/1.4 var(--font-sans)", color: "var(--fg-4)", marginTop: 4 }}>Descriptive names help you understand rule intent at a glance</div>
      </div>

      {/* Effect */}
      <div>
        <div style={{ font: "500 12px/1.4 var(--font-sans)", color: "var(--fg-2)", marginBottom: 6 }}>Effect</div>
        <Segmented value={rule.effect} onChange={v => update({ effect: v })}
          options={[
            { value: "Allow", label: "Allow — permit operations on matching paths" },
            { value: "Deny",  label: "Deny — block operations on matching paths" },
          ]}/>
      </div>

      {/* Subject */}
      <div>
        <div style={{ font: "500 12px/1.4 var(--font-sans)", color: "var(--fg-2)", marginBottom: 6 }}>Apply to</div>
        <Segmented value={rule.subject} onChange={v => update({ subject: v })}
          options={[{ value: "all", label: "All users" }, { value: "specific", label: "Specific users / groups" }]}/>
        {rule.subject === "specific" && (
          <div style={{ marginTop: 10, padding: 8, border: "1px solid var(--border)", borderRadius: 6, background: "var(--bg-app)" }}>
            <input placeholder="Search PAM users and groups…" className="input" style={{ border: "none", padding: "4px 6px" }}/>
          </div>
        )}
      </div>

      {/* Paths — searchable combobox */}
      <div>
        <div style={{ font: "500 12px/1.4 var(--font-sans)", color: "var(--fg-2)", marginBottom: 4 }}>Paths <span style={{ color: "var(--danger-fg)" }}>*</span></div>
        <div style={{ font: "400 11px/1.4 var(--font-sans)", color: "var(--fg-4)", marginBottom: 8 }}>Search or pick a common path, or type a new one. Use * for wildcard, ** for all subdirectories.</div>

        <PathPicker selected={rule.paths} onAdd={(p) => update({ paths: [...rule.paths, p] })}/>

        {/* Selected paths */}
        {rule.paths.length > 0 && (
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
            {rule.paths.map((p, i) => (
              <FTPathRow key={i} path={p} onChange={patch => updatePath(i, patch)} onRemove={() => removePath(i)}/>
            ))}
          </div>
        )}

        {conflict && (
          <div style={{ marginTop: 10, padding: 10, background: "var(--warning-soft)", color: "var(--warning-fg)", borderRadius: 4, font: "500 11.5px/1.5 var(--font-sans)" }}>
            ⚠ This path also appears in <strong>'{conflict.name || "another rule"}'</strong> with a conflicting effect. The rule that appears first takes priority.
          </div>
        )}
      </div>

      {/* Operations */}
      <div>
        <div style={{ font: "500 12px/1.4 var(--font-sans)", color: "var(--fg-2)", marginBottom: 4 }}>{rule.effect === "Allow" ? "Permitted operations" : "Blocked operations"}</div>
        <div style={{ font: "400 11px/1.4 var(--font-sans)", color: "var(--fg-4)", marginBottom: 10 }}>Select which file and folder operations this rule covers</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <OpGroup label="FILES" effect={rule.effect} selected={rule.opsFiles} setSelected={v => update({ opsFiles: v })} options={["Download","Upload","Delete","Rename","Copy","Move","Open","Zip","Unzip"]}/>
          <OpGroup label="FOLDERS" effect={rule.effect} selected={rule.opsFolders} setSelected={v => update({ opsFolders: v })} options={["List contents","Create","Delete","Rename","Move"]}/>
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", paddingTop: 6, borderTop: "1px solid var(--border-subtle)" }}>
        <button className="btn btn-ghost" style={{ color: "var(--danger-fg)" }} onClick={remove}>Delete rule</button>
        <div style={{ flex: 1 }}/>
        <button className="btn" onClick={onToggle}>Cancel</button>
        <button className="btn btn-primary" disabled={!canSave} onClick={onToggle}>Save rule</button>
      </div>
    </div>
  );
};

const EffectBadge = ({ effect }) => {
  const m = effect === "Allow"
    ? { bg: "var(--success-soft)", fg: "var(--success-fg)", label: "Allow" }
    : { bg: "var(--danger-soft)",  fg: "var(--danger-fg)",  label: "Deny" };
  return <span style={{ padding: "2px 8px", borderRadius: 4, background: m.bg, color: m.fg, font: "600 11px/1.5 var(--font-sans)" }}>{m.label}</span>;
};

const FTPathRow = ({ path, onChange, onRemove }) => {
  const [showCustom, setShowCustom] = React.useState(false);
  const customCount = (path.customFiles?.length || 0) + (path.customFolders?.length || 0);
  const preview = (() => {
    if (!path.path) return "";
    if (path.path.endsWith("/**")) return `Matches "${path.path.replace(/\/\*\*$/, "/")}" and all nested subdirectories`;
    if (path.path.endsWith("/*"))  return `Matches all files and folders inside ${path.path.replace(/\*$/, "")}`;
    if (path.path.startsWith("*.")) return `Matches all ${path.path.slice(1)} files`;
    if (/\.[a-z0-9]+$/i.test(path.path)) return `Matches exactly this file`;
    return `Matches "${path.path}"`;
  })();

  // Simulated children of the path for customization
  const sampleFiles = ["q1_report.csv","q2_report.csv","config.json","secrets.env","summary.xlsx","backup.zip"];
  const sampleFolders = ["archive","quarterly","temp","exports","logs"];
  const customFiles = path.customFiles || [];
  const customFolders = path.customFolders || [];
  const togFile = (f) => onChange({ customFiles: customFiles.includes(f) ? customFiles.filter(x => x !== f) : [...customFiles, f] });
  const togFolder = (f) => onChange({ customFolders: customFolders.includes(f) ? customFolders.filter(x => x !== f) : [...customFolders, f] });

  return (
    <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 6, padding: 10 }}>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <Icon name={path.path?.includes("\\") ? "server" : "server"} size={12} color="var(--fg-3)"/>
        <input className="input t-mono" value={path.path} onChange={e => onChange({ path: e.target.value })} placeholder="/path/to/" style={{ flex: 1, font: "13px/1.4 var(--font-mono)", height: 32 }}/>
        <Select value={path.scope} onChange={v => onChange({ scope: v })} options={[["recursive","↓ Recursive"],["this","→ This level only"]]}/>
        <button className="btn btn-ghost btn-sm" onClick={() => setShowCustom(s => !s)} style={{ color: customCount > 0 ? "var(--brand-fg)" : "var(--fg-3)" }}>
          {customCount > 0 ? <><Icon name="check" size={11}/> Custom ({customCount})</> : <>Customize</>}
        </button>
        <button className="btn btn-ghost btn-icon btn-sm" onClick={onRemove}><Icon name="x" size={11}/></button>
      </div>
      {preview && !showCustom && <div style={{ marginTop: 6, font: "italic 400 11px/1.4 var(--font-sans)", color: "var(--fg-3)" }}>{preview}{customCount > 0 ? ` · limited to ${customCount} item${customCount > 1 ? "s" : ""}` : ""}</div>}

      {showCustom && (
        <div style={{ marginTop: 10, padding: 12, background: "var(--bg-app)", border: "1px solid var(--border)", borderRadius: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <Icon name="info" size={11} color="var(--fg-4)"/>
            <span style={{ font: "400 11.5px/1.4 var(--font-sans)", color: "var(--fg-3)" }}>Restrict this rule to specific files and folders within <span className="t-mono" style={{ color: "var(--fg-1)" }}>{path.path || "this path"}</span>. Leave all unchecked to apply to everything.</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <div style={{ font: "600 10.5px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Folders inside</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {sampleFolders.map(f => (
                  <label key={f} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", cursor: "pointer", font: "500 12px/1 var(--font-mono)", color: "var(--fg-1)" }}>
                    <input type="checkbox" checked={customFolders.includes(f)} onChange={() => togFolder(f)} style={{ accentColor: "var(--brand)" }}/>
                    <span style={{ flex: 1 }}>📁 {f}/</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <div style={{ font: "600 10.5px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Files inside</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {sampleFiles.map(f => (
                  <label key={f} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", cursor: "pointer", font: "500 12px/1 var(--font-mono)", color: "var(--fg-1)" }}>
                    <input type="checkbox" checked={customFiles.includes(f)} onChange={() => togFile(f)} style={{ accentColor: "var(--brand)" }}/>
                    <span style={{ flex: 1 }}>📄 {f}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border-subtle)" }}>
            <button className="btn btn-ghost btn-sm" onClick={() => onChange({ customFiles: [], customFolders: [] })}>Clear selection</button>
            <div style={{ flex: 1 }}/>
            <button className="btn btn-sm" onClick={() => setShowCustom(false)}>Done</button>
          </div>
        </div>
      )}
    </div>
  );
};

// Searchable path picker — combobox with common paths + free entry
const PathPicker = ({ selected, onAdd }) => {
  const [q, setQ] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const COMMON = ["/home/","/var/","/var/log/","/var/data/","/var/data/reports/","/tmp/","/etc/","/data/","/backup/","/opt/","/usr/local/","~/","C:\\Users\\","C:\\Shared\\","C:\\ProgramData\\","/**"];
  const isSelected = (p) => selected.some(s => s.path === p);
  const matches = COMMON.filter(p => p.toLowerCase().includes(q.toLowerCase()) && !isSelected(p));
  const canAddCustom = q.trim() && !COMMON.some(p => p === q.trim()) && !isSelected(q.trim());

  const add = (p) => { onAdd({ path: p, scope: "recursive", applies: "files-folders", customFiles: [], customFolders: [] }); setQ(""); setOpen(false); };

  return (
    <div style={{ position: "relative" }}>
      <div style={{ position: "relative" }}>
        <Icon name="search" size={12} color="var(--fg-4)" style={{ position: "absolute", left: 10, top: 11 }}/>
        <input className="input t-mono" value={q} onChange={e => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)} placeholder="Search or type a path…" style={{ paddingLeft: 30, height: 32 }}/>
      </div>
      {open && (matches.length > 0 || canAddCustom) && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 30, maxHeight: 280, overflow: "auto", background: "var(--bg-app)", border: "1px solid var(--border)", borderRadius: 6, boxShadow: "var(--shadow-lg)", padding: 4 }}>
          {canAddCustom && (
            <button onMouseDown={e => e.preventDefault()} onClick={() => add(q.trim())} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 10px", border: "none", background: "var(--brand-soft)", color: "var(--brand-fg)", borderRadius: 4, cursor: "pointer", font: "500 12.5px/1 var(--font-mono)", textAlign: "left" }}>
              <Icon name="plus" size={11}/> Add custom path: <span className="t-mono">{q.trim()}</span>
            </button>
          )}
          {matches.length > 0 && (
            <div style={{ marginTop: canAddCustom ? 4 : 0 }}>
              <div style={{ padding: "6px 10px", font: "600 10.5px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.5 }}>Common paths</div>
              {matches.map(p => (
                <button key={p} onMouseDown={e => e.preventDefault()} onClick={() => add(p)} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "7px 10px", border: "none", background: "transparent", color: "var(--fg-1)", borderRadius: 4, cursor: "pointer", font: "500 12.5px/1 var(--font-mono)", textAlign: "left" }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--bg-surface-2)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >📁 {p}</button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const OpGroup = ({ label, effect, selected, setSelected, options }) => {
  const toggle = (op) => setSelected(selected.includes(op) ? selected.filter(x => x !== op) : [...selected, op]);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ font: "600 10px/1 var(--font-sans)", color: "var(--fg-4)", letterSpacing: 0.06 * 10, textTransform: "uppercase" }}>{label}</span>
        <div style={{ display: "flex", gap: 6 }}>
          <button className="btn btn-ghost btn-sm" style={{ padding: 0, color: "var(--brand-fg)", font: "500 11px/1 var(--font-sans)" }} onClick={() => setSelected(options)}>Select all</button>
          <button className="btn btn-ghost btn-sm" style={{ padding: 0, color: "var(--fg-4)", font: "500 11px/1 var(--font-sans)" }} onClick={() => setSelected([])}>Clear</button>
        </div>
      </div>
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
        {options.map(op => {
          const sel = selected.includes(op);
          const m = effect === "Allow"
            ? { bg: sel ? "var(--success-fg)" : "var(--bg-app)", fg: sel ? "#fff" : "var(--fg-2)" }
            : { bg: sel ? "var(--danger-fg)"  : "var(--bg-app)", fg: sel ? "#fff" : "var(--fg-2)" };
          return (
            <button key={op} onClick={() => toggle(op)} style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              padding: "5px 10px", borderRadius: 999,
              border: `1px solid ${sel ? "transparent" : "var(--border)"}`,
              background: m.bg, color: m.fg,
              font: `${sel ? 600 : 500} 11.5px/1 var(--font-sans)`, cursor: "pointer",
            }}>
              {sel && <Icon name={effect === "Allow" ? "check" : "x"} size={9}/>}
              {op}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================
// COMMAND RESTRICTIONS
// ============================================================
const CommandRestrictionsV2 = ({ mode, setMode, commands, setCommands, ssh, setSSH }) => {
  const [showImport, setShowImport] = React.useState(false);
  const addCmd = (preset) => {
    setCommands([...commands, { id: `c-${Date.now()}-${Math.random()}`, cmd: preset || "", match: "starts", desc: "" }]);
  };
  const updateCmd = (id, patch) => setCommands(commands.map(c => c.id === id ? { ...c, ...patch } : c));
  const removeCmd = (id) => setCommands(commands.filter(c => c.id !== id));

  const chipsBlock = ["rm -rf","dd if=","wget","curl","chmod 777","sudo su","nc","python -c","perl -e","mkfs"];
  const chipsAllow = ["ls","cat","pwd","cd","grep","tail","head","ps","df","du","cp","mv"];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ font: "600 11px/1 var(--font-sans)", color: "var(--fg-3)", letterSpacing: 0.08 * 11, textTransform: "uppercase" }}>COMMAND RESTRICTIONS</span>
        <span style={{ font: "italic 400 11px/1 var(--font-sans)", color: "var(--fg-3)" }}>Applies to SSH terminal sessions only</span>
      </div>

      <div style={{ marginBottom: 14 }}>
        <div style={{ font: "500 12px/1.4 var(--font-sans)", color: "var(--fg-2)", marginBottom: 6 }}>Mode</div>
        <Segmented value={mode} onChange={setMode} options={[
          { value: "blocklist", label: "Blocklist — block specific commands" },
          { value: "allowlist", label: "Allowlist — only permit listed commands" },
          { value: "disabled",  label: "Disabled — no restrictions" },
        ]}/>
        <div style={{ marginTop: 6, font: "400 11.5px/1.5 var(--font-sans)", color: "var(--fg-3)" }}>
          {mode === "blocklist" && "All commands are permitted except those listed below."}
          {mode === "allowlist" && "Only commands listed below are permitted. All others are blocked."}
          {mode === "disabled" && "No command restrictions apply. Users can run any command."}
        </div>
        {mode === "allowlist" && commands.length === 0 && (
          <div style={{ marginTop: 8, padding: 10, background: "var(--warning-soft)", color: "var(--warning-fg)", borderRadius: 4, font: "500 11.5px/1.4 var(--font-sans)" }}>
            ⚠ Restrictive. Ensure all needed commands are included — an empty allowlist will block ALL commands and lock users out.
          </div>
        )}
        {mode === "allowlist" && commands.length > 0 && (
          <div style={{ marginTop: 8, padding: 10, background: "var(--warning-soft)", color: "var(--warning-fg)", borderRadius: 4, font: "500 11.5px/1.4 var(--font-sans)" }}>
            ⚠ Restrictive. Ensure all needed commands are included.
          </div>
        )}
        {mode === "disabled" && (
          <div style={{ marginTop: 8, padding: 10, background: "var(--warning-soft)", color: "var(--warning-fg)", borderRadius: 4, font: "500 11.5px/1.4 var(--font-sans)" }}>
            ⚠ Not recommended for production. Consider adding blocklist rules.
          </div>
        )}
      </div>

      {mode !== "disabled" && (
        <>
          {/* Quick-add chips */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ font: "500 11px/1 var(--font-sans)", color: "var(--fg-3)", marginBottom: 6 }}>Common patterns</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {(mode === "blocklist" ? chipsBlock : chipsAllow).map(c => (
                <button key={c} onClick={() => addCmd(c)} style={{
                  padding: "3px 9px", borderRadius: 999, border: "1px solid var(--border)",
                  background: "var(--bg-app)", color: "var(--fg-2)",
                  font: "500 11.5px/1 var(--font-mono)", cursor: "pointer",
                }}>{c}</button>
              ))}
            </div>
          </div>

          {commands.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", border: "1px dashed var(--border)", borderRadius: 6 }}>
              <div style={{ font: "500 13px/1.4 var(--font-sans)", color: "var(--fg-2)" }}>No commands configured</div>
              <div style={{ font: "400 11.5px/1.5 var(--font-sans)", color: "var(--fg-4)", marginTop: 4 }}>
                {mode === "blocklist" ? "Add commands you want to block, e.g. rm -rf, dd, wget" : "Add commands users are permitted to run, e.g. ls, cat, grep, tail"}
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {commands.map(c => <CmdRow key={c.id} cmd={c} mode={mode} update={patch => updateCmd(c.id, patch)} remove={() => removeCmd(c.id)}/>)}
            </div>
          )}

          <div style={{ marginTop: 10, display: "flex", gap: 14 }}>
            <button className="btn btn-ghost btn-sm" style={{ padding: 0, color: "var(--brand-fg)" }} onClick={() => addCmd()}>+ Add command</button>
            <button className="btn btn-ghost btn-sm" style={{ padding: 0, color: "var(--brand-fg)" }} onClick={() => setShowImport(true)}>Import from file</button>
          </div>
        </>
      )}

      {/* Additional SSH controls */}
      <div style={{ marginTop: 22, paddingTop: 16, borderTop: "1px solid var(--border-subtle)" }}>
        <div style={{ font: "600 11px/1 var(--font-sans)", color: "var(--fg-3)", letterSpacing: 0.08 * 11, textTransform: "uppercase", marginBottom: 12 }}>ADDITIONAL CONTROLS</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <SSHToggle label="Port forwarding" hint="Prevents users from creating SSH tunnels that could bypass network controls" value={ssh.portFwd} onChange={v => setSSH({ ...ssh, portFwd: v })}/>
          <SSHToggle label="X11 forwarding" hint="Prevents graphical application windows from being forwarded over SSH" value={ssh.x11} onChange={v => setSSH({ ...ssh, x11: v })}/>
          <SSHToggle label="Agent forwarding" hint="Prevents users from using their local SSH keys to access other systems during a session" value={ssh.agentFwd} onChange={v => setSSH({ ...ssh, agentFwd: v })}/>
          <SSHToggle label="Shell restriction" hint="Restrict which shells users can launch" value={ssh.shellRestrict} onChange={v => setSSH({ ...ssh, shellRestrict: v })}/>
          {ssh.shellRestrict && (
            <div style={{ marginLeft: 0, padding: 10, background: "var(--bg-surface-2)", borderRadius: 4 }}>
              <div style={{ font: "500 11.5px/1 var(--font-sans)", color: "var(--fg-2)", marginBottom: 6 }}>Allowed shells</div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {["/bin/bash","/bin/sh","/usr/bin/zsh","/bin/rbash"].map(s => {
                  const sel = (ssh.shells || []).includes(s);
                  return <button key={s} onClick={() => setSSH({ ...ssh, shells: sel ? ssh.shells.filter(x => x !== s) : [...(ssh.shells || []), s] })} style={{
                    padding: "3px 9px", borderRadius: 4,
                    border: `1px solid ${sel ? "transparent" : "var(--border)"}`,
                    background: sel ? "var(--brand)" : "var(--bg-app)",
                    color: sel ? "#fff" : "var(--fg-2)",
                    font: "500 11.5px/1 var(--font-mono)", cursor: "pointer",
                  }}>{s}</button>;
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {showImport && <ImportCommandsModal onClose={() => setShowImport(false)} onImport={(imported) => { setCommands([...commands, ...imported]); setShowImport(false); }}/>}
    </div>
  );
};

const CmdRow = ({ cmd, mode, update, remove }) => {
  const preview = (() => {
    if (!cmd.cmd) return "";
    if (cmd.match === "starts")   return `${mode === "blocklist" ? "Blocks" : "Allows"} commands starting with "${cmd.cmd}"`;
    if (cmd.match === "exact")    return `${mode === "blocklist" ? "Blocks" : "Allows"} only exact "${cmd.cmd}"`;
    if (cmd.match === "contains") return `${mode === "blocklist" ? "Blocks" : "Allows"} commands containing "${cmd.cmd}"`;
    if (cmd.match === "regex")    return `${mode === "blocklist" ? "Blocks" : "Allows"} commands matching /${cmd.cmd}/`;
    return "";
  })();
  return (
    <div style={{ background: "var(--bg-app)", border: "1px solid var(--border)", borderRadius: 6, padding: 10 }}>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <input className="input t-mono" value={cmd.cmd} onChange={e => update({ cmd: e.target.value })} placeholder="e.g. rm -rf or sudo *" style={{ flex: 1, font: "13px/1.4 var(--font-mono)" }}/>
        <Select value={cmd.match} onChange={v => update({ match: v })} options={[["starts","Starts with"],["exact","Exact match"],["contains","Contains"],["regex","Regex"]]}/>
        <input className="input" value={cmd.desc} onChange={e => update({ desc: e.target.value })} placeholder="Why this is blocked/allowed" style={{ flex: 1 }}/>
        <button className="btn btn-ghost btn-icon btn-sm" onClick={remove}><Icon name="x" size={11}/></button>
      </div>
      {preview && <div style={{ marginTop: 6, font: "italic 400 11px/1.4 var(--font-sans)", color: "var(--fg-3)" }}>{preview}</div>}
    </div>
  );
};

const SSHToggle = ({ label, hint, value, onChange }) => (
  <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
    <div style={{ flex: 1 }}>
      <div style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{label}</div>
      <div style={{ font: "400 11.5px/1.4 var(--font-sans)", color: "var(--fg-3)", marginTop: 2 }}>{hint}</div>
    </div>
    <Toggle value={value} onChange={onChange}/>
  </div>
);

const ImportCommandsModal = ({ onClose, onImport }) => {
  const [step, setStep] = React.useState("upload");
  const [skip, setSkip] = React.useState(true);
  const previewRows = [
    { cmd: "rm -rf", match: "starts", desc: "Recursive deletion" },
    { cmd: "dd if=", match: "starts", desc: "Disk write" },
    { cmd: "shutdown", match: "exact", desc: "System halt" },
    { cmd: "fdisk", match: "starts", desc: "Partition table" },
    { cmd: "wget http*", match: "regex", desc: "External downloads" },
  ];
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 100 }}/>
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 480, maxWidth: "92vw", background: "var(--bg-app)", borderRadius: 10, boxShadow: "var(--shadow-lg)", zIndex: 101, border: "1px solid var(--border)" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center" }}>
          <span style={{ flex: 1, font: "600 15px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>Import command rules</span>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><Icon name="x" size={14}/></button>
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ font: "400 13px/1.5 var(--font-sans)", color: "var(--fg-2)", marginBottom: 4 }}>Upload a .txt or .csv file with one command per line.</div>
          <a href="#" style={{ font: "500 12px/1 var(--font-sans)", color: "var(--brand-fg)" }}>Download template</a>

          {step === "upload" && (
            <div style={{ marginTop: 16, padding: 24, border: "2px dashed var(--border)", borderRadius: 8, textAlign: "center" }}>
              <Icon name="upload" size={20} color="var(--fg-4)"/>
              <div style={{ marginTop: 8, font: "500 12.5px/1.3 var(--font-sans)", color: "var(--fg-2)" }}>Drop file or browse</div>
              <button className="btn btn-sm btn-primary" style={{ marginTop: 10 }} onClick={() => setStep("preview")}>Browse</button>
            </div>
          )}
          {step === "preview" && (
            <>
              <div className="card" style={{ marginTop: 14, overflow: "hidden" }}>
                <table className="table">
                  <thead><tr><th>Command</th><th>Match type</th><th>Description</th></tr></thead>
                  <tbody>{previewRows.map((r, i) => (
                    <tr key={i}>
                      <td className="t-mono" style={{ fontSize: 12 }}>{r.cmd}</td>
                      <td>{r.match}</td>
                      <td style={{ fontSize: 12 }}>{r.desc}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
              <label style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8, font: "500 12.5px/1 var(--font-sans)", color: "var(--fg-2)" }}>
                <input type="checkbox" checked={skip} onChange={e => setSkip(e.target.checked)} style={{ accentColor: "var(--brand)" }}/>
                Skip duplicates
              </label>
            </>
          )}
        </div>
        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 8, justifyContent: "flex-end", background: "var(--bg-surface)" }}>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={step !== "preview"} onClick={() => onImport(previewRows.map((r, i) => ({ id: `imp-${Date.now()}-${i}`, ...r })))}>Import {previewRows.length} commands</button>
        </div>
      </div>
    </>
  );
};

Object.assign(window, { FileTransferControls, CommandRestrictionsV2 });
