import assert from "node:assert/strict";
import test from "node:test";
import { applyCommand, createDocument, createNode } from "../src/canvas/model.ts";
import { parseDocument, serializeDocument } from "../src/canvas/storage.ts";
import { canSourceReference, referenceMaterial, referenceIssue } from "../src/canvas/connectionPolicy.ts";
import { encodeLibraryNode, isLibraryNodeText, parseLibraryNode } from "../src/canvas/library/libraryNodeState.ts";

const collectionId = "11111111-1111-4111-8111-111111111111";
const imageId = "22222222-2222-4222-8222-222222222222";
const initial = { version: 1 as const, collectionId, mode: "fixed" as const, itemIds: [imageId] };

test("library card state survives native canvas serialization and undo", () => {
  const node = createNode("text", { x: 50, y: 80 }, {
    title: "Biblioteca local", text: encodeLibraryNode(initial),
  });
  const doc = { ...createDocument(), nodes: [node] };
  const saved = serializeDocument(doc);
  assert.equal(saved.ok, true);
  if (!saved.ok) return;
  const reopened = parseDocument(saved.value);
  assert.equal(reopened.ok, true);
  if (!reopened.ok) return;
  assert.deepEqual(parseLibraryNode(reopened.value.nodes[0]?.data.text), initial);
  const updated = applyCommand(doc, {
    type: "update-node", id: node.id,
    patch: { data: { text: encodeLibraryNode({ ...initial, mode: "dynamic", itemIds: [] }) } },
  });
  assert.equal(parseLibraryNode(updated.nodes[0]?.data.text)?.mode, "dynamic");
  assert.deepEqual(parseLibraryNode(node.data.text), initial);
});

test("library card is not a media source or generation prompt", () => {
  const source = createNode("text", undefined, { text: encodeLibraryNode(initial) });
  const target = createNode("image");
  const doc = { ...createDocument(), nodes: [source, target] };
  assert.equal(isLibraryNodeText(source.data.text), true);
  assert.equal(referenceMaterial(source), null);
  assert.equal(canSourceReference(source), false);
  assert.equal(referenceIssue(doc, source.id, target.id), "source_type_unsupported");
  assert.equal(referenceIssue(doc, target.id, source.id), "source_type_unsupported");
});

test("unknown and malformed library manifests remain non-library text", () => {
  for (const input of [
    "normal project notes", "opendirector:local-library:v1:{bad",
    "opendirector:local-library:v1:" + JSON.stringify({ ...initial, itemIds: [imageId, imageId] }),
    "opendirector:local-library:v1:" + JSON.stringify({ ...initial, mode: "other" }),
  ]) assert.equal(parseLibraryNode(input), null);
});
