// Network Scan flow — full-page setup → live scan → results table

const NetworkScanFlow = ({ onClose, onAddSelected }) => {
  const [phase, setPhase] = React.useState("config"); // "config" | "scanning" | "results"
  const [config, setConfig] = React.useState({
    target: "10.42.18.0/24",
    method: "icmp+tcp",
    ports: "22, 3389, 3306, 5432, 27017, 6379, 443",
    credSet: "default",
    timeout: 5,
  });
  const [progress, setProgress] = React.useState(0);
  const [discovered, setDiscovered] = React.useState([]);
  const [selected, setSelected] = React.useState(new Set());

  const target = config.target;
  const startScan = () => {
    setPhase("scanning");
    setProgress(0);
    setDiscovered([]);
    const candidates = [
      { id: "scan-1",  ip: "10.42.18.4",  hostname: "ledger-app-01",   type: "linux",    os: "Ubuntu 22.04 LTS",   ports: "22, 443",        rtt: "0.4ms", confidence: 98, accounts: 4, severity: "high",   flags: ["root-key"] },
      { id: "scan-2",  ip: "10.42.18.7",  hostname: "ledger-db-01",    type: "database", os: "PostgreSQL 15.3",    ports: "5432",           rtt: "0.6ms", confidence: 99, accounts: 3, severity: "critical", flags: ["privileged","exposed"] },
      { id: "scan-3",  ip: "10.42.18.12", hostname: "auth-server-02",  type: "linux",    os: "Ubuntu 22.04 LTS",   ports: "22, 443",        rtt: "0.5ms", confidence: 97, accounts: 2, severity: "critical", flags: ["root-key","sso-path"] },
      { id: "scan-4",  ip: "10.42.18.18", hostname: "metrics-prom",    type: "linux",    os: "Amazon Linux 2",     ports: "22, 9090",       rtt: "0.7ms", confidence: 96, accounts: 1, severity: "low",     flags: [] },
      { id: "scan-5",  ip: "10.42.18.22", hostname: "ledger-mongo-rs1",type: "database", os: "MongoDB 7.0.5",      ports: "27017",          rtt: "0.6ms", confidence: 99, accounts: 4, severity: "high",    flags: ["unauth-bind"] },
      { id: "scan-6",  ip: "10.42.18.31", hostname: "redis-cache-01",  type: "database", os: "Redis 7.2",          ports: "6379",           rtt: "0.4ms", confidence: 98, accounts: 1, severity: "medium",  flags: [] },
      { id: "scan-7",  ip: "10.42.18.45", hostname: "ledger-replica-2",type: "linux",    os: "Ubuntu 22.04 LTS",   ports: "22, 5432",       rtt: "0.5ms", confidence: 97, accounts: 4, severity: "high",    flags: ["privileged"] },
      { id: "scan-8",  ip: "10.42.18.46", hostname: "ledger-replica-3",type: "linux",    os: "Ubuntu 22.04 LTS",   ports: "22, 5432",       rtt: "0.5ms", confidence: 97, accounts: 3, severity: "high",    flags: ["privileged"] },
      { id: "scan-9",  ip: "10.42.18.55", hostname: "build-runner-2",  type: "windows",  os: "Server 2022",        ports: "3389, 445",      rtt: "0.9ms", confidence: 94, accounts: 2, severity: "medium",  flags: ["local-admin"] },
      { id: "scan-10", ip: "10.42.18.62", hostname: "log-aggregator",  type: "linux",    os: "Debian 12",          ports: "22, 5044, 9200", rtt: "0.6ms", confidence: 95, accounts: 1, severity: "low",     flags: [] },
      { id: "scan-11", ip: "10.42.18.71", hostname: "vpn-concentrator",type: "linux",    os: "OPNsense 23.7",      ports: "22, 443",        rtt: "0.8ms", confidence: 92, accounts: 2, severity: "high",    flags: ["network-perimeter"] },
      { id: "scan-12", ip: "10.42.18.84", hostname: "ci-jenkins-prod", type: "linux",    os: "Ubuntu 22.04 LTS",   ports: "22, 8080",       rtt: "0.6ms", confidence: 96, accounts: 3, severity: "critical", flags: ["secrets-exposure","root-key"] },
      { id: "scan-13", ip: "10.42.18.91", hostname: "vault-secondary", type: "linux",    os: "Ubuntu 22.04 LTS",   ports: "22, 8200",       rtt: "0.5ms", confidence: 98, accounts: 2, severity: "critical", flags: ["secrets-store"] },
      { id: "scan-14", ip: "10.42.18.99", hostname: "audit-archive",   type: "linux",    os: "Ubuntu 22.04 LTS",   ports: "22, 873",        rtt: "0.7ms", confidence: 95, accounts: 1, severity: "medium",  flags: [] },
    ];

    let i = 0;
    const tick = () => {
      i += 1;
      const pct = Math.min(100, Math.round((i / 22) * 100));
      setProgress(pct);
      if (i % 2 === 0 && discovered.length < candidates.length) {
        const idx = Math.floor(i / 2) - 1;
        if (idx >= 0 && idx < candidates.length) {
          setDiscovered(prev => [...prev, candidates[idx]]);
        }
      }
      if (i < 22) {
        setTimeout(tick, 280);
      } else {
        // ensure all discovered
        setDiscovered(candidates);
        setTimeout(() => setPhase("results"), 400);
      }
    };
    setTimeout(tick, 320);
  };

  const cancel = () => {
    if (phase === "scanning") setPhase("config");
    else onClose();
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "var(--bg-app)" }} data-screen-label="Network Scan">
      <PageHeader
        title="Network scan"
        description={phase === "config" ? "Discover servers, databases, and applications across an IP range." :
                     phase === "scanning" ? `Scanning ${config.target} — this may take a few minutes.` :
                     "Review discovered resources and onboard the ones you want under PAM management."}
        actions={<button className="btn btn-ghost" onClick={onClose}><Icon name="close" size={13}/> Close</button>}
      />

      <div className="scroll-area" style={{ flex: 1, overflow: "auto" }}>
        {phase === "config"   && <ScanConfig config={config} setConfig={setConfig} onStart={startScan} onCancel={onClose}/>}
        {phase === "scanning" && <ScanLive   config={config} progress={progress} discovered={discovered} onCancel={cancel}/>}
        {phase === "results"  && <ScanResults
          discovered={discovered}
          selected={selected}
          setSelected={setSelected}
          onAdd={() => onAddSelected(discovered.filter(d => selected.has(d.id)))}
          onRescan={() => setPhase("config")}
        />}
      </div>
    </div>
  );
};

// ---- Phase 1: configure scan ----
const ScanConfig = ({ config, setConfig, onStart, onCancel }) => (
  <div style={{ padding: "24px 32px", maxWidth: 720, margin: "0 auto", display: "flex", flexDirection: "column", gap: 18 }}>
    <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 8, padding: 22, display: "flex", flexDirection: "column", gap: 18 }}>
      <Field label="Scan target" required hint="CIDR notation, IP range, or comma-separated hosts. Examples: 10.42.18.0/24 · 10.42.18.1-10.42.18.100 · auth01,db01,db02">
        <input className="input t-mono" value={config.target} onChange={e => setConfig(c => ({...c, target: e.target.value}))}/>
      </Field>
      <Field label="Discovery method">
        <Segmented value={config.method} onChange={v => setConfig(c => ({...c, method: v}))}
          options={[
            {value:"icmp+tcp", label:"Ping + port probe"},
            {value:"tcp", label:"Port probe only"},
            {value:"snmp", label:"SNMP sweep"},
          ]}/>
      </Field>
      <Field label="Ports to probe" hint="Comma-separated. Common SSH/RDP/DB ports are pre-filled.">
        <input className="input t-mono" value={config.ports} onChange={e => setConfig(c => ({...c, ports: e.target.value}))}/>
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label="Credential set" hint="Used to fingerprint OS and enumerate accounts">
          <Select value={config.credSet} onChange={v => setConfig(c => ({...c, credSet: v}))}
            options={[["default","Default discovery creds"],["windows","Windows admin set"],["linux","Linux SSH set"],["none","No creds (port probe only)"]]}/>
        </Field>
        <Field label="Timeout per host (seconds)">
          <input className="input t-mono" type="number" value={config.timeout} onChange={e => setConfig(c => ({...c, timeout: +e.target.value}))}/>
        </Field>
      </div>
    </div>

    <div style={{ background: "var(--brand-soft)", border: "1px solid transparent", borderRadius: 8, padding: 14, display: "flex", gap: 10, alignItems: "flex-start" }}>
      <Icon name="info" size={14} color="var(--brand-fg)" style={{ marginTop: 1, flex: "none" }}/>
      <div style={{ font: "400 12.5px/1.5 var(--font-sans)", color: "var(--brand-fg)" }}>
        Scanning is read-only. PAM does not change anything on discovered hosts. Discovered resources appear in <strong>Discovery & triage</strong> and can be onboarded one-by-one.
      </div>
    </div>

    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
      <button className="btn" onClick={onCancel}>Cancel</button>
      <button className="btn btn-primary" onClick={onStart}><Icon name="discovery" size={13}/> Start scan</button>
    </div>
  </div>
);

// ---- Phase 2: live scan ----
const ScanLive = ({ config, progress, discovered, onCancel }) => (
  <div style={{ padding: "24px 32px", maxWidth: 1100, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
    <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 8, padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div>
          <div style={{ font: "600 14px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>Scanning {config.target}</div>
          <div style={{ font: "400 12.5px/1.5 var(--font-sans)", color: "var(--fg-3)", marginTop: 3 }}>
            {discovered.length} resources found · {progress}% complete · ETA {Math.max(1, Math.ceil((100 - progress) / 8))}s
          </div>
        </div>
        <button className="btn" onClick={onCancel}>Cancel scan</button>
      </div>
      <div style={{ height: 8, background: "var(--bg-surface-2)", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${progress}%`, background: "var(--brand)", transition: "width 280ms ease", borderRadius: 4 }}/>
      </div>
      <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
        <ScanStat label="Probed"     value={Math.round(progress * 2.5)}/>
        <ScanStat label="Reachable"  value={discovered.length}/>
        <ScanStat label="With privileged accounts" value={discovered.filter(d => d.severity === "critical" || d.severity === "high").length}/>
        <ScanStat label="Already managed" value={2}/>
      </div>
    </div>

    {discovered.length > 0 && (
      <div className="card">
        <div className="card-header">
          <span className="h-card">Discovered so far</span>
          <span style={{ marginLeft: "auto", font: "400 12px/1 var(--font-sans)", color: "var(--fg-4)", display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span className="dot pulse-dot" style={{ background: "var(--success)" }}/>Live
          </span>
        </div>
        <table className="table">
          <thead><tr><th>Hostname</th><th>IP</th><th>Type</th><th>OS / app</th><th>Open ports</th><th>RTT</th></tr></thead>
          <tbody>
            {discovered.slice().reverse().map(d => (
              <tr key={d.id} style={{ animation: "fadeIn 240ms ease" }}>
                <td style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{d.hostname}</td>
                <td className="t-mono" style={{ fontSize: 12, color: "var(--fg-2)" }}>{d.ip}</td>
                <td>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--fg-2)" }}>
                    <Icon name={(window.TYPE_META && window.TYPE_META[d.type]?.icon) || "server"} size={13} color="var(--fg-3)"/>
                    {(window.TYPE_META && window.TYPE_META[d.type]?.label) || d.type}
                  </span>
                </td>
                <td style={{ fontSize: 12.5, color: "var(--fg-2)" }}>{d.os}</td>
                <td className="t-mono" style={{ fontSize: 12, color: "var(--fg-3)" }}>{d.ports}</td>
                <td className="t-mono t-tiny" style={{ color: "var(--fg-3)" }}>{d.rtt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

const ScanStat = ({ label, value }) => (
  <div style={{ background: "var(--bg-surface-2)", border: "1px solid var(--border)", borderRadius: 6, padding: "10px 12px" }}>
    <div style={{ font: "500 10.5px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 4 }}>{label}</div>
    <div style={{ font: "600 19px/1.1 var(--font-sans)", color: "var(--fg-1)" }}>{value}</div>
  </div>
);

// ---- Phase 3: results ----
const SEV_STYLE = {
  critical: { bg: "var(--danger-soft)",  fg: "var(--danger-fg)",  label: "Critical" },
  high:     { bg: "var(--warning-soft)", fg: "var(--warning-fg)", label: "High" },
  medium:   { bg: "var(--bg-surface-2)", fg: "var(--fg-2)",       label: "Medium" },
  low:      { bg: "var(--bg-surface-2)", fg: "var(--fg-3)",       label: "Low" },
};

const ScanResults = ({ discovered, selected, setSelected, onAdd, onRescan }) => {
  const [filter, setFilter] = React.useState("all");
  const filtered = filter === "all" ? discovered : discovered.filter(d => d.severity === filter || (filter === "managed" && d.managed));

  const toggle = (id) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allChecked = filtered.length > 0 && filtered.every(d => selected.has(d.id));
  const toggleAll = () => setSelected(s => new Set(allChecked ? [] : filtered.map(d => d.id)));

  const sevCount = (k) => discovered.filter(d => d.severity === k).length;

  return (
    <div style={{ padding: "24px 32px", display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <SummaryStat label="Total found" value={discovered.length} active={filter === "all"} onClick={() => setFilter("all")}/>
        <SummaryStat label="Critical"    value={sevCount("critical")} accent="var(--danger-fg)"  active={filter === "critical"} onClick={() => setFilter("critical")}/>
        <SummaryStat label="High"        value={sevCount("high")}     accent="var(--warning-fg)" active={filter === "high"}     onClick={() => setFilter("high")}/>
        <SummaryStat label="Medium"      value={sevCount("medium")}   active={filter === "medium"}   onClick={() => setFilter("medium")}/>
        <SummaryStat label="Low"         value={sevCount("low")}      active={filter === "low"}      onClick={() => setFilter("low")}/>
        <div style={{ flex: 1 }}/>
        <button className="btn" onClick={onRescan}><Icon name="refresh" size={12}/> New scan</button>
      </div>

      <div className="card">
        <div className="card-header" style={{ background: selected.size > 0 ? "var(--brand-soft)" : "var(--bg-surface)" }}>
          {selected.size > 0 ? <>
            <span style={{ font: "600 13px/1 var(--font-sans)", color: "var(--brand-fg)" }}>{selected.size} selected</span>
            <div style={{ flex: 1 }}/>
            <button className="btn btn-sm">Assign policy…</button>
            <button className="btn btn-sm">Assign owner…</button>
            <button className="btn btn-sm btn-primary" onClick={onAdd}><Icon name="plus" size={11}/> Onboard {selected.size} resource{selected.size > 1 ? "s" : ""}</button>
          </> : <>
            <span className="h-card">Discovered resources</span>
            <div style={{ flex: 1 }}/>
            <span style={{ font: "400 12px/1 var(--font-sans)", color: "var(--fg-4)" }}>{filtered.length} of {discovered.length} shown</span>
          </>}
        </div>
        <table className="table">
          <thead><tr>
            <th style={{ width: 32 }}><input type="checkbox" checked={allChecked} onChange={toggleAll} style={{ accentColor: "var(--brand)" }}/></th>
            <th>Hostname</th><th>IP</th><th>Type</th><th>OS / app</th><th>Open ports</th><th>Accounts</th><th>Risk</th><th>Confidence</th><th></th>
          </tr></thead>
          <tbody>
            {filtered.map(d => (
              <tr key={d.id}>
                <td><input type="checkbox" checked={selected.has(d.id)} onChange={() => toggle(d.id)} style={{ accentColor: "var(--brand)" }}/></td>
                <td>
                  <div style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{d.hostname}</div>
                  {d.flags.length > 0 && <div style={{ marginTop: 3, display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {d.flags.map(f => (
                      <span key={f} className="badge" style={{ background: "var(--warning-soft)", color: "var(--warning-fg)", borderColor: "transparent", fontSize: 10.5, padding: "1px 6px" }}>{f}</span>
                    ))}
                  </div>}
                </td>
                <td className="t-mono" style={{ fontSize: 12, color: "var(--fg-2)" }}>{d.ip}</td>
                <td>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--fg-2)" }}>
                    <Icon name={(window.TYPE_META && window.TYPE_META[d.type]?.icon) || "server"} size={13} color="var(--fg-3)"/>
                    {(window.TYPE_META && window.TYPE_META[d.type]?.label) || d.type}
                  </span>
                </td>
                <td style={{ fontSize: 12.5, color: "var(--fg-2)" }}>{d.os}</td>
                <td className="t-mono" style={{ fontSize: 12, color: "var(--fg-3)" }}>{d.ports}</td>
                <td style={{ fontSize: 12.5, color: "var(--fg-2)" }}>{d.accounts}</td>
                <td>
                  <span className="badge" style={{ background: SEV_STYLE[d.severity].bg, color: SEV_STYLE[d.severity].fg, borderColor: "transparent" }}>{SEV_STYLE[d.severity].label}</span>
                </td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 50, height: 5, background: "var(--bg-surface-2)", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ width: `${d.confidence}%`, height: "100%", background: d.confidence >= 95 ? "var(--success)" : "var(--warning)" }}/>
                    </div>
                    <span style={{ fontSize: 11.5, color: "var(--fg-3)" }}>{d.confidence}%</span>
                  </div>
                </td>
                <td style={{ textAlign: "right" }}>
                  <button className="btn btn-ghost btn-sm">Investigate</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const SummaryStat = ({ label, value, active, accent, onClick }) => (
  <button onClick={onClick} style={{
    display: "flex", flexDirection: "column", gap: 3, padding: "8px 14px",
    background: active ? "var(--brand-soft)" : "var(--bg-surface)",
    border: `1px solid ${active ? "var(--brand)" : "var(--border)"}`,
    borderRadius: 6, cursor: "pointer", textAlign: "left", minWidth: 100,
  }}>
    <span style={{ font: "500 10.5px/1 var(--font-sans)", color: active ? "var(--brand-fg)" : "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.7 }}>{label}</span>
    <span style={{ font: "600 18px/1.1 var(--font-sans)", color: active ? "var(--brand-fg)" : (accent || "var(--fg-1)") }}>{value}</span>
  </button>
);

window.NetworkScanFlow = NetworkScanFlow;
