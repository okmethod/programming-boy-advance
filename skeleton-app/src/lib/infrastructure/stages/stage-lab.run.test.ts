/**
 * 試走表（stage-lab）の実行の入口。環境変数 STAGE_LAB を指定したときだけ動き、普段のテスト実行では skip される。
 *
 * WIP: チャプター2（迷路）の設計で使った道具を、汎用の形に寄せて置いたもの。
 * 候補プログラムは壁沿い系（右手法・左手法・v3 等）が既定で、表示も ally の軌跡だけ。
 * チャプター3以降のテーマ（攻撃など）で使うときは、候補の差し替えや HP 推移など表示列の追加を検討する。
 * テストランナー（vitest）を実行環境として借りているだけで、判定（assert）はしない。
 *
 * 使い方（skeleton-app/ で実行）:
 *   STAGE_LAB=maze-island npm run stage:lab      # 登録済みステージを id で指定
 *   STAGE_LAB=./draft.txt npm run stage:lab      # ASCII 図の下書きファイルを指定（書式は stage-map.ts）
 * 下書きの敵は脆弱敵（正面に立てば ally 勝ち）、各個体の初期値は既定値で試走する。
 */

import { describe, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { CHAPTER1_STAGES } from "./chapter1";
import { CHAPTER2_STAGES } from "./chapter2";
import { CHAPTER3_STAGES } from "./chapter3";
import { parseStageMap } from "./stage-map";
import { formatStageLab, labStageFromMap, runStageLab } from "./stage-lab";

const target = process.env.STAGE_LAB;

describe.runIf(target)("stage-lab", () => {
  it(`試走表: ${target}`, () => {
    const registered = [...CHAPTER1_STAGES, ...CHAPTER2_STAGES, ...CHAPTER3_STAGES].find(
      (stage) => stage.id === target,
    );
    if (!registered && !existsSync(target!)) {
      throw new Error(`STAGE_LAB must be a registered stage id or a path to an ASCII map file: ${target}`);
    }
    const stage = registered ?? labStageFromMap(parseStageMap(readFileSync(target!, "utf8")));
    console.log(`\n${formatStageLab(stage, runStageLab(stage))}\n`);
  });
});
