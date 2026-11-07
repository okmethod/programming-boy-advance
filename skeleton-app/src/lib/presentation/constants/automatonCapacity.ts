/**
 * オートマトンの既定 CP 容量。
 *
 * ステージ非依存で構築するレジストリ管理ページ等で使う CP 上限。
 * （お手本プリセットはレジストリ usecase 側へ移設＝application/usecases/registry/presets.ts）
 */

// CP（作成予算）の上限はステージではなくオートマトンに属する概念。
// ステージ非依存で構築するレジストリ管理ページでは、この既定値を上限に使う。
// TODO: オートマトンイメージ単位の capacity フィールドに置き換える。
// CapacityAllocator の刻み(STEP=8)と噛み合う値にする。
// 32＝スライダ目盛り 0/8/16/24/32 の5段階（両端は選択不可／中央16/16）。
// ステージ側は total=16 にすれば一択＝自由度ゼロにできる。
export const DEFAULT_AUTOMATON_CAPACITY = 32;
