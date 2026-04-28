/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  Settings, X, Info, Code, Upload, RefreshCw,
  ChevronRight, ArrowRight, ArrowLeft, Sparkles, Database, Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useDropzone } from 'react-dropzone';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';

import { PBIModel, PBITable, PBIMeasure, PBIColumn, PBIReport } from './types';
import { cn } from './utils';

// Modular Components
import { Badge } from './components/Badge';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { OverviewDashboard } from './components/OverviewDashboard';
import { DetailsPanel } from './components/DetailsPanel';
import { ReportViewer } from './components/ReportViewer';
import { SemanticExplorerTree } from './components/SemanticExplorerTree';
import { BulkImpactModal } from './components/BulkImpactModal';
import { LineageGraph, ModelSchemaGraph } from './components/LineageGraphs';
import { ConnectHub } from './components/ConnectHub';
import { generateAuditHtml } from './utils/auditTemplate';
import { CommandPalette } from './components/CommandPalette';
import { ImpactAnalysis } from './components/ImpactAnalysis';
import { ModelDiff } from './components/ModelDiff';
import { RelationshipMatrix } from './components/RelationshipMatrix';
import { SimpleDashboard } from './components/SimpleDashboard';
import { SimpleExplorer } from './components/SimpleExplorer';


export default function App() {
  const [model, setModel] = useState<PBIModel>({ name: 'New Model', tables: [], relationships: [] });
  const [activeTab, setActiveTab] = useState<'overview' | 'explorer' | 'reports' | 'lineage' | 'compare'>('overview');
  const [explorerMode, setExplorerMode] = useState<'measures' | 'columns'>('measures');
  const [selectedItem, setSelectedItem] = useState<PBIMeasure | PBIColumn | null>(null);
  const [bulkSelection, setBulkSelection] = useState<any[]>([]);
  const [showBulkImpactModal, setShowBulkImpactModal] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [viewMode, setViewMode] = useState<'simple' | 'technical'>(
    () => (localStorage.getItem('biViewMode') as 'simple' | 'technical') || 'technical'
  );

  const handleSetViewMode = (mode: 'simple' | 'technical') => {
    localStorage.setItem('biViewMode', mode);
    setViewMode(mode);
    // If on a technical-only tab, redirect to overview
    if (mode === 'simple' && ['lineage', 'compare'].includes(activeTab)) {
      setActiveTab('overview');
    }
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [showAuditConfigModal, setShowAuditConfigModal] = useState(false);
  const [auditVersion, setAuditVersion] = useState('1.0.0');
  const [auditSummary, setAuditSummary] = useState('');

  useEffect(() => {
    // App mounted
  }, []);
  const [showLocalSetup, setShowLocalSetup] = useState(false);
  const [projectPath, setProjectPath] = useState('');
  const [isImported, setIsImported] = useState(false);
  const [activeReportPage, setActiveReportPage] = useState<string | null>(null);
  const [lineageMode, setLineageMode] = useState<'field' | 'schema' | 'matrix'>('field');
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [comparisonModel, setComparisonModel] = useState<PBIModel | null>(null);
  const [isAnalyzingComparison, setIsAnalyzingComparison] = useState(false);
  const [comparisonError, setComparisonError] = useState<string | null>(null);
  const [showImpactModal, setShowImpactModal] = useState(false);
  const [showUnusedOnly, setShowUnusedOnly] = useState(false);
  const [analyzingSource, setAnalyzingSource] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Ctrl+K command palette listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    Prism.highlightAll();
  }, [selectedItem, activeTab]);

  // --- Search & Filters ---
  const activeTables = useMemo(() => {
    return model?.tables || [];
  }, [model?.tables]);

  const allMeasures = useMemo(() => {
    return activeTables.flatMap(t => {
      const measures = t.measures || [];
      return measures.map(m => ({ ...m, tableName: t.name }));
    });
  }, [activeTables]);

  const filteredMeasures = useMemo(() => {
    let base = allMeasures;
    if (showUnusedOnly) {
      base = allMeasures.filter(m => m.isUsed === false);
    }
    if (!searchQuery) return base;
    const q = searchQuery.toLowerCase();
    return base.filter(m =>
      m.name.toLowerCase().includes(q) ||
      m.expression.toLowerCase().includes(q) ||
      m.tableName.toLowerCase().includes(q)
    );
  }, [allMeasures, searchQuery, showUnusedOnly]);

  const filteredTables = useMemo(() => {
    if (!searchQuery) return activeTables;
    const q = searchQuery.toLowerCase();
    return activeTables.filter(t =>
      t.name.toLowerCase().includes(q) ||
      (t as any).description?.toLowerCase().includes(q) ||
      t.measures.some(m =>
        m.name.toLowerCase().includes(q) ||
        m.expression.toLowerCase().includes(q)
      ) ||
      t.columns.some(c =>
        c.name.toLowerCase().includes(q)
      )
    );
  }, [activeTables, searchQuery]);

  const allColumns = useMemo(() => {
    return activeTables.flatMap(t => {
      const columns = t.columns || [];
      return columns.map(c => ({ ...c, tableName: t.name, isColumn: true }));
    });
  }, [activeTables]);

  const filteredColumns = useMemo(() => {
    if (!searchQuery) return allColumns;
    const q = searchQuery.toLowerCase();
    return allColumns.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.tableName.toLowerCase().includes(q)
    );
  }, [allColumns, searchQuery]);

  const handleSetSelectedItem = useCallback((item: any) => {
    if (item && item.isTable) {
      const table = model.tables.find(t => t.name === item.name);
      if (table) {
        setSelectedItem(table as any);
        return;
      }
    }
    setSelectedItem(item);
  }, [model.tables]);

  // --- Multi-Source Analysis Handlers ---
  const handleAnalyzeZip = async (file: File) => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalyzingSource(file.name);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/analyze/zip', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || errData.error || "Zip analysis failed");
      }

      const data = await response.json();
      setModel(data);
      setIsImported(true);
      if (data.tables?.[0]) setSelectedItem(data.tables[0]);
    } catch (err: any) {
      setAnalysisError(err.message || "Failed to process ZIP. Ensure it contains a valid .pbip or .bim structure.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyzeGit = async (config: { repoUrl: string; branch: string; token: string }) => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalyzingSource(`${config.repoUrl} (${config.branch})`);

    try {
      const response = await fetch('/api/analyze/git', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || errData.error || "Git sync failed");
      }

      const data = await response.json();
      setModel(data);
      setIsImported(true);
      if (data.tables?.[0]) setSelectedItem(data.tables[0]);
    } catch (err: any) {
      setAnalysisError(err.message || "Failed to clone repository. Verify the URL and PAT (Personal Access Token).");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyzeComparisonZip = async (file: File) => {
    setIsAnalyzingComparison(true);
    setComparisonError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/analyze/zip', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || errData.error || "Zip analysis failed");
      }

      const data = await response.json();
      setComparisonModel(data);
    } catch (err: any) {
      setComparisonError(err.message || "Failed to process ZIP comparison.");
    } finally {
      setIsAnalyzingComparison(false);
    }
  };

  const handleAnalyzeComparisonGit = async (config: { repoUrl: string; branch: string; token: string }) => {
    setIsAnalyzingComparison(true);
    setComparisonError(null);

    try {
      const response = await fetch('/api/analyze/git', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || errData.error || "Git comparison sync failed");
      }

      const data = await response.json();
      setComparisonModel(data);
    } catch (err: any) {
      setComparisonError(err.message || "Failed to clone repository for comparison.");
    } finally {
      setIsAnalyzingComparison(false);
    }
  };



  const sanitizeFilename = (name: string) => {
    // Remove extensions, dots, and non-alphanumeric chars
    const baseName = name.split('.')[0] || 'audit';
    return baseName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  };

  const handleDownloadHtml = () => {
    setShowAuditConfigModal(true);
  };

  const confirmDownloadHtml = () => {
    if (!model) return;
    const htmlContent = generateAuditHtml(model, {
      summary: auditSummary,
      version: auditVersion
    });
    
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    const safeName = sanitizeFilename(model.name);
    a.download = `PowerBI_Audit_${safeName}_v${auditVersion}_${new Date().toISOString().split('T')[0]}.html`;

    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setShowAuditConfigModal(false);
    }, 250);
  };


  const handleResetSession = () => {
    setModel({ name: 'New Model', tables: [], relationships: [] });
    setIsImported(false);
    setSelectedItem(null);
    setAnalyzingSource(null);
    setAnalysisError(null);
    setActiveTab('tables');
  };



  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        setModel(data);
        setActiveTab('tables');
      } catch (e) {
        alert("Invalid project file format.");
      }
    };
    reader.readAsText(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true,
    accept: { 'application/json': ['.json'] }
  } as any);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30 selection:text-foreground flex overflow-hidden dark" {...getRootProps()}>
      <input {...getInputProps()} />

      <AnimatePresence>
        {showAuditConfigModal && (
          <div className="fixed inset-0 z-[200] bg-background/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-3xl p-8 max-w-lg w-full shadow-2xl space-y-6"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <Sparkles size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black italic tracking-tighter">FINALIZE AUDIT</h2>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Metadata & Documentation</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Audit Version</label>
                  <input
                    type="text"
                    className="w-full bg-secondary/50 border-border border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary transition-all font-mono text-foreground"
                    value={auditVersion}
                    onChange={(e) => setAuditVersion(e.target.value)}
                    placeholder="e.g. 1.0.0"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Executive Summary (Optional)</label>
                  <textarea
                    className="w-full bg-secondary/50 border-border border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary transition-all min-h-[120px] resize-none text-foreground"
                    value={auditSummary}
                    onChange={(e) => setAuditSummary(e.target.value)}
                    placeholder="Add a high-level overview of findings for management..."
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowAuditConfigModal(false)}
                  className="flex-1 px-4 py-3 bg-secondary border border-border rounded-xl text-sm font-bold hover:bg-secondary/80 transition-all text-muted-foreground"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDownloadHtml}
                  className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <Upload size={16} />
                  <span>Generate Audit</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {!isImported ? (
          <motion.div
            key="connect"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="w-full h-full"
          >
            <ConnectHub
              onAnalyzeZip={handleAnalyzeZip}
              onAnalyzeGit={handleAnalyzeGit}
              isAnalyzing={isAnalyzing}
              error={analysisError}
            />
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-1 overflow-hidden w-full h-full"
          >
            <Sidebar
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              tableCount={activeTables.length}
              explorerCount={allMeasures.length + allColumns.length}
              reportCount={model.reports?.length || 0}
              projectPath={analyzingSource || 'Disconnected'}
              setProjectPath={() => { }}
              isSyncing={isAnalyzing}
              handleSync={() => { }}
              setShowLocalSetup={setShowLocalSetup}
              onReset={handleResetSession}
              viewMode={viewMode}
            />

            <AnimatePresence>
              {showLocalSetup && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[110] bg-background/80 backdrop-blur-md flex items-center justify-center p-4"
                >
                  <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className="bg-card border border-border rounded-3xl p-8 max-w-xl w-full shadow-2xl space-y-8"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                          <Settings size={24} />
                        </div>
                        <div>
                          <h2 className="text-2xl font-black italic tracking-tighter">SETTINGS</h2>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Configure your experience</p>
                        </div>
                      </div>
                      <button onClick={() => setShowLocalSetup(false)} className="p-2 hover:bg-secondary rounded-full transition-colors text-muted-foreground hover:text-foreground">
                        <X size={20} />
                      </button>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-4">
                        <h3 className="text-sm font-bold flex items-center gap-2">
                          <Database size={16} className="text-primary" />
                          Model Synchronization
                        </h3>

                        {analyzingSource && (
                          <div className="p-3 bg-secondary/50 rounded-xl border border-primary/20 space-y-1">
                            <label className="text-[9px] uppercase font-bold text-primary tracking-widest">Active Source</label>
                            <p className="text-[11px] font-mono text-foreground truncate">{analyzingSource}</p>
                          </div>
                        )}

                        <div className="space-y-2">
                          <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Manual Sync / Local Path</label>
                          <div className="relative group">
                            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={14} />
                            <input
                              type="text"
                              placeholder="e.g. X:\MyPowerBIProject"
                              className="w-full bg-secondary/50 border-border border rounded-xl py-3 pl-10 pr-4 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                              value={projectPath}
                              onChange={(e) => setProjectPath(e.target.value)}
                            />
                          </div>
                          <p className="text-[9px] text-muted-foreground italic">Update this only if you want to sync from a local drive.</p>
                        </div>
                      </div>

                    </div>

                    <div className="pt-4 text-center">
                      <p className="text-[10px] text-muted-foreground italic mb-4">Branding is currently locked to system default (Emerald).</p>
                      <button
                        onClick={() => setShowLocalSetup(false)}
                        className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-black text-sm shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest"
                      >
                        Save & Close
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {isDragActive && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[200] bg-primary/20 backdrop-blur-xl flex items-center justify-center p-8 border-4 border-dashed border-primary"
                >
                  <div className="text-center space-y-4">
                    <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center mx-auto text-primary-foreground shadow-2xl">
                      <Upload size={48} />
                    </div>
                    <h2 className="text-4xl font-black">Drop to Import Project</h2>
                    <p className="text-xl font-medium opacity-60">Instantly browse your semantic model.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <main className="flex-1 flex flex-col min-w-0 bg-background relative">
              <Header
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                setShowLocalSetup={setShowLocalSetup}
                isDarkMode={isDarkMode}
                setIsDarkMode={setIsDarkMode}
                onImport={handleResetSession}
                onDownloadHtml={handleDownloadHtml}
                viewMode={viewMode}
                setViewMode={handleSetViewMode}
              />

              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative">
                {activeTab === 'overview' && (
                  viewMode === 'simple' ? (
                    <SimpleDashboard
                      model={model}
                      onBrowse={() => setActiveTab('explorer')}
                    />
                  ) : (
                    <OverviewDashboard
                      model={model}
                      onNavigateToExplorer={() => setActiveTab('explorer')}
                    />
                  )
                )}

                {activeTab === 'explorer' && (
                  viewMode === 'simple' ? (
                    <SimpleExplorer
                      model={model}
                      selectedItem={selectedItem}
                      setSelectedItem={handleSetSelectedItem}
                      onShowImpact={() => setShowImpactModal(true)}
                    />
                  ) : (
                    <div className="flex h-full -m-8">
                      <SemanticExplorerTree
                        model={model}
                        selectedItem={selectedItem}
                        setSelectedItem={handleSetSelectedItem}
                        bulkSelection={bulkSelection}
                        setBulkSelection={setBulkSelection}
                      />
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <DetailsPanel
                          selectedItem={selectedItem}
                          onShowImpact={() => setShowImpactModal(true)}
                          model={model}
                        />
                      </div>
                    </div>
                  )
                )}

                {activeTab === 'reports' && (
                  <ReportViewer
                    reports={model.reports || []}
                    activeReportPage={activeReportPage}
                    setActiveReportPage={setActiveReportPage}
                  />
                )}

                {activeTab === 'lineage' && (
                  <div className="h-full bg-card/30 rounded-3xl border border-border p-6 flex flex-col gap-6 relative min-h-[600px]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 p-1 bg-secondary rounded-xl">
                        <button
                          onClick={() => setLineageMode('field')}
                          className={cn(
                            "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                            lineageMode === 'field' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          Field Lineage
                        </button>
                        <button
                          onClick={() => setLineageMode('schema')}
                          className={cn(
                            "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                            lineageMode === 'schema' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          Model Schema
                        </button>
                        <button
                          onClick={() => setLineageMode('matrix')}
                          className={cn(
                            "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                            lineageMode === 'matrix' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          Relationship Matrix
                        </button>
                      </div>
                      <div className="text-[10px] text-muted-foreground uppercase font-black tracking-widest flex items-center gap-2">
                        <Info size={12} />
                        {lineageMode === 'matrix' ? '' : 'Drag to explore • Scroll to zoom'}
                      </div>
                    </div>

                    <div className="flex-1 bg-secondary/20 rounded-2xl overflow-hidden border border-border/50 relative">
                      {lineageMode === 'field' ? (
                        <LineageGraph model={model} full={true} />
                      ) : lineageMode === 'schema' ? (
                        <ModelSchemaGraph model={model} />
                      ) : (
                        <div className="p-4 overflow-auto h-full">
                          <RelationshipMatrix model={model} />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'compare' && (
                  <div className="h-full">
                    {!comparisonModel ? (
                      <div className="h-full flex flex-col items-center justify-center pt-8">
                        <div className="max-w-2xl w-full border border-border rounded-[40px] overflow-hidden backdrop-blur-xl bg-card">
                          <ConnectHub 
                            onAnalyzeZip={handleAnalyzeComparisonZip}
                            onAnalyzeGit={handleAnalyzeComparisonGit}
                            isAnalyzing={isAnalyzingComparison}
                            error={comparisonError}
                          />
                        </div>
                      </div>
                    ) : (
                      <ModelDiff 
                        currentModel={model}
                        comparisonModel={comparisonModel}
                        onClearComparison={() => setComparisonModel(null)}
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Bulk Action Bar */}
              {bulkSelection.length > 0 && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-card/80 backdrop-blur-xl border border-border shadow-2xl rounded-full px-6 py-3 flex items-center gap-6 z-50">
                  <div className="flex items-center gap-3">
                     <span className="w-8 h-8 flex items-center justify-center rounded-full bg-orange-500/20 text-orange-500 text-sm font-black">{bulkSelection.length}</span>
                     <span className="text-sm font-bold text-foreground">Items Selected</span>
                  </div>
                  <button
                     onClick={() => setShowBulkImpactModal(true)}
                     className="px-6 py-2 bg-orange-500 text-white font-black text-xs uppercase tracking-widest rounded-full shadow-[0_0_20px_rgba(249,115,22,0.4)] hover:bg-orange-600 transition-colors"
                  >
                    Analyze Bulk Impact
                  </button>
                  <button
                     onClick={() => setBulkSelection([])}
                     className="text-[10px] text-muted-foreground hover:text-foreground uppercase font-black tracking-widest"
                  >
                    Clear All
                  </button>
                </div>
              )}
            </main>

            {/* Command Palette */}
            <CommandPalette
              isOpen={showCommandPalette}
              onClose={() => setShowCommandPalette(false)}
              model={model}
              onNavigate={(tab) => setActiveTab(tab as any)}
              onSelectItem={handleSetSelectedItem}
              isDarkMode={isDarkMode}
              setIsDarkMode={setIsDarkMode}
            />


            {/* Bulk Impact Modal */}
            <AnimatePresence>
              {showBulkImpactModal && (
                <BulkImpactModal
                  selectedItems={bulkSelection}
                  model={model}
                  onClose={() => setShowBulkImpactModal(false)}
                  onClearSelection={() => {
                    setBulkSelection([]);
                    setShowBulkImpactModal(false);
                  }}
                />
              )}
            </AnimatePresence>

            {/* Impact Analysis */}
            <AnimatePresence>
              {showImpactModal && selectedItem && 'tableName' in selectedItem && (
                <ImpactAnalysis
                  item={selectedItem as any}
                  model={model}
                  onClose={() => setShowImpactModal(false)}
                  onSelectItem={(item) => {
                    handleSetSelectedItem(item);
                    setShowImpactModal(false);
                  }}
                />
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
