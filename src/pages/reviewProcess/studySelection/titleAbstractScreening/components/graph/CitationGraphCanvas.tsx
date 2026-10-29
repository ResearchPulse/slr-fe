import React, { useEffect, useMemo, useRef, useState } from "react";
import CytoscapeComponent from "react-cytoscapejs";
import cytoscape from "cytoscape";
import fcose from "cytoscape-fcose";
import { GitBranch } from "lucide-react";
import type { CitationGraphDto } from "../../../../../../types/studySelection";

cytoscape.use(fcose);

interface CitationGraphCanvasProps {
  data: CitationGraphDto;
  rootPaperId?: string;
  selectedPaperId?: string | null;
  onNodeClick?: (paperId: string | null) => void;
}

const CitationGraphCanvas: React.FC<CitationGraphCanvasProps> = ({
  data,
  rootPaperId,
  selectedPaperId,
  onNodeClick,
}) => {
  const cyRef = useRef<cytoscape.Core | null>(null);
  const radialPositionsRef = useRef<Record<string, cytoscape.Position>>({});
  const hasInitializedSelectionRef = useRef(false);
  const previousSelectedPaperIdRef = useRef<string | null>(null);
  const [isCyReady, setIsCyReady] = useState(false);

  const elements = useMemo(() => {
    if (!data.nodes.length) return [];

    const currentYear = new Date().getFullYear();
    const oldestScaleYear = currentYear - 30;

    const nodes = data.nodes.map((node) => {
      const hasYear = Number.isFinite(node.year) && !!node.year && node.year > 0;
      const year = hasYear ? node.year! : oldestScaleYear;
      const yearProgress = hasYear
        ? Math.max(0, Math.min(1, (year - oldestScaleYear) / 30))
        : 0;

      return {
        data: {
          id: node.id,
          label: `${node.title.length > 38 ? `${node.title.substring(0, 35)}...` : node.title}\n(${hasYear ? year : "Year unavailable"})`,
          fullTitle: node.title,
          year,
          yearProgress,
          isRoot: node.id === rootPaperId,
        },
      };
    });

    const edges = data.edges.map((edge, index) => ({
      data: {
        id: `e${index}`,
        source: edge.sourcePaperId,
        target: edge.targetPaperId,
        weight: edge.confidenceScore,
      },
    }));

    return [...nodes, ...edges];
  }, [data, rootPaperId]);

  const stylesheet = useMemo<
    NonNullable<React.ComponentProps<typeof CytoscapeComponent>["stylesheet"]>
  >(
    () => [
      {
        selector: "node",
        style: {
          "background-color": "mapData(yearProgress, 0, 1, #E2F0FE, #0071BC)",
          "border-width": 0,
          width: "mapData(yearProgress, 0, 1, 34, 52)",
          height: "mapData(yearProgress, 0, 1, 34, 52)",
          label: "data(label)",
          "font-size": 10,
          "text-valign": "bottom",
          "text-halign": "center",
          "text-margin-y": 7,
          color: "#647381",
          "font-family": "Manrope, sans-serif",
          "transition-property": "background-color border-color border-width width height opacity",
          "transition-duration": 200,
          "text-wrap": "wrap",
          "text-max-width": "112px",
        },
      },
      {
        selector: "node[?isRoot]",
        style: {
          "background-color": "#0071BC",
          "border-width": 0,
          width: 58,
          height: 58,
          color: "#122331",
          "font-weight": 700,
        },
      },
      {
        selector: "node.selected",
        style: {
          "font-weight": 700,
        },
      },
      {
        selector: "edge",
        style: {
          width: 1.25,
          "line-color": "#b8c9d5",
          opacity: 0.55,
          "curve-style": "bezier",
          "target-arrow-shape": "triangle",
          "target-arrow-color": "#b8c9d5",
          "target-arrow-fill": "filled",
          "arrow-scale": 0.8,
          "transition-property": "line-color opacity width",
          "transition-duration": 180,
        },
      },
      {
        selector: "node.highlight",
        style: {
          "font-weight": 700,
        },
      },
      {
        selector: "node.semitransparent",
        style: { opacity: 0.22 },
      },
      {
        selector: "edge.highlight",
        style: {
          opacity: 0.9,
          width: 2.25,
          "line-color": "#5a9bc5",
          "target-arrow-color": "#5a9bc5",
        },
      },
      {
        selector: "edge.semitransparent",
        style: { opacity: 0.12 },
      },
    ],
    [],
  );

  const runRadialLayout = (animate: boolean) => {
    const cy = cyRef.current;
    if (!cy || cy.nodes().empty()) return;

    const prefersReducedMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches ?? false;
    const shouldAnimate = animate && !prefersReducedMotion;
    const cachedPositions = radialPositionsRef.current;
    const hasCachedPositions = Object.keys(cachedPositions).length > 0;
    const layout = hasCachedPositions
      ? cy.layout({
          name: "preset",
          positions: (nodeId: string) => cachedPositions[nodeId],
          animate: shouldAnimate,
          animationDuration: shouldAnimate ? 450 : 0,
          fit: true,
          padding: 72,
        })
      : cy.layout({
          name: "fcose",
          animate: shouldAnimate,
          animationDuration: shouldAnimate ? 850 : 0,
          fit: true,
          padding: 72,
          nodeDimensionsIncludeLabels: true,
          nodeSeparation: 110,
          idealEdgeLength: (edge: cytoscape.EdgeSingular) =>
            112 / Math.max(edge.data("weight") || 0.5, 0.25),
          randomize: true,
        } as cytoscape.LayoutOptions);

    layout.one("layoutstop", () => {
      radialPositionsRef.current = {};
      cy.nodes().forEach((node) => {
        radialPositionsRef.current[node.id()] = { ...node.position() };
      });
    });
    layout.run();
  };

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy || !isCyReady) return;

    cy.elements().remove();
    if (elements.length) cy.add(elements);
    radialPositionsRef.current = {};
    runRadialLayout(false);
  }, [elements, isCyReady]);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy || !isCyReady) return;

    const shouldAnimateSelection =
      hasInitializedSelectionRef.current &&
      previousSelectedPaperIdRef.current !== selectedPaperId;
    hasInitializedSelectionRef.current = true;
    previousSelectedPaperIdRef.current = selectedPaperId ?? null;
    cy.elements().removeClass("semitransparent highlight selected");

    if (!selectedPaperId) return;
    const selectedNode = cy.getElementById(selectedPaperId);
    if (!selectedNode.length) return;

    selectedNode.addClass("selected");
    cy.elements().addClass("semitransparent");
    const neighborhood = selectedNode.neighborhood().add(selectedNode);
    neighborhood.removeClass("semitransparent").addClass("highlight");
    selectedNode.connectedEdges().removeClass("semitransparent").addClass("highlight");

    if (shouldAnimateSelection) {
      const prefersReducedMotion = window.matchMedia?.(
        "(prefers-reduced-motion: reduce)",
      ).matches ?? false;
      cy.animate({
        center: { eles: selectedNode },
        zoom: {
          level: Math.max(cy.zoom(), 0.8),
          position: selectedNode.position(),
        },
        duration: prefersReducedMotion ? 0 : 220,
        easing: "ease-in-out-cubic",
      });
    }
  }, [selectedPaperId, isCyReady, elements]);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy || !isCyReady) return;

    const resizeGraph = () => {
      requestAnimationFrame(() => {
        cy.resize();
        cy.fit(cy.elements(), 72);
      });
    };
    window.addEventListener("resize", resizeGraph);
    return () => window.removeEventListener("resize", resizeGraph);
  }, [isCyReady]);

  const handleCyReady = (cy: cytoscape.Core) => {
    cyRef.current = cy;
    setIsCyReady(true);

    cy.on("tap", "node", (event) => onNodeClick?.(event.target.id()));
    cy.on("tap", (event) => {
      if (event.target === cy) onNodeClick?.(null);
    });
    cy.on("mouseover", "node", (event) => {
      if (selectedPaperId) return;
      const node = event.target;
      cy.elements().addClass("semitransparent");
      node.neighborhood().add(node).removeClass("semitransparent").addClass("highlight");
      node.connectedEdges().removeClass("semitransparent").addClass("highlight");
    });
    cy.on("mouseout", "node", () => {
      if (!selectedPaperId) cy.elements().removeClass("semitransparent highlight");
    });
  };

  return (
    <div className="group relative h-full min-h-0 w-full overflow-hidden rounded-xl bg-transparent">
      <CytoscapeComponent
        elements={[]}
        style={{ width: "100%", height: "100%" }}
        stylesheet={stylesheet}
        cy={handleCyReady}
      />

      <div className="absolute right-3 top-3 z-20 w-52 rounded-lg border border-border/70 bg-surface-white/90 px-3 py-2 backdrop-blur-sm sm:right-4 sm:top-4">
        <p className="text-[11px] font-semibold text-text-primary">Publication year</p>
        <div className="mt-2" role="img" aria-label="Publication year color scale: earlier papers are lighter and recent papers are darker">
          <div className="grid h-2.5 grid-cols-3 overflow-hidden rounded-full">
            <span className="bg-[#E2F0FE]" />
            <span className="bg-[#3994E2]" />
            <span className="bg-[#0071BC]" />
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-text-secondary">
            <span>Earlier</span>
            <span>Recent</span>
          </div>
        </div>
      </div>

      {data.nodes.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-5 pt-16 text-center">
          <div className="max-w-sm text-text-secondary">
            <GitBranch className="mx-auto mb-2 h-6 w-6" aria-hidden="true" />
            <p className="text-sm font-semibold text-text-primary">No citation data available</p>
            <p className="mt-1 text-xs leading-relaxed">
              This paper has no citation network to display yet.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CitationGraphCanvas;
