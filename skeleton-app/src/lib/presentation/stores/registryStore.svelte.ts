/**
 * オートマトンレジストリ（手持ちイメージの保管庫）。
 *
 * ビルド済みイメージをプッシュ（保存）／プル（編集に戻す）／削除する共有ストア。
 * プレイ面の構築ドロワーとサンドボックスで同じ手持ちを見るため、モジュール singleton で持つ。
 * 永続化層（localStorage / バックエンド等）は seed と push/remove に閉じ込め、
 * 公開 API（images / push / remove）は永続化非依存に保つ。
 *
 * TODO: 永続化は未着手（in-memory のためリロードで消える）。
 * TODO: 版管理（系統＝イメージ名／タグ v1→v2・ロールバック）は未着手。当面はプッシュ＝自動名でフラットに積む（docs/design/ui-screen-design.md）。
 */

import type { BaseImage, Program } from "$lib/domain";
import { DEFAULT_BASE_IMAGE } from "$lib/domain";
import { ALLY_PRESETS } from "$lib/presentation/constants/allyPresets";

/** レジストリに並ぶオートマトンイメージ（ビルド済みの保管単位）。 */
export interface RegistryImage {
  readonly id: string;
  readonly label: string;
  readonly program: Program;
  // 中身の指紋（A面に名前と並べて見せる短いハッシュ）。name＝タグ、hash＝中身の識別。
  readonly hash: string;
  // 土台にした素質（系統×版）。既定は turtlogo で固定。
  readonly baseImage: BaseImage;
  // お手本（初期シード・読み取り専用）か、ユーザがプッシュした手持ちか。
  readonly source: "preset" | "user";
  // プッシュ日時（手持ちのみ）。お手本は null。版メタデータとして一覧に出す。
  readonly pushedAt: number | null;
}

// 命令木の内容フィンガープリント（FNV-1a 32bit を 8 桁 hex で）。A面に見せる簡易ハッシュ。
// B面の種明かし: これは中身の簡易ハッシュで、実コンテナの digest（sha256・マニフェスト単位で、
// ローカル image ID とも別物）とは異なる＝「ダイジェスト≠ハッシュ」。名前＝タグ（可動ラベル）も併せて明かす。
function hashProgram(program: Program): string {
  const json = JSON.stringify(program);
  let h = 0x811c9dc5; // FNV-1a offset basis
  for (let i = 0; i < json.length; i++) {
    h ^= json.charCodeAt(i);
    h = Math.imul(h, 0x01000193); // FNV prime
  }
  return (h >>> 0).toString(16).padStart(8, "0");
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

function createRegistryStore() {
  const images = $state<RegistryImage[]>(seedImages());
  // プッシュごとの自動命名用の連番（手持ちの通し番号）。
  let seq = 0;

  // 同一内容のイメージを探す。content-addressable＝中身が同じなら同じイメージ、の扱い。
  // 命令木は素直な JSON なので文字列化比較で判定（dirty 判定と同じ前提）。
  function findByContent(program: Program): RegistryImage | undefined {
    const key = JSON.stringify(program);
    return images.find((image) => JSON.stringify(image.program) === key);
  }

  return {
    /** 一覧（お手本＋手持ち・登録順）。読み取り専用で公開する。 */
    get images(): readonly RegistryImage[] {
      return images;
    },

    /** 同一内容の既存イメージ（あれば）。プッシュ重複の判定・表示に使う。 */
    duplicateOf(program: Program): RegistryImage | undefined {
      return findByContent(program);
    },

    /** 命令木の内容ハッシュ（content fingerprint）。カレントイメージ表示などレジストリ外でも
     *  同じ指紋を見せるため公開する（レジストリ行の hash と同じ算出）。 */
    hashOf(program: Program): string {
      return hashProgram(program);
    },

    /** プッシュ＝ビルド済みイメージをレジストリに保存（手持ちに積む）。
     *  label 指定があればその名前で、無ければ自動名（イメージ N）で積む。
     *  baseImage はビルドに使った素質（既定はフル機能の v2.0）。
     *  同一内容が既にあれば no-op（content-addressable＝同じ中身は二重に積まない）。 */
    push(program: Program, label?: string, baseImage: BaseImage = DEFAULT_BASE_IMAGE): void {
      if (findByContent(program)) return;
      seq += 1;
      const name = label?.trim() ? label.trim() : `イメージ ${seq}`;
      images.push({
        id: `user:${seq}`,
        label: name,
        program,
        hash: hashProgram(program),
        baseImage,
        source: "user",
        pushedAt: Date.now(),
      });
    },

    /** リネーム＝名前（タグ）の付け替え。中身（イメージ）は不変なので label だけ差し替える。
     *  お手本（初期シード）は読み取り専用なので手持ちのみ。 */
    rename(id: string, label: string): void {
      const index = images.findIndex((image) => image.id === id);
      if (index >= 0 && images[index].source === "user") images[index] = { ...images[index], label };
    },

    /** 削除。お手本（初期シード）は残し、手持ちのみ消せる。 */
    remove(id: string): void {
      const index = images.findIndex((image) => image.id === id);
      if (index >= 0 && images[index].source === "user") images.splice(index, 1);
    },
  };
}

/** UI 全体で共有する単一のレジストリ＝手持ちオートマトンイメージの保管庫。 */
export const registry = createRegistryStore();
