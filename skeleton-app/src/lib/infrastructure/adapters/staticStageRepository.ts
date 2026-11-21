/**
 * StageRepository の静的実装（インフラ層 Adapter）。
 *
 * TS 定数で持つステージ群を章ごとに束ね、id 索引と章一覧で返す。
 * 将来 JSON/DSL/API 版の Adapter に差し替えても、
 * アプリ層は Port（StageRepository）にしか依存しないため影響を受けない。
 * 章・ステージの登録順＝選択 UI の並び順。
 */

import type { Chapter, Stage, StageRepository } from "#lib/application";
import { CHAPTER1_STAGES } from "#lib/infrastructure/stages/chapter1";
import { CHAPTER2_STAGES } from "#lib/infrastructure/stages/chapter2";
import { CHAPTER3_STAGES } from "#lib/infrastructure/stages/chapter3";
import { REACTIVE_SENTRY_STAGE } from "#lib/infrastructure/stages/reactive-sentry";
import { LOAD_DISRUPTOR_STAGE } from "#lib/infrastructure/stages/load-disruptor";

// 章ごとにステージを束ねる。ディレクトリ構成と対応し、各章のステージ列はバレルが持つ。
const CHAPTERS: readonly Chapter[] = [
  {
    id: "chapter1",
    label: "チャプター1", // TODO: チャプターの表示名は暫定
    stages: CHAPTER1_STAGES,
  },
  {
    id: "chapter2",
    label: "チャプター2", // TODO: チャプターの表示名は暫定
    stages: CHAPTER2_STAGES,
  },
  {
    id: "chapter3",
    label: "チャプター3", // TODO: チャプターの表示名は暫定
    stages: CHAPTER3_STAGES,
  },
  {
    id: "test",
    label: "テスト用",
    stages: [REACTIVE_SENTRY_STAGE, LOAD_DISRUPTOR_STAGE],
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
