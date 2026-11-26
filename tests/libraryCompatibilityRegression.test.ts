import assert from "node:assert/strict";
import test from "node:test";
import { buildCanvasArchive, readCanvasArchive } from "../src/canvas/canvasArchive.ts";
import { createHistory, recordChange, undo, redo } from "../src/canvas/history.ts";
import { copySelection, pasteFragment } from "../src/canvas/operations.ts";
import { createDocument, createNode, type CanvasNodeKind } from "../src/canvas/model.ts";
import { encodeLibraryNode, parseLibraryNode } from "../src/canvas/library/libraryNodeState.ts";
import { parseDocument, serializeDocument } from "../src/canvas/storage.ts";

const legacyState = {
  version: 1 as const,
  collectionId: "6f1d1f3e-0000-4000-8000-000000000000",
  mode: "fixed" as const,
  itemIds: ["6f1d1f3e-0000-4000-8000-000000000001"],
};

function legacyProject() {
  const document = createDocument("Projeto antigo");
  const textNode = createNode("text", { x: 48, y: 72 }, {
    text: encodeLibraryNode(legacyState),
    title: "Biblioteca antiga",
  });
  document.nodes = [textNode];
  return { document, textNode };
}

test("legacy text-node library manifests survive parse, save and reload without native-node migration", () => {
  const { document, textNode } = legacyProject();
  const parsed = parseDocument(document);
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  const restored = parsed.value.nodes[0]!;
  assert.equal(restored.type, "text");
  assert.equal(restored.data.text, textNode.data.text);
  assert.deepEqual(parseLibraryNode(restored.data.text), legacyState);
  assert.equal(restored.data.library, undefined);

  const saved = serializeDocument(parsed.value);
  assert.equal(saved.ok, true);
  if (!saved.ok) return;
  const reopened = parseDocument(saved.value);
  assert.equal(reopened.ok, true);
  if (!reopened.ok) return;
  assert.equal(reopened.value.nodes[0]!.type, "text");
  assert.equal(reopened.value.nodes[0]!.data.text, textNode.data.text);
  assert.deepEqual(parseLibraryNode(reopened.value.nodes[0]!.data.text), legacyState);
});

test("legacy text-node library manifests survive .canvas export and import", async () => {
  const { document, textNode } = legacyProject();
  const archive = await buildCanvasArchive(document);
  const imported = await readCanvasArchive(archive.blob);
  const restored = imported.document.nodes[0]!;
  assert.equal(restored.type, "text");
  assert.equal(restored.data.text, textNode.data.text);
  assert.deepEqual(parseLibraryNode(restored.data.text), legacyState);
  assert.equal(imported.assets, 0);
});

test("legacy text-node library manifests survive copy, paste, undo and redo", () => {
  const { document, textNode } = legacyProject();
  const fragment = copySelection(document, [textNode.id]);
  assert.equal(fragment.nodes[0]!.type, "text");
  assert.equal(fragment.nodes[0]!.data.text, textNode.data.text);

  const pasted = pasteFragment(document, fragment);
  const duplicate = pasted.document.nodes.at(-1)!;
  assert.equal(duplicate.type, "text");
  assert.equal(duplicate.data.text, textNode.data.text);
  assert.deepEqual(parseLibraryNode(duplicate.data.text), legacyState);

  const changed = {
    ...pasted.document,
    nodes: pasted.document.nodes.map((node) =>
      node.id === duplicate.id
        ? { ...node, data: { ...node.data, text: "edited manifest text" } }
        : node,
    ),
  };
  const history = recordChange(createHistory(pasted.document), changed);
  const undone = undo(history);
  assert.equal(undone.present.nodes.at(-1)!.data.text, textNode.data.text);
  const redone = redo(undone);
  assert.equal(redone.present.nodes.at(-1)!.data.text, "edited manifest text");
});

test("all existing Canvas node kinds still pass the persistence boundary", () => {
  const kinds: CanvasNodeKind[] = [
    "image", "video", "audio", "file", "text", "library",
    "group", "timeline", "subject", "stack", "tool", "external",
  ];
  const document = createDocument("Tipos de nós");
  document.nodes = kinds.map((kind) =>
    createNode(kind, { x: document.nodes.length * 24, y: 0 }),
  );
  const saved = serializeDocument(document);
  assert.equal(saved.ok, true);
  if (!saved.ok) return;
  const restored = parseDocument(saved.value);
  assert.equal(restored.ok, true);
  if (!restored.ok) return;
  assert.deepEqual(restored.value.nodes.map((node) => node.type), kinds);
});
