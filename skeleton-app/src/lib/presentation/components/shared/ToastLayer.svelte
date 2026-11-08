<script lang="ts">
  // トースト通知の固定表示層＝Portal で body 直下へ退避し、右上に積む自己完結ブロック。
  // 中身を受けない固定層（器ではない）。アプリに1つだけ layout に置く。
  import { Portal, Toast } from "@skeletonlabs/skeleton-svelte";
  import Icon from "@iconify/svelte";
  import { toaster } from "$lib/presentation/utils/toaster";
</script>

<Portal>
  <Toast.Group {toaster} class="fixed top-4 right-4 z-50 flex flex-col gap-2">
    {#snippet children(toast)}
      <Toast {toast} class="card w-64 rounded-lg p-4 shadow-lg md:w-96">
        <div class="flex w-full items-center gap-2">
          <Toast.Title class="flex-1">{toast.title}</Toast.Title>
          <Toast.CloseTrigger class="btn-icon btn-icon-sm preset-tonal ml-auto shrink-0">
            <Icon icon="mdi:close" class="size-4" />
          </Toast.CloseTrigger>
        </div>
      </Toast>
    {/snippet}
  </Toast.Group>
</Portal>
