import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, GitBranch, Database, Shield, Lock, 
  ArrowRight, RefreshCw, X, FolderSync, Info,
  Search, Link as LinkIcon, Cloud
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { cn } from '../utils';

interface ConnectHubProps {
  onAnalyzeZip: (file: File) => void;
  onAnalyzeGit: (config: { repoUrl: string; branch: string; token: string }) => void;
  isAnalyzing: boolean;
  error: string | null;
}

type TabType = 'zip' | 'git';

export const ConnectHub = ({ onAnalyzeZip, onAnalyzeGit, isAnalyzing, error }: ConnectHubProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('zip');
  const [gitConfig, setGitConfig] = useState({ repoUrl: '', branch: 'main', token: '' });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onAnalyzeZip(acceptedFiles[0]);
    }
  }, [onAnalyzeZip]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/zip': ['.zip'] },
    multiple: false,
    disabled: isAnalyzing
  } as any);

  const handleGitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAnalyzeGit(gitConfig);
  };

  const tabs: { id: TabType; label: string; icon: any; desc: string }[] = [
    { id: 'zip', label: 'Local Project', icon: Upload, desc: 'Upload .zip export of your .pbip project folder' },
    { id: 'git', label: 'Git Sync', icon: GitBranch, desc: 'Connect directly to GitHub or Azure DevOps' },
  ];

  return (
    <div className="min-h-screen bg-[#0B0C0C] text-[#F3F2F1] flex flex-col items-center justify-center p-6 selection:bg-primary/30 relative overflow-hidden">
      {/* Data Schematic Background Array */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none bg-[#0B0C0C] flex items-center justify-center">
        <svg className="absolute w-[150vw] h-[150vh] min-w-[1200px] min-h-[1200px] opacity-[0.25] text-primary" viewBox="0 0 1000 1000">
           <defs>
             <pattern id="dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
               <circle cx="2" cy="2" r="1.5" fill="currentColor" opacity="0.3" />
             </pattern>
           </defs>
           <rect width="100%" height="100%" fill="url(#dots)" />
           
           <motion.g
              style={{ transformOrigin: '500px 500px' }}
              animate={{ rotate: 360 }}
              transition={{ duration: 180, repeat: Infinity, ease: "linear" }}
           >
             {/* Massive outer structural rings */}
             <circle cx="500" cy="500" r="300" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="10 20" />
             <circle cx="500" cy="500" r="400" fill="none" stroke="currentColor" strokeWidth="0.5" />
             
             {/* Data Schema Connections */}
             <path d="M 500 200 L 500 100 L 600 100" fill="none" stroke="currentColor" strokeWidth="2" />
             <rect x="590" y="80" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2" />
             <path d="M 610 120 L 610 180 L 680 180" fill="none" stroke="currentColor" strokeWidth="1" />
             <circle cx="680" cy="180" r="6" fill="currentColor" />
             
             <path d="M 500 800 L 500 900 L 400 900" fill="none" stroke="currentColor" strokeWidth="2" />
             <rect x="370" y="880" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2" />

             <path d="M 200 500 L 100 500 L 100 400" fill="none" stroke="currentColor" strokeWidth="2" />
             <circle cx="100" cy="380" r="20" fill="none" stroke="currentColor" strokeWidth="2" />

             {/* Orbiting nodes representing tables */}
             {[...Array(12)].map((_, i) => {
               const angle = (i * 30 * Math.PI) / 180;
               const x = 500 + Math.cos(angle) * 300;
               const y = 500 + Math.sin(angle) * 300;
               return <circle key={i} cx={x} cy={y} r="8" fill="currentColor" />;
             })}
           </motion.g>
           
           <motion.g
              style={{ transformOrigin: '500px 500px' }}
              animate={{ rotate: -360 }}
              transition={{ duration: 240, repeat: Infinity, ease: "linear" }}
           >
             <circle cx="500" cy="500" r="600" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 8" />
             <circle cx="500" cy="500" r="580" fill="none" stroke="currentColor" strokeWidth="0.2" />
             {[...Array(6)].map((_, i) => {
               const angle = (i * 60 * Math.PI) / 180;
               const px = 500 + Math.cos(angle) * 600;
               const py = 500 + Math.sin(angle) * 600;
               return (
                 <g key={i}>
                   <path d={`M ${500 + Math.cos(angle) * 400} ${500 + Math.sin(angle) * 400} L ${px} ${py}`} fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="5 5" />
                   <rect x={px - 15} y={py - 15} width="30" height="30" fill="none" stroke="currentColor" strokeWidth="1" />
                   <circle cx={px} cy={py} r="5" fill="currentColor" opacity="0.5" />
                 </g>
               )
             })}
           </motion.g>
        </svg>

        {/* Base glow */}
        <motion.div 
           animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
           transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
           className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-r from-[#008400] to-[#F5CE00] rounded-[100%] blur-[150px] opacity-20" 
        />
      </div>

      <div className="z-10 max-w-2xl w-full space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-3"
        >
          <h1 className="text-5xl font-black italic tracking-tighter leading-none text-white drop-shadow-2xl">
            BI SEMANTIC<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#008400] via-[#10b981] to-[#F5CE00] pr-2">EXPLORER</span>
          </h1>
          <p className="text-sm text-[#B1B4B6] font-medium max-w-sm mx-auto">
            Upload your .pbip project to instantly generate a technical audit, relationship matrix, and dependency lineage.
          </p>
        </motion.div>

        {/* Connection Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-[#1A1C1D]/60 border border-white/10 rounded-[40px] shadow-[0_0_50px_rgba(0,132,0,0.1)] overflow-hidden backdrop-blur-3xl"
        >
          {/* Tab Switcher */}
          <div className="flex border-b border-white/5 p-1 bg-black/20">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 flex flex-col items-center gap-1.5 py-4 px-2 rounded-t-[32px] transition-all relative lowercase",
                  activeTab === tab.id ? "bg-white/5 text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <tab.icon size={18} className={activeTab === tab.id ? "text-primary" : "text-slate-500"} />
                <span className="text-[10px] font-black tracking-widest uppercase">{tab.label}</span>
                {activeTab === tab.id && (
                  <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/0 via-primary to-primary/0 shadow-[0_0_10px_rgba(0,132,0,0.8)]" />
                )}
              </button>
            ))}
          </div>

          <div className="p-8 min-h-[300px] flex flex-col">
            <AnimatePresence mode="wait">
              {activeTab === 'zip' && (
                <motion.div
                  key="zip"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6 flex-1 flex flex-col"
                >
                  <div 
                    {...getRootProps()} 
                    className={cn(
                      "flex-1 border-2 border-dashed rounded-[32px] flex flex-col items-center justify-center p-12 transition-all cursor-pointer group bg-black/20",
                      isDragActive ? "border-primary bg-primary/10 shadow-[0_0_30px_rgba(0,132,0,0.2)]" : "border-white/10 hover:border-primary/50 hover:bg-white/5",
                      isAnalyzing && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <input {...getInputProps()} />
                    <div className="w-20 h-20 rounded-3xl bg-secondary/30 flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(0,132,0,0.3)] transition-all mb-6">
                      {isAnalyzing ? <RefreshCw className="animate-spin" size={32} /> : <Upload size={36} />}
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-sm font-bold">{isAnalyzing ? "Analyzing Technical Logic..." : "Drop Project ZIP here"}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">or click to browse</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em] justify-center px-4 py-3 bg-black/40 rounded-xl border border-white/5">
                    <Shield size={12} className="text-primary" />
                    Session-Based • 100% Secure • Discarded after use
                  </div>
                </motion.div>
              )}

              {activeTab === 'git' && (
                <motion.div
                  key="git"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <form onSubmit={handleGitSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] uppercase font-black text-muted-foreground tracking-widest flex items-center gap-1.5 ml-1">
                        <LinkIcon size={10} /> Repository URL
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="https://github.com/org/pbi-project"
                        className="w-full bg-secondary/50 border border-border/50 rounded-2xl px-5 py-3.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-background transition-all"
                        value={gitConfig.repoUrl}
                        onChange={e => setGitConfig({ ...gitConfig, repoUrl: e.target.value })}
                        disabled={isAnalyzing}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase font-black text-muted-foreground tracking-widest flex items-center gap-1.5 ml-1">
                          <GitBranch size={10} /> Branch
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="main"
                          className="w-full bg-secondary/50 border border-border/50 rounded-2xl px-5 py-3.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-background transition-all"
                          value={gitConfig.branch}
                          onChange={e => setGitConfig({ ...gitConfig, branch: e.target.value })}
                          disabled={isAnalyzing}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase font-black text-muted-foreground tracking-widest flex items-center gap-1.5 ml-1">
                          <Lock size={10} /> ACCESS TOKEN (PAT)
                        </label>
                        <input
                          type="password"
                          required
                          placeholder="REQUIRED FOR SYNC"
                          className="w-full bg-secondary/50 border border-border/50 rounded-2xl px-5 py-3.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-background transition-all font-mono"
                          value={gitConfig.token}
                          onChange={e => setGitConfig({ ...gitConfig, token: e.target.value })}
                          disabled={isAnalyzing}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isAnalyzing || !gitConfig.repoUrl || !gitConfig.token}
                      className="w-full bg-primary text-primary-foreground py-4 rounded-2xl font-black italic tracking-widest uppercase text-sm hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2 shadow-xl shadow-primary/20"
                    >
                      {isAnalyzing ? (
                        <>
                          <RefreshCw className="animate-spin" size={18} />
                          CONNECTING & ANALYZING...
                        </>
                      ) : (
                        <>
                          <ArrowRight size={18} />
                          Initialize Git Sync
                        </>
                      )}
                    </button>
                  </form>
                  <p className="text-[9px] text-muted-foreground text-center italic">
                    All Git clones are session-based and deleted immediately after analysis.
                  </p>
                </motion.div>
              )}

            </AnimatePresence>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center text-red-500 flex-shrink-0">
                    <X size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Connection Failed</p>
                    <p className="text-xs text-red-400 capitalize truncate">{error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Footer info */}
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 0.4 }}
           className="flex items-center justify-center gap-8 grayscale opacity-40 hover:opacity-100 transition-opacity"
        >
          <div className="flex items-center gap-2">
            <Info size={14} className="text-primary" />
            <span className="text-[10px] font-bold uppercase">Technical Audit Mode</span>
          </div>
          <div className="flex items-center gap-2">
             <Search size={14} className="text-primary" />
             <span className="text-[10px] font-bold uppercase">DAX & Metadata Deep Scan</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
