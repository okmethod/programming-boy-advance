/**
 * レジストリのアプリ層ファサード。
 *
 * プレゼン層とレジストリ状態の継ぎ目＝手持ちイメージの操作（commands）の単一窓口。
 * 書き込みは storeWriter 経由に限り、永続化は Port（RegistryRepository）経由で供給元を UI から隠す。
 * 具体 Adapter は合成ルート（プレゼン層）で createRegistryFacade に注入される。
 *
 * 読みの反応性は readonly store（registryImages）の `$`購読で担う（CQRS 分離）。
 * ここの query（duplicateOf/hashOf）は get() の一発読みなので `$derived` 内で自動追跡されない点に注意
 * （reactive に使う側は registryImages を併せて購読する）。
 */

import type { BaseImage, Program } from "$lib/domain";
import { BASE_IMAGES, DEFAULT_BASE_IMAGE, hashProgram } from "$lib/domain";
import type { PersistedImage, PersistedRegistry, RegistryRepository } from "$lib/application/ports/registryRepository";
import { registryImages, storeWriter, type RegistryImage } from "./store";

/** UI が参照する手持ちイメージ操作の単一窓口。 */
export interface RegistryFacade {
  /** プッシュ＝ビルド済みイメージを手持ちに保存する。
   *  label 省略時は自動名（イメージ N）。同一内容が既にあれば no-op（content-addressable）。 */
  push(program: Program, label?: string, baseImage?: BaseImage): void;
  /** リネーム＝名前（タグ）の付け替え。中身は不変。お手本（preset）は対象外。 */
  rename(id: string, label: string): void;
  /** 削除。お手本（preset）は残し、手持ちのみ消せる。 */
  remove(id: string): void;
  /** 同一内容の既存イメージ（あれば）。プッシュ重複の判定・表示に使う。 */
  duplicateOf(program: Program): RegistryImage | undefined;
  /** 命令木の内容ハッシュ（content fingerprint）。レジストリ外でも同じ指紋を見せるため公開。 */
  hashOf(program: Program): string;
  /** 永続化済みの手持ちを読み込み、state に反映する（合成ルートが起動時に一度呼ぶ）。 */
  restore(): void;
}

// baseRef（系統×版）をカタログから実体に復元する。該当版が無ければ既定にフォールバックする
// （カタログから版が消えても壊さない）。
function resolveBaseImage(ref: PersistedImage["baseRef"]): BaseImage {
  return (
    BASE_IMAGES.find((base) => base.imageName === ref.imageName && base.version === ref.version) ?? DEFAULT_BASE_IMAGE
  );
}

// 永続化 DTO → 表示用 RegistryImage。baseRef を実体へ、hash は program から再計算、source は user 固定。
function hydrate(dto: PersistedImage): RegistryImage {
  return {
    id: dto.id,
    label: dto.label,
    program: dto.program,
    hash: hashProgram(dto.program),
    baseImage: resolveBaseImage(dto.baseRef),
    source: "user",
    pushedAt: dto.pushedAt,
  };
}

// 現在の集合 → 永続化 DTO。プリセットは除き、手持ち（user）だけを baseRef に落として保存する。
function toPersisted(images: readonly RegistryImage[], seq: number): PersistedRegistry {
  const userImages: PersistedImage[] = images
    .filter((image) => image.source === "user")
    .map((image) => ({
      id: image.id,
      label: image.label,
      program: image.program,
      baseRef: { imageName: image.baseImage.imageName, version: image.baseImage.version },
      pushedAt: image.pushedAt ?? 0,
    }));
  return { seq, images: userImages };
}

/** RegistryRepository を注入してファサードを組み立てる（合成ルートから呼ぶ）。 */
export const createRegistryFacade = (repo: RegistryRepository): RegistryFacade => {
  // 現在の集合を丸ごと永続化する（各ミューテーション後のライト・スルー）。
  function persist(): void {
    repo.save(toPersisted(storeWriter.snapshot(), storeWriter.seq));
  }

  function duplicateOf(program: Program): RegistryImage | undefined {
    // 命令木は素直な JSON なので文字列化比較で content-addressable に判定する。
    const key = JSON.stringify(program);
    return storeWriter.snapshot().find((image) => JSON.stringify(image.program) === key);
  }

  function push(program: Program, label?: string, baseImage: BaseImage = DEFAULT_BASE_IMAGE): void {
    if (duplicateOf(program)) return; // 同じ中身は二重に積まない
    const n = storeWriter.nextSeq();
    const name = label?.trim() ? label.trim() : `イメージ ${n}`;
    storeWriter.add({
      id: `user:${n}`,
      label: name,
      program,
      hash: hashProgram(program),
      baseImage,
      source: "user",
      pushedAt: Date.now(),
    });
    persist();
  }

  function rename(id: string, label: string): void {
    const target = storeWriter.snapshot().find((image) => image.id === id);
    if (!target || target.source !== "user") return; // preset は読み取り専用
    storeWriter.replace(id, { label });
    persist();
  }

  function remove(id: string): void {
    const target = storeWriter.snapshot().find((image) => image.id === id);
    if (!target || target.source !== "user") return; // preset は構造的に消せない
    storeWriter.removeById(id);
    persist();
  }

  function restore(): void {
    const data = repo.load();
    if (data === null) return;
    storeWriter.reset(data.images.map(hydrate), data.seq);
  }

  return {
    push,
    rename,
    remove,
    duplicateOf,
    hashOf: (program) => hashProgram(program),
    restore,
  };
};

// 一覧の readonly store も同じ入口（$lib/application）から取れるよう再公開する。
export { registryImages };
