import { referenceIssue } from "../connectionPolicy.ts";
import type { CanvasDocument } from "../model.ts";
import { mergeLibrarySubjectImport } from "../subjectLibraryImport.ts";

/** Preserve a successfully persisted library media node AND its real edge.
 * The original subject-only merge deliberately merges nodes alone, so a
 * connected media import needs this small focused wrapper. Never invent a
 * link from the text-backed collection manifest. */
export function mergeImportedLibraryMedia(
  live: CanvasDocument,
  before: CanvasDocument,
  committed: CanvasDocument,
  importedNodeId: string,
  targetNodeId?: string,
): CanvasDocument {
  const merged = mergeLibrarySubjectImport(live, before, committed);
  if (!targetNodeId) return merged;
  const edge = committed.edges.find(
    (candidate) =>
      candidate.source === importedNodeId && candidate.target === targetNodeId,
  );
  if (!edge || merged.edges.some((existing) => existing.id === edge.id) ||
      !merged.nodes.some((node) => node.id === targetNodeId) ||
      referenceIssue(merged, importedNodeId, targetNodeId))
    return merged;
  return { ...merged, edges: [...merged.edges, edge] };
}
