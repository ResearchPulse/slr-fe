import type {
  AuditLogEntry,
  AuditLogExportFormat,
  AuditLogSortField,
} from "../../../types/auditLog";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const dateOnlyFormatter = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export const formatAuditDateTime = (timestamp: string): string =>
  dateFormatter.format(new Date(timestamp));

export const formatDateInputValue = (timestamp: string): string =>
  dateOnlyFormatter.format(new Date(timestamp));

export const parseDateInputValue = (dateValue: string): Date => {
  const [year, month, day] = dateValue.split("-").map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
};

export const formatRangeLabel = (startDate: string, endDate: string): string => {
  const start = startDate
    ? new Date(startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : "Any start";
  const end = endDate
    ? new Date(endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : "Any end";
  return `${start} - ${end}`;
};

export const matchesAuditLogSearch = (entry: AuditLogEntry, searchTerm: string): boolean => {
  if (!searchTerm.trim()) return true;
  const normalized = searchTerm.trim().toLowerCase();

  return [entry.user, entry.resourceId, entry.action, entry.resourceType, entry.ipAddress].some(
    (value) => value.toLowerCase().includes(normalized),
  );
};

export const filterAuditLogs = (
  entries: AuditLogEntry[],
  filters: {
    searchTerm: string;
    user: string;
    actionType: string;
    status: string;
    startDate: string;
    endDate: string;
  },
): AuditLogEntry[] => {
  return entries.filter((entry) => {
    const timestamp = new Date(entry.timestamp).getTime();
    const start = filters.startDate
      ? parseDateInputValue(filters.startDate).getTime()
      : Number.NEGATIVE_INFINITY;
    const end = filters.endDate
      ? new Date(parseDateInputValue(filters.endDate).getTime() + 24 * 60 * 60 * 1000 - 1).getTime()
      : Number.POSITIVE_INFINITY;

    const matchesUser = filters.user === "all" || entry.user === filters.user;
    const matchesAction = filters.actionType === "all" || entry.actionType === filters.actionType;
    const matchesStatus = filters.status === "all" || entry.status === filters.status;
    const matchesDate = timestamp >= start && timestamp <= end;
    const matchesSearch = matchesAuditLogSearch(entry, filters.searchTerm);

    return matchesUser && matchesAction && matchesStatus && matchesDate && matchesSearch;
  });
};

export const sortAuditLogs = (
  entries: AuditLogEntry[],
  sortField: AuditLogSortField,
  direction: "asc" | "desc",
): AuditLogEntry[] => {
  const factor = direction === "asc" ? 1 : -1;

  return [...entries].sort((left, right) => {
    let leftValue: string | number = "";
    let rightValue: string | number = "";

    switch (sortField) {
      case "timestamp":
        leftValue = new Date(left.timestamp).getTime();
        rightValue = new Date(right.timestamp).getTime();
        break;
      case "status":
        leftValue = left.status;
        rightValue = right.status;
        break;
      case "resourceId":
        leftValue = left.resourceId;
        rightValue = right.resourceId;
        break;
      case "resourceType":
        leftValue = left.resourceType;
        rightValue = right.resourceType;
        break;
      case "action":
        leftValue = left.action;
        rightValue = right.action;
        break;
      case "user":
        leftValue = left.user;
        rightValue = right.user;
        break;
      default:
        leftValue = left.timestamp;
        rightValue = right.timestamp;
    }

    if (leftValue < rightValue) return -1 * factor;
    if (leftValue > rightValue) return 1 * factor;
    return 0;
  });
};

export const stringifyMetadata = (value: Record<string, unknown> | null): string => {
  if (!value) return "No data";
  return JSON.stringify(value, null, 2);
};

export const buildAuditLogFileName = (
  format: AuditLogExportFormat,
  startDate: string,
  endDate: string,
): string => {
  const range = `${startDate || "any-start"}_to_${endDate || "any-end"}`;
  // For Excel, we use .xls extension for compatibility with the XML Spreadsheet 2003 format
  const extension = format === "xlsx" ? "xls" : format;
  return `audit-logs_${range}.${extension}`;
};

const escapeCsvValue = (value: unknown): string => {
  if (value === null || value === undefined) return '""';
  const stringValue = String(value);
  return `"${stringValue.replace(/"/g, '""')}"`;
};

export const buildAuditLogExportContent = (
  entries: AuditLogEntry[],
  format: AuditLogExportFormat,
): { content: string; mimeType: string } => {
  if (format === "json") {
    return {
      content: JSON.stringify(entries, null, 2),
      mimeType: "application/json;charset=utf-8",
    };
  }

  const rows = entries.map((entry) => [
    entry.timestamp,
    entry.user,
    entry.action,
    entry.resourceType,
    entry.resourceId,
    entry.status,
    entry.ipAddress,
    entry.userAgent,
    stringifyMetadata(entry.oldValue),
    stringifyMetadata(entry.newValue),
  ]);

  const header = [
    "Timestamp",
    "User",
    "Action",
    "Resource Type",
    "Resource ID",
    "Status",
    "IP Address",
    "User Agent",
    "Old Value",
    "New Value",
  ];

  if (format === "csv") {
    return {
      content: [header, ...rows]
        .map((row) => row.map((value) => escapeCsvValue(value)).join(","))
        .join("\n"),
      mimeType: "text/csv;charset=utf-8",
    };
  }

  if (format === "xlsx") {
    // We use XML Spreadsheet 2003 format which is a single XML file that Excel opens perfectly.
    // This avoids "corrupted" errors common with plain text or CSV masquerading as XLSX.
    const xmlHeader = `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Worksheet ss:Name="Audit Logs">
  <Table>`;

    const xmlFooter = `  </Table>
 </Worksheet>
</Workbook>`;

    const escapeXml = (str: unknown): string => {
      if (str === null || str === undefined) return "";
      return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
    };

    const headerRow = `   <Row>\n${header
      .map((h) => `    <Cell><Data ss:Type="String">${escapeXml(h)}</Data></Cell>`)
      .join("\n")}\n   </Row>`;

    const dataRows = rows
      .map((row) => {
        return `   <Row>\n${row
          .map((cell) => `    <Cell><Data ss:Type="String">${escapeXml(cell)}</Data></Cell>`)
          .join("\n")}\n   </Row>`;
      })
      .join("\n");

    return {
      content: xmlHeader + "\n" + headerRow + "\n" + dataRows + "\n" + xmlFooter,
      mimeType: "application/vnd.ms-excel",
    };
  }

  return {
    content: [header, ...rows].map((row) => row.join("\t")).join("\n"),
    mimeType: "text/tab-separated-values;charset=utf-8",
  };
};

export const downloadFile = (content: string, fileName: string, mimeType: string): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
