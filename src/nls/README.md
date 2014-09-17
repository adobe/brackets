# Translation process

### Adobe-maintained translations

Adobe provides translations for the following languages:

* French (fr)
* Japanese (ja)

These translations _cannot_ be modified through our normal pull request
process. Please contribute changes one of these ways:

1. File an issue in our GitHub repository
   https://github.com/adobe/brackets/issues
2. Submit a proposal at the Adobe® Translation Center (ATC), [under the Brackets
   product](http://bit.ly/TranslateBrackets). At ATC, proposals can be voted on
   by peers and are eventually accepted by moderators.

### Community-maintained translations

The following translations have been contributed by the Brackets community:

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
* Indonesian (id)
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
process. Read the next section for instructions.

Please _do not_ use http://translate.adobe.com for these languages.


# How to contribute translations

Localized strings are stored in language-specific `strings.js` files, which are loaded by
[Require.js](http://requirejs.org/docs/api.html#i18n). You can edit these files online at
GitHub.com, or locally on your computer using Git and a text editor.

## Using GitHub.com online

### Adding a New Locale
Adding translations for a new locale requires modifying several files at once, so
it's best to use Git with local source files (see "Using a local Git clone of Brackets"
below). For help with this, [contact the Brackets team](https://github.com/adobe/brackets#contact-info).

### Editing an Existing Translation
If you're just correcting mistakes/typos, the process is simple:

1. Navigate to the appropriate file in the [nls folder on GitHub](https://github.com/adobe/brackets/tree/master/src/nls)
and click "Edit" button above file.
2. Edit the strings in the file
3. Add a short description at bottom
4. Click "Propose File Change"

When updating a translation to reflect changes in the Brackets UI, it's important to
make sure you're covering _all_ changes since the last translation udate:

1. Locate the "SHA" commit code for the last version of the translation: look for "Last
translated for" at the bottom of the file.
2. Go to this URL: `https://github.com/adobe/brackets/compare/<SHA>...master` (replacing
`<SHA>` with the value from step 1).
3. Click "Files changed," then search for "nls/root/strings.js" on the page. You'll see a
comparison view showing every string that was added, removed, or modified since the
translation was last updated. (If there is no "nls/root/strings.js", then the translation
is already fully up to date!).
4. Update the translation accordingly
5. Update the "Last translated for" comment with the _current_ SHA code: visit the 
[history page](https://github.com/adobe/brackets/commits/master/src/nls/root/strings.js),
and click the clipboard icon ("Copy the full SHA") on the right.
6. Add a short description and click "Propose File Change" to finish

#### Creating the Pull Request
The New Pull Request screen will appear, reviewing your changes. If everything looks ok,
click "Send Pull Request" to submit your changes to the Brackets team.

> Behind the scenes, GitHub has automatically created your own personal fork of the
Brackets repository (e.g. `https://github.com/user1/brackets`) if you don't have one
already, and a new branch within it (named something like `patch-1`) that contains your
changes.

#### Code Review: Updating Your Pull Request
Someone on the Brackets team will review the pull request. If any changes need to be made
the reviewer will post comments in the pull request, which will send you an e-mail
notification.

You should make updates in the _same_ branch your pull request was created from (e.g.
`patch-1`):

1. Find the branch name listed at the top of your pull request's web page (e.g. "`user1`
   wants to merge 1 commit into `adobe:master` from `user1:patch-1`" tells you the branch
   name is `patch-1`)
2. Go to your fork of Brackets on GitHub (e.g. `https://github.com/user1/brackets`)
3. Change the branch dropdown at upper left to your pull request's branch name
4. Navigate to "strings.js" and click "Edit" button.
5. Make any changes requested, and save by clicking "Commit changes." This will
automatically update your pull request.

After you finish addressing code review feedback, add a comment to the pull request to
notify the reviewer that it's ready to look at again.


## Using a local Git clone of Brackets

### Adding a New Locale

1. Create a `src/nls/*language-id*` subfolder
    * If you're creating a general language translation, use its two-letter code (e.g. `en`, `de`).
    * If you're creating a locale-specific translation for a particular country, add a hyphen
      and the country code in lowercase (e.g. `en-ca`, `en-gb`).
2. Add an entry for your translation in `nls/strings.js`.
3. Edit the root `strings-app.js` file and add a new `LOCALE_`* entry for your language, as seen in
   the Debug > Switch Language UI.
4. Copy the `nls/root/strings.js` file into your subfolder and start translating!
    * Tip: Use the [UI walkthrough steps](https://github.com/adobe/brackets/wiki/Localization-Tests)
      to see strings in context.
    * If you omit any strings, Brackets will fall back to the general language (without hyphen) if
      any, and then to the English string in `nls/root/strings.js`.
5. Use `git log -- src/nls/root/strings.js` to find the commit SHA code of the `root/strings.js`
   copy you used (latest version is listed first).
6. Add a comment `/* Last translated for <SHA> */` to the bottom of your new file,
   using the value you got on the previous step in place of `<SHA>`. This records which
   version of the original English strings you used as a reference point, which aids in
   updating the translation later.
7. Edit this README and update the list of languages at the top!

Also consider **translating the Getting Started project**:

1. Create a new `samples/*language-id*` folder and copy the `samples/root/Getting Started`
content into it to use as a starting point. (You can translate the "Getting Started" folder
name as well, but it _cannot_ contain Unicode characters -
[see bug #2425](https://github.com/adobe/brackets/issues/2425)).
2. Create or edit the `src/nls/*language-id*/urls.js` file to point to your new folder.
3. If `urls.js` didn't exist before, update `src/nls/urls.js` to add a `true` entry for this
locale.
4. Add a comment `<!-- Last translated for <SHA> -->` to the bottom of index.html, similar
to above.


### Editing an Existing Translation
If you're just correcting mistakes/typos, simply edit the appropriate `strings.js` file and
submit a pull request with your changes.

But to update a translation to reflect changes in the Brackets UI, it's important to
make sure you're covering _all_ changes since the last translation udate:

1. Ensure your local Git copy is
[up to date from upstream/master](https://github.com/adobe/brackets/wiki/How-to-Hack-on-Brackets#getting-updates-from-the-main-repository).
2. Locate the SHA code for the last translation update: look for "Last translated for" at
the bottom of the file.
3. Run `git difftool <SHA>...master -- src/nls/root/strings.js` to see a diff showing every
string that was added, removed, or modified since the translation was last updated.
4. Update the translation accordingly
5. Update the "Last translated for" comment with the _current_ SHA code: use
`git log master -- src/nls/root/strings.js` to find the version that was used in the diff
above.



# Translation timing

During a Brackets release cycle, English strings are modified and added. Near the end of the cycle,
there's a _string freeze_ - the changes stop. This is the window of opportunity to update translations
before the build is released. Watch the [brackets-dev forum](http://groups.google.com/group/brackets-dev)
for announcements of each string freeze and its translation deadline.


# Translation limitations

Some strings cannot be localized yet:

* [Keyboard shortcuts](https://trello.com/c/4k2yalBd)
* [Some native menus on Mac](https://trello.com/c/0IsE7q02) (hardcoded support only for English, French, Japanese)
* Windows installer UI (hardcoded support only for English, Japanese - with some limitations)
