export default {
  '*.js': ['prettier -c', 'eslint'],
  '*.{ts,tsx}': ['prettier -c', () => 'tsc', 'eslint'],
  '*.css': ['prettier -c', 'stylelint'],
  '*.json': ['prettier -c']
}
