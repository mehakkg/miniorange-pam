// Audit — Evidence Bundles list + 6-step create flow + detail + progress

const EvidenceBundlesV2 = ({ onCreate, onOpen }) => {
  const bundles = window.EVIDENCE_BUNDLES || [];
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <h1 className="h-title">Evidence Bundles</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--fg-3)" }}>Compile audit-ready evidence packages for compliance, SOC, or legal teams.</p>
        </div>
        <button className="btn btn-primary" onClick={onCreate}><Icon name="plus" size={12}/> Create evidence bundle</button>
      </div>
      <div style={{ padding: "16px 24px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        <KPICard label="Total bundles" value={bundles.length}/>
        <KPICard label="Generated this month" value={bundles.filter(b => b.createdAgo.includes("day") || b.createdAgo === "Today" || b.createdAgo === "Yesterday").length}/>
        <KPICard label="Pending review" value={bundles.filter(b => b.status === "Draft").length} accent="var(--warning-fg)"/>
      </div>
      <div style={{ flex: 1, overflow: "auto" }}>
        {bundles.length === 0 ? (
          <EmptyState icon="shield-check" title="No evidence bundles yet" description="Create a bundle when you need to compile evidence for a compliance audit, security investigation, or regulatory submission." action={<button className="btn btn-primary" onClick={onCreate}><Icon name="plus" size={11}/> Create evidence bundle</button>}/>
        ) : (
          <table className="table">
            <thead><tr><th>Bundle name</th><th>Purpose</th><th>Period</th><th>Contents</th><th>Created by</th><th>Created</th><th>Status</th><th></th></tr></thead>
            <tbody>{bundles.map(b => (
              <tr key={b.id} onClick={() => onOpen(b)} style={{ cursor: "pointer" }}>
                <td><span style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--brand-fg)" }}>{b.name}</span></td>
                <td><PurposeBadge purpose={b.purpose}/></td>
                <td className="t-tiny" style={{ color: "var(--fg-3)" }}>{b.period}</td>
                <td style={{ font: "400 12px/1.4 var(--font-sans)", color: "var(--fg-2)" }}>{b.contents.reports} reports · {b.contents.sessions} sessions · {b.contents.credentials} creds</td>
                <td><div style={{ display: "flex", alignItems: "center", gap: 8 }}><Avatar name={b.createdBy} size={20}/><span style={{ fontSize: 12.5 }}>{b.createdBy}</span></div></td>
                <td className="t-tiny" style={{ color: "var(--fg-3)" }}>{b.createdAgo}</td>
                <td><BundleStatusBadge status={b.status}/></td>
                <td onClick={e => e.stopPropagation()} style={{ textAlign: "right" }}><RowMenu items={[
                  { label: "View", icon: "eye", onClick: () => onOpen(b) },
                  { label: "Export", icon: "download", onClick: () => {} },
                  { label: "Share", icon: "link", onClick: () => {} },
                  { label: "Duplicate", icon: "copy", onClick: () => {} },
                  { divider: true },
                  { label: "Delete", icon: "trash", danger: true, onClick: () => {} },
                ]}/></td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const PurposeBadge = ({ purpose }) => {
  const m = {
    "PCI Audit":             { fg: "var(--brand-fg)",  bg: "var(--brand-soft)" },
    "SOC2":                  { fg: "var(--success-fg)",bg: "var(--success-soft)" },
    "ISO27001":              { fg: "var(--warning-fg)",bg: "var(--warning-soft)" },
    "Incident Investigation":{ fg: "var(--danger-fg)", bg: "var(--danger-soft)" },
    "Break-glass Review":    { fg: "#7B3EA8",          bg: "color-mix(in oklch, #7B3EA8 14%, transparent)" },
    "Regulatory Submission": { fg: "var(--fg-2)",      bg: "var(--bg-surface-2)" },
    "Custom":                { fg: "var(--fg-3)",      bg: "var(--bg-surface-2)" },
  }[purpose] || { fg: "var(--fg-3)", bg: "var(--bg-surface-2)" };
  return <span style={{ padding: "2px 8px", borderRadius: 999, font: "500 11px/1.5 var(--font-sans)", background: m.bg, color: m.fg }}>{purpose}</span>;
};

const BundleStatusBadge = ({ status }) => {
  const m = {
    Draft:    { fg: "var(--warning-fg)", bg: "var(--warning-soft)" },
    Ready:    { fg: "var(--brand-fg)",   bg: "var(--brand-soft)" },
    Exported: { fg: "var(--success-fg)", bg: "var(--success-soft)" },
    Shared:   { fg: "var(--success-fg)", bg: "var(--success-soft)" },
  }[status] || { fg: "var(--fg-3)", bg: "var(--bg-surface-2)" };
  return <span style={{ padding: "2px 8px", borderRadius: 999, font: "500 11px/1.5 var(--font-sans)", background: m.bg, color: m.fg }}>{status}</span>;
};

// ===== CREATE FLOW =====
const EvidenceBundleCreate = ({ onClose, onGenerated }) => {
  const [step, setStep] = React.useState(1);
  const [phase, setPhase] = React.useState("idle"); // idle | generating | done
  const [data, setData] = React.useState({
    name: "Q2 2026 PCI DSS Audit Evidence",
    purpose: "PCI Audit",
    period: "Apr 1 – Jun 30, 2026",
    notes: "",
    reports: ["r-server-access","r-rotation","r-bg","r-approval","r-active-alloc"],
    sessions: ["ses-1001","ses-1002","ses-1005"],
    sessionFilters: { bg: true, riskOver60: true, flagged: false, critical: false },
    credentials: ["c-001","c-003"],
    accessEvents: { approved: true, rejected: true, allocChanges: true, revocations: false, specific: [] },
    format: "ZIP archive",
    coverPage: true,
    tamperSeal: true,
  });
  const set = (k, v) => setData(d => ({...d, [k]: v}));

  const titles = ["Purpose", "Reports", "Sessions", "Credentials", "Access Events", "Review"];

  if (phase === "generating") return <BundleGenerating onCancel={() => setPhase("idle")} onDone={() => setPhase("done")}/>;
  if (phase === "done") return <BundleReady data={data} onClose={onClose}/>;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ font: "400 12px/1 var(--font-sans)", color: "var(--fg-4)", marginBottom: 6 }}>
          <a href="#" onClick={e => { e.preventDefault(); onClose(); }} style={{ color: "var(--brand-fg)" }}>Evidence Bundles</a> <Icon name="chevron-right" size={10}/> Create Bundle
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <h1 className="h-title">Create Evidence Bundle</h1>
            <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center" }}>
              {titles.map((t, i) => {
                const done = step > i + 1, active = step === i + 1;
                return <React.Fragment key={t}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: done ? "var(--success)" : active ? "var(--brand)" : "var(--bg-surface-2)", color: done || active ? "#fff" : "var(--fg-3)", display: "flex", alignItems: "center", justifyContent: "center", font: "600 11px/1 var(--font-sans)", border: !done && !active ? "1px solid var(--border)" : "none" }}>{done ? <Icon name="check" size={11} color="#fff"/> : i + 1}</div>
                    <span style={{ font: `${active ? 600 : 500} 12px/1 var(--font-sans)`, color: active ? "var(--fg-1)" : done ? "var(--fg-2)" : "var(--fg-4)" }}>{t}</span>
                  </div>
                  {i < titles.length - 1 && <div style={{ width: 24, height: 1, background: done ? "var(--success)" : "var(--border)" }}/>}
                </React.Fragment>;
              })}
            </div>
          </div>
          <button className="btn">Save draft</button>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        </div>
      </div>

      <div className="scroll-area" style={{ flex: 1, overflow: "auto", padding: 24 }}>
        {step === 1 && <Step1Purpose data={data} set={set}/>}
        {step === 2 && <Step2Reports data={data} set={set}/>}
        {step === 3 && <Step3Sessions data={data} set={set}/>}
        {step === 4 && <Step4Credentials data={data} set={set}/>}
        {step === 5 && <Step5AccessEvents data={data} set={set}/>}
        {step === 6 && <Step6Review data={data} set={set}/>}
      </div>

      <div style={{ padding: "12px 24px", borderTop: "1px solid var(--border)", display: "flex", gap: 8, background: "var(--bg-surface)" }}>
        {step > 1 && <button className="btn" onClick={() => setStep(step - 1)}>← Back</button>}
        <div style={{ flex: 1 }}/>
        {step < 6 && <button className="btn btn-primary" onClick={() => setStep(step + 1)}>Next: {titles[step]} →</button>}
        {step === 6 && <button className="btn btn-primary" style={{ background: "var(--success)", borderColor: "var(--success)" }} onClick={() => setPhase("generating")}><Icon name="shield-check" size={11}/> Generate bundle</button>}
      </div>
    </div>
  );
};

const Step1Purpose = ({ data, set }) => (
  <div style={{ maxWidth: 720, margin: "0 auto" }}>
    <h2 style={{ font: "600 17px/1.3 var(--font-sans)", color: "var(--fg-1)", margin: "0 0 18px" }}>What is this evidence for?</h2>
    <Field label="Bundle name" required hint="A clear name — e.g. 'Q2 2026 PCI DSS Audit Evidence' or 'Incident #2847 Investigation'">
      <input className="input" value={data.name} onChange={e => set("name", e.target.value)}/>
    </Field>
    <Field label="Purpose" required>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {["PCI Audit","SOC2","ISO27001","Incident Investigation","Break-glass Review","Regulatory Submission","Custom"].map(p => {
          const active = data.purpose === p;
          return <button key={p} onClick={() => set("purpose", p)} style={{
            padding: 14, border: `1px solid ${active ? "var(--brand)" : "var(--border)"}`,
            background: active ? "var(--brand-soft)" : "var(--bg-surface)",
            borderRadius: 8, cursor: "pointer", textAlign: "left",
          }}>
            <div style={{ font: "600 13px/1.3 var(--font-sans)", color: active ? "var(--brand-fg)" : "var(--fg-1)" }}>{p}</div>
            <div style={{ font: "400 11.5px/1.4 var(--font-sans)", color: "var(--fg-3)", marginTop: 4 }}>
              {p === "PCI Audit" ? "Evidence for PCI DSS privileged access controls audit" :
               p === "SOC2" ? "Trust service criteria evidence package" :
               p === "ISO27001" ? "Access management and audit logging controls" :
               p === "Incident Investigation" ? "Forensic evidence for a specific security incident" :
               p === "Break-glass Review" ? "Post-emergency access review and evidence" :
               p === "Regulatory Submission" ? "Evidence for external regulator or auditor" :
               "Define your own scope and contents"}
            </div>
          </button>;
        })}
      </div>
    </Field>
    <Field label="Audit period" required hint="All included data will be filtered to this range."><input className="input" value={data.period} onChange={e => set("period", e.target.value)}/></Field>
    <Field label="Notes / context" hint="Describe the audit, investigation, or submission. Appears on the bundle cover page."><textarea className="input" rows={3} value={data.notes} onChange={e => set("notes", e.target.value)}/></Field>
  </div>
);

const Step2Reports = ({ data, set }) => {
  const [cat, setCat] = React.useState("all");
  const reports = window.REPORTS || [];
  const rows = cat === "all" ? reports : reports.filter(r => r.category === cat);
  const toggle = (id) => set("reports", data.reports.includes(id) ? data.reports.filter(x => x !== id) : [...data.reports, id]);
  return (
    <div style={{ maxWidth: 880, margin: "0 auto" }}>
      <h2 style={{ font: "600 17px/1.3 var(--font-sans)", color: "var(--fg-1)", margin: "0 0 6px" }}>Which reports to include?</h2>
      <p style={{ font: "400 13px/1.5 var(--font-sans)", color: "var(--fg-3)", margin: "0 0 16px" }}>Reports will be regenerated for the audit period.</p>
      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
        {(window.REPORT_CATEGORIES || []).filter(c => c.id !== "custom").map(c => (
          <button key={c.id} onClick={() => setCat(c.id)} style={{ padding: "4px 12px", borderRadius: 999, border: "none", background: cat === c.id ? "var(--brand-soft)" : "var(--bg-surface-2)", color: cat === c.id ? "var(--brand-fg)" : "var(--fg-3)", font: `${cat === c.id ? 600 : 500} 12px/1 var(--font-sans)`, cursor: "pointer" }}>{c.label}</button>
        ))}
      </div>
      <div className="card">
        {rows.map(r => (
          <label key={r.id} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 16px", borderBottom: "1px solid var(--border-subtle)", cursor: "pointer" }}>
            <input type="checkbox" checked={data.reports.includes(r.id)} onChange={() => toggle(r.id)} style={{ accentColor: "var(--brand)", marginTop: 2 }}/>
            <div style={{ flex: 1 }}>
              <div style={{ font: "600 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{r.name}</div>
              <div style={{ font: "400 12px/1.5 var(--font-sans)", color: "var(--fg-3)" }}>{r.desc}</div>
              <div className="t-tiny" style={{ color: "var(--fg-4)", marginTop: 2 }}>Last run: {r.lastRun}</div>
            </div>
            <a href="#" style={{ font: "500 12px/1 var(--font-sans)", color: "var(--brand-fg)", padding: "4px 0" }}>Preview</a>
          </label>
        ))}
      </div>
      <div style={{ marginTop: 10, font: "500 12.5px/1 var(--font-sans)", color: "var(--brand-fg)" }}>{data.reports.length} reports selected</div>
    </div>
  );
};

const Step3Sessions = ({ data, set }) => {
  const sessions = window.AUDIT_RECORDED_SESSIONS || [];
  const toggleSession = (id) => set("sessions", data.sessions.includes(id) ? data.sessions.filter(x => x !== id) : [...data.sessions, id]);
  const setFilter = (k, v) => set("sessionFilters", {...data.sessionFilters, [k]: v});
  return (
    <div style={{ maxWidth: 880, margin: "0 auto" }}>
      <h2 style={{ font: "600 17px/1.3 var(--font-sans)", color: "var(--fg-1)", margin: "0 0 16px" }}>Which session recordings to include?</h2>

      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ font: "600 11px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10 }}>Auto-include by criteria</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Toggle value={data.sessionFilters.bg} onChange={v => setFilter("bg", v)} label="All break-glass sessions in the audit period"/>
          <Toggle value={data.sessionFilters.riskOver60} onChange={v => setFilter("riskOver60", v)} label="Sessions with risk score > 60"/>
          <Toggle value={data.sessionFilters.flagged} onChange={v => setFilter("flagged", v)} label="Sessions flagged for review"/>
          <Toggle value={data.sessionFilters.critical} onChange={v => setFilter("critical", v)} label="Sessions on Critical resources"/>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><span className="h-card">Manual selection</span></div>
        <table className="table">
          <thead><tr><th></th><th>User</th><th>Resource</th><th>Date</th><th>Duration</th><th>Risk</th><th>Recording</th></tr></thead>
          <tbody>{sessions.map(s => (
            <tr key={s.id}>
              <td><input type="checkbox" checked={data.sessions.includes(s.id)} onChange={() => toggleSession(s.id)} style={{ accentColor: "var(--brand)" }}/></td>
              <td><div style={{ display: "flex", alignItems: "center", gap: 8 }}><Avatar name={s.user} size={20}/><span style={{ fontSize: 12.5 }}>{s.user}</span></div></td>
              <td className="t-mono" style={{ fontSize: 12, color: "var(--brand-fg)" }}>{s.resource}</td>
              <td className="t-tiny" style={{ color: "var(--fg-3)" }}>{s.started}</td>
              <td className="t-mono" style={{ fontSize: 12, color: "var(--fg-2)" }}>{s.duration}</td>
              <td><RiskScore score={s.riskScore}/></td>
              <td><RecordingBadge status={s.recording}/></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <div style={{ marginTop: 10, font: "500 12.5px/1 var(--font-sans)", color: "var(--brand-fg)" }}>{data.sessions.length} sessions selected (1.4 GB)</div>
    </div>
  );
};

const Step4Credentials = ({ data, set }) => {
  const creds = window.CREDS || [];
  const toggle = (id) => set("credentials", data.credentials.includes(id) ? data.credentials.filter(x => x !== id) : [...data.credentials, id]);
  return (
    <div style={{ maxWidth: 880, margin: "0 auto" }}>
      <h2 style={{ font: "600 17px/1.3 var(--font-sans)", color: "var(--fg-1)", margin: "0 0 6px" }}>Which credential audit events to include?</h2>
      <p style={{ font: "400 13px/1.5 var(--font-sans)", color: "var(--fg-3)", margin: "0 0 16px" }}>Include rotation logs, drift events, and reconciliation history for key credentials.</p>
      <div className="card">
        <table className="table">
          <thead><tr><th></th><th>Credential</th><th>Type</th><th>Rotation status</th><th>Last rotated</th><th>Issues</th></tr></thead>
          <tbody>{creds.slice(0, 8).map(c => (
            <tr key={c.id}>
              <td><input type="checkbox" checked={data.credentials.includes(c.id)} onChange={() => toggle(c.id)} style={{ accentColor: "var(--brand)" }}/></td>
              <td><span style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--brand-fg)" }}>{c.display}</span></td>
              <td><CRED_TYPE_BADGE type={c.type}/></td>
              <td><span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><RotationDot status={c.rotation}/>{c.rotation}</span></td>
              <td className="t-tiny" style={{ color: "var(--fg-3)" }}>{c.lastRotated}</td>
              <td className="t-tiny" style={{ color: c.rotation === "failed" || c.rotation === "drifted" ? "var(--danger-fg)" : "var(--fg-4)" }}>{c.rotation === "failed" ? "Failure" : c.rotation === "drifted" ? "Drift" : "—"}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
};

const Step5AccessEvents = ({ data, set }) => {
  const setF = (k, v) => set("accessEvents", {...data.accessEvents, [k]: v});
  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <h2 style={{ font: "600 17px/1.3 var(--font-sans)", color: "var(--fg-1)", margin: "0 0 16px" }}>Which access approval and allocation events to include?</h2>
      <div className="card" style={{ padding: 16, marginBottom: 12 }}>
        <div style={{ font: "600 11px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10 }}>Tickets & approvals</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Toggle value={data.accessEvents.approved} onChange={v => setF("approved", v)} label="All approved tickets in period"/>
          <Toggle value={data.accessEvents.rejected} onChange={v => setF("rejected", v)} label="All rejected tickets in period"/>
        </div>
      </div>
      <div className="card" style={{ padding: 16 }}>
        <div style={{ font: "600 11px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10 }}>Allocation events</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Toggle value={data.accessEvents.allocChanges} onChange={v => setF("allocChanges", v)} label="All allocation changes in period"/>
          <Toggle value={data.accessEvents.revocations} onChange={v => setF("revocations", v)} label="Revocation events"/>
        </div>
      </div>
    </div>
  );
};

const Step6Review = ({ data, set }) => (
  <div style={{ maxWidth: 720, margin: "0 auto" }}>
    <h2 style={{ font: "600 17px/1.3 var(--font-sans)", color: "var(--fg-1)", margin: "0 0 16px" }}>Review your evidence bundle</h2>
    <div className="card" style={{ padding: 18, marginBottom: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 8, font: "400 13px/1.5 var(--font-sans)" }}>
        <span style={{ color: "var(--fg-4)" }}>Name</span><span style={{ color: "var(--fg-1)", fontWeight: 600 }}>{data.name}</span>
        <span style={{ color: "var(--fg-4)" }}>Purpose</span><span><PurposeBadge purpose={data.purpose}/></span>
        <span style={{ color: "var(--fg-4)" }}>Period</span><span style={{ color: "var(--fg-1)" }}>{data.period}</span>
      </div>
      <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
        <div style={{ font: "600 11px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10 }}>Contents</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, font: "500 12.5px/1.5 var(--font-sans)", color: "var(--fg-2)" }}>
          <div><Icon name="check" size={12} color="var(--success-fg)"/> {data.reports.length} reports</div>
          <div><Icon name="check" size={12} color="var(--success-fg)"/> {data.sessions.length} session recordings — 1.4 GB</div>
          <div><Icon name="check" size={12} color="var(--success-fg)"/> {data.credentials.length} credentials with audit trails</div>
          <div><Icon name="check" size={12} color="var(--success-fg)"/> 34 access approval events</div>
          <div><Icon name="check" size={12} color="var(--success-fg)"/> 12 allocation change events</div>
        </div>
      </div>
    </div>

    <div className="card" style={{ padding: 18, marginBottom: 14 }}>
      <div style={{ font: "600 11px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 12 }}>Export format</div>
      <Field label="Format" required>
        <Segmented value={data.format} onChange={v => set("format", v)} options={[{value:"ZIP archive",label:"ZIP archive"},{value:"PDF report",label:"PDF report"},{value:"Both",label:"Both"}]}/>
      </Field>
      <div style={{ marginTop: 8, font: "400 12px/1.5 var(--font-sans)", color: "var(--fg-3)" }}>
        ZIP: reports (CSV) + sessions (MP4) + metadata (JSON) + cover page (PDF) <br/>
        PDF: cover page + summary stats + report tables + session metadata (no video)
      </div>
    </div>

    <div className="card" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
      <Toggle value={data.coverPage} onChange={v => set("coverPage", v)} label="Add cover page" hint="Includes name, purpose, audit period, generated by, generated on, PAM version, contents summary"/>
      <Toggle value={data.tamperSeal} onChange={v => set("tamperSeal", v)} label="Tamper-evident seal" hint="Include SHA-256 hash of all bundle contents. Recipient can verify no content was modified after generation."/>
    </div>
  </div>
);

const BundleGenerating = ({ onCancel, onDone }) => {
  const [step, setStep] = React.useState(0);
  const steps = [
    "Gathering report data",
    "Regenerating reports for audit period",
    "Packaging session recordings",
    "Compiling credential audit trails",
    "Building cover page and contents index",
    "Generating tamper-evident hash",
  ];
  React.useEffect(() => {
    const iv = setInterval(() => setStep(s => s < steps.length ? s + 1 : (clearInterval(iv), onDone(), s)), 700);
    return () => clearInterval(iv);
  }, []);
  return (
    <div style={{ flex: 1, padding: 48, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
      <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--brand-soft)", color: "var(--brand-fg)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}><Icon name="shield-check" size={24}/></div>
      <h2 style={{ font: "600 18px/1.3 var(--font-sans)", color: "var(--fg-1)", margin: 0 }}>Generating evidence bundle…</h2>
      <p style={{ font: "400 12.5px/1.5 var(--font-sans)", color: "var(--fg-3)", margin: "8px 0 24px" }}>This may take a few minutes. You can navigate away — we'll notify you when ready.</p>
      <div style={{ width: 460, display: "flex", flexDirection: "column", gap: 10, textAlign: "left" }}>
        {steps.map((s, i) => {
          const done = step > i, active = step === i;
          return (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 10, font: "500 13px/1.4 var(--font-sans)", color: done ? "var(--success-fg)" : active ? "var(--fg-1)" : "var(--fg-4)" }}>
              <span style={{ width: 16, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{done ? "✓" : active ? <Spinner size={12}/> : "○"}</span>
              {s}{active && i === 2 && <span style={{ color: "var(--fg-4)", marginLeft: 6 }}>(8 of 12 sessions packaged)</span>}
            </div>
          );
        })}
      </div>
      <a href="#" onClick={e => { e.preventDefault(); onCancel(); }} style={{ marginTop: 24, font: "500 12.5px/1 var(--font-sans)", color: "var(--fg-3)" }}>Cancel generation</a>
    </div>
  );
};

const BundleReady = ({ data, onClose }) => (
  <div style={{ flex: 1, padding: 48, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", overflow: "auto" }}>
    <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--success-soft)", color: "var(--success-fg)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}><Icon name="check" size={30}/></div>
    <h1 style={{ font: "600 22px/1.2 var(--font-sans)", color: "var(--fg-1)", margin: 0 }}>Evidence bundle ready</h1>
    <p style={{ font: "400 13px/1.5 var(--font-sans)", color: "var(--fg-3)", marginTop: 6 }}>{data.name} · {data.period} · 2.4 GB</p>

    <div className="card" style={{ padding: 16, marginTop: 20, width: 480, textAlign: "left" }}>
      <div style={{ font: "500 12.5px/1.5 var(--font-sans)", color: "var(--fg-2)", marginBottom: 10 }}>{data.reports.length} reports · {data.sessions.length} sessions · {data.credentials.length} credentials · 46 access events</div>
      <div style={{ marginTop: 10, padding: 10, background: "var(--bg-surface-2)", borderRadius: 4 }}>
        <div style={{ font: "500 11px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>SHA-256 hash</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span className="t-mono" style={{ font: "500 11px/1.4 var(--font-mono)", color: "var(--fg-2)", wordBreak: "break-all" }}>7B:8E:5F:CC:21:9A:3D:8E:1F:2A:4B:5C:6D:7E:8F:91:AC:BD:CE:DF…</span>
          <button className="btn btn-ghost btn-icon btn-sm"><Icon name="copy" size={11}/></button>
        </div>
      </div>
      <div className="t-tiny" style={{ color: "var(--fg-4)", marginTop: 10 }}>Generated: Today 14:02 by Arjun Bansal</div>
    </div>

    <div style={{ marginTop: 22, display: "flex", gap: 8 }}>
      <button className="btn btn-primary btn-lg"><Icon name="download" size={13}/> Download ZIP</button>
      <button className="btn btn-lg">Download PDF report</button>
    </div>
    <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
      <button className="btn btn-sm"><Icon name="link" size={11}/> Share via link</button>
      <button className="btn btn-sm"><Icon name="send" size={11}/> Send via email</button>
      <button className="btn btn-sm"><Icon name="external" size={11}/> Export to SIEM</button>
    </div>
    <button className="btn btn-ghost" style={{ marginTop: 18 }} onClick={onClose}>View bundle record →</button>
  </div>
);

// ===== EVIDENCE BUNDLE DETAIL =====
const EvidenceBundleDetail = ({ bundle, onClose }) => (
  <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
    <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)" }}>
      <div style={{ font: "400 12px/1 var(--font-sans)", color: "var(--fg-4)", marginBottom: 6 }}>
        <a href="#" onClick={e => { e.preventDefault(); onClose(); }} style={{ color: "var(--brand-fg)" }}>Evidence Bundles</a> <Icon name="chevron-right" size={10}/> {bundle.name}
      </div>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <h1 className="h-title">{bundle.name}</h1>
          <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
            <BundleStatusBadge status={bundle.status}/>
            <PurposeBadge purpose={bundle.purpose}/>
            <span className="badge">{bundle.period}</span>
          </div>
        </div>
        <button className="btn"><Icon name="download" size={11}/> Download ▾</button>
        <button className="btn"><Icon name="link" size={11}/> Share</button>
        <button className="btn"><Icon name="refresh" size={11}/> Regenerate</button>
        <RowMenu items={[{ label: "Duplicate", icon: "copy", onClick: () => {} }, { divider: true }, { label: "Delete", icon: "trash", danger: true, onClick: () => {} }]}/>
      </div>
    </div>

    <div style={{ flex: 1, display: "grid", gridTemplateColumns: "240px 1fr 240px", overflow: "hidden" }}>
      {/* Contents tree */}
      <div style={{ borderRight: "1px solid var(--border)", padding: 14, overflow: "auto" }}>
        <div style={{ font: "600 11px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10 }}>Contents</div>
        <FileNode icon="📁" label="Evidence Bundle"/>
        <FileNode indent={1} icon="📄" label="Cover page.pdf"/>
        <FileNode indent={1} icon="📁" label={`Reports (${bundle.contents.reports})`}/>
        <FileNode indent={2} icon="📄" label="Server Access Report.csv"/>
        <FileNode indent={2} icon="📄" label="Rotation Report.csv"/>
        <FileNode indent={2} icon="📄" label="Break-Glass Events.csv"/>
        <FileNode indent={1} icon="📁" label={`Sessions (${bundle.contents.sessions})`}/>
        <FileNode indent={2} icon="🎥" label="session-001-priya-iyer.mp4"/>
        <FileNode indent={2} icon="📄" label="session-001-metadata.json"/>
        <FileNode indent={1} icon="📁" label={`Credentials (${bundle.contents.credentials})`}/>
        <FileNode indent={2} icon="📄" label="prod-db-root-audit.csv"/>
        <FileNode indent={1} icon="📄" label="contents-index.json"/>
        <FileNode indent={1} icon="📄" label="HASH-SHA256.txt"/>
      </div>

      {/* Cover page preview */}
      <div className="scroll-area" style={{ overflow: "auto", padding: 24, background: "var(--bg-surface)" }}>
        <div className="card" style={{ padding: 28, maxWidth: 600, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ font: "500 12px/1 var(--font-sans)", color: "var(--fg-3)", letterSpacing: 0.6, textTransform: "uppercase" }}>SecureCorp Pvt Ltd</div>
            <h2 style={{ font: "600 20px/1.3 var(--font-sans)", color: "var(--fg-1)", marginTop: 14 }}>{bundle.name}</h2>
            <PurposeBadge purpose={bundle.purpose}/>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 8, padding: "14px 0", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", font: "400 13px/1.6 var(--font-sans)" }}>
            <span style={{ color: "var(--fg-4)" }}>Audit period</span><span>{bundle.period}</span>
            <span style={{ color: "var(--fg-4)" }}>Prepared by</span><span>{bundle.createdBy}</span>
            <span style={{ color: "var(--fg-4)" }}>Generated</span><span>{bundle.createdAgo}</span>
            <span style={{ color: "var(--fg-4)" }}>PAM version</span><span>v2.4.1</span>
          </div>
          <div style={{ marginTop: 18 }}>
            <div style={{ font: "600 11px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10 }}>Contents summary</div>
            <table className="table">
              <tbody>
                <tr><td>Reports</td><td>{bundle.contents.reports}</td></tr>
                <tr><td>Sessions</td><td>{bundle.contents.sessions}</td></tr>
                <tr><td>Credentials</td><td>{bundle.contents.credentials}</td></tr>
                <tr><td>Access events</td><td>{bundle.contents.accessEvents}</td></tr>
              </tbody>
            </table>
          </div>
          {bundle.hash && <div style={{ marginTop: 18, padding: 10, background: "var(--bg-surface-2)", borderRadius: 4 }}>
            <div style={{ font: "500 11px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>SHA-256 hash</div>
            <div className="t-mono" style={{ font: "500 11px/1.5 var(--font-mono)", color: "var(--fg-2)", wordBreak: "break-all" }}>{bundle.hash}</div>
          </div>}
        </div>

        <div style={{ marginTop: 18 }}>
          <div style={{ font: "600 11px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10 }}>Activity log</div>
          {[
            { ts: bundle.createdAgo, txt: `Bundle created by ${bundle.createdBy}` },
            { ts: "1 day ago", txt: "Downloaded by Mohak Sharma" },
            { ts: "Today", txt: "Shared with audit@deloitte.com via link (expires May 22, 2026)" },
            { ts: "Today 14:02", txt: "Link accessed by 203.0.113.42" },
          ].map((a, i) => (
            <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--border-subtle)", font: "400 12.5px/1.4 var(--font-sans)" }}>
              <span className="t-tiny" style={{ color: "var(--fg-4)", width: 100 }}>{a.ts}</span>
              <span style={{ color: "var(--fg-2)", flex: 1 }}>{a.txt}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Share & integrity */}
      <div style={{ borderLeft: "1px solid var(--border)", padding: 16, overflow: "auto" }}>
        <div style={{ font: "600 11px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10 }}>Tamper seal</div>
        {bundle.hash ? <>
          <div style={{ font: "500 11px/1.4 var(--font-mono)", color: "var(--fg-2)", wordBreak: "break-all", marginBottom: 8 }}>{bundle.hash.slice(0, 47)}…</div>
          <button className="btn btn-sm" style={{ width: "100%" }}><Icon name="shield-check" size={11}/> Verify integrity</button>
        </> : <div style={{ font: "400 12px/1.5 var(--font-sans)", color: "var(--fg-4)" }}>Hash will be generated when the bundle is finalized.</div>}

        <div style={{ marginTop: 22, font: "600 11px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10 }}>Shared with</div>
        <div style={{ font: "400 12.5px/1.5 var(--font-sans)", color: "var(--fg-2)", marginBottom: 4 }}>audit@deloitte.com</div>
        <div className="t-tiny" style={{ color: "var(--fg-4)" }}>Via link · Expires May 22, 2026</div>
        <a href="#" style={{ display: "inline-block", marginTop: 10, font: "500 12px/1 var(--font-sans)", color: "var(--brand-fg)" }}>+ Add recipient</a>
      </div>
    </div>
  </div>
);

const FileNode = ({ icon, label, indent = 0 }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 0", paddingLeft: indent * 14, cursor: "pointer", font: "500 12px/1.4 var(--font-sans)", color: "var(--fg-2)" }}>
    <span>{icon}</span> <span>{label}</span>
  </div>
);

Object.assign(window, { EvidenceBundlesV2, EvidenceBundleCreate, EvidenceBundleDetail });
