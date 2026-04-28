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
      <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-border rounded-3xl bg-secondary/10">
        <Layers size={48} className="text-muted-foreground mb-4 opacity-20" />
        <h3 className="text-lg font-bold">No Report Definitions Found</h3>
        <p className="text-sm text-muted-foreground max-w-sm lowercase"> ensure your project folder contains a .report subfolder with pbir definitions.</p>
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
          className="p-8 bg-card border border-border rounded-3xl shadow-xl space-y-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                <BarChart3 size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold tracking-tight">{report.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline">{report.pages.length} Pages</Badge>
                  <span className="text-[10px] text-muted-foreground uppercase font-black">Visual Inventory Active</span>
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
                      className="group p-5 bg-secondary/30 border border-border rounded-2xl hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-background rounded-lg text-primary shadow-sm group-hover:scale-110 transition-transform">
                          <BarChart3 size={16} />
                        </div>
                        <Badge variant="secondary">{visual.type}</Badge>
                      </div>
                      <h4 className="font-bold text-sm mb-3 group-hover:text-primary transition-colors line-clamp-1">{visual.title || 'Untitled Visual'}</h4>
                      <div className="space-y-2">
                         <p className="text-[10px] text-muted-foreground uppercase font-black flex items-center gap-1">
                           <Layout size={10} />
                           Fields Used
                         </p>
                         <div className="flex flex-wrap gap-1">
                           {[...visual.usedMeasures, ...visual.usedColumns].map((field, fIdx) => (
                             <span key={fIdx} className="px-2 py-0.5 bg-background border border-border rounded text-[10px] font-mono">
                               {field}
                             </span>
                           ))}
                           {(visual.usedMeasures.length === 0 && visual.usedColumns.length === 0) && <span className="text-[10px] text-muted-foreground italic">No fields linked</span>}
                         </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ))}
          </div>

          {/* Report Page Tabs (Power BI Style) */}
          <div className="flex items-center gap-1 p-1 bg-secondary/50 rounded-xl border border-border self-start">
            {report.pages.map(page => {
              const isActive = activeReportPage === page.name || (activeReportPage === null && page.name === report.pages[0].name);
              return (
                <button
                  key={page.name}
                  onClick={() => setActiveReportPage(page.name)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-xs font-bold transition-all relative",
                    isActive
                      ? "bg-background text-primary shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {page.name}
                  {isActive && (
                    <motion.div
                      layoutId="reportPageActive"
                      className="absolute -bottom-1 left-4 right-4 h-0.5 bg-primary rounded-full"
                    />
                  )}
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
