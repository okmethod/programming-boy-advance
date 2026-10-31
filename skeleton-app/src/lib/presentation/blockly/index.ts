/**
 * ブロックUI（Blockly 統合）の公開 API。
 *
 * ブロックで組んだワークスペースとドメインの Program（命令木）を相互変換する入口。
 */

export { registerBlocks, TOOLBOX, BLOCK_CATEGORIES, type BlockCategory } from "./blocks";
export { registerFixedWidthFlyout } from "./fixedWidthFlyout";
export { workspaceToProgram } from "./toProgram";
export { programToWorkspace } from "./toWorkspace";
