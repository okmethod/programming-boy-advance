import type { ToastSettings } from "@skeletonlabs/skeleton";

export type ToastStatus = "Succeed" | "Warning" | "Error";

interface ToastSetting {
  cBackground: string;
  autohide: boolean;
}

const toastSettingMap: Record<ToastStatus, ToastSetting> = {
  Succeed: { cBackground: "bg-green-100", autohide: true },
  Warning: { cBackground: "bg-yellow-100", autohide: true },
  Error: { cBackground: "bg-red-100", autohide: false },
};

export function simpleToast(message: string, status: ToastStatus): ToastSettings {
  const toastSetting = toastSettingMap[status];
  return {
    message: message,
    background: `${toastSetting.cBackground} select-none`,
    timeout: 2000,
    autohide: toastSetting.autohide,
  };
}
