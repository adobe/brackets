Welcome to Brackets!
-------------------

This is a very early version of Brackets, a code editor for HTML, CSS 
and JavaScript that's *built* in HTML, CSS and JavaScript. 

What makes Brackets different from other web code editors?
* **Tools shouldn't get in your way.** Instead of cluttering up your coding
environment with lots of panels and icons, the Quick Edit UI in Brackets puts 
context-specific code and tools inline.
* **Brackets is in sync with your browser.** With Live Development, Brackets
works directly with your browser to push code edits instantly, set breakpoints, 
and jump back and forth between your real source code and the browser view.
* **Do it yourself.** Because Brackets is open source, and built with HTML, CSS
and JavaScript, you can help build the best code editor for the web.

You can see some 
[screenshots of Brackets](https://github.com/adobe/brackets/wiki/Brackets-Screenshots)
on the wiki.

Brackets is *very* early in development, so many of the features you would
expect in a code editor are missing, and some existing features might be
incomplete or not as useful as you'd want. But if you like the direction
it's going, please contribute!

The text editor inside Brackets is based on 
[CodeMirror](http://github.com/marijnh/CodeMirror2)--thanks to Marijn for
taking our pull requests :) See 
[Notes on CodeMirror](https://github.com/adobe/brackets/wiki/Notes-on-CodeMirror)
for info on upcoming things we're planning to contribute to CodeMirror.

How to run Brackets
-------------------

**Brackets isn't ready for general use yet.** It's still *very* early in
development, is missing a lot of basic editor features, and *probably*
has bugs. That said, we've actually been using Brackets to develop Brackets
for awhile now, so what's there is reasonably stable.

Although Brackets is built in HTML/CSS/JS, it currently runs as a desktop 
application in a thin native shell, so that it can access your local files.
(If you just try to open the index.html file in a browser, it won't work yet.)
The native shell for Brackets lives in a separate repo, 
[adobe/brackets-app](https://github.com/adobe/brackets-app/), which includes 
this repo as a submodule.

You can download "stable" builds of Brackets from the
[downloads page](http://github.com/adobe/brackets/downloads).
If you want to pull the repos directly via git, see 
[How to Use Brackets](http://github.com/adobe/brackets/wiki/How-to-Use-Brackets)
for instructions on how to get everything. Either way, you can launch Brackets
from the `bin/win` or `bin/mac` folder.

By default, Brackets shows its own source code (MIND BLOWN). You can choose
a different folder to edit from *File > Open Folder*.

Most of Brackets should be pretty self-explanatory, but for information on how
to use its unique features, like Quick Edit and Live Development, please read
[How to Use Brackets](http://github.com/adobe/brackets/wiki/How-to-Use-Brackets).
Also, see the [release notes](http://github.com/adobe/brackets/wiki/Release-Notes)
for a list of new features and known issues in each build.

I found a bug/missing feature!
------------------------------

Brackets bugs are tracked in [the Brackets github issue tracker](https://github.com/adobe/brackets/issues). 
When filing a new bug, please remember to include:

* Brackets version/sprint number (or commit SHA if you're pulling directly from the repo)
* platform/OS version
* repro steps, actual and expected results
* link to test files (you can create a gist on [gist.github.com](https://gist.github.com/) 
if that's convenient)

For feature requests, go ahead and file them in the issue tracker; they'll be converted
to user stories on the [public Brackets backlog*](http://bit.ly/BracketsBacklog).

\* Please excuse the mess in the public backlog ("Backlog Archive To Be Sorted"). We're still importing data from our internal system.

I want to help!
---------------

Awesome! Please read [How to Hack on Brackets](https://github.com/adobe/brackets/wiki/How-to-Hack-on-Brackets).

I want to keep track of how Brackets is doing!
----------------------------------------------

Not sure you needed the exclamation point there, but I like your enthusiasm.

* **Twitter:** [@brackets](http://twitter.com/#!/brackets)
* **IRC:** [#brackets on freenode](http://webchat.freenode.net/?channels=brackets)
* **Developers mailing list:** http://groups.google.com/group/brackets-dev
