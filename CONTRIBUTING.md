###Curious to start contributing to Brackets?


With this file we want to provide some general guidance how to contribute to Brackets - your [feedback](https://groups.google.com/forum/?fromgroups=#!topic/brackets-dev/yEsaied7Fq8) is very welcome.

Issues starting Brackets the first time? Please review the [Troubleshooting Page](https://github.com/adobe/brackets/wiki/Troubleshooting).         

## Starter Bugs

If you need some inspiration for a **starter bug**, we have some for you either as [GitHub Issue](https://github.com/adobe/brackets/issues?labels=starter+bug&page=1&state=open) or on the [Trello Board](https://trello.com/board/brackets/4f90a6d98f77505d7940ce88) (there, choose on the right hand sidebar "Filter Cards" and then click on "Starter Feature").

## Getting Started

**Before you start coding**, post to the [brackets-dev Google group](http://groups.google.com/group/brackets-dev) or the [#brackets IRC channel on freenode](http://freenode.net) about what you're thinking of working on, so you can get early feedback. 
If you wouldn't chat about your idea that's cool too, but we may have to reject your pull request. This also provides you with an opportunity to find out what others including the core team are working on.      


Brackets is developed using Agile development methodologies, features are tracked as user stories on the [public Brackets backlog](http://bit.ly/BracketsBacklog). You may _vote_ on existing stories or find stories to work on with others.

1. Please sign the [Brackets Contributor License Agreement](http://dev.brackets.io/brackets-contributor-license-agreement.html). You must agree to and submit this before you can contribute to Brackets.

1. Please collaborate with others in providing and receiving guidance; the Brackets team made it a priority 
to look at pull requests daily, however depending on the feature priority, the complexity of a contribution, 
and available bandwidth we may not be able to work on it right away.


## Making Changes
If you use Brackets to edit Brackets, you can quickly reload the app itself by choosing Debug > Reload Brackets from the in-app menu.
When coding, make sure to follow our [coding conventions](https://github.com/adobe/brackets/wiki/Brackets%20Coding%20Conventions).


Before submitting any pull request, please make sure to:

1. read the following wiki page on GitHub: https://github.com/adobe/brackets/wiki/How-to-Hack-on-Brackets.
1. merge from adobe/brackets master
1. re-test your code after the merge
1. run the unit tests with Debug > Run Tests -- everything should pass
1. if your change is nontrivial or might have affected the UI, run through the [Brackets smoke tests](Brackets-Smoke-Tests) and possibly the [Brackets server smoke tests](Brackets-Server-Smoke-Tests).
1. review the [Pull Request Checklist](https://github.com/adobe/brackets/wiki/Pull-Request-Checklist) for additional guidance.
 
## Reviewing Code, Committing

In general code reviews can be performed by anyone who knows his/her limits, is familiar with the feature area and the architecture, 
where the code, being reviewed, is added or altered.
To submit changes one needs commit rights - those are limited to ensure sustainable high quality. Committers are tasked with taking 
a leading role in the project by making code contributions, assisting others with their contributions in the form 
of reviewing and merging pull requests, and providing feedback and suggestions on the direction of the project.

Please refer to the [Committer Policy](https://github.com/adobe/brackets/wiki/Brackets-Committer-Policy) for more information.
If you want to perform reviews, but don't have commit rights yet, we encourage you to do so. Please add a note that you start reviewing.
After you have finished your review ping us at IRC or leave a comment that your review has been completed. A committer will submit the pull request based on 
priority. If a pull request already shows an assignee, please check with him/her first.

##Additional Resources

* [the Brackets github issue tracker](https://github.com/adobe/brackets/issues)
* [Brackets wiki](https://github.com/adobe/brackets/wiki/Resources)
* [Contribute Page](http://brackets.io/contribute/)
