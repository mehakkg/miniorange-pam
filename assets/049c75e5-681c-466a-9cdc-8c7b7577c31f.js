// Audit — Reports landing + Report view + Custom builder + side panels
// Restyled to match admin-portal design language:
//   PageHeader · StatCard · .card / .card-header / .h-card · .table · .badge · .dot
// Pattern for every report view: Summary → Anomalies → Data → Trend (collapsed)

// =============================================================
// LANDING — three-column page (categories · list · quick actions)
// =============================================================

const ReportsLanding = ({ onOpen }) => {
  const [cat, setCat] = React.useState("all");
  const [search, setSearch] = React.useState("");
  const [showBuilder, setShowBuilder] = React.useState(false);
  const [historyFor, setHistoryFor] = React.useState(null);
  const reports = window.REPORTS || [];
  const cats = window.REPORT_CATEGORIES || [];

  const filtered = reports
    .filter(r => cat === "all" || r.category === cat)
    .filter(r => !search || (r.name + " " + r.desc).toLowerCase().includes(search.toLowerCase()));

  if (showBuilder) return <CustomReportBuilder onClose={() => setShowBuilder(false)} onSave={(r) => { setShowBuilder(false); onOpen(r); }}/>;

  // Group by category when "All"
  const grouped = cat === "all"
    ? cats.filter(c => c.id !== "all").map(c => ({ ...c, items: filtered.filter(r => r.category === c.id) })).filter(g => g.items.length)
    : null;

  const recents = reports.filter(r => r.lastRun && r.lastRun !== "Never").slice(0, 3);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <PageHeader
        title="Reports"
        description="Audit-ready data organized by use case. Every report opens to a summary first, then anomalies, then the data."
        actions={<>
          <RangeChip/>
          <button className="btn"><Icon name="copy" size={13}/> Templates</button>
          <button className="btn btn-primary" onClick={() => setShowBuilder(true)}><Icon name="plus" size={13}/> Create custom report</button>
        </>}
      />

      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "220px 1fr 240px", overflow: "hidden" }}>
        {/* LEFT — categories */}
        <aside style={{ borderRight: "1px solid var(--border)", padding: "16px 10px", overflow: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
          <div className="t-micro" style={{ padding: "0 10px 8px" }}>Categories</div>
          {cats.map(c => {
            const count = c.id === "all" ? reports.length : reports.filter(r => r.category === c.id).length;
            const active = cat === c.id;
            return (
              <button key={c.id} onClick={() => setCat(c.id)} style={{
                display: "flex", alignItems: "center", width: "100%", padding: "8px 10px",
                border: "none", borderLeft: `2px solid ${active ? "var(--brand)" : "transparent"}`,
                background: active ? "var(--brand-soft)" : "transparent",
                color: active ? "var(--brand-fg)" : "var(--fg-2)",
                font: `${active ? 600 : 500} 12.5px/1.3 var(--font-sans)`,
                borderRadius: "0 5px 5px 0", cursor: "pointer", textAlign: "left",
              }}>
                <Icon name={CATEGORY_ICONS[c.id] || "file-text"} size={13} color={active ? "var(--brand-fg)" : "var(--fg-3)"}/>
                <span style={{ flex: 1, marginLeft: 8 }}>{c.label}</span>
                <span className="t-tiny" style={{ color: active ? "var(--brand-fg)" : "var(--fg-4)" }}>{count}</span>
              </button>
            );
          })}

          <div style={{ height: 1, background: "var(--border)", margin: "14px 10px 12px" }}/>
          <div className="t-micro" style={{ padding: "0 10px 8px" }}>Recently viewed</div>
          {recents.slice(0, 3).map(r => (
            <a key={r.id} href="#" onClick={e => { e.preventDefault(); onOpen(r); }} style={{
              padding: "5px 12px", color: "var(--fg-2)", font: "500 12px/1.4 var(--font-sans)", textDecoration: "none",
            }}>
              <div style={{ color: "var(--brand-fg)" }}>{r.name}</div>
              <div className="t-tiny" style={{ color: "var(--fg-4)" }}>{r.lastRun}</div>
            </a>
          ))}
        </aside>

        {/* CENTER — list */}
        <div className="scroll-area" style={{ overflow: "auto" }}>
          <div style={{ padding: "14px 24px", display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid var(--border-subtle)" }}>
            <div style={{ position: "relative", flex: 1, maxWidth: 380 }}>
              <Icon name="search" size={13} color="var(--fg-4)" style={{ position: "absolute", left: 10, top: 9 }}/>
              <input className="input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search reports by name or description…" style={{ paddingLeft: 30, height: 32 }}/>
            </div>
            {search && <span className="t-tiny" style={{ color: "var(--fg-3)" }}>{filtered.length} {filtered.length === 1 ? "result" : "results"} for "<span style={{ color: "var(--fg-1)" }}>{search}</span>"</span>}
            <div style={{ flex: 1 }}/>
            <span className="t-tiny" style={{ color: "var(--fg-4)" }}>{filtered.length} reports</span>
          </div>

          {filtered.length === 0 ? (
            <div style={{ padding: 60, textAlign: "center", color: "var(--fg-3)" }}>
              <Icon name="search" size={28} color="var(--fg-5)"/>
              <div style={{ marginTop: 10, font: "500 14px/1.4 var(--font-sans)", color: "var(--fg-2)" }}>No reports match "{search}"</div>
              <button className="btn btn-ghost btn-sm" style={{ marginTop: 10, color: "var(--brand-fg)" }} onClick={() => setSearch("")}>Clear search</button>
            </div>
          ) : grouped ? (
            grouped.map(g => (
              <div key={g.id}>
                <div style={{ padding: "14px 24px 8px", display: "flex", alignItems: "center", gap: 10, background: "var(--bg-surface-2)", borderTop: "1px solid var(--border-subtle)", borderBottom: "1px solid var(--border-subtle)" }}>
                  <div style={{ width: 22, height: 22, borderRadius: 5, background: CATEGORY_BG[g.id], color: CATEGORY_FG[g.id], display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name={CATEGORY_ICONS[g.id]} size={13}/></div>
                  <span style={{ font: "600 12.5px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{g.label}</span>
                  <span className="t-tiny" style={{ color: "var(--fg-4)" }}>· {g.items.length} reports</span>
                </div>
                {g.items.map(r => <ReportRow key={r.id} r={r} onOpen={onOpen} onHistory={setHistoryFor} search={search}/>)}
              </div>
            ))
          ) : (
            <div>{filtered.map(r => <ReportRow key={r.id} r={r} onOpen={onOpen} onHistory={setHistoryFor} search={search}/>)}</div>
          )}
        </div>

        {/* RIGHT — quick actions */}
        <aside style={{ borderLeft: "1px solid var(--border)", padding: "16px 14px", overflow: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="t-micro">Quick actions</div>
          <button className="btn" style={{ width: "100%" }}><Icon name="play" size={12}/> Run all in this category</button>
          <button className="btn btn-ghost" style={{ width: "100%" }}><Icon name="download" size={12}/> Export all as ZIP</button>
          <button className="btn btn-ghost" style={{ width: "100%" }}><Icon name="clock" size={12}/> Schedule all</button>

          <div style={{ height: 1, background: "var(--border)", marginTop: 4 }}/>
          <div className="t-micro">Last exported</div>
          {[
            { name: "Rotation Report.csv", ts: "2h ago" },
            { name: "Server Access.pdf",   ts: "Yesterday" },
          ].map((x, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name="file-text" size={13} color="var(--fg-3)"/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ font: "500 12px/1.3 var(--font-sans)", color: "var(--fg-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{x.name}</div>
                <div className="t-tiny" style={{ color: "var(--fg-4)" }}>{x.ts}</div>
              </div>
              <button className="btn btn-ghost btn-icon btn-sm"><Icon name="download" size={11}/></button>
            </div>
          ))}

          <div style={{ height: 1, background: "var(--border)", marginTop: 4 }}/>
          <div className="t-micro">Compliance due</div>
          <div className="card" style={{ padding: 12, background: "var(--warning-soft)", borderColor: "transparent" }}>
            <div style={{ font: "600 12px/1.4 var(--font-sans)", color: "var(--warning-fg)" }}>PCI Summary due in 3 days</div>
            <div className="t-tiny" style={{ color: "var(--warning-fg)", opacity: 0.9, marginTop: 4 }}>Q2 2026 evidence package</div>
            <a href="#" onClick={(e) => { e.preventDefault(); const r = reports.find(x => x.id === "r-pci"); r && onOpen(r); }} style={{ display: "inline-block", marginTop: 8, font: "500 12px/1 var(--font-sans)", color: "var(--warning-fg)" }}>Run now →</a>
          </div>
        </aside>
      </div>

      {historyFor && <RunHistoryPanel report={historyFor} onClose={() => setHistoryFor(null)}/>}
    </div>
  );
};

const CATEGORY_ICONS = { all: "file-text", access: "sessions", credentials: "lock", discovery: "discovery", compliance: "shield-check", system: "settings", custom: "edit" };
const CATEGORY_BG = { access: "var(--brand-soft)", credentials: "var(--info-soft)", discovery: "var(--warning-soft)", compliance: "var(--success-soft)", system: "var(--bg-surface-2)", custom: "var(--brand-soft)" };
const CATEGORY_FG = { access: "var(--brand-fg)", credentials: "var(--info-fg)", discovery: "var(--warning-fg)", compliance: "var(--success-fg)", system: "var(--fg-2)", custom: "var(--brand-fg)" };

const highlight = (text, q) => {
  if (!q) return text;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return text;
  return <>{text.slice(0, i)}<mark style={{ background: "var(--warning-soft)", color: "var(--warning-fg)", padding: "0 2px", borderRadius: 2 }}>{text.slice(i, i + q.length)}</mark>{text.slice(i + q.length)}</>;
};

const ReportRow = ({ r, onOpen, onHistory, search }) => {
  const isStale = r.lastRun && r.lastRun !== "Never" && /day|week|month/.test(r.lastRun);
  const neverRun = r.lastRun === "Never" || !r.lastRun;
  return (
    <div
      onClick={() => onOpen(r)}
      style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 24px", borderBottom: "1px solid var(--border-subtle)", cursor: "pointer", transition: "background 100ms" }}
      onMouseEnter={e => e.currentTarget.style.background = "var(--bg-surface-hover)"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
    >
      <div style={{ width: 28, height: 28, borderRadius: 6, background: CATEGORY_BG[r.category], color: CATEGORY_FG[r.category], display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Icon name={CATEGORY_ICONS[r.category]} size={14}/></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ font: "600 13.5px/1.3 var(--font-sans)", color: "var(--brand-fg)" }}>{highlight(r.name, search)}</div>
        <div style={{ font: "400 12px/1.4 var(--font-sans)", color: "var(--fg-3)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={r.desc}>{r.desc}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, minWidth: 150 }}>
        <span className="t-tiny" style={{ color: neverRun ? "var(--fg-4)" : "var(--fg-2)", display: "inline-flex", alignItems: "center", gap: 6 }}>
          {neverRun ? <><span className="dot"/> Never run</>
           : isStale ? <><span className="dot dot-warning"/> {r.lastRun}</>
           : <><span className="dot dot-success"/> Last run {r.lastRun}</>}
        </span>
        {r.scheduled && <span className="badge badge-info"><Icon name="clock" size={10}/> {r.scheduled}</span>}
      </div>
      <div onClick={e => e.stopPropagation()} style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <button className="btn btn-sm btn-primary" onClick={() => onOpen(r)}>Run</button>
        <RowMenu items={[
          { label: "Run now",                icon: "play",      onClick: () => onOpen(r) },
          { label: "Schedule",                icon: "clock",     onClick: () => {} },
          { label: "Export last run (CSV)",   icon: "download",  onClick: () => {} },
          { label: "Export last run (PDF)",   icon: "file-text", onClick: () => {} },
          { label: "Share",                   icon: "share",     onClick: () => {} },
          { label: "Add to evidence bundle",  icon: "shield-check", onClick: () => {} },
          { label: "View run history",        icon: "history",   onClick: () => onHistory(r) },
        ]}/>
      </div>
    </div>
  );
};

const RangeChip = () => (
  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "0 10px", height: 32, border: "1px solid var(--border)", borderRadius: "var(--radius-md)", background: "var(--bg-surface)", font: "500 12.5px/1 var(--font-sans)", color: "var(--fg-2)", cursor: "pointer" }}>
    <Icon name="calendar" size={12} color="var(--fg-3)"/>
    May 12 – 18, 2026
    <Icon name="chevron-down" size={11} color="var(--fg-4)"/>
  </div>
);

// =============================================================
// REPORT VIEW — full page · Summary → Anomalies → Table → Trend
// =============================================================

const ReportView = ({ report, onClose, onOpenSession }) => {
  const [state, setState] = React.useState("default"); // default | empty | loading | error | clear
  const [showTrend, setShowTrend] = React.useState(false);
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [selected, setSelected] = React.useState(new Set());
  const [anomaliesOnly, setAnomaliesOnly] = React.useState(false);
  const [showExport, setShowExport] = React.useState(false);
  const [showShare, setShowShare] = React.useState(false);
  const [showHistory, setShowHistory] = React.useState(false);
  const [activeFilters, setActiveFilters] = React.useState([]);
  const [customRange, setCustomRange] = React.useState(false);

  const layout = REPORT_LAYOUTS[report.id] || REPORT_LAYOUTS["r-server-access"];
  const isEmpty = state === "empty";
  const isLoading = state === "loading";
  const isError = state === "error";
  const isClear = state === "clear";
  const anomalies = (!isEmpty && !isClear) ? layout.anomalies : [];
  const rows = isEmpty ? [] : (anomaliesOnly ? layout.rows.filter(r => r.flagged) : layout.rows);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "16px 24px 0", borderBottom: "1px solid var(--border)" }}>
        <div style={{ font: "400 12px/1 var(--font-sans)", color: "var(--fg-4)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
          <a href="#" onClick={e => { e.preventDefault(); onClose(); }} style={{ color: "var(--brand-fg)" }}>Reports</a>
          <Icon name="chevron-right" size={10}/>
          <span>{report.name}</span>
        </div>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
          <div style={{ width: 4, alignSelf: "stretch", background: CATEGORY_FG[report.category], borderRadius: 2 }}/>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h1 className="h-title">{report.name}</h1>
              <span className="badge" style={{ background: CATEGORY_BG[report.category], color: CATEGORY_FG[report.category], borderColor: "transparent" }}>{(window.REPORT_CATEGORIES || []).find(c => c.id === report.category)?.label || report.category}</span>
            </div>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--fg-3)" }}>{report.desc}</p>
            <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 14, font: "400 12px/1.4 var(--font-sans)", color: "var(--fg-4)" }}>
              {!isEmpty && !isLoading && <span>Last run {report.lastRun || "Today 09:00"} by {report.lastRunBy || "Arjun Bansal"}</span>}
              {isError && <span style={{ color: "var(--danger-fg)" }}>· Showing previous data — may be stale</span>}
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => { setState("loading"); setTimeout(() => setState("default"), 1500); }}><Icon name="play" size={11}/> Run report</button>
          <button className="btn"><Icon name="clock" size={12}/> Schedule</button>
          <button className="btn" onClick={() => setShowExport(true)}><Icon name="download" size={12}/> Export <Icon name="chevron-down" size={10}/></button>
          <button className="btn btn-ghost btn-icon" title="Share" onClick={() => setShowShare(true)}><Icon name="share" size={13}/></button>
          <button className="btn btn-ghost btn-icon" title="Add to evidence bundle"><Icon name="shield-check" size={13}/></button>
        </div>

        {/* Range + state toggle */}
        <div style={{ marginTop: 12, paddingBottom: 12, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "0 10px", height: 28, border: `1px solid ${customRange ? "var(--warning-fg)" : "var(--border)"}`, borderRadius: "var(--radius-md)", background: customRange ? "var(--warning-soft)" : "var(--bg-surface)", font: "500 12px/1 var(--font-sans)", color: customRange ? "var(--warning-fg)" : "var(--fg-2)" }}>
            <Icon name="calendar" size={11}/> May 12 – 18, 2026 {customRange && "(custom)"}
            <Icon name="chevron-down" size={10}/>
          </div>
          {customRange && <a href="#" onClick={e => { e.preventDefault(); setCustomRange(false); }} style={{ font: "500 12px/1 var(--font-sans)", color: "var(--brand-fg)" }}>Reset to global</a>}
          <FilterChip label="Status" value="Any" muted/>
          <FilterChip label="User" value="Any" muted/>
          <FilterChip label="Resource" value="Any" muted/>
          {activeFilters.map((f, i) => (
            <FilterChip key={i} label={f.label} value={f.value} active onRemove={() => setActiveFilters(p => p.filter((_, j) => j !== i))}/>
          ))}
          <button className="btn btn-ghost btn-sm" onClick={() => setFiltersOpen(o => !o)}><Icon name="filter" size={11}/> {filtersOpen ? "Hide filters" : "More filters"}</button>

          <div style={{ flex: 1 }}/>
          {/* Demo state cycler */}
          <button className="btn btn-ghost btn-sm" onClick={() => {
            const order = ["default","clear","empty","loading","error"];
            setState(order[(order.indexOf(state) + 1) % order.length]);
          }} title="Cycle state (demo)">State: {state}</button>
        </div>
        {isLoading && <div style={{ height: 2, background: "var(--brand-soft)", overflow: "hidden", position: "relative" }}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent, var(--brand) 40%, var(--brand) 60%, transparent)", animation: "loadbar 1.2s linear infinite" }}/>
        </div>}
      </div>

      <div className="scroll-area" style={{ flex: 1, overflow: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
        {isError && (
          <div className="card" style={{ padding: 14, display: "flex", alignItems: "center", gap: 10, background: "var(--danger-soft)", borderColor: "transparent" }}>
            <Icon name="alert-triangle" size={16} color="var(--danger-fg)"/>
            <div style={{ flex: 1, color: "var(--danger-fg)", font: "500 13px/1.4 var(--font-sans)" }}>Report generation failed — query timeout after 60s</div>
            <button className="btn btn-sm" onClick={() => setState("default")}><Icon name="refresh" size={12}/> Retry</button>
          </div>
        )}

        {/* SECTION 1 — Summary */}
        <div>
          <div className="t-micro" style={{ marginBottom: 10 }}>Summary</div>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${layout.summary.length}, 1fr)`, gap: 12 }}>
            {isLoading ? layout.summary.map((_, i) => <SkelStat key={i}/>) :
             isEmpty ? layout.summary.map((s, i) => <StatCard key={i} icon={s.icon} label={s.label} value="0" change="No data for this period" tone="muted"/>) :
             layout.summary.map((s, i) => {
               const tone = isClear && s.tone === "danger" ? "success" : isClear && s.tone === "warning" ? "success" : s.tone;
               const value = isClear && (s.tone === "danger" || s.tone === "warning") ? "0" : s.value;
               const change = isClear && (s.tone === "danger" || s.tone === "warning") ? "All clear" : s.change;
               return <StatCard key={i} icon={s.icon} label={s.label} value={value} change={change} tone={tone}/>;
             })}
          </div>
        </div>

        {/* SECTION 2 — Anomalies (only if any) */}
        {!isEmpty && !isClear && !isLoading && anomalies.length > 0 && (
          <div className="card">
            <div className="card-header">
              <Icon name="alert-triangle" size={15} color="var(--danger-fg)"/>
              <span className="h-card">Anomalies detected</span>
              <span className="badge badge-danger">{anomalies.length}</span>
              <div style={{ flex: 1 }}/>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 6, font: "500 12px/1 var(--font-sans)", color: "var(--fg-2)", cursor: "pointer" }}>
                <input type="checkbox" checked={anomaliesOnly} onChange={e => setAnomaliesOnly(e.target.checked)} style={{ accentColor: "var(--brand)" }}/>
                View only anomalies in table
              </label>
            </div>
            <table className="table">
              <thead><tr><th style={{ width: 110 }}>Risk</th><th>Event</th><th>Context</th><th style={{ width: 110 }}>When</th><th style={{ width: 200, textAlign: "right" }}></th></tr></thead>
              <tbody>
                {anomalies.map((a, i) => (
                  <tr key={i}>
                    <td><RiskBadge score={a.score} level={a.level}/></td>
                    <td style={{ color: "var(--fg-1)", fontWeight: 500 }}>{a.desc}</td>
                    <td>
                      <div className="row">
                        {a.user && <><Avatar name={a.user} size={20}/><span style={{ fontSize: 12.5 }}>{a.user}</span></>}
                        {a.resource && <><Icon name="arrow-right" size={11} color="var(--fg-4)"/><span className="t-mono" style={{ fontSize: 12, color: "var(--fg-2)" }}>{a.resource}</span></>}
                      </div>
                    </td>
                    <td className="t-tiny" style={{ color: "var(--fg-4)" }}>{a.ts}</td>
                    <td style={{ textAlign: "right" }}>
                      <button className="btn btn-sm btn-primary">Investigate</button>
                      <button className="btn btn-sm btn-ghost" style={{ marginLeft: 4 }}>Mark reviewed</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* SECTION 3 — Data table */}
        <div className="card">
          <div className="card-header">
            <span className="h-card">Report data</span>
            <span className="badge">{isEmpty ? 0 : rows.length} {rows.length === 1 ? "row" : "rows"}</span>
            <div style={{ flex: 1 }}/>
            <div style={{ position: "relative", maxWidth: 240 }}>
              <Icon name="search" size={13} color="var(--fg-4)" style={{ position: "absolute", left: 10, top: 8 }}/>
              <input className="input" placeholder={`Search ${report.name.toLowerCase()}…`} style={{ paddingLeft: 30, height: 28, fontSize: 12 }}/>
            </div>
            <button className="btn btn-ghost btn-sm"><Icon name="columns" size={11}/> Columns</button>
          </div>

          {selected.size > 0 && (
            <div style={{ padding: "10px 20px", display: "flex", alignItems: "center", gap: 8, background: "var(--brand-soft)", borderBottom: "1px solid var(--border)" }}>
              <span style={{ font: "600 12.5px/1 var(--font-sans)", color: "var(--brand-fg)" }}>{selected.size} selected</span>
              <button className="btn btn-sm">Export selected</button>
              <button className="btn btn-sm">Add to evidence bundle</button>
              <button className="btn btn-sm">Flag for review</button>
              <div style={{ flex: 1 }}/>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelected(new Set())} style={{ color: "var(--brand-fg)" }}>Clear</button>
            </div>
          )}

          {isLoading ? (
            <table className="table"><thead><tr>{layout.cols.map((c, i) => <th key={i}>{c.label}</th>)}</tr></thead>
              <tbody>{[1,2,3,4,5].map(i => <tr key={i}>{layout.cols.map((_, j) => <td key={j}><div style={{ height: 12, background: "var(--bg-surface-2)", borderRadius: 4, width: `${50 + (j * 13) % 40}%` }}/></td>)}</tr>)}</tbody>
            </table>
          ) : isEmpty ? (
            <div style={{ padding: 60, textAlign: "center" }}>
              <Icon name="inbox" size={32} color="var(--fg-5)"/>
              <div style={{ marginTop: 10, font: "500 13.5px/1.4 var(--font-sans)", color: "var(--fg-2)" }}>No data for this period</div>
              <div className="t-tiny" style={{ color: "var(--fg-4)", marginTop: 4 }}>Adjust the date range or run the report to fetch fresh data.</div>
              <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={() => { setState("loading"); setTimeout(() => setState("default"), 1500); }}><Icon name="play" size={11}/> Run report</button>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 32 }}><input type="checkbox" checked={selected.size === rows.length && rows.length > 0} onChange={e => setSelected(e.target.checked ? new Set(rows.map(r => r.id)) : new Set())}/></th>
                  {layout.cols.map((c, i) => <th key={i} style={c.width ? { width: c.width } : null}>{c.label}</th>)}
                  <th style={{ width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id} onClick={() => report.id === "r-server-access" && onOpenSession && r.session && onOpenSession(r.session)}
                    style={{
                      cursor: report.id === "r-server-access" && r.session ? "pointer" : "default",
                      ...(r.flagged === "Critical" || r.flagged === "High" ? { boxShadow: "inset 3px 0 var(--danger-fg)" }
                       : r.flagged === "Medium" ? { boxShadow: "inset 3px 0 var(--warning-fg)" } : {}),
                    }}>
                    <td onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={selected.has(r.id)} onChange={() => setSelected(p => { const n = new Set(p); n.has(r.id) ? n.delete(r.id) : n.add(r.id); return n; })}/>
                    </td>
                    {layout.cols.map((c, i) => <td key={i}>{c.render ? c.render(r) : r[c.key]}</td>)}
                    <td onClick={e => e.stopPropagation()} style={{ textAlign: "right" }}>
                      <RowMenu items={[
                        { label: "View details",         icon: "eye",          onClick: () => {} },
                        { label: "Add to evidence",      icon: "shield-check", onClick: () => {} },
                        { label: "Flag for review",      icon: "alert-circle", onClick: () => {} },
                        { label: "Mark reviewed",        icon: "check",        onClick: () => {} },
                      ]}/>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {!isEmpty && !isLoading && (
            <div className="card-footer" style={{ background: "var(--bg-surface-2)" }}>
              <span className="t-tiny">{rows.length} results · Showing 1–{rows.length} of {layout.rows.length}</span>
              <div style={{ flex: 1 }}/>
              <span className="t-tiny" style={{ color: "var(--fg-3)" }}>Rows per page</span>
              <select className="select" style={{ height: 26, width: 64, fontSize: 12, padding: "0 6px" }}><option>25</option><option>50</option><option>100</option></select>
              <button className="btn btn-ghost btn-icon btn-sm" disabled><Icon name="chevron-left" size={12}/></button>
              <span className="t-tiny" style={{ minWidth: 24, textAlign: "center" }}>1</span>
              <button className="btn btn-ghost btn-icon btn-sm" disabled><Icon name="chevron-right" size={12}/></button>
            </div>
          )}
        </div>

        {/* Below table — export + trend */}
        {!isEmpty && !isLoading && <div className="row" style={{ gap: 16, alignItems: "center", padding: "0 4px" }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowTrend(o => !o)} style={{ color: "var(--brand-fg)" }}>
            <Icon name={showTrend ? "chevron-down" : "chevron-right"} size={11}/> {showTrend ? "Hide trend data" : "Show trend data"}
          </button>
          <div style={{ flex: 1 }}/>
          <span className="t-tiny" style={{ color: "var(--fg-4)" }}>Generated {report.lastRun || "Today 09:00"} · Data period: May 12 – 18, 2026</span>
          <button className="btn btn-sm" onClick={() => setShowExport(true)}><Icon name="download" size={11}/> Export full report</button>
        </div>}

        {/* SECTION 4 — Trend chart */}
        {showTrend && !isEmpty && !isLoading && (
          <div className="card">
            <div className="card-header">
              <span className="h-card">Trend · {layout.trendLabel}</span>
              <div style={{ flex: 1 }}/>
              <button className="btn btn-ghost btn-sm"><Icon name="download" size={11}/></button>
              <button className="btn btn-ghost btn-sm">View as table</button>
            </div>
            <div style={{ padding: 20 }}>
              <TrendChart bars={layout.trend}/>
            </div>
          </div>
        )}
      </div>

      {showExport && <ExportPanel report={report} onClose={() => setShowExport(false)}/>}
      {showShare && <SharePanel report={report} onClose={() => setShowShare(false)}/>}
      {showHistory && <RunHistoryPanel report={report} onClose={() => setShowHistory(false)}/>}
    </div>
  );
};

// =============================================================
// Filter chips
// =============================================================
const FilterChip = ({ label, value, active, muted, onRemove }) => (
  <button style={{
    display: "inline-flex", alignItems: "center", gap: 6, padding: "0 10px", height: 28,
    border: `1px solid ${active ? "var(--brand)" : "var(--border)"}`, borderRadius: "var(--radius-md)",
    background: active ? "var(--brand-soft)" : "var(--bg-surface)",
    color: active ? "var(--brand-fg)" : (muted ? "var(--fg-2)" : "var(--fg-1)"),
    font: `500 12px/1 var(--font-sans)`, cursor: "pointer",
  }}>
    <span style={{ color: active ? "var(--brand-fg)" : "var(--fg-4)" }}>{label}:</span>
    <span style={{ fontWeight: active ? 600 : 500 }}>{value}</span>
    {onRemove ? <Icon name="x" size={11} onClick={(e) => { e.stopPropagation(); onRemove(); }}/> : <Icon name="chevron-down" size={10} color="var(--fg-4)"/>}
  </button>
);

// =============================================================
// Risk badge
// =============================================================
const RiskBadge = ({ score, level }) =>
  level === "Critical" ? <span className="badge badge-danger" style={{ fontWeight: 700 }}>{score} Critical</span>
  : level === "High"   ? <span className="badge badge-warning">{score} High</span>
  : level === "Medium" ? <span className="badge badge-info">{score} Medium</span>
  : <span className="badge">{score} Low</span>;

// =============================================================
// Trend chart
// =============================================================
const TrendChart = ({ bars }) => {
  const max = Math.max(...bars.map(b => (b.values || [b.value]).reduce((a, x) => a + x, 0))) * 1.15;
  const colors = ["var(--success)","var(--danger)","var(--warning)","var(--info)"];
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 200 }}>
      {bars.map((b, i) => {
        const vals = b.values || [b.value];
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{ width: "100%", display: "flex", flexDirection: "column-reverse", flex: 1, borderRadius: "3px 3px 0 0", overflow: "hidden" }}>
              {vals.map((v, j) => v > 0 && <div key={j} title={`${b.label}: ${v}`} style={{ height: `${(v / max) * 100}%`, background: colors[j] || "var(--brand)" }}/>)}
            </div>
            <span className="t-tiny" style={{ color: "var(--fg-4)" }}>{b.label}</span>
          </div>
        );
      })}
    </div>
  );
};

// =============================================================
// Side panels: Export, Share, Run history
// =============================================================
const Panel = ({ title, onClose, children, footer, width = 480 }) => (
  <>
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 90 }}/>
    <aside style={{ position: "fixed", top: 0, right: 0, bottom: 0, width, background: "var(--bg-panel)", borderLeft: "1px solid var(--border)", display: "flex", flexDirection: "column", zIndex: 91, boxShadow: "var(--shadow-lg, -8px 0 24px rgba(0,0,0,0.08))" }}>
      <div className="card-header" style={{ borderBottom: "1px solid var(--border)" }}>
        <span className="h-card">{title}</span>
        <div style={{ flex: 1 }}/>
        <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><Icon name="x" size={14}/></button>
      </div>
      <div className="scroll-area" style={{ flex: 1, overflow: "auto", padding: 20 }}>{children}</div>
      {footer && <div className="card-footer">{footer}</div>}
    </aside>
  </>
);

const ExportPanel = ({ report, onClose }) => {
  const [opts, setOpts] = React.useState({ cover: true, summary: true, anomalies: true, table: true, trend: false, appendix: false, ts: true, branding: true });
  const [note, setNote] = React.useState("");
  const [phase, setPhase] = React.useState("config"); // config | exporting | done
  const set = (k, v) => setOpts(o => ({ ...o, [k]: v }));

  if (phase === "exporting") return (
    <Panel title={`Export ${report.name}`} onClose={onClose}>
      <div style={{ padding: 40, textAlign: "center" }}>
        <Spinner size={28} color="var(--brand)"/>
        <div style={{ marginTop: 14, font: "500 13.5px/1.4 var(--font-sans)", color: "var(--fg-1)" }}>Generating PDF…</div>
        <div className="t-tiny" style={{ color: "var(--fg-4)", marginTop: 4 }}>Compositing summary, anomalies, and {opts.table ? "data table" : "report"}</div>
      </div>
    </Panel>
  );
  if (phase === "done") return (
    <Panel title={`Export ${report.name}`} onClose={onClose}>
      <div className="card" style={{ padding: 14, display: "flex", alignItems: "center", gap: 10, background: "var(--success-soft)", borderColor: "transparent" }}>
        <Icon name="check-circle" size={18} color="var(--success-fg)"/>
        <div style={{ flex: 1, color: "var(--success-fg)", font: "500 13px/1.4 var(--font-sans)" }}>PDF exported · downloaded</div>
        <button className="btn btn-sm"><Icon name="download" size={11}/> Download again</button>
      </div>
    </Panel>
  );

  return (
    <Panel title={`Export as PDF — ${report.name}`} onClose={onClose}
      footer={<><button className="btn" onClick={onClose}>Cancel</button><div style={{ flex: 1 }}/><button className="btn btn-primary" onClick={() => { setPhase("exporting"); setTimeout(() => setPhase("done"), 1800); }}><Icon name="download" size={11}/> Export PDF</button></>}>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div>
          <div className="t-micro" style={{ marginBottom: 8 }}>Include sections</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <Check on={opts.cover} onChange={v => set("cover", v)} label="Cover page" sub="Org, report name, date range, generated by/on"/>
            <Check on={opts.summary} onChange={v => set("summary", v)} label="Summary metrics"/>
            <Check on={opts.anomalies} onChange={v => set("anomalies", v)} label="Anomaly alerts" sub="Hidden automatically if no anomalies"/>
            <Check on={opts.table} onChange={v => set("table", v)} label="Full data table"/>
            <Check on={opts.trend} onChange={v => set("trend", v)} label="Trend chart" sub="Optional — adds 1 page"/>
            <Check on={opts.appendix} onChange={v => set("appendix", v)} label="Appendix" sub="Filters applied + column definitions"/>
          </div>
        </div>
        <div>
          <div className="t-micro" style={{ marginBottom: 8 }}>Cover page</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <Check on={opts.ts}       onChange={v => set("ts", v)}       label="Include generation timestamp"/>
            <Check on={opts.branding} onChange={v => set("branding", v)} label="miniOrange PAM logo + org name"/>
          </div>
        </div>
        <div>
          <label className="field-label">Recipient note (optional)</label>
          <textarea className="textarea" value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Prepared for Q2 2026 PCI audit review" style={{ marginTop: 4 }}/>
          <div className="field-help" style={{ marginTop: 4 }}>Appears on the cover page</div>
        </div>
      </div>
    </Panel>
  );
};

const Check = ({ on, onChange, label, sub }) => (
  <label style={{ display: "flex", gap: 10, padding: "8px 10px", border: "1px solid var(--border)", borderRadius: 6, cursor: "pointer", background: on ? "var(--brand-soft)" : "var(--bg-surface)" }}>
    <input type="checkbox" checked={on} onChange={e => onChange(e.target.checked)} style={{ marginTop: 2, accentColor: "var(--brand)" }}/>
    <div style={{ flex: 1 }}>
      <div style={{ font: "500 13px/1.3 var(--font-sans)", color: on ? "var(--brand-fg)" : "var(--fg-1)" }}>{label}</div>
      {sub && <div className="t-tiny" style={{ color: on ? "var(--brand-fg)" : "var(--fg-4)", opacity: 0.8, marginTop: 2 }}>{sub}</div>}
    </div>
  </label>
);

const SharePanel = ({ report, onClose }) => {
  const [method, setMethod] = React.useState("snapshot"); // snapshot | link
  const [emails, setEmails] = React.useState(["compliance@northwind.com"]);
  const [emailInput, setEmailInput] = React.useState("");
  const [fmt, setFmt] = React.useState("pdf");
  const [expiry, setExpiry] = React.useState("7d");
  const [access, setAccess] = React.useState("pam");
  const [link, setLink] = React.useState(null);

  return (
    <Panel title={`Share — ${report.name}`} onClose={onClose}>
      <div className="row" style={{ marginBottom: 16, padding: 3, background: "var(--bg-surface-2)", borderRadius: 6, gap: 0 }}>
        {[["snapshot","Share snapshot"],["link","Share live link"]].map(([k, l]) => (
          <button key={k} onClick={() => setMethod(k)} style={{
            flex: 1, padding: "6px 10px", border: "none", borderRadius: 4,
            background: method === k ? "var(--bg-surface)" : "transparent",
            boxShadow: method === k ? "var(--shadow-xs)" : "none",
            font: `${method === k ? 600 : 500} 12.5px/1 var(--font-sans)`,
            color: method === k ? "var(--fg-1)" : "var(--fg-3)", cursor: "pointer",
          }}>{l}</button>
        ))}
      </div>

      {method === "snapshot" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <p className="t-small" style={{ color: "var(--fg-3)", margin: 0 }}>Export current data and email to recipients. They get a frozen snapshot of this report.</p>
          <div>
            <label className="field-label">Recipients</label>
            <div className="input" style={{ height: "auto", minHeight: 34, display: "flex", flexWrap: "wrap", gap: 6, padding: 6, marginTop: 4 }}>
              {emails.map((e, i) => <span key={i} className="badge badge-brand">{e}<Icon name="x" size={10} onClick={() => setEmails(p => p.filter((_, j) => j !== i))} style={{ marginLeft: 4, cursor: "pointer" }}/></span>)}
              <input value={emailInput} onChange={e => setEmailInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && emailInput) { setEmails(p => [...p, emailInput]); setEmailInput(""); }}}
                placeholder={emails.length ? "Add another…" : "name@example.com"}
                style={{ border: "none", outline: "none", flex: 1, minWidth: 100, font: "400 13px/1 var(--font-sans)", background: "transparent" }}/>
            </div>
          </div>
          <div>
            <label className="field-label">Format</label>
            <div className="row" style={{ marginTop: 4, padding: 3, background: "var(--bg-surface-2)", borderRadius: 6, gap: 0 }}>
              {[["csv","CSV"],["pdf","PDF"],["both","Both"]].map(([k, l]) => (
                <button key={k} onClick={() => setFmt(k)} style={{ flex: 1, padding: "6px 10px", border: "none", borderRadius: 4, background: fmt === k ? "var(--bg-surface)" : "transparent", boxShadow: fmt === k ? "var(--shadow-xs)" : "none", font: `${fmt === k ? 600 : 500} 12.5px/1 var(--font-sans)`, color: fmt === k ? "var(--fg-1)" : "var(--fg-3)", cursor: "pointer" }}>{l}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="field-label">Note (optional)</label>
            <textarea className="textarea" placeholder="Add a note for the recipients…" style={{ marginTop: 4 }}/>
          </div>
          <button className="btn btn-primary" style={{ width: "100%" }}><Icon name="send" size={12}/> Send now</button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <p className="t-small" style={{ color: "var(--fg-3)", margin: 0 }}>Generate a link to live report data. Recipients see fresh data each time they open the link — view only.</p>
          <div>
            <label className="field-label">Link expires</label>
            <div className="row" style={{ marginTop: 4, padding: 3, background: "var(--bg-surface-2)", borderRadius: 6, gap: 0 }}>
              {[["1d","24 hours"],["7d","7 days"],["30d","30 days"]].map(([k, l]) => (
                <button key={k} onClick={() => setExpiry(k)} style={{ flex: 1, padding: "6px 10px", border: "none", borderRadius: 4, background: expiry === k ? "var(--bg-surface)" : "transparent", boxShadow: expiry === k ? "var(--shadow-xs)" : "none", font: `${expiry === k ? 600 : 500} 12.5px/1 var(--font-sans)`, color: expiry === k ? "var(--fg-1)" : "var(--fg-3)", cursor: "pointer" }}>{l}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="field-label">Access</label>
            <div className="row" style={{ marginTop: 4, padding: 3, background: "var(--bg-surface-2)", borderRadius: 6, gap: 0 }}>
              {[["pam","PAM users only"],["anyone","Anyone with the link"]].map(([k, l]) => (
                <button key={k} onClick={() => setAccess(k)} style={{ flex: 1, padding: "6px 10px", border: "none", borderRadius: 4, background: access === k ? "var(--bg-surface)" : "transparent", boxShadow: access === k ? "var(--shadow-xs)" : "none", font: `${access === k ? 600 : 500} 12.5px/1 var(--font-sans)`, color: access === k ? "var(--fg-1)" : "var(--fg-3)", cursor: "pointer" }}>{l}</button>
              ))}
            </div>
          </div>
          {link ? (
            <div>
              <label className="field-label">Live link</label>
              <div className="input" style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 8 }}>
                <span className="t-mono" style={{ flex: 1, fontSize: 12, color: "var(--brand-fg)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{link}</span>
                <button className="btn btn-ghost btn-icon btn-sm"><Icon name="copy" size={12}/></button>
              </div>
              <div className="t-tiny" style={{ color: "var(--fg-4)", marginTop: 4 }}>Expires {expiry === "1d" ? "in 24 hours" : expiry === "7d" ? "May 25, 2026" : "Jun 17, 2026"} · {access === "pam" ? "PAM users only" : "Anyone with link"}</div>
            </div>
          ) : (
            <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => setLink(`https://pam.northwind.com/audit/r/${report.id}/${Math.random().toString(36).slice(2, 10)}`)}><Icon name="link" size={12}/> Generate link</button>
          )}
          {link && <button className="btn btn-ghost" style={{ color: "var(--danger-fg)" }} onClick={() => setLink(null)}>Revoke this link</button>}
        </div>
      )}
    </Panel>
  );
};

const RunHistoryPanel = ({ report, onClose }) => (
  <Panel title={`${report.name} · Run history`} onClose={onClose} width={620}>
    <table className="table">
      <thead><tr><th>When</th><th>Run by</th><th>Range</th><th>Duration</th><th>Rows</th><th>Status</th><th></th></tr></thead>
      <tbody>
        {[
          { when: "Today 09:00", by: "Scheduled",     range: "May 12–18", dur: "2.4s",  rows: 126, status: "ok" },
          { when: "Yesterday 09:00", by: "Scheduled", range: "May 11–17", dur: "2.1s",  rows: 118, status: "ok" },
          { when: "May 16, 15:42", by: "Arjun Bansal", range: "May 1–16", dur: "4.8s",  rows: 412, status: "exported" },
          { when: "May 15, 09:00", by: "Scheduled",   range: "May 8–14",  dur: "—",    rows: 0,   status: "failed" },
          { when: "May 14, 09:00", by: "Scheduled",   range: "May 7–13",  dur: "2.2s", rows: 104, status: "ok" },
        ].map((h, i) => (
          <tr key={i}>
            <td className="t-mono" style={{ color: "var(--fg-2)" }}>{h.when}</td>
            <td>{h.by === "Scheduled" ? <span className="badge badge-info"><Icon name="clock" size={10}/> Scheduled</span> : <div className="row"><Avatar name={h.by} size={18}/>{h.by}</div>}</td>
            <td className="t-tiny" style={{ color: "var(--fg-3)" }}>{h.range}</td>
            <td className="t-mono" style={{ color: "var(--fg-3)" }}>{h.dur}</td>
            <td className="t-mono" style={{ color: "var(--fg-2)" }}>{h.rows}</td>
            <td>{h.status === "ok" ? <span className="badge badge-success"><span className="dot dot-success"/> OK</span>
                : h.status === "exported" ? <span className="badge badge-brand"><Icon name="download" size={10}/> Exported</span>
                : <span className="badge badge-danger"><span className="dot dot-danger"/> Failed</span>}</td>
            <td>{h.status === "exported" ? <button className="btn btn-ghost btn-sm"><Icon name="download" size={11}/></button> : <button className="btn btn-ghost btn-sm">Run again</button>}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </Panel>
);

// =============================================================
// CUSTOM REPORT BUILDER — 4-step full page
// =============================================================
const CustomReportBuilder = ({ onClose, onSave }) => {
  const [step, setStep] = React.useState(1);
  const [data, setData] = React.useState({
    name: "", description: "", category: "custom", base: "sessions", dateBehavior: "global", rollWindow: 7,
    fields: ["user","resource","started","duration","commands","status","risk"],
    filters: [],
    columnConfig: {},
    highlights: [],
  });

  const set = (k, v) => setData(d => ({ ...d, [k]: v }));
  const canNext =
    step === 1 ? data.name.trim() && data.base
    : step === 2 ? data.fields.length > 0
    : true;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <PageHeader
        title="Create custom report"
        description="Build a report tailored to your audit workflow. Save as draft or publish for the team."
        actions={<><button className="btn" onClick={onClose}><Icon name="x" size={12}/> Cancel</button></>}
      />
      <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 6 }}>
        {[
          { n: 1, l: "Define" },
          { n: 2, l: "Select data" },
          { n: 3, l: "Configure columns" },
          { n: 4, l: "Preview & save" },
        ].map((s, i) => (
          <React.Fragment key={s.n}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: step >= s.n ? "var(--brand)" : "var(--bg-surface-2)", color: step >= s.n ? "#fff" : "var(--fg-3)", display: "flex", alignItems: "center", justifyContent: "center", font: "600 11px/1 var(--font-sans)" }}>{step > s.n ? <Icon name="check" size={11}/> : s.n}</div>
              <span style={{ font: `${step === s.n ? 600 : 500} 13px/1 var(--font-sans)`, color: step === s.n ? "var(--fg-1)" : "var(--fg-3)" }}>{s.l}</span>
            </div>
            {i < 3 && <div style={{ flex: 1, height: 1, background: step > s.n ? "var(--brand)" : "var(--border)", margin: "0 12px" }}/>}
          </React.Fragment>
        ))}
      </div>

      <div className="scroll-area" style={{ flex: 1, overflow: "auto", padding: 24 }}>
        <div style={{ maxWidth: 880, margin: "0 auto" }}>
          {step === 1 && <BuilderStep1 data={data} set={set}/>}
          {step === 2 && <BuilderStep2 data={data} set={set}/>}
          {step === 3 && <BuilderStep3 data={data} set={set}/>}
          {step === 4 && <BuilderStep4 data={data}/>}
        </div>
      </div>

      <div className="card-footer" style={{ borderTop: "1px solid var(--border)", padding: "12px 24px" }}>
        {step > 1 ? <button className="btn" onClick={() => setStep(s => s - 1)}><Icon name="chevron-left" size={11}/> Back</button> : <button className="btn" onClick={onClose}>Cancel</button>}
        <div style={{ flex: 1 }}/>
        {step === 4 && <button className="btn" style={{ marginRight: 8 }}>Save as draft</button>}
        {step < 4
          ? <button className="btn btn-primary" disabled={!canNext} onClick={() => setStep(s => s + 1)}>Next <Icon name="chevron-right" size={11}/></button>
          : <button className="btn btn-primary" onClick={() => onSave({ id: "r-custom-" + Date.now(), name: data.name, category: data.category, desc: data.description, lastRun: "Just now", lastRunBy: "Arjun Bansal", scheduled: null })}>Save and run report</button>}
      </div>
    </div>
  );
};

const BuilderStep1 = ({ data, set }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
    <div>
      <label className="field-label">Report name <span className="req">*</span></label>
      <input className="input" value={data.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Weekly Production Access Summary" style={{ marginTop: 4 }}/>
    </div>
    <div>
      <label className="field-label">Description</label>
      <textarea className="textarea" value={data.description} onChange={e => set("description", e.target.value)} placeholder="What does this report show? Who is it for?" style={{ marginTop: 4 }}/>
    </div>
    <div className="row" style={{ gap: 16, alignItems: "flex-start" }}>
      <div style={{ flex: 1 }}>
        <label className="field-label">Category <span className="req">*</span></label>
        <select className="select" value={data.category} onChange={e => set("category", e.target.value)} style={{ marginTop: 4 }}>
          {(window.REPORT_CATEGORIES || []).filter(c => c.id !== "all").map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
      </div>
      <div style={{ flex: 1 }}>
        <label className="field-label">Base data source <span className="req">*</span></label>
        <select className="select" value={data.base} onChange={e => set("base", e.target.value)} style={{ marginTop: 4 }}>
          <option value="sessions">Session access data</option>
          <option value="credentials">Credential and rotation data</option>
          <option value="approvals">Access approvals data</option>
          <option value="discovery">Discovery and asset data</option>
          <option value="certificates">Certificate data</option>
          <option value="audit">System audit log</option>
        </select>
      </div>
    </div>
    <div>
      <label className="field-label">Date range behavior <span className="req">*</span></label>
      <div className="row" style={{ marginTop: 4, padding: 3, background: "var(--bg-surface-2)", borderRadius: 6, gap: 0, maxWidth: 520 }}>
        {[["global","Inherits global"],["fixed","Fixed period"],["rolling","Rolling window"]].map(([k, l]) => (
          <button key={k} onClick={() => set("dateBehavior", k)} style={{ flex: 1, padding: "6px 10px", border: "none", borderRadius: 4, background: data.dateBehavior === k ? "var(--bg-surface)" : "transparent", boxShadow: data.dateBehavior === k ? "var(--shadow-xs)" : "none", font: `${data.dateBehavior === k ? 600 : 500} 12.5px/1 var(--font-sans)`, color: data.dateBehavior === k ? "var(--fg-1)" : "var(--fg-3)", cursor: "pointer" }}>{l}</button>
        ))}
      </div>
      {data.dateBehavior === "rolling" && (
        <div className="row" style={{ marginTop: 10, gap: 8 }}>
          <span className="t-small" style={{ color: "var(--fg-2)" }}>Last</span>
          <input className="input" type="number" value={data.rollWindow} onChange={e => set("rollWindow", +e.target.value)} style={{ width: 80, height: 28 }}/>
          <select className="select" style={{ width: 100, height: 28 }}><option>days</option><option>weeks</option><option>months</option></select>
        </div>
      )}
    </div>
  </div>
);

const SESSION_FIELDS = {
  "User": ["user", "email", "role", "group"],
  "Resource": ["resource", "resourceType", "resourceIP", "environment", "criticality"],
  "Session": ["started", "ended", "duration", "sessionType", "credential", "status", "risk", "commands", "recording"],
  "Context": ["ticket", "approver", "policy"],
};
const FIELD_LABELS = {
  user: "User name", email: "Email", role: "Role", group: "Group",
  resource: "Resource", resourceType: "Type", resourceIP: "IP", environment: "Environment", criticality: "Criticality",
  started: "Started", ended: "Ended", duration: "Duration", sessionType: "Session type",
  credential: "Credential", status: "Status", risk: "Risk score", commands: "Commands", recording: "Recording",
  ticket: "Ticket reference", approver: "Approver", policy: "Policy applied",
};

const BuilderStep2 = ({ data, set }) => {
  const toggle = (k) => set("fields", data.fields.includes(k) ? data.fields.filter(x => x !== k) : [...data.fields, k]);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
      <div className="card">
        <div className="card-header"><span className="h-card">Available fields</span><div style={{ flex: 1 }}/><span className="t-tiny">{Object.values(SESSION_FIELDS).flat().length} fields</span></div>
        <div style={{ padding: "10px 16px 14px" }}>
          {Object.entries(SESSION_FIELDS).map(([group, keys]) => (
            <div key={group} style={{ marginTop: 8 }}>
              <div style={{ display: "flex", alignItems: "center", padding: "4px 0" }}>
                <span className="t-micro" style={{ flex: 1 }}>{group}</span>
                <button className="btn btn-ghost btn-sm" style={{ padding: 0, color: "var(--brand-fg)", fontSize: 11 }} onClick={() => set("fields", Array.from(new Set([...data.fields, ...keys])))}>Select all</button>
              </div>
              {keys.map(k => (
                <label key={k} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", cursor: "pointer" }}>
                  <input type="checkbox" checked={data.fields.includes(k)} onChange={() => toggle(k)} style={{ accentColor: "var(--brand)" }}/>
                  <span style={{ font: "500 12.5px/1 var(--font-sans)", color: "var(--fg-1)" }}>{FIELD_LABELS[k]}</span>
                </label>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <div className="card-header"><span className="h-card">Included in report</span><span className="badge badge-brand">{data.fields.length}</span><div style={{ flex: 1 }}/><span className="t-tiny">Drag to reorder</span></div>
        <div style={{ padding: 14 }}>
          {data.fields.length === 0 ? <div className="t-small" style={{ color: "var(--fg-4)", textAlign: "center", padding: 20 }}>No fields selected. Pick from the list on the left.</div> :
            data.fields.map((f, i) => (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", border: "1px solid var(--border)", borderRadius: 6, marginBottom: 4, background: "var(--bg-surface)" }}>
                <Icon name="menu" size={12} color="var(--fg-4)"/>
                <span className="t-tiny" style={{ color: "var(--fg-4)", minWidth: 18 }}>{i + 1}</span>
                <span style={{ flex: 1, font: "500 12.5px/1 var(--font-sans)", color: "var(--fg-1)" }}>{FIELD_LABELS[f]}</span>
                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => set("fields", data.fields.filter(x => x !== f))}><Icon name="x" size={11}/></button>
              </div>
            ))}
          <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: 14, marginTop: 14 }}>
            <div className="t-micro" style={{ marginBottom: 8 }}>Apply filters (optional)</div>
            <div className="row" style={{ flexWrap: "wrap", gap: 6 }}>
              <FilterChip label="Resource" value="Any" muted/>
              <FilterChip label="Status" value="Any" muted/>
              <button className="btn btn-ghost btn-sm" style={{ color: "var(--brand-fg)" }}><Icon name="plus" size={11}/> Add filter</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const BuilderStep3 = ({ data, set }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
    <div className="t-small" style={{ color: "var(--fg-3)" }}>Preview of how the report will look. Click any column header to rename or add a highlight rule.</div>
    <div className="card">
      <table className="table">
        <thead>
          <tr>{data.fields.map(f => <th key={f}>{FIELD_LABELS[f]}</th>)}</tr>
        </thead>
        <tbody>
          {SAMPLE_PREVIEW.map((r, i) => (
            <tr key={i}>{data.fields.map(f => <td key={f} className={f === "risk" ? "" : "t-small"}>{SAMPLE_RENDER(f, r)}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
    <div className="card" style={{ padding: 14, display: "flex", alignItems: "center", gap: 12 }}>
      <Icon name="alert-circle" size={14} color="var(--brand-fg)"/>
      <span className="t-small" style={{ flex: 1, color: "var(--fg-2)" }}><b>Highlight rules</b> · highlight rows where Risk score exceeds 60 → amber. Add rule per column to flag rows in the report.</span>
      <button className="btn btn-sm">Add highlight rule</button>
    </div>
  </div>
);

const SAMPLE_PREVIEW = [
  { user: "Priya Iyer", email: "priya@nw.com", resource: "prod-db-primary", started: "May 18 08:14", duration: "22m", commands: 47, status: "Success", risk: 15 },
  { user: "Marcus Chen", email: "marcus@nw.com", resource: "auth-server-01", started: "May 18 02:47", duration: "3h 24m", commands: 212, status: "Completed", risk: 91 },
  { user: "Rohan Mehta", email: "rohan@nw.com", resource: "oracle-reporting", started: "May 17 14:22", duration: "8m", commands: 12, status: "Success", risk: 12 },
];
const SAMPLE_RENDER = (f, r) => {
  if (f === "user") return <div className="row"><Avatar name={r.user} size={20}/><span>{r.user}</span></div>;
  if (f === "resource") return <span className="t-mono" style={{ color: "var(--fg-1)" }}>{r.resource}</span>;
  if (f === "risk") return <RiskBadge score={r.risk} level={r.risk >= 86 ? "Critical" : r.risk >= 61 ? "High" : r.risk >= 31 ? "Medium" : "Low"}/>;
  return r[f] != null ? r[f] : <span style={{ color: "var(--fg-4)" }}>—</span>;
};

const BuilderStep4 = ({ data }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
    <div className="card">
      <div className="card-header">
        <span className="h-card">{data.name || "Untitled report"}</span>
        <span className="badge badge-brand">{(window.REPORT_CATEGORIES || []).find(c => c.id === data.category)?.label}</span>
        <span className="badge">Custom</span>
        <div style={{ flex: 1 }}/>
        <span className="t-tiny">{data.fields.length} columns · {data.filters.length} pre-set filters</span>
      </div>
      <div style={{ padding: 16, background: "var(--bg-surface-2)" }}>
        <div className="t-small" style={{ color: "var(--fg-3)", marginBottom: 10 }}>{data.description || "No description"}</div>
        <div className="row" style={{ gap: 16, flexWrap: "wrap" }}>
          <span className="t-tiny"><span style={{ color: "var(--fg-4)" }}>Base data:</span> <span style={{ color: "var(--fg-1)" }}>{data.base}</span></span>
          <span className="t-tiny"><span style={{ color: "var(--fg-4)" }}>Date range:</span> <span style={{ color: "var(--fg-1)" }}>{data.dateBehavior}</span></span>
          <span className="t-tiny"><span style={{ color: "var(--fg-4)" }}>Columns:</span> <span style={{ color: "var(--fg-1)" }}>{data.fields.length}</span></span>
        </div>
      </div>
      <table className="table">
        <thead><tr>{data.fields.slice(0, 7).map(f => <th key={f}>{FIELD_LABELS[f]}</th>)}</tr></thead>
        <tbody>
          {SAMPLE_PREVIEW.map((r, i) => (
            <tr key={i}>{data.fields.slice(0, 7).map(f => <td key={f}>{SAMPLE_RENDER(f, r)}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// =============================================================
// StatCard (shared with dashboard but local so reports is standalone)
// =============================================================
const StatCard = ({ icon, label, value, change, tone = "default" }) => {
  const changeColor =
    tone === "danger" ? "var(--danger-fg)" :
    tone === "warning" ? "var(--warning-fg)" :
    tone === "success" ? "var(--success-fg)" :
    tone === "muted" ? "var(--fg-4)" : "var(--fg-3)";
  const iconBg = tone === "danger" ? "var(--danger-soft)" : tone === "warning" ? "var(--warning-soft)" : tone === "success" ? "var(--success-soft)" : "var(--bg-surface-2)";
  const iconFg = tone === "danger" ? "var(--danger-fg)"  : tone === "warning" ? "var(--warning-fg)"  : tone === "success" ? "var(--success-fg)"  : "var(--fg-2)";
  return (
    <div className="card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8, opacity: tone === "muted" ? 0.7 : 1 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {icon && <div style={{ width: 28, height: 28, borderRadius: 6, background: iconBg, color: iconFg, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name={icon} size={14}/></div>}
        <div className="t-tiny" style={{ flex: 1 }}>{label}</div>
      </div>
      <div style={{ font: "600 24px/1.1 var(--font-sans)", color: "var(--fg-1)", letterSpacing: "-0.4px" }}>{value}</div>
      {change && <div style={{ fontSize: 12, color: changeColor }}>{change}</div>}
    </div>
  );
};

const SkelStat = () => (
  <div className="card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
    <div style={{ width: 28, height: 28, borderRadius: 6, background: "var(--bg-surface-2)" }}/>
    <div style={{ width: 60, height: 22, background: "var(--bg-surface-2)", borderRadius: 4 }}/>
    <div style={{ width: "75%", height: 8, background: "var(--bg-surface-2)", borderRadius: 4 }}/>
  </div>
);

// =============================================================
// Report layouts (Summary + cols + sample rows + trend) per report id
// =============================================================
const REPORT_LAYOUTS = {
  "r-server-access": {
    trendLabel: "Sessions per day",
    summary: [
      { icon: "sessions", label: "Total sessions",    value: "126", change: "↑ 14% vs prior", tone: "default" },
      { icon: "users",    label: "Unique users",      value: "3",   change: "Priya, Marcus, Rohan", tone: "default" },
      { icon: "server",   label: "Resources accessed", value: "8",  change: "of 142 total", tone: "default" },
      { icon: "alert-triangle", label: "Failed sessions", value: "4", change: "3.2% failure rate", tone: "danger" },
      { icon: "flag",     label: "Flagged events",    value: "2",   change: "1 critical · 1 high", tone: "warning" },
    ],
    anomalies: [
      { score: 91, level: "Critical", desc: "rm -rf executed at 2:47 AM on auth-server-01", user: "Marcus Chen", resource: "auth-server-01", ts: "6h ago" },
      { score: 58, level: "Medium",   desc: "Session at 23:50 — outside normal working hours", user: "Marcus Chen", resource: "prod-db-primary", ts: "2d ago" },
    ],
    cols: [
      { label: "User", render: (r) => <div className="row"><Avatar name={r.user} size={20}/><span style={{ fontSize: 12.5, color: "var(--fg-1)", fontWeight: 500 }}>{r.user}</span></div> },
      { label: "Resource", render: (r) => <span className="t-mono" style={{ fontSize: 12, color: "var(--brand-fg)" }}>{r.resource}</span> },
      { label: "Type", render: (r) => <span className="badge">{r.type}</span> },
      { label: "Started", width: 130, render: (r) => <span className="t-mono" style={{ fontSize: 12, color: "var(--fg-3)" }}>{r.started}</span> },
      { label: "Duration", width: 80, render: (r) => <span className="t-mono" style={{ fontSize: 12, color: "var(--fg-3)" }}>{r.duration}</span> },
      { label: "Commands", width: 80, render: (r) => <span className="t-mono" style={{ fontSize: 12, color: "var(--fg-3)" }}>{r.commands}</span> },
      { label: "Status", width: 90, render: (r) => r.status === "Success" ? <span className="badge badge-success"><span className="dot dot-success"/> Success</span> : <span className="badge badge-warning">{r.status}</span> },
      { label: "Risk", width: 110, render: (r) => <RiskBadge score={r.score} level={r.level}/> },
      { label: "Ticket", width: 90, render: (r) => r.ticket ? <span className="t-mono" style={{ fontSize: 12, color: "var(--brand-fg)" }}>{r.ticket}</span> : <span style={{ color: "var(--fg-4)" }}>—</span> },
    ],
    rows: [
      { id: "s-1", user: "Priya Iyer",      resource: "prod-db-primary",  type: "Database", started: "May 18 08:14", duration: "22m",    commands: 47,  status: "Success", score: 15, level: "Low",     ticket: "TKT-2110" },
      { id: "s-2", user: "Marcus Chen",     resource: "auth-server-01",   type: "SSH",      started: "May 18 02:47", duration: "3h 24m", commands: 212, status: "Completed", score: 91, level: "Critical", ticket: "TKT-2103", flagged: "Critical" },
      { id: "s-3", user: "Rohan Mehta",     resource: "oracle-reporting", type: "Database", started: "May 17 14:22", duration: "8m",     commands: 12,  status: "Success", score: 12, level: "Low",     ticket: "TKT-2087" },
      { id: "s-4", user: "Aditya Kulkarni", resource: "dev-web-portal",   type: "Web App",  started: "May 17 10:05", duration: "45m",    commands: 0,   status: "Success", score: 0,  level: "Low",     ticket: null },
      { id: "s-5", user: "Marcus Chen",     resource: "prod-db-primary",  type: "Database", started: "May 16 23:50", duration: "11m",    commands: 34,  status: "Success", score: 58, level: "Medium", ticket: "TKT-2091", flagged: "Medium" },
      { id: "s-6", user: "Priya Iyer",      resource: "prod-db-primary",  type: "Database", started: "May 16 14:02", duration: "1h 12m", commands: 88,  status: "Success", score: 8,  level: "Low",     ticket: null },
      { id: "s-7", user: "Rohan Mehta",     resource: "auth-server-01",   type: "SSH",      started: "May 15 09:14", duration: "18m",    commands: 28,  status: "Success", score: 22, level: "Low",     ticket: "TKT-2080" },
      { id: "s-8", user: "Arjun Bansal",    resource: "oracle-reporting", type: "Database", started: "May 15 13:41", duration: "3h 41m", commands: 124, status: "Success", score: 67, level: "High",   ticket: "TKT-BG-04" },
    ],
    trend: [
      { label: "May 12", values: [16, 1] },
      { label: "May 13", values: [22, 0] },
      { label: "May 14", values: [14, 1] },
      { label: "May 15", values: [24, 0] },
      { label: "May 16", values: [10, 1] },
      { label: "May 17", values: [28, 0] },
      { label: "May 18", values: [12, 1] },
    ],
  },
  "r-rotation": {
    trendLabel: "Rotations per day — success vs failed",
    summary: [
      { icon: "refresh", label: "Total rotations", value: "34", change: "Last 7 days" },
      { icon: "check-circle", label: "Successful", value: "32", change: "94.1% success rate", tone: "success" },
      { icon: "alert-triangle", label: "Failed", value: "2", change: "↓ 2.1% vs prior", tone: "danger" },
      { icon: "clock", label: "Last rotation", value: "3h", change: "ago · prod-db-root" },
    ],
    anomalies: [
      { score: 58, level: "Medium", desc: "Rotation failed 3 consecutive times", user: null, resource: "oracle-dba-01", ts: "2 days ago" },
      { score: 66, level: "High",   desc: "Credential not rotated in 47 days (schedule: 7 days)", user: null, resource: "windows-svc-account", ts: "4 days ago" },
    ],
    cols: [
      { label: "Credential", render: (r) => <span className="t-mono" style={{ fontSize: 12, color: "var(--fg-1)", fontWeight: 500 }}>{r.cred}</span> },
      { label: "Resource", render: (r) => <span className="t-mono" style={{ fontSize: 12, color: "var(--brand-fg)" }}>{r.resource}</span> },
      { label: "Triggered by", width: 130, render: (r) => r.by === "PAM" ? <span className="badge badge-info">PAM Auto</span> : <div className="row"><Avatar name={r.by} size={18}/><span style={{ fontSize: 12.5 }}>{r.by}</span></div> },
      { label: "Started", width: 130, render: (r) => <span className="t-mono" style={{ fontSize: 12, color: "var(--fg-3)" }}>{r.started}</span> },
      { label: "Result", width: 110, render: (r) => r.result === "Success" ? <span className="badge badge-success"><span className="dot dot-success"/> Success</span> : <span className="badge badge-danger"><span className="dot dot-danger"/> Failed</span> },
      { label: "Failure reason", render: (r) => r.reason ? <span style={{ fontSize: 12.5, color: "var(--danger-fg)" }}>{r.reason}</span> : <span style={{ color: "var(--fg-4)" }}>—</span> },
      { label: "Next scheduled", width: 130, render: (r) => <span className="t-tiny" style={{ color: "var(--fg-3)" }}>{r.next}</span> },
    ],
    rows: [
      { id: "rt-1", cred: "prod-db-root",        resource: "prod-db-primary",   by: "PAM",          started: "May 18 06:00", result: "Success", reason: null, next: "May 25 06:00" },
      { id: "rt-2", cred: "oracle-dba-01",       resource: "oracle-reporting",  by: "PAM",          started: "May 16 06:00", result: "Failed",  reason: "Authentication rejected on target", next: "Retry", flagged: "Medium" },
      { id: "rt-3", cred: "linux-ssh-admin",     resource: "auth-server-01",    by: "PAM",          started: "May 18 06:01", result: "Success", reason: null, next: "May 25 06:00" },
      { id: "rt-4", cred: "windows-svc-account", resource: "windows-jumpbox",   by: "PAM",          started: "May 14 06:00", result: "Failed",  reason: "Account locked on target",          next: "Retry", flagged: "High" },
      { id: "rt-5", cred: "k8s-cluster-admin",   resource: "k8s-control-plane", by: "Arjun Bansal", started: "May 17 11:24", result: "Success", reason: null, next: "Aug 17 11:24" },
    ],
    trend: [
      { label: "May 12", values: [5, 0] }, { label: "May 13", values: [6, 0] }, { label: "May 14", values: [4, 1] },
      { label: "May 15", values: [5, 0] }, { label: "May 16", values: [4, 1] }, { label: "May 17", values: [5, 0] }, { label: "May 18", values: [5, 0] },
    ],
  },
  "r-cert-expiry": {
    trendLabel: "Certificates expiring per month",
    summary: [
      { icon: "certificates", label: "Total certs", value: "12", change: "Across 3 CAs" },
      { icon: "alert-triangle", label: "< 7 days", value: "1", change: "api.securecorp.com", tone: "danger" },
      { icon: "clock", label: "< 30 days", value: "3", change: "Action required soon", tone: "warning" },
      { icon: "check-circle", label: "Healthy", value: "8", change: "30+ days remaining", tone: "success" },
    ],
    anomalies: [
      { score: 91, level: "Critical", desc: "Certificate expires in 6 days · auto-renew not configured", user: null, resource: "api.securecorp.com", ts: "Expires Jun 4" },
    ],
    cols: [
      { label: "Display name", render: (r) => <span className="t-mono" style={{ fontSize: 12, color: "var(--fg-1)", fontWeight: 500 }}>{r.name}</span> },
      { label: "Issuer", width: 130, render: (r) => <span className="t-tiny" style={{ color: "var(--fg-3)" }}>{r.issuer}</span> },
      { label: "Status", width: 130, render: (r) => r.days <= 7 ? <span className="badge badge-danger"><span className="dot dot-danger"/> Critical</span> : r.days <= 30 ? <span className="badge badge-warning"><span className="dot dot-warning"/> Expiring</span> : <span className="badge badge-success"><span className="dot dot-success"/> Healthy</span> },
      { label: "Days remaining", width: 130, render: (r) => <span className="t-mono" style={{ fontSize: 13, color: r.days <= 7 ? "var(--danger-fg)" : r.days <= 30 ? "var(--warning-fg)" : "var(--fg-2)", fontWeight: r.days <= 7 ? 700 : 500 }}>{r.days}</span> },
      { label: "Expiry date", width: 130, render: (r) => <span className="t-mono" style={{ fontSize: 12, color: "var(--fg-3)" }}>{r.expires}</span> },
      { label: "Linked resources", render: (r) => <span style={{ fontSize: 12.5, color: "var(--fg-2)" }}>{r.linked}</span> },
    ],
    rows: [
      { id: "c-1", name: "api.securecorp.com",      issuer: "DigiCert",      days: 6,   expires: "Jun 4, 2026",  linked: "prod-api-server", flagged: "Critical" },
      { id: "c-2", name: "*.securecorp.com",        issuer: "Let's Encrypt", days: 23,  expires: "Jun 11, 2026", linked: "3 resources",     flagged: "Medium" },
      { id: "c-3", name: "payments.securecorp.com", issuer: "Comodo",        days: 28,  expires: "Jun 17, 2026", linked: "payments-server", flagged: "Medium" },
      { id: "c-4", name: "admin.securecorp.com",    issuer: "DigiCert",      days: 62,  expires: "Jul 21, 2026", linked: "admin-portal" },
      { id: "c-5", name: "vpn.securecorp.com",      issuer: "DigiCert",      days: 91,  expires: "Aug 19, 2026", linked: "vpn-gateway" },
      { id: "c-6", name: "auth.securecorp.com",     issuer: "DigiCert",      days: 184, expires: "Nov 19, 2026", linked: "auth-server-01" },
    ],
    trend: [
      { label: "Jun", values: [4] }, { label: "Jul", values: [1] }, { label: "Aug", values: [1] },
      { label: "Sep", values: [0] }, { label: "Oct", values: [0] }, { label: "Nov", values: [3] },
    ],
  },
};

// Default fallback for reports without a defined layout
const DEFAULT_LAYOUT = REPORT_LAYOUTS["r-server-access"];
Object.keys(window.REPORTS || []).forEach(() => {});
(window.REPORTS || []).forEach(r => { if (!REPORT_LAYOUTS[r.id]) REPORT_LAYOUTS[r.id] = DEFAULT_LAYOUT; });

// =============================================================
// LIVE + RECORDED sessions tabs — keep prior exports for portal routing
// =============================================================

const LiveSessionsTab = () => {
  const [selectedTerminate, setSelectedTerminate] = React.useState(null);
  const live = window.LIVE_SESSIONS || [];
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <PageHeader title="Live sessions" description={`${live.length} active right now · refreshes every 30s`}
        actions={<button className="btn btn-ghost btn-icon" title="Refresh"><Icon name="refresh" size={14}/></button>}/>
      <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16, overflow: "auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          <StatCard icon="sessions" label="Active sessions" value={live.length} change="All in monitored windows" tone="success"/>
          <StatCard icon="video"    label="Recording"        value={`${live.filter(s => s.recording).length} of ${live.length}`} change={live.filter(s => !s.recording).length > 0 ? `${live.filter(s => !s.recording).length} unrecorded` : "All recording"} tone={live.filter(s => !s.recording).length > 0 ? "warning" : "success"}/>
          <StatCard icon="flag"     label="Flagged"          value={live.filter(s => s.riskScore >= 60).length} change={live.filter(s => s.riskScore >= 60).length > 0 ? "Review now" : "All clear"} tone={live.filter(s => s.riskScore >= 60).length > 0 ? "danger" : "success"}/>
        </div>
        <div className="card">
          <div className="card-header"><span className="h-card">Active sessions</span><div style={{ flex: 1 }}/><span className="badge badge-success"><span className="dot dot-success pulse-dot"/> Live</span></div>
          <table className="table">
            <thead><tr><th>User</th><th>Resource</th><th>Type</th><th>Credential</th><th>Started</th><th>Duration</th><th>Commands</th><th>Recording</th><th>Risk</th><th></th></tr></thead>
            <tbody>{live.map(s => (
              <tr key={s.id}>
                <td><div className="row"><Avatar name={s.user} size={22}/><span style={{ fontWeight: 500, fontSize: 12.5 }}>{s.user}</span></div></td>
                <td><div><span className="t-mono" style={{ fontSize: 12, color: "var(--brand-fg)" }}>{s.resource}</span><div className="t-tiny" style={{ color: "var(--fg-4)" }}>{s.resourceIP}</div></div></td>
                <td><SessionTypeBadge type={s.sessionType}/></td>
                <td className="t-mono" style={{ fontSize: 12, color: "var(--fg-2)" }}>{s.credential}</td>
                <td className="t-tiny" style={{ color: "var(--fg-3)" }}>{s.startedAgo} ago</td>
                <td className="t-mono" style={{ fontSize: 12, color: "var(--fg-2)" }}>{s.duration}</td>
                <td className="t-tiny" style={{ color: "var(--fg-2)" }}>{s.commands}</td>
                <td>{s.recording ? <RecordingBadge status="recording"/> : <RecordingBadge status="not-recorded"/>}</td>
                <td><RiskScore score={s.riskScore}/></td>
                <td style={{ textAlign: "right" }}>
                  <button className="btn btn-ghost btn-sm">Watch live</button>
                  <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger-fg)" }} onClick={() => setSelectedTerminate(s)}>Terminate</button>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
      {selectedTerminate && <ConfirmModal title={`Terminate session for ${selectedTerminate.user} on ${selectedTerminate.resource}?`} body="This will immediately disconnect the user. Their session will be recorded up to this point." confirmLabel="Terminate session" danger onClose={() => setSelectedTerminate(null)} onConfirm={() => {}}/>}
    </div>
  );
};

const RecordedSessionsTab = ({ onPlay }) => {
  const [q, setQ] = React.useState("");
  const [advOpen, setAdvOpen] = React.useState(false);
  const [selected, setSelected] = React.useState(new Set());
  const sessions = window.AUDIT_RECORDED_SESSIONS || [];
  let rows = sessions;
  if (q) {
    const lq = q.toLowerCase();
    rows = sessions.filter(s => s.topCommands.some(c => c.cmd.toLowerCase().includes(lq)) || s.risks.some(r => r.toLowerCase().includes(lq)));
    rows = rows.map(s => ({ ...s, matchPreview: s.topCommands.find(c => c.cmd.toLowerCase().includes(lq))?.cmd || s.risks.find(r => r.toLowerCase().includes(lq)) }));
  }
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <PageHeader title="Session recordings" description="412 total recordings · 8.4 GB storage · OCR-indexed for full-text search"
        actions={selected.size > 0 ? <>
          <span style={{ font: "500 12.5px/1 var(--font-sans)", color: "var(--brand-fg)" }}>{selected.size} selected</span>
          <button className="btn btn-sm"><Icon name="download" size={11}/> Export</button>
          <button className="btn btn-sm"><Icon name="shield-check" size={11}/> Add to evidence bundle</button>
        </> : null}
      />
      <div style={{ padding: 20, borderBottom: "1px solid var(--border)" }}>
        <div className="row" style={{ marginBottom: 8 }}>
          <span style={{ font: "600 12px/1 var(--font-sans)", color: "var(--fg-2)" }}>Search session content</span>
          <span className="badge badge-brand">OCR INDEXED</span>
        </div>
        <div style={{ position: "relative" }}>
          <Icon name="search" size={14} color="var(--fg-4)" style={{ position: "absolute", left: 12, top: 13 }}/>
          <input className="input" value={q} onChange={e => setQ(e.target.value)} placeholder="Search commands, filenames, URLs, or any text that appeared on screen…" style={{ paddingLeft: 36, height: 40, font: "400 13.5px/1 var(--font-sans)" }}/>
        </div>
        <div className="row" style={{ marginTop: 6 }}>
          <span className="t-tiny" style={{ color: "var(--fg-4)" }}>PAM indexes recordings with OCR. Search finds text visible during any session.</span>
          <div style={{ flex: 1 }}/>
          <button className="btn btn-ghost btn-sm" style={{ color: "var(--brand-fg)" }} onClick={() => setAdvOpen(o => !o)}>{advOpen ? "− Hide criteria" : "+ Add search criteria"}</button>
        </div>
        {advOpen && (
          <div className="row" style={{ marginTop: 12, flexWrap: "wrap", gap: 6 }}>
            <FilterChip label="User" value="Any" muted/>
            <FilterChip label="Resource" value="Any" muted/>
            <FilterChip label="Type" value="Any" muted/>
            <FilterChip label="Risk" value="Any" muted/>
            <FilterChip label="Duration" value="Any" muted/>
          </div>
        )}
      </div>
      <div style={{ flex: 1, overflow: "auto" }}>
        <table className="table">
          <thead><tr>
            <th style={{ width: 32 }}><input type="checkbox"/></th>
            <th>User</th><th>Resource</th><th>Type</th><th>Started</th><th>Duration</th><th>Commands</th><th>Risk</th><th>Recording</th>
            {q && <th>Match</th>}
            <th></th>
          </tr></thead>
          <tbody>{rows.map(s => (
            <tr key={s.id} style={{ background: s.riskScore >= 60 ? "color-mix(in oklch, var(--danger-fg) 3%, transparent)" : "transparent", cursor: "pointer", boxShadow: s.riskScore >= 60 ? "inset 3px 0 var(--danger-fg)" : "none" }} onClick={() => onPlay(s)}>
              <td onClick={e => e.stopPropagation()}><input type="checkbox" checked={selected.has(s.id)} onChange={() => setSelected(p => { const n = new Set(p); n.has(s.id) ? n.delete(s.id) : n.add(s.id); return n; })}/></td>
              <td><div className="row">{s.breakGlass && <span style={{ color: "var(--danger-fg)" }}>⚑</span>}<Avatar name={s.user} size={22}/><div><div style={{ fontSize: 12.5, fontWeight: 500 }}>{s.user}</div><div className="t-tiny" style={{ color: "var(--fg-4)" }}>{s.email}</div></div></div></td>
              <td><div><span className="t-mono" style={{ fontSize: 12, color: "var(--brand-fg)" }}>{s.resource}</span><div className="t-tiny" style={{ color: "var(--fg-4)" }}>{s.resourceIP}</div></div></td>
              <td><SessionTypeBadge type={s.sessionType}/></td>
              <td className="t-tiny" style={{ color: "var(--fg-3)" }}>{s.started}</td>
              <td className="t-mono" style={{ fontSize: 12, color: "var(--fg-2)" }}>{s.duration}</td>
              <td className="t-tiny" style={{ color: "var(--fg-2)" }}>{s.commands}</td>
              <td><RiskScore score={s.riskScore}/></td>
              <td><RecordingBadge status={s.recording}/></td>
              {q && <td><span style={{ font: "400 12px/1.4 var(--font-sans)", color: "var(--fg-2)" }}>…<mark style={{ background: "var(--warning-soft)", color: "var(--warning-fg)", padding: "0 2px" }}>{s.matchPreview}</mark>…</span></td>}
              <td onClick={e => e.stopPropagation()} style={{ textAlign: "right" }}>
                <button className="btn btn-sm btn-primary" onClick={() => onPlay(s)}><Icon name="play" size={11}/> Playback</button>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
};

// Loadbar keyframes (injected once)
if (!document.getElementById("audit-reports-css")) {
  const css = document.createElement("style"); css.id = "audit-reports-css";
  css.textContent = `@keyframes loadbar { 0% { transform: translateX(-100%);} 100% { transform: translateX(100%);} }`;
  document.head.appendChild(css);
}

Object.assign(window, { ReportsLanding, ReportView, LiveSessionsTab, RecordedSessionsTab, CustomReportBuilder });
