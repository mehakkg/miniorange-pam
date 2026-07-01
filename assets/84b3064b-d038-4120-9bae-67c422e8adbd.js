// Customization — Branding · Email Provider · Templates
// Design: two-column (form 55% / live preview 45%) for Branding and Templates

// ======= NAV INSIDE CUSTOMIZATION =======================================
const CUSTOM_NAV = [
  { id: "branding",  label: "Branding",                    icon: "customization" },
  { id: "email",     label: "Email Provider",              icon: "mail" },
  { id: "templates", label: "Email & Notification Templates", icon: "file-text" },
];

// ======= SEED DATA =======================================================
const BRANDING_DATA = {
  orgName: "Northwind Financial",
  logoFile: "northwind-logo.svg",
  faviconFile: "northwind-favicon.ico",
  primaryColor: "#2D6FE8",
  secondaryColor: "#1E56C0",
  darkMode: false,
  loginTitle: "Sign in to Northwind Financial PAM",
  loginSubtitle: "Secure privileged access management",
  bgStyle: "gradient",
  bgSolid: "#2D6FE8",
  bgGradientFrom: "#1A2E5C",
  bgGradientTo: "#2D6FE8",
  bgGradientDir: "↓",
  bgImageFile: null,
  bgOverlay: 60,
  cardStyle: "center",
  cardBg: "#ffffff",
  headerBg: "#ffffff",
  headerText: "#0f1115",
  showLogo: true,
  showOrgName: false,
};

const EMAIL_DATA = {
  configured: true,
  host: "smtp.northwind.com",
  port: "587",
  username: "pam-notifications@northwind.com",
  password: "••••••••••",
  sender: "noreply@northwind.com",
  encryption: "TLS",
  fallback: "miniorange",
  lastSent: "2 hours ago",
};

const TEMPLATE_CATEGORIES = [
  { id: "access", label: "Access & Tickets", templates: [
    { id: "send-ticket",      name: "Access Request Received", desc: "Sent to admin when a user raises an access request",           status: "default",     lastMod: null },
    { id: "approve-ticket",   name: "Approve Ticket",          desc: "Sent to user when their access request is approved",           status: "customized",  lastMod: "May 14, 2026" },
    { id: "reject-ticket",    name: "Reject Ticket",           desc: "Sent to user when their access request is rejected",           status: "customized",  lastMod: "May 10, 2026" },
    { id: "access-expiring",  name: "Access Expiring Soon",    desc: "Sent to user when their access window is about to expire",     status: "default",     lastMod: null },
    { id: "access-revoked",   name: "Access Revoked",          desc: "Sent to user when an admin revokes their access",              status: "default",     lastMod: null },
  ]},
  { id: "auth", label: "Authentication & MFA", templates: [
    { id: "forgot-password",  name: "Forgot Password",         desc: "Password reset link email",                                    status: "default",     lastMod: null },
    { id: "welcome",          name: "Welcome / Account Created",desc: "Sent when admin creates a new user account",                  status: "default",     lastMod: null },
    { id: "mfa-enroll",       name: "MFA Enrollment",          desc: "Sent when user needs to set up their MFA method",             status: "default",     lastMod: null },
    { id: "account-locked",   name: "Account Locked",          desc: "Sent when a user account is locked after failed logins",      status: "default",     lastMod: null },
  ]},
  { id: "credentials", label: "Credentials & Rotation", templates: [
    { id: "rotation-result",  name: "Password Rotation Result","desc": "Sent to credential owner after automated rotation",         status: "draft",       lastMod: "Today" },
    { id: "drift-detected",   name: "Credential Drift Detected","desc": "Alert when a vault credential is out of sync",             status: "default",     lastMod: null },
  ]},
  { id: "discovery", label: "Discovery", templates: [
    { id: "scan-success",     name: "Network Scan — Success",  desc: "Sent when a network scan completes",                          status: "default",     lastMod: null },
    { id: "scan-failure",     name: "Network Scan — Failure",  desc: "Sent when a network scan fails",                             status: "default",     lastMod: null },
  ]},
  { id: "system", label: "System", templates: [
    { id: "cert-expiring",    name: "Certificate Expiring",    desc: "Sent when a certificate approaches its expiry date",          status: "default",     lastMod: null },
    { id: "storage-low",      name: "Storage Low",             desc: "Alert when recording storage drops below threshold",          status: "default",     lastMod: null },
    { id: "test-email",       name: "Test Email",              desc: "Used to verify SMTP configuration",                          status: "default",     lastMod: null },
  ]},
];

const INAPP_TEMPLATES = [
  { id: "ia-1", cat: "Access & Tickets",    name: "Access request submitted", msg: "{{user.name}} requested access to {{ticket.resource_name}}", urgency: "default" },
  { id: "ia-2", cat: "Access & Tickets",    name: "Access approved",          msg: "Your access to {{ticket.resource_name}} has been approved",   urgency: "default" },
  { id: "ia-3", cat: "Access & Tickets",    name: "Access rejected",          msg: "Access to {{ticket.resource_name}} was rejected",             urgency: "warning" },
  { id: "ia-4", cat: "Access & Tickets",    name: "Access expiring",          msg: "Your access to {{ticket.resource_name}} expires in {{n}} hours", urgency: "warning" },
  { id: "ia-5", cat: "Access & Tickets",    name: "Access revoked",           msg: "Your access to {{ticket.resource_name}} has been revoked",    urgency: "warning" },
  { id: "ia-6", cat: "Access & Tickets",    name: "Ticket overdue",           msg: "Ticket #{{ticket.id}} has exceeded the SLA of {{n}} hours",   urgency: "critical" },
  { id: "ia-7", cat: "Security",            name: "Session flagged",          msg: "⚑ Session on {{resource}} flagged — {{reason}}",             urgency: "critical" },
  { id: "ia-8", cat: "Security",            name: "Break-glass granted",      msg: "Emergency access granted to {{resource}} by {{admin}}",       urgency: "critical" },
  { id: "ia-9", cat: "Security",            name: "Rotation failed",          msg: "Credential rotation failed for {{credential}} — {{reason}}",  urgency: "warning" },
  { id: "ia-10",cat: "Security",            name: "Certificate expiring",     msg: "{{certificate}} expires in {{n}} days",                        urgency: "warning" },
  { id: "ia-11",cat: "System",              name: "Storage low",              msg: "Recording storage is {{n}}% full",                            urgency: "warning" },
  { id: "ia-12",cat: "System",              name: "Scan completed",           msg: "Network scan on {{ip_range}} completed — {{n}} assets found", urgency: "info" },
];

const VARIABLES = [
  { group: "Recipient", vars: [
    { key: "{{user.first_name}}", ex: "Priya" },
    { key: "{{user.last_name}}",  ex: "Iyer" },
    { key: "{{user.email}}",      ex: "priya.iyer@northwind.com" },
    { key: "{{user.role}}",       ex: "Operator" },
  ]},
  { group: "Request / Ticket", vars: [
    { key: "{{ticket.id}}",               ex: "TKT-2104" },
    { key: "{{ticket.resource_name}}",    ex: "prod-db-primary" },
    { key: "{{ticket.resource_type}}",    ex: "Database" },
    { key: "{{ticket.access_from}}",      ex: "May 18, 2026, 10:00 AM" },
    { key: "{{ticket.access_until}}",     ex: "May 18, 2026, 6:00 PM" },
    { key: "{{ticket.reason}}",           ex: "Investigating query slowdown" },
    { key: "{{ticket.approved_by}}",      ex: "Arjun Bansal" },
    { key: "{{ticket.rejection_reason}}", ex: "Duration exceeds 8-hour limit" },
  ]},
  { group: "Organization", vars: [
    { key: "{{org.name}}",    ex: "Northwind Financial" },
    { key: "{{org.pam_url}}", ex: "https://pam.northwind.com" },
  ]},
  { group: "Dates", vars: [
    { key: "{{date.today}}", ex: "June 17, 2026" },
    { key: "{{date.now}}",   ex: "June 17, 2026 14:02 IST" },
  ]},
];

const APPROVE_TICKET_TEMPLATE = {
  subject: "Your access to {{ticket.resource_name}} has been approved",
  fromName: "Northwind Financial PAM",
  body: `Hi {{user.first_name}},

Your access request has been approved.

Resource: {{ticket.resource_name}}
Access from: {{ticket.access_from}}
Access until: {{ticket.access_until}}
Approved by: {{ticket.approved_by}}

To launch your session, log in to PAM at {{org.pam_url}}.

If you did not make this request, contact your security team immediately.

The Northwind Financial Security Team`,
};

// ======= CUSTOMIZATION SCREEN SHELL =====================================
const CustomizationScreen = () => {
  const [section, setSection] = React.useState("branding");
  const [editingTemplate, setEditingTemplate] = React.useState(null);
  const [toast, setToast] = React.useState(null);
  const showToast = (t) => { setToast(t); setTimeout(() => setToast(null), 2600); };

  if (editingTemplate) return <TemplateEditor template={editingTemplate} onClose={() => setEditingTemplate(null)} onSave={() => { setEditingTemplate(null); showToast({ kind: "success", text: "Template saved" }); }} onToast={showToast}/>;

  return (
    <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
      {/* Sidebar */}
      <nav style={{ width: 220, borderRight: "1px solid var(--border)", background: "var(--bg-sidebar)", flexShrink: 0, overflow: "auto", padding: "16px 0" }}>
        <div style={{ padding: "0 20px 14px", font: "600 17px/1.2 var(--font-sans)", color: "var(--fg-1)" }}>Customization</div>
        {CUSTOM_NAV.map(it => {
          const active = section === it.id;
          return (
            <button key={it.id} onClick={() => setSection(it.id)} style={{
              display: "flex", alignItems: "center", gap: 10, width: "100%",
              padding: "8px 20px", border: "none",
              borderLeft: `3px solid ${active ? "var(--brand)" : "transparent"}`,
              background: active ? "var(--brand-soft)" : "transparent",
              color: active ? "var(--brand-fg)" : "var(--fg-2)",
              font: `${active ? 600 : 500} 13px/1 var(--font-sans)`,
              cursor: "pointer", textAlign: "left",
            }}>
              <Icon name={it.icon} size={14} color={active ? "var(--brand-fg)" : "var(--fg-3)"}/>
              <span style={{ flex: 1 }}>{it.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Content */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {section === "branding"  && <BrandingSection onToast={showToast}/>}
        {section === "email"     && <EmailProviderSection onToast={showToast}/>}
        {section === "templates" && <TemplatesSection onEdit={setEditingTemplate} onToast={showToast}/>}
      </div>

      {toast && <Toast {...toast} onClose={() => setToast(null)}/>}
    </div>
  );
};

// ======= SHARED HELPERS ==================================================
const SLabel = ({ children }) => <div style={{ font: "600 10.5px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 14 }}>{children}</div>;

const SRow = ({ label, hint, children }) => (
  <div style={{ marginBottom: 14 }}>
    <label className="field-label" style={{ marginBottom: 6 }}>{label}</label>
    {children}
    {hint && <div className="field-help" style={{ marginTop: 4 }}>{hint}</div>}
  </div>
);

const UploadZone = ({ label, hint, file, accept, onFile }) => (
  <div>
    {!file ? (
      <div style={{ border: "2px dashed var(--border)", borderRadius: 8, padding: "22px 20px", textAlign: "center", cursor: "pointer" }}
        onMouseEnter={e => e.currentTarget.style.borderColor = "var(--brand)"}
        onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
        onClick={() => onFile("mock-file.svg")}>
        <Icon name="upload" size={22} color="var(--fg-4)"/>
        <div style={{ marginTop: 8, font: "500 13px/1.3 var(--font-sans)", color: "var(--fg-2)" }}>Drag and drop or <span style={{ color: "var(--brand-fg)" }}>Browse</span></div>
        <div className="t-tiny" style={{ color: "var(--fg-4)", marginTop: 4 }}>{hint}</div>
      </div>
    ) : (
      <div style={{ padding: "10px 14px", border: "1px solid var(--border)", borderRadius: 8, display: "flex", alignItems: "center", gap: 10, background: "var(--bg-surface-2)" }}>
        <Icon name="file-text" size={18} color="var(--brand-fg)"/>
        <div style={{ flex: 1 }}>
          <div style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{file}</div>
          <div className="t-tiny" style={{ color: "var(--fg-4)" }}>{Math.floor(Math.random()*200+50)} KB</div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => onFile(null)} style={{ color: "var(--danger-fg)" }}>Remove</button>
      </div>
    )}
  </div>
);

const ColorSwatch = ({ value, onChange, label, hint }) => {
  const [open, setOpen] = React.useState(false);
  const hex = value.startsWith("#") ? value : "#" + value;
  // Rough contrast check vs white
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  const lum = (0.299*r + 0.587*g + 0.114*b) / 255;
  const lowContrast = lum > 0.6;
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label className="field-label" style={{ marginBottom: 6 }}>{label}</label>}
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <button onClick={() => setOpen(!open)} style={{ width: 40, height: 40, borderRadius: 8, background: hex, border: "1px solid var(--border)", cursor: "pointer", flex: "none" }}/>
        <input className="input t-mono" value={hex} onChange={e => onChange(e.target.value)} style={{ width: 120 }}/>
      </div>
      {lowContrast && <div style={{ marginTop: 6, padding: "5px 10px", background: "var(--warning-soft)", color: "var(--warning-fg)", borderRadius: 4, font: "500 11.5px/1.4 var(--font-sans)" }}>⚠ Low contrast — text on this color may be hard to read.</div>}
      {hint && <div className="field-help" style={{ marginTop: 4 }}>{hint}</div>}
    </div>
  );
};

const SaveBar = ({ onSave, onDiscard, changed }) => changed ? (
  <div style={{ position: "sticky", top: 0, zIndex: 10, display: "flex", alignItems: "center", gap: 10, padding: "10px 32px", background: "var(--brand-soft)", borderBottom: "1px solid var(--brand-soft-2)" }}>
    <Icon name="alert-circle" size={13} color="var(--brand-fg)"/>
    <span style={{ font: "500 12.5px/1 var(--font-sans)", color: "var(--brand-fg)" }}>Unsaved changes</span>
    <div style={{ flex: 1 }}/>
    <button className="btn btn-ghost btn-sm" onClick={onDiscard} style={{ color: "var(--fg-3)" }}>Discard</button>
    <button className="btn btn-primary btn-sm" onClick={onSave}>Save changes</button>
  </div>
) : null;

// ======= BRANDING ========================================================
const BrandingSection = ({ onToast }) => {
  const [data, setData] = React.useState(BRANDING_DATA);
  const [changed, setChanged] = React.useState(false);
  const [preview, setPreview] = React.useState("login");
  const set = (k, v) => { setData(d => ({...d, [k]: v})); setChanged(true); };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <SaveBar changed={changed} onSave={() => { onToast({ kind: "success", text: "Branding saved and applied" }); setChanged(false); }} onDiscard={() => { setData(BRANDING_DATA); setChanged(false); }}/>
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "55fr 45fr", overflow: "hidden" }}>

        {/* LEFT: form */}
        <div className="scroll-area" style={{ overflow: "auto", padding: "28px 32px", borderRight: "1px solid var(--border)" }}>
          <h1 className="h-title" style={{ marginBottom: 4 }}>Branding</h1>
          <p style={{ fontSize: 13, color: "var(--fg-3)", margin: "0 0 24px" }}>Customize how PAM looks to your users. Changes apply to the login page and portal header.</p>

          <SLabel>Organization</SLabel>
          <SRow label="Organization name" hint="Shown in browser tab, emails, and exported reports."><input className="input" value={data.orgName} onChange={e => set("orgName", e.target.value)}/></SRow>

          <div style={{ height: 1, background: "var(--border-subtle)", margin: "20px 0" }}/>
          <SLabel>Logo</SLabel>
          <SRow label="Primary logo" hint="PNG or SVG, transparent background, min 200×60px"><UploadZone file={data.logoFile} hint="PNG, SVG, JPG" onFile={v => set("logoFile", v)}/></SRow>
          <SRow label="Favicon" hint="ICO or PNG, 32×32px or 64×64px"><UploadZone file={data.faviconFile} hint="ICO, PNG" onFile={v => set("faviconFile", v)}/></SRow>

          <div style={{ height: 1, background: "var(--border-subtle)", margin: "20px 0" }}/>
          <SLabel>Brand Colors</SLabel>
          <ColorSwatch label="Primary color" value={data.primaryColor} onChange={v => set("primaryColor", v)} hint="Used for primary buttons, nav active state, links, and accents."/>
          <ColorSwatch label="Secondary color" value={data.secondaryColor} onChange={v => set("secondaryColor", v)} hint="Used for secondary actions and hover states."/>
          <div style={{ marginBottom: 14, display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ font: "500 13.5px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>Use separate colors for dark mode</div>
              <div style={{ font: "400 12px/1.5 var(--font-sans)", color: "var(--fg-3)", marginTop: 2 }}>When OFF, PAM auto-generates dark mode from your primary color.</div>
            </div>
            <Toggle value={data.darkMode} onChange={v => set("darkMode", v)}/>
          </div>

          <div style={{ height: 1, background: "var(--border-subtle)", margin: "20px 0" }}/>
          <SLabel>Login Page</SLabel>
          <SRow label="Login page title" hint="Shown above the login form. Keep under 60 characters."><input className="input" value={data.loginTitle} onChange={e => set("loginTitle", e.target.value)}/></SRow>
          <SRow label="Login page subtitle (optional)"><input className="input" value={data.loginSubtitle} onChange={e => set("loginSubtitle", e.target.value)}/></SRow>

          <SRow label="Background style">
            <Segmented value={data.bgStyle} onChange={v => set("bgStyle", v)} options={[{value:"solid",label:"Solid color"},{value:"gradient",label:"Gradient"},{value:"image",label:"Image"}]}/>
          </SRow>
          {data.bgStyle === "solid" && <ColorSwatch label="Background color" value={data.bgSolid} onChange={v => set("bgSolid", v)}/>}
          {data.bgStyle === "gradient" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <ColorSwatch label="From" value={data.bgGradientFrom} onChange={v => set("bgGradientFrom", v)}/>
              <ColorSwatch label="To" value={data.bgGradientTo} onChange={v => set("bgGradientTo", v)}/>
              <SRow label="Direction">
                <Select value={data.bgGradientDir} onChange={v => set("bgGradientDir", v)} options={[["↓","↓ Top to bottom"],["→","→ Left to right"],["↗","↗ Diagonal"],["↙","↙ Diagonal"]]}/>
              </SRow>
            </div>
          )}
          {data.bgStyle === "image" && (
            <>
              <UploadZone file={data.bgImageFile} hint="JPG, PNG, WebP — min 1920×1080px" onFile={v => set("bgImageFile", v)}/>
              <SRow label="Overlay opacity">
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <input type="range" min={0} max={100} value={data.bgOverlay} onChange={e => set("bgOverlay", +e.target.value)} style={{ flex: 1, accentColor: "var(--brand)" }}/>
                  <span className="t-mono" style={{ width: 40, textAlign: "right" }}>{data.bgOverlay}%</span>
                </div>
              </SRow>
            </>
          )}

          <SRow label="Login card layout">
            <div style={{ display: "flex", gap: 8 }}>
              {[["center","Centered card"],["left","Left-aligned split"],["right","Right-aligned split"]].map(([k,l]) => (
                <button key={k} onClick={() => set("cardStyle", k)} style={{ flex: 1, padding: "10px 8px", border: `1px solid ${data.cardStyle === k ? "var(--brand)" : "var(--border)"}`, background: data.cardStyle === k ? "var(--brand-soft)" : "var(--bg-surface)", borderRadius: 6, font: "500 12px/1.3 var(--font-sans)", color: data.cardStyle === k ? "var(--brand-fg)" : "var(--fg-2)", cursor: "pointer" }}>{l}</button>
              ))}
            </div>
          </SRow>

          <div style={{ height: 1, background: "var(--border-subtle)", margin: "20px 0" }}/>
          <SLabel>Portal Header</SLabel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <ColorSwatch label="Header background" value={data.headerBg} onChange={v => set("headerBg", v)}/>
            <ColorSwatch label="Header text" value={data.headerText} onChange={v => set("headerText", v)}/>
          </div>
          <div style={{ display: "flex", gap: 14 }}>
            <div style={{ flex: 1, display: "flex", gap: 12, alignItems: "center" }}>
              <span style={{ font: "500 13px/1 var(--font-sans)", color: "var(--fg-1)", flex: 1 }}>Show logo in header</span>
              <Toggle value={data.showLogo} onChange={v => set("showLogo", v)}/>
            </div>
            <div style={{ flex: 1, display: "flex", gap: 12, alignItems: "center" }}>
              <span style={{ font: "500 13px/1 var(--font-sans)", color: "var(--fg-1)", flex: 1 }}>Show org name in header</span>
              <Toggle value={data.showOrgName} onChange={v => set("showOrgName", v)}/>
            </div>
          </div>

          <div style={{ marginTop: 24 }}>
            <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger-fg)" }} onClick={() => { setData(BRANDING_DATA); setChanged(false); onToast({ kind: "info", text: "Branding reset to defaults" }); }}>Restore defaults</button>
          </div>
        </div>

        {/* RIGHT: live preview */}
        <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", background: "var(--bg-canvas)" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8, background: "var(--bg-app)" }}>
            <span className="t-tiny">Preview</span>
            <div style={{ flex: 1 }}/>
            {["login","admin","enduser"].map(p => (
              <button key={p} onClick={() => setPreview(p)} style={{ padding: "4px 12px", borderRadius: 999, border: "none", font: "500 11.5px/1 var(--font-sans)", background: preview === p ? "var(--brand)" : "var(--bg-surface-2)", color: preview === p ? "#fff" : "var(--fg-3)", cursor: "pointer" }}>
                {p === "login" ? "Login" : p === "admin" ? "Admin portal" : "End user"}
              </button>
            ))}
            <button className="btn btn-ghost btn-icon btn-sm" title="Download preview"><Icon name="download" size={11}/></button>
          </div>
          <div className="scroll-area" style={{ flex: 1, overflow: "auto", padding: 20, display: "flex", justifyContent: "center", alignItems: "flex-start" }}>
            {preview === "login"  && <LoginPreview data={data}/>}
            {preview === "admin"  && <AdminPreview data={data}/>}
            {preview === "enduser"&& <EndUserPreview data={data}/>}
          </div>
        </div>
      </div>
    </div>
  );
};

// login preview
const LoginPreview = ({ data }) => {
  const bg = data.bgStyle === "solid" ? data.bgSolid
    : data.bgStyle === "gradient" ? `linear-gradient(180deg, ${data.bgGradientFrom}, ${data.bgGradientTo})`
    : "#1A2E5C";
  return (
    <div style={{ width: 380, borderRadius: 12, overflow: "hidden", boxShadow: "0 12px 40px rgba(0,0,0,0.24)", fontSize: "0.8em" }}>
      <div style={{ background: bg, padding: "32px 20px 20px", display: "flex", justifyContent: "center" }}>
        <div style={{ background: data.cardBg || "#fff", borderRadius: 10, padding: 24, width: 280, boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}>
          {data.logoFile && <div style={{ marginBottom: 14, display: "flex", justifyContent: "center" }}><div style={{ width: 80, height: 24, background: data.primaryColor, borderRadius: 4 }}/></div>}
          <div style={{ font: "600 14px/1.3 sans-serif", color: "#111", marginBottom: 4 }}>{data.loginTitle}</div>
          {data.loginSubtitle && <div style={{ font: "400 11px/1.4 sans-serif", color: "#888", marginBottom: 14 }}>{data.loginSubtitle}</div>}
          <div style={{ height: 30, background: "#f3f4f6", borderRadius: 5, marginBottom: 8 }}/>
          <div style={{ height: 30, background: "#f3f4f6", borderRadius: 5, marginBottom: 12 }}/>
          <div style={{ height: 32, background: data.primaryColor, borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", font: "600 12px sans-serif" }}>Sign in</div>
        </div>
      </div>
    </div>
  );
};

const AdminPreview = ({ data }) => (
  <div style={{ width: 380, borderRadius: 12, overflow: "hidden", boxShadow: "0 12px 40px rgba(0,0,0,0.24)", border: "1px solid var(--border)", fontSize: "0.75em" }}>
    <div style={{ height: 28, background: data.headerBg || "#fff", borderBottom: "1px solid #e6e8eb", display: "flex", alignItems: "center", padding: "0 10px", gap: 8 }}>
      <div style={{ width: 40, height: 12, background: data.primaryColor, borderRadius: 3 }}/>
      <div style={{ flex: 1 }}/>
      <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#e6e8eb" }}/>
    </div>
    <div style={{ display: "flex", height: 140 }}>
      <div style={{ width: 60, background: "#fbfbfc", borderRight: "1px solid #e6e8eb", padding: 8 }}>
        {[1,2,3,4].map(i => <div key={i} style={{ height: 16, background: i === 1 ? data.primaryColor + "22" : "transparent", borderLeft: i === 1 ? `2px solid ${data.primaryColor}` : "2px solid transparent", borderRadius: 3, marginBottom: 4 }}/>)}
      </div>
      <div style={{ flex: 1, padding: 10, background: "#f7f8f9" }}>
        {[1,2,3].map(i => <div key={i} style={{ height: 24, background: "#fff", borderRadius: 6, marginBottom: 6, border: "1px solid #e6e8eb" }}/>)}
      </div>
    </div>
  </div>
);

const EndUserPreview = ({ data }) => (
  <div style={{ width: 280, borderRadius: 12, overflow: "hidden", boxShadow: "0 12px 40px rgba(0,0,0,0.24)", border: "1px solid var(--border)", fontSize: "0.75em" }}>
    <div style={{ height: 28, background: data.headerBg || "#fff", borderBottom: "1px solid #e6e8eb", display: "flex", alignItems: "center", padding: "0 10px", gap: 6 }}>
      <div style={{ width: 36, height: 10, background: data.primaryColor, borderRadius: 3 }}/>
      <div style={{ flex: 1 }}/>
      <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#e6e8eb" }}/>
    </div>
    <div style={{ padding: 10, background: "#f7f8f9" }}>
      {[1,2,3].map(i => <div key={i} style={{ height: 50, background: "#fff", borderRadius: 8, marginBottom: 8, border: "1px solid #e6e8eb", padding: 8, display: "flex", gap: 8, alignItems: "center" }}>
        <div style={{ width: 22, height: 22, background: data.primaryColor + "22", borderRadius: 6 }}/>
        <div style={{ flex: 1 }}><div style={{ height: 8, background: "#e6e8eb", borderRadius: 3, marginBottom: 4 }}/><div style={{ height: 7, background: "#f3f4f6", borderRadius: 3, width: "60%" }}/></div>
        <div style={{ height: 20, width: 40, background: data.primaryColor, borderRadius: 4 }}/>
      </div>)}
    </div>
  </div>
);

// ======= EMAIL PROVIDER ==================================================
const EmailProviderSection = ({ onToast }) => {
  const [data, setData] = React.useState(EMAIL_DATA);
  const [testState, setTestState] = React.useState("idle");
  const [testTo, setTestTo] = React.useState("arjun.bansal@northwind.com");
  const set = (k, v) => setData(d => ({...d, [k]: v}));

  const runTest = () => {
    setTestState("testing");
    setTimeout(() => setTestState(data.host.includes("invalid") ? "failed" : "success"), 1600);
  };

  return (
    <div className="scroll-area" style={{ flex: 1, overflow: "auto", padding: "28px 32px", maxWidth: 720 }}>
      <h1 className="h-title" style={{ marginBottom: 4 }}>Email Provider</h1>
      <p style={{ fontSize: 13, color: "var(--fg-3)", margin: "0 0 24px" }}>Configure the SMTP server PAM uses to send emails.</p>

      {/* Status card */}
      <div className="card" style={{ padding: 18, marginBottom: 24, display: "flex", gap: 14, alignItems: "flex-start" }}>
        <div style={{ width: 40, height: 40, borderRadius: 8, background: data.configured ? "var(--success-soft)" : "var(--bg-surface-2)", color: data.configured ? "var(--success-fg)" : "var(--fg-3)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="mail" size={20}/></div>
        <div style={{ flex: 1 }}>
          <div style={{ font: "600 14px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{data.configured ? "Custom email provider active" : "Using miniOrange default email sender"}</div>
          <div style={{ font: "400 12.5px/1.5 var(--font-sans)", color: "var(--fg-3)", marginTop: 4 }}>From: <span className="t-mono" style={{ color: "var(--fg-1)" }}>{data.configured ? data.sender : "noreply@miniorange.com"}</span> · {data.configured ? `Last sent: ${data.lastSent}` : "Emails may be flagged as spam at your organization"}</div>
        </div>
        {data.configured && <div style={{ display: "flex", gap: 6 }}>
          <button className="btn btn-sm btn-ghost" onClick={runTest}><Icon name="send" size={11}/> Send test email</button>
        </div>}
      </div>

      <div style={{ font: "600 10.5px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 16 }}>SMTP Server</div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <SRow label="Host name" hint="Your organization's outgoing mail server hostname">
          <input className="input t-mono" value={data.host} onChange={e => set("host", e.target.value)} placeholder="smtp.northwind.com"/>
        </SRow>
        <SRow label="Port number">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <input className="input t-mono" value={data.port} onChange={e => set("port", e.target.value)} style={{ width: 120 }}/>
            <div style={{ display: "flex", gap: 6 }}>
              {[["25","25"],["465","465 (SSL)"],["587","587 (TLS — recommended)"],["2525","2525"]].map(([p,l]) => (
                <button key={p} onClick={() => set("port", p)} style={{ padding: "3px 10px", borderRadius: 4, border: `1px solid ${data.port === p ? "var(--brand)" : "var(--border)"}`, background: data.port === p ? "var(--brand-soft)" : "var(--bg-surface)", color: data.port === p ? "var(--brand-fg)" : "var(--fg-3)", font: "500 11.5px/1 var(--font-sans)", cursor: "pointer" }}>{l}</button>
              ))}
            </div>
          </div>
        </SRow>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <SRow label="Username" hint="The email account PAM authenticates with"><input className="input t-mono" value={data.username} onChange={e => set("username", e.target.value)}/></SRow>
          <SRow label="Password"><div style={{ display: "flex", gap: 6 }}><input className="input t-mono" type="password" value={data.password} onChange={e => set("password", e.target.value)} style={{ flex: 1 }}/><button className="btn btn-ghost btn-icon"><Icon name="eye" size={12}/></button></div></SRow>
        </div>
        <SRow label="Sender email" hint="The 'From' address recipients see. Must be authorized to send from your SMTP server.">
          <input className="input t-mono" value={data.sender} onChange={e => set("sender", e.target.value)} placeholder="noreply@northwind.com"/>
        </SRow>
        <SRow label="Encryption">
          <Select value={data.encryption} onChange={v => set("encryption", v)} options={[["None","None"],["SSL","SSL"],["TLS","TLS (STARTTLS) — recommended"]]}/>
        </SRow>

        {/* Test button */}
        <div>
          <button className="btn btn-primary" onClick={runTest} disabled={testState === "testing"}>
            {testState === "testing" ? <><Spinner size={13} color="#fff"/> Testing…</> : <><Icon name="zap" size={12}/> Test configuration</>}
          </button>
          {testState === "success" && (
            <div style={{ marginTop: 14, padding: 14, background: "var(--success-soft)", borderRadius: 8, display: "flex", flexDirection: "column", gap: 6 }}>
              <div className="row"><Icon name="check-circle" size={14} color="var(--success-fg)"/><span style={{ font: "600 13px/1 var(--font-sans)", color: "var(--success-fg)" }}>SMTP connection successful</span></div>
              <div className="row"><Icon name="check-circle" size={14} color="var(--success-fg)"/><span style={{ font: "400 12.5px/1.3 var(--font-sans)", color: "var(--success-fg)" }}>Test email sent to arjun.bansal@northwind.com</span></div>
              <div style={{ font: "400 12px/1.4 var(--font-sans)", color: "var(--fg-3)", marginTop: 4 }}>Check your inbox to confirm delivery.</div>
            </div>
          )}
          {testState === "failed" && (
            <div style={{ marginTop: 14, padding: 14, background: "var(--danger-soft)", borderRadius: 8 }}>
              <div className="row"><Icon name="alert-circle" size={14} color="var(--danger-fg)"/><span style={{ font: "600 13px/1 var(--font-sans)", color: "var(--danger-fg)" }}>Connection failed</span></div>
              <div style={{ font: "400 12.5px/1.5 var(--font-sans)", color: "var(--danger-fg)", marginTop: 8 }}>Could not connect to {data.host}:{data.port} — Verify the hostname and port are correct.</div>
              <details style={{ marginTop: 8 }}>
                <summary style={{ font: "500 12px/1 var(--font-sans)", color: "var(--danger-fg)", cursor: "pointer" }}>What to fix ↓</summary>
                <div style={{ marginTop: 8, font: "400 12px/1.5 var(--font-sans)", color: "var(--fg-2)" }}>
                  <div>1. Verify the hostname <span className="t-mono">{data.host}</span> resolves in DNS</div>
                  <div>2. Confirm port {data.port} is open on your SMTP server firewall</div>
                  <div>3. If using TLS, ensure the server supports STARTTLS on port 587</div>
                </div>
              </details>
            </div>
          )}
        </div>
      </div>

      <div style={{ height: 1, background: "var(--border-subtle)", margin: "24px 0" }}/>
      <div style={{ font: "600 10.5px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 14 }}>IF SMTP FAILS</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {[["miniorange","Use miniOrange default email as fallback (recommended)"],["silent","Fail silently — do not send emails if SMTP fails"]].map(([k,l]) => (
          <label key={k} style={{ display: "flex", gap: 10, padding: "10px 12px", border: `1px solid ${data.fallback === k ? "var(--brand)" : "var(--border)"}`, background: data.fallback === k ? "var(--brand-soft)" : "var(--bg-surface)", borderRadius: 6, cursor: "pointer" }}>
            <input type="radio" checked={data.fallback === k} onChange={() => set("fallback", k)} style={{ accentColor: "var(--brand)", marginTop: 2 }}/>
            <span style={{ font: "500 13px/1.3 var(--font-sans)", color: data.fallback === k ? "var(--brand-fg)" : "var(--fg-1)" }}>{l}</span>
          </label>
        ))}
      </div>

      <div style={{ height: 1, background: "var(--border-subtle)", margin: "24px 0" }}/>
      <div style={{ font: "600 10.5px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 14 }}>Test Email</div>
      <p style={{ fontSize: 13, color: "var(--fg-3)", margin: "0 0 12px" }}>Send a test email to verify your SMTP configuration works end-to-end.</p>
      <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
        <SRow label="From"><input className="input t-mono" value={data.sender} readOnly style={{ background: "var(--bg-surface-2)", width: 220 }}/></SRow>
        <SRow label="To"><input className="input" value={testTo} onChange={e => setTestTo(e.target.value)} style={{ width: 240 }}/></SRow>
        <button className="btn btn-primary" style={{ marginBottom: 14 }} onClick={() => { onToast({ kind: "success", text: `Test email sent to ${testTo}` }); }}><Icon name="send" size={11}/> Send test</button>
      </div>

      <div style={{ marginTop: 24 }}>
        <button className="btn btn-primary" onClick={() => onToast({ kind: "success", text: "Email provider settings saved" })}>Save email provider settings</button>
      </div>
    </div>
  );
};

// ======= TEMPLATES LIST ==================================================
const TemplatesSection = ({ onEdit, onToast }) => {
  const [tab, setTab] = React.useState("email");
  const [search, setSearch] = React.useState("");

  const StatusBadge = ({ status }) => {
    const m = { default: { bg: "var(--bg-surface-2)", fg: "var(--fg-3)", label: "Default" }, customized: { bg: "var(--success-soft)", fg: "var(--success-fg)", label: "Customized" }, draft: { bg: "var(--warning-soft)", fg: "var(--warning-fg)", label: "Draft" } }[status] || {};
    return <span style={{ padding: "2px 8px", borderRadius: 999, font: "500 11px/1.5 var(--font-sans)", background: m.bg, color: m.fg }}>{m.label}</span>;
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ padding: "20px 32px 0", borderBottom: "1px solid var(--border)" }}>
        <h1 className="h-title" style={{ marginBottom: 4 }}>Templates</h1>
        <p style={{ fontSize: 13, color: "var(--fg-3)", margin: "0 0 14px" }}>Customize what PAM says in emails and in-app notifications.</p>
        <TabBar active={tab} onChange={setTab} tabs={[{ id: "email", label: "Email templates", weight: 1 }, { separator: true }, { id: "inapp", label: "In-app notifications", weight: 3 }]}/>
      </div>

      <div className="scroll-area" style={{ flex: 1, overflow: "auto", padding: "20px 32px" }}>
        <div style={{ position: "relative", maxWidth: 560, marginBottom: 20 }}>
          <Icon name="search" size={13} color="var(--fg-4)" style={{ position: "absolute", left: 10, top: 11 }}/>
          <input className="input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search templates…" style={{ paddingLeft: 30, height: 32 }}/>
        </div>

        {tab === "email" && TEMPLATE_CATEGORIES.map(cat => {
          const rows = cat.templates.filter(t => !search || (t.name + t.desc).toLowerCase().includes(search.toLowerCase()));
          if (!rows.length) return null;
          return (
            <div key={cat.id} style={{ marginBottom: 24 }}>
              <div style={{ font: "600 10.5px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.7, padding: "10px 0 8px", borderBottom: "1px solid var(--border)" }}>{cat.label}</div>
              {rows.map(t => (
                <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderBottom: "1px solid var(--border-subtle)" }}>
                  <div style={{ width: 32, height: 32, borderRadius: 7, background: "var(--bg-surface-2)", color: "var(--fg-3)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Icon name="mail" size={14}/></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ font: "500 13.5px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{t.name}</div>
                    <div style={{ font: "400 12px/1.4 var(--font-sans)", color: "var(--fg-3)", marginTop: 2 }}>{t.desc}</div>
                  </div>
                  <StatusBadge status={t.status}/>
                  {t.lastMod && <span className="t-tiny" style={{ color: "var(--fg-4)" }}>{t.lastMod}</span>}
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="btn btn-sm" onClick={() => onEdit(t)}>Edit</button>
                    {t.status !== "default" && <button className="btn btn-ghost btn-sm" style={{ color: "var(--fg-3)" }} onClick={() => onToast({ kind: "info", text: `${t.name} reset to default` })}>Reset</button>}
                  </div>
                </div>
              ))}
            </div>
          );
        })}

        {tab === "inapp" && (() => {
          const cats = [...new Set(INAPP_TEMPLATES.map(t => t.cat))];
          return cats.map(cat => {
            const rows = INAPP_TEMPLATES.filter(t => t.cat === cat && (!search || (t.name + t.msg).toLowerCase().includes(search.toLowerCase())));
            if (!rows.length) return null;
            const urgencyColor = { default: "var(--fg-4)", info: "var(--info-fg)", warning: "var(--warning-fg)", critical: "var(--danger-fg)" };
            return (
              <div key={cat} style={{ marginBottom: 24 }}>
                <div style={{ font: "600 10.5px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.7, padding: "10px 0 8px", borderBottom: "1px solid var(--border)" }}>{cat}</div>
                {rows.map(t => (
                  <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderBottom: "1px solid var(--border-subtle)" }}>
                    <div style={{ width: 32, height: 32, borderRadius: 7, background: t.urgency === "critical" ? "var(--danger-soft)" : t.urgency === "warning" ? "var(--warning-soft)" : t.urgency === "info" ? "var(--info-soft)" : "var(--bg-surface-2)", color: urgencyColor[t.urgency], display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Icon name="bell" size={14}/></div>
                    <div style={{ flex: 1 }}>
                      <div style={{ font: "500 13.5px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{t.name}</div>
                      <div style={{ font: "400 12px/1.4 var(--font-mono)", color: "var(--fg-3)", marginTop: 2 }}>{t.msg}</div>
                    </div>
                    <button className="btn btn-sm" onClick={() => onToast({ kind: "info", text: "In-app notification editor coming" })}>Edit</button>
                  </div>
                ))}
              </div>
            );
          });
        })()}
      </div>
    </div>
  );
};

// ======= TEMPLATE EDITOR =================================================
const TemplateEditor = ({ template, onClose, onSave, onToast }) => {
  const [subject, setSubject] = React.useState(template.id === "approve-ticket" ? APPROVE_TICKET_TEMPLATE.subject : "Your {{ticket.resource_name}} request");
  const [fromName, setFromName] = React.useState("Northwind Financial PAM");
  const [body, setBody] = React.useState(template.id === "approve-ticket" ? APPROVE_TICKET_TEMPLATE.body : "Hi {{user.first_name}},\n\nThis is a notification from PAM.\n\nThe Northwind Financial Security Team");
  const [varOpen, setVarOpen] = React.useState(false);
  const [varSearch, setVarSearch] = React.useState("");
  const [previewMode, setPreviewMode] = React.useState("desktop");
  const [testTo, setTestTo] = React.useState("arjun.bansal@northwind.com");
  const [sendingTest, setSendingTest] = React.useState(false);

  const preview_body = body
    .replace(/{{user\.first_name}}/g, "Priya").replace(/{{user\.email}}/g, "priya.iyer@northwind.com")
    .replace(/{{ticket\.resource_name}}/g, "prod-db-primary").replace(/{{ticket\.access_from}}/g, "May 18, 2026, 10:00 AM")
    .replace(/{{ticket\.access_until}}/g, "May 18, 2026, 6:00 PM").replace(/{{ticket\.approved_by}}/g, "Arjun Bansal")
    .replace(/{{org\.name}}/g, "Northwind Financial").replace(/{{org\.pam_url}}/g, "https://pam.northwind.com");
  const preview_subject = subject.replace(/{{ticket\.resource_name}}/g, "prod-db-primary");

  const insertVar = (key) => { setBody(b => b + key); setVarOpen(false); };

  const filteredVars = varSearch ? VARIABLES.map(g => ({...g, vars: g.vars.filter(v => v.key.includes(varSearch) || v.ex.toLowerCase().includes(varSearch.toLowerCase()))})).filter(g => g.vars.length) : VARIABLES;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Breadcrumb + actions */}
      <div style={{ padding: "14px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12 }}>
        <div>
          <div style={{ font: "400 12px/1 var(--font-sans)", color: "var(--fg-4)", display: "flex", gap: 6 }}>
            <a href="#" onClick={e => { e.preventDefault(); onClose(); }} style={{ color: "var(--brand-fg)" }}>Templates</a>
            <Icon name="chevron-right" size={10}/>
            <span>{template.name}</span>
          </div>
          <h1 style={{ font: "600 20px/1.2 var(--font-sans)", color: "var(--fg-1)", margin: "4px 0 0" }}>{template.name}</h1>
        </div>
        <div style={{ flex: 1 }}/>
        <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger-fg)" }} onClick={() => onToast({ kind: "info", text: "Template reset to default" })}>Reset to default</button>
        <button className="btn btn-primary" onClick={onSave}>Save template</button>
      </div>

      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "55fr 45fr", overflow: "hidden" }}>
        {/* LEFT: editor */}
        <div className="scroll-area" style={{ overflow: "auto", padding: "20px 24px", borderRight: "1px solid var(--border)", position: "relative" }}>
          <div style={{ font: "600 10.5px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 14 }}>Email Settings</div>

          <SRow label="Subject line">
            <div style={{ display: "flex", gap: 6 }}>
              <input className="input" value={subject} onChange={e => setSubject(e.target.value)} style={{ flex: 1 }}/>
              <button className="btn btn-sm" onClick={() => setVarOpen(true)} title="Insert variable">{"{ }"}</button>
            </div>
          </SRow>
          <SRow label="From name"><input className="input" value={fromName} onChange={e => setFromName(e.target.value)}/></SRow>
          <SRow label="From email">
            <div className="row">
              <input className="input t-mono" value="noreply@northwind.com" readOnly style={{ background: "var(--bg-surface-2)", flex: 1 }}/>
              <a href="#" style={{ font: "500 12px/1 var(--font-sans)", color: "var(--brand-fg)", whiteSpace: "nowrap" }}>Change in Email Provider →</a>
            </div>
          </SRow>

          <div style={{ height: 1, background: "var(--border-subtle)", margin: "16px 0" }}/>
          <div style={{ font: "600 10.5px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 10 }}>Email Body</div>

          {/* Mini toolbar */}
          <div style={{ display: "flex", gap: 4, padding: "6px 8px", background: "var(--bg-surface-2)", borderRadius: "6px 6px 0 0", border: "1px solid var(--border)", borderBottom: "none" }}>
            {["B","I","U","—","≡","⌘"].map(c => <button key={c} style={{ width: 26, height: 26, border: "none", background: "transparent", borderRadius: 4, cursor: "pointer", font: c === "B" ? "700 12px/1 var(--font-sans)" : "400 12px/1 var(--font-sans)", color: "var(--fg-2)" }}>{c}</button>)}
            <div style={{ width: 1, height: 20, background: "var(--border)", alignSelf: "center", margin: "0 4px" }}/>
            <button onClick={() => setVarOpen(true)} style={{ padding: "0 8px", height: 26, border: "none", background: "var(--brand-soft)", borderRadius: 4, cursor: "pointer", font: "600 11.5px/1 var(--font-sans)", color: "var(--brand-fg)" }}>{"{ variable }"}</button>
          </div>

          <textarea className="input t-mono" value={body} onChange={e => setBody(e.target.value)} rows={12} style={{ borderRadius: "0 0 6px 6px", resize: "vertical", font: "400 13px/1.6 var(--font-mono)" }}/>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <span className="t-tiny" style={{ color: "var(--fg-4)" }}>{body.length} characters</span>
          </div>

          {/* Variable picker (slide from right of editor) */}
          {varOpen && (
            <div style={{ position: "absolute", top: 0, right: 0, width: 320, bottom: 0, background: "var(--bg-app)", borderLeft: "1px solid var(--border)", display: "flex", flexDirection: "column", boxShadow: "-4px 0 16px rgba(0,0,0,0.06)", zIndex: 10 }}>
              <div className="card-header">
                <span className="h-card">Insert variable</span>
                <div style={{ flex: 1 }}/>
                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => { setVarOpen(false); setVarSearch(""); }}><Icon name="x" size={13}/></button>
              </div>
              <div style={{ padding: "10px 14px" }}>
                <input className="input" value={varSearch} onChange={e => setVarSearch(e.target.value)} placeholder="Search variables…" style={{ height: 30, fontSize: 12 }}/>
              </div>
              <div className="scroll-area" style={{ flex: 1, overflow: "auto", padding: "0 14px 14px" }}>
                {filteredVars.map(g => (
                  <div key={g.group} style={{ marginBottom: 14 }}>
                    <div className="t-micro" style={{ marginBottom: 6 }}>{g.group}</div>
                    {g.vars.map(v => (
                      <button key={v.key} onClick={() => insertVar(v.key)} style={{ display: "block", width: "100%", padding: "7px 10px", border: "none", background: "transparent", borderRadius: 5, cursor: "pointer", textAlign: "left", marginBottom: 2 }}
                        onMouseEnter={e => e.currentTarget.style.background = "var(--bg-surface-2)"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <div className="t-mono" style={{ font: "500 12px/1 var(--font-mono)", color: "var(--brand-fg)" }}>{v.key}</div>
                        <div style={{ font: "400 11px/1.3 var(--font-sans)", color: "var(--fg-4)", marginTop: 2 }}>e.g. "{v.ex}"</div>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: live email preview */}
        <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", background: "var(--bg-canvas)" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8, background: "var(--bg-app)" }}>
            <span className="t-tiny" style={{ flex: 1 }}>Email preview</span>
            {["desktop","mobile"].map(m => (
              <button key={m} onClick={() => setPreviewMode(m)} style={{ padding: "3px 12px", borderRadius: 999, border: "none", font: "500 11.5px/1 var(--font-sans)", background: previewMode === m ? "var(--brand)" : "var(--bg-surface-2)", color: previewMode === m ? "#fff" : "var(--fg-3)", cursor: "pointer" }}>{m.charAt(0).toUpperCase() + m.slice(1)}</button>
            ))}
          </div>
          <div className="scroll-area" style={{ flex: 1, overflow: "auto", padding: 20, display: "flex", justifyContent: "center" }}>
            <div style={{ width: previewMode === "mobile" ? 280 : "100%", maxWidth: 560 }}>
              {/* Email chrome */}
              <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
                <div style={{ padding: "10px 16px", background: "#f3f4f6", borderBottom: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ font: "500 12px/1 var(--font-sans)", color: "#555" }}>From: {fromName} &lt;noreply@northwind.com&gt;</div>
                  <div style={{ font: "500 12px/1 var(--font-sans)", color: "#555" }}>To: priya.iyer@northwind.com</div>
                  <div style={{ font: "600 14px/1.2 var(--font-sans)", color: "#111" }}>Subject: {preview_subject}</div>
                </div>
                <div style={{ padding: 24 }}>
                  {/* Email logo */}
                  <div style={{ textAlign: "center", marginBottom: 20 }}>
                    <div style={{ display: "inline-block", width: 120, height: 32, background: BRANDING_DATA.primaryColor, borderRadius: 6 }}/>
                  </div>
                  <pre style={{ font: "400 13.5px/1.7 var(--font-sans)", color: "#222", margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{preview_body}</pre>
                  <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid #e6e8eb", font: "400 11.5px/1.5 var(--font-sans)", color: "#888", textAlign: "center" }}>
                    <div>miniOrange PAM · Northwind Financial</div>
                    <a href="#" style={{ color: BRANDING_DATA.primaryColor }}>Unsubscribe</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)", background: "var(--bg-app)", display: "flex", alignItems: "center", gap: 8 }}>
            <span className="t-tiny" style={{ color: "var(--fg-4)" }}>Send to:</span>
            <input className="input" value={testTo} onChange={e => setTestTo(e.target.value)} style={{ flex: 1, height: 28, fontSize: 12 }}/>
            <button className="btn btn-sm btn-primary" onClick={() => { setSendingTest(true); setTimeout(() => { setSendingTest(false); onToast({ kind: "success", text: `Test email sent to ${testTo}` }); }, 1200); }} disabled={sendingTest}>
              {sendingTest ? <><Spinner size={12} color="#fff"/> Sending…</> : <><Icon name="send" size={11}/> Send test</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

window.CustomizationScreen = CustomizationScreen;
