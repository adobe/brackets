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

Strings not specified in a given locale will fall back to the language for that locale, if any,
and strings not specified in either the locale or its language will fall back to the `root`
string entry.

Localization is provided via the require.js i18n plugin. See the [require i18n docs][1]
for more info.

## How to translate the Getting Started project

When first installed, Brackets will open a Getting Started project that serves
as an introduction to Brackets features. This project can be translated by 
providing a ``urls.js`` file that points to a localized directory under the
``samples`` folder at the root of the Brackets repository. See the French (fr)
localization (src/nls/fr/urls.js) for an example.

[1]: http://requirejs.org/docs/api.html#i18n

# How to make changes to existing translations

## Adobe contributed translations

As of sprint 17, Adobe provides translations for the following languages:

* French (fr)

For all Adobe translations, Adobe asks that you do not submit pull requests
that directly modify these files. Instead, there are 2 ways to contribute
changes:

1. File an issue in our GitHub repository
   https://github.com/adobe/brackets/issues
2. Submit a proposal at the Adobe® Translation Center (ATC),
   http://translate.adobe.com (http://bit.ly/TranslateBrackets direct link to
   Brackets)

At ATC, proposals can be voted on by peers and are eventually accepted by
moderators.

## Community contributed translations

As of sprint 17, the following languages have been contributed by the Brackets
community:

* German (de)
* Spanish (es)
* Italian (it)
* Japanese (ja)
* Norwegian Bokmål (nb)
* Brazilian Portuguese (pt-br)
* Turkish (tr)

These translations _can be directly modified_ through our normal pull request
process.

In the future, Adobe may support these languages officially and import these
original translations into the Adobe Localization Framework. Once in ALF,
changes to translations must follow the Adobe contributed translation
guidelines above.