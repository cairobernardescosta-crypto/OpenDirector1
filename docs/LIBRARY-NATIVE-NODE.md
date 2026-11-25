# Native Library Canvas Node

The Library is now a first-class Canvas item with `kind: "library"`. New nodes persist their collection binding as a typed editor document instead of encoding configuration inside a text node.

## Persisted contract

- Canvas item: `LibraryCanvasItem`, with an editor binding whose reference kind is `library`.
- Editor document: `LibraryDocument`.
- Data: `collectionId`, `mode`, ordered `itemIds`, optional `activeItemId`, and optional `activeMediaKind`.
- Dynamic mode follows the collection and cannot store a fixed `itemIds` selection.
- Fixed mode stores only the selected IDs, preserving their order.
- Collection and media IDs are UUIDs. A node can exist before a collection is selected.

The document and its canvas item are stored in the normal project snapshot. Library media bytes remain in the Library service and are resolved only when a consumer requests the selected batch. The Library node itself does not create one Canvas node per file.

## Backward compatibility

Older projects may contain a text node whose text begins with `opendirector:local-library:v1:`. The reader and renderer continue to recognize that legacy representation. It is not rewritten merely by opening the project. New nodes use the native type, while legacy nodes remain readable and editable in their original representation.

## Agent integration

The native node is offered as one Agent mention. The Agent resolves its collection and selection through the Library client, then receives the media references through the existing reference transport. The Library manifest is never treated as prompt text or as a media-generation source.
