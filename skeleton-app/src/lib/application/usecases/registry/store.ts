/**
 * レジストリ（手持ちオートマトンイメージ）の状態＝唯一の真実。
 *
 * svelte/store の writable を内部に持ち、読みは readonly（registryImages）で公開、
 * 書き込みは storeWriter 経由のみ（facade からだけ呼ぶ）。姉妹PJ（poke-api-stadium）の
 * usecases 配下 store.ts に準拠。$state ラン（.svelte.ts）は使わずアプリ層を plain TS に保つ。
 * content-addressable な dedup・自動命名・永続化といったガバナンスは facade 側に置き、
 * ここは「集合をどう保持し、どう差し替えるか」だけに責務を絞る。
 */

import { get, readonly, writable } from "svelte/store";
import type { BaseImage, Program } from "$lib/domain";
import { DEFAULT_BASE_IMAGE, hashProgram, areProgramsEqual } from "$lib/domain";
import { ALLY_PRESETS } from "./presets";

/** レジストリに並ぶオートマトンイメージ（ビルド済みの保管単位）。 */
export interface RegistryImage {
  readonly id: string;
  readonly label: string;
  readonly program: Program;
  // 中身の指紋（A面に名前と並べて見せる短いハッシュ）。name＝タグ、hash＝中身の識別。
  readonly hash: string;
  // 土台にした素質（系統×版）。永続化時は参照（imageName×version）に落とし、ロードでカタログから復元する。
  readonly baseImage: BaseImage;
  // お手本（初期シード・読み取り専用）か、ユーザがプッシュした手持ちか。
  readonly source: "preset" | "user";
  // プッシュ日時（手持ちのみ）。お手本は null。版メタデータとして一覧に出す。
  readonly pushedAt: number | null;
}

// お手本プリセットを初期シード（読み取り専用）に展開する。
function seedImages(): RegistryImage[] {
  return Object.entries(ALLY_PRESETS).map(([key, preset]) => ({
    id: `preset:${key}`,
    label: preset.label,
    program: preset.program,
    hash: hashProgram(preset.program),
    baseImage: DEFAULT_BASE_IMAGE,
    source: "preset",
    pushedAt: null,
  }));
}

// 内部の可変集合。プリセットを初期シードして持つ（user の手持ちは restore で後置される）。
const imagesStore = writable<RegistryImage[]>(seedImages());

// プッシュごとの自動命名用の連番（手持ちの通し番号）。storeWriter 経由でのみ触る。
let seq = 0;

/** 一覧（お手本＋手持ち・登録順）。コンポーネントはこの readonly store を `$`購読する。 */
export const registryImages = readonly(imagesStore);

/**
 * 同一内容（content-addressable）の登録済みイメージを引く。無ければ undefined。
 * 一覧（$registryImages）を引数で受ける純セレクタ＝内容等価の判定（ドメイン）をこのスライスに閉じ、
 * 突き合わせの反応性は呼び出し側の `$`購読に委ねる（プレゼンにドメイン述語を漏らさない）。
 */
export function imageOf(images: readonly RegistryImage[], program: Program): RegistryImage | undefined {
  return images.find((image) => areProgramsEqual(image.program, program));
}

/** 同一内容の登録済みイメージの表示名（表示名フォールバック用）。無ければ undefined。 */
export function labelOf(images: readonly RegistryImage[], program: Program): string | undefined {
  return imageOf(images, program)?.label;
}

/**
 * レジストリへの唯一の書き込み口。facade だけが呼ぶ（UI から直接は触らない）。
 * writable を外に晒さず、意味のある操作だけを通す（書き込みの単一経路）。
 */
export const storeWriter = {
  /** 手持ちを1件追加する。 */
  add(image: RegistryImage): void {
    imagesStore.update((images) => [...images, image]);
  },
  /** id の行を部分更新する（リネーム等）。 */
  replace(id: string, patch: Partial<RegistryImage>): void {
    imagesStore.update((images) => images.map((image) => (image.id === id ? { ...image, ...patch } : image)));
  },
  /** id の行を削除する。 */
  removeById(id: string): void {
    imagesStore.update((images) => images.filter((image) => image.id !== id));
  },
  /** 連番を進めて新しい番号を返す（自動命名・id 採番用）。 */
  nextSeq(): number {
    seq += 1;
    return seq;
  },
  /** 現在の連番（永続化に載せる）。 */
  get seq(): number {
    return seq;
  },
  /** 現在の集合のスナップショット（dedup 判定・永続化のための一発読み）。 */
  snapshot(): readonly RegistryImage[] {
    return get(imagesStore);
  },
  /** プリセットを再シードし、復元した user の手持ちを後置して、連番を復元する（起動時の1回）。 */
  reset(userImages: readonly RegistryImage[], nextSeq: number): void {
    imagesStore.set([...seedImages(), ...userImages]);
    seq = nextSeq;
  },
};
