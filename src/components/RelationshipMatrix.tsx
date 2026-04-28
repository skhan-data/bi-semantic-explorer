import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { PBIModel, PBIRelationship } from '../types';
import { cn } from '../utils';

interface RelationshipMatrixProps {
  model: PBIModel;
}

interface CellData {
  hasRelationship: boolean;
  relationship?: PBIRelationship;
  type: 'none' | 'one-to-many' | 'many-to-one' | 'many-to-many' | 'one-to-one' | 'self';
  direction: string;
  isBidirectional: boolean;
}

const TYPE_COLORS: Record<string, string> = {
  'none': 'transparent',
  'one-to-many': '#10b981',
  'many-to-one': '#0ea5e9',
  'many-to-many': '#f59e0b',
  'one-to-one': '#8b5cf6',
  'self': '#1e293b',
};

const TYPE_LABELS: Record<string, string> = {
  'one-to-many': '1:N',
  'many-to-one': 'N:1',
  'many-to-many': 'N:N',
  'one-to-one': '1:1',
};

export const RelationshipMatrix = ({ model }: RelationshipMatrixProps) => {
  const tableNames = useMemo(() => model.tables.map(t => t.name), [model]);

  const matrix = useMemo(() => {
    const grid: CellData[][] = [];

    for (let row = 0; row < tableNames.length; row++) {
      grid[row] = [];
      for (let col = 0; col < tableNames.length; col++) {
        if (row === col) {
          grid[row][col] = { hasRelationship: false, type: 'self', direction: '', isBidirectional: false };
          continue;
        }

        const fromTable = tableNames[row];
        const toTable = tableNames[col];

        const rel = model.relationships.find(
          r => (r.fromTable === fromTable && r.toTable === toTable) ||
               (r.fromTable === toTable && r.toTable === fromTable)
        );

        if (!rel) {
          grid[row][col] = { hasRelationship: false, type: 'none', direction: '', isBidirectional: false };
          continue;
        }

        const isFromRow = rel.fromTable === fromTable;
        const fromCard = rel.fromCardinality || 'many';
        const toCard = rel.toCardinality || 'one';
        const isBi = rel.crossFilteringBehavior === 'bothDirections' || rel.crossFilteringBehavior === 'bidirectional';

        let type: CellData['type'] = 'one-to-many';
        if (fromCard === 'many' && toCard === 'many') type = 'many-to-many';
        else if (fromCard === 'one' && toCard === 'one') type = 'one-to-one';
        else if (fromCard === 'one' && toCard === 'many') type = isFromRow ? 'one-to-many' : 'many-to-one';
        else type = isFromRow ? 'many-to-one' : 'one-to-many';

        grid[row][col] = {
          hasRelationship: true,
          relationship: rel,
          type,
          direction: `${rel.fromColumn} → ${rel.toColumn}`,
          isBidirectional: isBi,
        };
      }
    }

    return grid;
  }, [model, tableNames]);

  // Stats
  const totalRels = model.relationships.length;
  const biCount = model.relationships.filter(r => r.crossFilteringBehavior === 'bothDirections' || r.crossFilteringBehavior === 'bidirectional').length;
  const m2mCount = model.relationships.filter(r => r.fromCardinality === 'many' && r.toCardinality === 'many').length;

  if (tableNames.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground p-8">
        <p className="text-sm">No tables loaded. Import a model to see the relationship matrix.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex items-center gap-6 flex-wrap">
        <div className="flex items-center gap-4">
          {Object.entries(TYPE_LABELS).map(([type, label]) => (
            <div key={type} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: TYPE_COLORS[type] }} />
              <span className="text-[10px] font-bold text-muted-foreground">{label}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded border-2 border-red-500 bg-transparent" />
            <span className="text-[10px] font-bold text-muted-foreground">Bidirectional</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-bold">
          <span>{totalRels} Relationships</span>
          {biCount > 0 && <span className="text-amber-500">{biCount} Bidirectional</span>}
          {m2mCount > 0 && <span className="text-red-500">{m2mCount} Many-to-Many</span>}
        </div>
      </div>

      {/* Matrix Grid */}
      <div className="overflow-auto custom-scrollbar rounded-xl border border-border">
        <table className="border-collapse" style={{ minWidth: `${(tableNames.length + 1) * 60}px` }}>
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-card p-2 border-b border-r border-border min-w-[150px] max-w-[250px]" />
              {tableNames.map((name, i) => (
                <th
                  key={i}
                  className="p-2 border-b border-r border-border bg-secondary/50 min-w-[60px] h-[140px] align-bottom relative overflow-hidden"
                >
                  <div className="absolute bottom-2 left-6 text-[10px] font-bold text-muted-foreground -rotate-45 origin-left w-[120px] whitespace-normal break-words text-left leading-tight">
                    {name}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableNames.map((rowName, row) => (
              <tr key={row}>
                <td className="sticky left-0 z-10 bg-card px-3 py-1.5 border-b border-r border-border min-w-[150px] max-w-[250px]">
                  <span className="text-[10px] font-bold block whitespace-normal break-words">{rowName}</span>
                </td>
                {tableNames.map((_, col) => {
                  const cell = matrix[row]?.[col];
                  if (!cell) return <td key={col} className="border-b border-r border-border" />;

                  return (
                    <td
                      key={col}
                      className={cn(
                        "border-b border-r border-border text-center p-0 relative group",
                        cell.type === 'self' && "bg-secondary/30"
                      )}
                    >
                      {cell.hasRelationship && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: (row + col) * 0.02 }}
                          className={cn(
                            "w-7 h-7 mx-auto rounded-md flex items-center justify-center cursor-pointer transition-transform hover:scale-125",
                            cell.isBidirectional && "ring-2 ring-red-500"
                          )}
                          style={{ backgroundColor: TYPE_COLORS[cell.type] || '#10b981' }}
                          title={`${rowName} → ${tableNames[col]}\n${cell.direction}\nType: ${TYPE_LABELS[cell.type] || cell.type}${cell.isBidirectional ? ' (Bidirectional)' : ''}`}
                        >
                          <span className="text-[8px] font-black text-white">
                            {TYPE_LABELS[cell.type] || ''}
                          </span>
                        </motion.div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
