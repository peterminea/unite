let i18n = require('i18n');

i18n.configure({
  locales:['de', 'en', 'it', 'ro'], 
  directory: '' + 'public/locales/dev', 
  defaultLocale: 'en',
  cookie: 'lang'
});

module.exports = i18n;