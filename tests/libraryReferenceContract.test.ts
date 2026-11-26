import assert from "node:assert/strict";
import test from "node:test";
import { normalizeCollectionResolution, type LibraryCollectionResolution, type LibraryItem } from "../src/canvas/library/libraryClient.ts";
import { assertLibraryResolutionStable, createLibraryReferenceBatch } from "../src/canvas/library/libraryReferenceContract.ts";
import {
  setLibraryNodeMode,
  toggleLibraryNodeItem,
  type LibraryNodeState,
} from "../src/canvas/library/libraryNodeState.ts";

const collectionId = "11111111-1111-4111-8111-111111111111";
const imageId = "22222222-2222-4222-8222-222222222222";
const videoId = "33333333-3333-4333-8333-333333333333";
const missingId = "44444444-4444-4444-8444-444444444444";

function asset(id: string, mediaKind: "image" | "video" | "audio" | "file"): LibraryItem {
  return {
    id,
    kind: "asset",
    state: "active",
    name: mediaKind === "image" ? "Foto original" : "Vídeo original",
    revision: 3,
    createdAt: "2026-11-25T00:00:00Z",
    trashedAt: null,
    blob: "a".repeat(64),
    subject: null,
    mediaKind,
    metadata: {
      mimeType: mediaKind === "image" ? "image/jpeg" : "video/mp4",
      size: 2048,
      width: mediaKind === "image" ? 1080 : 1920,
      height: mediaKind === "image" ? 1350 : 1080,
      durationSeconds: mediaKind === "video" ? 12.5 : null,
    },
    preview: null,
    origin: {
      type: "upload",
      projectId: null,
      nodeId: null,
      assetId: null,
    },
  };
}

function state(mode: "dynamic" | "fixed", itemIds: string[] = []): LibraryNodeState {
  return { version: 1, collectionId, mode, itemIds };
}

function resolution(
  itemIds: string[],
  items: LibraryItem[],
  unavailableIds: string[] = [],
): LibraryCollectionResolution {
  return {
    collectionId,
    collectionName: "Campanha novembro",
    itemIds,
    items,
    unavailableIds,
  };
}

test("creates ordered typed references without copying bytes or generating canvas nodes", () => {
  const result = createLibraryReferenceBatch(
    "library-node-1",
    state("dynamic"),
    resolution([videoId, imageId], [asset(imageId, "image"), asset(videoId, "video")]),
  );

  assert.equal(result.contractVersion, 1);
  assert.equal(result.sourceNodeId, "library-node-1");
  assert.deepEqual(result.selectedItemIds, [videoId, imageId]);
  assert.deepEqual(result.references.map((item) => item.itemId), [videoId, imageId]);
  assert.deepEqual(result.references.map((item) => item.mediaKind), ["video", "image"]);
  assert.equal(result.references[0]?.revision, 3);
  assert.equal(result.references[0]?.mimeType, "video/mp4");
  assert.equal("blob" in (result.references[0] ?? {}), false);
  assert.deepEqual(result.unavailableItemIds, []);
});

test("preserves image, video, audio, and file media kinds in one library batch", () => {
  const ids = [
    "55555555-5555-4555-8555-555555555555",
    "66666666-6666-4666-8666-666666666666",
    "77777777-7777-4777-8777-777777777777",
    "88888888-8888-4888-8888-888888888888",
  ];
  const kinds = ["image", "video", "audio", "file"] as const;
  const result = createLibraryReferenceBatch(
    "library-node-1",
    state("dynamic"),
    resolution(ids, kinds.map((kind, index) => ({
      ...asset(ids[index]!, kind),
      name: `original-${kind}`,
      metadata: {
        ...asset(ids[index]!, kind).metadata!,
        mimeType: kind === "image" ? "image/png"
          : kind === "video" ? "video/mp4"
          : kind === "audio" ? "audio/mpeg"
          : "application/pdf",
      },
    }))),
  );

  assert.equal(result.references.length, 4);
  assert.deepEqual(result.references.map((item) => item.mediaKind), kinds);
  assert.deepEqual(result.references.map((item) => item.itemId), ids);
  assert.deepEqual(result.unavailableItemIds, []);
});

test("fixed mode must resolve exactly the saved IDs in the saved order", () => {
  const fixed = state("fixed", [imageId, videoId]);
  const exact = resolution(
    [imageId, videoId],
    [asset(imageId, "image"), asset(videoId, "video")],
  );
  assert.deepEqual(
    createLibraryReferenceBatch("library-node-1", fixed, exact).selectedItemIds,
    [imageId, videoId],
  );

  assert.throws(
    () => createLibraryReferenceBatch(
      "library-node-1",
      fixed,
      resolution([videoId, imageId], [asset(imageId, "image"), asset(videoId, "video")]),
    ),
    /fixed library selection/,
  );
});

test("missing and unsupported items are reported without substitution", () => {
  const result = createLibraryReferenceBatch(
    "library-node-1",
    state("dynamic"),
    resolution(
      [imageId, missingId, videoId],
      [asset(imageId, "image"), asset(videoId, "video")],
      [missingId],
    ),
  );

  assert.deepEqual(result.references.map((item) => item.itemId), [imageId, videoId]);
  assert.deepEqual(result.unavailableItemIds, [missingId]);
});

test("rejects a resolution from a different collection and duplicate IDs", () => {
  assert.throws(
    () => createLibraryReferenceBatch(
      "library-node-1",
      state("dynamic"),
      { ...resolution([], []), collectionId: "99999999-9999-4999-8999-999999999999" },
    ),
    /does not match/,
  );
  assert.throws(
    () => createLibraryReferenceBatch(
      "library-node-1",
      state("dynamic"),
      resolution([imageId, imageId], [asset(imageId, "image")]),
    ),
    /duplicate item IDs/,
  );
});

test("requires a stable source node ID", () => {
  assert.throws(
    () => createLibraryReferenceBatch("", state("dynamic"), resolution([], [])),
    /source node ID/,
  );
});



test("trashed files are unavailable and never replaced by another collection item", () => {
  const trashed = { ...asset(imageId, "image"), state: "trashed" as const };
  const result = createLibraryReferenceBatch(
    "library-node-1",
    state("dynamic"),
    resolution([imageId, videoId], [trashed, asset(videoId, "video")]),
  );
  assert.deepEqual(result.references.map((item) => item.itemId), [videoId]);
  assert.deepEqual(result.unavailableItemIds, [imageId]);
});

test("normalization marks absent files unavailable and preserves fixed order", () => {
  const raw = resolution(
    [videoId, missingId, imageId],
    [asset(imageId, "image"), asset(videoId, "video")],
  );
  const normalized = normalizeCollectionResolution(raw, collectionId, [videoId, missingId, imageId]);
  assert.deepEqual(normalized.itemIds, [videoId, missingId, imageId]);
  assert.deepEqual(normalized.unavailableIds, [missingId]);
  assert.deepEqual(normalized.items.map((item) => item.id), [videoId, imageId]);
});

test("normalization rejects duplicate, malformed, unexpected and oversized records", () => {
  const base = resolution([imageId], [asset(imageId, "image")]);
  assert.throws(
    () => normalizeCollectionResolution({ ...base, itemIds: [imageId, imageId] }, collectionId),
    /IDs inválidos, duplicados/,
  );
  assert.throws(
    () => normalizeCollectionResolution({ ...base, unavailableIds: [imageId, imageId] }, collectionId),
    /indisponíveis inválidos ou duplicados/,
  );
  assert.throws(
    () => normalizeCollectionResolution({ ...base, items: [{ ...asset(imageId, "image"), revision: 0 }] }, collectionId),
    /registros inválidos/,
  );
  assert.throws(
    () => normalizeCollectionResolution({ ...base, items: [{ ...asset(imageId, "image"), metadata: { ...asset(imageId, "image").metadata!, size: -1 } }] }, collectionId),
    /metadados de arquivo inválidos/,
  );
  assert.throws(
    () => normalizeCollectionResolution(base, collectionId, Array.from({ length: 1001 }, () => imageId)),
    /excede o limite/,
  );
});

test("a second resolution detects collection edits, deletion and revision changes", () => {
  const before = resolution([imageId, videoId], [asset(imageId, "image"), asset(videoId, "video")]);
  assert.doesNotThrow(() => assertLibraryResolutionStable(before, resolution(
    [imageId, videoId], [asset(imageId, "image"), asset(videoId, "video")],
  )));
  assert.throws(
    () => assertLibraryResolutionStable(before, resolution([videoId], [asset(videoId, "video")])),
    /coleção ou a disponibilidade/,
  );
  assert.throws(
    () => assertLibraryResolutionStable(before, resolution(
      [imageId, videoId], [{ ...asset(imageId, "image"), revision: 4 }, asset(videoId, "video")],
    )),
    /alterado durante a leitura/,
  );
  assert.throws(
    () => assertLibraryResolutionStable(before, resolution(
      [imageId, videoId], [
        { ...asset(imageId, "image"), blob: "b".repeat(64) },
        asset(videoId, "video"),
      ],
    )),
    /alterado durante a leitura/,
  );
  assert.throws(
    () => assertLibraryResolutionStable(before, resolution(
      [imageId, videoId], [asset(videoId, "video")], [imageId],
    )),
    /coleção ou a disponibilidade/,
  );
});

test("switching modes clears stale fixed IDs and snapshots dynamic collection IDs", () => {
  assert.deepEqual(
    setLibraryNodeMode(state("dynamic"), "fixed", [videoId, imageId]).itemIds,
    [videoId, imageId],
  );
  assert.deepEqual(
    setLibraryNodeMode(state("fixed", [imageId]), "dynamic").itemIds,
    [],
  );
});

test("fixed selection toggles IDs without duplicates and preserves selection order", () => {
  const first = toggleLibraryNodeItem(state("fixed"), videoId);
  const second = toggleLibraryNodeItem(first, imageId);
  assert.deepEqual(second.itemIds, [videoId, imageId]);
  const removed = toggleLibraryNodeItem(second, videoId);
  assert.deepEqual(removed.itemIds, [imageId]);
  const active = toggleLibraryNodeItem(
    { ...second, activeItemId: videoId, activeMediaKind: "video" },
    videoId,
  );
  assert.equal(active.activeItemId, undefined);
  assert.equal(active.activeMediaKind, undefined);
  assert.deepEqual(toggleLibraryNodeItem(second, "not-an-id").itemIds, [videoId, imageId]);
});
