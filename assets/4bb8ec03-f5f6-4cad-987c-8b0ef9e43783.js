// People — shared primitives

const ROLE_BADGE_STYLE = {
  Admin:           { fg: "var(--danger-fg)",  bg: "var(--danger-soft)" },
  Operator:        { fg: "var(--brand-fg)",   bg: "var(--brand-soft)" },
  "Auditor Admin": { fg: "var(--success-fg)", bg: "var(--success-soft)" },
  "Password Admin":{ fg: "var(--warning-fg)", bg: "var(--warning-soft)" },
  "End User":      { fg: "var(--fg-3)",       bg: "var(--bg-surface-2)" },
};
const RoleBadge = ({ role, custom }) => {
  const m = ROLE_BADGE_STYLE[role] || { fg: "var(--fg-2)", bg: "var(--bg-surface-2)" };
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 999, font: "500 11px/1.5 var(--font-sans)", background: m.bg, color: m.fg, whiteSpace: "nowrap" }}>{custom && <span style={{ width: 5, height: 5, borderRadius: "50%", background: m.fg }}/>}{role}</span>;
};

const SourceBadge = ({ source }) => {
  const m = {
    Manual: { fg: "var(--fg-3)",      bg: "var(--bg-surface-2)" },
    AD:     { fg: "var(--brand-fg)",  bg: "var(--brand-soft)" },
    SSO:    { fg: "var(--success-fg)",bg: "var(--success-soft)" },
    CSV:    { fg: "var(--fg-3)",      bg: "var(--bg-surface-2)" },
  }[source] || { fg: "var(--fg-3)", bg: "var(--bg-surface-2)" };
  return <span style={{ padding: "2px 8px", borderRadius: 999, font: "500 11px/1.5 var(--font-sans)", background: m.bg, color: m.fg }}>{source}</span>;
};

const MFABadge = ({ state }) => {
  const m = {
    enabled:  { fg: "var(--success-fg)", bg: "var(--success-soft)", label: "Enabled ✓" },
    pending:  { fg: "var(--warning-fg)", bg: "var(--warning-soft)", label: "Pending setup" },
    disabled: { fg: "var(--fg-3)",       bg: "var(--bg-surface-2)", label: "Disabled" },
  }[state] || { fg: "var(--fg-3)", bg: "var(--bg-surface-2)", label: state };
  return <span style={{ padding: "2px 8px", borderRadius: 999, font: "500 11px/1.5 var(--font-sans)", background: m.bg, color: m.fg }}>{m.label}</span>;
};

const StatusBadge = ({ status }) => {
  const m = {
    active:   { fg: "var(--success-fg)", bg: "var(--success-soft)", label: "Active" },
    inactive: { fg: "var(--fg-3)",       bg: "var(--bg-surface-2)", label: "Inactive" },
    locked:   { fg: "var(--danger-fg)",  bg: "var(--danger-soft)",  label: "Locked" },
  }[status] || { fg: "var(--fg-3)", bg: "var(--bg-surface-2)", label: status };
  return <span style={{ padding: "2px 8px", borderRadius: 999, font: "500 11px/1.5 var(--font-sans)", background: m.bg, color: m.fg }}>{m.label}</span>;
};

// Group chip with overflow handling
const GroupChips = ({ groups, max = 2 }) => {
  if (!groups || groups.length === 0) return <span style={{ color: "var(--fg-4)" }}>—</span>;
  const visible = groups.slice(0, max);
  const overflow = groups.length - max;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
      {visible.map(g => <span key={g} style={{ padding: "1px 7px", borderRadius: 4, background: "var(--bg-surface-2)", border: "1px solid var(--border)", font: "500 11px/1.6 var(--font-sans)", color: "var(--fg-2)" }}>{g}</span>)}
      {overflow > 0 && <span title={groups.slice(max).join(", ")} style={{ padding: "1px 7px", borderRadius: 4, background: "var(--bg-surface-2)", border: "1px solid var(--border)", font: "500 11px/1.6 var(--font-sans)", color: "var(--fg-3)" }}>+{overflow} more</span>}
    </span>
  );
};

Object.assign(window, { RoleBadge, SourceBadge, MFABadge, StatusBadge: window.TicketStatusBadge ? window.TicketStatusBadge : StatusBadge, PeopleStatusBadge: StatusBadge, GroupChips });
