import assert from "node:assert/strict";
import test from "node:test";
import { createDocument, createNode } from "../src/canvas/model.ts";
import { mergeImportedLibraryMedia } from "../src/canvas/library/libraryImportMerge.ts";
import { encodeLibraryNode } from "../src/canvas/library/libraryNodeState.ts";

test("imported native media survives persisted projection and retains valid edge", () => {
  const target = createNode("image");
  const original = { ...createDocument(), nodes: [target] };
  const media = createNode("image", { x: -400, y: 0 }, {
    src: "data:image/png;base64,aGVsbG8=",
    mediaRole: "asset",
  });
  const edge = { id: crypto.randomUUID(), source: media.id, target: target.id,
    sourceHandle: "out", targetHandle: "in" };
  const committed = { ...original, nodes: [target, media], edges: [edge] };
  const merged = mergeImportedLibraryMedia(original, original, committed, media.id, target.id);
  assert.equal(merged.nodes.some((item) => item.id === media.id), true);
  assert.deepEqual(merged.edges, [edge]);
  const again = mergeImportedLibraryMedia(merged, original, committed, media.id, target.id);
  assert.deepEqual(again.edges, [edge]);
});

test("import never creates a fake generation edge from collection metadata", () => {
  const target = createNode("image");
  const original = { ...createDocument(), nodes: [target] };
  const library = createNode("text", undefined, {
    text: encodeLibraryNode({
      version: 1,
      collectionId: "11111111-1111-4111-8111-111111111111",
      mode: "dynamic",
      itemIds: [],
    }),
  });
  const edge = { id: crypto.randomUUID(), source: library.id, target: target.id };
  const committed = { ...original, nodes: [target, library], edges: [edge] };
  const merged = mergeImportedLibraryMedia(original, original, committed, library.id, target.id);
  assert.equal(merged.nodes.some((item) => item.id === library.id), true);
  assert.deepEqual(merged.edges, []);
});

test("concurrent target removal does not restore a stale edge", () => {
  const target = createNode("image");
  const original = { ...createDocument(), nodes: [target] };
  const material = createNode("image", undefined, {
    src: "data:image/png;base64,aGVsbG8=", mediaRole: "asset",
  });
  const committed = { ...original, nodes: [target, material],
    edges: [{ id: crypto.randomUUID(), source: material.id, target: target.id }] };
  const merged = mergeImportedLibraryMedia(
    { ...original, nodes: [] }, original, committed, material.id, target.id,
  );
  assert.deepEqual(merged.edges, []);
});
