import React, { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  GitCompare, Plus, Minus, Edit3, X, Upload,
  Table as TableIcon, Zap, Hash, GitBranch, CheckCircle, Download, FileText
} from 'lucide-react';
import { PBIModel } from '../types';
import { diffModels, DiffItem, ModelDiffResult } from '../utils/modelDiffer';
import { Badge } from './Badge';
import { cn } from '../utils';
import { generateAuditHtml } from '../utils/auditTemplate';

interface ModelDiffProps {
  currentModel: PBIModel;
  comparisonModel: PBIModel;
  onClearComparison: () => void;
}

type DiffCategory = 'all' | 'table' | 'measure' | 'column' | 'relationship' | 'page';

const STATUS_CONFIG = {
  added: { icon: Plus, color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20', label: 'Added' },
  removed: { icon: Minus, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20', label: 'Removed' },
  modified: { icon: Edit3, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', label: 'Modified' },
  unchanged: { icon: CheckCircle, color: 'text-muted-foreground', bg: 'bg-secondary/50', border: 'border-border', label: 'Unchanged' },
};

const TYPE_ICONS = {
  table: TableIcon,
  measure: Zap,
  column: Hash,
  relationship: GitBranch,
  page: FileText,
};

const DiffItemRow: React.FC<{ item: DiffItem; i: number }> = ({ item, i }) => {
  const config = STATUS_CONFIG[item.status];
  const Icon = config.icon;
  const TypeIcon = TYPE_ICONS[item.type];

  if (item.status === 'unchanged') return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(i, 30) * 0.03 }}
      className={cn("p-3 rounded-xl border flex items-start gap-3", config.border, config.bg)}
    >
      <div className={cn("p-1.5 rounded-lg", config.bg)}>
        <Icon size={14} className={config.color} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <TypeIcon size={12} className="text-muted-foreground" />
          <span className="text-xs font-bold">{item.name}</span>
          {item.tableName && <span className="text-[10px] text-muted-foreground">in {item.tableName}</span>}
          <Badge variant="outline" className={cn("text-[8px]", config.color)}>{config.label}</Badge>
        </div>
        {item.details && <p className="text-[10px] text-muted-foreground mt-1">{item.details}</p>}
        {item.oldValue && item.newValue && (
          <div className="mt-2 space-y-1">
            <div className="p-2 bg-red-500/5 rounded-lg border border-red-500/10">
              <pre className="text-[10px] text-red-400 font-mono whitespace-pre-wrap line-through">{item.oldValue.substring(0, 200)}</pre>
            </div>
            <div className="p-2 bg-green-500/5 rounded-lg border border-green-500/10">
              <pre className="text-[10px] text-green-400 font-mono whitespace-pre-wrap">{item.newValue.substring(0, 200)}</pre>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export const ModelDiff = ({ currentModel, comparisonModel, onClearComparison }: ModelDiffProps) => {
  const [showUnchanged, setShowUnchanged] = useState(false);
  const [activeCategory, setActiveCategory] = useState<DiffCategory>('all');

  const diffResult = React.useMemo(() => {
    return diffModels(currentModel, comparisonModel);
  }, [currentModel, comparisonModel]);

  const baseChangedItems = React.useMemo(() => {
    if (!diffResult) return [];
    return [...diffResult.tables, ...diffResult.measures, ...diffResult.columns, ...diffResult.relationships, ...diffResult.pages]
      .filter(i => showUnchanged || i.status !== 'unchanged');
  }, [diffResult, showUnchanged]);

  const changedItems = baseChangedItems.filter(i => activeCategory === 'all' || i.type === activeCategory);

  const handleExportCsv = useCallback(() => {
    if (!diffResult) return;
    const headers = ['Type', 'Name', 'Location', 'Status', 'Details', 'Old Value', 'New Value'];
    const escapeCsv = (str: string | undefined) => `"${(str || '').replace(/"/g, '""')}"`;
    
    const rows = baseChangedItems.map(item => [
      item.type,
      item.name,
      item.tableName || '',
      item.status,
      escapeCsv(item.details),
      escapeCsv(item.oldValue),
      escapeCsv(item.newValue)
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `model_diff_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }, [baseChangedItems, diffResult]);

  const handleExportHtml = useCallback(() => {
    if (!diffResult) return;
    const htmlContent = generateAuditHtml(currentModel, { summary: 'Model Comparison Report' }, diffResult);
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `model_comparison_${new Date().toISOString().split('T')[0]}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }, [currentModel, diffResult]);

  const counts = React.useMemo(() => {
    return {
      all: baseChangedItems.length,
      table: baseChangedItems.filter(i => i.type === 'table').length,
      measure: baseChangedItems.filter(i => i.type === 'measure').length,
      column: baseChangedItems.filter(i => i.type === 'column').length,
      relationship: baseChangedItems.filter(i => i.type === 'relationship').length,
      page: baseChangedItems.filter(i => i.type === 'page').length,
    };
  }, [baseChangedItems]);

  return (
    <div className="h-full bg-card/30 rounded-3xl border border-border flex flex-col overflow-hidden max-h-[85vh]">
      {/* Header */}
      <div className="p-6 border-b border-border flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <GitCompare size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tight">MODEL COMPARISON</h2>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                    Compare versions to track changes
                  </p>
                </div>
        </div>
        <div className="flex items-center gap-3">
          {diffResult && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportHtml}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground border border-primary/20 rounded-xl text-xs font-bold transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98]"
                title="Export Interactive HTML Report"
              >
                <Download size={14} />
                Export HTML
              </button>
              <button
                onClick={handleExportCsv}
                className="flex items-center gap-2 px-3 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border border-primary/20 rounded-xl text-xs font-bold transition-all shadow-sm"
                title="Export changes to CSV"
              >
                CSV
              </button>
            </div>
          )}
          <button onClick={onClearComparison} className="p-2 hover:bg-secondary rounded-full transition-colors" title="Clear Comparison">
            <X size={18} />
          </button>
        </div>
      </div>



      {/* Diff Results */}
      {diffResult && (
        <>
          {/* Summary Bar */}
          <div className="px-6 py-4 bg-secondary/30 border-b border-border flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <Plus size={14} className="text-green-500" />
                      <span className="text-sm font-bold text-green-500">{diffResult.summary.added}</span>
                      <span className="text-[10px] text-muted-foreground">Added</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Edit3 size={14} className="text-amber-500" />
                      <span className="text-sm font-bold text-amber-500">{diffResult.summary.modified}</span>
                      <span className="text-[10px] text-muted-foreground">Modified</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Minus size={14} className="text-red-500" />
                      <span className="text-sm font-bold text-red-500">{diffResult.summary.removed}</span>
                      <span className="text-[10px] text-muted-foreground">Removed</span>
                    </div>
            </div>
            <button
              onClick={onClearComparison}
              className="text-[10px] font-bold text-muted-foreground hover:text-primary underline flex-shrink-0"
            >
              Compare Another
            </button>
          </div>

          {/* Category Tabs */}
          <div className="px-6 border-b border-border flex items-center gap-2 flex-shrink-0 bg-card overflow-x-auto custom-scrollbar">
            {(['all', 'table', 'measure', 'column', 'relationship', 'page'] as DiffCategory[]).map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "px-4 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-colors whitespace-nowrap",
                  activeCategory === cat 
                    ? "border-primary text-primary" 
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {cat === 'all' ? 'All Changes' : `${cat}s`}
                <Badge variant="outline" className="ml-2 text-[8px] bg-secondary border-none text-muted-foreground">
                  {counts[cat]}
                </Badge>
              </button>
            ))}
          </div>

          {/* Changes List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-2 custom-scrollbar">
                  {changedItems.length === 0 ? (
                    <div className="p-8 text-center">
                      <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
                      <h4 className="text-lg font-bold">Models are Identical</h4>
                      <p className="text-sm text-muted-foreground mt-2">No differences found between the two versions.</p>
                    </div>
                  ) : (
                    changedItems.map((item, i) => (
                      <DiffItemRow key={`${item.type}-${item.name}-${i}`} item={item} i={i} />
                    ))
            )}
          </div>
        </>
      )}
    </div>
  );
};
