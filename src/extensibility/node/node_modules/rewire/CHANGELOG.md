Changelog
---------

### 2.1.2

- Fixed missing `var` statement which lead to pollution of global namespace [#33](https://github.com/jhnns/rewire/pull/33)

### 2.1.1
- Made magic `__set__`, `__get__` and `__with__` not enumerable [#32](https://github.com/jhnns/rewire/pull/32)

### 2.1.0
- Added revert feature of `__set__` method
- Introduced `__with__` method to revert changes automatically

### 2.0.1
- Added test coverage tool
- Small README and description changes

### 2.0.0
- Removed client-side bundler extensions. Browserify is not supported anymore. Webpack support has been extracted
  into separate repository https://github.com/jhnns/rewire-webpack

### 1.1.3
- Removed IDE stuff from npm package

### 1.1.2
- Added deprecation warning for client-side bundlers
- Updated package.json for node v0.10

### 1.1.1
- Fixed bug with modules that had a comment on the last line

### 1.1.0
- Added Coffee-Script support
- Removed Makefile: Use `npm test` instead.

### 1.0.4
- Improved client-side rewire() with webpack

### 1.0.3
- Fixed error with client-side bundlers when a module was ending with a comment

### 1.0.2
- Improved strict mode detection

### 1.0.1
- Fixed crash when a global module has been used in the browser

### 1.0.0
- Removed caching functionality. Now rewire doesn't modify `require.cache` at all
- Added support for [webpack](https://github.com/webpack/webpack)-bundler
- Moved browserify-middleware from `rewire.browserify` to `rewire.bundlers.browserify`
- Reached stable state :)