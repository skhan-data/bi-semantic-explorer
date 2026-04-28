import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search, Table as TableIcon, Zap, Hash, LayoutDashboard,
  GitBranch, Shield, Layers, Moon, Sun, Command
} from 'lucide-react';
import { PBIModel } from '../types';
import { cn } from '../utils';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  model: PBIModel;
  onNavigate: (tab: string) => void;
  onSelectItem: (item: any) => void;
  isDarkMode: boolean;
  setIsDarkMode: (v: boolean) => void;
}

interface SearchResult {
  id: string;
  name: string;
  category: 'table' | 'measure' | 'column' | 'action';
  tableName?: string;
  icon: any;
  action: () => void;
}

export const CommandPalette = ({
  isOpen, onClose, model, onNavigate, onSelectItem, isDarkMode, setIsDarkMode
}: CommandPaletteProps) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Build searchable index
  const allResults = useMemo<SearchResult[]>(() => {
    const results: SearchResult[] = [];

    // Actions
    results.push(
      { id: 'act-tables', name: 'Go to Tables', category: 'action', icon: TableIcon, action: () => { onNavigate('overview'); onClose(); } },
      { id: 'act-explorer', name: 'Go to Model Explorer', category: 'action', icon: LayoutDashboard, action: () => { onNavigate('explorer'); onClose(); } },
      { id: 'act-reports', name: 'Go to Reports', category: 'action', icon: Layers, action: () => { onNavigate('reports'); onClose(); } },
      { id: 'act-lineage', name: 'Go to Lineage', category: 'action', icon: GitBranch, action: () => { onNavigate('lineage'); onClose(); } },
      { id: 'act-theme', name: isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode', category: 'action', icon: isDarkMode ? Sun : Moon, action: () => { setIsDarkMode(!isDarkMode); onClose(); } },
    );

    // Tables
    model.tables.forEach(t => {
      results.push({
        id: `tbl-${t.name}`,
        name: t.name,
        category: 'table',
        icon: TableIcon,
        action: () => { onSelectItem({ ...t, isTable: true }); onNavigate('explorer'); onClose(); },
      });

      // Measures
      t.measures.forEach(m => {
        results.push({
          id: `msr-${t.name}.${m.name}`,
          name: m.name,
          tableName: t.name,
          category: 'measure',
          icon: Zap,
          action: () => { onSelectItem({ ...m, tableName: t.name }); onNavigate('explorer'); onClose(); },
        });
      });

      // Columns
      t.columns.forEach(c => {
        results.push({
          id: `col-${t.name}.${c.name}`,
          name: c.name,
          tableName: t.name,
          category: 'column',
          icon: Hash,
          action: () => { onSelectItem({ ...c, tableName: t.name }); onNavigate('explorer'); onClose(); },
        });
      });
    });

    return results;
  }, [model, isDarkMode, onNavigate, onSelectItem, onClose, setIsDarkMode]);

  // Filter results
  const filtered = useMemo(() => {
    if (!query.trim()) return allResults.filter(r => r.category === 'action');
    const q = query.toLowerCase();
    return allResults.filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.tableName?.toLowerCase().includes(q) ||
      r.category.includes(q)
    ).slice(0, 20);
  }, [query, allResults]);

  // Group by category
  const grouped = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {};
    const order = ['action', 'table', 'measure', 'column'];
    for (const r of filtered) {
      if (!groups[r.category]) groups[r.category] = [];
      groups[r.category].push(r);
    }
    return order.filter(k => groups[k]).map(k => ({ category: k, items: groups[k] }));
  }, [filtered]);

  // Reset selection when query changes
  useEffect(() => setSelectedIndex(0), [query]);

  // Focus input when opening
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        filtered[selectedIndex]?.action();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, filtered, selectedIndex, onClose]);

  const categoryLabels: Record<string, string> = {
    action: 'Quick Actions',
    table: 'Tables',
    measure: 'Measures',
    column: 'Columns',
  };

  let flatIndex = 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[300] bg-background/80 backdrop-blur-xl flex items-start justify-center pt-[15vh] p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: -10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
              <Search size={18} className="text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search tables, measures, columns, or type a command..."
                className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground"
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
              <kbd className="hidden sm:flex items-center gap-1 px-2 py-0.5 bg-secondary rounded text-[9px] text-muted-foreground font-mono border border-border">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
              {filtered.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Search size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No results for "{query}"</p>
                </div>
              ) : (
                grouped.map(group => (
                  <div key={group.category}>
                    <div className="px-4 py-2 text-[9px] font-black text-muted-foreground uppercase tracking-widest bg-secondary/30">
                      {categoryLabels[group.category] || group.category}
                    </div>
                    {group.items.map(item => {
                      const currentIndex = flatIndex++;
                      const isSelected = currentIndex === selectedIndex;
                      return (
                        <button
                          key={item.id}
                          onClick={item.action}
                          onMouseEnter={() => setSelectedIndex(currentIndex)}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                            isSelected ? "bg-primary/10 text-primary" : "text-foreground hover:bg-secondary"
                          )}
                        >
                          <item.icon size={16} className={isSelected ? "text-primary" : "text-muted-foreground"} />
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium truncate block">{item.name}</span>
                            {item.tableName && (
                              <span className="text-[10px] text-muted-foreground">{item.tableName}</span>
                            )}
                          </div>
                          {isSelected && (
                            <kbd className="text-[9px] px-1.5 py-0.5 bg-primary/20 rounded font-mono">↵</kbd>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-border flex items-center justify-between text-[9px] text-muted-foreground">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-secondary rounded font-mono border border-border">↑↓</kbd> Navigate</span>
                <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-secondary rounded font-mono border border-border">↵</kbd> Select</span>
                <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-secondary rounded font-mono border border-border">Esc</kbd> Close</span>
              </div>
              <span className="font-bold">{filtered.length} results</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
