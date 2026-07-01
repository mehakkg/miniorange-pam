// Shared Tabs component — 3 visual weights + separator + non-alert count
// Designed to replace inline tab bars across Resources detail, Credentials, People, Certificates.

// Tab weights:
//  1 = Primary (default landing) — semibold, primary color, 2px active border
//  2 = Standard (frequently used, operational) — regular, secondary color when inactive, semibold when active
//  3 = Utility (config / reference) — regular, tertiary color, 1px active border, visually separated

const TabBar = ({ tabs, active, onChange }) => {
  return (
    <div style={{
      display: "flex", alignItems: "stretch", gap: 4,
      padding: "0 24px", borderBottom: "1px solid var(--border)",
      height: 44, position: "relative",
    }}>
      {tabs.map((t, i) => {
        if (t.separator) return <TabSeparator key={`sep-${i}`}/>;
        return <Tab key={t.id} {...t} active={active === t.id} onClick={() => onChange(t.id)}/>;
      })}
    </div>
  );
};

const Tab = ({ id, label, weight = 2, count, live, active, onClick }) => {
  const isActive = active;
  // Per weight styling
  let fontWeight, color, padding, fontSize, activeBorder;
  if (weight === 1) {
    fontWeight = 600;
    color = isActive ? "var(--fg-1)" : "var(--fg-1)";
    padding = "12px 16px";
    fontSize = 14;
    activeBorder = "2px solid var(--brand)";
  } else if (weight === 2) {
    fontWeight = isActive ? 600 : 500;
    color = isActive ? "var(--fg-1)" : "var(--fg-3)";
    padding = "10px 14px";
    fontSize = 13;
    activeBorder = "2px solid var(--brand)";
  } else { // weight 3 — utility
    fontWeight = isActive ? 500 : 500;
    color = isActive ? "var(--fg-1)" : "var(--fg-4)";
    padding = "10px 14px";
    fontSize = 13;
    activeBorder = "1px solid var(--brand)";
  }

  return (
    <button onClick={onClick} style={{
      padding, fontSize, fontWeight,
      color, background: "transparent", border: "none",
      cursor: "pointer", marginBottom: -1, position: "relative",
      borderBottom: isActive ? activeBorder : `${weight === 3 ? 1 : 2}px solid transparent`,
      display: "inline-flex", alignItems: "center", gap: 6,
      lineHeight: 1, fontFamily: "var(--font-sans)",
      transition: "color 100ms, background 100ms",
    }}
    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "var(--bg-surface-2)"; }}
    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
    >
      {label}
      {count != null && (
        <span style={{
          padding: "1px 6px", borderRadius: 4,
          font: "500 11px/1.4 var(--font-sans)",
          background: isActive ? "var(--bg-surface-2)" : "transparent",
          color: "var(--fg-4)",
        }}>{count}</span>
      )}
      {live != null && live > 0 && (
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          font: "500 11px/1 var(--font-sans)",
          color: "var(--success-fg)", marginLeft: 2,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--success-fg)" }}/>
          {live} live
        </span>
      )}
    </button>
  );
};

const TabSeparator = () => (
  <div style={{
    display: "inline-flex", alignItems: "center",
    margin: "0 12px",
  }}>
    <div style={{ width: 1, height: 16, background: "var(--border-strong)" }}/>
  </div>
);

Object.assign(window, { TabBar, Tab, TabSeparator });
