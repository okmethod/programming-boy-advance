<script lang="ts">
  export let label: string;
  export let cButton: string = "";
  export let cCursor: string = "";
  export let disabled: boolean = false;
  export let onClick: () => void;
</script>

<button type="button" class="btn bg-initial text-surface-900 group {cButton}" on:click={onClick} {disabled}>
  <span class="invisible group-hover:visible {cCursor}"> ▶ </span>
  <span class="group-hover:underline"> {label} </span>
</button>
