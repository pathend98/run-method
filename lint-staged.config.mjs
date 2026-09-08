export default {
  '*.{js,jsx,ts,tsx}': [
    'eslint --fix',
    'prettier --write',
  ],
  '*.{json,jsonc,css,scss,md,mdx,yml,yaml}': [
    'prettier --write',
  ]
}
