import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Database, Table as TableIcon, Zap, Hash, BarChart3, Layers, LayoutGrid, ArrowRight
} from 'lucide-react';
import { PBIModel, PBITable } from '../types';

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

// Container variants for staggered children
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 30 } }
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
    
    return Array.from(map.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.measureCount - a.measureCount || b.tables.length - a.tables.length);
  }, [model]);

  const kpis = [
    { label: 'Total Measures', value: totalMeasures, icon: Zap },
    { label: 'Total Tables', value: totalTables, icon: TableIcon },
    { label: 'Total Columns', value: totalColumns, icon: Hash },
    { label: 'Total Reports', value: totalReports, icon: BarChart3 },
  ];

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="max-w-6xl mx-auto space-y-12 pb-12"
    >
      {/* Executive Header */}
      <motion.div variants={item} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground">{model.name} Overview</h2>
          <p className="text-sm text-muted-foreground font-light max-w-[60ch]">
            Explore business domains and structural metrics across your semantic model.
          </p>
        </div>
        <button
          onClick={onNavigateToExplorer}
          className="pressable flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-semibold text-sm rounded-lg hover:opacity-90 transition-all"
        >
          <Database size={16} />
          Explore Model
        </button>
      </motion.div>

      {/* KPI Cards */}
      <motion.div variants={container} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((stat, i) => (
          <motion.div
            key={i}
            variants={item}
            className="p-6 bg-card border border-border/50 rounded-xl hover:border-border transition-colors flex flex-col gap-4"
          >
            <div className="w-10 h-10 bg-secondary flex items-center justify-center rounded-lg text-muted-foreground">
              <stat.icon size={20} />
            </div>
            <div>
               <h3 className="text-3xl font-medium tracking-tight leading-none text-foreground mb-1.5">{stat.value}</h3>
               <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Domains Grid */}
      <motion.div variants={item}>
        <div className="flex items-center gap-3 mb-6 px-1">
           <LayoutGrid className="text-muted-foreground" size={18} />
           <h3 className="text-sm font-semibold tracking-wide text-foreground">EXTRACTED BUSINESS DOMAINS</h3>
        </div>
        
        <motion.div variants={container} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {domains.map((domain, i) => (
            <motion.div
              key={domain.name}
              variants={item}
              whileHover={{ y: -2 }}
              onClick={onNavigateToExplorer}
              className="cursor-pointer group p-6 bg-card border border-border/50 rounded-xl hover:border-border transition-all flex flex-col justify-between min-h-[140px]"
            >
              <div className="flex items-start justify-between mb-6">
                <h4 className="text-base font-medium tracking-tight text-foreground group-hover:text-primary transition-colors">
                  {domain.name}
                </h4>
                <div className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity group-hover:translate-x-1 group-hover:-translate-y-1 transform duration-300">
                  <ArrowRight size={16} />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <TableIcon size={14} className="text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">{domain.tables.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap size={14} className="text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">{domain.measureCount}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </motion.div>
  );
};
