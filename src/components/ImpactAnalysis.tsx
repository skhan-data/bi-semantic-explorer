import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import {
  ArrowUp, ArrowDown, Layers, Zap, Hash,
  AlertTriangle, Target, X
} from 'lucide-react';
import { PBIModel, PBIMeasure, PBIColumn } from '../types';
import { analyzeImpact, ImpactNode } from '../utils/impactAnalyzer';
import { Badge } from './Badge';
import { cn } from '../utils';

interface ImpactAnalysisProps {
  item: (PBIMeasure | PBIColumn) & { tableName: string };
  model: PBIModel;
  onClose: () => void;
  onSelectItem?: (item: any) => void;
}

const ImpactNodeCard: React.FC<{ node: ImpactNode; index: number; onSelect?: (item: any) => void }> = ({ node, index, onSelect }) => (
  <motion.button
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.05 }}
    className="w-full flex items-center gap-3 p-3 bg-secondary/30 border border-border/50 rounded-xl hover:bg-secondary transition-colors text-left group pressable"
    onClick={() => onSelect?.({ name: node.name, tableName: node.tableName })}
  >
    <div className={cn(
      "p-1.5 rounded-lg border",
      node.type === 'measure' ? "bg-primary/10 text-primary border-primary/20" : "bg-orange-500/10 text-orange-500 border-orange-500/20"
    )}>
      {node.type === 'measure' ? <Zap size={14} /> : <Hash size={14} />}
    </div>
    <div className="flex-1 min-w-0">
      <span className="text-sm font-medium block truncate text-foreground">{node.name}</span>
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{node.tableName}</span>
    </div>
    <span className="text-[10px] px-2 py-0.5 bg-background border border-border/50 rounded-md text-muted-foreground font-mono">
      Depth {node.depth}
    </span>
  </motion.button>
);

export const ImpactAnalysis = ({ item, model, onClose, onSelectItem }: ImpactAnalysisProps) => {
  const result = useMemo(
    () => analyzeImpact(item.name, item.tableName, model),
    [item.name, item.tableName, model]
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-background/80 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Target size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-foreground">Impact Analysis</h2>
              <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-widest mt-0.5">
                {item.tableName}.{item.name}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground pressable border border-transparent hover:border-border/50">
            <X size={18} />
          </button>
        </div>

        {/* Blast Radius Summary */}
        <div className="px-6 py-5 bg-secondary/30 border-b border-border/50">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-medium text-blue-500">{result.upstream.length}</p>
              <p className="text-[9px] uppercase font-semibold text-muted-foreground tracking-widest mt-1">Dependencies</p>
            </div>
            <div>
              <p className="text-2xl font-medium text-amber-500">{result.downstream.length}</p>
              <p className="text-[9px] uppercase font-semibold text-muted-foreground tracking-widest mt-1">Consumers</p>
            </div>
            <div>
              <p className="text-2xl font-medium text-red-500">{result.affectedReports.length}</p>
              <p className="text-[9px] uppercase font-semibold text-muted-foreground tracking-widest mt-1">Reports</p>
            </div>
          </div>
          {result.blastRadius > 5 && (
            <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center gap-2 text-amber-500 text-xs font-medium">
              <AlertTriangle size={14} />
              <span>High impact — changing this affects {result.blastRadius} items across the model.</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* Upstream */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ArrowUp size={14} className="text-blue-500" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Depends On ({result.upstream.length})
              </h3>
            </div>
            {result.upstream.length === 0 ? (
              <p className="text-xs text-muted-foreground italic pl-5 font-medium">No upstream dependencies found.</p>
            ) : (
              <div className="space-y-2 pl-5">
                {result.upstream.map((node, i) => (
                  <ImpactNodeCard key={`up-${i}`} node={node} index={i} onSelect={onSelectItem} />
                ))}
              </div>
            )}
          </div>

          {/* Downstream */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ArrowDown size={14} className="text-amber-500" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Used By ({result.downstream.length})
              </h3>
            </div>
            {result.downstream.length === 0 ? (
              <p className="text-xs text-muted-foreground italic pl-5 font-medium">Nothing depends on this item.</p>
            ) : (
              <div className="space-y-2 pl-5">
                {result.downstream.map((node, i) => (
                  <ImpactNodeCard key={`down-${i}`} node={node} index={i} onSelect={onSelectItem} />
                ))}
              </div>
            )}
          </div>

          {/* Affected Reports */}
          {result.affectedReports.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Layers size={14} className="text-red-500" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Affected Reports ({result.affectedReports.length})
                </h3>
              </div>
              <div className="space-y-2 pl-5">
                {result.affectedReports.map((report, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 p-3 bg-red-500/5 rounded-xl border border-red-500/10 hover:bg-red-500/10 transition-colors"
                  >
                    <Layers size={14} className="text-red-500" />
                    <div>
                      <span className="text-sm font-medium text-foreground block">{report.page}</span>
                      <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">→ {report.visual}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
