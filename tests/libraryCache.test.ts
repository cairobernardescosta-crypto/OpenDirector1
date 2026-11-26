import assert from "node:assert/strict";
import test from "node:test";
import { invalidateCached } from "../src/backend/requestCache.ts";
import { canvasSources } from "../src/backend/canvasSources.ts";
import { listWorkspaceProjects } from "../src/backend/workspace.ts";
import { itemBlob, listItems, renameItem, type LibraryItem } from "../src/canvas/library/libraryClient.ts";

/** The cache wraps these clients; every test starts from an empty page cache. */
function stub(t: test.TestContext, body: unknown = []) {
  invalidateCached();
  const old = globalThis.fetch;
  const calls: { path: string; method: string }[] = [];
  globalThis.fetch = (async (url: string, options?: RequestInit) => {
    calls.push({ path: String(url), method: options?.method ?? "GET" });
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }) as typeof fetch;
  t.after(() => {
    globalThis.fetch = old;
    invalidateCached();
  });
  return calls;
}

test("the asset list is read once for a repeated filter", async (t) => {
  const calls = stub(t);
  await listItems({ kind: "asset", state: "active" });
  await listItems({ kind: "asset", state: "active" });
  assert.equal(calls.length, 1);
  assert.match(calls[0]!.path, /\/api\/library\/items\?kind=asset&state=active$/);

  await listItems({ kind: "asset", state: "active", mediaKind: "image" });
  assert.equal(calls.length, 2);
});

test("fresh asks the server again", async (t) => {
  const calls = stub(t);
  await listItems({ kind: "asset" });
  await listItems({ kind: "asset" }, { fresh: true });
  assert.equal(calls.length, 2);
});

test("a library write drops the cached lists", async (t) => {
  const calls = stub(t);
  await listItems({ kind: "asset", state: "active" });
  await renameItem("item-a", "新名字");
  await listItems({ kind: "asset", state: "active" });
  assert.deepEqual(
    calls.map((call) => call.method),
    ["GET", "PATCH", "GET"],
  );
});

test("the project list is read once while it stays fresh", async (t) => {
  const calls = stub(t, { projects: [], warnings: [] });
  await listWorkspaceProjects();
  await listWorkspaceProjects();
  assert.equal(calls.length, 1);
  assert.equal(calls[0]!.path, "/api/creation/projects");
});

test("canvas sources are cached per project", async (t) => {
  const calls = stub(t);
  await canvasSources("project-a");
  await canvasSources("project-a");
  assert.equal(calls.length, 1);
  await canvasSources("project-b");
  assert.equal(calls.length, 2);
});

function mediaItem(mediaKind: "image" | "video" | "audio" | "file"): LibraryItem {
  const bytes = new Blob(["media"]);
  return {
    id: "11111111-1111-4111-8111-111111111111",
    kind: "asset",
    state: "active",
    name: `sample.${mediaKind}`,
    revision: 1,
    createdAt: "2026-11-26T00:00:00Z",
    trashedAt: null,
    blob: "a".repeat(64),
    subject: null,
    mediaKind,
    metadata: {
      mimeType: mediaKind === "image" ? "image/png"
        : mediaKind === "video" ? "video/mp4"
        : mediaKind === "audio" ? "audio/mpeg"
        : "application/pdf",
      size: bytes.size,
      width: null,
      height: null,
      durationSeconds: null,
    },
    preview: null,
    origin: { type: "upload", projectId: null, nodeId: null, assetId: null },
  };
}

test("library byte reads support every media kind", async (t) => {
  const old = globalThis.fetch;
  globalThis.fetch = (async () => new Response(new Blob(["media"]), { status: 200 })) as typeof fetch;
  t.after(() => { globalThis.fetch = old; });

  for (const kind of ["image", "video", "audio", "file"] as const) {
    const blob = await itemBlob(mediaItem(kind));
    assert.equal(blob.size, 5);
  }
});

test("library byte reads stop when their transfer is cancelled", async (t) => {
  const old = globalThis.fetch;
  let called = false;
  globalThis.fetch = ((_url: string, options?: RequestInit) => {
    called = true;
    return new Promise<Response>((_resolve, reject) => {
      options?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
    });
  }) as typeof fetch;
  t.after(() => { globalThis.fetch = old; });

  const controller = new AbortController();
  const pending = itemBlob(mediaItem("video"), controller.signal);
  await Promise.resolve();
  controller.abort();
  await assert.rejects(pending, /abort/i);
  assert.equal(called, true);
});
