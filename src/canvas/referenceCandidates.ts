import { referenceByteLimit } from "../contracts/ruleFacts.generated.ts";
import type { CanvasNode } from "./model.ts";
import { nodeMentionOptions, type MentionOption } from "./referenceMentions.ts";
import type { ReferenceAsset } from "./chatReferenceContent.ts";
import { assetDisplayName } from "./assetNames.ts";
import { tNow } from "../i18n/messages.ts";
import { parseLibraryNode } from "./library/libraryNodeState.ts";

export function assetOptionId(
  asset: Pick<ReferenceAsset, "id" | "nodeId" | "sourceRole">,
) {
  return `asset:${asset.id}${asset.nodeId ? `@${asset.nodeId}:${asset.sourceRole ?? ""}` : ""}`;
}

/** One inventory entry per logical source; identical independent sources stay distinct. */
export function referenceCandidates(
  nodes: readonly CanvasNode[],
  assets: readonly ReferenceAsset[],
  issue: (node: CanvasNode) => string | null = () => null,
): MentionOption[] {
  const libraryNodes = nodes.filter(
    (node) => node.type === "library" || (node.type === "text" && parseLibraryNode(node.data.text)),
  );
  const regularNodes = nodes.filter((node) => !libraryNodes.includes(node));
  const options = nodeMentionOptions(
    regularNodes,
    issue,
    tNow("errors.refs.canvasMaterial"),
  ).map(
    (option) => ({ ...option, id: `node:${option.id}` }),
  );
  for (const node of libraryNodes) {
    const state = node.type === "library" ? node.data.library : parseLibraryNode(node.data.text);
    if (!state?.collectionId) continue;
    options.push({
      id: `node:${node.id}`,
      kind: "text",
      title: assetDisplayName(node.data.title || "Biblioteca local"),
      detail: `${tNow("library.node.collection")} · ${tNow(
        state.mode === "dynamic" ? "library.node.dynamic" : "library.node.fixed",
      )}`,
      disabledReason: null,
    });
  }
  for (const asset of assets) {
    if (asset.available === false) continue;
    if (!["image", "video", "audio", "text"].includes(asset.kind ?? ""))
      continue;
    const owner = nodes.find(
      (node) => node.id === asset.nodeId || node.id === asset.logicalNodeId,
    );
    if (owner) continue;
    options.push({
      id: assetOptionId(asset),
      kind: asset.kind as MentionOption["kind"],
      title: assetDisplayName(asset.nodeTitle || asset.name),
      detail: tNow("errors.refs.projectMaterial"),
      disabledReason:
        asset.size > referenceByteLimit({ kind: asset.kind ?? "" })
          ? tNow("errors.refs.tooLarge")
          : null,
    });
  }
  return options;
}
