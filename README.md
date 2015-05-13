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
* HTMLHinter
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

You could enable JSLint and LESSSupport by loading Bramble with `?enableExtensions=JSLint,LESSSupport`
on the URL

NOTE: you can combine `disableExtensions` and `enableExtensions` to mix loading/disabling extensions.
You should check src/utils/BrambleExtensionLoader.js for the most up-to-date version of these
extension lists.

--------------

## After installation

After you have everything setup, you can now run the server you chose in the root of your local Bramble directory and see it in action by visiting [http://localhost:8080/src](http://localhost:8080/src). 
