<script lang="ts">
  type CodeBlockData = [string, string];
  export let data: CodeBlockData | CodeBlockData[];

  const cTextColor = (color: string): string => {
    const colorStyleMap: { [key: string]: string } = {
      red: "hljs-keyword",
      lightblue: "hljs-string",
      blue: "hljs-number",
      purple: "hljs-title",
      white: "text-gray-200",
    };
    return colorStyleMap[color] || color;
  };

  function isCodeBlockDataArray(data: CodeBlockData | CodeBlockData[]): data is CodeBlockData[] {
    return Array.isArray(data) && Array.isArray(data[0]);
  }
</script>

<span class="px-1 font-mono bg-gray-800 rounded">
  {#if isCodeBlockDataArray(data)}
    {#each data as [text, color]}
      <span class={cTextColor(color)}>{text}</span>
    {/each}
  {:else}
    <span class={cTextColor(data[1])}>{data[0]}</span>
  {/if}
</span>
