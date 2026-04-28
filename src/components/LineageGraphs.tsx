import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { PBIModel, PBIMeasure } from '../types';
import { cn } from '../utils';

interface ModelSchemaGraphProps {
  model: PBIModel;
}

export const ModelSchemaGraph = ({ model }: ModelSchemaGraphProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(new Set(model.tables.map(t => t.name)));
  const lastModelRef = useRef<PBIModel | null>(null);

  const toggleNode = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = 500;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Main container for zoom/pan
    const g = svg.append("g");

    // Nodes (Tables)
    const nodes = model.tables.map(t => ({ id: t.name, ...t }));
    
    // Links (Relationships)
    const links = model.relationships.map(r => ({
      source: r.fromTable,
      target: r.toTable,
      fromCol: r.fromColumn,
      toCol: r.toColumn,
      cardinality: `${r.fromCardinality === 'one' ? '1' : '*'}..${r.toCardinality === 'one' ? '1' : '*'}`
    }));

    const simulation = d3.forceSimulation(nodes as any)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(250))
      .force("charge", d3.forceManyBody().strength(-800))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(100));

    // Zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.1, 5])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    // Restore previous transform if this isn't a fresh model load
    const currentTransform = d3.zoomTransform(svgRef.current as any);
    const isNewModel = !lastModelRef.current || lastModelRef.current !== model;

    if (!isNewModel) {
      g.attr("transform", currentTransform.toString());
      svg.call(zoom.transform as any, currentTransform);
    }
    
    svg.call(zoom as any);

    const link = g.append("g")
      .attr("stroke", "rgba(0, 132, 0, 0.2)")
      .selectAll("line")
      .data(links)
      .enter().append("line")
      .attr("stroke-width", 2);

    const node = g.append("g")
      .selectAll(".node")
      .data(nodes)
      .enter().append("g")
      .attr("class", "node cursor-grab active:cursor-grabbing")
      .on("click", (event, d: any) => toggleNode(d.id));

    // Drag behavior
    const drag = d3.drag()
      .on("start", (event, d: any) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", (event, d: any) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", (event, d: any) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    node.call(drag as any);

    node.append("rect")
      .attr("width", 160)
      .attr("height", 50)
      .attr("x", -80)
      .attr("y", -25)
      .attr("rx", 12)
      .attr("fill", "#1F2122")
      .attr("stroke", "#008400")
      .attr("stroke-width", 2)
      .attr("class", "filter drop-shadow-lg");

    node.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("fill", "#F3F2F1")
      .attr("font-size", "12px")
      .attr("font-weight", "900")
      .attr("class", "uppercase italic tracking-tighter")
      .text((d: any) => d.id);

    // Cardinality labels on links
    const linkText = g.append("g")
      .selectAll("text")
      .data(links)
      .enter().append("text")
      .attr("fill", "rgba(0, 132, 0, 0.6)")
      .attr("font-size", "9px")
      .attr("font-weight", "bold")
      .attr("text-anchor", "middle")
      .text((d: any) => d.cardinality);

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node
        .attr("transform", (d: any) => `translate(${d.x},${d.y})`);
      
      linkText
        .attr("x", (d: any) => (d.source.x + d.target.x) / 2)
        .attr("y", (d: any) => (d.source.y + d.target.y) / 2 - 10);
    });

    // Auto-fit function
    const fitGraph = () => {
      const bounds = g.node()?.getBBox();
      if (!bounds || bounds.width === 0 || bounds.height === 0) return;
      
      const fullWidth = width;
      const fullHeight = height;
      const midX = bounds.x + bounds.width / 2;
      const midY = bounds.y + bounds.height / 2;
      
      const padding = 40;
      const scale = Math.min(
        (fullWidth - padding) / bounds.width,
        (fullHeight - padding) / bounds.height
      , 1.0); // Don't over-zoom small graphs

      svg.transition().duration(1000).call(
        zoom.transform as any,
        d3.zoomIdentity
          .translate(fullWidth / 2, fullHeight / 2)
          .scale(scale)
          .translate(-midX, -midY)
      );
    };

    // Run fit ONLY on initial model load
    if (isNewModel) {
      setTimeout(fitGraph, 500);
      lastModelRef.current = model;
    }

  }, [model, expandedIds]);

  return (
    <div ref={containerRef} className="w-full bg-[#0B0C0C] rounded-3xl border border-border/50 overflow-hidden relative min-h-[500px]">
      <div className="absolute top-6 left-6 flex flex-col gap-1 z-20">
        <div className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Technical Architecture</div>
        <div className="text-xs text-muted-foreground italic">{model.relationships.length} Active Cardinality Joins</div>
      </div>
      
      <div className="absolute top-6 right-6 flex items-center gap-4 z-20 bg-[#1F2122]/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-border/30">
         <span className="text-[9px] font-black text-muted-foreground uppercase flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Interactive Map
         </span>
         <div className="h-4 w-px bg-border/20" />
         <span className="text-[9px] font-black text-primary uppercase tracking-widest">DRAG TO EXPLORE • SCROLL TO ZOOM</span>
      </div>

      <svg ref={svgRef} width="100%" height="500" className="cursor-move" />
    </div>
  );
};

interface LineageGraphProps {
  measure?: PBIMeasure;
  model: PBIModel;
  full?: boolean;
}

export const LineageGraph = ({ measure, model, full = false }: LineageGraphProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(new Set(model.tables.map(t => t.name)));
  const lastDataRef = useRef<{ model: PBIModel, measure?: PBIMeasure } | null>(null);

  const toggleNode = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = full ? 600 : 400;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Prepare data: Nodes and Links
    const nodes: any[] = [];
    const links: any[] = [];
    const nodeMap = new Map();

    // Helper to add nodes
    const addNode = (id: string, name: string, type: string, extra = {}) => {
      if (nodeMap.has(id)) return nodeMap.get(id);
      const n = { id, name, type, ...extra };
      nodes.push(n);
      nodeMap.set(id, n);
      return n;
    };

    if (full) {
      // 1. All Tables
      model.tables.forEach(t => {
        addNode(t.name, t.name, 'table', { isExpanded: expandedIds.has(t.name), storageMode: (t as any).storageMode });
        
        // 2. All Measures (Only if Table is expanded)
        if (expandedIds.has(t.name)) {
          t.measures.forEach(m => {
            const mNode = addNode(`${t.name}.${m.name}`, m.name, 'measure', { table: t.name, dependencies: m.dependencies });
            links.push({ source: t.name, target: mNode.id, type: 'containment' });
          });

          // 3. Calculated Columns
          t.columns.forEach(c => {
            if (c.expression) {
              const cNode = addNode(`${t.name}.${c.name}`, c.name, 'column', { table: t.name, dependencies: c.dependencies, isCalc: true });
              links.push({ source: t.name, target: cNode.id, type: 'containment' });
            }
          });
        }
      });

      // 4. Logic Dependencies (Crossing table boundaries)
      nodes.filter(n => n.type === 'measure' || n.isCalc).forEach(n => {
        if (n.dependencies) {
           n.dependencies.measures.forEach((dm: string) => {
              // Find the target measure node anywhere in the model
              const targetNode = nodes.find(mn => mn.type === 'measure' && mn.name === dm);
              if (targetNode) {
                 links.push({ source: targetNode.id, target: n.id, type: 'logic' });
              }
           });
           n.dependencies.columns.forEach((dc: string) => {
              // Extract Table[Column]
              const match = dc.match(/(.*)\[(.*)\]/);
              if (match) {
                 const [_, tbl, col] = match;
                 const targetNode = nodes.find(cn => cn.type === 'column' && cn.name === col && (cn.table === tbl || !cn.table));
                 if (targetNode) {
                    links.push({ source: targetNode.id, target: n.id, type: 'logic' });
                 }
              }
           });
        }
      });
    } else if (measure) {
       // Single Measure Focus View
       const rootId = `${measure.tableName}.${measure.name}`;
       const root = addNode(rootId, measure.name, 'measure', { table: measure.tableName, dependencies: measure.dependencies });
       
       measure.dependencies?.measures.forEach(dm => {
          const mNode = addNode(`dep.${dm}`, dm, 'measure');
          links.push({ source: mNode.id, target: rootId, type: 'logic' });
       });
       measure.dependencies?.columns.forEach(dc => {
          const cNode = addNode(`dep.${dc}`, dc, 'column');
          links.push({ source: cNode.id, target: rootId, type: 'logic' });
       });
    }

    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(d => d.type === 'logic' ? 150 : 80))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(50));

    const g = svg.append("g");

    // Zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.1, 8])
      .on("zoom", (event) => g.attr("transform", event.transform));
    // Restore previous transform if this isn't a fresh data load
    const currentTransform = d3.zoomTransform(svgRef.current as any);
    const isNewData = !lastDataRef.current || lastDataRef.current.model !== model || lastDataRef.current.measure !== measure;
    
    if (!isNewData) {
      g.attr("transform", currentTransform.toString());
      svg.call(zoom.transform as any, currentTransform);
    }
    
    svg.call(zoom as any);

    // Links
    const link = g.append("g")
      .selectAll("path")
      .data(links)
      .enter().append("path")
      .attr("fill", "none")
      .attr("stroke", (d: any) => d.type === 'logic' ? "rgba(0, 132, 0, 0.4)" : "rgba(255, 255, 255, 0.05)")
      .attr("stroke-width", (d: any) => d.type === 'logic' ? 2 : 1)
      .attr("marker-end", (d: any) => d.type === 'logic' ? "url(#arrowhead)" : "");

    // Markers
    svg.append("defs").append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 20)
      .attr("refY", 0)
      .attr("markerWidth", 5)
      .attr("markerHeight", 5)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "rgba(0, 132, 0, 0.6)");

    // Nodes
    const node = g.append("g")
      .selectAll(".node")
      .data(nodes)
      .enter().append("g")
      .attr("class", "node cursor-pointer")
      .on("click", (event, d: any) => {
        if (d.type === 'table') toggleNode(d.id);
      })
      .on("mouseenter", (event, d: any) => {
         // Highlight logic chain
         const connectedIds = new Set([d.id]);
         const connectedLinks = new Set();
         links.forEach(l => {
            if (l.source.id === d.id || l.target.id === d.id) {
               connectedIds.add(l.source.id);
               connectedIds.add(l.target.id);
               connectedLinks.add(l);
            }
         });
         
         node.style("opacity", (n: any) => connectedIds.has(n.id) ? 1 : 0.05);
         link.style("opacity", (l: any) => connectedLinks.has(l) ? 1 : 0.02);
         link.style("stroke", (l: any) => connectedLinks.has(l) ? "#008400" : "rgba(255, 255, 255, 0.05)");
         link.style("stroke-width", (l: any) => connectedLinks.has(l) ? 3 : 1);
         
         // Trigger pulse on connected links
         g.selectAll(".flow-particle")
          .filter((p: any) => connectedLinks.has(p.link))
          .style("opacity", 1)
          .attr("r", 3);
      })
      .on("mouseleave", () => {
         node.style("opacity", 1);
         link.style("opacity", 1);
         link.style("stroke", (d: any) => d.type === 'logic' ? "rgba(0, 132, 0, 0.4)" : "rgba(255, 255, 255, 0.05)");
         link.style("stroke-width", (d: any) => d.type === 'logic' ? 2 : 1);
         
         g.selectAll(".flow-particle")
          .style("opacity", 0.4)
          .attr("r", 1.5);
      });

    node.append("circle")
      .attr("r", (d: any) => d.type === 'table' ? 14 : 7)
      .attr("fill", (d: any) => {
        if (d.type === 'table') return "#008400";
        if (d.type === 'measure') return "#10b981";
        if (d.type === 'column' || d.isCalc) return "#F5CE00";
        return "#1F2122";
      })
      .attr("stroke", (d: any) => d.type === 'table' ? (expandedIds.has(d.id) ? "rgba(255,255,255,0.8)" : "#F5CE00") : "rgba(255,255,255,0.2)")
      .attr("stroke-width", (d: any) => d.type === 'table' ? 2 : 1)
      .style("filter", (d: any) => d.type === 'table' ? "drop-shadow(0 0 8px rgba(0,132,0,0.5))" : "none");

    // Collapsed Indicator
    node.filter((d: any) => d.type === 'table' && !expandedIds.has(d.id))
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", ".3em")
      .text("+")
      .attr("fill", "#F5CE00")
      .attr("font-size", "14px")
      .attr("font-weight", "bold");

    // Add Storage Mode Badge for Tables
    node.filter((d: any) => d.type === 'table' && d.storageMode)
      .append("rect")
      .attr("x", -20)
      .attr("y", -28)
      .attr("width", 40)
      .attr("height", 10)
      .attr("rx", 4)
      .attr("fill", "#1F2122")
      .attr("stroke", "rgba(255,255,255,0.1)");
      
    node.filter((d: any) => d.type === 'table' && d.storageMode)
      .append("text")
      .attr("y", -21)
      .attr("text-anchor", "middle")
      .text((d: any) => d.storageMode.toUpperCase())
      .attr("font-size", "6px")
      .attr("font-weight", "900")
      .attr("fill", "#F5CE00")
      .attr("letter-spacing", "1px");

    node.append("text")
      .attr("dy", ".35em")
      .attr("x", (d: any) => d.type === 'table' ? 18 : 12)
      .text((d: any) => d.name)
      .attr("font-size", (d: any) => d.type === 'table' ? "11px" : "9px")
      .attr("font-weight", (d: any) => d.type === 'table' ? "900" : "bold")
      .attr("fill", "#F3F2F1")
      .attr("class", "uppercase tracking-tighter pointer-events-none")
      .style("text-shadow", "0 2px 4px rgba(0,0,0,0.5)");

    // Flow Particles for Logic Links
    const logicLinks = links.filter(l => l.type === 'logic');
    const particles = g.append("g")
      .selectAll(".flow-particle")
      .data(logicLinks)
      .enter().append("circle")
      .attr("class", "flow-particle")
      .attr("r", 1.5)
      .attr("fill", "#10b981")
      .style("opacity", 0.4)
      .style("filter", "blur(1px) drop-shadow(0 0 4px #10b981)");

    function animateParticles() {
      particles.transition()
        .duration(2000 + Math.random() * 1000)
        .ease(d3.easeLinear)
        .attrTween("transform", function(d: any) {
          const path = link.filter((l: any) => l === d).node() as SVGPathElement;
          if (!path) return () => "";
          const l = path.getTotalLength();
          return (t: number) => {
            const p = path.getPointAtLength(t * l);
            return `translate(${p.x},${p.y})`;
          };
        })
        .on("end", animateParticles);
    }
    animateParticles();

    simulation.on("tick", () => {
      link.attr("d", (d: any) => {
         const dx = d.target.x - d.source.x;
         const dy = d.target.y - d.source.y;
         const dr = Math.sqrt(dx * dx + dy * dy);
         return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
      });

      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    // Auto-fit function
    const fitGraph = () => {
      const bounds = g.node()?.getBBox();
      if (!bounds || bounds.width === 0 || bounds.height === 0) return;
      
      const fullWidth = width;
      const fullHeight = height;
      const midX = bounds.x + bounds.width / 2;
      const midY = bounds.y + bounds.height / 2;
      
      const padding = 50;
      const scale = Math.min(
        (fullWidth - padding) / bounds.width,
        (fullHeight - padding) / bounds.height
      , 1.2);

      svg.transition().duration(800).call(
        zoom.transform as any,
        d3.zoomIdentity
          .translate(fullWidth / 2, fullHeight / 2)
          .scale(scale)
          .translate(-midX, -midY)
      );
    };


    // Initial drag support
    node.call(d3.drag()
      .on("start", (event, d: any) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", (event, d: any) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", (event, d: any) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      }) as any);

    // Run fit ONLY on initial data load
    if (isNewData) {
      setTimeout(fitGraph, 600);
      lastDataRef.current = { model, measure };
    }

  }, [measure, model, full, expandedIds]);

  return (
    <div ref={containerRef} className={cn("w-full bg-[#0B0C0C] rounded-3xl border border-border/50 overflow-hidden relative", full ? "h-[600px]" : "min-h-[400px]")}>
      <div className="absolute top-6 left-6 flex gap-4 bg-[#1F2122]/50 backdrop-blur-md p-3 rounded-2xl border border-white/10 z-10">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#008400]" />
          <span className="text-[10px] text-white/80 uppercase font-black tracking-widest">Table</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
          <span className="text-[10px] text-white/80 uppercase font-black tracking-widest">Measure</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#F5CE00]" />
          <span className="text-[10px] text-white/80 uppercase font-black tracking-widest">Calc Column</span>
        </div>
      </div>
      
      <div className="absolute bottom-6 right-6 z-20 text-[9px] font-black text-muted-foreground uppercase tracking-widest">
        Hover node to trace logic flow • Drag to reorganize
      </div>

      <svg ref={svgRef} width="100%" height={full ? 600 : 400} className="cursor-move" />
    </div>
  );
};
