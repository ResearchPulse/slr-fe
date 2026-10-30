import Select from "../../../ui/Select";
import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  forwardRef,
} from "react";
import type { FormEvent } from "react";
import * as pdfjsLib from "pdfjs-dist";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ChevronsLeftRight,
  Download,
  ExternalLink,
  FileText,
  Grid2X2,
  ListTree,
  Maximize2,
  Minimize2,
  Search,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { PDF_WORKER_URL } from "../../../../config/pdfWorker";
import type { ParsedSectionDto } from "../../../../types/paper";
import { cn } from "../../../../utils/cn";
import { usePdfHighlights, type HighlightArea } from "./hooks/usePdfHighlights";

pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL;

interface PdfJsViewerProps {
  fileUrl: string;
  documentTitle?: string;
  coordinateStr?: string | null;
  highlightQueries?: Array<{ text: string; page?: number; role?: string }>;
  sections?: ParsedSectionDto[] | null;
  activeSection?: string | null;
  onSectionSelect?: (sectionTitle: string) => void;
  onPageLoad?: (pageIndex: number, viewport: pdfjsLib.PageViewport) => void;
  scale?: number;
  allowDownload?: boolean;
  initialFitMode?: "width" | "page";
}

export interface PdfJsViewerRef {
  scrollToHighlight: (area: HighlightArea) => void;
  scrollToPage: (pageIndex: number) => void;
  scrollToFirstHighlight: () => void;
}

interface OutlineEntry {
  title: string;
  pageIndex: number;
  children: OutlineEntry[];
  sectionTitle?: string;
}

interface PdfOutlineNode {
  title?: string;
  dest?: string | unknown[] | null;
  items?: PdfOutlineNode[];
}

type NavigationMode = "outline" | "thumbnails" | null;
type FitMode = "free" | "width" | "page";

const ZOOM_LEVELS = [50, 75, 100, 125, 150, 175, 200, 250, 300];
const EMPTY_SECTIONS: ParsedSectionDto[] = [];
const EMPTY_HIGHLIGHT_QUERIES: Array<{ text: string; page?: number; role?: string }> = [];

const quoteHighlightClass = (role?: string) => {
  switch (role?.toLocaleLowerCase()) {
    case "claim": return "border-emerald-600/70 bg-emerald-300/45 shadow-[0_0_0_1px_rgba(5,150,105,0.16)]";
    case "ground": return "border-sky-600/70 bg-sky-300/45 shadow-[0_0_0_1px_rgba(2,132,199,0.16)]";
    case "warrant": return "border-violet-600/70 bg-violet-300/45 shadow-[0_0_0_1px_rgba(124,58,237,0.16)]";
    case "backing": return "border-teal-600/70 bg-teal-300/45 shadow-[0_0_0_1px_rgba(13,148,136,0.16)]";
    case "qualifier": return "border-amber-600/70 bg-amber-300/50 shadow-[0_0_0_1px_rgba(217,119,6,0.16)]";
    case "rebuttal": return "border-rose-600/70 bg-rose-300/45 shadow-[0_0_0_1px_rgba(225,29,72,0.16)]";
    case "reason": return "border-indigo-600/70 bg-indigo-300/45 shadow-[0_0_0_1px_rgba(79,70,229,0.16)]";
    default: return "border-amber-500/70 bg-amber-300/45 shadow-[0_0_0_1px_rgba(245,158,11,0.16)]";
  }
};

type SearchablePdfTextItem = { str: string; transform: number[]; width: number; height: number; dir: string };

function normalizePdfSearchText(value: string): string {
  return Array.from(value.normalize("NFKC").toLocaleLowerCase())
    .map((character) => /[\p{L}\p{N}]/u.test(character) ? character : " ")
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

function findQuoteAreas(items: SearchablePdfTextItem[], query: string, pageIndex: number, viewport: pdfjsLib.PageViewport, queryIndex: number): HighlightArea[] {
  const stream: string[] = [];
  const positions: Array<{ itemIndex: number; characterIndex: number }> = [];
  const appendSpace = (itemIndex: number, characterIndex: number) => {
    if (stream.length && stream[stream.length - 1] !== " ") {
      stream.push(" ");
      positions.push({ itemIndex, characterIndex });
    }
  };

  items.forEach((item, itemIndex) => {
    if (itemIndex) appendSpace(itemIndex, -1);
    Array.from(item.str).forEach((rawCharacter, characterIndex) => {
      Array.from(rawCharacter.normalize("NFKC").toLocaleLowerCase()).forEach((character) => {
        if (/[\p{L}\p{N}]/u.test(character)) {
          stream.push(character);
          positions.push({ itemIndex, characterIndex });
        } else {
          appendSpace(itemIndex, characterIndex);
        }
      });
    });
  });
  while (stream[stream.length - 1] === " ") {
    stream.pop();
    positions.pop();
  }

  const normalizedQuery = normalizePdfSearchText(query);
  if (normalizedQuery.length < 18 || !stream.length) return [];
  const compactPositions = positions.filter((_, index) => stream[index] !== " ");
  const candidates = [
    { text: stream.join(""), positions, query: normalizedQuery },
    { text: stream.filter((character) => character !== " ").join(""), positions: compactPositions, query: normalizedQuery.replaceAll(" ", "") },
  ];

  for (const candidate of candidates) {
    const matches: HighlightArea[] = [];
    let fromIndex = 0;
    let matchIndex = candidate.text.indexOf(candidate.query, fromIndex);
    while (matchIndex !== -1 && matches.length < 40) {
      const ranges = new Map<number, { start: number; end: number }>();
      candidate.positions.slice(matchIndex, matchIndex + candidate.query.length).forEach(({ itemIndex, characterIndex }) => {
        if (characterIndex < 0) return;
        const range = ranges.get(itemIndex);
        if (range) {
          range.start = Math.min(range.start, characterIndex);
          range.end = Math.max(range.end, characterIndex + 1);
        } else {
          ranges.set(itemIndex, { start: characterIndex, end: characterIndex + 1 });
        }
      });

      ranges.forEach((range, itemIndex) => {
        if (matches.length >= 40) return;
        const item = items[itemIndex];
        const characters = Array.from(item.str);
        if (!characters.length) return;
        const matrix = pdfjsLib.Util.transform(viewport.transform, item.transform as [number, number, number, number, number, number]);
        const fullWidth = Math.abs(item.width * viewport.scale);
        const fullHeight = Math.max(Math.abs(item.height * viewport.scale), Math.hypot(matrix[0], matrix[1]) * 0.75, 5);
        const startRatio = Math.max(0, Math.min(1, range.start / characters.length));
        const endRatio = Math.max(startRatio, Math.min(1, range.end / characters.length));
        const leftRatio = item.dir === "rtl" ? 1 - endRatio : startRatio;
        const widthRatio = Math.max(0.035, endRatio - startRatio);
        const width = Math.max(3, fullWidth * widthRatio);
        matches.push({
          id: `quote-${queryIndex}-${pageIndex}-${itemIndex}-${matchIndex}`,
          pageIndex,
          left: matrix[4] + fullWidth * leftRatio,
          top: matrix[5] - fullHeight * 0.92,
          width,
          height: fullHeight * 1.18,
          kind: "quote",
        });
      });
      fromIndex = matchIndex + candidate.query.length;
      matchIndex = candidate.text.indexOf(candidate.query, fromIndex);
    }
    if (matches.length) return matches;
  }
  return [];
}

const getSectionPageIndex = (section: ParsedSectionDto) => {
  const firstCoordinate = section.coordinates?.split(";")[0];
  const pageNumber = Number(firstCoordinate?.split(",")[0]);
  return Number.isFinite(pageNumber) && pageNumber > 0 ? pageNumber - 1 : 0;
};

function PdfPageThumbnail({
  pdf,
  pageNumber,
  observerRoot,
}: {
  pdf: pdfjsLib.PDFDocumentProxy;
  pageNumber: number;
  observerRoot: HTMLElement | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !observerRoot) return;
    let cancelled = false;
    let renderTask: pdfjsLib.RenderTask | undefined;

    const render = async () => {
      try {
        const page = await pdf.getPage(pageNumber);
        if (cancelled) return;
        const viewport = page.getViewport({ scale: 0.2 });
        const context = canvas.getContext("2d");
        if (!context) return;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        renderTask = page.render({ canvasContext: context, viewport });
        await renderTask.promise;
        if (!cancelled) setIsRendered(true);
      } catch {
        // A thumbnail is optional; the full page remains available in the reader.
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          void render();
        }
      },
      { root: observerRoot, rootMargin: "160px 0px" },
    );
    observer.observe(canvas);

    return () => {
      cancelled = true;
      observer.disconnect();
      renderTask?.cancel();
    };
  }, [observerRoot, pageNumber, pdf]);

  return (
    <div className="flex h-[116px] items-center justify-center overflow-hidden rounded-md bg-bg-secondary p-1.5">
      <canvas
        ref={canvasRef}
        aria-label={`Preview of page ${pageNumber}`}
        className={cn(
          "max-h-full max-w-full bg-white shadow-sm transition-opacity duration-200",
          isRendered ? "opacity-100" : "opacity-30",
        )}
      />
    </div>
  );
}

const PdfJsViewer = forwardRef<PdfJsViewerRef, PdfJsViewerProps>(
  (
    {
      fileUrl,
      documentTitle,
      coordinateStr,
      highlightQueries,
      sections = EMPTY_SECTIONS,
      activeSection,
      onSectionSelect,
      onPageLoad,
      scale = 1.25,
      allowDownload = true,
      initialFitMode,
    },
    ref,
  ) => {
    const [pdf, setPdf] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
    const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
    const [numPages, setNumPages] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [pageInfoMap, setPageInfoMap] = useState<
      Record<
        number,
        { viewport: pdfjsLib.PageViewport; offset: { x: number; y: number } }
      >
    >({});
    const [zoom, setZoom] = useState(scale);
    const [fitMode, setFitMode] = useState<FitMode>(initialFitMode ?? "free");
    const [activePage, setActivePage] = useState(1);
    const [pageInput, setPageInput] = useState("1");
    const [navigationMode, setNavigationMode] = useState<NavigationMode>(null);
    const [outline, setOutline] = useState<OutlineEntry[]>([]);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchInput, setSearchInput] = useState("");
    const [searchPages, setSearchPages] = useState<number[]>([]);
    const [searchResultIndex, setSearchResultIndex] = useState(0);
    const [isSearching, setIsSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [quoteHighlights, setQuoteHighlights] = useState<HighlightArea[]>([]);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [thumbnailRoot, setThumbnailRoot] = useState<HTMLDivElement | null>(null);

    const viewerRef = useRef<HTMLDivElement>(null);
    const textContentCacheRef = useRef(new Map<number, SearchablePdfTextItem[]>());
    const lastHighlightKeyRef = useRef("");
    const containerRef = useRef<HTMLDivElement>(null);
    const pageRefs = useRef<Record<number, HTMLDivElement | null>>({});
    const highlightRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const pendingPageRef = useRef<number | null>(null);
    const pendingFirstHighlightRef = useRef(false);
    const activePdf = loadedUrl === fileUrl ? pdf : null;
    const normalizedSections = sections ?? [];
    const queryList = highlightQueries ?? EMPTY_HIGHLIGHT_QUERIES;
    const coordinateHighlights = usePdfHighlights(coordinateStr, pageInfoMap);
    const highlightQueryKey = queryList.map((query) => `${query.role ?? ""}:${query.page ?? ""}:${query.text}`).join("\u001f");
    const highlights = useMemo(() => [...coordinateHighlights, ...quoteHighlights], [coordinateHighlights, quoteHighlights]);

    const sectionEntries = useMemo<OutlineEntry[]>(
      () =>
        normalizedSections
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((section) => ({
            title: section.sectionTitle,
            sectionTitle: section.sectionTitle,
            pageIndex: getSectionPageIndex(section),
            children: [],
          })),
      [normalizedSections],
    );
    const navigationEntries = outline.length > 0 ? outline : sectionEntries;
    const flattenedNavigationEntries = useMemo(() => {
      const flatten = (entries: OutlineEntry[]): OutlineEntry[] =>
        entries.flatMap((entry) => [entry, ...flatten(entry.children)]);
      return flatten(navigationEntries).sort((a, b) => a.pageIndex - b.pageIndex);
    }, [navigationEntries]);
    const documentName = useMemo(() => {
      if (documentTitle?.trim()) return documentTitle.trim();
      const rawName = fileUrl.split("/").pop()?.split("?")[0] || "PDF document";
      try {
        return decodeURIComponent(rawName);
      } catch {
        return rawName;
      }
    }, [documentTitle, fileUrl]);

    const scrollToPage = useCallback(
      (pageIndex: number) => {
        if (!Number.isFinite(pageIndex) || pageIndex < 0) return;
        pendingPageRef.current = pageIndex;
        const target = pageRefs.current[pageIndex];
        const container = containerRef.current;
        if (!target || !container) return;
        const top =
          container.scrollTop +
          target.getBoundingClientRect().top -
          container.getBoundingClientRect().top -
          12;
        container.scrollTo({ top, behavior: "smooth" });
        pendingPageRef.current = null;
        setActivePage(pageIndex + 1);
        setPageInput(String(pageIndex + 1));
      },
      [],
    );

    useImperativeHandle(ref, () => ({
      scrollToHighlight: (area) => {
        const element = highlightRefs.current[area.id];
        const container = containerRef.current;
        if (!element || !container) return;
        const top =
          container.scrollTop +
          element.getBoundingClientRect().top -
          container.getBoundingClientRect().top -
          container.clientHeight / 2;
        container.scrollTo({ top, behavior: "smooth" });
      },
      scrollToPage,
      scrollToFirstHighlight: () => {
        const area = quoteHighlights.find((item) => item.kind === "quote");
        const element = area ? highlightRefs.current[area.id] : null;
        const container = containerRef.current;
        if (!element || !container) {
          pendingFirstHighlightRef.current = true;
          return;
        }
        pendingFirstHighlightRef.current = false;
        const top = container.scrollTop + element.getBoundingClientRect().top - container.getBoundingClientRect().top - container.clientHeight / 2;
        container.scrollTo({ top, behavior: "smooth" });
      },
    }));

    useEffect(() => {
      const pendingPage = pendingPageRef.current;
      if (pendingPage === null || !pageInfoMap[pendingPage]) return;
      scrollToPage(pendingPage);
    }, [pageInfoMap, scrollToPage]);

    useEffect(() => {
      if (!pendingFirstHighlightRef.current || !quoteHighlights.length) return;
      const area = quoteHighlights.find((item) => item.kind === "quote");
      const element = area ? highlightRefs.current[area.id] : null;
      const container = containerRef.current;
      if (!element || !container) return;
      pendingFirstHighlightRef.current = false;
      const top = container.scrollTop + element.getBoundingClientRect().top - container.getBoundingClientRect().top - container.clientHeight / 2;
      container.scrollTo({ top, behavior: "smooth" });
    }, [quoteHighlights]);

    useEffect(() => {
      let isMounted = true;
      textContentCacheRef.current.clear();
      setError(null);
      setPdf(null);
      setLoadedUrl(null);
      setNumPages(0);
      setPageInfoMap({});
      pendingPageRef.current = null;
      pendingFirstHighlightRef.current = false;
      setActivePage(1);
      setPageInput("1");
      setFitMode(initialFitMode ?? "free");
      setZoom(scale);
      setOutline([]);
      setNavigationMode(null);
      setIsSearchOpen(false);
      setSearchInput("");
      setSearchPages([]);
      setSearchResultIndex(0);
      setHasSearched(false);
      setQuoteHighlights([]);

      const loadingTask = pdfjsLib.getDocument(fileUrl);
      const loadPdf = async () => {
        try {
          const pdfDoc = await loadingTask.promise;
          if (!isMounted) return;
          setPdf(pdfDoc);
          setNumPages(pdfDoc.numPages);
          setLoadedUrl(fileUrl);
          try {
            const rawOutline = (await pdfDoc.getOutline()) as
              | PdfOutlineNode[]
              | null;
            const resolveEntries = async (
              nodes: PdfOutlineNode[],
            ): Promise<OutlineEntry[]> =>
              Promise.all(
                nodes.map(async (node) => {
                  let destination = node.dest;
                  if (typeof destination === "string") {
                    destination = await pdfDoc.getDestination(destination);
                  }
                  let pageIndex = 0;
                  if (Array.isArray(destination) && destination[0]) {
                    try {
                      pageIndex = await pdfDoc.getPageIndex(destination[0] as never);
                    } catch {
                      pageIndex = 0;
                    }
                  }
                  return {
                    title: node.title?.trim() || "Untitled section",
                    pageIndex,
                    children: await resolveEntries(node.items ?? []),
                  };
                }),
              );
            const resolvedOutline = rawOutline?.length
              ? await resolveEntries(rawOutline)
              : [];
            if (isMounted) setOutline(resolvedOutline);
          } catch {
            if (isMounted) setOutline([]);
          }
        } catch (err: unknown) {
          if (isMounted) {
            console.error("Error loading PDF:", err);
            setError(
              err instanceof Error ? err.message : "Failed to load PDF document",
            );
          }
        }
      };

      void loadPdf();
      return () => {
        isMounted = false;
        void loadingTask.destroy();
      };
    }, [fileUrl, initialFitMode, scale]);

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
          const viewport = page.getViewport({ scale: zoom });
          const cropBox = page.view;
          info[i - 1] = {
            viewport,
            offset: { x: cropBox[0], y: cropBox[1] },
          };
          onPageLoad?.(i - 1, viewport);
        }
        if (!cancelled) setPageInfoMap(info);
      };
      void loadPageGeometry();
      return () => {
        cancelled = true;
      };
    }, [activePdf, numPages, onPageLoad, zoom]);

    useEffect(() => {
      if (!activePdf || !numPages || Object.keys(pageInfoMap).length !== numPages || !queryList.length) {
        setQuoteHighlights([]);
        return;
      }
      let cancelled = false;
      setQuoteHighlights([]);
      const findHighlights = async () => {
        const queries = queryList.filter((query) => normalizePdfSearchText(query.text).length >= 18);
        const allPageIndexes = Array.from({ length: numPages }, (_, index) => index);
        const areas: HighlightArea[] = [];
        const cache = textContentCacheRef.current;

        for (const [queryIndex, query] of queries.entries()) {
          if (cancelled) return;
          const preferredPageIndex = typeof query.page === "number" && query.page >= 1 && query.page <= numPages
            ? query.page - 1
            : -1;
          const candidatePages = preferredPageIndex >= 0
            ? [preferredPageIndex, ...allPageIndexes.filter((pageIndex) => pageIndex !== preferredPageIndex)]
            : allPageIndexes;

          for (const pageIndex of candidatePages) {
            if (cancelled) return;
            let items = cache.get(pageIndex);
            if (!items) {
              try {
                const page = await activePdf.getPage(pageIndex + 1);
                const content = await page.getTextContent();
                items = content.items.flatMap((item) => {
                  if (!("str" in item) || !("transform" in item)) return [];
                  return [{
                    str: item.str,
                    transform: item.transform,
                    width: item.width,
                    height: item.height,
                    dir: item.dir,
                  }];
                });
                cache.set(pageIndex, items);
              } catch {
                continue;
              }
            }
            const viewport = pageInfoMap[pageIndex]?.viewport;
            if (!viewport) continue;
            const matches = findQuoteAreas(items, query.text, pageIndex, viewport, queryIndex);
            if (matches.length) {
              areas.push(...matches.map((match) => ({ ...match, role: query.role })));
              break;
            }
          }
        }

        if (!cancelled) setQuoteHighlights(areas);
      };
      void findHighlights();
      return () => {
        cancelled = true;
      };
    }, [activePdf, highlightQueryKey, numPages, pageInfoMap, queryList]);

    useEffect(() => {
      const container = containerRef.current;
      if (!activePdf || !container || Object.keys(pageInfoMap).length !== numPages) {
        return;
      }
      const rendered = new Set<number>();
      const tasks = new Map<number, pdfjsLib.RenderTask>();
      let cancelled = false;
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            const pageNumber = Number(
              (entry.target as HTMLElement).dataset.pageNumber,
            );
            if (rendered.has(pageNumber)) continue;
            rendered.add(pageNumber);
            observer.unobserve(entry.target);
            void (async () => {
              try {
                const page = await activePdf.getPage(pageNumber);
                if (cancelled) return;
                const canvas = entry.target.querySelector("canvas");
                const viewport = pageInfoMap[pageNumber - 1]?.viewport;
                const context = canvas?.getContext("2d");
                if (!canvas || !viewport || !context) return;
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                const task = page.render({ canvasContext: context, viewport });
                tasks.set(pageNumber, task);
                await task.promise;
                tasks.delete(pageNumber);
              } catch (renderError) {
                if (!cancelled) {
                  console.error("Error rendering PDF page:", renderError);
                }
              }
            })();
          }
        },
        { root: container, rootMargin: "700px 0px" },
      );
      Object.values(pageRefs.current).forEach((element) => {
        if (element) observer.observe(element);
      });
      return () => {
        cancelled = true;
        observer.disconnect();
        tasks.forEach((task) => task.cancel());
      };
    }, [activePdf, numPages, pageInfoMap]);

    const currentNavigationEntry = [...flattenedNavigationEntries]
      .reverse()
      .find((entry) => entry.pageIndex + 1 <= activePage);
    const currentSectionTitle =
      currentNavigationEntry?.sectionTitle ?? currentNavigationEntry?.title;

    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;
      let frame = 0;
      const updatePage = () => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          const top = container.getBoundingClientRect().top;
          const visiblePages = Object.entries(pageRefs.current)
            .map(([index, element]) => ({
              index: Number(index),
              element,
            }))
            .filter(({ element }) => element !== null)
            .map(({ index, element }) => ({
              index,
              rect: element!.getBoundingClientRect(),
            }))
            .filter(({ rect }) => rect.bottom > top);
          const current = visiblePages.reduce<(typeof visiblePages)[number] | null>(
            (closest, page) =>
              !closest ||
              Math.abs(page.rect.top - top) < Math.abs(closest.rect.top - top)
                ? page
                : closest,
            null,
          );
          if (current) {
            const pageNumber = current.index + 1;
            setActivePage(pageNumber);
            setPageInput(String(pageNumber));
          }
        });
      };
      container.addEventListener("scroll", updatePage, { passive: true });
      updatePage();
      return () => {
        container.removeEventListener("scroll", updatePage);
        cancelAnimationFrame(frame);
      };
    }, [numPages, pageInfoMap]);

    useEffect(() => {
      const highlightKey = `${fileUrl}\u001e${coordinateStr ?? ""}\u001e${highlightQueryKey}\u001e${highlights.map((highlight) => highlight.id).join(",")}`;
      if (lastHighlightKeyRef.current === highlightKey) return;
      lastHighlightKeyRef.current = highlightKey;
      if (!highlights.length) return;
      const timer = window.setTimeout(() => {
        const element = highlightRefs.current[highlights[0].id];
        const container = containerRef.current;
        if (!element || !container) return;
        const top =
          container.scrollTop +
          element.getBoundingClientRect().top -
          container.getBoundingClientRect().top -
          container.clientHeight / 2;
        container.scrollTo({ top, behavior: "smooth" });
      }, 100);
      return () => window.clearTimeout(timer);
    }, [coordinateStr, fileUrl, highlightQueryKey, highlights]);

    useEffect(() => {
      if (fitMode === "free" || !activePdf) return;
      const container = containerRef.current;
      if (!container) return;
      let cancelled = false;
      const updateFit = async () => {
        try {
          const page = await activePdf.getPage(1);
          if (cancelled || !container.clientWidth || !container.clientHeight) return;
          const viewport = page.getViewport({ scale: 1 });
          const availableWidth = Math.max(240, container.clientWidth - 40);
          const availableHeight = Math.max(240, container.clientHeight - 40);
          const widthScale = availableWidth / viewport.width;
          const nextScale =
            fitMode === "width"
              ? widthScale
              : Math.min(widthScale, availableHeight / viewport.height);
          setZoom(Math.min(3, Math.max(0.4, nextScale)));
        } catch {
          // Keep the current zoom if the page geometry cannot be read.
        }
      };
      void updateFit();
      const observer = new ResizeObserver(() => void updateFit());
      observer.observe(container);
      return () => {
        cancelled = true;
        observer.disconnect();
      };
    }, [activePdf, fitMode]);

    useEffect(() => {
      const root = viewerRef.current;
      if (!root) return;
      const updateFullscreen = () =>
        setIsFullscreen(document.fullscreenElement === root);
      document.addEventListener("fullscreenchange", updateFullscreen);
      return () =>
        document.removeEventListener("fullscreenchange", updateFullscreen);
    }, []);

    const handleScrollToPage = (pageNumber: number) => {
      const clamped = Math.min(numPages, Math.max(1, pageNumber));
      scrollToPage(clamped - 1);
    };

    const handlePageSubmit = () => {
      const next = Number.parseInt(pageInput, 10);
      if (Number.isFinite(next)) handleScrollToPage(next);
      else setPageInput(String(activePage));
    };

    const updateZoom = (next: number) => {
      setFitMode("free");
      setZoom(Math.min(3, Math.max(0.4, next)));
    };

    const fitDocument = (mode: Exclude<FitMode, "free">) => {
      setFitMode(mode);
    };

    const searchDocument = async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!activePdf || !searchInput.trim()) return;
      setIsSearching(true);
      setHasSearched(true);
      const matches: number[] = [];
      try {
        for (let pageNumber = 1; pageNumber <= numPages; pageNumber++) {
          const page = await activePdf.getPage(pageNumber);
          const content = await page.getTextContent();
          const pageText = content.items
            .map((item) => ("str" in item ? item.str : ""))
            .join(" ");
          if (pageText.toLocaleLowerCase().includes(searchInput.trim().toLocaleLowerCase())) {
            matches.push(pageNumber);
          }
        }
        setSearchPages(matches);
        setSearchResultIndex(0);
        if (matches.length) handleScrollToPage(matches[0]);
      } catch {
        setSearchPages([]);
      } finally {
        setIsSearching(false);
      }
    };

    const moveSearchResult = (direction: -1 | 1) => {
      if (!searchPages.length) return;
      const next =
        (searchResultIndex + direction + searchPages.length) % searchPages.length;
      setSearchResultIndex(next);
      handleScrollToPage(searchPages[next]);
    };

    const toggleFullscreen = async () => {
      if (!viewerRef.current) return;
      if (document.fullscreenElement) await document.exitFullscreen();
      else await viewerRef.current.requestFullscreen();
    };

    const handleOutlineEntry = (entry: OutlineEntry) => {
      if (entry.sectionTitle) onSectionSelect?.(entry.sectionTitle);
      handleScrollToPage(entry.pageIndex + 1);
    };

    const renderOutlineEntries = (entries: OutlineEntry[], depth = 0) =>
      entries.map((entry, index) => {
        const isActive = entry.sectionTitle
          ? currentSectionTitle === entry.sectionTitle ||
            (!currentSectionTitle && activeSection === entry.sectionTitle)
          : currentSectionTitle === entry.title ||
            activePage === entry.pageIndex + 1;
        return (
          <div key={`${entry.title}-${entry.pageIndex}-${depth}-${index}`}>
            <button
              type="button"
              onClick={() => handleOutlineEntry(entry)}
              title={`${entry.title} · page ${entry.pageIndex + 1}`}
              className={cn(
                "flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition-colors",
                isActive
                  ? "bg-primary/10 font-medium text-primary"
                  : "text-text-secondary hover:bg-bg-secondary hover:text-text-primary",
              )}
              style={{ paddingLeft: `${10 + depth * 14}px` }}
            >
              <span className="min-w-0 flex-1 truncate">{entry.title}</span>
              <span className="shrink-0 text-[10px] tabular-nums text-text-secondary">
                {entry.pageIndex + 1}
              </span>
            </button>
            {entry.children.length > 0 &&
              renderOutlineEntries(entry.children, depth + 1)}
          </div>
        );
      });

    if (error) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-3 bg-bg-secondary p-8 text-center text-text-secondary">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-error/10 text-error">
            <FileText className="h-6 w-6" />
          </div>
          <div className="text-sm font-semibold text-text-primary">
            Unable to display PDF preview
          </div>
          <p className="max-w-md text-xs text-text-secondary">
            {error.includes("401") || error.includes("Missing PDF")
              ? "Access to the PDF was denied or the document URL is no longer valid."
              : error}
          </p>
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-semibold text-white transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 motion-reduce:transition-none"
          >
            Open PDF <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      );
    }

    if (!activePdf || Object.keys(pageInfoMap).length !== numPages) {
      return (
        <div role="status" aria-live="polite" className="flex h-full items-center justify-center bg-bg-secondary text-sm text-text-secondary">
          <span aria-hidden="true" className="mr-2 h-4 w-4 rounded-full border-2 border-border border-t-primary motion-safe:animate-spin motion-reduce:animate-none" />
          Loading document…
        </div>
      );
    }

    const activeZoomPercent = Math.round(zoom * 100);
    return (
      <div
        ref={viewerRef}
        className="pdf-viewer-container flex h-full min-h-0 w-full flex-col overflow-hidden bg-bg-secondary text-text-primary"
      >
        <header className="pdf-reader-toolbar z-10 flex shrink-0 flex-wrap items-center gap-2 border-b border-border bg-surface-white px-3 py-2 shadow-sm sm:px-4 lg:h-14 lg:flex-nowrap lg:py-0">
          <div className="pdf-reader-title flex min-w-0 flex-1 items-center gap-2 lg:max-w-[23%]">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileText className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p title={documentName} className="truncate text-xs font-semibold text-text-primary">
                {documentName}
              </p>
              <p className="text-[10px] text-text-secondary">
                {numPages} {numPages === 1 ? "page" : "pages"}
              </p>
            </div>
          </div>

          <div className="pdf-reader-controls flex min-w-0 flex-wrap items-center justify-start gap-1.5 lg:flex-none">
            <button
              type="button"
              onClick={() => handleScrollToPage(activePage - 1)}
              disabled={activePage <= 1}
              title="Previous page"
              aria-label="Previous page"
              className="reader-icon-button"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <form
              className="flex items-center gap-1 text-xs text-text-secondary"
              onSubmit={(event) => {
                event.preventDefault();
                handlePageSubmit();
              }}
            >
              <input
                aria-label="Current page"
                value={pageInput}
                onChange={(event) => setPageInput(event.target.value)}
                onBlur={handlePageSubmit}
                onKeyDown={(event) => {
                  if (event.key === "Escape") setPageInput(String(activePage));
                }}
                inputMode="numeric"
                className="h-11 w-11 rounded-lg border border-border bg-surface-white text-center text-xs font-medium tabular-nums outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <span className="whitespace-nowrap">/ {numPages}</span>
            </form>
            <button
              type="button"
              onClick={() => handleScrollToPage(activePage + 1)}
              disabled={activePage >= numPages}
              title="Next page"
              aria-label="Next page"
              className="reader-icon-button"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            <span className="mx-1 hidden h-5 w-px bg-border sm:block" />
            <button
              type="button"
              onClick={() => updateZoom(zoom - 0.1)}
              title="Zoom out"
              aria-label="Zoom out"
              className="reader-icon-button"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <Select
              value={activeZoomPercent}
              aria-label="Zoom percentage"
              onChange={(event) => updateZoom(Number(event.target.value) / 100)}
              className="h-11 rounded-lg border border-border bg-surface-white px-2 text-xs font-medium text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              {!ZOOM_LEVELS.includes(activeZoomPercent) && (
                <option value={activeZoomPercent}>{activeZoomPercent}%</option>
              )}
              {ZOOM_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}%
                </option>
              ))}
            </Select>
            <button
              type="button"
              onClick={() => updateZoom(zoom + 0.1)}
              title="Zoom in"
              aria-label="Zoom in"
              className="reader-icon-button"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => fitDocument("width")}
              title="Fit width"
              aria-label="Fit width"
              className={cn("reader-text-button pdf-reader-fit-control", fitMode === "width" && "reader-control-active")}
            >
              <ChevronsLeftRight className="h-3.5 w-3.5" />
              <span className="pdf-reader-fit-label">Fit width</span>
            </button>
            <button
              type="button"
              onClick={() => fitDocument("page")}
              title="Fit page"
              aria-label="Fit page"
              className={cn("reader-text-button pdf-reader-fit-control", fitMode === "page" && "reader-control-active")}
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span className="pdf-reader-fit-label">Fit page</span>
            </button>
          </div>

          <div className="pdf-reader-actions flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setIsSearchOpen((open) => !open);
                setNavigationMode(null);
              }}
              title="Search inside PDF"
              aria-label="Search inside PDF"
              aria-pressed={isSearchOpen}
              className={cn("reader-icon-button", isSearchOpen && "reader-control-active")}
            >
              <Search className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSearchOpen(false);
                setNavigationMode((mode) => (mode === "outline" ? null : "outline"));
              }}
              title="Toggle document outline"
              aria-label="Toggle document outline"
              aria-pressed={navigationMode === "outline"}
              className={cn("reader-icon-button pdf-reader-hide-compact", navigationMode === "outline" && "reader-control-active")}
            >
              <ListTree className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSearchOpen(false);
                setNavigationMode((mode) => (mode === "thumbnails" ? null : "thumbnails"));
              }}
              title="Toggle page thumbnails"
              aria-label="Toggle page thumbnails"
              aria-pressed={navigationMode === "thumbnails"}
              className={cn("reader-icon-button pdf-reader-hide-compact", navigationMode === "thumbnails" && "reader-control-active")}
            >
              <Grid2X2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => void toggleFullscreen()}
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen reading mode"}
              aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen reading mode"}
              className="reader-icon-button"
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </button>
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Open PDF in a new tab"
              aria-label="Open PDF in a new tab"
              className="reader-icon-button pdf-reader-hide-compact"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
            {allowDownload && (
              <a
                href={fileUrl}
                download
                title="Download PDF"
                aria-label="Download PDF"
                className="reader-icon-button pdf-reader-hide-compact hidden sm:inline-flex"
              >
                <Download className="h-4 w-4" />
              </a>
            )}
          </div>
        </header>

        {isSearchOpen && (
          <form
            onSubmit={searchDocument}
            className="flex shrink-0 items-center gap-2 border-b border-border bg-surface-white px-4 py-2"
          >
            <Search className="h-4 w-4 shrink-0 text-text-secondary" />
            <input
              autoFocus
              value={searchInput}
              onChange={(event) => {
                setSearchInput(event.target.value);
                setSearchPages([]);
                setSearchResultIndex(0);
                setHasSearched(false);
              }}
              placeholder="Search text in this document…"
              aria-label="Search text in PDF"
              className="h-11 min-w-0 flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-secondary"
            />
            {searchPages.length > 0 && (
              <>
                <span className="whitespace-nowrap text-xs tabular-nums text-text-secondary">
                  {searchResultIndex + 1} / {searchPages.length} pages
                </span>
                <button type="button" onClick={() => moveSearchResult(-1)} className="reader-icon-button" title="Previous match">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => moveSearchResult(1)} className="reader-icon-button" title="Next match">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}
            {isSearching && <span className="text-xs text-text-secondary">Searching…</span>}
            {!isSearching && hasSearched && searchInput && searchPages.length === 0 && (
              <span className="whitespace-nowrap text-xs text-text-secondary">No matches</span>
            )}
            {!isSearching && searchInput && searchPages.length === 0 && (
              <button type="submit" className="min-h-11 shrink-0 rounded-lg bg-primary px-3 text-xs font-semibold text-white transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 motion-reduce:transition-none">
                Search
              </button>
            )}
            <button type="button" onClick={() => setIsSearchOpen(false)} title="Close search" aria-label="Close search" className="reader-icon-button">
              <X className="h-4 w-4" />
            </button>
          </form>
        )}

        <div className="flex min-h-0 flex-1">
          {navigationMode && (
            <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-surface-white sm:w-64">
              <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
                <div className="min-w-0">
                  <h2 className="text-xs font-semibold text-text-primary">
                    {navigationMode === "outline" ? "Document outline" : "Page thumbnails"}
                  </h2>
                  {navigationMode === "outline" && currentSectionTitle && (
                    <p title={currentSectionTitle} className="mt-0.5 truncate text-[10px] text-text-secondary">
                      {currentSectionTitle}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setNavigationMode(null)}
                  title="Close navigation panel"
                  aria-label="Close navigation panel"
                  className="reader-icon-button"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div
                ref={setThumbnailRoot}
                className="custom-scrollbar min-h-0 flex-1 space-y-1 overflow-y-auto p-2"
              >
                {navigationMode === "outline" ? (
                  navigationEntries.length ? (
                    renderOutlineEntries(navigationEntries)
                  ) : (
                    <div className="flex h-full min-h-40 flex-col items-center justify-center px-4 text-center">
                      <ListTree className="mb-2 h-5 w-5 text-text-secondary" />
                      <p className="text-xs font-medium text-text-primary">No outline available</p>
                      <p className="mt-1 text-[11px] leading-relaxed text-text-secondary">
                        This PDF has no bookmarks or detected section headings.
                      </p>
                    </div>
                  )
                ) : (
                  Array.from({ length: numPages }, (_, pageIndex) => (
                    <button
                      key={pageIndex}
                      type="button"
                      onClick={() => handleScrollToPage(pageIndex + 1)}
                      aria-current={activePage === pageIndex + 1 ? "page" : undefined}
                      className={cn(
                        "group w-full rounded-lg border p-2 text-left transition-colors",
                        activePage === pageIndex + 1
                          ? "border-primary/30 bg-primary/5"
                          : "border-transparent hover:border-border hover:bg-bg-secondary",
                      )}
                    >
                      <PdfPageThumbnail
                        pdf={activePdf}
                        pageNumber={pageIndex + 1}
                        observerRoot={thumbnailRoot}
                      />
                      <span className="mt-1.5 block text-center text-[10px] font-medium tabular-nums text-text-secondary">
                        Page {pageIndex + 1}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </aside>
          )}

          <div
            ref={containerRef}
            className="min-h-0 min-w-0 flex-1 overflow-auto bg-bg-secondary p-3 scroll-smooth sm:p-5"
          >
            <div className="mx-auto flex w-fit min-w-full flex-col items-center gap-4 pb-4">
              {Array.from({ length: numPages }, (_, pageIndex) => {
                const viewport = pageInfoMap[pageIndex]?.viewport;
                const pageHighlights = highlights.filter(
                  (highlight) => highlight.pageIndex === pageIndex,
                );
                return (
                  <div
                    key={pageIndex + 1}
                    ref={(element) => {
                      pageRefs.current[pageIndex] = element;
                    }}
                    data-page-number={pageIndex + 1}
        className="relative shrink-0 bg-white shadow-[0_4px_18px_rgba(15,23,42,0.12)] ring-1 ring-text-primary/5"
                    style={{
                      width: viewport?.width || "auto",
                      height: viewport?.height || "auto",
                    }}
                  >
                    <canvas id={`pdf-canvas-${pageIndex + 1}`} className="block" />
                    <div className="pointer-events-none absolute inset-0">
                      {pageHighlights.map((highlight) => (
                        <div
                          key={highlight.id}
                          ref={(element) => {
                            highlightRefs.current[highlight.id] = element;
                          }}
                          className={cn("absolute rounded-sm border transition-opacity duration-300 motion-reduce:transition-none", highlight.kind === "quote" ? quoteHighlightClass(highlight.role) : "border-primary/40 bg-primary/25")}
                          style={{
                            left: highlight.left,
                            top: highlight.top,
                            width: highlight.width,
                            height: highlight.height,
                          }}
                        />
                      ))}
                    </div>
                    <div className="pointer-events-none absolute bottom-2 right-2 rounded-md bg-text-primary/80 px-2 py-1 text-[10px] font-medium tabular-nums text-white backdrop-blur-sm">
                      {pageIndex + 1} / {numPages}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <style>{`
          .pdf-viewer-container { container-type: inline-size; }
          .reader-icon-button { display: inline-flex; height: 2.75rem; min-height: 2.75rem; width: 2.75rem; min-width: 2.75rem; flex-shrink: 0; align-items: center; justify-content: center; border-radius: var(--radius-control); color: var(--color-text-secondary); transition: color 150ms, background-color 150ms, border-color 150ms; }
          .reader-icon-button:hover:not(:disabled) { background: var(--color-bg-secondary); color: var(--color-text-primary); }
          .reader-icon-button:disabled { cursor: not-allowed; opacity: 0.35; }
          .reader-icon-button:focus-visible, .reader-text-button:focus-visible { outline: 2px solid var(--color-border-focus); outline-offset: 2px; }
          .reader-text-button { display: inline-flex; min-height: 2.75rem; align-items: center; gap: 0.35rem; white-space: nowrap; border-radius: var(--radius-control); padding: 0 0.65rem; color: var(--color-text-secondary); font-size: 0.7rem; font-weight: 500; transition: color 150ms, background-color 150ms; }
          .reader-text-button:hover { background: var(--color-bg-secondary); color: var(--color-text-primary); }
          .reader-control-active { background: var(--color-primary-light); color: var(--color-primary-hover); }
          @container (max-width: 1100px) {
            .pdf-reader-toolbar { flex-wrap: nowrap; gap: 0.375rem; padding-inline: 0.625rem; }
            .pdf-reader-title { display: none; }
            .pdf-reader-controls { flex: 0 1 auto; min-width: 0; flex-wrap: nowrap; justify-content: flex-start; gap: 0.125rem; }
            .pdf-reader-actions { flex: 0 0 auto; gap: 0; margin-left: 0; }
          }
          @container (max-width: 900px) { .pdf-reader-hide-compact { display: none !important; } }
          @container (max-width: 760px) {
            .pdf-reader-toolbar { flex-wrap: nowrap; gap: 0.25rem; padding-inline: 0.5rem; }
            .pdf-reader-controls { flex: 0 1 auto; min-width: 0; flex-wrap: nowrap; justify-content: flex-start; gap: 0.125rem; }
            .pdf-reader-actions { flex: 0 0 auto; gap: 0; }
            .pdf-reader-toolbar .reader-icon-button { height: 2.125rem; min-height: 2.125rem; width: 2.125rem; min-width: 2.125rem; }
            .pdf-reader-toolbar form { flex-shrink: 0; gap: 0.125rem; }
            .pdf-reader-toolbar form input { height: 2.125rem; width: 2.25rem; }
            .pdf-reader-toolbar select { flex: 0 0 3.25rem; height: 2.125rem; max-width: 3.25rem; padding-inline: 0.25rem; }
            .pdf-reader-fit-control { flex-shrink: 0; min-height: 2.125rem; gap: 0; padding-inline: 0.375rem; }
            .pdf-reader-fit-label { display: none; }
          }
          @container (max-width: 460px) {
            .pdf-reader-toolbar { height: auto; min-height: 0; flex-wrap: wrap; row-gap: 0; padding-block: 0.375rem; }
            .pdf-reader-controls { order: 2; flex: 1 1 100%; justify-content: space-between; }
            .pdf-reader-actions { order: 1; flex: 1 1 auto; justify-content: flex-end; margin-left: 0; }
            .pdf-reader-toolbar .reader-icon-button { height: 1.75rem; min-height: 1.75rem; width: 1.75rem; min-width: 1.75rem; }
            .pdf-reader-toolbar form input { height: 1.75rem; width: 2rem; }
            .pdf-reader-toolbar select { flex-basis: 2.875rem; height: 1.75rem; max-width: 2.875rem; }
            .pdf-reader-fit-control { min-height: 1.75rem; padding-inline: 0.25rem; }
            .pdf-reader-toolbar > .pdf-reader-controls > span { display: none; }
          }
          @media (prefers-reduced-motion: reduce) { .reader-icon-button, .reader-text-button { transition: none; } }
        `}</style>
      </div>
    );
  },
);

PdfJsViewer.displayName = "PdfJsViewer";

export default PdfJsViewer;
