// Shared overflow menu + delete confirmation + small allocate panel

const RowMenu = ({ items, align = "right" }) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }} onClick={e => e.stopPropagation()}>
      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setOpen(o => !o)}>
        <Icon name="more-h" size={13}/>
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", [align]: 0,
          minWidth: 220, background: "var(--bg-app)",
          border: "1px solid var(--border)", borderRadius: 8,
          boxShadow: "0 4px 16px rgba(0,0,0,0.10)", padding: 4, zIndex: 50,
        }}>
          {items.map((it, i) => {
            if (it.divider) return <div key={`div-${i}`} style={{ height: 1, background: "var(--border-subtle)", margin: "4px 0" }}/>;
            return (
              <button key={it.label} disabled={it.disabled} onClick={() => { setOpen(false); it.onClick && it.onClick(); }} style={{
                display: "flex", alignItems: "center", gap: 8, width: "100%",
                padding: "7px 10px", border: "none", background: "transparent",
                color: it.danger ? "var(--danger-fg)" : "var(--fg-1)",
                font: "500 12.5px/1 var(--font-sans)", borderRadius: 4,
                cursor: it.disabled ? "not-allowed" : "pointer",
                opacity: it.disabled ? 0.5 : 1, textAlign: "left",
              }}
              onMouseEnter={e => { if (!it.disabled) e.currentTarget.style.background = it.danger ? "var(--danger-soft)" : "var(--bg-surface-2)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                {it.icon && <Icon name={it.icon} size={12} color={it.danger ? "var(--danger-fg)" : "var(--fg-3)"}/>}
                <span style={{ flex: 1 }}>{it.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Confirm modal — for destructive actions
const ConfirmModal = ({ title, body, warning, confirmLabel = "Confirm", danger, onConfirm, onClose }) => (
  <>
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 100 }}/>
    <div style={{
      position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
      width: 460, maxWidth: "92vw", background: "var(--bg-app)",
      border: "1px solid var(--border)", borderRadius: 10, boxShadow: "var(--shadow-lg)", zIndex: 101,
    }}>
      <div style={{ padding: "16px 20px 12px" }}>
        <h2 style={{ font: "600 15.5px/1.3 var(--font-sans)", color: "var(--fg-1)", margin: 0 }}>{title}</h2>
        {body && <p style={{ font: "400 13px/1.5 var(--font-sans)", color: "var(--fg-2)", margin: "8px 0 0" }}>{body}</p>}
        {warning && <div style={{ marginTop: 12, padding: 10, background: "var(--warning-soft)", color: "var(--warning-fg)", borderRadius: 6, font: "500 12.5px/1.5 var(--font-sans)" }}>⚠ {warning}</div>}
      </div>
      <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 8, justifyContent: "flex-end", background: "var(--bg-surface)" }}>
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn" style={danger ? { background: "var(--danger)", color: "#fff", borderColor: "var(--danger)" } : { background: "var(--brand)", color: "#fff", borderColor: "var(--brand)" }} onClick={() => { onConfirm && onConfirm(); onClose(); }}>{confirmLabel}</button>
      </div>
    </div>
  </>
);

// Toast (simple)
const Toast = ({ kind = "success", text, onClose }) => {
  React.useEffect(() => { const t = setTimeout(() => onClose && onClose(), 3000); return () => clearTimeout(t); }, []);
  const styles = {
    success: { bg: "var(--success-soft)", fg: "var(--success-fg)", icon: "check-circle" },
    error:   { bg: "var(--danger-soft)",  fg: "var(--danger-fg)",  icon: "alert-circle" },
    info:    { bg: "var(--brand-soft)",   fg: "var(--brand-fg)",   icon: "info" },
  }[kind];
  return (
    <div style={{
      position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
      padding: "10px 14px", background: styles.bg, color: styles.fg,
      borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
      display: "flex", alignItems: "center", gap: 10, zIndex: 200,
      font: "500 13px/1 var(--font-sans)",
    }}>
      <Icon name={styles.icon} size={14}/>{text}
    </div>
  );
};

Object.assign(window, { RowMenu, ConfirmModal, Toast });
