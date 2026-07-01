// End-user File Browser — SFTP/SMB session surface
// Full-screen browser with toolbar, breadcrumb, file list, restricted overlays,
// upload/download/rename/move/delete/zip/preview interactions.

const FILE_TYPE_ICON = {
  folder: "📁", text: "📄", csv: "📄", excel: "📊", json: "📄", archive: "🗜", image: "🖼", pdf: "📑", script: "📜",
};

const SAMPLE_FILES = [
  { name: "archive",         type: "folder",  size: null,     mtime: "2 days ago",       perms: "rwxr-xr-x", restricted: true },
  { name: "quarterly",       type: "folder",  size: "14 items",mtime: "Today 09:14",     perms: "rwxr-xr-x" },
  { name: "temp",            type: "folder",  size: null,     mtime: "4 hours ago",      perms: "rwxr-xr-x", restricted: true },
  { name: "report_q1_2026.csv", type: "csv",  size: "2.4 MB", mtime: "Apr 15, 2026",      perms: "rw-r--r--" },
  { name: "report_q2_2026.csv", type: "csv",  size: "3.1 MB", mtime: "Today 08:30",       perms: "rw-r--r--" },
  { name: "summary_april.xlsx", type: "excel",size: "1.8 MB", mtime: "May 01, 2026",      perms: "rw-r--r--" },
  { name: "config.json",     type: "json",    size: "4.2 KB", mtime: "Mar 22, 2026",      perms: "rw-r--r--" },
  { name: "backup_march.zip",type: "archive", size: "48.2 MB",mtime: "Apr 01, 2026",      perms: "rw-r--r--" },
];

// Operations the policy permits at /var/data/reports/
const PERMITTED = new Set(["download","upload","open","list","create-folder"]);
const DENIED    = new Set(["delete","rename","move","zip"]);

const FileBrowserSession = ({ onClose }) => {
  const [path, setPath] = React.useState(["/", "var", "data", "reports"]);
  const [selected, setSelected] = React.useState(new Set());
  const [view, setView] = React.useState("list");
  const [bannerOpen, setBannerOpen] = React.useState(true);
  const [drawerFor, setDrawerFor] = React.useState(null); // restricted folder name
  const [renaming, setRenaming] = React.useState(null);
  const [creating, setCreating] = React.useState(false);
  const [newFolderName, setNewFolderName] = React.useState("New folder");
  const [preview, setPreview] = React.useState(null);
  const [movePicker, setMovePicker] = React.useState(false);
  const [deleteConfirm, setDeleteConfirm] = React.useState(false);
  const [zipPopover, setZipPopover] = React.useState(false);
  const [upload, setUpload] = React.useState(null); // {files, allowed}
  const [endConfirm, setEndConfirm] = React.useState(false);
  const [flash, setFlash] = React.useState(null);
  const [dragOver, setDragOver] = React.useState(false);

  const flashMsg = (text) => { setFlash(text); setTimeout(() => setFlash(null), 2400); };

  const toggle = (name) => setSelected(s => { const n = new Set(s); n.has(name) ? n.delete(name) : n.add(name); return n; });
  const onlyFolderSelected = selected.size > 0 && [...selected].every(n => SAMPLE_FILES.find(f => f.name === n)?.type === "folder");
  const hasFile = [...selected].some(n => SAMPLE_FILES.find(f => f.name === n)?.type !== "folder");
  const selectedFile = selected.size === 1 ? SAMPLE_FILES.find(f => f.name === [...selected][0]) : null;

  const denied = (op, msg) => { flashMsg(`⚠ ${msg || op + " blocked — not permitted by your policy"}`); };

  return (
    <div style={{ position: "fixed", inset: 0, background: "var(--bg-canvas)", zIndex: 100, display: "flex", flexDirection: "column" }}>
      {/* TOP BAR */}
      <div style={{ height: 56, padding: "0 20px", borderBottom: "1px solid var(--border)", background: "var(--bg-app)", display: "flex", alignItems: "center", gap: 14 }}>
        <BrandMark size={22}/>
        <span style={{ font: "600 13px/1 var(--font-sans)", color: "var(--fg-1)" }}>prod-db-primary</span>
        <span style={{ font: "500 11px/1 var(--font-mono)", color: "var(--fg-4)" }}>10.42.18.7:22</span>
        <span style={{ padding: "2px 8px", borderRadius: 4, background: "var(--bg-surface-2)", font: "500 11px/1.5 var(--font-sans)", color: "var(--fg-2)" }}>SFTP</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, font: "500 12px/1 var(--font-sans)", color: "var(--success-fg)" }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--success-fg)" }}/>Recording</span>
        <span style={{ padding: "2px 8px", borderRadius: 4, background: "var(--warning-soft)", font: "500 11px/1.5 var(--font-sans)", color: "var(--warning-fg)" }}>👁 Monitored</span>
        <div style={{ flex: 1 }}/>
        <span className="t-mono" style={{ font: "500 12px/1 var(--font-mono)", color: "var(--fg-3)" }}>8m 12s</span>
        <button className="btn" style={{ color: "var(--danger-fg)" }} onClick={() => setEndConfirm(true)}>End session</button>
      </div>

      {/* TOOLBAR */}
      <div style={{ padding: "10px 20px", borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-app)", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <button className="btn btn-ghost btn-icon btn-sm"><Icon name="chevron-left" size={12}/></button>
        <button className="btn btn-ghost btn-icon btn-sm"><Icon name="chevron-right" size={12}/></button>
        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => path.length > 1 && setPath(path.slice(0, -1))}><Icon name="chevron-up" size={12}/></button>
        <button className="btn btn-ghost btn-icon btn-sm"><Icon name="refresh" size={12}/></button>
        <div style={{ width: 1, height: 18, background: "var(--border)", margin: "0 4px" }}/>
        {/* Breadcrumb */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 4, font: "500 12.5px/1 var(--font-mono)" }}>
          {path.map((p, i) => (
            <React.Fragment key={i}>
              <button onClick={() => setPath(path.slice(0, i + 1))} style={{ background: "transparent", border: "none", padding: "2px 6px", borderRadius: 4, cursor: "pointer", color: i === path.length - 1 ? "var(--fg-1)" : "var(--brand-fg)", font: "500 12.5px/1 var(--font-mono)" }}>{p}</button>
              {i < path.length - 1 && <span style={{ color: "var(--fg-4)" }}>/</span>}
            </React.Fragment>
          ))}
          <button className="btn btn-ghost btn-icon btn-sm" style={{ marginLeft: 4 }} title="Copy path"><Icon name="copy" size={11}/></button>
        </div>

        {/* Action buttons */}
        {selected.size === 0 ? <>
          <OpBtn label="New folder" icon="plus" op="create-folder" onClick={() => setCreating(true)}/>
          <OpBtn label="Upload" icon="upload" op="upload" onClick={() => setUpload({ phase: "menu" })}/>
        </> : hasFile ? <>
          <OpBtn label="Download" icon="download" op="download" onClick={() => flashMsg(`✓ Downloading ${selected.size} file${selected.size > 1 ? "s" : ""}`)}/>
          <OpBtn label="Rename" icon="edit" op="rename" disabled={DENIED.has("rename")} onClick={() => DENIED.has("rename") ? denied("Rename") : setRenaming([...selected][0])}/>
          <OpBtn label="Copy" icon="copy" op="copy" disabled/>
          <OpBtn label="Move" icon="arrow-right" op="move" disabled={DENIED.has("move")} onClick={() => DENIED.has("move") ? denied("Move") : setMovePicker(true)}/>
          <OpBtn label="Delete" icon="trash" op="delete" disabled={DENIED.has("delete")} onClick={() => DENIED.has("delete") ? denied("Delete") : setDeleteConfirm(true)}/>
          <OpBtn label="Zip" icon="package" op="zip" disabled={DENIED.has("zip")} onClick={() => DENIED.has("zip") ? denied("Zip") : setZipPopover(true)}/>
          {selectedFile && PERMITTED.has("open") && <OpBtn label="Open" icon="external" op="open" onClick={() => setPreview(selectedFile)}/>}
        </> : <>
          <OpBtn label="Download as zip" icon="download" op="download" onClick={() => flashMsg("✓ Downloading folder as zip")}/>
          <OpBtn label="Rename" icon="edit" op="rename" disabled/>
          <OpBtn label="Move" icon="arrow-right" op="move" disabled/>
          <OpBtn label="Delete" icon="trash" op="delete" disabled/>
        </>}

        <div style={{ width: 1, height: 18, background: "var(--border)" }}/>
        <button className="btn btn-ghost btn-icon btn-sm" title="Search"><Icon name="search" size={12}/></button>
        <div style={{ display: "flex", padding: 2, background: "var(--bg-surface-2)", borderRadius: 4 }}>
          <button onClick={() => setView("list")} style={{ padding: "3px 7px", border: "none", borderRadius: 3, background: view === "list" ? "var(--bg-app)" : "transparent", cursor: "pointer" }}><Icon name="menu" size={11}/></button>
          <button onClick={() => setView("grid")} style={{ padding: "3px 7px", border: "none", borderRadius: 3, background: view === "grid" ? "var(--bg-app)" : "transparent", cursor: "pointer" }}><Icon name="grid" size={11}/></button>
        </div>
      </div>

      {/* Banner */}
      {bannerOpen && (
        <div style={{ margin: "10px 20px 0", padding: 10, background: "var(--brand-soft)", color: "var(--brand-fg)", borderRadius: 6, display: "flex", alignItems: "center", gap: 8, font: "400 12.5px/1.4 var(--font-sans)" }}>
          <Icon name="info" size={13}/>
          <span style={{ flex: 1 }}>Your policy allows: <strong>Download · Upload · Open · List · Create folder</strong> in this folder. Some operations are restricted.</span>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setBannerOpen(false)}><Icon name="x" size={11}/></button>
        </div>
      )}

      {/* FILE LIST */}
      <div style={{ flex: 1, overflow: "auto", padding: "12px 20px 20px" }}
        onDragEnter={() => setDragOver(true)}
        onDragLeave={() => setDragOver(false)}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); setDragOver(false); setUpload({ phase: "uploading", files: ["q2_data.csv","supplemental.xlsx","photos.zip"] }); setTimeout(() => setUpload({ phase: "done", files: ["q2_data.csv","supplemental.xlsx","photos.zip"] }), 1800); }}
      >
        {dragOver && (
          <div style={{ position: "absolute", inset: "12px 20px 20px", border: "2px dashed var(--brand)", borderRadius: 8, background: "var(--brand-soft)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", zIndex: 5 }}>
            <Icon name="upload" size={28} color="var(--brand-fg)"/>
            <div style={{ marginTop: 8, font: "600 14px/1.3 var(--font-sans)", color: "var(--brand-fg)" }}>Drop files here to upload to {path.join("/")}</div>
          </div>
        )}

        {view === "list" ? (
          <div className="card" style={{ overflow: "hidden" }}>
            <table className="table">
              <thead><tr>
                <th style={{ width: 32 }}><input type="checkbox" style={{ accentColor: "var(--brand)" }}/></th>
                <th>Name</th><th>Size</th><th>Type</th><th>Modified</th><th>Permissions</th><th></th>
              </tr></thead>
              <tbody>
                {creating && (
                  <tr>
                    <td><input type="checkbox" disabled/></td>
                    <td><div style={{ display: "flex", alignItems: "center", gap: 8 }}>📁<input className="input" autoFocus value={newFolderName} onChange={e => setNewFolderName(e.target.value)} style={{ height: 26, fontSize: 12.5 }}/><button className="btn btn-ghost btn-icon btn-sm" onClick={() => { setCreating(false); flashMsg(`✓ Folder "${newFolderName}" created`); setNewFolderName("New folder"); }}><Icon name="check" size={11} color="var(--success-fg)"/></button><button className="btn btn-ghost btn-icon btn-sm" onClick={() => { setCreating(false); setNewFolderName("New folder"); }}><Icon name="x" size={11}/></button></div></td>
                    <td colSpan={5}/>
                  </tr>
                )}
                {SAMPLE_FILES.map(f => {
                  const isFolder = f.type === "folder";
                  const sel = selected.has(f.name);
                  return <React.Fragment key={f.name}>
                    <tr
                      onClick={() => !f.restricted && toggle(f.name)}
                      onDoubleClick={() => { if (f.restricted) setDrawerFor(f.name); else if (isFolder) setPath([...path, f.name]); else if (PERMITTED.has("open")) setPreview(f); }}
                      style={{ background: sel ? "var(--brand-soft)" : "transparent", opacity: f.restricted ? 0.6 : 1, cursor: "pointer" }}
                    >
                      <td onClick={e => e.stopPropagation()}><input type="checkbox" checked={sel} disabled={f.restricted} onChange={() => toggle(f.name)} style={{ accentColor: "var(--brand)" }}/></td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ position: "relative", display: "inline-block" }}>
                            <span style={{ fontSize: 16 }}>{FILE_TYPE_ICON[f.type] || "📄"}</span>
                            {f.restricted && <span style={{ position: "absolute", right: -3, bottom: -3, fontSize: 8 }}>🔒</span>}
                          </span>
                          {renaming === f.name ? (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                              <input className="input" autoFocus defaultValue={f.name} style={{ height: 24, fontSize: 12.5 }}/>
                              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => { setRenaming(null); flashMsg("✓ Renamed"); }}><Icon name="check" size={10} color="var(--success-fg)"/></button>
                              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setRenaming(null)}><Icon name="x" size={10}/></button>
                            </span>
                          ) : (
                            <span className="t-mono" style={{ font: "500 12.5px/1 var(--font-mono)", color: f.restricted ? "var(--fg-3)" : isFolder ? "var(--brand-fg)" : "var(--fg-1)" }}>{f.name}{isFolder ? "/" : ""}</span>
                          )}
                        </div>
                      </td>
                      <td className="t-tiny" style={{ color: "var(--fg-3)" }}>{f.size || "—"}</td>
                      <td className="t-tiny" style={{ color: "var(--fg-3)", textTransform: "capitalize" }}>{f.type}</td>
                      <td className="t-tiny" style={{ color: "var(--fg-3)" }}>{f.mtime}</td>
                      <td className="t-mono t-tiny" style={{ color: "var(--fg-3)" }}>{f.perms}</td>
                      <td onClick={e => e.stopPropagation()} style={{ textAlign: "right" }}>
                        {f.restricted ? <span title="Restricted by policy" style={{ fontSize: 12 }}>🔒</span> : null}
                      </td>
                    </tr>
                    {drawerFor === f.name && (
                      <tr><td colSpan={7} style={{ background: "var(--bg-surface-2)" }}>
                        <div style={{ padding: 14, display: "flex", gap: 12, alignItems: "flex-start" }}>
                          <span style={{ fontSize: 18 }}>🔒</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ font: "600 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>Access restricted</div>
                            <div style={{ font: "400 12.5px/1.5 var(--font-sans)", color: "var(--fg-2)", marginTop: 4 }}>You don't have permission to access <span className="t-mono">{path.join("/")}/{f.name}/</span></div>
                            <div style={{ font: "400 12px/1.5 var(--font-sans)", color: "var(--fg-3)", marginTop: 2 }}>Your access policy does not include this folder.</div>
                            <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                              <button className="btn btn-sm btn-primary">Raise access ticket →</button>
                              <button className="btn btn-ghost btn-sm" onClick={() => setDrawerFor(null)}>Close</button>
                            </div>
                          </div>
                        </div>
                      </td></tr>
                    )}
                  </React.Fragment>;
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
            {SAMPLE_FILES.map(f => {
              const sel = selected.has(f.name);
              return <div key={f.name} onClick={() => !f.restricted && toggle(f.name)} style={{ padding: 14, border: `1px solid ${sel ? "var(--brand)" : "var(--border)"}`, background: sel ? "var(--brand-soft)" : "var(--bg-app)", borderRadius: 6, cursor: "pointer", textAlign: "center", opacity: f.restricted ? 0.55 : 1, position: "relative" }}>
                <div style={{ fontSize: 32 }}>{FILE_TYPE_ICON[f.type] || "📄"}</div>
                {f.restricted && <span style={{ position: "absolute", top: 8, right: 8, fontSize: 11 }}>🔒</span>}
                <div className="t-mono" style={{ marginTop: 6, font: "500 11.5px/1.3 var(--font-mono)", color: "var(--fg-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</div>
                <div className="t-tiny" style={{ color: "var(--fg-4)", marginTop: 2 }}>{f.size || "Folder"}</div>
              </div>;
            })}
          </div>
        )}
      </div>

      {/* STATUS BAR */}
      <div style={{ height: 32, padding: "0 20px", borderTop: "1px solid var(--border)", background: "var(--bg-surface)", display: "flex", alignItems: "center", gap: 14, font: "500 11.5px/1 var(--font-sans)" }}>
        <span style={{ color: "var(--fg-3)" }}>Session #SES-44218 · prod-db-primary · 8m 12s</span>
        <div style={{ flex: 1 }}/>
        <span style={{ color: "var(--fg-3)" }}>Uploaded: 0 B · Downloaded: 24.3 MB</span>
        <div style={{ flex: 1 }}/>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "var(--success-fg)" }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--success-fg)" }}/>Recording active</span>
      </div>

      {/* MODALS / PANELS */}
      {flash && (
        <div style={{ position: "fixed", bottom: 50, left: "50%", transform: "translateX(-50%)", padding: "8px 14px", background: flash.startsWith("⚠") ? "var(--warning-fg)" : "var(--fg-1)", color: "#fff", borderRadius: 6, font: "500 12.5px/1 var(--font-sans)", boxShadow: "0 4px 16px rgba(0,0,0,0.2)", zIndex: 110 }}>{flash}</div>
      )}

      {preview && <FilePreviewPanel file={preview} onClose={() => setPreview(null)}/>}
      {movePicker && <MovePickerPanel onClose={() => setMovePicker(false)} onMove={() => { setMovePicker(false); flashMsg("✓ Moved"); }}/>}
      {deleteConfirm && <ConfirmModal title={`Delete ${selected.size} item${selected.size > 1 ? "s" : ""}?`} body="This cannot be undone. Items will be permanently removed from the server." warning="⚠ Selected items will be permanently deleted." confirmLabel="Delete permanently" danger onClose={() => setDeleteConfirm(false)} onConfirm={() => { setSelected(new Set()); flashMsg("✓ Deleted"); }}/>}
      {zipPopover && <ZipPopover onClose={() => setZipPopover(false)} onConfirm={() => { setZipPopover(false); flashMsg("✓ archive.zip created"); }}/>}
      {upload && <UploadPanel state={upload} onClose={() => setUpload(null)} onPick={() => setUpload({ phase: "uploading", files: ["q2_data.csv","photos.zip"] })}/>}
      {endConfirm && <ConfirmModal title="End this session?" body="Your connection to prod-db-primary will be closed." confirmLabel="End session" danger onClose={() => setEndConfirm(false)} onConfirm={onClose}/>}
    </div>
  );
};

const OpBtn = ({ label, icon, op, disabled, onClick }) => (
  <button onClick={onClick} disabled={disabled} title={disabled ? "Not permitted by your access policy" : ""} style={{
    padding: "5px 10px", borderRadius: 5, border: "1px solid var(--border)",
    background: disabled ? "var(--bg-surface-2)" : "var(--bg-app)",
    color: disabled ? "var(--fg-4)" : "var(--fg-1)",
    font: "500 12px/1 var(--font-sans)", cursor: disabled ? "not-allowed" : "pointer",
    display: "inline-flex", alignItems: "center", gap: 5, position: "relative",
  }}>
    <Icon name={icon} size={11}/>{label}
    {disabled && <span style={{ position: "absolute", top: -2, right: -2, fontSize: 9 }}>🔒</span>}
  </button>
);

const FilePreviewPanel = ({ file, onClose }) => (
  <>
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.12)", zIndex: 110 }}/>
    <aside style={{ position: "fixed", top: 56, right: 0, bottom: 32, width: 640, background: "var(--bg-app)", borderLeft: "1px solid var(--border)", zIndex: 111, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
        <span className="t-mono" style={{ font: "600 13px/1 var(--font-mono)", color: "var(--fg-1)", flex: 1 }}>{file.name}</span>
        <span className="t-tiny" style={{ color: "var(--fg-3)" }}>{file.size} · {file.mtime}</span>
        <button className="btn btn-ghost btn-icon" onClick={onClose}><Icon name="x" size={14}/></button>
      </div>
      <div className="scroll-area" style={{ flex: 1, overflow: "auto", background: "#0a0b0d", color: "#c8ccd2", padding: 16, font: "12.5px/1.6 var(--font-mono)" }}>
        <div style={{ color: "#62666d", marginBottom: 8 }}>{"  1"} </div>
        <div><span style={{ color: "#62666d", marginRight: 12 }}>  2</span>quarter,product,revenue,growth</div>
        <div><span style={{ color: "#62666d", marginRight: 12 }}>  3</span>Q1,Enterprise,1247500,12.4</div>
        <div><span style={{ color: "#62666d", marginRight: 12 }}>  4</span>Q1,SMB,847200,8.2</div>
        <div><span style={{ color: "#62666d", marginRight: 12 }}>  5</span>Q2,Enterprise,1392800,11.6</div>
        <div><span style={{ color: "#62666d", marginRight: 12 }}>  6</span>Q2,SMB,920400,8.7</div>
      </div>
      <div style={{ padding: "10px 16px", borderTop: "1px solid var(--border)", display: "flex", gap: 8, background: "var(--bg-surface)" }}>
        <button className="btn btn-sm btn-primary"><Icon name="download" size={11}/> Download this file</button>
        <button className="btn btn-sm" disabled>Edit (read-only)</button>
        <div style={{ flex: 1 }}/>
        <button className="btn btn-sm" onClick={onClose}>Close</button>
      </div>
    </aside>
  </>
);

const MovePickerPanel = ({ onClose, onMove }) => {
  const [dest, setDest] = React.useState(null);
  const tree = [
    { path: "/var/data/", restricted: false, indent: 0 },
    { path: "/var/data/reports/", restricted: false, indent: 1, current: true },
    { path: "/var/data/reports/archive/", restricted: true, indent: 2 },
    { path: "/var/data/reports/quarterly/", restricted: false, indent: 2 },
    { path: "/var/data/reports/temp/", restricted: true, indent: 2 },
    { path: "/var/data/shared/", restricted: false, indent: 1 },
    { path: "/var/data/backup/", restricted: true, indent: 1 },
  ];
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.18)", zIndex: 110 }}/>
      <aside style={{ position: "fixed", top: 56, right: 0, bottom: 32, width: 460, background: "var(--bg-app)", borderLeft: "1px solid var(--border)", zIndex: 111, display: "flex", flexDirection: "column", boxShadow: "var(--shadow-lg)" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center" }}>
          <span style={{ flex: 1, font: "600 14px/1 var(--font-sans)", color: "var(--fg-1)" }}>Move to…</span>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><Icon name="x" size={14}/></button>
        </div>
        <div style={{ padding: 14 }}>
          <div style={{ position: "relative" }}>
            <Icon name="search" size={12} color="var(--fg-4)" style={{ position: "absolute", left: 10, top: 11 }}/>
            <input className="input" placeholder="Search folder name…" style={{ paddingLeft: 28, height: 32 }}/>
          </div>
        </div>
        <div className="scroll-area" style={{ flex: 1, overflow: "auto", padding: "0 14px" }}>
          {tree.map((t, i) => (
            <button key={i} onClick={() => !t.restricted && !t.current && setDest(t.path)} disabled={t.restricted || t.current}
              style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "7px 10px", paddingLeft: 10 + t.indent * 18, border: "none", borderRadius: 4,
                background: dest === t.path ? "var(--brand-soft)" : "transparent",
                color: t.restricted ? "var(--fg-4)" : t.current ? "var(--fg-3)" : dest === t.path ? "var(--brand-fg)" : "var(--fg-2)",
                font: "500 12.5px/1 var(--font-mono)", cursor: t.restricted || t.current ? "not-allowed" : "pointer", textAlign: "left", opacity: t.restricted ? 0.55 : 1, marginBottom: 2,
              }}>
              <span>📁</span><span style={{ flex: 1 }}>{t.path}</span>
              {t.restricted && <span style={{ fontSize: 11 }}>🔒</span>}
              {t.current && <span className="t-tiny" style={{ color: "var(--fg-4)" }}>(current)</span>}
            </button>
          ))}
        </div>
        <div style={{ padding: "10px 18px", borderTop: "1px solid var(--border)", background: "var(--bg-surface)" }}>
          {dest && <div style={{ font: "500 12px/1.4 var(--font-sans)", color: "var(--fg-3)", marginBottom: 8 }}>Move from <span className="t-mono" style={{ color: "var(--fg-1)" }}>/var/data/reports/</span> to <span className="t-mono" style={{ color: "var(--brand-fg)" }}>{dest}</span></div>}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button className="btn" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" disabled={!dest} onClick={onMove}>Move here</button>
          </div>
        </div>
      </aside>
    </>
  );
};

const ZipPopover = ({ onClose, onConfirm }) => {
  const [name, setName] = React.useState("archive.zip");
  return <>
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 110 }}/>
    <div style={{ position: "fixed", top: 100, left: "50%", transform: "translateX(-50%)", width: 380, background: "var(--bg-app)", border: "1px solid var(--border)", borderRadius: 8, padding: 16, boxShadow: "var(--shadow-lg)", zIndex: 111 }}>
      <div style={{ font: "600 13px/1 var(--font-sans)", color: "var(--fg-1)", marginBottom: 12 }}>Create archive</div>
      <Field label="Archive name" required><input className="input" value={name} onChange={e => setName(e.target.value)}/></Field>
      <Field label="Save in"><div style={{ font: "500 12px/1 var(--font-mono)", padding: "8px 10px", background: "var(--bg-surface-2)", borderRadius: 4, color: "var(--fg-3)" }}>/var/data/reports/</div></Field>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={onConfirm}>Compress and save</button>
      </div>
    </div>
  </>;
};

const UploadPanel = ({ state, onClose, onPick }) => {
  if (state.phase === "menu") return <>
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 110 }}/>
    <div style={{ position: "fixed", top: 110, left: "50%", transform: "translateX(-50%)", width: 280, background: "var(--bg-app)", border: "1px solid var(--border)", borderRadius: 8, padding: 6, boxShadow: "var(--shadow-lg)", zIndex: 111 }}>
      <button className="btn btn-ghost btn-sm" onClick={onPick} style={{ width: "100%", justifyContent: "flex-start" }}><Icon name="upload" size={11}/> From device</button>
      <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ width: "100%", justifyContent: "flex-start" }}><Icon name="external" size={11}/> Drag and drop here</button>
    </div>
  </>;
  // bottom panel
  return (
    <div style={{ position: "fixed", bottom: 32, right: 20, width: 360, background: "var(--bg-app)", border: "1px solid var(--border)", borderRadius: 8, padding: 14, boxShadow: "var(--shadow-lg)", zIndex: 110 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{ font: "600 12.5px/1 var(--font-sans)", color: "var(--fg-1)", flex: 1 }}>{state.phase === "uploading" ? "Uploading 3 files…" : "Upload complete"}</span>
        <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><Icon name="x" size={11}/></button>
      </div>
      {state.files.map((f, i) => (
        <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", font: "500 12px/1 var(--font-mono)" }}>
          <span style={{ flex: 1, color: state.phase === "done" ? "var(--success-fg)" : "var(--fg-2)" }}>{state.phase === "done" ? "✓" : "•"} {f}</span>
          {state.phase === "uploading" && <div style={{ width: 70, height: 4, background: "var(--bg-surface-2)", borderRadius: 999, overflow: "hidden" }}><div style={{ width: `${[40,75,30][i]}%`, height: "100%", background: "var(--brand)" }}/></div>}
        </div>
      ))}
    </div>
  );
};

Object.assign(window, { FileBrowserSession });
