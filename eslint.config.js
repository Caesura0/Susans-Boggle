const js = require('@eslint/js');

module.exports = [
  js.configs.recommended,
  {
    files: ['js/**/*.js'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        localStorage: 'readonly',
        fetch: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        setInterval: 'readonly',
        alert: 'readonly',
        navigator: 'readonly',
        XMLHttpRequest: 'readonly',
        HTMLElement: 'readonly',
        SVGElement: 'readonly',
        Node: 'readonly',
        Element: 'readonly',
        Event: 'readonly',
        Map: 'readonly',
        Set: 'readonly',
        getComputedStyle: 'readonly'
      }
    },
    rules: {
      'no-console': 'off',
      'no-unused-vars': ['warn', { args: 'none' }]
    }
  }
];
