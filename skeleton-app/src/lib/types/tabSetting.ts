interface TabSetting {
  index: number;
  label: string;
  title: string;
}

export interface SlotTabSetting extends TabSetting {
  path: string;
}
