/**
 * soundEffects - バトル演出用サウンドエフェクトのアダプター層。
 *
 * beep.ts の合成エンジンと audioStore を繋ぎ、バトルイベント別の SE を定義・公開する。
 * ストア依存をこのファイルに集約し、呼び出し側は playSE.damage() のように引数なしで鳴らせる。
 * レトロ路線に合わせ音源ファイルを持たず波形合成（チップチューン）で鳴らす。
 */

import { audioContextProvider } from "$lib/presentation/sounds/audioStore";
import type { NotePattern, ChordPattern } from "$lib/presentation/sounds/beep";
import { playNote, playChord } from "$lib/presentation/sounds/beep";

// 周波数の推移だけで作る単音パターン（打撃・スイープ系）。
const NOTE_PATTERNS = {
  TICK: { startFreq: 2400, duration: 0.02 }, // 高域のチッ
  SWIPE: { startFreq: 2000, endFreq: 400, duration: 0.06 }, // 素早い下降
  PIVOT: { startFreq: 440, endFreq: 880, duration: 0.05 }, // 素早い上昇（オクターブ上がり）
  THUD: { startFreq: 120, endFreq: 40, duration: 0.12 }, // 重いドサッ
  DESCEND: { startFreq: 800, endFreq: 150, duration: 0.18 }, // 下降
} as const satisfies Record<string, NotePattern>;

// 複数周波数の和音パターン（勝敗ジングル）。
const CHORD_PATTERNS = {
  FANFARE: { frequencies: [261.63, 329.63, 392, 523.25, 659.25], duration: 0.8, arpeggio: 0.1 }, // 堂々とした勝利
  FALL: { frequencies: [659.25, 523.25, 392], duration: 0.5, arpeggio: 0.12 }, // 寂しい下降（敗北）
} as const satisfies Record<string, ChordPattern>;

type SoundDefinition =
  | { readonly type: "note"; readonly pattern: NotePattern; readonly wave: OscillatorType; readonly volume: number }
  | { readonly type: "chord"; readonly pattern: ChordPattern; readonly wave: OscillatorType; readonly volume: number };

const note = (pattern: NotePattern, wave: OscillatorType, volume = 0.1): SoundDefinition => ({
  type: "note",
  pattern,
  wave,
  volume,
});
const chord = (pattern: ChordPattern, wave: OscillatorType, volume = 0.1): SoundDefinition => ({
  type: "chord",
  pattern,
  wave,
  volume,
});

// バトルイベント → サウンド定義の割り当て（波形・音量もここで確定する）。
// wait は何もしないクロックでも毎回鳴る土台なので最も控えめに、被弾・勝敗は存在感を出す。
const SE_ASSIGNMENTS = {
  wait: note(NOTE_PATTERNS.TICK, "square", 0.05),
  move: note(NOTE_PATTERNS.SWIPE, "sine"),
  turn: note(NOTE_PATTERNS.PIVOT, "triangle", 0.08),
  damage: note(NOTE_PATTERNS.THUD, "square", 0.14),
  freeze: note(NOTE_PATTERNS.DESCEND, "sine"),
  win: chord(CHORD_PATTERNS.FANFARE, "triangle", 0.12),
  lose: chord(CHORD_PATTERNS.FALL, "sawtooth", 0.1),
} satisfies Record<string, SoundDefinition>;

/** バトルイベントの識別子（SE の割り当てキー）。 */
export type BattleCue = keyof typeof SE_ASSIGNMENTS;

function createPlay(def: SoundDefinition): () => void {
  if (def.type === "note") {
    return () => playNote(audioContextProvider, { ...def.pattern, waveType: def.wave, volume: def.volume });
  }
  return () => playChord(audioContextProvider, { ...def.pattern, waveType: def.wave, volume: def.volume });
}

/** バトルイベント別の SE 再生関数。例: playSE.damage()。 */
export const playSE = Object.fromEntries(
  Object.entries(SE_ASSIGNMENTS).map(([cue, def]) => [cue, createPlay(def)]),
) as Record<BattleCue, () => void>;
