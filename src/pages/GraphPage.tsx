import { useEffect, useRef, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as d3 from "d3";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Network,
  Info,
  ChevronRight,
  Layers,
} from "lucide-react";
import { knowledgePoints, chapters, subjects } from "@/data/mock";
import { useStudyStore } from "@/store";
import type { GraphNode, GraphLink } from "@/types";

const masteryColors = {
  good: "#10b981",
  medium: "#f59e0b",
  weak: "#ef4444",
};

const masteryShadows = {
  good: "0 0 20px rgba(16, 185, 129, 0.4)",
  medium: "0 0 20px rgba(245, 158, 11, 0.4)",
  weak: "0 0 20px rgba(239, 68, 68, 0.4)",
};

export default function GraphPage() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    subjects[0].id
  );
  const [layoutMode, setLayoutMode] = useState<"force" | "tree">("force");
  const getMastery = useStudyStore((s) => s.getKnowledgePointMastery);
  const navigate = useNavigate();

  const { nodes, links } = useMemo(() => {
    const subjectChapters = chapters
      .filter((c) => c.subjectId === selectedSubjectId)
      .map((c) => c.id);
    const kps = knowledgePoints.filter((kp) =>
      subjectChapters.includes(kp.chapterId)
    );

    const nodeList: GraphNode[] = kps.map((kp) => {
      const mastery = getMastery(kp.id);
      return {
        id: kp.id,
        name: kp.name,
        x: 0,
        y: 0,
        masteryLevel: mastery.level,
        correctRate: mastery.correctRate,
        mistakeCount: mastery.mistakeCount,
        subjectId: selectedSubjectId,
      };
    });

    const linkList: GraphLink[] = [];
    kps.forEach((kp) => {
      kp.relatedIds.forEach((rid) => {
        if (
          kps.find((k) => k.id === rid) &&
          !linkList.find(
            (l) =>
              (l.source === kp.id && l.target === rid) ||
              (l.source === rid && l.target === kp.id)
          )
        ) {
          linkList.push({ source: kp.id, target: rid });
        }
      });
    });

    return { nodes: nodeList, links: linkList };
  }, [selectedSubjectId, getMastery]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || nodes.length === 0) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    svg.attr("viewBox", [0, 0, width, height]);

    const g = svg.append("g");

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    const simulation = d3
      .forceSimulation(nodes as d3.SimulationNodeDatum[])
      .force(
        "link",
        d3
          .forceLink(links)
          .id((d: any) => d.id)
          .distance(120)
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(60));

    const link = g
      .append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("class", "graph-link")
      .attr("stroke-opacity", 0.4);

    const node = g
      .append("g")
      .selectAll<SVGGElement, GraphNode>("g")
      .data(nodes)
      .join("g")
      .attr("class", "graph-node")
      .call(
        d3
          .drag<SVGGElement, GraphNode>()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      )
      .on("click", (_, d) => {
        setSelectedNode(d);
      })
      .on("dblclick", (_, d) => {
        navigate(`/graph/${d.id}`);
      });

    node
      .append("circle")
      .attr("r", (d) => 20 + d.mistakeCount * 3)
      .attr("fill", (d) => masteryColors[d.masteryLevel])
      .attr("stroke", "#fff")
      .attr("stroke-width", 3)
      .attr("filter", (d) => `drop-shadow(${masteryShadows[d.masteryLevel]})`)
      .attr("opacity", 0.9);

    node
      .append("text")
      .text((d) => d.name)
      .attr("text-anchor", "middle")
      .attr("dy", (d) => 36 + d.mistakeCount * 3)
      .attr("font-size", "12px")
      .attr("font-weight", "500")
      .attr("fill", "#374151")
      .each(function (d) {
        const self = d3.select(this);
        const text = self.text();
        if (text.length > 6) {
          self.text(text.slice(0, 6) + "...");
        }
      });

    node
      .append("text")
      .text((d) => `${Math.round(d.correctRate * 100)}%`)
      .attr("text-anchor", "middle")
      .attr("dy", "4px")
      .attr("font-size", "11px")
      .attr("font-weight", "600")
      .attr("fill", "#fff");

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [nodes, links, navigate]);

  const stats = useMemo(() => {
    const total = nodes.length;
    const good = nodes.filter((n) => n.masteryLevel === "good").length;
    const medium = nodes.filter((n) => n.masteryLevel === "medium").length;
    const weak = nodes.filter((n) => n.masteryLevel === "weak").length;
    return { total, good, medium, weak };
  }, [nodes]);

  return (
    <div className="h-[calc(100vh-10rem)] flex gap-6">
      <div className="flex-1 card-base overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <select
              className="input-base !w-32"
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <div className="flex rounded-xl overflow-hidden border border-gray-200">
              <button
                className={`px-4 py-2 text-sm font-medium transition-colors ${layoutMode === "force" ? "bg-primary-800 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
                onClick={() => setLayoutMode("force")}
              >
                <Network className="w-4 h-4 inline mr-1" />
                力导向
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium transition-colors ${layoutMode === "tree" ? "bg-primary-800 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
                onClick={() => setLayoutMode("tree")}
              >
                <Layers className="w-4 h-4 inline mr-1" />
                树形
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="w-9 h-9 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors"
              onClick={() => {
                const svg = d3.select(svgRef.current!);
                svg.transition().duration(300).call(
                  d3.zoom<SVGSVGElement, unknown>().scaleBy as any,
                  1.2
                );
              }}
            >
              <ZoomIn className="w-4 h-4 text-gray-600" />
            </button>
            <button
              className="w-9 h-9 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors"
              onClick={() => {
                const svg = d3.select(svgRef.current!);
                svg.transition().duration(300).call(
                  d3.zoom<SVGSVGElement, unknown>().scaleBy as any,
                  0.8
                );
              }}
            >
              <ZoomOut className="w-4 h-4 text-gray-600" />
            </button>
            <button
              className="w-9 h-9 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors"
              onClick={() => {
                const svg = d3.select(svgRef.current!);
                svg
                  .transition()
                  .duration(300)
                  .call(d3.zoom<SVGSVGElement, unknown>().transform as any, d3.zoomIdentity);
              }}
            >
              <RotateCcw className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="flex-1 relative" ref={containerRef}>
          <svg ref={svgRef} className="w-full h-full" />

          <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-soft border border-gray-100">
            <div className="text-xs font-medium text-gray-500 mb-2">
              掌握程度
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-mastery-good" />
                <span className="text-xs text-gray-600">
                  掌握良好 ({stats.good})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-mastery-medium" />
                <span className="text-xs text-gray-600">
                  需要加强 ({stats.medium})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-mastery-weak" />
                <span className="text-xs text-gray-600">
                  薄弱环节 ({stats.weak})
                </span>
              </div>
            </div>
          </div>

          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2 shadow-soft border border-gray-100">
            <span className="text-xs text-gray-500">共 </span>
            <span className="text-sm font-bold text-primary-800">
              {stats.total}
            </span>
            <span className="text-xs text-gray-500"> 个知识点</span>
          </div>

          <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-soft border border-gray-100">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Info className="w-3.5 h-3.5" />
              双击节点查看详情
            </div>
          </div>
        </div>
      </div>

      {selectedNode && (
        <div className="w-80 card-base p-5 animate-slide-up">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h4 className="font-bold text-gray-800 text-lg font-serif">
                {selectedNode.name}
              </h4>
              <span
                className="tag mt-2"
                style={{
                  backgroundColor: masteryColors[selectedNode.masteryLevel] + "20",
                  color: masteryColors[selectedNode.masteryLevel],
                }}
              >
                {selectedNode.masteryLevel === "good"
                  ? "掌握良好"
                  : selectedNode.masteryLevel === "medium"
                  ? "需要加强"
                  : "薄弱环节"}
              </span>
            </div>
            <button
              className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400"
              onClick={() => setSelectedNode(null)}
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">正确率</span>
                <span
                  className="font-bold"
                  style={{ color: masteryColors[selectedNode.masteryLevel] }}
                >
                  {Math.round(selectedNode.correctRate * 100)}%
                </span>
              </div>
              <div className="progress-track">
                <div
                  className="progress-bar"
                  style={{
                    width: `${selectedNode.correctRate * 100}%`,
                    backgroundColor: masteryColors[selectedNode.masteryLevel],
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-gray-50">
                <div className="text-xs text-gray-500 mb-1">错题数</div>
                <div className="text-xl font-bold text-gray-800">
                  {selectedNode.mistakeCount}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-gray-50">
                <div className="text-xs text-gray-500 mb-1">关联知识点</div>
                <div className="text-xl font-bold text-gray-800">
                  {
                    knowledgePoints.find((k) => k.id === selectedNode.id)
                      ?.relatedIds.length
                  }
                </div>
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold text-gray-700 mb-2">
                关联知识点
              </div>
              <div className="flex flex-wrap gap-1.5">
                {knowledgePoints
                  .find((k) => k.id === selectedNode.id)
                  ?.relatedIds.map((rid) => {
                    const kp = knowledgePoints.find((k) => k.id === rid);
                    if (!kp) return null;
                    return (
                      <button
                        key={rid}
                        className="tag bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors"
                        onClick={() => {
                          const node = nodes.find((n) => n.id === rid);
                          if (node) setSelectedNode(node);
                        }}
                      >
                        {kp.name}
                      </button>
                    );
                  })}
              </div>
            </div>

            <Link
              to={`/graph/${selectedNode.id}`}
              className="w-full btn-primary flex items-center justify-center gap-1"
            >
              查看详情 <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
