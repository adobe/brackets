###Curious to start contributing to Brackets?


With this file we want to provide some general guidance how to contribute to Brackets - your [feedback](https://groups.google.com/forum/?fromgroups=#!topic/brackets-dev/yEsaied7Fq8) is very welcome.

Issues starting Brackets the first time? Please review the [Troubleshooting Page](https://github.com/adobe/brackets/wiki/Troubleshooting).         

## Getting Started

Before you start coding, post to the [brackets-dev Google group](http://groups.google.com/group/brackets-dev) or the [#brackets IRC channel on freenode](http://freenode.net) about what you're thinking of working on, so you can get early feedback. 
This also provides you with an opportunity to find out what others including the core team are working on.      


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
 
##Additional Resources

* [the Brackets github issue tracker](https://github.com/adobe/brackets/issues)
