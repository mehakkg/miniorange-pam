// Credentials — Add Credential 4-step panel + success state
// Note: depends on Panel, Field, Select, Toggle, Segmented, StepIndicator, Pill being on window

// CredAddPanel — one wizard shape (Identity → Resources → Rotation →
// Classification), five different Step 1 field sets depending on the
// launchedFrom prop:
//   "all"      — generic wizard, Credential Type toggle shown (default)
//   "ssh"      — SSH Keys tab: no type toggle, private-key + passphrase + owner
//   "secret"   — App Secrets tab: no type toggle, secret + application +
//                type/injection as segmented + expiry
//   "cloudiam" — Cloud/IAM Accounts tab: no type toggle, provider + account
//                type + conditional (Root disables Rotation step; IAM adds
//                scoped role + MFA)
// Break-glass does NOT launch this panel — it opens the Credential Source
// Picker in existingOnly mode via BreakGlassMarkModal.
const CredAddPanel = ({ onClose, onCreated, prefill, launchedFrom = "all" }) => {
  const initialType = launchedFrom === "ssh"    ? "SSH Key"
                    : launchedFrom === "secret" ? "App Secret"
                    : (prefill?.type || "Password");
  const [step, setStep] = React.useState(1);
  const [success, setSuccess] = React.useState(false);
  const [data, setData] = React.useState({
    type: initialType,
    display: prefill?.display || "",
    username: prefill?.username && prefill.username !== "—" ? prefill.username : "",
    password: "",
    markComplete: false,
    sshKeyType: "Private Key",
    sshKey: "",
    sshPassphrase: "",
    sshOwner: "",
    sshFingerprint: "",
    secretType: "API Key",
    secretValue: "",
    secretExpiry: "",
    secretInjection: "Environment Variable",
    secretApp: "",
    // Cloud/IAM-specific fields — used only when launchedFrom === "cloudiam".
    cloudProvider: "AWS",
    cloudAccountType: "iam",       // "root" | "iam"
    cloudScopedRole: "",
    cloudMfa: true,
    cloudUsername: "",              // access key ID for AWS, similar for others
    cloudSecret: "",                // secret access key
    resources: [],
    nonViewable: true,
    adminAcct: "",
    rotatorType: "AD",
    policyMode: "create",
    existingPolicy: "",
    newPolicy: {
      name: "",
      pwdPolicy: "Strong-24",
      rotationType: "Schedule",
      interval: 7,
      unit: "Days",
      restrictWindow: false,
      windowFrom: "02:00",
      windowTo: "04:00",
      tz: "Asia/Kolkata",
      startFrom: "",
      retries: 3,
      postValidate: true,
      reconcile: false,
      reconCred: "",
      reconAction: "Auto-reconcile silently",
    },
    sensitivity: prefill?.sensitivity || "High",
    owner: prefill?.owner || "",
    tags: prefill?.tags ? prefill.tags.slice() : ["production"],
    source: "Manual",
    notes: "",
  });

  const setD = (k, v) => setData(d => ({ ...d, [k]: v }));
  const setNP = (k, v) => setData(d => ({ ...d, newPolicy: { ...d.newPolicy, [k]: v } }));

  // Cloud/IAM Root accounts are vaulted-only by design (see Cloud/IAM tab's
  // stat header copy). Rotation step is shown for clarity but locked out.
  const rotationDisabled = launchedFrom === "cloudiam" && data.cloudAccountType === "root";

  const validStep1 =
    launchedFrom === "ssh"      ? data.display.trim() && data.username.trim() && data.sshKey && data.sshOwner :
    launchedFrom === "secret"   ? data.display.trim() && data.secretApp.trim() && data.secretValue :
    launchedFrom === "cloudiam" ? data.display.trim() && data.cloudUsername.trim() && data.cloudSecret :
    data.display.trim() && (data.type === "Password" ? data.username.trim() : data.type === "SSH Key" ? data.sshKey && data.sshOwner : data.secretValue);

  // Advance step, skipping Rotation for Cloud/IAM Root accounts.
  const nextStep = () => {
    if (step === 2 && rotationDisabled) setStep(4);
    else setStep(step + 1);
  };
  const prevStep = () => {
    if (step === 4 && rotationDisabled) setStep(2);
    else setStep(step - 1);
  };

  const panelTitle = prefill ? "Duplicate credential"
                   : launchedFrom === "ssh"      ? "Add SSH key"
                   : launchedFrom === "secret"   ? "Add secret"
                   : launchedFrom === "cloudiam" ? "Add cloud credential"
                   : "Add credential";

  if (success) {
    return <Panel title="Credential added" onClose={onClose}>
      <CredAddSuccess data={data} onClose={onClose} onAnother={() => { setSuccess(false); setStep(1); setData(d => ({...d, display: "", username: "", password: "", resources: [] })); }}/>
    </Panel>;
  }

  return <Panel title={panelTitle} onClose={onClose} back={step > 1 ? prevStep : null}>
    {prefill && step === 1 && <div style={{ margin: "12px 24px 0", padding: 10, background: "var(--warning-soft)", borderRadius: 6, font: "400 12px/1.5 var(--font-sans)", color: "var(--warning-fg)" }}>Password must be re-entered — secrets cannot be copied for security reasons.</div>}
    <CredStepIndicator step={step} disabledSteps={rotationDisabled ? { 3: "Root accounts don't auto-rotate" } : null}/>
    <div className="scroll-area" style={{ flex: 1, overflow: "auto" }}>
      {step === 1 && <Step1Identity data={data} setD={setD} launchedFrom={launchedFrom}/>}
      {step === 2 && <Step2Resources data={data} setD={setD}/>}
      {step === 3 && <Step3Rotation data={data} setD={setD} setNP={setNP}/>}
      {step === 4 && <Step4Classification data={data} setD={setD}/>}
    </div>
    <div style={{ borderTop: "1px solid var(--border)", padding: "12px 24px", display: "flex", alignItems: "center", gap: 8, background: "var(--bg-surface)" }}>
      <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
      <div style={{ flex: 1 }}/>
      {step > 1 && <button className="btn" onClick={prevStep}>← Back</button>}
      {step < 4 && <button className="btn btn-primary" disabled={step === 1 && !validStep1} onClick={nextStep}>
        {step === 1 ? "Next: Resources →" : step === 2 ? (rotationDisabled ? "Next: Classification →" : "Next: Rotation →") : "Next: Classification →"}
      </button>}
      {step === 4 && <button className="btn btn-primary" onClick={() => { setSuccess(true); onCreated?.(data); }}>Save credential</button>}
    </div>
  </Panel>;
};

const CredStepIndicator = ({ step, disabledSteps }) => {
  const steps = ["Identity", "Resources", "Rotation", "Classification"];
  return (
    <div style={{ display: "flex", alignItems: "center", padding: "14px 24px", gap: 8, borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-surface)" }}>
      {steps.map((s, i) => {
        const stepNum = i + 1;
        const disabled = disabledSteps?.[stepNum];
        const done = step > stepNum && !disabled;
        const active = step === stepNum;
        return (
          <React.Fragment key={s}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }} title={disabled || undefined}>
              <div style={{ width: 22, height: 22, borderRadius: "50%",
                background: disabled ? "var(--bg-surface-2)" : done ? "var(--success)" : active ? "var(--brand)" : "var(--bg-surface-2)",
                color: disabled ? "var(--fg-4)" : (done || active) ? "#fff" : "var(--fg-3)",
                display: "flex", alignItems: "center", justifyContent: "center",
                font: "600 11px/1 var(--font-sans)",
                border: disabled ? "1px dashed var(--border)" : (!done && !active ? "1px solid var(--border)" : "none"),
                opacity: disabled ? 0.65 : 1,
              }}>{disabled ? "—" : done ? <Icon name="check" size={11} color="#fff"/> : stepNum}</div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ font: `${active ? 600 : 500} 12.5px/1 var(--font-sans)`, color: disabled ? "var(--fg-4)" : active ? "var(--fg-1)" : done ? "var(--fg-2)" : "var(--fg-4)", textDecoration: disabled ? "line-through" : "none" }}>{s}</span>
                {disabled && <span style={{ font: "400 10.5px/1.3 var(--font-sans)", color: "var(--fg-4)", marginTop: 2 }}>{disabled}</span>}
              </div>
            </div>
            {i < steps.length - 1 && <div style={{ flex: 1, height: 1, background: done ? "var(--success)" : "var(--border)", maxWidth: 44 }}/>}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// -------- STEP 1: IDENTITY --------
// Field set varies by launchedFrom. Reconciliation is not routed here — that
// tab has its own purpose-built AddReconModal (unchanged, referenced as the
// design model for these variants).
const Step1Identity = ({ data, setD, launchedFrom = "all" }) => {
  const scoped = launchedFrom !== "all";

  // SSH Keys tab — Fix 1
  if (launchedFrom === "ssh") return (
    <div style={{ padding: "20px 24px", maxWidth: 720, display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ font: "600 10.5px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.7 }}>SSH key identity</div>
      <Field label="Display name" required hint="A recognizable name for this key. Users see this — never the private material.">
        <input className="input" value={data.display} onChange={e => setD("display", e.target.value)} placeholder="prod-bastion-deploy or ci-runner-key"/>
      </Field>
      <Field label="Username" required hint="The account username this key authenticates as on the target system.">
        <input className="input" value={data.username} onChange={e => setD("username", e.target.value)} placeholder="deploy · ec2-user · root"/>
      </Field>
      <Field label="Private key" required hint="Upload a .pem / .key file, or paste PEM contents. Stored encrypted; never retrievable after save.">
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <button className="btn" style={{ alignSelf: "flex-start" }} onClick={() => setD("sshKey", "-----BEGIN OPENSSH PRIVATE KEY-----\n(demo — file upload not wired in this preview)\n-----END OPENSSH PRIVATE KEY-----")}>
            <Icon name="upload" size={12}/> Upload .pem file
          </button>
          <textarea className="input" rows={4} value={data.sshKey} onChange={e => setD("sshKey", e.target.value)} placeholder="…or paste PEM content here" style={{ font: "400 11.5px/1.5 var(--font-mono)", resize: "vertical" }}/>
        </div>
      </Field>
      <Field label="Passphrase" hint="Optional. Required only if the key was generated with one.">
        <input className="input" type="password" value={data.sshPassphrase} onChange={e => setD("sshPassphrase", e.target.value)} placeholder="••••••••"/>
      </Field>
      <Field label="Owner" required hint="Captured here so an admin doesn't have to assign it in a second step. Populates the OWNER column immediately.">
        <Select value={data.sshOwner} onChange={v => setD("sshOwner", v)} options={[
          ["", "Select user…"],
          ["Arjun Bansal", "Arjun Bansal (Security Admin)"],
          ["Priya Nair",   "Priya Nair (IT Ops)"],
          ["Rohan Mehta",  "Rohan Mehta (SysAdmin)"],
        ]}/>
      </Field>
      {data.sshKey && (
        <div className="card" style={{ padding: 12, background: "var(--bg-surface-2)" }}>
          <div className="t-tiny" style={{ color: "var(--fg-4)", marginBottom: 4 }}>Key fingerprint (auto-generated)</div>
          <Fingerprint value="SHA256:Gc3BRK8MaLKNMKRuC8XaGvK3pYzT2+eH4kTfwXv9HWo" full/>
        </div>
      )}
    </div>
  );

  // Application Secrets tab — Fix 2
  if (launchedFrom === "secret") return (
    <div style={{ padding: "20px 24px", maxWidth: 720, display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ font: "600 10.5px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.7 }}>Application secret</div>
      <Field label="Secret name" required hint="e.g. 'Stripe API Key — Production'">
        <input className="input" value={data.display} onChange={e => setD("display", e.target.value)} placeholder="Stripe API Key — Production"/>
      </Field>
      <Field label="Type" required>
        <Segmented value={data.secretType} onChange={v => setD("secretType", v)} options={[
          { value: "API Key",              label: "API Key" },
          { value: "OAuth Token",          label: "OAuth Token" },
          { value: "DB Connection String", label: "DB Connection String" },
        ]}/>
      </Field>
      <Field label="Application" required hint="Which application authenticates with this secret. Populates the APPLICATION column immediately.">
        <input className="input" value={data.secretApp} onChange={e => setD("secretApp", e.target.value)} placeholder="Stripe Payments"/>
      </Field>
      <Field label="Injection method" required hint="How applications will retrieve this secret after rotation.">
        <Segmented value={data.secretInjection} onChange={v => setD("secretInjection", v)} options={[
          { value: "Environment Variable", label: "Env Variable" },
          { value: "Config File",          label: "Config File" },
          { value: "API Call",             label: "API Call" },
        ]}/>
      </Field>
      <Field label="Secret value" required hint="Encrypted at rest. Not retrievable after save.">
        <input className="input" type="password" value={data.secretValue} onChange={e => setD("secretValue", e.target.value)} placeholder="sk_live_…"/>
      </Field>
      <Field label="Expiry" hint="Optional. Leave blank for 'None'. PAM alerts before expiry if set.">
        <input className="input" type="date" value={data.secretExpiry} onChange={e => setD("secretExpiry", e.target.value)}/>
      </Field>
    </div>
  );

  // Cloud/IAM Accounts tab — Fix 3
  if (launchedFrom === "cloudiam") {
    const root = data.cloudAccountType === "root";
    return (
      <div style={{ padding: "20px 24px", maxWidth: 720, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ font: "600 10.5px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.7 }}>Cloud credential</div>
        <Field label="Display name" required>
          <input className="input" value={data.display} onChange={e => setD("display", e.target.value)} placeholder="aws-root-northwind · azure-service-principal-01"/>
        </Field>
        <Field label="Provider" required>
          <Segmented value={data.cloudProvider} onChange={v => setD("cloudProvider", v)} options={[
            { value: "AWS",   label: "AWS" },
            { value: "Azure", label: "Azure" },
            { value: "GCP",   label: "GCP" },
          ]}/>
        </Field>
        <Field label="Account type" required>
          <Segmented value={data.cloudAccountType} onChange={v => setD("cloudAccountType", v)} options={[
            { value: "root", label: "Root" },
            { value: "iam",  label: "IAM sub-account" },
          ]}/>
        </Field>
        {root ? (
          <div style={{ padding: 12, background: "var(--warning-soft)", color: "var(--warning-fg)", borderRadius: 6, font: "500 12.5px/1.5 var(--font-sans)", display: "flex", gap: 8, alignItems: "flex-start" }}>
            <Icon name="lock" size={13} color="var(--warning-fg)" style={{ marginTop: 2 }}/>
            <div>
              <strong>Root accounts are vaulted-only by design.</strong> They never auto-rotate. The Rotation step will be skipped for this credential — it's shown as inactive on the wizard's step indicator so you know why.
            </div>
          </div>
        ) : (
          <>
            <Field label="Scoped role / policy" hint="e.g. AmazonRDSFullAccess · Reader — the least-privilege scope this sub-account operates under.">
              <input className="input" value={data.cloudScopedRole} onChange={e => setD("cloudScopedRole", e.target.value)} placeholder="e.g. AmazonRDSReadOnlyAccess"/>
            </Field>
            <Toggle value={data.cloudMfa} onChange={v => setD("cloudMfa", v)} label="MFA enabled" hint="Populates the MFA column immediately. Required for Critical scope in most compliance frameworks."/>
          </>
        )}
        <Field label={data.cloudProvider === "AWS" ? "Access key ID" : "Username"} required>
          <input className="input t-mono" value={data.cloudUsername} onChange={e => setD("cloudUsername", e.target.value)} placeholder={data.cloudProvider === "AWS" ? "AKIA…" : "svc-user@tenant"}/>
        </Field>
        <Field label={data.cloudProvider === "AWS" ? "Secret access key" : "Password / secret"} required hint="Encrypted at rest. Not retrievable after save.">
          <input className="input t-mono" type="password" value={data.cloudSecret} onChange={e => setD("cloudSecret", e.target.value)} placeholder="••••••••"/>
        </Field>
      </div>
    );
  }

  // All Credentials tab (default) — unchanged generic wizard, Credential Type
  // toggle stays because this is the ONE flow where the admin hasn't already
  // told the system what type they're adding.
  return (
    <div style={{ padding: "20px 24px", maxWidth: 720, display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ font: "600 10.5px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.7 }}>Credential identity</div>

      <Field label="Display name" required hint="A recognizable name for this credential. Users see this — never the actual password.">
        <input className="input" value={data.display} onChange={e => setD("display", e.target.value)} placeholder="prod-db-root or linux-server-01-admin"/>
      </Field>

      {data.type !== "App Secret" && (
        <Field label="Username" required hint="The account username as it exists on the target system.">
          <input className="input" value={data.username} onChange={e => setD("username", e.target.value)} placeholder="root"/>
        </Field>
      )}

      <div className="field">
        <label className="field-label">Credential type <span style={{ color: "var(--danger-fg)" }}>*</span></label>
        <div style={{ display: "flex", gap: 0, background: "var(--bg-surface-2)", border: "1px solid var(--border)", borderRadius: 6, padding: 3 }}>
          {["Password", "SSH Key", "App Secret"].map(t => (
            <button key={t} onClick={() => setD("type", t)} style={{
              flex: 1, padding: "7px 12px", border: "none",
              background: data.type === t ? "var(--bg-app)" : "transparent",
              color: data.type === t ? "var(--fg-1)" : "var(--fg-3)",
              font: `${data.type === t ? 600 : 500} 12.5px/1 var(--font-sans)`,
              borderRadius: 4, cursor: "pointer",
              boxShadow: data.type === t ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
            }}>{t}</button>
          ))}
        </div>
      </div>

      {data.type === "Password" && <>
        <Field label="Password" required hint="Password is encrypted at rest. You will not be able to view it after saving.">
          <div style={{ display: "flex", gap: 6 }}>
            <input className="input" type="password" value={data.password} onChange={e => setD("password", e.target.value)} placeholder="••••••••" style={{ flex: 1 }}/>
            <button className="btn" style={{ flex: "none" }}><Icon name="eye" size={12}/></button>
          </div>
          <button className="btn btn-ghost btn-sm" style={{ alignSelf: "flex-start", padding: 0, marginTop: 6, color: "var(--brand-fg)" }} onClick={() => setD("password", "p#9KsLm@2vBxR7nQ!8jFw")}>Generate secure password</button>
        </Field>
        <Toggle value={data.markComplete} onChange={v => setD("markComplete", v)} label="Mark as complete" hint="Turn on once you've verified this credential authenticates against its target system."/>
      </>}

      {data.type === "SSH Key" && <>
        <Field label="Private key" required hint="Paste PEM content or upload a .pem / .key file.">
          <textarea className="input" rows={4} value={data.sshKey} onChange={e => setD("sshKey", e.target.value)} placeholder="-----BEGIN OPENSSH PRIVATE KEY-----..." style={{ font: "400 11.5px/1.5 var(--font-mono)", resize: "vertical" }}/>
        </Field>
        <Field label="Passphrase"><input className="input" type="password" value={data.sshPassphrase} onChange={e => setD("sshPassphrase", e.target.value)} placeholder="••••••••"/></Field>
        <Field label="Key owner" required>
          <Select value={data.sshOwner} onChange={v => setD("sshOwner", v)} options={[
            ["", "Select user…"],
            ["Arjun Bansal", "Arjun Bansal (Security Admin)"],
            ["Priya Nair",   "Priya Nair (IT Ops)"],
            ["Rohan Mehta",  "Rohan Mehta (SysAdmin)"],
          ]}/>
        </Field>
      </>}

      {data.type === "App Secret" && <>
        <Field label="Secret name" required><input className="input" value={data.display} onChange={e => setD("display", e.target.value)} placeholder="Stripe API Key — Production"/></Field>
        <Field label="Secret type" required>
          <Select value={data.secretType} onChange={v => setD("secretType", v)} options={[
            ["API Key", "API Key"],
            ["OAuth Token", "OAuth Token"],
            ["DB Connection String", "Database Connection String"],
            ["Generic", "Generic Secret"],
          ]}/>
        </Field>
        <Field label="Secret value" required><textarea className="input" rows={3} value={data.secretValue} onChange={e => setD("secretValue", e.target.value)} placeholder="sk_live_…" style={{ font: "400 12px/1.5 var(--font-mono)", resize: "vertical" }}/></Field>
        <Field label="Expiry date"><input className="input" type="date" value={data.secretExpiry} onChange={e => setD("secretExpiry", e.target.value)}/></Field>
        <Field label="Injection method">
          <Select value={data.secretInjection} onChange={v => setD("secretInjection", v)} options={[
            ["Environment Variable", "Environment Variable"],
            ["Config File", "Config File"],
            ["API Call", "API Call"],
            ["None", "None"],
          ]}/>
        </Field>
        <Field label="Application name"><input className="input" value={data.secretApp} onChange={e => setD("secretApp", e.target.value)} placeholder="Stripe Payments"/></Field>
      </>}
    </div>
  );
};

// -------- STEP 2: RESOURCES --------
const Step2Resources = ({ data, setD }) => {
  const [adding, setAdding] = React.useState(false);
  const available = window.SEED_RESOURCES || [];
  const linked = data.resources;
  const link = (id) => { if (!linked.find(r => r.id === id)) { setD("resources", [...linked, available.find(r => r.id === id)]); } setAdding(false); };
  const unlink = (id) => setD("resources", linked.filter(r => r.id !== id));

  return (
    <div style={{ padding: "20px 24px", maxWidth: 720, display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <h3 style={{ font: "600 15px/1.3 var(--font-sans)", color: "var(--fg-1)", margin: "0 0 4px" }}>Link {data.display || "credential"} to resources</h3>
        <p style={{ font: "400 13px/1.5 var(--font-sans)", color: "var(--fg-3)", margin: 0 }}>Credentials must be linked to at least one resource to be usable for session access.</p>
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        {linked.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", color: "var(--fg-3)", font: "400 12.5px/1.5 var(--font-sans)" }}>No resources linked yet. Add one below.</div>
        ) : (
          <table className="table">
            <thead><tr><th>Resource</th><th>Type</th><th>Host</th><th>Env</th><th></th></tr></thead>
            <tbody>
              {linked.map(r => (
                <tr key={r.id}>
                  <td style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{r.name}</td>
                  <td><span className="badge" style={{ textTransform: "capitalize" }}>{r.type}</span></td>
                  <td className="t-mono t-tiny" style={{ color: "var(--fg-3)" }}>{r.host}</td>
                  <td><span className="badge" style={{ textTransform: "capitalize" }}>{r.env}</span></td>
                  <td style={{ textAlign: "right" }}><button className="btn btn-ghost btn-sm" onClick={() => unlink(r.id)}>Unlink</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!adding ? (
          <div style={{ padding: 12, borderTop: linked.length > 0 ? "1px solid var(--border)" : "none" }}>
            <button className="btn btn-sm" onClick={() => setAdding(true)}><Icon name="plus" size={11}/> Link a resource</button>
          </div>
        ) : (
          <div style={{ padding: 12, borderTop: linked.length > 0 ? "1px solid var(--border)" : "none", display: "flex", gap: 8 }}>
            <Select value="" onChange={v => v && link(v)} options={[["", "Search resources…"], ...available.filter(r => !linked.find(x => x.id === r.id)).map(r => [r.id, `${r.name} — ${r.host} — ${r.env}`])]}/>
            <button className="btn btn-ghost btn-sm" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        )}
      </div>

      <div style={{ padding: 12, background: "var(--brand-soft)", borderRadius: 6, font: "400 12.5px/1.5 var(--font-sans)", color: "var(--fg-2)" }}>
        💡 This credential will be used to authenticate against each linked resource. PAM will never show the password to end users — it injects it at session time.
      </div>

      <div className="card" style={{ padding: 16 }}>
        <Toggle value={data.nonViewable} onChange={v => setD("nonViewable", v)} label="Non-viewable access" hint="Prevent users from ever seeing or copying this credential. PAM injects it automatically during proxy sessions."/>
        {data.nonViewable && (
          <div style={{ marginTop: 12, padding: 10, background: "var(--bg-surface-2)", borderRadius: 4, font: "400 12px/1.5 var(--font-sans)", color: "var(--fg-3)" }}>
            Users with access to linked resources will be able to launch sessions but will never see the credential. The password is injected by PAM's proxy.
          </div>
        )}
      </div>
    </div>
  );
};

// -------- STEP 3: ROTATION --------
const Step3Rotation = ({ data, setD, setNP }) => {
  const adminAccts = (window.RECON_CREDS || []).map(c => [c.display, c.display]);
  const passPolicies = [["Strong-24", "Strong-24"], ["Strict-32-Symbol", "Strict-32-Symbol"], ["Default-16", "Default-16"]];
  const np = data.newPolicy;
  return (
    <div style={{ padding: "20px 24px", maxWidth: 720, display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <h3 style={{ font: "600 15px/1.3 var(--font-sans)", color: "var(--fg-1)", margin: "0 0 4px" }}>Configure rotation for {data.display || "credential"}</h3>
        <p style={{ font: "400 13px/1.5 var(--font-sans)", color: "var(--fg-3)", margin: 0 }}>Automated rotation changes the password on the target system and updates the vault. PAM handles both sides.</p>
      </div>

      <Field label="Admin account" required hint="PAM uses this account to log into the target system and change the password. It must have permission to reset passwords on the target.">
        <Select value={data.adminAcct} onChange={v => setD("adminAcct", v)} options={[["", "Select admin account…"], ...adminAccts]}/>
        {adminAccts.length === 0 && <div style={{ marginTop: 6, font: "400 12px/1.5 var(--font-sans)", color: "var(--warning-fg)" }}>No admin accounts configured. <a href="#" style={{ color: "var(--brand-fg)" }}>Add a reconciliation credential first</a>.</div>}
      </Field>

      <Field label="Rotator type" required hint={data.rotatorType === "AD" ? "For accounts managed by Active Directory — rotation updates the password in AD and syncs to the target." : "For local accounts or database accounts managed directly on the target system."}>
        <Segmented value={data.rotatorType} onChange={v => setD("rotatorType", v)} options={[{ value: "AD", label: "AD Account" }, { value: "Non-AD", label: "Non-AD Account" }]}/>
      </Field>

      <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: 16 }}>
        <div style={{ font: "600 10.5px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 10 }}>Rotation policy</div>
        <Segmented value={data.policyMode} onChange={v => setD("policyMode", v)} options={[{ value: "existing", label: "Use existing policy" }, { value: "create", label: "Create new policy" }]}/>
      </div>

      {data.policyMode === "existing" && (
        <Field label="Select policy">
          <Select value={data.existingPolicy} onChange={v => setD("existingPolicy", v)} options={[["", "Select…"], ...(window.ROTATION_POLICIES || []).map(p => [p.id, `${p.name} — ${p.type} — ${p.interval}`])]}/>
          {data.existingPolicy && (
            <div className="card" style={{ marginTop: 10, padding: 12, background: "var(--bg-surface-2)" }}>
              {(() => {
                const p = (window.ROTATION_POLICIES || []).find(x => x.id === data.existingPolicy);
                if (!p) return null;
                return <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, font: "400 12px/1.5 var(--font-sans)" }}>
                    <div><span style={{ color: "var(--fg-4)" }}>Password policy: </span><span style={{ color: "var(--fg-1)" }}>{p.pwdPolicy}</span></div>
                    <div><span style={{ color: "var(--fg-4)" }}>Type: </span><span style={{ color: "var(--fg-1)" }}>{p.type}</span></div>
                    <div><span style={{ color: "var(--fg-4)" }}>Interval: </span><span style={{ color: "var(--fg-1)" }}>{p.interval}</span></div>
                    <div><span style={{ color: "var(--fg-4)" }}>Window: </span><span style={{ color: "var(--fg-1)" }}>{p.window}</span></div>
                  </div>
                </>;
              })()}
            </div>
          )}
        </Field>
      )}

      {data.policyMode === "create" && <>
        <Field label="Policy name" required><input className="input" value={np.name} onChange={e => setNP("name", e.target.value)} placeholder="Prod-Daily-Rotation"/></Field>
        <Field label="Password policy" hint="Defines complexity rules for the new password after rotation.">
          <Select value={np.pwdPolicy} onChange={v => setNP("pwdPolicy", v)} options={passPolicies}/>
        </Field>
        <Field label="Rotation type" required>
          <Segmented value={np.rotationType} onChange={v => setNP("rotationType", v)} options={[
            { value: "Schedule", label: "Schedule" },
            { value: "After Every Use", label: "After every use" },
            { value: "On Checkout", label: "On checkout" },
          ]}/>
        </Field>

        {np.rotationType === "Schedule" && <>
          <Field label="Rotation interval" required>
            <div style={{ display: "flex", gap: 8 }}>
              <input className="input" type="number" value={np.interval} onChange={e => setNP("interval", +e.target.value)} style={{ width: 100 }}/>
              <Select value={np.unit} onChange={v => setNP("unit", v)} options={[["Hours","Hours"],["Days","Days"],["Months","Months"]]}/>
            </div>
          </Field>

          <div className="card" style={{ padding: 14, background: "var(--bg-surface-2)" }}>
            <Toggle value={np.restrictWindow} onChange={v => setNP("restrictWindow", v)} label="Restrict rotation to maintenance hours" hint="Rotation will only trigger within this time window to avoid production disruption."/>
            {np.restrictWindow && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 12 }}>
                <Field label="From"><input className="input" type="time" value={np.windowFrom} onChange={e => setNP("windowFrom", e.target.value)}/></Field>
                <Field label="To"><input className="input" type="time" value={np.windowTo} onChange={e => setNP("windowTo", e.target.value)}/></Field>
                <Field label="Timezone"><Select value={np.tz} onChange={v => setNP("tz", v)} options={[["Asia/Kolkata","Asia/Kolkata"],["UTC","UTC"],["America/New_York","America/New_York"]]}/></Field>
              </div>
            )}
          </div>

          <Field label="Start from" hint="Date and time of the first rotation. Leave blank to start immediately.">
            <input className="input" type="datetime-local" value={np.startFrom} onChange={e => setNP("startFrom", e.target.value)}/>
          </Field>
          <Field label="Number of retries" required hint="How many times PAM retries if rotation fails before marking it as failed.">
            <input className="input" type="number" value={np.retries} onChange={e => setNP("retries", +e.target.value)} style={{ width: 100 }}/>
          </Field>
        </>}

        {np.rotationType === "After Every Use" && (
          <div style={{ padding: 12, background: "var(--brand-soft)", borderRadius: 6, font: "400 12.5px/1.5 var(--font-sans)", color: "var(--fg-2)" }}>
            Password is rotated immediately after each session ends. No interval configuration needed.
          </div>
        )}
        {np.rotationType === "On Checkout" && (
          <div style={{ padding: 12, background: "var(--brand-soft)", borderRadius: 6, font: "400 12.5px/1.5 var(--font-sans)", color: "var(--fg-2)" }}>
            Password is rotated when a user checks out the credential for a session.
          </div>
        )}

        <Toggle value={np.postValidate} onChange={v => setNP("postValidate", v)} label="Post-rotation validation" hint="After rotating, PAM will test the new credentials against the target system. If validation fails, PAM retries or alerts you."/>

        <div className="card" style={{ padding: 14, background: "var(--bg-surface-2)" }}>
          <Toggle value={np.reconcile} onChange={v => setNP("reconcile", v)} label="Enable reconciliation" hint="If this credential is changed outside of PAM (password drift), PAM will detect the mismatch and attempt to regain control automatically."/>
          {np.reconcile && (
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 12 }}>
              <Field label="Reconciliation credential">
                <Select value={np.reconCred} onChange={v => setNP("reconCred", v)} options={[["", "Use the admin account above"], ...adminAccts]}/>
              </Field>
              <Field label="Reconciliation action">
                <Select value={np.reconAction} onChange={v => setNP("reconAction", v)} options={[
                  ["Auto-reconcile silently", "Auto-reconcile silently"],
                  ["Alert and wait", "Alert and wait"],
                  ["Alert and block sessions", "Alert and block sessions"],
                ]}/>
              </Field>
            </div>
          )}
        </div>
      </>}
    </div>
  );
};

// -------- STEP 4: CLASSIFICATION --------
const Step4Classification = ({ data, setD }) => {
  const [newTag, setNewTag] = React.useState("");
  const addTag = () => { if (newTag.trim() && !data.tags.includes(newTag.trim())) { setD("tags", [...data.tags, newTag.trim()]); setNewTag(""); } };
  const removeTag = (t) => setD("tags", data.tags.filter(x => x !== t));
  const SENS_HINT = {
    Critical: "Root / admin accounts on production systems. Strongest controls apply.",
    High:     "Elevated accounts — sudo, DBA, service accounts.",
    Medium:   "Standard privileged accounts.",
    Low:      "Limited-access accounts, read-only credentials.",
  };
  return (
    <div style={{ padding: "20px 24px", maxWidth: 720, display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <h3 style={{ font: "600 15px/1.3 var(--font-sans)", color: "var(--fg-1)", margin: "0 0 4px" }}>Classify {data.display || "credential"}</h3>
        <p style={{ font: "400 13px/1.5 var(--font-sans)", color: "var(--fg-3)", margin: 0 }}>Classification helps you triage and manage credentials at scale.</p>
      </div>

      <div className="field">
        <label className="field-label">Sensitivity level <span style={{ color: "var(--danger-fg)" }}>*</span></label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {["Critical","High","Medium","Low"].map(s => {
            const active = data.sensitivity === s;
            const style = {
              Critical: { fg: "var(--danger-fg)",  bg: "var(--danger-soft)"  },
              High:     { fg: "var(--warning-fg)", bg: "var(--warning-soft)" },
              Medium:   { fg: "var(--fg-2)",       bg: "var(--bg-surface-2)" },
              Low:      { fg: "var(--fg-3)",       bg: "var(--bg-surface-2)" },
            }[s];
            return <button key={s} onClick={() => setD("sensitivity", s)} style={{
              padding: "10px 12px",
              border: `1px solid ${active ? style.fg : "var(--border)"}`,
              background: active ? style.bg : "var(--bg-surface)",
              borderRadius: 6, cursor: "pointer",
              color: active ? style.fg : "var(--fg-2)",
              font: `${active ? 600 : 500} 13px/1.3 var(--font-sans)`,
            }}>{s}</button>;
          })}
        </div>
        <div style={{ marginTop: 8, font: "400 12px/1.5 var(--font-sans)", color: "var(--fg-4)" }}>{SENS_HINT[data.sensitivity]}</div>
      </div>

      <Field label="Owner" hint="The team or person responsible for this credential. They will receive rotation failure alerts.">
        <Select value={data.owner} onChange={v => setD("owner", v)} options={[
          ["", "Unassigned"],
          ["Arjun Bansal", "Arjun Bansal (Security Admin)"],
          ["Priya Nair", "Priya Nair (IT Ops)"],
          ["Rohan Mehta", "Rohan Mehta (SysAdmin)"],
          ["Security Team", "Security Team (group)"],
        ]}/>
      </Field>

      <Field label="Tags">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: 8, border: "1px solid var(--border)", borderRadius: 6, background: "var(--bg-surface)" }}>
          {data.tags.map(t => <Tag key={t} onRemove={() => removeTag(t)}>{t}</Tag>)}
          <input
            placeholder="Type and press Enter…"
            value={newTag}
            onChange={e => setNewTag(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
            style={{ flex: 1, minWidth: 120, border: "none", outline: "none", font: "400 12.5px/1 var(--font-sans)", background: "transparent", color: "var(--fg-1)" }}
          />
        </div>
        <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 6 }}>
          <span style={{ font: "400 11.5px/1.5 var(--font-sans)", color: "var(--fg-4)" }}>Suggested:</span>
          {["production","linux","root","database","rotation-enabled"].filter(t => !data.tags.includes(t)).map(t => (
            <button key={t} onClick={() => setD("tags", [...data.tags, t])} style={{ padding: "2px 8px", borderRadius: 4, border: "1px dashed var(--border)", background: "transparent", color: "var(--fg-3)", font: "500 11px/1.6 var(--font-sans)", cursor: "pointer" }}>+ {t}</button>
          ))}
        </div>
      </Field>

      <Field label="Source" hint="Set automatically based on how this credential was added.">
        <input className="input" value={data.source} disabled style={{ background: "var(--bg-surface-2)" }}/>
      </Field>

      <Field label="Notes">
        <textarea className="input" rows={3} value={data.notes} onChange={e => setD("notes", e.target.value)} placeholder="Optional"/>
      </Field>
    </div>
  );
};

// -------- SUCCESS STATE --------
const CredAddSuccess = ({ data, onClose, onAnother }) => {
  const skipped = [];
  if (data.resources.length === 0) skipped.push("No resources linked — credential cannot be used for session access. Link a resource.");
  if (data.policyMode === "create" && !data.newPolicy.name && !data.existingPolicy) skipped.push("No rotation policy — password will not be automatically rotated.");
  return (
    <div style={{ padding: 32, maxWidth: 580, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
      <div style={{ width: 64, height: 64, borderRadius: 12, background: "var(--success-soft)", color: "var(--success-fg)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
        <Icon name="lock" size={28}/>
      </div>
      <h2 style={{ font: "600 18px/1.2 var(--font-sans)", color: "var(--fg-1)", margin: "0 0 6px" }}>{data.display || "Credential"} added to vault</h2>
      <p style={{ font: "400 13px/1.5 var(--font-sans)", color: "var(--fg-3)", margin: "0 0 20px" }}>You can edit any of these later from the credential detail panel.</p>

      <div className="card" style={{ background: "var(--bg-surface)", padding: 14, width: "100%", textAlign: "left", marginBottom: 18 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, font: "400 12.5px/1.5 var(--font-sans)" }}>
          <div><span style={{ color: "var(--fg-4)" }}>Type</span><div><CRED_TYPE_BADGE type={data.type}/></div></div>
          <div><span style={{ color: "var(--fg-4)" }}>Sensitivity</span><div><SensitivityBadge level={data.sensitivity}/></div></div>
          <div><span style={{ color: "var(--fg-4)" }}>Linked to</span><div style={{ color: "var(--fg-1)" }}>{data.resources.length} resources</div></div>
          <div><span style={{ color: "var(--fg-4)" }}>Non-viewable</span><div style={{ color: "var(--fg-1)" }}>{data.nonViewable ? "Enabled" : "Disabled"}</div></div>
          <div style={{ gridColumn: "span 2" }}><span style={{ color: "var(--fg-4)" }}>Rotation</span><div style={{ color: "var(--fg-1)" }}>{data.policyMode === "existing" ? (data.existingPolicy ? "Existing policy attached" : "No policy") : (data.newPolicy.name ? `${data.newPolicy.name} (new) · ${data.newPolicy.rotationType}` : "No rotation policy")}</div></div>
        </div>
      </div>

      {skipped.length > 0 && (
        <div style={{ width: "100%", marginBottom: 18 }}>
          {skipped.map((m, i) => (
            <div key={i} style={{ padding: 10, background: "var(--warning-soft)", color: "var(--warning-fg)", borderRadius: 4, font: "400 12.5px/1.5 var(--font-sans)", marginBottom: 6, textAlign: "left" }}>⚠ {m}</div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
        <button className="btn btn-primary" onClick={onClose}>View credential</button>
        <button className="btn" onClick={onAnother}>Add another credential</button>
        <button className="btn btn-ghost" onClick={onClose}>Go to all credentials</button>
      </div>
    </div>
  );
};

window.CredAddPanel = CredAddPanel;
