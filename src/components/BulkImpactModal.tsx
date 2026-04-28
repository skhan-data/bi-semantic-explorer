import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowDown, Layers, Zap, Hash, Database,
  AlertTriangle, Target, X, CheckSquare, Download, Loader2
} from 'lucide-react';
import { PBIModel } from '../types';
import { analyzeImpact, ImpactNode } from '../utils/impactAnalyzer';
import { Badge } from './Badge';
import { cn } from '../utils';

interface BulkImpactModalProps {
  selectedItems: any[];
  model: PBIModel;
  onClose: () => void;
  onClearSelection: () => void;
}

export const BulkImpactModal = ({ selectedItems, model, onClose, onClearSelection }: BulkImpactModalProps) => {
  const [isExporting, setIsExporting] = useState(false);

  // Aggregate Impact Analysis
  const bulkImpact = useMemo(() => {
    const combinedDownstream = new Map<string, ImpactNode>();
    const combinedReports = new Set<string>();
    const reportDetails: { page: string, visual: string }[] = [];

    selectedItems.forEach(item => {
      const result = analyzeImpact(item.name, item.tableName, model);
      
      result.downstream.forEach(node => {
        const key = `${node.tableName}.${node.name}`;
        if (!combinedDownstream.has(key)) {
          combinedDownstream.set(key, node);
        }
      });

      result.affectedReports.forEach(r => {
        const key = `${r.page}|${r.visual}`;
        if (!combinedReports.has(key)) {
          combinedReports.add(key);
          reportDetails.push(r);
        }
      });
    });

    // Remove any items that are actually in the selectedItems list (we know they are getting deleted)
    const externalDownstream = Array.from(combinedDownstream.values()).filter(node => 
      !selectedItems.some(s => s.name === node.name && s.tableName === node.tableName)
    );

    return {
      downstream: externalDownstream,
      reports: reportDetails
    };
  }, [selectedItems, model]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Lazy load html generator to keep bundle sizes lean
      const { generateBulkImpactHtml } = await import('../utils/bulkImpactTemplate');
      const html = generateBulkImpactHtml(selectedItems, bulkImpact.downstream, bulkImpact.reports, model.name);
      
      const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${model.name.replace(/\s+/g, '_')}_bulk_impact.html`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error("Export failed", e);
    }
    setIsExporting(false);
  };

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
        className="bg-card border border-orange-500/30 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col shadow-[0_0_50px_rgba(249,115,22,0.1)]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-border flex items-start justify-between bg-orange-500/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-500 shadow-lg flex items-center justify-center text-white">
              <Target size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-orange-500">BULK IMPACT ANALYSIS</h2>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-1">
                Simulating Deletion of {selectedItems.length} Models Elements
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50"
            >
              {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              Export HTML Report
            </button>
            <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full transition-colors text-muted-foreground">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Target List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <CheckSquare size={14} className="text-orange-500" />
                Target Queue ({selectedItems.length})
              </h3>
              <button onClick={onClearSelection} className="text-[10px] uppercase font-bold text-red-500 hover:text-red-400 border border-red-500/20 px-2 py-1 rounded">
                Clear Queue
              </button>
            </div>
            
            <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
              {selectedItems.map((item, idx) => (
                <div key={idx} className="p-3 bg-secondary/30 rounded-xl border border-border flex items-center gap-3">
                  <div className={item._type === 'measure' ? "text-blue-500" : "text-orange-500"}>
                    {item._type === 'measure' ? <Zap size={14} /> : <Hash size={14} />}
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-sm font-bold truncate text-foreground">{item.name}</span>
                    <span className="text-[10px] text-muted-foreground uppercase">{item.tableName}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cascade Impact */}
          <div className="space-y-8 pl-8 border-l border-border/50">
            {/* Logic Breaks */}
            <div className="space-y-4 relative">
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <ArrowDown size={14} className="text-amber-500" />
                Downstream Logic Breaks ({bulkImpact.downstream.length})
              </h3>
              
              {bulkImpact.downstream.length === 0 ? (
                <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-xl text-green-500 text-xs font-bold flex items-center gap-2">
                  <CheckSquare size={16} /> 0 secondary logic failures detected.
                </div>
              ) : (
                <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                  {bulkImpact.downstream.map((node, i) => (
                    <div key={i} className="p-3 bg-amber-500/5 rounded-xl border border-amber-500/20 flex items-center gap-3">
                      <div className="text-amber-500">
                        {node.type === 'measure' ? <Zap size={14} /> : <Hash size={14} />}
                      </div>
                       <div className="flex flex-col flex-1 min-w-0">
                        <span className="text-sm font-bold truncate text-amber-500">{node.name}</span>
                        <span className="text-[10px] text-amber-500/60 uppercase">{node.tableName}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Visual Breaks */}
            <div className="space-y-4 relative">
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Layers size={14} className="text-red-500" />
                Report Visual Breaks ({bulkImpact.reports.length})
              </h3>
              
              {bulkImpact.reports.length === 0 ? (
                <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-xl text-green-500 text-xs font-bold flex items-center gap-2">
                  <CheckSquare size={16} /> Delete is safe. No visuals mapped.
                </div>
              ) : (
                <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                  {bulkImpact.reports.map((report, i) => (
                    <div key={i} className="p-3 bg-red-500/5 rounded-xl border border-red-500/20 flex items-center gap-3">
                      <Layers size={14} className="text-red-500" />
                       <div className="flex flex-col flex-1 min-w-0">
                        <span className="text-xs font-bold truncate text-red-500">Page: {report.page}</span>
                        <span className="text-xs text-red-500/80">Visual: {report.visual}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
