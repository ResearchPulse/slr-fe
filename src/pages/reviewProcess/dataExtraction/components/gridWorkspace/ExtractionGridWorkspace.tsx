import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChevronDown, Download, FileSpreadsheet, FileText, RefreshCw } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { AgGridReact } from "ag-grid-react";
import type {
  ColDef,
  ICellRendererParams,
  ValueFormatterParams,
} from "ag-grid-community";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import Button from "../../../../../components/ui/Button";
import { useReviewProcess } from "../../../../../hooks/useReviewProcesses";
import { useDataExtractionWorkspace } from "../../hooks/useDataExtractionWorkspace";
import { dataExtractionConductingService } from "../../../../../services/dataExtractionConductingService";
import type {
  ExtractionEditableGridDto,
  ExtractionGridCellDto,
  ExtractionGridColumnMetaDto,
  ExtractionGridRowDto,
  UpdateGridCellRequestDto,
  GridFieldOptionDto,
  ExtractionTemplateResponseDto,
  ExtractionTemplateDto,
  ExtractionFieldDto,
} from "../../../../../types/dataExtraction";
import { getErrorMessage } from "../../../../../utils/errorUtils";
import { toastError, toastSuccess } from "../../../../../utils/toast";
import EditableGridCell from "./EditableGridCell";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import "./ExtractionGridWorkspace.css";

ModuleRegistry.registerModules([AllCommunityModule]);

const GRID_QUERY_KEY = ["data-extraction-conducting", "editable-grid"] as const;
const MIN_GRID_ROW_HEIGHT = 44;
const MAX_GRID_ROW_HEIGHT = 140;
const DEFAULT_GRID_ROW_HEIGHT = 56;

interface AgGridRowData {
  id: string;
  citation: string;
  paperTitle: string;
  citationPaper: string;
  __cellMeta: Record<string, ExtractionGridCellDto>;
  [key: string]: unknown;
}

function createEmptyGrid(): ExtractionEditableGridDto {
  return {
    columns: [],
    rows: [],
  };
}

function normalizeGridPayload(payload: unknown): ExtractionEditableGridDto {
  const data = payload as Record<string, unknown>;
  const rawColumns = (data.columns ?? data.Columns) as unknown[] | undefined;
  const rawRows = (data.rows ?? data.Rows) as unknown[] | undefined;

  const columns: ExtractionGridColumnMetaDto[] = (rawColumns ?? []).map((rawColumn) => {
    const column = rawColumn as Record<string, unknown>;
    const rawOptions = (column.options ?? column.Options ?? []) as unknown[];

    return {
      fieldId: String(column.fieldId ?? column.FieldId ?? ""),
      headerName: String(column.headerName ?? column.HeaderName ?? ""),
      sectionName: String(column.sectionName ?? column.SectionName ?? ""),
      displayFieldName: String(column.displayFieldName ?? column.DisplayFieldName ?? ""),
      fieldType: String(column.fieldType ?? column.FieldType ?? "Text"),
      options: rawOptions.map((rawOption) => {
        const option = rawOption as Record<string, unknown>;

        return {
          optionId: String(option.optionId ?? option.OptionId ?? ""),
          value: String(option.value ?? option.Value ?? ""),
        };
      }),
    };
  });

  const rows: ExtractionGridRowDto[] = (rawRows ?? []).map((rawRow, rowIndex) => {
    const row = rawRow as Record<string, unknown>;
    const rowId = String(row.rowId ?? row.RowId ?? `row-${rowIndex}`);
    const paperTitle = String(row.paperTitle ?? row.PaperTitle ?? "");
    const citation = String(row.citation ?? row.Citation ?? "");
    const rawCells = (row.cells ?? row.Cells ?? {}) as Record<string, unknown>;

    const cells = Object.entries(rawCells).reduce<Record<string, ExtractionGridCellDto>>(
      (accumulator, [header, rawCell]) => {
        const cell = (rawCell ?? {}) as Record<string, unknown>;

        accumulator[header] = {
          paperId: (cell.paperId ?? cell.PaperId ?? null) as string | null,
          fieldId: (cell.fieldId ?? cell.FieldId ?? null) as string | null,
          matrixColumnId: (cell.matrixColumnId ?? cell.MatrixColumnId ?? null) as string | null,
          matrixRowIndex: (cell.matrixRowIndex ?? cell.MatrixRowIndex ?? null) as number | null,
          value: (cell.value ?? cell.Value ?? "") as string | null,
          isNotReported: Boolean(cell.isNotReported ?? cell.IsNotReported ?? false),
          fieldType: (cell.fieldType ?? cell.FieldType ?? null) as string | null,
        };

        return accumulator;
      },
      {}
    );

    return {
      rowId,
      paperTitle,
      citation,
      cells,
    };
  });

  return {
    columns,
    rows,
  };
}

function getColumnFieldKey(column: ExtractionGridColumnMetaDto, columnIndex: number): string {
  return `${column.fieldId || "field"}_${columnIndex}`;
}

function groupColumnsBySection(
  columns: ExtractionGridColumnMetaDto[]
): Map<string, Array<{ column: ExtractionGridColumnMetaDto; index: number }>> {
  const groups = new Map<string, Array<{ column: ExtractionGridColumnMetaDto; index: number }>>();

  columns.forEach((column, index) => {
    const sectionKey = column.sectionName || "Ungrouped";
    if (!groups.has(sectionKey)) {
      groups.set(sectionKey, []);
    }
    groups.get(sectionKey)!.push({ column, index });
  });

  return groups;
}

/**
 * Enriches grid column metadata with full field options from the template.
 * This ensures that multi-select and single-select fields show all available options,
 * not just the ones currently selected.
 */
function enrichColumnsWithTemplateOptions(
  columns: ExtractionGridColumnMetaDto[],
  selectedTemplate: (ExtractionTemplateDto | ExtractionTemplateResponseDto) | null
): ExtractionGridColumnMetaDto[] {
  if (!selectedTemplate) {
    return columns;
  }

  // Flatten all fields from the template to find options by fieldId
  const fieldMap = new Map<string, ExtractionFieldDto>();

  const flattenFields = (fields: ExtractionFieldDto[]) => {
    fields.forEach((field) => {
      fieldMap.set(field.fieldId ?? "", field);
      if (field.subFields && field.subFields.length > 0) {
        flattenFields(field.subFields);
      }
    });
  };

  // Get all fields from sections
  if (selectedTemplate.sections) {
    selectedTemplate.sections.forEach((section) => {
      if (section.fields) {
        flattenFields(section.fields);
      }
    });
  } else if (selectedTemplate.fields) {
    flattenFields(selectedTemplate.fields);
  }

  // Enrich columns with template field options
  return columns.map((column) => {
    const templateField = fieldMap.get(column.fieldId);

    // If we found the template field and it has options, use those instead
    if (
      templateField &&
      templateField.options &&
      templateField.options.length > 0
    ) {
      return {
        ...column,
        options: templateField.options as GridFieldOptionDto[],
      };
    }

    return column;
  });
}

export default function ExtractionGridWorkspace() {
  const navigate = useNavigate();
  const { projectId, processId } = useParams<{ projectId: string; processId: string }>();
  const { process } = useReviewProcess(processId);
  const { selectedTemplate } = useDataExtractionWorkspace();
  const extractionProcessId = process?.dataExtractionProcess?.id;
  const [gridData, setGridData] = useState<ExtractionEditableGridDto>(createEmptyGrid);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [savingCells, setSavingCells] = useState<Record<string, boolean>>({});
  const [rowHeight, setRowHeight] = useState(DEFAULT_GRID_ROW_HEIGHT);
  const exportMenuRef = useRef<HTMLDivElement | null>(null);
  const exportMenuPanelRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<AgGridReact<AgGridRowData> | null>(null);
  const [exportMenuPosition, setExportMenuPosition] = useState({
    top: 0,
    left: 0,
    minWidth: 0,
  });

  const dashboardPath = useMemo(() => {
    if (!projectId || !processId) {
      return "/projects";
    }

    return `/projects/${projectId}/processes/${processId}/extraction`;
  }, [processId, projectId]);

  const gridQuery = useQuery({
    queryKey: [...GRID_QUERY_KEY, extractionProcessId],
    queryFn: async () => {
      if (!extractionProcessId) {
        throw new Error("Data extraction process ID is required to load editable grid");
      }

      const response = await dataExtractionConductingService.getEditableGrid(extractionProcessId);

      if (!response.isSuccess || !response.data) {
        throw new Error(response.message || "Failed to load editable grid");
      }

      return normalizeGridPayload(response.data);
    },
    enabled: !!extractionProcessId,
    staleTime: 0,
  });

  useEffect(() => {
    if (gridQuery.data) {
      setGridData(gridQuery.data);
    }
  }, [gridQuery.data]);

  const updateGridCellMutation = useMutation({
    mutationFn: async (payload: UpdateGridCellRequestDto) => {
      if (!extractionProcessId) {
        throw new Error("Data extraction process ID is required to update editable grid cells");
      }

      const response = await dataExtractionConductingService.updateGridCell(
        extractionProcessId,
        payload
      );

      if (!response.isSuccess) {
        throw new Error(response.message || "Failed to update grid cell");
      }

      return response;
    },
    onError: (error) => {
      toastError("Failed to save cell", getErrorMessage(error, "Unable to save this cell right now."));
    },
  });

  // Enrich grid data with template field options
  const enrichedGridData = useMemo(() => {
    const enrichedColumns = enrichColumnsWithTemplateOptions(gridData.columns, selectedTemplate);
    return {
      ...gridData,
      columns: enrichedColumns,
    };
  }, [gridData, selectedTemplate]);

  const agRowData = useMemo<AgGridRowData[]>(() => {
    return enrichedGridData.rows.map((row, rowIndex) => {
      const dynamicValues: Record<string, unknown> = {};
      const cellMeta: Record<string, ExtractionGridCellDto> = {};

      enrichedGridData.columns.forEach((column, columnIndex) => {
        const fieldKey = getColumnFieldKey(column, columnIndex);
        const cell = row.cells[column.headerName] ?? {
          paperId: null,
          fieldId: column.fieldId,
          matrixColumnId: null,
          matrixRowIndex: null,
          value: "",
          isNotReported: false,
          fieldType: column.fieldType,
        };

        dynamicValues[fieldKey] = cell.isNotReported ? "NR" : (cell.value ?? "");
        cellMeta[fieldKey] = cell;
      });

      return {
        id: row.rowId || `grid-row-${rowIndex}`,
        citation: row.citation || "-",
        paperTitle: row.paperTitle || "Untitled paper",
        citationPaper: `${row.citation || "-"} | ${row.paperTitle || "Untitled paper"}`,
        __cellMeta: cellMeta,
        ...dynamicValues,
      };
    });
  }, [enrichedGridData.columns, enrichedGridData.rows]);

  const defaultColDef = useMemo<ColDef<AgGridRowData>>(
    () => ({
      resizable: true,
      sortable: true,
      filter: true,
      minWidth: 140,
      flex: 1,
    }),
    []
  );

  const buildSavingCellKey = useCallback((rowId: string, fieldKey: string): string => {
    return `${rowId}::${fieldKey}`;
  }, []);

  const handleRefreshGrid = useCallback(async () => {
    await gridQuery.refetch();
  }, [gridQuery]);

  const handleSaveCell = useCallback(
    async (
      rowId: string,
      fieldKey: string,
      headerName: string,
      nextValue: string,
      isNotReported: boolean,
      cell: ExtractionGridCellDto
    ) => {
      if (!cell.paperId || !cell.fieldId) {
        return;
      }

      const savingKey = buildSavingCellKey(rowId, fieldKey);
      setSavingCells((previous) => ({
        ...previous,
        [savingKey]: true,
      }));

      const normalizedValue = nextValue.trim();
      const requestPayload: UpdateGridCellRequestDto = {
        paperId: cell.paperId,
        fieldId: cell.fieldId,
        matrixColumnId: cell.matrixColumnId,
        matrixRowIndex: cell.matrixRowIndex,
        newValue: isNotReported ? null : normalizedValue || null,
        isNotReported,
      };

      try {
        await updateGridCellMutation.mutateAsync(requestPayload);

        setGridData((previous) => ({
          ...previous,
          rows: previous.rows.map((row) => {
            if (row.rowId !== rowId) {
              return row;
            }

            const targetCell = row.cells[headerName] ?? null;
            if (!targetCell) {
              return row;
            }

            return {
              ...row,
              cells: {
                ...row.cells,
                [headerName]: {
                  ...targetCell,
                  value: isNotReported ? null : normalizedValue || null,
                  isNotReported,
                },
              },
            };
          }),
        }));

        toastSuccess("Cell updated");
      } finally {
        setSavingCells((previous) => {
          const next = { ...previous };
          delete next[savingKey];
          return next;
        });
      }
    },
    [buildSavingCellKey, updateGridCellMutation]
  );

  const columnDefs = useMemo<ColDef<AgGridRowData>[]>(() => {
    const pinnedColumn: ColDef<AgGridRowData> = {
      headerName: "Citation / Paper",
      field: "citationPaper",
      pinned: "left",
      editable: false,
      minWidth: 300,
      maxWidth: 460,
      cellClass: "font-medium",
      tooltipValueGetter: (params) =>
        `${params.data?.citation || "-"}\n${params.data?.paperTitle || "Untitled paper"}`,
      valueFormatter: (params: ValueFormatterParams<AgGridRowData>) => {
        const citation = params.data?.citation || "-";
        const title = params.data?.paperTitle || "Untitled paper";
        return `${citation} | ${title}`;
      },
    };

    // Helper function to create a column definition for a single field
    const createFieldColDef = (
      column: ExtractionGridColumnMetaDto,
      columnIndex: number
    ): ColDef<AgGridRowData> => {
      const fieldKey = getColumnFieldKey(column, columnIndex);
      const fieldType = (column.fieldType || "Text").trim().toLowerCase();

      const baseColDef: ColDef<AgGridRowData> = {
        headerName: column.displayFieldName,
        field: fieldKey,
        editable: false,
        minWidth: 180,
        cellRenderer: (params: ICellRendererParams<AgGridRowData>) => {
          const rowId = params.data?.id;
          const cell = params.data?.__cellMeta?.[fieldKey];

          if (!rowId || !cell) {
            return null;
          }

          const isSaving = Boolean(savingCells[buildSavingCellKey(rowId, fieldKey)]);

          return (
            <EditableGridCell
              extractionProcessId={extractionProcessId}
              cell={cell}
              columnMeta={column}
              rowHeight={rowHeight}
              isSaving={isSaving}
              onSave={(nextValue, isNotReported, targetCell) =>
                handleSaveCell(
                  rowId,
                  fieldKey,
                  column.headerName,
                  nextValue,
                  isNotReported,
                  targetCell
                )
              }
            />
          );
        },
      };

      if (fieldType === "integer" || fieldType === "decimal") {
        return baseColDef;
      }

      if (fieldType === "boolean") {
        return {
          ...baseColDef,
          valueFormatter: (params: ValueFormatterParams<AgGridRowData>) => {
            const value = String(params.value ?? "").trim().toLowerCase();
            if (value === "true" || value === "yes") {
              return "True";
            }
            if (value === "false" || value === "no") {
              return "False";
            }
            return "";
          },
        };
      }

      if (fieldType === "singleselect") {
        return baseColDef;
      }

      return baseColDef;
    };

    // Group columns by section
    const columnsBySection = groupColumnsBySection(enrichedGridData.columns);

    // Build grouped column definitions
    const groupedColumnDefs: ColDef<AgGridRowData>[] = Array.from(columnsBySection.entries()).map(
      ([sectionName, columnsInSection]) => ({
        headerName: sectionName,
        children: columnsInSection.map(({ column, index }) =>
          createFieldColDef(column, index)
        ),
      })
    );

    return [pinnedColumn, ...groupedColumnDefs];
  }, [buildSavingCellKey, extractionProcessId, enrichedGridData.columns, handleSaveCell, rowHeight, savingCells]);

  const handleDownloadExcel = useCallback(async () => {
    if (!extractionProcessId) {
      return;
    }

    setIsExportingExcel(true);
    setIsExportMenuOpen(false);

    try {
      const blob = await dataExtractionConductingService.exportExtractedData(extractionProcessId);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "Extraction_Data.xlsx";
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } catch (error) {
      toastError(
        "Download failed",
        getErrorMessage(error, "Unable to download the extraction file right now.")
      );
    } finally {
      setIsExportingExcel(false);
    }
  }, [extractionProcessId]);

  const handleDownloadCsv = useCallback(async () => {
    if (!extractionProcessId) {
      return;
    }

    setIsExportingCsv(true);
    setIsExportMenuOpen(false);

    try {
      const blob = await dataExtractionConductingService.exportExtractedDataCsv(extractionProcessId);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "Extraction_Data.csv";
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } catch (error) {
      toastError(
        "Download failed",
        getErrorMessage(error, "Unable to download the extraction CSV file right now.")
      );
    } finally {
      setIsExportingCsv(false);
    }
  }, [extractionProcessId]);

  const isExporting = isExportingExcel || isExportingCsv;

  const updateExportMenuPosition = useCallback(() => {
    if (!exportMenuRef.current) {
      return;
    }

    const rect = exportMenuRef.current.getBoundingClientRect();
    setExportMenuPosition({
      top: rect.bottom + window.scrollY + 8,
      left: rect.left + window.scrollX,
      minWidth: Math.max(rect.width, 224),
    });
  }, []);

  useLayoutEffect(() => {
    if (isExportMenuOpen) {
      updateExportMenuPosition();
    }
  }, [isExportMenuOpen, updateExportMenuPosition]);

  useEffect(() => {
    gridRef.current?.api?.resetRowHeights();
  }, [rowHeight]);

  useEffect(() => {
    if (!isExportMenuOpen) {
      return;
    }

    const handlePositionUpdate = () => {
      updateExportMenuPosition();
    };

    window.addEventListener("scroll", handlePositionUpdate, true);
    window.addEventListener("resize", handlePositionUpdate);

    return () => {
      window.removeEventListener("scroll", handlePositionUpdate, true);
      window.removeEventListener("resize", handlePositionUpdate);
    };
  }, [isExportMenuOpen, updateExportMenuPosition]);

  useEffect(() => {
    if (!isExportMenuOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (!exportMenuRef.current || !exportMenuPanelRef.current) {
        return;
      }

      if (
        event.target instanceof Node &&
        !exportMenuRef.current.contains(event.target) &&
        !exportMenuPanelRef.current.contains(event.target)
      ) {
        setIsExportMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isExportMenuOpen]);

  const hasData = enrichedGridData.columns.length > 0 && enrichedGridData.rows.length > 0;

  if (gridQuery.isLoading && !gridQuery.data) {
    return (
      <div className="min-h-screen bg-slate-50 px-6 py-8">
        <div className="mx-auto flex max-w-7xl items-center justify-center rounded-2xl border border-slate-200 bg-white py-24 shadow-sm">
          <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
          <span className="ml-3 text-sm text-slate-600">Loading editable grid...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] px-6 py-8">
      <div className="mx-auto max-w-[96rem] space-y-4">
        <div className="relative z-50 rounded-2xl border border-white/70 bg-white/85 px-5 py-4 shadow-lg shadow-slate-200/40 backdrop-blur">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Extraction Grid Workspace</h1>
              <p className="mt-1 text-sm text-slate-500">
                Review and standardize extracted values directly before moving to synthesis.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="outline" onClick={() => navigate(dashboardPath)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>

              <Button variant="outline" onClick={handleRefreshGrid} disabled={gridQuery.isLoading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${gridQuery.isLoading ? "animate-spin" : ""}`} />
                Refresh Grid
              </Button>

              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Row Height
                </span>
                <input
                  type="range"
                  min={MIN_GRID_ROW_HEIGHT}
                  max={MAX_GRID_ROW_HEIGHT}
                  value={rowHeight}
                  onChange={(event) => setRowHeight(Number(event.target.value))}
                  className="h-1.5 w-28 accent-blue-600"
                  aria-label="Grid row height"
                />
                <button
                  type="button"
                  onClick={() => setRowHeight(72)}
                  className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Comfort
                </button>
                <button
                  type="button"
                  onClick={() => setRowHeight(DEFAULT_GRID_ROW_HEIGHT)}
                  className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Reset
                </button>
                <span className="min-w-8 text-right text-xs font-semibold text-slate-700">
                  {rowHeight}px
                </span>
              </div>

              <div className="relative z-50" ref={exportMenuRef}>
                <Button
                  onClick={() => setIsExportMenuOpen((current) => !current)}
                  disabled={isExporting || !extractionProcessId}
                >
                  {isExporting ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Export Data
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>

                {isExportMenuOpen
                  ? createPortal(
                      <div
                        ref={exportMenuPanelRef}
                        className="fixed z-[9999] rounded-xl border border-gray-200 bg-white p-1.5 shadow-2xl"
                        style={{
                          top: `${exportMenuPosition.top}px`,
                          left: `${exportMenuPosition.left}px`,
                          minWidth: `${exportMenuPosition.minWidth}px`,
                        }}
                      >
                        <button
                          type="button"
                          onClick={handleDownloadExcel}
                          disabled={isExporting}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <FileSpreadsheet className="h-4 w-4 flex-shrink-0 text-emerald-600" />
                          <span className="truncate">Excel (.xlsx)</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleDownloadCsv}
                          disabled={isExporting}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <FileText className="h-4 w-4 flex-shrink-0 text-blue-600" />
                          <span className="truncate">CSV (.csv)</span>
                        </button>
                      </div>,
                      document.body
                    )
                  : null}
              </div>
            </div>
          </div>
        </div>

        {gridQuery.error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {getErrorMessage(gridQuery.error, "Unable to load editable grid.")}
          </div>
        ) : null}

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm" style={{ height: "calc(100vh - 200px)" }}>
          {hasData ? (
            <div className="ag-theme-quartz h-full w-full">
              <AgGridReact<AgGridRowData>
                ref={gridRef}
                rowData={agRowData}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                rowHeight={rowHeight}
                headerHeight={56}
                groupHeaderHeight={28}
                animateRows
                stopEditingWhenCellsLoseFocus
                suppressDragLeaveHidesColumns
              />
            </div>
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-center">
              <div>
                <p className="text-base font-semibold text-slate-800">No grid data available</p>
                <p className="mt-1 text-sm text-slate-500">
                  Complete extraction tasks first, then open this workspace to standardize values.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
