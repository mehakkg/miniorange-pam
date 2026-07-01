// Audit — Session detail panel + Full-screen player + Scheduled Reports + Evidence Bundles

// =========================================================
// SESSION DETAIL PANEL
// =========================================================
const SessionDetailPanel = ({ session, onClose, onPlay }) => {
  if (!session) return null;
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.18)", zIndex: 40 }}/>
      <aside style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 520, background: "var(--bg-app)", borderLeft: "1px solid var(--border)", zIndex: 41, display: "flex", flexDirection: "column", boxShadow: "var(--shadow-lg)" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ font: "500 11px/1 var(--font-mono)", color: "var(--fg-4)" }}>{session.id}</div>
            <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
              <SessionTypeBadge type={session.sessionType}/>
              <RecordingBadge status={session.recording}/>
              {session.breakGlass && <span style={{ padding: "2px 8px", borderRadius: 999, background: "color-mix(in oklch, #7B3EA8 14%, transparent)", color: "#7B3EA8", font: "500 11px/1.5 var(--font-sans)" }}>⚑ Break-glass</span>}
              <RiskScore score={session.riskScore}/>
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><Icon name="x" size={14}/></button>
        </div>

        <div className="scroll-area" style={{ flex: 1, overflow: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 22 }}>
          <SessSection title="Session metadata">
            <SessRow k="User"><div style={{ display: "flex", alignItems: "center", gap: 8 }}><Avatar name={session.user} size={22}/><div><div style={{ fontWeight: 500 }}>{session.user}</div><div className="t-tiny" style={{ color: "var(--fg-4)" }}>{session.role}</div></div></div></SessRow>
            <SessRow k="Resource"><span className="t-mono" style={{ color: "var(--brand-fg)", fontWeight: 500 }}>{session.resource}</span> — <span className="t-mono t-tiny" style={{ color: "var(--fg-3)" }}>{session.resourceIP}</span></SessRow>
            <SessRow k="Credential"><span className="t-mono" style={{ color: "var(--fg-2)" }}>{session.credential}</span></SessRow>
            <SessRow k="Session type">{session.sessionType}</SessRow>
            <SessRow k="Connect method">{session.connectMethod}</SessRow>
            <SessRow k="Started">{session.started}</SessRow>
            <SessRow k="Ended">{session.ended}</SessRow>
            <SessRow k="Duration"><span className="t-mono">{session.duration}</span></SessRow>
            <SessRow k="User IP"><span className="t-mono">{session.userIP}</span></SessRow>
            <SessRow k="MFA verified">{session.mfa ? <span style={{ color: "var(--success-fg)" }}>✓ Yes</span> : <span style={{ color: "var(--danger-fg)" }}>✗ No</span>}</SessRow>
            <SessRow k="Ticket">{session.ticket ? <a href="#" style={{ color: "var(--brand-fg)" }}>{session.ticket}</a> : <span style={{ color: "var(--fg-4)" }}>No ticket (direct allocation)</span>}</SessRow>
            <SessRow k="Break-glass">{session.breakGlass ? <span style={{ color: "#7B3EA8", fontWeight: 600 }}>Yes — <a href="#" style={{ color: "#7B3EA8", textDecoration: "underline" }}>view event record</a></span> : "No"}</SessRow>
          </SessSection>

          {session.risks.length > 0 && (
            <SessSection title="Risk signals">
              <div style={{ padding: 12, background: session.riskScore > 85 ? "var(--danger-soft)" : "var(--warning-soft)", borderRadius: 6 }}>
                <div style={{ font: "600 13px/1.3 var(--font-sans)", color: session.riskScore > 85 ? "var(--danger-fg)" : "var(--warning-fg)", marginBottom: 8 }}>Risk score {session.riskScore} — {RISK(session.riskScore).level}</div>
                <ul style={{ margin: 0, paddingLeft: 18, font: "400 12.5px/1.6 var(--font-sans)", color: "var(--fg-2)" }}>
                  {session.risks.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>
            </SessSection>
          )}

          <SessSection title="Command summary">
            <table className="table" style={{ border: "1px solid var(--border)", borderRadius: 6 }}>
              <thead><tr><th>Command</th><th>Count</th><th>First seen</th></tr></thead>
              <tbody>{session.topCommands.slice(0, 10).map((c, i) => (
                <tr key={i}>
                  <td className="t-mono" style={{ fontSize: 12, color: c.cmd.includes("rm -rf") ? "var(--danger-fg)" : "var(--fg-2)" }}>{c.cmd}</td>
                  <td style={{ color: "var(--fg-2)" }}>{c.count}</td>
                  <td className="t-mono t-tiny" style={{ color: "var(--fg-3)" }}>{c.ts}</td>
                </tr>
              ))}</tbody>
            </table>
            <a href="#" style={{ font: "500 12.5px/1 var(--font-sans)", color: "var(--brand-fg)" }}>View full command log →</a>
          </SessSection>
        </div>

        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, background: "var(--bg-surface)" }}>
          <button className="btn btn-primary" onClick={() => onPlay(session)}><Icon name="play" size={11}/> Play recording</button>
          <button className="btn">Export recording ▾</button>
          <button className="btn">Export metadata</button>
          <button className="btn">Export keystroke log</button>
          <button className="btn">Add to evidence bundle</button>
          <button className="btn btn-ghost" style={{ color: "var(--warning-fg)" }}>Flag session</button>
        </div>
      </aside>
    </>
  );
};

const SessSection = ({ title, children }) => (
  <div>
    <div style={{ font: "600 10.5px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 10 }}>{title}</div>
    {children}
  </div>
);
const SessRow = ({ k, children }) => (
  <div style={{ display: "grid", gridTemplateColumns: "130px 1fr", gap: 12, padding: "5px 0", alignItems: "center", font: "400 12.5px/1.5 var(--font-sans)" }}>
    <span style={{ color: "var(--fg-4)" }}>{k}</span><span style={{ color: "var(--fg-1)" }}>{children}</span>
  </div>
);

// =========================================================
// FULL-SCREEN PLAYER
// =========================================================
const SessionPlayer = ({ session, onClose }) => {
  const [t, setT] = React.useState(45); // seconds into 12-min session
  const [speed, setSpeed] = React.useState(1);
  const [playing, setPlaying] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const duration = 12 * 60 + 4; // 12:04

  // Event markers along the scrubber
  const markers = [
    { t: 8,   type: "command", text: "sudo -i" },
    { t: 92,  type: "command", text: "psql -U postgres" },
    { t: 215, type: "risk",    text: "rm -rf /var/log/audit" },
    { t: 360, type: "command", text: "systemctl restart auth-svc" },
    { t: 580, type: "risk",    text: "Long idle" },
  ];

  return (
    <div style={{ position: "fixed", inset: 0, background: "var(--bg-app)", zIndex: 100, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 14, font: "500 13px/1 var(--font-sans)" }}>
          <Avatar name={session.user} size={26}/>
          <span style={{ color: "var(--fg-1)", fontWeight: 600 }}>{session.user}</span>
          <Icon name="chevron-right" size={11} color="var(--fg-4)"/>
          <span className="t-mono" style={{ color: "var(--brand-fg)" }}>{session.resource}</span>
          <span style={{ color: "var(--fg-4)" }}>|</span>
          <span className="t-tiny" style={{ color: "var(--fg-3)" }}>{session.started} · {session.duration}</span>
          <RiskScore score={session.riskScore}/>
        </div>
        <button className="btn btn-sm">Export ▾</button>
        <button className="btn btn-sm">Add to evidence</button>
        <button className="btn btn-sm" style={{ color: "var(--warning-fg)" }}>Flag</button>
        <button className="btn btn-ghost btn-icon" onClick={onClose}><Icon name="x" size={14}/></button>
      </div>

      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "minmax(0, 70%) 30%", overflow: "hidden" }}>
        {/* Video area */}
        <div style={{ background: "#0a0b0d", display: "flex", flexDirection: "column" }}>
          <div style={{ flex: 1, background: "#0a0b0d", padding: 24, color: "#c8ccd2", font: "13px/1.5 var(--font-mono)", overflow: "auto" }}>
            <div style={{ color: "#5cb85c" }}>[priya@prod-db-primary ~]$ <span style={{ color: "#fff" }}>sudo -i</span></div>
            <div style={{ color: "#aaa" }}>[sudo] password for priya: ********</div>
            <div style={{ color: "#5cb85c", marginTop: 6 }}>[root@prod-db-primary ~]# <span style={{ color: "#fff" }}>psql -U postgres -d ledger</span></div>
            <div style={{ color: "#aaa" }}>psql (15.4)</div>
            <div style={{ color: "#aaa" }}>Type "help" for help.</div>
            <div style={{ color: "#5cb85c", marginTop: 6 }}>ledger=# <span style={{ color: "#fff" }}>SELECT count(*) FROM transactions WHERE created_at &gt; NOW() - INTERVAL '1 day';</span></div>
            <div style={{ color: "#aaa" }}> count</div>
            <div style={{ color: "#aaa" }}>-------</div>
            <div style={{ color: "#aaa" }}>  47812</div>
            <div style={{ color: "#aaa" }}>(1 row)</div>
            <div style={{ color: "#5cb85c", marginTop: 6 }}>ledger=# <span style={{ color: "#fff" }}>\q</span></div>
            <div style={{ color: "#5cb85c", marginTop: 6 }}>[root@prod-db-primary ~]# <span style={{ color: "#f87171", background: "color-mix(in oklch, #f87171 18%, transparent)", padding: "0 4px" }}>rm -rf /var/log/audit</span></div>
            <div style={{ color: "#aaa" }}>rm: cannot remove '/var/log/audit': Permission denied</div>
            <div style={{ color: "#5cb85c", marginTop: 6 }}>[root@prod-db-primary ~]# <span style={{ color: "#fff" }}>tail -f /var/log/postgres.log</span></div>
          </div>

          {/* Controls + scrubber */}
          <div style={{ padding: "10px 16px 14px", background: "#131519", borderTop: "1px solid #23252a" }}>
            <div style={{ position: "relative", height: 6, background: "#28282c", borderRadius: 3, marginBottom: 10 }}>
              <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${(t/duration)*100}%`, background: "var(--brand)", borderRadius: 3 }}/>
              {markers.map((m, i) => (
                <div key={i} title={m.text} style={{ position: "absolute", left: `${(m.t/duration)*100}%`, top: -3, width: 12, height: 12, marginLeft: -6, borderRadius: "50%", background: m.type === "risk" ? "var(--danger-fg)" : "var(--success-fg)", cursor: "pointer" }}/>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#c8ccd2", font: "500 12.5px/1 var(--font-sans)" }}>
              <button onClick={() => setPlaying(p => !p)} style={{ background: "transparent", border: "none", color: "#fff", cursor: "pointer" }}><Icon name={playing ? "pause" : "play"} size={20}/></button>
              <span className="t-mono">{String(Math.floor(t/60)).padStart(2,"0")}:{String(t%60).padStart(2,"0")} / {session.duration}</span>
              <div style={{ flex: 1 }}/>
              <span style={{ color: "var(--fg-4)" }}>Speed</span>
              {[0.5, 1, 2, 4].map(s => (
                <button key={s} onClick={() => setSpeed(s)} style={{ padding: "3px 8px", border: "none", borderRadius: 4, background: speed === s ? "var(--brand)" : "transparent", color: speed === s ? "#fff" : "#c8ccd2", cursor: "pointer", font: "500 12px/1 var(--font-sans)" }}>{s}x</button>
              ))}
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div style={{ borderLeft: "1px solid var(--border)", overflow: "auto", padding: 14 }}>
          <div style={{ position: "sticky", top: 0, background: "var(--bg-app)", paddingBottom: 10, marginBottom: 8 }}>
            <div style={{ font: "600 11px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>Synchronized timeline</div>
            <div style={{ position: "relative" }}>
              <Icon name="search" size={12} color="var(--fg-4)" style={{ position: "absolute", left: 10, top: 9 }}/>
              <input className="input" value={search} onChange={e => setSearch(e.target.value)} placeholder="OCR search within session…" style={{ paddingLeft: 28, height: 28, fontSize: 12 }}/>
            </div>
          </div>
          {[
            { ts: "00:00:08", cmd: "sudo -i",                       risk: false, desc: "Privilege escalation" },
            { ts: "00:01:32", cmd: "psql -U postgres -d ledger",    risk: false, desc: "Database connection" },
            { ts: "00:02:18", cmd: "SELECT count(*) FROM transactions", risk: false },
            { ts: "00:03:35", cmd: "rm -rf /var/log/audit",         risk: true,  desc: "Destructive command — irreversible" },
            { ts: "00:06:00", cmd: "systemctl restart auth-svc",    risk: false },
            { ts: "00:09:40", cmd: "Long idle (4 min)",             risk: true,  desc: "Idle exceeds threshold" },
            { ts: "00:11:50", cmd: "exit",                          risk: false },
          ].map((e, i) => (
            <div key={i} style={{
              padding: "8px 10px", marginBottom: 4, borderRadius: 6,
              background: e.risk ? "var(--danger-soft)" : "var(--bg-surface-2)",
              borderLeft: e.risk ? "2px solid var(--danger-fg)" : "2px solid transparent",
              cursor: "pointer",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="t-mono" style={{ font: "500 10.5px/1 var(--font-mono)", color: "var(--fg-4)" }}>{e.ts}</span>
                {e.risk && <span style={{ color: "var(--danger-fg)", fontSize: 11 }}>⚑</span>}
              </div>
              <div className="t-mono" style={{ font: "500 12px/1.4 var(--font-mono)", color: e.risk ? "var(--danger-fg)" : "var(--fg-1)", marginTop: 2 }}>{e.cmd}</div>
              {e.desc && <div style={{ font: "400 11px/1.4 var(--font-sans)", color: e.risk ? "var(--danger-fg)" : "var(--fg-3)", marginTop: 2 }}>{e.desc}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// =========================================================
// SCHEDULED REPORTS
// =========================================================
const ScheduledReportsTab = () => {
  const [showCreate, setShowCreate] = React.useState(false);
  const sch = window.SCHEDULED_REPORTS || [];
  const active = sch.filter(s => s.status === "Active").length;
  const failed = sch.filter(s => !s.lastOk).length;
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <h1 className="h-title">Scheduled Reports</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--fg-3)" }}>Automatically generate and distribute reports on a recurring schedule.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Icon name="plus" size={12}/> Schedule a report</button>
      </div>

      <div style={{ padding: "16px 24px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        <KPICard label="Active schedules" value={active}/>
        <KPICard label="Ran today" value={3} accent="var(--success-fg)"/>
        <KPICard label="Failed" value={failed} accent={failed > 0 ? "var(--danger-fg)" : "var(--fg-1)"}/>
      </div>

      <div style={{ flex: 1, overflow: "auto" }}>
        {sch.length === 0 ? (
          <EmptyState icon="clock" title="No scheduled reports yet" description="Schedule reports to automatically generate and email to compliance teams, auditors, or management." action={<button className="btn btn-primary" onClick={() => setShowCreate(true)}><Icon name="plus" size={11}/> Schedule a report</button>}/>
        ) : (
          <table className="table">
            <thead><tr><th>Report</th><th>Frequency</th><th>Next run</th><th>Recipients</th><th>Format</th><th>Last run</th><th>Status</th><th></th></tr></thead>
            <tbody>{sch.map(s => (
              <tr key={s.id}>
                <td><span style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--brand-fg)" }}>{s.report}</span></td>
                <td><span className="badge">{s.frequency}</span></td>
                <td className="t-tiny" style={{ color: "var(--fg-2)" }}>{s.next}</td>
                <td title={s.recipients.join(", ")} style={{ font: "500 12.5px/1 var(--font-sans)", color: "var(--fg-2)" }}>{s.recipients.length} recipient{s.recipients.length === 1 ? "" : "s"}</td>
                <td><span className="badge">{s.format}</span></td>
                <td className="t-tiny" style={{ color: s.lastOk ? "var(--success-fg)" : "var(--danger-fg)" }}>{s.lastRun} · {s.lastOk ? "✓ Sent" : "✗ Failed"}</td>
                <td>{s.status === "Active" ? <span className="badge badge-success">Active</span> : <span className="badge">Paused</span>}</td>
                <td style={{ textAlign: "right" }}><RowMenu items={[
                  { label: "Edit", icon: "edit", onClick: () => {} },
                  { label: "Run now", icon: "play", onClick: () => {} },
                  { label: s.status === "Active" ? "Pause" : "Resume", icon: "pause", onClick: () => {} },
                  { label: "Duplicate", icon: "copy", onClick: () => {} },
                  { divider: true },
                  { label: "Delete", icon: "trash", danger: true, onClick: () => {} },
                ]}/></td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>

      {showCreate && <ScheduleReportPanel onClose={() => setShowCreate(false)}/>}
    </div>
  );
};

const ScheduleReportPanel = ({ onClose }) => {
  const [name, setName] = React.useState("Weekly Access Report — Every Monday 9 AM");
  const [report, setReport] = React.useState("");
  const [freq, setFreq] = React.useState("Weekly");
  const [time, setTime] = React.useState("09:00");
  const [tz, setTz] = React.useState("Asia/Kolkata");
  const [day, setDay] = React.useState("Mon");
  const [dom, setDom] = React.useState(1);
  const [range, setRange] = React.useState("7 days");
  const [recipients, setRecipients] = React.useState(["compliance@securecorp.com"]);
  const [recInput, setRecInput] = React.useState("");
  const [format, setFormat] = React.useState("PDF + CSV");
  const [summary, setSummary] = React.useState(true);
  const [anomalies, setAnomalies] = React.useState(true);
  const [exec, setExec] = React.useState(false);

  return <Panel title="Schedule a Report" onClose={onClose}>
    <div className="scroll-area" style={{ flex: 1, overflow: "auto", padding: "20px 24px" }}>
      <SectionLabel>Section 1 · Report</SectionLabel>
      <Field label="Select report" required hint="Pick the report this schedule will run.">
        <Select value={report} onChange={setReport} options={[["", "Select a report…"], ...(window.REPORTS || []).map(r => [r.id, r.name])]}/>
      </Field>
      {report && <a href="#" style={{ font: "500 12.5px/1 var(--font-sans)", color: "var(--brand-fg)" }}>Preview report →</a>}

      <div style={{ height: 18 }}/>
      <SectionLabel>Section 2 · Schedule</SectionLabel>
      <Field label="Frequency" required>
        <Segmented value={freq} onChange={setFreq} options={[{value:"Daily",label:"Daily"},{value:"Weekly",label:"Weekly"},{value:"Monthly",label:"Monthly"},{value:"Quarterly",label:"Quarterly"}]}/>
      </Field>
      {freq === "Weekly" && (
        <Field label="Day(s)" required><div style={{ display: "flex", gap: 6 }}>
          {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d => (
            <button key={d} onClick={() => setDay(d)} className="btn btn-sm" style={{ background: day === d ? "var(--brand-soft)" : "var(--bg-surface)", color: day === d ? "var(--brand-fg)" : "var(--fg-2)", borderColor: day === d ? "transparent" : "var(--border)" }}>{d}</button>
          ))}
        </div></Field>
      )}
      {freq === "Monthly" && <Field label="Day of month" required><input className="input" type="number" min={1} max={28} value={dom} onChange={e => setDom(+e.target.value)} style={{ width: 100 }}/></Field>}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Field label="Time" required><input className="input" type="time" value={time} onChange={e => setTime(e.target.value)}/></Field>
        <Field label="Timezone"><Select value={tz} onChange={setTz} options={[["Asia/Kolkata","Asia/Kolkata"],["UTC","UTC"],["America/New_York","America/New_York"]]}/></Field>
      </div>
      <Field label="Date range for report data" required>
        <Segmented value={range} onChange={setRange} options={[{value:"24h",label:"Last 24h"},{value:"7 days",label:"Last 7 days"},{value:"30 days",label:"Last 30 days"},{value:"90 days",label:"Last 90 days"},{value:"quarter",label:"Last quarter"}]}/>
      </Field>

      <div style={{ height: 18 }}/>
      <SectionLabel>Section 3 · Recipients</SectionLabel>
      <Field label="Add recipients" required>
        <div style={{ padding: 8, border: "1px solid var(--border)", borderRadius: 6, background: "var(--bg-app)", display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center", minHeight: 36 }}>
          {recipients.map(r => <span key={r} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 999, background: "var(--brand-soft)", color: "var(--brand-fg)", font: "500 12px/1.5 var(--font-sans)" }}>{r}<button onClick={() => setRecipients(recipients.filter(x => x !== r))} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 0, color: "var(--brand-fg)", display: "inline-flex" }}><Icon name="x" size={10}/></button></span>)}
          <input value={recInput} onChange={e => setRecInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && recInput.trim()) { setRecipients([...recipients, recInput.trim()]); setRecInput(""); } }} placeholder="Type email and press Enter…" style={{ flex: 1, minWidth: 160, border: "none", outline: "none", font: "400 12.5px/1 var(--font-sans)", background: "transparent" }}/>
        </div>
        <a href="#" style={{ font: "500 12px/1 var(--font-sans)", color: "var(--brand-fg)", marginTop: 4, display: "inline-block" }}>+ Add all compliance officers</a>
      </Field>

      <div style={{ height: 18 }}/>
      <SectionLabel>Section 4 · Format</SectionLabel>
      <Field label="Format" required><Segmented value={format} onChange={setFormat} options={[{value:"CSV",label:"CSV"},{value:"PDF",label:"PDF"},{value:"PDF + CSV",label:"Both"}]}/></Field>
      <div className="card" style={{ padding: 14, background: "var(--bg-surface-2)", display: "flex", flexDirection: "column", gap: 10 }}>
        <Toggle value={summary} onChange={setSummary} label="Include summary stats" hint="Key metrics shown in the email body."/>
        <Toggle value={anomalies} onChange={setAnomalies} label="Include anomaly highlights" hint="Flag any anomalies detected in the report period."/>
        <Toggle value={exec} onChange={setExec} label="Include executive summary" hint="One-paragraph plain-English summary."/>
      </div>

      <div style={{ height: 18 }}/>
      <SectionLabel>Section 5 · Name</SectionLabel>
      <Field label="Schedule name" required><input className="input" value={name} onChange={e => setName(e.target.value)}/></Field>
    </div>
    <div style={{ borderTop: "1px solid var(--border)", padding: "12px 24px", display: "flex", gap: 8, justifyContent: "flex-end", background: "var(--bg-surface)" }}>
      <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
      <button className="btn btn-primary" onClick={onClose}>Save schedule</button>
    </div>
  </Panel>;
};

const SectionLabel = ({ children }) => (
  <div style={{ font: "600 10.5px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 12 }}>{children}</div>
);

Object.assign(window, { SessionDetailPanel, SessionPlayer, ScheduledReportsTab, ScheduleReportPanel });
