import { useMemo } from "react";

export interface PdfCoordinate {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface HighlightArea {
  id: string;
  pageIndex: number;
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * Hook to parse and transform GROBID PDF coordinates into DOM-ready pixel values.
 */
export const usePdfHighlights = (
  coordinateStr: string | null | undefined,
  pageInfoMap: Record<number, { viewport: any; offset: { x: number; y: number } }>,
) => {
  return useMemo(() => {
    if (!coordinateStr || Object.keys(pageInfoMap).length === 0) return [];

    const rawCoords: PdfCoordinate[] = coordinateStr
      .split(";")
      .filter(Boolean)
      .map((part) => {
        const [page, x, y, w, h] = part.split(",").map(Number);
        return { page, x, y, width: w, height: h };
      });

    const transformedAreas: HighlightArea[] = rawCoords
      .map((coord, idx) => {
        const pageIndex = coord.page - 1;
        const pageInfo = pageInfoMap[pageIndex];

        if (!pageInfo) return null;

        const { viewport, offset } = pageInfo;

        // 1. Correct for CropBox offset
        const correctedX = coord.x - offset.x;
        const correctedY = coord.y - offset.y;

        // 2. Flip Y-axis: GROBID (top-left) -> PDF (bottom-left)
        // If the highlight is shifted down by one line, it means GROBID's 'y'
        // is likely the BOTTOM of the box in top-down coordinates.
        const pageHeight = viewport.viewBox[3];
        const pdfY = pageHeight - correctedY;

        // 3. Use PDF.js native conversion
        const rect = viewport.convertToViewportRectangle([
          correctedX,
          pdfY,
          correctedX + coord.width,
          pdfY + coord.height,
        ]);

        return {
          id: `${coord.page}-${idx}`,
          pageIndex,
          left: rect[0],
          top: rect[1],
          width: Math.abs(rect[2] - rect[0]),
          height: Math.abs(rect[3] - rect[1]),
        };
      })
      .filter((area): area is HighlightArea => area !== null);

    return transformedAreas;
  }, [coordinateStr, pageInfoMap]);
};
