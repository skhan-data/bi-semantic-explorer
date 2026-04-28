import { PBIModel, PBITable, PBIMeasure, PBIColumn } from '../types';
import { ModelDiffResult } from './modelDiffer';

const escapeHtml = (str: string) => {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
};

export const generateAuditHtml = (model: PBIModel, metadata: { summary?: string, version?: string } = {}, diffResult?: ModelDiffResult) => {
  const timestamp = new Date().toLocaleString();
  const totalTables = model.tables.length;
  const totalMeasures = model.tables.reduce((a, t) => a + (t.measures?.length || 0), 0);
  const totalColumns = model.tables.reduce((a, t) => a + (t.columns?.length || 0), 0);
  const totalRelationships = model.relationships?.length || 0;
  const totalReports = model.reports?.length || 0;

  const unusedMeasures = model.tables.flatMap(t => t.measures.filter(m => m.isUsed === false));
  const hiddenTables = model.tables.filter(t => t.isHidden);

  // Build table sections
  const tableSections = model.tables.map(table => {
    const measures = table.measures || [];
    const columns = table.columns || [];
    const storageMode = table.storageMode || 'Import';
    const isHidden = table.isHidden ? '<span class="badge badge-warn">HIDDEN</span>' : '';
    const desc = table.description ? `<p class="desc">${escapeHtml(table.description)}</p>` : '';

    const measureRows = measures.map(m => {
      const deps = m.dependencies;
      const depHtml = (deps?.measures?.length || deps?.columns?.length)
        ? `<div class="deps">
            ${deps?.measures?.length ? `<span class="dep-label">→ Measures:</span> ${deps.measures.map(d => `<code>${escapeHtml(d)}</code>`).join(', ')}` : ''}
            ${deps?.columns?.length ? `<span class="dep-label">→ Columns:</span> ${deps.columns.map(d => `<code>${escapeHtml(d)}</code>`).join(', ')}` : ''}
           </div>`
        : '';

      const usageHtml = m.reportUsage?.length
        ? `<div class="usage">Used in: ${m.reportUsage.map(u => `<span class="usage-tag">${escapeHtml(u.page)} › ${escapeHtml(u.visual)}</span>`).join(' ')}</div>`
        : '';

      const unusedTag = m.isUsed === false ? '<span class="badge badge-danger">UNUSED</span>' : '';
      const hiddenTag = m.isHidden ? '<span class="badge badge-warn">HIDDEN</span>' : '';
      const formatTag = m.formatString ? `<span class="badge badge-info">${escapeHtml(m.formatString)}</span>` : '';

      return `
        <div class="item measure-item">
          <div class="item-header">
            <strong>${escapeHtml(m.name)}</strong>
            <div class="tags">${unusedTag}${hiddenTag}${formatTag}</div>
          </div>
          ${m.description ? `<p class="item-desc">${escapeHtml(m.description)}</p>` : ''}
          <pre class="dax-block">${escapeHtml(m.expression)}</pre>
          ${depHtml}
          ${usageHtml}
        </div>`;
    }).join('');

    const columnRows = columns.map(c => {
      const calcTag = c.expression ? '<span class="badge badge-accent">CALC</span>' : '';
      const hiddenTag = c.isHidden ? '<span class="badge badge-warn">HIDDEN</span>' : '';
      return `
        <div class="item column-item">
          <div class="item-header">
            <strong>${escapeHtml(c.name)}</strong>
            <div class="tags">
              <span class="badge">${escapeHtml(c.dataType)}</span>
              ${calcTag}${hiddenTag}
            </div>
          </div>
          ${c.expression ? `<pre class="dax-block">${escapeHtml(c.expression)}</pre>` : ''}
        </div>`;
    }).join('');

    return `
      <div class="table-section">
        <div class="table-header">
          <div>
            <span class="table-name">${escapeHtml(table.name)}</span>
            ${isHidden}
            <span class="badge badge-storage">${escapeHtml(storageMode)}</span>
          </div>
          <span class="table-counts">${measures.length} Measures · ${columns.length} Columns</span>
        </div>
        ${desc}
        <div class="table-body">
          ${measures.length ? `
            <div class="sub-section">
              <h4>⚡ Measures (${measures.length})</h4>
              <div class="items">${measureRows}</div>
            </div>` : ''}
          ${columns.length ? `
            <div class="sub-section">
              <h4>📊 Columns (${columns.length})</h4>
              <div class="items">${columnRows}</div>
            </div>` : ''}
        </div>
      </div>`;
  }).join('');

  // Relationships section
  const relSection = model.relationships?.length ? model.relationships.map(r => `
    <div class="rel-row">
      <code>${escapeHtml(r.fromTable)}[${escapeHtml(r.fromColumn)}]</code>
      <span class="rel-arrow">${escapeHtml(r.fromCardinality || '*')} ──→ ${escapeHtml(r.toCardinality || '1')}</span>
      <code>${escapeHtml(r.toTable)}[${escapeHtml(r.toColumn)}]</code>
      <span class="badge badge-info">${escapeHtml(r.crossFilteringBehavior)}</span>
    </div>`).join('') : '<p class="empty">No relationships defined.</p>';

  // Unused measures section
  const unusedSection = unusedMeasures.length
    ? unusedMeasures.map(m => `
        <div class="unused-item">
          <strong>${escapeHtml(m.name)}</strong>
          <span class="unused-table">${escapeHtml(m.tableName || '')}</span>
        </div>`).join('')
    : '<p class="empty">All measures are in use. ✓</p>';

  // Report section
  const reportSection = model.reports?.length
    ? model.reports.map(report => `
        <div class="report-block">
          <h4 class="report-name">📄 ${escapeHtml(report.name)}</h4>
          ${report.pages.map(page => `
            <div class="page-block">
              <h5>${escapeHtml(page.name)} <span class="text-muted">(${page.visuals.length} visuals)</span></h5>
              <div class="visual-grid">
                ${page.visuals.map(v => `
                  <div class="visual-card">
                    <span class="visual-type">${escapeHtml(v.type)}</span>
                    ${v.title ? `<span class="visual-title">${escapeHtml(v.title)}</span>` : ''}
                    ${v.usedMeasures?.length ? `<div class="visual-fields">Fields: ${v.usedMeasures.map(f => `<code>${escapeHtml(f)}</code>`).join(', ')}</div>` : ''}
                  </div>`).join('')}
              </div>
            </div>`).join('')}
        </div>`).join('')
    : '<p class="empty">No report data available.</p>';

  let diffSectionHTML = '';
  if (diffResult) {
    const allChanged = [
      ...diffResult.tables,
      ...diffResult.measures,
      ...diffResult.columns,
      ...diffResult.relationships,
      ...(diffResult.pages || [])
    ].filter(i => i.status !== 'unchanged');

    if (allChanged.length > 0) {
      const getStatusClass = (status: string) => {
        if (status === 'added') return 'badge badge-info';
        if (status === 'removed') return 'badge badge-danger';
        return 'badge badge-warn';
      };

      const diffItemsHTML = allChanged.map(item => `
        <div class="item diff-item" style="background: var(--card2); border: 1px solid var(--border); border-radius: 0.75rem; padding: 1rem; margin-bottom: 0.5rem;">
          <div class="item-header" style="margin-bottom: 0.5rem;">
            <strong>${escapeHtml(item.name)}</strong>
            <div class="tags">
              <span class="badge badge-storage">${escapeHtml(item.type)}</span>
              <span class="${getStatusClass(item.status)}">${escapeHtml(item.status)}</span>
              ${item.tableName ? `<span class="unused-table" style="color:var(--muted);font-size:0.7rem;margin-left:0.5rem;">in ${escapeHtml(item.tableName)}</span>` : ''}
            </div>
          </div>
          ${item.details ? `<p class="item-desc" style="color:var(--muted);font-size:0.8rem;margin-bottom:0.5rem;">${escapeHtml(item.details)}</p>` : ''}
          ${item.oldValue && item.newValue ? `
            <div style="display: flex; gap: 1rem; margin-top: 0.75rem;">
               <div style="flex: 1; padding: 0.75rem; background: var(--red-bg); border: 1px solid var(--red); border-radius: 0.5rem;">
                 <div style="font-size: 0.6rem; color: var(--red); font-weight: bold; margin-bottom: 0.5rem;">OLD</div>
                 <pre style="font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; color: #ef4444; white-space: pre-wrap;">${escapeHtml(item.oldValue)}</pre>
               </div>
               <div style="flex: 1; padding: 0.75rem; background: var(--green-bg); border: 1px solid var(--green); border-radius: 0.5rem;">
                 <div style="font-size: 0.6rem; color: var(--green); font-weight: bold; margin-bottom: 0.5rem;">NEW</div>
                 <pre style="font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; color: #10b981; white-space: pre-wrap;">${escapeHtml(item.newValue)}</pre>
               </div>
            </div>
          ` : ''}
        </div>
      `).join('');

      diffSectionHTML = `
      <section class="section" id="diff-section">
        <h3 class="section-title">Model Structural Changes vs Baseline</h3>
        <div style="display: flex; gap: 1rem; margin-bottom: 1.5rem; background: var(--card2); padding: 1rem; border: 1px solid var(--border); border-radius: 1rem;">
          <span style="color: var(--green); font-weight: bold;">+${diffResult.summary.added} Added</span>
          <span style="color: var(--amber); font-weight: bold;">~${diffResult.summary.modified} Modified</span>
          <span style="color: var(--red); font-weight: bold;">-${diffResult.summary.removed} Removed</span>
        </div>
        <div class="items">${diffItemsHTML}</div>
      </section>
      `;
    } else {
      diffSectionHTML = `
      <section class="section" id="diff-section">
        <h3 class="section-title">Model Structural Changes vs Baseline</h3>
        <p class="empty" style="padding: 1rem; border: 1px dashed var(--green); border-radius: 1rem; color: var(--green); text-align: center;">Models are perfectly identical. ✓</p>
      </section>
      `;
    }
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BI Semantic Explorer | Technical Audit | ${escapeHtml(model.name)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0a0a0a; --card: #141414; --card2: #1a1a1a; --border: #2a2a2a;
      --fg: #f1f5f9; --muted: #64748b; --green: #10b981; --amber: #f59e0b;
      --red: #ef4444; --blue: #3b82f6; --green-bg: #10b98115; --amber-bg: #f59e0b15;
      --red-bg: #ef444415; --blue-bg: #3b82f615;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; background: var(--bg); color: var(--fg); line-height: 1.6; }
    .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }

    /* Header */
    .audit-header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 2rem; border-bottom: 1px solid var(--border); margin-bottom: 2rem; }
    .brand h1 { font-size: 1.8rem; font-weight: 900; letter-spacing: -0.04em; }
    .brand h1 span { color: var(--green); }
    .brand p { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.2em; color: var(--muted); font-weight: 700; margin-top: 0.25rem; }
    .meta { text-align: right; }
    .meta-label { font-size: 0.55rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; color: var(--green); }
    .meta-value { font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; color: var(--muted); }

    /* Stats */
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-bottom: 2.5rem; }
    .stat { background: var(--card); border: 1px solid var(--border); border-radius: 1rem; padding: 1.25rem; }
    .stat-label { font-size: 0.6rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; color: var(--muted); }
    .stat-value { font-size: 2rem; font-weight: 900; margin-top: 0.25rem; }
    .stat-value.green { color: var(--green); }
    .stat-value.amber { color: var(--amber); }
    .stat-value.red { color: var(--red); }
    .stat-value.blue { color: var(--blue); }

    /* Sections */
    .section { margin-bottom: 3rem; }
    .section-title { font-size: 1.1rem; font-weight: 900; margin-bottom: 1.25rem; display: flex; align-items: center; gap: 0.75rem; }
    .section-title::before { content: ''; width: 4px; height: 1.25rem; background: var(--green); border-radius: 10px; }

    /* Table sections */
    .table-section { background: var(--card); border: 1px solid var(--border); border-radius: 1rem; margin-bottom: 1rem; overflow: hidden; }
    .table-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.25rem; }
    .table-name { font-weight: 700; font-size: 1rem; color: var(--green); }
    .table-counts { font-size: 0.65rem; color: var(--muted); font-weight: 700; text-transform: uppercase; }
    .table-body { padding: 0 1.25rem 1.25rem; }
    .desc { font-size: 0.8rem; color: var(--muted); padding: 0 1.25rem 0.75rem; font-style: italic; }

    /* Sub-sections */
    .sub-section { margin-top: 1rem; }
    .sub-section h4 { font-size: 0.7rem; font-weight: 900; text-transform: uppercase; color: var(--muted); letter-spacing: 0.05em; margin-bottom: 0.75rem; }
    .items { display: flex; flex-direction: column; gap: 0.5rem; }
    .item { background: var(--card2); border: 1px solid var(--border); border-radius: 0.75rem; padding: 0.75rem 1rem; }
    .item-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; }
    .item-desc { font-size: 0.75rem; color: var(--muted); margin-top: 0.25rem; font-style: italic; }
    .tags { display: flex; gap: 0.35rem; flex-wrap: wrap; }

    /* DAX */
    .dax-block { font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; background: #000; color: #d1d5db; padding: 0.75rem; border-radius: 0.5rem; white-space: pre-wrap; word-break: break-all; border-left: 3px solid var(--amber); margin-top: 0.5rem; }

    /* Dependencies */
    .deps { margin-top: 0.5rem; font-size: 0.7rem; color: var(--muted); }
    .dep-label { color: var(--blue); font-weight: 700; margin-right: 0.25rem; }
    .deps code { background: var(--blue-bg); color: var(--blue); padding: 0.1rem 0.4rem; border-radius: 4px; font-size: 0.65rem; }

    /* Usage */
    .usage { margin-top: 0.4rem; font-size: 0.65rem; color: var(--muted); }
    .usage-tag { background: var(--green-bg); color: var(--green); padding: 0.1rem 0.5rem; border-radius: 4px; font-size: 0.6rem; margin-right: 0.25rem; }

    /* Badges */
    .badge { display: inline-block; padding: 0.1rem 0.45rem; border-radius: 4px; font-size: 0.55rem; font-weight: 900; text-transform: uppercase; background: var(--green); color: #000; }
    .badge-warn { background: var(--amber-bg); color: var(--amber); }
    .badge-danger { background: var(--red-bg); color: var(--red); }
    .badge-info { background: var(--blue-bg); color: var(--blue); }
    .badge-accent { background: var(--amber-bg); color: var(--amber); }
    .badge-storage { background: var(--card2); color: var(--muted); border: 1px solid var(--border); }

    /* Relationships */
    .rel-row { display: flex; align-items: center; gap: 0.75rem; background: var(--card); border: 1px solid var(--border); border-radius: 0.75rem; padding: 0.75rem 1rem; margin-bottom: 0.5rem; font-size: 0.8rem; flex-wrap: wrap; }
    .rel-row code { background: var(--card2); padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem; color: var(--green); }
    .rel-arrow { color: var(--muted); font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; }

    /* Unused */
    .unused-item { display: flex; justify-content: space-between; align-items: center; background: var(--red-bg); border: 1px solid #ef444430; border-radius: 0.75rem; padding: 0.6rem 1rem; margin-bottom: 0.4rem; font-size: 0.8rem; }
    .unused-table { font-size: 0.7rem; color: var(--muted); }

    /* Reports */
    .report-block { background: var(--card); border: 1px solid var(--border); border-radius: 1rem; padding: 1.25rem; margin-bottom: 1rem; }
    .report-name { font-size: 0.9rem; font-weight: 700; margin-bottom: 0.75rem; }
    .page-block { margin-bottom: 1rem; }
    .page-block h5 { font-size: 0.75rem; font-weight: 700; margin-bottom: 0.5rem; }
    .text-muted { color: var(--muted); font-weight: 400; }
    .visual-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.5rem; }
    .visual-card { background: var(--card2); border: 1px solid var(--border); border-radius: 0.5rem; padding: 0.5rem 0.75rem; font-size: 0.7rem; }
    .visual-type { font-weight: 700; color: var(--blue); text-transform: uppercase; font-size: 0.6rem; }
    .visual-title { display: block; margin-top: 0.15rem; }
    .visual-fields { margin-top: 0.25rem; color: var(--muted); }
    .visual-fields code { background: var(--green-bg); color: var(--green); padding: 0.05rem 0.3rem; border-radius: 3px; font-size: 0.6rem; }

    .empty { font-size: 0.8rem; color: var(--muted); font-style: italic; }

    /* Search */
    .search-box { width: 100%; background: var(--card); border: 1px solid var(--border); border-radius: 0.75rem; padding: 0.75rem 1rem; color: #fff; font-size: 0.85rem; outline: none; margin-bottom: 2rem; }
    .search-box:focus { border-color: var(--green); box-shadow: 0 0 0 3px var(--green-bg); }

    /* Footer */
    footer { margin-top: 4rem; text-align: center; padding: 2rem; border-top: 1px solid var(--border); color: var(--muted); font-size: 0.7rem; }

    @media print { body { background: #fff; color: #000; } .badge { border: 1px solid #ccc; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="audit-header">
      <div class="brand">
        <h1>SEMANTIC <span>EXPLORER</span></h1>
        <p>Complete Technical Audit · ${escapeHtml(model.name)} ${metadata.version ? `· v${escapeHtml(metadata.version)}` : ''}</p>
      </div>
      <div class="meta">
        <div class="meta-label">Generated</div>
        <div class="meta-value">${timestamp}</div>
      </div>
    </div>

    ${metadata.version ? `
    <div style="margin-bottom: 2rem; display: flex; gap: 0.5rem; align-items: center;">
      <span class="badge badge-info">Version ${escapeHtml(metadata.version)}</span>
      <span class="badge badge-storage">Official Audit</span>
    </div>` : ''}

    <section class="stats">
      <div class="stat"><div class="stat-label">Tables</div><div class="stat-value green">${totalTables}</div></div>
      <div class="stat"><div class="stat-label">Measures</div><div class="stat-value amber">${totalMeasures}</div></div>
      <div class="stat"><div class="stat-label">Columns</div><div class="stat-value blue">${totalColumns}</div></div>
      <div class="stat"><div class="stat-label">Relationships</div><div class="stat-value">${totalRelationships}</div></div>
      <div class="stat"><div class="stat-label">Reports</div><div class="stat-value">${totalReports}</div></div>
      <div class="stat"><div class="stat-label">Unused Measures</div><div class="stat-value red">${unusedMeasures.length}</div></div>
    </section>

    ${metadata.summary ? `
    <section class="section">
      <h3 class="section-title">Executive Summary</h3>
      <div style="background: var(--card); border: 1px solid var(--border); border-radius: 1rem; padding: 1.5rem; line-height: 1.6; color: #fff; white-space: pre-wrap; font-size: 0.85rem;">${escapeHtml(metadata.summary)}</div>
    </section>` : ''}

    <input type="text" class="search-box" id="search" placeholder="Search tables, measures, columns..." />

    <section class="section">
      <h3 class="section-title">Model Structure</h3>
      <div id="table-container">${tableSections}</div>
    </section>

    <section class="section">
      <h3 class="section-title">Relationships (${totalRelationships})</h3>
      <div>${relSection}</div>
    </section>

    ${unusedMeasures.length > 0 ? `
    <section class="section">
      <h3 class="section-title">⚠ Unused Measures (${unusedMeasures.length})</h3>
      <div>${unusedSection}</div>
    </section>` : ''}

    ${diffSectionHTML}

    ${model.reports?.length ? `
    <section class="section">
      <h3 class="section-title">Report Analysis</h3>
      <div>${reportSection}</div>
    </section>` : ''}

    <div id="no-results" style="display: none; text-align: center; padding: 3rem; color: var(--muted); border: 1px dashed var(--border); border-radius: 1rem;">
      <p>No matching elements found in this audit.</p>
    </div>

    <footer>
      BI Semantic Explorer · Technical Audit · ${escapeHtml(model.name)} · ${timestamp}
    </footer>
  </div>

  <script>
    const searchInput = document.getElementById('search');
    const sections = document.querySelectorAll('.section');
    const noResults = document.getElementById('no-results');

    const updateFilter = () => {
      const q = searchInput.value.toLowerCase().trim();
      let totalVisibleSections = 0;

      sections.forEach(section => {
        let sectionHasMatch = false;

        // 1. Table Sections (Granular)
        const tableSections = section.querySelectorAll('.table-section');
        tableSections.forEach(table => {
          const tableName = table.querySelector('.table-name').textContent.toLowerCase();
          const tableMatches = tableName.includes(q);
          let itemsVisible = 0;

          const items = table.querySelectorAll('.item');
          items.forEach(item => {
            const itemMatches = item.textContent.toLowerCase().includes(q);
            item.style.display = (itemMatches || (tableMatches && q !== '')) ? '' : 'none';
            if (itemMatches || (tableMatches && q !== '')) itemsVisible++;
          });

          table.querySelectorAll('.sub-section').forEach(sub => {
            const visible = Array.from(sub.querySelectorAll('.item')).some(i => i.style.display !== 'none');
            sub.style.display = visible ? '' : 'none';
          });

          const tableVisible = tableMatches || itemsVisible > 0;
          table.style.display = tableVisible ? '' : 'none';
          if (tableVisible) sectionHasMatch = true;
        });

        // 2. Others
        const otherBlocks = section.querySelectorAll('.rel-row, .unused-item, .report-block');
        otherBlocks.forEach(block => {
          const matches = block.textContent.toLowerCase().includes(q);
          block.style.display = matches ? '' : 'none';
          if (matches) sectionHasMatch = true;
        });

        const isVisible = q === '' || sectionHasMatch;
        section.style.display = isVisible ? '' : 'none';
        if (isVisible) totalVisibleSections++;
      });

      noResults.style.display = (totalVisibleSections === 0 && q !== '') ? 'block' : 'none';
    };

    searchInput.addEventListener('input', updateFilter);
    // Ensure it runs once on load if there's an initial value (though rare)
    updateFilter();
  </script>
</body>
</html>`;
};
