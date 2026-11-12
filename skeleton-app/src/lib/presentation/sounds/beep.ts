/**
 * beep - Web Audio API の低レベル音声ラッパー（ストア非依存のエンジン層）。
 *
 * 単音・和音を波形合成で再生する。AudioContext は呼び出し側が provider 関数で渡すため、
 * ストアやブラウザ環境に依存せず、テスト・再利用しやすい。soundEffects.ts が利用する。
 */

export const WAVE_TYPES: readonly OscillatorType[] = ["sine", "square", "sawtooth", "triangle"] as const;

/** 最小単位の音（単一周波数・一定長・秒）。 */
export interface BeepPattern {
  readonly startFreq: number;
  readonly duration: number;
}

/** 単音パターン（周波数の推移を許容）。 */
export interface NotePattern extends BeepPattern {
  readonly endFreq?: number;
}

/** 和音パターン（複数周波数とアルペジオ）。 */
export interface ChordPattern {
  readonly frequencies: readonly number[];
  readonly duration: number;
  readonly arpeggio?: number;
}

interface PlaybackSettings {
  readonly waveType: OscillatorType;
  readonly volume?: number; // 0.0〜1.0
  readonly delay?: number; // 再生開始までの遅延（秒）
}

/** playNote 用設定（単音・スライド対応）。 */
export interface NoteOptions extends NotePattern, PlaybackSettings {}

/** playChord 用設定（和音）。アルペジオ遅延は音符ごとに割り当てるため delay は持たない。 */
export interface ChordOptions extends ChordPattern, Omit<PlaybackSettings, "delay"> {}

/** 単音を再生する（エンベロープ付き・周波数推移対応）。 */
export function playNote(audioContextProvider: () => AudioContext | null, options: NoteOptions): void {
  const { waveType, startFreq, endFreq, duration, volume = 0.1, delay = 0 } = options;
  const audioCtx = audioContextProvider();
  if (!audioCtx) return;

  // レジューム処理（これがないと最初の音が鳴らない場合がある）。
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }

  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  oscillator.type = waveType;
  const startTime = audioCtx.currentTime + delay;

  // 周波数の制御（endFreq 指定時は startFreq からスライド）。
  oscillator.frequency.setValueAtTime(startFreq, startTime);
  if (endFreq && endFreq > 0) {
    oscillator.frequency.exponentialRampToValueAtTime(endFreq, startTime + duration);
  }

  // エンベロープ（音量減衰）。delay 中は無音に保つ。
  gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
  gainNode.gain.setValueAtTime(volume, startTime);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  oscillator.start(startTime);
  oscillator.stop(startTime + duration);
}

/** 和音を再生する（同時 or アルペジオ）。音量は音符数で割って総量を揃える。 */
export function playChord(audioContextProvider: () => AudioContext | null, options: ChordOptions): void {
  const { frequencies, arpeggio = 0, ...rest } = options;
  const volumePerNote = (rest.volume ?? 0.1) / frequencies.length;
  frequencies.forEach((freq, index) => {
    playNote(audioContextProvider, {
      ...rest,
      startFreq: freq,
      volume: volumePerNote,
      delay: arpeggio * index,
    });
  });
}
