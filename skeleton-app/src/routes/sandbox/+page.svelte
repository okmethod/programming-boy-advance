<script lang="ts">
  // サンドボックスページ：ステージを選ばず「組む→試運転」だけを回す独立画面。
  // プレイ面のような対戦（勝敗）・deploy は無く、構築エリア（左）と試運転レール（右）だけを置く。
  // レジストリ（お手本/手持ちイメージの管理）は構築エリア内のタブ＝このページの一部。
  // 構築エリア・試運転レールはプレイ面の構築ドロワーと同じコンポーネントを共有する。
  // 編集中ドラフト（program／builtImage）はアプリ層のワークベンチ store が持ち、プレイ面と共有・画面跨ぎで保持する。
  import { battleFacade } from "$lib/presentation/composition";
  import { workbenchDraft, type NodeId } from "$lib/application";
  import BuildingArea from "$lib/presentation/components/building/BuildingArea.svelte";
  import SandboxRail from "$lib/presentation/components/spectating/SandboxRail.svelte";

  // ステージを選ばない独立画面なので stage.memoryTotal/memoryGrain が無い。メモリ総量と刻み幅はこのページ固有の既定値で代替する。
  // 刻み幅 8 と噛み合う総量 32＝目盛り 0/8/16/24/32 の5段階（中央 16/16）。総量は刻み幅の倍数であること。
  const SANDBOX_MEMORY_TOTAL = 32;
  const SANDBOX_MEMORY_GRAIN = 8;

  // 試運転の再生状態・実行中ノードを右（SandboxRail）から受け、左（BuildingArea）の編集面へ渡す。
  // 兄弟パネル間の受け渡しは共通の親（このページ）で解決する。
  let sandboxPlaying = $state(false);
  let sandboxActiveId = $state<NodeId | undefined>(undefined);
</script>

<!-- 一画面（iPad 横向き前提・スクロール無し）：ヘッダーの残り高を埋め、はみ出しは内側で吸収。 -->
<div class="mx-auto flex h-full max-w-7xl flex-col gap-3 overflow-hidden p-3">
  <!-- 2カラム：左＝構築エリア／右＝試運転レール（固定幅）。プレイ面ドロワーの骨格を踏襲。 -->
  <div class="flex min-h-0 flex-1 gap-4">
    <BuildingArea
      memoryTotal={SANDBOX_MEMORY_TOTAL}
      memoryGrain={SANDBOX_MEMORY_GRAIN}
      active
      panelClass="bg-white"
      {sandboxPlaying}
      {sandboxActiveId}
    />

    <!-- 試運転レール：プレイ面のレールと同じ枠線で囲う。独立ページなので白地に馴染ませる。 -->
    <div class="flex min-h-0 w-[26rem] shrink-0 flex-col">
      <div class="flex min-h-0 flex-1 flex-col gap-3 overflow-auto rounded border border-surface-300 bg-white p-3">
        <SandboxRail
          image={$workbenchDraft.builtImage?.program ?? null}
          facade={battleFacade}
          bind:playing={sandboxPlaying}
          onActiveChange={(id) => (sandboxActiveId = id)}
        />
      </div>
    </div>
  </div>
</div>
