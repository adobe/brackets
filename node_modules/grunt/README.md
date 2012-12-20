# grunt [![Build Status](https://secure.travis-ci.org/gruntjs/grunt.png?branch=master)](http://travis-ci.org/gruntjs/grunt)
Grunt is a task-based command line build tool for JavaScript projects.

## Introduction
Check out our [getting started guide] for a primer on how to use grunt.

## Documentation
Take a look at our [wiki] for all the things.

## Support / Contributing
Before you make an issue, please read our [contribution guide].

You can find the grunt team in [#grunt on irc.freenode.net](irc://irc.freenode.net/#grunt).


## Release History
_(Until v1.0.0, this will only be updated when major or breaking changes are made)_

* 2012/06/25 - v0.3.10 - Updating a few dependencies to work with node 0.8.x (0.6.x should still work).
* 2012/04/18 - v0.3.9 - The min task (via the uglify helper) now appends a semicolon to the end of the generated source.
* 2012/04/06 - v0.3.8 - Init template tweaks. Anchor links added to docs, along with grunt-internal docs task to generate them. The watch task now supports multiple targets with separate wildcards and tasks. Locally-installed grunt will override global grunt even when run from global "grunt" script.
* 2012/04/01 - v0.3.7 - Tweaked the behavior of the init template `exports.warnOn` property and added more init template documentation. Fixed duplicate PhantomJS debug output in qunit task. Added useful nodeunit and qunit comments into init template generated test .js files.
* 2012/03/28 - v0.3.6 - Fixed a `--help` screen issue, a few grunt plugin related issues, and attempted to improve the overall grunt plugin docs and API.
* 2012/03/27 - v0.3.5 - Fixed a handful of weird Windows issues. Changed default m/d/yyyy dates to yyyy-mm-dd ISO 8601. Fixed some init task bugs, docs errata, and added a lot more content to the init task docs.
* 2012/03/26 - v0.3.3 - Added a "gruntfile" init template. Create a basic Gruntfile in seconds with `grunt init:gruntfile`. A few other minor fixes.
* 2012/03/25 - v0.3.2 - Init tasks can now specify a file matching wildcard for the initial "files exist" warning. The jQuery init template now has jQuery 1.7.2. Fixed a bug in the `task.expand*` methods.
* 2012/03/25 - v0.3.1 - Added a few methods. Substantially reworked the init task and templates.
* 2012/03/23 - v0.3.0 - Too many changes to list. But in brief: completely reorganized the API, removed all globals, added docs and examples for nearly everything, built a preliminary plugin system (that still needs to be tested). PLEASE RTFM OK? THX U.
* 2012/02/03 - v0.2.14 - Added a server task (which starts a static webserver for your tasks). The qunit task now uses PhantomJS instead of Zombie.js (4768 of 4971 jQuery unit test pass, neat), and supports both file wildcards as well as http:// or https:// urls. (static webserver, anyone?). Grunt should no longer "hang" when done.
* 2012/01/29 - v0.2.5 - Added a "qunit" task as well as an init "jquery" template (as of now, there are also "node" and "commonjs" init templates).
* 2012/01/22 - v0.2.1 - Removed handlebars, templates are universally handled by underscore now. Changed init task template tags from <% %> to {% %}. Banners beginning with /*! will no longer be stripped.
* 2012/01/22 - v0.2.0 - Added "init" task with a sample template, reworked a lot of code. Hopefully it's backwards-compatible.
* 2012/01/11 - v0.1.0 - Initial release.

## License
Copyright (c) 2012 "Cowboy" Ben Alman, contributors
Licensed under the MIT license.  
<https://github.com/gruntjs/grunt/blob/master/LICENSE-MIT>

[node]: http://nodejs.org/
[npm]: http://npmjs.org/
[jshint]: http://www.jshint.com/
[uglify]: https://github.com/mishoo/UglifyJS/
[nodeunit]: https://github.com/caolan/nodeunit
[qunit]: http://docs.jquery.com/QUnit
[phantom]: http://www.phantomjs.org/
[contribution guide]: http://gruntjs.com/contributing
[getting started guide]: http://gruntjs.com/getting-started
[wiki]: http://github.com/gruntjs/grunt/wiki