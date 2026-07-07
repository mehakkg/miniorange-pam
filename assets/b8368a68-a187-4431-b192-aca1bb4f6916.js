// Credentials — SSH Keys, App Secrets, Reconciliation, Rotation Health, CSV Import

// =========================================================
// SSH KEYS TAB
// =========================================================
const SSHKeysTab = ({ onOpen, onAdd }) => {
  const creds = window.useCreds();
  const keys = creds.filter(c => c.type === "SSH Key");
  const stale = keys.filter(k => k.stale).length;
  const orphaned = keys.filter(k => k.orphaned).length;
  const [openId, setOpenId] = React.useState(null);
  const [assignOwner, setAssignOwner] = React.useState(null);
  const [revokeKey, setRevokeKey] = React.useState(null);
  const [auditId, setAuditId] = React.useState(null);
  const [pubKey, setPubKey] = React.useState(null);
  const [staleReview, setStaleReview] = React.useState(false);
  const [reviewLog, setReviewLog] = React.useState({ kept: 0, revoked: 0 });
  const [testingId, setTestingId] = React.useState(null);

  const shown = staleReview ? keys.filter(k => k.stale) : keys;
  const runTest = (k) => { setTestingId(k.id); setTimeout(() => { setTestingId(null); window.pamToast(k.resources.length ? `✓ ${k.display} — authentication successful` : `✗ ${k.display} — no resources linked`, k.resources.length ? "success" : "error"); }, 1500); };
  const keepKey = (k) => { window.credStore.update(k.id, { stale: false }); setReviewLog(l => ({ ...l, kept: l.kept + 1 })); window.pamToast(`${k.display} kept — marked reviewed`, "info"); };
  const endReview = () => { setStaleReview(false); window.pamToast(`Review complete — ${reviewLog.kept} kept, ${reviewLog.revoked} revoked`, "info"); setReviewLog({ kept: 0, revoked: 0 }); };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto" }}>
      <div style={{ padding: "14px 24px", borderBottom: "1px solid var(--border-subtle)", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <KPICard label="Total SSH keys" value={keys.length}/>
        <KPICard label="Active (used recently)" value={keys.filter(k => !k.stale).length} accent="var(--success-fg)"/>
        <KPICard label="Stale (90+ days)" value={stale} accent="var(--warning-fg)"/>
        <KPICard label="Orphaned (no owner)" value={orphaned} accent="var(--danger-fg)"/>
      </div>

      <div style={{ padding: "12px 24px 0", display: "flex", alignItems: "center" }}>
        <div style={{ flex: 1 }}/>
        <button className="btn btn-primary btn-sm" onClick={onAdd}><Icon name="plus" size={11}/> Add SSH key</button>
      </div>

      {staleReview && (
        <div style={{ margin: "12px 24px 0", padding: 12, background: "var(--warning-soft)", borderRadius: 6, display: "flex", alignItems: "center", gap: 10 }}>
          <Icon name="alert-circle" size={14} color="var(--warning-fg)"/>
          <div style={{ flex: 1, font: "400 12.5px/1.5 var(--font-sans)", color: "var(--warning-fg)" }}>
            <strong>Reviewing {shown.length} stale SSH key{shown.length !== 1 ? "s" : ""}</strong> · Keys not used in 90+ days may be orphaned or no longer needed.
          </div>
          <button className="btn btn-sm" onClick={() => { shown.forEach(k => window.credStore.update(k.id, { stale: false })); endReview(); }}>Keep all</button>
          <button className="btn btn-sm" style={{ color: "var(--fg-3)" }} onClick={endReview}>Cancel review</button>
        </div>
      )}

      {!staleReview && orphaned > 0 && (
        <div style={{ margin: "12px 24px 0", padding: 12, background: "var(--danger-soft)", borderRadius: 6, display: "flex", alignItems: "center", gap: 10 }}>
          <Icon name="alert-circle" size={14} color="var(--danger-fg)"/>
          <div style={{ flex: 1, font: "400 12.5px/1.5 var(--font-sans)", color: "var(--danger-fg)" }}>
            <strong>{orphaned} SSH key{orphaned > 1 ? "s have" : " has"}</strong> no assigned owner. Unowned keys are a security risk.
          </div>
          <button className="btn btn-sm" style={{ color: "var(--danger-fg)", borderColor: "var(--danger-fg)" }} onClick={() => { const o = keys.find(k => k.orphaned); if (o) setAssignOwner(o); }}>Assign owners →</button>
        </div>
      )}

      {!staleReview && stale > 0 && (
        <div style={{ margin: "8px 24px 0", padding: 12, background: "var(--warning-soft)", borderRadius: 6, display: "flex", alignItems: "center", gap: 10 }}>
          <Icon name="alert-circle" size={14} color="var(--warning-fg)"/>
          <div style={{ flex: 1, font: "400 12.5px/1.5 var(--font-sans)", color: "var(--warning-fg)" }}>
            <strong>{stale} SSH key{stale > 1 ? "s haven't" : " hasn't"}</strong> been used in 90+ days. Review and rotate or remove them.
          </div>
          <button className="btn btn-sm" onClick={() => setStaleReview(true)}>Review stale keys →</button>
        </div>
      )}

      <div style={{ flex: 1, overflow: "auto", marginTop: 12 }}>
        {keys.length === 0 ? (
          <EmptyState icon="key" title="No SSH keys in the vault" description="Import discovered SSH keys or add them manually."
            action={<><button className="btn btn-primary" onClick={onAdd}><Icon name="plus" size={11}/> Add SSH key</button><button className="btn">Import from Discovery</button></>}/>
        ) : (
          <table className="table">
            <thead><tr><th style={{ width: 32 }}><input type="checkbox" style={{ accentColor: "var(--brand)" }}/></th><th>Key name</th><th>Type</th><th>Fingerprint</th><th>Owner</th><th>Resources</th><th>Last used</th><th>Age</th><th>Passphrase</th><th></th></tr></thead>
            <tbody>{shown.map(k => (
              <tr key={k.id} onClick={() => setOpenId(k.id)} style={{ cursor: "pointer" }}>
                <td onClick={e => e.stopPropagation()}><input type="checkbox" style={{ accentColor: "var(--brand)" }}/></td>
                <td><div style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--brand-fg)" }}>{k.display}</div></td>
                <td><span className="badge">{k.keyType}</span></td>
                <td><Fingerprint value={k.fingerprint}/></td>
                <td>{k.owner ? <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Avatar name={k.owner} size={20}/><span style={{ fontSize: 12.5 }}>{k.owner}</span></span> : <span style={{ color: "var(--danger-fg)", fontSize: 12.5 }}>Unassigned</span>}</td>
                <td style={{ color: "var(--fg-2)", fontSize: 12.5 }}>{k.resources.length}</td>
                <td className="t-tiny" style={{ color: k.stale ? "var(--warning-fg)" : "var(--fg-3)" }}>{k.lastRotated === "Never" ? "Never" : k.lastRotated}</td>
                <td className="t-tiny" style={{ color: k.stale ? "var(--warning-fg)" : "var(--fg-3)" }}>{k.stale ? "365+ days" : "98 days"}</td>
                <td>{k.passphrase ? <Icon name="check" size={12} color="var(--success-fg)"/> : <span style={{ color: "var(--fg-4)" }}>—</span>}</td>
                <td onClick={e => e.stopPropagation()} style={{ textAlign: "right" }}>
                  {staleReview ? (
                    <div style={{ display: "inline-flex", gap: 6 }}>
                      <button className="btn btn-sm" onClick={() => keepKey(k)}>Keep</button>
                      <button className="btn btn-sm" style={{ color: "var(--danger-fg)" }} onClick={() => setRevokeKey(k)}>Revoke</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setAssignOwner(k)}>Assign owner</button>
                    </div>
                  ) : testingId === k.id ? <span style={{ display: "inline-flex", alignItems: "center", gap: 6, font: "500 11.5px/1 var(--font-sans)", color: "var(--fg-3)" }}><Spinner size={12}/> Testing…</span>
                   : <RowMenu items={[
                      { label: "View details", icon: "eye", onClick: () => setOpenId(k.id) },
                      { label: "Assign owner", icon: "user", onClick: () => setAssignOwner(k) },
                      { label: "View public key", icon: "key", onClick: () => setPubKey(k) },
                      { label: "Edit", icon: "edit", onClick: () => onAdd && onAdd() },
                      { label: "Test authentication", icon: "check-circle", onClick: () => runTest(k) },
                      { label: "View history", icon: "history", onClick: () => setAuditId(k.id) },
                      { divider: true },
                      { label: "Revoke and delete", icon: "trash", danger: true, onClick: () => setRevokeKey(k) },
                    ]}/>}
                </td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>

      {openId && <SSHKeyDetailPanel credId={openId} onClose={() => setOpenId(null)} onHistory={(id) => { setOpenId(null); setAuditId(id); }} onAssignOwner={(k) => setAssignOwner(k)} onDelete={(k) => setRevokeKey(k)}/>}
      {assignOwner && <AssignOwnerModal cred={assignOwner} onClose={() => setAssignOwner(null)} onSave={(owner) => { window.credStore.update(assignOwner.id, { owner, orphaned: false }); window.pamToast(`Owner assigned — ${owner}`); }}/>}
      {auditId && <CredAuditTrailPanel credId={auditId} onClose={() => setAuditId(null)}/>}
      {pubKey && <PublicKeyModal cred={pubKey} onClose={() => setPubKey(null)}/>}
      {revokeKey && <RevokeKeyModal cred={revokeKey} onClose={() => setRevokeKey(null)} onConfirm={() => { window.credStore.remove(revokeKey.id); if (openId === revokeKey.id) setOpenId(null); if (staleReview) setReviewLog(l => ({ ...l, revoked: l.revoked + 1 })); window.pamToast(`${revokeKey.display} revoked and deleted`); }}/>}
    </div>
  );
};

const PublicKeyModal = ({ cred, onClose }) => {
  const pub = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI" + (cred.fingerprint || "").slice(7, 40) + " " + cred.display;
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.4)", zIndex: 110 }}/>
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 520, maxWidth: "92vw", background: "var(--bg-app)", border: "1px solid var(--border)", borderRadius: 10, boxShadow: "var(--shadow-lg)", zIndex: 111 }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center" }}>
          <div style={{ flex: 1, font: "600 15px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>Public key — {cred.display}</div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><Icon name="x" size={14}/></button>
        </div>
        <div style={{ padding: 20 }}>
          <textarea readOnly value={pub} rows={4} className="input" style={{ font: "400 11.5px/1.5 var(--font-mono)", resize: "vertical", width: "100%" }}/>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button className="btn btn-sm" onClick={() => { navigator.clipboard?.writeText(pub); window.pamToast("Public key copied"); }}><Icon name="copy" size={11}/> Copy</button>
            <button className="btn btn-sm" onClick={() => window.pamToast("Downloading " + cred.display + ".pub")}><Icon name="download" size={11}/> Download .pub</button>
          </div>
        </div>
      </div>
    </>
  );
};

const RevokeKeyModal = ({ cred, onClose, onConfirm }) => {
  const [ack, setAck] = React.useState(false);
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.4)", zIndex: 110 }}/>
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 480, maxWidth: "92vw", background: "var(--bg-app)", border: "1px solid var(--border)", borderRadius: 10, boxShadow: "var(--shadow-lg)", zIndex: 111 }}>
        <div style={{ padding: "16px 20px 12px" }}>
          <h2 style={{ font: "600 15.5px/1.3 var(--font-sans)", color: "var(--fg-1)", margin: 0 }}>Revoke and delete {cred.display}?</h2>
          <p style={{ font: "400 13px/1.5 var(--font-sans)", color: "var(--fg-2)", margin: "8px 0 0" }}>This removes the key from the vault. If this private key is deployed on target systems, it must be manually removed from authorized_keys files — PAM cannot do this automatically.</p>
          <label style={{ display: "flex", alignItems: "flex-start", gap: 9, marginTop: 14, cursor: "pointer", font: "400 12.5px/1.5 var(--font-sans)", color: "var(--fg-1)" }}>
            <input type="checkbox" checked={ack} onChange={() => setAck(a => !a)} style={{ accentColor: "var(--brand)", marginTop: 1 }}/>
            I have removed or will remove this key from all target systems
          </label>
        </div>
        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 8, justifyContent: "flex-end", background: "var(--bg-surface)" }}>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn" disabled={!ack} style={ack ? { background: "var(--danger)", color: "#fff", borderColor: "var(--danger)" } : { opacity: 0.5, cursor: "not-allowed" }} onClick={() => { onConfirm(); onClose(); }}>Revoke and delete</button>
        </div>
      </div>
    </>
  );
};

// =========================================================
// APPLICATION SECRETS TAB
// =========================================================
const AppSecretsTab = ({ onOpen, onAdd }) => {
  const creds = window.useCreds();
  const secrets = creds.filter(c => c.type === "App Secret");
  const [openId, setOpenId] = React.useState(null);
  const [rotateId, setRotateId] = React.useState(null);
  const [auditId, setAuditId] = React.useState(null);
  const [assignOwner, setAssignOwner] = React.useState(null);
  const [deleteCred, setDeleteCred] = React.useState(null);
  const [expFilter, setExpFilter] = React.useState(false);
  const now = new Date("2026-05-13");
  const within30 = secrets.filter(s => {
    if (!s.expiry) return false;
    const d = new Date(s.expiry);
    const diff = (d - now) / (1000 * 60 * 60 * 24);
    return diff > 0 && diff <= 30;
  }).length;
  const expired = secrets.filter(s => s.expiry && new Date(s.expiry) < now).length;
  const shown = expFilter ? secrets.filter(s => s.expiry && ((new Date(s.expiry) - now) / 86400000) <= 30) : secrets;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto" }}>
      <div style={{ padding: "14px 24px", borderBottom: "1px solid var(--border-subtle)", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <KPICard label="Total secrets" value={secrets.length}/>
        <KPICard label="Rotation healthy" value={secrets.filter(s => s.rotation === "healthy").length} accent="var(--success-fg)"/>
        <KPICard label="Expiring in 30 days" value={within30} accent="var(--warning-fg)"/>
        <KPICard label="Expired" value={expired} accent="var(--danger-fg)"/>
      </div>

      <div style={{ padding: "12px 24px 0", display: "flex", alignItems: "center" }}>
        <div style={{ flex: 1 }}/>
        <button className="btn btn-primary btn-sm" onClick={onAdd}><Icon name="plus" size={11}/> Add secret</button>
      </div>

      {expired > 0 && (
        <div style={{ margin: "12px 24px 0", padding: 12, background: "var(--danger-soft)", borderRadius: 6, display: "flex", alignItems: "center", gap: 10 }}>
          <Icon name="alert-circle" size={14} color="var(--danger-fg)"/>
          <div style={{ flex: 1, font: "400 12.5px/1.5 var(--font-sans)", color: "var(--danger-fg)" }}>
            <strong>⚑ {expired} application secret{expired > 1 ? "s have" : " has"} expired</strong> and may be causing service failures.
          </div>
          <button className="btn btn-sm" style={{ color: "var(--danger-fg)", borderColor: "var(--danger-fg)" }} onClick={() => setExpFilter(true)}>Review →</button>
        </div>
      )}

      {within30 > 0 && (
        <div style={{ margin: "8px 24px 0", padding: 12, background: "var(--warning-soft)", borderRadius: 6, display: "flex", alignItems: "center", gap: 10 }}>
          <Icon name="alert-circle" size={14} color="var(--warning-fg)"/>
          <div style={{ flex: 1, font: "400 12.5px/1.5 var(--font-sans)", color: "var(--warning-fg)" }}>
            <strong>{within30} application secret{within30 > 1 ? "s expire" : " expires"}</strong> within 30 days. Rotate them before they cause service failures.
          </div>
          <button className="btn btn-sm" onClick={() => setExpFilter(true)}>View expiring →</button>
        </div>
      )}

      {expFilter && (
        <div style={{ margin: "8px 24px 0" }}><button className="btn btn-ghost btn-sm" style={{ color: "var(--brand-fg)", padding: 0 }} onClick={() => setExpFilter(false)}>✕ Clear expiry filter</button></div>
      )}

      <div style={{ flex: 1, overflow: "auto", marginTop: 12 }}>
        {secrets.length === 0 ? (
          <EmptyState icon="key" title="No application secrets in the vault" description="Add API keys, OAuth tokens, and database connection strings used by your applications."
            action={<button className="btn btn-primary" onClick={onAdd}><Icon name="plus" size={11}/> Add application secret</button>}/>
        ) : (
          <table className="table">
            <thead><tr><th style={{ width: 32 }}><input type="checkbox" style={{ accentColor: "var(--brand)" }}/></th><th>Secret name</th><th>Type</th><th>Application</th><th>Injection</th><th>Sensitivity</th><th>Expiry</th><th>Last rotated</th><th>Status</th><th></th></tr></thead>
            <tbody>{shown.map(s => {
              const expDays = s.expiry ? Math.round((new Date(s.expiry) - now) / (1000 * 60 * 60 * 24)) : null;
              return (
                <tr key={s.id} onClick={() => setOpenId(s.id)} style={{ cursor: "pointer" }}>
                  <td onClick={e => e.stopPropagation()}><input type="checkbox" style={{ accentColor: "var(--brand)" }}/></td>
                  <td><div style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--brand-fg)" }}>{s.display}</div></td>
                  <td><span className="badge">{s.secretType}</span></td>
                  <td style={{ fontSize: 12.5, color: "var(--fg-2)" }}>{s.application || <span style={{ color: "var(--fg-4)" }}>Not set</span>}</td>
                  <td className="t-tiny" style={{ color: "var(--fg-3)" }}>{s.injection}</td>
                  <td><SensitivityBadge level={s.sensitivity}/></td>
                  <td className="t-tiny" style={{ color: expDays !== null && expDays < 0 ? "var(--danger-fg)" : expDays !== null && expDays <= 30 ? "var(--warning-fg)" : "var(--fg-3)", fontWeight: expDays !== null && expDays <= 30 ? 500 : 400 }}>
                    {s.expiry ? `${s.expiry} (${expDays < 0 ? `${-expDays}d ago` : `in ${expDays}d`})` : <span style={{ color: "var(--fg-4)" }}>None</span>}
                  </td>
                  <td className="t-tiny" style={{ color: "var(--fg-3)" }}>{s.lastRotated}</td>
                  <td><span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><RotationDot status={s.rotation}/><span style={{ font: "500 12px/1 var(--font-sans)", color: "var(--fg-2)" }}>{s.rotation === "healthy" ? "Healthy" : s.rotation === "overdue" ? "Overdue" : s.rotation === "no-policy" ? "No policy" : s.rotation}</span></span></td>
                  <td onClick={e => e.stopPropagation()} style={{ textAlign: "right" }}><RowMenu items={[
                    { label: "View details", icon: "eye", onClick: () => setOpenId(s.id) },
                    { label: "Edit", icon: "edit", onClick: () => onAdd && onAdd() },
                    { label: "Test injection", icon: "check-circle", onClick: () => { window.pamToast("Testing secret injection…", "info"); setTimeout(() => window.pamToast(`✓ ${s.display} — injection test passed`), 1400); } },
                    { label: "Rotate now", icon: "refresh", onClick: () => setRotateId(s.id) },
                    { label: "View history", icon: "history", onClick: () => setAuditId(s.id) },
                    { label: "Assign owner", icon: "user", onClick: () => setAssignOwner(s) },
                    { divider: true },
                    { label: "Delete", icon: "trash", danger: true, onClick: () => setDeleteCred(s) },
                  ]}/></td>
                </tr>
              );
            })}</tbody>
          </table>
        )}
      </div>

      {openId && <AppSecretDetailPanel credId={openId} onClose={() => setOpenId(null)} onRotate={(id) => setRotateId(id)} onHistory={(id) => { setOpenId(null); setAuditId(id); }} onDelete={(c) => setDeleteCred(c)}/>}
      {rotateId && <RotateNowModal credId={rotateId} onClose={() => setRotateId(null)} onComplete={(id) => { window.credStore.update(id, { lastRotated: "just now", rotation: "healthy" }); window.pamToast("Secret rotated successfully"); }}/>}
      {auditId && <CredAuditTrailPanel credId={auditId} onClose={() => setAuditId(null)}/>}
      {assignOwner && <AssignOwnerModal cred={assignOwner} onClose={() => setAssignOwner(null)} onSave={(owner) => { window.credStore.update(assignOwner.id, { owner }); window.pamToast(`Owner assigned — ${owner}`); }}/>}
      {deleteCred && <DeleteCredModal cred={deleteCred} onClose={() => setDeleteCred(null)} onConfirm={() => { window.credStore.remove(deleteCred.id); if (openId === deleteCred.id) setOpenId(null); window.pamToast(`${deleteCred.display} deleted from vault`); }}/>}
    </div>
  );
};

// =========================================================
// RECONCILIATION TAB
// =========================================================
const ReconciliationTab = () => {
  const [dismissed, setDismissed] = React.useState(false);
  const [pendingDismissed, setPendingDismissed] = React.useState(false);
  const [openRecon, setOpenRecon] = React.useState(null);
  const [deleteRecon, setDeleteRecon] = React.useState(null);
  const [addOpen, setAddOpen] = React.useState(false);
  const [auditId, setAuditId] = React.useState(null);
  // Fix 5 — Cloud reconciliation type. aws-iam-*/azure-service-principal-* are
  // being rotated, but no cloud-type reconciliation account exists in the seed
  // data. Rather than invent a placeholder account name (a security-integrity
  // issue), we merge in an honest-copy row noting the mechanism sits outside
  // PAM's reconciliation model until engineering confirms otherwise. The
  // banner above the table flags this as a backend dependency.
  const seed = window.RECON_CREDS || [];
  const hasCloud = seed.some(r => r.type === "Cloud");
  const cloudPlaceholder = hasCloud ? null : {
    id: "rc-cloud",
    display: "aws-secrets-manager (external)",
    type: "Cloud",
    username: "Cloud-native — AWS Secrets Manager",
    resources: 2,
    lastUsed: "External — not tracked by PAM",
    status: "External",
    external: true,
  };
  const recons = cloudPlaceholder ? [...seed, cloudPlaceholder] : seed;
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto" }}>
      {!dismissed && (
        <div style={{ margin: "14px 24px 0", padding: 14, background: "var(--brand-soft)", borderRadius: 8, display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{ width: 32, height: 32, borderRadius: 6, background: "var(--bg-app)", color: "var(--brand-fg)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
            <Icon name="info" size={16}/>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ font: "600 13.5px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>What are reconciliation credentials?</div>
            <div style={{ font: "400 12.5px/1.5 var(--font-sans)", color: "var(--fg-2)", marginTop: 4 }}>
              PAM needs a privileged admin account on each target system to rotate passwords. These accounts are PAM's "keys to the kingdom" — they are never used for user sessions, only for automated rotation operations.
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={() => setDismissed(true)}><Icon name="x" size={12}/></button>
        </div>
      )}

      {/* Fix 5 — Cloud reconciliation type. Backend dependency banner. Removed
          only once engineering confirms which mechanism actually rotates the
          aws-iam-* / azure-service-principal-* credentials. Design intentionally
          renders the Cloud row with placeholder-honest copy ("Cloud-native —
          AWS Secrets Manager") rather than inventing a PAM-managed account
          name — the difference matters for a security review. */}
      {!pendingDismissed && cloudPlaceholder && (
        <div style={{ margin: "12px 24px 0", padding: 12, background: "var(--warning-soft)", borderRadius: 8, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <Icon name="alert-circle" size={14} color="var(--warning-fg)" style={{ marginTop: 2 }}/>
          <div style={{ flex: 1, font: "400 12.5px/1.5 var(--font-sans)", color: "var(--warning-fg)" }}>
            <strong>Cloud reconciliation — pending engineering confirmation.</strong> The Cloud row below reflects what appears to be an external rotation mechanism (AWS Secrets Manager). Until the actual mechanism is confirmed, this row is a placeholder — do not treat its counts as PAM-authoritative.
          </div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setPendingDismissed(true)}><Icon name="x" size={11}/></button>
        </div>
      )}

      <div style={{ padding: "14px 24px 8px", display: "flex", alignItems: "center" }}>
        <div style={{ flex: 1, font: "500 12.5px/1 var(--font-sans)", color: "var(--fg-3)" }}>{recons.length} reconciliation credentials</div>
        <button className="btn btn-primary btn-sm" onClick={() => setAddOpen(true)}><Icon name="plus" size={11}/> Add reconciliation credential</button>
      </div>

      <div style={{ flex: 1, overflow: "auto" }}>
        {recons.length === 0 ? (
          <EmptyState icon="shield" title="No reconciliation credentials configured" description="Without reconciliation credentials, PAM cannot automatically rotate passwords. Add at least one admin account per target system type."
            action={<button className="btn btn-primary"><Icon name="plus" size={11}/> Add reconciliation credential</button>}/>
        ) : (
          <table className="table">
            <thead><tr><th>Display name</th><th>Type</th><th>Username</th><th>Resources rotated</th><th>Last used for rotation</th><th>Status</th><th></th></tr></thead>
            <tbody>{recons.map(rc => (
              <tr key={rc.id} onClick={() => !rc.external && setOpenRecon(rc)} style={{ cursor: rc.external ? "default" : "pointer" }}>
                <td>
                  <div style={{ font: "500 13px/1.3 var(--font-sans)", color: rc.external ? "var(--fg-2)" : "var(--brand-fg)" }}>{rc.display}</div>
                  {rc.external && <div style={{ font: "400 11px/1.3 var(--font-sans)", color: "var(--fg-4)", marginTop: 2 }}>Rotated outside PAM</div>}
                </td>
                <td><span className="badge">{rc.type}</span></td>
                <td>
                  {rc.external
                    ? <span style={{ font: "400 12px/1.4 var(--font-sans)", color: "var(--fg-3)" }}>{rc.username}</span>
                    : <MaskedField value={rc.username}/>}
                </td>
                <td style={{ color: "var(--fg-2)", fontSize: 12.5 }}>{rc.resources} resources</td>
                <td className="t-tiny" style={{ color: rc.status === "Failed" ? "var(--danger-fg)" : rc.external ? "var(--fg-4)" : "var(--fg-3)", fontStyle: rc.external ? "italic" : "normal" }}>{rc.lastUsed}</td>
                <td>
                  {rc.status === "Active"  && <span style={{ display: "inline-flex", alignItems: "center", gap: 6, font: "500 12px/1 var(--font-sans)", color: "var(--success-fg)" }}><span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--success-fg)" }}/>Active</span>}
                  {rc.status === "Failed"  && <span style={{ display: "inline-flex", alignItems: "center", gap: 6, font: "500 12px/1 var(--font-sans)", color: "var(--danger-fg)" }}><span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--danger-fg)" }}/>Failed</span>}
                  {rc.status === "Untested"&& <span style={{ display: "inline-flex", alignItems: "center", gap: 6, font: "500 12px/1 var(--font-sans)", color: "var(--fg-3)" }}><span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--fg-4)" }}/>Untested</span>}
                  {rc.status === "External"&& <span style={{ display: "inline-flex", alignItems: "center", gap: 6, font: "500 12px/1 var(--font-sans)", color: "var(--warning-fg)" }}><span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--warning-fg)" }}/>External · pending confirmation</span>}
                </td>
                <td onClick={e => e.stopPropagation()} style={{ textAlign: "right" }}><RowMenu items={[
                  { label: "Edit", icon: "edit", onClick: () => setOpenRecon(rc) },
                  { label: "Test connection", icon: "check-circle", onClick: () => { window.pamToast("Testing connection…", "info"); setTimeout(() => window.pamToast(`✓ ${rc.display} — connection successful`), 1400); } },
                  { label: "View usage", icon: "link", onClick: () => setOpenRecon(rc) },
                  { label: "View history", icon: "history", onClick: () => setAuditId(rc.id) },
                  { divider: true },
                  { label: "Delete", icon: "trash", danger: true, onClick: () => setDeleteRecon(rc) },
                ]}/></td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>

      {openRecon && <ReconDetailPanel recon={openRecon} onClose={() => setOpenRecon(null)} onDelete={(r) => { setOpenRecon(null); setDeleteRecon(r); }}/>}
      {addOpen && <AddReconModal onClose={() => setAddOpen(false)} onSave={(name) => window.pamToast(`${name} added — reconciliation credential`)}/>}
      {deleteRecon && <ReconDeleteModal recon={deleteRecon} onClose={() => setDeleteRecon(null)} onConfirm={() => window.pamToast(`${deleteRecon.display} deleted`)}/>}
      {auditId && <div onClick={() => setAuditId(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.18)", zIndex: 44 }}/>}
    </div>
  );
};

const AddReconModal = ({ onClose, onSave }) => {
  const [name, setName] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [type, setType] = React.useState("Password");
  return <Panel title="Add Reconciliation Credential" onClose={onClose}>
    <div className="scroll-area" style={{ flex: 1, overflow: "auto", padding: "20px 24px", maxWidth: 640, display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ padding: 14, background: "var(--brand-soft)", borderRadius: 8, font: "400 12.5px/1.5 var(--font-sans)", color: "var(--fg-2)" }}>
        Reconciliation credentials are PAM's internal admin accounts. PAM uses them to log into target systems and rotate passwords. They do not appear in user sessions.
      </div>
      <Field label="Display name" required><input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="backup-reconciliation-02"/></Field>
      <Field label="Username" required><input className="input" value={username} onChange={e => setUsername(e.target.value)} placeholder="backup-admin"/></Field>
      <Field label="Credential type"><Segmented value={type} onChange={setType} options={[{ value: "Password", label: "Password" }, { value: "SSH Key", label: "SSH Key" }]}/></Field>
      {type === "Password" ? <Field label="Password" required><input className="input" type="password" placeholder="••••••••"/></Field>
        : <Field label="Private key" required><textarea className="input" rows={3} placeholder="-----BEGIN OPENSSH PRIVATE KEY-----" style={{ font: "400 11.5px/1.5 var(--font-mono)" }}/></Field>}
      <Field label="Target systems this account works on" hint="Optional but recommended."><Select value="" onChange={() => {}} options={[["", "Select resources…"], ...(window.SEED_RESOURCES || []).map(r => [r.name, r.name])]}/></Field>
    </div>
    <div style={{ borderTop: "1px solid var(--border)", padding: "12px 24px", display: "flex", gap: 8, justifyContent: "flex-end", background: "var(--bg-surface)" }}>
      <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
      <button className="btn btn-primary" disabled={!name.trim() || !username.trim()} onClick={() => { onSave(name); onClose(); }}>Save reconciliation credential</button>
    </div>
  </Panel>;
};

const ReconDeleteModal = ({ recon, onClose, onConfirm }) => {
  const users = (window.CREDS || []).filter(c => c.adminAcct === recon.display);
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.4)", zIndex: 110 }}/>
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 480, maxWidth: "92vw", background: "var(--bg-app)", border: "1px solid var(--border)", borderRadius: 10, boxShadow: "var(--shadow-lg)", zIndex: 111 }}>
        <div style={{ padding: "16px 20px 12px" }}>
          <h2 style={{ font: "600 15.5px/1.3 var(--font-sans)", color: "var(--fg-1)", margin: 0 }}>Delete {recon.display}?</h2>
          <p style={{ font: "400 13px/1.5 var(--font-sans)", color: "var(--fg-2)", margin: "8px 0 0" }}>This admin account is used by <strong>{users.length || recon.resources} credential{(users.length || recon.resources) !== 1 ? "s" : ""}</strong> for rotation. Rotation will stop for those credentials until a new admin account is assigned.</p>
          {users.length > 0 && <div style={{ marginTop: 10, padding: 10, background: "var(--bg-surface-2)", borderRadius: 6, font: "400 12px/1.6 var(--font-sans)", color: "var(--fg-2)" }}>{users.map(u => <div key={u.id}>• {u.display}</div>)}</div>}
        </div>
        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 8, justifyContent: "flex-end", background: "var(--bg-surface)" }}>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn" style={{ background: "var(--danger)", color: "#fff", borderColor: "var(--danger)" }} onClick={() => { onConfirm(); onClose(); }}>Delete</button>
        </div>
      </div>
    </>
  );
};

// =========================================================
// ROTATION HEALTH DASHBOARD
// =========================================================
const RotationHealthTab = () => {
  const creds = window.useCreds();
  const events = window.ROTATION_EVENTS || [];
  const [rotateId, setRotateId] = React.useState(null);
  const [assignCred, setAssignCred] = React.useState(null);
  const [auditId, setAuditId] = React.useState(null);
  const [driftId, setDriftId] = React.useState(null);
  const [exportOpen, setExportOpen] = React.useState(false);
  const total = creds.length;
  const healthy = creds.filter(c => c.rotation === "healthy").length;
  const failed = creds.filter(c => c.rotation === "failed").length;
  const overdue = creds.filter(c => c.rotation === "overdue").length;
  const noPolicy = creds.filter(c => c.rotation === "no-policy").length;
  const drifted = creds.filter(c => c.rotation === "drifted").length;
  const successRate = total > 0 ? Math.round((healthy / total) * 100) : 0;
  const issues = creds.filter(c => c.rotation !== "healthy");
  const [logFilter, setLogFilter] = React.useState("all");
  const [expanded, setExpanded] = React.useState(null);
  const filtered = logFilter === "all" ? events : events.filter(e => e.result === logFilter);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto" }}>
      {/* Date range header */}
      <div style={{ padding: "12px 24px", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ font: "500 12.5px/1 var(--font-sans)", color: "var(--fg-3)" }}>Date range</div>
        <Select value="7d" onChange={() => {}} options={[["7d","Last 7 days"],["30d","Last 30 days"],["90d","Last 90 days"],["custom","Custom"]]}/>
        <div style={{ flex: 1 }}/>
        <div style={{ position: "relative" }}>
          <button className="btn btn-sm" onClick={() => setExportOpen(o => !o)}><Icon name="download" size={11}/> Export report <Icon name="chevron-down" size={9}/></button>
          {exportOpen && (<>
            <div onClick={() => setExportOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 30 }}/>
            <div style={{ position: "absolute", top: "calc(100% + 4px)", right: 0, zIndex: 31, width: 170, background: "var(--bg-app)", border: "1px solid var(--border)", borderRadius: 8, boxShadow: "var(--shadow-lg)", padding: 4 }}>
              <button className="btn btn-ghost btn-sm" style={{ width: "100%", justifyContent: "flex-start" }} onClick={() => { setExportOpen(false); window.pamToast("Report exported"); }}><Icon name="download" size={11}/> Export as CSV</button>
              <button className="btn btn-ghost btn-sm" style={{ width: "100%", justifyContent: "flex-start" }} onClick={() => { setExportOpen(false); window.pamToast("Report exported"); }}><Icon name="download" size={11}/> Export as PDF</button>
            </div>
          </>)}
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ padding: "16px 24px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <KPICard label="Rotation success rate" value={`${successRate}%`} accent={successRate >= 95 ? "var(--success-fg)" : successRate >= 85 ? "var(--warning-fg)" : "var(--danger-fg)"}/>
        <KPICard label="Failed rotations" value={failed} accent="var(--danger-fg)"/>
        <KPICard label="No policy set" value={noPolicy} accent="var(--fg-3)"/>
        <KPICard label="Drift detected" value={drifted} accent="var(--warning-fg)"/>
      </div>

      {/* Charts */}
      <div style={{ padding: "0 24px 16px", display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 14 }}>
            <div style={{ flex: 1, font: "600 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>Rotation activity over time</div>
            <div style={{ display: "flex", gap: 12, font: "500 11px/1 var(--font-sans)" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: "var(--success-fg)" }}/>Success</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: "var(--danger-fg)" }}/>Failure</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 140 }}>
            {[
              [14,2],[18,1],[22,0],[16,3],[20,1],[24,2],[19,4]
            ].map((d, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                <div style={{ width: "100%", display: "flex", flexDirection: "column-reverse", alignItems: "center" }}>
                  <div style={{ width: "70%", background: "var(--success-fg)", borderRadius: "2px 2px 0 0", height: d[0] * 4 }}/>
                  {d[1] > 0 && <div style={{ width: "70%", background: "var(--danger-fg)", height: d[1] * 4 }}/>}
                </div>
                <span style={{ font: "400 10.5px/1 var(--font-sans)", color: "var(--fg-4)", marginTop: 4 }}>{["May 7","May 8","May 9","May 10","May 11","May 12","Today"][i]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <div style={{ font: "600 13px/1.3 var(--font-sans)", color: "var(--fg-1)", marginBottom: 14 }}>Rotation coverage</div>
          <Donut healthy={healthy} overdue={overdue} noPolicy={noPolicy} failed={failed + drifted}/>
        </div>
      </div>

      {/* Credentials requiring attention */}
      <div style={{ padding: "0 24px 16px" }}>
        <div className="card">
          <div className="card-header"><span className="h-card">Credentials requiring attention</span></div>
          {issues.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", color: "var(--success-fg)", font: "500 13px/1.5 var(--font-sans)" }}>✓ All credentials are healthy</div>
          ) : (
            <table className="table">
              <thead><tr><th>Display name</th><th>Type</th><th>Issue</th><th>Last rotation</th><th>Recommended action</th><th></th></tr></thead>
              <tbody>{issues.map(c => (
                <tr key={c.id}>
                  <td><span style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--brand-fg)" }}>{c.display}</span></td>
                  <td><CRED_TYPE_BADGE type={c.type}/></td>
                  <td><span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><RotationDot status={c.rotation}/>{c.rotation === "failed" ? "Failed" : c.rotation === "overdue" ? "Overdue" : c.rotation === "drifted" ? "Drift detected" : "No policy"}</span></td>
                  <td className="t-tiny" style={{ color: "var(--fg-3)" }}>{c.lastRotated}</td>
                  <td className="t-tiny" style={{ color: "var(--fg-2)" }}>{c.rotation === "drifted" ? "Reconcile drift" : c.rotation === "no-policy" ? "Assign rotation policy" : "Rotate now"}</td>
                  <td style={{ textAlign: "right" }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => c.rotation === "drifted" ? setDriftId(c.id) : c.rotation === "no-policy" ? setAssignCred(c) : (c.adminAcct ? setRotateId(c.id) : window.pamToast("No admin account set — configure reconciliation first", "info"))} disabled={c.rotation !== "drifted" && c.rotation !== "no-policy" && !c.adminAcct} title={c.rotation !== "drifted" && c.rotation !== "no-policy" && !c.adminAcct ? "No admin account set" : ""}>{c.rotation === "drifted" ? "Reconcile" : c.rotation === "no-policy" ? "Assign policy" : "Rotate now"}</button>
                    {(c.rotation === "failed" || c.rotation === "overdue") && <button className="btn btn-ghost btn-sm" style={{ color: "var(--brand-fg)" }} onClick={() => setAuditId(c.id)}>History</button>}
                  </td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>
      </div>

      {/* Recent rotation events log */}
      <div style={{ padding: "0 24px 24px" }}>
        <div className="card">
          <div className="card-header">
            <span className="h-card">Recent rotation events</span>
            <div style={{ flex: 1 }}/>
            <div style={{ display: "flex", gap: 0, background: "var(--bg-surface-2)", border: "1px solid var(--border)", borderRadius: 6, padding: 2 }}>
              {["all","success","failed","skipped"].map(f => (
                <button key={f} onClick={() => setLogFilter(f)} style={{
                  padding: "4px 10px", border: "none",
                  background: logFilter === f ? "var(--bg-app)" : "transparent",
                  color: logFilter === f ? "var(--fg-1)" : "var(--fg-3)",
                  font: `${logFilter === f ? 600 : 500} 11.5px/1 var(--font-sans)`,
                  borderRadius: 4, cursor: "pointer", textTransform: "capitalize",
                }}>{f}</button>
              ))}
            </div>
          </div>
          <table className="table">
            <thead><tr><th>Timestamp</th><th>Credential</th><th>Resource</th><th>Result</th><th>Duration</th><th>Triggered by</th><th></th></tr></thead>
            <tbody>{filtered.map((e, i) => (
              <React.Fragment key={i}>
                <tr style={{ cursor: e.result === "failed" ? "pointer" : "default" }} onClick={() => e.result === "failed" && setExpanded(expanded === i ? null : i)}>
                  <td className="t-tiny" style={{ color: "var(--fg-3)" }}>{e.ts}</td>
                  <td><span className="t-mono" style={{ fontSize: 12, color: "var(--brand-fg)", fontWeight: 500 }}>{e.cred}</span></td>
                  <td className="t-mono" style={{ fontSize: 12, color: "var(--fg-2)" }}>{e.resource}</td>
                  <td>
                    {e.result === "success" && <span style={{ display: "inline-flex", alignItems: "center", gap: 5, font: "500 12px/1 var(--font-sans)", color: "var(--success-fg)" }}>✓ Success</span>}
                    {e.result === "failed"  && <span style={{ display: "inline-flex", alignItems: "center", gap: 5, font: "500 12px/1 var(--font-sans)", color: "var(--danger-fg)" }}>✗ Failed</span>}
                    {e.result === "skipped" && <span style={{ display: "inline-flex", alignItems: "center", gap: 5, font: "500 12px/1 var(--font-sans)", color: "var(--fg-4)" }}>○ Skipped</span>}
                  </td>
                  <td className="t-tiny" style={{ color: "var(--fg-3)" }}>{e.duration}</td>
                  <td className="t-tiny" style={{ color: "var(--fg-3)" }}>{e.by}</td>
                  <td style={{ textAlign: "right" }}>{e.result === "failed" && <Icon name={expanded === i ? "chevron-down" : "chevron-right"} size={11}/>}</td>
                </tr>
                {expanded === i && e.result === "failed" && (
                  <tr><td colSpan={7} style={{ background: "var(--bg-surface-2)" }}>
                    <div style={{ padding: 14, font: "400 12.5px/1.5 var(--font-sans)" }}>
                      <div style={{ color: "var(--danger-fg)", marginBottom: 6 }}><strong>Failure reason:</strong> {e.reason}</div>
                      <div style={{ color: "var(--fg-3)" }}>Retried <strong style={{ color: "var(--fg-2)" }}>{e.retries}×</strong>. Next retry: <strong style={{ color: "var(--fg-2)" }}>{e.nextRetry}</strong></div>
                    </div>
                  </td></tr>
                )}
              </React.Fragment>
            ))}</tbody>
          </table>
        </div>
      </div>

      {rotateId && <RotateNowModal credId={rotateId} onClose={() => setRotateId(null)} onComplete={(id) => { window.credStore.update(id, { rotation: "healthy", lastRotated: "just now" }); window.pamToast("Credential rotated successfully"); }}/>}
      {assignCred && <AssignPolicyModal cred={assignCred} onClose={() => setAssignCred(null)} onAssign={(name, type) => { window.credStore.update(assignCred.id, { policy: name, rotation: "healthy" }); window.pamToast(`Rotation policy assigned to ${assignCred.display}`); }}/>}
      {auditId && <CredAuditTrailPanel credId={auditId} initialTab="rotation" onClose={() => setAuditId(null)}/>}
      {driftId && <DriftPanel credId={driftId} onClose={() => setDriftId(null)}/>}
    </div>
  );
};

const Donut = ({ healthy, overdue, noPolicy, failed }) => {
  const total = healthy + overdue + noPolicy + failed;
  if (total === 0) return <div style={{ color: "var(--fg-4)", font: "400 12.5px var(--font-sans)" }}>No data</div>;
  const r = 52, cx = 64, cy = 64, c = 2 * Math.PI * r;
  let acc = 0;
  const segs = [
    { val: healthy, color: "var(--success-fg)", label: "Healthy" },
    { val: overdue, color: "var(--danger-fg)",  label: "Overdue" },
    { val: noPolicy,color: "var(--fg-4)",       label: "No policy" },
    { val: failed,  color: "var(--warning-fg)", label: "Failed / drift" },
  ];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <svg width={128} height={128} viewBox="0 0 128 128" style={{ flex: "none" }}>
        {segs.map((s, i) => {
          if (s.val === 0) return null;
          const len = (s.val / total) * c;
          const off = -acc;
          acc += len;
          return <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth={18} strokeDasharray={`${len} ${c - len}`} strokeDashoffset={off} transform={`rotate(-90 ${cx} ${cy})`}/>;
        })}
        <text x={cx} y={cy + 4} textAnchor="middle" style={{ font: "600 22px var(--font-sans)", fill: "var(--fg-1)" }}>{total}</text>
      </svg>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
        {segs.map(s => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 8, font: "500 12px/1.4 var(--font-sans)", color: "var(--fg-2)" }}>
            <span style={{ width: 9, height: 9, borderRadius: 2, background: s.color }}/>
            <span style={{ flex: 1 }}>{s.label}</span>
            <span style={{ color: "var(--fg-1)", fontWeight: 600 }}>{s.val}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// =========================================================
// CSV IMPORT PANEL
// =========================================================
const CSVImportPanel = ({ onClose }) => {
  const [stage, setStage] = React.useState(1); // 1: template, 2: upload, 3: preview, 4: progress, 5: complete
  const [progress, setProgress] = React.useState(0);

  const rows = [
    { row: 1, name: "stripe-api-prod", type: "App Secret", username: "—", resources: "stripe-webhook-relay", status: "valid" },
    { row: 2, name: "redis-prod-admin", type: "Password", username: "admin", resources: "redis-session-cache", status: "valid" },
    { row: 3, name: "mysql-replica-ro", type: "Password", username: "replica_user", resources: "audit-readonly-replica", status: "valid" },
    { row: 4, name: "k8s-prod-readonly", type: "Password", username: "kube-readonly", resources: "—", status: "warning", note: "Missing resource IP — credential will be added without resource link" },
    { row: 7, name: "prod-db-root", type: "Password", username: "root", resources: "prod-db-01", status: "warning", note: "Duplicate display name — will update existing credential" },
    { row: 12, name: "test-account", type: "passw", username: "admin", resources: "ssh-server-linux", status: "error", note: "Invalid type 'passw' — should be 'Password'" },
  ];
  const valid = rows.filter(r => r.status === "valid").length;
  const warns = rows.filter(r => r.status === "warning").length;
  const errors = rows.filter(r => r.status === "error").length;

  const startImport = () => {
    setStage(4);
    let p = 0;
    const iv = setInterval(() => {
      p += Math.random() * 18 + 5;
      if (p >= 100) { p = 100; clearInterval(iv); setProgress(100); setTimeout(() => setStage(5), 400); }
      else setProgress(p);
    }, 240);
  };

  return <Panel title="Import credentials via CSV" onClose={onClose}>
    <div className="scroll-area" style={{ flex: 1, overflow: "auto", padding: "20px 24px", maxWidth: 720, margin: "0 auto", width: "100%" }}>

      <div style={{ font: "600 11px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 10 }}>Step 1 · Download template</div>
      <div className="card" style={{ padding: 14, marginBottom: 18, display: "flex", alignItems: "center", gap: 12 }}>
        <Icon name="file-text" size={18} color="var(--brand-fg)"/>
        <div style={{ flex: 1 }}>
          <div style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>Credentials CSV template</div>
          <div style={{ font: "400 11.5px/1.4 var(--font-sans)", color: "var(--fg-3)", marginTop: 2 }}>
            <strong>Required:</strong> Display Name · Username · Password · Type · Resource IP · Sensitivity · Tags
            <br/><strong>Optional:</strong> Owner · Admin Account · Rotation Policy · Notes
          </div>
        </div>
        <button className="btn btn-sm">Download template</button>
      </div>

      <div style={{ font: "600 11px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 10 }}>Step 2 · Upload file</div>
      {stage === 1 ? (
        <div style={{ border: "2px dashed var(--border)", borderRadius: 8, padding: 32, textAlign: "center", marginBottom: 18, background: "var(--bg-surface)" }}>
          <Icon name="upload" size={28} color="var(--fg-4)"/>
          <div style={{ marginTop: 10, font: "500 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>Drag and drop CSV file here</div>
          <div style={{ marginTop: 4, font: "400 12px/1.4 var(--font-sans)", color: "var(--fg-4)" }}>or</div>
          <button className="btn btn-primary btn-sm" style={{ marginTop: 10 }} onClick={() => setStage(2)}>Browse files</button>
        </div>
      ) : (
        <div className="card" style={{ padding: 14, marginBottom: 18, display: "flex", alignItems: "center", gap: 12, background: "var(--success-soft)" }}>
          <Icon name="check-circle" size={16} color="var(--success-fg)"/>
          <div style={{ flex: 1, font: "500 13px/1.3 var(--font-sans)", color: "var(--success-fg)" }}>credentials-batch-may-2026.csv — 24 credentials detected</div>
          <button className="btn btn-ghost btn-sm" onClick={() => setStage(1)}>Replace</button>
        </div>
      )}

      {stage >= 2 && stage <= 3 && (
        <>
          <div style={{ font: "600 11px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 10 }}>Step 3 · Preview & validate</div>
          <div style={{ marginBottom: 10, display: "flex", gap: 8 }}>
            <span style={{ padding: "2px 8px", borderRadius: 999, background: "var(--success-soft)", color: "var(--success-fg)", font: "500 11.5px/1.5 var(--font-sans)" }}>{valid} valid</span>
            <span style={{ padding: "2px 8px", borderRadius: 999, background: "var(--warning-soft)", color: "var(--warning-fg)", font: "500 11.5px/1.5 var(--font-sans)" }}>{warns} warning{warns !== 1 ? "s" : ""}</span>
            <span style={{ padding: "2px 8px", borderRadius: 999, background: "var(--danger-soft)", color: "var(--danger-fg)", font: "500 11.5px/1.5 var(--font-sans)" }}>{errors} error{errors !== 1 ? "s" : ""}</span>
          </div>
          {errors > 0 && (
            <div style={{ padding: 10, background: "var(--warning-soft)", borderRadius: 4, font: "400 12px/1.5 var(--font-sans)", color: "var(--warning-fg)", marginBottom: 12 }}>
              Errors must be fixed before import. Warnings can be imported as-is.
            </div>
          )}

          <div className="card" style={{ overflow: "hidden", marginBottom: 18 }}>
            <table className="table">
              <thead><tr><th>Row</th><th>Display name</th><th>Type</th><th>Username</th><th>Resource</th><th>Issue</th></tr></thead>
              <tbody>{rows.map(r => (
                <tr key={r.row} style={{ background: r.status === "warning" ? "var(--warning-soft)" : r.status === "error" ? "var(--danger-soft)" : "transparent" }}>
                  <td className="t-mono t-tiny" style={{ color: "var(--fg-3)" }}>Row {r.row}</td>
                  <td style={{ font: "500 12.5px/1 var(--font-sans)", color: "var(--fg-1)" }}>{r.name}</td>
                  <td><span className="badge">{r.type}</span></td>
                  <td className="t-mono t-tiny" style={{ color: "var(--fg-2)" }}>{r.username}</td>
                  <td className="t-tiny" style={{ color: "var(--fg-2)" }}>{r.resources}</td>
                  <td style={{ font: "400 12px/1.4 var(--font-sans)", color: r.status === "warning" ? "var(--warning-fg)" : r.status === "error" ? "var(--danger-fg)" : "var(--fg-3)" }}>
                    {r.status === "valid" ? "✓ OK" : r.note}
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </>
      )}

      {stage === 4 && (
        <div style={{ padding: 20, textAlign: "center" }}>
          <div style={{ font: "500 14px/1.4 var(--font-sans)", color: "var(--fg-1)", marginBottom: 10 }}>Importing {valid + warns} credentials…</div>
          <div style={{ height: 6, background: "var(--bg-surface-2)", borderRadius: 999, overflow: "hidden", marginBottom: 8 }}>
            <div style={{ width: `${progress}%`, height: "100%", background: "var(--brand)" }}/>
          </div>
          <div style={{ font: "400 12px/1 var(--font-sans)", color: "var(--fg-3)" }}>{Math.round((valid + warns) * progress / 100)} / {valid + warns} imported</div>
        </div>
      )}

      {stage === 5 && (
        <div style={{ padding: 20, marginBottom: 18 }}>
          <div style={{ padding: 14, background: "var(--success-soft)", borderRadius: 6, color: "var(--success-fg)", font: "500 13px/1.5 var(--font-sans)", marginBottom: 8 }}>✓ {valid} credentials imported successfully</div>
          <div style={{ padding: 14, background: "var(--warning-soft)", borderRadius: 6, color: "var(--warning-fg)", font: "500 13px/1.5 var(--font-sans)", marginBottom: 8 }}>⚠ {warns} imported with warnings (no resource linked)</div>
          <div style={{ padding: 14, background: "var(--danger-soft)", borderRadius: 6, color: "var(--danger-fg)", font: "500 13px/1.5 var(--font-sans)" }}>✗ {errors} skipped due to error — Row 12 invalid type</div>
        </div>
      )}
    </div>

    <div style={{ borderTop: "1px solid var(--border)", padding: "12px 24px", display: "flex", gap: 8, background: "var(--bg-surface)" }}>
      <button className="btn btn-ghost" onClick={onClose}>{stage === 5 ? "Close" : "Cancel"}</button>
      <div style={{ flex: 1 }}/>
      {stage === 2 && <button className="btn btn-primary" onClick={() => setStage(3)}>Continue</button>}
      {stage === 3 && <button className="btn btn-primary" disabled={errors > 0} onClick={startImport}>Import {valid + warns} valid credentials</button>}
      {stage === 5 && <button className="btn btn-primary" onClick={onClose}>Done</button>}
    </div>
  </Panel>;
};

// =========================================================
// CLOUD / IAM ACCOUNTS TAB
// =========================================================
// A saved, pre-filtered view of the credential table for cloud provider root
// accounts and IAM sub-accounts. Root accounts intentionally skip auto-
// rotation (rotating a break-glass root every 30 days is worse than leaving
// it vaulted-and-unused) — the "Vaulted — not auto-rotated" state below is
// distinct from All Credentials' "No policy set" so it doesn't read as
// neglect on a compliance review.
const CLOUD_IAM_MOCK = [
  { id: "cred-aws-root",   display: "aws-root-northwind",       provider: "AWS",   accountType: "Root",             mfa: "enabled",  lastRotated: "Never (by design)", rotation: "vaulted-only", sensitivity: "Critical" },
  { id: "cred-aws-devops", display: "aws-iam-devops",           provider: "AWS",   accountType: "IAM sub-account",  mfa: "enabled",  lastRotated: "12 days ago",       rotation: "healthy",      sensitivity: "High"     },
  { id: "cred-azr-sp",     display: "azure-service-principal-01", provider: "Azure", accountType: "IAM sub-account", mfa: "enabled",  lastRotated: "27 days ago",       rotation: "healthy",      sensitivity: "High"     },
  { id: "cred-azr-root",   display: "azure-root-tenant",         provider: "Azure", accountType: "Root",            mfa: "enabled",  lastRotated: "Never (by design)", rotation: "vaulted-only", sensitivity: "Critical" },
  { id: "cred-gcp-editor", display: "gcp-editor-01",             provider: "GCP",   accountType: "IAM sub-account", mfa: "disabled", lastRotated: "112 days ago",      rotation: "overdue",      sensitivity: "Medium"   },
];

const ProviderIcon = ({ provider }) => {
  const map = {
    AWS:   { label: "AWS",   bg: "#FF9900", fg: "#232F3E" },
    Azure: { label: "Az",    bg: "#0078D4", fg: "#FFFFFF" },
    GCP:   { label: "GCP",   bg: "#4285F4", fg: "#FFFFFF" },
  };
  const m = map[provider] || { label: provider.slice(0,3), bg: "var(--bg-surface-2)", fg: "var(--fg-2)" };
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
    <span style={{ width: 20, height: 20, borderRadius: 4, background: m.bg, color: m.fg, display: "inline-flex", alignItems: "center", justifyContent: "center", font: "700 9px/1 var(--font-sans)", letterSpacing: 0.4 }}>{m.label}</span>
    <span style={{ font: "500 12.5px/1 var(--font-sans)", color: "var(--fg-1)" }}>{provider}</span>
  </span>;
};

const CloudIAMRotationCell = ({ rotation }) => {
  if (rotation === "vaulted-only") {
    return <span className="badge" style={{ background: "var(--info-soft)", color: "var(--info-fg)", borderColor: "transparent", gap: 4 }} title="Vaulted — never auto-rotated by design. Distinct from 'No policy set'.">
      <Icon name="lock" size={10}/> Vaulted — not auto-rotated
    </span>;
  }
  if (rotation === "healthy")  return <span className="badge badge-success">Healthy</span>;
  if (rotation === "overdue")  return <span className="badge badge-danger">Overdue</span>;
  if (rotation === "failed")   return <span className="badge badge-danger">Failed</span>;
  return <span className="badge">{rotation}</span>;
};

const CloudIAMTab = ({ onAdd }) => {
  const rows = CLOUD_IAM_MOCK;
  const stats = {
    total: rows.length,
    rootExposed: rows.filter(r => r.accountType === "Root").length,
    mfaEnabled: rows.filter(r => r.mfa === "enabled").length,
    overdue: rows.filter(r => r.rotation === "overdue" || r.rotation === "failed").length,
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto" }}>
      <div style={{ padding: "14px 24px", borderBottom: "1px solid var(--border-subtle)", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <KPICard label="Total cloud/IAM credentials" value={stats.total}/>
        <KPICard label="Root accounts (vaulted)"     value={stats.rootExposed} accent="var(--info-fg)"/>
        <KPICard label="MFA-enabled"                  value={stats.mfaEnabled}  accent="var(--success-fg)"/>
        <KPICard label="Rotation overdue"             value={stats.overdue}     accent="var(--danger-fg)"/>
      </div>

      <div style={{ padding: "12px 24px 0", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ font: "400 12.5px/1.5 var(--font-sans)", color: "var(--fg-3)", flex: 1 }}>
          Cloud provider root accounts and IAM sub-accounts. Root accounts are vaulted-only by design — they never auto-rotate.
        </div>
        <button className="btn btn-primary btn-sm" onClick={onAdd}><Icon name="plus" size={11}/> Add cloud credential</button>
      </div>

      <div style={{ flex: 1, overflow: "auto", marginTop: 12 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Display name</th>
              <th>Provider</th>
              <th>Account type</th>
              <th>MFA</th>
              <th>Last rotated</th>
              <th>Rotation status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <td><span style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--brand-fg)" }}>{r.display}</span></td>
                <td><ProviderIcon provider={r.provider}/></td>
                <td>
                  {r.accountType === "Root"
                    ? <span className="badge" style={{ background: "var(--warning-soft)", color: "var(--warning-fg)", borderColor: "transparent" }}>Root</span>
                    : <span className="badge">IAM sub-account</span>}
                </td>
                <td>
                  {r.mfa === "enabled"
                    ? <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "var(--success-fg)", font: "500 12.5px/1 var(--font-sans)" }}><Icon name="check" size={11} color="var(--success-fg)"/> Enabled</span>
                    : <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "var(--danger-fg)", font: "500 12.5px/1 var(--font-sans)" }}><Icon name="alert-circle" size={11} color="var(--danger-fg)"/> Disabled</span>}
                </td>
                <td className="t-tiny" style={{ color: r.lastRotated.startsWith("Never") ? "var(--fg-4)" : "var(--fg-3)" }}>{r.lastRotated}</td>
                <td><CloudIAMRotationCell rotation={r.rotation}/></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// =========================================================
// BREAK-GLASS CREDENTIALS TAB
// =========================================================
// Scope note (from spec): this is NOT the incident record system — that lives
// at /break-glass with its own trigger / monitor / review lifecycle. This tab
// is a saved view of credentials tagged break-glass-eligible, showing their
// rotation and sensitivity status and linking OUT to the incident record when
// one is associated with the last use.
const BG_CRED_MOCK = [
  { id: "bg-1", display: "root-primary",         resource: "prod-db-primary",       sensitivity: "Critical", lastUsed: "May 18, 2026",  incidentId: "BG-0147", rotation: "healthy", rotationDetail: "Rotated post-incident" },
  { id: "bg-2", display: "break-glass-oncall",   resource: "auth-server-01",         sensitivity: "Critical", lastUsed: "Never",         incidentId: null,      rotation: "healthy", rotationDetail: "Ready" },
  { id: "bg-3", display: "fallback-admin",       resource: "data-warehouse-bastion", sensitivity: "High",     lastUsed: "Feb 12, 2026",  incidentId: "BG-0091", rotation: "healthy", rotationDetail: "Rotated 3 mo ago" },
  { id: "bg-4", display: "recovery-jumpbox",     resource: "dev-jumpbox",            sensitivity: "Medium",   lastUsed: "Apr 03, 2026",  incidentId: "BG-0122", rotation: "pending", rotationDetail: "Post-incident rotation pending" },
];

const BreakGlassCredsTab = () => {
  const rows = BG_CRED_MOCK;
  const usedInLast30 = rows.filter(r => r.lastUsed && ["May 18, 2026","Apr 03, 2026"].includes(r.lastUsed)).length;
  const rotationPending = rows.filter(r => r.rotation === "pending").length;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto" }}>
      <div style={{ padding: "14px 24px", borderBottom: "1px solid var(--border-subtle)", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        <KPICard label="Total break-glass-eligible credentials" value={rows.length}/>
        <KPICard label="Used in last 30 days"                   value={usedInLast30} accent="var(--warning-fg)"/>
        <KPICard label="Rotation pending (post-incident)"       value={rotationPending} accent="var(--danger-fg)"/>
      </div>

      <div style={{ padding: "12px 24px 0", display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "8px 12px", background: "var(--bg-surface-2)", borderRadius: 6, flex: 1 }}>
          <Icon name="info" size={13} color="var(--fg-3)" style={{ marginTop: 2 }}/>
          <div style={{ font: "400 12px/1.5 var(--font-sans)", color: "var(--fg-3)" }}>
            These are the credentials classified as break-glass-eligible and their rotation status. The <strong>incident lifecycle</strong> (trigger, monitor, review) lives at <a href="#" style={{ color: "var(--brand-fg)" }}>/break-glass →</a>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflow: "auto", marginTop: 12 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Display name</th>
              <th>Resource</th>
              <th>Sensitivity</th>
              <th>Last used (break-glass)</th>
              <th>Rotation status</th>
              <th>Incident record</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <td><span style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--brand-fg)" }}>{r.display}</span></td>
                <td><span className="t-mono" style={{ fontSize: 12, color: "var(--fg-2)" }}>{r.resource}</span></td>
                <td><SensitivityBadge level={r.sensitivity}/></td>
                <td>
                  {r.lastUsed === "Never"
                    ? <span style={{ color: "var(--fg-4)", fontSize: 12.5 }}>Never</span>
                    : <div>
                        <div style={{ fontSize: 12.5, color: "var(--fg-2)" }}>{r.lastUsed}</div>
                        {r.incidentId && <div style={{ font: "400 11.5px/1.3 var(--font-sans)", color: "var(--fg-4)", marginTop: 2 }}>({r.incidentId})</div>}
                      </div>}
                </td>
                <td>
                  {r.rotation === "healthy" && <span className="badge badge-success" style={{ gap: 4 }}><Icon name="check" size={10}/> {r.rotationDetail}</span>}
                  {r.rotation === "pending" && <span className="badge badge-warning" style={{ gap: 4 }}><Icon name="alert-circle" size={10}/> {r.rotationDetail}</span>}
                </td>
                <td>
                  {r.incidentId
                    ? <a href="#" style={{ font: "500 12.5px/1 var(--font-sans)", color: "#7B3EA8", display: "inline-flex", alignItems: "center", gap: 4 }}>View {r.incidentId} <Icon name="chevron-right" size={10} color="#7B3EA8"/></a>
                    : <span style={{ color: "var(--fg-4)", fontSize: 12.5 }}>—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

Object.assign(window, { SSHKeysTab, AppSecretsTab, ReconciliationTab, RotationHealthTab, CSVImportPanel, Donut, CloudIAMTab, BreakGlassCredsTab });
