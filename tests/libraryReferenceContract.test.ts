import assert from "node:assert/strict";
import test from "node:test";
import type { LibraryCollectionResolution, LibraryItem } from "../src/canvas/library/libraryClient.ts";
import { createLibraryReferenceBatch } from "../src/canvas/library/libraryReferenceContract.ts";
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
  assert.deepEqual(toggleLibraryNodeItem(second, videoId).itemIds, [imageId]);
  assert.deepEqual(toggleLibraryNodeItem(second, "not-an-id").itemIds, [videoId, imageId]);
});
