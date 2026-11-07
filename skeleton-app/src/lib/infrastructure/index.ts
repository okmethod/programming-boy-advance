/**
 * インフラ層の公開 API。
 *
 * 合成ルート（プレゼン層）がここから具体 Adapter を取り、アプリ層のファサードへ注入する。
 */

export { staticStageRepository } from "./adapters/staticStageRepository";
export { localStorageRegistryRepository } from "./adapters/localStorageRegistryRepository";
