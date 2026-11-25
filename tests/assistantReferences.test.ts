import test from "node:test";
import assert from "node:assert/strict";
import { createNode } from "../src/canvas/model.ts";
import { assistantReferences } from "../src/canvas/assistantReferences.ts";

test("assistant references can carry a project asset without forcing a preview URL", () => {
  const image = createNode("image", undefined, {
    title: "Asset only",
    backendAssetId: "asset-123",
  });
  assert.deepEqual(assistantReferences([image]), [{
    nodeId: image.id,
    assetId: "asset-123",
    kind: "image",
    title: "Asset only",
  }]);
});

test("assistant references do not expose missing or empty media nodes", () => {
  const missing = createNode("video", undefined, {
    title: "Missing",
    backendAssetId: "asset-missing",
    assetState: "missing",
  });
  const empty = createNode("image", undefined, { title: "Empty" });
  assert.deepEqual(assistantReferences([missing, empty]), []);
});
