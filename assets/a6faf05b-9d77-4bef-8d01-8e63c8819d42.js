// Resource-scoped Allocate Access panel — slide-in wizard.
// Two steps: Configure → Review. Captures who (user/group/role), access
// window type, governing policy, and mapped credential. Accepts a `prefill`
// prop so it can be opened blank (from Overview header) or preseeded from a
// "Not Allocated" row on the Access section.

const ALLOC_WINDOW_OPTIONS = [
  { id: "custom",       label: "Custom date range",    icon: "calendar",  hint: "Exact from/to datetimes.",       tag: "Time-boxed" },
  { id: "zeroday",      label: "Zero Day",             icon: "zap",       hint: "Valid until end of today only.", tag: "Same-day" },
  { id: "lifelong",     label: "Lifelong",             icon: "infinity",  hint: "No expiry · flagged.",            tag: "Permanent" },
  { id: "oneTime",      label: "One-time access",      icon: "target",    hint: "Ends after first session.",       tag: "Single use" },
  { id: "workingHours", label: "Working days & hours", icon: "clock",     hint: "Recurring weekday window.",       tag: "Recurring" },
];

const ALLOC_TIMEZONES = [
  { id: "Asia/Kolkata",       label: "Asia/Kolkata (IST)" },
  { id: "UTC",                label: "UTC" },
  { id: "America/New_York",   label: "America/New_York (ET)" },
  { id: "America/Los_Angeles",label: "America/Los_Angeles (PT)" },
  { id: "Europe/London",      label: "Europe/London (GMT)" },
  { id: "Europe/Berlin",      label: "Europe/Berlin (CET)" },
  { id: "Australia/Sydney",   label: "Australia/Sydney (AET)" },
];

const ALLOC_WEEKDAYS = [
  { i: 1, short: "Mon", long: "Monday" },
  { i: 2, short: "Tue", long: "Tuesday" },
  { i: 3, short: "Wed", long: "Wednesday" },
  { i: 4, short: "Thu", long: "Thursday" },
  { i: 5, short: "Fri", long: "Friday" },
  { i: 6, short: "Sat", long: "Saturday" },
  { i: 0, short: "Sun", long: "Sunday" },
];

const allocTodayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
};

const ALLOC_POLICIES_BY_TYPE = {
  database: [
    { id: "prod-ssh",    name: "Production SSH access", note: "Recording on · MFA required · idle 15m" },
    { id: "read-only",   name: "Read-only DB access",   note: "SELECT statements only · session log" },
    { id: "break-glass", name: "Break-glass window",    note: "Emergency use · full recording · 4h max" },
  ],
  linux: [
    { id: "prod-ssh",    name: "Production SSH access", note: "Recording on · MFA required · idle 15m" },
    { id: "sre-ops",     name: "SRE operations",        note: "Restricted commands · session log" },
    { id: "break-glass", name: "Break-glass window",    note: "Emergency use · full recording · 4h max" },
  ],
  default: [
    { id: "prod-ssh",    name: "Production SSH access", note: "Standard production policy" },
    { id: "break-glass", name: "Break-glass window",    note: "Emergency use · full recording · 4h max" },
  ],
};

const ALLOC_ROLE_CATALOG = [
  { id: "r-admin",    name: "Admin",         members: 12,  description: "Full-privilege operators (system-wide)" },
  { id: "r-operator", name: "Operator",      members: 24,  description: "Day-to-day operations (system-wide)" },
  { id: "r-auditor",  name: "Auditor",       members: 4,   description: "Read-only compliance reviewers" },
  { id: "r-rodba",    name: "Read-only DBA", members: 0,   description: "Proposed role · not yet assigned" },
  { id: "r-enduser",  name: "End User",      members: 146, description: "Business users · restricted access" },
];

const ALLOC_GROUP_CATALOG = [
  { id: "g-devops",   name: "DevOps team",       members: 8,  description: "Deploy & infra operations" },
  { id: "g-oncall",   name: "On-call rotation",  members: 5,  description: "Rotational incident response" },
  { id: "g-dba",      name: "DBA leads",         members: 3,  description: "Database administration leads" },
  { id: "g-platform", name: "Platform team",     members: 6,  description: "Platform engineering" },
  { id: "g-dataeng",  name: "Data-Platform",     members: 4,  description: "Data engineering" },
  { id: "g-sre",      name: "SRE-oncall",        members: 7,  description: "SRE incident rotation" },
];

const ALLOC_USER_CATALOG = [
  { id: "u-priya",   name: "Priya Iyer",     role: "Admin" },
  { id: "u-marcus",  name: "Marcus Chen",    role: "Operator" },
  { id: "u-aria",    name: "Aria Chen",      role: "Security Admin" },
  { id: "u-dana",    name: "Dana Whitley",   role: "Contractor" },
  { id: "u-kai",     name: "Kai Watanabe",   role: "DBA candidate" },
  { id: "u-diego",   name: "Diego Vasquez",  role: "Operator" },
  { id: "u-lea",     name: "Léa Martin",     role: "SRE" },
  { id: "u-jamal",   name: "Jamal Green",    role: "Auditor" },
];

const AllocSectionHeader = ({ n, label }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
    <span style={{
      width: 22, height: 22, borderRadius: "50%",
      background: "var(--brand)", color: "#fff",
      display: "flex", alignItems: "center", justifyContent: "center",
      font: "600 11px/1 var(--font-sans)", flexShrink: 0,
    }}>{n}</span>
    <span style={{ font: "600 11px/1 var(--font-sans)", color: "var(--fg-4)", letterSpacing: 0.6, textTransform: "uppercase" }}>{label}</span>
  </div>
);

const AllocSubjectChip = ({ subject, onRemove }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "3px 8px 3px 4px", borderRadius: 999,
    background: "var(--brand-soft)", color: "var(--brand-fg)",
    font: "500 12px/1.4 var(--font-sans)",
  }}>
    {subject.kind === "user"
      ? <Avatar name={subject.name} size={18}/>
      : <span style={{ width: 18, height: 18, borderRadius: 4, background: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name={subject.kind === "role" ? "shield" : "people"} size={10} color="var(--brand-fg)"/>
        </span>}
    <span>{subject.name}</span>
    <span style={{ font: "500 10.5px/1 var(--font-sans)", opacity: 0.7, textTransform: "uppercase", letterSpacing: 0.4 }}>{subject.kind}</span>
    {onRemove && (
      <button onClick={onRemove} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 0, color: "var(--brand-fg)", display: "inline-flex" }} aria-label="Remove">
        <Icon name="x" size={10}/>
      </button>
    )}
  </span>
);

// ─── Access-window configuration ────────────────────────────────────────────
// Left column: radio list of window types.
// Right column: settings card scoped to the selected type. Each type has its
// own tailored inputs (dates + timezone, day-of-week chips + times, session
// duration cap, compliance ack, etc.) so the config lives in one place instead
// of scattered ad-hoc widgets under a tile grid.

const AllocLabel = ({ children }) => (
  <div style={{ font: "600 11px/1 var(--font-sans)", color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6 }}>{children}</div>
);

const AllocTimezoneSelect = ({ value, onChange }) => (
  <select className="input" value={value} onChange={e => onChange(e.target.value)}
    style={{ font: "400 12.5px/1.4 var(--font-sans)" }}>
    {ALLOC_TIMEZONES.map(tz => <option key={tz.id} value={tz.id}>{tz.label}</option>)}
  </select>
);

const AllocWindowSettings = ({ windowType, config, setConfig, resource }) => {
  const patch = (key, val) => setConfig(prev => ({ ...prev, [key]: { ...prev[key], ...val } }));

  if (windowType === "custom") {
    const c = config.custom;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div><AllocLabel>From</AllocLabel><input className="input" type="datetime-local" value={c.from} onChange={e => patch("custom", { from: e.target.value })}/></div>
          <div><AllocLabel>To</AllocLabel><input className="input" type="datetime-local" value={c.to} onChange={e => patch("custom", { to: e.target.value })}/></div>
        </div>
        <div><AllocLabel>Timezone</AllocLabel><AllocTimezoneSelect value={config.timezone} onChange={v => setConfig(prev => ({ ...prev, timezone: v }))}/></div>
        <div style={{ padding: 10, background: "var(--warning-soft)", color: "var(--warning-fg)", borderRadius: 6, font: "400 11.5px/1.5 var(--font-sans)", display: "flex", gap: 6, alignItems: "flex-start" }}>
          <Icon name="alert-circle" size={12} color="var(--warning-fg)" style={{ marginTop: 2 }}/>
          <span>Maximum 48 hours per this resource's Production SSH access policy. Grants past this cap require a Break-glass policy instead.</span>
        </div>
      </div>
    );
  }

  if (windowType === "zeroday") {
    const z = config.zeroday;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: 10 }}>
          <div><AllocLabel>Effective date</AllocLabel><input className="input" type="date" value={z.date} onChange={e => patch("zeroday", { date: e.target.value })}/></div>
          <div><AllocLabel>Cutoff time</AllocLabel><input className="input" type="time" value={z.cutoff} onChange={e => patch("zeroday", { cutoff: e.target.value })}/></div>
        </div>
        <div><AllocLabel>Timezone</AllocLabel><AllocTimezoneSelect value={config.timezone} onChange={v => setConfig(prev => ({ ...prev, timezone: v }))}/></div>
        <div style={{ padding: 10, background: "var(--bg-surface)", borderRadius: 6, font: "400 12px/1.5 var(--font-sans)", color: "var(--fg-3)" }}>
          Access ends at <strong style={{ color: "var(--fg-1)" }}>{z.date || "today"} · {z.cutoff}</strong> ({config.timezone}). No renewals — a new grant must be issued after cutoff.
        </div>
      </div>
    );
  }

  if (windowType === "lifelong") {
    const l = config.lifelong;
    const critical = resource?.criticality === "critical";
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ padding: 12, background: "var(--warning-soft)", color: "var(--warning-fg)", borderRadius: 6, font: "500 12.5px/1.5 var(--font-sans)", display: "flex", gap: 8, alignItems: "flex-start" }}>
          <Icon name="alert-triangle" size={13} color="var(--warning-fg)" style={{ marginTop: 2 }}/>
          <span><strong>No expiry set.</strong> This grant persists until explicitly revoked. It will be surfaced on every compliance review.</span>
        </div>
        <div>
          <AllocLabel>Periodic re-attestation</AllocLabel>
          <Segmented value={l.reattest} onChange={v => patch("lifelong", { reattest: v })} options={[
            { value: "30",    label: "Every 30 days" },
            { value: "60",    label: "60 days" },
            { value: "90",    label: "90 days" },
            { value: "never", label: "Never" },
          ]}/>
          <div style={{ font: "400 11.5px/1.4 var(--font-sans)", color: "var(--fg-4)", marginTop: 6 }}>
            {l.reattest === "never"
              ? "No automated review reminders — reviews rely on ad-hoc audits."
              : `PAM will remind the resource owner to re-attest this grant every ${l.reattest} days.`}
          </div>
        </div>
        <label style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: 10, border: `1px solid ${l.ack ? "var(--brand)" : "var(--border)"}`, background: l.ack ? "var(--brand-soft)" : "var(--bg-app)", borderRadius: 6, cursor: "pointer" }}>
          <input type="checkbox" checked={l.ack} onChange={e => patch("lifelong", { ack: e.target.checked })}
            style={{ marginTop: 2, accentColor: "var(--brand)", cursor: "pointer" }}/>
          <span style={{ font: "500 12.5px/1.4 var(--font-sans)", color: l.ack ? "var(--brand-fg)" : "var(--fg-2)" }}>
            I acknowledge granting no-expiry access{critical ? " on a Critical resource" : ""}.
            {critical && <span style={{ display: "block", font: "400 11.5px/1.4 var(--font-sans)", color: "var(--fg-3)", marginTop: 3 }}>Required for Critical resources.</span>}
          </span>
        </label>
      </div>
    );
  }

  if (windowType === "oneTime") {
    const o = config.oneTime;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <AllocLabel>Max session duration</AllocLabel>
          <Segmented value={String(o.maxMinutes)} onChange={v => patch("oneTime", { maxMinutes: +v })} options={[
            { value: "30",  label: "30 min" },
            { value: "60",  label: "1 hour" },
            { value: "120", label: "2 hours" },
            { value: "240", label: "4 hours" },
          ]}/>
          <div style={{ font: "400 11.5px/1.4 var(--font-sans)", color: "var(--fg-4)", marginTop: 6 }}>Session is force-closed when the cap is reached.</div>
        </div>
        <div>
          <AllocLabel>Must start within</AllocLabel>
          <Segmented value={o.activationDays} onChange={v => patch("oneTime", { activationDays: v })} options={[
            { value: "1", label: "1 day" },
            { value: "3", label: "3 days" },
            { value: "7", label: "7 days" },
          ]}/>
          <div style={{ font: "400 11.5px/1.4 var(--font-sans)", color: "var(--fg-4)", marginTop: 6 }}>If the recipient doesn't connect within this window, the grant expires unused.</div>
        </div>
        <label style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: 10, border: `1px solid ${o.grace ? "var(--brand)" : "var(--border)"}`, background: o.grace ? "var(--brand-soft)" : "var(--bg-app)", borderRadius: 6, cursor: "pointer" }}>
          <input type="checkbox" checked={o.grace} onChange={e => patch("oneTime", { grace: e.target.checked })}
            style={{ marginTop: 2, accentColor: "var(--brand)", cursor: "pointer" }}/>
          <span style={{ font: "500 12.5px/1.4 var(--font-sans)", color: o.grace ? "var(--brand-fg)" : "var(--fg-2)" }}>
            Allow one 15-minute reconnect after first close
            <span style={{ display: "block", font: "400 11.5px/1.4 var(--font-sans)", color: "var(--fg-3)", marginTop: 3 }}>Useful for network blips or fat-finger disconnects.</span>
          </span>
        </label>
      </div>
    );
  }

  if (windowType === "workingHours") {
    const w = config.workingHours;
    const toggleDay = (i) => patch("workingHours", { days: w.days.includes(i) ? w.days.filter(d => d !== i) : [...w.days, i].sort((a,b) => a - b) });
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <AllocLabel>Days of week</AllocLabel>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {ALLOC_WEEKDAYS.map(d => {
              const on = w.days.includes(d.i);
              return (
                <button key={d.i} type="button" onClick={() => toggleDay(d.i)} title={d.long} style={{
                  padding: "6px 12px",
                  border: `1px solid ${on ? "var(--brand)" : "var(--border)"}`,
                  background: on ? "var(--brand-soft)" : "var(--bg-app)",
                  color: on ? "var(--brand-fg)" : "var(--fg-2)",
                  borderRadius: 4, cursor: "pointer",
                  font: `${on ? 600 : 500} 12px/1 var(--font-sans)`,
                }}>{d.short}</button>
              );
            })}
          </div>
          <div style={{ font: "400 11.5px/1.4 var(--font-sans)", color: "var(--fg-4)", marginTop: 6 }}>
            {w.days.length === 0 ? "Select at least one day." : `${w.days.length} day${w.days.length === 1 ? "" : "s"} enabled.`}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div><AllocLabel>Start time</AllocLabel><input className="input" type="time" value={w.from} onChange={e => patch("workingHours", { from: e.target.value })}/></div>
          <div><AllocLabel>End time</AllocLabel><input className="input" type="time" value={w.to} onChange={e => patch("workingHours", { to: e.target.value })}/></div>
        </div>
        <div><AllocLabel>Timezone</AllocLabel><AllocTimezoneSelect value={config.timezone} onChange={v => setConfig(prev => ({ ...prev, timezone: v }))}/></div>
        <div style={{ padding: 10, background: "var(--bg-surface)", borderRadius: 6, font: "400 12px/1.5 var(--font-sans)", color: "var(--fg-3)" }}>
          Recipients can connect only during <strong style={{ color: "var(--fg-1)" }}>{w.from}–{w.to}</strong> on selected days ({config.timezone}). Outside this window, connect attempts are blocked with a policy message.
        </div>
      </div>
    );
  }

  return null;
};

// Human-readable one-line summary of the current window configuration —
// used on the Review step.
const describeAllocWindow = (windowType, config) => {
  if (windowType === "custom") {
    const c = config.custom;
    if (!c.from || !c.to) return `Custom range · not set`;
    return `${c.from.replace("T", " ")} → ${c.to.replace("T", " ")} · ${config.timezone}`;
  }
  if (windowType === "zeroday")      return `${config.zeroday.date} · ends ${config.zeroday.cutoff} · ${config.timezone}`;
  if (windowType === "lifelong")     return `No expiry · ${config.lifelong.reattest === "never" ? "no re-attestation" : `re-attest every ${config.lifelong.reattest} days`}`;
  if (windowType === "oneTime")      return `${config.oneTime.maxMinutes}-min cap · must start within ${config.oneTime.activationDays} day${config.oneTime.activationDays === "1" ? "" : "s"}${config.oneTime.grace ? " · 15-min reconnect" : ""}`;
  if (windowType === "workingHours") {
    const w = config.workingHours;
    const days = w.days.map(i => ALLOC_WEEKDAYS.find(d => d.i === i)?.short).filter(Boolean).join(", ");
    return `${days || "no days"} · ${w.from}–${w.to} · ${config.timezone}`;
  }
  return "";
};

const ResourceAllocatePanelV3 = ({ resource, prefill, onClose, onAllocated }) => {
  const initialSubject = prefill && prefill.subject ? [{
    id: prefill.subject.id,
    name: prefill.subject.name,
    kind: prefill.kind || "user",
    meta: prefill.subject.secondary,
  }] : [];
  const initialWindow = (prefill && prefill.suggestedWindow) || "custom";

  const [step, setStep] = React.useState("configure");
  const [subjects, setSubjects] = React.useState(initialSubject);
  const [kindFilter, setKindFilter] = React.useState(prefill?.kind || "user");
  const [search, setSearch] = React.useState("");
  const [windowType, setWindowType] = React.useState(initialWindow);
  const [windowConfig, setWindowConfig] = React.useState(() => ({
    timezone:     "Asia/Kolkata",
    custom:       { from: "", to: "" },
    zeroday:      { date: allocTodayISO(), cutoff: "23:59" },
    lifelong:     { ack: false, reattest: "60" },
    oneTime:      { maxMinutes: 60, activationDays: "3", grace: false },
    workingHours: { days: [1, 2, 3, 4, 5], from: "09:00", to: "18:00" },
  }));
  const [policyId, setPolicyId] = React.useState("prod-ssh");
  const [credentialId, setCredentialId] = React.useState("");
  const [note, setNote] = React.useState("");
  const [error, setError] = React.useState(null);

  const credOptions = React.useMemo(() => {
    const seeded = (globalThis.SEED_CREDENTIALS || []).filter(c => c.resource === resource.name);
    return seeded.length > 0 ? seeded : [
      { id: "c-root",   display: "root-primary", type: "Password", sensitivity: "Critical" },
      { id: "c-deploy", display: "ssh-deploy",   type: "SSH key",  sensitivity: "High" },
    ];
  }, [resource]);
  React.useEffect(() => { if (!credentialId && credOptions.length) setCredentialId(credOptions[0].id); }, [credOptions, credentialId]);

  const policies = ALLOC_POLICIES_BY_TYPE[resource.type] || ALLOC_POLICIES_BY_TYPE.default;
  React.useEffect(() => { if (!policies.find(p => p.id === policyId)) setPolicyId(policies[0].id); }, [policies, policyId]);

  const catalog = kindFilter === "user" ? ALLOC_USER_CATALOG.map(u => ({ id: u.id, name: u.name, kind: "user", meta: u.role }))
                : kindFilter === "group" ? ALLOC_GROUP_CATALOG.map(g => ({ id: g.id, name: g.name, kind: "group", meta: `${g.members} members · ${g.description}` }))
                : ALLOC_ROLE_CATALOG.map(r => ({ id: r.id, name: r.name, kind: "role", meta: `${r.members} members · ${r.description}` }));
  const searchResults = search
    ? catalog.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) && !subjects.find(x => x.id === s.id))
    : catalog.filter(s => !subjects.find(x => x.id === s.id)).slice(0, 6);

  const addSubject = (s) => { setSubjects(prev => [...prev, s]); setSearch(""); };
  const removeSubject = (id) => setSubjects(prev => prev.filter(s => s.id !== id));

  const windowMeta = ALLOC_WINDOW_OPTIONS.find(o => o.id === windowType);
  const policyMeta = policies.find(p => p.id === policyId);
  const credMeta = credOptions.find(c => c.id === credentialId);

  const validate = () => {
    if (subjects.length === 0) return "Select at least one user, group, or role.";
    if (!windowType) return "Choose an access window.";
    if (windowType === "custom") {
      const c = windowConfig.custom;
      if (!c.from || !c.to) return "Set both From and To datetimes.";
      if (new Date(c.to) <= new Date(c.from)) return "To must be after From.";
      const hours = (new Date(c.to) - new Date(c.from)) / 36e5;
      if (hours > 48) return "Custom range exceeds 48-hour policy cap. Use Break-glass instead.";
    }
    if (windowType === "zeroday") {
      if (!windowConfig.zeroday.date || !windowConfig.zeroday.cutoff) return "Set effective date and cutoff time.";
    }
    if (windowType === "lifelong") {
      if (!windowConfig.lifelong.ack) return "Acknowledge no-expiry grant to continue.";
    }
    if (windowType === "workingHours") {
      const w = windowConfig.workingHours;
      if (!w.days.length) return "Select at least one day of the week.";
      if (!w.from || !w.to || w.from >= w.to) return "Start time must be before end time.";
    }
    if (!policyId) return "Select a governing policy.";
    if (!credentialId) return "Pick the credential to allocate.";
    return null;
  };

  const goReview = () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError(null);
    setStep("review");
  };

  const submit = () => {
    onAllocated && onAllocated({
      subjectSummary: subjects.map(s => s.name).join(", "),
      subjects, windowType, windowConfig, policyId, credentialId, note,
    });
    onClose();
  };

  const windowDescriptor = describeAllocWindow(windowType, windowConfig);

  return (
    <Panel title={step === "review" ? `Review · Allocate on ${resource.name}` : `Allocate access · ${resource.name}`}
      onClose={onClose}
      back={step === "review" ? () => setStep("configure") : undefined}>
      {/* Step indicator */}
      <div style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border-subtle)", padding: "14px 24px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 22, height: 22, borderRadius: "50%",
          background: step === "review" ? "var(--success)" : "var(--brand)", color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          font: "600 11px/1 var(--font-sans)", flexShrink: 0,
        }}>{step === "review" ? <Icon name="check" size={11} color="#fff"/> : "1"}</div>
        <span style={{ font: `${step === "review" ? 500 : 600} 12.5px/1 var(--font-sans)`, color: step === "review" ? "var(--fg-2)" : "var(--fg-1)" }}>Configure</span>
        <div style={{ width: 48, height: 1, background: step === "review" ? "var(--success)" : "var(--border)" }}/>
        <div style={{
          width: 22, height: 22, borderRadius: "50%",
          background: step === "review" ? "var(--brand)" : "var(--bg-surface-2)",
          color: step === "review" ? "#fff" : "var(--fg-3)",
          border: step === "review" ? "none" : "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "center",
          font: "600 11px/1 var(--font-sans)", flexShrink: 0,
        }}>2</div>
        <span style={{ font: `${step === "review" ? 600 : 500} 12.5px/1 var(--font-sans)`, color: step === "review" ? "var(--fg-1)" : "var(--fg-4)" }}>Review</span>
        <div style={{ flex: 1 }}/>
        <span className="t-tiny" style={{ color: "var(--fg-4)" }}>
          Resource: <strong style={{ color: "var(--fg-1)" }}>{resource.name}</strong>{resource.criticality === "critical" ? " · Critical" : ""}
        </span>
      </div>

      <div className="scroll-area" style={{ flex: 1, overflow: "auto", padding: "22px 24px 28px" }}>
        {step === "configure" ? (
          <div style={{ maxWidth: 760, margin: "0 auto" }}>
            {/* Section 1 · Who */}
            <AllocSectionHeader n="1" label="Who gets access"/>
            <div style={{ marginBottom: 10 }}>
              <Segmented value={kindFilter} onChange={setKindFilter} options={[
                { value: "user", label: "User" },
                { value: "group", label: "Group" },
                { value: "role", label: "Role" },
              ]}/>
            </div>
            <div style={{ padding: 8, border: "1px solid var(--border)", borderRadius: 6, background: "var(--bg-app)", display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", minHeight: 40 }}>
              {subjects.map(s => <AllocSubjectChip key={s.id} subject={s} onRemove={() => removeSubject(s.id)}/>)}
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder={subjects.length === 0 ? `Search ${kindFilter}s…` : ""}
                style={{ flex: 1, minWidth: 160, border: "none", outline: "none", font: "400 12.5px/1 var(--font-sans)", background: "transparent" }}/>
            </div>
            {searchResults.length > 0 && (
              <div style={{ marginTop: 4, border: "1px solid var(--border)", borderRadius: 6, background: "var(--bg-app)", padding: 4, boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
                {searchResults.slice(0, 6).map(s => (
                  <button key={s.id} onClick={() => addSubject(s)} style={{
                    display: "flex", alignItems: "center", gap: 10, width: "100%",
                    padding: "7px 10px", border: "none", background: "transparent",
                    cursor: "pointer", borderRadius: 4, textAlign: "left",
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--bg-surface-2)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    {s.kind === "user"
                      ? <Avatar name={s.name} size={22}/>
                      : <span style={{ width: 22, height: 22, borderRadius: 6, background: "var(--brand-soft)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                          <Icon name={s.kind === "role" ? "shield" : "people"} size={11} color="var(--brand-fg)"/>
                        </span>}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{s.name}</div>
                      <div className="t-tiny" style={{ color: "var(--fg-4)", fontWeight: 400 }}>{s.meta}</div>
                    </div>
                    <span className="badge" style={{ textTransform: "capitalize" }}>{s.kind}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Section 2 · Access window — single column, selected radio expands vertically inline */}
            <div style={{ marginTop: 22 }}><AllocSectionHeader n="2" label="Access window"/></div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {ALLOC_WINDOW_OPTIONS.map(o => {
                const sel = windowType === o.id;
                return (
                  <div key={o.id} style={{
                    border: `1px solid ${sel ? "var(--brand)" : "var(--border)"}`,
                    borderRadius: 6,
                    background: sel ? "var(--brand-soft)" : "var(--bg-app)",
                    overflow: "hidden",
                  }}>
                    <button type="button" onClick={() => setWindowType(o.id)} style={{
                      display: "flex", alignItems: "flex-start", gap: 10,
                      width: "100%", padding: 12, border: "none",
                      background: "transparent", cursor: "pointer", textAlign: "left",
                    }}>
                      <span style={{ width: 14, height: 14, borderRadius: "50%", border: `2px solid ${sel ? "var(--brand)" : "var(--border-strong)"}`, display: "flex", alignItems: "center", justifyContent: "center", flex: "none", marginTop: 2 }}>
                        {sel && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--brand)" }}/>}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <Icon name={o.icon} size={13} color={sel ? "var(--brand-fg)" : "var(--fg-3)"}/>
                          <span style={{ font: `${sel ? 600 : 500} 13px/1.2 var(--font-sans)`, color: "var(--fg-1)" }}>{o.label}</span>
                        </div>
                        <div style={{ font: "400 11.5px/1.4 var(--font-sans)", color: "var(--fg-4)", marginTop: 3, paddingLeft: 21 }}>{o.hint}</div>
                      </div>
                      <span className="badge" style={{ flex: "none", marginTop: 1 }}>{o.tag}</span>
                    </button>
                    {sel && (
                      <div style={{
                        padding: 14,
                        borderTop: "1px solid var(--border-subtle)",
                        background: "var(--bg-surface)",
                      }}>
                        <AllocWindowSettings windowType={o.id} config={windowConfig} setConfig={setWindowConfig} resource={resource}/>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Section 3 · Governing policy */}
            <div style={{ marginTop: 22 }}><AllocSectionHeader n="3" label="Governing policy"/></div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {policies.map(p => {
                const sel = policyId === p.id;
                return (
                  <button key={p.id} onClick={() => setPolicyId(p.id)} style={{
                    padding: 12, border: `1px solid ${sel ? "var(--brand)" : "var(--border)"}`,
                    background: sel ? "var(--brand-soft)" : "var(--bg-app)",
                    borderRadius: 6, cursor: "pointer", textAlign: "left",
                    display: "flex", alignItems: "center", gap: 10,
                  }}>
                    <span style={{ width: 12, height: 12, borderRadius: "50%", border: `2px solid ${sel ? "var(--brand)" : "var(--border-strong)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {sel && <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--brand)" }}/>}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{p.name}</div>
                      <div className="t-tiny" style={{ color: "var(--fg-4)", fontWeight: 400, marginTop: 2 }}>{p.note}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Section 4 · Credential */}
            <div style={{ marginTop: 22 }}><AllocSectionHeader n="4" label="Mapped credential"/></div>
            {credOptions.length === 0 ? (
              <div style={{ padding: 12, background: "var(--warning-soft)", color: "var(--warning-fg)", borderRadius: 6, font: "500 12.5px/1.5 var(--font-sans)" }}>
                No credentials linked to this resource. <a href="#" style={{ color: "var(--warning-fg)", textDecoration: "underline" }}>Attach one in the Credentials tab →</a>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {credOptions.map(c => {
                  const sel = credentialId === c.id;
                  return (
                    <button key={c.id} onClick={() => setCredentialId(c.id)} style={{
                      padding: 12, border: `1px solid ${sel ? "var(--brand)" : "var(--border)"}`,
                      background: sel ? "var(--brand-soft)" : "var(--bg-app)",
                      borderRadius: 6, cursor: "pointer", textAlign: "left",
                      display: "flex", alignItems: "center", gap: 10,
                    }}>
                      <span style={{ width: 12, height: 12, borderRadius: "50%", border: `2px solid ${sel ? "var(--brand)" : "var(--border-strong)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {sel && <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--brand)" }}/>}
                      </span>
                      <Icon name={c.type === "SSH key" ? "key" : "lock"} size={14} color="var(--brand-fg)"/>
                      <span style={{ flex: 1, font: "500 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{c.display || c.name}</span>
                      <span className="badge">{c.type || "Password"}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Section 5 · Optional note */}
            <div style={{ marginTop: 22 }}><AllocSectionHeader n="5" label="Note (optional)"/></div>
            <input className="input" value={note} onChange={e => setNote(e.target.value)}
              placeholder="e.g. Q3 ledger reconciliation, escalated by TKT-2104."/>

            {error && (
              <div style={{ marginTop: 16, padding: 12, background: "var(--danger-soft)", color: "var(--danger-fg)", borderRadius: 6, font: "500 12.5px/1.5 var(--font-sans)", display: "flex", gap: 8, alignItems: "flex-start" }}>
                <Icon name="alert-circle" size={14} color="var(--danger-fg)"/><span>{error}</span>
              </div>
            )}
          </div>
        ) : (
          // ─── Review step ────────────────────────────────────────────────────
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <div style={{ padding: "12px 16px", background: "var(--brand-soft)", border: "1px solid transparent", borderRadius: 6, font: "400 12.5px/1.5 var(--font-sans)", color: "var(--brand-fg)", marginBottom: 20 }}>
              You are about to grant <strong>{subjects.length}</strong> {subjects.length === 1 ? "subject" : "subjects"} access to <strong>{resource.name}</strong>. This action is audited and reversible via <em>Revoke</em> on the resource's Overview page.
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: "18px 20px", padding: "6px 4px 22px", borderBottom: "1px solid var(--border)" }}>
              <span style={{ font: "600 11px/1.2 var(--font-sans)", color: "var(--fg-4)", letterSpacing: 0.6, textTransform: "uppercase" }}>Recipients</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {subjects.map(s => <AllocSubjectChip key={s.id} subject={s}/>)}
              </div>

              <span style={{ font: "600 11px/1.2 var(--font-sans)", color: "var(--fg-4)", letterSpacing: 0.6, textTransform: "uppercase" }}>Access window</span>
              <div>
                <div style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{windowMeta?.label}</div>
                <div style={{ font: "400 12px/1.4 var(--font-sans)", color: "var(--fg-3)", marginTop: 2 }}>{windowDescriptor}</div>
                {windowType === "lifelong" && (
                  <span className="badge badge-warning" style={{ marginTop: 8, gap: 4 }}>
                    <Icon name="alert-triangle" size={10}/> No expiry set
                  </span>
                )}
              </div>

              <span style={{ font: "600 11px/1.2 var(--font-sans)", color: "var(--fg-4)", letterSpacing: 0.6, textTransform: "uppercase" }}>Policy</span>
              <div>
                <div style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{policyMeta?.name}</div>
                <div style={{ font: "400 12px/1.4 var(--font-sans)", color: "var(--fg-3)", marginTop: 2 }}>{policyMeta?.note}</div>
              </div>

              <span style={{ font: "600 11px/1.2 var(--font-sans)", color: "var(--fg-4)", letterSpacing: 0.6, textTransform: "uppercase" }}>Credential</span>
              <div>
                <div style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{credMeta?.display || credMeta?.name}</div>
                <div style={{ font: "400 12px/1.4 var(--font-sans)", color: "var(--fg-3)", marginTop: 2 }}>{credMeta?.type || "Password"}</div>
              </div>

              {note && (<>
                <span style={{ font: "600 11px/1.2 var(--font-sans)", color: "var(--fg-4)", letterSpacing: 0.6, textTransform: "uppercase" }}>Note</span>
                <div style={{ font: "400 12.5px/1.5 var(--font-sans)", color: "var(--fg-1)" }}>{note}</div>
              </>)}
            </div>

            <div style={{ marginTop: 16, padding: 14, background: "var(--bg-surface-2)", borderRadius: 6, font: "400 12px/1.5 var(--font-sans)", color: "var(--fg-3)", display: "flex", gap: 10, alignItems: "flex-start" }}>
              <Icon name="info" size={14} color="var(--fg-4)"/>
              <div>
                Recipients will receive a notification with the mapped credential display name — the actual credential material is never exposed. Session recording, idle timeout, and MFA are inherited from the selected policy.
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ borderTop: "1px solid var(--border)", padding: "12px 24px", display: "flex", gap: 8, justifyContent: "flex-end", background: "var(--bg-surface)" }}>
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        {step === "configure"
          ? <button className="btn btn-primary" onClick={goReview}>
              Continue to review <Icon name="chevron-right" size={12} color="#fff"/>
            </button>
          : <button className="btn btn-primary" onClick={submit}>
              <Icon name="check" size={12} color="#fff"/> Confirm & allocate
            </button>}
      </div>
    </Panel>
  );
};

Object.assign(window, { ResourceAllocatePanelV3 });
