export function readWorkspaceFilters<T extends object>(key: string, defaults: T): T {
  try {
    const value = sessionStorage.getItem(key);
    return value ? { ...defaults, ...JSON.parse(value) } : defaults;
  } catch {
    return defaults;
  }
}

export function saveWorkspaceFilters<T extends object>(key: string, filters: T): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(filters));
  } catch {
    // The workspace remains usable when browser storage is unavailable.
  }
}

export function workspaceFilterKey(processId: string | undefined, stage: string): string {
  return `study-selection:${processId || "unknown"}:${stage}:filters`;
}

export function workspaceContextKey(processId: string | undefined, stage: string): string {
  return `study-selection:${processId || "unknown"}:${stage}:list-context`;
}
