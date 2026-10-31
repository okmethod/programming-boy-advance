/**
 * 幅が縮まない縦フライアウト（プレゼン層：ブロックUI）。
 *
 * 標準のフライアウトは中身の最大ブロック幅に合わせて横幅が変わるため、
 * 上部タブでカテゴリを切り替えるとパレット幅が伸縮し、原点オフセットが動いて
 * 配置済みブロックまでずれる。registry 経由で既定の縦フライアウトを差し替え、
 * 「これまで見た最大幅」を保持（sticky max）して一度広がったら縮まないようにする。
 * init で全カテゴリを一度 show してウォームアップすれば、最初から全体最大幅に固定できる。
 */

import * as Blockly from "blockly";

// パレットの下限幅（px）。どのカテゴリも最低この幅は確保する。
const MIN_FLYOUT_WIDTH = 280;

class FixedWidthFlyout extends Blockly.VerticalFlyout {
  // これまで見た最大幅。カテゴリ切替で一度広がったら縮めない（＝幅を一定に保つ）。
  private stickyWidth = MIN_FLYOUT_WIDTH;

  // フライアウトのスケールを常に等倍に固定する。
  // 既定はワークスペースのズーム倍率に追従するため、右をズームすると左パレットも拡大し
  // 幅が伸びてしまう（しかも反映は reflow 時のみ）。パレットはズーム対象外にする。
  override getFlyoutScale(): number {
    return 1;
  }

  // Blockly 標準 reflowInternal_ を単一パスで置き換える（super は呼ばない）。
  // super を呼ぶと一度 natural 幅で resizeContents が走り、その後に幅を広げても
  // コンテンツの原点オフセットが natural 幅のまま残り、広いフライアウトの下にブロックが潜る。
  // そのため最終幅（sticky）を最初から使って一度だけ再配置する。
  // ※ワークスペースはスクロールバー有りの LTR 前提のため、標準の translate 分岐は不要（省略）。
  protected override reflowInternal_(): void {
    const ws = this.getWorkspace();
    ws.scale = this.getFlyoutScale();

    // 中身の最大ブロック幅から自然幅を算出（Blockly 標準と同じ式）。
    let natural = 0;
    for (const item of this.getContents()) {
      natural = Math.max(natural, item.getElement().getBoundingRectangle().getWidth());
    }
    natural += this.MARGIN * 1.5 + this.tabWidth_;
    natural *= ws.scale;
    natural += Blockly.Scrollbar.scrollbarThickness;

    // 一度広がったら縮めない。全カテゴリをウォームアップ済みなら最初から全体最大幅になる。
    this.stickyWidth = Math.max(this.stickyWidth, natural);
    if (this.getWidth() === this.stickyWidth) return;

    this.width_ = this.stickyWidth;
    this.position();
    this.targetWorkspace.resizeContents();
    this.targetWorkspace.recordDragTargets();
  }
}

let registered = false;

/** 既定の縦フライアウトを固定下限幅版に差し替える（inject 前に呼ぶ・冪等）。 */
export function registerFixedWidthFlyout(): void {
  if (registered) return;
  Blockly.registry.register(
    Blockly.registry.Type.FLYOUTS_VERTICAL_TOOLBOX,
    Blockly.registry.DEFAULT,
    FixedWidthFlyout,
    true,
  );
  registered = true;
}
