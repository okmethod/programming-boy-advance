/**
 * image 概念の公開面（バレル）。ベースイメージ（素質）とオートマトンイメージ（素質×プログラム）。
 * 他ディレクトリ・ドメイン公開 API はこのバレル経由で参照する（内部ファイル構成を隠す）。
 * 同階層のファイル同士は自バレルを介さず直接 `./xxx` を参照する（バレル自己循環の回避）。
 */

export type { AutomatonImage } from "./automatonImage";
export { imageHash } from "./automatonImage";
export type { BaseImage, BaseImageFamily } from "./baseImage";
export {
  baseImageSupports,
  baseImageFamilies,
  baseImageAllowed,
  filterBaseImageFamilies,
  highestAllowedImage,
  TURTLOGO_V1,
  TURTLOGO_V2,
  TURTLOGO_V3,
  BRITTLE_SENTRY,
  BASE_IMAGES,
  UNKNOWN_BASE_IMAGE,
} from "./baseImage";
