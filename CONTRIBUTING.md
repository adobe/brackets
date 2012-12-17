Curious to start contributing to Brackets?


With this file we want to provide some general guidance how to contribute to Brackets - your feedback is very welcome. Please provide it [here](https://groups.google.com/forum/?fromgroups=#!topic/brackets-dev/yEsaied7Fq8).

Issues starting Brackets the first time? Please review the [Troubleshooting Page](https://github.com/adobe/brackets/wiki/Troubleshooting).         

## Getting Started

Before you start coding, post to the [brackets-dev Google group](http://groups.google.com/group/brackets-dev) or the [#brackets IRC channel on freenode](http://freenode.net) about what you're thinking of working on, so you can get early feedback. 
This also provides you with an opportunity to find out what others including the core team are working on.      


Brackets is developed using Agile development methodologies, features are tracked as user stories on the [public Brackets backlog](http://bit.ly/BracketsBacklog). You may vote on existing stories or find stories to work on with others.

1. Please sign the [Brackets Contributor License Agreement](http://dev.brackets.io/brackets-contributor-license-agreement.html). You must agree to and submit this before you can contribute to Brackets.

1. To get started, please see the following wiki page on GitHub: https://github.com/adobe/brackets/wiki/How-to-Hack-on-Brackets.

1. When coding, make sure to follow our [coding conventions](https://github.com/adobe/brackets/wiki/Brackets%20Coding%20Conventions).

1. Please collaborate with others in providing and receiving guidance, the Brackets team made it a priority to look at pull requests daily, however depending on the feature priority, the complexity of a contribution and bandwidth we may not be able to work on it right away.


## Making Changes

Before submitting any pull request, make sure to:

1. merge from adobe/brackets master
1. re-test your code after the merge
1. run the unit tests with Debug > Run Tests -- everything should pass
1. if your change is nontrivial or might have affected the UI, run through the [Brackets smoke tests](Brackets-Smoke-Tests) and possibly the [Brackets server smoke tests](Brackets-Server-Smoke-Tests).

###Proposed Pull Request checklist

* Does this change belong in core? Some features would be better as an extension - could it be done as an extension by separating out a more limited set of core changes (e.g. more generic APIs)?
* Some pull requests require the core team to implement additional supporting code in order to work. These pull requests may be delayed until the core team has time to do that work.
* Any major architectural or UI changes have been discussed in the forum?
* All new APIs are documented in the [Release Notes] (https://github.com/adobe/brackets/wiki/Release-Notes)?
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
* Native: should compile
* Native: Mac AND Win implementations
* UI is reasonably polished ?

###Avoid Common pitfalls
(make sure these have been thought about):
* Text manipulation commands: should consider what happens when in an inline editor at boundaries
* Inline editors: does this collide with any other providers?
* Code hinting: does this collide with any other providers?
 
##Additional Resources

* [the Brackets github issue tracker](https://github.com/adobe/brackets/issues)
