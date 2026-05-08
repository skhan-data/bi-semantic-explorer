import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Database, Table as TableIcon, Zap, Hash, BarChart3, Layers, LayoutGrid
} from 'lucide-react';
import { PBIModel, PBITable } from '../types';
import { Badge } from './Badge';

interface OverviewDashboardProps {
  model: PBIModel;
  onNavigateToExplorer: () => void;
}

const getDomainName = (tableName: string) => {
  const lower = tableName.toLowerCase();
  if (lower.startsWith('fact')) return 'Actionable Facts';
  if (lower.startsWith('dim')) return 'Business Dimensions';
  if (lower.includes('date') || lower.includes('time') || lower.includes('calendar')) return 'Time Intelligence';
  if (lower.includes('measure') || lower.includes('calc') || lower.includes('metric') || lower.includes('parameter')) return 'System Metrics';
  
  const words = tableName.split(/[\s_]/);
  const firstWord = words[0].replace(/[^a-zA-Z]/g, '');
  if (firstWord.length > 2) {
    return firstWord.charAt(0).toUpperCase() + firstWord.slice(1) + ' Data';
  }
  return 'General Model';
};

export const OverviewDashboard = ({ model, onNavigateToExplorer }: OverviewDashboardProps) => {
  const totalTables = model.tables.length;
  const totalMeasures = model.tables.reduce((acc, t) => acc + t.measures.length, 0);
  const totalColumns = model.tables.reduce((acc, t) => acc + t.columns.length, 0);
  const totalReports = model.reports?.length || 0;

  const domains = useMemo(() => {
    const map = new Map<string, { tables: PBITable[]; measureCount: number }>();
    model.tables.forEach(t => {
      const dName = getDomainName(t.name);
      if (!map.has(dName)) map.set(dName, { tables: [], measureCount: 0 });
      const stats = map.get(dName)!;
      stats.tables.push(t);
      stats.measureCount += t.measures.length;
    });
    
    // Convert to array and sort by importance (measures count, then table count)
    return Array.from(map.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.measureCount - a.measureCount || b.tables.length - a.tables.length);
  }, [model]);

  const kpis = [
    { label: 'Total Measures', value: totalMeasures, icon: Zap, color: 'text-blue-500' },
    { label: 'Total Tables', value: totalTables, icon: TableIcon, color: 'text-primary' },
    { label: 'Total Columns', value: totalColumns, icon: Hash, color: 'text-orange-500' },
    { label: 'Total Reports', value: totalReports, icon: BarChart3, color: 'text-emerald-500' },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Executive Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 p-8 bg-card border border-border shadow-sm">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">{model.name} Overview</h2>
          <p className="text-sm text-muted-foreground mt-1">Explore business domains and structural metrics across your semantic model.</p>
        </div>
        <button
          onClick={onNavigateToExplorer}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground font-bold text-sm tracking-widest hover:opacity-90 transition-all uppercase"
        >
          <Database size={16} />
          Explore Model
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="p-6 bg-card border border-border shadow-sm flex items-center gap-4 hover:border-primary/50 transition-all"
          >
            <div className={`w-12 h-12 bg-secondary flex items-center justify-center rounded-lg ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div>
               <h2 className="text-3xl font-bold leading-none">{stat.value}</h2>
               <p className="text-xs text-muted-foreground font-medium mt-1">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Domains Grid */}
      <div>
        <div className="flex items-center gap-3 mb-6 px-2">
           <LayoutGrid className="text-primary" size={20} />
           <h3 className="text-lg font-black tracking-tight uppercase">Extracted Business Domains</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {domains.map((domain, i) => (
            <motion.div
              key={domain.name}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              onClick={onNavigateToExplorer}
              className="cursor-pointer group p-6 bg-card border border-border shadow-sm hover:shadow-md hover:border-primary/30 transition-all flex flex-col"
            >
              <div className="flex items-start justify-between mb-4">
                <h4 className="text-lg font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">{domain.name}</h4>
                <div className="p-2 bg-secondary rounded-lg text-muted-foreground group-hover:text-primary transition-colors">
                  <Layers size={18} />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 px-2 py-0.5 font-bold">
                  {domain.tables.length} {domain.tables.length === 1 ? 'Table' : 'Tables'}
                </Badge>
                <div className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Zap size={12} className="text-amber-500" />
                  {domain.measureCount} Measures
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
