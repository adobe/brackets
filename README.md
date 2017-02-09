# Bramble is based on Brackets

Brackets is a modern open-source code editor for HTML, CSS
and JavaScript that's *built* in HTML, CSS and JavaScript.

Brackets is at 1.0 and we're not stopping there. We have many feature ideas on our
[trello board](http://bit.ly/BracketsTrelloBoard) that we're anxious to add and other
innovative web development workflows that we're planning to build into Brackets.
So take Brackets out for a spin and let us know how we can make it your favorite editor.

You can see some
[screenshots of Brackets](https://github.com/adobe/brackets/wiki/Brackets-Screenshots)
on the wiki, [intro videos](http://www.youtube.com/user/CodeBrackets) on YouTube, and news on the [Brackets blog](http://blog.brackets.io/).

The text editor inside Brackets is based on
[CodeMirror](http://github.com/codemirror/CodeMirror)&mdash;thanks to Marijn for
taking our pull requests, implementing feature requests and fixing bugs! See
[Notes on CodeMirror](https://github.com/adobe/brackets/wiki/Notes-on-CodeMirror)
for info on how we're using CodeMirror.

# How to setup Bramble (Brackets) in your local machine

Step 1: Make sure you fork and clone [Bramble](https://github.com/mozilla/brackets).

```
$ git clone https://github.com/[yourusername]/brackets --recursive
```

Step 2: Install its dependencies

Navigate to the root of the directory you cloned and run:

```
$ npm install
```

Step 3: run the build

You can build Bramble by running the npm build task:

```
$ npm run build
```

Step 4: Run Bramble:

The easiest way to run Bramble is to simply use:

```
$ npm start
```

This starts an `http-server` session on port 8000 for you to work with.

However, if you wish to run your own static server, there are several options available:
* [Apache Webserver](http://www.apache.org/)
* Host on [github pages](https://help.github.com/articles/what-are-github-pages)
* [Python WebServer](https://docs.python.org/2/library/simplehttpserver.html)

Assuming you have Bramble running on port `8000`. Now you can visit [http://localhost:8000/src](http://localhost:8000/src).

**NOTE 1:** Bramble expects to be run in an iframe, which hosts its filesystem. For local
development, use `src/hosted.html` instead of `src/index.html`.  To see how the remote end
should host Bramble's iframe, see `src/hosted.js`.

**NOTE 2:** Using `npm run build` will overwrite contents in the `src/nls` folder. These changes are necessary if you access Bramble using [http://localhost:8000/src](http://localhost:8000/src). After using Bramble, you can undo the changes by running `npm run unlocalize`.

**NOTE 3:** To use Bramble in a production setting locally, you can run `npm run production` and access Bramble at [http://localhost:8000/dist](http://localhost:8000/dist)

# Optional Extension Loading

Bramble supports enabling and disabling various extensions via the URL and query params.
A standard set of default extensions are always turned on:

* CSSCodeHints
* HTMLCodeHints
* JavaScriptCodeHints
* InlineColorEditor
* JavaScriptQuickEdit
* QuickOpenCSS
* QuickOpenHTML
* QuickOpenJavaScript
* QuickView
* UrlCodeHints
* brackets-paste-and-indent
* BrambleUrlCodeHints
* Autosave
* UploadFiles
* WebPlatformDocs
* CodeFolding
* bramble-move-file

You could disable QuickView and CSSCodeHints by loading Bramble with `?disableExtensions=QuickView,CSSCodeHints`
on the URL.

In addition, you can enable other extra extensions:

* SVGCodeHints
* HtmlEntityCodeHints
* LESSSupport
* CloseOthers
* InlineTimingFunctionEditor
* JSLint
* QuickOpenCSS
* RecentProjects
* brackets-cdn-suggestions
* HTMLHinter
* MdnDocs
* SVGasXML

You could enable JSLint and LESSSupport by loading Bramble with `?enableExtensions=JSLint,LESSSupport`
on the URL

NOTE: you can combine `disableExtensions` and `enableExtensions` to mix loading/disabling extensions.
You should check src/utils/BrambleExtensionLoader.js for the most up-to-date version of these
extension lists.

--------------

## After installation

After you have everything setup, you can now run the server you chose in the root of your local Bramble directory and see it in action by visiting [http://localhost:8000/src](http://localhost:8000/src).

# Bramble IFrame API

Bramble is desinged to be run in an iframe, and the hosting web app to communicate with it
via `postMessage` and `MessageChannel`.  In order to simplify this, a convenience API exists
for creating and managing the iframe, as well as providing JavaScript functions for interacting
with the editor, preview, etc.

## Loading the API

The hosting app must include the Bramble IFrame API (i.e., `dist/bramble.js`).  Note: in
development you can use `src/hosted.html`, which does this).  This script can either be used as
an AMD module, or as a browser global:

```html
<script src="bramble.js"></script>
<script>
  // Option 1: AMD loading, assumes requirejs is loaded already
  require(["bramble"], function(Bramble) {
    ...
  });

  // Option 2: Browser global
  var Bramble = window.Bramble;
</script>
```

## Bramble

The Bramble module has a number of methods, properties, and events. During its lifetime,
Bramble goes through a number of states, including:

* `Bramble.ERROR` - Bramble is in an error state
* `Bramble.NOT_LOADED` - Initial state, `Bramble.load()` has not been called
* `Bramble.LOADING` - `Bramble.load()` has been called, loading resources has begun
* `Bramble.MOUNTABLE` - Loading is done and `Bramble.mount()` can be begin, or is safe to start
* `Bramble.MOUNTING` - `Bramble.mount()` is being called, mounting is in process
* `Bramble.READY` - `Bramble.mount()` has finished, Bramble is fully ready

The current state of Bramble can be obtained by calling `Bramble.getReadyState()`.  There are
also a number of events you can listen for (i.e., `Bramble` is an [`EventEmitter`](https://github.com/Wolfy87/EventEmitter/)):

```js
Bramble.once("ready", function(bramble) {
  // bramble is the Bramble proxy instance, see below.
});

Bramble.on("error", function(err) {
  // Bramble is in an error state, and `err` is the error.
})

Bramble.on("readyStateChange", function(previous, current) {
  // Bramble's readyState changed from `previous` to `current`
});
```

NOTE: in some browsers (e.g., Firefox) when the user is in "Private Browsing"
mode, the filesystem (i.e., IndexedDB) will be inaccessible, and an error
will be sent via the `error` event (i.e., `err.code === "EFILESYSTEMERROR"`).  This
is the same error that occurs when the filesystem is corrupt (see `autoRecoverFileSystem` below).

## Bramble.getFileSystem()

The FileSystem is owned by the hosting application, and can be obtained at any time by calling:

```js
var fs = Bramble.getFileSystem();
```

This `fs` instance can be used to setup the filesystem for the Bramble editor prior to
loading.  You can access things like `Path` and `Buffer` via `Bramble.Filer.*`.

## Bramble.formatFileSystem(callback)

WARNING: this **will** destroy data, and is meant to be used in the case that
the filesystem is corrupted (`err.code === "EFILESYSTEMERROR"`), or for when an
app wants to allow a user to wipe their disk.

```js
Bramble.on("error", function(err) {
  if(err.code === "EFILESYSTEMERROR") {
    Bramble.formatFileSystem(function(err) {
      if(err) {
        // Unable to create filesystem, fatal (and highly unlikely) error
      } else {
        // filesystem is now clean and empty, use Bramble.getFileSystem() to obtain instance
      }
    });
  }
});
```

NOTE: you can turn this recovery behaviour on automatically by passing `autoRecoverFileSystem: true`
in the options to `Bramble.load()`.

## Bramble.load(elem[, options])

Once you have a reference to the `Bramble` object, you use it to starting loading the editor:

```js
// Start loading Bramble
Bramble.load("#webmaker-bramble");

Bramble.once("error", function(err) {
  console.error("Bramble error", err);
});
```

The `elem` argument specifies which element in the DOM should be used to hold the iframe.
This element's contents will be replaced by the iframe.  You can pass a selector, a reference
to an actual DOM element, or leave it blank, and `document.body` will be used.

The `options` object allows you to configure Bramble:

 * `url`: `<String>` a URL to use when loading the Bramble iframe (defaults to prod)
 * `locale`: `<String>` the locale Brackets should use
 * `useLocationSearch`: `<Boolean>` whether to copy the window's location.search string to the iframe's url
 * `extensions:` `<Object>` with the following optional properties
     * `enable`: `<Array(String)>` a list of extensions to enable
     * `disable`: `<Array(String)>` a list of extensions to disable
 * `hideUntilReady`: `<Boolean>` whether to hide Bramble until it's fully loaded.
 * `disableUIState`: `<Boolean>` by default, UI state is kept between sessions.  This disables it (and clears old values), and uses the defaults from Bramble.
 * `autoRecoverFileSystem`: `<Boolean>` whether to try and autorecover the filesystem on failure (see `Bramble.formatFileSystem` above).
 * `debug`: `<Boolean>` whether to log debug info.

## Bramble.mount(root[, filename])

After calling `Bramble.load()`, you can tell Bramble which project root directory
to open, and which file to load into the editor.  NOTE: the optional `filename` argument,
if provided, should be a relative path within the project root.  Bramble will use this information
when it is ready to mount the filesystem.  Use the `"ready"` event to get access to the
`bramble` instance:

```js
// Setup the filesystem while Bramble is loading
var fs = Bramble.getFileSystem();

Bramble.once("ready", function(bramble) {
  // The bramble instance is now usable, see below.
});

fs.mkdir("/project", function(err) {
  // If we run this multiple times, the dir will already exist
  if (err && err.code !== "EEXIST") {
    throw err;
  }

  var html = ""                    +
    "<html>\n"                     +
    "  <head>\n"                   +
    "    <title>Bramble</title>\n" +
    "  </head>\n"                  +
    "  <body>\n"                   +
    "    <p>Hello World</p>\n"     +
    "  </body>\n"                  +
    "</html>";

  fs.writeFile("/project/index.html", html, function(err) {
    if (err) {
      throw err;
    }

    // Now that fs is setup, tell Bramble which root dir to mount
    // and which file within that root to open on startup.
    Bramble.mount("/project", "index.html");
  });
});
```

## Bramble Instance Getters

Once the Bramble instance is created (e.g., via `ready` event or `Bramble.mount()` callback),
a number of read-only getters are available in order to access state information in the Bramble editor:

* `getID()` - returns the iframe element's `id` in the DOM
* `getIFrame()` - returns a reference to the iframe that hosts Bramble
* `getFullPath()` - returns the absolute path of the file currently being edited
* `getFilename()` - returns the filename portion (i.e., no dir info) of the file currently being edited
* `getPreviewMode()` - returns one of `"mobile"` or `"desktop"`, depending on current preview mode
* `getSidebarVisible()` - returns `true` or `false` depending on whether the sidebar (file tree) is visible
* `getLayout()` - returns an `Object` with three integer properties: `sidebarWidth`, `firstPaneWidth`, `secondPaneWidth`.  The `firstPaneWidth` refers to the editor, where `secondPaneWidth` is the preview.
* `getRootDir()` - returns the project root directory to which Bramble is mounted
* `getTheme()` - returns the name of the current theme.
* `getFontSize()` - returns the current font size as a string (e.g., `"12px"`).
* `getWordWrap()` - returns the current word wrap setting as a `Boolean` (i.e., enabled or disabled).
* `getTutorialExists()` - returns `true` or `false` depending on whether or not there is a tutorial in the project (i.e., if `tutorial.html` is present)
* `getTutorialVisible()` - returns `true` or `false` depending on whether or not the preview browser is showing a tutorial or not.

**NOTE**: calling these getters before the `ready()` callback on the bramble instance
won't do what you want.

## Bramble Instance Methods

The Bramble instance has a number of methods you can call in order to interact with the
Bramble editor and preview, all of which take an optional `callback` argument if you want
to be notified when the action completes:

* `undo([callback])` - undo the last operation in the editor (waits for focus)
* `redo([callback])` - redo the last operation that was undone in the editor (waits for focus)
* `increaseFontSize([callback])` - increases the editor's font size
* `decreaseFontSize([callback])` - decreases the edtior's font size
* `restoreFontSize([callback])` - restores the editor's font size to normal
* `save([callback])` - saves the current document
* `saveAll([callback])` - saves all "dirty" documents
* `useHorizontalSplitView([callback])` - splits the editor and preview horizontally
* `useVerticalSplitView([callback])` - splits the editor and preview vertically (default)
* `find([callback])` - opens the Find dialog to search within the current document
* `findInFiles([callback])` - opens the Find in Files dialog to search in all project files
* `replace([callback])` - opens the Replace dialog to replace text in the current document
* `replaceInFiles([callback])` - opens the Replace In Files dialog to replace text in all project files
* `useLightTheme([callback])` - sets the editor to use the light theme (default)
* `useDarkTheme([callback])` - sets the editor to use the dark theme
* `showSidebar([callback])` - opens the file tree sidebar
`* `hideSidebar([callback])` - hides the file tree sidebar
* `showStatusbar([callback])` - enables and shows the statusbar
* `hideStatusbar([callback])` - disables and hides the statusbar
* `refreshPreview([callback])` - reloads the preview with the latest content in the editor and filesystem
* `useMobilePreview([callback])` - uses a Mobile view in the preview, as it would look on a smartphone
* `useDesktopPreview([callback])` - uses a Desktop view in the preview, as it would look on a desktop computer (default)
* `enableFullscreenPreview([callback])` - shows a fullscreen preview of the current file
* `disableFullscreenPreview([callback])` - turns off the fullscreen preview of the curent file
* `enableAutoUpdate([callback])` - turns on auto-update for the preview (default)
`* `disableAutoUpdate([callback])` - turns off auto-update for the preview (manual reloads still work)
* `enableJavaScript([callback])` - turns on JavaScript execution for the preview (default)
* `disableJavaScript([callback])` - turns off JavaScript execution for the preview
* `enableInspector([callback])` - turns on the preview inspector (shows code for hovered/clicked element)
* `disableInspector([callback])` - turns off the preview inspector (default)
* `enableWordWrap([callback])` - turns on word wrap for the editor (default)
* `disableWordWrap([callback])` - turns off word wrap for the editor
* `showTutorial([callback])` - shows tutorial (i.e., tutorial.html) vs editor contents in preview
* `hideTutorial([callback])` - stops showing tutorial (i.e., tutorial.html) and uses editor contents in preview
* `showUploadFilesDialog([callback])` - shows the Upload Files dialog, allowing users to drag-and-drop, upload a file, or take a selfie.
* `addNewFile([options, callback])` - adds a new text file, using the provided options, which can include: `filename` a `String` with the complete filename to use; `contents` a `String` with the new text file's data; `ext` a `String` with the new file's extension; `basenamePrefix` a `String` with the basename to use when generating a new filename.  NOTE: if you provide `filename`, `basenamePrefix` and `ext` are ignored.
* `addNewFolder([callback])` - adds a new folder.
* `export([callback])` - creates an archive `.zip` file of the entire project's filesystem, and downloads it to the browser.
* `addCodeSnippet(snippet, [callback])` - adds a new code `snippet` to the editor (if it is in focus) at the current cursor position. One required parameter (`snippet`) needs to be passed in which needs to be a `String`.

## Bramble Instance Events

The Bramble instance is also an [`EventEmitter`](https://github.com/Wolfy87/EventEmitter/) and raises
the following events:

* `"layout"` - triggered whenever the sidebar, editor, or preview panes are changed. It includes an `Object` that returns the same infor as the `getLayout()` getter: : `sidebarWidth`, `firstPaneWidth`, `secondPathWidth`
* `"activeEditorChange"` - triggered whenever the editor changes from one file to another. It includes an `Object` with the current file's `fullPath` and `filename`.
* `"previewModeChange"` - triggered whenever the preview mode is changed. It includes an `Object` with the new `mode`
* `"sidebarChange"` - triggered whenever the sidebar is hidden or shown. It includes an `Object` with a `visible` property set to `true` or `false`
* `"themeChange"` - triggered whenever the theme changes. It inclues an `Object` with a `theme` property that indicates the new theme
* `"fontSizeChange"` - triggered whenever the font size changes. It includes an `Object` with a `fontSize` property that indicates the new size (e.g., `"12px"`).
* `"wordWrapChange"` - triggered whenever the word wrap value changes. It includes an `Object` with a `wordWrap` property that indicates the new value (e.g., `true` or `false`).
* `"tutorialAdded"` - triggered when a new tutorial is added to the project
* `"tutorialRemoved"` - triggered when an existing tutorial for the project is removed
* `"tutorialVisibilityChange"` - triggered when the tutorial preview is turned on or off. It includes an `Object` with a `visibility` property that indicates whether the tutorial is visible.
* `"inspectorChange"` - triggered whenever the inspector changes from enabled to disabled, or vice versa. It includes an `Object` with an `enabled` property set to `true` or `false`.

There are also high-level events for changes to files:

* `"fileChange"` - triggered whenever a file is created or updated within the project root.  It includes the `filename` of the file that changed.
* `"fileDelete"` - triggered whenever a file is deleted within the project root.  It includes the `filename` of the file that was deleted.
* `"fileRename"` - triggered whenever a file is renamed within the project root.  It includes the `oldFilename` and the `newFilename` of the file that was renamed.
* `"folderRename"` - triggered whenever a folder is renamed within the project root. It includes an object that looks something like this:
```js
{
  oldPath: "/path/before/rename",
  newPath: "/path/after/rename",
  // Paths to all files contained inside the folder being renamed
  children: [ "relativeFilePath1",  "relativeFilePath2", ... ]
}
```

NOTE: if you want to receive generic events for file system events, especially events across windows using the same file system, use [fs.watch()](https://github.com/filerjs/filer#watch) instead.
