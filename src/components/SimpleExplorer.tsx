import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search, ChevronDown, ChevronRight, BarChart3,
  CheckCircle, XCircle, List, FileText
} from 'lucide-react';
import { PBIModel, PBIMeasure, PBIColumn } from '../types';
import { cn } from '../utils';

interface SimpleExplorerProps {
  model: PBIModel;
  onShowImpact?: () => void;
  selectedItem: any;
  setSelectedItem: (item: any) => void;
}

type SimpleItem = (PBIMeasure | PBIColumn) & { tableName: string; itemKind: 'calc' | 'field' };

export const SimpleExplorer = ({ model, onShowImpact, selectedItem, setSelectedItem }: SimpleExplorerProps) => {
  const [search, setSearch] = useState('');
  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({});

  const toggleTable = (name: string) =>
    setExpandedTables(p => ({ ...p, [name]: !p[name] }));

  const filteredTables = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return model.tables;
    return model.tables.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.measures.some(m => m.name.toLowerCase().includes(q) || m.description?.toLowerCase().includes(q)) ||
      t.columns.some(c => c.name.toLowerCase().includes(q))
    );
  }, [model.tables, search]);

  const isMeasure = (item: SimpleItem) => item.itemKind === 'calc';

  const renderDetail = () => {
    if (!selectedItem) {
      return (
        <div className="h-full flex flex-col items-center justify-center text-center p-10 space-y-4">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
            <List size={28} />
          </div>
          <div>
            <h3 className="font-bold text-base">Nothing selected</h3>
            <p className="text-sm text-muted-foreground mt-1">Pick a calculation or data field from the list on the left to see its details.</p>
          </div>
        </div>
      );
    }

    const item: SimpleItem = selectedItem;
    const isCalc = item.itemKind === 'calc';
    const measure = item as PBIMeasure & { tableName: string };
    const reportPages = measure.reportUsage ?? [];
    const isActive = measure.isUsed !== false;
    const deps = item.dependencies;

    return (
      <div className="h-full overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="p-6 border-b border-border bg-card/30 sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border",
                  isCalc
                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                    : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                )}>
                  {isCalc ? 'Calculation' : 'Data Field'}
                </span>
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border flex items-center gap-1",
                  isActive
                    ? "bg-green-500/10 text-green-500 border-green-500/20"
                    : "bg-gray-500/10 text-gray-400 border-gray-500/20"
                )}>
                  {isActive ? <CheckCircle size={10} /> : <XCircle size={10} />}
                  {isActive ? 'Active' : 'Not in use'}
                </span>
              </div>
              <h2 className="text-2xl font-black tracking-tight">{item.name}</h2>
              <p className="text-xs text-muted-foreground">From: <span className="font-semibold text-foreground">{item.tableName}</span></p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* What it does */}
          <section className="space-y-2">
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
              {isCalc ? 'What it does' : 'Description'}
            </h3>
            <div className="p-4 bg-card border border-border rounded-2xl">
              <p className="text-sm leading-relaxed">
                {item.description?.trim()
                  ? item.description
                  : <span className="italic text-muted-foreground">No description has been written for this {isCalc ? 'calculation' : 'data field'} yet.</span>
                }
              </p>
            </div>
          </section>

          {/* Used in reports */}
          {isCalc && (
            <section className="space-y-2">
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                Used in these report pages
              </h3>
              {reportPages.length > 0 ? (
                <div className="space-y-2">
                  {reportPages.map((usage, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <FileText size={14} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{usage.page}</p>
                        <p className="text-xs text-muted-foreground">{usage.visual}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-secondary/30 border border-border rounded-2xl">
                  <p className="text-sm text-muted-foreground italic">
                    {isActive === false
                      ? 'This calculation is not used in any report pages.'
                      : 'No report page usage has been recorded for this calculation.'}
                  </p>
                </div>
              )}

              {onShowImpact && (
                <button
                  onClick={onShowImpact}
                  className="w-full flex items-center justify-center gap-2 mt-2 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl text-xs font-bold transition-all"
                >
                  <BarChart3 size={14} />
                  See what would be affected if this was changed or removed
                </button>
              )}
            </section>
          )}

          {/* Relies on */}
          {deps && (deps.measures.length > 0 || deps.columns.length > 0) && (
            <section className="space-y-2">
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                This {isCalc ? 'calculation' : 'data field'} relies on
              </h3>
              <div className="space-y-1.5">
                {deps.measures.map((m, i) => (
                  <div key={`m-${i}`} className="flex items-center gap-2 p-2.5 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span className="text-sm font-medium">{m}</span>
                    <span className="text-[10px] text-muted-foreground ml-auto">Calculation</span>
                  </div>
                ))}
                {deps.columns.map((c, i) => (
                  <div key={`c-${i}`} className="flex items-center gap-2 p-2.5 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                    <span className="text-sm font-medium">{c}</span>
                    <span className="text-[10px] text-muted-foreground ml-auto">Data Field</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Column-specific: data type */}
          {!isCalc && (
            <section className="space-y-2">
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Details</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-card border border-border rounded-2xl">
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Data Type</p>
                  <p className="font-bold mt-1">{(item as PBIColumn).dataType || '—'}</p>
                </div>
                <div className="p-4 bg-card border border-border rounded-2xl">
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Data Area</p>
                  <p className="font-bold mt-1">{item.tableName}</p>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full -m-8">
      {/* Left Panel — Table/Item List */}
      <div className="w-72 border-r border-border flex flex-col bg-card/30 shrink-0">
        {/* Search */}
        <div className="p-3 border-b border-border">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-secondary/50 border border-border rounded-xl py-2 pl-8 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
          {filteredTables.map(table => {
            const isOpen = !!expandedTables[table.name];
            return (
              <div key={table.name}>
                {/* Table row */}
                <button
                  onClick={() => toggleTable(table.name)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-secondary transition-colors text-left"
                >
                  {isOpen ? <ChevronDown size={14} className="text-primary shrink-0" /> : <ChevronRight size={14} className="text-muted-foreground shrink-0" />}
                  <span className="text-sm font-bold truncate flex-1">{table.name}</span>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {table.measures.length + table.columns.length}
                  </span>
                </button>

                {/* Expanded items */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="overflow-hidden pl-3"
                    >
                      {/* Calculations (Measures) */}
                      {table.measures.length > 0 && (
                        <div className="py-1">
                          <p className="px-3 py-1 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Calculations</p>
                          {table.measures.map(m => {
                            const itemWithMeta: SimpleItem = { ...m, tableName: table.name, itemKind: 'calc' };
                            const isSelected = selectedItem?.name === m.name && selectedItem?.tableName === table.name && selectedItem?.itemKind === 'calc';
                            return (
                              <button
                                key={m.name}
                                onClick={() => setSelectedItem(itemWithMeta)}
                                className={cn(
                                  "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all",
                                  isSelected
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                                )}
                              >
                                <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", m.isUsed === false ? "bg-gray-400" : "bg-emerald-500")} />
                                <span className="text-xs truncate">{m.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Data Fields (Columns) */}
                      {table.columns.length > 0 && (
                        <div className="py-1">
                          <p className="px-3 py-1 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Data Fields</p>
                          {table.columns.map(c => {
                            const itemWithMeta: SimpleItem = { ...c, tableName: table.name, itemKind: 'field' };
                            const isSelected = selectedItem?.name === c.name && selectedItem?.tableName === table.name && selectedItem?.itemKind === 'field';
                            return (
                              <button
                                key={c.name}
                                onClick={() => setSelectedItem(itemWithMeta)}
                                className={cn(
                                  "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all",
                                  isSelected
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                                )}
                              >
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                                <span className="text-xs truncate">{c.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}

          {filteredTables.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              <Search size={24} className="mx-auto mb-2 opacity-30" />
              <p className="text-xs">No results for "{search}"</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel — Detail */}
      <div className="flex-1 min-w-0 overflow-hidden bg-background">
        {renderDetail()}
      </div>
    </div>
  );
};
