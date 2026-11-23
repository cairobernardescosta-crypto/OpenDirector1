import { useEffect } from "react";
import { createPortal } from "react-dom";
import { CanvasIcon } from "../CanvasIcon";
import { useT } from "../../i18n/I18nProvider";
import { useItemContentUrl, type LibraryItem } from "./libraryClient";

/** Authentic original-byte preview above the canvas, never clipped by node
 * dimensions and never inserted into a generator by simply opening it. */
export function LocalLibraryPreview({
  item,
  onClose,
}: {
  item: LibraryItem;
  onClose: () => void;
}) {
  const t = useT();
  const url = useItemContentUrl(item);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [onClose]);
  return createPortal(
    <div className="cw-local-library-preview-overlay" role="presentation"
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="cw-local-library-preview-dialog" role="dialog"
        aria-modal="true" aria-label={item.name}>
        <header>
          <span title={item.name}>{item.name}</span>
          <button type="button" aria-label={t("library.node.closePreview")}
            onClick={onClose}>
            <CanvasIcon name="close" size={18} />
          </button>
        </header>
        <div className="cw-local-library-preview-content">
          {!url ? (
            <p>{t("library.assets.loading")}</p>
          ) : item.mediaKind === "image" ? (
            <img src={url} alt={item.name}/>
          ) : item.mediaKind === "video" ? (
            <video src={url} controls autoPlay playsInline/>
          ) : item.mediaKind === "audio" ? (
            <audio src={url} controls/>
          ) : (
            <p>{item.name}</p>
          )}
        </div>
      </section>
    </div>,
    document.body,
  );
}
