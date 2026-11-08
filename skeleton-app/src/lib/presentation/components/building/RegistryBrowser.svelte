<script lang="ts">
  // レジストリブラウザ＝作業台の保管文脈を見て操作する面。上＝保管済み一覧（pull/リネーム/削除）／破線／下＝カレント行（push/リネーム/削除）。
  // 下→上 push・上→下 pull で矢印の向きと空間配置が一致する。
  // ワークベンチ（workbenchDraft）とレジストリ（registryImages）を直接購読して自己完結する。
  // 唯一の継ぎ目は pull 時の Blockly 流し込み＝編集の SSoT は親の BlocklyEditor なので onPull で親に委ねる。
  import Icon from "@iconify/svelte";
  import type { Program } from "$lib/domain";
  import {
    registryImages,
    workbenchFacade,
    workbenchDraft,
    currentImage,
    imageOf,
    type RegistryImage,
  } from "$lib/application";
  import { registryFacade } from "$lib/presentation/composition";
  import { hhmm } from "$lib/presentation/utils/labels";
  import BaseImageChip from "$lib/presentation/components/shared/BaseImageChip.svelte";

  interface RegistryBrowserProps {
    // パネルの背景クラス。このエリアを置く親の背景に合わせる。
    panelClass?: string;
    // プル時の Blockly（編集の SSoT）への流し込み。カレント断面の取り込みは facade がこの中で担う。
    onPull: (program: Program) => void;
  }

  let { panelClass = "bg-surface-50", onPull }: RegistryBrowserProps = $props();

  const draft = $derived($workbenchDraft);
  // カレントイメージの読みモデル（未ビルド/指紋）＝workbench state だけの純投影（アプリ層）。
  // 変数名は current（レジストリ各行の image と衝突させない）。
  const current = $derived($currentImage);

  // 同一内容の既存イメージ（あれば＝プッシュ不要・表示名の基／push・rename の対象）。
  // 内容等価の引き当ては registry スライスのセレクタ（imageOf）に委ね、反応性は $registryImages の購読で担う。
  const duplicate = $derived(draft.builtImage ? imageOf($registryImages, draft.builtImage) : undefined);
  const alreadyPushed = $derived(duplicate !== undefined);
  // タイルに出す表示名。ローカル名（draft.imageName）> 同一内容の既存イメージのラベル > プレースホルダ の順で解決する。
  const builtName = $derived(draft.imageName || duplicate?.label || "未保存イメージ");

  // 最終ビルド時刻ラベル（HH:MM）。ビルドの実在を体感させる（復元点の目印）。
  const builtAtLabel = $derived(draft.builtAt === null ? null : hhmm(draft.builtAt));

  // プッシュ＝ビルド済みイメージをレジストリに保存（ローカル名で保管）。生の編集ではなくビルド断面を積む。
  function pushImage() {
    if (draft.builtImage === null) return;
    registryFacade.push(draft.builtImage, draft.imageName, draft.baseImage);
  }

  // プル＝レジストリのイメージをカレント（ビルド断面）に取り込む。改良の起点。
  // 編集内容（Blockly）も同じ断面に合わせてダーティーを出さず、タブは切り替えない（カレントが更新されるだけ）。
  // 素質もそのイメージが土台にした版へ乗り換える（パレットの出せるブロックも追従する）。
  // Blockly への流し込みは onPull（親の編集 SSoT）、カレント断面（builtImage/時刻/名前/素質）は facade が受ける。
  function pullImage(image: RegistryImage) {
    onPull(image.program);
    workbenchFacade.pull(image);
  }

  // カレントイメージを破棄＝未ビルドに戻す（編集中の Blockly はそのまま・凍結した断面だけ捨てる）。
  function clearBuiltImage() {
    workbenchFacade.clearBuilt();
  }

  // リネーム（インライン編集）。編集中の行 id と入力値を持ち、Enter/blur で確定・Escape で取消。
  let renamingId = $state<string | null>(null);
  let renameValue = $state("");

  function startRename(id: string, label: string) {
    renamingId = id;
    renameValue = label;
  }
  function commitRename() {
    if (renamingId === null) return;
    const label = renameValue.trim();
    if (label.length > 0) registryFacade.rename(renamingId, label);
    renamingId = null;
  }
  // インライン入力はマウント時にフォーカスしたい（bind:this は不安定なので use: で登録）。
  function autofocus(node: HTMLInputElement) {
    node.focus();
    node.select();
  }

  // カレントイメージ名のインライン改名（カレント行）。ローカル名を編集し、同一内容が push 済み手持ちなら
  // その登録名も合わせて更新する（一覧と齟齬が出ないように）。入力値は一覧の改名と共有（同時編集はしない）。
  let tileRenaming = $state(false);
  function startTileRename() {
    renameValue = draft.imageName || duplicate?.label || "";
    tileRenaming = true;
  }
  function commitTileRename() {
    const name = renameValue.trim();
    if (name.length > 0) {
      workbenchFacade.setName(name);
      if (duplicate?.source === "user") registryFacade.rename(duplicate.id, name);
    }
    tileRenaming = false;
  }
</script>

<!-- レジストリ管理面（フル領域）。上＝保管済み一覧（pull/リネーム/削除）／破線／下＝カレント行（push）。
     下→上 push・上→下 pull で矢印の向きと空間が一致。永続化・版管理は未着手（store 側に集約）。 -->
<div class="absolute inset-0 flex flex-col gap-3 overflow-hidden rounded border border-surface-300 {panelClass} p-3">
  <!-- 見出し（プッシュは下のカレント行へ移設）。 -->
  <div class="flex shrink-0 items-center gap-3">
    <h3 class="inline-flex items-center gap-1 text-sm font-bold">
      <Icon icon="mdi:package-variant" class="size-4" /> オートマトンイメージ
    </h3>
  </div>

  <!-- レジストリ領域（保管済み）：小見出し＋一覧。残り高を占め、一覧だけ内側スクロール。下のカレント行は常に見える。 -->
  <div class="flex min-h-0 flex-1 flex-col gap-1">
    <span class="shrink-0 text-xs font-bold text-surface-500">レジストリ</span>
    <!-- 一覧（各行＝オートマトンイメージ）。お手本＝初期シード／手持ち＝プッシュ分（保存時刻つき）。 -->
    <ul class="flex min-h-0 flex-1 flex-col gap-2 overflow-auto">
      {#each $registryImages as image (image.id)}
        <li class="flex h-12 items-center justify-between gap-3 rounded border border-surface-200 px-3">
          <!-- 並び＝ハッシュ（中身の指紋）／素質（土台）／名前（タグ）／時刻 or sample。 -->
          <div class="flex min-w-0 items-center gap-2">
            <span class="font-mono text-xs opacity-60">{image.hash}</span>
            <BaseImageChip base={image.baseImage} cRoot="shrink-0 text-xs text-surface-500" />
            {#if renamingId === image.id}
              <!-- インライン編集：Enter/blur で確定、Escape で取消。 -->
              <input
                use:autofocus
                bind:value={renameValue}
                onblur={commitRename}
                onkeydown={(e) => {
                  if (e.key === "Enter") commitRename();
                  else if (e.key === "Escape") renamingId = null;
                }}
                class="w-32 rounded border border-surface-300 px-1 text-sm"
              />
            {:else}
              <span class="truncate text-sm">{image.label}</span>
            {/if}
            <span class="shrink-0 text-xs opacity-50">
              {image.source === "preset" ? "sample" : hhmm(image.pushedAt ?? 0)}
            </span>
          </div>
          <div class="flex shrink-0 gap-2">
            <!-- プル＝Blockly に展開して編集面へ戻る（改良の起点）。
                 デプロイは行から出さず、プル→編集→オーバーレイのデプロイに一本化する。 -->
            <button class="action-btn-strong" onclick={() => pullImage(image)}>
              <Icon icon="mdi:tray-arrow-down" class="size-4" /> プル
            </button>
            <!-- リネーム＝名前（タグ）の付け替え。中身は不変。sample は読み取り専用なので無効。 -->
            <button
              class="action-btn disabled:opacity-40"
              disabled={image.source === "preset"}
              onclick={() => startRename(image.id, image.label)}
            >
              <Icon icon="mdi:pencil-outline" class="size-4" /> リネーム
            </button>
            <!-- 削除は手持ちのみ有効。sample（初期シード）は構造的に消せないので無効表示で列を揃える。 -->
            <button
              class="action-btn disabled:opacity-40"
              disabled={image.source === "preset"}
              onclick={() => registryFacade.remove(image.id)}
            >
              <Icon icon="mdi:delete-outline" class="size-4" /> 削除
            </button>
          </div>
        </li>
      {/each}
    </ul>
  </div>

  <!-- 破線区切り：上＝レジストリ（保管済み）／下＝カレント（これから push する対象）。
       下→上へプッシュ（⬆）・上→下へプル（⬇）＝矢印の向きと空間配置が一致する。 -->
  <div class="shrink-0 border-t border-dashed border-surface-300"></div>

  <!-- カレント領域：小見出し＋カレント行。 -->
  <div class="flex shrink-0 flex-col gap-1">
    <span class="shrink-0 text-xs font-bold text-surface-500">カレント</span>
    <!-- 状態（未ビルド／ビルド済み／改名入力中）で縦幅が変わらないよう固定高にする。
         中身は items-center で中央寄せ（ボタンや入力の高さに引っ張られない）。 -->
    <div
      class="flex h-12 shrink-0 items-center justify-between gap-3 rounded border border-surface-300 bg-surface-50 px-3"
    >
      {#if current.notBuilt}
        <span class="inline-flex items-center gap-2 text-sm text-surface-400">
          <Icon icon="mdi:cube-outline" class="size-4" /> 未ビルド
        </span>
      {:else}
        <!-- カレント＝現在のビルド断面。保管済み行と同じ体裁（ハッシュ-素質-名前-時刻）＋対称の操作列。 -->
        <div class="flex min-w-0 items-center gap-2">
          <Icon icon="mdi:cube" class="size-4 opacity-70" aria-label="カレント" />
          <span class="font-mono text-xs opacity-60">{current.hash}</span>
          <!-- カレントは編集中のビルド断面＝選択中の素質を土台にビルドしたもの。 -->
          <BaseImageChip base={draft.baseImage} cRoot="shrink-0 text-xs text-surface-500" />
          {#if tileRenaming}
            <!-- インライン改名：Enter/blur で確定・Escape で取消。 -->
            <input
              use:autofocus
              bind:value={renameValue}
              onblur={commitTileRename}
              onkeydown={(e) => {
                if (e.key === "Enter") commitTileRename();
                else if (e.key === "Escape") tileRenaming = false;
              }}
              class="w-32 rounded border border-surface-300 px-1 text-sm"
            />
          {:else}
            <span class="truncate text-sm">{builtName}</span>
          {/if}
          <span class="shrink-0 text-xs opacity-50">{builtAtLabel}</span>
        </div>
        <!-- 操作列：保管済み行（プル/リネーム/削除）と対称に プッシュ/リネーム/削除。 -->
        <div class="flex shrink-0 gap-2">
          <!-- プッシュ＝カレントをレジストリ（上）へ保管。同一内容が登録済みなら重複を積まない。 -->
          <button
            class="action-btn-strong disabled:opacity-40"
            onclick={pushImage}
            disabled={alreadyPushed}
            title={alreadyPushed ? `「${duplicate?.label}」と重複` : "ビルド済みイメージをレジストリに保存"}
          >
            <Icon icon="mdi:tray-arrow-up" class="size-4" /> プッシュ
          </button>
          <!-- リネーム＝カレントイメージ名の付け替え（ローカル名。push 済みならレジストリ label も同期）。 -->
          <button class="action-btn" onclick={startTileRename}>
            <Icon icon="mdi:pencil-outline" class="size-4" /> リネーム
          </button>
          <!-- 削除＝カレントイメージを破棄して未ビルドに戻す（編集中の Blockly はそのまま）。 -->
          <button class="action-btn" onclick={clearBuiltImage} title="カレントイメージを破棄（未ビルドに戻す）">
            <Icon icon="mdi:delete-outline" class="size-4" /> 削除
          </button>
        </div>
      {/if}
    </div>
  </div>
</div>
