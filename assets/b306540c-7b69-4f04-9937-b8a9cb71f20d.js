// Credentials — shared design primitives (badges, indicators, KPIs)

const CRED_TYPE_BADGE = ({ type }) => {
  const m = {
    "Password":   { fg: "var(--brand-fg)",  bg: "var(--brand-soft)" },
    "SSH Key":    { fg: "var(--fg-2)",      bg: "var(--bg-surface-2)" },
    "App Secret": { fg: "var(--fg-2)",      bg: "var(--bg-surface-2)" },
    "Reconciliation": { fg: "var(--warning-fg)", bg: "var(--warning-soft)" },
  }[type] || { fg: "var(--fg-2)", bg: "var(--bg-surface-2)" };
  return <span style={{ padding: "2px 8px", borderRadius: 999, font: "500 11px/1.5 var(--font-sans)", background: m.bg, color: m.fg, whiteSpace: "nowrap" }}>{type}</span>;
};

const RotationDot = ({ status, withLabel = false }) => {
  const m = {
    healthy:   { c: "var(--success-fg)",  l: "Healthy" },
    overdue:   { c: "var(--danger-fg)",   l: "Overdue" },
    failed:    { c: "var(--danger-fg)",   l: "Failed"  },
    drifted:   { c: "var(--warning-fg)",  l: "Drifted" },
    "no-policy":{ c: "var(--fg-4)",       l: "No policy" },
  }[status] || { c: "var(--fg-4)", l: status };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, font: "500 12px/1 var(--font-sans)", color: m.c }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: m.c, flex: "none" }}/>
      {withLabel ? m.l : null}
    </span>
  );
};

const SensitivityBadge = ({ level }) => {
  const m = {
    Critical: { fg: "var(--danger-fg)",   bg: "var(--danger-soft)" },
    High:     { fg: "var(--warning-fg)",  bg: "var(--warning-soft)" },
    Medium:   { fg: "var(--fg-2)",        bg: "var(--bg-surface-2)" },
    Low:      { fg: "var(--fg-3)",        bg: "var(--bg-surface-2)" },
  }[level] || { fg: "var(--fg-3)", bg: "var(--bg-surface-2)" };
  return <span style={{ padding: "2px 8px", borderRadius: 999, font: "500 11px/1.5 var(--font-sans)", background: m.bg, color: m.fg, whiteSpace: "nowrap" }}>{level}</span>;
};

// Masked username with copy
const MaskedField = ({ value, len = 9 }) => {
  const [copied, setCopied] = React.useState(false);
  const copy = (e) => { e.stopPropagation(); navigator.clipboard?.writeText(value).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1400); };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, font: "500 12px/1 var(--font-mono)", color: "var(--fg-2)" }}>
      <span>{"●".repeat(len)}</span>
      <button className="btn btn-ghost btn-icon btn-sm" onClick={copy} title="Copy without revealing" style={{ width: 22, height: 22 }}>
        <Icon name={copied ? "check" : "copy"} size={11} color={copied ? "var(--success-fg)" : "var(--fg-3)"}/>
      </button>
    </span>
  );
};

// KPI card
const KPICard = ({ label, value, accent, onClick, active }) => (
  <button onClick={onClick} disabled={!onClick} style={{
    padding: "12px 14px", borderRadius: 8,
    border: `1px solid ${active ? "var(--brand)" : "var(--border)"}`,
    background: active ? "var(--brand-soft)" : "var(--bg-surface)",
    textAlign: "left", cursor: onClick ? "pointer" : "default", flex: 1,
    minWidth: 0,
  }}>
    <div style={{ font: "500 11px/1.4 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
    <div style={{ font: "600 22px/1.1 var(--font-sans)", color: accent || "var(--fg-1)", marginTop: 6 }}>{value}</div>
  </button>
);

const ChipFilter = ({ label, onRemove }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 999, font: "500 12px/1 var(--font-sans)", background: "var(--brand-soft)", color: "var(--brand-fg)" }}>
    {label}
    <button className="btn btn-ghost btn-icon btn-sm" onClick={onRemove} style={{ width: 16, height: 16, padding: 0 }}>
      <Icon name="x" size={10}/>
    </button>
  </span>
);

// Tag chip
const Tag = ({ children, onRemove }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 4, background: "var(--bg-surface-2)", color: "var(--fg-2)", font: "500 11px/1.6 var(--font-sans)", border: "1px solid var(--border)" }}>
    {children}
    {onRemove && <button onClick={onRemove} className="btn btn-ghost btn-icon btn-sm" style={{ width: 14, height: 14, padding: 0 }}><Icon name="x" size={9}/></button>}
  </span>
);

// Fingerprint display
const Fingerprint = ({ value, full = false }) => {
  const display = full ? value : value.slice(0, 18) + "…";
  return <span title={value} style={{ font: "500 11.5px/1 var(--font-mono)", color: "var(--fg-2)" }}>{display}</span>;
};

Object.assign(window, { CRED_TYPE_BADGE, RotationDot, SensitivityBadge, MaskedField, KPICard, ChipFilter, Tag, Fingerprint });
