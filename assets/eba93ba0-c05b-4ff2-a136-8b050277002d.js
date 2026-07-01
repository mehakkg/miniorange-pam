// Certificates — Create flow (full page, 2 steps + 3 success variants) + CSRs tab + CA Providers tab

// =====================================================
// CREATE CERTIFICATE — FULL PAGE FLOW
// =====================================================
const CertCreatePage = ({ onClose }) => {
  const [step, setStep] = React.useState(1);
  const [showAdv, setShowAdv] = React.useState(false);
  const [data, setData] = React.useState({
    display: "", cn: "", sans: [], email: "", org: "SecureCorp Pvt Ltd", ou: "", city: "Mumbai", state: "MH", country: "IN",
    template: "",
    keyType: "RSA", keySize: "2048", curve: "P-256", hash: "SHA-256",
    encrypt: false, passphrase: "", confirmPassphrase: "",
    signing: "csr", caId: "", validity: "1 year",
  });
  const [sanInput, setSanInput] = React.useState("");
  const [phase, setPhase] = React.useState("idle"); // idle | csr-done | ca-running | ca-success | ca-fail | self-done
  const set = (k, v) => setData(d => ({ ...d, [k]: v }));

  const cas = window.CA_PROVIDERS || [];

  const addSan = () => { const v = sanInput.trim(); if (v && !data.sans.includes(v)) { set("sans", [...data.sans, v]); setSanInput(""); } };

  const onSave = () => {
    if (data.signing === "csr") setPhase("csr-done");
    else if (data.signing === "self") setPhase("self-done");
    else {
      setPhase("ca-running");
      setTimeout(() => setPhase(data.cn.includes("invalid") ? "ca-fail" : "ca-success"), 1800);
    }
  };

  // Success states
  if (phase === "csr-done") return <CSRSuccessPage data={data} onClose={onClose}/>;
  if (phase === "ca-running") return <CASigningProgressPage caName={(cas.find(c => c.id === data.caId) || {}).name} onClose={onClose}/>;
  if (phase === "ca-success") return <CASignedSuccessPage data={data} caName={(cas.find(c => c.id === data.caId) || {}).name} onClose={onClose}/>;
  if (phase === "ca-fail") return <CASigningFailedPage data={data} caName={(cas.find(c => c.id === data.caId) || {}).name} onRetry={() => setPhase("idle")} onClose={onClose}/>;
  if (phase === "self-done") return <SelfSignedSuccessPage data={data} onClose={onClose}/>;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, font: "400 12px/1 var(--font-sans)", color: "var(--fg-4)" }}>
            <a href="#" onClick={e => { e.preventDefault(); onClose(); }} style={{ color: "var(--brand-fg)" }}>Certificates</a><Icon name="chevron-right" size={10}/><span>Create Certificate</span>
          </div>
          <h1 style={{ font: "600 22px/1.2 var(--font-sans)", color: "var(--fg-1)", margin: "6px 0 0" }}>Create Certificate</h1>
          <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center" }}>
            {[{n:1,l:"Certificate Details"},{n:2,l:"Certificate Signing"}].map((s, i) => {
              const done = step > s.n, active = step === s.n;
              return <React.Fragment key={s.n}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: done ? "var(--success)" : active ? "var(--brand)" : "var(--bg-surface-2)", color: done || active ? "#fff" : "var(--fg-3)", display: "flex", alignItems: "center", justifyContent: "center", font: "600 11px/1 var(--font-sans)", border: !done && !active ? "1px solid var(--border)" : "none" }}>{done ? <Icon name="check" size={11} color="#fff"/> : s.n}</div>
                  <span style={{ font: `${active ? 600 : 500} 12.5px/1 var(--font-sans)`, color: active ? "var(--fg-1)" : done ? "var(--fg-2)" : "var(--fg-4)" }}>{s.l}</span>
                </div>
                {i === 0 && <div style={{ width: 44, height: 1, background: done ? "var(--success)" : "var(--border)" }}/>}
              </React.Fragment>;
            })}
          </div>
        </div>
        <a href="#" onClick={e => { e.preventDefault(); onClose(); }} style={{ font: "500 12.5px/1 var(--font-sans)", color: "var(--fg-3)" }}>Cancel</a>
      </div>

      <div className="scroll-area" style={{ flex: 1, overflow: "auto", padding: 24 }}>
        {step === 1 && (
          <div style={{ maxWidth: 920, margin: "0 auto" }}>
            <div style={{ font: "600 16px/1.3 var(--font-sans)", color: "var(--fg-1)", marginBottom: 6 }}>Certificate Details</div>
            <div style={{ font: "400 13px/1.5 var(--font-sans)", color: "var(--fg-3)", marginBottom: 24 }}>Define the certificate's identity and cryptographic settings. These become part of the certificate's subject and determine how it's recognized by browsers and systems.</div>

            <div className="card" style={{ padding: 20 }}>
              <div style={{ font: "600 11px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 14 }}>Basic information</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <Field label="Display name" required hint="A recognizable name in PAM — not part of the certificate itself.">
                  <input className="input" value={data.display} onChange={e => set("display", e.target.value)} placeholder="api.securecorp.com"/>
                </Field>
                <Field label="Domain name (Common Name)" required hint="The primary domain this certificate protects — e.g. 'api.securecorp.com'">
                  <input className="input" value={data.cn} onChange={e => set("cn", e.target.value)} placeholder="api.securecorp.com"/>
                </Field>
                <Field label="Subject Alternative Names (SANs)" hint="Additional domains. Type and press Enter.">
                  <div style={{ padding: 6, border: "1px solid var(--border)", borderRadius: 6, background: "var(--bg-surface)", display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center", minHeight: 36 }}>
                    {data.sans.map(s => <span key={s} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 7px 2px 8px", borderRadius: 4, background: "var(--brand-soft)", color: "var(--brand-fg)", font: "500 12px/1.5 var(--font-sans)" }}>
                      {s}
                      <button onClick={() => set("sans", data.sans.filter(x => x !== s))} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 0, color: "var(--brand-fg)", display: "inline-flex" }}><Icon name="x" size={10}/></button>
                    </span>)}
                    <input value={sanInput} onChange={e => setSanInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addSan(); } }} placeholder="www.securecorp.com" style={{ flex: 1, minWidth: 120, border: "none", outline: "none", font: "400 12.5px/1 var(--font-sans)", background: "transparent" }}/>
                  </div>
                </Field>
                <Field label="Email" hint="Contact email associated with this certificate request.">
                  <input className="input" value={data.email} onChange={e => set("email", e.target.value)} placeholder="security@securecorp.com"/>
                </Field>
                <Field label="Organization" required><input className="input" value={data.org} onChange={e => set("org", e.target.value)}/></Field>
                <Field label="Organizational unit"><input className="input" value={data.ou} onChange={e => set("ou", e.target.value)} placeholder="IT Security"/></Field>
                <Field label="City" required><input className="input" value={data.city} onChange={e => set("city", e.target.value)}/></Field>
                <Field label="State" required><input className="input" value={data.state} onChange={e => set("state", e.target.value)}/></Field>
                <Field label="Country" required><Select value={data.country} onChange={v => set("country", v)} options={[["IN","IN — India"],["US","US — United States"],["GB","GB — United Kingdom"],["DE","DE — Germany"],["SG","SG — Singapore"]]}/></Field>
                <Field label="CSR template" hint="Saved org details to skip re-entry.">
                  <div style={{ display: "flex", gap: 6 }}>
                    <Select value={data.template} onChange={v => { set("template", v); const t = (window.CSR_TEMPLATES || []).find(x => x.id === v); if (t) { setData(d => ({...d, org: t.org, ou: t.ou, city: t.city, state: t.state, country: t.country, email: t.email, keyType: t.keyType, hash: t.hash })); } }} options={[["", "Don't use a template"], ...(window.CSR_TEMPLATES || []).map(t => [t.id, t.name])]}/>
                    <button className="btn btn-sm">Save as template</button>
                  </div>
                </Field>
              </div>
            </div>

            <div className="card" style={{ padding: 20, marginTop: 14 }}>
              <button className="btn btn-ghost btn-sm" style={{ padding: 0, color: "var(--fg-2)", marginBottom: showAdv ? 14 : 0 }} onClick={() => setShowAdv(s => !s)}>
                <Icon name={showAdv ? "chevron-down" : "chevron-right"} size={11}/> Advanced settings
              </button>
              {showAdv && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <Field label="Key type" required>
                    <Segmented value={data.keyType} onChange={v => set("keyType", v)} options={[{value:"RSA",label:"RSA"},{value:"ECDSA",label:"ECDSA"}]}/>
                  </Field>
                  {data.keyType === "RSA" ? (
                    <Field label="Key size"><Select value={data.keySize} onChange={v => set("keySize", v)} options={[["2048","2048 (Recommended)"],["4096","4096"]]}/></Field>
                  ) : (
                    <Field label="Curve"><Select value={data.curve} onChange={v => set("curve", v)} options={[["P-256","P-256"],["P-384","P-384"],["P-521","P-521"]]}/></Field>
                  )}
                  <Field label="Hash algorithm" required>
                    <Select value={data.hash} onChange={v => set("hash", v)} options={[["SHA-256","SHA-256 (Recommended)"],["SHA-384","SHA-384"],["SHA-512","SHA-512"]]}/>
                  </Field>
                  <div className="card" style={{ padding: 12, background: "var(--bg-surface-2)", gridColumn: "1/-1" }}>
                    <Toggle value={data.encrypt} onChange={v => set("encrypt", v)} label="Encrypt private key with passphrase"/>
                    {data.encrypt && <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <Field label="Passphrase" required><input className="input" type="password" value={data.passphrase} onChange={e => set("passphrase", e.target.value)}/></Field>
                      <Field label="Confirm passphrase" required><input className="input" type="password" value={data.confirmPassphrase} onChange={e => set("confirmPassphrase", e.target.value)}/></Field>
                      <div style={{ gridColumn: "1/-1", padding: 10, background: "var(--warning-soft)", borderRadius: 4, font: "500 12px/1.4 var(--font-sans)", color: "var(--warning-fg)" }}>⚠ Store this passphrase securely. You will need it to use the private key.</div>
                    </div>}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ maxWidth: 920, margin: "0 auto" }}>
            <div style={{ font: "600 16px/1.3 var(--font-sans)", color: "var(--fg-1)", marginBottom: 6 }}>Certificate Signing</div>
            <div style={{ font: "400 13px/1.5 var(--font-sans)", color: "var(--fg-3)", marginBottom: 24 }}>Choose how this certificate will be signed. This determines who vouches for your domain's identity.</div>

            <SigningCard
              active={data.signing === "csr"}
              onClick={() => set("signing", "csr")}
              title="Save CSR & Key"
              desc="Generate and save a Certificate Signing Request and private key. You can then submit the CSR to an external Certificate Authority of your choice."
              useWhen="You have a preferred external CA (DigiCert, Let's Encrypt, Comodo) not configured in PAM."
            >
              {data.signing === "csr" && (
                <div style={{ marginTop: 14, padding: 14, background: "var(--bg-surface-2)", borderRadius: 6, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                  <div>
                    <div style={{ font: "600 11px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Basic information</div>
                    <CertRow k="Domain">{data.cn || "—"}</CertRow>
                    <CertRow k="Email">{data.email || "—"}</CertRow>
                    <CertRow k="Organization">{data.org || "—"}</CertRow>
                    <CertRow k="Org unit">{data.ou || "—"}</CertRow>
                    <CertRow k="City">{data.city || "—"}</CertRow>
                    <CertRow k="State">{data.state || "—"}</CertRow>
                    <CertRow k="Country">{data.country || "—"}</CertRow>
                  </div>
                  <div>
                    <div style={{ font: "600 11px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Advanced settings</div>
                    <CertRow k="Key type">{data.keyType}</CertRow>
                    <CertRow k="Key size">{data.keyType === "RSA" ? data.keySize : data.curve}</CertRow>
                    <CertRow k="Hash">{data.hash}</CertRow>
                    <CertRow k="Encryption">{data.encrypt ? "Passphrase-protected" : "None"}</CertRow>
                  </div>
                </div>
              )}
            </SigningCard>

            <SigningCard
              active={data.signing === "ca"}
              onClick={() => set("signing", "ca")}
              title="Certificate Authority Signed"
              desc="Sign using a Certificate Authority configured in PAM. PAM submits the CSR and retrieves the signed certificate automatically."
              useWhen="You've configured a CA provider in PAM's CA Providers section."
            >
              {data.signing === "ca" && (
                <div style={{ marginTop: 14 }}>
                  {cas.length === 0 ? (
                    <div style={{ padding: 12, background: "var(--warning-soft)", color: "var(--warning-fg)", borderRadius: 4, font: "500 12.5px/1.5 var(--font-sans)" }}>No CA providers configured. <a href="#" style={{ color: "var(--warning-fg)", textDecoration: "underline" }}>Add one in the CA Providers tab.</a></div>
                  ) : (
                    <Field label="Certificate Authority provider" required>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {cas.map(ca => {
                          const sel = data.caId === ca.id;
                          return <button key={ca.id} onClick={() => set("caId", ca.id)} style={{
                            padding: 12, border: `1px solid ${sel ? "var(--brand)" : "var(--border)"}`,
                            background: sel ? "var(--brand-soft)" : "var(--bg-surface)",
                            borderRadius: 6, cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 12,
                          }}>
                            <div style={{ width: 14, height: 14, borderRadius: "50%", border: `2px solid ${sel ? "var(--brand)" : "var(--border)"}`, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                              {sel && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--brand)" }}/>}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ font: "600 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{ca.name}</div>
                              <div style={{ font: "400 11.5px/1.4 var(--font-sans)", color: "var(--fg-3)", marginTop: 2 }}>{ca.type}</div>
                            </div>
                            <CertStatusBadge status={ca.status}/>
                          </button>;
                        })}
                      </div>
                    </Field>
                  )}
                </div>
              )}
            </SigningCard>

            <SigningCard
              active={data.signing === "self"}
              onClick={() => set("signing", "self")}
              title="Self-Signed Certificate"
              desc="PAM generates and signs the certificate itself. Suitable for internal tools and testing — browsers will show a security warning for public-facing services."
              useWhen="Internal use only — not for public-facing production services."
            >
              {data.signing === "self" && (
                <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <Field label="Certificate display name" required><input className="input" value={data.display} onChange={e => set("display", e.target.value)}/></Field>
                  <Field label="Domain"><input className="input" value={data.cn} disabled style={{ background: "var(--bg-surface-2)" }}/></Field>
                  <Field label="Validity period" required>
                    <Select value={data.validity} onChange={v => set("validity", v)} options={[["30 days","30 days"],["90 days","90 days"],["1 year","1 year"],["2 years","2 years"],["Custom","Custom"]]}/>
                  </Field>
                  <Field label="Hash algorithm">
                    <Select value={data.hash} onChange={v => set("hash", v)} options={[["SHA-256","SHA-256 (Recommended)"],["SHA-384","SHA-384"],["SHA-512","SHA-512"]]}/>
                  </Field>
                </div>
              )}
            </SigningCard>
          </div>
        )}
      </div>

      <div style={{ padding: "12px 24px", borderTop: "1px solid var(--border)", display: "flex", gap: 8, justifyContent: "flex-end", background: "var(--bg-surface)" }}>
        {step === 1 ? <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={!data.display || !data.cn || !data.org} onClick={() => setStep(2)}>Next: Certificate Signing →</button>
        </> : <>
          <button className="btn" onClick={() => setStep(1)}>← Back</button>
          <div style={{ flex: 1 }}/>
          <button className="btn btn-primary" disabled={data.signing === "ca" && !data.caId} onClick={onSave}>
            {data.signing === "ca" ? "Request & Sign Certificate" : "Save Certificate"}
          </button>
        </>}
      </div>
    </div>
  );
};

const SigningCard = ({ active, onClick, title, desc, useWhen, children }) => (
  <div onClick={!active ? onClick : undefined} style={{
    padding: 18, border: `1px solid ${active ? "var(--brand)" : "var(--border)"}`,
    background: active ? "var(--brand-soft)" : "var(--bg-surface)",
    borderRadius: 8, marginBottom: 10, cursor: active ? "default" : "pointer",
  }}>
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
      <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${active ? "var(--brand)" : "var(--border-strong)"}`, display: "flex", alignItems: "center", justifyContent: "center", flex: "none", marginTop: 2 }}>
        {active && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--brand)" }}/>}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ font: "600 14.5px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{title}</div>
        <div style={{ font: "400 12.5px/1.5 var(--font-sans)", color: "var(--fg-3)", marginTop: 6 }}>{desc}</div>
        <div style={{ font: "400 11.5px/1.5 var(--font-sans)", color: "var(--fg-4)", marginTop: 6 }}><strong>Use when:</strong> {useWhen}</div>
        {children}
      </div>
    </div>
  </div>
);

// =====================================================
// CREATE SUCCESS / FAIL PAGES
// =====================================================
const CSRSuccessPage = ({ data, onClose }) => (
  <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto", padding: 32 }}>
    <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
      <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--success-soft)", color: "var(--success-fg)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}><Icon name="check" size={30}/></div>
      <h1 style={{ font: "600 22px/1.2 var(--font-sans)", color: "var(--fg-1)", margin: 0 }}>CSR and private key generated</h1>
      <p style={{ font: "400 13.5px/1.5 var(--font-sans)", color: "var(--fg-3)", marginTop: 8 }}>{data.display} · {data.cn}</p>

      <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, textAlign: "left" }}>
        <div className="card" style={{ padding: 16 }}>
          <Icon name="file-text" size={20} color="var(--brand-fg)"/>
          <div style={{ font: "600 13.5px/1.3 var(--font-sans)", color: "var(--fg-1)", marginTop: 8 }}>Certificate Signing Request</div>
          <div className="t-tiny" style={{ color: "var(--fg-4)", marginTop: 4 }}>{data.cn}.csr · 1.2 KB</div>
          <button className="btn btn-primary btn-sm" style={{ marginTop: 12, width: "100%" }}><Icon name="download" size={11}/> Download CSR</button>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <Icon name="key" size={20} color="var(--brand-fg)"/>
          <div style={{ font: "600 13.5px/1.3 var(--font-sans)", color: "var(--fg-1)", marginTop: 8 }}>Private Key</div>
          <div className="t-tiny" style={{ color: "var(--fg-4)", marginTop: 4 }}>{data.cn}.key · 1.8 KB</div>
          <button className="btn btn-primary btn-sm" style={{ marginTop: 12, width: "100%" }}><Icon name="download" size={11}/> Download Private Key</button>
        </div>
      </div>

      <div style={{ marginTop: 14, padding: 14, background: "var(--warning-soft)", borderRadius: 8, color: "var(--warning-fg)", font: "500 12.5px/1.5 var(--font-sans)", textAlign: "left", display: "flex", gap: 10, alignItems: "flex-start", borderLeft: "3px solid var(--warning-fg)" }}>
        <Icon name="alert-circle" size={14}/>
        <span>⚠ Download your private key now. PAM does not store the unencrypted private key and it cannot be retrieved later.</span>
      </div>

      <div className="card" style={{ marginTop: 16, padding: 18, textAlign: "left", borderLeft: "3px solid var(--warning-fg)" }}>
        <div style={{ font: "600 12.5px/1 var(--font-sans)", color: "var(--fg-1)", marginBottom: 10 }}>Next steps</div>
        <ol style={{ margin: 0, paddingLeft: 22, font: "400 12.5px/1.7 var(--font-sans)", color: "var(--fg-2)" }}>
          <li>Download the CSR file above</li>
          <li>Submit the CSR to your Certificate Authority</li>
          <li>When you receive the signed certificate, upload it via <strong>Certificates → Upload Certificate</strong></li>
          <li>Link it to the resource it protects</li>
        </ol>
      </div>

      <div style={{ marginTop: 18, display: "flex", gap: 8, justifyContent: "center" }}>
        <button className="btn" onClick={onClose}>Go to All Certificates</button>
        <button className="btn btn-primary">Upload signed certificate now</button>
      </div>
    </div>
  </div>
);

const CASigningProgressPage = ({ caName, onClose }) => (
  <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto", padding: 32 }}>
    <div style={{ maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
      <Spinner size={36}/>
      <h1 style={{ font: "600 19px/1.3 var(--font-sans)", color: "var(--fg-1)", margin: "16px 0 8px" }}>Requesting certificate from {caName}…</h1>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, textAlign: "left", marginTop: 24, padding: 14, border: "1px solid var(--border)", borderRadius: 8 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", font: "400 13px/1 var(--font-sans)", color: "var(--success-fg)" }}>✓ CSR generated</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", font: "400 13px/1 var(--font-sans)", color: "var(--fg-1)" }}><Spinner size={11}/> Submitting to {caName}…</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", font: "400 13px/1 var(--font-sans)", color: "var(--fg-4)" }}>○ Awaiting signed certificate</div>
      </div>
    </div>
  </div>
);

const CASignedSuccessPage = ({ data, caName, onClose }) => (
  <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto", padding: 32 }}>
    <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center" }}>
      <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--success-soft)", color: "var(--success-fg)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}><Icon name="check" size={30}/></div>
      <h1 style={{ font: "600 22px/1.2 var(--font-sans)", color: "var(--fg-1)", margin: 0 }}>Certificate signed and saved by {caName}</h1>
      <div className="card" style={{ marginTop: 18, padding: 16, textAlign: "left" }}>
        <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 8, font: "400 12.5px/1.5 var(--font-sans)" }}>
          <span style={{ color: "var(--fg-4)" }}>Domain</span><span style={{ color: "var(--fg-1)" }}>{data.cn}</span>
          <span style={{ color: "var(--fg-4)" }}>Expires</span><span>13 May 2027 · <DaysChip days={365}/> days</span>
          <span style={{ color: "var(--fg-4)" }}>Issuer</span><span style={{ color: "var(--fg-1)" }}>{caName}</span>
        </div>
      </div>
      <div style={{ marginTop: 18, display: "flex", gap: 8, justifyContent: "center" }}>
        <button className="btn btn-primary" onClick={onClose}>View certificate</button>
        <button className="btn" onClick={onClose}>Create another</button>
      </div>
    </div>
  </div>
);

const CASigningFailedPage = ({ data, caName, onRetry, onClose }) => (
  <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto", padding: 32 }}>
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--danger-soft)", color: "var(--danger-fg)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Icon name="x" size={22}/></div>
        <div style={{ flex: 1 }}>
          <h1 style={{ font: "600 19px/1.3 var(--font-sans)", color: "var(--fg-1)", margin: 0 }}>CA signing failed</h1>
          <div style={{ font: "400 13px/1.5 var(--font-sans)", color: "var(--fg-3)", marginTop: 4 }}>Submitted to {caName} for {data.cn}</div>
        </div>
      </div>
      <div style={{ marginTop: 18, padding: 14, background: "var(--danger-soft)", color: "var(--danger-fg)", borderRadius: 8, font: "400 13px/1.5 var(--font-sans)" }}>
        <strong>Reason:</strong> Domain validation failed — CNAME record for <span className="t-mono">{data.cn}</span> not found.
      </div>
      <div style={{ marginTop: 14, padding: 14, background: "var(--bg-surface-2)", borderRadius: 8, font: "400 12.5px/1.5 var(--font-sans)", color: "var(--fg-2)" }}>
        <strong>Suggested fix:</strong> Create the CNAME record requested by {caName} in your DNS settings. The record details were sent to <span className="t-mono">{data.email}</span>. Once the record is live, retry the request.
      </div>
      <div style={{ marginTop: 18, display: "flex", gap: 8 }}>
        <button className="btn btn-primary" onClick={onRetry}><Icon name="refresh" size={11}/> Retry</button>
        <button className="btn" onClick={onRetry}>Save as CSR instead</button>
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
      </div>
    </div>
  </div>
);

const SelfSignedSuccessPage = ({ data, onClose }) => (
  <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto", padding: 32 }}>
    <div style={{ maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
      <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--success-soft)", color: "var(--success-fg)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}><Icon name="check" size={26}/></div>
      <h1 style={{ font: "600 19px/1.2 var(--font-sans)", color: "var(--fg-1)", margin: 0 }}>Self-signed certificate created</h1>
      <div className="card" style={{ marginTop: 18, padding: 14, textAlign: "left" }}>
        <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 6, font: "400 12.5px/1.5 var(--font-sans)" }}>
          <span style={{ color: "var(--fg-4)" }}>Domain</span><span>{data.cn}</span>
          <span style={{ color: "var(--fg-4)" }}>Expires</span><span>{data.validity === "1 year" ? "in 365 days" : data.validity === "2 years" ? "in 730 days" : data.validity}</span>
        </div>
      </div>
      <div style={{ marginTop: 14, padding: 12, background: "var(--warning-soft)", color: "var(--warning-fg)", borderRadius: 6, font: "500 12.5px/1.5 var(--font-sans)" }}>
        ⚠ This is a self-signed certificate. Browsers and systems will show a security warning. Use only for internal services.
      </div>
      <div style={{ marginTop: 18, display: "flex", gap: 8, justifyContent: "center" }}>
        <button className="btn btn-primary" onClick={onClose}>View certificate</button>
        <button className="btn" onClick={onClose}>Create another</button>
      </div>
    </div>
  </div>
);

// =====================================================
// CSRs TAB
// =====================================================
const CSRsTab = ({ onCreate }) => {
  const [openId, setOpenId] = React.useState(null);
  const [tplOpen, setTplOpen] = React.useState(false);
  const csrs = window.CSRS || [];
  const pending = csrs.filter(c => c.status === "Pending").length;
  const signed = csrs.filter(c => c.status === "Signed").length;
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto" }}>
      <div style={{ padding: "16px 24px 8px", display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ flex: 1 }}/>
        <button className="btn" onClick={() => setTplOpen(true)}><Icon name="file-text" size={11}/> CSR Templates</button>
        <button className="btn btn-primary" onClick={onCreate}><Icon name="plus" size={11}/> Generate CSR</button>
      </div>

      <div style={{ padding: "0 24px 8px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        <KPICard label="Total CSRs" value={csrs.length}/>
        <KPICard label="Pending" value={pending} accent="var(--brand-fg)"/>
        <KPICard label="Signed" value={signed} accent="var(--success-fg)"/>
      </div>

      <div style={{ flex: 1, overflow: "auto" }}>
        {csrs.length === 0 ? (
          <EmptyState icon="file-text" title="No CSRs generated yet" description="Generate a Certificate Signing Request to get a certificate signed by an external CA." action={<button className="btn btn-primary" onClick={onCreate}><Icon name="plus" size={11}/> Generate CSR</button>}/>
        ) : (
          <table className="table">
            <thead><tr><th style={{ width: 32 }}><input type="checkbox" style={{ accentColor: "var(--brand)" }}/></th><th>Common name / Domain</th><th>Organization</th><th>Key type</th><th>Key size</th><th>Hash</th><th>Created</th><th>Status</th><th></th></tr></thead>
            <tbody>{csrs.map(csr => (
              <tr key={csr.id} onClick={() => setOpenId(csr.id)} style={{ cursor: "pointer", borderLeft: csr.status === "Pending" ? "3px solid var(--warning-fg)" : "3px solid transparent" }}>
                <td onClick={e => e.stopPropagation()}><input type="checkbox" style={{ accentColor: "var(--brand)" }}/></td>
                <td><span style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--brand-fg)" }}>{csr.cn}</span></td>
                <td style={{ fontSize: 12.5, color: "var(--fg-2)" }}>{csr.org}</td>
                <td><span className="badge">{csr.keyType}</span></td>
                <td className="t-tiny" style={{ color: "var(--fg-3)" }}>{csr.keySize}</td>
                <td className="t-tiny" style={{ color: "var(--fg-3)" }}>{csr.hash}</td>
                <td className="t-tiny" style={{ color: "var(--fg-3)" }}>{csr.created}</td>
                <td><CertStatusBadge status={csr.status}/></td>
                <td onClick={e => e.stopPropagation()} style={{ textAlign: "right" }}>
                  {csr.status === "Pending" ? <button className="btn btn-sm btn-primary">Upload signed cert</button> : <button className="btn btn-ghost btn-sm btn-icon"><Icon name="more-h" size={13}/></button>}
                </td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>

      {openId && <CSRDetailPanel csrId={openId} onClose={() => setOpenId(null)}/>}
      {tplOpen && <CSRTemplatesPanel onClose={() => setTplOpen(false)}/>}
    </div>
  );
};

const CSRDetailPanel = ({ csrId, onClose }) => {
  const csr = (window.CSRS || []).find(x => x.id === csrId);
  const [showData, setShowData] = React.useState(false);
  if (!csr) return null;
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.18)", zIndex: 40 }}/>
      <aside style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 520, background: "var(--bg-app)", borderLeft: "1px solid var(--border)", zIndex: 41, display: "flex", flexDirection: "column", boxShadow: "var(--shadow-lg)" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ font: "600 17px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{csr.cn}</div>
            <div style={{ marginTop: 8 }}><CertStatusBadge status={csr.status}/></div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><Icon name="x" size={14}/></button>
        </div>
        <div className="scroll-area" style={{ flex: 1, overflow: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 22 }}>
          <CertSection title="CSR details">
            <CertRow k="Common name">{csr.cn}</CertRow>
            <CertRow k="SANs">{csr.sans.length ? <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>{csr.sans.map(s => <span key={s} style={{ padding: "1px 7px", borderRadius: 4, background: "var(--bg-surface-2)", font: "500 11.5px/1.6 var(--font-sans)", color: "var(--fg-2)" }}>{s}</span>)}</div> : "—"}</CertRow>
            <CertRow k="Organization">{csr.org}</CertRow>
            <CertRow k="Org unit">{csr.ou}</CertRow>
            <CertRow k="Location">{csr.city}, {csr.state}, {csr.country}</CertRow>
            <CertRow k="Email">{csr.email}</CertRow>
            <CertRow k="Key type">{csr.keyType}</CertRow>
            <CertRow k="Key size">{csr.keySize}</CertRow>
            <CertRow k="Hash algorithm">{csr.hash}</CertRow>
            <CertRow k="Created">{csr.created}</CertRow>
            <CertRow k="Passphrase">{csr.passphrase ? "Protected" : "Not protected"}</CertRow>
          </CertSection>

          <CertSection title="Status & actions">
            {csr.status === "Pending" ? (
              <div className="card" style={{ padding: 14, background: "var(--brand-soft)" }}>
                <div style={{ font: "600 13px/1.3 var(--font-sans)", color: "var(--brand-fg)", marginBottom: 8 }}>Waiting for signed certificate</div>
                <div style={{ font: "400 12.5px/1.6 var(--font-sans)", color: "var(--fg-2)", marginBottom: 14 }}>
                  <strong>What to do next:</strong>
                  <ol style={{ margin: "8px 0 0", paddingLeft: 22 }}>
                    <li>Download the CSR file and submit it to your Certificate Authority</li>
                    <li>When you receive the signed .crt file, upload it here</li>
                  </ol>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <button className="btn btn-primary"><Icon name="download" size={11}/> Download CSR</button>
                  <button className="btn"><Icon name="download" size={11}/> Download private key</button>
                  <div style={{ font: "400 11.5px/1.4 var(--font-sans)", color: "var(--warning-fg)" }}>⚠ Store securely — not retrievable after this</div>
                  <button className="btn btn-primary"><Icon name="upload" size={11}/> Upload signed certificate</button>
                </div>
              </div>
            ) : (
              <div className="card" style={{ padding: 14, background: "var(--success-soft)" }}>
                <div style={{ font: "600 13px/1.3 var(--font-sans)", color: "var(--success-fg)", marginBottom: 6 }}>Certificate received and saved</div>
                <a href="#" style={{ font: "500 12.5px/1 var(--font-sans)", color: "var(--success-fg)" }}>View certificate →</a>
              </div>
            )}
          </CertSection>

          <CertSection title="Raw CSR data">
            <button className="btn btn-ghost btn-sm" style={{ padding: 0, color: "var(--brand-fg)" }} onClick={() => setShowData(s => !s)}><Icon name={showData ? "chevron-down" : "chevron-right"} size={11}/> {showData ? "Hide" : "Show"} CSR data</button>
            {showData && <>
              <textarea readOnly value={`-----BEGIN CERTIFICATE REQUEST-----\nMIICvDCCAaQCAQAwdzELMAkGA1UEBhMCSU4xCzAJBgNVBAgMAk1IMQ8wDQYDVQQH\nDAZNdW1iYWkxGjAYBgNVBAoMEVNlY3VyZUNvcnAgUHZ0IEx0ZDEUMBIGA1UECwwL\nSVQgU2VjdXJpdHkxGDAWBgNVBAMMD2FwaS5leGFtcGxlLmNvbTCCASIwDQYJKoZI\nhvcNAQEBBQADggEPADCCAQoCggEBAKaG2tQEz4n6QyaUbMQ…\n-----END CERTIFICATE REQUEST-----`} style={{ marginTop: 10, width: "100%", height: 140, font: "11px/1.5 var(--font-mono)", padding: 10, borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg-surface-2)", color: "var(--fg-2)" }}/>
              <div style={{ marginTop: 6, font: "400 11.5px/1.5 var(--font-sans)", color: "var(--fg-4)" }}>Submit this to your Certificate Authority.</div>
            </>}
          </CertSection>
        </div>
      </aside>
    </>
  );
};

const CSRTemplatesPanel = ({ onClose }) => {
  const [adding, setAdding] = React.useState(false);
  const tpls = window.CSR_TEMPLATES || [];
  return <Panel title="CSR Templates" onClose={onClose}>
    <div className="scroll-area" style={{ flex: 1, overflow: "auto", padding: 20 }}>
      <div style={{ marginBottom: 14, display: "flex", alignItems: "center" }}>
        <div style={{ flex: 1, font: "500 12.5px/1 var(--font-sans)", color: "var(--fg-3)" }}>{tpls.length} templates</div>
        {!adding && <button className="btn btn-primary btn-sm" onClick={() => setAdding(true)}><Icon name="plus" size={11}/> Add template</button>}
      </div>

      {adding && (
        <div className="card" style={{ padding: 16, marginBottom: 14 }}>
          <div style={{ font: "600 13px/1 var(--font-sans)", color: "var(--fg-1)", marginBottom: 12 }}>New template</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="Template name" required><input className="input" placeholder="Engineering — RSA 4096"/></Field>
            <Field label="Organization" required><input className="input" defaultValue="SecureCorp Pvt Ltd"/></Field>
            <Field label="Org unit"><input className="input"/></Field>
            <Field label="City" required><input className="input" defaultValue="Mumbai"/></Field>
            <Field label="State" required><input className="input" defaultValue="MH"/></Field>
            <Field label="Country" required><Select value="IN" onChange={() => {}} options={[["IN","IN"],["US","US"]]}/></Field>
            <Field label="Email"><input className="input"/></Field>
            <Field label="Key type"><Segmented value="RSA" onChange={() => {}} options={[{value:"RSA",label:"RSA"},{value:"ECDSA",label:"ECDSA"}]}/></Field>
            <Field label="Key size"><Select value="2048" onChange={() => {}} options={[["2048","2048"],["4096","4096"]]}/></Field>
            <Field label="Hash"><Select value="SHA-256" onChange={() => {}} options={[["SHA-256","SHA-256"]]}/></Field>
          </div>
          <div style={{ marginTop: 12, display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button className="btn btn-ghost" onClick={() => setAdding(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={() => setAdding(false)}>Save template</button>
          </div>
        </div>
      )}

      {tpls.map(t => (
        <div key={t.id} className="card" style={{ padding: 14, marginBottom: 8, display: "flex", alignItems: "center", gap: 12 }}>
          <Icon name="file-text" size={16} color="var(--brand-fg)"/>
          <div style={{ flex: 1 }}>
            <div style={{ font: "600 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{t.name}</div>
            <div className="t-tiny" style={{ color: "var(--fg-3)", marginTop: 2 }}>{t.org} · {t.ou} · {t.country} · {t.keyType} {t.keySize} · {t.hash}</div>
          </div>
          <span className="t-tiny" style={{ color: "var(--fg-4)" }}>Last used {t.lastUsed}</span>
          <button className="btn btn-sm">Use</button>
          <button className="btn btn-ghost btn-icon btn-sm"><Icon name="more-h" size={13}/></button>
        </div>
      ))}
    </div>
  </Panel>;
};

// =====================================================
// CA PROVIDERS TAB
// =====================================================
const CAProvidersTab = ({ onAdd }) => {
  const [dismissed, setDismissed] = React.useState(false);
  const cas = window.CA_PROVIDERS || [];
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto" }}>
      <div style={{ padding: "16px 24px 8px", display: "flex", alignItems: "center" }}>
        <div style={{ flex: 1 }}/>
        <button className="btn btn-primary" onClick={onAdd}><Icon name="plus" size={11}/> Add CA provider</button>
      </div>
      {!dismissed && (
        <div style={{ margin: "0 24px 16px", padding: 14, background: "var(--brand-soft)", borderRadius: 8, display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{ width: 32, height: 32, borderRadius: 6, background: "var(--bg-app)", color: "var(--brand-fg)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Icon name="info" size={16}/></div>
          <div style={{ flex: 1, font: "400 12.5px/1.5 var(--font-sans)", color: "var(--fg-2)" }}>
            <strong style={{ color: "var(--fg-1)" }}>CA Providers are Certificate Authorities that PAM can contact directly to sign certificates on your behalf.</strong> Once configured, you can select a CA provider when creating a certificate — PAM handles the signing process automatically.
          </div>
          <button className="btn btn-ghost btn-icon" onClick={() => setDismissed(true)}><Icon name="x" size={12}/></button>
        </div>
      )}

      <div style={{ flex: 1, overflow: "auto" }}>
        {cas.length === 0 ? (
          <EmptyState icon="shield-check" title="No CA providers configured" description="Add a Certificate Authority provider so PAM can automatically sign certificates on your behalf. You can always sign manually by submitting the CSR to your CA externally." action={<button className="btn btn-primary" onClick={onAdd}><Icon name="plus" size={11}/> Add CA provider</button>}/>
        ) : (
          <table className="table">
            <thead><tr><th>CA name</th><th>Type</th><th>Status</th><th>Last used</th><th>Certificates signed</th><th></th></tr></thead>
            <tbody>{cas.map(ca => (
              <tr key={ca.id} style={{ cursor: "pointer" }}>
                <td><span style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--brand-fg)" }}>{ca.name}</span></td>
                <td><span className="badge">{ca.type}</span></td>
                <td><CertStatusBadge status={ca.status}/></td>
                <td className="t-tiny" style={{ color: "var(--fg-3)" }}>{ca.lastUsed}</td>
                <td style={{ fontSize: 12.5, color: "var(--fg-2)" }}>{ca.signedCount}</td>
                <td style={{ textAlign: "right" }}><button className="btn btn-ghost btn-sm">Test connection</button><button className="btn btn-ghost btn-sm btn-icon"><Icon name="more-h" size={13}/></button></td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const AddCAPanel = ({ onClose }) => {
  const [type, setType] = React.useState(null);
  const [testResult, setTestResult] = React.useState(null);
  const types = [
    { id: "ACME",    label: "ACME",                       desc: "Automates certificate issuance using the ACME protocol. Compatible with Let's Encrypt, ZeroSSL, Buypass." },
    { id: "MS",      label: "Microsoft Certificate Authority", desc: "Integrates with an on-premise Microsoft CA via DCOM/RPC." },
    { id: "AWS",     label: "AWS Certificate Manager",    desc: "Manages certificates in your AWS account via ACM API." },
    { id: "Custom",  label: "Custom CA",                  desc: "Connect to a custom CA using a generic HTTPS API." },
  ];
  const test = (ok) => setTestResult(ok ? { ok: true, msg: "Connection successful — Let's Encrypt responded correctly." } : { ok: false, msg: "Connection failed — DNS resolution for acme-v02.api.letsencrypt.org failed. Check firewall/proxy settings." });

  return <Panel title="Add CA Provider" onClose={onClose}>
    <div className="scroll-area" style={{ flex: 1, overflow: "auto", padding: "20px 24px", maxWidth: 680, margin: "0 auto", width: "100%" }}>
      {!type ? <>
        <div style={{ font: "600 11px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 12 }}>CA Type</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {types.map(t => (
            <button key={t.id} onClick={() => setType(t.id)} style={{
              padding: 14, border: "1px solid var(--border)", background: "var(--bg-surface)",
              borderRadius: 8, cursor: "pointer", textAlign: "left",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--brand)"; e.currentTarget.style.background = "var(--brand-soft)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--bg-surface)"; }}
            >
              <div style={{ font: "600 14px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{t.label}</div>
              <div style={{ font: "400 12px/1.5 var(--font-sans)", color: "var(--fg-3)", marginTop: 6 }}>{t.desc}</div>
            </button>
          ))}
        </div>
      </> : <>
        <button className="btn btn-ghost btn-sm" style={{ padding: 0, color: "var(--brand-fg)", marginBottom: 12 }} onClick={() => setType(null)}><Icon name="chevron-left" size={11}/> Back to CA types</button>

        {type === "ACME" && <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Field label="CA name" required><input className="input" placeholder="Let's Encrypt" defaultValue="Let's Encrypt"/></Field>
          <Field label="ACME directory URL" required hint="The ACME directory endpoint — e.g. 'https://acme-v02.api.letsencrypt.org/directory'"><input className="input t-mono" defaultValue="https://acme-v02.api.letsencrypt.org/directory"/></Field>
          <Field label="Contact email" required hint="Used for expiry notifications from CA"><input className="input" placeholder="security@securecorp.com"/></Field>
          <Field label="Key type"><Segmented value="ECDSA P-256" onChange={() => {}} options={[{value:"RSA 2048",label:"RSA 2048"},{value:"RSA 4096",label:"RSA 4096"},{value:"ECDSA P-256",label:"ECDSA P-256"}]}/></Field>
        </div>}

        {type === "MS" && <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Field label="CA name" required><input className="input" placeholder="Internal MS-CA"/></Field>
          <Field label="Server address" required><input className="input t-mono" placeholder="ca.securecorp.local"/></Field>
          <Field label="Username" required><input className="input" placeholder="svc.pam.ca"/></Field>
          <Field label="Password" required><input className="input" type="password"/></Field>
          <Field label="CA template"><input className="input" placeholder="WebServer"/></Field>
        </div>}

        {type === "AWS" && <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Field label="CA name" required><input className="input" placeholder="AWS ACM Production"/></Field>
          <Field label="AWS region" required><Select value="us-east-1" onChange={() => {}} options={[["us-east-1","us-east-1"],["us-west-2","us-west-2"],["eu-west-1","eu-west-1"],["ap-south-1","ap-south-1"]]}/></Field>
          <Field label="Access Key ID" required><input className="input t-mono"/></Field>
          <Field label="Secret Access Key" required><input className="input" type="password"/></Field>
        </div>}

        {type === "Custom" && <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Field label="CA name" required><input className="input" placeholder="DigiCert Enterprise"/></Field>
          <Field label="API endpoint URL" required><input className="input t-mono" placeholder="https://api.digicert.com/v3"/></Field>
          <Field label="Authentication method"><Select value="API Key" onChange={() => {}} options={[["API Key","API Key"],["Bearer Token","Bearer Token"],["Basic Auth","Basic Auth"],["mTLS","mTLS"]]}/></Field>
          <Field label="API key" required><input className="input t-mono" type="password"/></Field>
        </div>}

        <div style={{ marginTop: 14, padding: 14, background: "var(--bg-surface-2)", borderRadius: 6 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-sm" onClick={() => test(true)}>Test connection</button>
            <button className="btn btn-sm btn-ghost" onClick={() => test(false)} title="Simulate failure">Test (simulate fail)</button>
          </div>
          {testResult && (
            <div style={{ marginTop: 10, padding: 10, background: testResult.ok ? "var(--success-soft)" : "var(--danger-soft)", color: testResult.ok ? "var(--success-fg)" : "var(--danger-fg)", borderRadius: 4, font: "500 12.5px/1.5 var(--font-sans)" }}>
              {testResult.ok ? "✓" : "✗"} {testResult.msg}
            </div>
          )}
        </div>
      </>}
    </div>
    <div style={{ borderTop: "1px solid var(--border)", padding: "12px 24px", display: "flex", gap: 8, justifyContent: "flex-end", background: "var(--bg-surface)" }}>
      <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
      {type && <button className="btn btn-primary" onClick={onClose}>Save CA Provider</button>}
    </div>
  </Panel>;
};

Object.assign(window, { CertCreatePage, CSRsTab, CAProvidersTab, AddCAPanel });
