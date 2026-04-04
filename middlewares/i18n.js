const { I18n } = require('i18n')
const path = require('path')

console.log("pathhhhh",path.join(__dirname, 'config/locales'))

const i18n = new I18n({
    locales: ['en','ar'],
    defaultLocale: 'en',
    directory: './../config/locales',
    objectNotation: true,
    updateFiles: false
  })
i18n.init();
const i18nMidleware = (req, res, next) => {
    i18n.setLocale(res, req.query.lang ||"en");
    next()
  }

module.exports = {
    i18nMidleware,
    i18n
}