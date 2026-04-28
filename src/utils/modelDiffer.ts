/**
 * Model Differ
 * Deep comparison engine — no AI needed.
 * Compares two Power BI models and produces a structured diff report.
 */

import { PBIModel } from '../types';

export type DiffStatus = 'added' | 'removed' | 'modified' | 'unchanged';

export interface DiffItem {
  name: string;
  type: 'table' | 'measure' | 'column' | 'relationship' | 'page';
  status: DiffStatus;
  tableName?: string;
  details?: string; // Human-readable description of what changed
  oldValue?: string;
  newValue?: string;
}

export interface DiffSummary {
  added: number;
  removed: number;
  modified: number;
  unchanged: number;
}

export interface ModelDiffResult {
  tables: DiffItem[];
  measures: DiffItem[];
  columns: DiffItem[];
  relationships: DiffItem[];
  pages: DiffItem[];
  summary: DiffSummary;
}

/**
 * Compare two Power BI models and produce a diff report.
 * @param baseline The original / older model
 * @param comparison The new / updated model
 */
export function diffModels(baseline: PBIModel, comparison: PBIModel): ModelDiffResult {
  const tables: DiffItem[] = [];
  const measures: DiffItem[] = [];
  const columns: DiffItem[] = [];
  const relationships: DiffItem[] = [];
  const pages: DiffItem[] = [];

  const baseTableNames = new Set(baseline.tables.map(t => t.name));
  const compTableNames = new Set(comparison.tables.map(t => t.name));

  // --- Tables ---
  for (const table of comparison.tables) {
    if (!baseTableNames.has(table.name)) {
      tables.push({ name: table.name, type: 'table', status: 'added', details: `New table with ${table.columns.length} columns, ${table.measures.length} measures` });
    }
  }
  for (const table of baseline.tables) {
    if (!compTableNames.has(table.name)) {
      tables.push({ name: table.name, type: 'table', status: 'removed' });
    }
  }
  // Tables in both — check for column/measure changes
  for (const compTable of comparison.tables) {
    const baseTable = baseline.tables.find(t => t.name === compTable.name);
    if (!baseTable) continue;

    const colChanged = compTable.columns.length !== baseTable.columns.length;
    const measChanged = compTable.measures.length !== baseTable.measures.length;
    const descChanged = (compTable.description || '') !== (baseTable.description || '');

    if (colChanged || measChanged || descChanged) {
      tables.push({
        name: compTable.name,
        type: 'table',
        status: 'modified',
        details: [
          colChanged ? `Columns: ${baseTable.columns.length} → ${compTable.columns.length}` : null,
          measChanged ? `Measures: ${baseTable.measures.length} → ${compTable.measures.length}` : null,
          descChanged ? `Description updated` : null,
        ].filter(Boolean).join('; '),
      });
    } else {
      tables.push({ name: compTable.name, type: 'table', status: 'unchanged' });
    }
  }

  // --- Measures ---
  const baseMeasures = new Map<string, { expression: string; description?: string; tableName: string }>();
  baseline.tables.forEach(t => {
    t.measures.forEach(m => {
      baseMeasures.set(`${t.name}.${m.name}`, { expression: m.expression, description: m.description, tableName: t.name });
    });
  });

  const compMeasures = new Map<string, { expression: string; description?: string; tableName: string }>();
  comparison.tables.forEach(t => {
    t.measures.forEach(m => {
      compMeasures.set(`${t.name}.${m.name}`, { expression: m.expression, description: m.description, tableName: t.name });
    });
  });

  for (const [key, comp] of compMeasures) {
    const base = baseMeasures.get(key);
    if (!base) {
      measures.push({ name: key.split('.').slice(1).join('.'), type: 'measure', status: 'added', tableName: comp.tableName });
    } else if (base.expression !== comp.expression) {
      measures.push({
        name: key.split('.').slice(1).join('.'),
        type: 'measure',
        status: 'modified',
        tableName: comp.tableName,
        details: 'DAX expression changed',
        oldValue: base.expression,
        newValue: comp.expression,
      });
    } else {
      measures.push({ name: key.split('.').slice(1).join('.'), type: 'measure', status: 'unchanged', tableName: comp.tableName });
    }
  }
  for (const [key, base] of baseMeasures) {
    if (!compMeasures.has(key)) {
      measures.push({ name: key.split('.').slice(1).join('.'), type: 'measure', status: 'removed', tableName: base.tableName });
    }
  }

  // --- Columns ---
  const baseColumns = new Map<string, { dataType: string; tableName: string }>();
  baseline.tables.forEach(t => {
    t.columns.forEach(c => {
      baseColumns.set(`${t.name}.${c.name}`, { dataType: c.dataType, tableName: t.name });
    });
  });

  const compColumns = new Map<string, { dataType: string; tableName: string }>();
  comparison.tables.forEach(t => {
    t.columns.forEach(c => {
      compColumns.set(`${t.name}.${c.name}`, { dataType: c.dataType, tableName: t.name });
    });
  });

  for (const [key, comp] of compColumns) {
    const base = baseColumns.get(key);
    if (!base) {
      columns.push({ name: key.split('.').slice(1).join('.'), type: 'column', status: 'added', tableName: comp.tableName });
    } else if (base.dataType !== comp.dataType) {
      columns.push({
        name: key.split('.').slice(1).join('.'),
        type: 'column',
        status: 'modified',
        tableName: comp.tableName,
        details: `Data type: ${base.dataType} → ${comp.dataType}`,
      });
    }
  }
  for (const [key, base] of baseColumns) {
    if (!compColumns.has(key)) {
      columns.push({ name: key.split('.').slice(1).join('.'), type: 'column', status: 'removed', tableName: base.tableName });
    }
  }

  // --- Relationships ---
  const relKey = (r: { fromTable: string; fromColumn: string; toTable: string; toColumn: string }) =>
    `${r.fromTable}.${r.fromColumn}->${r.toTable}.${r.toColumn}`;

  const baseRels = new Set(baseline.relationships.map(relKey));
  const compRels = new Set(comparison.relationships.map(relKey));

  comparison.relationships.forEach(r => {
    const k = relKey(r);
    if (!baseRels.has(k)) {
      relationships.push({ name: k, type: 'relationship', status: 'added', details: `${r.fromTable} → ${r.toTable}` });
    }
  });
  baseline.relationships.forEach(r => {
    const k = relKey(r);
    if (!compRels.has(k)) {
      relationships.push({ name: k, type: 'relationship', status: 'removed', details: `${r.fromTable} → ${r.toTable}` });
    }
  });

  // --- Pages ---
  const basePages = new Map<string, { visualsCount: number; reportName: string }>();
  (baseline.reports || []).forEach(r => {
    r.pages.forEach(p => {
      basePages.set(`${r.name}/${p.name}`, { visualsCount: p.visuals?.length || 0, reportName: r.name });
    });
  });

  const compPages = new Map<string, { visualsCount: number; reportName: string }>();
  (comparison.reports || []).forEach(r => {
    r.pages.forEach(p => {
      compPages.set(`${r.name}/${p.name}`, { visualsCount: p.visuals?.length || 0, reportName: r.name });
    });
  });

  for (const [key, comp] of compPages) {
    const base = basePages.get(key);
    const pageName = key.split('/')[1];
    if (!base) {
      pages.push({ name: pageName, type: 'page', status: 'added', tableName: comp.reportName, details: `${comp.visualsCount} visuals` });
    } else if (base.visualsCount !== comp.visualsCount) {
      pages.push({
        name: pageName,
        type: 'page',
        status: 'modified',
        tableName: comp.reportName,
        details: `Visuals count changed: ${base.visualsCount} → ${comp.visualsCount}`
      });
    } else {
      pages.push({ name: pageName, type: 'page', status: 'unchanged', tableName: comp.reportName });
    }
  }
  for (const [key, base] of basePages) {
    if (!compPages.has(key)) {
      const pageName = key.split('/')[1];
      pages.push({ name: pageName, type: 'page', status: 'removed', tableName: base.reportName });
    }
  }

  // --- Summary ---
  const allItems = [...tables, ...measures, ...columns, ...relationships, ...pages];
  const summary: DiffSummary = {
    added: allItems.filter(i => i.status === 'added').length,
    removed: allItems.filter(i => i.status === 'removed').length,
    modified: allItems.filter(i => i.status === 'modified').length,
    unchanged: allItems.filter(i => i.status === 'unchanged').length,
  };

  return { tables, measures, columns, relationships, pages, summary };
}
