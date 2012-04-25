Welcome to Brackets!
-------------------

This is a very early version of Brackets, a code editor for HTML, CSS 
and JavaScript that's *built* in HTML, CSS and JavaScript.

What makes Brackets different from other web code editors?
* **Tools shouldn't get in your way.** Instead of cluttering up your coding
environment with lots of panels and icons, our Quick Edit UI puts 
context-specific code and tools inline.
* **Brackets is in sync with your browser.** With Live Development, Brackets
works directly with your browser to push code edits instantly, set breakpoints, 
and jump back and forth between your real source code and the browser view.
* **Do it yourself.** Because Brackets is open source, and built with HTML, CSS
and JavaScript, you can help us build the best code editor for the web.

We're *very* early in development, so many of the features you would
expect in a code editor are missing, and some existing features might be
incomplete or not as useful as you'd want. But if you like the direction
we're going, please contribute!

How to run Brackets
-------------------

**Brackets isn't ready for general use yet.** It's still *very* early in
development, is missing a lot of basic editor features, and *probably*
has bugs. That said, we've actually been using Brackets to develop Brackets
for awhile now, so what's there is reasonably stable.

Although Brackets is built in HTML/CSS/JS, it currently runs as a desktop 
application in a thin native shell, so that it can access your local files.
(If you just try to open the index.html file in a browser, it won't work yet.)

You can download the latest builds from https://github.com/adobe/brackets-app/downloads
**TBD: Is that right?** and run Brackets from the bin/win or bin/mac folder.

(If you just pulled the http://github.com/adobe/brackets repo, you actually 
need to grab the http://github.com/adobe/brackets-app repo, which includes 
the brackets repo as a submodule, and run it from there.)

By default, Brackets shows its own source code (MIND BLOWN). You can choose
a different folder to edit from *File > Open Folder*.

Most of Brackets should be pretty self-explanatory, but for information on how
to use some of the new features we're adding like Quick Edit and Live
Development, please read
[How to Use Brackets](http://github.com/adobe/brackets/wiki/How-to-Use-Brackets).

I found a bug/missing feature!
------------------------------

We're tracking bugs in [the Brackets github issue tracker](https://github.com/adobe/brackets/issues). 
Whenfiling a new bug, please remember to include:

* Brackets version/sprint number (or commit SHA if you're pulling directly from the repo)
* platform/OS version
* repro steps, actual and expected results
* link to test files (you can create a gist on [gist.github.com](https://gist.github.com/) 
if that's convenient)

For feature requests, go ahead and file them in the issue tracker; we'll convert
them to user stories on our public backlog **link TBD**.

I want to help!
---------------

Awesome! Please read [How to Hack on Brackets](https://github.com/adobe/brackets/wiki/How-to-Hack-on-Brackets).

I want to keep track of what you're doing!
------------------------------------------

Not sure you needed the exclamation point there, but we like your enthusiasm.

* **Twitter:** [@CodeBrackets](http://twitter.com/#!/CodeBrackets)
* **IRC:** [#brackets on freenode](http://freenode.net)
* **Mailing list (users):** http://groups.google.com/group/codebrackets
* **Mailing list (developers):** http://groups.google.com/group/brackets-dev
* **Google+:** [Brackets](https://plus.google.com/b/115365194873502050036/)




