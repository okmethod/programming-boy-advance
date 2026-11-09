/**
 * ワークベンチ（編集中ドラフト）のアプリ層ファサード。
 *
 * プレゼン層とドラフト状態の継ぎ目＝編集操作（build/pull 等）の単一窓口。
 * 書き込みは storeWriter 経由に限り、意味のある操作だけを通す（内部構造を UI から隠す）。
 * registry/battle と違い Port/永続化を持たない（＝DI が無い）ため合成ルートは介さず、
 * ここが直接の窓口（state はアプリ層 singleton に同居）。
 *
 * 読みの反応性は readonly store（workbenchDraft）の `$`購読で担う（CQRS 分離）。
 * current() は非追跡の一発読み（Blockly への hydrate 等、reactive でない参照用）。
 */

import type { BaseImage, Program, ParseResult } from "$lib/domain";
import { parseProgram } from "$lib/domain";
import { storeWriter, type WorkbenchDraft } from "./store";

// プルで取り込む元イメージの最小形（RegistryImage の必要フィールドのみ）。
interface PullSource {
  readonly program: Program;
  readonly label: string;
  readonly baseImage: BaseImage;
  readonly pushedAt: number | null;
}

/** UI が参照する編集ドラフト操作の単一窓口。 */
export interface WorkbenchFacade {
  /** Blockly からの最新 Program を反映する（編集のたびに呼ばれる順方向の口）。 */
  setProgram(program: Program): void;
  /**
   * エディタ編集面のテキストを逆変換して反映する（code モードの順方向の口）。
   * 逆変換（parseProgram）はこのユースケースに閉じ、成功時のみ program を反映する
   * （失敗時は直近の有効 program を保つ）。結果（ok/errors）を返し、UI は確定ブロック等に使う。
   */
  setProgramFromText(text: string): ParseResult;
  /** ビルド＝現在の編集を凍結してイメージ化する（生編集から切り離した不変スナップショット）。 */
  build(): void;
  /**
   * 前回ビルド断面へ戻す＝編集中 program をビルドイメージで上書きする（復元点として使う）。
   * 未ビルドは no-op。ビルドと対称に clone し、program↔builtImage のエイリアスを断つ。
   * ビューの追従（Blockly 再ロード／テキスト欄の種貼り直し）はプレゼン側の責務でここには含めない。
   */
  revertToBuilt(): void;
  /** カレントイメージを破棄＝未ビルドに戻す（編集中の program はそのまま）。 */
  clearBuilt(): void;
  /** カレントイメージのローカル名を付け替える。 */
  setName(name: string): void;
  /** 編集の土台にする素質（系統×版）を乗り換える。 */
  setBaseImage(baseImage: BaseImage): void;
  /** プル＝レジストリのイメージをカレント（ビルド断面）に取り込む（改良の起点）。 */
  pull(image: PullSource): void;
  /** 現在のドラフトのスナップショット（非追跡の一発読み用）。 */
  current(): WorkbenchDraft;
}

/** 編集ドラフト操作の単一窓口（DI が無いため singleton で持つ）。 */
export const workbenchFacade: WorkbenchFacade = {
  setProgram(program) {
    storeWriter.update((draft) => ({ ...draft, program }));
  },
  setProgramFromText(text) {
    // 現在の素質（baseImage）の付与セットを渡し、付与対象外の命令を parse 側で行つきに弾く
    // ＝ブロック編集のツールボックスが構造的に担う素質ガードを、テキスト編集にも効かせる。
    // BaseImage は commands/queries/controls を持つため UsedCapabilities として素通しできる。
    const { baseImage } = storeWriter.snapshot();
    const result = parseProgram(text, baseImage);
    if (result.ok) storeWriter.update((draft) => ({ ...draft, program: result.program }));
    return result;
  },
  build() {
    storeWriter.update((draft) => ({
      ...draft,
      builtImage: structuredClone(draft.program),
      builtAt: Date.now(),
    }));
  },
  revertToBuilt() {
    storeWriter.update((draft) =>
      draft.builtImage === null ? draft : { ...draft, program: structuredClone(draft.builtImage) },
    );
  },
  clearBuilt() {
    storeWriter.update((draft) => ({ ...draft, builtImage: null, builtAt: null, imageName: "" }));
  },
  setName(name) {
    storeWriter.update((draft) => ({ ...draft, imageName: name }));
  },
  setBaseImage(baseImage) {
    storeWriter.update((draft) => ({ ...draft, baseImage }));
  },
  pull(image) {
    storeWriter.update((draft) => ({
      ...draft,
      builtImage: image.program,
      builtAt: image.pushedAt ?? Date.now(),
      imageName: image.label,
      baseImage: image.baseImage,
    }));
  },
  current() {
    return storeWriter.snapshot();
  },
};
