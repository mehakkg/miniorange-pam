// SCREEN 1: LIVE SESSIONS LIST

const { useState: useStateLSL, useEffect: useEffectLSL } = React;

const LiveSessionsListV2 = ({ onSelectSession, onOpenViewer }) => {
  const { liveSessionsData, summaryStats } = window;
  const useState = useStateLSL, useEffect = useEffectLSL;
  const [sessions, setSessions] = useState(liveSessionsData);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ riskLevel: "all", recording: "all", sessionType: "all" });
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [stats, setStats] = useState(summaryStats);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      setSessions(prev => prev.map(s => ({
        ...s,
        duration: `${Math.floor((Date.now() - s.startTime) / 60000)}m ${String((Date.now() - s.startTime) / 1000 % 60 | 0).padStart(2, "0")}s`,
        commands: s.commands + Math.floor(Math.random() * 3),
      })));
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const hasUnrecorded = stats.notRecording > 0;
  const filtered = sessions.filter(s => {
    const matchesSearch = s.user.toLowerCase().includes(search.toLowerCase()) || s.resource.toLowerCase().includes(search.toLowerCase());
    const matchesRisk = filters.riskLevel === "all" || s.riskLevel === filters.riskLevel;
    const matchesRecording = filters.recording === "all" || s.recording === filters.recording;
    const matchesType = filters.sessionType === "all" || s.sessionType === filters.sessionType;
    return matchesSearch && matchesRisk && matchesRecording && matchesType;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", padding: "20px", height: "100%", overflow: "hidden" }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: "28px", fontWeight: 600, marginBottom: "4px" }}>Sessions & Monitoring</h1>
        <p style={{ fontSize: "14px", color: "#6B7280" }}>Monitor active privileged sessions in real time. All sessions here are being recorded unless the resource policy has recording disabled.</p>
      </div>

      {/* Auto-refresh indicator */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", color: "#6B7280" }}>
        <span>Auto-refreshing every 30 seconds · Last updated: {new Date().toLocaleTimeString()}</span>
        <button onClick={() => setAutoRefresh(!autoRefresh)} style={{ background: "none", border: "none", color: "#4F46E5", cursor: "pointer", fontWeight: 500 }}>
          {autoRefresh ? "Pause ∥" : "Resume ▶"}
        </button>
      </div>

      {/* Recording coverage alert */}
      {hasUnrecorded && (
        <div style={{ padding: "12px 16px", backgroundColor: "#FEF3C7", border: "1px solid #F59E0B", borderRadius: "6px", fontSize: "13px", color: "#92400E" }}>
          ⚠ {stats.notRecording} active session(s) are not being recorded. 
          <button style={{ background: "none", border: "none", color: "#92400E", cursor: "pointer", fontWeight: 500, marginLeft: "8px", textDecoration: "underline" }}>
            Review unrecorded sessions →
          </button>
        </div>
      )}

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
        <div style={{ padding: "12px", backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "6px" }}>
          <div style={{ fontSize: "24px", fontWeight: 700 }}>{stats.activeSessions}</div>
          <div style={{ fontSize: "12px", color: "#6B7280" }}>● {stats.recording} recording · ○ {stats.notRecording} not recording</div>
        </div>
        <div style={{ padding: "12px", backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "6px" }}>
          <div style={{ fontSize: "24px", fontWeight: 700 }}>{stats.uniqueUsers}</div>
          <div style={{ fontSize: "12px", color: "#6B7280" }}>Unique users connected</div>
        </div>
        <div style={{ padding: "12px", backgroundColor: "#FFFFFF", border: stats.flaggedSessions > 0 ? "1px solid #FCA5A5" : "1px solid #E5E7EB", borderRadius: "6px", backgroundColor: stats.flaggedSessions > 0 ? "#FEF2F2" : "#FFFFFF" }}>
          <div style={{ fontSize: "24px", fontWeight: 700, color: stats.flaggedSessions > 0 ? "#DC2626" : "#111827" }}>{stats.flaggedSessions}</div>
          <div style={{ fontSize: "12px", color: "#6B7280" }}>Flagged sessions {stats.flaggedSessions > 0 && "(risk > 60)"}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <input type="text" placeholder="Search by user, resource, IP..." style={{ padding: "8px 12px", border: "1px solid #D1D5DB", borderRadius: "6px", fontSize: "13px", flex: 1, minWidth: "200px" }} value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={filters.riskLevel} onChange={(e) => setFilters({...filters, riskLevel: e.target.value})} style={{ padding: "8px 12px", border: "1px solid #D1D5DB", borderRadius: "6px", fontSize: "13px" }}>
          <option value="all">All Risk Levels</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Low">Low</option>
        </select>
        <select value={filters.recording} onChange={(e) => setFilters({...filters, recording: e.target.value})} style={{ padding: "8px 12px", border: "1px solid #D1D5DB", borderRadius: "6px", fontSize: "13px" }}>
          <option value="all">All Recording</option>
          <option value="recording">Recording</option>
          <option value="notRecording">Not Recording</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead style={{ position: "sticky", top: 0, backgroundColor: "#F9FAFB" }}>
            <tr>
              <th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #E5E7EB", fontWeight: 600, color: "#374151" }}>User</th>
              <th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #E5E7EB", fontWeight: 600, color: "#374151" }}>Resource</th>
              <th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #E5E7EB", fontWeight: 600, color: "#374151" }}>Type</th>
              <th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #E5E7EB", fontWeight: 600, color: "#374151" }}>Started</th>
              <th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #E5E7EB", fontWeight: 600, color: "#374151" }}>Duration</th>
              <th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #E5E7EB", fontWeight: 600, color: "#374151" }}>Commands</th>
              <th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #E5E7EB", fontWeight: 600, color: "#374151" }}>Risk</th>
              <th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #E5E7EB", fontWeight: 600, color: "#374151" }}>Recording</th>
              <th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #E5E7EB", fontWeight: 600, color: "#374151" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((session) => (
              <tr key={session.id} style={{ borderBottom: "1px solid #E5E7EB", borderLeft: session.riskScore > 60 ? "3px solid #DC2626" : "3px solid transparent", backgroundColor: session.breakGlass ? "#F3E8FF" : "#FFFFFF" }}>
                <td style={{ padding: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <img src={session.avatar} style={{ width: "32px", height: "32px", borderRadius: "50%" }} />
                    <div>
                      <div style={{ fontWeight: 500 }}>{session.user}</div>
                      <div style={{ fontSize: "11px", color: "#6B7280" }}>{session.role}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "12px" }}>{session.resource}</td>
                <td style={{ padding: "12px" }}>
                  <span style={{ padding: "4px 8px", backgroundColor: "#DBEAFE", color: "#0369A1", borderRadius: "4px", fontSize: "11px", fontWeight: 500 }}>
                    {session.breakGlass ? "⚡ Break-glass" : session.sessionType}
                  </span>
                </td>
                <td style={{ padding: "12px", fontSize: "12px", color: "#6B7280" }}>{session.startTime.toLocaleTimeString()}</td>
                <td style={{ padding: "12px", fontWeight: 500 }}>{session.duration}</td>
                <td style={{ padding: "12px" }}>{session.commands}</td>
                <td style={{ padding: "12px" }}>
                  {session.riskScore > 0 && (
                    <span style={{ padding: "4px 8px", backgroundColor: session.riskScore > 60 ? "#FEE2E2" : "#FEF3C7", color: session.riskScore > 60 ? "#991B1B" : "#92400E", borderRadius: "4px", fontSize: "11px", fontWeight: 500 }}>
                      {session.riskLevel}
                    </span>
                  )}
                </td>
                <td style={{ padding: "12px" }}>
                  {session.recording === "recording" ? (
                    <span style={{ fontSize: "12px", color: "#059669", fontWeight: 500 }}>● Recording</span>
                  ) : (
                    <span style={{ fontSize: "12px", color: "#6B7280" }}>○ Not recording</span>
                  )}
                </td>
                <td style={{ padding: "12px" }}>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button onClick={() => onSelectSession(session)} style={{ padding: "6px 10px", fontSize: "11px", backgroundColor: "#F3F4F6", border: "1px solid #D1D5DB", borderRadius: "4px", cursor: "pointer", color: "#374151", fontWeight: 500 }}>
                      Details
                    </button>
                    <button onClick={() => onOpenViewer(session)} style={{ padding: "6px 10px", fontSize: "11px", backgroundColor: "#4F46E5", color: "#FFFFFF", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: 500 }}>
                      Watch
                    </button>
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

Object.assign(window, { LiveSessionsListV2 });
