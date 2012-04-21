**Note:** This README file is specific to the HTML/CSS/JS source code for Brackets.
For more general notes on how to use the current build of Brackets, see the
README.md file in the parent folder (or, if you're on github, the
[brackets-app repo](http://github.com/adobe/brackets-app)).

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

How to file bugs
================

***Please search for similar existing issues before reporting a problem as a new issue.***

Use Github to file bugs for brackets - go to [https://github.com/adobe/brackets/issues]
(https://github.com/adobe/brackets/issues).    
**Remember:** Your bug report will be publicly visible. So, don't include passwords or other confidential
information.

When filing an issue lease please add:


* **Title:** The bug title should be concise but descriptive enough to identify the issue (what went wrong)
            and include keywords that are commonly used. Avoid being too vague. Good subjects enables better bug searching and avoids too many duplicates.
* **Description/Steps:** The bug description should have clear, easy to follow reproducible steps.
  1.  Narrow down the bug and write specific/minimum required steps as needed to reproduce without going
into unnecessary detail.   
  2.  The description should also provide *Actual Results* and *Expected Results*.      
  3.  If the results include an error, make sure to include it in the bug. (For many JavaScript errors, you can 
use Ctrl+C / CMD+C to copy the error message and paste it in the bug description. Having specific error 
message in the bug helps reproducing bugs. Bug files should be uploaded to [**gist**](gist.github.com) and linked  from the bug report.
* **Product Area:** Describe product area for where the bug is found.
* **Frequency:** Does the bug reproduce 100%, occasionally, not reproducible.
* **Platform:** Specify plattform and OS version used.
Supporting information: If the bug requires bug files or snippets to reproduce, log the bug and then upload the bug files on gist.github.com. Please put a link in the bug report. 

