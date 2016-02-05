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
6. Add this comment ``/* Last translated for commit_SHA_of_root_strings.js */`` at the end 
   of your `strings.js` and replace `commit_SHA_of_root_strings.js` with the actual SHA.
   You can copy the actual SHA in this [history page](https://github.com/adobe/brackets/commits/master/src/nls/root/strings.js)
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

It is also recommended to add this comment ``<!-- Last translated for commit_SHA_of_root_index.html -->``
at the end of your `index.html` and replace `commit_SHA_of_root_index.html` with the actual SHA.


# How to modify *existing* translations

### Adobe-maintained translations

Adobe provides translations for the following languages:

* French (fr)
* Japanese (ja)

These translations cannot be modified through our normal pull request
process. Please contribute changes by filing an issue in our GitHub repository https://github.com/adobe/brackets/issues

### Community-maintained translations

The following languages have been contributed by the Brackets community:

* Czech (cs)
* Danish (da)
* German (de)
* Greek (el)
* Spanish (es)
* Persian-Farsi (fa-ir)
* Finnish (fi)
* Galician (gl)
* Croatian (hr)
* Hungarian (hu)
* Indonesia (id)
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
* Ukrainian (uk)
* Simplified Chinese (zh-cn)
* Traditional Chinese (zh-tw)

These translations _can be directly modified_ through our normal pull request
process. Make sure that you also update the comment on the last line with the 
correct SHA of `strings.js` from root directory, which you used for your translation.
If the SHA comment is missing, then add one with the correct SHA. See step 6 in 
__How to add translations for a *new* locale__ section for adding a new one.

In the future, Adobe may begin maintaining some of these languages too, at which
point the process will switch to the one above. But until then, please _do not
use_ http://translate.adobe.com for these languages.


## Contributing Translations directly from github.com

You must be logged in to your github.com id (e.g. `user1`).

### Adding a New Translation
To add a new translation, you need to start with a copy of the
root `strings.js` file which is located at
[https://github.com/adobe/brackets/blob/master/src/nls/root/strings.js](https://github.com/adobe/brackets/blob/master/src/nls/root/strings.js).
New translations can be added by navigating to the
[nls folder on github](https://github.com/adobe/brackets/tree/master/src/nls)
and then clicking on the [+] button to add a new file.
You will be taken to a New File page where you:

1. Specify the file name as *language-id*/strings.js
2. Paste in the contents of root/strings.js and edit strings for new language
3. Add this comment `/* Last translated for commit_SHA_of_root_strings.js */`
at the end of your strings.js and replace `commit_SHA_of_root_strings.js` with the
actual SHA.
You can copy the actual SHA in this
[history page](https://github.com/adobe/brackets/commits/master/src/nls/root/strings.js)
by hovering on the one you used for this translation and click on Copy SHA button.
4. Add short and (optional) long description of new file
5. Click "Propose New File" button

### Editing an Existing Translation
Existing files can be edited directly in
[brackets repo on github](https://github.com/adobe/brackets).

Navigate to the file to edit and click "Edit" button above file.
You will be taken to an Edit File page where you:

1. Make desired edits to file
2. Make sure that you also update the comment on the last line with the correct SHA of
strings.js from root directory, which you used for your translation. If the SHA comment
is missing, then add one with the correct SHA. See step 6 in How to add translations
for a new locale section for adding a new one.
3. Add short and (optional) long description of Commit changes
4. Click "Commit changes" button

### Branch and Pull Request
For either case, if you have not yet forked the brackets repository in your
github account (`https://github.com/user1/brackets`), it's done automatically.
A new branch will be created in your Brackets fork with a unique name
which is something like `patch-1` that contains your changes.

You are then taken to the New Pull Request dialog which is filled in
with all of the information from previous dialog.
It also shows contents of new file or a "diff" of changes to existing file.
You can make any changes if desired, then click "Send Pull Request" when done
(or close page to Cancel).
A pull request for your branch is created and submitted to the Brackets "repo".

### Code Review
Someone on the Brackets team will review the pull request. If it's ok, it will
be merged. If changes need to be made, the reviewer will post comments in the
pull request which will send you an e-mail notification.

### Updating Existing Branch and Pull Request

If you need to make changes to an existing branch, 
you should make updates in the `patch-1` branch in your Github fork of Brackets
so all of your changes for this update are in a single branch.
Creating a new branch for every update makes it difficult for core team
to see all changes at once, and can even create conflicts that are
very difficult to resolve. For example:

1. After submitting your pull request, look at the top where it says something like:

    `user1` wants to merge 1 commit into `adobe:master` from `user1:patch-1`
    
2. Go to your github fork of brackets page: `github.com/user1/brackets`
3. Click on the Branches Tab: `github.com/user1/brackets/branches`
4. Click on the link to the branch: `github.com/user1/brackets/tree/patch-1`
5. This is where you make changes to your `patch-1` branch.

Saved edits show up as a new commit, so they automatically show up in the original
pull request. After making an update, add a comment to the pull request such as
"Changes made -- ready for another review" to notify reviewer
that it's time to review the changes again.


# Translation limitations

Some strings cannot be localized yet:

* [Keyboard shortcuts](https://trello.com/c/4k2yalBd)
* [Some native menus on Mac](https://trello.com/c/0IsE7q02) (hardcoded support only for English, French, Japanese)
* Windows installer UI (hardcoded support only for English, Japanese - with some limitations)
* Localized folder name of "Getting Started" has to be made of up basic English characters only, as described
[here](https://github.com/adobe/brackets/pull/8332#issuecomment-48767847).
