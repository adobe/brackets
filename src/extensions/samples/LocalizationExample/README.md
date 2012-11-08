

## Localization in Brackets
Brackets has basic support for displaying user visible text in other languages. The document describes how localized text can be added to core Brackets code and Brackets Plugins 

Javascript and HTML that displays user visible strings in Brackets should not use static English strings directly in code. Instead,  strings should be stored in a the file brackets \src\nls\root\strings.js. Code that wishes to display strings should import the String module from src\string.js. This module dynamically loads a strings.js file in the nls folder for the current local. JavaScript can then directly reference properties of the String module to access strings, and HTML can use the String module in combination with Mustache.js templating to display localized strings. Brackets uses the i18n RequireJS plugin for to load localized strings. The plugin loads the strings.js file according to the user’s locale and also provides a fallback to English for missing translations. 

## Adding new localized strings to Brackets
Add new English strings to the file brackets\src\nls\root\strings.js. Translations in other languages should be added to the strings.js file in each of the locale folders inside the “nls” folder. For example, modify brackets\src\nls\fr\strings.js for French

## Using Localized strings in Brackets modules

## Strings JavaScript
1. Load the Strings module in the file where the string is to be used
`Strings = require("strings");`

2. Reference a string by selecting a property from the String module. For example, `Strings.NOT_FOUND_ERR` yields the string “The file could not be found." for an English locale.

## Strings HTML
Localizing HTML in Brackets requires use of the templating framework mustache.js since HTML cannot directly reference properties in strings.js. Strings for both JavaScript and HTML are stored \src\nls\root\strings.js, but in HTML they are referenced using the template syntax `{{stringKeyName}}`. 

For example,

`<h1 class="dialog-title">{{SAVE_CHANGES}}</h1>`

yields 

`<h1 class="dialog-title">Save Changes</h1>`

Mustache recognizes this syntax and can substite the appropriate string. Mustache is run when Brackets launches during module load. Code in brackets.js loads the appropriate strings.js file using i18n, loads html content from a file as a text, runs Mustache on the text using strings.js for the data lookup, and then inserts the result into the DOM. Core brackets code that depends on the DOM should listen for the “htmlContentLoadComplete” before inspecting or manipulating the dome

## Localization Guidelines
Multiple strings keys in strings.js should not be concatenated together since word order often varies between languages

## Limitations
Brackets does not support localizing keyboard shortcuts yet


## Localization Support for Brackets Plugins

Localization in plugins works very similarly to how localization works for core Brackets module. The i18n RequireJS plugin is used to dynamically load a string.js file for the appropriate locale. JavaString can then reference strings via property name from the loaded string module and mustache can be used on on html fragments to insert localized text.

For an example of a simple localized plugin see: brackets\src\extensions\disabled\LocalizationExample

Move this plugin to the extensions\user\ folder to run the plugin. It will add a "My New Command" menu item to the end of the Edit menu. This command shows an alert with localized text and then a modal dialog with localized HTML content.

#### Below is the folder struture and comments on the role of each file

* main.js – loads the Strings module for the plugin and uses mustache to localize html content

* strings.js – uses i18n to load a strings.js file in the nls folder

* htmlContent
    * htmlfragment.html – html template to be localized by mustache
    * nls
        * strings.js – configures i18n by specifying the root folder  and listing the locales supported by the plugin
        * root
		    * strings.js – contains the English strings
	    * fr
		    * strings.js – contains the French strings
	    * etc. for each locale

#### Strings for plugins vs Brackets
Note that there is a distinction between loading strings for a plugin vs. strings in the Brackets core. To access strings local to your plugin use `var strings = require("strings")`. To load the core Brackets strings use `var bracketsStrings = brackets.getModule("strings")`

