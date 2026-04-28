import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Database, BarChart3, FileText, AlertCircle, ArrowRight, CheckCircle } from 'lucide-react';
import { PBIModel } from '../types';

interface SimpleDashboardProps {
  model: PBIModel;
  onBrowse: () => void;
}

export const SimpleDashboard = ({ model, onBrowse }: SimpleDashboardProps) => {
  const totalAreas = model.tables.length;
  const totalCalcs = model.tables.reduce((acc, t) => acc + t.measures.length, 0);
  const totalReports = model.reports?.length || 0;
  const totalPages = model.reports?.reduce((acc, r) => acc + r.pages.length, 0) || 0;

  const undocumented = useMemo(() => {
    return model.tables.flatMap(t =>
      t.measures.filter(m => !m.description || m.description.trim() === '')
        .map(m => ({ name: m.name, area: t.name }))
    );
  }, [model]);

  const stats = [
    {
      label: 'Areas of Data',
      value: totalAreas,
      description: 'Distinct data areas in your model',
      icon: Database,
      color: 'bg-blue-500/10 text-blue-500',
    },
    {
      label: 'Calculations',
      value: totalCalcs,
      description: 'Formulas that power your reports',
      icon: BarChart3,
      color: 'bg-emerald-500/10 text-emerald-500',
    },
    {
      label: 'Reports',
      value: totalReports,
      description: `${totalPages} page${totalPages !== 1 ? 's' : ''} across all reports`,
      icon: FileText,
      color: 'bg-violet-500/10 text-violet-500',
    },
  ];

  return (
    <div className="space-y-8 pb-12 max-w-4xl mx-auto">

      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 bg-card border border-border rounded-3xl space-y-3"
      >
        <p className="text-xs font-bold text-primary uppercase tracking-widest">Data Model Summary</p>
        <h2 className="text-3xl font-black tracking-tight">{model.name}</h2>
        <p className="text-muted-foreground text-sm max-w-xl">
          This page gives you a plain-English overview of your data model — what's in it, what your reports show, and anything that may need attention.
        </p>
        <button
          onClick={onBrowse}
          className="flex items-center gap-2 mt-4 px-6 py-3 bg-primary text-primary-foreground font-bold text-sm rounded-2xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          Browse Data
          <ArrowRight size={16} />
        </button>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="p-6 bg-card border border-border rounded-3xl space-y-3 hover:border-primary/20 transition-all"
          >
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${stat.color}`}>
              <stat.icon size={20} />
            </div>
            <div>
              <p className="text-4xl font-black leading-none">{stat.value}</p>
              <p className="font-bold text-sm mt-1">{stat.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.description}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Undocumented calculations alert */}
      {undocumented.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="p-6 bg-amber-500/5 border border-amber-500/20 rounded-3xl space-y-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <AlertCircle size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-amber-600 dark:text-amber-400">
                {undocumented.length} calculation{undocumented.length !== 1 ? 's' : ''} without a description
              </h3>
              <p className="text-xs text-muted-foreground">These may be harder for your team to understand or maintain.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {undocumented.slice(0, 8).map((m, i) => (
              <span key={i} className="text-[11px] px-2 py-1 bg-amber-500/10 text-amber-700 dark:text-amber-300 rounded-lg font-medium border border-amber-500/20">
                {m.name}
                <span className="text-amber-500/60 ml-1">({m.area})</span>
              </span>
            ))}
            {undocumented.length > 8 && (
              <span className="text-[11px] px-2 py-1 bg-secondary text-muted-foreground rounded-lg">
                +{undocumented.length - 8} more
              </span>
            )}
          </div>
        </motion.div>
      )}

      {undocumented.length === 0 && totalCalcs > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="p-5 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl flex items-center gap-3"
        >
          <CheckCircle size={18} className="text-emerald-500 shrink-0" />
          <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">
            All calculations have descriptions — great for team understanding and onboarding.
          </p>
        </motion.div>
      )}

      {/* Report pages summary */}
      {model.reports && model.reports.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-black text-base uppercase tracking-widest text-muted-foreground px-1">Your Reports</h3>
          {model.reports.map((report, ri) => (
            <motion.div
              key={report.name}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + ri * 0.05 }}
              className="bg-card border border-border rounded-3xl overflow-hidden"
            >
              <div className="p-5 border-b border-border flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <FileText size={16} />
                </div>
                <div>
                  <h4 className="font-bold">{report.name}</h4>
                  <p className="text-xs text-muted-foreground">{report.pages.length} page{report.pages.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <div className="divide-y divide-border/50">
                {report.pages.map((page, pi) => (
                  <div key={pi} className="px-5 py-3 flex items-center justify-between">
                    <span className="text-sm font-medium">{page.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {page.visuals.length} visual{page.visuals.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
