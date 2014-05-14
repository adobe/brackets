# How to add translations for a *new* locale

1. Create a subfolder of the `nls` folder whose name is the language or locale you want to
   create a translation for.
    * If you're creating a general translation for a language, just use its two-letter code
      (e.g. `en`, `de`).
    * If you're creating a locale-specific translation for a particular country, add a hyphen
      and the country code in lowercase (e.g. `en-ca`, `en-gb`).
2. Add an entry for your translation to the `module.exports` object in `nls/strings.js`.
3. Edit the root `strings-app.js` file and add a new `LOCALE_`* entry for your language, as seen in
   the Debug > Switch Language UI.
4. Copy the root `strings.js` file into your subfolder and start translating!
5. Use the [UI walkthrough steps](https://github.com/adobe/brackets/wiki/Localization-Tests) to
   see strings in context.
6. Add this comment ``/* Last translated for SHA_of_root_strings.js */`` at the end 
   of your `strings.js` and replace `SHA_of_root_strings.js` with the actual SHA. You can 
   copy the actual SHA in this [history page](https://github.com/adobe/brackets/commits/master/src/nls/root/strings.js)
   by hovering on the one you used for this translation and click on Copy SHA button.
7. Edit this file and update the list of languages below!

Strings not specified in a given locale will fall back to the general language (without hyphen)
first, and then will fall back to the English string from `nls/root/strings.js`.

Localization is provided via the [require.js i18n plugin](http://requirejs.org/docs/api.html#i18n).

### Translating the Getting Started project

When first installed, Brackets will open a Getting Started project that serves
as an introduction to Brackets features. This project can be translated by
providing a ``urls.js`` file that points to a localized directory under the
``samples`` folder at the root of the Brackets repository. See the French
localization (`src/nls/fr/urls.js`) for an example.


# How to modify *existing* translations

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
* Greek (el)
* Spanish (es)
* Persian-Farsi (fa-ir)
* Finnish (fi)
* Croatian (hr)
* Hungarian (hu)
* Italian (it)
* Korean (ko)
* Norwegian (nb)
* Dutch (nl)
* Polish (pl)
* Brazilian Portuguese (pt-br)
* Portuguese (pt-pt)
* Romanian (ro)
* Russian (ru)
* Slovak (sk)
* Serbian (sr)
* Swedish (sv)
* Turkish (tr)
* Simplified Chinese (zh-cn)
* Indonesia (id)

These translations _can be directly modified_ through our normal pull request
process. Make sure that you also update the comment on the last line with the 
correct SHA of `strings.js` from root directory, which you used for your translation.
If the SHA comment is missing, then add one with the correct SHA. See step 6 in 
__How to add translations for a *new* locale__ section for adding a new one.

In the future, Adobe may begin maintaining some of these languages too, at which
point the process will switch to the one above. But until then, please _do not
use_ http://translate.adobe.com for these languages.


# Contributing Translations directly from github.com

You must be logged in to your github.com id (e.g. `user1`).

### Adding a New Translation
New translations can be added by navigating to the
[nls folder on github](https://github.com/adobe/brackets/tree/master/src/nls)
and then clicking on the [+] button to add a new file.
Subfolders can be added in the path field.

### Editing an Existing Translation
Existing files can be edited directly in
[brackets repo on github](https://github.com/adobe/brackets).

Either case will create a pull request with a branch named something like
`patch-1` on your github fork of brackets of the brackets repository
(`https://github.com/user1/brackets`).
If you have not yet forked brackets "repo", it's done automatically.

Someone on the Brackets team will review the pull request. If it's ok, it will
be merged. If changes need to be made, the reviewer will post comments in the
pull request which will send you an e-mail notification.

You can make updates in the `patch-1` branch in your github fork of brackets.
Edits show up as a new commit, so they automatically show up in the original
pull request. After making an update, follow the link in the notification
e-mail to the pull request and add a comment such as "Changes made -- ready
for another review" to notify reviewer that it's time to review the changes again.


# Translation limitations

Some strings cannot be localized yet:

* [Keyboard shortcuts](https://trello.com/c/4k2yalBd)
* [Some native menus on Mac](https://trello.com/c/0IsE7q02) (hardcoded support only for English, French, Japanese)
* Windows installer UI (hardcoded support only for English, Japanese - with some limitations)
