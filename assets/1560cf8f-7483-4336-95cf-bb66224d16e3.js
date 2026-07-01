// Policies V2 — Create flow (3-step full page) + Templates gallery + Recording Settings tab

// ============= TEMPLATES GALLERY =============
const PolicyTemplatesPanel = ({ onClose, onUseTemplate }) => {
  const [filter, setFilter] = React.useState("All");
  const tpls = window.POL_TEMPLATES || [];
  const rows = filter === "All" ? tpls : tpls.filter(t => t.type === filter);
  return <Panel title="Policy templates" onClose={onClose}>
    <div className="scroll-area" style={{ flex: 1, overflow: "auto", padding: 20 }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {["All", "SSH", "RDP", "Web", "Database", "Password"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: "4px 12px", borderRadius: 999, border: "none", cursor: "pointer",
            background: filter === f ? "var(--brand-soft)" : "var(--bg-surface-2)",
            color: filter === f ? "var(--brand-fg)" : "var(--fg-3)",
            font: `${filter === f ? 600 : 500} 12px/1 var(--font-sans)`,
          }}>{f}</button>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {rows.map(t => (
          <div key={t.id} className="card" style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}><POL_TYPE_BADGE type={t.type}/></div>
            <div style={{ font: "600 13.5px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{t.name}</div>
            <div style={{ font: "400 12px/1.5 var(--font-sans)", color: "var(--fg-3)" }}>{t.desc}</div>
            <div style={{ font: "400 11.5px/1.5 var(--font-sans)", color: "var(--fg-4)", padding: "8px 0", borderTop: "1px dashed var(--border-subtle)" }}>
              {Object.entries(t.preview).map(([k, v]) => (
                <div key={k}>{k}: <span style={{ color: "var(--fg-2)" }}>{typeof v === "boolean" ? (v ? "On" : "Off") : v}</span></div>
              ))}
            </div>
            <button className="btn btn-sm btn-primary" onClick={() => onUseTemplate(t)}>Use template</button>
          </div>
        ))}
      </div>
    </div>
  </Panel>;
};

// ============= CREATE FLOW =============
const PolicyCreatePage = ({ onClose, initialTemplate }) => {
  const [step, setStep] = React.useState(initialTemplate ? 2 : 1);
  const [data, setData] = React.useState({
    type: initialTemplate ? initialTemplate.type : null,
    name: initialTemplate ? `${initialTemplate.name} copy` : "",
    description: initialTemplate ? initialTemplate.desc : "",
    settings: { recording: "on", mfa: true, sessionTimeout: 30, idleTimeout: 15, clipboard: false, fileTransfer: false, concurrent: 1, sources: [], timeWindow: "always", queryApproval: {} },
    commands: [],
    cmdMode: "blocklist",
    ftRules: [], ftDefault: "deny",
    ssh: { portFwd: false, x11: false, agentFwd: false, shellRestrict: false, shells: [] },
    applyChoice: "draft",
    applyResources: [],
  });
  const set = (k, v) => setData(d => ({...d, [k]: v}));
  const setSettings = (s) => setData(d => ({...d, settings: s}));
  const setCommands = (c) => setData(d => ({...d, commands: c}));

  const [success, setSuccess] = React.useState(false);

  if (success) return null;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, font: "400 12px/1 var(--font-sans)", color: "var(--fg-4)" }}>
            <a href="#" onClick={e => { e.preventDefault(); onClose(); }} style={{ color: "var(--brand-fg)" }}>Policies</a> <Icon name="chevron-right" size={10}/> <span>Create Policy</span>
          </div>
          <h1 style={{ font: "600 22px/1.2 var(--font-sans)", color: "var(--fg-1)", margin: "6px 0 0" }}>Create Policy</h1>
          <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center" }}>
            {[{n:1,l:"Policy Type"},{n:2,l:"Configure"},{n:3,l:"Apply"}].map((s, i, a) => {
              const done = step > s.n, active = step === s.n;
              return <React.Fragment key={s.n}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: done ? "var(--success)" : active ? "var(--brand)" : "var(--bg-surface-2)", color: done || active ? "#fff" : "var(--fg-3)", display: "flex", alignItems: "center", justifyContent: "center", font: "600 11px/1 var(--font-sans)", border: !done && !active ? "1px solid var(--border)" : "none" }}>{done ? <Icon name="check" size={11} color="#fff"/> : s.n}</div>
                  <span style={{ font: `${active ? 600 : 500} 12.5px/1 var(--font-sans)`, color: active ? "var(--fg-1)" : done ? "var(--fg-2)" : "var(--fg-4)" }}>{s.l}</span>
                </div>
                {i < a.length - 1 && <div style={{ width: 44, height: 1, background: done ? "var(--success)" : "var(--border)" }}/>}
              </React.Fragment>;
            })}
          </div>
        </div>
        <a href="#" onClick={e => { e.preventDefault(); onClose(); }} style={{ font: "500 12.5px/1 var(--font-sans)", color: "var(--fg-3)" }}>Cancel</a>
      </div>

      <div className="scroll-area" style={{ flex: 1, overflow: "auto", padding: 24 }}>
        {step === 1 && (
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <div style={{ font: "600 16px/1.3 var(--font-sans)", color: "var(--fg-1)", marginBottom: 24 }}>Choose a policy type</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {Object.entries(window.POL_TYPES || {}).map(([id, t]) => (
                <button key={id} onClick={() => { set("type", id); setStep(2); }} style={{
                  padding: 18, border: "1px solid var(--border)", background: "var(--bg-surface)",
                  borderRadius: 8, cursor: "pointer", textAlign: "left",
                  display: "flex", gap: 14, alignItems: "flex-start",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--brand)"; e.currentTarget.style.background = "var(--brand-soft)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--bg-surface)"; }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--brand-soft)", color: "var(--brand-fg)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Icon name={t.icon} size={18}/></div>
                  <div>
                    <div style={{ font: "600 14px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{t.label}</div>
                    <div style={{ font: "400 12px/1.5 var(--font-sans)", color: "var(--fg-3)", marginTop: 4 }}>{t.desc}</div>
                  </div>
                </button>
              ))}
            </div>
            <div style={{ marginTop: 20, textAlign: "center", font: "500 12.5px/1 var(--font-sans)" }}>
              Or <a href="#" onClick={e => e.preventDefault()} style={{ color: "var(--brand-fg)" }}>start from a template →</a>
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: 18, maxWidth: 1040, margin: "0 auto" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {/* Identity — compact */}
              <div className="card" style={{ padding: 16 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12 }}>
                  <Field label="Policy name" required><input className="input" value={data.name} onChange={e => set("name", e.target.value)} placeholder="Production SSH — Strict"/></Field>
                  <Field label="Description"><input className="input" value={data.description} onChange={e => set("description", e.target.value)} placeholder="Describe when this policy applies"/></Field>
                </div>
              </div>

              {/* Settings — single grid, compact rows */}
              <CollapsibleSection title="Session settings" subtitle="Recording, MFA, timeouts and basic limits" defaultOpen>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <CompactRow label="Session recording">
                    <Segmented value={data.settings.recording} onChange={v => setSettings({...data.settings, recording: v})} options={[{value:"on",label:"On"},{value:"off",label:"Off"},{value:"inherits",label:"Inherit"}]}/>
                  </CompactRow>
                  <CompactRow label="MFA required"><Toggle value={data.settings.mfa} onChange={v => setSettings({...data.settings, mfa: v})}/></CompactRow>
                  <CompactRow label="Session timeout (min)"><input className="input" type="number" value={data.settings.sessionTimeout} onChange={e => setSettings({...data.settings, sessionTimeout: +e.target.value})} style={{ width: 100 }}/></CompactRow>
                  <CompactRow label="Idle timeout (min)"><input className="input" type="number" value={data.settings.idleTimeout} onChange={e => setSettings({...data.settings, idleTimeout: +e.target.value})} style={{ width: 100 }}/></CompactRow>
                  <CompactRow label="Concurrent sessions / user"><input className="input" type="number" value={data.settings.concurrent} onChange={e => setSettings({...data.settings, concurrent: +e.target.value})} style={{ width: 100 }}/></CompactRow>
                  <CompactRow label="Time window">
                    <Segmented value={data.settings.timeWindow} onChange={v => setSettings({...data.settings, timeWindow: v})} options={[{value:"always",label:"Always"},{value:"business",label:"Business"},{value:"custom",label:"Custom"}]}/>
                  </CompactRow>
                  <CompactRow label="Clipboard"><Toggle value={data.settings.clipboard} onChange={v => setSettings({...data.settings, clipboard: v})}/></CompactRow>
                  <CompactRow label="Source IPs"><input className="input t-mono" placeholder="Any · or 10.0.0.0/8" defaultValue=""/></CompactRow>
                </div>
              </CollapsibleSection>

              {/* Command Restrictions — toggle-expand */}
              {(data.type === "SSH" || data.type === "RDP") && (
                <ToggleSection
                  title="Command restrictions"
                  subtitle="Block or allowlist commands during shell sessions"
                  enabled={data.cmdMode !== "disabled"}
                  onToggle={v => set("cmdMode", v ? "blocklist" : "disabled")}
                >
                  <CommandRestrictionsV2 mode={data.cmdMode} setMode={v => set("cmdMode", v)} commands={data.commands} setCommands={setCommands} ssh={data.ssh} setSSH={v => set("ssh", v)}/>
                </ToggleSection>
              )}

              {/* File Transfer — toggle-expand, opens rule builder inline */}
              {data.type === "SSH" && (
                <ToggleSection
                  title="File transfer"
                  subtitle="Allow SFTP/SMB transfers and define which paths and operations are permitted"
                  enabled={data.settings.fileTransfer}
                  onToggle={v => setSettings({...data.settings, fileTransfer: v})}
                >
                  <FileTransferControls rules={data.ftRules} setRules={v => set("ftRules", v)} defaultAccess={data.ftDefault} setDefaultAccess={v => set("ftDefault", v)}/>
                </ToggleSection>
              )}
            </div>

            {/* Sticky summary */}
            <div style={{ position: "sticky", top: 0, alignSelf: "flex-start" }}>
              <div className="card" style={{ padding: 14, background: "var(--bg-surface)" }}>
                <div style={{ font: "600 11px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10 }}>Summary</div>
                <div style={{ font: "600 14px/1.3 var(--font-sans)", color: "var(--fg-1)", marginBottom: 10 }}>{data.name || "Untitled policy"}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, font: "400 12px/1.5 var(--font-sans)" }}>
                  <SumRow k="Type"><POL_TYPE_BADGE type={data.type}/></SumRow>
                  <SumRow k="Recording" v={data.settings.recording === "on" ? "On" : data.settings.recording === "off" ? "Off" : "Inherits"} good={data.settings.recording === "on"}/>
                  <SumRow k="MFA" v={data.settings.mfa ? "Required" : "Not required"} good={data.settings.mfa}/>
                  <SumRow k="Idle timeout" v={`${data.settings.idleTimeout} min`}/>
                  {(data.type === "SSH" || data.type === "RDP") && <SumRow k="Commands" v={data.cmdMode === "disabled" ? "Unrestricted" : `${data.commands.length} ${data.cmdMode}`}/>}
                  {data.type === "SSH" && <SumRow k="File transfer" v={data.settings.fileTransfer ? `${data.ftRules.length} rules` : "Disabled"} good={!data.settings.fileTransfer}/>}
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ maxWidth: 760, margin: "0 auto" }}>
            <div style={{ font: "600 16px/1.3 var(--font-sans)", color: "var(--fg-1)", marginBottom: 20 }}>Apply this policy to resources?</div>
            <Segmented value={data.applyChoice} onChange={v => set("applyChoice", v)} options={[{value:"draft",label:"Save as draft for now"},{value:"apply",label:"Apply to resources now"}]}/>

            {data.applyChoice === "apply" && (
              <div className="card" style={{ marginTop: 16 }}>
                <div className="card-header"><span className="h-card">Pick resources</span></div>
                <div style={{ padding: 14 }}>
                  <div style={{ position: "relative", marginBottom: 10 }}>
                    <Icon name="search" size={13} color="var(--fg-4)" style={{ position: "absolute", left: 10, top: 11 }}/>
                    <input className="input" placeholder="Search resources…" style={{ paddingLeft: 30, height: 32 }}/>
                  </div>
                  <table className="table">
                    <thead><tr><th></th><th>Resource</th><th>Type</th><th>Currently bound</th></tr></thead>
                    <tbody>{(window.SEED_RESOURCES || []).slice(0, 6).map(r => (
                      <tr key={r.id}>
                        <td><input type="checkbox" style={{ accentColor: "var(--brand)" }}/></td>
                        <td className="t-mono" style={{ fontSize: 12, color: "var(--fg-1)" }}>{r.name}</td>
                        <td><span className="badge" style={{ textTransform: "capitalize" }}>{r.type}</span></td>
                        <td className="t-tiny" style={{ color: "var(--fg-4)" }}>{r.id === "RES-2841" ? "Production DB — Strict" : "No policy"}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ padding: "12px 24px", borderTop: "1px solid var(--border)", display: "flex", gap: 8, justifyContent: "flex-end", background: "var(--bg-surface)" }}>
        {step > 1 && <button className="btn" onClick={() => setStep(step - 1)}>← Back</button>}
        <div style={{ flex: 1 }}/>
        {step === 2 && <button className="btn btn-primary" disabled={!data.name} onClick={() => setStep(3)}>Continue</button>}
        {step === 3 && <button className="btn btn-primary" onClick={() => { window.__policyToast = `${data.name || "Policy"} ${data.applyChoice === "apply" ? "applied" : "saved as draft"}`; onClose(); }}>Save policy</button>}
      </div>
    </div>
  );
};

const PolicyCreateSuccess = ({ data, onClose }) => (
  <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto", padding: 32 }}>
    <div style={{ maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
      <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--success-soft)", color: "var(--success-fg)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}><Icon name="check" size={26}/></div>
      <h1 style={{ font: "600 19px/1.2 var(--font-sans)", color: "var(--fg-1)", margin: 0 }}>{data.name} saved</h1>
      <div style={{ font: "400 13px/1.5 var(--font-sans)", color: "var(--fg-3)", marginTop: 8 }}>{data.applyChoice === "apply" ? "Applied to selected resources" : "Saved as draft"}</div>
      <div style={{ marginTop: 20, display: "flex", gap: 8, justifyContent: "center" }}>
        <button className="btn btn-primary" onClick={onClose}>View policy</button>
        <button className="btn" onClick={onClose}>Create another</button>
        <button className="btn btn-ghost" onClick={onClose}>Back to policies</button>
      </div>
    </div>
  </div>
);

// ============= RECORDING SETTINGS TAB =============
const RecordingSettingsTab = () => {
  const [s, setS] = React.useState(window.RECORDING_GLOBAL || {});
  const set = (k, v) => setS(prev => ({...prev, [k]: v}));
  const pct = Math.round((s.storageUsed / s.storageMax) * 100);
  return (
    <div style={{ flex: 1, overflow: "auto", padding: 24, maxWidth: 720 }}>
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-header"><span className="h-card">Global default</span></div>
        <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ font: "400 12.5px/1.5 var(--font-sans)", color: "var(--fg-3)" }}>What should new policies default to?</div>
          <Toggle value={s.defaultRecording} onChange={v => set("defaultRecording", v)} label="Default recording: enabled for new policies"/>
          <Field label="Default retention"><Select value={String(s.defaultRetention)} onChange={v => set("defaultRetention", +v)} options={[["30","30 days"],["60","60 days"],["90","90 days"],["180","180 days"],["365","365 days"]]}/></Field>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-header"><span className="h-card">Storage</span></div>
        <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label="Recording storage location">
            <Segmented value={s.storageLocation} onChange={v => set("storageLocation", v)} options={[{value:"PAM Cloud",label:"PAM Cloud"},{value:"AWS S3",label:"AWS S3"},{value:"Azure Blob",label:"Azure Blob"},{value:"On-prem",label:"On-prem"}]}/>
          </Field>
          <div style={{ padding: 12, background: "var(--bg-surface-2)", borderRadius: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, font: "500 12.5px/1 var(--font-sans)" }}>
              <span style={{ color: "var(--fg-2)" }}>Storage usage</span>
              <span style={{ color: "var(--fg-1)" }}>{s.storageUsed} GB of {(s.storageMax / 1024).toFixed(1)} TB used</span>
            </div>
            <div style={{ height: 6, background: "var(--bg-app)", borderRadius: 999, overflow: "hidden" }}><div style={{ width: `${pct}%`, height: "100%", background: pct > 80 ? "var(--warning-fg)" : "var(--brand)" }}/></div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-header"><span className="h-card">Playback</span></div>
        <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
          <Toggle value={s.allowDownload} onChange={v => set("allowDownload", v)} label="Allow downloading recordings"/>
          <Toggle value={s.watermark} onChange={v => set("watermark", v)} label="Watermark recordings with viewer's name"/>
          <Toggle value={s.requireJustification} onChange={v => set("requireJustification", v)} label="Require justification to view recording"/>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-header"><span className="h-card">Live monitoring</span></div>
        <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
          <Toggle value={s.allowLive} onChange={v => set("allowLive", v)} label="Allow live session monitoring"/>
          <Toggle value={s.requireApproval} onChange={v => set("requireApproval", v)} label="Require approval before live monitoring"/>
          <Toggle value={s.notifyUser} onChange={v => set("notifyUser", v)} label="Notify user when their session is being watched"/>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button className="btn">Reset</button>
        <button className="btn btn-primary">Save changes</button>
      </div>
    </div>
  );
};

Object.assign(window, { PolicyTemplatesPanel, PolicyCreatePage, RecordingSettingsTab });

// Helpers — clean B2B section primitives
const CollapsibleSection = ({ title, subtitle, defaultOpen, children }) => {
  const [open, setOpen] = React.useState(!!defaultOpen);
  return (
    <div style={{ background: "var(--bg-app)", border: "1px solid var(--border)", borderRadius: 8 }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: "100%", padding: "12px 16px", border: "none", background: "transparent",
        display: "flex", alignItems: "center", gap: 10, cursor: "pointer", textAlign: "left",
      }}>
        <Icon name={open ? "chevron-down" : "chevron-right"} size={12} color="var(--fg-4)"/>
        <div style={{ flex: 1 }}>
          <div style={{ font: "600 13.5px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{title}</div>
          {subtitle && <div style={{ font: "400 11.5px/1.4 var(--font-sans)", color: "var(--fg-4)", marginTop: 2 }}>{subtitle}</div>}
        </div>
      </button>
      {open && <div style={{ padding: "0 16px 16px" }}>{children}</div>}
    </div>
  );
};

const ToggleSection = ({ title, subtitle, enabled, onToggle, children }) => (
  <div style={{ background: "var(--bg-app)", border: "1px solid var(--border)", borderRadius: 8 }}>
    <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ flex: 1 }}>
        <div style={{ font: "600 13.5px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{title}</div>
        {subtitle && <div style={{ font: "400 11.5px/1.4 var(--font-sans)", color: "var(--fg-4)", marginTop: 2 }}>{subtitle}</div>}
      </div>
      <Toggle value={enabled} onChange={onToggle}/>
    </div>
    {enabled && <div style={{ padding: "0 16px 16px", borderTop: "1px solid var(--border-subtle)" }}><div style={{ paddingTop: 14 }}>{children}</div></div>}
  </div>
);

const CompactRow = ({ label, children }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "6px 0" }}>
    <span style={{ font: "500 12.5px/1.3 var(--font-sans)", color: "var(--fg-2)" }}>{label}</span>
    <div>{children}</div>
  </div>
);

const SumRow = ({ k, v, good, children }) => (
  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
    <span style={{ color: "var(--fg-4)" }}>{k}</span>
    {children ? children : <span style={{ color: good ? "var(--success-fg)" : "var(--fg-1)" }}>{v}</span>}
  </div>
);

Object.assign(window, { CollapsibleSection, ToggleSection, CompactRow, SumRow });
