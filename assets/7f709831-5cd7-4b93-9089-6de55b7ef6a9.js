// SESSIONS SCREEN V2 — Main wrapper and coordinator

function SessionsScreenV2() {
  const { useState } = React;
  const [activeTab, setActiveTab] = useState("live"); // live | recorded
  const [selectedSession, setSelectedSession] = useState(null);
  const [openPanel, setOpenPanel] = useState(null); // detail | summary | export | alerts
  const [viewerSession, setViewerSession] = useState(null);

  const handleSelectLiveSession = (session) => {
    setSelectedSession(session);
    setOpenPanel("detail");
  };

  const handleOpenViewer = (session) => {
    setViewerSession(session);
  };

  const handleSelectRecordedSession = (session) => {
    setSelectedSession(session);
    setOpenPanel("summary");
  };

  const handlePlaySession = (session) => {
    setSelectedSession(session);
    setOpenPanel("player");
  };

  // Full-screen viewer mode
  if (viewerSession) {
    return React.createElement(window.LiveSessionViewerV2 || (() => null), {
      session: viewerSession,
      onBack: () => setViewerSession(null),
    });
  }

  // Main interface
  return (
    <div style={{ display: "flex", height: "100%", width: "100%", backgroundColor: "#FFFFFF" }}>
      {/* Main content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Tabs */}
        <div style={{ display: "flex", gap: "0", borderBottom: "1px solid #E5E7EB", padding: "0 20px" }}>
          <button
            onClick={() => { setActiveTab("live"); setSelectedSession(null); setOpenPanel(null); }}
            style={{
              padding: "12px 0",
              marginRight: "24px",
              borderBottom: activeTab === "live" ? "2px solid #4F46E5" : "2px solid transparent",
              fontSize: "13px",
              fontWeight: activeTab === "live" ? 600 : 500,
              color: activeTab === "live" ? "#4F46E5" : "#6B7280",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            Live sessions ● 4
          </button>
          <button
            onClick={() => { setActiveTab("recorded"); setSelectedSession(null); setOpenPanel(null); }}
            style={{
              padding: "12px 0",
              marginRight: "24px",
              borderBottom: activeTab === "recorded" ? "2px solid #4F46E5" : "2px solid transparent",
              fontSize: "13px",
              fontWeight: activeTab === "recorded" ? 600 : 500,
              color: activeTab === "recorded" ? "#4F46E5" : "#6B7280",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            Recorded sessions
          </button>
          <button
            onClick={() => setOpenPanel("alerts")}
            style={{
              padding: "12px 0",
              fontSize: "13px",
              fontWeight: 500,
              color: "#6B7280",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            ⚙ Alerts
          </button>
        </div>

        {/* Content area */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* List/table */}
          <div style={{ flex: 1, overflow: "hidden" }}>
            {activeTab === "live" && (
              React.createElement(window.LiveSessionsListV2 || (() => null), {
                onSelectSession: handleSelectLiveSession,
                onOpenViewer: handleOpenViewer,
              })
            )}
            {activeTab === "recorded" && (
              React.createElement(window.RecordedSessionsListV2 || (() => null), {
                onSelectSession: handleSelectRecordedSession,
                onPlaySession: handlePlaySession,
              })
            )}
          </div>

          {/* Panels */}
          {openPanel === "detail" && selectedSession && (
            React.createElement(window.LiveSessionDetailV2 || (() => null), {
              session: selectedSession,
              onClose: () => setOpenPanel(null),
              onWatch: () => handleOpenViewer(selectedSession),
            })
          )}
          {openPanel === "summary" && selectedSession && (
            React.createElement(window.SessionSummaryPanelV2 || (() => null), {
              session: selectedSession,
              onClose: () => setOpenPanel(null),
              onPlay: () => setOpenPanel("player"),
            })
          )}
          {openPanel === "player" && selectedSession && (
            React.createElement(window.SessionPlayerV2 || (() => null), {
              session: selectedSession,
              onClose: () => setOpenPanel(null),
            })
          )}
          {openPanel === "export" && selectedSession && (
            React.createElement(window.ExportPanelV2 || (() => null), {
              session: selectedSession,
              onClose: () => setOpenPanel(null),
            })
          )}
          {openPanel === "alerts" && (
            React.createElement(window.SessionAlertConfigV2 || (() => null), {
              onClose: () => setOpenPanel(null),
            })
          )}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { SessionsScreenV2 });
