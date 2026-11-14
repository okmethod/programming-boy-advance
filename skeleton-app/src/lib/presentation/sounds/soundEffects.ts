/**
 * soundEffects - ゲーム演出用サウンドエフェクトのアダプター層。
 *
 * beep.ts の合成エンジンと audioStore を繋ぎ、イベント別の SE を定義・公開する。
 * ストア依存をこのファイルに集約し、呼び出し側は playSE.damage() のように引数なしで鳴らせる。
 * レトロ路線に合わせ音源ファイルを持たず波形合成（チップチューン）で鳴らす。
 * 構築フェーズの操作音は Blockly の内蔵音と馴染むよう、ノイズ系クリック（打撃質感）で作る。
 */

import { audioContextProvider } from "#lib/presentation/sounds/audioStore";
import type { NotePattern, ChordPattern, ClickPattern } from "#lib/presentation/sounds/beep";
import { playNote, playChord, playClick } from "#lib/presentation/sounds/beep";

// 周波数の推移だけで作る単音パターン（打撃・スイープ系）。
const NOTE_PATTERNS = {
  TICK: { startFreq: 2400, duration: 0.02 }, // 高域のチッ
  SWIPE: { startFreq: 2000, endFreq: 400, duration: 0.06 }, // 素早い下降
  PIVOT: { startFreq: 440, endFreq: 880, duration: 0.05 }, // 素早い上昇（オクターブ上がり）
  THUD: { startFreq: 120, endFreq: 40, duration: 0.12 }, // 重いドサッ
  DESCEND: { startFreq: 800, endFreq: 150, duration: 0.18 }, // 下降
  SERVO: { startFreq: 196, endFreq: 659, duration: 0.18 }, // 立ち上がる駆動音（square でウィーン）
  UP: { startFreq: 523.25, endFreq: 783.99, duration: 0.07 }, // 軽い上昇（保存・プッシュ）
  DOWN: { startFreq: 783.99, endFreq: 523.25, duration: 0.07 }, // 軽い下降（取り込み・プル）
  TAP: { startFreq: 988, duration: 0.04 }, // 高域の短いタップ（確定・リネーム/配分決定）
  DROP: { startFreq: 440, endFreq: 130, duration: 0.1 }, // 落とす（破棄・削除）
  SHIFT: { startFreq: 523.25, endFreq: 698.46, duration: 0.08 }, // 切り替わる4度上がり（素質切替）
  REVERT: { startFreq: 659.25, endFreq: 392, duration: 0.1 }, // 巻き戻す下降（ロールバック）
} as const satisfies Record<string, NotePattern>;

// 複数周波数の和音パターン（勝敗ジングル・金属リング・システム合図）。
const CHORD_PATTERNS = {
  CLEAR: { frequencies: [523.25, 659.25, 783.99], duration: 0.22, arpeggio: 0.06 }, // 明るい上昇3音（ゲームクリア）
  FALL: { frequencies: [659.25, 523.25, 392], duration: 0.5, arpeggio: 0.12 }, // 寂しい下降（敗北）
  CLANG: { frequencies: [1568, 2349, 3136], duration: 0.16 }, // 協和寄りの高音（金属のリング・ベル質感）
  PUPI: { frequencies: [523.25, 659.25], duration: 0.04, arpeggio: 0.05 }, // 柔らかい2音（音声ON・尻ぎれのプピッ）
} as const satisfies Record<string, ChordPattern>;

// 帯域制限ノイズで作る打撃パターン（構築フェーズの操作音＝Blockly の触感に寄せる）。
const CLICK_PATTERNS = {
  CRASH: { duration: 0.16, filterFreq: 2600, filterQ: 0.6, noiseLevel: 1.3 }, // 高域の金属質ノイズ（ガシャンのシャ）
  DEPLOY: { duration: 0.14, filterFreq: 700, filterQ: 0.9, pitchFreq: 180, pitchEndFreq: 300, noiseLevel: 1.8 }, // 低いガコッ＝起動の芯
  LATCH: { duration: 0.05, filterFreq: 2200, filterQ: 1.0, pitchFreq: 520, noiseLevel: 1.2 }, // 噛み合うカチャ（終端のラッチ）
} as const satisfies Record<string, ClickPattern>;

// delay＝再生開始までの遅延（秒）。レイヤー内で層ごとにずらし、ガ→シャンのような時間差を作る。
type SoundDefinition =
  | {
      readonly type: "note";
      readonly pattern: NotePattern;
      readonly wave: OscillatorType;
      readonly volume: number;
      readonly delay: number;
    }
  | {
      readonly type: "chord";
      readonly pattern: ChordPattern;
      readonly wave: OscillatorType;
      readonly volume: number;
      readonly delay: number;
    }
  | { readonly type: "click"; readonly pattern: ClickPattern; readonly volume: number; readonly delay: number }
  | { readonly type: "layers"; readonly defs: readonly SoundDefinition[] };

const note = (pattern: NotePattern, wave: OscillatorType, volume = 0.1, delay = 0): SoundDefinition => ({
  type: "note",
  pattern,
  wave,
  volume,
  delay,
});
const chord = (pattern: ChordPattern, wave: OscillatorType, volume = 0.1, delay = 0): SoundDefinition => ({
  type: "chord",
  pattern,
  wave,
  volume,
  delay,
});
const click = (pattern: ClickPattern, volume = 0.1, delay = 0): SoundDefinition => ({
  type: "click",
  pattern,
  volume,
  delay,
});
// 打撃に音程を重ねる等、複数の定義を同時に鳴らして厚みを出す（単発だと線が細いため）。
const layers = (...defs: SoundDefinition[]): SoundDefinition => ({ type: "layers", defs });

// イベント → サウンド定義の割り当て（波形・音量もここで確定する）。
// バトル：wait は何もしないクロックでも毎回鳴る土台なので最も控えめに、被弾・勝敗は存在感を出す。
// 構築：ビルド＝確定のガシャン、デプロイ＝機械起動（ガコッ＋サーボ＋ラッチ）。
// レジストリ：プル/プッシュ＝下降/上昇の対、リネーム＝軽いタップ、削除＝落とす音。軽量に揃える。
// 確定操作：素質切替＝切り替わり、配分決定＝タップ、ロールバック＝巻き戻しの下降。
// システム：audioOn＝音声を入れた合図（控えめなプピ）。勝利は明るい上昇チャイム（ゲームクリア）。
const SE_ASSIGNMENTS = {
  wait: note(NOTE_PATTERNS.TICK, "square", 0.05),
  move: note(NOTE_PATTERNS.SWIPE, "sine"),
  turn: note(NOTE_PATTERNS.PIVOT, "triangle", 0.08),
  damage: note(NOTE_PATTERNS.THUD, "square", 0.14),
  freeze: note(NOTE_PATTERNS.DESCEND, "sine"),
  win: chord(CHORD_PATTERNS.CLEAR, "triangle", 0.12),
  lose: chord(CHORD_PATTERNS.FALL, "sawtooth", 0.1),
  build: layers(
    note(NOTE_PATTERNS.THUD, "square", 0.16), // 低い衝撃の芯＝ガ（t=0）
    click(CLICK_PATTERNS.CRASH, 0.14, 0.06), // 金属質のノイズ＝シャ（60ms 遅らせて分離）
    chord(CHORD_PATTERNS.CLANG, "triangle", 0.09, 0.07), // 協和寄りの金属リング＝ン（シャに重ねる）
  ),
  deploy: layers(
    click(CLICK_PATTERNS.DEPLOY, 0.18), // 低い打撃＝起動の芯（ガコッ・t=0）
    note(NOTE_PATTERNS.SERVO, "square", 0.07, 0.03), // 立ち上がる駆動音（ウィーン）
    click(CLICK_PATTERNS.LATCH, 0.14, 0.17), // 噛み合うラッチ（カチャ・終端で締める）
  ),
  pull: note(NOTE_PATTERNS.DOWN, "sine", 0.08),
  push: note(NOTE_PATTERNS.UP, "sine", 0.08),
  rename: note(NOTE_PATTERNS.TAP, "triangle", 0.07),
  delete: note(NOTE_PATTERNS.DROP, "square", 0.09),
  baseImage: note(NOTE_PATTERNS.SHIFT, "triangle", 0.09),
  allocate: note(NOTE_PATTERNS.TAP, "sine", 0.08),
  revert: note(NOTE_PATTERNS.REVERT, "sine", 0.08),
  audioOn: chord(CHORD_PATTERNS.PUPI, "triangle", 0.06),
} satisfies Record<string, SoundDefinition>;

/** SE の識別子（割り当てキー全体）。 */
type Cue = keyof typeof SE_ASSIGNMENTS;
/** バトルイベントの識別子（再生差分から選ぶ cue）。SE_ASSIGNMENTS のうちバトル側の部分集合。 */
export type BattleCue = "wait" | "move" | "turn" | "damage" | "freeze" | "win" | "lose";

function createPlay(def: SoundDefinition): () => void {
  if (def.type === "note") {
    return () =>
      playNote(audioContextProvider, { ...def.pattern, waveType: def.wave, volume: def.volume, delay: def.delay });
  }
  if (def.type === "chord") {
    return () =>
      playChord(audioContextProvider, { ...def.pattern, waveType: def.wave, volume: def.volume, delay: def.delay });
  }
  if (def.type === "click") {
    return () => playClick(audioContextProvider, { ...def.pattern, volume: def.volume, delay: def.delay });
  }
  // レイヤーは各定義の再生関数を一度組み立て、まとめて同時に鳴らす。
  const plays = def.defs.map(createPlay);
  return () => plays.forEach((play) => play());
}

/** イベント別の SE 再生関数。例: playSE.damage() / playSE.deploy()。 */
export const playSE = Object.fromEntries(
  Object.entries(SE_ASSIGNMENTS).map(([cue, def]) => [cue, createPlay(def)]),
) as Record<Cue, () => void>;
