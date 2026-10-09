import {
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
} from "react";
import * as pdfjsLib from "pdfjs-dist";
import { PDF_WORKER_URL } from "../../../../config/pdfWorker";
import { usePdfHighlights, type HighlightArea } from "./hooks/usePdfHighlights";

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL;

interface PdfJsViewerProps {
  fileUrl: string;
  coordinateStr?: string | null;
  onPageLoad?: (pageIndex: number, viewport: pdfjsLib.PageViewport) => void;
  scale?: number;
}

export interface PdfJsViewerRef {
  scrollToHighlight: (area: HighlightArea) => void;
  scrollToPage: (pageIndex: number) => void;
}

const PdfJsViewer = forwardRef<PdfJsViewerRef, PdfJsViewerProps>(
  ({ fileUrl, coordinateStr, scale = 1.5 }, ref) => {
    const [pdf, setPdf] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
    const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
    const [numPages, setNumPages] = useState(0);
    const [pageInfoMap, setPageInfoMap] = useState<
      Record<number, { viewport: pdfjsLib.PageViewport; offset: { x: number; y: number } }>
    >({});
    const containerRef = useRef<HTMLDivElement>(null);
    const pageRefs = useRef<Record<number, HTMLDivElement | null>>({});
    const highlightRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const activePdf = loadedUrl === fileUrl ? pdf : null;

    // 1. Load PDF Document
    useEffect(() => {
      let isMounted = true;
      const loadingTask = pdfjsLib.getDocument(fileUrl);
      const loadPdf = async () => {
        try {
          const pdfDoc = await loadingTask.promise;
          if (isMounted) {
            setPageInfoMap({});
            setPdf(pdfDoc);
            setNumPages(pdfDoc.numPages);
            setLoadedUrl(fileUrl);
          }
        } catch (error) {
          console.error("Error loading PDF:", error);
        }
      };

      loadPdf();
      return () => {
        isMounted = false;
        void loadingTask.destroy();
      };
    }, [fileUrl]);

    // 2. Transform Highlights
    const highlights = usePdfHighlights(coordinateStr, pageInfoMap);

    // 3. Read page geometry, then render only pages close to the viewport.
    useEffect(() => {
      if (!activePdf) return;
      let cancelled = false;
      const loadPageGeometry = async () => {
        const info: Record<
          number,
          { viewport: pdfjsLib.PageViewport; offset: { x: number; y: number } }
        > = {};

        for (let i = 1; i <= numPages && !cancelled; i++) {
          const page = await activePdf.getPage(i);
          const viewport = page.getViewport({ scale });

          const cropBox = page.view;
          const offset = {
            x: cropBox[0],
            y: cropBox[1],
          };
          info[i - 1] = { viewport, offset };
        }
        if (!cancelled) setPageInfoMap(info);
      };
      void loadPageGeometry();
      return () => { cancelled = true; };
    }, [activePdf, numPages, scale]);

    useEffect(() => {
      const container = containerRef.current;
      if (!activePdf || !container || Object.keys(pageInfoMap).length !== numPages) return;
      const rendered = new Set<number>();
      const tasks = new Map<number, pdfjsLib.RenderTask>();
      let cancelled = false;
      const observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const pageNumber = Number((entry.target as HTMLElement).dataset.pageNumber);
          if (rendered.has(pageNumber)) continue;
          rendered.add(pageNumber);
          observer.unobserve(entry.target);
          void (async () => {
            try {
              const page = await activePdf.getPage(pageNumber);
              if (cancelled) return;
              const canvas = entry.target.querySelector('canvas');
              const viewport = pageInfoMap[pageNumber - 1]?.viewport;
              const context = canvas?.getContext('2d');
              if (!canvas || !viewport || !context) return;
              canvas.width = viewport.width;
              canvas.height = viewport.height;
              const task = page.render({ canvasContext: context, viewport });
              tasks.set(pageNumber, task);
              await task.promise;
              tasks.delete(pageNumber);
            } catch (error) {
              if (!cancelled) console.error('Error rendering PDF page:', error);
            }
          })();
        }
      }, { root: container, rootMargin: '800px 0px' });
      Object.values(pageRefs.current).forEach((element) => {
        if (element) observer.observe(element);
      });
      return () => {
        cancelled = true;
        observer.disconnect();
        tasks.forEach((task) => task.cancel());
      };
    }, [activePdf, numPages, pageInfoMap]);

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

    if (!activePdf || Object.keys(pageInfoMap).length !== numPages) {
      return (
        <div className="flex items-center justify-center h-full bg-bg-secondary text-text-secondary font-medium">
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
          const pageHighlights = highlights.filter(
            (h) => h.pageIndex === pageIndex,
          );

          return (
            <div
              key={pageNum}
              ref={(el) => {
                pageRefs.current[pageIndex] = el;
              }}
              data-page-number={pageNum}
              className="relative mx-auto shadow-2xl bg-surface-white transition-all duration-300"
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
                    className="absolute bg-blue-600/30 border border-blue-500/40 rounded-sm shadow-none transition-opacity duration-300"
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
