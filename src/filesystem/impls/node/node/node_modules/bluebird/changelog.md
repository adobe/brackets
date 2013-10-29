## 0.9.3-0 (2013-10-27)

Features:

 - Allow fresh copies of the library to be made
 - Add more components to customized builds

## 0.9.2-1 (2013-10-25)

## 0.9.2-0 (2013-10-25)

Features:

 - Allow custom builds

## 0.9.1-1 (2013-10-22)

Bugfixes:

 - Fix unhandled rethrown exceptions not reported

## 0.9.1-0 (2013-10-22)

Features:

 - Improve performance of `Promise.try`
 - Extend `Promise.try` to accept arguments and ctx to make it more usable in promisification of synchronous functions.

## 0.9.0-0 (2013-10-18)

Features:

 - Implement `.bind` and `Promise.bind`

Bugfixes:

 - Fix `.some()` when argument is a pending promise that later resolves to an array

## 0.8.5-1 (2013-10-17)

Features:

 - Enable process wide long stack traces through BLUEBIRD_DEBUG environment variable

## 0.8.5-0 (2013-10-16)

Features:

 - Improve performance of all collection methods

Bugfixes:

 - Fix .finally passing the value to handlers
 - Remove kew from benchmarks due to bugs in the library breaking the benchmark
 - Fix some bluebird library calls potentially appearing in stack traces

## 0.8.4-1 (2013-10-15)

Bugfixes:

 - Fix .pending() call showing in long stack traces

## 0.8.4-0 (2013-10-15)

Bugfixes:

 - Fix PromiseArray and its sub-classes swallowing possibly unhandled rejections

## 0.8.3-3 (2013-10-14)

Bugfixes:

 - Fix AMD-declaration using named module.

## 0.8.3-2 (2013-10-14)

Features:

 - The mortals that can handle it may now release Zalgo by `require("bluebird/zalgo");`

## 0.8.3-1 (2013-10-14)

Bugfixes:

 - Fix memory leak when using the same promise to attach handlers over and over again

## 0.8.3-0 (2013-10-13)

Features:

 - Add `Promise.props()` and `Promise.prototype.props()`. They work like `.all()` for object properties.

Bugfixes:

 - Fix bug with .some returning garbage when sparse arrays have rejections

## 0.8.2-2 (2013-10-13)

Features:

 - Improve performance of `.reduce()` when `initialValue` can be synchronously cast to a value

## 0.8.2-1 (2013-10-12)

Bugfixes:

 - Fix .npmignore having irrelevant files

## 0.8.2-0 (2013-10-12)

Features:

 - Improve performance of `.some()`

## 0.8.1-0 (2013-10-11)

Bugfixes:

 - Remove uses of dynamic evaluation (`new Function`, `eval` etc) when strictly not necessary. Use feature detection to use static evaluation to avoid errors when dynamic evaluation is prohibited.

## 0.8.0-3 (2013-10-10)

Features:

 - Add `.asCallback` property to `PromiseResolver`s

## 0.8.0-2 (2013-10-10)

## 0.8.0-1 (2013-10-09)

Features:

 - Improve overall performance. Be able to sustain infinite recursion when using promises.

## 0.8.0-0 (2013-10-09)

Bugfixes:

 - Fix stackoverflow error when function calls itself "synchronously" from a promise handler

## 0.7.12-2 (2013-10-09)

Bugfixes:

 - Fix safari 6 not using `MutationObserver` as a scheduler
 - Fix process exceptions interfering with internal queue flushing

## 0.7.12-1 (2013-10-09)

Bugfixes:

 - Don't try to detect if generators are available to allow shims to be used

## 0.7.12-0 (2013-10-08)

Features:

 - Promisification now consider all functions on the object and its prototype chain
 - Individual promisifcation uses current `this` if no explicit receiver is given
 - Give better stack traces when promisified callbacks throw or errback primitives such as strings by wrapping them in an `Error` object.

Bugfixes:

 - Fix runtime APIs throwing synchronous errors

## 0.7.11-0 (2013-10-08)

Features:

 - Deprecate `Promise.promisify(Object target)` in favor of `Promise.promisifyAll(Object target)` to avoid confusion with function objects
 - Coroutines now throw error when a non-promise is `yielded`

## 0.7.10-1 (2013-10-05)

Features:

 - Make tests pass Internet Explorer 8

## 0.7.10-0 (2013-10-05)

Features:

 - Create browser tests

## 0.7.9-1 (2013-10-03)

Bugfixes:

 - Fix promise cast bug when thenable fulfills using itself as the fulfillment value

## 0.7.9-0 (2013-10-03)

Features:

 - More performance improvements when long stack traces are enabled

## 0.7.8-1 (2013-10-02)

Features:

 - Performance improvements when long stack traces are enabled

## 0.7.8-0 (2013-10-02)

Bugfixes:

 - Fix promisified methods not turning synchronous exceptions into rejections

## 0.7.7-1 (2013-10-02)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.7.7-0 (2013-10-01)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.7.6-0 (2013-09-29)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.7.5-0 (2013-09-28)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.7.4-1 (2013-09-28)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.7.4-0 (2013-09-28)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.7.3-1 (2013-09-28)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.7.3-0 (2013-09-27)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.7.2-0 (2013-09-27)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.7.1-5 (2013-09-26)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.7.1-4 (2013-09-25)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.7.1-3 (2013-09-25)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.7.1-2 (2013-09-24)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.7.1-1 (2013-09-24)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.7.1-0 (2013-09-24)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.7.0-1 (2013-09-23)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.7.0-0 (2013-09-23)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.6.5-2 (2013-09-20)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.6.5-1 (2013-09-18)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.6.5-0 (2013-09-18)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.6.4-1 (2013-09-18)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.6.4-0 (2013-09-18)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.6.3-4 (2013-09-18)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.6.3-3 (2013-09-18)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.6.3-2 (2013-09-16)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.6.3-1 (2013-09-16)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.6.3-0 (2013-09-15)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.6.2-1 (2013-09-14)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.6.2-0 (2013-09-14)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.6.1-0 (2013-09-14)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.6.0-0 (2013-09-13)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.5.9-6 (2013-09-12)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.5.9-5 (2013-09-12)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.5.9-4 (2013-09-12)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.5.9-3 (2013-09-11)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.5.9-2 (2013-09-11)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.5.9-1 (2013-09-11)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.5.9-0 (2013-09-11)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.5.8-1 (2013-09-11)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.5.8-0 (2013-09-11)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.5.7-0 (2013-09-11)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.5.6-1 (2013-09-10)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.5.6-0 (2013-09-10)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.5.5-1 (2013-09-10)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.5.5-0 (2013-09-09)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.5.4-1 (2013-09-08)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.5.4-0 (2013-09-08)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.5.3-0 (2013-09-07)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.5.2-0 (2013-09-07)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.5.1-0 (2013-09-07)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.5.0-0 (2013-09-07)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.4.0-0 (2013-09-06)

Features:

 - feature

Bugfixes:

 - bugfix

## 0.3.0-1 (2013-09-06)

Features:

 - feature

Bugfixes:

 - bugfix

