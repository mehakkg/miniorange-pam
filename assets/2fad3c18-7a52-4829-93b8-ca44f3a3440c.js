// Credentials — Detail panel + Rotate Now modal + Drift reconciliation panel

// =========================================================
// CREDENTIAL DETAIL PANEL — 5 vertical sections
// =========================================================
const CredentialDetailPanel = ({ credId, startEdit, onClose, onRotate, onDrift, onHistory, onAssignOwner, onDelete }) => {
  const creds = window.useCreds();
  const c = creds.find(x => x.id === credId);
  const [editing, setEditing] = React.useState(!!startEdit);
  const [form, setForm] = React.useState({ display: "", username: "", sensitivity: "Medium", owner: "", tags: [], notes: "" });
  const [changePwd, setChangePwd] = React.useState(false);
  const [newPwd, setNewPwd] = React.useState("");
  const [newTag, setNewTag] = React.useState("");
  const [testing, setTesting] = React.useState(false);
  const [testResults, setTestResults] = React.useState(null);
  const [linking, setLinking] = React.useState(false);
  const [exportOpen, setExportOpen] = React.useState(false);
  const [editPolicy, setEditPolicy] = React.useState(false);
  const [unlinkTarget, setUnlinkTarget] = React.useState(null);
  React.useEffect(() => {
    setEditing(!!startEdit);
    if (c) setForm({ display: c.display, username: c.username, sensitivity: c.sensitivity, owner: c.owner || "", tags: c.tags.slice(), notes: "" });
    setTestResults(null); setChangePwd(false); setNewPwd("");
  }, [credId, startEdit]);
  if (!c) return null;

  const allResources = window.SEED_RESOURCES || [];
  const linkable = allResources.filter(r => !c.resources.includes(r.name));
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const runTest = () => {
    setTesting(true); setTestResults(null);
    setTimeout(() => {
      setTesting(false);
      if (c.resources.length === 0) { setTestResults([]); return; }
      setTestResults(c.resources.map((rn, i) => {
        const fail = c.rotation === "failed" && i === 0;
        return { name: rn, ok: !fail, reason: fail ? "Authentication failed — account locked on target. Unlock the account in Active Directory or on the server directly." : "Authentication successful", ms: fail ? null : 120 + i * 22 };
      }));
    }, 1600);
  };
  const saveEdit = () => {
    if (!form.display.trim()) { window.pamToast("Display Name is required", "error"); return; }
    window.credStore.update(c.id, { display: form.display.trim(), username: form.username, sensitivity: form.sensitivity, owner: form.owner || null, tags: form.tags });
    setEditing(false); setChangePwd(false);
    window.pamToast(newPwd ? "Credential updated — password changed" : "Credential updated");
    setNewPwd("");
  };
  const linkResource = (name) => { window.credStore.update(c.id, { resources: [...c.resources, name] }); setLinking(false); window.pamToast(`${name} linked to ${c.display}`); };
  const doUnlink = () => { window.credStore.update(c.id, { resources: c.resources.filter(r => r !== unlinkTarget) }); window.pamToast(`${unlinkTarget} unlinked from ${c.display}`); setUnlinkTarget(null); };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.18)", zIndex: 40 }}/>
      <aside style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 520, background: "var(--bg-app)", borderLeft: "1px solid var(--border)", zIndex: 41, display: "flex", flexDirection: "column", boxShadow: "var(--shadow-lg)" }}>
        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "flex-start", gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {editing ? (
              <div style={{ font: "600 13px/1.3 var(--font-sans)", color: "var(--brand-fg)" }}>Editing — {c.display}</div>
            ) : (
              <h2 style={{ font: "600 17px/1.3 var(--font-sans)", color: "var(--fg-1)", margin: 0 }}>{c.display}</h2>
            )}
            <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              <CRED_TYPE_BADGE type={c.type}/>
              <SensitivityBadge level={c.sensitivity}/>
              {c.nonViewable && <span title="Non-viewable" style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: 999, background: "var(--bg-surface-2)", color: "var(--fg-3)", font: "500 11px/1.5 var(--font-sans)" }}>🔒 Non-viewable</span>}
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><RotationDot status={c.rotation}/><span style={{ font: "500 12px/1 var(--font-sans)", color: "var(--fg-2)" }}>{c.rotation === "healthy" ? "Healthy" : c.rotation === "overdue" ? "Overdue" : c.rotation === "failed" ? "Failed" : c.rotation === "drifted" ? "Drifted" : "No policy"}</span></span>
            </div>
          </div>
          {editing ? (
            <div style={{ display: "flex", gap: 6 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => { setEditing(false); setChangePwd(false); }}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={saveEdit}>Save changes</button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 6 }}>
              <button className="btn btn-ghost btn-icon" title="Edit" onClick={() => setEditing(true)}><Icon name="edit" size={13}/></button>
              <button className="btn btn-ghost btn-icon" onClick={onClose}><Icon name="x" size={14}/></button>
            </div>
          )}
        </div>

        <div className="scroll-area" style={{ flex: 1, overflow: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 22 }}>
          <DetailSection title="Identity">
            {editing ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <Field label="Display name" required><input className="input" value={form.display} onChange={e => setF("display", e.target.value)}/></Field>
                {c.type !== "App Secret" && <Field label="Username"><input className="input" value={form.username === "—" ? "" : form.username} onChange={e => setF("username", e.target.value)}/></Field>}
                {c.type === "Password" && (
                  <div>
                    {!changePwd ? <button className="btn btn-sm" onClick={() => setChangePwd(true)}><Icon name="key" size={11}/> Change password</button>
                      : <Field label="New password" hint="The current password is never shown."><input className="input" type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="Enter new password"/></Field>}
                  </div>
                )}
                <DetailRow k="Type">{c.type} <span style={{ color: "var(--fg-4)", fontSize: 11 }}>🔒 locked</span></DetailRow>
                <DetailRow k="Source">{c.source} <span style={{ color: "var(--fg-4)", fontSize: 11 }}>🔒 locked</span></DetailRow>
              </div>
            ) : (
              <>
                <DetailRow k="Username">{c.username === "—" ? <span style={{ color: "var(--fg-4)" }}>—</span> : <MaskedField value={c.username}/>}</DetailRow>
                <DetailRow k="Type">{c.type}</DetailRow>
                <DetailRow k="Source">{c.source}</DetailRow>
                <DetailRow k="Created">{c.created}</DetailRow>
                <DetailRow k="Mark as complete">{c.complete ? <span style={{ color: "var(--success-fg)" }}>✓ Complete</span> : <span style={{ color: "var(--warning-fg)" }}>Incomplete</span>}</DetailRow>
                <DetailRow k="Owner">{c.owner ? <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>{c.owner}<button className="btn btn-ghost btn-sm" style={{ padding: "0 6px", color: "var(--brand-fg)" }} onClick={() => onAssignOwner && onAssignOwner(c)}>Change</button></span> : <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><span style={{ color: "var(--fg-4)" }}>Unassigned</span><button className="btn btn-ghost btn-sm" style={{ padding: "0 6px", color: "var(--brand-fg)" }} onClick={() => onAssignOwner && onAssignOwner(c)}>Assign</button></span>}</DetailRow>
              </>
            )}
          </DetailSection>

          <DetailSection title={`Resources (${c.resources.length} linked)`}>
            {c.resources.length === 0 ? (
              <div style={{ padding: 12, background: "var(--warning-soft)", borderRadius: 4, font: "400 12.5px/1.5 var(--font-sans)", color: "var(--warning-fg)" }}>⚠ Not linked to any resource. This credential cannot be used for session access.</div>
            ) : (
              <table className="table" style={{ border: "1px solid var(--border)", borderRadius: 6, overflow: "hidden" }}>
                <thead><tr><th>Resource</th><th>Env</th><th>Test</th><th></th></tr></thead>
                <tbody>
                  {c.resources.map(rn => {
                    const r = (window.SEED_RESOURCES || []).find(x => x.name === rn) || { name: rn, env: "production" };
                    const res = testResults && testResults.find(t => t.name === rn);
                    return (
                      <tr key={rn}>
                        <td><div className="row"><Icon name={r.type === "database" ? "database" : "server"} size={12} color="var(--fg-3)"/><span className="t-mono" style={{ fontSize: 12, color: "var(--fg-1)", fontWeight: 500 }}>{r.name}</span></div></td>
                        <td><span className="badge" style={{ textTransform: "capitalize" }}>{r.env}</span></td>
                        <td>{res ? (res.ok ? <span style={{ color: "var(--success-fg)", fontSize: 11.5 }}>✓ {res.ms}ms</span> : <span style={{ color: "var(--danger-fg)", fontSize: 11.5 }} title={res.reason}>✗ Failed</span>) : <span style={{ color: "var(--fg-4)" }}>—</span>}</td>
                        <td style={{ textAlign: "right" }}><button className="btn btn-ghost btn-sm" onClick={() => setUnlinkTarget(rn)}>Unlink</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
            {testResults && testResults.some(r => !r.ok) && (
              <div style={{ marginTop: 10, padding: 10, background: "var(--danger-soft)", borderRadius: 6, font: "400 12px/1.5 var(--font-sans)", color: "var(--danger-fg)" }}>
                {testResults.filter(r => !r.ok).map(r => <div key={r.name}><strong>{r.name}:</strong> {r.reason}</div>)}
              </div>
            )}
            {!linking ? (
              <button className="btn btn-sm" style={{ marginTop: 10 }} onClick={() => setLinking(true)}><Icon name="plus" size={11}/> Link resource</button>
            ) : (
              <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                <Select value="" onChange={v => v && linkResource(v)} options={[["", "Search resources…"], ...linkable.map(r => [r.name, `${r.name} — ${r.host || ""} — ${r.env}`])]}/>
                <button className="btn btn-ghost btn-sm" onClick={() => setLinking(false)}>Cancel</button>
              </div>
            )}
          </DetailSection>

          <DetailSection title="Rotation">
            {c.rotation === "drifted" && (
              <div style={{ marginBottom: 12, padding: 12, background: "var(--warning-soft)", borderRadius: 6, display: "flex", gap: 10, alignItems: "flex-start" }}>
                <Icon name="alert-circle" size={14} color="var(--warning-fg)"/>
                <div style={{ flex: 1, font: "400 12.5px/1.5 var(--font-sans)", color: "var(--warning-fg)" }}>
                  <strong>Drift detected.</strong> {c.driftReason || "Vault password no longer matches target."}
                </div>
                <button className="btn btn-sm" onClick={() => onDrift && onDrift(c.id)}>Reconcile</button>
              </div>
            )}
            {c.rotation === "failed" && c.failReason && (
              <div style={{ marginBottom: 12, padding: 12, background: "var(--danger-soft)", borderRadius: 6, display: "flex", gap: 10, alignItems: "flex-start" }}>
                <Icon name="alert-circle" size={14} color="var(--danger-fg)"/>
                <div style={{ flex: 1, font: "400 12.5px/1.5 var(--font-sans)", color: "var(--danger-fg)" }}>
                  <strong>Last rotation failed.</strong> {c.failReason}
                </div>
              </div>
            )}
            <DetailRow k="Policy">{c.policy || <span style={{ color: "var(--fg-4)" }}>None</span>}</DetailRow>
            <DetailRow k="Rotation type">{c.policy ? "Schedule" : "—"}</DetailRow>
            <DetailRow k="Interval">{c.policy === "Prod-Daily-Rotation" ? "24 hours" : c.policy === "SSH-Weekly-Maintenance-Window" ? "7 days" : c.policy === "DB-Post-Use" ? "After every use" : "—"}</DetailRow>
            <DetailRow k="Admin account">{c.adminAcct || <span style={{ color: "var(--fg-4)" }}>Not set</span>}</DetailRow>
            <DetailRow k="Last rotated">{c.lastRotated} {c.policy && <span style={{ color: "var(--fg-4)" }}>by PAM (automated)</span>}</DetailRow>
            <DetailRow k="Last result">{c.rotation === "healthy" ? <span style={{ color: "var(--success-fg)" }}>✓ Success — new password tested</span> : c.rotation === "failed" ? <span style={{ color: "var(--danger-fg)" }}>✗ Failed</span> : c.rotation === "drifted" ? <span style={{ color: "var(--warning-fg)" }}>Drift</span> : "—"}</DetailRow>
            <DetailRow k="Next scheduled">{c.rotation === "healthy" ? "In 21 hours" : c.rotation === "overdue" ? <span style={{ color: "var(--danger-fg)" }}>Overdue by 2 days</span> : "—"}</DetailRow>
            <DetailRow k="Post-rotation validation">{c.policy ? <span style={{ color: "var(--success-fg)" }}>Enabled</span> : <span style={{ color: "var(--fg-4)" }}>—</span>}</DetailRow>

            <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
              <button className="btn btn-primary btn-sm" disabled={!c.adminAcct} title={c.adminAcct ? "" : "No admin account set — configure reconciliation first"} onClick={() => onRotate(c.id)}><Icon name="refresh" size={11}/> Rotate now</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditPolicy(true)}>Edit policy</button>
              <button className="btn btn-ghost btn-sm" style={{ color: "var(--brand-fg)" }} onClick={() => onHistory && onHistory(c.id)}>View history →</button>
            </div>
          </DetailSection>

          <DetailSection title="Classification">
            {editing ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <Field label="Sensitivity"><Segmented value={form.sensitivity} onChange={v => setF("sensitivity", v)} options={[{ value: "Critical", label: "Critical" }, { value: "High", label: "High" }, { value: "Medium", label: "Medium" }, { value: "Low", label: "Low" }]}/></Field>
                <Field label="Owner"><Select value={form.owner} onChange={v => setF("owner", v)} options={[["", "Unassigned"], ["Arjun Bansal", "Arjun Bansal"], ["Priya Nair", "Priya Nair"], ["Rohan Mehta", "Rohan Mehta"], ["Security Team", "Security Team"]]}/></Field>
                <Field label="Tags">
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: 8, border: "1px solid var(--border)", borderRadius: 6 }}>
                    {form.tags.map(t => <Tag key={t} onRemove={() => setF("tags", form.tags.filter(x => x !== t))}>{t}</Tag>)}
                    <input value={newTag} onChange={e => setNewTag(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); if (newTag.trim() && !form.tags.includes(newTag.trim())) { setF("tags", [...form.tags, newTag.trim()]); setNewTag(""); } } }} placeholder="Add tag…" style={{ flex: 1, minWidth: 100, border: "none", outline: "none", background: "transparent", font: "400 12.5px/1 var(--font-sans)", color: "var(--fg-1)" }}/>
                  </div>
                </Field>
                <Field label="Notes"><textarea className="input" rows={2} value={form.notes} onChange={e => setF("notes", e.target.value)} placeholder="Optional"/></Field>
              </div>
            ) : (
              <>
                <DetailRow k="Sensitivity"><SensitivityBadge level={c.sensitivity}/></DetailRow>
                <DetailRow k="Tags">
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>{c.tags.length === 0 ? <span style={{ color: "var(--fg-4)" }}>None</span> : c.tags.map(t => <Tag key={t}>{t}</Tag>)}</div>
                </DetailRow>
                <DetailRow k="Notes"><span style={{ color: "var(--fg-4)" }}>—</span></DetailRow>
              </>
            )}
          </DetailSection>

          <DetailSection title="Activity">
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {[
                { ts: "Today 14:08 IST", txt: "Rotation succeeded — new password tested ✓", icon: "check" },
                { ts: "3 days ago 11:22", txt: `Linked to ${c.resources[0] || "—"} by Arjun Bansal`, icon: "link" },
                { ts: "1 week ago",       txt: c.rotation === "failed" ? "Rotation failed — Authentication rejected. Retried 3×" : "Rotation succeeded — new password tested ✓", icon: c.rotation === "failed" ? "x" : "check" },
                { ts: c.created,         txt: "Credential created by Arjun Bansal", icon: "plus" },
              ].map((ev, i, arr) => (
                <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0", position: "relative" }}>
                  {i < arr.length - 1 && <div style={{ position: "absolute", left: 9, top: 24, bottom: -8, width: 1, background: "var(--border)" }}/>}
                  <div style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--bg-surface-2)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none", zIndex: 1 }}>
                    <Icon name={ev.icon} size={10} color="var(--fg-3)"/>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ font: "500 12px/1.4 var(--font-sans)", color: "var(--fg-1)" }}>{ev.txt}</div>
                    <div style={{ font: "400 11px/1 var(--font-sans)", color: "var(--fg-4)", marginTop: 2 }}>{ev.ts}</div>
                  </div>
                </div>
              ))}
            </div>
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 10, color: "var(--brand-fg)", padding: 0 }} onClick={() => onHistory && onHistory(c.id)}>View full audit trail →</button>
          </DetailSection>
        </div>

        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 8, background: "var(--bg-surface)", alignItems: "center", position: "relative" }}>
          <button className="btn" onClick={runTest} disabled={testing}>{testing ? <Spinner size={12}/> : <Icon name="check-circle" size={12}/>} {testing ? "Testing…" : "Test credential"}</button>
          <button className="btn" onClick={() => setExportOpen(true)}><Icon name="download" size={12}/> Export</button>
          <div style={{ flex: 1 }}/>
          <button className="btn btn-ghost" style={{ color: "var(--danger-fg)" }} onClick={() => onDelete && onDelete(c)}><Icon name="trash" size={12}/> Delete</button>
        </div>
      </aside>

      {exportOpen && <ExportModal title={`Export — ${c.display}`} onClose={() => setExportOpen(false)} onExport={(fmt) => window.pamToast("Credential exported")}/>}
      {unlinkTarget && <ConfirmModal title={`Unlink ${unlinkTarget} from ${c.display}?`} body={`Sessions on ${unlinkTarget} using this credential will fail until a new credential is linked.`} confirmLabel="Unlink" onConfirm={doUnlink} onClose={() => setUnlinkTarget(null)}/>}
      {editPolicy && <EditRotationPanel cred={c} onClose={() => setEditPolicy(false)} onSave={(patch) => { window.credStore.update(c.id, patch); setEditPolicy(false); window.pamToast("Rotation policy updated"); }}/>}
    </>
  );
};

// Edit rotation — layered panel over the credential detail
const EditRotationPanel = ({ cred, onClose, onSave }) => {
  const adminAccts = (window.RECON_CREDS || []).map(c => [c.display, c.display]);
  const [adminAcct, setAdminAcct] = React.useState(cred.adminAcct || "");
  const [policy, setPolicy] = React.useState(cred.policy || "");
  const [rotType, setRotType] = React.useState("Schedule");
  const [validate, setValidate] = React.useState(true);
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.25)", zIndex: 48 }}/>
      <aside style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 480, background: "var(--bg-app)", borderLeft: "1px solid var(--border)", zIndex: 49, display: "flex", flexDirection: "column", boxShadow: "var(--shadow-lg)" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center" }}>
          <div style={{ flex: 1, font: "600 15px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>Edit rotation — {cred.display}</div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><Icon name="x" size={14}/></button>
        </div>
        <div className="scroll-area" style={{ flex: 1, overflow: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
          <Field label="Admin account" hint="PAM uses this account to reset the password on the target."><Select value={adminAcct} onChange={setAdminAcct} options={[["", "Select admin account…"], ...adminAccts]}/></Field>
          <Field label="Rotation policy"><Select value={policy} onChange={setPolicy} options={[["", "No policy"], ...(window.ROTATION_POLICIES || []).map(p => [p.name, `${p.name} — ${p.interval}`])]}/></Field>
          <Field label="Rotation type"><Segmented value={rotType} onChange={setRotType} options={[{ value: "Schedule", label: "Schedule" }, { value: "After Every Use", label: "After use" }, { value: "On Checkout", label: "On checkout" }]}/></Field>
          <Toggle value={validate} onChange={setValidate} label="Post-rotation validation" hint="Test the new password against the target after each rotation."/>
        </div>
        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 8, justifyContent: "flex-end", background: "var(--bg-surface)" }}>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onSave({ adminAcct: adminAcct || null, policy: policy || null, rotation: policy ? (cred.rotation === "no-policy" ? "healthy" : cred.rotation) : "no-policy" })}>Save rotation settings</button>
        </div>
      </aside>
    </>
  );
};

const DetailSection = ({ title, children }) => (
  <div>
    <div style={{ font: "600 10.5px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 10 }}>{title}</div>
    {children}
  </div>
);

const DetailRow = ({ k, children }) => (
  <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 12, padding: "5px 0", alignItems: "center" }}>
    <span style={{ font: "400 12px/1.5 var(--font-sans)", color: "var(--fg-4)" }}>{k}</span>
    <span style={{ font: "400 12.5px/1.5 var(--font-sans)", color: "var(--fg-1)" }}>{children}</span>
  </div>
);

// =========================================================
// ROTATE NOW MODAL — 4 states
// =========================================================
const RotateNowModal = ({ credId, onClose, onComplete }) => {
  const c = (window.CREDS || []).find(x => x.id === credId) || {};
  const [phase, setPhase] = React.useState("idle"); // idle | progress | success | failed
  const [reason, setReason] = React.useState("");
  const [validate, setValidate] = React.useState(true);
  const [stepDone, setStepDone] = React.useState(0);
  const willFail = c.rotation === "failed" || c.id === "c-003";

  const start = () => {
    setPhase("progress");
    setStepDone(0);
    const steps = [400, 700, 1000, 800, 600];
    steps.forEach((d, i) => setTimeout(() => {
      setStepDone(i + 1);
      if (i === steps.length - 1) setTimeout(() => { const ok = !willFail; setPhase(ok ? "success" : "failed"); if (ok && onComplete) onComplete(credId); }, 350);
    }, steps.slice(0, i + 1).reduce((a, b) => a + b, 0)));
  };

  return (
    <>
      <div onClick={phase === "progress" ? null : onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.4)", zIndex: 60 }}/>
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 540, maxWidth: "92vw", background: "var(--bg-app)", border: "1px solid var(--border)", borderRadius: 10, boxShadow: "var(--shadow-lg)", zIndex: 61 }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ font: "600 15px/1.3 var(--font-sans)", color: "var(--fg-1)", flex: 1 }}>
            {phase === "idle" ? `Rotate ${c.display}` :
             phase === "progress" ? "Rotating…" :
             phase === "success" ? "Rotation complete" :
             "Rotation failed"}
          </div>
          {phase !== "progress" && <button className="btn btn-ghost btn-icon" onClick={onClose}><Icon name="x" size={14}/></button>}
        </div>

        {phase === "idle" && (
          <>
            <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="card" style={{ padding: 12, background: "var(--bg-surface-2)" }}>
                <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 8, font: "400 12.5px/1.5 var(--font-sans)" }}>
                  <span style={{ color: "var(--fg-4)" }}>Credential</span>
                  <span style={{ color: "var(--fg-1)" }}>{c.display}</span>
                  <span style={{ color: "var(--fg-4)" }}>Type</span>
                  <span><CRED_TYPE_BADGE type={c.type}/></span>
                  <span style={{ color: "var(--fg-4)" }}>Linked resources</span>
                  <span style={{ color: "var(--fg-1)" }}>{c.resources.length} resources</span>
                </div>
              </div>

              <Field label="Admin account">
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input className="input" value={c.adminAcct || "Not set"} disabled style={{ flex: 1, background: "var(--bg-surface-2)" }}/>
                  <button className="btn btn-ghost btn-sm" style={{ color: "var(--brand-fg)" }}>Change</button>
                </div>
              </Field>

              <Toggle value={validate} onChange={setValidate} label="Test new password after rotation" hint="PAM will validate the new credentials against the target system before marking the rotation as successful."/>

              <Field label="Reason for manual rotation" required>
                <textarea className="input" rows={2} value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Post-incident rotation, suspected compromise, scheduled audit"/>
              </Field>

              {c.id === "c-001" && (
                <div style={{ padding: 12, background: "var(--warning-soft)", borderRadius: 4, font: "400 12.5px/1.5 var(--font-sans)", color: "var(--warning-fg)" }}>
                  ⚠ This credential is currently in use in 1 active session. Rotating now will terminate that session.<br/>
                  <a href="#" style={{ color: "var(--warning-fg)", fontWeight: 500, textDecoration: "underline" }}>View active sessions →</a>
                </div>
              )}
            </div>
            <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 8, justifyContent: "flex-end", background: "var(--bg-surface)" }}>
              <button className="btn" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" disabled={!reason.trim()} onClick={start}><Icon name="refresh" size={12}/> Start rotation</button>
            </div>
          </>
        )}

        {phase === "progress" && (
          <div style={{ padding: 24 }}>
            <div style={{ height: 4, background: "var(--bg-surface-2)", borderRadius: 999, overflow: "hidden", marginBottom: 18 }}>
              <div style={{ width: `${(stepDone / 5) * 100}%`, height: "100%", background: "var(--brand)", transition: "width 200ms ease" }}/>
            </div>
            {["Generating new password","Connecting to target via Admin Account","Updating password on target system","Updating vault","Validating new credentials"].map((label, i) => (
              <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0", font: "400 13px/1.4 var(--font-sans)", color: stepDone > i ? "var(--success-fg)" : stepDone === i ? "var(--fg-1)" : "var(--fg-4)" }}>
                <span style={{ width: 16, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                  {stepDone > i ? "✓" : stepDone === i ? <Spinner size={12}/> : "○"}
                </span>
                {label}
              </div>
            ))}
          </div>
        )}

        {phase === "success" && (
          <>
            <div style={{ padding: 24, textAlign: "center" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--success-soft)", color: "var(--success-fg)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                <Icon name="check" size={28}/>
              </div>
              <div style={{ font: "600 16px/1.3 var(--font-sans)", color: "var(--fg-1)", marginBottom: 6 }}>Rotation complete</div>
              <div className="card" style={{ marginTop: 16, padding: 12, background: "var(--bg-surface-2)", textAlign: "left" }}>
                <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 6, font: "400 12.5px/1.5 var(--font-sans)" }}>
                  <span style={{ color: "var(--fg-4)" }}>New password set on</span><span style={{ color: "var(--fg-1)" }}>{c.resources.join(", ") || "—"}</span>
                  <span style={{ color: "var(--fg-4)" }}>Validation</span><span style={{ color: validate ? "var(--success-fg)" : "var(--fg-4)" }}>{validate ? "✓ New password tested successfully" : "Validation not confirmed — enable post-rotation validation to verify automatically"}</span>
                  <span style={{ color: "var(--fg-4)" }}>Duration</span><span style={{ color: "var(--fg-1)" }}>3.4 s</span>
                </div>
              </div>
            </div>
            <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", textAlign: "right", background: "var(--bg-surface)" }}>
              <button className="btn btn-primary" onClick={onClose}>Close</button>
            </div>
          </>
        )}

        {phase === "failed" && (
          <>
            <div style={{ padding: 24 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--danger-soft)", color: "var(--danger-fg)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                  <Icon name="x" size={18}/>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ font: "600 15px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>Rotation failed</div>
                  <div style={{ font: "400 12.5px/1.5 var(--font-sans)", color: "var(--fg-3)", marginTop: 4 }}>Step that failed: <strong style={{ color: "var(--fg-2)" }}>Updating password on target system</strong></div>
                </div>
              </div>
              <div style={{ padding: 12, background: "var(--danger-soft)", borderRadius: 6, font: "400 12.5px/1.5 var(--font-sans)", color: "var(--danger-fg)", marginBottom: 12 }}>
                <strong>Reason: </strong>Authentication rejected — account 'backup-admin' is locked on 10.0.1.89. Unlock the account and retry.
              </div>
              <div style={{ font: "400 12.5px/1.5 var(--font-sans)", color: "var(--fg-3)", marginBottom: 12 }}>Retried <strong>3 times</strong> before giving up.</div>
              <div style={{ padding: 10, background: "var(--bg-surface-2)", borderRadius: 4, font: "400 12.5px/1.5 var(--font-sans)", color: "var(--fg-2)" }}>
                <strong>Suggested fix: </strong>Verify <span className="t-mono" style={{ font: "500 12px var(--font-mono)" }}>{c.adminAcct}</span> has password reset privileges on the target. Check the account is not locked.
              </div>
            </div>
            <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 8, justifyContent: "flex-end", background: "var(--bg-surface)" }}>
              <button className="btn" onClick={onClose}>Close</button>
              <button className="btn">Change admin account</button>
              <button className="btn btn-primary" onClick={start}>Retry</button>
            </div>
          </>
        )}
      </div>
    </>
  );
};

// =========================================================
// DRIFT DETECTION & RECONCILIATION PANEL
// =========================================================
const DriftPanel = ({ credId, onClose }) => {
  const c = (window.CREDS || []).find(x => x.id === credId) || {};
  const [chosen, setChosen] = React.useState(null);   // "auto" | "manual" | "investigate"
  const [manualPwd, setManualPwd] = React.useState("");
  const [result, setResult] = React.useState(null);   // null | "success" | "failed"
  const [running, setRunning] = React.useState(false);

  const start = (option) => {
    setChosen(option);
    if (option === "auto") {
      setRunning(true);
      setTimeout(() => { setRunning(false); setResult("success"); }, 1600);
    }
  };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.2)", zIndex: 40 }}/>
      <aside style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 540, background: "var(--bg-app)", borderLeft: "1px solid var(--border)", zIndex: 41, display: "flex", flexDirection: "column", boxShadow: "var(--shadow-lg)" }}>
        <div style={{ padding: "14px 20px", background: "var(--warning-soft)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
          <Icon name="alert-circle" size={16} color="var(--warning-fg)"/>
          <div style={{ flex: 1, font: "600 14.5px/1.3 var(--font-sans)", color: "var(--warning-fg)" }}>Credential drift detected — {c.display}</div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><Icon name="x" size={14}/></button>
        </div>

        <div className="scroll-area" style={{ flex: 1, overflow: "auto", padding: 20 }}>
          <div style={{ font: "400 13px/1.5 var(--font-sans)", color: "var(--fg-2)", marginBottom: 16 }}>
            PAM detected that the password for <strong>{c.display}</strong> on <strong>{c.resources[0]}</strong> no longer matches what's stored in the vault. This usually means the password was changed outside of PAM.
          </div>

          <div className="card" style={{ padding: 14, background: "var(--bg-surface-2)", marginBottom: 20 }}>
            <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 6, font: "400 12.5px/1.5 var(--font-sans)" }}>
              <span style={{ color: "var(--fg-4)" }}>Detected</span><span style={{ color: "var(--fg-1)" }}>Today 09:42 IST</span>
              <span style={{ color: "var(--fg-4)" }}>Linked resource</span><span className="t-mono" style={{ color: "var(--fg-1)" }}>{c.resources[0]} (10.0.1.89)</span>
              <span style={{ color: "var(--fg-4)" }}>Last successful auth</span><span style={{ color: "var(--fg-1)" }}>4 days ago</span>
              <span style={{ color: "var(--fg-4)" }}>Attempts since drift</span><span style={{ color: "var(--danger-fg)" }}>7 failed attempts</span>
            </div>
          </div>

          {!result && (
            <>
              <div style={{ font: "600 10.5px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 10 }}>Recovery options</div>

              <RecoveryCard
                active={chosen === "auto"}
                icon="refresh"
                title="Auto-reconcile"
                desc={`Let PAM fix this automatically. PAM will use ${c.adminAcct || "the reconciliation credential"} to update the vault with the new password or reset the password on the target.`}
                running={running && chosen === "auto"}
                cta="Start reconciliation"
                onClick={() => start("auto")}
              />

              <RecoveryCard
                active={chosen === "manual"}
                icon="key"
                title="Manual update"
                desc="You know the current password. Enter it so PAM can update the vault and re-establish sync."
                cta="Update password manually"
                onClick={() => setChosen("manual")}
              >
                {chosen === "manual" && (
                  <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                    <input className="input" type="password" value={manualPwd} onChange={e => setManualPwd(e.target.value)} placeholder="Current password" style={{ flex: 1 }}/>
                    <button className="btn btn-primary btn-sm" disabled={!manualPwd} onClick={() => { setRunning(true); setTimeout(() => { setRunning(false); setResult("success"); }, 1200); }}>{running ? <Spinner size={11}/> : null} Update vault</button>
                  </div>
                )}
              </RecoveryCard>

              <RecoveryCard
                active={chosen === "investigate"}
                icon="search"
                title="Investigate first"
                desc="Check what changed before recovering. Review the audit trail and recent access events before taking action."
                cta="View audit trail"
                onClick={() => start("investigate")}
              />
            </>
          )}

          {result === "success" && (
            <div style={{ padding: 16, background: "var(--success-soft)", color: "var(--success-fg)", borderRadius: 8, display: "flex", gap: 12, alignItems: "flex-start" }}>
              <Icon name="check" size={20}/>
              <div>
                <div style={{ font: "600 14px/1.3 var(--font-sans)", marginBottom: 4 }}>Vault updated and credential validated</div>
                <div style={{ font: "400 12.5px/1.5 var(--font-sans)" }}>Drift resolved. {c.display} is back in sync with {c.resources[0]}.</div>
              </div>
            </div>
          )}
        </div>

        {result && (
          <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", textAlign: "right", background: "var(--bg-surface)" }}>
            <button className="btn btn-primary" onClick={onClose}>Close</button>
          </div>
        )}
      </aside>
    </>
  );
};

const RecoveryCard = ({ active, icon, title, desc, cta, onClick, running, children }) => (
  <div style={{
    padding: 14, border: `1px solid ${active ? "var(--brand)" : "var(--border)"}`,
    background: active ? "var(--brand-soft)" : "var(--bg-surface)",
    borderRadius: 8, marginBottom: 8, cursor: "pointer",
  }} onClick={!active ? onClick : null}>
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
      <div style={{ width: 32, height: 32, borderRadius: 6, background: "var(--bg-surface-2)", color: "var(--fg-2)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
        <Icon name={icon} size={14}/>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ font: "600 13.5px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{title}</div>
        <div style={{ font: "400 12.5px/1.5 var(--font-sans)", color: "var(--fg-3)", marginTop: 3 }}>{desc}</div>
        {!active && <button className="btn btn-primary btn-sm" style={{ marginTop: 10 }} onClick={onClick}>{cta}</button>}
        {active && running && <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center", font: "500 12px/1 var(--font-sans)", color: "var(--brand-fg)" }}><Spinner size={12}/> Reconciling…</div>}
        {children}
      </div>
    </div>
  </div>
);

Object.assign(window, { CredentialDetailPanel, RotateNowModal, DriftPanel });
