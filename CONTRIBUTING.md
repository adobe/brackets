# Bramble

### Deployment

Anything merged into the branch `bramble` will be automatically deployed to staging. To deploy to production, push changes to the `production` branch.

# The Basics

### Filing a bug

Check the [Troubleshooting Page](https://github.com/adobe/brackets/wiki/Troubleshooting) for common
issues with installing & launching Brackets, using Live Preview, etc.

**For bugs** be sure to search existing issues first. Include steps to consistently reproduce the
problem, actual vs. expected results, and your OS and Brackets version number.
Disable all extensions to verify the issue is a core Brackets bug.
[Read more guidelines for filing good bugs...](https://github.com/adobe/brackets/wiki/How-to-Report-an-Issue)

**For feature requests** please first check our [feature backlog](http://bit.ly/BracketsBacklog) to
see if it's already there. You can upvote features you'd like to see.

### Submitting a pull request

**Before you start coding**, post to the [brackets-dev Google group](http://groups.google.com/group/brackets-dev)
or the [#brackets IRC channel on freenode](http://webchat.freenode.net/?channels=brackets) about what
you're thinking of working on, so you can get early feedback. We don't want you to do tons of work
and then have to rewrite half of it!

For more on what's expected in a good pull request, see [Contributing Code](#contributing-code) below.


# Ways to Contribute

There are many ways you can contribute to the Brackets project:

* **Fix a bug** or **implement a new feature** - read on below.
* **[Write a Brackets extension](https://github.com/adobe/brackets/wiki/How-to-write-extensions)** and
  tell us about it!
* **Test Brackets** and [report bugs](https://github.com/adobe/brackets/wiki/How-to-Report-an-Issue)
  you find. For sample testing steps, see
  [Brackets smoke tests](https://github.com/adobe/brackets/wiki/Brackets-Smoke-Tests),
  [smoke tests with a local server](https://github.com/adobe/brackets/wiki/Brackets-Server-Smoke-Tests), and
  [UI walkthrough steps](https://github.com/adobe/brackets/wiki/Localization-Tests).
* **Write unit tests** for Brackets.
* **Translate** Brackets into other languages (and help keep those translations up to date) - see
  [localization README](https://github.com/adobe/brackets/blob/master/src/nls/README.md).
* **Write documentation** and help keep it up to date
  (the [How to Use Brackets](https://github.com/adobe/brackets/wiki/How-to-Use-Brackets) intro page
  is one example).
* **Try out some [Brackets extensions](https://github.com/adobe/brackets/wiki/Brackets-Extensions)**
  and give feedback to their authors.


## Where Do I Start?

To start editing the Brackets code, read **[How to Hack on Brackets](https://github.com/adobe/brackets/wiki/How-to-Hack-on-Brackets)**.
To create your first Brackets extension, check out **[How to Write Extensions](https://github.com/adobe/brackets/wiki/How-to-write-extensions)**.

Here are some ideas:

* [Starter bugs](https://github.com/adobe/brackets/issues?labels=starter+bug&state=open) can
  provide a good intro to the Brackets code.
* [Extension ideas](https://github.com/adobe/brackets/issues?q=label%3A%22Extension+Idea%22)
  are feature requests that we think would be best implemented as an add-on; it's up to the
  Brackets community to write them!
* [Starter features](http://bit.ly/BracketsBacklog) are a bit larger in scope. Be sure to discuss
  these in the newsgroup before starting. _(To see starter features, click Filter Cards on the
  right and then click the green "Starter Feature" label)._

Once you're ready to start coding, see the next section, [Contributing Code](#contributing-code).

**I'm new to JavaScript. How can I contribute to Brackets?** Brackets is a lot more complicated
than the average website that uses JS. Better to start on some JS tutorials (like [Codecademy's](http://www.codecademy.com/tracks/javascript)
or [MDN's](https://developer.mozilla.org/en-US/docs/JavaScript/Getting_Started)) and contribute
in some of the other ways listed above. Testing is a great way to start thinking like a programmer
before you've learned to code!


## Contributing Code

To get started editing the Brackets code, read [How to Hack on Brackets](https://github.com/adobe/brackets/wiki/How-to-Hack-on-Brackets).

Before submitting any pull request, please make sure to:

1. Discuss any major changes or questions beforehand in the [brackets-dev newsgroup](http://groups.google.com/group/brackets-dev).
2. Consider whether your change would be better as an optional extension. Brackets is lightweight
   and tightly focused - but highly extensible.
3. Follow the [Pull Request Checklist](https://github.com/adobe/brackets/wiki/Pull-Request-Checklist)
   to ensure a good-quality pull request.
4. Sign the [Brackets Contributor License Agreement](http://dev.brackets.io/brackets-contributor-license-agreement.html)
   (we cannot merge before this).

High quality code and a top-notch user experience are very important in Brackets, and we carefully
review pull requests to keep it that way. The better you follow the guidelines above, the more likely
we are to accept your pull request - and the faster the code review will go.

 
## The Code Review Process

Brackets committers are responsible for reviewing all pull requests, providing feedback, and
ultimately merging good code into `master`. The review process ensures all code is high quality,
maintainable, and well documented.

Once you've opened a pull request, a committer will generally respond to it within a week with an
initial set of comments (you don't need to ping anyone to find a reviewer). Some pull requests
raise larger questions about UI design, product scope or architecture. Those are tagged to indicate
that review will take longer:

* \[PM\] - needs high-level input from product management
* \[XD\] - needs UI design / visual design discussion
* \[ARCH\] - needs architectural discussion

The best way to avoid this sort of holdup is to discuss your changes on the newsgroup first!

Once your pull request is merged, it will appear in the next release of Brackets - generally within
two weeks.

**Interested in becoming a committer?** See the [Committer Policy](https://github.com/adobe/brackets/wiki/Brackets-Committer-Policy)
for details. Committers are expected to take a leading role in the project by making significant
code contributions, reviewing pull requests, and providing feedback and suggestions on the
direction of the project.

Even if you're not a committer, you're still welcome to give feedback on any pull request!
