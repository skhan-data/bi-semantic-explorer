import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Shield, FileText, Tag, Trash2, GitBranch, Zap,
  AlertTriangle, AlertCircle, Info, CheckCircle, ChevronRight,
  TrendingUp, Database, ArrowRight
} from 'lucide-react';
import { PBIModel } from '../types';
import { generateHealthReport, HealthIssue, CategoryScore } from '../utils/modelHealthScorer';
import { Badge } from './Badge';
import { cn } from '../utils';

interface HealthScorecardProps {
  model: PBIModel;
}

const CATEGORY_ICONS: Record<string, any> = {
  FileText, Tag, Trash2, GitBranch, Zap,
};

const ScoreGauge = ({ score, grade, size = 180 }: { score: number; grade: string; size?: number }) => {
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : score >= 40 ? '#f97316' : '#ef4444';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke="currentColor" strokeWidth="8" fill="none"
          className="text-border"
        />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={color} strokeWidth="8" fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - progress }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-4xl font-black"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{ color }}
        >
          {score}
        </motion.span>
        <span className="text-sm font-bold text-muted-foreground">/ 100</span>
        <div
          className="mt-1 px-3 py-0.5 rounded-full text-xs font-black"
          style={{ backgroundColor: `${color}20`, color }}
        >
          GRADE {grade}
        </div>
      </div>
    </div>
  );
};

const SeverityIcon = ({ severity }: { severity: string }) => {
  switch (severity) {
    case 'critical': return <AlertCircle size={14} className="text-red-500" />;
    case 'warning': return <AlertTriangle size={14} className="text-amber-500" />;
    default: return <Info size={14} className="text-blue-400" />;
  }
};

const CategoryCard: React.FC<{ cat: CategoryScore; index: number }> = ({ cat, index }) => {
  const Icon = CATEGORY_ICONS[cat.icon] || Shield;
  const color = cat.score >= 80 ? '#10b981' : cat.score >= 60 ? '#f59e0b' : '#ef4444';
  const barWidth = `${cat.score}%`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 + index * 0.1 }}
      className="p-4 bg-card border border-border rounded-2xl hover:border-primary/20 transition-all group"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-secondary text-muted-foreground group-hover:text-primary transition-colors">
            <Icon size={16} />
          </div>
          <span className="text-sm font-bold">{cat.name}</span>
        </div>
        <div className="flex items-center gap-2">
          {cat.issueCount > 0 && (
            <Badge variant="outline" className="text-[9px]">{cat.issueCount} issues</Badge>
          )}
          <span className="text-lg font-black" style={{ color }}>{cat.score}</span>
        </div>
      </div>
      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: barWidth }}
          transition={{ duration: 1, delay: 0.3 + index * 0.1 }}
        />
      </div>
      <div className="mt-2 text-[9px] text-muted-foreground font-bold uppercase tracking-widest">
        Weight: {Math.round(cat.weight * 100)}%
      </div>
    </motion.div>
  );
};

export const HealthScorecard = ({ model }: HealthScorecardProps) => {
  const report = useMemo(() => generateHealthReport(model), [model]);

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Score Gauge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-1 p-8 bg-card border border-border rounded-3xl flex flex-col items-center justify-center"
        >
          <div className="flex items-center gap-2 mb-6">
            <Shield size={20} className="text-primary" />
            <h2 className="text-xl font-black tracking-tight">MODEL HEALTH</h2>
          </div>
          <ScoreGauge score={report.overallScore} grade={report.grade} />
        </motion.div>

        {/* Summary Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-4"
        >
          {[
            { label: 'Tables', value: report.summary.totalTables, icon: Database },
            { label: 'Measures', value: report.summary.totalMeasures, icon: Zap },
            { label: 'Columns', value: report.summary.totalColumns, icon: Tag },
            { label: 'Relationships', value: report.summary.totalRelationships, icon: GitBranch },
            { label: 'Documented', value: `${report.summary.documentedPercent}%`, icon: FileText },
            { label: 'Unused', value: `${report.summary.unusedPercent}%`, icon: Trash2 },
          ].map((stat, i) => (
            <div key={i} className="p-4 bg-card border border-border rounded-2xl group hover:border-primary/20 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <stat.icon size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">{stat.label}</span>
              </div>
              <p className="text-2xl font-black">{stat.value}</p>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Category Breakdown */}
      <div className="space-y-4">
        <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <TrendingUp size={16} />
          Category Scores
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {report.categories.map((cat, i) => (
            <CategoryCard key={cat.name} cat={cat} index={i} />
          ))}
        </div>
      </div>

      {/* Issues List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <AlertTriangle size={16} />
            Findings & Recommendations
          </h3>
          <div className="flex items-center gap-2">
            {report.issues.filter(i => i.severity === 'critical').length > 0 && (
              <Badge variant="default" className="bg-red-500/10 text-red-500 border-red-500/20 text-[9px]">
                {report.issues.filter(i => i.severity === 'critical').length} Critical
              </Badge>
            )}
            {report.issues.filter(i => i.severity === 'warning').length > 0 && (
              <Badge variant="default" className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[9px]">
                {report.issues.filter(i => i.severity === 'warning').length} Warnings
              </Badge>
            )}
            <Badge variant="outline" className="text-[9px]">
              {report.issues.length} Total
            </Badge>
          </div>
        </div>

        {report.issues.length === 0 ? (
          <div className="p-8 bg-card border border-border rounded-3xl text-center">
            <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
            <h4 className="text-lg font-bold">No Issues Found</h4>
            <p className="text-sm text-muted-foreground mt-2">Your model is in excellent health. Keep up the good work!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {report.issues.map((issue, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * Math.min(i, 20) }}
                className={cn(
                  "p-4 bg-card border rounded-2xl flex items-start gap-3 group hover:border-primary/20 transition-all",
                  issue.severity === 'critical' ? 'border-red-500/30' : 'border-border'
                )}
              >
                <div className="mt-0.5">
                  <SeverityIcon severity={issue.severity} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold">{issue.item}</span>
                    <Badge variant="outline" className="text-[8px]">{issue.category}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{issue.message}</p>
                  <p className="text-xs text-primary mt-1 font-medium flex items-center gap-1">
                    <ArrowRight size={10} />
                    {issue.recommendation}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
