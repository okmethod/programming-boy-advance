/**
 * RegistryRepository の localStorage 実装（インフラ層 Adapter）。
 *
 * 手持ちイメージ（user の push 分）をスキーマ版付き封筒で localStorage に保存する。
 * 将来 IndexedDB/バックエンド版に差し替えても、アプリ層は Port にしか依存しないため影響を受けない。
 *
 * codec（serialize/deserialize）は I/O から切り離した純関数で、Unit で守る。
 * ブラウザ以外（SSR/プリレンダの Node）では localStorage が無いので no-op（typeof で判定し SvelteKit に依存しない）。
 */

import type { PersistedImage, PersistedRegistry, RegistryRepository } from "$lib/application";

const STORAGE_KEY = "pba:registry:v1";
// 永続化スキーマの版（データ構造の互換性。イメージのタグ版管理(B面)とは別物）。不一致は読み捨てる。
const SCHEMA = 1;

interface Envelope {
  readonly schema: number;
  readonly seq: number;
  readonly images: readonly PersistedImage[];
}

/** PersistedRegistry → 保存文字列（スキーマ版を被せる）。 */
export const serializeRegistry = (data: PersistedRegistry): string => {
  const envelope: Envelope = { schema: SCHEMA, seq: data.seq, images: data.images };
  return JSON.stringify(envelope);
};

// PersistedImage として最低限妥当か（壊れた要素を取り込まない）。
function isValidImage(value: unknown): value is PersistedImage {
  if (typeof value !== "object" || value === null) return false;
  const image = value as Record<string, unknown>;
  return (
    typeof image.id === "string" &&
    typeof image.label === "string" &&
    Array.isArray(image.program) &&
    typeof image.baseRef === "object" &&
    image.baseRef !== null
  );
}

/** 保存文字列 → PersistedRegistry。未保存・破損・スキーマ版違いは null（例外は投げない）。 */
export const deserializeRegistry = (raw: string | null): PersistedRegistry | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<Envelope>;
    if (parsed.schema !== SCHEMA || !Array.isArray(parsed.images)) return null;
    const images = parsed.images.filter(isValidImage);
    const seq = typeof parsed.seq === "number" ? parsed.seq : images.length;
    return { seq, images };
  } catch {
    return null; // 壊れた JSON は読み捨てて初期シードへ
  }
};

export const localStorageRegistryRepository: RegistryRepository = {
  load() {
    if (typeof localStorage === "undefined") return null;
    return deserializeRegistry(localStorage.getItem(STORAGE_KEY));
  },
  save(data) {
    if (typeof localStorage === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, serializeRegistry(data));
    } catch {
      // quota 超過等は保存を諦める（機能は in-memory で継続）。
    }
  },
};
