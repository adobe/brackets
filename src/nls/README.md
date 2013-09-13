# How to add a new translation

1. Create a subfolder of the `nls` folder whose name is the language or locale you want to
   create a translation for.
    * If you're creating a general translation for a language, just use its two-letter code 
      (e.g. `en`, `de`).
    * If you're creating a locale-specific translation for a particular country, add a hyphen 
      and the country code in lowercase (e.g. `en-ca`, `en-gb`).
2. Add an entry for your translation to the `module.exports` object in `nls/strings.js`.
   (Eventually, we should remove this requirement and just scan the folder for available languages.)
3. Copy the root `strings.js` file into your subfolder and start translating!
4. Use the [UI walkthrough steps](https://github.com/adobe/brackets/wiki/Localization-Tests) to
   see strings in context.

Strings not specified in a given locale will fall back to the general language (without hyphen)
first, and then will fall back to the English string from `nls/root/strings.js`.

Localization is provided via the [require.js i18n plugin](http://requirejs.org/docs/api.html#i18n).

### Translating the Getting Started project

When first installed, Brackets will open a Getting Started project that serves
as an introduction to Brackets features. This project can be translated by 
providing a ``urls.js`` file that points to a localized directory under the
``samples`` folder at the root of the Brackets repository. See the French
localization (`src/nls/fr/urls.js`) for an example.


# How to modify existing translations

### Adobe-maintained translations

Adobe provides translations for the following languages:

* French (fr)
* Japanese (ja)

These translations cannot be modified through our normal pull request
process. Please contribute changes one of these ways:

1. File an issue in our GitHub repository
   https://github.com/adobe/brackets/issues
2. Submit a proposal at the Adobe® Translation Center (ATC), [under the Brackets
   product](http://bit.ly/TranslateBrackets). At ATC, proposals can be voted on
   by peers and are eventually accepted by moderators.

### Community-maintained translations

The following languages have been contributed by the Brackets community:

* Czech (cs)
* German (de)
* Spanish (es)
* Italian (it)
* Norwegian Bokmål (nb)
* Polish (pl)
* Brazilian Portuguese (pt-br)
* Portuguese (pt-pt)
* Russian (ru)
* Swedish (sv)
* Turkish (tr)
* Simplified Chinese (zh-cn)

These translations _can be directly modified_ through our normal pull request
process.

In the future, Adobe may begin maintaining some of these languages too, at which
point the process will switch to the one above. But until then, please _do not
use_ http://translate.adobe.com for these languages.


# Translation limitations

Some strings cannot be localized yet:

* [Keyboard shortcuts](https://trello.com/c/4k2yalBd)
* [Some native menus on Mac](https://trello.com/c/0IsE7q02) (hardcoded support only for English, French, Japanese)
* Windows installer UI (hardcoded support only for English, Japanese - with some limitations)
