/**
 * レジストリ永続化の Port（アプリ層が依存する抽象）。
 *
 * 手持ちイメージの保存先（localStorage・将来の IndexedDB/バックエンド）をレジストリのロジックから隠す継ぎ目。
 * アプリ層はこの契約だけに依存し、具体実装（インフラ層の Adapter）は合成ルートで注入される。
 * やり取りは純シリアライズ可能な DTO に限る（リアクティブ型・ドメイン実体は持ち込まない）。
 */

import type { Program } from "$lib/domain";

/**
 * 永続化する手持ちイメージ1件（DTO）。
 * baseImage は参照（系統×版）のみを持ち、実体はロード時にカタログから復元する
 * （カタログ進化で summary/icon が変わっても陳腐化しないため）。
 * hash は program から導出可能なので持たない（ロード時に再計算）。
 */
export interface PersistedImage {
  readonly id: string;
  readonly label: string;
  readonly program: Program;
  readonly baseRef: { readonly imageName: string; readonly version: string };
  readonly pushedAt: number;
}

/** 永続化するレジストリ全体（DTO）。プリセットは含めず、user の手持ちと採番のみ。 */
export interface PersistedRegistry {
  readonly seq: number;
  readonly images: readonly PersistedImage[];
}

/** 手持ちイメージの保存口。供給先はインフラ層の Adapter が実装する。 */
export interface RegistryRepository {
  /** 保存済みの手持ちを読む。未保存・破損・スキーマ版違いは null（呼び出し側は初期シードで続行）。 */
  load(): PersistedRegistry | null;
  /** 手持ちを丸ごと保存する（ミューテーションごとのライト・スルー）。 */
  save(data: PersistedRegistry): void;
}
