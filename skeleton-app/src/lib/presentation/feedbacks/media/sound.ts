/**
 * sound - 音の媒体。アクションを効果音 cue へ写像して鳴らす。
 *
 * 割付は bubble の MESSAGES と対称で、この媒体が CUES（アクション→cue 名）を持つ。
 * 波形そのものは sounds/soundEffects.ts にある＝そのカタログは再生中のフレーム cue（move/turn/damage…）と
 * 共有する資源なので中立な sounds/ に置き、媒体は cue 名で引く（sounds は GameAction を知らない＝依存は一方向）。
 * CUES は GameAction 全網羅の total map なので、アクションを足したらここに1行足すまで型エラーになる。
 */

import { playSE, type SoundCue } from "#lib/presentation/sounds";
import type { GameAction } from "../actions";
import { registerMedium } from "../dispatch";

// アクション → cue 名。現状は同名だが、名前一致に依存せず明示する（名前と表現を分離できる）。
const CUES: Record<GameAction, SoundCue> = {
  build: "build",
  deploy: "deploy",
  pull: "pull",
  push: "push",
  rename: "rename",
  delete: "delete",
  baseImage: "baseImage",
  allocate: "allocate",
  revert: "revert",
  run: "run",
  audioOn: "audioOn",
};

registerMedium((action) => playSE[CUES[action]]());
