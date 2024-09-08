import type { ToastSettings } from "@skeletonlabs/skeleton";

export function simpleToast(message: string, succeed: boolean): ToastSettings {
  const cBackground = succeed ? "bg-green-100" : "bg-red-100";
  return {
    message: message,
    background: `${cBackground} select-none`,
    timeout: 2000,
    autohide: succeed,
  };
}
