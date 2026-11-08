/**
 * インフラ層の公開 API。
 *
 * @architecture レイヤー間依存ルール - インフラ層
 * - ROLE: ステージ/キャラ定義の供給・状態の永続化（Port 実装 Adapter）
 * - ALLOWED: ドメイン層・アプリ層 Port への依存
 * - FORBIDDEN: プレゼン層への依存
 * - CONSUMED BY: 合成ルート（presentation/composition.ts）のみ
 *
 * 合成ルートがここから具体 Adapter を取り、アプリ層 Facade に注入する。
 */

export { staticStageRepository } from "./adapters/staticStageRepository";
export { localStorageRegistryRepository } from "./adapters/localStorageRegistryRepository";
