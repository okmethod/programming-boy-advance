/**
 * image ドメインの公開 API。
 * 他ディレクトリ・ドメイン公開 API はこのバレル経由で参照する。
 * 同階層のファイル同士は、バレルを介さず直接参照する（バレル自己循環の回避）。
 */

export type { AutomatonImage, BaseImage } from "./model";

export type { BaseImageFamily } from "./baseImage";
export {
  baseImageSupports,
  baseImageFamilies,
  baseImageAllowed,
  filterBaseImageFamilies,
  highestAllowedImage,
  UNKNOWN_BASE_IMAGE,
} from "./baseImage";

export {
  TURTLE_V1,
  TURTLE_V2,
  TURTLE_V3,
  TURTLE_V4,
  TURTLE_V5,
  TURTLE_IMAGES,
  BRITTLE_SENTRY,
  BASIC_SENTRY,
  BASE_IMAGES,
} from "./catalog";

export { imageHash, areImagesEqual } from "./hash";
