// Certificates — main list + tab router

const CertificatesV2 = ({ empty }) => {
  const [tab, setTab] = React.useState("all");
  const [q, setQ] = React.useState("");
  const [filters, setFilters] = React.useState({ status: "Any", source: "Any", type: "Any", resource: "Any" });
  const [selected, setSelected] = React.useState(new Set());
  const [columnsOpen, setColumnsOpen] = React.useState(false);
  const [discoverOpen, setDiscoverOpen] = React.useState(false);
  const [uploadMenuOpen, setUploadMenuOpen] = React.useState(false);

  const [showCreate, setShowCreate] = React.useState(false);
  const [showUpload, setShowUpload] = React.useState(false);
  const [showBulkUpload, setShowBulkUpload] = React.useState(false);
  const [discoverMode, setDiscoverMode] = React.useState(null);
  const [openId, setOpenId] = React.useState(null);
  const [renewId, setRenewId] = React.useState(null);
  const [addCA, setAddCA] = React.useState(false);

  const all = empty ? [] : (window.CERTS || []);
  let rows = all;
  if (q) rows = rows.filter(c => [c.display, c.cn, c.issuer, ...c.sans].some(v => String(v).toLowerCase().includes(q.toLowerCase())));
  if (filters.status === "Valid")    rows = rows.filter(c => c.status === "Valid");
  if (filters.status === "Expiring") rows = rows.filter(c => c.status === "Expiring" || c.status === "Critical");
  if (filters.status === "Expired")  rows = rows.filter(c => c.status === "Expired");
  if (filters.source !== "Any")      rows = rows.filter(c => c.source === filters.source);
  if (filters.type !== "Any")        rows = rows.filter(c => c.type === filters.type);

  const counts = {
    total: all.length,
    valid: all.filter(c => c.status === "Valid").length,
    in30:  all.filter(c => c.daysRemaining > 0 && c.daysRemaining <= 30).length,
    in7:   all.filter(c => c.daysRemaining > 0 && c.daysRemaining <= 7).length,
    expired: all.filter(c => c.daysRemaining < 0).length,
  };

  const ALL_COLS = [
    { id: "display",  label: "Display name", required: true },
    { id: "cn",       label: "Domain",       required: true },
    { id: "issuer",   label: "Issuer",       required: false },
    { id: "source",   label: "Source",       required: false },
    { id: "status",   label: "Status",       required: true },
    { id: "days",     label: "Days remaining", required: false },
    { id: "expires",  label: "Expiry date",  required: false },
    { id: "issued",   label: "Issued date",  required: false },
    { id: "uploaded", label: "Upload date",  required: false },
    { id: "resources",label: "Resources",    required: false },
  ];
  const [visibleCols, setVisibleCols] = React.useState(new Set(ALL_COLS.map(c => c.id)));
  const show = (id) => visibleCols.has(id);
  const toggleCol = (id) => setVisibleCols(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const allChecked = rows.length > 0 && rows.every(r => selected.has(r.id));
  const toggleSel = (id) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSelected(allChecked ? new Set() : new Set(rows.map(r => r.id)));

  // If create page is open, take over the screen
  if (showCreate) return <CertCreatePage onClose={() => setShowCreate(false)}/>;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
      <PageHeader
        title="Certificates"
        description="TLS/SSL certificate lifecycle. Upload, create, discover, renew — and link to the resources they protect."
        actions={<>
          <div style={{ position: "relative" }}>
            <button className="btn" onClick={() => setDiscoverOpen(o => !o)}><Icon name="discovery" size={12}/> Discover <Icon name="chevron-down" size={10}/></button>
            {discoverOpen && <>
              <div onClick={() => setDiscoverOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 30 }}/>
              <div style={{ position: "absolute", top: "calc(100% + 4px)", right: 0, zIndex: 31, width: 220, background: "var(--bg-app)", border: "1px solid var(--border)", borderRadius: 8, boxShadow: "var(--shadow-lg)", padding: 4 }}>
                {[["web","Scan web servers","discovery"],["aws","Import from AWS","cloud"],["gcp","Import from GCP","cloud"],["azure","Import from Azure","cloud"]].map(([m, l, i]) => (
                  <button key={m} className="btn btn-ghost btn-sm" style={{ width: "100%", justifyContent: "flex-start" }} onClick={() => { setDiscoverOpen(false); setDiscoverMode(m); }}><Icon name={i} size={11}/> {l}</button>
                ))}
              </div>
            </>}
          </div>
          <div style={{ position: "relative" }}>
            <button className="btn" onClick={() => setUploadMenuOpen(o => !o)}><Icon name="upload" size={12}/> Upload <Icon name="chevron-down" size={10}/></button>
            {uploadMenuOpen && <>
              <div onClick={() => setUploadMenuOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 30 }}/>
              <div style={{ position: "absolute", top: "calc(100% + 4px)", right: 0, zIndex: 31, width: 200, background: "var(--bg-app)", border: "1px solid var(--border)", borderRadius: 8, boxShadow: "var(--shadow-lg)", padding: 4 }}>
                <button className="btn btn-ghost btn-sm" style={{ width: "100%", justifyContent: "flex-start" }} onClick={() => { setUploadMenuOpen(false); setShowUpload(true); }}>Single certificate</button>
                <button className="btn btn-ghost btn-sm" style={{ width: "100%", justifyContent: "flex-start" }} onClick={() => { setUploadMenuOpen(false); setShowBulkUpload(true); }}>Bulk upload</button>
              </div>
            </>}
          </div>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Icon name="plus" size={12}/> Create certificate</button>
        </>}
      />

      {/* Tabs */}
      <TabBar
        active={tab}
        onChange={setTab}
        tabs={[
          { id: "all",  label: "All Certificates", weight: 1 },
          { id: "csr",  label: "CSRs",             weight: 2 },
          { separator: true },
          { id: "ca",   label: "CA Providers",     weight: 3 },
        ]}
      />

      {tab === "csr" && <CSRsTab onCreate={() => setShowCreate(true)}/>}
      {tab === "ca"  && <CAProvidersTab onAdd={() => setAddCA(true)}/>}

      {tab === "all" && (
        <>
          {(counts.in7 > 0 || counts.expired > 0) && (
            <div style={{ margin: "12px 24px 0", padding: 12, background: "var(--danger-soft)", borderRadius: 6, display: "flex", alignItems: "center", gap: 10, borderLeft: "3px solid var(--danger-fg)" }}>
              <Icon name="alert-circle" size={14} color="var(--danger-fg)"/>
              <div style={{ flex: 1, font: "400 12.5px/1.5 var(--font-sans)", color: "var(--danger-fg)" }}>
                <strong>⚑ {counts.in7 + counts.expired} certificate{counts.in7 + counts.expired > 1 ? "s" : ""}</strong> {counts.expired > 0 ? `expired or expiring within 7 days` : `expire within 7 days`} and must be renewed immediately.
              </div>
              <button className="btn btn-sm" onClick={() => setFilters({...filters, status: "Expiring"})}>Review now →</button>
            </div>
          )}
          {counts.in7 === 0 && counts.expired === 0 && counts.in30 > 0 && (
            <div style={{ margin: "12px 24px 0", padding: 12, background: "var(--warning-soft)", borderRadius: 6, display: "flex", alignItems: "center", gap: 10 }}>
              <Icon name="alert-circle" size={14} color="var(--warning-fg)"/>
              <div style={{ flex: 1, font: "400 12.5px/1.5 var(--font-sans)", color: "var(--warning-fg)" }}>
                <strong>⚠ {counts.in30} certificate{counts.in30 > 1 ? "s expire" : " expires"}</strong> within 30 days.
              </div>
              <button className="btn btn-sm" onClick={() => setFilters({...filters, status: "Expiring"})}>Review →</button>
            </div>
          )}

          {/* KPI strip */}
          <div style={{ padding: "14px 24px", borderBottom: "1px solid var(--border-subtle)", display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
            <KPICard label="Total certificates"  value={counts.total} active={filters.status === "Any"} onClick={() => setFilters({...filters, status: "Any"})}/>
            <KPICard label="Valid"               value={counts.valid} accent="var(--success-fg)" active={filters.status === "Valid"} onClick={() => setFilters({...filters, status: "Valid"})}/>
            <KPICard label="Expiring in 30 days" value={counts.in30}  accent="var(--warning-fg)" active={filters.status === "Expiring"} onClick={() => setFilters({...filters, status: "Expiring"})}/>
            <KPICard label="Expiring in 7 days"  value={counts.in7}   accent="var(--danger-fg)"  active={false}/>
            <KPICard label="Expired"             value={counts.expired} accent="var(--danger-fg)" active={filters.status === "Expired"} onClick={() => setFilters({...filters, status: "Expired"})}/>
          </div>

          {/* Toolbar */}
          <div style={{ padding: "10px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <div style={{ position: "relative", width: 240 }}>
              <Icon name="search" size={13} color="var(--fg-4)" style={{ position: "absolute", left: 10, top: 11 }}/>
              <input className="input" value={q} onChange={e => setQ(e.target.value)} placeholder="Search certificates…" style={{ paddingLeft: 30, height: 32, fontSize: 12.5 }}/>
            </div>
            <FilterDropdown label="Status"   value={filters.status}   onChange={v => setFilters({...filters, status: v})}   options={[["Any","All"],["Valid","Valid"],["Expiring","Expiring"],["Expired","Expired"]]}/>
            <FilterDropdown label="Source"   value={filters.source}   onChange={v => setFilters({...filters, source: v})}   options={[["Any","Any"],["Uploaded","Uploaded"],["Created","Created"],["AWS","AWS"],["Web Scan","Web Scan"]]}/>
            <FilterDropdown label="Type"     value={filters.type}     onChange={v => setFilters({...filters, type: v})}     options={[["Any","Any"],["SSL/TLS","SSL/TLS"],["Code Signing","Code Signing"],["Client Auth","Client Auth"]]}/>
            <FilterDropdown label="Resource" value={filters.resource} onChange={v => setFilters({...filters, resource: v})} options={[["Any","Any"]]}/>
            <div style={{ flex: 1 }}/>
            <button className="btn btn-sm" onClick={() => setShowBulkUpload(true)}><Icon name="upload" size={11}/> Bulk upload</button>
            <button className="btn btn-sm"><Icon name="download" size={11}/> Export</button>
            <div style={{ position: "relative" }}>
              <button className="btn btn-sm btn-icon" onClick={() => setColumnsOpen(o => !o)}><Icon name="columns" size={12}/></button>
              {columnsOpen && <>
                <div onClick={() => setColumnsOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 30 }}/>
                <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 31, width: 240, background: "var(--bg-app)", border: "1px solid var(--border)", borderRadius: 8, boxShadow: "var(--shadow-lg)", padding: 6 }}>
                  <div style={{ padding: "6px 10px 8px", font: "600 10.5px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.6, borderBottom: "1px solid var(--border-subtle)", marginBottom: 4 }}>Shown columns</div>
                  {ALL_COLS.map(c => (
                    <label key={c.id} style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 10px", borderRadius: 5, cursor: c.required ? "not-allowed" : "pointer", opacity: c.required ? 0.55 : 1 }}>
                      <input type="checkbox" checked={visibleCols.has(c.id)} disabled={c.required} onChange={() => !c.required && toggleCol(c.id)} style={{ accentColor: "var(--brand)" }}/>
                      <span style={{ flex: 1, font: "500 12.5px/1 var(--font-sans)", color: "var(--fg-1)" }}>{c.label}</span>
                      {c.required && <span style={{ font: "500 10px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.5 }}>Required</span>}
                    </label>
                  ))}
                </div>
              </>}
            </div>
          </div>

          {selected.size > 0 && (
            <div style={{ padding: "10px 24px", background: "var(--brand-soft)", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ font: "600 12.5px/1 var(--font-sans)", color: "var(--brand-fg)" }}>{selected.size} selected</span>
              <div style={{ flex: 1 }}/>
              <button className="btn btn-sm">Download</button>
              <button className="btn btn-sm">Export</button>
              <button className="btn btn-sm" style={{ color: "var(--danger-fg)" }}>Delete</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelected(new Set())}>Clear</button>
            </div>
          )}

          <div style={{ flex: 1, overflow: "auto" }}>
            {rows.length === 0 ? (
              all.length === 0 ? (
                <EmptyState icon="shield" title="No certificates managed yet"
                  description="Upload existing certificates, create new ones, or discover certificates deployed on your web servers and cloud accounts."
                  action={<>
                    <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Icon name="plus" size={11}/> Create certificate</button>
                    <button className="btn" onClick={() => setShowUpload(true)}><Icon name="upload" size={11}/> Upload certificate</button>
                    <button className="btn btn-ghost" onClick={() => setDiscoverMode("web")}><Icon name="discovery" size={11}/> Discover certificates</button>
                  </>}/>
              ) : (
                <div style={{ padding: 48, textAlign: "center", color: "var(--fg-3)" }}>
                  <Icon name="search" size={24} color="var(--fg-4)"/>
                  <div style={{ marginTop: 10, font: "500 13.5px/1.4 var(--font-sans)", color: "var(--fg-2)" }}>No certificates match those filters</div>
                </div>
              )
            ) : (
              <table className="table">
                <thead><tr>
                  <th style={{ width: 32 }}><input type="checkbox" checked={allChecked} onChange={toggleAll} style={{ accentColor: "var(--brand)" }}/></th>
                  {show("display")  && <th>Display name</th>}
                  {show("cn")       && <th>Domain / CN</th>}
                  {show("issuer")   && <th>Issuer</th>}
                  {show("source")   && <th>Source</th>}
                  {show("status")   && <th>Status</th>}
                  {show("days")     && <th style={{ textAlign: "right" }}>Days remaining</th>}
                  {show("expires")  && <th>Expiry date</th>}
                  {show("issued")   && <th>Issued date</th>}
                  {show("uploaded") && <th>Upload date</th>}
                  {show("resources")&& <th>Resources</th>}
                  <th></th>
                </tr></thead>
                <tbody>{rows.map(c => {
                  const borderLeft = c.daysRemaining < 0 ? "3px solid var(--danger-fg)" : c.daysRemaining <= 7 ? "3px solid var(--danger-fg)" : c.daysRemaining <= 30 ? "3px solid var(--warning-fg)" : "3px solid transparent";
                  const bg = c.daysRemaining < 0 ? "color-mix(in oklch, var(--danger-fg) 4%, transparent)" : "transparent";
                  return (
                    <tr key={c.id} onClick={() => setOpenId(c.id)} style={{ cursor: "pointer", borderLeft, background: bg }}>
                      <td onClick={e => e.stopPropagation()}><input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleSel(c.id)} style={{ accentColor: "var(--brand)" }}/></td>
                      {show("display")  && <td><span style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--brand-fg)" }}>{c.display}</span></td>}
                      {show("cn")       && <td className="t-mono" style={{ fontSize: 12, color: "var(--fg-1)" }}>{c.cn}</td>}
                      {show("issuer")   && <td style={{ fontSize: 12.5, color: "var(--fg-2)" }}>{c.issuer}</td>}
                      {show("source")   && <td><SourceBadgeCert source={c.source}/></td>}
                      {show("status")   && <td><CertStatusBadge status={c.status} days={c.daysRemaining}/></td>}
                      {show("days")     && <td style={{ textAlign: "right" }}><DaysChip days={c.daysRemaining}/></td>}
                      {show("expires")  && <td className="t-tiny" style={{ color: "var(--fg-3)" }}>{c.expires}</td>}
                      {show("issued")   && <td className="t-tiny" style={{ color: "var(--fg-3)" }}>{c.issued}</td>}
                      {show("uploaded") && <td className="t-tiny" style={{ color: "var(--fg-3)" }}>{c.uploadedOn}</td>}
                      {show("resources")&& <td>{c.resources.length === 0 ? <span style={{ color: "var(--fg-4)" }}>—</span> : <span style={{ padding: "1px 7px", borderRadius: 999, background: "var(--bg-surface-2)", font: "500 11.5px/1.5 var(--font-sans)", color: "var(--fg-2)" }} title={c.resources.join(", ")}>{c.resources.length} resource{c.resources.length === 1 ? "" : "s"}</span>}</td>}
                      <td onClick={e => e.stopPropagation()} style={{ textAlign: "right" }}>
                        {(c.status === "Expiring" || c.status === "Critical" || c.status === "Expired") ? <button className="btn btn-sm" onClick={() => setRenewId(c.id)}><Icon name="refresh" size={11}/> Renew</button> : <RowMenu items={[
                          { label: "View details", icon: "eye", onClick: () => setOpenId(c.id) },
                          { label: "Download", icon: "download", onClick: () => {} },
                          { label: "Renew", icon: "refresh", onClick: () => setRenewId(c.id) },
                          { label: "Link to resource", icon: "link", onClick: () => {} },
                          { label: "Edit display name", icon: "edit", onClick: () => {} },
                          { divider: true },
                          { label: "Delete", icon: "trash", danger: true, onClick: () => {} },
                        ]}/>}
                      </td>
                    </tr>
                  );
                })}</tbody>
              </table>
            )}
          </div>
        </>
      )}

      {openId        && <CertDetailPanel certId={openId} onClose={() => setOpenId(null)} onRenew={id => { setOpenId(null); setRenewId(id); }}/>}
      {renewId       && <CertRenewPanel certId={renewId} onClose={() => setRenewId(null)}/>}
      {showUpload    && <CertUploadPanel onClose={() => setShowUpload(false)}/>}
      {showBulkUpload && <CertBulkUploadPanel onClose={() => setShowBulkUpload(false)}/>}
      {discoverMode  && <CertDiscoverPanel mode={discoverMode} onClose={() => setDiscoverMode(null)}/>}
      {addCA         && <AddCAPanel onClose={() => setAddCA(false)}/>}
    </div>
  );
};

window.CertificatesV2 = CertificatesV2;
