import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, useMotionTemplate, useMotionValue } from 'motion/react';
import { 
  Upload, GitBranch, Shield, Lock, 
  ArrowRight, RefreshCw, X, Link as LinkIcon
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

// The "Spotlight Border Card" component from design-taste-frontend
function SpotlightCard({ children, className }: { children: React.ReactNode, className?: string }) {
  let mouseX = useMotionValue(0);
  let mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    let { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <div
      className={cn("group relative rounded-2xl bg-card border border-border overflow-hidden", className)}
      onMouseMove={handleMouseMove}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              650px circle at ${mouseX}px ${mouseY}px,
              rgba(255,255,255,0.06),
              transparent 80%
            )
          `,
        }}
      />
      {children}
    </div>
  );
}

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

  const tabs = [
    { id: 'zip', label: 'Local Project', icon: Upload },
    { id: 'git', label: 'Git Sync', icon: GitBranch },
  ] as const;

  return (
    <div className="h-full min-h-[100dvh] bg-background text-foreground flex items-center justify-center p-6 sm:p-12 relative overflow-hidden selection:bg-primary/20">
      
      {/* Vercel-style ambient background gradient */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center">
        <div className="absolute top-0 w-full h-[50vh] bg-gradient-to-b from-[oklch(0.18_0.02_285)] to-transparent opacity-50" />
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2, ease: "easeOut" }}
          className="absolute w-[800px] h-[400px] bg-[oklch(0.6_0.15_250)]/10 blur-[120px] rounded-full" 
        />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="z-10 w-full max-w-xl mx-auto"
      >
        {/* Header */}
        <div className="text-center space-y-6 mb-12">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 100, damping: 20 }}
            className="w-16 h-16 bg-card border border-border rounded-[1.25rem] flex items-center justify-center mx-auto shadow-2xl"
          >
            <Shield size={28} className="text-primary" />
          </motion.div>
          
          <div className="space-y-3">
            <h1 className="text-4xl sm:text-5xl font-medium tracking-tight text-foreground">
              Semantic Explorer
            </h1>
            <p className="text-lg text-muted-foreground font-light max-w-[45ch] mx-auto leading-relaxed">
              Drop your Power BI dataset to generate an instant, interactive audit architecture.
            </p>
          </div>
        </div>

        {/* Spotlight Hub Card */}
        <SpotlightCard className="shadow-2xl">
          <div className="flex border-b border-border/50">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex-1 relative py-4 flex items-center justify-center gap-2 text-sm transition-colors pressable"
              >
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute inset-0 bg-secondary/50 rounded-t-2xl"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <tab.icon size={16} className={cn("relative z-10", activeTab === tab.id ? "text-primary" : "text-muted-foreground")} />
                <span className={cn("relative z-10 font-medium", activeTab === tab.id ? "text-foreground" : "text-muted-foreground")}>
                  {tab.label}
                </span>
              </button>
            ))}
          </div>

          <div className="p-8 sm:p-10 min-h-[360px] flex flex-col relative z-10">
            <AnimatePresence mode="wait">
              {activeTab === 'zip' ? (
                <motion.div
                  key="zip"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="flex-1 flex flex-col h-full"
                >
                  <div 
                    {...getRootProps()} 
                    className={cn(
                      "flex-1 h-full rounded-xl border border-dashed flex flex-col items-center justify-center p-8 transition-all cursor-pointer group bg-secondary/20",
                      isDragActive ? "border-primary bg-primary/5 scale-[0.98]" : "border-border/60 hover:border-border hover:bg-secondary/40",
                      isAnalyzing && "opacity-50 pointer-events-none"
                    )}
                  >
                    <input {...getInputProps()} />
                    <motion.div 
                      className="w-14 h-14 bg-card border border-border rounded-xl flex items-center justify-center text-muted-foreground mb-6 shadow-sm"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {isAnalyzing ? <RefreshCw className="animate-spin text-primary" size={24} /> : <Upload size={24} className="group-hover:text-foreground transition-colors" />}
                    </motion.div>
                    <div className="text-center space-y-2">
                      <p className="text-base font-medium text-foreground">
                        {isAnalyzing ? "Extracting schema..." : "Drop .pbip or .bim"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        or click to browse local files
                      </p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="git"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="flex-1 flex flex-col h-full"
                >
                  <form onSubmit={handleGitSubmit} className="space-y-6 flex-1 flex flex-col">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        Repository URL
                      </label>
                      <div className="relative group">
                        <LinkIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-foreground" />
                        <input
                          type="text"
                          required
                          placeholder="https://github.com/org/dataset"
                          className="w-full bg-secondary/50 border border-border rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-mono"
                          value={gitConfig.repoUrl}
                          onChange={e => setGitConfig({ ...gitConfig, repoUrl: e.target.value })}
                          disabled={isAnalyzing}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Branch</label>
                        <input
                          type="text"
                          required
                          placeholder="main"
                          className="w-full bg-secondary/50 border border-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50 transition-all font-mono"
                          value={gitConfig.branch}
                          onChange={e => setGitConfig({ ...gitConfig, branch: e.target.value })}
                          disabled={isAnalyzing}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Access Token</label>
                        <div className="relative group">
                           <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-foreground" />
                           <input
                             type="password"
                             required
                             placeholder="ghp_..."
                             className="w-full bg-secondary/50 border border-border rounded-xl py-3 pl-9 pr-4 text-sm focus:outline-none focus:border-primary/50 transition-all font-mono"
                             value={gitConfig.token}
                             onChange={e => setGitConfig({ ...gitConfig, token: e.target.value })}
                             disabled={isAnalyzing}
                           />
                        </div>
                      </div>
                    </div>

                    <div className="mt-auto pt-4">
                      <button
                        type="submit"
                        disabled={isAnalyzing || !gitConfig.repoUrl || !gitConfig.token}
                        className="pressable w-full bg-primary text-primary-foreground rounded-xl py-4 font-semibold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-white"
                      >
                        {isAnalyzing ? (
                          <>
                            <RefreshCw className="animate-spin" size={16} />
                            Cloning Repository...
                          </>
                        ) : (
                          <>
                            Sync Architecture <ArrowRight size={16} />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: 10 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: 10 }}
                  className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 overflow-hidden"
                >
                  <div className="text-red-400 mt-0.5">
                    <X size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-red-400 font-medium leading-relaxed">{error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </SpotlightCard>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col items-center justify-center space-y-4 mt-8"
        >
          <button 
            onClick={() => {
              // Quick mock model to test the UI
              const mockModel = {
                name: "Example Model",
                tables: [
                  {
                    name: "Sales",
                    columns: [{ name: "Date", dataType: "DateTime" }, { name: "Amount", dataType: "Decimal" }],
                    measures: [{ name: "Total Sales", expression: "SUM(Sales[Amount])", isUsed: true }]
                  }
                ],
                relationships: []
              };
              // Pass the mock model using a tricky hack since we don't have the prop.
              // Wait, ConnectHub doesn't have a way to pass mock data except by calling onAnalyzeZip?
              // The original had an onDrop mock. But we can just dispatch a custom event.
              window.dispatchEvent(new CustomEvent('loadMockModel'));
            }}
            id="load-example-btn"
            className="text-xs font-semibold uppercase tracking-widest text-primary hover:text-foreground transition-colors pressable"
          >
            Load Example Model
          </button>
          <p className="text-center text-xs text-muted-foreground">
            Analysis occurs strictly in-memory. Zero data is persisted.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

