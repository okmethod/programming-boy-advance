/**
 * sound - 音の媒体。アクションを効果音（playSE）へ写像して鳴らす。
 *
 * アクション名と同名の cue を鳴らすだけ（波形の定義は sounds 側が持つ）。
 * 音は全アクションに反応する（最も基本的な媒体）。
 */

import { playSE } from "#lib/presentation/sounds";
import { registerMedium } from "../dispatch";

registerMedium((action) => playSE[action]());
