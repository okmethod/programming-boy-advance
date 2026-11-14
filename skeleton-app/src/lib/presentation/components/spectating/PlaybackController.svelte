<script lang="ts">
  import Icon from "@iconify/svelte";

  // フレーム列の再生コントロール。再生ループ（自動送り）もここに閉じ込める。
  interface PlaybackControllerProps {
    frameIndex: number;
    playing: boolean;
    lastIndex: number;
    clock: number;
    // 停止→再生へ切り替える瞬間に、演出フィードバックを発火する。再開のたびに鳴る。
    onStart?: (anchor: HTMLElement) => void;
  }

  let {
    frameIndex = $bindable(),
    playing = $bindable(),
    lastIndex,
    clock,
    onStart,
  }: PlaybackControllerProps = $props();

  // 再生速度（倍率）。等倍は 1 フレーム 0.4 秒。選択肢はこの配列で定義する。
  const BASE_INTERVAL_MS = 400;
  const SPEED_OPTIONS = [0.5, 1, 2, 4];
  let speed = $state(1);

  // 速度セレクタ：待機時は現在値の 1 ボタンに畳み、タップした時だけ 4 段を展開して直接選ばせる。
  let speedOpen = $state(false);

  // 再生ループ（速度に応じた間隔で1フレーム進める）。末尾に達したら止める。
  // speed を読むので、再生中に速度を変えると effect が貼り直され間隔が即反映される。
  $effect(() => {
    if (!playing) return;
    const intervalMs = BASE_INTERVAL_MS / speed;
    const id = setInterval(() => {
      if (frameIndex >= lastIndex) {
        playing = false;
      } else {
        frameIndex++;
      }
    }, intervalMs);
    return () => clearInterval(id);
  });
</script>

<!-- 1 段に集約：トランスポート｜カウンタ｜シーク（横を埋める）｜速度。
     シークバーを flex-1 で伸ばし、盤面幅に合わせつつ左右の空きを吸う。 -->
<div class="flex items-center gap-1.5 text-sm">
  <!-- トランスポート：アイコンのみで詰める（ラベルは aria/title に逃がす）。 -->
  <div class="flex items-center gap-0.5">
    <button
      class="inline-flex h-8 w-10 items-center justify-center rounded border border-gray-400 hover:bg-gray-100"
      aria-label="最初へ"
      title="最初へ"
      onclick={() => {
        frameIndex = 0;
        playing = false;
      }}><Icon icon="mdi:skip-previous" class="size-5" /></button
    >
    <button
      class="inline-flex h-8 w-10 items-center justify-center rounded border border-gray-800 bg-gray-800 text-white disabled:opacity-40"
      aria-label={playing ? "停止" : "再生"}
      disabled={frameIndex >= lastIndex}
      onclick={(e) => {
        if (!playing) onStart?.(e.currentTarget);
        playing = !playing;
      }}><Icon icon={playing ? "mdi:pause" : "mdi:play"} class="size-5" /></button
    >
  </div>

  <!-- 現在クロック：ツマミを追わない固定表示（試合の経過ターン。全長は出さずネタバレを避ける）。 -->
  <span class="inline-flex shrink-0 items-center gap-0.5 tabular-nums text-xs opacity-70">
    <Icon icon="mdi:timer-outline" class="size-3.5" />
    {clock}
  </span>

  <input type="range" min="0" max={lastIndex} bind:value={frameIndex} class="min-w-0 flex-1" />

  <!-- 再生速度：待機時は現在値の 1 ボタンに畳み、タップで 4 段を上向きに展開して直接選ばせる。
       展開中は透明バックドロップで外側タップ＝閉じるを拾う（ドロワーと同じ手口）。 -->
  <div class="relative shrink-0">
    {#if speedOpen}
      <button
        class="fixed inset-0 z-10 cursor-default"
        aria-label="速度選択を閉じる"
        onclick={() => (speedOpen = false)}
      ></button>
    {/if}
    <button
      class="inline-flex h-8 w-14 items-center justify-center gap-0.5 rounded border border-gray-400 text-xs tabular-nums hover:bg-gray-100"
      aria-label="再生速度を切替"
      title="再生速度を切替"
      onclick={() => (speedOpen = !speedOpen)}>x{speed.toFixed(1)} ▾</button
    >
    {#if speedOpen}
      <div
        class="absolute bottom-full right-0 z-20 mb-1 flex gap-1 rounded border border-gray-300 bg-white p-1 shadow-lg"
      >
        {#each SPEED_OPTIONS as s (s)}
          <button
            class="rounded border px-2 py-0.5 text-xs tabular-nums {speed === s
              ? 'border-gray-800 bg-gray-800 text-white'
              : 'border-gray-400 hover:bg-gray-100'}"
            onclick={() => {
              speed = s;
              speedOpen = false;
            }}>x{s.toFixed(1)}</button
          >
        {/each}
      </div>
    {/if}
  </div>
</div>
