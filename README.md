Overview
========

This repository is for the core Brackets editor, written in HTML/CSS/JS. The 
desktop application shell, which adds native menu and local file access 
functionality, lives in a [separate repo](http://github.com/adobe/brackets-app).

Getting started
===============

In addition to pulling the source from github, you'll need to also grab
submodules referenced by Brackets. To do so, first make sure you have SSH
access to github (since the submodule is referenced via a git: URL rather than
https). Then run the following command in the root of your Brackets repo:

	git submodule update --init --recursive
	
See [Pro Git section 6.6](http://progit.org/book/ch6-6.html) for some caveats
when working with submodules.

To test if everything's working, load index.html into Safari (Chrome won't work,
see below). You should see a message with a blue background, and an editor area
below that with a line of code in it.

Known Issues
============

* Loading index.html directly into Chrome from the local filesystem will not work
  (the LESS processing will fail) due to Chrome security restrictions. You can run 
  it within the shell app, or load it into a different browser, like Safari.
