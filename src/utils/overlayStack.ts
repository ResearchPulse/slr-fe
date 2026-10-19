const openOverlays: string[] = [];

export function pushOverlay(id: string) {
  const existingIndex = openOverlays.lastIndexOf(id);
  if (existingIndex !== -1) openOverlays.splice(existingIndex, 1);
  openOverlays.push(id);
}

export function removeOverlay(id: string) {
  const index = openOverlays.lastIndexOf(id);
  if (index !== -1) openOverlays.splice(index, 1);
}

export function isTopOverlay(id: string) {
  return openOverlays[openOverlays.length - 1] === id;
}
