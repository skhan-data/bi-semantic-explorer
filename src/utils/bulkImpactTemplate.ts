import { ImpactNode } from './impactAnalyzer';

export const generateBulkImpactHtml = (
  selectedItems: any[],
  downstreamImpacts: ImpactNode[],
  reportImpacts: { page: string, visual: string }[],
  modelName: string
): string => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bulk Deletion Impact Report - ${modelName}</title>
    <style>
        :root {
            --bg-color: #030712;
            --surface-color: #111827;
            --border-color: #1f2937;
            --text-main: #f9fafb;
            --text-muted: #9ca3af;
            --accent-main: #f97316;
            --accent-bg: rgba(249, 115, 22, 0.1);
            --danger-main: #ef4444;
            --danger-bg: rgba(239, 68, 68, 0.1);
            --warning-main: #f59e0b;
            --warning-bg: rgba(245, 158, 11, 0.1);
        }
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background-color: var(--bg-color);
            color: var(--text-main);
            margin: 0;
            padding: 40px 20px;
            line-height: 1.6;
        }
        .container {
            max-width: 1000px;
            margin: 0 auto;
        }
        .header {
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 1px solid var(--border-color);
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
        }
        .title h1 {
            margin: 0;
            font-size: 2.5rem;
            font-weight: 900;
            letter-spacing: -0.02em;
            color: var(--accent-main);
        }
        .title p {
            margin: 5px 0 0;
            color: var(--text-muted);
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            font-weight: 700;
        }
        .meta {
            text-align: right;
            font-size: 0.85rem;
            color: var(--text-muted);
        }
        .section {
            background-color: var(--surface-color);
            border: 1px solid var(--border-color);
            border-radius: 20px;
            padding: 30px;
            margin-bottom: 30px;
        }
        .section-title {
            font-size: 1rem;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.15em;
            margin: 0 0 20px 0;
            padding-bottom: 15px;
            border-bottom: 1px solid var(--border-color);
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .section-title.target { color: var(--accent-main); border-bottom-color: var(--accent-bg); }
        .section-title.logic { color: var(--warning-main); border-bottom-color: var(--warning-bg); }
        .section-title.visuals { color: var(--danger-main); border-bottom-color: var(--danger-bg); }

        .item-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 15px;
        }
        .card {
            background-color: rgba(0,0,0,0.2);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 15px;
        }
        .card.target { border-color: var(--border-color); }
        .card.logic { border-color: var(--warning-bg); background-color: var(--warning-bg); }
        .card.visual { border-color: var(--danger-bg); background-color: var(--danger-bg); }

        .card-name { font-weight: 700; font-size: 1rem; margin-bottom: 4px; }
        .target .card-name { color: var(--text-main); }
        .logic .card-name { color: var(--warning-main); }
        .visual .card-name { color: var(--danger-main); }

        .card-sub { font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; }
        
        .empty-state {
            padding: 20px;
            background: rgba(16, 185, 129, 0.1);
            color: #10b981;
            border: 1px solid rgba(16, 185, 129, 0.2);
            border-radius: 12px;
            font-weight: 700;
            text-align: center;
        }
        
        .print-btn {
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: var(--text-main);
            color: var(--bg-color);
            border: none;
            padding: 12px 24px;
            border-radius: 30px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            cursor: pointer;
            box-shadow: 0 10px 25px rgba(255,255,255,0.1);
        }
        @media print {
            .print-btn { display: none; }
            body { background: white; color: black; }
            .section { background: white; border-color: #ddd; }
            .card { background: #fafafa !important; border-color: #eee !important; box-shadow: none; }
            .title h1, .section-title.target { color: black; }
            .logic .card-name { color: #f59e0b; }
            .visual .card-name { color: #ef4444; }
        }
    </style>
</head>
<body>
    <div class="container">
        <header class="header">
            <div class="title">
                <h1>Bulk Impact Report</h1>
                <p>Model: ${modelName}</p>
            </div>
            <div class="meta">
                Generated: ${currentDate}<br>
                Target Items: <strong style="color:var(--accent-main)">${selectedItems.length}</strong>
            </div>
        </header>

        <div class="section">
            <h2 class="section-title target">1. Deletion Target Queue</h2>
            <div class="item-grid">
                ${selectedItems.map(item => `
                <div class="card target">
                    <div class="card-name">${item.name}</div>
                    <div class="card-sub">${item.tableName} • ${item._type.toUpperCase()}</div>
                </div>
                `).join('')}
            </div>
        </div>

        <div class="section">
            <h2 class="section-title logic">2. Cascading Logic Failures (Downstream Measures)</h2>
            ${downstreamImpacts.length === 0 ? `
                <div class="empty-state">0 secondary logic structural failures. Safe from DAX perspective.</div>
            ` : `
            <div class="item-grid">
                ${downstreamImpacts.map(node => `
                <div class="card logic">
                    <div class="card-name">${node.name}</div>
                    <div class="card-sub">${node.tableName}</div>
                </div>
                `).join('')}
            </div>
            `}
        </div>

        <div class="section">
            <h2 class="section-title visuals">3. High-Priority Visual Breakages (Reports)</h2>
            ${reportImpacts.length === 0 ? `
                <div class="empty-state">0 visual failures. These items are completely isolated from all reports.</div>
            ` : `
            <div class="item-grid">
                ${reportImpacts.map(r => `
                <div class="card visual">
                    <div class="card-name">Visual: ${r.visual}</div>
                    <div class="card-sub">Page: ${r.page}</div>
                </div>
                `).join('')}
            </div>
            `}
        </div>
    </div>
    <button class="print-btn" onclick="window.print()">Print Report</button>
</body>
</html>
  `;
};
