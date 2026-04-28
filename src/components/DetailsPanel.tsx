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
      <div className="h-full flex items-center justify-center p-8 text-center">
        <div className="max-w-md space-y-4">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto text-muted-foreground">
            <Info size={32} />
          </div>
          <h3 className="text-lg font-bold">No Item Selected</h3>
          <p className="text-sm text-muted-foreground">Select a table, measure, or column from the explorer to see its details and DAX logic.</p>
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
        <div className="p-8 border-b border-border bg-card/30 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-3xl bg-primary text-primary-foreground shadow-2xl shadow-primary/20">
              <Database size={32} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="default" className="bg-primary/20 text-primary border-primary/30">TABLE DASHBOARD</Badge>
                {table.isHidden && <Badge variant="outline">HIDDEN</Badge>}
              </div>
              <h2 className="text-4xl font-black tracking-tighter italic uppercase">{table.name}</h2>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          {/* Refined Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl border border-border bg-card/50 space-y-2 group hover:border-primary/30 transition-all relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-8 -mt-8" />
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">Logical Items</p>
              <div className="flex items-baseline gap-2">
                <p className="text-4xl font-black">{totalLogicItems}</p>
                <div className="flex flex-col">
                  <span className="text-[8px] text-muted-foreground font-black uppercase leading-tight">{table.measures?.length || 0} Measures</span>
                  <span className="text-[8px] text-muted-foreground font-black uppercase leading-tight">{calcColumns} Calc Columns</span>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground italic flex items-center gap-1">
                 <AlertCircle size={10} className="text-orange-500" />
                 {unusedMeasures} unused measures detected
              </p>
            </div>

            <div className="p-6 rounded-3xl border border-border bg-card/50 space-y-2 group hover:border-primary/30 transition-all">
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">Physical Columns</p>
              <div className="flex items-center gap-3">
                <p className="text-4xl font-black">{table.columns?.length || 0}</p>
                <div className="h-10 w-px bg-border/50 mx-2" />
                <div className="text-[10px] text-muted-foreground leading-tight max-w-[100px]">
                  Direct data storage fields mapped from source.
                </div>
              </div>
            </div>

            <div className="p-6 rounded-3xl border border-primary/20 bg-primary/5 space-y-2 group hover:scale-[1.02] transition-all relative overflow-hidden shadow-xl shadow-primary/5">
              <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-primary/10 rounded-full blur-2xl" />
              <p className="text-[10px] font-black uppercase text-foreground tracking-[0.2em]">Data Connection</p>
              <div className="flex items-center gap-3">
                 <Badge variant="default" className="text-lg font-black h-auto py-1 px-4 italic bg-primary text-primary-foreground uppercase">{table.storageMode || 'IMPORT'}</Badge>
              </div>
              <p className="text-[10px] text-muted-foreground italic font-medium pt-2">Model storage mode for this table.</p>
            </div>
          </div>

          {/* Calculated Table DAX Section */}
          {table.expression && (
            <section className="space-y-4">
              <h3 className="text-xs font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                <Code size={14} />
                Calculated Table Logic
              </h3>
              <div className="rounded-3xl border border-border bg-[#1e1e1e] p-6 shadow-xl relative group">
                <pre className="text-xs font-mono leading-relaxed overflow-x-auto text-[#d4d4d4] custom-scrollbar">
                  <code>{table.expression}</code>
                </pre>
                <div className="absolute top-4 right-4 text-[10px] font-black text-white/20 uppercase tracking-widest">DAX GENERATED</div>
              </div>
            </section>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Enhanced Relationship Map */}
            <section className="space-y-4">
              <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                <GitBranch size={14} className="text-primary" />
                Relationship Architecture
              </h3>
              <div className="rounded-3xl border border-border bg-card/50 overflow-hidden">
                <div className="p-4 bg-secondary/50 border-b border-border text-[10px] font-black uppercase tracking-widest text-muted-foreground grid grid-cols-3 gap-2">
                  <span>Connected Table</span>
                  <span className="text-center">Cardinality</span>
                  <span className="text-right">Join Keys</span>
                </div>
                <div className="divide-y divide-border/50 max-h-[300px] overflow-y-auto custom-scrollbar">
                  {relationships.length === 0 && (
                    <div className="p-8 text-center text-xs text-muted-foreground italic opacity-50">No external relationships mapped for this table.</div>
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
                      <div key={idx} className="p-4 flex items-center justify-between group hover:bg-primary/5 transition-colors grid grid-cols-3 gap-2">
                        <div className="flex flex-col gap-1 overflow-hidden">
                          <span className="text-xs font-bold text-foreground flex items-center gap-2 truncate">
                            <TableIcon size={12} className="text-primary/60 shrink-0" />
                            {linkedTable}
                          </span>
                        </div>
                        <div className="flex flex-col items-center gap-0.5">
                           <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20 shrink-0">{cardinalDisplay}</span>
                        </div>
                        <div className="flex flex-col items-end gap-1 overflow-hidden shrink-0">
                          <span className="text-[9px] font-mono font-bold bg-secondary px-1.5 py-0.5 rounded truncate max-w-full text-foreground/70">[{tableKey}]</span>
                          <div className={cn("w-px h-2 bg-primary/30")} />
                          <span className="text-[9px] font-mono font-bold bg-secondary/50 px-1.5 py-0.5 rounded truncate max-w-full text-muted-foreground">[{linkedKey}]</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* Schema Explorer */}
            <section className="space-y-4">
              <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                <Badge variant="accent" className="h-4 p-0 px-1 border-none shadow-none"><Type size={10} /></Badge>
                Technical Schema
              </h3>
              <div className="rounded-3xl border border-border bg-card/50 overflow-hidden flex flex-col max-h-[400px]">
                <div className="p-4 bg-secondary/50 border-b border-border text-[10px] font-black uppercase tracking-widest text-muted-foreground flex justify-between">
                  <span>Field Name</span>
                  <span>Type</span>
                </div>
                <div className="overflow-y-auto custom-scrollbar divide-y divide-border/50">
                  {table.columns?.map((col: any, idx: number) => (
                    <div key={idx} className="p-4 flex items-center justify-between group hover:bg-secondary/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-1.5 rounded-lg",
                          col.expression ? "bg-primary/10 text-primary" : "bg-orange-500/10 text-orange-500"
                        )}>
                          {col.expression ? <Zap size={12} /> : <Hash size={12} />}
                        </div>
                        <span className="text-xs font-medium text-foreground">{col.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {col.expression && <Badge variant="default" className="text-[7px] py-0 h-3 border-none">CALC</Badge>}
                        <Badge variant="outline" className="text-[8px] bg-secondary border-none">{col.dataType}</Badge>
                      </div>
                    </div>
                  ))}
                  {table.measures?.map((m: any, idx: number) => (
                    <div key={`m-${idx}`} className="p-4 flex items-center justify-between group hover:bg-primary/5 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                          <Zap size={12} />
                        </div>
                        <span className="text-xs font-medium text-foreground">{m.name}</span>
                      </div>
                      <Badge variant="default" className="text-[8px] border-none italic">MEASURE</Badge>
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
    <div className="h-full flex flex-col">
      <div className="p-8 border-b border-border bg-card/30 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-start justify-between">
          <div className="space-y-4 max-w-2xl">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2.5 rounded-2xl shadow-sm",
                showLogicSection ? "bg-primary/10 text-primary" : "bg-orange-500/10 text-orange-500"
              )}>
                {showLogicSection ? <Zap size={24} /> : <Hash size={24} />}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={showLogicSection ? "default" : "accent"}>
                    {isMeasure ? "Measure" : (isCalcColumn ? "Calc Column" : "Column")}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{selectedItem.tableName}</span>
                </div>
                <h2 className="text-3xl font-black tracking-tight">{selectedItem.name}</h2>
              </div>
            </div>
            
            {/* Logic Redundancy Banner (Only for Measures/Calc Columns) */}
            {showLogicSection && selectedItem.isUsed === false && (
              <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-center gap-3 mt-4">
                <div className="p-1.5 bg-orange-500/20 text-orange-500 rounded-lg">
                  <AlertCircle size={16} />
                </div>
                <div className="flex-1">
                  <p className="text-[11px] font-bold text-orange-500 uppercase tracking-wider">Potential Redundancy</p>
                  <p className="text-[10px] text-orange-500/80 leading-tight">
                    This {isMeasure ? "measure" : "column"} does not appear to be used in any DAX expressions or report visuals.
                  </p>
                </div>
              </div>
            )}
            
            {/* Detailed Safe Delete Simulation (New Feature) */}
            {showLogicSection && selectedItem.isUsed === false && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "p-4 rounded-2xl border flex flex-col gap-3 mt-2 transition-all duration-500",
                  (selectedItem as PBIMeasure).reportUsage?.length === 0 
                    ? "bg-green-500/5 border-green-500/20" 
                    : "bg-orange-500/5 border-orange-500/20 shadow-[0_10px_40px_rgba(249,115,22,0.05)]"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-xl",
                    (selectedItem as PBIMeasure).reportUsage?.length === 0 ? "bg-green-500/20 text-green-500" : "bg-orange-500/20 text-orange-500"
                  )}>
                    {(selectedItem as PBIMeasure).reportUsage?.length === 0 ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
                  </div>
                  <div className="flex-1">
                    <p className={cn(
                      "text-[11px] font-black uppercase tracking-wider",
                      (selectedItem as PBIMeasure).reportUsage?.length === 0 ? "text-green-500" : "text-orange-500"
                    )}>
                      {(selectedItem as PBIMeasure).reportUsage?.length === 0 ? "Safe Delete: Green Light 🟢" : "Safe Delete: Impact Detected ⚠️"}
                    </p>
                    <p className={cn(
                      "text-[10px] leading-tight mt-0.5",
                      (selectedItem as PBIMeasure).reportUsage?.length === 0 ? "text-green-500/80" : "text-orange-500/80"
                    )}>
                      {(selectedItem as PBIMeasure).reportUsage?.length === 0 
                        ? "Confirmed: This measure is physically isolated. Deletion has 0% report impact." 
                        : `Warning: This measure is still physically present on ${(selectedItem as PBIMeasure).reportUsage?.length} visual(s).`}
                    </p>
                  </div>
                </div>

                {(selectedItem as PBIMeasure).reportUsage && (selectedItem as PBIMeasure).reportUsage!.length > 0 && (
                  <div className="grid grid-cols-1 gap-2 pt-2 border-t border-orange-500/10">
                    <p className="text-[9px] font-bold text-orange-500/60 uppercase tracking-widest px-1">Affected Repository Locations</p>
                    {(selectedItem as PBIMeasure).reportUsage?.map((usage, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-orange-500/5 p-2 rounded-lg border border-orange-500/5 hover:border-orange-500/20 transition-colors">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[8px] h-4 bg-orange-500/10 border-orange-500/20 text-orange-500">{usage.page}</Badge>
                          <span className="text-[10px] font-medium text-foreground/80">{usage.visual}</span>
                        </div>
                        <ArrowRight size={10} className="text-orange-500/40" />
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
            
            {/* Standard Column Redundancy (Simpler) */}
            {!showLogicSection && selectedItem.isUsed === false && (
               <div className="p-3 bg-secondary/30 border border-border rounded-xl flex items-center gap-3 mt-4">
                 <div className="p-1.5 bg-secondary text-muted-foreground rounded-lg">
                   <AlertCircle size={16} />
                 </div>
                 <div className="flex-1">
                   <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Unused Column</p>
                   <p className="text-[10px] text-muted-foreground/80 leading-tight">
                     This column is not used in DAX or report visuals.
                   </p>
                 </div>
               </div>
            )}
            
            <div className="!mt-6 space-y-6 max-w-3xl">
              <div className="space-y-2 bg-card/30 p-4 rounded-2xl border border-border">
                <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Description</h4>
                <p className="text-foreground text-sm leading-relaxed">
                  {selectedItem.description || "No description provided in the semantic model."}
                </p>
              </div>

              {((selectedItem as any).dependencies?.measures?.length > 0 || (selectedItem as any).dependencies?.columns?.length > 0) && (
                <div className="space-y-2 px-2">
                  <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Dependencies</h4>
                  <div className="flex flex-wrap gap-2">
                    {(selectedItem as any).dependencies?.measures?.map((dep: string) => (
                      <div key={dep}><Badge variant="default" className="bg-blue-500/10 text-blue-500 border-blue-500/20 shadow-none font-medium text-xs px-3 py-1">{dep}</Badge></div>
                    ))}
                    {(selectedItem as any).dependencies?.columns?.map((dep: string) => (
                      <div key={dep}><Badge variant="outline" className="bg-secondary/50 text-muted-foreground border-border shadow-none font-medium text-xs px-3 py-1">{dep}</Badge></div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
             {onShowImpact && (
               <button 
                 onClick={onShowImpact}
                 className="flex items-center gap-2 px-4 py-2 bg-secondary border border-border rounded-xl text-xs font-bold hover:bg-secondary/80 hover:border-amber-500/30 transition-all text-amber-500"
               >
                 <Target size={16} />
                 Impact Analysis
               </button>
             )}
             <button className="p-2 hover:bg-secondary rounded-full text-muted-foreground transition-colors border border-border">
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
                <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                  <Code size={14} className="text-primary" />
                  Logic Expression
                </h3>
              </div>
              <div className="rounded-3xl border border-border bg-[#1e1e1e] p-6 shadow-2xl relative group">
                <pre className="text-sm font-mono leading-relaxed overflow-x-auto text-[#d4d4d4] custom-scrollbar">
                  <code className="language-dax">{selectedItem.expression}</code>
                </pre>
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Badge variant="outline" className="bg-white/5 backdrop-blur-md">DAX</Badge>
                </div>
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
                      <div key={i} className="flex gap-3 items-start p-3 bg-secondary/30 rounded-xl border border-border group hover:bg-secondary/50 transition-colors">
                        <div className={f.severity === 'critical' ? 'text-red-500 mt-0.5' : f.severity === 'warning' ? 'text-amber-500 mt-0.5' : 'text-blue-500 mt-0.5'}>
                          {f.severity === 'critical' ? <AlertCircle size={14} /> : f.severity === 'warning' ? <AlertTriangle size={14} /> : <Info size={14} />}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground">{f.pattern}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{f.suggestion}</p>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 rounded-2xl border border-border bg-card/50 space-y-1">
              <div className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Data Type</div>
              <div className="font-bold flex items-center gap-2">
                <Type size={14} className="text-primary" />
                {(selectedItem as PBIColumn).dataType}
              </div>
            </div>
            <div className="p-4 rounded-2xl border border-border bg-card/50 space-y-1">
              <div className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Table</div>
              <div className="font-bold flex items-center gap-2">
                <TableIcon size={14} className="text-primary" />
                {selectedItem.tableName}
              </div>
            </div>
            <div className="p-4 rounded-2xl border border-border bg-card/50 space-y-1">
              <div className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Source</div>
              <div className="font-bold flex items-center gap-2">
                <Database size={14} className="text-primary" />
                Physical Model
              </div>
            </div>
          </div>
        )}

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
              <GitBranch size={14} className="text-primary" />
              Dependency Lineage
            </h3>
            {showLogicSection && (
               <div className="flex items-center gap-2">
                  <Badge variant="outline" className={cn(
                    "text-[8px] font-black uppercase tracking-widest",
                    (selectedItem as PBIMeasure).isUsed === false ? "text-orange-500 border-orange-500/20 bg-orange-500/5 shadow-[0_0_10px_rgba(249,115,22,0.1)]" : "text-green-500 border-green-500/20 bg-green-500/5"
                  )}>
                    {(selectedItem as PBIMeasure).isUsed === false ? "UNUSED Logic" : "ACTIVE Logic"}
                  </Badge>
               </div>
            )}
          </div>
          
          <LineageGraph measure={showLogicSection ? (selectedItem as any) : undefined} model={model} />



          {/* Impact Shadow (Report Visuals) */}
          {showLogicSection && (selectedItem as PBIMeasure).reportUsage && (selectedItem as PBIMeasure).reportUsage!.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-3xl border border-primary/20 bg-primary/5 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Layout size={64} className="text-primary" />
              </div>
              <div className="space-y-4 relative z-10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center text-primary shadow-[0_0_15px_rgba(0,132,0,0.3)]">
                    <Layout size={16} />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">IMPACT SHADOW</h4>
                    <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">Downstream report visuals that break if deleted</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(selectedItem as PBIMeasure).reportUsage!.map((usage, idx) => (
                    <div key={idx} className="p-3 rounded-2xl bg-black/40 border border-white/5 flex items-center gap-3 hover:border-primary/30 transition-colors">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <div className="min-w-0">
                        <div className="text-[10px] font-black text-foreground truncate uppercase tracking-tighter">{usage.visual}</div>
                        <div className="text-[8px] text-muted-foreground uppercase font-bold tracking-widest">Page: {usage.page}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Used in Reports (Competitor Match) */}
          {showLogicSection && (selectedItem as PBIMeasure).reportUsage && (selectedItem as PBIMeasure).reportUsage!.length > 0 && (
            <div className="rounded-2xl border border-border bg-card/30 overflow-hidden max-w-4xl mt-6">
              <div className="p-5 bg-card border-b border-border">
                <h3 className="text-sm font-black text-foreground">Used In Reports ({(selectedItem as PBIMeasure).reportUsage!.length})</h3>
              </div>
              <div className="divide-y divide-border/40">
                {(selectedItem as PBIMeasure).reportUsage!.map((usage, idx) => (
                  <div key={idx} className="p-4 flex items-center gap-3 text-sm text-muted-foreground hover:bg-secondary/40 transition-colors">
                    <span className="text-primary font-bold">{usage.page}</span>
                    <span className="text-border">-</span>
                    <span className="text-foreground/80">{usage.visual}</span>
                    <span className="ml-auto text-[9px] uppercase font-black tracking-widest text-muted-foreground opacity-40 bg-secondary px-2 py-1 rounded">Page Link</span>
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

