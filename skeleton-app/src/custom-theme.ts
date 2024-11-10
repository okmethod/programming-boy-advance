import type { CustomThemeConfig } from "@skeletonlabs/tw-plugin";

export const CustomTheme: CustomThemeConfig = {
  name: "custom",
  properties: {
    // =~= Theme Properties =~=
    "--theme-font-family-base": `"PixelMplus12", "sans-serif"`,
    "--theme-font-family-heading": `"PixelMplus12", "sans-serif"`,
    "--theme-font-color-base": "15 56 15", // #0f380f
    "--theme-font-color-dark": "224 236 197", // #e0ecc5
    "--theme-rounded-base": "9999px",
    "--theme-rounded-container": "8px",
    "--theme-border-base": "1px",
    // =~= Theme On-X Colors =~=
    "--on-primary": "0 0 0",
    "--on-secondary": "255 255 255",
    "--on-tertiary": "255 255 255",
    "--on-success": "0 0 0",
    "--on-warning": "0 0 0",
    "--on-error": "0 0 0",
    "--on-surface": "0 0 0",
    // =~= Theme Colors  =~=
    // primary | #938b0d
    "--color-primary-50": "239 238 219", // #efeedb
    "--color-primary-100": "233 232 207", // #e9e8cf
    "--color-primary-200": "228 226 195", // #e4e2c3
    "--color-primary-300": "212 209 158", // #d4d19e
    "--color-primary-400": "179 174 86", // #b3ae56
    "--color-primary-500": "147 139 13", // #938b0d
    "--color-primary-600": "132 125 12", // #847d0c
    "--color-primary-700": "110 104 10", // #6e680a
    "--color-primary-800": "88 83 8", // #585308
    "--color-primary-900": "72 68 6", // #484406
    // secondary | #cc2782
    "--color-secondary-50": "247 223 236", // #f7dfec
    "--color-secondary-100": "245 212 230", // #f5d4e6
    "--color-secondary-200": "242 201 224", // #f2c9e0
    "--color-secondary-300": "235 169 205", // #eba9cd
    "--color-secondary-400": "219 104 168", // #db68a8
    "--color-secondary-500": "204 39 130", // #cc2782
    "--color-secondary-600": "184 35 117", // #b82375
    "--color-secondary-700": "153 29 98", // #991d62
    "--color-secondary-800": "122 23 78", // #7a174e
    "--color-secondary-900": "100 19 64", // #641340
    // tertiary | #b42783
    "--color-tertiary-50": "244 223 236", // #f4dfec
    "--color-tertiary-100": "240 212 230", // #f0d4e6
    "--color-tertiary-200": "236 201 224", // #ecc9e0
    "--color-tertiary-300": "225 169 205", // #e1a9cd
    "--color-tertiary-400": "203 104 168", // #cb68a8
    "--color-tertiary-500": "180 39 131", // #b42783
    "--color-tertiary-600": "162 35 118", // #a22376
    "--color-tertiary-700": "135 29 98", // #871d62
    "--color-tertiary-800": "108 23 79", // #6c174f
    "--color-tertiary-900": "88 19 64", // #581340
    // success | #ee96da
    "--color-success-50": "252 239 249", // #fceff9
    "--color-success-100": "252 234 248", // #fceaf8
    "--color-success-200": "251 229 246", // #fbe5f6
    "--color-success-300": "248 213 240", // #f8d5f0
    "--color-success-400": "243 182 229", // #f3b6e5
    "--color-success-500": "238 150 218", // #ee96da
    "--color-success-600": "214 135 196", // #d687c4
    "--color-success-700": "179 113 164", // #b371a4
    "--color-success-800": "143 90 131", // #8f5a83
    "--color-success-900": "117 74 107", // #754a6b
    // warning | #9edd0c
    "--color-warning-50": "240 250 219", // #f0fadb
    "--color-warning-100": "236 248 206", // #ecf8ce
    "--color-warning-200": "231 247 194", // #e7f7c2
    "--color-warning-300": "216 241 158", // #d8f19e
    "--color-warning-400": "187 231 85", // #bbe755
    "--color-warning-500": "158 221 12", // #9edd0c
    "--color-warning-600": "142 199 11", // #8ec70b
    "--color-warning-700": "119 166 9", // #77a609
    "--color-warning-800": "95 133 7", // #5f8507
    "--color-warning-900": "77 108 6", // #4d6c06
    // error | #a167f9
    "--color-error-50": "241 232 254", // #f1e8fe
    "--color-error-100": "236 225 254", // #ece1fe
    "--color-error-200": "232 217 254", // #e8d9fe
    "--color-error-300": "217 194 253", // #d9c2fd
    "--color-error-400": "189 149 251", // #bd95fb
    "--color-error-500": "161 103 249", // #a167f9
    "--color-error-600": "145 93 224", // #915de0
    "--color-error-700": "121 77 187", // #794dbb
    "--color-error-800": "97 62 149", // #613e95
    "--color-error-900": "79 50 122", // #4f327a
    // surface | #35d84b
    "--color-surface-50": "225 249 228", // #e1f9e4
    "--color-surface-100": "215 247 219", // #d7f7db
    "--color-surface-200": "205 245 210", // #cdf5d2
    "--color-surface-300": "174 239 183", // #aeefb7
    "--color-surface-400": "114 228 129", // #72e481
    "--color-surface-500": "53 216 75", // #35d84b
    "--color-surface-600": "48 194 68", // #30c244
    "--color-surface-700": "40 162 56", // #28a238
    "--color-surface-800": "32 130 45", // #20822d
    "--color-surface-900": "26 106 37", // #1a6a25
  },
};
