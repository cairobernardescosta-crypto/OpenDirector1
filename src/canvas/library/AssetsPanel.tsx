/** Assets: global media backed up from uploads and canvases. */
import { useEffect, useRef, useState } from "react";
import { errorMessage } from "../../backend/api";
import { useT } from "../../i18n/I18nProvider";
import {
  ASSET_CATEGORIES,
  createCollection,
  deleteCollection,
  listCollections,
  setCollectionItems,
  type LibraryCollection,
  listItems,
  peekItems,
  sameLibraryItems,
  trashItems,
  uploadItem,
  type LibraryItem,
  type LibraryMediaKind,
} from "./libraryClient";
import { MediaCard } from "./MediaCard";

const ICONS: Record<string, "image" | "video" | "audio" | "file"> = {
  image: "image",
  video: "video",
  audio: "audio",
  file: "file",
};

export function AssetsPanel({
  query,
  selected,
  onToggle,
  onChanged,
  onNotice,
  onState,
  disabled = false,
  reloadKey,
}: {
  query: string;
  selected: Set<string>;
  onToggle: (item: LibraryItem) => void;
  onChanged: () => void;
  onNotice: (message: string) => void;
  /** Report the current page so the dialog can validate its single selection. */
  onState: (items: LibraryItem[], busy: boolean) => void;
  disabled?: boolean;
  reloadKey: number;
}) {
  const t = useT();
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [kind, setKind] = useState<LibraryMediaKind | "">("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [collections, setCollections] = useState<LibraryCollection[]>([]);
  const [collectionId, setCollectionId] = useState("");
  const [browseAll, setBrowseAll] = useState(false);
  const [newCollection, setNewCollection] = useState("");
  const [creatingCollection, setCreatingCollection] = useState(false);
  const currentCollection = collections.find((collection) => collection.id === collectionId);
  const visibleItems = currentCollection && !browseAll
    ? items.filter((item) => currentCollection.itemIds.includes(item.id))
    : items;
  const refreshCollections = async () => setCollections(await listCollections());
  useEffect(() => {
    let active = true;
    listCollections().then((rows) => {
      if (active) setCollections(rows);
    }).catch((reason) => { if (active) setError(errorMessage(reason)); });
    return () => { active = false; };
  }, []);
  const manageCollection = async (action: "create" | "add" | "remove" | "delete") => {
    setBusy(true);
    setError("");
    try {
      if (action === "create") {
        const created = await createCollection(newCollection);
        setNewCollection("");
        setCreatingCollection(false);
        await refreshCollections();
        setCollectionId(created.id);
        onNotice(t("library.collections.created"));
      } else if (currentCollection) {
        const ids = items.filter((item) => selected.has(item.id)).map((item) => item.id);
        if (action === "delete") {
          await deleteCollection(currentCollection.id);
          setCollectionId("");
          onNotice(t("library.collections.deleted"));
        } else {
          const next = action === "add"
            ? [...new Set([...currentCollection.itemIds, ...ids])]
            : currentCollection.itemIds.filter((id) => !ids.includes(id));
          await setCollectionItems(currentCollection.id, next);
          onNotice(t("library.collections.saved"));
        }
        await refreshCollections();
      }
      onChanged();
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  };
  const input = useRef<HTMLInputElement>(null);
  useEffect(
    () => onState(visibleItems, busy || Boolean(error)),
    [items, collections, collectionId, browseAll, busy, error, onState],
  );
  useEffect(() => {
    let active = true;
    const filters = {
      kind: "asset" as const,
      state: "active" as const,
      query,
      mediaKind: kind || undefined,
    };
    // A reopened tab paints the rows already fetched instead of an empty grid.
    const seed = peekItems(filters);
    if (seed) {
      setItems(seed);
      setBusy(false);
    } else setBusy(true);
    setError("");
    listItems(filters)
      .then((rows) => {
        if (active)
          setItems((previous) =>
            sameLibraryItems(previous, rows) ? previous : rows,
          );
      })
      .catch((reason) => {
        if (active) setError(errorMessage(reason));
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, [query, kind, reloadKey]);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setError("");
    setBusy(true);
    try {
      for (const file of Array.from(files)) await uploadItem(file);
      onNotice(t("library.assets.uploaded", { count: files.length }));
      onChanged();
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  const remove = async () => {
    const ids = items
      .filter((item) => selected.has(item.id))
      .map((item) => item.id);
    if (!ids.length) return;
    setBusy(true);
    try {
      await trashItems(ids);
      onNotice(t("library.assets.trashed", { count: ids.length }));
      onChanged();
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="cw-lib-panel">
      <div className="cw-lib-tabs">
        <label>
          {t("library.collections.label")}
          <select
            aria-label={t("library.collections.label")}
            value={collectionId}
            disabled={disabled || busy}
            onChange={(event) => { setCollectionId(event.target.value); setBrowseAll(false); onChanged(); }}
          >
            <option value="">{t("library.collections.all")}</option>
            {collections.map((entry) => (
              <option key={entry.id} value={entry.id}>{entry.name}</option>
            ))}
          </select>
        </label>
        <button type="button" disabled={disabled || busy}
          onClick={() => setCreatingCollection((value) => !value)}>
          {t("library.collections.new")}
        </button>
        {currentCollection && (
          <>
            <button type="button" disabled={disabled || busy}
              onClick={() => { setBrowseAll((value) => !value); onChanged(); }}>
              {browseAll ? currentCollection.name : t("library.collections.browse")}
            </button>
            <button type="button" disabled={disabled || busy || !selected.size}
              onClick={() => void manageCollection("add")}>{t("library.collections.add")}</button>
            <button type="button" disabled={disabled || busy || !selected.size}
              onClick={() => void manageCollection("remove")}>{t("library.collections.remove")}</button>
            <button type="button" disabled={disabled || busy}
              onClick={() => void manageCollection("delete")}>{t("library.collections.delete")}</button>
          </>
        )}
      </div>
      {creatingCollection && (
        <form className="cw-lib-tabs" onSubmit={(event) => { event.preventDefault(); void manageCollection("create"); }}>
          <input aria-label={t("library.collections.name")} placeholder={t("library.collections.name")}
            value={newCollection} maxLength={255} required
            onChange={(event) => setNewCollection(event.target.value)} />
          <button type="submit" disabled={disabled || busy || !newCollection.trim()}>
            {t("library.collections.create")}
          </button>
        </form>
      )}
      <div className="cw-lib-tabs">
        <button
          type="button"
          className={kind === "" ? "cw-lib-tab cw-lib-tab-on" : "cw-lib-tab"}
          disabled={disabled}
          onClick={() => {
            onChanged();
            setKind("");
          }}
        >
          {t("library.all")}
        </button>
        {ASSET_CATEGORIES.map((category) => (
          <button
            key={category.key}
            type="button"
            className={
              kind === category.key ? "cw-lib-tab cw-lib-tab-on" : "cw-lib-tab"
            }
            disabled={disabled}
            onClick={() => {
              onChanged();
              setKind(category.key);
            }}
          >
            {t(category.labelKey)}
          </button>
        ))}
        <div className="cw-lib-tab-actions">
          <input
            ref={input}
            type="file"
            multiple
            hidden
            onChange={(event) => void upload(event.target.files)}
          />
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={disabled || busy}
          >
            {t("library.assets.upload")}
          </button>
          <button
            type="button"
            onClick={() => void remove()}
            disabled={
              disabled || busy || !visibleItems.some((item) => selected.has(item.id))
            }
          >
            {t("library.moveToTrash")}
          </button>
        </div>
      </div>
      {error && <p role="alert">{error}</p>}
      {busy && !visibleItems.length && (
        <p role="status">{t("library.assets.loading")}</p>
      )}
      {!busy && !visibleItems.length && (
        <p className="cw-lib-empty">{t("library.assets.empty")}</p>
      )}
      <div className="cw-lib-grid">
        {visibleItems.map((item) => (
          <MediaCard
            key={item.id}
            title={item.name}
            icon={ICONS[item.mediaKind ?? "file"]}
            item={
              item.mediaKind === "image" ||
              item.mediaKind === "video" ||
              item.mediaKind === "audio"
                ? item
                : undefined
            }
            selected={selected.has(item.id)}
            disabled={disabled || busy}
            onSelect={() => onToggle(item)}
          />
        ))}
      </div>
    </div>
  );
}
