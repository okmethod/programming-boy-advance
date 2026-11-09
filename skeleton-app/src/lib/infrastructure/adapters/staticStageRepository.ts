/**
 * StageRepository の静的実装（インフラ層 Adapter）。
 *
 * TS 定数で持つステージ群を id 索引で返す。将来 JSON/DSL/API 版の Adapter に差し替えても、
 * アプリ層は Port（StageRepository）にしか依存しないため影響を受けない。
 */

import type { Stage, StageRepository } from "$lib/application";
import { SIMPLE_CHARGER_STAGE } from "$lib/infrastructure/stages/simple-charger";
import { REACTIVE_SENTRY_STAGE } from "$lib/infrastructure/stages/reactive-sentry";
import { LOAD_DISRUPTOR_STAGE } from "$lib/infrastructure/stages/load-disruptor";
import { WINDING_PATH_STAGE } from "$lib/infrastructure/stages/winding-path";

const STAGES: Record<string, Stage> = {
  [SIMPLE_CHARGER_STAGE.id]: SIMPLE_CHARGER_STAGE,
  [REACTIVE_SENTRY_STAGE.id]: REACTIVE_SENTRY_STAGE,
  [LOAD_DISRUPTOR_STAGE.id]: LOAD_DISRUPTOR_STAGE,
  [WINDING_PATH_STAGE.id]: WINDING_PATH_STAGE,
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
