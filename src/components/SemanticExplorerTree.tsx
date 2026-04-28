import React, { useMemo, useState, useEffect } from 'react';
import { 
  Database, Table as TableIcon, Zap, Hash, Layers, 
  ChevronRight, ChevronDown, Search, Folder, CheckSquare, Square
} from 'lucide-react';
import { PBIModel, PBITable, PBIMeasure, PBIColumn } from '../types';
import { cn } from '../utils';

interface SemanticExplorerProps {
  model: PBIModel;
  selectedItem: ((PBIMeasure & { tableName: string }) | (PBIColumn & { tableName: string })) | null;
  setSelectedItem: (item: any) => void;
  bulkSelection?: any[];
  setBulkSelection?: (items: any[]) => void;
}

const getDomainName = (tableName: string) => {
  const lower = tableName.toLowerCase();
  if (lower.startsWith('fact')) return 'Actionable Facts';
  if (lower.startsWith('dim')) return 'Business Dimensions';
  if (lower.includes('date') || lower.includes('time') || lower.includes('calendar')) return 'Time Intelligence';
  if (lower.includes('measure') || lower.includes('calc') || lower.includes('metric') || lower.includes('parameter')) return 'System Metrics';
  
  const words = tableName.split(/[\s_]/);
  const firstWord = words[0].replace(/[^a-zA-Z]/g, '');
  if (firstWord.length > 2) {
    return firstWord.charAt(0).toUpperCase() + firstWord.slice(1) + ' Data';
  }
  return 'General Model';
};

export const SemanticExplorerTree = ({ model, selectedItem, setSelectedItem, bulkSelection = [], setBulkSelection }: SemanticExplorerProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedDomains, setExpandedDomains] = useState<Record<string, boolean>>({});
  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({});
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  const toggleDomain = (name: string) => setExpandedDomains(p => ({ ...p, [name]: !p[name] }));
  const toggleTable = (name: string) => setExpandedTables(p => ({ ...p, [name]: !p[name] }));
  const toggleFolder = (name: string) => setExpandedFolders(p => ({ ...p, [name]: !p[name] }));

  const toggleBulkSelect = (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    if (!setBulkSelection) return;
    const exists = bulkSelection.some(b => b.name === item.name && b.tableName === item.tableName);
    if (exists) {
      setBulkSelection(bulkSelection.filter(b => !(b.name === item.name && b.tableName === item.tableName)));
    } else {
      setBulkSelection([...bulkSelection, item]);
    }
  };

  // Structure: Domains -> Tables -> Folders -> Items (Measures + Columns)
  const tree = useMemo(() => {
    const dMap = new Map<string, PBITable[]>();
    
    model.tables.forEach(t => {
      const dName = getDomainName(t.name);
      if (!dMap.has(dName)) dMap.set(dName, []);
      dMap.get(dName)!.push(t);
    });

    const filterItem = (i: PBIMeasure | PBIColumn) => i.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    return Array.from(dMap.entries()).map(([domainName, rawTables]) => {
      const tables = rawTables.map(t => {
        const m = t.measures.filter(filterItem).map(m => ({ ...m, tableName: t.name, _type: 'measure' as const }));
        const c = t.columns.filter(filterItem).map(c => ({ ...c, tableName: t.name, _type: 'column' as const }));
        const allItems = [...m, ...c];
        
        const folders: Record<string, typeof allItems> = {};
        const rootItems: typeof allItems = [];
        
        allItems.forEach(item => {
          const folder = item.displayFolder;
          if (folder) {
            if (!folders[folder]) folders[folder] = [];
            folders[folder].push(item);
          } else {
            rootItems.push(item);
          }
        });
        
        return { name: t.name, table: t, folders, rootItems, totalMatch: allItems.length };
      }).filter(t => searchTerm === '' || t.totalMatch > 0 || t.name.toLowerCase().includes(searchTerm.toLowerCase()));
      
      return { domainName, tables };
    }).filter(d => d.tables.length > 0);
  }, [model, searchTerm]);

  // Auto-expand if searching
  useEffect(() => {
    if (searchTerm.length > 1) {
      const dExp: Record<string, boolean> = {};
      const tExp: Record<string, boolean> = {};
      const fExp: Record<string, boolean> = {};
      tree.forEach(d => {
        dExp[d.domainName] = true;
        d.tables.forEach(t => {
          tExp[t.name] = true;
          Object.keys(t.folders).forEach(f => {
            fExp[`${t.name}-${f}`] = true;
          });
        });
      });
      setExpandedDomains(dExp);
      setExpandedTables(tExp);
      setExpandedFolders(fExp);
    }
  }, [searchTerm, tree]);

  // Initial expand
  useEffect(() => {
    if (Object.keys(expandedDomains).length === 0 && tree.length > 0 && !searchTerm) {
      setExpandedDomains({ [tree[0].domainName]: true });
    }
  }, [tree]);

  return (
    <div className="w-80 bg-card/60 border-r border-border flex flex-col h-full flex-shrink-0">
      <div className="p-4 border-b border-border space-y-4">
        <h3 className="font-black text-xs tracking-widest uppercase text-muted-foreground">Model Structure</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
          <input
            type="text"
            placeholder="Search all fields..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-secondary border border-border rounded-xl py-2 pl-9 pr-3 text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto px-2 py-4 custom-scrollbar">
        {tree.length === 0 && (
          <div className="text-center p-6 mt-10">
            <Search className="mx-auto text-muted-foreground mb-4 opacity-50" size={32} />
            <p className="text-sm font-bold opacity-50">No results found.</p>
          </div>
        )}

        {tree.map(domain => (
          <div key={domain.domainName} className="mb-2">
            <button
              onClick={() => toggleDomain(domain.domainName)}
              className="w-full flex items-center gap-2 p-2 hover:bg-secondary rounded-xl transition-colors group"
            >
              {expandedDomains[domain.domainName] ? <ChevronDown size={14} className="text-primary" /> : <ChevronRight size={14} className="text-muted-foreground" />}
              <Layers size={14} className="text-primary" />
              <span className="font-bold text-sm tracking-tight">{domain.domainName}</span>
              <span className="ml-auto text-[10px] text-muted-foreground font-black px-1.5 py-0.5 bg-secondary rounded-md">{domain.tables.length}</span>
            </button>
            
            {expandedDomains[domain.domainName] && (
              <div className="ml-4 pl-3 border-l border-border/50 mt-1 space-y-1">
                {domain.tables.map(table => (
                  <div key={table.name}>
                    <button
                      onClick={() => toggleTable(table.name)}
                      className="w-full flex items-center gap-2 p-1.5 hover:bg-secondary rounded-lg transition-colors group"
                    >
                      {expandedTables[table.name] ? <ChevronDown size={12} className="text-primary" /> : <ChevronRight size={12} className="text-muted-foreground" />}
                      <TableIcon size={14} className="text-primary/70" />
                      <span className="font-bold text-xs">{table.name}</span>
                    </button>
                    
                    {expandedTables[table.name] && (
                      <div className="ml-4 pl-3 border-l border-border/50 mt-1 space-y-0.5">
                        {/* Folders */}
                        {Object.entries(table.folders).map(([folderName, items]) => {
                           const fKey = `${table.name}-${folderName}`;
                           return (
                             <div key={folderName}>
                                <button
                                  onClick={() => toggleFolder(fKey)}
                                  className="w-full flex items-center gap-2 p-1.5 hover:bg-secondary rounded-lg transition-colors group"
                                >
                                  {expandedFolders[fKey] ? <ChevronDown size={12} className="text-primary/70" /> : <ChevronRight size={12} className="text-muted-foreground" />}
                                  <Folder size={12} className="text-amber-500" />
                                  <span className="font-bold text-[11px] text-muted-foreground">{folderName.split('\\').pop() || folderName}</span>
                                </button>
                                {expandedFolders[fKey] && (
                                  <div className="ml-5 pl-2 border-l border-border/30 mt-1 space-y-0.5 pb-1">
                                    {(items as any[]).map((item: any) => {
                                       const isSelected = selectedItem?.name === item.name && selectedItem?.tableName === item.tableName;
                                       const isBulkSelected = bulkSelection.some(b => b.name === item.name && b.tableName === item.tableName);
                                       return (
                                         <div key={item.name} className={cn(
                                             "w-full flex items-stretch gap-1 p-1 rounded-lg transition-all",
                                             isSelected ? "bg-primary/10 shadow-sm" : "hover:bg-secondary/50"
                                         )}>
                                           {setBulkSelection && (
                                              <button 
                                                onClick={(e) => toggleBulkSelect(e, item)}
                                                className="p-1.5 flex-[0_0_auto] text-muted-foreground hover:text-orange-500 transition-colors rounded hover:bg-orange-500/10"
                                              >
                                                {isBulkSelected ? <CheckSquare size={14} className="text-orange-500" /> : <Square size={14} />}
                                              </button>
                                           )}
                                           <button
                                             onClick={() => setSelectedItem(item)}
                                             className={cn(
                                               "flex-1 flex items-center gap-2 p-1.5 rounded-md transition-all text-left",
                                               isSelected ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
                                             )}
                                           >
                                             {item._type === 'measure' ? <Zap size={12} className={isSelected ? "text-primary" : "text-blue-500/70"} /> : <Hash size={12} className={isSelected ? "text-primary" : "text-orange-500/70"} />}
                                             <span className="text-[11px] truncate">{item.name}</span>
                                           </button>
                                         </div>
                                       )
                                    })}
                                  </div>
                                )}
                             </div>
                           )
                        })}
                        
                        {/* Root Items */}
                        {table.rootItems.map((item: any) => {
                          const isSelected = selectedItem?.name === item.name && selectedItem?.tableName === item.tableName;
                          const isBulkSelected = bulkSelection.some(b => b.name === item.name && b.tableName === item.tableName);
                          return (
                            <div key={item.name} className={cn(
                                "w-full flex items-stretch gap-1 p-1 rounded-lg transition-all",
                                isSelected ? "bg-primary/10 shadow-sm" : "hover:bg-secondary/50"
                            )}>
                              {setBulkSelection && (
                                <button 
                                  onClick={(e) => toggleBulkSelect(e, item)}
                                  className="p-1.5 flex-[0_0_auto] text-muted-foreground hover:text-orange-500 transition-colors rounded hover:bg-orange-500/10"
                                >
                                  {isBulkSelected ? <CheckSquare size={14} className="text-orange-500" /> : <Square size={14} />}
                                </button>
                              )}
                              <button
                                onClick={() => setSelectedItem(item)}
                                className={cn(
                                  "flex-1 flex items-center gap-2 p-1.5 rounded-md transition-all text-left",
                                  isSelected ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
                                )}
                              >
                                {item._type === 'measure' ? <Zap size={12} className={isSelected ? "text-primary" : "text-blue-500/70"} /> : <Hash size={12} className={isSelected ? "text-primary" : "text-orange-500/70"} />}
                                <span className="text-[11px] truncate flex-1">{item.name}</span>
                                {item.isHidden && <span className="opacity-50 text-[8px] bg-secondary px-1 rounded">H</span>}
                              </button>
                            </div>
                          )
                        })}
                        
                        {table.rootItems.length === 0 && Object.keys(table.folders).length === 0 && (
                          <div className="p-2 text-[10px] text-muted-foreground italic">No matches</div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
