import React from 'react';
import { PBIModel } from '../types';
import { Palette, Droplet, Type, Download } from 'lucide-react';

interface ThemeBrandingProps {
  model: PBIModel;
}

export const ThemeBrandingExtractor = ({ model }: ThemeBrandingProps) => {
  const themes = model.themes || [];

  const handleDownloadJson = (theme: any) => {
    // Fallback to the parsed subset if raw is not available
    const themeJson = theme.raw || {
      name: theme.name,
      dataColors: theme.dataColors,
      background: theme.background,
      foreground: theme.foreground,
      tableAccent: theme.tableAccent,
      textClasses: theme.textClasses
    };
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(themeJson, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${theme.name || 'PowerBI_Theme'}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="h-full bg-card border border-border flex flex-col">
      <div className="p-8 border-b border-border bg-secondary/20">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <Palette className="text-primary" size={32} />
              Theme & Branding
            </h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
              Extracted corporate branding guidelines, color palettes, and visual defaults from the embedded report themes.
            </p>
          </div>
          <div className="bg-background border border-border p-4 text-center">
            <div className="text-4xl font-black text-primary">{themes.length}</div>
            <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mt-1">Themes Found</div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        {themes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
            <div className="w-16 h-16 bg-secondary flex items-center justify-center text-muted-foreground rounded-full border border-border">
              <Palette size={32} />
            </div>
            <div>
              <h3 className="text-xl font-bold">No themes extracted</h3>
              <p className="text-muted-foreground mt-1">This model either has no connected report, or it is using the default Power BI theme without custom JSON configurations.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            {themes.map((theme, i) => (
              <div key={i} className="border border-border bg-secondary/10">
                <div className="border-b border-border p-4 bg-secondary/30 font-bold flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Palette size={16} className="text-primary" />
                    {theme.name || `Theme ${i + 1}`}
                  </div>
                  <button
                    onClick={() => handleDownloadJson(theme)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs rounded-lg shadow-sm hover:opacity-90 transition-all font-medium tracking-wide"
                    title="Download Theme JSON"
                  >
                    <Download size={14} />
                    Export JSON
                  </button>
                </div>
                
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Data Colors */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-bold border-b border-border pb-2">
                      <Droplet size={16} className="text-primary" />
                      Data Colors (Chart Palette)
                    </div>
                    {theme.dataColors && theme.dataColors.length > 0 ? (
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                        {theme.dataColors.map((color, cIdx) => (
                          <div key={cIdx} className="space-y-1">
                            <div 
                              className="w-full aspect-square rounded-md border border-border shadow-sm"
                              style={{ backgroundColor: color }}
                            />
                            <div className="text-[9px] font-mono text-center text-muted-foreground uppercase">{color}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm italic text-muted-foreground">Default system colors used.</p>
                    )}
                  </div>

                  {/* Core UI Colors */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-bold border-b border-border pb-2">
                      <Type size={16} className="text-primary" />
                      Core UI Elements
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-2 border border-border bg-background rounded">
                        <span className="text-xs font-bold text-muted-foreground uppercase">Background</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono">{theme.background}</span>
                          <div className="w-6 h-6 border border-border rounded" style={{ backgroundColor: theme.background }} />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-2 border border-border bg-background rounded">
                        <span className="text-xs font-bold text-muted-foreground uppercase">Foreground (Text)</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono">{theme.foreground}</span>
                          <div className="w-6 h-6 border border-border rounded" style={{ backgroundColor: theme.foreground }} />
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-2 border border-border bg-background rounded">
                        <span className="text-xs font-bold text-muted-foreground uppercase">Table Accent</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono">{theme.tableAccent}</span>
                          <div className="w-6 h-6 border border-border rounded" style={{ backgroundColor: theme.tableAccent }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
