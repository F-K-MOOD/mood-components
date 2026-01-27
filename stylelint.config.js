import stylelintConfigRecommended from 'stylelint-config-recommended'
import stylelintConfigRecommendedVue from 'stylelint-config-recommended-vue'

export default {
  extends: [stylelintConfigRecommended, stylelintConfigRecommendedVue],
  ignoreFiles: ['**/playground/**'],
  overrides: [
    {
      files: ['*.vue', '**/*.vue'],
    },
  ],
  rules: {
    'no-duplicate-selectors': null,
  },
}
