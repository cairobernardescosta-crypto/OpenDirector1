# Library integrity and safety

This phase makes the Agent transfer fail closed when a collection or one of its media records changes while a batch is being read. A missing or trashed item is reported by its original ID; another file is never substituted in its place.

## Transfer safeguards

- Collection resolutions must match the requested collection and contain valid, unique UUIDs. Fixed selections are capped at 1,000 IDs and retain their saved order.
- Duplicate, unexpected, malformed, or oversized records are rejected before transfer. Missing records become unavailable IDs.
- Only active media assets become references. Trashed records, subjects, and missing files cannot become media references.
- The Agent reads bytes only after checking the resolved item revision and declared size. The actual blob size is checked again before import.
- The collection is resolved again after reading. A changed membership list, unavailable list, item revision, media kind, MIME type, or byte size aborts the batch. No replacement file is selected automatically.
- Identical content that resolves to the same project asset ID is attached only once. Existing draft assets are not duplicated.
- The transfer is cancelled when its AbortSignal is cancelled. A failed or blocked batch is not committed to the Agent draft.
- Native node state rejects duplicate IDs, dynamic-mode snapshots, selections without a collection, invalid active-item pairs, and selections above 1,000.
- The project snapshot stores the collection binding and selection only. It does not store library media bytes. Reopening the project restores the node configuration and resolves media again when the Agent requests it.

## Automated coverage added

- tests/libraryReferenceContract.test.ts: unavailable and trashed files, fixed ordering, missing records, duplicate IDs, malformed metadata, collection mutation, deletion, revision changes, and the 1,000-item limit.
- tests/localLibraryNode.test.ts: duplicate selections, invalid dynamic snapshots, and native selection limits.
- tests/canvasStorage.test.ts: native Library configuration and locked-node state survive serialization and reopening.

## Manual integration matrix

The following scenarios require a running API, browser, and real Library data. They cannot be proven by GitHub API writes or unit-test source alone.

| Scenario | Action | Expected result |
|---|---|---|
| Delete selected file | Trash or permanently remove an item, then send the node | Transfer stops and names the unavailable file; no other file replaces it |
| Restore selected file | Restore the same item and refresh the node | The original item ID resolves again |
| Change dynamic collection | Add or remove a member while a transfer is in progress | The second resolution detects the changed membership and aborts |
| Change fixed collection | Remove a saved ID from the collection | The fixed selection reports the unavailable original ID |
| Revise media | Rename or replace an item during transfer | Revision or metadata mismatch aborts the batch |
| Duplicate records | Inject repeated IDs into a resolution | Resolution is rejected |
| Duplicate content | Add two entries with identical bytes | The same project asset ID is attached once |
| Locked node | Lock the node, save, close, and reopen the project | Lock and collection configuration remain intact |
| Limit | Select 1,001 IDs or attempt to attach more than 64 Agent references | The operation is blocked with no silent truncation |
| Reopen project | Save fixed and dynamic nodes, close, and reopen | Collection ID, mode, ordered fixed IDs, and lock state persist |
| Cancel transfer | Cancel while bytes are being fetched | Fetch is aborted and the draft is not committed |

## Validation status

Tests were added through the GitHub API. They have **not** been executed in the local Windows checkout. The manual integration matrix is also pending. A passing GitHub commit or empty CI status is not evidence that these scenarios were executed.
