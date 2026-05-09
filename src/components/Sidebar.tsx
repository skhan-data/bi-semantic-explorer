import React from 'react';
import { 
  Database, Table as TableIcon, LayoutDashboard, GitBranch, 
  Settings, Globe, RefreshCw, Layers, Shield, GitCompare, Palette 
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
      "w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 group pressable",
      active
        ? "bg-secondary text-foreground font-medium"
        : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
    )}
  >
    <div className="flex items-center gap-3">
      <Icon size={16} className={cn(active ? "text-foreground" : "text-muted-foreground group-hover:text-foreground")} />
      <span className="text-sm">{label}</span>
      {badge && (
        <span className="text-[10px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded bg-primary/20 text-primary">
          {badge}
        </span>
      )}
    </div>
    {count !== undefined && (
      <span className={cn(
        "text-[10px] px-2 py-0.5 rounded-full font-mono",
        active ? "bg-white/10 text-foreground" : "bg-transparent text-muted-foreground group-hover:text-foreground"
      )}>
        {count}
      </span>
    )}
  </button>
);

interface SidebarProps {
  activeTab: 'overview' | 'explorer' | 'reports' | 'relationships' | 'cleanup' | 'themes' | 'compare';
  setActiveTab: (tab: 'overview' | 'explorer' | 'reports' | 'relationships' | 'cleanup' | 'themes' | 'compare') => void;
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
    <aside className="w-[260px] bg-background border-r border-border flex flex-col h-screen sticky top-0 z-20">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center text-background">
          <Database size={16} />
        </div>
        <div>
          <h1 className="font-semibold text-sm tracking-tight text-foreground">Semantic Explorer</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6 custom-scrollbar">
        <div className="space-y-1">
          <p className="px-3 text-xs font-medium text-muted-foreground mb-2">Workspace</p>
          <SidebarItem 
            icon={LayoutDashboard} 
            label={viewMode === 'simple' ? 'Summary' : 'Overview'}
            active={activeTab === 'overview'} 
            onClick={() => setActiveTab('overview')} 
            count={tableCount}
          />
          <SidebarItem 
            icon={TableIcon} 
            label={viewMode === 'simple' ? 'Browse Data' : 'Explorer'}
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
          <SidebarItem 
            icon={GitBranch} 
            label={viewMode === 'simple' ? 'Connections' : 'Relationships'}
            active={activeTab === 'relationships'} 
            onClick={() => setActiveTab('relationships')} 
          />

          {viewMode === 'technical' && (
            <SidebarItem 
              icon={GitCompare} 
              label="Compare" 
              active={activeTab === 'compare'} 
              onClick={() => setActiveTab('compare')} 
            />
          )}

          {viewMode === 'technical' && (
            <div className="pt-4 mt-4 border-t border-border/50 space-y-1">
              <p className="px-3 text-xs font-medium text-muted-foreground mb-2">Tools</p>
              <SidebarItem 
                icon={Database} 
                label="Spring Cleaning" 
                active={activeTab === 'cleanup'} 
                onClick={() => setActiveTab('cleanup')} 
              />
              <SidebarItem 
                icon={Palette} 
                label="Brand Theme" 
                active={activeTab === 'themes'} 
                onClick={() => setActiveTab('themes')} 
              />
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-border/50 space-y-4">
          <p className="px-3 text-xs font-medium text-muted-foreground mb-2">Environment</p>
          <div className="px-3 space-y-3">
            <div className="flex flex-col gap-2">
              <div className="relative group">
                <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                <input
                  type="text"
                  readOnly
                  placeholder="X:\MyProject"
                  className="w-full bg-secondary/50 border border-border rounded-md py-1.5 pl-8 pr-3 text-xs focus:outline-none transition-all truncate text-muted-foreground pointer-events-none"
                  value={projectPath}
                />
              </div>
            </div>
            {onReset && (
              <button
                onClick={onReset}
                className="w-full py-1.5 hover:bg-secondary text-muted-foreground hover:text-foreground rounded-md text-xs font-medium flex items-center gap-2 transition-all group pressable"
              >
                <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
                Disconnect
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-border mt-auto">
        <button
          onClick={() => setShowLocalSetup(true)}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-muted-foreground hover:bg-secondary hover:text-foreground pressable"
        >
          <Settings size={16} />
          <span className="text-sm font-medium">Settings</span>
        </button>
      </div>
    </aside>
  );
};
