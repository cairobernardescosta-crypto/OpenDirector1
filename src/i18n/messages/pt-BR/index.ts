/** Native Portuguese catalog with explicit English fallback for untranslated modules.
 * This intentionally preserves all stable keys while translation coverage expands.
 */
import { enUS } from "../en-US/index.ts";
import { common } from "./common.ts";
import { settings } from "./settings.ts";
import { library } from "./library.ts";
import { assistant } from "./assistant.ts";
import { generation } from "./generation.ts";
import { canvas } from "./canvas.ts";
import { canvasShell } from "./canvasShell.ts";
import { canvasWorkspace } from "./canvasWorkspace.ts";
import { modelSetup } from "./modelSetup.ts";
import type { MessageEntry } from "../../types.ts";
export const ptBR: Record<keyof typeof enUS, MessageEntry> = {
  ...enUS,
  ...common,
  ...settings,
  ...library,
  ...assistant,
  ...generation,
  ...canvas,
  ...canvasShell,
  ...canvasWorkspace,
  ...modelSetup,
};
