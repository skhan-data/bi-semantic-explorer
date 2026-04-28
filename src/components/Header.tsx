import React from 'react';
import { Search, Settings, Upload, Sun, Moon, Code, Users } from 'lucide-react';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setShowLocalSetup: (show: boolean) => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  onImport: () => void;
  onDownloadHtml?: () => void;
  importLabel?: string;
  viewMode: 'simple' | 'technical';
  setViewMode: (mode: 'simple' | 'technical') => void;
}

export const Header = ({
  searchQuery,
  setSearchQuery,
  setShowLocalSetup,
  isDarkMode,
  setIsDarkMode,
  onImport,
  onDownloadHtml,
  importLabel = "Download Audit",
  viewMode,
  setViewMode,
}: HeaderProps) => {
  return (
    <header className="h-16 border-b border-border flex items-center justify-between px-8 bg-card/30 backdrop-blur-md z-10 sticky top-0">
      <div className="flex-1 max-w-2xl relative group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
        <input
          type="text"
          placeholder="Search measures, tables, DAX..."
          className="w-full bg-secondary/50 border-border border rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <kbd className="text-[10px] bg-background border border-border px-1.5 py-0.5 rounded text-muted-foreground">⌘</kbd>
          <kbd className="text-[10px] bg-background border border-border px-1.5 py-0.5 rounded text-muted-foreground">K</kbd>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Mode Toggle */}
        <div className="flex items-center p-1 bg-secondary border border-border rounded-xl gap-1">
          <button
            onClick={() => setViewMode('simple')}
            title="Simple View — plain English for non-technical users"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'simple'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users size={13} />
            Simple
          </button>
          <button
            onClick={() => setViewMode('technical')}
            title="Technical View — full developer tools"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'technical'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Code size={13} />
            Technical
          </button>
        </div>
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          id="theme-toggle"
          className="p-2 bg-secondary border border-border rounded-xl text-muted-foreground hover:text-primary transition-all hover:scale-110 active:scale-95"
          title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>


        {onDownloadHtml && (
          <button
            onClick={() => onDownloadHtml?.()}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all text-sm font-medium"
            title="Download Interactive HTML Audit"
          >
            <Upload size={16} />
            <span>{importLabel}</span>
          </button>
        )}

        <button
          onClick={() => setShowLocalSetup(true)}
          className="flex items-center gap-2 px-4 py-2 bg-secondary border border-border rounded-xl text-sm font-medium hover:bg-secondary/80 transition-colors"
        >
          <Settings size={16} />
          <span>Setup</span>
        </button>
      </div>
    </header>
  );
};
