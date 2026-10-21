/**
 * ブロックUI（Blockly 統合）の公開 API。
 *
 * ブロックで組んだワークスペースをドメインの Program（命令木）に変換する入口。
 */

export { registerBlocks, TOOLBOX } from "./blocks";
export { workspaceToProgram } from "./toProgram";
