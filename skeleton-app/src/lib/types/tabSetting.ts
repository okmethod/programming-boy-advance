import type { ComponentType } from "svelte";

interface TabSetting {
  index: number;
  label: string;
  title: string;
}

export interface SlotTabSetting extends TabSetting {
  path: string;
}
