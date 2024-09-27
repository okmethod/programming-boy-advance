<script lang="ts">
  type CodeBlockData = [string, string];
  export let data: CodeBlockData | CodeBlockData[];

  function isCodeBlockDataArray(data: CodeBlockData | CodeBlockData[]): data is CodeBlockData[] {
    return Array.isArray(data) && Array.isArray(data[0]);
  }
</script>

<span class="px-2 py-1 font-mono bg-gray-800 rounded">
  {#if isCodeBlockDataArray(data)}
    {#each data as [text, cStyle]}
      <span class={cStyle}>{text}</span>
    {/each}
  {:else}
    <span class={data[1]}>{data[0]}</span>
  {/if}
</span>
