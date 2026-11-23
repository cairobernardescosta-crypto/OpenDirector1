import { useEffect, useState } from "react";
import type { CanvasActions } from "../CanvasActionsContext";
import { CanvasIcon } from "../CanvasIcon";
import { useT } from "../../i18n/I18nProvider";
import { errorMessage } from "../../backend/api";
import { listCollections, resolveCollection, type LibraryCollection, type LibraryCollectionResolution } from "./libraryClient";
import { encodeLibraryNode, type LibraryNodeState } from "./libraryNodeState";
import { MediaCard } from "./MediaCard";
import "./local-library-node.css";

/** Library card: the reference manifest is data, not a media generator.
 * Existing text-node persistence keeps historic canvas contracts unchanged. */
export function LocalLibraryNode({
  id,
  state,
  actions,
  locked,
}: {
  id: string;
  state: LibraryNodeState;
  actions: CanvasActions | null;
  locked: boolean;
}) {
  const t = useT();
  const [collections, setCollections] = useState<LibraryCollection[]>([]);
  const [resolved, setResolved] = useState<LibraryCollectionResolution | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [shown, setShown] = useState(12);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let active = true;
    listCollections({ fresh: true })
      .then((rows) => { if (active) setCollections(rows); })
      .catch((reason) => { if (active) setError(errorMessage(reason)); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    setResolved(null);
    setError("");
    if (!state.collectionId) { setBusy(false); return; }
    setBusy(true);
    resolveCollection(state.collectionId)
      .then((data) => {
        if (!active) return;
        setError("");
        setResolved(data);
      })
      .catch((reason) => { if (active) setError(errorMessage(reason)); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [state.collectionId, refresh]);

  const change = (patch: Partial<LibraryNodeState>) => {
    if (locked) return;
    actions?.update(id, { text: encodeLibraryNode({ ...state, ...patch }) });
  };
  const current = collections.find((item) => item.id === state.collectionId);
  const matching = resolved?.items.filter((item) =>
    item.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())
  ) ?? [];
  return (
    <div className="cw-local-library nodrag nopan nowheel" onPointerDown={(event) => event.stopPropagation()}>
      <label className="cw-local-library-line">
        <span>{t("library.node.collection")}</span>
        <select value={state.collectionId} disabled={locked || busy}
          onChange={(event) => change({ collectionId: event.target.value, itemIds: [] })}>
          <option value="">{t("library.node.choose")}</option>
          {collections.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}
          {state.collectionId && !current &&
            <option value={state.collectionId}>{t("library.node.unavailable")}</option>}
        </select>
      </label>
      <label className="cw-local-library-line">
        <span>{t("library.node.mode")}</span>
        <select value={state.mode} disabled={locked || !state.collectionId}
          onChange={(event) => change({
            mode: event.target.value === "fixed" ? "fixed" : "dynamic",
            itemIds: event.target.value === "fixed" ? resolved?.items.slice(0, 1000).map((item) => item.id) ?? state.itemIds : [],
          })}>
          <option value="dynamic">{t("library.node.dynamic")}</option>
          <option value="fixed">{t("library.node.fixed")}</option>
        </select>
      </label>
      {error && <p className="cw-local-library-error" role="alert">{error}</p>}
      {!state.collectionId && <p className="cw-local-library-hint">{t("library.node.chooseHint")}</p>}
      {busy && <p className="cw-local-library-hint">{t("library.assets.loading")}</p>}
      {resolved && (
        <>
          <div className="cw-local-library-search">
            <input value={search} placeholder={t("library.search.placeholder")}
              aria-label={t("library.search.label")}
              onChange={(event) => { setSearch(event.target.value); setShown(12); }} />
            <button type="button" onClick={() => setRefresh((value) => value + 1)}
              aria-label={t("library.node.refresh")} title={t("library.node.refresh")}>
              <CanvasIcon name="history" size={14} />
            </button>
          </div>
          <div className="cw-local-library-meta">
            <span>{state.mode === "fixed" ? resolved.items.filter((item) => state.itemIds.includes(item.id)).length : resolved.items.length} {t("library.node.files")}</span>
            {(state.mode === "fixed" ? state.itemIds.filter((id) => !resolved.items.some((item) => item.id === id)).length : resolved.unavailableIds.length) > 0 && (
              <span className="cw-local-library-error">
                {state.mode === "fixed" ? state.itemIds.filter((id) => !resolved.items.some((item) => item.id === id)).length : resolved.unavailableIds.length} {t("library.node.missing")}
              </span>
            )}
          </div>
          <div className="cw-local-library-grid">
            {matching.slice(0, shown).map((item) => (
              <MediaCard key={item.id} title={item.name}
                item={item.mediaKind === "image" || item.mediaKind === "video" || item.mediaKind === "audio" ? item : undefined}
                icon={item.mediaKind ?? "file"}
                selectable={state.mode === "fixed" && !locked}
                selected={state.itemIds.includes(item.id)}
                onSelect={() => change({
                  itemIds: state.itemIds.includes(item.id)
                    ? state.itemIds.filter((id) => id !== item.id)
                    : [...state.itemIds, item.id].slice(0, 1000),
                })}
              />
            ))}
          </div>
          {matching.length > shown && (
            <button className="cw-local-library-more" type="button"
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
    </div>
  );
}
