/** Native Portuguese catalog with explicit English fallback for untranslated modules.
 * This intentionally preserves all stable keys while translation coverage expands.
 */
import { enUS } from "../en-US/index.ts";
import { common } from "./common.ts";
import { settings } from "./settings.ts";
import type { MessageEntry } from "../../types.ts";
export const ptBR: Record<keyof typeof enUS, MessageEntry> = {
  ...enUS,
  ...common,
  ...settings,
};
