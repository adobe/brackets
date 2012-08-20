# How to add a new translation

1. Create a subfolder of the `nls` folder whose name is the language or locale you want to
   create a translation for.
   
   * If you're creating a general translation for a language, just use its two-letter code 
     (e.g. `en`, `de`).
      
   * If you're creating a locale-specific translation for a particular country, add a hyphen 
     and the country code in lowercase (e.g. `en-ca`, `en-gb`).
      
2. Add an entry for your translation to the `module.exports` object in `nls/strings.js`.
   (Eventually, we should remove this requirement and just scan the folder for available languages.)

Strings not specified in a given locale will fall back to the language for that locale, if any,
and strings not specified in either the locale or its language will fall back to the `root`
string entry.

Localization is provided via the require.js i18n plugin. See the [require i18n docs][1]
for more info.

[1]: http://requirejs.org/docs/api.html#i18n