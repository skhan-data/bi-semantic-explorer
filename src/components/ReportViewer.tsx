import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Layers, BarChart3, Info } from 'lucide-react';
import { PBIReport } from '../types';
import { Badge } from './Badge';
import { cn } from '../utils';

interface ReportViewerProps {
  reports: PBIReport[];
  activeReportPage: string | null;
  setActiveReportPage: (page: string) => void;
}

export const ReportViewer = ({
  reports,
  activeReportPage,
  setActiveReportPage
}: ReportViewerProps) => {
  if (!reports || reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-border/50 rounded-xl bg-secondary/10">
        <Layers size={48} className="text-muted-foreground mb-4 opacity-20" />
        <h3 className="text-base font-semibold text-foreground">No Report Definitions Found</h3>
        <p className="text-sm font-medium text-muted-foreground max-w-sm mt-1">Ensure your project folder contains a .report subfolder with pbir definitions.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {reports.map((report) => (
        <motion.div
          key={report.name}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-8 bg-card border border-border/50 rounded-xl shadow-2xl space-y-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-inner">
                <BarChart3 size={24} />
              </div>
              <div>
                <h3 className="text-xl font-semibold tracking-tight text-foreground">{report.name}</h3>
                <div className="flex items-center gap-2 mt-1.5">
                  <Badge variant="outline">{report.pages.length} Pages</Badge>
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-widest">Visual Inventory</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {report.pages
              .filter(p => activeReportPage === null || p.name === activeReportPage || (activeReportPage === null && p.name === report.pages[0].name))
              .map(page => (
                <div key={page.name} className="contents">
                  {page.visuals.map((visual, vIdx) => (
                    <motion.div
                      key={`${page.name}-${vIdx}`}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="group p-5 bg-secondary/30 border border-border/50 rounded-xl hover:border-primary/50 transition-colors hover:bg-secondary/50"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-background border border-border/50 rounded-lg text-primary shadow-sm group-hover:scale-110 transition-transform">
                          <BarChart3 size={16} />
                        </div>
                        <Badge variant="secondary">{visual.type}</Badge>
                      </div>
                      <h4 className="font-medium text-sm mb-3 group-hover:text-primary transition-colors line-clamp-1 text-foreground">{visual.title || 'Untitled Visual'}</h4>
                      <div className="space-y-2">
                         <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider flex items-center gap-1.5">
                           <Layout size={12} />
                           Fields Used
                         </p>
                         <div className="flex flex-wrap gap-1.5">
                           {[...visual.usedMeasures, ...visual.usedColumns].map((field, fIdx) => (
                             <span key={fIdx} className="px-2 py-0.5 bg-background border border-border/50 rounded-md text-[10px] font-mono text-muted-foreground">
                               {field}
                             </span>
                           ))}
                           {(visual.usedMeasures.length === 0 && visual.usedColumns.length === 0) && <span className="text-[10px] text-muted-foreground italic font-medium">No fields linked</span>}
                         </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ))}
          </div>

          {/* Report Page Tabs */}
          <div className="flex items-center gap-1 p-1 bg-secondary/50 rounded-lg border border-border/50 self-start">
            {report.pages.map(page => {
              const isActive = activeReportPage === page.name || (activeReportPage === null && page.name === report.pages[0].name);
              return (
                <button
                  key={page.name}
                  onClick={() => setActiveReportPage(page.name)}
                  className={cn(
                    "px-4 py-2 rounded-md text-sm font-medium transition-all relative pressable",
                    isActive
                      ? "bg-background text-foreground shadow-sm border border-border/50"
                      : "text-muted-foreground hover:text-foreground border border-transparent"
                  )}
                >
                  {page.name}
                </button>
              );
            })}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

const Layout = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
    <line x1="3" y1="9" x2="21" y2="9"></line>
    <line x1="9" y1="21" x2="9" y2="9"></line>
  </svg>
);
