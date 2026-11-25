import { useEffect, useMemo, useRef, useState } from "react";
import type { CanvasActions } from "../CanvasActionsContext";
import { CanvasIcon } from "../CanvasIcon";
import { useT } from "../../i18n/I18nProvider";
import { errorMessage } from "../../backend/api";
import { listCollections, resolveCollection, type LibraryCollection, type LibraryCollectionResolution, type LibraryMediaKind, type LibraryItem } from "./libraryClient";
import { encodeLibraryNode, libraryResolutionSelection, setLibraryNodeMode, toggleLibraryNodeItem, type LibraryNodeState } from "./libraryNodeState";
import { createLibraryReferenceBatch } from "./libraryReferenceContract";
import { MediaCard } from "./MediaCard";
import { LocalLibraryPreview } from "./LocalLibraryPreview";
import "./local-library-node.css";

/** Library card: the reference manifest is data, not a media generator.
 * Existing text-node persistence keeps historic canvas contracts unchanged. */
export function LocalLibraryNode({
  id,
  state,
  actions,
  locked,
  native = false,
}: {
  id: string;
  state: LibraryNodeState;
  actions: CanvasActions | null;
  locked: boolean;
  native?: boolean;
}) {
  const t = useT();
  const [collections, setCollections] = useState<LibraryCollection[]>([]);
  const [collectionsBusy, setCollectionsBusy] = useState(true);
  const [collectionsError, setCollectionsError] = useState("");
  const [collectionsRefresh, setCollectionsRefresh] = useState(0);
  const [resolved, setResolved] = useState<LibraryCollectionResolution | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [mediaFilter, setMediaFilter] = useState<LibraryMediaKind | "">("");
  const [shown, setShown] = useState(12);
  const [refresh, setRefresh] = useState(0);
  const [previewItem, setPreviewItem] = useState<LibraryItem | null>(null);
  const latestState = useRef(state);

  useEffect(() => {
    latestState.current = state;
  }, [state]);

  useEffect(() => {
    let active = true;
    setCollectionsBusy(true);
    setCollectionsError("");
    listCollections({ fresh: true })
      .then((rows) => {
        if (!active) return;
        if (!Array.isArray(rows)) throw new Error("A biblioteca retornou uma lista de coleções inválida.");
        setCollections(rows);
      })
      .catch((reason) => {
        if (active) setCollectionsError(errorMessage(reason));
      })
      .finally(() => {
        if (active) setCollectionsBusy(false);
      });
    return () => { active = false; };
  }, [collectionsRefresh]);

  const fixedItemIdsKey = state.mode === "fixed" ? state.itemIds.join(",") : "";
  const batchResult = useMemo(() => {
    if (!resolved) return { batch: null, error: "" };
    try {
      return { batch: createLibraryReferenceBatch(id, state, resolved), error: "" };
    } catch (reason) {
      return { batch: null, error: errorMessage(reason) };
    }
  }, [id, state, resolved]);

  useEffect(() => {
    let active = true;
    setResolved(null);
    setError("");
    if (!state.collectionId) { setBusy(false); return; }
    setBusy(true);
    resolveCollection(
      state.collectionId,
      libraryResolutionSelection(state),
    )
      .then((data) => {
        if (!active) return;
        setError("");
        setResolved(data);
      })
      .catch((reason) => { if (active) setError(errorMessage(reason)); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [state.collectionId, state.mode, fixedItemIdsKey, refresh]);

  const change = (patch: Partial<LibraryNodeState>) => {
    if (locked || !actions) return;
    const next = { ...latestState.current, ...patch };
    latestState.current = next;
    actions.update(id, native ? { library: next } : { text: encodeLibraryNode(next) });
  };
  const current = collections.find((item) => item.id === state.collectionId);
  const matching = resolved?.items.filter((item) =>
    item.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()) &&
    (!mediaFilter || item.mediaKind === mediaFilter)
  ) ?? [];
  return (
    <div className="cw-local-library nowheel" onDoubleClick={(event) => event.stopPropagation()}>
      <label className="cw-local-library-line">
        <span>{t("library.node.collection")}</span>
        <select className="nodrag nopan nowheel" value={state.collectionId} disabled={locked || busy || collectionsBusy}
          onPointerDown={(event) => event.stopPropagation()}
          onChange={(event) => change({ collectionId: event.target.value, itemIds: [], activeItemId: undefined, activeMediaKind: undefined })}>
          <option value="">{t("library.node.choose")}</option>
          {collections.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}
          {state.collectionId && !current &&
            <option value={state.collectionId}>{t("library.node.unavailable")}</option>}
        </select>
      </label>
      {collectionsBusy && <p className="cw-local-library-hint">{t("library.assets.loading")}</p>}
      {collectionsError && (
        <div>
          <p className="cw-local-library-error" role="alert">{collectionsError}</p>
          <button type="button" className="nodrag nopan nowheel"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => setCollectionsRefresh((value) => value + 1)}>
            {t("library.node.refresh")}
          </button>
        </div>
      )}
      <label className="cw-local-library-line">
        <span>{t("library.node.mode")}</span>
        <select className="nodrag nopan nowheel" value={state.mode} disabled={locked || !state.collectionId}
          onPointerDown={(event) => event.stopPropagation()}
          onChange={(event) => change(setLibraryNodeMode(
            state,
            event.target.value === "fixed" ? "fixed" : "dynamic",
            resolved?.items.map((item) => item.id) ?? [],
          ))}>
          <option value="dynamic">{t("library.node.dynamic")}</option>
          <option value="fixed">{t("library.node.fixed")}</option>
        </select>
      </label>
      {error && <p className="cw-local-library-error" role="alert">{error}</p>}
      {batchResult.error && <p className="cw-local-library-error" role="alert">{batchResult.error}</p>}
      {!state.collectionId && <p className="cw-local-library-hint">{t("library.node.chooseHint")}</p>}
      {busy && <p className="cw-local-library-hint">{t("library.assets.loading")}</p>}
      {resolved && (
        <>
          <div className="cw-local-library-search">
            <input className="nodrag nopan nowheel" value={search} placeholder={t("library.search.placeholder")}
              aria-label={t("library.search.label")}
              onPointerDown={(event) => event.stopPropagation()}
              onChange={(event) => { setSearch(event.target.value); setShown(12); }} />
            <select className="nodrag nopan nowheel" value={mediaFilter} aria-label={t("library.node.filter")}
              onPointerDown={(event) => event.stopPropagation()}
              onChange={(event) => { setMediaFilter(event.target.value as LibraryMediaKind | ""); setShown(12); }}>
              <option value="">{t("library.all")}</option>
              <option value="image">{t("library.category.image")}</option>
              <option value="video">{t("library.category.video")}</option>
              <option value="audio">{t("library.category.audio")}</option>
              <option value="file">{t("library.category.file")}</option>
            </select>
            <button type="button" className="nodrag nopan nowheel"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => setRefresh((value) => value + 1)}
              aria-label={t("library.node.refresh")} title={t("library.node.refresh")}>
              <CanvasIcon name="history" size={14} />
            </button>
          </div>
          <div className="cw-local-library-meta">
            <span>{batchResult.batch?.references.length ?? 0} {t("library.node.files")}</span>
            {resolved.unavailableIds.length > 0 && (
              <span className="cw-local-library-error">
                {resolved.unavailableIds.length} {t("library.node.missing")}
              </span>
            )}
          </div>
          <div className="cw-local-library-grid">
            {matching.slice(0, shown).map((item) => (
              <div key={item.id} className="nodrag nopan nowheel">
              <MediaCard title={item.name}
                item={item.mediaKind === "image" || item.mediaKind === "video" || item.mediaKind === "audio" ? item : undefined}
                icon={item.mediaKind ?? "file"}
                selectable={state.mode === "fixed" && !locked}
                selected={state.mode === "fixed" ? state.itemIds.includes(item.id) : state.activeItemId === item.id}
                onOpen={() => change({
                  activeItemId: item.id,
                  activeMediaKind: item.mediaKind ?? "file",
                  ...(state.mode === "fixed" && !state.itemIds.includes(item.id)
                    ? { itemIds: [...state.itemIds, item.id].slice(0, 1000) }
                    : {}),
                })}
                action={state.activeItemId === item.id ? (
                  <>
                    <button type="button" className="cw-local-library-extract cw-local-library-view nodrag nopan"
                      title={t("library.node.view")} aria-label={t("library.node.view")}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        setPreviewItem(item);
                      }}>
                      <CanvasIcon name="preview" size={13}/>
                    </button>
                    {!locked && (
                      <button type="button" className="cw-local-library-extract nodrag nopan"
                        title={t("library.node.extract")}
                        aria-label={t("library.node.extract")}
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          actions?.insertLibraryItem?.(item);
                        }}>
                        <CanvasIcon name="plus" size={13}/>
                      </button>
                    )}
                  </>
                ) : undefined}
                onSelect={() => change(toggleLibraryNodeItem(state, item.id))}
              />
              </div>
            ))}
          </div>
          {state.activeItemId && (
            <p className="cw-local-library-hint">{t("library.node.active")}: {resolved.items.find((item) => item.id === state.activeItemId)?.name ?? t("library.node.unavailable")}</p>
          )}
          {matching.length > shown && (
            <button className="cw-local-library-more nodrag nopan nowheel" type="button"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => setShown((value) => value + 24)}>
              {t("library.node.more")} (+{matching.length - shown})
            </button>
          )}
          {state.mode === "fixed" && (
            <p className="cw-local-library-hint">{t("library.node.fixedHint")}</p>
          )}
        </>
      )}
      <p className="cw-local-library-readonly">
        <CanvasIcon name="rail-folder" size={13}/>
        {t("library.node.readOnly")}
      </p>
      {previewItem && (
        <LocalLibraryPreview item={previewItem} onClose={() => setPreviewItem(null)}/>
      )}
    </div>
  );
}
