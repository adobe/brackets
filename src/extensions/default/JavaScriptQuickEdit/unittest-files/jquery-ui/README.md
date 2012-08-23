[jQuery UI](http://jqueryui.com/) - Interactions and Widgets for the web
================================

jQuery UI provides interactions like Drag and Drop and widgets like Autocomplete, Tabs and Slider and makes these as easy to use as jQuery itself.

If you want to use jQuery UI, go to [jqueryui.com](http://jqueryui.com) to get started. Or visit the [Using jQuery UI Forum](http://forum.jquery.com/using-jquery-ui) for discussions and questions.

If you are interested in helping develop jQuery UI, you are in the right place.
To discuss development with team members and the community, visit the [Developing jQuery UI Forum](http://forum.jquery.com/developing-jquery-ui) or in #jquery on irc.freednode.net.


For contributors
---

If you want to help and provide a patch for a bugfix or new feature, please take
a few minutes and look at [our Getting Involved guide](http://wiki.jqueryui.com/w/page/35263114/Getting-Involved).
In particular check out the [Coding standards](http://wiki.jqueryui.com/w/page/12137737/Coding-standards)
and [Commit Message Style Guide](http://wiki.jqueryui.com/w/page/25941597/Commit-Message-Style-Guide).

In general, fork the project, create a branch for a specific change and send a
pull request for that branch. Don't mix unrelated changes. You can use the commit
message as the description for the pull request.


Running the Unit Tests
---

Run the unit tests with a local server that supports PHP. No database is required. Pre-configured php local servers are available for Windows and Mac. Here are some options:

- Windows: [WAMP download](http://www.wampserver.com/en/)
- Mac: [MAMP download](http://www.mamp.info/en/index.html)
- Linux: [Setting up LAMP](https://www.linux.com/learn/tutorials/288158-easy-lamp-server-installation)
- [Mongoose (most platforms)](http://code.google.com/p/mongoose/)


Building jQuery UI
---

jQuery UI uses the [grunt](http://github.com/cowboy/grunt) build system. Building jQuery UI requires node.js and a command line zip program.

Install grunt.

`npm install grunt -g`

Clone the jQuery UI git repo.

`git clone git://github.com/jquery/jquery-ui.git`

`cd jquery-ui`

Install node modules.

`npm install`

Run grunt.

`grunt build`

There are many other tasks that can be run through grunt. For a list of all tasks:

`grunt --help`


For committers
---

When looking at pull requests, first check for [proper commit messages](http://wiki.jqueryui.com/w/page/12137724/Bug-Fixing-Guide).

Do not merge pull requests directly through GitHub's interface.
Most pull requests are a single commit; cherry-picking will avoid creating a merge commit.
It's also common for contributors to make minor fixes in an additional one or two commits.
These should be squashed before landing in master.

**Make sure the author has a valid name and email address associated with the commit.**

Fetch the remote first:

    git fetch [their-fork.git] [their-branch]

Then cherry-pick the commit(s):

	git cherry-pick [sha-of-commit]

If you need to edit the commit message:

    git cherry-pick -e [sha-of-commit]

If you need to edit the changes:

	git cherry-pick -n [sha-of-commit]
	# make changes
	git commit --author="[author-name-and-email]"

If it should go to the stable brach, cherry-pick it to stable:

    git checkout 1-8-stable
    git cherry-pick -x [sha-of-commit-from-master]

*NOTE: Do not cherry-pick into 1-8-stable until you have pushed the commit from master upstream.*
