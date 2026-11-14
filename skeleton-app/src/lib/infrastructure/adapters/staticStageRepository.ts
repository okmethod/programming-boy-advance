/**
 * StageRepository の静的実装（インフラ層 Adapter）。
 *
 * TS 定数で持つステージ群を章ごとに束ね、id 索引と章一覧で返す。将来 JSON/DSL/API 版の Adapter に
 * 差し替えても、アプリ層は Port（StageRepository）にしか依存しないため影響を受けない。
 * 章・ステージの登録順＝選択 UI の並び順。
 */

import type { Chapter, Stage, StageRepository } from "#lib/application";
import { STRAIGHT_CORRIDOR_STAGE } from "#lib/infrastructure/stages/chapter1/straight-corridor";
import { CORNER_TURN_STAGE } from "#lib/infrastructure/stages/chapter1/corner-turn";
import { ZIGZAG_PATH_STAGE } from "#lib/infrastructure/stages/chapter1/zigzag-path";
import { LONG_CORRIDOR_STAGE } from "#lib/infrastructure/stages/chapter1/long-corridor";

// 章ごとにステージを束ねる（ディレクトリ構成 chapter1/ と対応）。
// 章・ステージの配列順＝選択 UI の並び順。
// 将来の章は要素を足して並べる。
// デモ3面（simple-charger / reactive-sentry / load-disruptor）は攻撃戦闘用で、移動のみの Chap1 の対象外。

const CHAPTERS: readonly Chapter[] = [
  {
    id: "chapter1",
    label: "チャプター1", // TODO: チャプターの表示名は暫定
    stages: [STRAIGHT_CORRIDOR_STAGE, CORNER_TURN_STAGE, ZIGZAG_PATH_STAGE, LONG_CORRIDOR_STAGE],
  },
];

// 全ステージ＝章を順に連結した平坦列（URL 解決・getStage の母集合）。
const ALL_STAGES: readonly Stage[] = CHAPTERS.flatMap((chapter) => chapter.stages);
const STAGES: Record<string, Stage> = Object.fromEntries(ALL_STAGES.map((stage) => [stage.id, stage]));

export const staticStageRepository: StageRepository = {
  get(id) {
    const stage = STAGES[id];
    if (!stage) throw new Error(`Stage not found: ${id}`);
    return stage;
  },
  list() {
    return ALL_STAGES;
  },
  listChapters() {
    return CHAPTERS;
  },
};
