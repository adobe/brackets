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

Step 01: Make sure you fork and clone [Bramble](https://github.com/humphd/brackets).
We do our work on the `bramble` branch, so make sure you aren't on `master`.

```
$ git clone https://github.com/[yourusername]/brackets --recursive
```

Step 02: Install its dependencies

Navigate to the root of the directory you cloned and run

```
$ npm install
```

```
$ git submodule update --init
```

```
Grunt commands to be added
```

Step 03: Run Bramble:

Run one of the suggested local servers (or your own) from the root directory of Bramble:  
* [Apache Webserver](http://www.apache.org/)
* Host on [github pages](https://help.github.com/articles/what-are-github-pages)
* [Python WebServer](https://docs.python.org/2/library/simplehttpserver.html)

Assuming you have Bramble running on port `8080`. Now you can visit [http://localhost:8080/src](http://localhost:8080/src).

NOTE: Bramble expects to be run in an iframe, which hosts its filesystem. For local
development, use `src/hosted.html` instead of `src/index.html`.  To see how the remote end
should host Bramble's iframe, see `src/hosted.js`.

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

You could disable QuickView and CSSCodeHints by loading Bramble with `?disableExtensions=QuickView,CSSCodeHints`
on the URL.

In addition, you can enable other extra extensions:

* SVGCodeHints
* HtmlEntityCodeHints
* LESSSupport
* CloseOthers
* InlineTimingFunctionEditor
* WebPlatformDocs
* CodeFolding
* JSLint
* QuickOpenCSS
* RecentProjects
* brackets-cdn-suggestions
* ImageUrlCodeHints
* HTMLHinter
* MdnDocs

You could enable JSLint and LESSSupport by loading Bramble with `?enableExtensions=JSLint,LESSSupport`
on the URL

NOTE: you can combine `disableExtensions` and `enableExtensions` to mix loading/disabling extensions.
You should check src/utils/BrambleExtensionLoader.js for the most up-to-date version of these
extension lists.

--------------

## After installation

After you have everything setup, you can now run the server you chose in the root of your local Bramble directory and see it in action by visiting [http://localhost:8080/src](http://localhost:8080/src). 

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

## Bramble.getFileSystem()

The FileSystem is owned by the hosting application, and can be obtained at any time by calling:

```js
var fs = Bramble.getFileSystem();
```

This `fs` instance can be used to setup the filesystem for the Bramble editor prior to
loading.  You can access things like `Path` and `Buffer` via `Bramble.Filer.*`.

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

**NOTE**: calling these getters before the `ready()` callback on the bramble instance
won't do what you want.

## Bramble Instance Methods

The Bramble instance has a number of methods you can call in order to interact with the
Bramble editor and preview:

* `undo()` - undo the last operation in the editor (waits for focus)
* `redo()` - redo the last operation that was undone in the editor (waits for focus)
* `increaseFontSize()` - increases the editor's font size
* `decreaseFontSize()` - decreases the edtior's font size
* `restoreFontSize()` - restores the editor's font size to normal
* `save()` - saves the current document
* `saveAll()` - saves all "dirty" documents
* `useHorizontalSplitView()` - splits the editor and preview horizontally
* `useVerticalSplitView()` - splits the editor and preview vertically (default)
* `find()` - opens the Find dialog to search within the current document
* `findInFiles()` - opens the Find in Files dialog to search in all project files
* `replace()` - opens the Replace dialog to replace text in the current document
* `replaceInFiles()` - opens the Replace In Files dialog to replace text in all project files
* `useLightTheme()` - sets the editor to use the light theme (default)
* `useDarkTheme()` - sets the editor to use the dark theme
* `showSidebar()` - opens the file tree sidebar
* `hideSidebar()` - hides the file tree sidebar
* `showStatusbar()` - enables and shows the statusbar
* `hideStatusbar()` - disables and hides the statusbar
* `refreshPreview()` - reloads the preview with the latest content in the editor and filesystem
* `useMobilePreview()` - uses a Mobile view in the preview, as it would look on a smartphone
* `useDesktopPreview()` - uses a Desktop view in the preview, as it would look on a desktop computer (default)
* `enableJavaScript()` - turns on JavaScript execution for the preview (default)
* `disableJavaScript()` - turns off JavaScript execution for the preview

## Bramble Instance Events

The Bramble instance is also an [`EventEmitter`](https://github.com/Wolfy87/EventEmitter/) and raises
the following events:

* `"layout"` - triggered whenever the sidebar, editor, or preview panes are changed. It includes an `Object` that returns the same infor as the `getLayout()` getter: : `sidebarWidth`, `firstPaneWidth`, `secondPathWidth`
* `"activeEditorChange"` - triggered whenever the editor changes from one file to another. It includs an `Object` with the current file's `fullPath` and `filename`.
* `"previewModeChange"` - triggered whenever the preview mode is changed. It includes an `Object` with the new `mode`
* `"sidebarChange"` - triggered whenever the sidebar is hidden or shown. It includes an `Object` with a `visible` property set to `true` or `false`

There are also high-level events for changes to files:

* `"fileChange"` - triggered whenever a file is created or updated within the project root.  It includes the `filename` of the file that changed.
* `"fileDelete"` - triggered whenever a file is deleted within the project root.  It includes the `filename` of the file that was deleted.
* `"fileRename"` - triggered whenever a file is renamed within the project root.  It includes the `oldFilename` and the `newFilename` of the file that was renamed.

NOTE: if you want to receive generic events for file system events, especially events across windows using the same file system, use [fs.watch()](https://github.com/filerjs/filer#watch) instead.