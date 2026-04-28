/**
 * Model Health Scorer
 * Deterministic quality audit — no AI needed.
 * Scores a Power BI semantic model across 5 categories.
 */

import { PBIModel } from '../types';
import { analyzeModelDax } from './daxAnalyzer';

export interface HealthIssue {
  category: string;
  severity: 'critical' | 'warning' | 'info';
  item: string;
  message: string;
  recommendation: string;
}

export interface CategoryScore {
  name: string;
  score: number; // 0–100
  weight: number; // 0–1
  issueCount: number;
  icon: string;
}

export interface HealthReport {
  overallScore: number; // 0–100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  categories: CategoryScore[];
  issues: HealthIssue[];
  summary: {
    totalTables: number;
    totalMeasures: number;
    totalColumns: number;
    totalRelationships: number;
    documentedPercent: number;
    unusedPercent: number;
  };
}

function gradeFromScore(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

export function generateHealthReport(model: PBIModel): HealthReport {
  const issues: HealthIssue[] = [];

  const allMeasures = model.tables.flatMap(t =>
    t.measures.map(m => ({ ...m, tableName: t.name }))
  );
  const allColumns = model.tables.flatMap(t =>
    t.columns.map(c => ({ ...c, tableName: t.name }))
  );

  // ===== 1. DOCUMENTATION (25%) =====
  let docScore = 100;
  const undocumentedTables = model.tables.filter(t => !t.description);
  const undocumentedMeasures = allMeasures.filter(m => !m.description);
  const undocumentedColumns = allColumns.filter(c => !c.description);

  const totalItems = model.tables.length + allMeasures.length + allColumns.length;
  const undocumented = undocumentedTables.length + undocumentedMeasures.length + undocumentedColumns.length;
  const documentedPercent = totalItems > 0 ? Math.round(((totalItems - undocumented) / totalItems) * 100) : 100;

  if (undocumentedTables.length > 0) {
    docScore -= Math.min(40, undocumentedTables.length * 8);
    undocumentedTables.forEach(t => {
      issues.push({
        category: 'Documentation',
        severity: 'warning',
        item: t.name,
        message: `Table "${t.name}" has no description.`,
        recommendation: 'Add a meaningful description explaining the business purpose of this table.',
      });
    });
  }

  if (undocumentedMeasures.length > 0) {
    const ratio = undocumentedMeasures.length / Math.max(allMeasures.length, 1);
    docScore -= Math.min(40, Math.round(ratio * 40));
    undocumentedMeasures.slice(0, 10).forEach(m => {
      issues.push({
        category: 'Documentation',
        severity: 'info',
        item: `${m.tableName}.${m.name}`,
        message: `Measure "${m.name}" has no description.`,
        recommendation: 'Document what this measure calculates and its business context.',
      });
    });
    if (undocumentedMeasures.length > 10) {
      issues.push({
        category: 'Documentation',
        severity: 'warning',
        item: 'Multiple measures',
        message: `${undocumentedMeasures.length - 10} additional measures lack descriptions.`,
        recommendation: 'Prioritise documenting measures used in reports first.',
      });
    }
  }

  docScore = Math.max(0, docScore);

  // ===== 2. NAMING CONVENTIONS (20%) =====
  let namingScore = 100;
  const namingIssues: string[] = [];

  allMeasures.forEach(m => {
    if (m.name.includes(' ') && m.name.includes('_')) {
      namingScore -= 3;
      namingIssues.push(m.name);
    }
    if (/^[a-z]/.test(m.name) && allMeasures.some(o => /^[A-Z]/.test(o.name))) {
      // Mixed casing convention
      namingScore -= 1;
    }
  });

  model.tables.forEach(t => {
    if (t.name.startsWith('_') || t.name.startsWith('$')) {
      issues.push({
        category: 'Naming',
        severity: 'info',
        item: t.name,
        message: `Table "${t.name}" uses a special prefix character.`,
        recommendation: 'Ensure the prefix follows your organization\'s naming standard.',
      });
    }
  });

  if (namingIssues.length > 0) {
    issues.push({
      category: 'Naming',
      severity: 'info',
      item: namingIssues.slice(0, 5).join(', '),
      message: `${namingIssues.length} measure(s) mix spaces and underscores in names.`,
      recommendation: 'Adopt a consistent naming convention (e.g., "Total Sales" or "Total_Sales").',
    });
  }

  namingScore = Math.max(0, namingScore);

  // ===== 3. UNUSED ASSETS (20%) =====
  let unusedScore = 100;
  const unusedMeasures = allMeasures.filter(m => m.isUsed === false);
  const unusedColumns = allColumns.filter(c => c.isUsed === false);
  const totalAssets = allMeasures.length + allColumns.length;
  const unusedPercent = totalAssets > 0 ? Math.round(((unusedMeasures.length + unusedColumns.length) / totalAssets) * 100) : 0;

  if (unusedMeasures.length > 0) {
    const ratio = unusedMeasures.length / Math.max(allMeasures.length, 1);
    unusedScore -= Math.min(60, Math.round(ratio * 60));
    issues.push({
      category: 'Unused Assets',
      severity: unusedMeasures.length > 5 ? 'warning' : 'info',
      item: `${unusedMeasures.length} measure(s)`,
      message: `${unusedMeasures.length} measure(s) are not referenced in any report visual.`,
      recommendation: 'Review and remove unused measures to reduce model complexity and improve maintenance.',
    });
  }

  if (unusedColumns.length > 5) {
    unusedScore -= Math.min(30, unusedColumns.length * 2);
    issues.push({
      category: 'Unused Assets',
      severity: 'info',
      item: `${unusedColumns.length} column(s)`,
      message: `${unusedColumns.length} column(s) are not used in measures or report visuals.`,
      recommendation: 'Consider hiding or removing unused columns to reduce model size.',
    });
  }

  unusedScore = Math.max(0, unusedScore);

  // ===== 4. RELATIONSHIP HEALTH (15%) =====
  let relScore = 100;

  // Check for bidirectional relationships
  const biDirectional = model.relationships.filter(r => r.crossFilteringBehavior === 'bothDirections' || r.crossFilteringBehavior === 'bidirectional');
  if (biDirectional.length > 0) {
    relScore -= biDirectional.length * 10;
    biDirectional.forEach(r => {
      issues.push({
        category: 'Relationships',
        severity: 'warning',
        item: `${r.fromTable} → ${r.toTable}`,
        message: `Bidirectional cross-filter between "${r.fromTable}" and "${r.toTable}".`,
        recommendation: 'Bidirectional relationships can cause ambiguous filter paths. Use single-direction unless required.',
      });
    });
  }

  // Check for orphan tables (no relationships)
  const tablesInRelationships = new Set<string>();
  model.relationships.forEach(r => {
    tablesInRelationships.add(r.fromTable);
    tablesInRelationships.add(r.toTable);
  });
  const orphanTables = model.tables.filter(t => !tablesInRelationships.has(t.name) && t.measures.length === 0);
  if (orphanTables.length > 0) {
    relScore -= orphanTables.length * 5;
    orphanTables.forEach(t => {
      issues.push({
        category: 'Relationships',
        severity: 'info',
        item: t.name,
        message: `Table "${t.name}" has no relationships and no measures — it may be orphaned.`,
        recommendation: 'Verify if this table is needed. If not, remove it to simplify the model.',
      });
    });
  }

  // Check for many-to-many
  const m2m = model.relationships.filter(r =>
    r.fromCardinality === 'many' && r.toCardinality === 'many'
  );
  if (m2m.length > 0) {
    relScore -= m2m.length * 15;
    m2m.forEach(r => {
      issues.push({
        category: 'Relationships',
        severity: 'critical',
        item: `${r.fromTable} ↔ ${r.toTable}`,
        message: `Many-to-many relationship between "${r.fromTable}" and "${r.toTable}".`,
        recommendation: 'Many-to-many relationships can produce unexpected results. Consider a bridge table.',
      });
    });
  }

  relScore = Math.max(0, relScore);

  // ===== 5. DAX QUALITY (20%) =====
  const daxReport = analyzeModelDax(model.tables);
  const daxScore = daxReport.score;

  // Add DAX findings to issues
  Object.entries(daxReport.findingsByMeasure).forEach(([measureKey, findings]) => {
    findings.forEach(f => {
      issues.push({
        category: 'DAX Quality',
        severity: f.severity,
        item: measureKey,
        message: f.message,
        recommendation: f.suggestion,
      });
    });
  });

  // ===== FINAL SCORE =====
  const categories: CategoryScore[] = [
    { name: 'Documentation', score: docScore, weight: 0.25, issueCount: issues.filter(i => i.category === 'Documentation').length, icon: 'FileText' },
    { name: 'Naming', score: namingScore, weight: 0.20, issueCount: issues.filter(i => i.category === 'Naming').length, icon: 'Tag' },
    { name: 'Unused Assets', score: unusedScore, weight: 0.20, issueCount: issues.filter(i => i.category === 'Unused Assets').length, icon: 'Trash2' },
    { name: 'Relationships', score: relScore, weight: 0.15, issueCount: issues.filter(i => i.category === 'Relationships').length, icon: 'GitBranch' },
    { name: 'DAX Quality', score: daxScore, weight: 0.20, issueCount: issues.filter(i => i.category === 'DAX Quality').length, icon: 'Zap' },
  ];

  const overallScore = Math.round(
    categories.reduce((acc, cat) => acc + cat.score * cat.weight, 0)
  );

  // Sort issues: critical first, then warning, then info
  const severityOrder = { critical: 0, warning: 1, info: 2 };
  issues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return {
    overallScore,
    grade: gradeFromScore(overallScore),
    categories,
    issues,
    summary: {
      totalTables: model.tables.length,
      totalMeasures: allMeasures.length,
      totalColumns: allColumns.length,
      totalRelationships: model.relationships.length,
      documentedPercent,
      unusedPercent,
    },
  };
}
