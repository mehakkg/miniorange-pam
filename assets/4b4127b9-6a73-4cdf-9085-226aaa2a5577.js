// SCREENS 2-10: LIVE DETAIL + RECORDED SESSIONS + PLAYER + EXPORT + ALERTS

const { useState } = React;

// SCREEN 2: LIVE SESSION DETAIL PANEL
const LiveSessionDetailV2 = ({ session, onClose, onWatch }) => (
  <div style={{ width: "480px", height: "100%", backgroundColor: "#FFFFFF", display: "flex", flexDirection: "column", borderLeft: "1px solid #E5E7EB" }}>
    <div style={{ padding: "20px", borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between" }}>
      <div>
        <div style={{ fontSize: "14px", fontWeight: 600 }}>{session.user} → {session.resource}</div>
        {session.breakGlass && <span style={{ fontSize: "11px", color: "#7C3AED", fontWeight: 500 }}>⚡ Break-glass</span>}
      </div>
      <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}>✕</button>
    </div>
    <div style={{ flex: 1, overflow: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
      <div>
        <div style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", color: "#374151", marginBottom: "8px" }}>SESSION INFO</div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "4px" }}><span>User</span><span style={{ fontWeight: 500 }}>{session.user} · {session.role}</span></div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "4px" }}><span>Resource</span><span style={{ fontWeight: 500 }}>{session.resource}</span></div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "4px" }}><span>Duration</span><span style={{ fontWeight: 500 }}>{session.duration}</span></div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "4px" }}><span>Commands</span><span style={{ fontWeight: 500 }}>{session.commands}</span></div>
      </div>
      {session.riskScore > 0 && (
        <div style={{ padding: "12px", backgroundColor: "#FEF3C7", border: "1px solid #F59E0B", borderRadius: "6px" }}>
          <div style={{ fontWeight: 600, marginBottom: "4px", color: "#92400E" }}>⚠ Risk: {session.riskLevel}</div>
          {session.anomalies.map((a, i) => <div key={i} style={{ fontSize: "12px", color: "#92400E" }}>{a.command} at {a.time}</div>)}
        </div>
      )}
      <div>
        <div style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", color: "#374151", marginBottom: "8px" }}>ACTIVITY</div>
        {session.liveActivity.map((a, i) => <div key={i} style={{ fontSize: "12px", padding: "6px", backgroundColor: "#F9FAFB", borderRadius: "4px", marginBottom: "4px" }}>
          <div style={{ fontSize: "10px", color: "#6B7280" }}>{a.time}</div>
          <div style={{ color: "#111827" }}>{a.action}</div>
        </div>)}
      </div>
    </div>
    <div style={{ padding: "16px", borderTop: "1px solid #E5E7EB", display: "flex", gap: "8px" }}>
      <button onClick={onClose} style={{ flex: 1, padding: "10px", border: "1px solid #D1D5DB", borderRadius: "6px", backgroundColor: "#FFFFFF", cursor: "pointer", fontWeight: 500 }}>Close</button>
      <button onClick={onWatch} style={{ flex: 1, padding: "10px", border: "none", borderRadius: "6px", backgroundColor: "#4F46E5", color: "#FFFFFF", cursor: "pointer", fontWeight: 500 }}>Watch Live</button>
      {session.riskScore > 60 && <button style={{ flex: 1, padding: "10px", border: "none", borderRadius: "6px", backgroundColor: "#DC2626", color: "#FFFFFF", cursor: "pointer", fontWeight: 500 }}>Terminate</button>}
    </div>
  </div>
);

// SCREEN 3: LIVE SESSION VIEWER
const LiveSessionViewerV2 = ({ session, onBack }) => (
  <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", backgroundColor: "#000000" }}>
    <div style={{ padding: "16px 20px", backgroundColor: "#111827", borderBottom: "1px solid #1F2937", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div style={{ color: "#FFFFFF", fontSize: "14px", fontWeight: 600 }}>
        {session.user} → {session.resource} · {session.duration}
        {session.recording === "recording" && <span style={{ marginLeft: "12px", padding: "4px 8px", backgroundColor: "#DC2626", borderRadius: "4px", fontSize: "11px", color: "#FFFFFF" }}>● Recording</span>}
      </div>
      <button onClick={onBack} style={{ background: "none", border: "none", color: "#FFFFFF", fontSize: "16px", cursor: "pointer" }}>✕</button>
    </div>
    <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 300px", gap: "0" }}>
      <div style={{ backgroundColor: "#111827", padding: "20px", overflow: "auto", fontFamily: "monospace", color: "#00FF00", fontSize: "12px", whiteSpace: "pre-wrap" }}>
        $ Connected to {session.resource}
        $ User: {session.user}
        {session.liveActivity.map((a, i) => `\n$ ${a.action}`).join("")}
      </div>
      <div style={{ backgroundColor: "#1F2937", borderLeft: "1px solid #374151", padding: "16px", overflow: "auto", color: "#FFFFFF" }}>
        <div style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", marginBottom: "12px" }}>LIVE ACTIVITY</div>
        {session.liveActivity.map((a, i) => <div key={i} style={{ fontSize: "11px", marginBottom: "8px", paddingBottom: "8px", borderBottom: "1px solid #374151", color: a.type === "dangerous" ? "#FF6B6B" : a.type === "elevated" ? "#FFD700" : "#9CA3AF" }}>
          {a.action}
        </div>)}
      </div>
    </div>
    <div style={{ padding: "16px 20px", backgroundColor: "#111827", borderTop: "1px solid #1F2937", display: "flex", gap: "8px" }}>
      <button onClick={onBack} style={{ padding: "10px 16px", backgroundColor: "#1F2937", border: "1px solid #374151", color: "#FFFFFF", borderRadius: "6px", cursor: "pointer", fontWeight: 500 }}>Back</button>
      <button style={{ padding: "10px 16px", backgroundColor: "#DC2626", border: "none", color: "#FFFFFF", borderRadius: "6px", cursor: "pointer", fontWeight: 500 }}>⚡ Terminate</button>
    </div>
  </div>
);

// SCREEN 4: RECORDED SESSIONS LIST
const RecordedSessionsListV2 = ({ onSelectSession, onPlaySession }) => {
  const { recordedSessionsData } = window;
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ risk: "all" });

  const filtered = recordedSessionsData.filter(s => {
    const matchesSearch = s.user.toLowerCase().includes(search.toLowerCase()) || s.resource.toLowerCase().includes(search.toLowerCase());
    const matchesRisk = filters.risk === "all" || (filters.risk === "high" && s.riskScore > 60);
    return matchesSearch && matchesRisk;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "20px", height: "100%", overflow: "hidden" }}>
      <div>
        <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "4px" }}>Recorded Sessions</h2>
        <p style={{ fontSize: "13px", color: "#6B7280" }}>Search and review all recorded sessions. OCR-indexed for fast forensic investigation.</p>
      </div>

      {/* Forensic search bar */}
      <div style={{ padding: "12px", backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: "6px" }}>
        <label style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", color: "#374151", display: "block", marginBottom: "8px" }}>🔍 Forensic Search</label>
        <input type="text" placeholder="Search session content — commands, filenames, URLs..." style={{ width: "100%", padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: "6px", fontSize: "13px", marginBottom: "8px" }} value={search} onChange={(e) => setSearch(e.target.value)} />
        <div style={{ display: "flex", gap: "8px" }}>
          <select value={filters.risk} onChange={(e) => setFilters({...filters, risk: e.target.value})} style={{ padding: "8px 12px", border: "1px solid #D1D5DB", borderRadius: "4px", fontSize: "12px" }}>
            <option value="all">All Sessions</option>
            <option value="high">High+ Risk</option>
          </select>
          <button style={{ padding: "8px 12px", backgroundColor: "#4F46E5", color: "#FFFFFF", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: 500, fontSize: "12px" }}>Search</button>
        </div>
      </div>

      {/* Results table */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead style={{ position: "sticky", top: 0, backgroundColor: "#F9FAFB" }}>
            <tr>
              <th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #E5E7EB", fontWeight: 600 }}>User</th>
              <th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #E5E7EB", fontWeight: 600 }}>Resource</th>
              <th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #E5E7EB", fontWeight: 600 }}>Started</th>
              <th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #E5E7EB", fontWeight: 600 }}>Duration</th>
              <th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #E5E7EB", fontWeight: 600 }}>Risk</th>
              <th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #E5E7EB", fontWeight: 600 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.id} style={{ borderBottom: "1px solid #E5E7EB", borderLeft: s.riskScore > 60 ? "3px solid #DC2626" : "3px solid transparent" }}>
                <td style={{ padding: "12px" }}><div style={{ fontWeight: 500 }}>{s.user}</div></td>
                <td style={{ padding: "12px" }}>{s.resource}</td>
                <td style={{ padding: "12px", fontSize: "12px", color: "#6B7280" }}>{s.startTime.toLocaleDateString()}</td>
                <td style={{ padding: "12px" }}>{s.duration}</td>
                <td style={{ padding: "12px" }}>
                  {s.riskScore > 0 && <span style={{ padding: "4px 8px", backgroundColor: s.riskScore > 60 ? "#FEE2E2" : "#FEF3C7", color: s.riskScore > 60 ? "#991B1B" : "#92400E", borderRadius: "4px", fontSize: "11px", fontWeight: 500 }}>{s.riskLevel}</span>}
                </td>
                <td style={{ padding: "12px" }}>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button onClick={() => onSelectSession(s)} style={{ padding: "6px 10px", fontSize: "11px", backgroundColor: "#F3F4F6", border: "1px solid #D1D5DB", borderRadius: "4px", cursor: "pointer", fontWeight: 500 }}>Summary</button>
                    <button onClick={() => onPlaySession(s)} style={{ padding: "6px 10px", fontSize: "11px", backgroundColor: "#4F46E5", color: "#FFFFFF", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: 500 }}>▶ Play</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// SCREEN 5: SESSION SUMMARY PANEL
const SessionSummaryPanelV2 = ({ session, onClose, onPlay }) => (
  <div style={{ width: "480px", height: "100%", backgroundColor: "#FFFFFF", display: "flex", flexDirection: "column", borderLeft: "1px solid #E5E7EB" }}>
    <div style={{ padding: "20px", borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between" }}>
      <div style={{ fontSize: "14px", fontWeight: 600 }}>Session #{session.id.split("-")[1]}</div>
      <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}>✕</button>
    </div>
    <div style={{ flex: 1, overflow: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
      <div>
        <div style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", color: "#374151", marginBottom: "8px" }}>SESSION IDENTITY</div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
          <img src={session.avatar} style={{ width: "40px", height: "40px", borderRadius: "50%" }} />
          <div style={{ fontSize: "13px" }}><div style={{ fontWeight: 600 }}>{session.user}</div><div style={{ fontSize: "11px", color: "#6B7280" }}>{session.email}</div></div>
        </div>
      </div>
      {session.riskScore > 0 && (
        <div style={{ padding: "12px", backgroundColor: "#FEE2E2", border: "1px solid #FECACA", borderRadius: "6px" }}>
          <div style={{ fontWeight: 600, marginBottom: "8px", color: "#991B1B" }}>⚠ Risk Score: {session.riskScore} — {session.riskLevel}</div>
          <div style={{ fontSize: "12px", color: "#991B1B" }}>
            {session.anomalies.map((a, i) => <div key={i}>• {a.description}</div>)}
          </div>
        </div>
      )}
      <div>
        <div style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", color: "#374151", marginBottom: "8px" }}>TOP COMMANDS</div>
        {session.topCommands.map((cmd, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "12px" }}>
            <span style={{ fontFamily: "monospace" }}>{cmd.cmd}</span>
            <span style={{ color: "#6B7280" }}>{cmd.count}x</span>
          </div>
        ))}
      </div>
    </div>
    <div style={{ padding: "16px", borderTop: "1px solid #E5E7EB", display: "flex", gap: "8px" }}>
      <button onClick={onClose} style={{ flex: 1, padding: "10px", border: "1px solid #D1D5DB", borderRadius: "6px", backgroundColor: "#FFFFFF", cursor: "pointer", fontWeight: 500 }}>Close</button>
      <button onClick={onPlay} style={{ flex: 1, padding: "10px", border: "none", borderRadius: "6px", backgroundColor: "#4F46E5", color: "#FFFFFF", cursor: "pointer", fontWeight: 500 }}>▶ Play</button>
    </div>
  </div>
);

// SCREEN 6-7: SESSION PLAYER (3-PANEL WITH OCR SEARCH)
const SessionPlayerV2 = ({ session, onClose }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [progress, setProgress] = useState(35);
  const [activeTab, setActiveTab] = useState("timeline");

  return (
    <div style={{ width: "100%", height: "100%", display: "grid", gridTemplateColumns: "1fr 320px", backgroundColor: "#FFFFFF" }}>
      {/* Main playback area */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between" }}>
          <div style={{ fontSize: "14px", fontWeight: 600 }}>{session.user} → {session.resource} | {session.recordingSegments.length} segments</div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "16px", cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ flex: 1, backgroundColor: "#000000", display: "flex", alignItems: "center", justifyContent: "center", color: "#6B7280", overflow: "hidden" }}>
          <div style={{ fontFamily: "monospace", color: "#00FF00", textAlign: "left", whiteSpace: "pre-wrap", padding: "20px", maxHeight: "100%", overflowY: "auto" }}>
            $ Connected to {session.resource}\n$ User: {session.user}\n$ {session.duration}\n\n{session.topCommands.slice(0, 10).map(c => `$ ${c.cmd}`).join("\n")}
          </div>
        </div>
        <div style={{ padding: "16px 20px", borderTop: "1px solid #E5E7EB", display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "#4F46E5", color: "#FFFFFF", border: "none", cursor: "pointer", fontSize: "14px" }}>▶</button>
            <div style={{ flex: 1, height: "4px", backgroundColor: "#E5E7EB", borderRadius: "2px", cursor: "pointer", position: "relative", overflow: "hidden" }}>
              <div style={{ height: "100%", backgroundColor: "#4F46E5", width: `${progress}%` }}></div>
              {/* Segment markers */}
              {session.recordingSegments.map((seg, i) => {
                const segStart = (seg.durationSeconds / session.totalSeconds) * 100;
                return <div key={i} style={{ position: "absolute", left: `${segStart}%`, width: "2px", height: "100%", backgroundColor: "#F59E0B", cursor: "pointer" }} title={`Segment ${i + 1}`}></div>;
              })}
            </div>
            <span style={{ fontSize: "12px", color: "#6B7280", minWidth: "60px", textAlign: "right" }}>0:00 / {session.duration}</span>
          </div>
          <input type="text" placeholder="Search in recording (OCR)..." style={{ padding: "8px 12px", border: "1px solid #D1D5DB", borderRadius: "6px", fontSize: "12px" }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      {/* Right panel: timeline + tabs */}
      <div style={{ borderLeft: "1px solid #E5E7EB", display: "flex", flexDirection: "column", backgroundColor: "#FAFBFC" }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #E5E7EB", fontSize: "12px", fontWeight: 600, color: "#374151" }}>TIMELINE</div>
        <div style={{ flex: 1, overflow: "auto", padding: "12px" }}>
          {[
            { time: "00:15", text: "$ ls -la", type: "command" },
            { time: "02:30", text: "⚠ Suspicious pattern", type: "risk" },
            { time: "05:45", text: "$ UPDATE users...", type: "command" },
            ...session.recordingSegments.map((seg, i) => ({ time: seg.startTime, text: `Segment ${i + 1}`, type: "segment" })),
          ].map((evt, i) => (
            <div key={i} style={{ padding: "8px", backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "4px", marginBottom: "8px", fontSize: "11px", cursor: "pointer" }}>
              <div style={{ fontSize: "10px", color: "#6B7280" }}>{evt.time}</div>
              <div style={{ color: evt.type === "risk" ? "#991B1B" : evt.type === "segment" ? "#4F46E5" : "#374151", fontWeight: 500 }}>{evt.text}</div>
            </div>
          ))}
        </div>
        {/* Tabs */}
        <div style={{ borderTop: "1px solid #E5E7EB", paddingTop: "8px" }}>
          <div style={{ display: "flex", gap: "0" }}>
            <button onClick={() => setActiveTab("timeline")} style={{ flex: 1, padding: "8px", fontSize: "11px", fontWeight: activeTab === "timeline" ? 600 : 500, color: activeTab === "timeline" ? "#4F46E5" : "#6B7280", background: "none", border: "none", borderBottom: activeTab === "timeline" ? "2px solid #4F46E5" : "none", cursor: "pointer" }}>Timeline</button>
            <button onClick={() => setActiveTab("commands")} style={{ flex: 1, padding: "8px", fontSize: "11px", fontWeight: activeTab === "commands" ? 600 : 500, color: activeTab === "commands" ? "#4F46E5" : "#6B7280", background: "none", border: "none", borderBottom: activeTab === "commands" ? "2px solid #4F46E5" : "none", cursor: "pointer" }}>Commands</button>
            <button onClick={() => setActiveTab("metadata")} style={{ flex: 1, padding: "8px", fontSize: "11px", fontWeight: activeTab === "metadata" ? 600 : 500, color: activeTab === "metadata" ? "#4F46E5" : "#6B7280", background: "none", border: "none", borderBottom: activeTab === "metadata" ? "2px solid #4F46E5" : "none", cursor: "pointer" }}>Metadata</button>
          </div>
          <div style={{ padding: "12px", fontSize: "11px", maxHeight: "150px", overflowY: "auto" }}>
            {activeTab === "commands" && session.topCommands.map((cmd, i) => <div key={i} style={{ marginBottom: "4px", fontFamily: "monospace", fontSize: "10px" }}>{cmd.cmd} ({cmd.count}x)</div>)}
            {activeTab === "metadata" && (
              <>
                <div style={{ marginBottom: "4px" }}><strong>Session ID:</strong> {session.id}</div>
                <div style={{ marginBottom: "4px" }}><strong>Started:</strong> {session.startTime.toLocaleString()}</div>
                <div style={{ marginBottom: "4px" }}><strong>Duration:</strong> {session.duration}</div>
                <div><strong>Segments:</strong> {session.recordingSegments.length}</div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// SCREEN 8: EXPORT PANEL
const ExportPanelV2 = ({ session, onClose }) => {
  const [format, setFormat] = useState("zip");

  return (
    <div style={{ width: "480px", height: "100%", backgroundColor: "#FFFFFF", display: "flex", flexDirection: "column", borderLeft: "1px solid #E5E7EB" }}>
      <div style={{ padding: "20px", borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between" }}>
        <div style={{ fontSize: "16px", fontWeight: 600 }}>Export Session</div>
        <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}>✕</button>
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <div>
          <label style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", color: "#374151", display: "block", marginBottom: "8px" }}>FORMAT</label>
          {[
            { id: "mp4", label: "MP4 (Recommended)" },
            { id: "mkv", label: "MKV (Matroska)" },
            { id: "avi", label: "AVI" },
            { id: "zip", label: "ZIP Bundle (Video + Keystroke log + Metadata)" },
          ].map(fmt => (
            <label key={fmt.id} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px", cursor: "pointer", marginBottom: "4px" }}>
              <input type="radio" name="format" value={fmt.id} checked={format === fmt.id} onChange={(e) => setFormat(e.target.value)} />
              <span style={{ fontSize: "13px" }}>{fmt.label}</span>
            </label>
          ))}
        </div>
        {format === "zip" && (
          <div>
            <label style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", color: "#374151", display: "block", marginBottom: "8px" }}>INCLUDE IN ZIP</label>
            {[
              { key: "video", label: "Session video (MP4)" },
              { key: "keystroke", label: "Keystroke log (CSV)" },
              { key: "metadata", label: "Metadata (JSON)" },
              { key: "risk", label: "Risk analysis summary" },
            ].map(item => (
              <label key={item.key} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px", cursor: "pointer", marginBottom: "4px" }}>
                <input type="checkbox" defaultChecked />
                <span style={{ fontSize: "13px" }}>{item.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>
      <div style={{ padding: "16px", borderTop: "1px solid #E5E7EB", display: "flex", gap: "8px" }}>
        <button onClick={onClose} style={{ flex: 1, padding: "10px", border: "1px solid #D1D5DB", borderRadius: "6px", backgroundColor: "#FFFFFF", cursor: "pointer", fontWeight: 500 }}>Cancel</button>
        <button style={{ flex: 1, padding: "10px", border: "none", borderRadius: "6px", backgroundColor: "#4F46E5", color: "#FFFFFF", cursor: "pointer", fontWeight: 500 }}>⬇ Export</button>
      </div>
    </div>
  );
};

// SCREEN 10: SESSION ALERT CONFIG
const SessionAlertConfigV2 = ({ onClose }) => { const { alertConfigData } = window; return (
  <div style={{ width: "480px", height: "100%", backgroundColor: "#FFFFFF", display: "flex", flexDirection: "column", borderLeft: "1px solid #E5E7EB" }}>
    <div style={{ padding: "20px", borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between" }}>
      <div style={{ fontSize: "16px", fontWeight: 600 }}>Session Alerts</div>
      <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}>✕</button>
    </div>
    <div style={{ flex: 1, overflow: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
      <div>
        <label style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", color: "#374151", marginBottom: "8px", display: "block" }}>ALERT TRIGGERS</label>
        {alertConfigData.alerts.map(alert => (
          <div key={alert.id} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px", backgroundColor: "#F9FAFB", borderRadius: "4px", marginBottom: "8px" }}>
            <input type="checkbox" checked={alert.enabled} />
            <div style={{ flex: 1, fontSize: "12px" }}>
              <div style={{ fontWeight: 600 }}>{alert.name}</div>
              {alert.patterns && <div style={{ fontSize: "11px", color: "#6B7280" }}>{alert.patterns.slice(0, 2).join(", ")}</div>}
            </div>
          </div>
        ))}
      </div>
      <div>
        <label style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", color: "#374151", marginBottom: "8px", display: "block" }}>DELIVERY CHANNELS</label>
        {alertConfigData.delivery.map(ch => (
          <div key={ch.id} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px", backgroundColor: "#F9FAFB", borderRadius: "4px", marginBottom: "8px" }}>
            <input type="checkbox" checked={ch.enabled} />
            <div style={{ flex: 1, fontSize: "12px" }}>
              <div style={{ fontWeight: 600 }}>{ch.type === "inApp" ? "In-app" : ch.type === "email" ? "Email" : "Webhook"}</div>
              {ch.recipients && <div style={{ fontSize: "11px", color: "#6B7280" }}>{ch.recipients.join(", ")}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
    <div style={{ padding: "16px", borderTop: "1px solid #E5E7EB", display: "flex", gap: "8px" }}>
      <button onClick={onClose} style={{ flex: 1, padding: "10px", border: "1px solid #D1D5DB", borderRadius: "6px", backgroundColor: "#FFFFFF", cursor: "pointer", fontWeight: 500 }}>Close</button>
      <button style={{ flex: 1, padding: "10px", border: "none", borderRadius: "6px", backgroundColor: "#4F46E5", color: "#FFFFFF", cursor: "pointer", fontWeight: 500 }}>Save Settings</button>
    </div>
  </div>
); };

Object.assign(window, {
  LiveSessionDetailV2,
  LiveSessionViewerV2,
  RecordedSessionsListV2,
  SessionSummaryPanelV2,
  SessionPlayerV2,
  ExportPanelV2,
  SessionAlertConfigV2,
});
