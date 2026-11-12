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

/**
 * クリックパターン（打撃・破裂系）。
 * 純音では出せない「カチッ」の過渡音を、帯域制限したノイズ＋鋭い減衰で作る。
 * Blockly の接続音のようなサンプル系の質感に寄せるためのプリミティブ。
 */
export interface ClickPattern {
  readonly duration: number; // ノイズの減衰長（秒）＝クリックの長さ
  readonly filterFreq: number; // バンドパス中心周波数（Hz）。高いほど硬く乾いた音
  readonly filterQ?: number; // バンドパスの鋭さ（狭いほど音程感が出る）
  readonly pitchFreq?: number; // 任意：芯に重ねる音程（コッという実体感）
  readonly pitchEndFreq?: number; // 任意：音程のスライド終点（上昇/下降の色）
  readonly noiseLevel?: number; // ノイズ成分の音量比（音程成分に対する相対）
}

interface PlaybackSettings {
  readonly waveType: OscillatorType;
  readonly volume?: number; // 0.0〜1.0
  readonly delay?: number; // 再生開始までの遅延（秒）
}

/** playNote 用設定（単音・スライド対応）。 */
export interface NoteOptions extends NotePattern, PlaybackSettings {}

/** playChord 用設定（和音）。delay は和音全体の開始遅延（アルペジオは各音にこれを基準に加算）。 */
export interface ChordOptions extends ChordPattern, PlaybackSettings {}

/** playClick 用設定（クリック）。波形はノイズ固定なので waveType は持たない。 */
export interface ClickOptions extends ClickPattern {
  readonly volume?: number; // 0.0〜1.0
  readonly delay?: number; // 再生開始までの遅延（秒）
}

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
  const { frequencies, arpeggio = 0, delay = 0, ...rest } = options;
  const volumePerNote = (rest.volume ?? 0.1) / frequencies.length;
  frequencies.forEach((freq, index) => {
    playNote(audioContextProvider, {
      ...rest,
      startFreq: freq,
      volume: volumePerNote,
      delay: delay + arpeggio * index,
    });
  });
}

/** クリック音を再生する（帯域制限ノイズ＋任意の音程の芯）。打撃・破裂系の過渡音を作る。 */
export function playClick(audioContextProvider: () => AudioContext | null, options: ClickOptions): void {
  const {
    duration,
    filterFreq,
    filterQ = 1,
    pitchFreq,
    pitchEndFreq,
    noiseLevel = 1,
    volume = 0.1,
    delay = 0,
  } = options;
  const audioCtx = audioContextProvider();
  if (!audioCtx) return;

  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  const now = audioCtx.currentTime + delay;

  // ノイズの芯＝「カチッ」の過渡音。1周期ぶんのホワイトノイズをバッファに詰め、バンドパスで色づける。
  const frameCount = Math.max(1, Math.floor(audioCtx.sampleRate * duration));
  const buffer = audioCtx.createBuffer(1, frameCount, audioCtx.sampleRate);
  const samples = buffer.getChannelData(0);
  for (let i = 0; i < frameCount; i++) {
    samples[i] = Math.random() * 2 - 1;
  }
  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;

  const bandpass = audioCtx.createBiquadFilter();
  bandpass.type = "bandpass";
  bandpass.frequency.setValueAtTime(filterFreq, now);
  bandpass.Q.setValueAtTime(filterQ, now);

  const noiseGain = audioCtx.createGain();
  noiseGain.gain.setValueAtTime(volume * noiseLevel, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  noise.connect(bandpass);
  bandpass.connect(noiseGain);
  noiseGain.connect(audioCtx.destination);
  noise.start(now);
  noise.stop(now + duration);

  // 音程の芯（任意）＝ノイズだけだと軽いので、短い三角波を重ねて「コッ」という実体感を足す。
  if (pitchFreq) {
    const oscillator = audioCtx.createOscillator();
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(pitchFreq, now);
    if (pitchEndFreq && pitchEndFreq > 0) {
      oscillator.frequency.exponentialRampToValueAtTime(pitchEndFreq, now + duration);
    }
    const oscGain = audioCtx.createGain();
    oscGain.gain.setValueAtTime(volume, now);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    oscillator.connect(oscGain);
    oscGain.connect(audioCtx.destination);
    oscillator.start(now);
    oscillator.stop(now + duration);
  }
}
