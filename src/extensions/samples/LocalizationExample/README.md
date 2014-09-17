## Localization in Brackets
Brackets supports localizing user visible strings, so the displayed text varies according to the user's locale. This extension is a simple example of using this capability.

To see it in action, move this extension to `src/extensions/dev/` or to your user extensions folder, then restart Brackets. It will add a "My Localized Command" menu item to the end of the Edit menu, which shows tw modal dialog boxes with localized text.

### Brackets core
Localization is very similar when working in Brackets core code. See the [Localization wiki page](https://github.com/adobe/brackets/wiki/Localization) for details.

## Localizing your extension

### Defining strings

 To store your strings, set up a structure like this inside your extension:

* `nls/`
    * `root/strings.js` - Original English strings
    * `fr/strings.js` - Translated French strings ("fr" locale)
    * `<...>/strings.js` - Etc. for other locales
    * `strings.js` - Acts like an index, listing which locale subfolders are available
* `strings.js` - Wrapper file that other modules in your extension reference, dynamically populated with the appropriate localized strings. This file is just boilerplate -- you shouldn't need to chnage it at all.

The "root" language is special, since it acts as a fallback: if other translations are incomplete, your code will get the "root" string for anything that's missing from the translation.

The individual `<locale>/strings.js` files use a simple JavaScript object literal to store strings as **key-value pairs**. (See this extension's root/strings.js & fr/strings.js for examples). You'll use the keys to reference your strings from JS & HTML code.

### Using strings in JS
_See `main.js` for several examples of this._

1. Load the Strings module: `var Strings = require("strings");`
2. Reference a string by its key, for example: `Strings.DIALOG_TITLE` yields the string `"Localized Dialog Example"` in this extension (in English locale).

### Using strings in HTML
For large chunks of HTML, you can use Mustache templates to inject localized strings.

_See `main.js` for an example of this._

1. Create an HTML file inside your extension (for example, `htmlContent/sampleHTMLFragment.html`)
2. In the HTML code, reference strings like this: `<h1 class='dialog-title'>{{DIALOG_TITLE}}</h1>`
3. In your JS code, load the raw HTML template: `var htmlTemplate = require("text!htmlContent/sampleHTMLFragment.html");`
4. Convert to localized HTML: `Mustache.render(htmlTemplate, Strings);` will yield the string `"<h1 class='dialog-title'>Localized Dialog Example</h1>"`

Note: Mustache automatically HTML-escapes your strings. Use triples braces if you need to opt out of this (carefully).

### String concatenation
Because word order varies between languages, don't assume you can append separate strings together in a fixed order (e.g. using `+` in JavaScript). [Instead, make a single _parameterized_ string](https://github.com/adobe/brackets/wiki/Localization#string-concatenation).

### Reusing Brackets core strings
Brackets core has its own strings.js file, separate from the one in your extension. To reference Brackets core strings, use `var BracketsStrings = brackets.getModule("strings")`. _However_, Brackets strings are not treated treated as a stable API, so they may change at any time without warning.


## Testing localization
Use _Debug > Switch Language_ to force Brackets to use a different locale (without needing to switch your overall OS locale).

## Advertising that you're localized
Once your extension is localized, don't forget to advertise this in the extension listing! Just add an `i18n` array to your [`package.json` file](https://github.com/adobe/brackets/wiki/Extension-package-format#packagejson-format), as illustrated in this extension. Extension Manager will automatically highlight whether your extension supports the user's current locale.
