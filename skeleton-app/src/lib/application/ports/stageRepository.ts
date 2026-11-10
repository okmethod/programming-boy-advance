/**
 * ステージ取得の Port（アプリ層が依存する抽象）。
 *
 * ステージ定義の供給元（TS 定数・将来の JSON/DSL・API）をゲームロジックから隠す継ぎ目。
 * アプリ層はこの契約だけに依存し、具体実装（インフラ層の Adapter）は合成ルートで注入される。
 * 設計の最新断面は docs/design/architecture.md を正とする。
 * レベルデザインは docs/design/ux-level-design.md を正とする。
 */

import type { BaseImage, BattleParams, BattleState, Program } from "$lib/domain";

/**
 * ステージ＝1 回の対戦の「お膳立て」。
 * 初期盤面・敵プログラム・提示テキストを束ねる。
 * プレイヤーの ally プログラムは外部（ブロックUI 等）から供給され、ここには含めない。
 */
export interface Stage {
  readonly id: string;
  readonly label: string;
  // 勝利条件・攻略方針の説明（A面の親しみやすいテキスト）。
  readonly goal: string;
  readonly enemy: Program;
  readonly enemyLabel: string;
  // 敵の素質（系統×版）。表示（アイコン＋系統名）の土台。敵は player カタログの包含検査対象外。
  readonly enemyBaseImage: BaseImage;
  readonly initial: BattleState;
  // メモリ総量＝デプロイ時に自動機へ供給する起動時メモリ（docker run --memory 相当）。
  // プレイヤーはこの総量を HP（ヒープ）と CP（コード予算）へ配分する。CP 自体はここでは決めない。
  readonly memoryTotal: number;
  // メモリ配分（HP↔CP）の刻み幅＝目盛り間隔。memoryTotal はこの倍数であること（CapacityAllocator の invariant）。
  // 小さくすると配分の自由度が上がり、memoryTotal=memoryGrain*2 のステージは一択＝自由度ゼロ（導入用）。
  readonly memoryGrain: number;
  // 戦闘チューニングのステージ固有上書き（未指定 knob は既定 BATTLE_PARAMS が効く）。
  // ここを足場に「全バランス調整がステージ側で成り立つ」を担保する。
  readonly params?: Partial<BattleParams>;
  // プレイヤーが使える素質（系統×版）の許可集合。未指定＝無制限（カタログ全版）。
  // ラダーの段階性を縛る土台＝選択UIを許可版だけに絞り、入場時に許可外ドラフトを最上位版へクランプする。
  readonly allowedImages?: readonly BaseImage[];
}

/**
 * チャプター＝ステージ選択 UI の章区切り（Tier > Chapter > Stage の中間層）。
 * 新しい UX 要素を 1 つ導入する単位で、配下のステージはその要素を反復・変化させる。
 */
export interface Chapter {
  // 順序非依存の安定 slug（表示番号・順序を載せない）。
  readonly id: string;
  // 章見出しの A面表示名。
  readonly label: string;
  readonly stages: readonly Stage[];
}

/** ステージ定義の取得口。供給元はインフラ層の Adapter が実装する。 */
export interface StageRepository {
  /** id でステージ定義を取得する。未知の id は例外。 */
  get(id: string): Stage;
  /** 選択 UI 用に全ステージ定義を一覧する（章を跨いで平坦・登録順）。URL 解決・getStage の母集合。 */
  list(): readonly Stage[];
  /** 選択 UI の章区切り表示用に、チャプターごとのステージ群を一覧する（登録順）。 */
  listChapters(): readonly Chapter[];
}
