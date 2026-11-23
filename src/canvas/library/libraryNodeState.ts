/** Native text-binding adapter for collection nodes.
 *
 * The authoritative server only accepts the existing CanvasKind union.
 * Library configuration therefore lives in a text node's persisted manualText
 * until a future explicit versioned CanvasKind migration. Do not interpret
 * this marker as media, an agent instruction, or a trusted reference.
 */
export const LIBRARY_NODE_MARKER = "opendirector:local-library:v1:";

export type LibraryNodeState = {
  version: 1;
  collectionId: string;
  mode: "dynamic" | "fixed";
  itemIds: string[];
  /** One explicit media item to export through a native canvas node. */
  activeItemId?: string;
  activeMediaKind?: "image" | "video" | "audio" | "file";
};

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function encodeLibraryNode(value: LibraryNodeState): string {
  return LIBRARY_NODE_MARKER + JSON.stringify(value);
}

export function parseLibraryNode(text?: string): LibraryNodeState | null {
  if (!text?.startsWith(LIBRARY_NODE_MARKER)) return null;
  try {
    const v: unknown = JSON.parse(text.slice(LIBRARY_NODE_MARKER.length));
    if (!v || typeof v !== "object" || Array.isArray(v)) return null;
    const state = v as Record<string, unknown>;
    if (state.version !== 1 || typeof state.collectionId !== "string" ||
        (state.collectionId !== "" && !uuid.test(state.collectionId)) ||
        (state.mode !== "fixed" && state.mode !== "dynamic") ||
        !Array.isArray(state.itemIds) || state.itemIds.length > 1000 ||
        !state.itemIds.every((id) => typeof id === "string" && uuid.test(id)) ||
        new Set(state.itemIds).size !== state.itemIds.length ||
        (state.activeItemId !== undefined &&
          (typeof state.activeItemId !== "string" || !uuid.test(state.activeItemId))) ||
        (state.activeMediaKind !== undefined &&
          !["image", "video", "audio", "file"].includes(String(state.activeMediaKind)))) return null;
    return {
      version: 1,
      collectionId: state.collectionId,
      mode: state.mode,
      itemIds: [...state.itemIds],
      ...(state.activeItemId !== undefined ? { activeItemId: state.activeItemId } : {}),
      ...(state.activeMediaKind !== undefined
        ? { activeMediaKind: state.activeMediaKind as LibraryNodeState["activeMediaKind"] }
        : {}),
    };
  } catch {
    return null;
  }
}

export function isLibraryNodeText(text?: string): boolean {
  return parseLibraryNode(text) !== null;
}
