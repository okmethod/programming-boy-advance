<script lang="ts">
  // フレーム列の再生コントロール。再生ループ（自動送り）もここに閉じ込める。
  interface PlaybackControlsProps {
    frameIndex: number;
    playing: boolean;
    lastIndex: number;
    clock: number;
  }

  let { frameIndex = $bindable(), playing = $bindable(), lastIndex, clock }: PlaybackControlsProps = $props();

  // 再生ループ（0.4秒ごとに1フレーム進める）。末尾に達したら止める。
  $effect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      if (frameIndex >= lastIndex) {
        playing = false;
      } else {
        frameIndex++;
      }
    }, 400);
    return () => clearInterval(id);
  });
</script>

<div class="flex flex-col gap-2">
  <div class="flex items-center gap-2">
    <button
      class="rounded border border-gray-400 px-3 py-1 text-sm hover:bg-gray-100"
      onclick={() => {
        frameIndex = 0;
        playing = false;
      }}>⏮ 最初</button
    >
    <button
      class="rounded border border-gray-400 px-3 py-1 text-sm hover:bg-gray-100 disabled:opacity-40"
      disabled={frameIndex === 0}
      onclick={() => (frameIndex = Math.max(0, frameIndex - 1))}>◀</button
    >
    <button
      class="rounded border border-gray-800 bg-gray-800 px-4 py-1 text-sm text-white disabled:opacity-40"
      disabled={frameIndex >= lastIndex}
      onclick={() => (playing = !playing)}>{playing ? "⏸ 停止" : "▶ 再生"}</button
    >
    <button
      class="rounded border border-gray-400 px-3 py-1 text-sm hover:bg-gray-100 disabled:opacity-40"
      disabled={frameIndex >= lastIndex}
      onclick={() => (frameIndex = Math.min(lastIndex, frameIndex + 1))}>▶</button
    >
    <span class="ml-2 text-sm tabular-nums">clock {clock} ・ {frameIndex} / {lastIndex}</span>
  </div>

  <input type="range" min="0" max={lastIndex} bind:value={frameIndex} class="w-full" />
</div>
