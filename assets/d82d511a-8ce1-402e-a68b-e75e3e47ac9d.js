// Credentials — interaction foundation: global toast, mutable store, shared modals
// Loaded BEFORE list/detail/subtabs so window.useCreds + window.pamToast exist.

// =========================================================
// GLOBAL TOAST — imperative, vanilla DOM (callable from anywhere)
// window.pamToast(text, kind, { duration, action: { label, onClick } })
// =========================================================
(function () {
  const KIND = {
    success: { bg: "var(--success-soft)", fg: "var(--success-fg)", icon: "✓" },
    error:   { bg: "var(--danger-soft)",  fg: "var(--danger-fg)",  icon: "✕" },
    info:    { bg: "var(--brand-soft)",   fg: "var(--brand-fg)",   icon: "ℹ" },
  };
  window.pamToast = function (text, kind = "success", opts = {}) {
    const k = KIND[kind] || KIND.success;
    let host = document.getElementById("pam-toast-host");
    if (!host) {
      host = document.createElement("div");
      host.id = "pam-toast-host";
      host.style.cssText = "position:fixed;top:18px;left:50%;transform:translateX(-50%);z-index:9999;display:flex;flex-direction:column;gap:8px;align-items:center;pointer-events:none";
      document.body.appendChild(host);
    }
    const el = document.createElement("div");
    el.style.cssText = `pointer-events:auto;min-width:260px;max-width:460px;padding:11px 15px;background:${k.bg};color:${k.fg};border-radius:8px;box-shadow:0 6px 22px rgba(0,0,0,.14);font:500 13px/1.4 var(--font-sans,sans-serif);display:flex;align-items:center;gap:10px;opacity:0;transform:translateY(-8px);transition:opacity .22s ease,transform .22s ease`;
    const icon = document.createElement("span");
    icon.textContent = k.icon;
    icon.style.cssText = "font-size:14px;flex:none";
    const msg = document.createElement("span");
    msg.textContent = text;
    msg.style.cssText = "flex:1";
    el.appendChild(icon); el.appendChild(msg);
    if (opts.action) {
      const btn = document.createElement("button");
      btn.textContent = opts.action.label;
      btn.style.cssText = `flex:none;border:none;background:transparent;color:${k.fg};font:600 12.5px/1 var(--font-sans,sans-serif);text-decoration:underline;cursor:pointer;padding:0`;
      btn.onclick = () => { try { opts.action.onClick && opts.action.onClick(); } finally { dismiss(); } };
      el.appendChild(btn);
    }
    host.appendChild(el);
    requestAnimationFrame(() => { el.style.opacity = "1"; el.style.transform = "translateY(0)"; });
    let timer = setTimeout(dismiss, opts.duration || (kind === "error" ? 6000 : 4000));
    function dismiss() {
      clearTimeout(timer);
      el.style.opacity = "0"; el.style.transform = "translateY(-8px)";
      setTimeout(() => el.remove(), 240);
    }
    return dismiss;
  };
})();

// =========================================================
// MUTABLE CREDENTIAL STORE — single source of truth
// =========================================================
(function () {
  const listeners = new Set();
  const store = {
    list: (window.CREDS || []).slice(),
    get: () => store.list,
    _emit: () => { window.CREDS = store.list; listeners.forEach(fn => fn()); },
    set: (next) => { store.list = next; store._emit(); },
    add: (cred) => store.set([cred, ...store.list]),
    remove: (id) => store.set(store.list.filter(c => c.id !== id)),
    update: (id, patch) => store.set(store.list.map(c => c.id === id ? { ...c, ...patch } : c)),
    find: (id) => store.list.find(c => c.id === id),
    subscribe: (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
  };
  window.credStore = store;
  window.CREDS = store.list;
  window.useCreds = function () {
    const [, force] = React.useReducer(x => x + 1, 0);
    React.useEffect(() => store.subscribe(force), []);
    return store.get();
  };
})();

// Build a credential object from the Add-panel data shape
window.buildCredFromAddData = function (d) {
  const id = "c-" + Math.random().toString(36).slice(2, 8);
  const resourceNames = (d.resources || []).map(r => (typeof r === "string" ? r : r.name));
  const policy = d.policyMode === "existing"
    ? ((window.ROTATION_POLICIES || []).find(p => p.id === d.existingPolicy) || {}).name || null
    : (d.newPolicy && d.newPolicy.name ? d.newPolicy.name : null);
  return {
    id,
    display: d.display || "untitled-credential",
    type: d.type || "Password",
    username: d.type === "App Secret" ? "—" : (d.username || "—"),
    resources: resourceNames,
    owner: d.owner || null,
    sensitivity: d.sensitivity || "Medium",
    nonViewable: !!d.nonViewable,
    adminAcct: d.adminAcct || null,
    policy,
    lastRotated: "Never",
    rotation: policy ? "healthy" : "no-policy",
    source: d.source || "Manual",
    created: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
    complete: !!d.markComplete,
    tags: d.tags || [],
    isNew: true,
    secretType: d.secretType, application: d.secretApp, expiry: d.secretExpiry || null,
    injection: d.secretInjection, fingerprint: d.sshFingerprint, keyType: d.sshKeyType,
    passphrase: !!d.sshPassphrase,
  };
};

// =========================================================
// ASSIGN OWNER MODAL
// =========================================================
const AssignOwnerModal = ({ cred, onClose, onSave }) => {
  const [q, setQ] = React.useState("");
  const [sel, setSel] = React.useState(cred.owner || "");
  const people = ["Arjun Bansal", "Priya Nair", "Rohan Mehta", "Security Team", "IT Ops"];
  const filtered = people.filter(p => p.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.4)", zIndex: 110 }}/>
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 440, maxWidth: "92vw", background: "var(--bg-app)", border: "1px solid var(--border)", borderRadius: 10, boxShadow: "var(--shadow-lg)", zIndex: 111 }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center" }}>
          <div style={{ flex: 1, font: "600 15px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>Assign owner — {cred.display}</div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><Icon name="x" size={14}/></button>
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ font: "400 12px/1.5 var(--font-sans)", color: "var(--fg-4)", marginBottom: 6 }}>Current owner: {cred.owner ? <strong style={{ color: "var(--fg-1)" }}>{cred.owner}</strong> : "Unassigned"}</div>
          <input className="input" autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search by name or email…" style={{ marginBottom: 10 }}/>
          <div style={{ maxHeight: 220, overflow: "auto", border: "1px solid var(--border)", borderRadius: 6 }}>
            {filtered.map(p => (
              <button key={p} onClick={() => setSel(p)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "9px 12px", border: "none", borderBottom: "1px solid var(--border-subtle)", background: sel === p ? "var(--brand-soft)" : "transparent", cursor: "pointer", textAlign: "left" }}>
                <Avatar name={p} size={26}/>
                <span style={{ flex: 1, font: "500 13px/1 var(--font-sans)", color: "var(--fg-1)" }}>{p}</span>
                {sel === p && <Icon name="check" size={13} color="var(--brand-fg)"/>}
              </button>
            ))}
            {filtered.length === 0 && <div style={{ padding: 16, textAlign: "center", color: "var(--fg-4)", font: "400 12.5px var(--font-sans)" }}>No matches</div>}
          </div>
        </div>
        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 8, justifyContent: "flex-end", background: "var(--bg-surface)" }}>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={!sel} onClick={() => { onSave(sel); onClose(); }}>Save</button>
        </div>
      </div>
    </>
  );
};

// =========================================================
// DELETE CREDENTIAL MODAL — type-to-confirm for High/Critical
// =========================================================
const DeleteCredModal = ({ cred, onClose, onConfirm }) => {
  const [typed, setTyped] = React.useState("");
  const needsType = cred.sensitivity === "Critical" || cred.sensitivity === "High";
  const linked = cred.resources.length;
  const rotating = cred.policy && cred.rotation !== "no-policy";
  const ready = !needsType || typed === cred.display;
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.4)", zIndex: 110 }}/>
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 480, maxWidth: "92vw", background: "var(--bg-app)", border: "1px solid var(--border)", borderRadius: 10, boxShadow: "var(--shadow-lg)", zIndex: 111 }}>
        <div style={{ padding: "16px 20px 12px" }}>
          <h2 style={{ font: "600 15.5px/1.3 var(--font-sans)", color: "var(--fg-1)", margin: 0 }}>Delete {cred.display}?</h2>
          <p style={{ font: "400 13px/1.5 var(--font-sans)", color: "var(--fg-2)", margin: "8px 0 0" }}>This credential will be permanently removed from the vault.</p>
          {linked > 0 && <div style={{ marginTop: 12, padding: 10, background: "var(--warning-soft)", color: "var(--warning-fg)", borderRadius: 6, font: "400 12.5px/1.5 var(--font-sans)" }}>⚠ {linked} resource{linked > 1 ? "s are" : " is"} linked. They will lose credential coverage and sessions cannot be launched until a new credential is linked.</div>}
          {rotating && <div style={{ marginTop: 8, padding: 10, background: "var(--danger-soft)", color: "var(--danger-fg)", borderRadius: 6, font: "400 12.5px/1.5 var(--font-sans)" }}>⚠ Automated rotation will stop immediately.</div>}
          {needsType && (
            <div style={{ marginTop: 14 }}>
              <label style={{ font: "400 12px/1.5 var(--font-sans)", color: "var(--fg-3)" }}>Type <strong style={{ color: "var(--fg-1)" }}>{cred.display}</strong> to confirm</label>
              <input className="input" autoFocus value={typed} onChange={e => setTyped(e.target.value)} placeholder={cred.display} style={{ marginTop: 6, fontFamily: "var(--font-mono)" }}/>
            </div>
          )}
        </div>
        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 8, justifyContent: "flex-end", background: "var(--bg-surface)" }}>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn" disabled={!ready} style={ready ? { background: "var(--danger)", color: "#fff", borderColor: "var(--danger)" } : { opacity: 0.5, cursor: "not-allowed" }} onClick={() => { onConfirm(); onClose(); }}>Delete permanently</button>
        </div>
      </div>
    </>
  );
};

// =========================================================
// EXPORT MODAL (list-level CSV/PDF + per-credential)
// =========================================================
const ExportModal = ({ title, onClose, onExport }) => {
  const [fmt, setFmt] = React.useState("CSV");
  const [sections, setSections] = React.useState({ identity: true, resources: true, rotationConfig: true, rotationHistory: true, audit: true, metaOnly: false });
  const tog = (k) => setSections(s => ({ ...s, [k]: !s[k] }));
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.4)", zIndex: 110 }}/>
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 460, maxWidth: "92vw", background: "var(--bg-app)", border: "1px solid var(--border)", borderRadius: 10, boxShadow: "var(--shadow-lg)", zIndex: 111 }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center" }}>
          <div style={{ flex: 1, font: "600 15px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{title}</div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><Icon name="x" size={14}/></button>
        </div>
        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <div style={{ font: "500 12px/1.5 var(--font-sans)", color: "var(--fg-3)", marginBottom: 6 }}>Export format</div>
            <Segmented value={fmt} onChange={setFmt} options={[{ value: "CSV", label: "CSV" }, { value: "PDF", label: "PDF" }]}/>
          </div>
          <div>
            <div style={{ font: "500 12px/1.5 var(--font-sans)", color: "var(--fg-3)", marginBottom: 6 }}>Include sections</div>
            {[["identity", "Identity"], ["resources", "Linked resources"], ["rotationConfig", "Rotation configuration"], ["rotationHistory", "Rotation history (last 10 events)"], ["audit", "Audit trail"], ["metaOnly", "Metadata only (lightweight)"]].map(([k, label]) => (
              <label key={k} style={{ display: "flex", alignItems: "center", gap: 9, padding: "5px 0", cursor: "pointer", font: "400 12.5px/1.4 var(--font-sans)", color: "var(--fg-1)" }}>
                <input type="checkbox" checked={sections[k]} onChange={() => tog(k)} style={{ accentColor: "var(--brand)" }}/>{label}
              </label>
            ))}
          </div>
          <div style={{ padding: 10, background: "var(--bg-surface-2)", borderRadius: 6, font: "400 12px/1.5 var(--font-sans)", color: "var(--fg-3)" }}>🔒 Raw passwords are never included in any export.</div>
        </div>
        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 8, justifyContent: "flex-end", background: "var(--bg-surface)" }}>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => { onExport(fmt); onClose(); }}><Icon name="download" size={12}/> Export</button>
        </div>
      </div>
    </>
  );
};

// =========================================================
// ASSIGN ROTATION POLICY MODAL
// =========================================================
const AssignPolicyModal = ({ cred, onClose, onAssign }) => {
  const policies = window.ROTATION_POLICIES || [];
  const [sel, setSel] = React.useState("");
  const [creating, setCreating] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [newType, setNewType] = React.useState("Schedule");
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.4)", zIndex: 110 }}/>
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 520, maxWidth: "92vw", background: "var(--bg-app)", border: "1px solid var(--border)", borderRadius: 10, boxShadow: "var(--shadow-lg)", zIndex: 111 }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center" }}>
          <div style={{ flex: 1, font: "600 15px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>Assign rotation policy — {cred.display}</div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><Icon name="x" size={14}/></button>
        </div>
        <div style={{ padding: 20 }}>
          {!creating ? (
            <>
              <div style={{ font: "400 12.5px/1.5 var(--font-sans)", color: "var(--fg-3)", marginBottom: 10 }}>Select a rotation policy to apply to this credential:</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 260, overflow: "auto" }}>
                {policies.map(p => (
                  <button key={p.id} onClick={() => setSel(p.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", border: `1px solid ${sel === p.id ? "var(--brand)" : "var(--border)"}`, background: sel === p.id ? "var(--brand-soft)" : "var(--bg-surface)", borderRadius: 8, cursor: "pointer", textAlign: "left" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ font: "600 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{p.name}</div>
                      <div style={{ font: "400 11.5px/1.4 var(--font-sans)", color: "var(--fg-4)", marginTop: 2 }}>{p.type} · {p.interval} · {p.count} credentials using this</div>
                    </div>
                    {sel === p.id && <Icon name="check" size={14} color="var(--brand-fg)"/>}
                  </button>
                ))}
              </div>
              <button className="btn btn-ghost btn-sm" style={{ marginTop: 10, color: "var(--brand-fg)", padding: 0 }} onClick={() => setCreating(true)}>+ Create new policy</button>
            </>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Field label="Policy name" required><input className="input" autoFocus value={newName} onChange={e => setNewName(e.target.value)} placeholder="Prod-Daily-Rotation"/></Field>
              <Field label="Rotation type"><Segmented value={newType} onChange={setNewType} options={[{ value: "Schedule", label: "Schedule" }, { value: "After Every Use", label: "After use" }, { value: "On Checkout", label: "On checkout" }]}/></Field>
              <button className="btn btn-ghost btn-sm" style={{ alignSelf: "flex-start", color: "var(--fg-3)", padding: 0 }} onClick={() => setCreating(false)}>← Back to existing policies</button>
            </div>
          )}
        </div>
        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 8, justifyContent: "flex-end", background: "var(--bg-surface)" }}>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={creating ? !newName.trim() : !sel} onClick={() => {
            const name = creating ? newName.trim() : (policies.find(p => p.id === sel) || {}).name;
            const type = creating ? newType : (policies.find(p => p.id === sel) || {}).type;
            onAssign(name, type); onClose();
          }}>Save and apply</button>
        </div>
      </div>
    </>
  );
};

// =========================================================
// BULK ROTATE MODAL — idle / progress / complete
// =========================================================
const BulkRotateModal = ({ creds, onClose, onDone }) => {
  const [phase, setPhase] = React.useState("idle"); // idle | progress | complete
  const [reason, setReason] = React.useState("");
  const [validate, setValidate] = React.useState(true);
  const [statuses, setStatuses] = React.useState({}); // id -> rotating|success|failed
  const ready = creds.filter(c => c.adminAcct);
  const skipped = creds.filter(c => !c.adminAcct);

  const start = () => {
    setPhase("progress");
    ready.forEach((c, i) => {
      setTimeout(() => setStatuses(s => ({ ...s, [c.id]: "rotating" })), i * 500);
      setTimeout(() => {
        const failed = c.rotation === "failed" || c.id === "c-003";
        setStatuses(s => ({ ...s, [c.id]: failed ? "failed" : "success" }));
        if (!failed) window.credStore.update(c.id, { rotation: "healthy", lastRotated: "just now" });
        if (i === ready.length - 1) setTimeout(() => setPhase("complete"), 500);
      }, i * 500 + 1100);
    });
  };

  const succeeded = Object.values(statuses).filter(s => s === "success").length;
  const failedN = Object.values(statuses).filter(s => s === "failed").length;

  return (
    <>
      <div onClick={phase === "progress" ? null : onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.4)", zIndex: 110 }}/>
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 560, maxWidth: "92vw", maxHeight: "86vh", display: "flex", flexDirection: "column", background: "var(--bg-app)", border: "1px solid var(--border)", borderRadius: 10, boxShadow: "var(--shadow-lg)", zIndex: 111 }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center" }}>
          <div style={{ flex: 1, font: "600 15px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>
            {phase === "idle" ? `Rotate ${ready.length} credential${ready.length !== 1 ? "s" : ""}` : phase === "progress" ? "Rotating credentials…" : "Rotation complete"}
          </div>
          {phase !== "progress" && <button className="btn btn-ghost btn-icon" onClick={onClose}><Icon name="x" size={14}/></button>}
        </div>

        <div className="scroll-area" style={{ flex: 1, overflow: "auto", padding: 20 }}>
          {phase === "idle" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ font: "400 12.5px/1.5 var(--font-sans)", color: "var(--fg-2)" }}>The following credentials will be rotated immediately:</div>
              <div style={{ border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
                {creds.map(c => (
                  <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderBottom: "1px solid var(--border-subtle)", opacity: c.adminAcct ? 1 : 0.55 }}>
                    <span style={{ flex: 1, font: "500 12.5px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{c.display}</span>
                    <CRED_TYPE_BADGE type={c.type}/>
                    {c.adminAcct ? <span className="t-tiny" style={{ color: "var(--fg-3)" }}>{c.adminAcct}</span>
                      : <span style={{ font: "500 11px/1.5 var(--font-sans)", color: "var(--warning-fg)", background: "var(--warning-soft)", padding: "2px 8px", borderRadius: 999 }}>⚠ No admin account — will skip</span>}
                  </div>
                ))}
              </div>
              <div style={{ font: "500 12px/1.5 var(--font-sans)", color: "var(--fg-3)" }}>Ready to rotate: <strong style={{ color: "var(--success-fg)" }}>{ready.length}</strong> · Will be skipped: <strong style={{ color: "var(--warning-fg)" }}>{skipped.length}</strong></div>
              <Toggle value={validate} onChange={setValidate} label="Post-rotation validation" hint="Test each credential after rotation."/>
              <Field label="Reason for rotation" required>
                <input className="input" value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Monthly security rotation, post-incident"/>
              </Field>
            </div>
          )}

          {phase !== "idle" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {ready.map(c => {
                const st = statuses[c.id];
                return (
                  <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 4px", font: "400 13px/1.4 var(--font-sans)" }}>
                    <span style={{ width: 16, textAlign: "center" }}>{st === "success" ? "✓" : st === "failed" ? "✗" : st === "rotating" ? <Spinner size={12}/> : "◌"}</span>
                    <span style={{ flex: 1, color: "var(--fg-1)" }}>{c.display}</span>
                    <span style={{ font: "500 12px/1 var(--font-sans)", color: st === "success" ? "var(--success-fg)" : st === "failed" ? "var(--danger-fg)" : "var(--fg-4)" }}>
                      {st === "success" ? "Rotated" : st === "failed" ? "Failed: Auth rejected" : st === "rotating" ? "Rotating…" : "Queued"}
                    </span>
                  </div>
                );
              })}
              {phase === "complete" && (
                <div style={{ marginTop: 12, padding: 12, background: "var(--bg-surface-2)", borderRadius: 8, font: "500 12.5px/1.5 var(--font-sans)", color: "var(--fg-2)" }}>
                  {succeeded} rotated successfully · {failedN} failed · {skipped.length} skipped
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 8, justifyContent: "flex-end", background: "var(--bg-surface)" }}>
          {phase === "idle" && <>
            <button className="btn" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" disabled={!reason.trim() || ready.length === 0} style={{ background: "var(--success)", borderColor: "var(--success)" }} onClick={start}><Icon name="refresh" size={12}/> Rotate {ready.length} credential{ready.length !== 1 ? "s" : ""}</button>
          </>}
          {phase === "complete" && <button className="btn btn-primary" onClick={() => { onDone && onDone(); onClose(); }}>Close</button>}
        </div>
      </div>
    </>
  );
};

Object.assign(window, { AssignOwnerModal, DeleteCredModal, ExportModal, AssignPolicyModal, BulkRotateModal });
