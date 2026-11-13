/**
 * ワークベンチ（編集中のドラフト）の状態＝唯一の真実。
 *
 * レジストリ（保管済みイメージ）とは別概念＝「いま編集している1つのドラフト」。
 * エディタに例えると registry=保存済みファイル／ここ=開いている未保存ドキュメント。
 * 画面（サンドボックス⇄プレイ面）を跨いでも編集を失わないよう、route ローカルの $state ではなく
 * アプリ層の module singleton で持つ（寿命＝アプリセッション）。永続化はしない（リロードでは消える）。
 *
 * registry の store.ts に準拠した CQRS 分離：
 * - 読み：readonly 投影（workbenchDraft）を UI が直接 `$`購読する（Facade を介さなくてよい）。
 * - 書き：storeWriter は「値をどう保持し、どう差し替えるか」だけに責務を絞った機械的な単一経路で、
 *   UI には公開せず facade からのみ呼ぶ。意味のある操作（build/pull 等）は facade 側に置く。
 *
 * SSR/プリレンダ時はユーザ操作が無く書き込みが起きないため、singleton でもリクエスト跨ぎの
 * 汚染は起きない（初期ドラフトのまま）。
 */

import { derived, get, readonly, writable } from "svelte/store";
import type { BaseImage, BaseImageFamily, Program } from "$lib/domain";
import {
  TURTLOGO_V2,
  hashProgram,
  areProgramsEqual,
  programCost,
  flatLines,
  programToText,
  baseImageFamilies,
} from "$lib/domain";

/**
 * ビルドで凍結したイメージ＝program（ブロック）と baseImage（素質）を一体で持つ不変断面。
 * レジストリの RegistryImage と同じ {program, baseImage} の形にし、復元・プッシュ・デプロイで
 * 「ビルド時点の素質」まで一緒に運べるようにする（program だけ凍結すると素質が編集中に引きずられる）。
 */
export interface BuiltImage {
  readonly program: Program;
  readonly baseImage: BaseImage;
}

/** 編集中のドラフト断面。program＝Blockly からの最新、builtImage＝ビルドで凍結した断面。 */
export interface WorkbenchDraft {
  // 編集中プログラム（Blockly を SSoT とする順方向の断面）。
  readonly program: Program;
  // ビルドで凍結したイメージ（試運転／デプロイ／プッシュの対象）。未ビルドは null。
  readonly builtImage: BuiltImage | null;
  // 最終ビルド時刻（復元点の目印）。未ビルドは null。
  readonly builtAt: number | null;
  // カレントイメージのローカル名（push 前から付けられる）。
  readonly imageName: string;
  // 編集の土台にする素質（系統×版）。パレットに出せるブロックを決める。
  readonly baseImage: BaseImage;
}

const INITIAL_DRAFT: WorkbenchDraft = {
  program: [],
  builtImage: null,
  builtAt: null,
  imageName: "",
  // 編集の出発点となる素質。現状はフル機能の v2.0 から始める（版切替UIでユーザが変更できる）。
  baseImage: TURTLOGO_V2,
};

// 内部の可変ドラフト。writable を外に晒さず、読みは readonly、書きは storeWriter 経由に限る。
const draftStore = writable<WorkbenchDraft>(INITIAL_DRAFT);

/** 編集中ドラフト（readonly）。コンポーネントはこの readonly store を `$`購読する。 */
export const workbenchDraft = readonly(draftStore);

/**
 * カレントイメージ（ビルド断面）の読みモデル＝この store の state だけの純投影。
 * 未ビルドか／編集がビルド断面から乖離したか（要再ビルド）／内容ハッシュ（指紋）を算出する。
 * registry のラベル（表示名）や重複判定は別スライス（registry）との join になるため、ここには含めない
 * ＝クロススライスの読みはプレゼン側で registry 投影と突き合わせて解決する（4層の依存を単一スライスに閉じる）。
 */
export interface CurrentImage {
  // ビルド断面が無い（未ビルド）か。
  readonly notBuilt: boolean;
  // ビルド後に編集（program）がビルド断面から乖離したか。未ビルドは false。
  readonly dirty: boolean;
  // ビルド断面の内容ハッシュ（レジストリ行と同じ指紋）。未ビルドは null。
  readonly hash: string | null;
}

/** カレントイメージの読みモデル（readonly derived）。等価・ハッシュはドメインに委ねる。 */
export const currentImage = derived(draftStore, (draft): CurrentImage => {
  const built = draft.builtImage;
  return {
    notBuilt: built === null,
    dirty: built !== null && !areProgramsEqual(draft.program, built.program),
    hash: built === null ? null : hashProgram(built.program),
  };
});

/**
 * 編集中プログラムの CP 消費量（作成予算の読み投影）。draft.program だけの純投影。
 * 消費量の算出（ドメイン）をアプリ層に閉じ、UI は購読するだけにする。
 */
export const cpUsed = derived(draftStore, (draft) => programCost(draft.program));

/**
 * 編集中プログラムの擬似コード行（表示用の読み投影）。平坦化とノード id 採番はドメイン flatLines に委譲。
 * 描画部品には Program ではなくこの View Model（FlatLine[]）を渡す＝葉を dumb に保つ。
 */
export const draftLines = derived(draftStore, (draft) => flatLines(draft.program));

/**
 * ビルド断面（凍結済み）の擬似コード行（試運転の観戦表示用の読み投影）。未ビルドは空配列。
 * 試運転が走るのは builtImage なので、実行行ハイライトはこの行割り（＝nodeIdMap と同採番）に合わせる
 * ＝編集中テキスト（draftText）ではなく走っている断面を正として光らせる。
 */
export const builtLines = derived(draftStore, (draft) => (draft.builtImage ? flatLines(draft.builtImage.program) : []));

/**
 * 編集中プログラムの擬似コード全文（エディタ編集面のシード用の読み投影）。draft.program だけの純投影。
 * テキスト化（programToText）はドメインに委ね、UI は入場時にこの値を種として受け取るだけにする。
 */
export const draftText = derived(draftStore, (draft) => programToText(draft.program));

/**
 * 素質カタログ（静的・不変）＝素質選択UIの「系統 × 版ラダー」の供給源。
 * ドラフト状態ではなく BASE_IMAGES からの列挙なので、起動時に一度だけ材料化する。
 * 選択中の素質そのものは draft.baseImage が持つ（ここは menu・draft が selection）。
 */
export const baseImageCatalog: readonly BaseImageFamily[] = baseImageFamilies();

/**
 * 外部イメージが現在のビルド断面とズレているか（例: デプロイ済みの再デプロイ要否）。
 * 比較対象が揃わないとき（未ビルド／外部 null）は「ズレ無し」扱いで false を返す。
 * 外部オペランドを引数で受ける単一スライスのセレクタ＝内容等価の判定（ドメイン）をアプリ層に閉じ、
 * builtImage との突き合わせの合成だけをプレゼン側に委ねる（join store は作らない）。
 */
export function differsFromBuilt(draft: WorkbenchDraft, image: Program | null): boolean {
  return draft.builtImage !== null && image !== null && !areProgramsEqual(draft.builtImage.program, image);
}

/**
 * 素質互換セレクタ＝候補の素質が編集中プログラムの命令セットを提供できるか（differsFromBuilt と同列の読み）。
 * 判定規則そのもの（命令セットの包含）はドメインに委ね、プレゼンは候補×program を引数で渡して購読する
 * ＝素質選択UIの関心を workbench の公開面へ畳む（プレゼンがドメインルールを直呼びしない）。
 */
export { baseImageSupports } from "$lib/domain";

/**
 * 素質カタログのステージ制限（許可集合でのフィルタ）とクランプ判定もドメインに委ね、プレゼンへ公開面を畳む。
 * 素質選択UIは許可版だけのカタログを購読し、ページはクランプ判定（許可外→最上位版）に使う。
 */
export { filterBaseImageFamilies, baseImageAllowed, highestAllowedImage } from "$lib/domain";

/**
 * ドラフトへの機械的な書き込み口（facade からのみ呼ぶ・UI には公開しない）。
 * 単一レコードなので、集合版 registry の add/replace とは異なり update/snapshot が機械的プリミティブ。
 */
export const storeWriter = {
  /** 現在のドラフトを updater で差し替える（書き込みの単一経路）。 */
  update(updater: (draft: WorkbenchDraft) => WorkbenchDraft): void {
    draftStore.update(updater);
  },
  /** 現在のドラフトのスナップショット（非追跡の一発読み）。 */
  snapshot(): WorkbenchDraft {
    return get(draftStore);
  },
};
