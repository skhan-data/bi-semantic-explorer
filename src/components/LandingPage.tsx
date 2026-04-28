import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Database, ArrowRight, RefreshCw, CheckCircle2, 
  AlertCircle, Sparkles, Layout, Code, Search
} from 'lucide-react';
import { cn } from '../utils';

interface LandingPageProps {
  projectPath: string;
  setProjectPath: (path: string) => void;
  isSyncing: boolean;
  syncError: string | null;
  isImported: boolean;
  handleSync: () => void;
  onExplore: () => void;
}

export const LandingPage = ({
  projectPath,
  setProjectPath,
  isSyncing,
  syncError,
  isImported,
  handleSync,
  onExplore
}: LandingPageProps) => {
  return (
    <div className="min-h-screen bg-[#0B0C0C] text-[#F3F2F1] flex flex-col items-center justify-center relative overflow-hidden p-6 selection:bg-primary/30">
      {/* Animated Background Blobs */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <motion.div
           animate={{
             x: [0, 100, 0],
             y: [0, 50, 0],
             scale: [1, 1.2, 1],
           }}
           transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
           className="absolute -top-1/4 -left-1/4 w-[60%] h-[60%] bg-[#008400]/20 rounded-full blur-[120px]"
        />
        <motion.div
           animate={{
             x: [0, -100, 0],
             y: [0, -50, 0],
             scale: [1, 1.1, 1],
           }}
           transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
           className="absolute -bottom-1/4 -right-1/4 w-[50%] h-[50%] bg-[#F5CE00]/10 rounded-full blur-[100px]"
        />
      </div>

      {/* Main Content */}
      <div className="z-10 max-w-4xl w-full text-center space-y-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-black tracking-widest text-[#F5CE00] mb-6 backdrop-blur-md">
             <Sparkles size={14} />
             NEW RELEASE V1.2.0
          </div>
          <h1 className="text-7xl md:text-8xl font-black italic tracking-tighter leading-none text-white drop-shadow-2xl">
            SEMANTIC<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#008400] to-[#F5CE00]">EXPLORER</span>
          </h1>
          <p className="text-lg text-[#B1B4B6] max-w-2xl mx-auto font-medium leading-relaxed">
            Beautifully documented, AI-enhanced, and completely local. <br />
            Explore your Power BI Semantic Models like never before.
          </p>
        </motion.div>

        {/* Sync Area */}
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.4, duration: 0.8 }}
           className="max-w-2xl mx-auto space-y-6"
        >
          <div className="p-2 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[32px] shadow-2xl relative group">
            <div className="flex items-center gap-4 px-6 py-4">
              <Database className="text-primary hidden md:block" size={24} />
              <input
                type="text"
                placeholder="Enter your Power BI project path (e.g. X:\MyProject)"
                className="flex-1 bg-transparent border-none text-white placeholder-slate-500 focus:ring-0 text-lg font-medium selection:bg-primary/50"
                value={projectPath}
                onChange={(e) => setProjectPath(e.target.value)}
                disabled={isSyncing || isImported}
              />
              <button
                onClick={handleSync}
                disabled={isSyncing || isImported || !projectPath}
                className={cn(
                  "px-8 py-3 rounded-2xl font-black text-sm tracking-widest uppercase transition-all flex items-center gap-2",
                  isImported ? "bg-green-500 text-white shadow-lg shadow-green-500/20" : 
                  "bg-primary text-primary-foreground hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/20 disabled:opacity-50"
                 )}
              >
                {isSyncing ? <RefreshCw className="animate-spin" size={18} /> : 
                 isImported ? <CheckCircle2 size={18} /> : <ArrowRight size={18} />}
                {isSyncing ? "SYNCING..." : isImported ? "SUCCESS" : "IMPORT"}
              </button>
            </div>
          </div>

          {/* Status Message / Log */}
          <AnimatePresence>
            {(isSyncing || syncError || isImported) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className={cn(
                  "p-6 rounded-3xl border backdrop-blur-md text-left transition-colors",
                  syncError ? "bg-red-500/10 border-red-500/20" : 
                  isImported ? "bg-green-500/10 border-green-500/20" : 
                  "bg-white/5 border-white/10"
                )}>
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-2xl flex items-center justify-center",
                      syncError ? "bg-red-500/20 text-red-500" : 
                      isImported ? "bg-green-500/20 text-green-500" : 
                      "bg-primary/20 text-primary animate-pulse"
                    )}>
                      {syncError ? <AlertCircle size={20} /> : 
                       isImported ? <CheckCircle2 size={20} /> : <RefreshCw className="animate-spin" size={20} />}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-black text-xs uppercase tracking-widest flex items-center justify-between">
                         {syncError ? "Import Failed" : isImported ? "Successfully Imported" : "Import In Progress"}
                         {isImported && <Badge className="bg-green-500 text-white border-none py-0 px-2 h-4 text-[8px]">COMPLETE</Badge>}
                      </h3>
                      <p className="text-sm text-slate-400 mt-1 font-medium italic">
                        {syncError || (isImported ? `Semantic Model \"${projectPath.split('\\').pop()}\" is now ready for exploration.` : "Analyzing TMDL files, extracting measures, and rebuilding model lineage...")}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Explore Button (Revealed after sync) */}
        <AnimatePresence>
          {isImported && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="pt-8"
            >
              <button
                onClick={onExplore}
                className="group relative inline-flex items-center gap-4 bg-[#F5CE00] text-[#0B0C0C] px-12 py-5 rounded-[40px] font-black italic text-xl tracking-tighter hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-[#F5CE00]/20 overflow-hidden"
              >
                <div className="absolute inset-0 bg-[#008400] translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                <span className="relative z-10 group-hover:text-white transition-colors uppercase">Explore Semantic Model</span>
                <ArrowRight size={24} className="relative z-10 group-hover:text-white transition-colors" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Feature Grid (Floating) */}
      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 opacity-30 group-hover:opacity-100 transition-opacity">
        {[
          { icon: Layout, label: 'Visual Lineage', desc: 'Auto-detected relationships & flows' },
          { icon: Code, label: 'DAX Insights', desc: 'AI-powered measure documentation' },
          { icon: Search, label: 'Deep Search', desc: 'Global discovery across metadata' }
        ].map((f, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ delay: 0.8 + i * 0.1 }}
            className="flex items-center gap-4 bg-[#1F2122] p-4 rounded-2xl border border-[#333638] backdrop-blur-md"
          >
            <div className="text-primary"><f.icon size={20} /></div>
            <div className="text-left">
              <p className="text-xs font-bold uppercase tracking-tight">{f.label}</p>
              <p className="text-[10px] text-slate-500">{f.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const Badge = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold border border-white/20", className)}>
    {children}
  </span>
);
