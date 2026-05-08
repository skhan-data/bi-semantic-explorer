import React, { useMemo } from 'react';
import { PBIModel, PBITable, PBIMeasure, PBIColumn } from '../types';
import { Archive, Trash2, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { cn } from '../utils';

interface SpringCleaningProps {
  model: PBIModel;
}

export const SpringCleaningDashboard = ({ model }: SpringCleaningProps) => {
  const unusedMeasures = useMemo(() => {
    return model.tables.flatMap(t => 
      t.measures
        .filter(m => m.isUsed === false)
        .map(m => ({ ...m, tableName: t.name }))
    );
  }, [model]);

  const unusedColumns = useMemo(() => {
    // Collect all columns used in relationships
    const relationColumns = new Set<string>();
    model.relationships.forEach(r => {
      relationColumns.add(`${r.fromTable}[${r.fromColumn}]`);
      relationColumns.add(`${r.toTable}[${r.toColumn}]`);
    });

    // Collect all columns used in measures and calculated columns
    const depColumns = new Set<string>();
    model.tables.forEach(t => {
      t.measures.forEach(m => {
        m.dependencies?.columns.forEach(c => depColumns.add(c));
      });
      t.columns.forEach(c => {
        c.dependencies?.columns?.forEach(dc => depColumns.add(dc));
      });
    });

    // Find unused columns
    return model.tables.flatMap(t => 
      t.columns.filter(c => {
        const fullRef = `${t.name}[${c.name}]`;
        const isUsed = relationColumns.has(fullRef) || depColumns.has(fullRef) || c.isUsed === true;
        return !isUsed;
      }).map(c => ({ ...c, tableName: t.name }))
    );
  }, [model]);

  const hiddenTables = useMemo(() => {
    return model.tables.filter(t => t.isHidden && !model.relationships.some(r => r.fromTable === t.name || r.toTable === t.name));
  }, [model]);

  const totalOrphans = unusedMeasures.length + unusedColumns.length + hiddenTables.length;

  return (
    <div className="h-full bg-card border border-border flex flex-col">
      <div className="p-8 border-b border-border bg-secondary/20">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <Archive className="text-primary" size={32} />
              Model Cleanup
            </h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
              Identify unused, orphaned, or disconnected objects in your model. Removing these will reduce file size, improve refresh performance, and make the model easier to maintain.
            </p>
          </div>
          <div className="bg-background border border-border p-4 text-center">
            <div className="text-4xl font-black text-red-500">{totalOrphans}</div>
            <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mt-1">Orphaned Items</div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-8">
        {totalOrphans === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
            <div className="w-16 h-16 bg-primary/10 flex items-center justify-center text-primary rounded-full">
              <CheckCircle2 size={32} />
            </div>
            <div>
              <h3 className="text-xl font-bold">Your model is perfectly clean!</h3>
              <p className="text-muted-foreground mt-1">No unused measures, disconnected columns, or orphaned tables detected.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Unused Measures */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <Trash2 size={18} className="text-red-500" />
                <h3 className="font-bold text-lg">Unused Measures ({unusedMeasures.length})</h3>
              </div>
              <p className="text-xs text-muted-foreground">These measures are not referenced in any DAX expressions or report visuals.</p>
              
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {unusedMeasures.map(m => (
                  <div key={`${m.tableName}-${m.name}`} className="p-3 bg-secondary/50 border border-border flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-foreground">{m.name}</span>
                      <span className="text-[10px] uppercase tracking-widest font-black text-muted-foreground">{m.tableName}</span>
                    </div>
                    {m.description && <p className="text-xs text-muted-foreground truncate">{m.description}</p>}
                  </div>
                ))}
                {unusedMeasures.length === 0 && <p className="text-sm italic text-muted-foreground p-4 text-center">No unused measures found.</p>}
              </div>
            </div>

            {/* Unused Columns */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <ShieldAlert size={18} className="text-orange-500" />
                <h3 className="font-bold text-lg">Unused Columns ({unusedColumns.length})</h3>
              </div>
              <p className="text-xs text-muted-foreground">These columns are not part of any relationships or DAX measures.</p>
              
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {unusedColumns.map(c => (
                  <div key={`${c.tableName}-${c.name}`} className="p-3 bg-secondary/50 border border-border flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-foreground">{c.name}</span>
                      <span className="text-[10px] uppercase tracking-widest font-black text-muted-foreground">{c.tableName}</span>
                    </div>
                    {c.dataType && <p className="text-[10px] text-muted-foreground uppercase font-mono">{c.dataType}</p>}
                  </div>
                ))}
                {unusedColumns.length === 0 && <p className="text-sm italic text-muted-foreground p-4 text-center">No unused columns found.</p>}
              </div>
            </div>

            {/* Hidden / Disconnected Tables */}
            <div className="space-y-4 lg:col-span-2">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <Archive size={18} className="text-amber-500" />
                <h3 className="font-bold text-lg">Disconnected Tables ({hiddenTables.length})</h3>
              </div>
              <p className="text-xs text-muted-foreground">These tables are hidden and have absolutely no active relationships to other tables.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {hiddenTables.map(t => (
                  <div key={t.name} className="p-4 bg-secondary/50 border border-border flex flex-col gap-2">
                    <span className="font-bold text-sm text-foreground">{t.name}</span>
                    <span className="text-xs text-muted-foreground">{t.columns.length} columns • {t.measures.length} measures</span>
                  </div>
                ))}
                {hiddenTables.length === 0 && <p className="text-sm italic text-muted-foreground p-4 col-span-full text-center">No disconnected tables found.</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
