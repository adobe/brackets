0.6.4 / 2013-09-05
------------------
* changed `homepage` field in package.json to remove NPM warning

0.6.3 / 2013-06-28
------------------
* changed JSON spacing default from `4` to `2` to follow Node conventions
* updated `jsonfile` dep 
* updated `rimraf` dep

0.6.2 / 2013-06-28
------------------
* added .npmignore, #25

0.6.1 / 2013-05-14
------------------
* modified for `strict` mode, closes #24
* added `outputJson()/outputJsonSync()`, closes #23

0.6.0 / 2013-03-18
------------------
* removed node 0.6 support
* added node 0.10 support
* upgraded to latest `ncp` and `rimraf`.
* optional `graceful-fs` support. Closes #17


0.5.0 / 2013-02-03
------------------
* Removed `readTextFile`.
* Renamed `readJSONFile` to `readJSON` and `readJson`, same with write.
* Restructured documentation a bit. Added roadmap.

0.4.0 / 2013-01-28
------------------
* Set default spaces in `jsonfile` from 4 to 2.
* Updated `testutil` deps for tests.
* Renamed `touch()` to `createFile()`
* Added `outputFile()` and `outputFileSync()`
* Changed creation of testing diretories so the /tmp dir is not littered.
* Added `readTextFile()` and `readTextFileSync()`.

0.3.2 / 2012-11-01
------------------
* Added `touch()` and `touchSync()` methods.

0.3.1 / 2012-10-11
------------------
* Fixed some stray globals.

0.3.0 / 2012-10-09
------------------
* Removed all CoffeeScript from tests.
* Renamed `mkdir` to `mkdirs`/`mkdirp`.

0.2.1 / 2012-09-11
------------------
* Updated `rimraf` dep.

0.2.0 / 2012-09-10
------------------
* Rewrote module into JavaScript. (Must still rewrite tests into JavaScript)
* Added all methods of [jsonfile][https://github.com/jprichardson/node-jsonfile]
* Added Travis-CI.

0.1.3 / 2012-08-13
------------------
* Added method `readJSONFile`.

0.1.2 / 2012-06-15
------------------
* Bug fix: `deleteSync()` didn't exist.
* Verified Node v0.8 compatibility.

0.1.1 / 2012-06-15
------------------
* Fixed bug in `remove()`/`delete()` that wouldn't execute the function if a callback wasn't passed.

0.1.0 / 2012-05-31
------------------
* Renamed `copyFile()` to `copy()`. `copy()` can now copy directories (recursively) too.
* Renamed `rmrf()` to `remove()`. 
* `remove()` aliased with `delete()`.
* Added `mkdirp` capabilities. Named: `mkdir()`. Hides Node.js native `mkdir()`.
* Instead of exporting the native `fs` module with new functions, I now copy over the native methods to a new object and export that instead.

0.0.4 / 2012-03-14
------------------
* Removed CoffeeScript dependency

0.0.3 / 2012-01-11
------------------
* Added methods rmrf and rmrfSync
* Moved tests from Jasmine to Mocha
