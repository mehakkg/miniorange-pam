// Certificates — Detail panel (5 sections) + Renew panel + Upload panel + Bulk upload + Discover

// =====================================================
// CERTIFICATE DETAIL PANEL
// =====================================================
const CertDetailPanel = ({ certId, onClose, onRenew }) => {
  const c = (window.CERTS || []).find(x => x.id === certId);
  const [showPEM, setShowPEM] = React.useState(false);
  if (!c) return null;
  const expiringOrExpired = c.status === "Expiring" || c.status === "Critical" || c.status === "Expired";
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.18)", zIndex: 40 }}/>
      <aside style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 520, background: "var(--bg-app)", borderLeft: "1px solid var(--border)", zIndex: 41, display: "flex", flexDirection: "column", boxShadow: "var(--shadow-lg)" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ font: "600 17px/1.3 var(--font-sans)", color: "var(--fg-1)", margin: 0 }}>{c.display}</h2>
            <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
              <CertStatusBadge status={c.status} days={c.daysRemaining}/>
              <SourceBadgeCert source={c.source}/>
              <CertStatusBadge status={c.signedBy}/>
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><Icon name="x" size={14}/></button>
        </div>

        <div className="scroll-area" style={{ flex: 1, overflow: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 22 }}>

          <CertSection title="Certificate info">
            <CertRow k="Common name (CN)">{c.cn}</CertRow>
            <CertRow k="SANs">{c.sans.length ? <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>{c.sans.map(s => <span key={s} style={{ padding: "1px 7px", borderRadius: 4, background: "var(--bg-surface-2)", font: "500 11.5px/1.6 var(--font-sans)", color: "var(--fg-2)" }}>{s}</span>)}</div> : <span style={{ color: "var(--fg-4)" }}>—</span>}</CertRow>
            <CertRow k="Issuer">{c.issuer}</CertRow>
            <CertRow k="Serial number"><MonoTrunc value={c.serial} len={20}/></CertRow>
            <CertRow k="Fingerprint (SHA-256)"><MonoTrunc value={c.fingerprint} len={26}/></CertRow>
            <CertRow k="Key type">{c.keyType}</CertRow>
            <CertRow k="Key size">{c.keySize}</CertRow>
            <CertRow k="Hash algorithm">{c.hash}</CertRow>
            <CertRow k="Issued">{c.issued}</CertRow>
            <CertRow k="Expires"><span>{c.expires} · <DaysChip days={c.daysRemaining}/> days</span></CertRow>
            <CertRow k="Source"><SourceBadgeCert source={c.source}/></CertRow>
            <CertRow k="Passphrase protected">{c.passphrase ? "Yes" : "No"}</CertRow>

            <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
              <button className="btn btn-sm"><Icon name="download" size={11}/> Download</button>
              {expiringOrExpired && <button className="btn btn-sm btn-primary" onClick={() => onRenew?.(c.id)}><Icon name="refresh" size={11}/> Renew</button>}
              <button className="btn btn-sm">Edit display name</button>
              <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger-fg)" }}>Delete</button>
            </div>
          </CertSection>

          <CertSection title="Organization info">
            <CertRow k="Organization">{c.org}</CertRow>
            <CertRow k="Organizational unit">{c.ou}</CertRow>
            <CertRow k="City">{c.city}</CertRow>
            <CertRow k="State">{c.state}</CertRow>
            <CertRow k="Country">{c.country}</CertRow>
            <CertRow k="Email">{c.email}</CertRow>
          </CertSection>

          <CertSection title="Protected resources">
            {c.resources.length === 0 ? (
              <div style={{ padding: 14, border: "1px dashed var(--border)", borderRadius: 6, font: "400 12.5px/1.5 var(--font-sans)", color: "var(--fg-3)", textAlign: "center" }}>
                Not linked to any resource. Link this certificate to the resource it protects.
                <div style={{ marginTop: 10 }}><button className="btn btn-sm"><Icon name="plus" size={11}/> Link to resource</button></div>
              </div>
            ) : (
              <table className="table" style={{ border: "1px solid var(--border)", borderRadius: 6 }}>
                <thead><tr><th>Resource</th><th>Type</th><th>Host</th><th>Env</th><th></th></tr></thead>
                <tbody>
                  {c.resources.map(rn => {
                    const r = (window.SEED_RESOURCES || []).find(x => x.name === rn) || { name: rn, type: "server", host: "—", env: "production" };
                    return (
                      <tr key={rn}>
                        <td className="t-mono" style={{ fontSize: 12, color: "var(--brand-fg)", fontWeight: 500 }}>{r.name}</td>
                        <td><span className="badge" style={{ textTransform: "capitalize" }}>{r.type}</span></td>
                        <td className="t-mono t-tiny" style={{ color: "var(--fg-3)" }}>{r.host}</td>
                        <td><span className="badge" style={{ textTransform: "capitalize" }}>{r.env}</span></td>
                        <td style={{ textAlign: "right" }}><button className="btn btn-ghost btn-sm">Unlink</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
            {c.resources.length > 0 && <button className="btn btn-sm" style={{ marginTop: 8 }}><Icon name="plus" size={11}/> Link to resource</button>}
          </CertSection>

          <CertSection title="Renewal history">
            {c.renewals.length === 0 ? <div style={{ font: "400 12.5px/1.5 var(--font-sans)", color: "var(--fg-4)" }}>No renewal history.</div> :
              <div style={{ display: "flex", flexDirection: "column" }}>
                {c.renewals.map((r, i, arr) => (
                  <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0", position: "relative" }}>
                    {i < arr.length - 1 && <div style={{ position: "absolute", left: 9, top: 24, bottom: -8, width: 1, background: "var(--border)" }}/>}
                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--bg-surface-2)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none", zIndex: 1 }}>
                      <Icon name="refresh" size={10} color="var(--fg-3)"/>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ font: "500 12px/1.4 var(--font-sans)", color: "var(--fg-1)" }}>{i === arr.length - 1 ? "Originally uploaded by" : "Renewed by"} {r.by}</div>
                      <div style={{ font: "400 11px/1 var(--font-sans)", color: "var(--fg-4)", marginTop: 2 }}>{r.ts} · New expiry {r.expiry}</div>
                    </div>
                  </div>
                ))}
              </div>}
          </CertSection>

          <CertSection title="Raw certificate data">
            <button className="btn btn-ghost btn-sm" style={{ padding: 0, color: "var(--brand-fg)" }} onClick={() => setShowPEM(s => !s)}>
              <Icon name={showPEM ? "chevron-down" : "chevron-right"} size={11}/> {showPEM ? "Hide" : "Show"} certificate data
            </button>
            {showPEM && <>
              <textarea readOnly value={`-----BEGIN CERTIFICATE-----\nMIIFazCCA1OgAwIBAgIRAIIQz7DSQONZRGPgu2OCiwAwDQYJKoZIhvcNAQELBQAw\nTzELMAkGA1UEBhMCVVMxKTAnBgNVBAoTIEludGVybmV0IFNlY3VyaXR5IFJlc2Vh\ncmNoIEdyb3VwMRUwEwYDVQQDEwxJU1JHIFJvb3QgWDEwHhcNMTUwNjA0MTEwNDM4\nWhcNMzUwNjA0MTEwNDM4WjBPMQswCQYDVQQGEwJVUzEpMCcGA1UEChMgSW50ZXJu\nZXQgU2VjdXJpdHkgUmVzZWFyY2ggR3JvdXAxFTATBgNVBAMTDElTUkcgUm9vdCBY\nMTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoCggIBAK3oJHP0FDfzm54rVygc\n…\n-----END CERTIFICATE-----`} style={{ marginTop: 10, width: "100%", height: 160, font: "11px/1.5 var(--font-mono)", padding: 10, borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg-surface-2)", color: "var(--fg-2)", resize: "vertical" }}/>
              <div style={{ marginTop: 6, font: "400 11.5px/1.5 var(--font-sans)", color: "var(--fg-4)" }}>Private key is not shown. Download to access the full key bundle.</div>
            </>}
          </CertSection>
        </div>
      </aside>
    </>
  );
};

const CertSection = ({ title, children }) => (
  <div>
    <div style={{ font: "600 10.5px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 10 }}>{title}</div>
    {children}
  </div>
);

const CertRow = ({ k, children }) => (
  <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 12, padding: "5px 0", alignItems: "center" }}>
    <span style={{ font: "400 12px/1.5 var(--font-sans)", color: "var(--fg-4)" }}>{k}</span>
    <span style={{ font: "400 12.5px/1.5 var(--font-sans)", color: "var(--fg-1)" }}>{children}</span>
  </div>
);

// =====================================================
// UPLOAD PANEL
// =====================================================
const CertUploadPanel = ({ onClose }) => {
  const [data, setData] = React.useState({ display: "", domain: "", fileName: "", keyName: "", hasPassphrase: false, passphrase: "", linkRes: false, resource: "", certType: "SSL/TLS", tags: "", notes: "" });
  const [uploaded, setUploaded] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [showAdv, setShowAdv] = React.useState(false);

  const upload = () => {
    if (!data.display || !data.domain || !data.fileName) { setError("Display name, domain and certificate file are required."); return; }
    if (data.domain.includes("expired")) { setError("Certificate file is expired — expiry date was 14 Jan 2025."); return; }
    if (data.fileName.toLowerCase().endsWith(".txt")) { setError("This file doesn't appear to be a valid certificate. Accepted formats: .pem, .crt, .cer, .p7b."); return; }
    setError(null); setUploaded(true);
  };

  if (uploaded) return <Panel title="Upload Certificate" onClose={onClose}>
    <div style={{ padding: 28, maxWidth: 460, margin: "0 auto", textAlign: "center" }}>
      <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--success-soft)", color: "var(--success-fg)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}><Icon name="check" size={26}/></div>
      <div style={{ font: "600 16px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{data.display} uploaded</div>
      <div className="card" style={{ marginTop: 16, padding: 12, background: "var(--bg-surface)", textAlign: "left" }}>
        <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 6, font: "400 12.5px/1.5 var(--font-sans)" }}>
          <span style={{ color: "var(--fg-4)" }}>Domain</span><span style={{ color: "var(--fg-1)" }}>{data.domain}</span>
          <span style={{ color: "var(--fg-4)" }}>Issuer</span><span style={{ color: "var(--fg-1)" }}>DigiCert</span>
          <span style={{ color: "var(--fg-4)" }}>Expires</span><span><DaysChip days={87}/> days · 8 Aug 2026</span>
        </div>
      </div>
      <div style={{ marginTop: 18, display: "flex", gap: 8, justifyContent: "center" }}>
        <button className="btn btn-primary" onClick={onClose}>View certificate</button>
        <button className="btn" onClick={() => { setUploaded(false); setData({ display: "", domain: "", fileName: "", keyName: "", hasPassphrase: false, passphrase: "", linkRes: false, resource: "", certType: "SSL/TLS", tags: "", notes: "" }); }}>Upload another</button>
      </div>
    </div>
  </Panel>;

  return <Panel title="Upload Certificate" onClose={onClose}>
    <div className="scroll-area" style={{ flex: 1, overflow: "auto", padding: "20px 24px", maxWidth: 680, margin: "0 auto", width: "100%" }}>
      <Field label="Display name" required hint="A recognizable name for this certificate — e.g. 'prod-api.securecorp.com'">
        <input className="input" value={data.display} onChange={e => setData({...data, display: e.target.value})} placeholder="prod-api.securecorp.com"/>
      </Field>
      <Field label="Domain name" required hint="The domain this certificate secures — e.g. 'api.securecorp.com'">
        <input className="input" value={data.domain} onChange={e => setData({...data, domain: e.target.value})} placeholder="api.securecorp.com"/>
      </Field>

      <Field label="Certificate file" required hint="Accepted formats: .pem, .crt, .cer, .p7b">
        {!data.fileName ? (
          <div style={{ border: "2px dashed var(--border)", borderRadius: 6, padding: 22, textAlign: "center", background: "var(--bg-surface)" }}>
            <Icon name="upload" size={22} color="var(--fg-4)"/>
            <div style={{ marginTop: 8, font: "500 12.5px/1.3 var(--font-sans)", color: "var(--fg-2)" }}>Drag and drop your certificate file</div>
            <button className="btn btn-sm" style={{ marginTop: 10 }} onClick={() => setData({...data, fileName: "api.securecorp.com.pem"})}>Browse</button>
          </div>
        ) : (
          <div className="card" style={{ padding: 12, display: "flex", alignItems: "center", gap: 10, background: "var(--success-soft)" }}>
            <Icon name="check-circle" size={14} color="var(--success-fg)"/>
            <div style={{ flex: 1, font: "500 12.5px/1.3 var(--font-sans)", color: "var(--success-fg)" }}>{data.fileName} <span style={{ fontWeight: 400, opacity: 0.8 }}>(2.4 KB)</span></div>
            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setData({...data, fileName: ""})}><Icon name="x" size={11}/></button>
          </div>
        )}
      </Field>

      <Field label="Private key file" hint="Optional — upload the private key to enable PAM to use this certificate for proxy connections.">
        {!data.keyName ? (
          <button className="btn" onClick={() => setData({...data, keyName: "api.securecorp.com.key"})}><Icon name="upload" size={11}/> Upload .key file</button>
        ) : (
          <div className="card" style={{ padding: 10, display: "flex", alignItems: "center", gap: 10, background: "var(--bg-surface-2)" }}>
            <Icon name="key" size={13} color="var(--fg-3)"/>
            <div style={{ flex: 1, font: "500 12.5px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{data.keyName} <span style={{ color: "var(--fg-3)", fontWeight: 400 }}>(1.8 KB)</span></div>
            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setData({...data, keyName: "", hasPassphrase: false, passphrase: ""})}><Icon name="x" size={11}/></button>
          </div>
        )}
      </Field>

      {data.keyName && <>
        <Toggle value={data.hasPassphrase} onChange={v => setData({...data, hasPassphrase: v})} label="My private key has a passphrase" hint="Required only if your private key was generated with a passphrase."/>
        {data.hasPassphrase && <Field label="Passphrase" required><input className="input" type="password" value={data.passphrase} onChange={e => setData({...data, passphrase: e.target.value})}/></Field>}
      </>}

      <Toggle value={data.linkRes} onChange={v => setData({...data, linkRes: v})} label="Link to a resource" hint="Link this certificate to the resource it protects to track coverage."/>
      {data.linkRes && (
        <Field label="Resource">
          <Select value={data.resource} onChange={v => setData({...data, resource: v})} options={[["", "Search resources…"], ...(window.SEED_RESOURCES || []).map(r => [r.name, `${r.name} — ${r.host}`])]}/>
        </Field>
      )}

      <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: 12, marginTop: 4 }}>
        <button className="btn btn-ghost btn-sm" style={{ padding: 0, color: "var(--fg-2)" }} onClick={() => setShowAdv(s => !s)}><Icon name={showAdv ? "chevron-down" : "chevron-right"} size={11}/> Advanced settings</button>
        {showAdv && <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 12 }}>
          <Field label="Certificate type"><Select value={data.certType} onChange={v => setData({...data, certType: v})} options={[["SSL/TLS","SSL/TLS"],["Code Signing","Code Signing"],["Client Auth","Client Authentication"],["Generic","Generic"]]}/></Field>
          <Field label="Tags"><input className="input" value={data.tags} onChange={e => setData({...data, tags: e.target.value})} placeholder="production, public"/></Field>
          <Field label="Notes"><textarea className="input" rows={2} value={data.notes} onChange={e => setData({...data, notes: e.target.value})}/></Field>
        </div>}
      </div>

      {error && (
        <div style={{ marginTop: 14, padding: 12, background: "var(--danger-soft)", borderRadius: 6, color: "var(--danger-fg)", font: "500 12.5px/1.5 var(--font-sans)", display: "flex", gap: 8, alignItems: "flex-start" }}>
          <Icon name="alert-circle" size={14}/><span>✗ {error}</span>
        </div>
      )}
    </div>
    <div style={{ borderTop: "1px solid var(--border)", padding: "12px 24px", display: "flex", gap: 8, justifyContent: "flex-end", background: "var(--bg-surface)" }}>
      <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
      <button className="btn btn-primary" onClick={upload}>Upload certificate</button>
    </div>
  </Panel>;
};

// =====================================================
// BULK UPLOAD PANEL
// =====================================================
const CertBulkUploadPanel = ({ onClose }) => {
  const [stage, setStage] = React.useState(1);
  const [progress, setProgress] = React.useState(0);
  const [naming, setNaming] = React.useState("domain");
  const rows = [
    { file: "api.securecorp.com.pem",      domain: "api.securecorp.com",      issuer: "DigiCert",      expiry: "14 Jun 2026", status: "ready" },
    { file: "wildcard-securecorp.crt",     domain: "*.securecorp.com",        issuer: "Let's Encrypt", expiry: "2 Jun 2026",  status: "warning", note: "Duplicate: certificate for this domain already exists — will update" },
    { file: "internal-mtls.pem",           domain: "internal CA",             issuer: "Self-Signed",   expiry: "10 Oct 2029", status: "ready" },
    { file: "payments-securecorp.crt",     domain: "payments.securecorp.com", issuer: "Comodo",        expiry: "5 Jun 2026",  status: "ready" },
    { file: "notes.txt",                    domain: "—",                       issuer: "—",             expiry: "—",           status: "error",   note: "Invalid certificate file — skipped" },
  ];
  const ready = rows.filter(r => r.status === "ready").length;
  const warns = rows.filter(r => r.status === "warning").length;
  const errors = rows.filter(r => r.status === "error").length;

  const startImport = () => {
    setStage(3); let p = 0;
    const iv = setInterval(() => { p += 18 + Math.random() * 10; if (p >= 100) { p = 100; clearInterval(iv); setProgress(100); setTimeout(() => setStage(4), 400); } else setProgress(p); }, 240);
  };

  return <Panel title="Bulk Upload Certificates" onClose={onClose}>
    <div className="scroll-area" style={{ flex: 1, overflow: "auto", padding: "20px 24px", maxWidth: 760, margin: "0 auto", width: "100%" }}>
      <div style={{ font: "600 11px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 10 }}>Step 1 · Upload files</div>
      {stage === 1 ? (
        <div style={{ border: "2px dashed var(--border)", borderRadius: 8, padding: 32, textAlign: "center", marginBottom: 18 }}>
          <Icon name="upload" size={28} color="var(--fg-4)"/>
          <div style={{ marginTop: 10, font: "500 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>Drag and drop multiple certificate files</div>
          <div style={{ marginTop: 4, font: "400 12px/1.4 var(--font-sans)", color: "var(--fg-4)" }}>Accepts .pem, .crt, .cer files</div>
          <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={() => setStage(2)}>Browse files</button>
        </div>
      ) : stage >= 2 && (
        <div className="card" style={{ padding: 14, marginBottom: 18, background: "var(--success-soft)", display: "flex", gap: 10, alignItems: "center" }}>
          <Icon name="check-circle" size={14} color="var(--success-fg)"/>
          <span style={{ flex: 1, font: "500 13px/1.3 var(--font-sans)", color: "var(--success-fg)" }}>5 files uploaded</span>
          <button className="btn btn-ghost btn-sm" onClick={() => setStage(1)}>Replace</button>
        </div>
      )}

      {stage >= 2 && stage <= 2 && <>
        <div style={{ font: "600 11px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 10 }}>Step 2 · Review</div>
        <div style={{ marginBottom: 10, display: "flex", gap: 8 }}>
          <span style={{ padding: "2px 8px", borderRadius: 999, background: "var(--success-soft)", color: "var(--success-fg)", font: "500 11.5px/1.5 var(--font-sans)" }}>{ready} ready</span>
          <span style={{ padding: "2px 8px", borderRadius: 999, background: "var(--warning-soft)", color: "var(--warning-fg)", font: "500 11.5px/1.5 var(--font-sans)" }}>{warns} warning{warns !== 1 ? "s" : ""}</span>
          <span style={{ padding: "2px 8px", borderRadius: 999, background: "var(--danger-soft)", color: "var(--danger-fg)", font: "500 11.5px/1.5 var(--font-sans)" }}>{errors} error{errors !== 1 ? "s" : ""}</span>
        </div>
        <div className="card" style={{ overflow: "hidden", marginBottom: 18 }}>
          <table className="table">
            <thead><tr><th>File</th><th>Detected domain</th><th>Issuer</th><th>Expiry</th><th>Status</th></tr></thead>
            <tbody>{rows.map((r, i) => (
              <tr key={i} style={{ background: r.status === "warning" ? "var(--warning-soft)" : r.status === "error" ? "var(--danger-soft)" : "transparent" }}>
                <td className="t-mono t-tiny" style={{ color: "var(--fg-2)" }}>{r.file}</td>
                <td style={{ font: "500 12.5px/1 var(--font-sans)", color: "var(--fg-1)" }}>{r.domain}</td>
                <td style={{ fontSize: 12.5, color: "var(--fg-2)" }}>{r.issuer}</td>
                <td className="t-tiny" style={{ color: "var(--fg-3)" }}>{r.expiry}</td>
                <td style={{ font: "400 12px/1.4 var(--font-sans)", color: r.status === "warning" ? "var(--warning-fg)" : r.status === "error" ? "var(--danger-fg)" : "var(--success-fg)" }}>{r.status === "ready" ? `✓ Ready — will be uploaded as ${r.domain}` : r.note}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>

        <div className="card" style={{ padding: 14, marginBottom: 18 }}>
          <div style={{ font: "600 12.5px/1 var(--font-sans)", color: "var(--fg-1)", marginBottom: 10 }}>Display names</div>
          {[["domain","Use domain name as display name"],["file","Use filename as display name"],["manual","Set manually per row"]].map(([v, l]) => (
            <label key={v} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", cursor: "pointer" }}>
              <input type="radio" name="naming" checked={naming === v} onChange={() => setNaming(v)} style={{ accentColor: "var(--brand)" }}/>
              <span style={{ font: "500 12.5px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{l}</span>
            </label>
          ))}
        </div>
      </>}

      {stage === 3 && (
        <div style={{ padding: 20, textAlign: "center" }}>
          <div style={{ font: "500 14px/1.4 var(--font-sans)", color: "var(--fg-1)", marginBottom: 10 }}>Uploading {ready + warns} certificates…</div>
          <div style={{ height: 6, background: "var(--bg-surface-2)", borderRadius: 999, overflow: "hidden", marginBottom: 8 }}><div style={{ width: `${progress}%`, height: "100%", background: "var(--brand)" }}/></div>
        </div>
      )}

      {stage === 4 && (
        <div style={{ padding: 16 }}>
          <div style={{ padding: 14, background: "var(--success-soft)", borderRadius: 6, color: "var(--success-fg)", font: "500 13px/1.5 var(--font-sans)", marginBottom: 8 }}>✓ {ready} certificates uploaded successfully</div>
          <div style={{ padding: 14, background: "var(--warning-soft)", borderRadius: 6, color: "var(--warning-fg)", font: "500 13px/1.5 var(--font-sans)", marginBottom: 8 }}>⚠ {warns} updated (duplicate domain)</div>
          <div style={{ padding: 14, background: "var(--danger-soft)", borderRadius: 6, color: "var(--danger-fg)", font: "500 13px/1.5 var(--font-sans)" }}>✗ {errors} skipped due to error</div>
        </div>
      )}
    </div>
    <div style={{ borderTop: "1px solid var(--border)", padding: "12px 24px", display: "flex", gap: 8, justifyContent: "flex-end", background: "var(--bg-surface)" }}>
      <button className="btn btn-ghost" onClick={onClose}>{stage === 4 ? "Close" : "Cancel"}</button>
      {stage === 2 && <button className="btn btn-primary" disabled={errors > 0 && false} onClick={startImport}>Upload {ready + warns} certificates</button>}
      {stage === 4 && <button className="btn btn-primary" onClick={onClose}>Done</button>}
    </div>
  </Panel>;
};

// =====================================================
// DISCOVER PANEL (web scan + cloud)
// =====================================================
const CertDiscoverPanel = ({ mode, onClose }) => {
  // mode: "web" | "aws" | "gcp" | "azure"
  const [phase, setPhase] = React.useState("idle");
  const [progress, setProgress] = React.useState(0);
  const [target, setTarget] = React.useState(mode === "web" ? "192.168.1.0/24" : "");
  const [ports, setPorts] = React.useState("443, 8443");
  const [schedule, setSchedule] = React.useState(false);
  const [selected, setSelected] = React.useState(new Set());

  const results = mode === "web" ? [
    { ip: "192.168.1.10",  hostname: "auth-server",       domain: "auth.securecorp.com",       issuer: "DigiCert",      expiry: "18 Sep 2026", days: 128, status: "Valid",    err: null },
    { ip: "192.168.1.18",  hostname: "internal-proxy",    domain: "proxy.internal.local",      issuer: "Self-Signed",   expiry: "12 Jan 2027", days: 244, status: "Valid",    err: "Self-signed — no CA verification" },
    { ip: "192.168.1.22",  hostname: "ledger-api",        domain: "ledger.securecorp.com",     issuer: "Let's Encrypt", expiry: "20 May 2026", days: 7,   status: "Critical", err: null },
    { ip: "192.168.1.31",  hostname: "log-relay",         domain: "logs.securecorp.com",       issuer: "Let's Encrypt", expiry: "19 May 2026", days: 6,   status: "Critical", err: null },
    { ip: "192.168.1.42",  hostname: "—",                 domain: "—",                          issuer: "—",             expiry: "—",           days: null, status: "Error",   err: "TLS handshake failed — host not reachable" },
    { ip: "192.168.1.55",  hostname: "bastion-host",      domain: "bastion.securecorp.com",    issuer: "DigiCert",      expiry: "14 Aug 2026", days: 93,  status: "Valid",    err: null },
  ] : [
    { ip: "—", hostname: "—", domain: "api.securecorp.com",       issuer: "AWS ACM Internal", expiry: "14 Jun 2027", days: 397, region: "us-east-1", status: "Valid", err: null },
    { ip: "—", hostname: "—", domain: "*.securecorp.com",         issuer: "AWS ACM Internal", expiry: "20 Mar 2027", days: 311, region: "us-east-1", status: "Valid", err: null },
    { ip: "—", hostname: "—", domain: "payments.securecorp.com",  issuer: "AWS ACM Internal", expiry: "5 Jun 2026",  days: 23,  region: "us-west-2", status: "Expiring", err: null },
    { ip: "—", hostname: "—", domain: "events.securecorp.com",    issuer: "AWS ACM Internal", expiry: "10 May 2026", days: -3,  region: "eu-west-1", status: "Expired",  err: null },
  ];

  const start = () => {
    setPhase("running"); setProgress(0);
    const iv = setInterval(() => { setProgress(p => { const np = p + 14 + Math.random() * 8; if (np >= 100) { clearInterval(iv); setPhase("done"); return 100; } return np; }); }, 280);
  };

  const toggle = (i) => setSelected(s => { const n = new Set(s); n.has(i) ? n.delete(i) : n.add(i); return n; });

  const title = mode === "web" ? "Discover Certificates — Web Scan" : mode === "aws" ? "Discover Certificates — AWS" : mode === "gcp" ? "Discover Certificates — GCP" : "Discover Certificates — Azure";

  return <Panel title={title} onClose={onClose}>
    <div className="scroll-area" style={{ flex: 1, overflow: "auto", padding: "20px 24px" }}>
      {phase === "idle" && mode === "web" && (
        <div style={{ maxWidth: 600, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label="IP address / hostname range" required hint="Enter a single IP, range (192.168.1.1-50), or CIDR (192.168.1.0/24)">
            <input className="input t-mono" value={target} onChange={e => setTarget(e.target.value)}/>
          </Field>
          <Field label="Ports" hint="PAM will check these ports for TLS certificates.">
            <input className="input t-mono" value={ports} onChange={e => setPorts(e.target.value)}/>
          </Field>
          <Field label="Timeout (seconds)"><input className="input" type="number" defaultValue={5} style={{ width: 120 }}/></Field>
          <div className="card" style={{ padding: 12 }}>
            <Toggle value={schedule} onChange={setSchedule} label="Schedule recurring scan" hint="Run this scan on a regular interval to catch new certificates."/>
            {schedule && <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field label="Frequency"><Select value="Weekly" onChange={() => {}} options={[["Daily","Daily"],["Weekly","Weekly"],["Monthly","Monthly"]]}/></Field>
              <Field label="Time"><input className="input" type="time" defaultValue="03:00"/></Field>
            </div>}
          </div>
          <button className="btn btn-primary" onClick={start}><Icon name="discovery" size={12}/> Start scan</button>
        </div>
      )}

      {phase === "idle" && mode !== "web" && (
        <div style={{ maxWidth: 600, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ padding: 12, background: "var(--success-soft)", borderRadius: 6, display: "flex", alignItems: "center", gap: 10 }}>
            <Icon name="check-circle" size={14} color="var(--success-fg)"/>
            <span style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--success-fg)" }}>Connected to AWS account 491-552-103</span>
          </div>
          <Field label="Region"><Select value="all" onChange={() => {}} options={[["all","All regions"],["us-east-1","us-east-1"],["us-west-2","us-west-2"],["eu-west-1","eu-west-1"]]}/></Field>
          <button className="btn btn-primary" onClick={start}><Icon name="cloud" size={12}/> Scan AWS Certificate Manager</button>
        </div>
      )}

      {phase === "running" && (
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <div style={{ font: "500 13.5px/1.4 var(--font-sans)", color: "var(--fg-1)", marginBottom: 8 }}>
            {mode === "web" ? `Scanning ${target} — ${Math.floor(progress * 2.56)} of 256 hosts checked` : `Scanning AWS Certificate Manager`}
          </div>
          <div style={{ height: 6, background: "var(--bg-surface-2)", borderRadius: 999, overflow: "hidden", marginBottom: 14 }}><div style={{ width: `${progress}%`, height: "100%", background: "var(--brand)" }}/></div>
          <div className="card" style={{ overflow: "hidden" }}>
            <table className="table">
              <thead><tr>{mode === "web" && <th>IP</th>}{mode === "web" && <th>Hostname</th>}<th>Domain</th><th>Issuer</th><th>Expiry</th><th>Status</th></tr></thead>
              <tbody>{results.slice(0, Math.floor(progress / 18)).map((r, i) => (
                <tr key={i}>
                  {mode === "web" && <td className="t-mono t-tiny" style={{ color: "var(--fg-2)" }}>{r.ip}</td>}
                  {mode === "web" && <td className="t-tiny" style={{ color: "var(--fg-2)" }}>{r.hostname}</td>}
                  <td style={{ font: "500 12.5px/1 var(--font-sans)", color: "var(--fg-1)" }}>{r.domain}</td>
                  <td style={{ fontSize: 12.5, color: "var(--fg-2)" }}>{r.issuer}</td>
                  <td className="t-tiny" style={{ color: "var(--fg-3)" }}>{r.expiry}</td>
                  <td>{r.status !== "Error" ? <CertStatusBadge status={r.status} days={r.days}/> : <span style={{ color: "var(--danger-fg)", fontSize: 12 }}>Error</span>}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {phase === "done" && (
        <div style={{ maxWidth: 880, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ flex: 1, font: "600 14px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>Scan complete — {results.filter(r => r.status !== "Error").length} certificates found</div>
            {selected.size > 0 && <>
              <span style={{ font: "500 12.5px/1 var(--font-sans)", color: "var(--brand-fg)" }}>{selected.size} selected</span>
              <button className="btn btn-sm btn-primary">Add to PAM Certificates</button>
              <button className="btn btn-sm">Ignore selected</button>
            </>}
          </div>
          <div className="card" style={{ overflow: "hidden" }}>
            <table className="table">
              <thead><tr>
                <th style={{ width: 32 }}><input type="checkbox" onChange={e => setSelected(e.target.checked ? new Set(results.map((_, i) => i)) : new Set())} style={{ accentColor: "var(--brand)" }}/></th>
                {mode === "web" && <th>IP</th>}{mode === "web" && <th>Hostname</th>}
                <th>Domain</th><th>Issuer</th><th>Expiry</th><th>Days</th><th>Status</th>{mode !== "web" && <th>Region</th>}<th>Action</th>
              </tr></thead>
              <tbody>{results.map((r, i) => (
                <tr key={i}>
                  <td><input type="checkbox" checked={selected.has(i)} onChange={() => toggle(i)} style={{ accentColor: "var(--brand)" }}/></td>
                  {mode === "web" && <td className="t-mono t-tiny" style={{ color: "var(--fg-2)" }}>{r.ip}</td>}
                  {mode === "web" && <td className="t-tiny" style={{ color: "var(--fg-2)" }}>{r.hostname}</td>}
                  <td style={{ font: "500 12.5px/1 var(--font-sans)", color: "var(--fg-1)" }}>{r.domain}</td>
                  <td style={{ fontSize: 12.5, color: "var(--fg-2)" }}>{r.issuer}</td>
                  <td className="t-tiny" style={{ color: "var(--fg-3)" }}>{r.expiry}</td>
                  <td>{r.days != null ? <DaysChip days={r.days}/> : <span style={{ color: "var(--fg-4)" }}>—</span>}</td>
                  <td>
                    {r.status === "Error" ? <span style={{ color: "var(--danger-fg)", fontSize: 12 }} title={r.err}>{r.err}</span> : <CertStatusBadge status={r.status} days={r.days}/>}
                    {r.err && r.status !== "Error" && <div style={{ font: "400 11px/1.4 var(--font-sans)", color: "var(--warning-fg)", marginTop: 2 }}>{r.err}</div>}
                  </td>
                  {mode !== "web" && <td className="t-tiny" style={{ color: "var(--fg-3)" }}>{r.region}</td>}
                  <td style={{ textAlign: "right" }}>{r.status !== "Error" ? <><button className="btn btn-sm btn-primary">Add</button><button className="btn btn-ghost btn-sm">Ignore</button></> : <span style={{ color: "var(--fg-4)" }}>—</span>}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  </Panel>;
};

// =====================================================
// RENEW PANEL
// =====================================================
const CertRenewPanel = ({ certId, onClose }) => {
  const c = (window.CERTS || []).find(x => x.id === certId);
  const [mode, setMode] = React.useState("same");
  const [validity, setValidity] = React.useState("1 year");
  const [phase, setPhase] = React.useState("idle");
  if (!c) return null;
  const isExpired = c.daysRemaining < 0;
  const willCASign = c.signedBy === "CA Signed";

  const renew = () => {
    setPhase(willCASign ? "running" : "running");
    setTimeout(() => setPhase("success"), 1400);
  };

  if (phase === "success") return <Panel title={`Renew — ${c.display}`} onClose={onClose}>
    <div style={{ padding: 28, textAlign: "center" }}>
      <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--success-soft)", color: "var(--success-fg)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}><Icon name="check" size={26}/></div>
      <div style={{ font: "600 16px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>Certificate renewed</div>
      <div className="card" style={{ marginTop: 16, padding: 12, background: "var(--bg-surface)", textAlign: "left", maxWidth: 380, margin: "16px auto 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 6, font: "400 12.5px/1.5 var(--font-sans)" }}>
          <span style={{ color: "var(--fg-4)" }}>Domain</span><span>{c.cn}</span>
          <span style={{ color: "var(--fg-4)" }}>New expiry</span><span>{validity === "1 year" ? "13 May 2027" : "13 May 2028"}</span>
          <span style={{ color: "var(--fg-4)" }}>Signed by</span><span>{c.issuer}</span>
        </div>
      </div>
      <button className="btn btn-primary" style={{ marginTop: 18 }} onClick={onClose}>View certificate</button>
    </div>
  </Panel>;

  return <Panel title={`Renew Certificate — ${c.display}`} onClose={onClose}>
    <div className="scroll-area" style={{ flex: 1, overflow: "auto", padding: "20px 24px", maxWidth: 680, margin: "0 auto", width: "100%" }}>
      <div className="card" style={{ padding: 14, marginBottom: 16, borderLeft: `3px solid ${isExpired ? "var(--danger-fg)" : "var(--warning-fg)"}` }}>
        <div style={{ font: "500 11px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>Current certificate</div>
        <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 6, font: "400 12.5px/1.5 var(--font-sans)" }}>
          <span style={{ color: "var(--fg-4)" }}>Domain</span><span style={{ color: "var(--fg-1)" }}>{c.cn}</span>
          <span style={{ color: "var(--fg-4)" }}>Issuer</span><span style={{ color: "var(--fg-1)" }}>{c.issuer}</span>
          <span style={{ color: "var(--fg-4)" }}>Current expiry</span><span style={{ color: isExpired ? "var(--danger-fg)" : "var(--warning-fg)", fontWeight: 500 }}>{c.expires} — {isExpired ? `${Math.abs(c.daysRemaining)} days expired` : `${c.daysRemaining} days remaining`}</span>
          <span style={{ color: "var(--fg-4)" }}>Key type</span><span style={{ color: "var(--fg-1)" }}>{c.keyType} · {c.keySize}</span>
        </div>
      </div>

      <div style={{ marginBottom: 12 }}><Segmented value={mode} onChange={setMode} options={[{value:"same",label:"Use same settings"},{value:"change",label:"Change settings"}]}/></div>

      {mode === "same" && (
        <div className="card" style={{ padding: 14, marginBottom: 14, background: "var(--bg-surface-2)" }}>
          <div style={{ font: "500 12.5px/1.4 var(--font-sans)", color: "var(--fg-2)", marginBottom: 10 }}>
            {willCASign ? <>Originally signed by <strong style={{ color: "var(--fg-1)" }}>{c.issuer}</strong> — will use the same CA.</> : <>Originally self-signed — PAM will generate a new self-signed certificate.</>}
          </div>
          {!willCASign && (
            <Field label="Validity period"><Select value={validity} onChange={setValidity} options={[["1 year","1 year"],["2 years","2 years"],["Custom","Custom"]]}/></Field>
          )}
        </div>
      )}

      {mode === "change" && (
        <div style={{ padding: 14, background: "var(--brand-soft)", borderRadius: 6, font: "400 12.5px/1.5 var(--font-sans)", color: "var(--fg-2)", marginBottom: 14 }}>
          Opens the same form as Create Certificate Step 1 with current values pre-filled. You can then proceed to Step 2 to choose the signing method.
        </div>
      )}

      {phase === "running" && (
        <div className="card" style={{ padding: 14, marginBottom: 14 }}>
          <div style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--fg-1)", marginBottom: 10 }}>{willCASign ? `Requesting renewal from ${c.issuer}…` : "Generating new self-signed certificate…"}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", font: "400 12.5px/1 var(--font-sans)", color: "var(--success-fg)" }}>✓ CSR generated</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", font: "400 12.5px/1 var(--font-sans)", color: "var(--fg-1)" }}><Spinner size={11}/> {willCASign ? `Submitting to ${c.issuer}` : "Signing certificate"}</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", font: "400 12.5px/1 var(--font-sans)", color: "var(--fg-4)" }}>○ Saving to vault</div>
          </div>
        </div>
      )}
    </div>
    <div style={{ borderTop: "1px solid var(--border)", padding: "12px 24px", display: "flex", gap: 8, justifyContent: "flex-end", background: "var(--bg-surface)" }}>
      <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
      {phase === "idle" && <button className="btn btn-primary" onClick={renew}><Icon name="refresh" size={11}/> Renew certificate</button>}
    </div>
  </Panel>;
};

Object.assign(window, { CertDetailPanel, CertUploadPanel, CertBulkUploadPanel, CertDiscoverPanel, CertRenewPanel });
