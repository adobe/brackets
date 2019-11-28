Welcome to Brackets! [![Build Status](https://travis-ci.org/adobe/brackets.svg?branch=master)](https://travis-ci.org/adobe/brackets)
-------------------

Brackets is a modern open-source code editor for HTML, CSS
and JavaScript that's *built* in HTML, CSS and JavaScript. 

What makes Brackets different from other web code editors?

* **Tools shouldn't get in your way.** Instead of cluttering up your coding
environment with lots of panels and icons, the Quick Edit UI in Brackets puts 
context-specific code and tools inline.
* **Brackets is in sync with your browser.** With Live Preview, Brackets
works directly with your browser to push code edits instantly. It also jumps
back and forth between your real source code and the browser view.
* **Do it yourself.** Because Brackets is open-source which is built on HTML, CSS
and JavaScript, you are welcomed to [build](https://github.com/adobe/brackets/blob/master/CONTRIBUTING.md) the best code editor for the web.

Brackets have completed first version, but we are not stopping there. We come up with many feature ideas on our
[trello board](http://bit.ly/BracketsTrelloBoard) that we are eager to add. We are planning to build  other innovative web development workflows into Brackets. 
Therefore, you are endorsed to take Brackets out for a spin and let us know how we can make it your favorite editor. 

You can see 
[screenshots of Brackets](https://github.com/adobe/brackets/wiki/Brackets-Screenshots)
on the wiki, [intro videos](http://www.youtube.com/user/CodeBrackets) on YouTube, and news on the [Brackets blog](http://blog.brackets.io/).

How to install and run Brackets
-------------------------------
#### Download

To install the latest stable version on Mac, Windows and Linux (Debian/Ubuntu) can be [found here](http://brackets.io/).

#### Usage

Brackets automatically opens a folder containing simple "Getting Started" content.
You are able to choose a different folder to edit using *File > Open Folder*.

Brackets is self-explanatory, but the information on how
to use its unique features, like Quick Edit and Live Preview, please read
[How to Use Brackets](http://github.com/adobe/brackets/wiki/How-to-Use-Brackets). 
See the [release notes](http://github.com/adobe/brackets/wiki/Release-Notes)
for a list of new features and known issues in each build.

In addition to the core features built into Brackets, there is a large and growing
community of developers building extensions that add all sorts of useful functionality.
See the [Brackets Extension Registry](https://registry.brackets.io/)
for a list of available extensions. For installation instructions,
see the [extensions wiki page](https://github.com/adobe/brackets/wiki/Brackets-Extensions).

#### Need help?

Having problems starting Brackets for the first time, or not sure how to use Brackets?  Please 
review [Troubleshooting](https://github.com/adobe/brackets/wiki/Troubleshooting), which helps 
you to fix common problems and find extra help if needed.

Helping Brackets
----------------

#### I found a bug!

If you find a repeatable bug, and [troubleshooting](https://github.com/adobe/brackets/wiki/Troubleshooting) 
tips do not help, then be sure to [search existing issues](https://github.com/adobe/brackets/issues) first.
Include steps to consistently reproduce the problem, actual vs. expected results, screenshots, your Oerating System and
Brackets version number. Disable all extensions to verify the issue is a core Brackets bug.
[Read more guidelines for filing good bugs.](https://github.com/adobe/brackets/wiki/How-to-Report-an-Issue)


#### I have a new suggestion, but don't know how to program!

For feature requests please first check our [Trello board](http://bit.ly/BracketsBacklog) to
see if it is already there; you can upvote it if so. If not, feel free to file it as an issue as above; we'll
move it to the feature backlog for you.


#### I want to help with the code!

Awesome! _There are lots of ways you can help._ First read 
[CONTRIBUTING.md](https://github.com/adobe/brackets/blob/master/CONTRIBUTING.md), 
then learn how to [pull the repo and hack on Brackets](https://github.com/adobe/brackets/wiki/How-to-Hack-on-Brackets).

The text editor inside Brackets is based on 
[CodeMirror](http://github.com/codemirror/CodeMirror)&mdash;thanks to Marijn for
taking our pull requests, implementing feature requests and fixing bugs! See 
[Notes on CodeMirror](https://github.com/adobe/brackets/wiki/Notes-on-CodeMirror)
for info on how we're using CodeMirror.

Although Brackets is built in HTML/CSS/JS, it currently runs as a desktop 
application in a thin native shell, so that it accesses your local files.
(If you just try to open the index.html file in a browser, it w will not work.)
The native shell for Brackets lives in a separate repo, 
[adobe/brackets-shell](https://github.com/adobe/brackets-shell/).


I want to keep track of how Brackets is doing!
----------------------------------------------

Not sure you needed the exclamation point there, but we like your enthusiasm.

#### What's Brackets working on next?

* In our [feature backlog](http://bit.ly/BracketsBacklog), the columns to the right
  (starting from "Development") are list of the features that we are currently working on.
  "Ready" shows what we will be working on next.
* Watch our [GitHub activity stream](https://github.com/adobe/brackets/pulse).
* Watch our [Waffle Kanban board](https://waffle.io/adobe/brackets): Work items in [![Stories in Ready](https://badge.waffle.io/adobe/brackets.svg?label=ready&title=Ready)](http://waffle.io/adobe/brackets) are next. The entire development process is outlined in the [Developer Guide](https://github.com/adobe/brackets/wiki/Brackets-Developers-Guide).

#### Contact info

* **E-mail:** [admin@brackets.io](mailto:admin@brackets.io)
* **Slack:** [Brackets on Slack](https://brackets.slack.com) (You can join by sending a mail to [admin@brackets.io](mailto:admin@brackets.io) with the subject line `slack registration request` specifying the email addresses you would like to register).
* **Developers mailing list:** http://groups.google.com/group/brackets-dev
* **Twitter:** [@brackets](https://twitter.com/brackets)
* **Blog:** http://blog.brackets.io/
* **IRC:** [#brackets on freenode](http://webchat.freenode.net/?channels=brackets)

---

Please note that this project is released with a [Contributor Code of Conduct](https://github.com/adobe/brackets/blob/master/CODE_OF_CONDUCT.md). By participating in this project you agree to abide by its terms.
