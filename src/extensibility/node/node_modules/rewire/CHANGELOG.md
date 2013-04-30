##Changelog

###v1.1.2
- Added deprecation warning for client-side bundlers
- Updated package.json for node v0.10

###v1.1.1
- Fixed bug with modules that had a comment on the last line

###v1.1.0
- Added Coffee-Script support
- Removed Makefile: Use `npm test` instead.

###v1.0.4
- Improved client-side rewire() with webpack

###v1.0.3
- Fixed error with client-side bundlers when a module was ending with a comment

###v1.0.2
- Improved strict mode detection

###v1.0.1
- Fixed crash when a global module has been used in the browser

###v1.0.0
- Removed caching functionality. Now rewire doesn't modify `require.cache` at all
- Added support for [webpack](https://github.com/webpack/webpack)-bundler
- Moved browserify-middleware from `rewire.browserify` to `rewire.bundlers.browserify`
- Reached stable  state :)