import { createToaster } from "@skeletonlabs/skeleton-svelte";

export type ToastStatus = "Succeed" | "Warning" | "Error";

// Skeleton v5 のトースター。表示は +layout.svelte の <Toast.Group> が担う
export const toaster = createToaster({
  placement: "top-end",
});

const toastTypeMap: Record<ToastStatus, "success" | "warning" | "error"> = {
  Succeed: "success",
  Warning: "warning",
  Error: "error",
};

// ステータスに応じたトーストを表示する（旧 toastStore.trigger(simpleToast(...)) を置換）
export function simpleToast(message: string, status: ToastStatus): void {
  toaster.create({ title: message, type: toastTypeMap[status] });
}
