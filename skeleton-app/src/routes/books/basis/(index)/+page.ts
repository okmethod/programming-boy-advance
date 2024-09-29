import type { LoadEvent } from "@sveltejs/kit";
import type { SlotTabSetting } from "$lib/types/tabSetting";

export async function load({ parent }: LoadEvent): Promise<{ slotTabSettings: SlotTabSetting[] }> {
  const parentData = await parent();
  return { slotTabSettings: parentData.slotTabSettings };
}
