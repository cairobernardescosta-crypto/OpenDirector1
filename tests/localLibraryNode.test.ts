import assert from "node:assert/strict";
import test from "node:test";
import { applyCommand, createDocument, createNode } from "../src/canvas/model.ts";
import { parseDocument, serializeDocument } from "../src/canvas/storage.ts";
import { canStartReference, canSourceReference, referenceMaterial, referenceIssue } from "../src/canvas/connectionPolicy.ts";
import { referencePortDirection } from "../src/canvas/connectionPorts.ts";
import { assistantReferences } from "../src/canvas/assistantReferences.ts";
import { pendingCanvasReferences } from "../src/canvas/pendingCanvasReferences.ts";
import { encodeLibraryNode, isLibraryNodeText, parseLibraryNode, libraryCreationKinds } from "../src/canvas/library/libraryNodeState.ts";

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


test("rapid library changes merge against the latest selection and survive reopen", () => {
  const first = { ...initial, activeItemId: imageId, activeMediaKind: "image" as const };
  const secondId = "33333333-3333-4333-8333-333333333333";
  const afterSecondSelection = {
    ...first,
    itemIds: [...first.itemIds, secondId],
  };
  const finalState = {
    ...afterSecondSelection,
    mode: "dynamic" as const,
  };
  const node = createNode("text", { x: 10, y: 20 }, {
    title: "Biblioteca local",
    text: encodeLibraryNode(finalState),
  });
  const saved = serializeDocument({ ...createDocument(), nodes: [node] });
  assert.equal(saved.ok, true);
  if (!saved.ok) return;
  const reopened = parseDocument(saved.value);
  assert.equal(reopened.ok, true);
  if (!reopened.ok) return;
  assert.deepEqual(parseLibraryNode(reopened.value.nodes[0]?.data.text), finalState);
});

test("library card is not a media source or generation prompt", () => {
  const source = createNode("text", undefined, { text: encodeLibraryNode(initial) });
  const target = createNode("image");
  const doc = { ...createDocument(), nodes: [source, target] };
  assert.equal(isLibraryNodeText(source.data.text), true);
  assert.equal(referenceMaterial(source), null);
  assert.equal(canStartReference(source), true);
  assert.equal(referencePortDirection(source), "out");
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

test("selected library media is a versioned native extraction source", () => {
  const state = {
    ...initial,
    activeItemId: imageId,
    activeMediaKind: "image" as const,
  };
  const document = { ...createDocument(), nodes: [
    createNode("text", { x: 30, y: 40 }, {
      text: encodeLibraryNode(state),
      title: "Biblioteca local 1",
    }),
  ] };
  const encoded = serializeDocument(document);
  assert.equal(encoded.ok, true);
  if (!encoded.ok) return;
  const decoded = parseDocument(encoded.value);
  assert.equal(decoded.ok, true);
  if (!decoded.ok) return;
  assert.deepEqual(parseLibraryNode(decoded.value.nodes[0]!.data.text), state);
  assert.deepEqual(libraryCreationKinds(state), ["image"]);
  assert.deepEqual(libraryCreationKinds({ ...state, activeMediaKind: "file" }), ["file"]);
  assert.deepEqual(libraryCreationKinds(null), ["image", "video", "audio", "file"]);
});

test("library manifests cannot connect, but imported native material can", () => {
  const library = createNode("text", undefined, { text: encodeLibraryNode(initial) });
  const target = createNode("image");
  const native = createNode("image", undefined, {
    src: "data:image/png;base64,aGVsbG8=",
    mediaRole: "asset",
  });
  const doc = { ...createDocument(), nodes: [library, target, native] };
  assert.equal(referenceIssue(doc, library.id, target.id), "source_type_unsupported");
  assert.equal(referenceIssue(doc, native.id, target.id), null);
});

test("assistant selection cannot read a library manifest as a Gemini prompt", () => {
  const source = createNode("text", undefined, { text: encodeLibraryNode(initial) });
  assert.deepEqual(assistantReferences([source]), []);
  const [pending] = pendingCanvasReferences([source]);
  assert.ok(pending?.error);
  assert.deepEqual(pending?.identity.references, []);
});
