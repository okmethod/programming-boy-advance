/**
 * StageRepository の静的実装（インフラ層 Adapter）。
 *
 * TS 定数で持つステージ群を id 索引で返す。将来 JSON/DSL/API 版の Adapter に差し替えても、
 * アプリ層は Port（StageRepository）にしか依存しないため影響を受けない。
 */

import type { Stage, StageRepository } from "$lib/application";
import { STAGE_01 } from "$lib/infrastructure/stages/stage01";
import { STAGE_02 } from "$lib/infrastructure/stages/stage02";
import { STAGE_03 } from "$lib/infrastructure/stages/stage03";

const STAGES: Record<string, Stage> = {
  [STAGE_01.id]: STAGE_01,
  [STAGE_02.id]: STAGE_02,
  [STAGE_03.id]: STAGE_03,
};

export const staticStageRepository: StageRepository = {
  get(id) {
    const stage = STAGES[id];
    if (!stage) throw new Error(`Stage not found: ${id}`);
    return stage;
  },
  list() {
    return Object.values(STAGES);
  },
};
