import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { usePdfHighlights, type HighlightArea } from "./hooks/usePdfHighlights";

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js`;

interface PdfJsViewerProps {
  fileUrl: string;
  coordinateStr?: string | null;
  onPageLoad?: (pageIndex: number, viewport: any) => void;
  scale?: number;
}

export interface PdfJsViewerRef {
  scrollToHighlight: (area: HighlightArea) => void;
  scrollToPage: (pageIndex: number) => void;
}

const PdfJsViewer = forwardRef<PdfJsViewerRef, PdfJsViewerProps>(
  ({ fileUrl, coordinateStr, scale = 1.5 }, ref) => {
    const [pdf, setPdf] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
    const [numPages, setNumPages] = useState(0);
    const [pageInfoMap, setPageInfoMap] = useState<
      Record<number, { viewport: any; offset: { x: number; y: number } }>
    >({});
    const containerRef = useRef<HTMLDivElement>(null);
    const pageRefs = useRef<Record<number, HTMLDivElement | null>>({});
    const highlightRefs = useRef<Record<string, HTMLDivElement | null>>({});

    // 1. Load PDF Document
    useEffect(() => {
      let isMounted = true;
      const loadPdf = async () => {
        try {
          const loadingTask = pdfjsLib.getDocument(fileUrl);
          const pdfDoc = await loadingTask.promise;
          if (isMounted) {
            setPdf(pdfDoc);
            setNumPages(pdfDoc.numPages);
          }
        } catch (error) {
          console.error("Error loading PDF:", error);
        }
      };

      loadPdf();
      return () => {
        isMounted = false;
      };
    }, [fileUrl]);

    // 2. Transform Highlights
    const highlights = usePdfHighlights(coordinateStr, pageInfoMap);

    // 3. Render Pages
    useEffect(() => {
      if (!pdf) return;

      const renderPages = async () => {
        const info: Record<number, { viewport: any; offset: { x: number; y: number } }> = {};

        for (let i = 1; i <= numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale });

          const cropBox = page.view;
          const offset = {
            x: cropBox[0],
            y: cropBox[1],
          };
          info[i - 1] = { viewport, offset };

          const canvas = document.getElementById(`pdf-canvas-${i}`) as HTMLCanvasElement;
          if (canvas) {
            const context = canvas.getContext("2d");
            if (context) {
              canvas.height = viewport.height;
              canvas.width = viewport.width;

              const renderContext = {
                canvasContext: context,
                viewport: viewport,
              };
              await page.render(renderContext).promise;
            }
          }
        }
        setPageInfoMap(info);
      };

      renderPages();
    }, [pdf, numPages, scale]);

    // 4. Auto-scroll to first highlight when it changes
    useEffect(() => {
      if (highlights.length > 0) {
        const firstArea = highlights[0];
        // Short delay to ensure DOM is ready
        const timer = setTimeout(() => {
          const element = highlightRefs.current[firstArea.id];
          if (element) {
            element.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }
        }, 100);
        return () => clearTimeout(timer);
      }
    }, [highlights]);

    // 5. Expose Navigation Methods
    useImperativeHandle(ref, () => ({
      scrollToHighlight: (area: HighlightArea) => {
        const element = highlightRefs.current[area.id];
        if (element) {
          element.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      },
      scrollToPage: (pageIndex: number) => {
        const element = pageRefs.current[pageIndex];
        if (element) {
          element.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      },
    }));

    if (!pdf) {
      return (
        <div className="flex items-center justify-center h-full bg-slate-50 text-slate-400 font-medium">
          Loading document...
        </div>
      );
    }

    return (
      <div
        ref={containerRef}
        className="w-full h-full overflow-y-auto bg-slate-200 p-4 space-y-4 scroll-smooth"
      >
        {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => {
          const pageIndex = pageNum - 1;
          const viewport = pageInfoMap[pageIndex]?.viewport;
          const pageHighlights = highlights.filter((h) => h.pageIndex === pageIndex);

          return (
            <div
              key={pageNum}
              ref={(el) => {
                pageRefs.current[pageIndex] = el;
              }}
              className="relative mx-auto shadow-2xl bg-white transition-all duration-300"
              style={{
                width: viewport?.width || "auto",
                height: viewport?.height || "auto",
              }}
            >
              <canvas id={`pdf-canvas-${pageNum}`} className="block" />

              {/* Highlight Layer */}
              <div className="absolute inset-0 pointer-events-none">
                {pageHighlights.map((h) => (
                  <div
                    key={h.id}
                    ref={(el) => {
                      highlightRefs.current[h.id] = el;
                    }}
                    className="absolute bg-blue-600/30 border border-blue-500/40 rounded-sm shadow-sm transition-opacity duration-300"
                    style={{
                      left: h.left,
                      top: h.top,
                      width: h.width,
                      height: h.height,
                    }}
                  />
                ))}
              </div>

              {/* Page Number Badge */}
              <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 text-white text-[10px] font-bold rounded backdrop-blur-sm pointer-events-none">
                Page {pageNum}
              </div>
            </div>
          );
        })}
      </div>
    );
  },
);

PdfJsViewer.displayName = "PdfJsViewer";

export default PdfJsViewer;
