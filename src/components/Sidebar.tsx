import React from 'react';
import { 
  Database, Table as TableIcon, LayoutDashboard, GitBranch, 
  Settings, Globe, RefreshCw, Layers, Shield, GitCompare 
} from 'lucide-react';
import { cn } from '../utils';

interface SidebarItemProps {
  icon: any;
  label: string;
  active?: boolean;
  onClick: () => void;
  count?: number;
  badge?: string;
}

const SidebarItem = ({ icon: Icon, label, active, onClick, count, badge }: SidebarItemProps) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 group",
      active
        ? "bg-primary/10 text-primary font-medium"
        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
    )}
  >
    <div className="flex items-center gap-3">
      <Icon size={18} className={cn(active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
      <span className="text-sm">{label}</span>
      {badge && (
        <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
          {badge}
        </span>
      )}
    </div>
    {count !== undefined && (
      <span className={cn(
        "text-[10px] px-1.5 py-0.5 rounded-full border",
        active ? "bg-primary/20 border-primary/30 text-primary" : "bg-secondary border-border text-muted-foreground"
      )}>
        {count}
      </span>
    )}
  </button>
);

interface SidebarProps {
  activeTab: 'overview' | 'explorer' | 'reports' | 'lineage' | 'compare';
  setActiveTab: (tab: 'overview' | 'explorer' | 'reports' | 'lineage' | 'compare') => void;
  tableCount: number;
  explorerCount: number;
  reportCount: number;
  projectPath: string;
  setProjectPath: (path: string) => void;
  isSyncing: boolean;
  handleSync: () => void;
  setShowLocalSetup: (show: boolean) => void;
  onReset?: () => void;
  viewMode: 'simple' | 'technical';
}

export const Sidebar = ({
  activeTab,
  setActiveTab,
  tableCount,
  explorerCount,
  reportCount,
  projectPath,
  setProjectPath,
  isSyncing,
  handleSync,
  setShowLocalSetup,
  onReset,
  viewMode,
}: SidebarProps) => {
  return (
    <aside className="w-72 bg-card border-r border-border flex flex-col h-screen sticky top-0">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
          <Database size={22} />
        </div>
        <div>
          <h1 className="font-black text-lg tracking-tight leading-none text-white">BI Semantic Explorer</h1>
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-1">Semantic Model Intelligence</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        <div className="space-y-1">
          <p className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Navigation</p>
          <SidebarItem 
            icon={LayoutDashboard} 
            label={viewMode === 'simple' ? 'Summary' : 'Overview'}
            active={activeTab === 'overview'} 
            onClick={() => setActiveTab('overview')} 
            count={tableCount}
          />
          <SidebarItem 
            icon={TableIcon} 
            label={viewMode === 'simple' ? 'Browse Data' : 'Semantic Explorer'}
            active={activeTab === 'explorer'} 
            onClick={() => setActiveTab('explorer')} 
            count={explorerCount}
          />
          <SidebarItem 
            icon={Layers} 
            label={viewMode === 'simple' ? 'Report Pages' : 'Reports'}
            active={activeTab === 'reports'} 
            onClick={() => setActiveTab('reports')} 
            count={reportCount}
          />
          {viewMode === 'technical' && (
            <SidebarItem 
              icon={GitBranch} 
              label="Lineage" 
              active={activeTab === 'lineage'} 
              onClick={() => setActiveTab('lineage')} 
            />
          )}
          {viewMode === 'technical' && (
            <SidebarItem 
              icon={GitCompare} 
              label="Compare" 
              active={activeTab === 'compare'} 
              onClick={() => setActiveTab('compare')} 
            />
          )}
        </div>

        <div className="pt-4 border-t border-border space-y-4">
          <p className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Active Source</p>
          <div className="px-3 space-y-3">
            <div className="flex flex-col gap-2">
              <div className="relative group">
                <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={14} />
                <input
                  type="text"
                  readOnly
                  placeholder="X:\MyProject"
                  className="w-full bg-secondary/50 border-border border rounded-lg py-2 pl-9 pr-3 text-[10px] focus:outline-none transition-all truncate text-muted-foreground pointer-events-none"
                  value={projectPath}
                />
              </div>
            </div>
            {onReset && (
              <button
                onClick={onReset}
                className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all group border border-red-500/20"
              >
                <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
                Reset session
              </button>
            )}
          </div>
        </div>

        {/* Settings/System Section */}
        <div className="pt-4 border-t border-border space-y-1">
          <p className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Settings</p>
          <button
            onClick={() => setShowLocalSetup(true)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <Settings size={18} />
            <span className="text-sm">Application Settings</span>
          </button>
        </div>
      </div>

      <div className="p-4 border-t border-border bg-secondary/30">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            SESSION MODE
          </span>
          <span className="font-mono text-[10px]">v1.2.0</span>
        </div>
      </div>
    </aside>
  );
};
