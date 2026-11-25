import type {
  LibraryCollectionResolution,
  LibraryItem,
  LibraryMediaKind,
} from "./libraryClient.ts";
import type { LibraryNodeState } from "./libraryNodeState.ts";

/**
 * A resolved library reference is metadata and stable identity only.
 * It deliberately contains no blob bytes, preview URL, or canvas-owned asset URL.
 */
export interface LibraryMediaReference {
  itemId: string;
  collectionId: string;
  collectionName: string;
  revision: number;
  mediaKind: LibraryMediaKind;
  name: string;
  mimeType?: string;
  byteSize?: number;
  width?: number;
  height?: number;
  durationSeconds?: number;
}

/**
 * Runtime payload emitted by a Library node for a downstream consumer.
 * The saved node state remains the source of truth for selection mode and IDs;
 * this batch is rebuilt from the authoritative collection resolution response.
 */
export interface LibraryReferenceBatch {
  contractVersion: 1;
  sourceNodeId: string;
  collectionId: string;
  collectionName: string;
  selectionMode: LibraryNodeState["mode"];
  selectedItemIds: string[];
  references: LibraryMediaReference[];
  unavailableItemIds: string[];
}

function referenceFromItem(
  item: LibraryItem,
  collectionId: string,
  collectionName: string,
): LibraryMediaReference | null {
  if (item.kind !== "asset" || item.state !== "active" || !item.mediaKind)
    return null;

  const metadata = item.metadata;
  return {
    itemId: item.id,
    collectionId,
    collectionName,
    revision: item.revision,
    mediaKind: item.mediaKind,
    name: item.name,
    ...(metadata ? { mimeType: metadata.mimeType, byteSize: metadata.size } : {}),
    ...(metadata?.width != null ? { width: metadata.width } : {}),
    ...(metadata?.height != null ? { height: metadata.height } : {}),
    ...(metadata?.durationSeconds != null
      ? { durationSeconds: metadata.durationSeconds }
      : {}),
  };
}

/**
 * Builds a deterministic, ordered reference batch from an authoritative
 * collection resolution. Missing, trashed, subject, or malformed entries are
 * reported as unavailable instead of being silently substituted.
 */
export function createLibraryReferenceBatch(
  sourceNodeId: string,
  state: LibraryNodeState,
  resolution: LibraryCollectionResolution,
): LibraryReferenceBatch {
  if (!sourceNodeId.trim())
    throw new Error("A library reference batch requires a source node ID.");
  if (!state.collectionId || resolution.collectionId !== state.collectionId)
    throw new Error("The resolved collection does not match the library node.");
  if (new Set(resolution.itemIds).size !== resolution.itemIds.length)
    throw new Error("The resolved collection contains duplicate item IDs.");

  if (
    state.mode === "fixed" &&
    (resolution.itemIds.length !== state.itemIds.length ||
      resolution.itemIds.some((id, index) => id !== state.itemIds[index]))
  )
    throw new Error("The resolved items do not match the fixed library selection.");

  const itemsById = new Map(resolution.items.map((item) => [item.id, item]));
  const unavailable = new Set(resolution.unavailableIds);
  const references: LibraryMediaReference[] = [];

  for (const itemId of resolution.itemIds) {
    const item = itemsById.get(itemId);
    const reference = item
      ? referenceFromItem(item, resolution.collectionId, resolution.collectionName)
      : null;

    if (!reference) {
      unavailable.add(itemId);
      continue;
    }
    references.push(reference);
  }

  return {
    contractVersion: 1,
    sourceNodeId,
    collectionId: resolution.collectionId,
    collectionName: resolution.collectionName,
    selectionMode: state.mode,
    selectedItemIds: [...resolution.itemIds],
    references,
    unavailableItemIds: resolution.itemIds.filter((id) => unavailable.has(id)),
  };
}
