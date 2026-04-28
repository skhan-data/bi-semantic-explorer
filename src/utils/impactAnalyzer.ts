/**
 * Impact Analyzer
 * Graph traversal engine — no AI needed.
 * Click any item → see everything that depends on it (blast radius).
 */

import { PBIModel, PBIMeasure, PBIColumn } from '../types';

export interface ImpactNode {
  name: string;
  tableName: string;
  type: 'measure' | 'column';
  depth: number;
}

export interface ImpactResult {
  upstream: ImpactNode[];   // What this item depends ON
  downstream: ImpactNode[]; // What depends on THIS item
  affectedReports: { page: string; visual: string }[];
  blastRadius: number;      // Total affected items
}

/**
 * Resolve a DAX or unqualified name into a fully-qualified Table.Item key.
 */
function resolveDependencyKey(depName: string, model: PBIModel) {
  if (depName.includes('.')) return depName; // Already qualified
  
  // Try DAX extraction Table[Column]
  let cleanName = depName.replace(/'/g, ''); 
  const bracketIndex = cleanName.indexOf('[');
  if (bracketIndex !== -1) {
    let tName = cleanName.substring(0, bracketIndex).trim();
    let iName = cleanName.substring(bracketIndex + 1, cleanName.indexOf(']')).trim();
    if (tName) {
      return `${tName}.${iName}`;
    } else {
      depName = iName;
    }
  }

  for (const t of model.tables) {
    if (t.measures.some(m => m.name === depName) || t.columns.some(c => c.name === depName)) {
      return `${t.name}.${depName}`;
    }
  }
  return depName; // Fallback
}

/**
 * Build dependency adjacency lists from the model.
 */
function buildDependencyGraph(model: PBIModel) {
  // dependsOn[A] = [B, C] means A depends on B and C
  const dependsOn: Record<string, string[]> = {};
  // dependedBy[B] = [A] means B is depended on by A
  const dependedBy: Record<string, string[]> = {};

  for (const table of model.tables) {
    for (const measure of table.measures) {
      const key = `${table.name}.${measure.name}`;
      const deps: string[] = [];

      if (measure.dependencies) {
        measure.dependencies.measures.forEach(m => deps.push(resolveDependencyKey(m, model)));
        measure.dependencies.columns.forEach(c => deps.push(resolveDependencyKey(c, model)));
      }

      dependsOn[key] = deps;
      deps.forEach(dep => {
        if (!dependedBy[dep]) dependedBy[dep] = [];
        dependedBy[dep].push(key);
      });
    }

    for (const column of table.columns) {
      const key = `${table.name}.${column.name}`;
      const deps: string[] = [];

      if (column.dependencies) {
        column.dependencies.measures.forEach(m => deps.push(resolveDependencyKey(m, model)));
        column.dependencies.columns.forEach(c => deps.push(resolveDependencyKey(c, model)));
      }

      dependsOn[key] = deps;
      deps.forEach(dep => {
        if (!dependedBy[dep]) dependedBy[dep] = [];
        dependedBy[dep].push(key);
      });
    }
  }

  return { dependsOn, dependedBy };
}

/**
 * BFS traversal to find all nodes reachable from a starting node.
 */
function bfsTraverse(startKey: string, adjacency: Record<string, string[]>, model: PBIModel): ImpactNode[] {
  const visited = new Set<string>();
  const queue: { key: string; depth: number }[] = [{ key: startKey, depth: 0 }];
  const result: ImpactNode[] = [];

  visited.add(startKey);

  while (queue.length > 0) {
    const { key, depth } = queue.shift()!;

    if (depth > 0) {
      // Determine type
      const [tableName, ...nameParts] = key.split('.');
      const name = nameParts.join('.');
      const table = model.tables.find(t => t.name === tableName);
      const isMeasure = table?.measures.some(m => m.name === name);

      result.push({
        name: name || key,
        tableName: tableName || '',
        type: isMeasure ? 'measure' : 'column',
        depth,
      });
    }

    const neighbors = adjacency[key] || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push({ key: neighbor, depth: depth + 1 });
      }
    }
  }

  return result;
}

/**
 * Analyze the impact of a specific item.
 */
export function analyzeImpact(
  itemName: string,
  tableName: string,
  model: PBIModel
): ImpactResult {
  const { dependsOn, dependedBy } = buildDependencyGraph(model);
  const key = `${tableName}.${itemName}`;

  // Upstream: what this item depends on (follow dependsOn)
  const upstream = bfsTraverse(key, dependsOn, model);

  // Downstream: what depends on this item (follow dependedBy)
  const downstream = bfsTraverse(key, dependedBy, model);

  // Find affected reports
  const affectedReports: { page: string; visual: string }[] = [];
  const downstreamKeys = new Set(downstream.map(d => `${d.tableName}.${d.name}`));
  downstreamKeys.add(key); // Include self

  // 1. Try to find affected reports from model.reports (most accurate if populated)
  if (model.reports && model.reports.length > 0) {
    for (const report of model.reports) {
      for (const page of report.pages) {
        for (const visual of page.visuals) {
          const usedKeys = [
            ...(visual.usedMeasures || []),
            ...(visual.usedColumns || [])
          ].map(u => resolveDependencyKey(u, model));

          if (usedKeys.some(k => downstreamKeys.has(k))) {
            const visualId = visual.title || visual.type;
            if (!affectedReports.some(r => r.page === page.name && r.visual === visualId)) {
              affectedReports.push({ page: page.name, visual: visualId });
            }
          }
        }
      }
    }
  }

  // 2. Fallback: Check measure/column .reportUsage directly (in case model.reports is empty but usage is merged)
  for (const table of model.tables) {
    // Check Measures
    for (const measure of table.measures) {
      const mKey = `${table.name}.${measure.name}`;
      if (downstreamKeys.has(mKey) && measure.reportUsage) {
        measure.reportUsage.forEach(usage => {
          if (!affectedReports.some(r => r.page === usage.page && r.visual === usage.visual)) {
            affectedReports.push(usage);
          }
        });
      }
    }
    // Check Columns too
    for (const column of table.columns) {
      const cKey = `${table.name}.${column.name}`;
      if (downstreamKeys.has(cKey) && (column as any).reportUsage) {
        (column as any).reportUsage.forEach((usage: any) => {
          if (!affectedReports.some(r => r.page === usage.page && r.visual === usage.visual)) {
            affectedReports.push(usage);
          }
        });
      }
    }
  }

  return {
    upstream,
    downstream,
    affectedReports,
    blastRadius: downstream.length + affectedReports.length,
  };
}
