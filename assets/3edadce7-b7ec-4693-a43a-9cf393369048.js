// Certificates — primitives

const CertStatusBadge = ({ status, days }) => {
  const m = {
    Valid:    { fg: "var(--success-fg)", bg: "var(--success-soft)", label: days != null ? `Valid · ${days} day${days===1?"":"s"} remaining` : "Valid" },
    Expiring: { fg: "var(--warning-fg)", bg: "var(--warning-soft)", label: `Expiring · ${days} day${days===1?"":"s"}` },
    Critical: { fg: "var(--danger-fg)",  bg: "var(--danger-soft)",  label: `Critical · ${days} day${days===1?"":"s"}` },
    Expired:  { fg: "var(--danger-fg)",  bg: "var(--danger-soft)",  label: `Expired · ${Math.abs(days)} day${Math.abs(days)===1?"":"s"} ago` },
    Pending:  { fg: "var(--brand-fg)",   bg: "var(--brand-soft)",   label: "Pending" },
    "Self-Signed": { fg: "var(--fg-3)",  bg: "var(--bg-surface-2)", label: "Self-Signed" },
    "CA Signed":   { fg: "var(--success-fg)", bg: "var(--success-soft)", label: "CA Signed" },
    Signed:        { fg: "var(--success-fg)", bg: "var(--success-soft)", label: "Signed" },
    Connected:     { fg: "var(--success-fg)", bg: "var(--success-soft)", label: "Connected ✓" },
    Failed:        { fg: "var(--danger-fg)",  bg: "var(--danger-soft)",  label: "Connection failed ✗" },
    Untested:      { fg: "var(--fg-3)",       bg: "var(--bg-surface-2)", label: "Untested ○" },
  }[status] || { fg: "var(--fg-3)", bg: "var(--bg-surface-2)", label: status };
  return <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: 999, font: "600 10.5px/1.5 var(--font-sans)", letterSpacing: 0.2, background: m.bg, color: m.fg, whiteSpace: "nowrap" }}>{m.label}</span>;
};

const SourceBadgeCert = ({ source }) => {
  const m = {
    Uploaded:  { fg: "var(--fg-3)",       bg: "var(--bg-surface-2)" },
    Created:   { fg: "var(--brand-fg)",   bg: "var(--brand-soft)" },
    AWS:       { fg: "#1A5FA8",           bg: "color-mix(in oklch, #1A5FA8 12%, transparent)" },
    GCP:       { fg: "#1A5FA8",           bg: "color-mix(in oklch, #1A5FA8 12%, transparent)" },
    Azure:     { fg: "#1A5FA8",           bg: "color-mix(in oklch, #1A5FA8 12%, transparent)" },
    "Web Scan":{ fg: "var(--success-fg)", bg: "var(--success-soft)" },
  }[source] || { fg: "var(--fg-3)", bg: "var(--bg-surface-2)" };
  return <span style={{ padding: "2px 8px", borderRadius: 999, font: "500 11px/1.5 var(--font-sans)", background: m.bg, color: m.fg }}>{source}</span>;
};

// Days remaining colored chip
const DaysChip = ({ days }) => {
  if (days < 0)   return <span style={{ font: "600 12.5px/1 var(--font-sans)", color: "var(--danger-fg)" }}>Expired</span>;
  if (days <= 7)  return <span style={{ font: "600 12.5px/1 var(--font-sans)", color: "var(--danger-fg)" }}>{days}</span>;
  if (days <= 30) return <span style={{ font: "600 12.5px/1 var(--font-sans)", color: "var(--warning-fg)" }}>{days}</span>;
  return <span style={{ font: "500 12.5px/1 var(--font-sans)", color: "var(--success-fg)" }}>{days}</span>;
};

// Mono truncated value (fingerprint, serial) with tooltip + copy
const MonoTrunc = ({ value, len = 18 }) => {
  const [copied, setCopied] = React.useState(false);
  const display = value.length > len ? value.slice(0, len) + "…" : value;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span title={value} style={{ font: "500 11.5px/1 var(--font-mono)", color: "var(--fg-2)" }}>{display}</span>
      <button className="btn btn-ghost btn-icon btn-sm" title="Copy" style={{ width: 22, height: 22 }} onClick={(e) => { e.stopPropagation(); navigator.clipboard?.writeText(value).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1200); }}>
        <Icon name={copied ? "check" : "copy"} size={11} color={copied ? "var(--success-fg)" : "var(--fg-3)"}/>
      </button>
    </span>
  );
};

Object.assign(window, { CertStatusBadge, SourceBadgeCert, DaysChip, MonoTrunc });
