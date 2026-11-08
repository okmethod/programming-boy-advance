/**
 * 素質（BaseImage）＝オートマトンの土台。
 *
 * オートマトン＝素質＋プログラム＋リソース。素質は「何が得意か（系統）× どこまで開花したか（版）」で、
 * 使える命令セット（＝付与ブロック集合）を定める器。docs/game-rules/base-images.md を正とする。
 *
 * 命名は A面語（JP の系統名）を正とし、EN 識別子（＝FROM のイメージ名）と版タグを併記する。
 * アイコンは「どの動物か」を UI で担保する素質同定の一部なので、この自己記述に同梱する
 * （mdi 名は識別子であり描画依存ではない）。単価・解放スケジュールは本型の責務外（params / レベルデザイン）。
 */

import type { CommandName, Program, SensorName } from "../models/program";
import { usedCapabilities } from "../program/capabilities";

/** 素質が付与しうる制御構文（ドメインの Stmt.kind に対応。if は else 有無を含む）。 */
export type ControlName = "if" | "repeat" | "while";

/** 素質（系統×版）。付与する命令セットがこの素質の「できること」を定める。 */
export interface BaseImage {
  // EN 識別子（B面＝FROM のイメージ名）。例: "turtlogo"。
  readonly imageName: string;
  // A面の系統名（JP・正）。例: "カメの歩み"。
  readonly family: string;
  // 版（メジャー.マイナー）の数値文字列。例: "1.0"（表示は baseImageTag が "v1.0" に整形）。
  readonly version: string;
  // 系統を UI で示す mdi アイコン名。アイコン＋JP名で「どの動物か」を担保する。
  readonly icon: string;
  // この版の「できること」を一言で表す概要（選択UIのカード説明）。ブロック数より質を伝える。
  readonly summary: string;
  // 付与する命令セット（プログラムブロック）。ツールボックス生成の seam（固定定義をここから駆動する）。
  readonly commands: readonly CommandName[];
  readonly queries: readonly SensorName[];
  readonly controls: readonly ControlName[];
}

/**
 * 素質がプログラムが使用する命令セットを提供しているか。
 *
 * 版・ファミリーに依らず、命令セットの包含だけで判定する（互換性ガードは独立）。
 * false＝使用中のブロックが付与対象外になる＝切替にはプログラム破棄が要る、の合図。
 */
export const baseImageSupports = (base: BaseImage, program: Program): boolean => {
  const used = usedCapabilities(program);
  return (
    used.commands.every((c) => base.commands.includes(c)) &&
    used.queries.every((q) => base.queries.includes(q)) &&
    used.controls.every((c) => base.controls.includes(c))
  );
};

/**
 * カメの歩み（turtlogo）1.0 ＝ 基本の行動のみ。
 *
 * コマンド（命令）族だけを付与し、クエリ・制御は未獲得。版を上げると開花する（→ v2.0）。
 * loadAttack はブロック未提供なので含めない。
 */
export const TURTLOGO_V1: BaseImage = {
  imageName: "turtlogo",
  family: "カメの歩み",
  version: "1.0",
  icon: "mdi:turtle",
  summary: "基本の行動だけ。決まった順に動く",
  commands: ["stepForward", "turnRight", "turnLeft", "attack", "wait"],
  queries: [],
  controls: [],
};

/**
 * カメの歩み（turtlogo）2.0 ＝ 制御の獲得（メジャー開花）。
 *
 * v1.0 にクエリ（センサ）と制御構文（条件分岐・くりかえし）を足す。
 * 付与命令セットは現行ツールボックスの全ブロックに一致する（旧 toolbox と同一の見た目）。
 */
export const TURTLOGO_V2: BaseImage = {
  ...TURTLOGO_V1,
  version: "2.0",
  summary: "まわりを見て、条件分岐とくりかえしで判断できる",
  queries: ["enemyAhead", "wallAhead"],
  controls: ["if", "repeat", "while"],
};

/** 素質カタログ（選択候補）。版が上がるほど使える命令が広がる（v1=基本行動 → v2=クエリ＋制御）。 */
export const BASE_IMAGES: readonly BaseImage[] = [TURTLOGO_V1, TURTLOGO_V2];

/** 系統（imageName）でまとめた版の並び。選択UIの「系統 × 版ラダー」の土台（カタログから動的生成）。 */
export interface BaseImageFamily {
  // EN 識別子（FROM のイメージ名）。系統の同定キー。例: "turtlogo"。
  readonly imageName: string;
  // A面の系統名（JP・正）。例: "カメの歩み"。
  readonly family: string;
  // 系統を UI で示す mdi アイコン名。
  readonly icon: string;
  // この系統の版（version 昇順＝開花の進行順）。隣接版の差分で「版を上げると広がる」を見せる。
  readonly versions: readonly BaseImage[];
}

/**
 * カタログ（BASE_IMAGES）を系統ごとにまとめ、各系統の版を昇順に並べる。
 *
 * 系統が増える＝要素が増える／版が伸びる＝versions が伸びる、で選択UIが同じ形のまま拡張できる。
 */
export const baseImageFamilies = (): BaseImageFamily[] => {
  const byName = new Map<string, BaseImage[]>();
  for (const base of BASE_IMAGES) {
    const bucket = byName.get(base.imageName) ?? [];
    bucket.push(base);
    byName.set(base.imageName, bucket);
  }
  return [...byName.values()].map((versions) => {
    // 版は数値 major.minor として昇順（開花の進行順）に並べる。
    const sorted = [...versions].sort((a, b) => compareVersion(a.version, b.version));
    const head = sorted[0];
    return { imageName: head.imageName, family: head.family, icon: head.icon, versions: sorted };
  });
};

// 版タグ（major.minor）を数値で比較する。文字列比較だと "10.0" < "2.0" を誤るため桁ごとに見る。
function compareVersion(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

/**
 * 既定の素質。表示のフォールバック（プリセット／観戦の敵／カレント）に使う。
 * プリセット等は制御・クエリを使うため、フル機能の v2.0 を既定に据える。
 */
export const DEFAULT_BASE_IMAGE: BaseImage = TURTLOGO_V2;
