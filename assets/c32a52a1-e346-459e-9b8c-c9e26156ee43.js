// Shared UI primitives for miniOrange PAM
// Icons (Lucide-style, 1.5px stroke), Brand mark, common building blocks

const Icon = ({ name, size = 16, color = "currentColor", strokeWidth = 1.5, style = {} }) => {
  const paths = {
    // navigation
    "dashboard": <><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></>,
    "resources": <><rect x="3" y="4" width="18" height="6" rx="1.5"/><rect x="3" y="14" width="18" height="6" rx="1.5"/><circle cx="7" cy="7" r="0.5" fill="currentColor"/><circle cx="7" cy="17" r="0.5" fill="currentColor"/></>,
    "credentials": <><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/><circle cx="12" cy="16" r="1" fill="currentColor"/></>,
    "people": <><circle cx="9" cy="8" r="3.5"/><path d="M3 20c.5-3 3-5 6-5s5.5 2 6 5"/><circle cx="17" cy="9" r="2.5"/><path d="M16 20c.3-2 1.5-3.5 3.5-4"/></>,
    "certificates": <><circle cx="12" cy="9" r="5"/><path d="M9 13.5L7 22l5-3 5 3-2-8.5"/><path d="M10 9l1.5 1.5L14 8"/></>,
    "policies": <><path d="M12 3l8 3v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-3z"/><path d="M9 12l2 2 4-4"/></>,
    "allocation": <><circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="12" cy="18" r="2.5"/><path d="M7.5 8L11 16M16.5 8L13 16"/></>,
    "tickets": <><path d="M3 8c0-1 1-2 2-2h14c1 0 2 1 2 2v3a2 2 0 0 0 0 4v3c0 1-1 2-2 2H5c-1 0-2-1-2-2v-3a2 2 0 0 0 0-4V8z"/><path d="M9 6v12" strokeDasharray="2 2"/></>,
    "discovery": <><circle cx="11" cy="11" r="6.5"/><path d="M20 20l-3.5-3.5"/><path d="M11 8v3l2 2"/></>,
    "endpoint": <><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></>,
    "sessions": <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M9 10l4 2-4 2"/></>,
    "auth": <><circle cx="12" cy="9" r="3.5"/><path d="M5 21c.5-4 3.5-7 7-7s6.5 3 7 7"/><path d="M16 4l2 1.5L16 7"/></>,
    "twofactor": <><rect x="6" y="3" width="12" height="18" rx="2"/><circle cx="12" cy="17" r="0.8" fill="currentColor"/><path d="M9 8h6M9 11h4"/></>,
    "settings": <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></>,
    "customization": <><circle cx="13.5" cy="6.5" r="1.5"/><circle cx="17.5" cy="10.5" r="1.5"/><circle cx="8.5" cy="7.5" r="1.5"/><circle cx="6.5" cy="12.5" r="1.5"/><path d="M12 22a10 10 0 1 1 10-10c0 3-3 3-5 3s-3 1-3 3 1 4-2 4z"/></>,
    // misc
    "search": <><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></>,
    "plus": <><path d="M12 5v14M5 12h14"/></>,
    "minus": <><path d="M5 12h14"/></>,
    "x": <><path d="M18 6L6 18M6 6l12 12"/></>,
    "send": <><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4z"/></>,
    "check": <><path d="M5 12l4.5 4.5L19 7"/></>,
    "check-circle": <><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></>,
    "alert-circle": <><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16v.01"/></>,
    "alert-triangle": <><path d="M10.3 3.7a2 2 0 0 1 3.4 0l8 14a2 2 0 0 1-1.7 3H4a2 2 0 0 1-1.7-3z"/><path d="M12 9v4M12 17v.01"/></>,
    "info": <><circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8v.01"/></>,
    "chevron-right": <><path d="M9 6l6 6-6 6"/></>,
    "chevron-left": <><path d="M15 6l-6 6 6 6"/></>,
    "chevron-down": <><path d="M6 9l6 6 6-6"/></>,
    "chevron-up": <><path d="M6 15l6-6 6 6"/></>,
    "arrow-right": <><path d="M5 12h14M13 6l6 6-6 6"/></>,
    "arrow-left": <><path d="M19 12H5M11 6l-6 6 6 6"/></>,
    "external": <><path d="M14 4h6v6"/><path d="M20 4l-9 9"/><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/></>,
    "more-h": <><circle cx="6" cy="12" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/><circle cx="18" cy="12" r="1.2" fill="currentColor"/></>,
    "more-v": <><circle cx="12" cy="6" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/><circle cx="12" cy="18" r="1.2" fill="currentColor"/></>,
    "filter": <><path d="M3 5h18l-7 9v6l-4-2v-4z"/></>,
    "columns": <><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16M15 4v16"/></>,
    "package": <><path d="M12 3l9 5v8l-9 5-9-5V8z"/><path d="M3 8l9 5 9-5M12 13v10"/></>,
    "grid": <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    "switcher": <><circle cx="6" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></>,
    "download": <><path d="M12 4v12M6 12l6 6 6-6M4 21h16"/></>,
    "upload": <><path d="M12 20V8M6 12l6-6 6 6M4 4h16"/></>,
    "edit": <><path d="M3 21h18"/><path d="M14 4l5 5L8 20H3v-5z"/></>,
    "trash": <><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M5 6l1 14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-14"/></>,
    "copy": <><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/></>,
    "eye": <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></>,
    "eye-off": <><path d="M9.9 4.2a10 10 0 0 1 12.1 7.8 9.7 9.7 0 0 1-2 4M6.6 6.6A9.8 9.8 0 0 0 2 12s3.5 7 10 7a9.5 9.5 0 0 0 5.4-1.6"/><path d="M3 3l18 18"/><path d="M14.1 14.1a3 3 0 1 1-4.2-4.2"/></>,
    "lock": <><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></>,
    "unlock": <><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7-1"/></>,
    "key": <><circle cx="7" cy="14" r="3"/><path d="M9.5 11.5L20 4l1 3-2 1 1 2-2 1 1 2-3 1"/></>,
    "shield": <><path d="M12 3l8 3v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z"/></>,
    "shield-check": <><path d="M12 3l8 3v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z"/><path d="M9 12l2 2 4-4"/></>,
    "server": <><rect x="3" y="4" width="18" height="7" rx="1.5"/><rect x="3" y="13" width="18" height="7" rx="1.5"/><circle cx="7" cy="7.5" r="0.6" fill="currentColor"/><circle cx="7" cy="16.5" r="0.6" fill="currentColor"/></>,
    "database": <><ellipse cx="12" cy="5" rx="8" ry="2.5"/><path d="M4 5v6c0 1.5 3.5 2.5 8 2.5s8-1 8-2.5V5"/><path d="M4 11v6c0 1.5 3.5 2.5 8 2.5s8-1 8-2.5v-6"/></>,
    "globe": <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></>,
    "monitor": <><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></>,
    "cloud": <><path d="M17.5 19a4.5 4.5 0 0 0 .5-9 6 6 0 0 0-11.6-1.5A4 4 0 0 0 6 19h11.5z"/></>,
    "play": <><path d="M6 4l14 8-14 8z" fill="currentColor"/></>,
    "pause": <><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></>,
    "stop": <><rect x="6" y="6" width="12" height="12" rx="1"/></>,
    "circle": <><circle cx="12" cy="12" r="9"/></>,
    "calendar": <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></>,
    "clock": <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    "bell": <><path d="M6 8a6 6 0 0 1 12 0c0 6 3 6 3 9H3c0-3 3-3 3-9z"/><path d="M10 21a2 2 0 0 0 4 0"/></>,
    "user": <><circle cx="12" cy="8" r="4"/><path d="M4 21c.5-4 4-7 8-7s7.5 3 8 7"/></>,
    "users": <><circle cx="9" cy="8" r="3.5"/><path d="M3 20c.5-3 3-5 6-5s5.5 2 6 5"/><circle cx="17" cy="9" r="2.5"/><path d="M16 20c.3-2 1.5-3.5 3.5-4"/></>,
    "logout": <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/></>,
    "moon": <><path d="M21 13a9 9 0 1 1-10-10 7 7 0 0 0 10 10z"/></>,
    "sun": <><circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4l1.4-1.4M17 7l1.4-1.4"/></>,
    "menu": <><path d="M4 6h16M4 12h16M4 18h16"/></>,
    "panel-left": <><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/></>,
    "tag": <><path d="M20 12l-9 9-7-7V4h7z"/><circle cx="8" cy="8" r="1" fill="currentColor"/></>,
    "link": <><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></>,
    "refresh": <><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/></>,
    "zap": <><path d="M13 2L4 14h7l-1 8 9-12h-7z"/></>,
    "fire": <><path d="M8 14a4 4 0 1 0 8 0c0-1.5-.5-3-2-4 0 1-1 2-2 2 0-3 1-5 2-7-3 1-7 4-7 9z"/></>,
    "history": <><path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><path d="M12 7v5l3 2"/></>,
    "file-text": <><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M9 13h6M9 17h4"/></>,
    "mail": <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></>,
    "hash": <><path d="M4 9h16M4 15h16M10 3l-2 18M16 3l-2 18"/></>,
    "command": <><path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/></>,
    "help": <><circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 1 1 5.8 1c0 2-3 2-3 4M12 17v.01"/></>,
    "loader": <><path d="M12 3v3M12 18v3M5.6 5.6l2 2M16.4 16.4l2 2M3 12h3M18 12h3M5.6 18.4l2-2M16.4 7.6l2-2"/></>,
  };
  const d = paths[name] || paths["circle"];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none", ...style }}>
      {d}
    </svg>
  );
};

const BrandMark = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={{ flex: "none" }}>
    <rect x="2" y="2" width="28" height="28" rx="7" fill="var(--brand)"/>
    <path d="M9 11l7-4 7 4v6c0 4-3 6.5-7 8-4-1.5-7-4-7-8v-6z" fill="rgba(255,255,255,0.95)"/>
    <path d="M13 16l2.5 2.5L20 14" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
);

const Logo = ({ size = 22 }) => (
  <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
    <BrandMark size={size}/>
    <span style={{ font: "600 15px/1 var(--font-sans)", color: "var(--fg-1)", letterSpacing: "-0.2px" }}>
      miniOrange <span style={{ color: "var(--fg-3)", fontWeight: 500 }}>PAM</span>
    </span>
  </div>
);

const Spinner = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="spin" style={{ flex: "none" }}>
    <circle cx="12" cy="12" r="9" stroke={color} strokeOpacity="0.2" strokeWidth="2.5"/>
    <path d="M21 12a9 9 0 0 0-9-9" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

// Status pill — uses dot + text
const StatusPill = ({ tone = "default", children }) => {
  const map = {
    success: "badge-success",
    warning: "badge-warning",
    danger: "badge-danger",
    info: "badge-info",
    brand: "badge-brand",
    default: "",
  };
  return <span className={`badge ${map[tone]||""}`}>{children}</span>;
};

// Avatar
const Avatar = ({ name = "?", size = 24, color }) => {
  const initials = name.split(" ").map(s => s[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: color || "var(--bg-surface-2)",
      color: "var(--fg-2)",
      border: "1px solid var(--border)",
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      font: `600 ${Math.round(size*0.40)}px/1 var(--font-sans)`,
      flex: "none",
    }}>{initials}</div>
  );
};

// Resource type icons (with brand-tinted background like xecrify ref)
const ResourceTypeIcon = ({ type = "linux", size = 36 }) => {
  const map = {
    linux:    { ic: "server",   bg: "var(--brand-soft)", fg: "var(--brand-fg)" },
    windows:  { ic: "monitor",  bg: "rgba(99,102,241,0.10)",  fg: "#4f46e5" },
    web:      { ic: "globe",    bg: "rgba(16,185,129,0.10)",  fg: "#059669" },
    database: { ic: "database", bg: "rgba(245,158,11,0.10)",  fg: "#b45309" },
    cloud:    { ic: "cloud",    bg: "rgba(8,145,178,0.10)",   fg: "#0891b2" },
    network:  { ic: "globe",    bg: "rgba(124,58,237,0.10)",  fg: "#7c3aed" },
  };
  const m = map[type] || map.linux;
  return (
    <div style={{
      width: size, height: size, borderRadius: 8,
      background: m.bg, color: m.fg,
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      flex: "none",
    }}>
      <Icon name={m.ic} size={Math.round(size*0.5)}/>
    </div>
  );
};

Object.assign(window, { Icon, BrandMark, Logo, Spinner, StatusPill, Avatar, ResourceTypeIcon });
