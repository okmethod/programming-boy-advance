/**
 * バトルポッドのアプリ層ファサード。
 *
 * プレゼン層とドメイン層の継ぎ目＝ UI からゲームロジックへの単一窓口。
 * ステージ取得は Port（StageRepository）経由に限り、供給元を UI から隠す。
 * 具体 Adapter は合成ルート（プレゼン層）で createBattleFacade に注入される。
 *
 * 観戦セッション（出撃した ally＝deployedImage ＋ 舞台＝stage）はアプリ層の store が所有する。
 * 書き（openSession/deploy）はこの facade に集約し、読み（run/行/ログ/hash）は store の readonly 投影を購読する。
 * ステージ定義の「どれを」はプレゼン（URL）が解決し、openSession で渡す（供給元の選択はプレゼンの役目）。
 */

import { recordRun } from "$lib/domain";
import type { BaseImage, BattleRun, Program } from "$lib/domain";
import type { Stage, StageRepository } from "$lib/application/ports/stageRepository";
import { sandboxInitial, SANDBOX_MAX_CLOCKS, type SandboxTarget } from "./sandbox";
import { storeWriter } from "./store";

/** UI が参照するゲームロジックの単一窓口。 */
export interface BattleFacade {
  /** ステージ定義を取得する（提示テキスト・初期盤面などの表示用。openSession へ渡す元にも使う）。 */
  getStage(stageId: string): Stage;
  /** ステージ選択 UI 用に全ステージ定義を一覧する。 */
  listStages(): readonly Stage[];
  /** 観戦セッションを開く＝舞台（stage）を据えてデプロイをリセットする（ステージ切替の起点）。 */
  openSession(stage: Stage): void;
  /** デプロイ＝ビルド済みイメージ（素質込み）を対戦に出す（観戦セッションの ally を差し替える）。 */
  deploy(image: Program, name: string, baseImage: BaseImage): void;
  /** 試運転：相手なし／stub 相手でプログラムを単体実行し、観戦フレーム列を返す（勝敗なし）。 */
  runSandbox(program: Program, target: SandboxTarget): BattleRun;
}

/** StageRepository を注入してファサードを組み立てる（合成ルートから呼ぶ）。 */
export const createBattleFacade = (stages: StageRepository): BattleFacade => {
  // 観戦を途中で中身すげ替えさせない：openSession は毎回デプロイを捨ててクリーンな舞台にする。
  function openSession(stage: Stage): void {
    storeWriter.update(() => ({ stage, deployed: null }));
  }

  // 別イメージ（新ハッシュ）を出したら必ず先頭から＝再生リセットはプレゼン（再生状態の所有者）が畳む。
  function deploy(image: Program, name: string, baseImage: BaseImage): void {
    storeWriter.update((session) => ({
      ...session,
      deployed: { program: image, name, baseImage, deployedAt: Date.now() },
    }));
  }

  function runSandbox(program: Program, target: SandboxTarget): BattleRun {
    // 勝敗で打ち切らず、固定盤で ally のプログラムだけを走らせる（stub は反撃しない的）。
    // 盤面・上限などの試運転パラメータは app（sandbox.ts）が供給し、回す／畳む実行は domain に委ねる。
    return recordRun(sandboxInitial(target), program, [], { maxClocks: SANDBOX_MAX_CLOCKS, ignoreWinner: true });
  }

  return {
    getStage: (stageId) => stages.get(stageId),
    listStages: () => stages.list(),
    openSession,
    deploy,
    runSandbox,
  };
};
