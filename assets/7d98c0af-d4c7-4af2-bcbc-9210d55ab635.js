// Credentials — Audit Trail panel + SSH Key / App Secret / Reconciliation detail panels

// =========================================================
// CREDENTIAL AUDIT TRAIL PANEL — All events + Rotation history
// =========================================================
const CredAuditTrailPanel = ({ credId, initialTab = "events", onClose, onBack }) => {
  const c = window.credStore.find(credId) || (window.CREDS || []).find(x => x.id === credId);
  const [tab, setTab] = React.useState(initialTab);
  const [typeFilter, setTypeFilter] = React.useState("All");
  const [expanded, setExpanded] = React.useState(null);
  if (!c) return null;

  const events = [
    { type: "Rotated", icon: "🔄", desc: "Rotation triggered by PAM (scheduled)", actor: "PAM", ts: "Today 14:08 IST" },
    { type: "Rotated", icon: c.rotation === "failed" ? "✗" : "✓", desc: c.rotation === "failed" ? `Rotation failed — ${c.failReason || "Auth rejected"} · Retried 3 times` : "Rotation succeeded — new password tested successfully · 4.2s", actor: "PAM", ts: "Today 14:08 IST" },
    { type: "Tested", icon: "🧪", desc: `Test credential run — ✓ Passed on all ${c.resources.length} resources`, actor: "Arjun Bansal", ts: "Yesterday 16:30 IST" },
    { type: "Linked", icon: "🔗", desc: `${c.resources[0] || "resource"} linked`, actor: "Arjun Bansal", ts: "3 days ago" },
    { type: "Edited", icon: "✏️", desc: "Sensitivity changed from High to Critical", actor: "Priya Nair", ts: "1 week ago" },
    { type: "Created", icon: "🔐", desc: "Credential created", actor: "Arjun Bansal", ts: c.created },
  ];
  const filtered = typeFilter === "All" ? events : events.filter(e => e.type === typeFilter);

  const rotations = (window.ROTATION_EVENTS || []).filter(e => e.cred === c.display).concat(
    c.display === "prod-db-root" ? [] : [{ ts: c.created, cred: c.display, resource: c.resources[0] || "—", result: c.rotation === "failed" ? "failed" : "success", duration: "4.0s", by: "PAM (scheduled)", reason: c.failReason }]
  );
  const rotList = rotations.length ? rotations : [{ ts: "No rotations yet", cred: c.display, resource: "—", result: "skipped", duration: "—", by: "—" }];

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.18)", zIndex: 44 }}/>
      <aside style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 520, background: "var(--bg-app)", borderLeft: "1px solid var(--border)", zIndex: 45, display: "flex", flexDirection: "column", boxShadow: "var(--shadow-lg)" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
          {onBack && <button className="btn btn-ghost btn-sm" onClick={onBack} style={{ color: "var(--brand-fg)" }}>← Back</button>}
          <div style={{ flex: 1, font: "600 15px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{c.display} — Audit Trail</div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><Icon name="x" size={14}/></button>
        </div>

        <div style={{ display: "flex", gap: 0, padding: "0 20px", borderBottom: "1px solid var(--border)" }}>
          {[["events", "All events"], ["rotation", "Rotation history"]].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} style={{ padding: "11px 4px", marginRight: 20, border: "none", borderBottom: `2px solid ${tab === id ? "var(--brand)" : "transparent"}`, background: "none", font: `${tab === id ? 600 : 500} 12.5px/1 var(--font-sans)`, color: tab === id ? "var(--brand-fg)" : "var(--fg-3)", cursor: "pointer" }}>{label}</button>
          ))}
        </div>

        <div className="scroll-area" style={{ flex: 1, overflow: "auto", padding: 20 }}>
          {tab === "events" && (
            <>
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                <Select value={typeFilter} onChange={setTypeFilter} options={[["All", "All events"], ["Created", "Created"], ["Edited", "Edited"], ["Rotated", "Rotated"], ["Linked", "Linked"], ["Tested", "Tested"]]}/>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {filtered.map((e, i, arr) => (
                  <div key={i} style={{ display: "flex", gap: 12, padding: "10px 0", position: "relative" }}>
                    {i < arr.length - 1 && <div style={{ position: "absolute", left: 13, top: 32, bottom: -10, width: 1, background: "var(--border)" }}/>}
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--bg-surface-2)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none", fontSize: 13, zIndex: 1 }}>{e.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ font: "500 12.5px/1.4 var(--font-sans)", color: "var(--fg-1)" }}>{e.desc}</div>
                      <div style={{ font: "400 11px/1.4 var(--font-sans)", color: "var(--fg-4)", marginTop: 2 }} title={e.ts}>{e.actor} · {e.ts}</div>
                    </div>
                  </div>
                ))}
              </div>
              <button className="btn btn-sm" style={{ marginTop: 16 }} onClick={() => window.pamToast("Audit trail exported")}><Icon name="download" size={11}/> Export audit trail</button>
            </>
          )}

          {tab === "rotation" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {rotList.map((e, i) => (
                <div key={i} style={{ border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
                  <button onClick={() => setExpanded(expanded === i ? null : i)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "11px 14px", border: "none", background: "var(--bg-surface)", cursor: "pointer", textAlign: "left" }}>
                    <span style={{ font: "600 13px/1 var(--font-sans)", color: e.result === "success" ? "var(--success-fg)" : e.result === "failed" ? "var(--danger-fg)" : "var(--fg-4)" }}>{e.result === "success" ? "✓" : e.result === "failed" ? "✗" : "○"}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ font: "500 12.5px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{e.ts}</div>
                      <div style={{ font: "400 11px/1.4 var(--font-sans)", color: "var(--fg-4)", marginTop: 1 }}>{e.by} · {e.duration}</div>
                    </div>
                    <span style={{ font: "500 11px/1.5 var(--font-sans)", padding: "2px 8px", borderRadius: 999, background: e.result === "success" ? "var(--success-soft)" : e.result === "failed" ? "var(--danger-soft)" : "var(--bg-surface-2)", color: e.result === "success" ? "var(--success-fg)" : e.result === "failed" ? "var(--danger-fg)" : "var(--fg-3)" }}>{e.result === "success" ? "Success" : e.result === "failed" ? "Failed" : "Skipped"}</span>
                    <Icon name={expanded === i ? "chevron-down" : "chevron-right"} size={11}/>
                  </button>
                  {expanded === i && (
                    <div style={{ padding: 14, borderTop: "1px solid var(--border-subtle)", background: "var(--bg-surface-2)", font: "400 12px/1.6 var(--font-sans)", color: "var(--fg-2)" }}>
                      <div><strong style={{ color: "var(--fg-1)" }}>Admin account:</strong> {c.adminAcct || "—"}</div>
                      <div><strong style={{ color: "var(--fg-1)" }}>Resources rotated:</strong> {c.resources.map(r => `✓ ${r}`).join(", ") || "—"}</div>
                      <div style={{ marginTop: 6 }}><strong style={{ color: "var(--fg-1)" }}>Steps:</strong></div>
                      {["Generated new password", "Connected to target", "Updated password on target", "Updated vault", "Validated new credential"].map((s, si) => (
                        <div key={si} style={{ color: e.result === "failed" && si === 2 ? "var(--danger-fg)" : "var(--success-fg)" }}>{e.result === "failed" && si === 2 ? "✗" : "✓"} {s}</div>
                      ))}
                      {e.reason && <div style={{ marginTop: 6, color: "var(--danger-fg)" }}><strong>Failure reason:</strong> {e.reason}</div>}
                      <div style={{ marginTop: 6 }}><strong style={{ color: "var(--fg-1)" }}>Post-validation:</strong> {e.result === "success" ? <span style={{ color: "var(--success-fg)" }}>✓ Passed</span> : e.result === "failed" ? <span style={{ color: "var(--danger-fg)" }}>✗ Failed</span> : "○ Not run"}</div>
                      {e.result === "failed" && <button className="btn btn-sm" style={{ marginTop: 10 }} onClick={() => window.pamToast(`Retrying rotation for ${c.display}…`, "info")}><Icon name="refresh" size={11}/> Retry this rotation</button>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

// =========================================================
// SSH KEY DETAIL PANEL
// =========================================================
const SSHKeyDetailPanel = ({ credId, onClose, onHistory, onAssignOwner, onDelete }) => {
  const c = window.credStore.find(credId);
  const [showPub, setShowPub] = React.useState(false);
  const [testing, setTesting] = React.useState(false);
  const [testResult, setTestResult] = React.useState(null);
  if (!c) return null;
  const pub = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI" + (c.fingerprint || "").slice(7, 40) + " " + c.display;
  const runTest = () => { setTesting(true); setTestResult(null); setTimeout(() => { setTesting(false); setTestResult(c.resources.length ? "ok" : "none"); }, 1600); };
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.18)", zIndex: 40 }}/>
      <aside style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 520, background: "var(--bg-app)", borderLeft: "1px solid var(--border)", zIndex: 41, display: "flex", flexDirection: "column", boxShadow: "var(--shadow-lg)" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "flex-start", gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ font: "600 17px/1.3 var(--font-sans)", color: "var(--fg-1)", margin: 0 }}>{c.display}</h2>
            <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
              <span className="badge">{c.keyType || "Private Key"}</span>
              {c.stale && <span style={{ padding: "2px 8px", borderRadius: 999, background: "var(--warning-soft)", color: "var(--warning-fg)", font: "500 11px/1.5 var(--font-sans)" }}>⚠ Stale</span>}
              {c.orphaned && <span style={{ padding: "2px 8px", borderRadius: 999, background: "var(--danger-soft)", color: "var(--danger-fg)", font: "500 11px/1.5 var(--font-sans)" }}>⚠ Orphaned</span>}
              {!c.stale && !c.orphaned && <span style={{ padding: "2px 8px", borderRadius: 999, background: "var(--success-soft)", color: "var(--success-fg)", font: "500 11px/1.5 var(--font-sans)" }}>Healthy</span>}
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><Icon name="x" size={14}/></button>
        </div>
        <div className="scroll-area" style={{ flex: 1, overflow: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 22 }}>
          <DetailSection title="Key identity">
            <DetailRow k="Type">{c.keyType || "Private Key"}</DetailRow>
            <DetailRow k="Fingerprint"><Fingerprint value={c.fingerprint || "SHA256:—"} full/></DetailRow>
            <DetailRow k="Created">{c.created}</DetailRow>
            <DetailRow k="Source">{c.source}</DetailRow>
            <DetailRow k="Passphrase">{c.passphrase ? <span style={{ color: "var(--success-fg)" }}>Protected</span> : <span style={{ color: "var(--fg-4)" }}>Not protected</span>}</DetailRow>
            <div style={{ marginTop: 8 }}>
              <button className="btn btn-sm" onClick={() => setShowPub(s => !s)}><Icon name="eye" size={11}/> {showPub ? "Hide" : "Show"} public key</button>
              {showPub && (
                <div style={{ marginTop: 8 }}>
                  <textarea readOnly value={pub} rows={3} className="input" style={{ font: "400 11px/1.5 var(--font-mono)", resize: "vertical" }}/>
                  <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                    <button className="btn btn-sm" onClick={() => { navigator.clipboard?.writeText(pub); window.pamToast("Public key copied"); }}><Icon name="copy" size={11}/> Copy</button>
                    <button className="btn btn-sm" onClick={() => window.pamToast("Downloading " + c.display + ".pub")}><Icon name="download" size={11}/> Download .pub</button>
                  </div>
                </div>
              )}
            </div>
          </DetailSection>

          <DetailSection title="Ownership">
            <DetailRow k="Current owner">{c.owner ? c.owner : <span style={{ color: "var(--danger-fg)" }}>Unassigned ⚠</span>}</DetailRow>
            <DetailRow k="Last used by">{c.owner || "—"}</DetailRow>
            <button className="btn btn-sm" style={{ marginTop: 6 }} onClick={() => onAssignOwner(c)}><Icon name="user" size={11}/> Assign owner</button>
          </DetailSection>

          <DetailSection title={`Resources (${c.resources.length})`}>
            {c.resources.length === 0 ? <div style={{ padding: 10, background: "var(--warning-soft)", borderRadius: 4, font: "400 12px/1.5 var(--font-sans)", color: "var(--warning-fg)" }}>⚠ Not linked to any resource.</div>
              : c.resources.map(r => <div key={r} className="t-mono" style={{ fontSize: 12, color: "var(--fg-1)", padding: "4px 0" }}>{r}</div>)}
          </DetailSection>

          <DetailSection title="Usage & health">
            <DetailRow k="Last used">{c.lastRotated === "Never" ? "Never" : c.lastRotated}</DetailRow>
            <DetailRow k="Age">{c.stale ? <span style={{ color: "var(--warning-fg)" }}>365+ days</span> : "98 days"}</DetailRow>
            {c.stale && <div style={{ marginTop: 8, padding: 10, background: "var(--warning-soft)", borderRadius: 4, font: "400 12px/1.5 var(--font-sans)", color: "var(--warning-fg)" }}>⚠ Not used in 90+ days — consider rotating or removing.</div>}
            {testResult === "ok" && <div style={{ marginTop: 10, padding: 10, background: "var(--success-soft)", borderRadius: 4, font: "400 12px/1.5 var(--font-sans)", color: "var(--success-fg)" }}>✓ Authentication successful on all {c.resources.length} resources</div>}
            {testResult === "none" && <div style={{ marginTop: 10, padding: 10, background: "var(--bg-surface-2)", borderRadius: 4, font: "400 12px/1.5 var(--font-sans)", color: "var(--fg-3)" }}>No linked resources to test against.</div>}
          </DetailSection>
        </div>
        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 8, background: "var(--bg-surface)" }}>
          <button className="btn" onClick={runTest} disabled={testing}>{testing ? <Spinner size={12}/> : <Icon name="check-circle" size={12}/>} Test authentication</button>
          <button className="btn" onClick={() => onHistory(c.id)}><Icon name="history" size={12}/> History</button>
          <div style={{ flex: 1 }}/>
          <button className="btn btn-ghost" style={{ color: "var(--danger-fg)" }} onClick={() => onDelete(c)}><Icon name="trash" size={12}/> Delete</button>
        </div>
      </aside>
    </>
  );
};

// =========================================================
// APP SECRET DETAIL PANEL
// =========================================================
const AppSecretDetailPanel = ({ credId, onClose, onRotate, onHistory, onDelete }) => {
  const c = window.credStore.find(credId);
  if (!c) return null;
  const now = new Date("2026-05-13");
  const expDays = c.expiry ? Math.round((new Date(c.expiry) - now) / (1000 * 60 * 60 * 24)) : null;
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.18)", zIndex: 40 }}/>
      <aside style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 520, background: "var(--bg-app)", borderLeft: "1px solid var(--border)", zIndex: 41, display: "flex", flexDirection: "column", boxShadow: "var(--shadow-lg)" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "flex-start", gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ font: "600 17px/1.3 var(--font-sans)", color: "var(--fg-1)", margin: 0 }}>{c.display}</h2>
            <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
              <span className="badge">{c.secretType || "Secret"}</span>
              {expDays !== null && (expDays < 0 ? <span style={{ padding: "2px 8px", borderRadius: 999, background: "var(--danger-soft)", color: "var(--danger-fg)", font: "500 11px/1.5 var(--font-sans)" }}>⚑ Expired {-expDays}d ago</span>
                : expDays <= 30 ? <span style={{ padding: "2px 8px", borderRadius: 999, background: "var(--warning-soft)", color: "var(--warning-fg)", font: "500 11px/1.5 var(--font-sans)" }}>⚠ Expires in {expDays}d</span>
                : <span style={{ padding: "2px 8px", borderRadius: 999, background: "var(--success-soft)", color: "var(--success-fg)", font: "500 11px/1.5 var(--font-sans)" }}>Valid</span>)}
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><Icon name="x" size={14}/></button>
        </div>
        <div className="scroll-area" style={{ flex: 1, overflow: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 22 }}>
          <DetailSection title="Secret identity">
            <DetailRow k="Type">{c.secretType || "—"}</DetailRow>
            <DetailRow k="Application">{c.application || <span style={{ color: "var(--fg-4)" }}>Not set</span>}</DetailRow>
            <DetailRow k="Injection method">{c.injection || "—"}</DetailRow>
            <DetailRow k="Expiry">{c.expiry || <span style={{ color: "var(--fg-4)" }}>No expiry set</span>}</DetailRow>
            <DetailRow k="Days until expiry">{expDays === null ? "—" : expDays < 0 ? <span style={{ color: "var(--danger-fg)" }}>Expired</span> : `${expDays} days`}</DetailRow>
            <DetailRow k="Source">{c.source}</DetailRow>
          </DetailSection>
          <DetailSection title="Secret value">
            <div style={{ padding: 10, background: "var(--bg-surface-2)", borderRadius: 4, font: "400 12px/1.5 var(--font-sans)", color: "var(--fg-3)" }}>🔒 Secret is encrypted in the vault. The raw value is never displayed.</div>
            <DetailRow k="Last rotated">{c.lastRotated}</DetailRow>
            <button className="btn btn-primary btn-sm" style={{ marginTop: 8 }} onClick={() => onRotate(c.id)}><Icon name="refresh" size={11}/> Rotate now</button>
          </DetailSection>
          <DetailSection title={`Resources / applications (${c.resources.length})`}>
            {c.resources.length === 0 ? <div style={{ padding: 10, background: "var(--warning-soft)", borderRadius: 4, font: "400 12px/1.5 var(--font-sans)", color: "var(--warning-fg)" }}>⚠ Not linked to any resource.</div>
              : c.resources.map(r => <div key={r} className="t-mono" style={{ fontSize: 12, color: "var(--fg-1)", padding: "4px 0" }}>{r}</div>)}
          </DetailSection>
        </div>
        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 8, background: "var(--bg-surface)" }}>
          <button className="btn" onClick={() => { window.pamToast("Testing secret injection…", "info"); setTimeout(() => window.pamToast(`✓ ${c.display} — injection test passed`), 1400); }}><Icon name="check-circle" size={12}/> Test injection</button>
          <button className="btn" onClick={() => onHistory(c.id)}><Icon name="history" size={12}/> History</button>
          <div style={{ flex: 1 }}/>
          <button className="btn btn-ghost" style={{ color: "var(--danger-fg)" }} onClick={() => onDelete(c)}><Icon name="trash" size={12}/> Delete</button>
        </div>
      </aside>
    </>
  );
};

// =========================================================
// RECONCILIATION DETAIL PANEL
// =========================================================
const ReconDetailPanel = ({ recon, onClose, onDelete }) => {
  const [testing, setTesting] = React.useState(false);
  const [tested, setTested] = React.useState(false);
  if (!recon) return null;
  const users = (window.CREDS || []).filter(c => c.adminAcct === recon.display);
  const runTest = () => { setTesting(true); setTimeout(() => { setTesting(false); setTested(true); window.pamToast(`✓ ${recon.display} — connection successful`); }, 1500); };
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.18)", zIndex: 40 }}/>
      <aside style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 520, background: "var(--bg-app)", borderLeft: "1px solid var(--border)", zIndex: 41, display: "flex", flexDirection: "column", boxShadow: "var(--shadow-lg)" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "flex-start", gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ font: "600 17px/1.3 var(--font-sans)", color: "var(--fg-1)", margin: 0 }}>{recon.display}</h2>
            <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
              <span className="badge">{recon.type}</span>
              <span style={{ padding: "2px 8px", borderRadius: 999, font: "500 11px/1.5 var(--font-sans)", background: recon.status === "Active" ? "var(--success-soft)" : recon.status === "Failed" ? "var(--danger-soft)" : "var(--bg-surface-2)", color: recon.status === "Active" ? "var(--success-fg)" : recon.status === "Failed" ? "var(--danger-fg)" : "var(--fg-3)" }}>{recon.status}</span>
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><Icon name="x" size={14}/></button>
        </div>
        <div className="scroll-area" style={{ flex: 1, overflow: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 22 }}>
          <DetailSection title="Identity">
            <DetailRow k="Username"><MaskedField value={recon.username}/></DetailRow>
            <DetailRow k="Type">{recon.type}</DetailRow>
            <DetailRow k="Resources rotated">{recon.resources}</DetailRow>
            <DetailRow k="Last used">{recon.lastUsed}</DetailRow>
          </DetailSection>
          <DetailSection title={`Usage — credentials using this account (${users.length})`}>
            {users.length === 0 ? <div style={{ padding: 10, background: "var(--bg-surface-2)", borderRadius: 4, font: "400 12px/1.5 var(--font-sans)", color: "var(--fg-3)" }}>No credentials currently use this account for rotation.</div>
              : <table className="table" style={{ border: "1px solid var(--border)", borderRadius: 6, overflow: "hidden" }}>
                  <thead><tr><th>Credential</th><th>Resource</th><th>Last result</th></tr></thead>
                  <tbody>{users.map(u => (
                    <tr key={u.id}>
                      <td style={{ font: "500 12.5px/1.3 var(--font-sans)", color: "var(--brand-fg)" }}>{u.display}</td>
                      <td className="t-mono t-tiny" style={{ color: "var(--fg-2)" }}>{u.resources[0] || "—"}</td>
                      <td><RotationDot status={u.rotation} withLabel/></td>
                    </tr>
                  ))}</tbody>
                </table>}
          </DetailSection>
          <DetailSection title="Test">
            <DetailRow k="Last tested">{tested ? "just now" : "Never tested"}</DetailRow>
            <button className="btn btn-sm" style={{ marginTop: 6 }} onClick={runTest} disabled={testing}>{testing ? <Spinner size={11}/> : <Icon name="check-circle" size={11}/>} Test connection</button>
          </DetailSection>
        </div>
        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 8, background: "var(--bg-surface)" }}>
          <button className="btn" onClick={runTest} disabled={testing}><Icon name="check-circle" size={12}/> Test connection</button>
          <div style={{ flex: 1 }}/>
          <button className="btn btn-ghost" style={{ color: "var(--danger-fg)" }} onClick={() => onDelete(recon)}><Icon name="trash" size={12}/> Delete</button>
        </div>
      </aside>
    </>
  );
};

Object.assign(window, { CredAuditTrailPanel, SSHKeyDetailPanel, AppSecretDetailPanel, ReconDetailPanel });
