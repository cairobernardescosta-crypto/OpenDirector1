# Local Library batches in the Agent

A Library node can be mentioned in the Assistant using `@`. The mention represents the node's resolved collection batch, not a single selected preview item.

When the mention is confirmed:

1. The client resolves the collection using the node's persisted mode and selection.
2. It validates collection identity, selected IDs, order, availability, media kind, revision and byte limits.
3. It reads each selected item and imports the bytes into the current project's asset store, reusing an identical project asset when possible.
4. It adds the resulting project asset references to the Assistant draft. It does not create individual Canvas media nodes and does not change the source collection.
5. The Agent receives normal project asset paths and metadata through the existing assistant turn contract.

The runtime must inspect actual file contents before claiming to understand them. Image/video/audio inspection depends on the selected runtime, installed tools and model capabilities. The Agent is instructed to use image-capable inspection for images, ffprobe/ffmpeg for video when available, and suitable audio tools when available. If a format cannot be inspected, it must say so rather than infer content from the filename.

The transfer creates project-owned copies so the Agent can access stable files during its run. The original Library items remain unchanged. Imported project assets remain in the project asset store even if the user later removes their references from the chat draft.
