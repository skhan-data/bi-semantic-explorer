import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, GitBranch, Shield, Lock, 
  ArrowRight, RefreshCw, X, Info,
  Search, Link as LinkIcon
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
    <div className="h-full min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Soft Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="z-10 max-w-2xl w-full space-y-10">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-white border border-border shadow-sm rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Upload size={28} className="text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
            BI Semantic Explorer
          </h1>
          <p className="text-base text-muted-foreground font-medium max-w-md mx-auto">
            Upload your Power BI project to instantly generate a technical audit, relationship matrix, and dependency lineage.
          </p>
        </div>

        {/* Connection Box */}
        <div className="bg-card border border-border/50 shadow-xl shadow-black/5 rounded-3xl overflow-hidden">
          {/* Tab Switcher */}
          <div className="flex p-2 bg-secondary/50 border-b border-border/50">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 px-2 transition-all rounded-xl",
                  activeTab === tab.id 
                    ? "bg-white text-foreground font-bold shadow-sm border border-border/50" 
                    : "text-muted-foreground hover:bg-black/5 hover:text-foreground font-medium border border-transparent"
                )}
              >
                <tab.icon size={16} className={activeTab === tab.id ? "text-primary" : "text-muted-foreground"} />
                <span className="text-sm">{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="p-8 sm:p-10 min-h-[340px] flex flex-col bg-white">
            <AnimatePresence mode="wait">
              {activeTab === 'zip' && (
                <motion.div
                  key="zip"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6 flex-1 flex flex-col"
                >
                  <div 
                    {...getRootProps()} 
                    className={cn(
                      "flex-1 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-12 transition-all cursor-pointer group bg-secondary/20",
                      isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/30 hover:bg-primary/5",
                      isAnalyzing && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <input {...getInputProps()} />
                    <div className="w-16 h-16 bg-white border border-border/50 shadow-sm rounded-xl flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all mb-4">
                      {isAnalyzing ? <RefreshCw className="animate-spin" size={24} /> : <Upload size={24} />}
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-base font-bold text-foreground">{isAnalyzing ? "Analyzing Technical Logic..." : "Drop Project ZIP here"}</p>
                      <p className="text-xs text-muted-foreground font-medium">or click to browse your files</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold justify-center px-4 py-3 bg-secondary/50 rounded-xl border border-border/50">
                    <Shield size={14} className="text-primary" />
                    Session-Based • 100% Secure • Discarded after use
                  </div>
                </motion.div>
              )}

              {activeTab === 'git' && (
                <motion.div
                  key="git"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <form onSubmit={handleGitSubmit} className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-foreground flex items-center gap-2">
                        <LinkIcon size={14} className="text-muted-foreground" /> Repository URL
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="https://github.com/org/pbi-project"
                        className="w-full bg-secondary/30 border border-border/80 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                        value={gitConfig.repoUrl}
                        onChange={e => setGitConfig({ ...gitConfig, repoUrl: e.target.value })}
                        disabled={isAnalyzing}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-foreground flex items-center gap-2">
                          <GitBranch size={14} className="text-muted-foreground" /> Branch
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="main"
                          className="w-full bg-secondary/30 border border-border/80 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                          value={gitConfig.branch}
                          onChange={e => setGitConfig({ ...gitConfig, branch: e.target.value })}
                          disabled={isAnalyzing}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-foreground flex items-center gap-2">
                          <Lock size={14} className="text-muted-foreground" /> Access Token (PAT)
                        </label>
                        <input
                          type="password"
                          required
                          placeholder="Required for Sync"
                          className="w-full bg-secondary/30 border border-border/80 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                          value={gitConfig.token}
                          onChange={e => setGitConfig({ ...gitConfig, token: e.target.value })}
                          disabled={isAnalyzing}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isAnalyzing || !gitConfig.repoUrl || !gitConfig.token}
                      className="w-full bg-primary text-primary-foreground rounded-xl py-3.5 font-bold text-sm hover:opacity-90 hover:-translate-y-0.5 shadow-lg shadow-primary/20 transition-all disabled:opacity-50 disabled:hover:opacity-50 disabled:hover:translate-y-0 flex items-center justify-center gap-2"
                    >
                      {isAnalyzing ? (
                        <>
                          <RefreshCw className="animate-spin" size={18} />
                          Connecting & Analyzing...
                        </>
                      ) : (
                        <>
                          <ArrowRight size={18} />
                          Initialize Git Sync
                        </>
                      )}
                    </button>
                  </form>
                  <p className="text-xs text-muted-foreground text-center font-medium">
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
                  className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3"
                >
                  <div className="text-red-600 flex-shrink-0 mt-0.5">
                    <X size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-red-800">Connection Failed</p>
                    <p className="text-sm text-red-600 mt-1">{error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-center gap-8 text-muted-foreground pt-4">
          <div className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity cursor-default">
            <Info size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">Technical Audit Mode</span>
          </div>
          <div className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity cursor-default">
             <Search size={16} />
             <span className="text-xs font-bold uppercase tracking-wider">DAX & Metadata Deep Scan</span>
          </div>
        </div>
      </div>
    </div>
  );
};
