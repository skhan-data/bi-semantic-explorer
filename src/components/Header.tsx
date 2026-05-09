import React from 'react';
import { Search, Settings, Upload, Code, Users, Sun, Moon } from 'lucide-react';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setShowLocalSetup: (show: boolean) => void;
  onImport: () => void;
  onDownloadHtml?: () => void;
  importLabel?: string;
  viewMode: 'simple' | 'technical';
  setViewMode: (mode: 'simple' | 'technical') => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

export const Header = ({
  searchQuery,
  setSearchQuery,
  setShowLocalSetup,
  onImport,
  onDownloadHtml,
  importLabel = "Export Technical Docs",
  viewMode,
  setViewMode,
  theme,
  setTheme,
}: HeaderProps) => {
  return (
    <header className="h-16 flex items-center justify-between px-8 bg-background/80 backdrop-blur-md z-10 sticky top-0 border-b border-border/50">
      <div className="flex-1 max-w-xl relative group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-foreground transition-colors" size={16} />
        <input
          type="text"
          placeholder="Search measures, tables, DAX..."
          className="w-full bg-secondary border border-border rounded-lg py-1.5 pl-9 pr-12 text-sm focus:outline-none focus:border-foreground/30 transition-all text-foreground"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-60">
          <kbd className="text-[10px] bg-background border border-border/50 px-1.5 py-0.5 rounded text-muted-foreground font-mono">⌘</kbd>
          <kbd className="text-[10px] bg-background border border-border/50 px-1.5 py-0.5 rounded text-muted-foreground font-mono">K</kbd>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Mode Toggle */}
        <div className="flex items-center p-1 bg-secondary border border-border rounded-lg gap-1">
          <button
            onClick={() => setViewMode('simple')}
            title="Simple View — plain English for non-technical users"
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all pressable ${
              viewMode === 'simple'
                ? 'bg-card border border-border shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users size={14} />
            Simple
          </button>
          <button
            onClick={() => setViewMode('technical')}
            title="Technical View — full developer tools"
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all pressable ${
              viewMode === 'technical'
                ? 'bg-card border border-border shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Code size={14} />
            Technical
          </button>
        </div>

        {onDownloadHtml && (
          <button
            onClick={() => onDownloadHtml?.()}
            className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-md transition-all pressable hover:bg-primary/90"
            title="Download Interactive HTML Audit"
          >
            <Upload size={14} />
            <span>{importLabel}</span>
          </button>
        )}

        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-1.5 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground pressable border border-transparent hover:border-border/50"
          title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <button
          onClick={() => setShowLocalSetup(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-secondary border border-border rounded-md text-xs font-medium hover:bg-secondary/80 transition-all text-muted-foreground hover:text-foreground pressable"
        >
          <Settings size={14} />
          <span>Setup</span>
        </button>
      </div>
    </header>
  );
};
