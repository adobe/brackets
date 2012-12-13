Curious to start contributing to Brackets?

### !!!THIS IS A DRAFT!!!

With this file we want to provide some general guidance how to contribute to Brackets - your feedback is welcome. 

1. Please sign the [Brackets Contributor License Agreement](http://dev.brackets.io/brackets-contributor-license-agreement.html). You must agree to and submit this before you can contribute to Brackets.

1. To get started, please see the following wiki page on GitHub: https://github.com/adobe/brackets/wiki/How-to-Hack-on-Brackets.

### The following is under construction...
Some more thoughts to be discussed... ( what should be our intention with this document? )      

1. Provide the the community good insight into our sprint-centered process

1. Raise awareness that we all have to manage our time, each person needs to prioritize, so we shouldn't feel bad if we have to tell someone that we don't have time (immediately) to work on their issue.

1. We'll need to educate, and classify pull requests for 'leads' of functional areas within the community. Those leads should own and author docs and forum posts and be reaching out the community for help and letting them know what it is we are working on so they don’t' send pull requests for stuff we're already doing or messing around in.

1. We need clear documentation about expectations for a good pull request, and we need to be ok with closing a pull request, and linking to said docs pointing the things which need to complete in order for us to accept.

1. For any significant feature, we prefer to have a design discussion first. For example write a spec on the wiki & discuss in the newsgroup. Maybe even meet individually to clarify scope and availability to receive help from the core team.

1. We need to state what to do if ones pull request get rejected. Our rejections should have clear comments about what we need to in order to merge, followed by a heartfelt thanks for getting involved.

***Proposed Pull Request checklist***

* Does this change belong in core? 
* Some features would be better as an extension - could it be done as an extension by separating out a more limited set of core changes (e.g. more generic APIs)?
* Some pull requests require the core team to implement additional supporting code in order to work. These pull requests may be delayed until the core team has time to do that work.
* Any major architectural or UI changes have been discussed in the forum?
* Native: should compile
* Native: Mac AND Win implementations
* All new APIs are documented
* Code follows our JS coding style guidelines (we probably need to clean those up)
* Code passes JSLint
* Code is syntactically valid (Brackets launches & no exceptions in the console)
* Testing
* Code has been tested -- describe the cases that were tested
* All unit tests pass
* No known bugs
* Smoke tests have been run (ideally)
* Unit tests for all new functionality (Is that too extreme? We’ve almost never gotten that so far…)
* All UI strings externalized (we should have a how-to page for this).
* If there are string changes, it can't land at the very end of the sprint
* UI is reasonably polished ?


***Avoid Common pitfalls*** 
(make sure these have been thought about):
* 1. Text manipulation commands: should consider what happens when in an inline editor at boundaries
* 1. Inline editors: does this collide with any other providers?
* 1. Code hinting: does this collide with any other providers?
