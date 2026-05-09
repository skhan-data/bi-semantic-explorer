import React from 'react';
import { 
  Info, ExternalLink, Code, Sparkles, Zap, Hash, Type, 
  Database, Calendar, Table as TableIcon, ArrowRight, AlertCircle,
  CheckCircle, AlertTriangle, GitBranch, Layout, RefreshCw, Target
} from 'lucide-react';
import { motion } from 'motion/react';
import { PBIMeasure, PBIColumn } from '../types';
import { Badge } from './Badge';
import { LineageGraph } from './LineageGraphs';
import { analyzeDaxExpression } from '../utils/daxAnalyzer';
import { cn } from '../utils';

interface DetailsPanelProps {
  selectedItem: (PBIMeasure & { tableName: string }) | (PBIColumn & { tableName: string }) | null;
  onShowImpact?: () => void;
  model: any;
}

export const DetailsPanel = ({
  selectedItem,
  onShowImpact,
  model
}: DetailsPanelProps) => {
  if (!selectedItem) {
    return (
      <div className="h-full flex items-center justify-center p-8 text-center bg-background">
        <div className="max-w-md space-y-4">
          <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mx-auto text-muted-foreground border border-border/50">
            <Info size={24} />
          </div>
          <div>
            <h3 className="text-base font-semibold tracking-tight text-foreground">No Item Selected</h3>
            <p className="text-sm text-muted-foreground mt-1">Select a table, measure, or column from the explorer to see its details and DAX logic.</p>
          </div>
        </div>
      </div>
    );
  }

  // Determine selection type for item view
  const isTableSelection = 'columns' in selectedItem && !('tableName' in selectedItem);
  const isMeasure = !isTableSelection && 'expression' in selectedItem && !!(selectedItem as any).expression && !('dataType' in selectedItem);
  const isColumn = !isTableSelection && !isMeasure;
  const isCalcColumn = isColumn && !!(selectedItem as any).expression;
  const showLogicSection = isMeasure || isCalcColumn;

  if (isTableSelection) {
    const table = selectedItem as any;
    const calcColumns = table.columns?.filter((c: any) => c.expression).length || 0;
    const totalLogicItems = (table.measures?.length || 0) + calcColumns;
    const unusedMeasures = table.measures?.filter((m: any) => m.isUsed === false).length || 0;
    
    // Relationships
    const relationships = (model.relationships || []).filter((r: any) => r.fromTable === table.name || r.toTable === table.name);

    return (
      <div className="h-full flex flex-col overflow-hidden bg-background">
        <div className="p-8 border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-10 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
              <Database size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-secondary px-2 py-0.5 rounded-md border border-border/50">Table Dashboard</span>
                {table.isHidden && <span className="text-[10px] font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded-md border border-border/50">Hidden</span>}
              </div>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">{table.name}</h2>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          {/* Refined Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-xl border border-border/50 bg-card space-y-3 hover:border-border transition-colors group">
              <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground transition-colors">
                <Zap size={14} />
                <p className="text-xs font-semibold uppercase tracking-wider">Logical Items</p>
              </div>
              <div className="flex items-end gap-3">
                <p className="text-3xl font-medium text-foreground leading-none">{totalLogicItems}</p>
                <div className="flex flex-col pb-0.5">
                  <span className="text-[10px] text-muted-foreground font-medium">{table.measures?.length || 0} Measures</span>
                  <span className="text-[10px] text-muted-foreground font-medium">{calcColumns} Calc Columns</span>
                </div>
              </div>
              {unusedMeasures > 0 && (
                <p className="text-xs text-orange-500/80 flex items-center gap-1.5 mt-2">
                   <AlertCircle size={12} />
                   {unusedMeasures} unused measure{unusedMeasures !== 1 ? 's' : ''} detected
                </p>
              )}
            </div>

            <div className="p-5 rounded-xl border border-border/50 bg-card space-y-3 hover:border-border transition-colors group">
              <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground transition-colors">
                <Hash size={14} />
                <p className="text-xs font-semibold uppercase tracking-wider">Physical Columns</p>
              </div>
              <div className="flex items-end gap-3">
                <p className="text-3xl font-medium text-foreground leading-none">{table.columns?.length || 0}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-2 font-medium">Direct data storage fields mapped from source.</p>
            </div>

            <div className="p-5 rounded-xl border border-border/50 bg-card space-y-3 hover:border-border transition-colors group">
              <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground transition-colors">
                <Database size={14} />
                <p className="text-xs font-semibold uppercase tracking-wider">Data Connection</p>
              </div>
              <div className="flex items-center pt-1">
                 <span className="text-sm font-medium px-3 py-1 bg-secondary rounded-md text-foreground border border-border/50">{table.storageMode || 'Import'}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2 font-medium">Model storage mode for this table.</p>
            </div>
          </div>

          {/* Calculated Table DAX Section */}
          {table.expression && (
            <section className="space-y-3">
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                <Code size={14} className="text-muted-foreground" />
                Calculated Table Logic
              </h3>
              <div className="rounded-xl border border-border/50 bg-secondary p-5 relative group">
                <pre className="text-xs font-mono leading-relaxed overflow-x-auto text-foreground custom-scrollbar">
                  <code>{table.expression}</code>
                </pre>
              </div>
            </section>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Enhanced Relationship Map */}
            <section className="space-y-3">
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                <GitBranch size={14} className="text-muted-foreground" />
                Relationship Architecture
              </h3>
              <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
                <div className="p-3 bg-secondary/50 border-b border-border/50 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground grid grid-cols-3 gap-2">
                  <span>Connected Table</span>
                  <span className="text-center">Cardinality</span>
                  <span className="text-right">Join Keys</span>
                </div>
                <div className="divide-y divide-border/50 max-h-[300px] overflow-y-auto custom-scrollbar">
                  {relationships.length === 0 && (
                    <div className="p-6 text-center text-sm font-medium text-muted-foreground">No external relationships mapped for this table.</div>
                  )}
                  {relationships.map((rel: any, idx: number) => {
                    const isFrom = rel.fromTable === table.name;
                    const linkedTable = isFrom ? rel.toTable : rel.fromTable;
                    const tableKey = isFrom ? rel.fromColumn : rel.toColumn;
                    const linkedKey = isFrom ? rel.toColumn : rel.fromColumn;
                    
                    const fromCard = rel.fromCardinality === 'one' ? '1' : '*';
                    const toCard = rel.toCardinality === 'one' ? '1' : '*';
                    const cardinalDisplay = isFrom ? `${fromCard} ─── ${toCard}` : `${toCard} ─── ${fromCard}`;

                    return (
                      <div key={idx} className="p-3 flex items-center justify-between group hover:bg-secondary/30 transition-colors grid grid-cols-3 gap-2">
                        <div className="flex flex-col gap-1 overflow-hidden">
                          <span className="text-sm font-medium text-foreground flex items-center gap-2 truncate">
                            <TableIcon size={12} className="text-muted-foreground shrink-0" />
                            {linkedTable}
                          </span>
                        </div>
                        <div className="flex flex-col items-center gap-0.5">
                           <span className="text-[10px] font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded-md border border-border/50 shrink-0">{cardinalDisplay}</span>
                        </div>
                        <div className="flex flex-col items-end gap-1 overflow-hidden shrink-0">
                          <span className="text-[10px] font-mono bg-secondary px-1.5 py-0.5 rounded truncate max-w-full text-foreground border border-border/50">[{tableKey}]</span>
                          <span className="text-[10px] font-mono bg-secondary/50 px-1.5 py-0.5 rounded truncate max-w-full text-muted-foreground border border-border/30">[{linkedKey}]</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* Schema Explorer */}
            <section className="space-y-3">
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                <Type size={14} className="text-muted-foreground" />
                Technical Schema
              </h3>
              <div className="rounded-xl border border-border/50 bg-card overflow-hidden flex flex-col max-h-[300px]">
                <div className="p-3 bg-secondary/50 border-b border-border/50 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex justify-between">
                  <span>Field Name</span>
                  <span>Type</span>
                </div>
                <div className="overflow-y-auto custom-scrollbar divide-y divide-border/50">
                  {table.columns?.map((col: any, idx: number) => (
                    <div key={idx} className="p-3 flex items-center justify-between group hover:bg-secondary/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="text-muted-foreground group-hover:text-foreground transition-colors">
                          {col.expression ? <Zap size={14} /> : <Hash size={14} />}
                        </div>
                        <span className="text-sm font-medium text-foreground">{col.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {col.expression && <span className="text-[10px] font-medium text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded">Calc</span>}
                        <span className="text-[10px] font-mono text-muted-foreground bg-secondary px-1.5 py-0.5 rounded border border-border/50">{col.dataType}</span>
                      </div>
                    </div>
                  ))}
                  {table.measures?.map((m: any, idx: number) => (
                    <div key={`m-${idx}`} className="p-3 flex items-center justify-between group hover:bg-secondary/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="text-primary/70 group-hover:text-primary transition-colors">
                          <Zap size={14} />
                        </div>
                        <span className="text-sm font-medium text-foreground">{m.name}</span>
                      </div>
                      <span className="text-[10px] font-medium text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded">Measure</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="p-8 border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-start justify-between">
          <div className="space-y-4 max-w-2xl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center border border-border/50 shrink-0 mt-1">
                {showLogicSection ? <Zap size={20} className="text-primary" /> : <Hash size={20} className="text-muted-foreground" />}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-secondary px-2 py-0.5 rounded-md border border-border/50">
                    {isMeasure ? "Measure" : (isCalcColumn ? "Calc Column" : "Column")}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium">{selectedItem.tableName}</span>
                </div>
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">{selectedItem.name}</h2>
              </div>
            </div>
            
            {/* Logic Redundancy Banner */}
            {showLogicSection && selectedItem.isUsed === false && (
              <div className="p-3 bg-secondary/50 border border-border/50 rounded-lg flex items-center gap-3 mt-4">
                <div className="text-orange-500">
                  <AlertCircle size={16} />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-foreground">Potential Redundancy</p>
                  <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                    This {isMeasure ? "measure" : "column"} does not appear to be used in any DAX expressions or report visuals.
                  </p>
                </div>
              </div>
            )}
            
            {/* Detailed Safe Delete Simulation */}
            {showLogicSection && selectedItem.isUsed === false && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "p-4 rounded-xl border flex flex-col gap-3 mt-2 transition-all duration-500",
                  (selectedItem as PBIMeasure).reportUsage?.length === 0 
                    ? "bg-green-500/5 border-green-500/20" 
                    : "bg-orange-500/5 border-orange-500/20"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "text-lg",
                    (selectedItem as PBIMeasure).reportUsage?.length === 0 ? "text-green-500" : "text-orange-500"
                  )}>
                    {(selectedItem as PBIMeasure).reportUsage?.length === 0 ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
                  </div>
                  <div className="flex-1">
                    <p className={cn(
                      "text-sm font-semibold",
                      (selectedItem as PBIMeasure).reportUsage?.length === 0 ? "text-green-500" : "text-orange-500"
                    )}>
                      {(selectedItem as PBIMeasure).reportUsage?.length === 0 ? "Safe to Delete" : "Impact Detected"}
                    </p>
                    <p className={cn(
                      "text-xs mt-0.5 font-medium",
                      (selectedItem as PBIMeasure).reportUsage?.length === 0 ? "text-green-500/80" : "text-orange-500/80"
                    )}>
                      {(selectedItem as PBIMeasure).reportUsage?.length === 0 
                        ? "This item is isolated and has no downstream report impact." 
                        : `This item is used in ${(selectedItem as PBIMeasure).reportUsage?.length} visual(s).`}
                    </p>
                  </div>
                </div>

                {(selectedItem as PBIMeasure).reportUsage && (selectedItem as PBIMeasure).reportUsage!.length > 0 && (
                  <div className="grid grid-cols-1 gap-2 pt-3 border-t border-orange-500/10 mt-2">
                    <p className="text-xs font-semibold text-orange-500/80 uppercase tracking-wider">Affected Locations</p>
                    {(selectedItem as PBIMeasure).reportUsage?.map((usage, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-background/50 p-2 rounded-lg border border-orange-500/10">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium px-2 py-0.5 bg-secondary rounded border border-border/50 text-muted-foreground">{usage.page}</span>
                          <span className="text-xs font-medium text-foreground">{usage.visual}</span>
                        </div>
                        <ArrowRight size={12} className="text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
            
            {/* Standard Column Redundancy */}
            {!showLogicSection && selectedItem.isUsed === false && (
               <div className="p-3 bg-secondary/30 border border-border/50 rounded-lg flex items-center gap-3 mt-4">
                 <div className="text-muted-foreground">
                   <AlertCircle size={16} />
                 </div>
                 <div className="flex-1">
                   <p className="text-xs font-medium text-foreground">Unused Column</p>
                   <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                     This column is not used in DAX or report visuals.
                   </p>
                 </div>
               </div>
            )}
            
            <div className="!mt-6 space-y-6 max-w-3xl">
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</h4>
                <p className="text-sm font-medium text-foreground/80 leading-relaxed">
                  {selectedItem.description || "No description provided."}
                </p>
              </div>

              {((selectedItem as any).dependencies?.measures?.length > 0 || (selectedItem as any).dependencies?.columns?.length > 0) && (
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dependencies</h4>
                  <div className="flex flex-wrap gap-2">
                    {(selectedItem as any).dependencies?.measures?.map((dep: string) => (
                      <div key={dep}><span className="text-xs font-medium px-2.5 py-1 bg-primary/10 text-primary rounded-md border border-primary/20">{dep}</span></div>
                    ))}
                    {(selectedItem as any).dependencies?.columns?.map((dep: string) => (
                      <div key={dep}><span className="text-xs font-medium px-2.5 py-1 bg-secondary text-muted-foreground rounded-md border border-border/50">{dep}</span></div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-3">
             {onShowImpact && (
               <button 
                 onClick={onShowImpact}
                 className="pressable flex items-center gap-2 px-4 py-2 bg-secondary border border-border/50 rounded-lg text-sm font-medium hover:bg-secondary/80 transition-all text-foreground"
               >
                 <Target size={16} />
                 Impact Analysis
               </button>
             )}
             <button className="pressable p-2 hover:bg-secondary rounded-lg text-muted-foreground transition-colors border border-border/50">
               <ExternalLink size={18} />
             </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
        {showLogicSection && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                  <Code size={14} className="text-muted-foreground" />
                  Logic Expression
                </h3>
              </div>
              <div className="rounded-xl border border-border/50 bg-secondary/50 p-5 relative group">
                <pre className="text-xs font-mono leading-relaxed overflow-x-auto text-foreground custom-scrollbar">
                  <code className="language-dax">{selectedItem.expression}</code>
                </pre>
              </div>
              
              {/* DAX Warnings */}
              {(() => {
                const daxText = (selectedItem as any).expression || '';
                if (!daxText) return null;
                const findings = analyzeDaxExpression(daxText);
                if (findings.length === 0) return null;
                
                return (
                  <div className="mt-4 space-y-2">
                    {findings.map((f, i) => (
                      <div key={i} className="flex gap-3 items-start p-3 bg-card border border-border/50 rounded-lg">
                        <div className={f.severity === 'critical' ? 'text-red-500 mt-0.5' : f.severity === 'warning' ? 'text-amber-500 mt-0.5' : 'text-blue-500 mt-0.5'}>
                          {f.severity === 'critical' ? <AlertCircle size={14} /> : f.severity === 'warning' ? <AlertTriangle size={14} /> : <Info size={14} />}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-foreground">{f.pattern}</p>
                          <p className="text-xs font-medium text-muted-foreground mt-0.5">{f.suggestion}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </section>
          </div>
        )}

        {!showLogicSection && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-border/50 bg-card space-y-1 hover:border-border transition-colors">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Data Type</div>
              <div className="text-sm font-medium flex items-center gap-2 text-foreground">
                <Type size={14} className="text-muted-foreground" />
                {(selectedItem as PBIColumn).dataType}
              </div>
            </div>
            <div className="p-4 rounded-xl border border-border/50 bg-card space-y-1 hover:border-border transition-colors">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Table</div>
              <div className="text-sm font-medium flex items-center gap-2 text-foreground">
                <TableIcon size={14} className="text-muted-foreground" />
                {selectedItem.tableName}
              </div>
            </div>
            <div className="p-4 rounded-xl border border-border/50 bg-card space-y-1 hover:border-border transition-colors">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Source</div>
              <div className="text-sm font-medium flex items-center gap-2 text-foreground">
                <Database size={14} className="text-muted-foreground" />
                Physical Model
              </div>
            </div>
          </div>
        )}

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
              <GitBranch size={14} className="text-muted-foreground" />
              Dependency Lineage
            </h3>
          </div>
          
          <div className="border border-border/50 rounded-xl overflow-hidden bg-card">
            <LineageGraph measure={showLogicSection ? (selectedItem as any) : undefined} model={model} />
          </div>

          {/* Used in Reports */}
          {showLogicSection && (selectedItem as PBIMeasure).reportUsage && (selectedItem as PBIMeasure).reportUsage!.length > 0 && (
            <div className="rounded-xl border border-border/50 bg-card overflow-hidden max-w-4xl mt-6">
              <div className="p-4 bg-secondary/50 border-b border-border/50">
                <h3 className="text-sm font-medium text-foreground">Used In Reports ({(selectedItem as PBIMeasure).reportUsage!.length})</h3>
              </div>
              <div className="divide-y divide-border/50">
                {(selectedItem as PBIMeasure).reportUsage!.map((usage, idx) => (
                  <div key={idx} className="p-4 flex items-center gap-3 text-sm text-muted-foreground hover:bg-secondary/30 transition-colors">
                    <span className="text-foreground font-medium">{usage.page}</span>
                    <span className="text-border/50">/</span>
                    <span className="text-muted-foreground font-medium">{usage.visual}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
