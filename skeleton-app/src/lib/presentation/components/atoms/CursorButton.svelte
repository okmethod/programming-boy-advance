<script lang="ts">
  interface CursorButtonProps {
    label: string;
    cButton?: string;
    cCursor?: string;
    disabled?: boolean;
    onClick: () => void;
  }

  let { label, cButton = "", cCursor = "", disabled = false, onClick }: CursorButtonProps = $props();
</script>

<button type="button" class="btn bg-initial text-surface-900 group {cButton}" onclick={onClick} {disabled}>
  <span class="invisible group-hover:visible {cCursor}"> ▶ </span>
  <span class="group-hover:underline"> {label} </span>
</button>
