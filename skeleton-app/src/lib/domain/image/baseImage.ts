/**
 * 素質（BaseImage）の派生操作と、特定できない時のフォールバック（UNKNOWN_BASE_IMAGE）。
 *
 * 素質は「何が得意か（系統）× どこまで開花したか（版）」で使える命令セットを定める器。
 * docs/game-rules/base-images.md を正とする。
 */

import type { Program } from "$lib/domain/program";
import { usedCapabilities } from "$lib/domain/program";
import type { BaseImage } from "./model";
import { BASE_IMAGES } from "./catalog";

/** 系統（imageName）でまとめた版の並び＝baseImageFamilies の出力型。選択UIの「系統 × 版ラダー」の土台。 */
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

// 素質の同定キー＝系統×版（表示整形に依らない内部キー。許可集合の照合に使う）。
const baseImageKey = (base: BaseImage): string => `${base.imageName}@${base.version}`;

/**
 * 候補の素質がステージの許可集合に含まれるか（undefined＝無制限で常に true）。
 * ステージごとの素質制限（Chap1 ラダーは v1 のみ等）の判定の原点。
 */
export const baseImageAllowed = (base: BaseImage, allowed?: readonly BaseImage[]): boolean => {
  if (!allowed) return true;
  const key = baseImageKey(base);
  return allowed.some((a) => baseImageKey(a) === key);
};

/**
 * 系統×版カタログを許可集合で絞る（undefined＝無制限でそのまま返す）。
 * 各系統は許可された版だけを残し、残り版が無い系統は落とす＝選択UIを許可範囲だけの同じ形に畳む。
 */
export const filterBaseImageFamilies = (
  families: readonly BaseImageFamily[],
  allowed?: readonly BaseImage[],
): BaseImageFamily[] => {
  if (!allowed) return [...families];
  const keys = new Set(allowed.map(baseImageKey));
  return families
    .map((family) => ({ ...family, versions: family.versions.filter((v) => keys.has(baseImageKey(v))) }))
    .filter((family) => family.versions.length > 0);
};

/** 許可集合のうち最も版が進んだ素質＝ステージ入場時のクランプ先（空集合は undefined）。 */
export const highestAllowedImage = (allowed: readonly BaseImage[]): BaseImage | undefined =>
  [...allowed].sort((a, b) => compareVersion(a.version, b.version)).at(-1);

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
 * 解決不能な素質のセンチネル。永続復元で保存版がカタログから消えた等、素質を特定できないときに据える。
 * 命令セットは空＝baseImageSupports が必ず false を返し「この素質では編集できない」を正しく示す。
 * 「安易な既定」ではなく「不明」を表す明示的な値であり、実体を持てる箇所では各データの素質を渡すこと。
 */
export const UNKNOWN_BASE_IMAGE: BaseImage = {
  imageName: "unknown",
  family: "不明",
  // 表示は "unknown:v?"。カタログ外なので版の数値比較（compareVersion）経路には乗らない。
  version: "?",
  icon: "mdi:help-circle-outline",
  summary: "イメージが見つかりません",
  commands: [],
  queries: [],
  controls: [],
};
