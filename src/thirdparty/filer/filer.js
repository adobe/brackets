// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  var error;
  for (var i = 0; i < entry.length; i++) {
    try {
      newRequire(entry[i]);
    } catch (e) {
      // Save first error but execute all entries
      if (!error) {
        error = e;
      }
    }
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  parcelRequire = newRequire;

  if (error) {
    // throw error from earlier, _after updating parcelRequire_
    throw error;
  }

  return newRequire;
})({"c0Ea":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.promisify = promisify;
// Symbols is a better way to do this, but not all browsers have good support,
// so instead we'll just make do with a very unlikely string.
var customArgumentsToken = "__ES6-PROMISIFY--CUSTOM-ARGUMENTS__";
/**
 * promisify()
 * Transforms callback-based function -- func(arg1, arg2 .. argN, callback) --
 * into an ES6-compatible Promise. Promisify provides a default callback of the
 * form (error, result) and rejects when `error` is truthy.
 *
 * @param {function} original - The function to promisify
 * @return {function} A promisified version of `original`
 */

function promisify(original) {
  // Ensure the argument is a function
  if (typeof original !== "function") {
    throw new TypeError("Argument to promisify must be a function");
  } // If the user has asked us to decode argument names for them, honour that


  var argumentNames = original[customArgumentsToken]; // If the user has supplied a custom Promise implementation, use it.
  // Otherwise fall back to whatever we can find on the global object.

  var ES6Promise = promisify.Promise || Promise; // If we can find no Promise implemention, then fail now.

  if (typeof ES6Promise !== "function") {
    throw new Error("No Promise implementation found; do you need a polyfill?");
  }

  return function () {
    var _this = this;

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return new ES6Promise(function (resolve, reject) {
      // Append the callback bound to the context
      args.push(function callback(err) {
        if (err) {
          return reject(err);
        }

        for (var _len2 = arguments.length, values = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
          values[_key2 - 1] = arguments[_key2];
        }

        if (values.length === 1 || !argumentNames) {
          return resolve(values[0]);
        }

        var o = {};
        values.forEach(function (value, index) {
          var name = argumentNames[index];

          if (name) {
            o[name] = value;
          }
        });
        resolve(o);
      }); // Call the function.

      original.apply(_this, args);
    });
  };
} // Attach this symbol to the exported function, so users can use it


promisify.argumentNames = customArgumentsToken;
promisify.Promise = undefined; // Export the public API
},{}],"pBGv":[function(require,module,exports) {

// shim for using process in browser
var process = module.exports = {}; // cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
  throw new Error('setTimeout has not been defined');
}

function defaultClearTimeout() {
  throw new Error('clearTimeout has not been defined');
}

(function () {
  try {
    if (typeof setTimeout === 'function') {
      cachedSetTimeout = setTimeout;
    } else {
      cachedSetTimeout = defaultSetTimout;
    }
  } catch (e) {
    cachedSetTimeout = defaultSetTimout;
  }

  try {
    if (typeof clearTimeout === 'function') {
      cachedClearTimeout = clearTimeout;
    } else {
      cachedClearTimeout = defaultClearTimeout;
    }
  } catch (e) {
    cachedClearTimeout = defaultClearTimeout;
  }
})();

function runTimeout(fun) {
  if (cachedSetTimeout === setTimeout) {
    //normal enviroments in sane situations
    return setTimeout(fun, 0);
  } // if setTimeout wasn't available but was latter defined


  if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
    cachedSetTimeout = setTimeout;
    return setTimeout(fun, 0);
  }

  try {
    // when when somebody has screwed with setTimeout but no I.E. maddness
    return cachedSetTimeout(fun, 0);
  } catch (e) {
    try {
      // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
      return cachedSetTimeout.call(null, fun, 0);
    } catch (e) {
      // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
      return cachedSetTimeout.call(this, fun, 0);
    }
  }
}

function runClearTimeout(marker) {
  if (cachedClearTimeout === clearTimeout) {
    //normal enviroments in sane situations
    return clearTimeout(marker);
  } // if clearTimeout wasn't available but was latter defined


  if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
    cachedClearTimeout = clearTimeout;
    return clearTimeout(marker);
  }

  try {
    // when when somebody has screwed with setTimeout but no I.E. maddness
    return cachedClearTimeout(marker);
  } catch (e) {
    try {
      // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
      return cachedClearTimeout.call(null, marker);
    } catch (e) {
      // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
      // Some versions of I.E. have different rules for clearTimeout vs setTimeout
      return cachedClearTimeout.call(this, marker);
    }
  }
}

var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
  if (!draining || !currentQueue) {
    return;
  }

  draining = false;

  if (currentQueue.length) {
    queue = currentQueue.concat(queue);
  } else {
    queueIndex = -1;
  }

  if (queue.length) {
    drainQueue();
  }
}

function drainQueue() {
  if (draining) {
    return;
  }

  var timeout = runTimeout(cleanUpNextTick);
  draining = true;
  var len = queue.length;

  while (len) {
    currentQueue = queue;
    queue = [];

    while (++queueIndex < len) {
      if (currentQueue) {
        currentQueue[queueIndex].run();
      }
    }

    queueIndex = -1;
    len = queue.length;
  }

  currentQueue = null;
  draining = false;
  runClearTimeout(timeout);
}

process.nextTick = function (fun) {
  var args = new Array(arguments.length - 1);

  if (arguments.length > 1) {
    for (var i = 1; i < arguments.length; i++) {
      args[i - 1] = arguments[i];
    }
  }

  queue.push(new Item(fun, args));

  if (queue.length === 1 && !draining) {
    runTimeout(drainQueue);
  }
}; // v8 likes predictible objects


function Item(fun, array) {
  this.fun = fun;
  this.array = array;
}

Item.prototype.run = function () {
  this.fun.apply(null, this.array);
};

process.title = 'browser';
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues

process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) {
  return [];
};

process.binding = function (name) {
  throw new Error('process.binding is not supported');
};

process.cwd = function () {
  return '/';
};

process.chdir = function (dir) {
  throw new Error('process.chdir is not supported');
};

process.umask = function () {
  return 0;
};
},{}],"UUq2":[function(require,module,exports) {
var process = require("process");
// .dirname, .basename, and .extname methods are extracted from Node.js v8.11.1,
// backported and transplited with Babel, with backwards-compat fixes

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function (path) {
  if (typeof path !== 'string') path = path + '';
  if (path.length === 0) return '.';
  var code = path.charCodeAt(0);
  var hasRoot = code === 47 /*/*/;
  var end = -1;
  var matchedSlash = true;
  for (var i = path.length - 1; i >= 1; --i) {
    code = path.charCodeAt(i);
    if (code === 47 /*/*/) {
        if (!matchedSlash) {
          end = i;
          break;
        }
      } else {
      // We saw the first non-path separator
      matchedSlash = false;
    }
  }

  if (end === -1) return hasRoot ? '/' : '.';
  if (hasRoot && end === 1) {
    // return '//';
    // Backwards-compat fix:
    return '/';
  }
  return path.slice(0, end);
};

function basename(path) {
  if (typeof path !== 'string') path = path + '';

  var start = 0;
  var end = -1;
  var matchedSlash = true;
  var i;

  for (i = path.length - 1; i >= 0; --i) {
    if (path.charCodeAt(i) === 47 /*/*/) {
        // If we reached a path separator that was not part of a set of path
        // separators at the end of the string, stop now
        if (!matchedSlash) {
          start = i + 1;
          break;
        }
      } else if (end === -1) {
      // We saw the first non-path separator, mark this as the end of our
      // path component
      matchedSlash = false;
      end = i + 1;
    }
  }

  if (end === -1) return '';
  return path.slice(start, end);
}

// Uses a mixed approach for backwards-compatibility, as ext behavior changed
// in new Node.js versions, so only basename() above is backported here
exports.basename = function (path, ext) {
  var f = basename(path);
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};

exports.extname = function (path) {
  if (typeof path !== 'string') path = path + '';
  var startDot = -1;
  var startPart = 0;
  var end = -1;
  var matchedSlash = true;
  // Track the state of characters (if any) we see before our first dot and
  // after any path separator we find
  var preDotState = 0;
  for (var i = path.length - 1; i >= 0; --i) {
    var code = path.charCodeAt(i);
    if (code === 47 /*/*/) {
        // If we reached a path separator that was not part of a set of path
        // separators at the end of the string, stop now
        if (!matchedSlash) {
          startPart = i + 1;
          break;
        }
        continue;
      }
    if (end === -1) {
      // We saw the first non-path separator, mark this as the end of our
      // extension
      matchedSlash = false;
      end = i + 1;
    }
    if (code === 46 /*.*/) {
        // If this is our first dot, mark it as the start of our extension
        if (startDot === -1)
          startDot = i;
        else if (preDotState !== 1)
          preDotState = 1;
    } else if (startDot !== -1) {
      // We saw a non-dot and non-path separator before our dot, so we should
      // have a good chance at having a non-empty extension
      preDotState = -1;
    }
  }

  if (startDot === -1 || end === -1 ||
      // We saw a non-dot character immediately before the dot
      preDotState === 0 ||
      // The (right-most) trimmed path component is exactly '..'
      preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
    return '';
  }
  return path.slice(startDot, end);
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

},{"process":"pBGv"}],"UzoP":[function(require,module,exports) {
var process = require("process");
/**
 * Patch process to add process.cwd(), always giving the root dir.
 * NOTE: this line needs to happen *before* we require in `path`.
 */
process.cwd = function () {
  return '/';
};
/**
 * https://github.com/browserify/path-browserify via Parcel.
 * We use is as a base for our own Filer.Path, and patch/add
 * a few things we need for the browser environment.
 */


var nodePath = require('path');

var filerPath = Object.create(nodePath);
/**
 * Patch path.basename() to return / vs. ''
 */

filerPath.basename = function (path, ext) {
  var basename = nodePath.basename(path, ext);
  return basename === '' ? '/' : basename;
};
/**
 * Patch path.normalize() to not add a trailing /
 */


filerPath.normalize = function (path) {
  path = nodePath.normalize(path);
  return path === '/' ? path : filerPath.removeTrailing(path);
};
/**
 * Add new utility method isNull() to path: check for null paths.
 */


filerPath.isNull = function (path) {
  return ('' + path).indexOf("\0") !== -1;
};
/**
 * Add new utility method addTrailing() to add trailing / without doubling to //.
 */


filerPath.addTrailing = function (path) {
  return path.replace(/\/*$/, '/');
};
/**
 * Add new utility method removeTrailing() to remove trailing /, dealing with multiple
 */


filerPath.removeTrailing = function (path) {
  path = path.replace(/\/*$/, '');
  return path === '' ? '/' : path;
};

module.exports = filerPath;
},{"path":"UUq2","process":"pBGv"}],"iJA9":[function(require,module,exports) {
var O_READ = 'READ';
var O_WRITE = 'WRITE';
var O_CREATE = 'CREATE';
var O_EXCLUSIVE = 'EXCLUSIVE';
var O_TRUNCATE = 'TRUNCATE';
var O_APPEND = 'APPEND';
var XATTR_CREATE = 'CREATE';
var XATTR_REPLACE = 'REPLACE';
module.exports = {
  FILE_SYSTEM_NAME: 'local',
  FILE_STORE_NAME: 'files',
  IDB_RO: 'readonly',
  IDB_RW: 'readwrite',
  WSQL_VERSION: '1',
  WSQL_SIZE: 5 * 1024 * 1024,
  WSQL_DESC: 'FileSystem Storage',
  NODE_TYPE_FILE: 'FILE',
  NODE_TYPE_DIRECTORY: 'DIRECTORY',
  NODE_TYPE_SYMBOLIC_LINK: 'SYMLINK',
  NODE_TYPE_META: 'META',
  DEFAULT_DIR_PERMISSIONS: 0x1ED,
  // 755
  DEFAULT_FILE_PERMISSIONS: 0x1A4,
  // 644
  FULL_READ_WRITE_EXEC_PERMISSIONS: 0x1FF,
  // 777
  READ_WRITE_PERMISSIONS: 0x1B6,
  /// 666
  SYMLOOP_MAX: 10,
  BINARY_MIME_TYPE: 'application/octet-stream',
  JSON_MIME_TYPE: 'application/json',
  ROOT_DIRECTORY_NAME: '/',
  // basename(normalize(path))
  // FS Mount Flags
  FS_FORMAT: 'FORMAT',
  FS_NOCTIME: 'NOCTIME',
  FS_NOMTIME: 'NOMTIME',
  FS_NODUPEIDCHECK: 'FS_NODUPEIDCHECK',
  // FS File Open Flags
  O_READ: O_READ,
  O_WRITE: O_WRITE,
  O_CREATE: O_CREATE,
  O_EXCLUSIVE: O_EXCLUSIVE,
  O_TRUNCATE: O_TRUNCATE,
  O_APPEND: O_APPEND,
  O_FLAGS: {
    'r': [O_READ],
    'r+': [O_READ, O_WRITE],
    'w': [O_WRITE, O_CREATE, O_TRUNCATE],
    'w+': [O_WRITE, O_READ, O_CREATE, O_TRUNCATE],
    'wx': [O_WRITE, O_CREATE, O_EXCLUSIVE, O_TRUNCATE],
    'wx+': [O_WRITE, O_READ, O_CREATE, O_EXCLUSIVE, O_TRUNCATE],
    'a': [O_WRITE, O_CREATE, O_APPEND],
    'a+': [O_WRITE, O_READ, O_CREATE, O_APPEND],
    'ax': [O_WRITE, O_CREATE, O_EXCLUSIVE, O_APPEND],
    'ax+': [O_WRITE, O_READ, O_CREATE, O_EXCLUSIVE, O_APPEND]
  },
  XATTR_CREATE: XATTR_CREATE,
  XATTR_REPLACE: XATTR_REPLACE,
  FS_READY: 'READY',
  FS_PENDING: 'PENDING',
  FS_ERROR: 'ERROR',
  SUPER_NODE_ID: '00000000-0000-0000-0000-000000000000',
  // Reserved File Descriptors for streams
  STDIN: 0,
  STDOUT: 1,
  STDERR: 2,
  FIRST_DESCRIPTOR: 3,
  ENVIRONMENT: {
    TMP: '/tmp',
    PATH: ''
  },
  // Duplicate Node's fs.constants
  fsConstants: {
    O_RDONLY: 0,
    O_WRONLY: 1,
    O_RDWR: 2,
    S_IFMT: 61440,
    S_IFREG: 32768,
    S_IFDIR: 16384,
    S_IFCHR: 8192,
    S_IFBLK: 24576,
    S_IFIFO: 4096,
    S_IFLNK: 40960,
    S_IFSOCK: 49152,
    O_CREAT: 512,
    O_EXCL: 2048,
    O_NOCTTY: 131072,
    O_TRUNC: 1024,
    O_APPEND: 8,
    O_DIRECTORY: 1048576,
    O_NOFOLLOW: 256,
    O_SYNC: 128,
    O_DSYNC: 4194304,
    O_SYMLINK: 2097152,
    O_NONBLOCK: 4,
    S_IRWXU: 448,
    S_IRUSR: 256,
    S_IWUSR: 128,
    S_IXUSR: 64,
    S_IRWXG: 56,
    S_IRGRP: 32,
    S_IWGRP: 16,
    S_IXGRP: 8,
    S_IRWXO: 7,
    S_IROTH: 4,
    S_IWOTH: 2,
    S_IXOTH: 1,
    F_OK: 0,
    R_OK: 4,
    W_OK: 2,
    X_OK: 1,
    UV_FS_COPYFILE_EXCL: 1,
    COPYFILE_EXCL: 1
  }
};
},{}],"yh9p":[function(require,module,exports) {
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  var i
  for (i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(
      uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)
    ))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}

},{}],"JgNJ":[function(require,module,exports) {
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],"REa7":[function(require,module,exports) {
var toString = {}.toString;

module.exports = Array.isArray || function (arr) {
  return toString.call(arr) == '[object Array]';
};

},{}],"dskh":[function(require,module,exports) {

var global = arguments[3];
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <http://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')
var isArray = require('isarray')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Due to various browser bugs, sometimes the Object implementation will be used even
 * when the browser supports typed arrays.
 *
 * Note:
 *
 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *     incorrect length in some situations.

 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
 * get the Object implementation, which is slower but behaves correctly.
 */
Buffer.TYPED_ARRAY_SUPPORT = global.TYPED_ARRAY_SUPPORT !== undefined
  ? global.TYPED_ARRAY_SUPPORT
  : typedArraySupport()

/*
 * Export kMaxLength after typed array support is determined.
 */
exports.kMaxLength = kMaxLength()

function typedArraySupport () {
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = {__proto__: Uint8Array.prototype, foo: function () { return 42 }}
    return arr.foo() === 42 && // typed array instances can be augmented
        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
        arr.subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
  } catch (e) {
    return false
  }
}

function kMaxLength () {
  return Buffer.TYPED_ARRAY_SUPPORT
    ? 0x7fffffff
    : 0x3fffffff
}

function createBuffer (that, length) {
  if (kMaxLength() < length) {
    throw new RangeError('Invalid typed array length')
  }
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = new Uint8Array(length)
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    if (that === null) {
      that = new Buffer(length)
    }
    that.length = length
  }

  return that
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  if (!Buffer.TYPED_ARRAY_SUPPORT && !(this instanceof Buffer)) {
    return new Buffer(arg, encodingOrOffset, length)
  }

  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new Error(
        'If encoding is specified then the first argument must be a string'
      )
    }
    return allocUnsafe(this, arg)
  }
  return from(this, arg, encodingOrOffset, length)
}

Buffer.poolSize = 8192 // not used by this implementation

// TODO: Legacy, not needed anymore. Remove in next major version.
Buffer._augment = function (arr) {
  arr.__proto__ = Buffer.prototype
  return arr
}

function from (that, value, encodingOrOffset, length) {
  if (typeof value === 'number') {
    throw new TypeError('"value" argument must not be a number')
  }

  if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
    return fromArrayBuffer(that, value, encodingOrOffset, length)
  }

  if (typeof value === 'string') {
    return fromString(that, value, encodingOrOffset)
  }

  return fromObject(that, value)
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(null, value, encodingOrOffset, length)
}

if (Buffer.TYPED_ARRAY_SUPPORT) {
  Buffer.prototype.__proto__ = Uint8Array.prototype
  Buffer.__proto__ = Uint8Array
  if (typeof Symbol !== 'undefined' && Symbol.species &&
      Buffer[Symbol.species] === Buffer) {
    // Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
    Object.defineProperty(Buffer, Symbol.species, {
      value: null,
      configurable: true
    })
  }
}

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be a number')
  } else if (size < 0) {
    throw new RangeError('"size" argument must not be negative')
  }
}

function alloc (that, size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(that, size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(that, size).fill(fill, encoding)
      : createBuffer(that, size).fill(fill)
  }
  return createBuffer(that, size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(null, size, fill, encoding)
}

function allocUnsafe (that, size) {
  assertSize(size)
  that = createBuffer(that, size < 0 ? 0 : checked(size) | 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < size; ++i) {
      that[i] = 0
    }
  }
  return that
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(null, size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(null, size)
}

function fromString (that, string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('"encoding" must be a valid string encoding')
  }

  var length = byteLength(string, encoding) | 0
  that = createBuffer(that, length)

  var actual = that.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    that = that.slice(0, actual)
  }

  return that
}

function fromArrayLike (that, array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  that = createBuffer(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

function fromArrayBuffer (that, array, byteOffset, length) {
  array.byteLength // this throws if `array` is not a valid ArrayBuffer

  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('\'offset\' is out of bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('\'length\' is out of bounds')
  }

  if (byteOffset === undefined && length === undefined) {
    array = new Uint8Array(array)
  } else if (length === undefined) {
    array = new Uint8Array(array, byteOffset)
  } else {
    array = new Uint8Array(array, byteOffset, length)
  }

  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = array
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    that = fromArrayLike(that, array)
  }
  return that
}

function fromObject (that, obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    that = createBuffer(that, len)

    if (that.length === 0) {
      return that
    }

    obj.copy(that, 0, 0, len)
    return that
  }

  if (obj) {
    if ((typeof ArrayBuffer !== 'undefined' &&
        obj.buffer instanceof ArrayBuffer) || 'length' in obj) {
      if (typeof obj.length !== 'number' || isnan(obj.length)) {
        return createBuffer(that, 0)
      }
      return fromArrayLike(that, obj)
    }

    if (obj.type === 'Buffer' && isArray(obj.data)) {
      return fromArrayLike(that, obj.data)
    }
  }

  throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.')
}

function checked (length) {
  // Note: cannot use `length < kMaxLength()` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= kMaxLength()) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return !!(b != null && b._isBuffer)
}

Buffer.compare = function compare (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (typeof ArrayBuffer !== 'undefined' && typeof ArrayBuffer.isView === 'function' &&
      (ArrayBuffer.isView(string) || string instanceof ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    string = '' + string
  }

  var len = string.length
  if (len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
      case undefined:
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) return utf8ToBytes(string).length // assume utf8
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// The property is used by `Buffer.isBuffer` and `is-buffer` (in Safari 5-7) to detect
// Buffer instances.
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length | 0
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max) str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (!Buffer.isBuffer(target)) {
    throw new TypeError('Argument must be a Buffer')
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset  // Coerce to Number.
  if (isNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (Buffer.TYPED_ARRAY_SUPPORT &&
        typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new TypeError('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (isNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset | 0
    if (isFinite(length)) {
      length = length | 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  // legacy write(string, encoding, offset, length) - remove in v0.13
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
      : (firstByte > 0xBF) ? 2
      : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    newBuf = this.subarray(start, end)
    newBuf.__proto__ = Buffer.prototype
  } else {
    var sliceLen = end - start
    newBuf = new Buffer(sliceLen, undefined)
    for (var i = 0; i < sliceLen; ++i) {
      newBuf[i] = this[i + start]
    }
  }

  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  this[offset] = (value & 0xff)
  return offset + 1
}

function objectWriteUInt16 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; ++i) {
    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

function objectWriteUInt32 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffffffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; ++i) {
    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = (value >>> 24)
    this[offset + 2] = (value >>> 16)
    this[offset + 1] = (value >>> 8)
    this[offset] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
    this[offset + 2] = (value >>> 16)
    this[offset + 3] = (value >>> 24)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start
  var i

  if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
    // ascending copy from start
    for (i = 0; i < len; ++i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, start + len),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if (code < 256) {
        val = code
      }
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : utf8ToBytes(new Buffer(val, encoding).toString())
    var len = bytes.length
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

function isnan (val) {
  return val !== val // eslint-disable-line no-self-compare
}

},{"base64-js":"yh9p","ieee754":"JgNJ","isarray":"REa7","buffer":"dskh"}],"QO4x":[function(require,module,exports) {
var Buffer = require("buffer").Buffer;
var global = arguments[3];
var FILE_SYSTEM_NAME = require('../constants.js').FILE_SYSTEM_NAME;

var FILE_STORE_NAME = require('../constants.js').FILE_STORE_NAME;

var IDB_RW = require('../constants.js').IDB_RW;

var IDB_RO = require('../constants.js').IDB_RO;

function IndexedDBContext(db, mode) {
  this.db = db;
  this.mode = mode;
}

IndexedDBContext.prototype._getObjectStore = function () {
  if (this.objectStore) {
    return this.objectStore;
  }

  var transaction = this.db.transaction(FILE_STORE_NAME, this.mode);
  this.objectStore = transaction.objectStore(FILE_STORE_NAME);
  return this.objectStore;
};

IndexedDBContext.prototype.clear = function (callback) {
  try {
    var objectStore = this._getObjectStore();

    var request = objectStore.clear();

    request.onsuccess = function () {
      callback();
    };

    request.onerror = function (event) {
      event.preventDefault();
      callback(event.error);
    };
  } catch (err) {
    callback(err);
  }
};

IndexedDBContext.prototype._get = function (key, callback) {
  try {
    var objectStore = this._getObjectStore();

    var request = objectStore.get(key);

    request.onsuccess = function onsuccess(event) {
      var result = event.target.result;
      callback(null, result);
    };

    request.onerror = function (event) {
      event.preventDefault();
      callback(event.error);
    };
  } catch (err) {
    callback(err);
  }
};

IndexedDBContext.prototype.getObject = function (key, callback) {
  this._get(key, callback);
};

IndexedDBContext.prototype.getBuffer = function (key, callback) {
  this._get(key, function (err, arrayBuffer) {
    if (err) {
      return callback(err);
    }

    callback(null, Buffer.from(arrayBuffer));
  });
};

IndexedDBContext.prototype._put = function (key, value, callback) {
  try {
    var objectStore = this._getObjectStore();

    var request = objectStore.put(value, key);

    request.onsuccess = function onsuccess(event) {
      var result = event.target.result;
      callback(null, result);
    };

    request.onerror = function (event) {
      event.preventDefault();
      callback(event.error);
    };
  } catch (err) {
    callback(err);
  }
};

IndexedDBContext.prototype.putObject = function (key, value, callback) {
  this._put(key, value, callback);
};

IndexedDBContext.prototype.putBuffer = function (key, uint8BackedBuffer, callback) {
  var buf = uint8BackedBuffer.buffer;

  this._put(key, buf, callback);
};

IndexedDBContext.prototype.delete = function (key, callback) {
  try {
    var objectStore = this._getObjectStore();

    var request = objectStore.delete(key);

    request.onsuccess = function onsuccess(event) {
      var result = event.target.result;
      callback(null, result);
    };

    request.onerror = function (event) {
      event.preventDefault();
      callback(event.error);
    };
  } catch (err) {
    callback(err);
  }
};

function IndexedDB(name) {
  this.name = name || FILE_SYSTEM_NAME;
  this.db = null;
}

IndexedDB.isSupported = function () {
  var indexedDB = global.indexedDB || global.mozIndexedDB || global.webkitIndexedDB || global.msIndexedDB;
  return !!indexedDB;
};

IndexedDB.prototype.open = function (callback) {
  var that = this; // Bail if we already have a db open

  if (that.db) {
    return callback();
  }

  try {
    var indexedDB = global.indexedDB || global.mozIndexedDB || global.webkitIndexedDB || global.msIndexedDB; // NOTE: we're not using versioned databases.

    var openRequest = indexedDB.open(that.name); // If the db doesn't exist, we'll create it

    openRequest.onupgradeneeded = function onupgradeneeded(event) {
      var db = event.target.result;

      if (db.objectStoreNames.contains(FILE_STORE_NAME)) {
        db.deleteObjectStore(FILE_STORE_NAME);
      }

      db.createObjectStore(FILE_STORE_NAME);
    };

    openRequest.onsuccess = function onsuccess(event) {
      that.db = event.target.result;
      callback();
    };

    openRequest.onerror = function onerror(event) {
      event.preventDefault();
      callback(event.error);
    };
  } catch (err) {
    callback(err);
  }
};

IndexedDB.prototype.getReadOnlyContext = function () {
  return new IndexedDBContext(this.db, IDB_RO);
};

IndexedDB.prototype.getReadWriteContext = function () {
  return new IndexedDBContext(this.db, IDB_RW);
};

module.exports = IndexedDB;
},{"../constants.js":"iJA9","buffer":"dskh"}],"u4Zs":[function(require,module,exports) {
var process = require("process");
var define;
/*global setImmediate: false, setTimeout: false, console: false */

/**
 * async.js shim, based on https://raw.github.com/caolan/async/master/lib/async.js Feb 18, 2014
 * Used under MIT - https://github.com/caolan/async/blob/master/LICENSE
 */
(function () {
  var async = {}; // async.js functions used in Filer
  //// nextTick implementation with browser-compatible fallback ////

  if (typeof process === 'undefined' || !process.nextTick) {
    if (typeof setImmediate === 'function') {
      async.nextTick = function (fn) {
        // not a direct alias for IE10 compatibility
        setImmediate(fn);
      };

      async.setImmediate = async.nextTick;
    } else {
      async.nextTick = function (fn) {
        setTimeout(fn, 0);
      };

      async.setImmediate = async.nextTick;
    }
  } else {
    async.nextTick = process.nextTick;

    if (typeof setImmediate !== 'undefined') {
      async.setImmediate = function (fn) {
        // not a direct alias for IE10 compatibility
        setImmediate(fn);
      };
    } else {
      async.setImmediate = async.nextTick;
    }
  }

  async.eachSeries = function (arr, iterator, callback) {
    callback = callback || function () {};

    if (!arr.length) {
      return callback();
    }

    var completed = 0;

    var iterate = function iterate() {
      iterator(arr[completed], function (err) {
        if (err) {
          callback(err);

          callback = function callback() {};
        } else {
          completed += 1;

          if (completed >= arr.length) {
            callback();
          } else {
            iterate();
          }
        }
      });
    };

    iterate();
  };

  async.forEachSeries = async.eachSeries; // AMD / RequireJS

  if (typeof define !== 'undefined' && define.amd) {
    define([], function () {
      return async;
    });
  } // Node.js
  else if (typeof module !== 'undefined' && module.exports) {
      module.exports = async;
    } // included directly via <script> tag
    else {
        root.async = async;
      }
})();
},{"process":"pBGv"}],"OWym":[function(require,module,exports) {
var FILE_SYSTEM_NAME = require('../constants.js').FILE_SYSTEM_NAME; // NOTE: prefer setImmediate to nextTick for proper recursion yielding.
// see https://github.com/js-platform/filer/pull/24


var asyncCallback = require('../../lib/async.js').setImmediate;
/**
 * Make shared in-memory DBs possible when using the same name.
 */


var createDB = function () {
  var pool = {};
  return function getOrCreate(name) {
    if (!Object.prototype.hasOwnProperty.call(pool, name)) {
      pool[name] = {};
    }

    return pool[name];
  };
}();

function MemoryContext(db, readOnly) {
  this.readOnly = readOnly;
  this.objectStore = db;
}

MemoryContext.prototype.clear = function (callback) {
  if (this.readOnly) {
    asyncCallback(function () {
      callback('[MemoryContext] Error: write operation on read only context');
    });
    return;
  }

  var objectStore = this.objectStore;
  Object.keys(objectStore).forEach(function (key) {
    delete objectStore[key];
  });
  asyncCallback(callback);
}; // Memory context doesn't care about differences between Object and Buffer


MemoryContext.prototype.getObject = MemoryContext.prototype.getBuffer = function (key, callback) {
  var that = this;
  asyncCallback(function () {
    callback(null, that.objectStore[key]);
  });
};

MemoryContext.prototype.putObject = MemoryContext.prototype.putBuffer = function (key, value, callback) {
  if (this.readOnly) {
    asyncCallback(function () {
      callback('[MemoryContext] Error: write operation on read only context');
    });
    return;
  }

  this.objectStore[key] = value;
  asyncCallback(callback);
};

MemoryContext.prototype.delete = function (key, callback) {
  if (this.readOnly) {
    asyncCallback(function () {
      callback('[MemoryContext] Error: write operation on read only context');
    });
    return;
  }

  delete this.objectStore[key];
  asyncCallback(callback);
};

function Memory(name) {
  this.name = name || FILE_SYSTEM_NAME;
}

Memory.isSupported = function () {
  return true;
};

Memory.prototype.open = function (callback) {
  this.db = createDB(this.name);
  asyncCallback(callback);
};

Memory.prototype.getReadOnlyContext = function () {
  return new MemoryContext(this.db, true);
};

Memory.prototype.getReadWriteContext = function () {
  return new MemoryContext(this.db, false);
};

module.exports = Memory;
},{"../constants.js":"iJA9","../../lib/async.js":"u4Zs"}],"AiW7":[function(require,module,exports) {
var IndexedDB = require('./indexeddb.js');

var Memory = require('./memory.js');

module.exports = {
  IndexedDB: IndexedDB,
  Default: IndexedDB,
  Memory: Memory
};
},{"./indexeddb.js":"QO4x","./memory.js":"OWym"}],"p8GN":[function(require,module,exports) {
var errors = {};
[
/**
 * node.js errors - we only use some of these, add as needed.
 */
//'-1:UNKNOWN:unknown error',
//'0:OK:success',
//'1:EOF:end of file',
//'2:EADDRINFO:getaddrinfo error',
'3:EACCES:permission denied', //'4:EAGAIN:resource temporarily unavailable',
//'5:EADDRINUSE:address already in use',
//'6:EADDRNOTAVAIL:address not available',
//'7:EAFNOSUPPORT:address family not supported',
//'8:EALREADY:connection already in progress',
'9:EBADF:bad file descriptor', '10:EBUSY:resource busy or locked', //'11:ECONNABORTED:software caused connection abort',
//'12:ECONNREFUSED:connection refused',
//'13:ECONNRESET:connection reset by peer',
//'14:EDESTADDRREQ:destination address required',
//'15:EFAULT:bad address in system call argument',
//'16:EHOSTUNREACH:host is unreachable',
//'17:EINTR:interrupted system call',
'18:EINVAL:invalid argument', //'19:EISCONN:socket is already connected',
//'20:EMFILE:too many open files',
//'21:EMSGSIZE:message too long',
//'22:ENETDOWN:network is down',
//'23:ENETUNREACH:network is unreachable',
//'24:ENFILE:file table overflow',
//'25:ENOBUFS:no buffer space available',
//'26:ENOMEM:not enough memory',
'27:ENOTDIR:not a directory', '28:EISDIR:illegal operation on a directory', //'29:ENONET:machine is not on the network',
// errno 30 skipped, as per https://github.com/rvagg/node-errno/blob/master/errno.js
//'31:ENOTCONN:socket is not connected',
//'32:ENOTSOCK:socket operation on non-socket',
//'33:ENOTSUP:operation not supported on socket',
'34:ENOENT:no such file or directory', //'35:ENOSYS:function not implemented',
//'36:EPIPE:broken pipe',
//'37:EPROTO:protocol error',
//'38:EPROTONOSUPPORT:protocol not supported',
//'39:EPROTOTYPE:protocol wrong type for socket',
//'40:ETIMEDOUT:connection timed out',
//'41:ECHARSET:invalid Unicode character',
//'42:EAIFAMNOSUPPORT:address family for hostname not supported',
// errno 43 skipped, as per https://github.com/rvagg/node-errno/blob/master/errno.js
//'44:EAISERVICE:servname not supported for ai_socktype',
//'45:EAISOCKTYPE:ai_socktype not supported',
//'46:ESHUTDOWN:cannot send after transport endpoint shutdown',
'47:EEXIST:file already exists', //'48:ESRCH:no such process',
//'49:ENAMETOOLONG:name too long',
'50:EPERM:operation not permitted', '51:ELOOP:too many symbolic links encountered', //'52:EXDEV:cross-device link not permitted',
'53:ENOTEMPTY:directory not empty', //'54:ENOSPC:no space left on device',
'55:EIO:i/o error', //'56:EROFS:read-only file system',
//'57:ENODEV:no such device',
//'58:ESPIPE:invalid seek',
//'59:ECANCELED:operation canceled',

/**
 * Filer specific errors
 */
'1000:ENOTMOUNTED:not mounted', '1001:EFILESYSTEMERROR:missing super node, use \'FORMAT\' flag to format filesystem.', '1002:ENOATTR:attribute does not exist'].forEach(function (e) {
  e = e.split(':');
  var errno = +e[0];
  var errName = e[1];
  var defaultMessage = e[2];

  function FilerError(msg, path) {
    Error.call(this);
    this.name = errName;
    this.code = errName;
    this.errno = errno;
    this.message = msg || defaultMessage;

    if (path) {
      this.path = path;
    }

    this.stack = new Error(this.message).stack;
  }

  FilerError.prototype = Object.create(Error.prototype);
  FilerError.prototype.constructor = FilerError;

  FilerError.prototype.toString = function () {
    var pathInfo = this.path ? ', \'' + this.path + '\'' : '';
    return this.name + ': ' + this.message + pathInfo;
  }; // We expose the error as both Errors.EINVAL and Errors[18]


  errors[errName] = errors[errno] = FilerError;
});
module.exports = errors;
},{}],"QMiB":[function(require,module,exports) {
'use strict';

var defaults = require('../constants.js').ENVIRONMENT;

module.exports = function Environment(env) {
  env = env || {};
  env.TMP = env.TMP || defaults.TMP;
  env.PATH = env.PATH || defaults.PATH;

  this.get = function (name) {
    return env[name];
  };

  this.set = function (name, value) {
    env[name] = value;
  };
};
},{"../constants.js":"iJA9"}],"bQx9":[function(require,module,exports) {
module.exports = function (xs, fn) {
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        var x = fn(xs[i], i);
        if (isArray(x)) res.push.apply(res, x);
        else res.push(x);
    }
    return res;
};

var isArray = Array.isArray || function (xs) {
    return Object.prototype.toString.call(xs) === '[object Array]';
};

},{}],"D9yG":[function(require,module,exports) {
'use strict';
module.exports = balanced;
function balanced(a, b, str) {
  if (a instanceof RegExp) a = maybeMatch(a, str);
  if (b instanceof RegExp) b = maybeMatch(b, str);

  var r = range(a, b, str);

  return r && {
    start: r[0],
    end: r[1],
    pre: str.slice(0, r[0]),
    body: str.slice(r[0] + a.length, r[1]),
    post: str.slice(r[1] + b.length)
  };
}

function maybeMatch(reg, str) {
  var m = str.match(reg);
  return m ? m[0] : null;
}

balanced.range = range;
function range(a, b, str) {
  var begs, beg, left, right, result;
  var ai = str.indexOf(a);
  var bi = str.indexOf(b, ai + 1);
  var i = ai;

  if (ai >= 0 && bi > 0) {
    begs = [];
    left = str.length;

    while (i >= 0 && !result) {
      if (i == ai) {
        begs.push(i);
        ai = str.indexOf(a, i + 1);
      } else if (begs.length == 1) {
        result = [ begs.pop(), bi ];
      } else {
        beg = begs.pop();
        if (beg < left) {
          left = beg;
          right = bi;
        }

        bi = str.indexOf(b, i + 1);
      }

      i = ai < bi && ai >= 0 ? ai : bi;
    }

    if (begs.length) {
      result = [ left, right ];
    }
  }

  return result;
}

},{}],"dwXQ":[function(require,module,exports) {
var concatMap = require('concat-map');
var balanced = require('balanced-match');

module.exports = expandTop;

var escSlash = '\0SLASH'+Math.random()+'\0';
var escOpen = '\0OPEN'+Math.random()+'\0';
var escClose = '\0CLOSE'+Math.random()+'\0';
var escComma = '\0COMMA'+Math.random()+'\0';
var escPeriod = '\0PERIOD'+Math.random()+'\0';

function numeric(str) {
  return parseInt(str, 10) == str
    ? parseInt(str, 10)
    : str.charCodeAt(0);
}

function escapeBraces(str) {
  return str.split('\\\\').join(escSlash)
            .split('\\{').join(escOpen)
            .split('\\}').join(escClose)
            .split('\\,').join(escComma)
            .split('\\.').join(escPeriod);
}

function unescapeBraces(str) {
  return str.split(escSlash).join('\\')
            .split(escOpen).join('{')
            .split(escClose).join('}')
            .split(escComma).join(',')
            .split(escPeriod).join('.');
}


// Basically just str.split(","), but handling cases
// where we have nested braced sections, which should be
// treated as individual members, like {a,{b,c},d}
function parseCommaParts(str) {
  if (!str)
    return [''];

  var parts = [];
  var m = balanced('{', '}', str);

  if (!m)
    return str.split(',');

  var pre = m.pre;
  var body = m.body;
  var post = m.post;
  var p = pre.split(',');

  p[p.length-1] += '{' + body + '}';
  var postParts = parseCommaParts(post);
  if (post.length) {
    p[p.length-1] += postParts.shift();
    p.push.apply(p, postParts);
  }

  parts.push.apply(parts, p);

  return parts;
}

function expandTop(str) {
  if (!str)
    return [];

  // I don't know why Bash 4.3 does this, but it does.
  // Anything starting with {} will have the first two bytes preserved
  // but *only* at the top level, so {},a}b will not expand to anything,
  // but a{},b}c will be expanded to [a}c,abc].
  // One could argue that this is a bug in Bash, but since the goal of
  // this module is to match Bash's rules, we escape a leading {}
  if (str.substr(0, 2) === '{}') {
    str = '\\{\\}' + str.substr(2);
  }

  return expand(escapeBraces(str), true).map(unescapeBraces);
}

function identity(e) {
  return e;
}

function embrace(str) {
  return '{' + str + '}';
}
function isPadded(el) {
  return /^-?0\d/.test(el);
}

function lte(i, y) {
  return i <= y;
}
function gte(i, y) {
  return i >= y;
}

function expand(str, isTop) {
  var expansions = [];

  var m = balanced('{', '}', str);
  if (!m || /\$$/.test(m.pre)) return [str];

  var isNumericSequence = /^-?\d+\.\.-?\d+(?:\.\.-?\d+)?$/.test(m.body);
  var isAlphaSequence = /^[a-zA-Z]\.\.[a-zA-Z](?:\.\.-?\d+)?$/.test(m.body);
  var isSequence = isNumericSequence || isAlphaSequence;
  var isOptions = m.body.indexOf(',') >= 0;
  if (!isSequence && !isOptions) {
    // {a},b}
    if (m.post.match(/,.*\}/)) {
      str = m.pre + '{' + m.body + escClose + m.post;
      return expand(str);
    }
    return [str];
  }

  var n;
  if (isSequence) {
    n = m.body.split(/\.\./);
  } else {
    n = parseCommaParts(m.body);
    if (n.length === 1) {
      // x{{a,b}}y ==> x{a}y x{b}y
      n = expand(n[0], false).map(embrace);
      if (n.length === 1) {
        var post = m.post.length
          ? expand(m.post, false)
          : [''];
        return post.map(function(p) {
          return m.pre + n[0] + p;
        });
      }
    }
  }

  // at this point, n is the parts, and we know it's not a comma set
  // with a single entry.

  // no need to expand pre, since it is guaranteed to be free of brace-sets
  var pre = m.pre;
  var post = m.post.length
    ? expand(m.post, false)
    : [''];

  var N;

  if (isSequence) {
    var x = numeric(n[0]);
    var y = numeric(n[1]);
    var width = Math.max(n[0].length, n[1].length)
    var incr = n.length == 3
      ? Math.abs(numeric(n[2]))
      : 1;
    var test = lte;
    var reverse = y < x;
    if (reverse) {
      incr *= -1;
      test = gte;
    }
    var pad = n.some(isPadded);

    N = [];

    for (var i = x; test(i, y); i += incr) {
      var c;
      if (isAlphaSequence) {
        c = String.fromCharCode(i);
        if (c === '\\')
          c = '';
      } else {
        c = String(i);
        if (pad) {
          var need = width - c.length;
          if (need > 0) {
            var z = new Array(need + 1).join('0');
            if (i < 0)
              c = '-' + z + c.slice(1);
            else
              c = z + c;
          }
        }
      }
      N.push(c);
    }
  } else {
    N = concatMap(n, function(el) { return expand(el, false) });
  }

  for (var j = 0; j < N.length; j++) {
    for (var k = 0; k < post.length; k++) {
      var expansion = pre + N[j] + post[k];
      if (!isTop || isSequence || expansion)
        expansions.push(expansion);
    }
  }

  return expansions;
}


},{"concat-map":"bQx9","balanced-match":"D9yG"}],"NtKi":[function(require,module,exports) {
module.exports = minimatch
minimatch.Minimatch = Minimatch

var path = { sep: '/' }
try {
  path = require('path')
} catch (er) {}

var GLOBSTAR = minimatch.GLOBSTAR = Minimatch.GLOBSTAR = {}
var expand = require('brace-expansion')

var plTypes = {
  '!': { open: '(?:(?!(?:', close: '))[^/]*?)'},
  '?': { open: '(?:', close: ')?' },
  '+': { open: '(?:', close: ')+' },
  '*': { open: '(?:', close: ')*' },
  '@': { open: '(?:', close: ')' }
}

// any single thing other than /
// don't need to escape / when using new RegExp()
var qmark = '[^/]'

// * => any number of characters
var star = qmark + '*?'

// ** when dots are allowed.  Anything goes, except .. and .
// not (^ or / followed by one or two dots followed by $ or /),
// followed by anything, any number of times.
var twoStarDot = '(?:(?!(?:\\\/|^)(?:\\.{1,2})($|\\\/)).)*?'

// not a ^ or / followed by a dot,
// followed by anything, any number of times.
var twoStarNoDot = '(?:(?!(?:\\\/|^)\\.).)*?'

// characters that need to be escaped in RegExp.
var reSpecials = charSet('().*{}+?[]^$\\!')

// "abc" -> { a:true, b:true, c:true }
function charSet (s) {
  return s.split('').reduce(function (set, c) {
    set[c] = true
    return set
  }, {})
}

// normalizes slashes.
var slashSplit = /\/+/

minimatch.filter = filter
function filter (pattern, options) {
  options = options || {}
  return function (p, i, list) {
    return minimatch(p, pattern, options)
  }
}

function ext (a, b) {
  a = a || {}
  b = b || {}
  var t = {}
  Object.keys(b).forEach(function (k) {
    t[k] = b[k]
  })
  Object.keys(a).forEach(function (k) {
    t[k] = a[k]
  })
  return t
}

minimatch.defaults = function (def) {
  if (!def || !Object.keys(def).length) return minimatch

  var orig = minimatch

  var m = function minimatch (p, pattern, options) {
    return orig.minimatch(p, pattern, ext(def, options))
  }

  m.Minimatch = function Minimatch (pattern, options) {
    return new orig.Minimatch(pattern, ext(def, options))
  }

  return m
}

Minimatch.defaults = function (def) {
  if (!def || !Object.keys(def).length) return Minimatch
  return minimatch.defaults(def).Minimatch
}

function minimatch (p, pattern, options) {
  if (typeof pattern !== 'string') {
    throw new TypeError('glob pattern string required')
  }

  if (!options) options = {}

  // shortcut: comments match nothing.
  if (!options.nocomment && pattern.charAt(0) === '#') {
    return false
  }

  // "" only matches ""
  if (pattern.trim() === '') return p === ''

  return new Minimatch(pattern, options).match(p)
}

function Minimatch (pattern, options) {
  if (!(this instanceof Minimatch)) {
    return new Minimatch(pattern, options)
  }

  if (typeof pattern !== 'string') {
    throw new TypeError('glob pattern string required')
  }

  if (!options) options = {}
  pattern = pattern.trim()

  // windows support: need to use /, not \
  if (path.sep !== '/') {
    pattern = pattern.split(path.sep).join('/')
  }

  this.options = options
  this.set = []
  this.pattern = pattern
  this.regexp = null
  this.negate = false
  this.comment = false
  this.empty = false

  // make the set of regexps etc.
  this.make()
}

Minimatch.prototype.debug = function () {}

Minimatch.prototype.make = make
function make () {
  // don't do it more than once.
  if (this._made) return

  var pattern = this.pattern
  var options = this.options

  // empty patterns and comments match nothing.
  if (!options.nocomment && pattern.charAt(0) === '#') {
    this.comment = true
    return
  }
  if (!pattern) {
    this.empty = true
    return
  }

  // step 1: figure out negation, etc.
  this.parseNegate()

  // step 2: expand braces
  var set = this.globSet = this.braceExpand()

  if (options.debug) this.debug = console.error

  this.debug(this.pattern, set)

  // step 3: now we have a set, so turn each one into a series of path-portion
  // matching patterns.
  // These will be regexps, except in the case of "**", which is
  // set to the GLOBSTAR object for globstar behavior,
  // and will not contain any / characters
  set = this.globParts = set.map(function (s) {
    return s.split(slashSplit)
  })

  this.debug(this.pattern, set)

  // glob --> regexps
  set = set.map(function (s, si, set) {
    return s.map(this.parse, this)
  }, this)

  this.debug(this.pattern, set)

  // filter out everything that didn't compile properly.
  set = set.filter(function (s) {
    return s.indexOf(false) === -1
  })

  this.debug(this.pattern, set)

  this.set = set
}

Minimatch.prototype.parseNegate = parseNegate
function parseNegate () {
  var pattern = this.pattern
  var negate = false
  var options = this.options
  var negateOffset = 0

  if (options.nonegate) return

  for (var i = 0, l = pattern.length
    ; i < l && pattern.charAt(i) === '!'
    ; i++) {
    negate = !negate
    negateOffset++
  }

  if (negateOffset) this.pattern = pattern.substr(negateOffset)
  this.negate = negate
}

// Brace expansion:
// a{b,c}d -> abd acd
// a{b,}c -> abc ac
// a{0..3}d -> a0d a1d a2d a3d
// a{b,c{d,e}f}g -> abg acdfg acefg
// a{b,c}d{e,f}g -> abdeg acdeg abdeg abdfg
//
// Invalid sets are not expanded.
// a{2..}b -> a{2..}b
// a{b}c -> a{b}c
minimatch.braceExpand = function (pattern, options) {
  return braceExpand(pattern, options)
}

Minimatch.prototype.braceExpand = braceExpand

function braceExpand (pattern, options) {
  if (!options) {
    if (this instanceof Minimatch) {
      options = this.options
    } else {
      options = {}
    }
  }

  pattern = typeof pattern === 'undefined'
    ? this.pattern : pattern

  if (typeof pattern === 'undefined') {
    throw new TypeError('undefined pattern')
  }

  if (options.nobrace ||
    !pattern.match(/\{.*\}/)) {
    // shortcut. no need to expand.
    return [pattern]
  }

  return expand(pattern)
}

// parse a component of the expanded set.
// At this point, no pattern may contain "/" in it
// so we're going to return a 2d array, where each entry is the full
// pattern, split on '/', and then turned into a regular expression.
// A regexp is made at the end which joins each array with an
// escaped /, and another full one which joins each regexp with |.
//
// Following the lead of Bash 4.1, note that "**" only has special meaning
// when it is the *only* thing in a path portion.  Otherwise, any series
// of * is equivalent to a single *.  Globstar behavior is enabled by
// default, and can be disabled by setting options.noglobstar.
Minimatch.prototype.parse = parse
var SUBPARSE = {}
function parse (pattern, isSub) {
  if (pattern.length > 1024 * 64) {
    throw new TypeError('pattern is too long')
  }

  var options = this.options

  // shortcuts
  if (!options.noglobstar && pattern === '**') return GLOBSTAR
  if (pattern === '') return ''

  var re = ''
  var hasMagic = !!options.nocase
  var escaping = false
  // ? => one single character
  var patternListStack = []
  var negativeLists = []
  var stateChar
  var inClass = false
  var reClassStart = -1
  var classStart = -1
  // . and .. never match anything that doesn't start with .,
  // even when options.dot is set.
  var patternStart = pattern.charAt(0) === '.' ? '' // anything
  // not (start or / followed by . or .. followed by / or end)
  : options.dot ? '(?!(?:^|\\\/)\\.{1,2}(?:$|\\\/))'
  : '(?!\\.)'
  var self = this

  function clearStateChar () {
    if (stateChar) {
      // we had some state-tracking character
      // that wasn't consumed by this pass.
      switch (stateChar) {
        case '*':
          re += star
          hasMagic = true
        break
        case '?':
          re += qmark
          hasMagic = true
        break
        default:
          re += '\\' + stateChar
        break
      }
      self.debug('clearStateChar %j %j', stateChar, re)
      stateChar = false
    }
  }

  for (var i = 0, len = pattern.length, c
    ; (i < len) && (c = pattern.charAt(i))
    ; i++) {
    this.debug('%s\t%s %s %j', pattern, i, re, c)

    // skip over any that are escaped.
    if (escaping && reSpecials[c]) {
      re += '\\' + c
      escaping = false
      continue
    }

    switch (c) {
      case '/':
        // completely not allowed, even escaped.
        // Should already be path-split by now.
        return false

      case '\\':
        clearStateChar()
        escaping = true
      continue

      // the various stateChar values
      // for the "extglob" stuff.
      case '?':
      case '*':
      case '+':
      case '@':
      case '!':
        this.debug('%s\t%s %s %j <-- stateChar', pattern, i, re, c)

        // all of those are literals inside a class, except that
        // the glob [!a] means [^a] in regexp
        if (inClass) {
          this.debug('  in class')
          if (c === '!' && i === classStart + 1) c = '^'
          re += c
          continue
        }

        // if we already have a stateChar, then it means
        // that there was something like ** or +? in there.
        // Handle the stateChar, then proceed with this one.
        self.debug('call clearStateChar %j', stateChar)
        clearStateChar()
        stateChar = c
        // if extglob is disabled, then +(asdf|foo) isn't a thing.
        // just clear the statechar *now*, rather than even diving into
        // the patternList stuff.
        if (options.noext) clearStateChar()
      continue

      case '(':
        if (inClass) {
          re += '('
          continue
        }

        if (!stateChar) {
          re += '\\('
          continue
        }

        patternListStack.push({
          type: stateChar,
          start: i - 1,
          reStart: re.length,
          open: plTypes[stateChar].open,
          close: plTypes[stateChar].close
        })
        // negation is (?:(?!js)[^/]*)
        re += stateChar === '!' ? '(?:(?!(?:' : '(?:'
        this.debug('plType %j %j', stateChar, re)
        stateChar = false
      continue

      case ')':
        if (inClass || !patternListStack.length) {
          re += '\\)'
          continue
        }

        clearStateChar()
        hasMagic = true
        var pl = patternListStack.pop()
        // negation is (?:(?!js)[^/]*)
        // The others are (?:<pattern>)<type>
        re += pl.close
        if (pl.type === '!') {
          negativeLists.push(pl)
        }
        pl.reEnd = re.length
      continue

      case '|':
        if (inClass || !patternListStack.length || escaping) {
          re += '\\|'
          escaping = false
          continue
        }

        clearStateChar()
        re += '|'
      continue

      // these are mostly the same in regexp and glob
      case '[':
        // swallow any state-tracking char before the [
        clearStateChar()

        if (inClass) {
          re += '\\' + c
          continue
        }

        inClass = true
        classStart = i
        reClassStart = re.length
        re += c
      continue

      case ']':
        //  a right bracket shall lose its special
        //  meaning and represent itself in
        //  a bracket expression if it occurs
        //  first in the list.  -- POSIX.2 2.8.3.2
        if (i === classStart + 1 || !inClass) {
          re += '\\' + c
          escaping = false
          continue
        }

        // handle the case where we left a class open.
        // "[z-a]" is valid, equivalent to "\[z-a\]"
        if (inClass) {
          // split where the last [ was, make sure we don't have
          // an invalid re. if so, re-walk the contents of the
          // would-be class to re-translate any characters that
          // were passed through as-is
          // TODO: It would probably be faster to determine this
          // without a try/catch and a new RegExp, but it's tricky
          // to do safely.  For now, this is safe and works.
          var cs = pattern.substring(classStart + 1, i)
          try {
            RegExp('[' + cs + ']')
          } catch (er) {
            // not a valid class!
            var sp = this.parse(cs, SUBPARSE)
            re = re.substr(0, reClassStart) + '\\[' + sp[0] + '\\]'
            hasMagic = hasMagic || sp[1]
            inClass = false
            continue
          }
        }

        // finish up the class.
        hasMagic = true
        inClass = false
        re += c
      continue

      default:
        // swallow any state char that wasn't consumed
        clearStateChar()

        if (escaping) {
          // no need
          escaping = false
        } else if (reSpecials[c]
          && !(c === '^' && inClass)) {
          re += '\\'
        }

        re += c

    } // switch
  } // for

  // handle the case where we left a class open.
  // "[abc" is valid, equivalent to "\[abc"
  if (inClass) {
    // split where the last [ was, and escape it
    // this is a huge pita.  We now have to re-walk
    // the contents of the would-be class to re-translate
    // any characters that were passed through as-is
    cs = pattern.substr(classStart + 1)
    sp = this.parse(cs, SUBPARSE)
    re = re.substr(0, reClassStart) + '\\[' + sp[0]
    hasMagic = hasMagic || sp[1]
  }

  // handle the case where we had a +( thing at the *end*
  // of the pattern.
  // each pattern list stack adds 3 chars, and we need to go through
  // and escape any | chars that were passed through as-is for the regexp.
  // Go through and escape them, taking care not to double-escape any
  // | chars that were already escaped.
  for (pl = patternListStack.pop(); pl; pl = patternListStack.pop()) {
    var tail = re.slice(pl.reStart + pl.open.length)
    this.debug('setting tail', re, pl)
    // maybe some even number of \, then maybe 1 \, followed by a |
    tail = tail.replace(/((?:\\{2}){0,64})(\\?)\|/g, function (_, $1, $2) {
      if (!$2) {
        // the | isn't already escaped, so escape it.
        $2 = '\\'
      }

      // need to escape all those slashes *again*, without escaping the
      // one that we need for escaping the | character.  As it works out,
      // escaping an even number of slashes can be done by simply repeating
      // it exactly after itself.  That's why this trick works.
      //
      // I am sorry that you have to see this.
      return $1 + $1 + $2 + '|'
    })

    this.debug('tail=%j\n   %s', tail, tail, pl, re)
    var t = pl.type === '*' ? star
      : pl.type === '?' ? qmark
      : '\\' + pl.type

    hasMagic = true
    re = re.slice(0, pl.reStart) + t + '\\(' + tail
  }

  // handle trailing things that only matter at the very end.
  clearStateChar()
  if (escaping) {
    // trailing \\
    re += '\\\\'
  }

  // only need to apply the nodot start if the re starts with
  // something that could conceivably capture a dot
  var addPatternStart = false
  switch (re.charAt(0)) {
    case '.':
    case '[':
    case '(': addPatternStart = true
  }

  // Hack to work around lack of negative lookbehind in JS
  // A pattern like: *.!(x).!(y|z) needs to ensure that a name
  // like 'a.xyz.yz' doesn't match.  So, the first negative
  // lookahead, has to look ALL the way ahead, to the end of
  // the pattern.
  for (var n = negativeLists.length - 1; n > -1; n--) {
    var nl = negativeLists[n]

    var nlBefore = re.slice(0, nl.reStart)
    var nlFirst = re.slice(nl.reStart, nl.reEnd - 8)
    var nlLast = re.slice(nl.reEnd - 8, nl.reEnd)
    var nlAfter = re.slice(nl.reEnd)

    nlLast += nlAfter

    // Handle nested stuff like *(*.js|!(*.json)), where open parens
    // mean that we should *not* include the ) in the bit that is considered
    // "after" the negated section.
    var openParensBefore = nlBefore.split('(').length - 1
    var cleanAfter = nlAfter
    for (i = 0; i < openParensBefore; i++) {
      cleanAfter = cleanAfter.replace(/\)[+*?]?/, '')
    }
    nlAfter = cleanAfter

    var dollar = ''
    if (nlAfter === '' && isSub !== SUBPARSE) {
      dollar = '$'
    }
    var newRe = nlBefore + nlFirst + nlAfter + dollar + nlLast
    re = newRe
  }

  // if the re is not "" at this point, then we need to make sure
  // it doesn't match against an empty path part.
  // Otherwise a/* will match a/, which it should not.
  if (re !== '' && hasMagic) {
    re = '(?=.)' + re
  }

  if (addPatternStart) {
    re = patternStart + re
  }

  // parsing just a piece of a larger pattern.
  if (isSub === SUBPARSE) {
    return [re, hasMagic]
  }

  // skip the regexp for non-magical patterns
  // unescape anything in it, though, so that it'll be
  // an exact match against a file etc.
  if (!hasMagic) {
    return globUnescape(pattern)
  }

  var flags = options.nocase ? 'i' : ''
  try {
    var regExp = new RegExp('^' + re + '$', flags)
  } catch (er) {
    // If it was an invalid regular expression, then it can't match
    // anything.  This trick looks for a character after the end of
    // the string, which is of course impossible, except in multi-line
    // mode, but it's not a /m regex.
    return new RegExp('$.')
  }

  regExp._glob = pattern
  regExp._src = re

  return regExp
}

minimatch.makeRe = function (pattern, options) {
  return new Minimatch(pattern, options || {}).makeRe()
}

Minimatch.prototype.makeRe = makeRe
function makeRe () {
  if (this.regexp || this.regexp === false) return this.regexp

  // at this point, this.set is a 2d array of partial
  // pattern strings, or "**".
  //
  // It's better to use .match().  This function shouldn't
  // be used, really, but it's pretty convenient sometimes,
  // when you just want to work with a regex.
  var set = this.set

  if (!set.length) {
    this.regexp = false
    return this.regexp
  }
  var options = this.options

  var twoStar = options.noglobstar ? star
    : options.dot ? twoStarDot
    : twoStarNoDot
  var flags = options.nocase ? 'i' : ''

  var re = set.map(function (pattern) {
    return pattern.map(function (p) {
      return (p === GLOBSTAR) ? twoStar
      : (typeof p === 'string') ? regExpEscape(p)
      : p._src
    }).join('\\\/')
  }).join('|')

  // must match entire pattern
  // ending in a * or ** will make it less strict.
  re = '^(?:' + re + ')$'

  // can match anything, as long as it's not this.
  if (this.negate) re = '^(?!' + re + ').*$'

  try {
    this.regexp = new RegExp(re, flags)
  } catch (ex) {
    this.regexp = false
  }
  return this.regexp
}

minimatch.match = function (list, pattern, options) {
  options = options || {}
  var mm = new Minimatch(pattern, options)
  list = list.filter(function (f) {
    return mm.match(f)
  })
  if (mm.options.nonull && !list.length) {
    list.push(pattern)
  }
  return list
}

Minimatch.prototype.match = match
function match (f, partial) {
  this.debug('match', f, this.pattern)
  // short-circuit in the case of busted things.
  // comments, etc.
  if (this.comment) return false
  if (this.empty) return f === ''

  if (f === '/' && partial) return true

  var options = this.options

  // windows: need to use /, not \
  if (path.sep !== '/') {
    f = f.split(path.sep).join('/')
  }

  // treat the test path as a set of pathparts.
  f = f.split(slashSplit)
  this.debug(this.pattern, 'split', f)

  // just ONE of the pattern sets in this.set needs to match
  // in order for it to be valid.  If negating, then just one
  // match means that we have failed.
  // Either way, return on the first hit.

  var set = this.set
  this.debug(this.pattern, 'set', set)

  // Find the basename of the path by looking for the last non-empty segment
  var filename
  var i
  for (i = f.length - 1; i >= 0; i--) {
    filename = f[i]
    if (filename) break
  }

  for (i = 0; i < set.length; i++) {
    var pattern = set[i]
    var file = f
    if (options.matchBase && pattern.length === 1) {
      file = [filename]
    }
    var hit = this.matchOne(file, pattern, partial)
    if (hit) {
      if (options.flipNegate) return true
      return !this.negate
    }
  }

  // didn't get any hits.  this is success if it's a negative
  // pattern, failure otherwise.
  if (options.flipNegate) return false
  return this.negate
}

// set partial to true to test if, for example,
// "/a/b" matches the start of "/*/b/*/d"
// Partial means, if you run out of file before you run
// out of pattern, then that's fine, as long as all
// the parts match.
Minimatch.prototype.matchOne = function (file, pattern, partial) {
  var options = this.options

  this.debug('matchOne',
    { 'this': this, file: file, pattern: pattern })

  this.debug('matchOne', file.length, pattern.length)

  for (var fi = 0,
      pi = 0,
      fl = file.length,
      pl = pattern.length
      ; (fi < fl) && (pi < pl)
      ; fi++, pi++) {
    this.debug('matchOne loop')
    var p = pattern[pi]
    var f = file[fi]

    this.debug(pattern, p, f)

    // should be impossible.
    // some invalid regexp stuff in the set.
    if (p === false) return false

    if (p === GLOBSTAR) {
      this.debug('GLOBSTAR', [pattern, p, f])

      // "**"
      // a/**/b/**/c would match the following:
      // a/b/x/y/z/c
      // a/x/y/z/b/c
      // a/b/x/b/x/c
      // a/b/c
      // To do this, take the rest of the pattern after
      // the **, and see if it would match the file remainder.
      // If so, return success.
      // If not, the ** "swallows" a segment, and try again.
      // This is recursively awful.
      //
      // a/**/b/**/c matching a/b/x/y/z/c
      // - a matches a
      // - doublestar
      //   - matchOne(b/x/y/z/c, b/**/c)
      //     - b matches b
      //     - doublestar
      //       - matchOne(x/y/z/c, c) -> no
      //       - matchOne(y/z/c, c) -> no
      //       - matchOne(z/c, c) -> no
      //       - matchOne(c, c) yes, hit
      var fr = fi
      var pr = pi + 1
      if (pr === pl) {
        this.debug('** at the end')
        // a ** at the end will just swallow the rest.
        // We have found a match.
        // however, it will not swallow /.x, unless
        // options.dot is set.
        // . and .. are *never* matched by **, for explosively
        // exponential reasons.
        for (; fi < fl; fi++) {
          if (file[fi] === '.' || file[fi] === '..' ||
            (!options.dot && file[fi].charAt(0) === '.')) return false
        }
        return true
      }

      // ok, let's see if we can swallow whatever we can.
      while (fr < fl) {
        var swallowee = file[fr]

        this.debug('\nglobstar while', file, fr, pattern, pr, swallowee)

        // XXX remove this slice.  Just pass the start index.
        if (this.matchOne(file.slice(fr), pattern.slice(pr), partial)) {
          this.debug('globstar found match!', fr, fl, swallowee)
          // found a match.
          return true
        } else {
          // can't swallow "." or ".." ever.
          // can only swallow ".foo" when explicitly asked.
          if (swallowee === '.' || swallowee === '..' ||
            (!options.dot && swallowee.charAt(0) === '.')) {
            this.debug('dot detected!', file, fr, pattern, pr)
            break
          }

          // ** swallows a segment, and continue.
          this.debug('globstar swallow a segment, and continue')
          fr++
        }
      }

      // no match was found.
      // However, in partial mode, we can't say this is necessarily over.
      // If there's more *pattern* left, then
      if (partial) {
        // ran out of file
        this.debug('\n>>> no match, partial?', file, fr, pattern, pr)
        if (fr === fl) return true
      }
      return false
    }

    // something other than **
    // non-magic patterns just have to match exactly
    // patterns with magic have been turned into regexps.
    var hit
    if (typeof p === 'string') {
      if (options.nocase) {
        hit = f.toLowerCase() === p.toLowerCase()
      } else {
        hit = f === p
      }
      this.debug('string match', p, f, hit)
    } else {
      hit = f.match(p)
      this.debug('pattern match', p, f, hit)
    }

    if (!hit) return false
  }

  // Note: ending in / means that we'll get a final ""
  // at the end of the pattern.  This can only match a
  // corresponding "" at the end of the file.
  // If the file ends in /, then it can only match a
  // a pattern that ends in /, unless the pattern just
  // doesn't have any more for it. But, a/b/ should *not*
  // match "a/b/*", even though "" matches against the
  // [^/]*? pattern, except in partial mode, where it might
  // simply not be reached yet.
  // However, a/b/ should still satisfy a/*

  // now either we fell off the end of the pattern, or we're done.
  if (fi === fl && pi === pl) {
    // ran out of pattern and filename at the same time.
    // an exact hit!
    return true
  } else if (fi === fl) {
    // ran out of file, but still had pattern left.
    // this is ok if we're doing the match as part of
    // a glob fs traversal.
    return partial
  } else if (pi === pl) {
    // ran out of pattern, still have file left.
    // this is only acceptable if we're on the very last
    // empty segment of a file with a trailing slash.
    // a/* should match a/b/
    var emptyFileEnd = (fi === fl - 1) && (file[fi] === '')
    return emptyFileEnd
  }

  // should be unreachable.
  throw new Error('wtf?')
}

// replace stuff like \* with *
function globUnescape (s) {
  return s.replace(/\\(.)/g, '$1')
}

function regExpEscape (s) {
  return s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
}

},{"path":"UUq2","brace-expansion":"dwXQ"}],"D1Ra":[function(require,module,exports) {
var _require = require('es6-promisify'),
    promisify = _require.promisify;

var Path = require('../path.js');

var Errors = require('../errors.js');

var Environment = require('./environment.js');

var async = require('../../lib/async.js');

var minimatch = require('minimatch');

function Shell(fs, options) {
  var _this = this;

  options = options || {};
  var env = new Environment(options.env);
  var cwd = '/';
  /**
   * The bound FileSystem (cannot be changed)
   */

  Object.defineProperty(this, 'fs', {
    get: function get() {
      return fs;
    },
    enumerable: true
  });
  /**
   * The shell's environment (e.g., for things like
   * path, tmp, and other env vars). Use env.get()
   * and env.set() to work with variables.
   */

  Object.defineProperty(this, 'env', {
    get: function get() {
      return env;
    },
    enumerable: true
  });
  /**
   * Change the current working directory. We
   * include `cd` on the `this` vs. proto so that
   * we can access cwd without exposing it externally.
   */

  this.cd = function (path, callback) {
    path = Path.resolve(cwd, path); // Make sure the path actually exists, and is a dir

    fs.stat(path, function (err, stats) {
      if (err) {
        callback(new Errors.ENOTDIR(null, path));
        return;
      }

      if (stats.type === 'DIRECTORY') {
        cwd = path;
        callback();
      } else {
        callback(new Errors.ENOTDIR(null, path));
      }
    });
  };
  /**
   * Get the current working directory (changed with `cd()`)
   */


  this.pwd = function () {
    return cwd;
  };

  this.promises = {};
  /**
  * Public API for Shell converted to Promise based
  */

  ['cd', 'exec', 'touch', 'cat', 'ls', 'rm', 'tempDir', 'mkdirp', 'find'].forEach(function (methodName) {
    _this.promises[methodName] = promisify(_this[methodName].bind(_this));
  });
}
/**
 * Execute the .js command located at `path`. Such commands
 * should assume the existence of 3 arguments, which will be
 * defined at runtime:
 *
 *   * fs - the current shell's bound filesystem object
 *   * args - a list of arguments for the command, or an empty list if none
 *   * callback - a callback function(error, result) to call when done.
 *
 * The .js command's contents should be the body of a function
 * that looks like this:
 *
 * function(fs, args, callback) {
 *   // .js code here
 * }
 */


Shell.prototype.exec = function (path, args, callback) {
  /* jshint evil:true */
  var sh = this;
  var fs = sh.fs;

  if (typeof args === 'function') {
    callback = args;
    args = [];
  }

  args = args || [];

  callback = callback || function () {};

  path = Path.resolve(sh.pwd(), path);
  fs.readFile(path, 'utf8', function (error, data) {
    if (error) {
      callback(error);
      return;
    }

    try {
      var cmd = new Function('fs', 'args', 'callback', data);
      cmd(fs, args, callback);
    } catch (e) {
      callback(e);
    }
  });
};
/**
 * Create a file if it does not exist, or update access and
 * modified times if it does. Valid options include:
 *
 *  * updateOnly - whether to create the file if missing (defaults to false)
 *  * date - use the provided Date value instead of current date/time
 */


Shell.prototype.touch = function (path, options, callback) {
  var sh = this;
  var fs = sh.fs;

  if (typeof options === 'function') {
    callback = options;
    options = {};
  }

  options = options || {};

  callback = callback || function () {};

  path = Path.resolve(sh.pwd(), path);

  function createFile(path) {
    fs.writeFile(path, '', callback);
  }

  function updateTimes(path) {
    var now = Date.now();
    var atime = options.date || now;
    var mtime = options.date || now;
    fs.utimes(path, atime, mtime, callback);
  }

  fs.stat(path, function (error) {
    if (error) {
      if (options.updateOnly === true) {
        callback();
      } else {
        createFile(path);
      }
    } else {
      updateTimes(path);
    }
  });
};
/**
 * Concatenate multiple files into a single String, with each
 * file separated by a newline. The `files` argument should
 * be a String (path to single file) or an Array of Strings
 * (multiple file paths).
 */


Shell.prototype.cat = function (files, callback) {
  var sh = this;
  var fs = sh.fs;
  var all = '';

  callback = callback || function () {};

  if (!files) {
    callback(new Errors.EINVAL('Missing files argument'));
    return;
  }

  files = typeof files === 'string' ? [files] : files;

  function append(item, callback) {
    var filename = Path.resolve(sh.pwd(), item);
    fs.readFile(filename, 'utf8', function (error, data) {
      if (error) {
        callback(error);
        return;
      }

      all += data + '\n';
      callback();
    });
  }

  async.eachSeries(files, append, function (error) {
    if (error) {
      callback(error);
    } else {
      callback(null, all.replace(/\n$/, ''));
    }
  });
};
/**
 * Get the listing of a directory, returning an array of
 * file entries in the following form:
 *
 * {
 *   path: <String> the basename of the directory entry
 *   links: <Number> the number of links to the entry
 *   size: <Number> the size in bytes of the entry
 *   modified: <Number> the last modified date/time
 *   type: <String> the type of the entry
 *   contents: <Array> an optional array of child entries
 * }
 *
 * By default ls() gives a shallow listing. If you want
 * to follow directories as they are encountered, use
 * the `recursive=true` option.
 */


Shell.prototype.ls = function (dir, options, callback) {
  var sh = this;
  var fs = sh.fs;

  if (typeof options === 'function') {
    callback = options;
    options = {};
  }

  options = options || {};

  callback = callback || function () {};

  if (!dir) {
    callback(new Errors.EINVAL('Missing dir argument'));
    return;
  }

  function list(path, callback) {
    var pathname = Path.resolve(sh.pwd(), path);
    var result = [];
    fs.readdir(pathname, function (error, entries) {
      if (error) {
        callback(error);
        return;
      }

      function getDirEntry(name, callback) {
        name = Path.join(pathname, name);
        fs.stat(name, function (error, stats) {
          if (error) {
            callback(error);
            return;
          }

          var entry = stats;

          if (options.recursive && stats.type === 'DIRECTORY') {
            list(Path.join(pathname, entry.name), function (error, items) {
              if (error) {
                callback(error);
                return;
              }

              entry.contents = items;
              result.push(entry);
              callback();
            });
          } else {
            result.push(entry);
            callback();
          }
        });
      }

      async.eachSeries(entries, getDirEntry, function (error) {
        callback(error, result);
      });
    });
  }

  list(dir, callback);
};
/**
 * Removes the file or directory at `path`. If `path` is a file
 * it will be removed. If `path` is a directory, it will be
 * removed if it is empty, otherwise the callback will receive
 * an error. In order to remove non-empty directories, use the
 * `recursive=true` option.
 */


Shell.prototype.rm = function (path, options, callback) {
  var sh = this;
  var fs = sh.fs;

  if (typeof options === 'function') {
    callback = options;
    options = {};
  }

  options = options || {};

  callback = callback || function () {};

  if (!path) {
    callback(new Errors.EINVAL('Missing path argument'));
    return;
  }

  function remove(pathname, callback) {
    pathname = Path.resolve(sh.pwd(), pathname);
    fs.stat(pathname, function (error, stats) {
      if (error) {
        callback(error);
        return;
      } // If this is a file, delete it and we're done


      if (stats.type === 'FILE') {
        fs.unlink(pathname, callback);
        return;
      } // If it's a dir, check if it's empty


      fs.readdir(pathname, function (error, entries) {
        if (error) {
          callback(error);
          return;
        } // If dir is empty, delete it and we're done


        if (entries.length === 0) {
          fs.rmdir(pathname, callback);
          return;
        } // If not, see if we're allowed to delete recursively


        if (!options.recursive) {
          callback(new Errors.ENOTEMPTY(null, pathname));
          return;
        } // Remove each dir entry recursively, then delete the dir.


        entries = entries.map(function (filename) {
          // Root dir entries absolutely
          return Path.join(pathname, filename);
        });
        async.eachSeries(entries, remove, function (error) {
          if (error) {
            callback(error);
            return;
          }

          fs.rmdir(pathname, callback);
        });
      });
    });
  }

  remove(path, callback);
};
/**
 * Gets the path to the temporary directory, creating it if not
 * present. The directory used is the one specified in
 * env.TMP. The callback receives (error, tempDirName).
 */


Shell.prototype.tempDir = function (callback) {
  var sh = this;
  var fs = sh.fs;
  var tmp = sh.env.get('TMP');

  callback = callback || function () {}; // Try and create it, and it will either work or fail
  // but either way it's now there.


  fs.mkdir(tmp, function () {
    callback(null, tmp);
  });
};
/**
 * Recursively creates the directory at `path`. If the parent
 * of `path` does not exist, it will be created.
 * Based off EnsureDir by Sam X. Xu
 * https://www.npmjs.org/package/ensureDir
 * MIT License
 */


Shell.prototype.mkdirp = function (path, callback) {
  var sh = this;
  var fs = sh.fs;

  callback = callback || function () {};

  if (!path) {
    callback(new Errors.EINVAL('Missing path argument'));
    return;
  }

  path = Path.resolve(sh.pwd(), path);

  if (path === '/') {
    callback();
    return;
  }

  function _mkdirp(path, callback) {
    fs.stat(path, function (err, stat) {
      if (stat) {
        if (stat.isDirectory()) {
          callback();
          return;
        } else if (stat.isFile()) {
          callback(new Errors.ENOTDIR(null, path));
          return;
        }
      } else if (err && err.code !== 'ENOENT') {
        callback(err);
        return;
      } else {
        var parent = Path.dirname(path);

        if (parent === '/') {
          fs.mkdir(path, function (err) {
            if (err && err.code !== 'EEXIST') {
              callback(err);
              return;
            }

            callback();
            return;
          });
        } else {
          _mkdirp(parent, function (err) {
            if (err) return callback(err);
            fs.mkdir(path, function (err) {
              if (err && err.code !== 'EEXIST') {
                callback(err);
                return;
              }

              callback();
              return;
            });
          });
        }
      }
    });
  }

  _mkdirp(path, callback);
};
/**
 * Recursively walk a directory tree, reporting back all paths
 * that were found along the way. The `path` must be a dir.
 * Valid options include a `regex` for pattern matching paths
 * and an `exec` function of the form `function(path, next)` where
 * `path` is the current path that was found (dir paths have an '/'
 * appended) and `next` is a callback to call when done processing
 * the current path, passing any error object back as the first argument.
 * `find` returns a flat array of absolute paths for all matching/found
 * paths as the final argument to the callback.
 */


Shell.prototype.find = function (path, options, callback) {
  var sh = this;
  var fs = sh.fs;

  if (typeof options === 'function') {
    callback = options;
    options = {};
  }

  options = options || {};

  callback = callback || function () {};

  var exec = options.exec || function (path, next) {
    next();
  };

  var found = [];

  if (!path) {
    callback(new Errors.EINVAL('Missing path argument'));
    return;
  }

  function processPath(path, callback) {
    exec(path, function (err) {
      if (err) {
        callback(err);
        return;
      }

      found.push(path);
      callback();
    });
  }

  function maybeProcessPath(path, callback) {
    // Test the path against the user's regex, name, path primaries (if any)
    // and remove any trailing slashes added previously.
    var rawPath = Path.removeTrailing(path); // Check entire path against provided regex, if any

    if (options.regex && !options.regex.test(rawPath)) {
      callback();
      return;
    } // Check basename for matches against name primary, if any


    if (options.name && !minimatch(Path.basename(rawPath), options.name)) {
      callback();
      return;
    } // Check dirname for matches against path primary, if any


    if (options.path && !minimatch(Path.dirname(rawPath), options.path)) {
      callback();
      return;
    }

    processPath(path, callback);
  }

  function walk(path, callback) {
    path = Path.resolve(sh.pwd(), path); // The path is either a file or dir, and instead of doing
    // a stat() to determine it first, we just try to readdir()
    // and it will either work or not, and we handle the non-dir error.

    fs.readdir(path, function (err, entries) {
      if (err) {
        if (err.code === 'ENOTDIR'
        /* file case, ignore error */
        ) {
            maybeProcessPath(path, callback);
          } else {
          callback(err);
        }

        return;
      } // Path is really a dir, add a trailing / and report it found


      maybeProcessPath(Path.addTrailing(path), function (err) {
        if (err) {
          callback(err);
          return;
        }

        entries = entries.map(function (entry) {
          return Path.join(path, entry);
        });
        async.eachSeries(entries, walk, function (err) {
          callback(err, found);
        });
      });
    });
  } // Make sure we are starting with a dir path


  fs.stat(path, function (err, stats) {
    if (err) {
      callback(err);
      return;
    }

    if (!stats.isDirectory()) {
      callback(new Errors.ENOTDIR(null, path));
      return;
    }

    walk(path, callback);
  });
};

module.exports = Shell;
},{"es6-promisify":"c0Ea","../path.js":"UzoP","../errors.js":"p8GN","./environment.js":"QMiB","../../lib/async.js":"u4Zs","minimatch":"NtKi"}],"J4Qg":[function(require,module,exports) {
// Based on https://github.com/diy/intercom.js/blob/master/lib/events.js
// Copyright 2012 DIY Co Apache License, Version 2.0
// http://www.apache.org/licenses/LICENSE-2.0
function removeItem(item, array) {
  for (var i = array.length - 1; i >= 0; i--) {
    if (array[i] === item) {
      array.splice(i, 1);
    }
  }

  return array;
}

var EventEmitter = function EventEmitter() {};

EventEmitter.createInterface = function (space) {
  var methods = {};

  methods.on = function (name, fn) {
    if (typeof this[space] === 'undefined') {
      this[space] = {};
    }

    if (!this[space].hasOwnProperty(name)) {
      this[space][name] = [];
    }

    this[space][name].push(fn);
  };

  methods.off = function (name, fn) {
    if (typeof this[space] === 'undefined') return;

    if (this[space].hasOwnProperty(name)) {
      removeItem(fn, this[space][name]);
    }
  };

  methods.trigger = function (name) {
    if (typeof this[space] !== 'undefined' && this[space].hasOwnProperty(name)) {
      var args = Array.prototype.slice.call(arguments, 1);

      for (var i = 0; i < this[space][name].length; i++) {
        this[space][name][i].apply(this[space][name][i], args);
      }
    }
  };

  methods.removeAllListeners = function (name) {
    if (typeof this[space] === 'undefined') return;
    var self = this;
    self[space][name].forEach(function (fn) {
      self.off(name, fn);
    });
  };

  return methods;
};

var pvt = EventEmitter.createInterface('_handlers');
EventEmitter.prototype._on = pvt.on;
EventEmitter.prototype._off = pvt.off;
EventEmitter.prototype._trigger = pvt.trigger;
var pub = EventEmitter.createInterface('handlers');

EventEmitter.prototype.on = function () {
  pub.on.apply(this, arguments);
  Array.prototype.unshift.call(arguments, 'on');

  this._trigger.apply(this, arguments);
};

EventEmitter.prototype.off = pub.off;
EventEmitter.prototype.trigger = pub.trigger;
EventEmitter.prototype.removeAllListeners = pub.removeAllListeners;
module.exports = EventEmitter;
},{}],"zBMa":[function(require,module,exports) {
function generateRandom(template) {
  return template.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0,
        v = c === 'x' ? r : r & 0x3 | 0x8;
    return v.toString(16);
  });
}

function guid() {
  return generateRandom('xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx').toUpperCase();
}
/**
 * Generate a string of n random characters.  Defaults to n=6.
 */


function randomChars(n) {
  n = n || 6;
  var template = 'x'.repeat(n);
  return generateRandom(template);
}

function nop() {}

module.exports = {
  guid: guid,
  nop: nop,
  randomChars: randomChars
};
},{}],"u7Jv":[function(require,module,exports) {
var global = arguments[3];
function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

// Based on https://github.com/diy/intercom.js/blob/master/lib/intercom.js
// Copyright 2012 DIY Co Apache License, Version 2.0
// http://www.apache.org/licenses/LICENSE-2.0
var EventEmitter = require('./eventemitter.js');

var guid = require('../src/shared.js').guid;

function throttle(delay, fn) {
  var last = 0;
  return function () {
    var now = Date.now();

    if (now - last > delay) {
      last = now;
      fn.apply(this, arguments);
    }
  };
}

function extend(a, b) {
  if (typeof a === 'undefined' || !a) {
    a = {};
  }

  if (_typeof(b) === 'object') {
    for (var key in b) {
      if (b.hasOwnProperty(key)) {
        a[key] = b[key];
      }
    }
  }

  return a;
}

var localStorage = function (window) {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return {
      getItem: function getItem() {},
      setItem: function setItem() {},
      removeItem: function removeItem() {}
    };
  }

  return window.localStorage;
}(global);

function Intercom() {
  var self = this;
  var now = Date.now();
  this.origin = guid();
  this.lastMessage = now;
  this.receivedIDs = {};
  this.previousValues = {};

  var storageHandler = function storageHandler() {
    self._onStorageEvent.apply(self, arguments);
  }; // If we're in node.js, skip event registration


  if (typeof document === 'undefined') {
    return;
  }

  if (document.attachEvent) {
    document.attachEvent('onstorage', storageHandler);
  } else {
    global.addEventListener('storage', storageHandler, false);
  }
}

Intercom.prototype._transaction = function (fn) {
  var TIMEOUT = 1000;
  var WAIT = 20;
  var self = this;
  var executed = false;
  var listening = false;
  var waitTimer = null;

  function lock() {
    if (executed) {
      return;
    }

    var now = Date.now();
    var activeLock = localStorage.getItem(INDEX_LOCK) | 0;

    if (activeLock && now - activeLock < TIMEOUT) {
      if (!listening) {
        self._on('storage', lock);

        listening = true;
      }

      waitTimer = setTimeout(lock, WAIT);
      return;
    }

    executed = true;
    localStorage.setItem(INDEX_LOCK, now);
    fn();
    unlock();
  }

  function unlock() {
    if (listening) {
      self._off('storage', lock);
    }

    if (waitTimer) {
      clearTimeout(waitTimer);
    }

    localStorage.removeItem(INDEX_LOCK);
  }

  lock();
};

Intercom.prototype._cleanup_emit = throttle(100, function () {
  var self = this;

  self._transaction(function () {
    var now = Date.now();
    var threshold = now - THRESHOLD_TTL_EMIT;
    var changed = 0;
    var messages;

    try {
      messages = JSON.parse(localStorage.getItem(INDEX_EMIT) || '[]');
    } catch (e) {
      messages = [];
    }

    for (var i = messages.length - 1; i >= 0; i--) {
      if (messages[i].timestamp < threshold) {
        messages.splice(i, 1);
        changed++;
      }
    }

    if (changed > 0) {
      localStorage.setItem(INDEX_EMIT, JSON.stringify(messages));
    }
  });
});
Intercom.prototype._cleanup_once = throttle(100, function () {
  var self = this;

  self._transaction(function () {
    var timestamp, ttl, key;
    var table;
    var now = Date.now();
    var changed = 0;

    try {
      table = JSON.parse(localStorage.getItem(INDEX_ONCE) || '{}');
    } catch (e) {
      table = {};
    }

    for (key in table) {
      if (self._once_expired(key, table)) {
        delete table[key];
        changed++;
      }
    }

    if (changed > 0) {
      localStorage.setItem(INDEX_ONCE, JSON.stringify(table));
    }
  });
});

Intercom.prototype._once_expired = function (key, table) {
  if (!table) {
    return true;
  }

  if (!table.hasOwnProperty(key)) {
    return true;
  }

  if (_typeof(table[key]) !== 'object') {
    return true;
  }

  var ttl = table[key].ttl || THRESHOLD_TTL_ONCE;
  var now = Date.now();
  var timestamp = table[key].timestamp;
  return timestamp < now - ttl;
};

Intercom.prototype._localStorageChanged = function (event, field) {
  if (event && event.key) {
    return event.key === field;
  }

  var currentValue = localStorage.getItem(field);

  if (currentValue === this.previousValues[field]) {
    return false;
  }

  this.previousValues[field] = currentValue;
  return true;
};

Intercom.prototype._onStorageEvent = function (event) {
  event = event || global.event;
  var self = this;

  if (this._localStorageChanged(event, INDEX_EMIT)) {
    this._transaction(function () {
      var now = Date.now();
      var data = localStorage.getItem(INDEX_EMIT);
      var messages;

      try {
        messages = JSON.parse(data || '[]');
      } catch (e) {
        messages = [];
      }

      for (var i = 0; i < messages.length; i++) {
        if (messages[i].origin === self.origin) continue;
        if (messages[i].timestamp < self.lastMessage) continue;

        if (messages[i].id) {
          if (self.receivedIDs.hasOwnProperty(messages[i].id)) continue;
          self.receivedIDs[messages[i].id] = true;
        }

        self.trigger(messages[i].name, messages[i].payload);
      }

      self.lastMessage = now;
    });
  }

  this._trigger('storage', event);
};

Intercom.prototype._emit = function (name, message, id) {
  id = typeof id === 'string' || typeof id === 'number' ? String(id) : null;

  if (id && id.length) {
    if (this.receivedIDs.hasOwnProperty(id)) return;
    this.receivedIDs[id] = true;
  }

  var packet = {
    id: id,
    name: name,
    origin: this.origin,
    timestamp: Date.now(),
    payload: message
  };
  var self = this;

  this._transaction(function () {
    var data = localStorage.getItem(INDEX_EMIT) || '[]';
    var delimiter = data === '[]' ? '' : ',';
    data = [data.substring(0, data.length - 1), delimiter, JSON.stringify(packet), ']'].join('');
    localStorage.setItem(INDEX_EMIT, data);
    self.trigger(name, message);
    setTimeout(function () {
      self._cleanup_emit();
    }, 50);
  });
};

Intercom.prototype.emit = function (name, message) {
  this._emit.apply(this, arguments);

  this._trigger('emit', name, message);
};

Intercom.prototype.once = function (key, fn, ttl) {
  if (!Intercom.supported) {
    return;
  }

  var self = this;

  this._transaction(function () {
    var data;

    try {
      data = JSON.parse(localStorage.getItem(INDEX_ONCE) || '{}');
    } catch (e) {
      data = {};
    }

    if (!self._once_expired(key, data)) {
      return;
    }

    data[key] = {};
    data[key].timestamp = Date.now();

    if (typeof ttl === 'number') {
      data[key].ttl = ttl * 1000;
    }

    localStorage.setItem(INDEX_ONCE, JSON.stringify(data));
    fn();
    setTimeout(function () {
      self._cleanup_once();
    }, 50);
  });
};

extend(Intercom.prototype, EventEmitter.prototype);
Intercom.supported = typeof localStorage !== 'undefined';
var INDEX_EMIT = 'intercom';
var INDEX_ONCE = 'intercom_once';
var INDEX_LOCK = 'intercom_lock';
var THRESHOLD_TTL_EMIT = 50000;
var THRESHOLD_TTL_ONCE = 1000 * 3600;

Intercom.destroy = function () {
  localStorage.removeItem(INDEX_LOCK);
  localStorage.removeItem(INDEX_EMIT);
  localStorage.removeItem(INDEX_ONCE);
};

Intercom.getInstance = function () {
  var intercom;
  return function () {
    if (!intercom) {
      intercom = new Intercom();
    }

    return intercom;
  };
}();

module.exports = Intercom;
},{"./eventemitter.js":"J4Qg","../src/shared.js":"zBMa"}],"VLEe":[function(require,module,exports) {
'using strict';

var EventEmitter = require('../lib/eventemitter.js');

var Path = require('./path.js');

var Intercom = require('../lib/intercom.js');
/**
 * FSWatcher based on node.js' FSWatcher
 * see https://github.com/joyent/node/blob/master/lib/fs.js
 */


function FSWatcher() {
  EventEmitter.call(this);
  var self = this;
  var recursive = false;
  var recursivePathPrefix;
  var filename;

  function onchange(path) {
    // Watch for exact filename, or parent path when recursive is true.
    if (filename === path || recursive && path.indexOf(recursivePathPrefix) === 0) {
      self.trigger('change', 'change', path);
    }
  } // We support, but ignore the second arg, which node.js uses.


  self.start = function (filename_, persistent_, recursive_) {
    // Bail if we've already started (and therefore have a filename);
    if (filename) {
      return;
    }

    if (Path.isNull(filename_)) {
      throw new Error('Path must be a string without null bytes.');
    } // TODO: get realpath for symlinks on filename...
    // Filer's Path.normalize strips trailing slashes, which we use here.
    // See https://github.com/js-platform/filer/issues/105


    filename = Path.normalize(filename_); // Whether to watch beneath this path or not

    recursive = recursive_ === true; // If recursive, construct a path prefix portion for comparisons later
    // (i.e., '/path' becomes '/path/' so we can search within a filename for the
    // prefix). We also take care to allow for '/' on its own.

    if (recursive) {
      recursivePathPrefix = filename === '/' ? '/' : filename + '/';
    }

    var intercom = Intercom.getInstance();
    intercom.on('change', onchange);
  };

  self.close = function () {
    var intercom = Intercom.getInstance();
    intercom.off('change', onchange);
    self.removeAllListeners('change');
  };
}

FSWatcher.prototype = new EventEmitter();
FSWatcher.prototype.constructor = FSWatcher;
module.exports = FSWatcher;
},{"../lib/eventemitter.js":"J4Qg","./path.js":"UzoP","../lib/intercom.js":"u7Jv"}],"ZECt":[function(require,module,exports) {
var NODE_TYPE_FILE = require('./constants.js').NODE_TYPE_FILE;

module.exports = function DirectoryEntry(id, type) {
  this.id = id;
  this.type = type || NODE_TYPE_FILE;
};
},{"./constants.js":"iJA9"}],"osLK":[function(require,module,exports) {
var _require = require('./constants'),
    FIRST_DESCRIPTOR = _require.FIRST_DESCRIPTOR;

var openFiles = {};
/**
 * Start at FIRST_DESCRIPTOR and go until we find
 * an empty file descriptor, then return it.
 */

var getEmptyDescriptor = function getEmptyDescriptor() {
  var fd = FIRST_DESCRIPTOR;

  while (getOpenFileDescription(fd)) {
    fd++;
  }

  return fd;
};
/**
 * Look up the open file description object for a given
 * file descriptor.
 */


var getOpenFileDescription = function getOpenFileDescription(ofd) {
  return openFiles[ofd];
};
/**
 * Allocate a new file descriptor for the given
 * open file description. 
 */


var allocDescriptor = function allocDescriptor(openFileDescription) {
  var ofd = getEmptyDescriptor();
  openFiles[ofd] = openFileDescription;
  return ofd;
};
/**
 * Release the given existing file descriptor created
 * with allocDescriptor(). 
 */


var releaseDescriptor = function releaseDescriptor(ofd) {
  return delete openFiles[ofd];
};

module.exports = {
  allocDescriptor: allocDescriptor,
  releaseDescriptor: releaseDescriptor,
  getOpenFileDescription: getOpenFileDescription
};
},{"./constants":"iJA9"}],"KKNo":[function(require,module,exports) {
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var _require = require('./constants'),
    NODE_TYPE_FILE = _require.NODE_TYPE_FILE,
    NODE_TYPE_DIRECTORY = _require.NODE_TYPE_DIRECTORY,
    NODE_TYPE_SYMBOLIC_LINK = _require.NODE_TYPE_SYMBOLIC_LINK,
    DEFAULT_FILE_PERMISSIONS = _require.DEFAULT_FILE_PERMISSIONS,
    DEFAULT_DIR_PERMISSIONS = _require.DEFAULT_DIR_PERMISSIONS;

var _require$fsConstants = require('./constants').fsConstants,
    S_IFREG = _require$fsConstants.S_IFREG,
    S_IFDIR = _require$fsConstants.S_IFDIR,
    S_IFLNK = _require$fsConstants.S_IFLNK;
/**
 * Make sure the options object has an id on property,
 * either from caller or one we generate using supplied guid fn.
 */


function ensureID(options, prop, callback) {
  if (options[prop]) {
    return callback();
  }

  options.guid(function (err, id) {
    if (err) {
      return callback(err);
    }

    options[prop] = id;
    callback();
  });
}
/**
 * Generate a POSIX mode (integer) for the node type and permissions.
 * Use default permissions if we aren't passed any.
 */


function generateMode(nodeType, modePermissions) {
  switch (nodeType) {
    case NODE_TYPE_DIRECTORY:
      return (modePermissions || DEFAULT_DIR_PERMISSIONS) | S_IFDIR;

    case NODE_TYPE_SYMBOLIC_LINK:
      return (modePermissions || DEFAULT_FILE_PERMISSIONS) | S_IFLNK;

    case NODE_TYPE_FILE: // falls through

    default:
      return (modePermissions || DEFAULT_FILE_PERMISSIONS) | S_IFREG;
  }
}
/**
 * Common properties for the layout of a Node
 */


var Node = /*#__PURE__*/function () {
  function Node(options) {
    _classCallCheck(this, Node);

    var now = Date.now();
    this.id = options.id;
    this.data = options.data; // id for data object

    this.size = options.size || 0; // size (bytes for files, entries for directories)

    this.atime = options.atime || now; // access time (will mirror ctime after creation)

    this.ctime = options.ctime || now; // creation/change time

    this.mtime = options.mtime || now; // modified time

    this.flags = options.flags || []; // file flags

    this.xattrs = options.xattrs || {}; // extended attributes

    this.nlinks = options.nlinks || 0; // links count
    // Historically, Filer's node layout has referred to the
    // node type as `mode`, and done so using a String.  In
    // a POSIX filesystem, the mode is a number that combines
    // both node type and permission bits. Internal we use `type`,
    // but store it in the database as `mode` for backward
    // compatibility.

    if (typeof options.type === 'string') {
      this.type = options.type;
    } else if (typeof options.mode === 'string') {
      this.type = options.mode;
    } else {
      this.type = NODE_TYPE_FILE;
    } // Extra mode permissions and ownership info


    this.permissions = options.permissions || generateMode(this.type);
    this.uid = options.uid || 0x0; // owner name

    this.gid = options.gid || 0x0; // group name
  }
  /**
   * Serialize a Node to JSON.  Everything is as expected except
   * that we use `mode` for `type` to maintain backward compatibility.
   */


  _createClass(Node, [{
    key: "toJSON",
    value: function toJSON() {
      return {
        id: this.id,
        data: this.data,
        size: this.size,
        atime: this.atime,
        ctime: this.ctime,
        mtime: this.ctime,
        flags: this.flags,
        xattrs: this.xattrs,
        nlinks: this.nlinks,
        // Use `mode` for `type` to keep backward compatibility
        mode: this.type,
        permissions: this.permissions,
        uid: this.uid,
        gid: this.gid
      };
    } // Return complete POSIX `mode` for node type + permissions. See:
    // http://man7.org/linux/man-pages/man2/chmod.2.html

  }, {
    key: "mode",
    get: function get() {
      return generateMode(this.type, this.permissions);
    } // When setting the `mode` we assume permissions bits only (not changing type)
    ,
    set: function set(value) {
      this.permissions = value;
    }
  }]);

  return Node;
}();

module.exports.create = function create(options, callback) {
  // We expect both options.id and options.data to be provided/generated.
  ensureID(options, 'id', function (err) {
    if (err) {
      return callback(err);
    }

    ensureID(options, 'data', function (err) {
      if (err) {
        return callback(err);
      }

      callback(null, new Node(options));
    });
  });
};
},{"./constants":"iJA9"}],"XWaV":[function(require,module,exports) {
var Errors = require('./errors.js');

var Node = require('./node');

function OpenFileDescription(path, id, flags, position) {
  this.path = path;
  this.id = id;
  this.flags = flags;
  this.position = position;
} // Tries to find the node associated with an ofd's `id`.
// If not found, an error is returned on the callback.


OpenFileDescription.prototype.getNode = function (context, callback) {
  var id = this.id;
  var path = this.path;

  function check_if_node_exists(error, node) {
    if (error) {
      return callback(error);
    }

    if (!node) {
      return callback(new Errors.EBADF('file descriptor refers to unknown node', path));
    }

    Node.create(node, callback);
  }

  context.getObject(id, check_if_node_exists);
};

module.exports = OpenFileDescription;
},{"./errors.js":"p8GN","./node":"KKNo"}],"JEp0":[function(require,module,exports) {
var Constants = require('./constants.js');

function SuperNode(options) {
  var now = Date.now();
  this.id = Constants.SUPER_NODE_ID;
  this.type = Constants.NODE_TYPE_META;
  this.atime = options.atime || now;
  this.ctime = options.ctime || now;
  this.mtime = options.mtime || now; // root node id (randomly generated)

  this.rnode = options.rnode;
}

SuperNode.create = function (options, callback) {
  options.guid(function (err, rnode) {
    if (err) {
      callback(err);
      return;
    }

    options.rnode = options.rnode || rnode;
    callback(null, new SuperNode(options));
  });
};

module.exports = SuperNode;
},{"./constants.js":"iJA9"}],"dsCT":[function(require,module,exports) {
'use strict';

var Constants = require('./constants.js');

var Path = require('./path.js');

function dateFromMs(ms) {
  return new Date(Number(ms));
}

function Stats(path, fileNode, devName) {
  this.dev = devName;
  this.node = fileNode.id;
  this.type = fileNode.type;
  this.size = fileNode.size;
  this.nlinks = fileNode.nlinks; // Date objects

  this.atime = dateFromMs(fileNode.atime);
  this.mtime = dateFromMs(fileNode.mtime);
  this.ctime = dateFromMs(fileNode.ctime); // Unix timestamp MS Numbers

  this.atimeMs = fileNode.atime;
  this.mtimeMs = fileNode.mtime;
  this.ctimeMs = fileNode.ctime;
  this.version = fileNode.version;
  this.mode = fileNode.mode;
  this.uid = fileNode.uid;
  this.gid = fileNode.gid;
  this.name = Path.basename(path);
}

Stats.prototype.isFile = function () {
  return this.type === Constants.NODE_TYPE_FILE;
};

Stats.prototype.isDirectory = function () {
  return this.type === Constants.NODE_TYPE_DIRECTORY;
};

Stats.prototype.isSymbolicLink = function () {
  return this.type === Constants.NODE_TYPE_SYMBOLIC_LINK;
}; // These will always be false in Filer.


Stats.prototype.isSocket = Stats.prototype.isFIFO = Stats.prototype.isCharacterDevice = Stats.prototype.isBlockDevice = function () {
  return false;
};

module.exports = Stats;
},{"./constants.js":"iJA9","./path.js":"UzoP"}],"bsBG":[function(require,module,exports) {
var Buffer = require("buffer").Buffer;
function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var Path = require('../path.js');

var normalize = Path.normalize;
var dirname = Path.dirname;
var basename = Path.basename;
var isAbsolutePath = Path.isAbsolute;

var shared = require('../shared.js');

var Constants = require('../constants.js');

var NODE_TYPE_FILE = Constants.NODE_TYPE_FILE;
var NODE_TYPE_DIRECTORY = Constants.NODE_TYPE_DIRECTORY;
var NODE_TYPE_SYMBOLIC_LINK = Constants.NODE_TYPE_SYMBOLIC_LINK;
var NODE_TYPE_META = Constants.NODE_TYPE_META;
var FULL_READ_WRITE_EXEC_PERMISSIONS = Constants.FULL_READ_WRITE_EXEC_PERMISSIONS;
var ROOT_DIRECTORY_NAME = Constants.ROOT_DIRECTORY_NAME;
var SUPER_NODE_ID = Constants.SUPER_NODE_ID;
var SYMLOOP_MAX = Constants.SYMLOOP_MAX;
var O_READ = Constants.O_READ;
var O_WRITE = Constants.O_WRITE;
var O_CREATE = Constants.O_CREATE;
var O_EXCLUSIVE = Constants.O_EXCLUSIVE;
var O_APPEND = Constants.O_APPEND;
var O_FLAGS = Constants.O_FLAGS;
var XATTR_CREATE = Constants.XATTR_CREATE;
var XATTR_REPLACE = Constants.XATTR_REPLACE;
var FS_NOMTIME = Constants.FS_NOMTIME;
var FS_NOCTIME = Constants.FS_NOCTIME;

var Errors = require('../errors.js');

var DirectoryEntry = require('../directory-entry.js');

var openFiles = require('../open-files.js');

var OpenFileDescription = require('../open-file-description.js');

var SuperNode = require('../super-node.js');

var Node = require('../node.js');

var Stats = require('../stats.js');
/**
 * Update node times. Only passed times are modified (undefined times are ignored)
 * and filesystem flags are examined in order to override update logic.
 */


function update_node_times(context, path, node, times, callback) {
  // Honour mount flags for how we update times
  var flags = context.flags;

  if (flags.includes(FS_NOCTIME)) {
    delete times.ctime;
  }

  if (flags.includes(FS_NOMTIME)) {
    delete times.mtime;
  } // Only do the update if required (i.e., times are still present)


  var update = false;

  if (times.ctime) {
    node.ctime = times.ctime; // We don't do atime tracking for perf reasons, but do mirror ctime

    node.atime = times.ctime;
    update = true;
  }

  if (times.atime) {
    // The only time we explicitly pass atime is when utimes(), futimes() is called.
    // Override ctime mirror here if so
    node.atime = times.atime;
    update = true;
  }

  if (times.mtime) {
    node.mtime = times.mtime;
    update = true;
  }

  function complete(error) {
    // Queue this change so we can send watch events.
    // Unlike node.js, we send the full path vs. basename/dirname only.
    context.changes.push({
      event: 'change',
      path: path
    });
    callback(error);
  }

  if (update) {
    context.putObject(node.id, node, complete);
  } else {
    complete();
  }
}
/**
 * make_node()
 */
// in: file or directory path
// out: new node representing file/directory


function make_node(context, path, type, callback) {
  if (type !== NODE_TYPE_DIRECTORY && type !== NODE_TYPE_FILE) {
    return callback(new Errors.EINVAL('type must be a directory or file', path));
  }

  path = normalize(path);
  var name = basename(path);
  var parentPath = dirname(path);
  var parentNode;
  var parentNodeData;
  var node; // Check if the parent node exists

  function create_node_in_parent(error, parentDirectoryNode) {
    if (error) {
      callback(error);
    } else if (parentDirectoryNode.type !== NODE_TYPE_DIRECTORY) {
      callback(new Errors.ENOTDIR('a component of the path prefix is not a directory', path));
    } else {
      parentNode = parentDirectoryNode;
      find_node(context, path, check_if_node_exists);
    }
  } // Check if the node to be created already exists


  function check_if_node_exists(error, result) {
    if (!error && result) {
      callback(new Errors.EEXIST('path name already exists', path));
    } else if (error && !(error instanceof Errors.ENOENT)) {
      callback(error);
    } else {
      context.getObject(parentNode.data, create_node);
    }
  } // Create the new node


  function create_node(error, result) {
    if (error) {
      callback(error);
    } else {
      parentNodeData = result;
      Node.create({
        guid: context.guid,
        type: type
      }, function (error, result) {
        if (error) {
          callback(error);
          return;
        }

        node = result;
        node.nlinks += 1;
        context.putObject(node.id, node, update_parent_node_data);
      });
    }
  } // Update parent node time


  function update_time(error) {
    if (error) {
      callback(error);
    } else {
      var now = Date.now();
      update_node_times(context, parentPath, node, {
        mtime: now,
        ctime: now
      }, callback);
    }
  } // Update the parent nodes data


  function update_parent_node_data(error) {
    if (error) {
      callback(error);
    } else {
      parentNodeData[name] = new DirectoryEntry(node.id, type);
      context.putObject(parentNode.data, parentNodeData, update_time);
    }
  } // Find the parent node


  find_node(context, parentPath, create_node_in_parent);
}
/**
 * find_node
 */
// in: file or directory path
// out: node structure, or error


function find_node(context, path, callback) {
  path = normalize(path);

  if (!path) {
    return callback(new Errors.ENOENT('path is an empty string'));
  }

  var name = basename(path);
  var parentPath = dirname(path);
  var followedCount = 0;

  function read_root_directory_node(error, nodeData) {
    if (error) {
      return callback(error);
    } // Parse existing node as SuperNode


    var superNode = new SuperNode(nodeData);

    if (!superNode || superNode.type !== NODE_TYPE_META || !superNode.rnode) {
      callback(new Errors.EFILESYSTEMERROR());
    } else {
      context.getObject(superNode.rnode, check_root_directory_node);
    }
  }

  function check_root_directory_node(error, rootDirectoryNode) {
    if (error) {
      callback(error);
    } else if (!rootDirectoryNode) {
      callback(new Errors.ENOENT());
    } else {
      Node.create(rootDirectoryNode, callback);
    }
  } // in: parent directory node
  // out: parent directory data


  function read_parent_directory_data(error, parentDirectoryNode) {
    if (error) {
      callback(error);
    } else if (parentDirectoryNode.type !== NODE_TYPE_DIRECTORY || !parentDirectoryNode.data) {
      callback(new Errors.ENOTDIR('a component of the path prefix is not a directory', path));
    } else {
      context.getObject(parentDirectoryNode.data, get_node_from_parent_directory_data);
    }
  } // in: parent directory data
  // out: searched node


  function get_node_from_parent_directory_data(error, parentDirectoryData) {
    if (error) {
      callback(error);
    } else {
      if (!Object.prototype.hasOwnProperty.call(parentDirectoryData, name)) {
        callback(new Errors.ENOENT(null, path));
      } else {
        var nodeId = parentDirectoryData[name].id;
        context.getObject(nodeId, create_node);
      }
    }
  }

  function create_node(error, data) {
    if (error) {
      return callback(error);
    }

    Node.create(data, is_symbolic_link);
  }

  function is_symbolic_link(error, node) {
    if (error) {
      callback(error);
    } else {
      if (node.type === NODE_TYPE_SYMBOLIC_LINK) {
        followedCount++;

        if (followedCount > SYMLOOP_MAX) {
          callback(new Errors.ELOOP(null, path));
        } else {
          follow_symbolic_link(node.data);
        }
      } else {
        callback(null, node);
      }
    }
  }

  function follow_symbolic_link(data) {
    data = normalize(data);
    parentPath = dirname(data);
    name = basename(data);

    if (ROOT_DIRECTORY_NAME === name) {
      context.getObject(SUPER_NODE_ID, read_root_directory_node);
    } else {
      find_node(context, parentPath, read_parent_directory_data);
    }
  }

  if (ROOT_DIRECTORY_NAME === name) {
    context.getObject(SUPER_NODE_ID, read_root_directory_node);
  } else {
    find_node(context, parentPath, read_parent_directory_data);
  }
}
/**
 * set extended attribute (refactor)
 */


function set_extended_attribute(context, path, node, name, value, flag, callback) {
  function update_time(error) {
    if (error) {
      callback(error);
    } else {
      update_node_times(context, path, node, {
        ctime: Date.now()
      }, callback);
    }
  }

  var xattrs = node.xattrs;

  if (flag === XATTR_CREATE && Object.prototype.hasOwnProperty.call(xattrs, name)) {
    callback(new Errors.EEXIST('attribute already exists', path));
  } else if (flag === XATTR_REPLACE && !Object.prototype.hasOwnProperty.call(xattrs, name)) {
    callback(new Errors.ENOATTR(null, path));
  } else {
    xattrs[name] = value;
    context.putObject(node.id, node, update_time);
  }
}
/**
 * ensure_root_directory. Creates a root node if necessary.
 *
 * Note: this should only be invoked when formatting a new file system.
 * Multiple invocations of this by separate instances will still result
 * in only a single super node.
 */


function ensure_root_directory(context, callback) {
  var superNode;
  var directoryNode;
  var directoryData;

  function ensure_super_node(error, existingNode) {
    if (!error && existingNode) {
      // Another instance has beat us and already created the super node.
      callback();
    } else if (error && !(error instanceof Errors.ENOENT)) {
      callback(error);
    } else {
      SuperNode.create({
        guid: context.guid
      }, function (error, result) {
        if (error) {
          callback(error);
          return;
        }

        superNode = result;
        context.putObject(superNode.id, superNode, write_directory_node);
      });
    }
  }

  function write_directory_node(error) {
    if (error) {
      callback(error);
    } else {
      Node.create({
        guid: context.guid,
        id: superNode.rnode,
        type: NODE_TYPE_DIRECTORY
      }, function (error, result) {
        if (error) {
          callback(error);
          return;
        }

        directoryNode = result;
        directoryNode.nlinks += 1;
        context.putObject(directoryNode.id, directoryNode, write_directory_data);
      });
    }
  }

  function write_directory_data(error) {
    if (error) {
      callback(error);
    } else {
      directoryData = {};
      context.putObject(directoryNode.data, directoryData, callback);
    }
  }

  context.getObject(SUPER_NODE_ID, ensure_super_node);
}
/**
 * make_directory
 */


function make_directory(context, path, callback) {
  path = normalize(path);
  var name = basename(path);
  var parentPath = dirname(path);
  var directoryNode;
  var directoryData;
  var parentDirectoryNode;
  var parentDirectoryData;

  function check_if_directory_exists(error, result) {
    if (!error && result) {
      callback(new Errors.EEXIST(null, path));
    } else if (error && !(error instanceof Errors.ENOENT)) {
      callback(error);
    } else {
      find_node(context, parentPath, read_parent_directory_data);
    }
  }

  function read_parent_directory_data(error, result) {
    if (error) {
      callback(error);
    } else {
      parentDirectoryNode = result;
      context.getObject(parentDirectoryNode.data, write_directory_node);
    }
  }

  function write_directory_node(error, result) {
    if (error) {
      callback(error);
    } else {
      parentDirectoryData = result;
      Node.create({
        guid: context.guid,
        type: NODE_TYPE_DIRECTORY
      }, function (error, result) {
        if (error) {
          callback(error);
          return;
        }

        directoryNode = result;
        directoryNode.nlinks += 1;
        context.putObject(directoryNode.id, directoryNode, write_directory_data);
      });
    }
  }

  function write_directory_data(error) {
    if (error) {
      callback(error);
    } else {
      directoryData = {};
      context.putObject(directoryNode.data, directoryData, update_parent_directory_data);
    }
  }

  function update_time(error) {
    if (error) {
      callback(error);
    } else {
      var now = Date.now();
      update_node_times(context, parentPath, parentDirectoryNode, {
        mtime: now,
        ctime: now
      }, callback);
    }
  }

  function update_parent_directory_data(error) {
    if (error) {
      callback(error);
    } else {
      parentDirectoryData[name] = new DirectoryEntry(directoryNode.id, NODE_TYPE_DIRECTORY);
      context.putObject(parentDirectoryNode.data, parentDirectoryData, update_time);
    }
  }

  find_node(context, path, check_if_directory_exists);
}

function access_file(context, path, mode, callback) {
  var _Constants$fsConstant = Constants.fsConstants,
      F_OK = _Constants$fsConstant.F_OK,
      R_OK = _Constants$fsConstant.R_OK,
      W_OK = _Constants$fsConstant.W_OK,
      X_OK = _Constants$fsConstant.X_OK,
      S_IXUSR = _Constants$fsConstant.S_IXUSR,
      S_IXGRP = _Constants$fsConstant.S_IXGRP,
      S_IXOTH = _Constants$fsConstant.S_IXOTH;
  path = normalize(path);
  find_node(context, path, function (err, node) {
    if (err) {
      return callback(err);
    } // If we have a node, F_OK is true.


    if (mode === F_OK) {
      return callback(null);
    }

    var st_mode = validateAndMaskMode(node.mode, callback);
    if (!st_mode) return; // For any other combo of F_OK, R_OK, W_OK, always allow. Filer user is a root user,
    // so existing files are always OK, readable, and writable

    if (mode & (R_OK | W_OK)) {
      return callback(null);
    } // For the case of X_OK, actually check if this file is executable


    if (mode & X_OK && st_mode & (S_IXUSR | S_IXGRP | S_IXOTH)) {
      return callback(null);
    } // In any other case, the file isn't accessible


    callback(new Errors.EACCES('permission denied', path));
  });
}
/**
 * remove_directory
 */


function remove_directory(context, path, callback) {
  path = normalize(path);
  var name = basename(path);
  var parentPath = dirname(path);
  var directoryNode;
  var directoryData;
  var parentDirectoryNode;
  var parentDirectoryData;

  function read_parent_directory_data(error, result) {
    if (error) {
      callback(error);
    } else {
      parentDirectoryNode = result;
      context.getObject(parentDirectoryNode.data, check_if_node_exists);
    }
  }

  function check_if_node_exists(error, result) {
    if (error) {
      callback(error);
    } else if (ROOT_DIRECTORY_NAME === name) {
      callback(new Errors.EBUSY(null, path));
    } else if (!Object.prototype.hasOwnProperty.call(result, name)) {
      callback(new Errors.ENOENT(null, path));
    } else {
      parentDirectoryData = result;
      directoryNode = parentDirectoryData[name].id;
      context.getObject(directoryNode, check_if_node_is_directory);
    }
  }

  function check_if_node_is_directory(error, result) {
    if (error) {
      callback(error);
    } else if (result.type !== NODE_TYPE_DIRECTORY) {
      callback(new Errors.ENOTDIR(null, path));
    } else {
      directoryNode = result;
      context.getObject(directoryNode.data, check_if_directory_is_empty);
    }
  }

  function check_if_directory_is_empty(error, result) {
    if (error) {
      callback(error);
    } else {
      directoryData = result;

      if (Object.keys(directoryData).length > 0) {
        callback(new Errors.ENOTEMPTY(null, path));
      } else {
        remove_directory_entry_from_parent_directory_node();
      }
    }
  }

  function update_time(error) {
    if (error) {
      callback(error);
    } else {
      var now = Date.now();
      update_node_times(context, parentPath, parentDirectoryNode, {
        mtime: now,
        ctime: now
      }, remove_directory_node);
    }
  }

  function remove_directory_entry_from_parent_directory_node() {
    delete parentDirectoryData[name];
    context.putObject(parentDirectoryNode.data, parentDirectoryData, update_time);
  }

  function remove_directory_node(error) {
    if (error) {
      callback(error);
    } else {
      context.delete(directoryNode.id, remove_directory_data);
    }
  }

  function remove_directory_data(error) {
    if (error) {
      callback(error);
    } else {
      context.delete(directoryNode.data, callback);
    }
  }

  find_node(context, parentPath, read_parent_directory_data);
}

function open_file(context, path, flags, mode, callback) {
  if (typeof mode === 'function') {
    callback = mode;
    mode = null;
  }

  path = normalize(path);
  var name = basename(path);
  var parentPath = dirname(path);
  var directoryNode;
  var directoryData;
  var directoryEntry;
  var fileNode;
  var fileData;
  var followedCount = 0;

  if (ROOT_DIRECTORY_NAME === name) {
    if (flags.includes(O_WRITE)) {
      callback(new Errors.EISDIR('the named file is a directory and O_WRITE is set', path));
    } else {
      find_node(context, path, set_file_node);
    }
  } else {
    find_node(context, parentPath, read_directory_data);
  }

  function read_directory_data(error, result) {
    if (error) {
      callback(error);
    } else if (result.type !== NODE_TYPE_DIRECTORY) {
      callback(new Errors.ENOENT(null, path));
    } else {
      directoryNode = result;
      context.getObject(directoryNode.data, check_if_file_exists);
    }
  }

  function check_if_file_exists(error, result) {
    if (error) {
      callback(error);
    } else {
      directoryData = result;

      if (Object.prototype.hasOwnProperty.call(directoryData, name)) {
        if (flags.includes(O_EXCLUSIVE)) {
          callback(new Errors.EEXIST('O_CREATE and O_EXCLUSIVE are set, and the named file exists', path));
        } else {
          directoryEntry = directoryData[name];

          if (directoryEntry.type === NODE_TYPE_DIRECTORY && flags.includes(O_WRITE)) {
            callback(new Errors.EISDIR('the named file is a directory and O_WRITE is set', path));
          } else {
            context.getObject(directoryEntry.id, check_if_symbolic_link);
          }
        }
      } else {
        if (!flags.includes(O_CREATE)) {
          callback(new Errors.ENOENT('O_CREATE is not set and the named file does not exist', path));
        } else {
          write_file_node();
        }
      }
    }
  }

  function check_if_symbolic_link(error, result) {
    if (error) {
      callback(error);
    } else {
      var node = result;

      if (node.type === NODE_TYPE_SYMBOLIC_LINK) {
        followedCount++;

        if (followedCount > SYMLOOP_MAX) {
          callback(new Errors.ELOOP(null, path));
        } else {
          follow_symbolic_link(node.data);
        }
      } else {
        set_file_node(undefined, node);
      }
    }
  }

  function follow_symbolic_link(data) {
    data = normalize(data);
    parentPath = dirname(data);
    name = basename(data);

    if (ROOT_DIRECTORY_NAME === name) {
      if (flags.includes(O_WRITE)) {
        callback(new Errors.EISDIR('the named file is a directory and O_WRITE is set', path));
      } else {
        find_node(context, path, set_file_node);
      }
    }

    find_node(context, parentPath, read_directory_data);
  }

  function set_file_node(error, result) {
    if (error) {
      callback(error);
    } else {
      fileNode = result;
      callback(null, fileNode);
    }
  }

  function write_file_node() {
    Node.create({
      guid: context.guid,
      type: NODE_TYPE_FILE
    }, function (error, result) {
      if (error) {
        callback(error);
        return;
      }

      fileNode = result;
      fileNode.nlinks += 1;

      if (mode) {
        fileNode.mode = mode;
      }

      context.putObject(fileNode.id, fileNode, write_file_data);
    });
  }

  function write_file_data(error) {
    if (error) {
      callback(error);
    } else {
      fileData = Buffer.alloc(0);
      context.putBuffer(fileNode.data, fileData, update_directory_data);
    }
  }

  function update_time(error) {
    if (error) {
      callback(error);
    } else {
      var now = Date.now();
      update_node_times(context, parentPath, directoryNode, {
        mtime: now,
        ctime: now
      }, handle_update_result);
    }
  }

  function update_directory_data(error) {
    if (error) {
      callback(error);
    } else {
      directoryData[name] = new DirectoryEntry(fileNode.id, NODE_TYPE_FILE);
      context.putObject(directoryNode.data, directoryData, update_time);
    }
  }

  function handle_update_result(error) {
    if (error) {
      callback(error);
    } else {
      callback(null, fileNode);
    }
  }
}

function replace_data(context, ofd, buffer, offset, length, callback) {
  var fileNode;

  function return_nbytes(error) {
    if (error) {
      callback(error);
    } else {
      callback(null, length);
    }
  }

  function update_time(error) {
    if (error) {
      callback(error);
    } else {
      var now = Date.now();
      update_node_times(context, ofd.path, fileNode, {
        mtime: now,
        ctime: now
      }, return_nbytes);
    }
  }

  function update_file_node(error) {
    if (error) {
      callback(error);
    } else {
      context.putObject(fileNode.id, fileNode, update_time);
    }
  }

  function write_file_data(error, result) {
    if (error) {
      callback(error);
    } else {
      fileNode = result;
      var newData = Buffer.alloc(length);
      buffer.copy(newData, 0, offset, offset + length);
      ofd.position = length;
      fileNode.size = length;
      fileNode.version += 1;
      context.putBuffer(fileNode.data, newData, update_file_node);
    }
  }

  context.getObject(ofd.id, write_file_data);
}

function write_data(context, ofd, buffer, offset, length, position, callback) {
  var fileNode;
  var fileData;

  function return_nbytes(error) {
    if (error) {
      callback(error);
    } else {
      callback(null, length);
    }
  }

  function update_time(error) {
    if (error) {
      callback(error);
    } else {
      var now = Date.now();
      update_node_times(context, ofd.path, fileNode, {
        mtime: now,
        ctime: now
      }, return_nbytes);
    }
  }

  function update_file_node(error) {
    if (error) {
      callback(error);
    } else {
      context.putObject(fileNode.id, fileNode, update_time);
    }
  }

  function update_file_data(error, result) {
    if (error) {
      callback(error);
    } else {
      fileData = result;

      if (!fileData) {
        return callback(new Errors.EIO('Expected Buffer'));
      }

      var _position = !(undefined === position || null === position) ? position : ofd.position;

      var newSize = Math.max(fileData.length, _position + length);
      var newData = Buffer.alloc(newSize);

      if (fileData) {
        fileData.copy(newData);
      }

      buffer.copy(newData, _position, offset, offset + length);

      if (undefined === position) {
        ofd.position += length;
      }

      fileNode.size = newSize;
      fileNode.version += 1;
      context.putBuffer(fileNode.data, newData, update_file_node);
    }
  }

  function read_file_data(error, result) {
    if (error) {
      callback(error);
    } else {
      fileNode = result;
      context.getBuffer(fileNode.data, update_file_data);
    }
  }

  context.getObject(ofd.id, read_file_data);
}

function read_data(context, ofd, buffer, offset, length, position, callback) {
  var fileNode;
  var fileData;

  function handle_file_data(error, result) {
    if (error) {
      callback(error);
    } else {
      fileData = result;

      if (!fileData) {
        return callback(new Errors.EIO('Expected Buffer'));
      }

      var _position = !(undefined === position || null === position) ? position : ofd.position;

      length = _position + length > buffer.length ? length - _position : length;
      fileData.copy(buffer, offset, _position, _position + length);

      if (undefined === position) {
        ofd.position += length;
      }

      callback(null, length);
    }
  }

  function read_file_data(error, result) {
    if (error) {
      callback(error);
    } else if (result.type === NODE_TYPE_DIRECTORY) {
      callback(new Errors.EISDIR('the named file is a directory', ofd.path));
    } else {
      fileNode = result;
      context.getBuffer(fileNode.data, handle_file_data);
    }
  }

  context.getObject(ofd.id, read_file_data);
}

function stat_file(context, path, callback) {
  path = normalize(path);
  find_node(context, path, callback);
}

function fstat_file(context, ofd, callback) {
  ofd.getNode(context, callback);
}

function lstat_file(context, path, callback) {
  path = normalize(path);
  var name = basename(path);
  var parentPath = dirname(path);
  var directoryNode;
  var directoryData;

  if (ROOT_DIRECTORY_NAME === name) {
    find_node(context, path, callback);
  } else {
    find_node(context, parentPath, read_directory_data);
  }

  function read_directory_data(error, result) {
    if (error) {
      callback(error);
    } else {
      directoryNode = result;
      context.getObject(directoryNode.data, check_if_file_exists);
    }
  }

  function create_node(error, data) {
    if (error) {
      return callback(error);
    }

    Node.create(data, callback);
  }

  function check_if_file_exists(error, result) {
    if (error) {
      callback(error);
    } else {
      directoryData = result;

      if (!Object.prototype.hasOwnProperty.call(directoryData, name)) {
        callback(new Errors.ENOENT('a component of the path does not name an existing file', path));
      } else {
        context.getObject(directoryData[name].id, create_node);
      }
    }
  }
}

function link_node(context, oldpath, newpath, callback) {
  oldpath = normalize(oldpath);
  var oldname = basename(oldpath);
  var oldParentPath = dirname(oldpath);
  newpath = normalize(newpath);
  var newname = basename(newpath);
  var newParentPath = dirname(newpath);
  var ctime = Date.now();
  var oldDirectoryNode;
  var oldDirectoryData;
  var newDirectoryNode;
  var newDirectoryData;
  var fileNodeID;
  var fileNode;

  function update_time(error) {
    if (error) {
      callback(error);
    } else {
      update_node_times(context, newpath, fileNode, {
        ctime: ctime
      }, callback);
    }
  }

  function update_file_node(error, result) {
    if (error) {
      callback(error);
    } else {
      fileNode = result;
      fileNode.nlinks += 1;
      context.putObject(fileNode.id, fileNode, update_time);
    }
  }

  function read_file_node(error) {
    if (error) {
      callback(error);
    } else {
      context.getObject(fileNodeID, update_file_node);
    }
  }

  function check_if_new_file_exists(error, result) {
    if (error) {
      callback(error);
    } else {
      newDirectoryData = result;

      if (Object.prototype.hasOwnProperty.call(newDirectoryData, newname)) {
        callback(new Errors.EEXIST('newpath resolves to an existing file', newname));
      } else {
        newDirectoryData[newname] = oldDirectoryData[oldname];
        fileNodeID = newDirectoryData[newname].id;
        context.putObject(newDirectoryNode.data, newDirectoryData, read_file_node);
      }
    }
  }

  function read_new_directory_data(error, result) {
    if (error) {
      callback(error);
    } else {
      newDirectoryNode = result;
      context.getObject(newDirectoryNode.data, check_if_new_file_exists);
    }
  }

  function check_if_old_file_exists(error, result) {
    if (error) {
      callback(error);
    } else {
      oldDirectoryData = result;

      if (!Object.prototype.hasOwnProperty.call(oldDirectoryData, oldname)) {
        callback(new Errors.ENOENT('a component of either path prefix does not exist', oldname));
      } else if (oldDirectoryData[oldname].type === NODE_TYPE_DIRECTORY) {
        callback(new Errors.EPERM('oldpath refers to a directory'));
      } else {
        find_node(context, newParentPath, read_new_directory_data);
      }
    }
  }

  function read_old_directory_data(error, result) {
    if (error) {
      callback(error);
    } else {
      oldDirectoryNode = result;
      context.getObject(oldDirectoryNode.data, check_if_old_file_exists);
    }
  }

  find_node(context, oldParentPath, read_old_directory_data);
}

function unlink_node(context, path, callback) {
  path = normalize(path);
  var name = basename(path);
  var parentPath = dirname(path);
  var directoryNode;
  var directoryData;
  var fileNode;

  function update_directory_data(error) {
    if (error) {
      callback(error);
    } else {
      delete directoryData[name];
      context.putObject(directoryNode.data, directoryData, function (error) {
        if (error) {
          callback(error);
        } else {
          var now = Date.now();
          update_node_times(context, parentPath, directoryNode, {
            mtime: now,
            ctime: now
          }, callback);
        }
      });
    }
  }

  function delete_file_data(error) {
    if (error) {
      callback(error);
    } else {
      context.delete(fileNode.data, update_directory_data);
    }
  }

  function update_file_node(error, result) {
    if (error) {
      callback(error);
    } else {
      fileNode = result;
      fileNode.nlinks -= 1;

      if (fileNode.nlinks < 1) {
        context.delete(fileNode.id, delete_file_data);
      } else {
        context.putObject(fileNode.id, fileNode, function (error) {
          if (error) {
            callback(error);
          } else {
            update_node_times(context, path, fileNode, {
              ctime: Date.now()
            }, update_directory_data);
          }
        });
      }
    }
  }

  function check_if_node_is_directory(error, result) {
    if (error) {
      callback(error);
    } else if (result.type === NODE_TYPE_DIRECTORY) {
      callback(new Errors.EPERM('unlink not permitted on directories', name));
    } else {
      update_file_node(null, result);
    }
  }

  function check_if_file_exists(error, result) {
    if (error) {
      callback(error);
    } else {
      directoryData = result;

      if (!Object.prototype.hasOwnProperty.call(directoryData, name)) {
        callback(new Errors.ENOENT('a component of the path does not name an existing file', name));
      } else {
        context.getObject(directoryData[name].id, check_if_node_is_directory);
      }
    }
  }

  function read_directory_data(error, result) {
    if (error) {
      callback(error);
    } else {
      directoryNode = result;
      context.getObject(directoryNode.data, check_if_file_exists);
    }
  }

  find_node(context, parentPath, read_directory_data);
}

function read_directory(context, path, callback) {
  path = normalize(path);
  var directoryNode;
  var directoryData;

  function handle_directory_data(error, result) {
    if (error) {
      callback(error);
    } else {
      directoryData = result;
      var files = Object.keys(directoryData);
      callback(null, files);
    }
  }

  function read_directory_data(error, result) {
    if (error) {
      callback(error);
    } else if (result.type !== NODE_TYPE_DIRECTORY) {
      callback(new Errors.ENOTDIR(null, path));
    } else {
      directoryNode = result;
      context.getObject(directoryNode.data, handle_directory_data);
    }
  }

  find_node(context, path, read_directory_data);
}

function make_symbolic_link(context, srcpath, dstpath, callback) {
  dstpath = normalize(dstpath);
  var name = basename(dstpath);
  var parentPath = dirname(dstpath);
  var directoryNode;
  var directoryData;
  var fileNode;

  if (ROOT_DIRECTORY_NAME === name) {
    callback(new Errors.EEXIST(null, name));
  } else {
    find_node(context, parentPath, read_directory_data);
  }

  function read_directory_data(error, result) {
    if (error) {
      callback(error);
    } else {
      directoryNode = result;
      context.getObject(directoryNode.data, check_if_file_exists);
    }
  }

  function check_if_file_exists(error, result) {
    if (error) {
      callback(error);
    } else {
      directoryData = result;

      if (Object.prototype.hasOwnProperty.call(directoryData, name)) {
        callback(new Errors.EEXIST(null, name));
      } else {
        write_file_node();
      }
    }
  }

  function write_file_node() {
    Node.create({
      guid: context.guid,
      type: NODE_TYPE_SYMBOLIC_LINK
    }, function (error, result) {
      if (error) {
        callback(error);
        return;
      }

      fileNode = result;
      fileNode.nlinks += 1; // If the srcpath isn't absolute, resolve it relative to the dstpath
      // but store both versions, since we'll use the relative one in readlink().

      if (!isAbsolutePath(srcpath)) {
        fileNode.symlink_relpath = srcpath;
        srcpath = Path.resolve(parentPath, srcpath);
      }

      fileNode.size = srcpath.length;
      fileNode.data = srcpath;
      context.putObject(fileNode.id, fileNode, update_directory_data);
    });
  }

  function update_time(error) {
    if (error) {
      callback(error);
    } else {
      var now = Date.now();
      update_node_times(context, parentPath, directoryNode, {
        mtime: now,
        ctime: now
      }, callback);
    }
  }

  function update_directory_data(error) {
    if (error) {
      callback(error);
    } else {
      directoryData[name] = new DirectoryEntry(fileNode.id, NODE_TYPE_SYMBOLIC_LINK);
      context.putObject(directoryNode.data, directoryData, update_time);
    }
  }
}

function read_link(context, path, callback) {
  path = normalize(path);
  var name = basename(path);
  var parentPath = dirname(path);
  var directoryNode;
  var directoryData;
  find_node(context, parentPath, read_directory_data);

  function read_directory_data(error, result) {
    if (error) {
      callback(error);
    } else {
      directoryNode = result;
      context.getObject(directoryNode.data, check_if_file_exists);
    }
  }

  function check_if_file_exists(error, result) {
    if (error) {
      callback(error);
    } else {
      directoryData = result;

      if (!Object.prototype.hasOwnProperty.call(directoryData, name)) {
        callback(new Errors.ENOENT('a component of the path does not name an existing file', name));
      } else {
        context.getObject(directoryData[name].id, check_if_symbolic);
      }
    }
  }

  function check_if_symbolic(error, fileNode) {
    if (error) {
      callback(error);
    } else {
      if (fileNode.type !== NODE_TYPE_SYMBOLIC_LINK) {
        callback(new Errors.EINVAL('path not a symbolic link', path));
      } else {
        // If we were originally given a relative path, return that now vs. the
        // absolute path we've generated and use elsewhere internally.
        var target = fileNode.symlink_relpath ? fileNode.symlink_relpath : fileNode.data;
        callback(null, target);
      }
    }
  }
}

function truncate_file(context, path, length, callback) {
  path = normalize(path);
  var fileNode;

  function read_file_data(error, node) {
    if (error) {
      callback(error);
    } else if (node.type === NODE_TYPE_DIRECTORY) {
      callback(new Errors.EISDIR(null, path));
    } else {
      fileNode = node;
      context.getBuffer(fileNode.data, truncate_file_data);
    }
  }

  function truncate_file_data(error, fileData) {
    if (error) {
      callback(error);
    } else {
      if (!fileData) {
        return callback(new Errors.EIO('Expected Buffer'));
      }

      var data = Buffer.alloc(length);

      if (fileData) {
        fileData.copy(data);
      }

      context.putBuffer(fileNode.data, data, update_file_node);
    }
  }

  function update_time(error) {
    if (error) {
      callback(error);
    } else {
      var now = Date.now();
      update_node_times(context, path, fileNode, {
        mtime: now,
        ctime: now
      }, callback);
    }
  }

  function update_file_node(error) {
    if (error) {
      callback(error);
    } else {
      fileNode.size = length;
      fileNode.version += 1;
      context.putObject(fileNode.id, fileNode, update_time);
    }
  }

  if (length < 0) {
    callback(new Errors.EINVAL('length cannot be negative'));
  } else {
    find_node(context, path, read_file_data);
  }
}

function ftruncate_file(context, ofd, length, callback) {
  var fileNode;

  function read_file_data(error, node) {
    if (error) {
      callback(error);
    } else if (node.type === NODE_TYPE_DIRECTORY) {
      callback(new Errors.EISDIR());
    } else {
      fileNode = node;
      context.getBuffer(fileNode.data, truncate_file_data);
    }
  }

  function truncate_file_data(error, fileData) {
    if (error) {
      callback(error);
    } else {
      var data;

      if (!fileData) {
        return callback(new Errors.EIO('Expected Buffer'));
      }

      if (fileData) {
        data = fileData.slice(0, length);
      } else {
        data = Buffer.alloc(length);
      }

      context.putBuffer(fileNode.data, data, update_file_node);
    }
  }

  function update_time(error) {
    if (error) {
      callback(error);
    } else {
      var now = Date.now();
      update_node_times(context, ofd.path, fileNode, {
        mtime: now,
        ctime: now
      }, callback);
    }
  }

  function update_file_node(error) {
    if (error) {
      callback(error);
    } else {
      fileNode.size = length;
      fileNode.version += 1;
      context.putObject(fileNode.id, fileNode, update_time);
    }
  }

  if (length < 0) {
    callback(new Errors.EINVAL('length cannot be negative'));
  } else {
    ofd.getNode(context, read_file_data);
  }
}

function utimes_file(context, path, atime, mtime, callback) {
  path = normalize(path);

  function update_times(error, node) {
    if (error) {
      callback(error);
    } else {
      update_node_times(context, path, node, {
        atime: atime,
        ctime: mtime,
        mtime: mtime
      }, callback);
    }
  }

  if (typeof atime !== 'number' || typeof mtime !== 'number') {
    callback(new Errors.EINVAL('atime and mtime must be number', path));
  } else if (atime < 0 || mtime < 0) {
    callback(new Errors.EINVAL('atime and mtime must be positive integers', path));
  } else {
    find_node(context, path, update_times);
  }
}

function futimes_file(context, ofd, atime, mtime, callback) {
  function update_times(error, node) {
    if (error) {
      callback(error);
    } else {
      update_node_times(context, ofd.path, node, {
        atime: atime,
        ctime: mtime,
        mtime: mtime
      }, callback);
    }
  }

  if (typeof atime !== 'number' || typeof mtime !== 'number') {
    callback(new Errors.EINVAL('atime and mtime must be a number'));
  } else if (atime < 0 || mtime < 0) {
    callback(new Errors.EINVAL('atime and mtime must be positive integers'));
  } else {
    ofd.getNode(context, update_times);
  }
}

function setxattr_file(context, path, name, value, flag, callback) {
  path = normalize(path);

  function setxattr(error, node) {
    if (error) {
      return callback(error);
    }

    set_extended_attribute(context, path, node, name, value, flag, callback);
  }

  if (typeof name !== 'string') {
    callback(new Errors.EINVAL('attribute name must be a string', path));
  } else if (!name) {
    callback(new Errors.EINVAL('attribute name cannot be an empty string', path));
  } else if (flag !== null && flag !== XATTR_CREATE && flag !== XATTR_REPLACE) {
    callback(new Errors.EINVAL('invalid flag, must be null, XATTR_CREATE or XATTR_REPLACE', path));
  } else {
    find_node(context, path, setxattr);
  }
}

function fsetxattr_file(context, ofd, name, value, flag, callback) {
  function setxattr(error, node) {
    if (error) {
      return callback(error);
    }

    set_extended_attribute(context, ofd.path, node, name, value, flag, callback);
  }

  if (typeof name !== 'string') {
    callback(new Errors.EINVAL('attribute name must be a string'));
  } else if (!name) {
    callback(new Errors.EINVAL('attribute name cannot be an empty string'));
  } else if (flag !== null && flag !== XATTR_CREATE && flag !== XATTR_REPLACE) {
    callback(new Errors.EINVAL('invalid flag, must be null, XATTR_CREATE or XATTR_REPLACE'));
  } else {
    ofd.getNode(context, setxattr);
  }
}

function getxattr_file(context, path, name, callback) {
  path = normalize(path);

  function get_xattr(error, node) {
    if (error) {
      return callback(error);
    }

    var xattrs = node.xattrs;

    if (!Object.prototype.hasOwnProperty.call(xattrs, name)) {
      callback(new Errors.ENOATTR(null, path));
    } else {
      callback(null, xattrs[name]);
    }
  }

  if (typeof name !== 'string') {
    callback(new Errors.EINVAL('attribute name must be a string', path));
  } else if (!name) {
    callback(new Errors.EINVAL('attribute name cannot be an empty string', path));
  } else {
    find_node(context, path, get_xattr);
  }
}

function fgetxattr_file(context, ofd, name, callback) {
  function get_xattr(error, node) {
    if (error) {
      return callback(error);
    }

    var xattrs = node.xattrs;

    if (!Object.prototype.hasOwnProperty.call(xattrs, name)) {
      callback(new Errors.ENOATTR());
    } else {
      callback(null, xattrs[name]);
    }
  }

  if (typeof name !== 'string') {
    callback(new Errors.EINVAL());
  } else if (!name) {
    callback(new Errors.EINVAL('attribute name cannot be an empty string'));
  } else {
    ofd.getNode(context, get_xattr);
  }
}

function removexattr_file(context, path, name, callback) {
  path = normalize(path);

  function remove_xattr(error, node) {
    if (error) {
      return callback(error);
    }

    function update_time(error) {
      if (error) {
        callback(error);
      } else {
        update_node_times(context, path, node, {
          ctime: Date.now()
        }, callback);
      }
    }

    var xattrs = node.xattrs;

    if (!Object.prototype.hasOwnProperty.call(xattrs, name)) {
      callback(new Errors.ENOATTR(null, path));
    } else {
      delete xattrs[name];
      context.putObject(node.id, node, update_time);
    }
  }

  if (typeof name !== 'string') {
    callback(new Errors.EINVAL('attribute name must be a string', path));
  } else if (!name) {
    callback(new Errors.EINVAL('attribute name cannot be an empty string', path));
  } else {
    find_node(context, path, remove_xattr);
  }
}

function fremovexattr_file(context, ofd, name, callback) {
  function remove_xattr(error, node) {
    if (error) {
      return callback(error);
    }

    function update_time(error) {
      if (error) {
        callback(error);
      } else {
        update_node_times(context, ofd.path, node, {
          ctime: Date.now()
        }, callback);
      }
    }

    var xattrs = node.xattrs;

    if (!Object.prototype.hasOwnProperty.call(xattrs, name)) {
      callback(new Errors.ENOATTR());
    } else {
      delete xattrs[name];
      context.putObject(node.id, node, update_time);
    }
  }

  if (typeof name !== 'string') {
    callback(new Errors.EINVAL('attribute name must be a string'));
  } else if (!name) {
    callback(new Errors.EINVAL('attribute name cannot be an empty string'));
  } else {
    ofd.getNode(context, remove_xattr);
  }
}

function validate_flags(flags) {
  return Object.prototype.hasOwnProperty.call(O_FLAGS, flags) ? O_FLAGS[flags] : null;
}

function validate_file_options(options, enc, fileMode) {
  if (!options) {
    options = {
      encoding: enc,
      flag: fileMode
    };
  } else if (typeof options === 'function') {
    options = {
      encoding: enc,
      flag: fileMode
    };
  } else if (typeof options === 'string') {
    options = {
      encoding: options,
      flag: fileMode
    };
  }

  return options;
}

function open(context, path, flags, mode, callback) {
  if (arguments.length < 5) {
    callback = arguments[arguments.length - 1];
    mode = 420;
  } else {
    mode = validateAndMaskMode(mode, FULL_READ_WRITE_EXEC_PERMISSIONS, callback);
  }

  function check_result(error, fileNode) {
    if (error) {
      callback(error);
    } else {
      var position;

      if (flags.includes(O_APPEND)) {
        position = fileNode.size;
      } else {
        position = 0;
      }

      var openFileDescription = new OpenFileDescription(path, fileNode.id, flags, position);
      var fd = openFiles.allocDescriptor(openFileDescription);
      callback(null, fd);
    }
  }

  flags = validate_flags(flags);

  if (!flags) {
    return callback(new Errors.EINVAL('flags is not valid'), path);
  }

  open_file(context, path, flags, mode, check_result);
}

function close(context, fd, callback) {
  if (!openFiles.getOpenFileDescription(fd)) {
    callback(new Errors.EBADF());
  } else {
    openFiles.releaseDescriptor(fd);
    callback(null);
  }
}

function mknod(context, path, type, callback) {
  make_node(context, path, type, callback);
}

function mkdir(context, path, mode, callback) {
  if (arguments.length < 4) {
    callback = mode;
    mode = FULL_READ_WRITE_EXEC_PERMISSIONS;
  } else {
    mode = validateAndMaskMode(mode, FULL_READ_WRITE_EXEC_PERMISSIONS, callback);
    if (!mode) return;
  }

  make_directory(context, path, callback);
}

function access(context, path, mode, callback) {
  if (typeof mode === 'function') {
    callback = mode;
    mode = Constants.fsConstants.F_OK;
  }

  mode = mode | Constants.fsConstants.F_OK;
  access_file(context, path, mode, callback);
}

function mkdtemp(context, prefix, options, callback) {
  callback = arguments[arguments.length - 1];

  if (!prefix) {
    return callback(new Error('filename prefix is required'));
  }

  var random = shared.randomChars(6);
  var path = prefix + '-' + random;
  make_directory(context, path, function (error) {
    callback(error, path);
  });
}

function rmdir(context, path, callback) {
  remove_directory(context, path, callback);
}

function stat(context, path, callback) {
  function check_result(error, result) {
    if (error) {
      callback(error);
    } else {
      var stats = new Stats(path, result, context.name);
      callback(null, stats);
    }
  }

  stat_file(context, path, check_result);
}

function fstat(context, fd, callback) {
  function check_result(error, result) {
    if (error) {
      callback(error);
    } else {
      var stats = new Stats(ofd.path, result, context.name);
      callback(null, stats);
    }
  }

  var ofd = openFiles.getOpenFileDescription(fd);

  if (!ofd) {
    callback(new Errors.EBADF());
  } else {
    fstat_file(context, ofd, check_result);
  }
}

function link(context, oldpath, newpath, callback) {
  link_node(context, oldpath, newpath, callback);
}

function unlink(context, path, callback) {
  unlink_node(context, path, callback);
}

function read(context, fd, buffer, offset, length, position, callback) {
  // Follow how node.js does this
  function wrapped_cb(err, bytesRead) {
    // Retain a reference to buffer so that it can't be GC'ed too soon.
    callback(err, bytesRead || 0, buffer);
  }

  offset = undefined === offset ? 0 : offset;
  length = undefined === length ? buffer.length - offset : length;
  callback = arguments[arguments.length - 1];
  var ofd = openFiles.getOpenFileDescription(fd);

  if (!ofd) {
    callback(new Errors.EBADF());
  } else if (!ofd.flags.includes(O_READ)) {
    callback(new Errors.EBADF('descriptor does not permit reading'));
  } else {
    read_data(context, ofd, buffer, offset, length, position, wrapped_cb);
  }
}

function fsync(context, fd, callback) {
  if (validateInteger(fd, callback) !== fd) return;
  var ofd = openFiles.getOpenFileDescription(fd);

  if (!ofd) {
    callback(new Errors.EBADF());
  } else {
    callback();
  }
}

function readFile(context, path, options, callback) {
  callback = arguments[arguments.length - 1];
  options = validate_file_options(options, null, 'r');
  var flags = validate_flags(options.flag || 'r');

  if (!flags) {
    return callback(new Errors.EINVAL('flags is not valid', path));
  }

  open_file(context, path, flags, function (err, fileNode) {
    if (err) {
      return callback(err);
    }

    var ofd = new OpenFileDescription(path, fileNode.id, flags, 0);
    var fd = openFiles.allocDescriptor(ofd);

    function cleanup() {
      openFiles.releaseDescriptor(fd);
    }

    fstat_file(context, ofd, function (err, fstatResult) {
      if (err) {
        cleanup();
        return callback(err);
      }

      var stats = new Stats(ofd.path, fstatResult, context.name);

      if (stats.isDirectory()) {
        cleanup();
        return callback(new Errors.EISDIR('illegal operation on directory', path));
      }

      var size = stats.size;
      var buffer = Buffer.alloc(size);
      read_data(context, ofd, buffer, 0, size, 0, function (err) {
        cleanup();

        if (err) {
          return callback(err);
        }

        var data;

        if (options.encoding === 'utf8') {
          data = buffer.toString('utf8');
        } else {
          data = buffer;
        }

        callback(null, data);
      });
    });
  });
}

function write(context, fd, buffer, offset, length, position, callback) {
  callback = arguments[arguments.length - 1];
  offset = undefined === offset ? 0 : offset;
  length = undefined === length ? buffer.length - offset : length;
  var ofd = openFiles.getOpenFileDescription(fd);

  if (!ofd) {
    callback(new Errors.EBADF());
  } else if (!ofd.flags.includes(O_WRITE)) {
    callback(new Errors.EBADF('descriptor does not permit writing'));
  } else if (buffer.length - offset < length) {
    callback(new Errors.EIO('input buffer is too small'));
  } else {
    write_data(context, ofd, buffer, offset, length, position, callback);
  }
}

function writeFile(context, path, data, options, callback) {
  callback = arguments[arguments.length - 1];
  options = validate_file_options(options, 'utf8', 'w');
  var flags = validate_flags(options.flag || 'w');

  if (!flags) {
    return callback(new Errors.EINVAL('flags is not valid', path));
  }

  data = data || '';

  if (typeof data === 'number') {
    data = '' + data;
  }

  if (typeof data === 'string' && options.encoding === 'utf8') {
    data = Buffer.from(data);
  }

  open_file(context, path, flags, function (err, fileNode) {
    if (err) {
      return callback(err);
    }

    var ofd = new OpenFileDescription(path, fileNode.id, flags, 0);
    var fd = openFiles.allocDescriptor(ofd);
    replace_data(context, ofd, data, 0, data.length, function (err) {
      openFiles.releaseDescriptor(fd);

      if (err) {
        return callback(err);
      }

      callback(null);
    });
  });
}

function appendFile(context, path, data, options, callback) {
  callback = arguments[arguments.length - 1];
  options = validate_file_options(options, 'utf8', 'a');
  var flags = validate_flags(options.flag || 'a');

  if (!flags) {
    return callback(new Errors.EINVAL('flags is not valid', path));
  }

  data = data || '';

  if (typeof data === 'number') {
    data = '' + data;
  }

  if (typeof data === 'string' && options.encoding === 'utf8') {
    data = Buffer.from(data);
  }

  open_file(context, path, flags, function (err, fileNode) {
    if (err) {
      return callback(err);
    }

    var ofd = new OpenFileDescription(path, fileNode.id, flags, fileNode.size);
    var fd = openFiles.allocDescriptor(ofd);
    write_data(context, ofd, data, 0, data.length, ofd.position, function (err) {
      openFiles.releaseDescriptor(fd);

      if (err) {
        return callback(err);
      }

      callback(null);
    });
  });
}

function exists(context, path, callback) {
  function cb(err) {
    callback(err ? false : true);
  }

  stat(context, path, cb);
}

function validateInteger(value, callback) {
  if (typeof value !== 'number') {
    callback(new Errors.EINVAL('Expected integer', value));
    return;
  }

  return value;
} // Based on https://github.com/nodejs/node/blob/c700cc42da9cf73af9fec2098520a6c0a631d901/lib/internal/validators.js#L21


var octalReg = /^[0-7]+$/;

function isUint32(value) {
  return value === value >>> 0;
} // Validator for mode_t (the S_* constants). Valid numbers or octal strings
// will be masked with 0o777 to be consistent with the behavior in POSIX APIs.


function validateAndMaskMode(value, def, callback) {
  if (typeof def === 'function') {
    callback = def;
    def = undefined;
  }

  if (isUint32(value)) {
    return value & FULL_READ_WRITE_EXEC_PERMISSIONS;
  }

  if (typeof value === 'number') {
    if (!Number.isInteger(value)) {
      callback(new Errors.EINVAL('mode not a valid an integer value', value));
      return false;
    } else {
      // 2 ** 32 === 4294967296
      callback(new Errors.EINVAL('mode not a valid an integer value', value));
      return false;
    }
  }

  if (typeof value === 'string') {
    if (!octalReg.test(value)) {
      callback(new Errors.EINVAL('mode not a valid octal string', value));
      return false;
    }

    var parsed = parseInt(value, 8);
    return parsed & FULL_READ_WRITE_EXEC_PERMISSIONS;
  } // TODO(BridgeAR): Only return `def` in case `value === null`


  if (def !== undefined) {
    return def;
  }

  callback(new Errors.EINVAL('mode not valid', value));
  return false;
}

function chmod_file(context, path, mode, callback) {
  path = normalize(path);

  function update_mode(error, node) {
    if (error) {
      callback(error);
    } else {
      node.mode = mode;
      update_node_times(context, path, node, {
        mtime: Date.now()
      }, callback);
    }
  }

  if (typeof mode !== 'number') {
    callback(new Errors.EINVAL('mode must be number', path));
  } else {
    find_node(context, path, update_mode);
  }
}

function fchmod_file(context, ofd, mode, callback) {
  function update_mode(error, node) {
    if (error) {
      callback(error);
    } else {
      node.mode = mode;
      update_node_times(context, ofd.path, node, {
        mtime: Date.now()
      }, callback);
    }
  }

  if (typeof mode !== 'number') {
    callback(new Errors.EINVAL('mode must be a number'));
  } else {
    ofd.getNode(context, update_mode);
  }
}

function chown_file(context, path, uid, gid, callback) {
  path = normalize(path);

  function update_owner(error, node) {
    if (error) {
      callback(error);
    } else {
      node.uid = uid;
      node.gid = gid;
      update_node_times(context, path, node, {
        mtime: Date.now()
      }, callback);
    }
  }

  find_node(context, path, update_owner);
}

function fchown_file(context, ofd, uid, gid, callback) {
  function update_owner(error, node) {
    if (error) {
      callback(error);
    } else {
      node.uid = uid;
      node.gid = gid;
      update_node_times(context, ofd.path, node, {
        mtime: Date.now()
      }, callback);
    }
  }

  ofd.getNode(context, update_owner);
}

function getxattr(context, path, name, callback) {
  getxattr_file(context, path, name, callback);
}

function fgetxattr(context, fd, name, callback) {
  var ofd = openFiles.getOpenFileDescription(fd);

  if (!ofd) {
    callback(new Errors.EBADF());
  } else {
    fgetxattr_file(context, ofd, name, callback);
  }
}

function setxattr(context, path, name, value, flag, callback) {
  if (typeof flag === 'function') {
    callback = flag;
    flag = null;
  }

  setxattr_file(context, path, name, value, flag, callback);
}

function fsetxattr(context, fd, name, value, flag, callback) {
  if (typeof flag === 'function') {
    callback = flag;
    flag = null;
  }

  var ofd = openFiles.getOpenFileDescription(fd);

  if (!ofd) {
    callback(new Errors.EBADF());
  } else if (!ofd.flags.includes(O_WRITE)) {
    callback(new Errors.EBADF('descriptor does not permit writing'));
  } else {
    fsetxattr_file(context, ofd, name, value, flag, callback);
  }
}

function removexattr(context, path, name, callback) {
  removexattr_file(context, path, name, callback);
}

function fremovexattr(context, fd, name, callback) {
  var ofd = openFiles.getOpenFileDescription(fd);

  if (!ofd) {
    callback(new Errors.EBADF());
  } else if (!ofd.flags.includes(O_WRITE)) {
    callback(new Errors.EBADF('descriptor does not permit writing'));
  } else {
    fremovexattr_file(context, ofd, name, callback);
  }
}

function lseek(context, fd, offset, whence, callback) {
  function update_descriptor_position(error, stats) {
    if (error) {
      callback(error);
    } else {
      if (stats.size + offset < 0) {
        callback(new Errors.EINVAL('resulting file offset would be negative'));
      } else {
        ofd.position = stats.size + offset;
        callback(null, ofd.position);
      }
    }
  }

  var ofd = openFiles.getOpenFileDescription(fd);

  if (!ofd) {
    callback(new Errors.EBADF());
  }

  if ('SET' === whence) {
    if (offset < 0) {
      callback(new Errors.EINVAL('resulting file offset would be negative'));
    } else {
      ofd.position = offset;
      callback(null, ofd.position);
    }
  } else if ('CUR' === whence) {
    if (ofd.position + offset < 0) {
      callback(new Errors.EINVAL('resulting file offset would be negative'));
    } else {
      ofd.position += offset;
      callback(null, ofd.position);
    }
  } else if ('END' === whence) {
    fstat_file(context, ofd, update_descriptor_position);
  } else {
    callback(new Errors.EINVAL('whence argument is not a proper value'));
  }
}

function readdir(context, path, callback) {
  read_directory(context, path, callback);
}

function toUnixTimestamp(time) {
  if (typeof time === 'number') {
    return time;
  }

  if (_typeof(time) === 'object' && typeof time.getTime === 'function') {
    return time.getTime();
  }
}

function utimes(context, path, atime, mtime, callback) {
  var currentTime = Date.now();
  atime = atime ? toUnixTimestamp(atime) : toUnixTimestamp(currentTime);
  mtime = mtime ? toUnixTimestamp(mtime) : toUnixTimestamp(currentTime);
  utimes_file(context, path, atime, mtime, callback);
}

function futimes(context, fd, atime, mtime, callback) {
  var currentTime = Date.now();
  atime = atime ? toUnixTimestamp(atime) : toUnixTimestamp(currentTime);
  mtime = mtime ? toUnixTimestamp(mtime) : toUnixTimestamp(currentTime);
  var ofd = openFiles.getOpenFileDescription(fd);

  if (!ofd) {
    callback(new Errors.EBADF());
  } else if (!ofd.flags.includes(O_WRITE)) {
    callback(new Errors.EBADF('descriptor does not permit writing'));
  } else {
    futimes_file(context, ofd, atime, mtime, callback);
  }
}

function chmod(context, path, mode, callback) {
  mode = validateAndMaskMode(mode, callback);
  if (!mode) return;
  chmod_file(context, path, mode, callback);
}

function fchmod(context, fd, mode, callback) {
  mode = validateAndMaskMode(mode, callback);
  if (!mode) return;
  var ofd = openFiles.getOpenFileDescription(fd);

  if (!ofd) {
    callback(new Errors.EBADF());
  } else if (!ofd.flags.includes(O_WRITE)) {
    callback(new Errors.EBADF('descriptor does not permit writing'));
  } else {
    fchmod_file(context, ofd, mode, callback);
  }
}

function chown(context, path, uid, gid, callback) {
  if (!isUint32(uid)) {
    return callback(new Errors.EINVAL('uid must be a valid integer', uid));
  }

  if (!isUint32(gid)) {
    return callback(new Errors.EINVAL('gid must be a valid integer', gid));
  }

  chown_file(context, path, uid, gid, callback);
}

function fchown(context, fd, uid, gid, callback) {
  if (!isUint32(uid)) {
    return callback(new Errors.EINVAL('uid must be a valid integer', uid));
  }

  if (!isUint32(gid)) {
    return callback(new Errors.EINVAL('gid must be a valid integer', gid));
  }

  var ofd = openFiles.getOpenFileDescription(fd);

  if (!ofd) {
    callback(new Errors.EBADF());
  } else if (!ofd.flags.includes(O_WRITE)) {
    callback(new Errors.EBADF('descriptor does not permit writing'));
  } else {
    fchown_file(context, ofd, uid, gid, callback);
  }
}

function rename(context, oldpath, newpath, callback) {
  oldpath = normalize(oldpath);
  newpath = normalize(newpath);
  var oldParentPath = Path.dirname(oldpath);
  var newParentPath = Path.dirname(oldpath);
  var oldName = Path.basename(oldpath);
  var newName = Path.basename(newpath);
  var oldParentDirectory, oldParentData;
  var newParentDirectory, newParentData;
  var ctime = Date.now();
  var fileNode;

  function update_times(error, result) {
    if (error) {
      callback(error);
    } else {
      fileNode = result;
      update_node_times(context, newpath, fileNode, {
        ctime: ctime
      }, callback);
    }
  }

  function read_new_directory(error) {
    if (error) {
      callback(error);
    } else {
      context.getObject(newParentData[newName].id, update_times);
    }
  }

  function update_old_parent_directory_data(error) {
    if (error) {
      callback(error);
    } else {
      if (oldParentDirectory.id === newParentDirectory.id) {
        oldParentData = newParentData;
      }

      delete oldParentData[oldName];
      context.putObject(oldParentDirectory.data, oldParentData, read_new_directory);
    }
  }

  function update_new_parent_directory_data(error) {
    if (error) {
      callback(error);
    } else {
      newParentData[newName] = oldParentData[oldName];
      context.putObject(newParentDirectory.data, newParentData, update_old_parent_directory_data);
    }
  }

  function check_if_new_directory_exists(error, result) {
    if (error) {
      callback(error);
    } else {
      newParentData = result;

      if (Object.prototype.hasOwnProperty.call(newParentData, newName)) {
        remove_directory(context, newpath, update_new_parent_directory_data);
      } else {
        update_new_parent_directory_data();
      }
    }
  }

  function read_new_parent_directory_data(error, result) {
    if (error) {
      callback(error);
    } else {
      newParentDirectory = result;
      context.getObject(newParentDirectory.data, check_if_new_directory_exists);
    }
  }

  function get_new_parent_directory(error, result) {
    if (error) {
      callback(error);
    } else {
      oldParentData = result;
      find_node(context, newParentPath, read_new_parent_directory_data);
    }
  }

  function read_parent_directory_data(error, result) {
    if (error) {
      callback(error);
    } else {
      oldParentDirectory = result;
      context.getObject(result.data, get_new_parent_directory);
    }
  }

  function unlink_old_file(error) {
    if (error) {
      callback(error);
    } else {
      unlink_node(context, oldpath, callback);
    }
  }

  function check_node_type(error, node) {
    if (error) {
      callback(error);
    } else if (node.type === NODE_TYPE_DIRECTORY) {
      find_node(context, oldParentPath, read_parent_directory_data);
    } else {
      link_node(context, oldpath, newpath, unlink_old_file);
    }
  }

  find_node(context, oldpath, check_node_type);
}

function symlink(context, srcpath, dstpath, type, callback) {
  // NOTE: we support passing the `type` arg, but ignore it.
  callback = arguments[arguments.length - 1];
  make_symbolic_link(context, srcpath, dstpath, callback);
}

function readlink(context, path, callback) {
  read_link(context, path, callback);
}

function lstat(context, path, callback) {
  function check_result(error, result) {
    if (error) {
      callback(error);
    } else {
      var stats = new Stats(path, result, context.name);
      callback(null, stats);
    }
  }

  lstat_file(context, path, check_result);
}

function truncate(context, path, length, callback) {
  // NOTE: length is optional
  callback = arguments[arguments.length - 1];
  length = length || 0;
  if (validateInteger(length, callback) !== length) return;
  truncate_file(context, path, length, callback);
}

function ftruncate(context, fd, length, callback) {
  // NOTE: length is optional
  callback = arguments[arguments.length - 1];
  length = length || 0;
  var ofd = openFiles.getOpenFileDescription(fd);

  if (!ofd) {
    callback(new Errors.EBADF());
  } else if (!ofd.flags.includes(O_WRITE)) {
    callback(new Errors.EBADF('descriptor does not permit writing'));
  } else {
    if (validateInteger(length, callback) !== length) return;
    ftruncate_file(context, ofd, length, callback);
  }
}

module.exports = {
  appendFile: appendFile,
  access: access,
  chown: chown,
  chmod: chmod,
  close: close,
  // copyFile - https://github.com/filerjs/filer/issues/436
  ensureRootDirectory: ensure_root_directory,
  exists: exists,
  fchown: fchown,
  fchmod: fchmod,
  // fdatasync - https://github.com/filerjs/filer/issues/653
  fgetxattr: fgetxattr,
  fremovexattr: fremovexattr,
  fsetxattr: fsetxattr,
  fstat: fstat,
  fsync: fsync,
  ftruncate: ftruncate,
  futimes: futimes,
  getxattr: getxattr,
  // lchown - https://github.com/filerjs/filer/issues/620
  // lchmod - https://github.com/filerjs/filer/issues/619
  link: link,
  lseek: lseek,
  lstat: lstat,
  mkdir: mkdir,
  mkdtemp: mkdtemp,
  mknod: mknod,
  open: open,
  readdir: readdir,
  read: read,
  readFile: readFile,
  readlink: readlink,
  // realpath - https://github.com/filerjs/filer/issues/85
  removexattr: removexattr,
  rename: rename,
  rmdir: rmdir,
  setxattr: setxattr,
  stat: stat,
  symlink: symlink,
  truncate: truncate,
  // unwatchFile - implemented in interface.js
  unlink: unlink,
  utimes: utimes,
  // watch - implemented in interface.js
  // watchFile - implemented in interface.js
  writeFile: writeFile,
  write: write
};
},{"../path.js":"UzoP","../shared.js":"zBMa","../constants.js":"iJA9","../errors.js":"p8GN","../directory-entry.js":"ZECt","../open-files.js":"osLK","../open-file-description.js":"XWaV","../super-node.js":"JEp0","../node.js":"KKNo","../stats.js":"dsCT","buffer":"dskh"}],"GMi4":[function(require,module,exports) {
var Buffer = require("buffer").Buffer;
'use strict';

var _require = require('es6-promisify'),
    promisify = _require.promisify;

var Path = require('../path.js');

var providers = require('../providers/index.js');

var Shell = require('../shell/shell.js');

var Intercom = require('../../lib/intercom.js');

var FSWatcher = require('../fs-watcher.js');

var Errors = require('../errors.js');

var _require2 = require('../shared.js'),
    nop = _require2.nop,
    defaultGuidFn = _require2.guid;

var _require3 = require('../constants.js'),
    fsConstants = _require3.fsConstants,
    FILE_SYSTEM_NAME = _require3.FILE_SYSTEM_NAME,
    FS_FORMAT = _require3.FS_FORMAT,
    FS_READY = _require3.FS_READY,
    FS_PENDING = _require3.FS_PENDING,
    FS_ERROR = _require3.FS_ERROR,
    FS_NODUPEIDCHECK = _require3.FS_NODUPEIDCHECK,
    STDIN = _require3.STDIN,
    STDOUT = _require3.STDOUT,
    STDERR = _require3.STDERR; // The core fs operations live on impl


var impl = require('./implementation.js'); // node.js supports a calling pattern that leaves off a callback.


function maybeCallback(callback) {
  if (typeof callback === 'function') {
    return callback;
  }

  return function (err) {
    if (err) {
      throw err;
    }
  };
} // Default callback that logs an error if passed in


function defaultCallback(err) {
  if (err) {
    /* eslint no-console: 0 */
    console.error('Filer error: ', err);
  }
} // Get a path (String) from a file:// URL. Support URL() like objects
// https://github.com/nodejs/node/blob/968e901aff38a343b1de4addebf79fd8fa991c59/lib/internal/url.js#L1381


function toPathIfFileURL(fileURLOrPath) {
  if (!(fileURLOrPath && fileURLOrPath.protocol && fileURLOrPath.pathname)) {
    return fileURLOrPath;
  }

  if (fileURLOrPath.protocol !== 'file:') {
    throw new Errors.EINVAL('only file: URLs are supported for paths', fileURLOrPath);
  }

  var pathname = fileURLOrPath.pathname;

  for (var n = 0; n < pathname.length; n++) {
    if (pathname[n] === '%') {
      var third = pathname.codePointAt(n + 2) | 0x20;

      if (pathname[n + 1] === '2' && third === 102) {
        throw new Errors.EINVAL('file: URLs must not include encoded / characters', fileURLOrPath);
      }
    }
  }

  return decodeURIComponent(pathname);
} // Allow Buffers for paths. Assumes we want UTF8.


function toPathIfBuffer(bufferOrPath) {
  return Buffer.isBuffer(bufferOrPath) ? bufferOrPath.toString() : bufferOrPath;
}

function validatePath(path, allowRelative) {
  if (!path) {
    return new Errors.EINVAL('Path must be a string', path);
  } else if (Path.isNull(path)) {
    return new Errors.EINVAL('Path must be a string without null bytes.', path);
  } else if (!allowRelative && !Path.isAbsolute(path)) {
    return new Errors.EINVAL('Path must be absolute.', path);
  }
}

function processPathArg(args, idx, allowRelative) {
  var path = args[idx];
  path = toPathIfFileURL(path);
  path = toPathIfBuffer(path); // Some methods specifically allow for rel paths (eg symlink with srcPath)

  var err = validatePath(path, allowRelative);

  if (err) {
    throw err;
  } // Overwrite path arg with converted and validated path


  args[idx] = path;
}
/**
 * FileSystem
 *
 * A FileSystem takes an `options` object, which can specify a number of,
 * options.  All options are optional, and include:
 *
 * name: the name of the file system, defaults to "local"
 *
 * flags: one or more flags to use when creating/opening the file system.
 *        For example: "FORMAT" will cause the file system to be formatted.
 *        No explicit flags are set by default.
 *
 * provider: an explicit storage provider to use for the file
 *           system's database context provider.  A number of context
 *           providers are included (see /src/providers), and users
 *           can write one of their own and pass it in to be used.
 *           By default an IndexedDB provider is used.
 *
 * guid: a function for generating unique IDs for nodes in the filesystem.
 *       Use this to override the built-in UUID generation. (Used mainly for tests).
 *
 * callback: a callback function to be executed when the file system becomes
 *           ready for use. Depending on the context provider used, this might
 *           be right away, or could take some time. The callback should expect
 *           an `error` argument, which will be null if everything worked.  Also
 *           users should check the file system's `readyState` and `error`
 *           properties to make sure it is usable.
 */


function FileSystem(options, callback) {
  options = options || {};
  callback = callback || defaultCallback;
  var flags = options.flags || [];
  var guid = options.guid ? options.guid : defaultGuidFn;
  var provider = options.provider || new providers.Default(options.name || FILE_SYSTEM_NAME); // If we're given a provider, match its name unless we get an explicit name

  var name = options.name || provider.name;
  var forceFormatting = flags.includes(FS_FORMAT);
  var fs = this;
  fs.readyState = FS_PENDING;
  fs.name = name;
  fs.error = null;
  fs.stdin = STDIN;
  fs.stdout = STDOUT;
  fs.stderr = STDERR; // Expose Node's fs.constants to users

  fs.constants = fsConstants; // Node also forwards the access mode flags onto fs

  fs.F_OK = fsConstants.F_OK;
  fs.R_OK = fsConstants.R_OK;
  fs.W_OK = fsConstants.W_OK;
  fs.X_OK = fsConstants.X_OK; // Expose Shell constructor

  this.Shell = Shell.bind(undefined, this); // Safely expose the operation queue

  var queue = [];

  this.queueOrRun = function (operation) {
    var error;

    if (FS_READY === fs.readyState) {
      operation.call(fs);
    } else if (FS_ERROR === fs.readyState) {
      error = new Errors.EFILESYSTEMERROR('unknown error');
    } else {
      queue.push(operation);
    }

    return error;
  };

  function runQueued() {
    queue.forEach(function (operation) {
      operation.call(this);
    }.bind(fs));
    queue = null;
  } // We support the optional `options` arg from node, but ignore it


  this.watch = function (filename, options, listener) {
    if (Path.isNull(filename)) {
      throw new Error('Path must be a string without null bytes.');
    }

    if (typeof options === 'function') {
      listener = options;
      options = {};
    }

    options = options || {};
    listener = listener || nop;
    var watcher = new FSWatcher();
    watcher.start(filename, false, options.recursive);
    watcher.on('change', listener);
    return watcher;
  }; // Deal with various approaches to node ID creation


  function wrappedGuidFn(context) {
    return function (callback) {
      // Skip the duplicate ID check if asked to
      if (flags.includes(FS_NODUPEIDCHECK)) {
        callback(null, guid());
        return;
      } // Otherwise (default) make sure this id is unused first


      function guidWithCheck(callback) {
        var id = guid();
        context.getObject(id, function (err, value) {
          if (err) {
            callback(err);
            return;
          } // If this id is unused, use it, otherwise find another


          if (!value) {
            callback(null, id);
          } else {
            guidWithCheck(callback);
          }
        });
      }

      guidWithCheck(callback);
    };
  } // Let other instances (in this or other windows) know about
  // any changes to this fs instance.


  function broadcastChanges(changes) {
    if (!changes.length) {
      return;
    }

    var intercom = Intercom.getInstance();
    changes.forEach(function (change) {
      intercom.emit(change.event, change.path);
    });
  } // Open file system storage provider


  provider.open(function (err) {
    function complete(error) {
      function wrappedContext(methodName) {
        var context = provider[methodName]();
        context.name = name;
        context.flags = flags;
        context.changes = [];
        context.guid = wrappedGuidFn(context); // When the context is finished, let the fs deal with any change events

        context.close = function () {
          var changes = context.changes;
          broadcastChanges(changes);
          changes.length = 0;
        };

        return context;
      } // Wrap the provider so we can extend the context with fs flags and
      // an array of changes (e.g., watch event 'change' and 'rename' events
      // for paths updated during the lifetime of the context). From this
      // point forward we won't call open again, so it's safe to drop it.


      fs.provider = {
        openReadWriteContext: function openReadWriteContext() {
          return wrappedContext('getReadWriteContext');
        },
        openReadOnlyContext: function openReadOnlyContext() {
          return wrappedContext('getReadOnlyContext');
        }
      };

      if (error) {
        fs.readyState = FS_ERROR;
      } else {
        fs.readyState = FS_READY;
      }

      runQueued();
      callback(error, fs);
    }

    if (err) {
      return complete(err);
    }

    var context = provider.getReadWriteContext();
    context.guid = wrappedGuidFn(context); // Mount the filesystem, formatting if necessary

    if (forceFormatting) {
      // Wipe the storage provider, then write root block
      context.clear(function (err) {
        if (err) {
          return complete(err);
        }

        impl.ensureRootDirectory(context, complete);
      });
    } else {
      // Use existing (or create new) root and mount
      impl.ensureRootDirectory(context, complete);
    }
  });
  FileSystem.prototype.promises = {};
  /**
   * Public API for FileSystem. All node.js methods that are exposed on fs.promises
   * include `promise: true`.  We also include our own extra methods, but skip the
   * fd versions to match node.js, which puts these on a `FileHandle` object.
   * Any method that deals with path argument(s) also includes the position of
   * those args in one of `absPathArgs: [...]` or `relPathArgs: [...]`, so they
   * can be processed and validated before being passed on to the method.
   */

  [{
    name: 'appendFile',
    promises: true,
    absPathArgs: [0]
  }, {
    name: 'access',
    promises: true,
    absPathArgs: [0]
  }, {
    name: 'chown',
    promises: true,
    absPathArgs: [0]
  }, {
    name: 'chmod',
    promises: true,
    absPathArgs: [0]
  }, {
    name: 'close'
  }, // copyFile - https://github.com/filerjs/filer/issues/436
  {
    name: 'exists',
    absPathArgs: [0]
  }, {
    name: 'fchown'
  }, {
    name: 'fchmod'
  }, // fdatasync - https://github.com/filerjs/filer/issues/653
  {
    name: 'fgetxattr'
  }, {
    name: 'fremovexattr'
  }, {
    name: 'fsetxattr'
  }, {
    name: 'fstat'
  }, {
    name: 'fsync'
  }, {
    name: 'ftruncate'
  }, {
    name: 'futimes'
  }, {
    name: 'getxattr',
    promises: true,
    absPathArgs: [0]
  }, // lchown - https://github.com/filerjs/filer/issues/620
  // lchmod - https://github.com/filerjs/filer/issues/619
  {
    name: 'link',
    promises: true,
    absPathArgs: [0, 1]
  }, {
    name: 'lseek'
  }, {
    name: 'lstat',
    promises: true
  }, {
    name: 'mkdir',
    promises: true,
    absPathArgs: [0]
  }, {
    name: 'mkdtemp',
    promises: true
  }, {
    name: 'mknod',
    promises: true,
    absPathArgs: [0]
  }, {
    name: 'open',
    promises: true,
    absPathArgs: [0]
  }, {
    name: 'readdir',
    promises: true,
    absPathArgs: [0]
  }, {
    name: 'read'
  }, {
    name: 'readFile',
    promises: true,
    absPathArgs: [0]
  }, {
    name: 'readlink',
    promises: true,
    absPathArgs: [0]
  }, // realpath - https://github.com/filerjs/filer/issues/85
  {
    name: 'removexattr',
    promises: true,
    absPathArgs: [0]
  }, {
    name: 'rename',
    promises: true,
    absPathArgs: [0, 1]
  }, {
    name: 'rmdir',
    promises: true,
    absPathArgs: [0]
  }, {
    name: 'setxattr',
    promises: true,
    absPathArgs: [0]
  }, {
    name: 'stat',
    promises: true,
    absPathArgs: [0]
  }, {
    name: 'symlink',
    promises: true,
    relPathArgs: [0],
    absPathArgs: [1]
  }, {
    name: 'truncate',
    promises: true,
    absPathArgs: [0]
  }, // unwatchFile - https://github.com/filerjs/filer/pull/553
  {
    name: 'unlink',
    promises: true,
    absPathArgs: [0]
  }, {
    name: 'utimes',
    promises: true,
    absPathArgs: [0]
  }, // watch - implemented above in `this.watch`
  // watchFile - https://github.com/filerjs/filer/issues/654
  {
    name: 'writeFile',
    promises: true,
    absPathArgs: [0]
  }, {
    name: 'write'
  }].forEach(function (method) {
    var methodName = method.name;
    var shouldPromisify = method.promises === true;

    FileSystem.prototype[methodName] = function () {
      var fs = this;
      var args = Array.prototype.slice.call(arguments, 0);
      var lastArgIndex = args.length - 1; // We may or may not get a callback, and since node.js supports
      // fire-and-forget style fs operations, we have to dance a bit here.

      var missingCallback = typeof args[lastArgIndex] !== 'function';
      var callback = maybeCallback(args[lastArgIndex]); // Deal with path arguments, validating and normalizing Buffer and file:// URLs

      if (method.absPathArgs) {
        method.absPathArgs.forEach(function (pathArg) {
          return processPathArg(args, pathArg, false);
        });
      }

      if (method.relPathArgs) {
        method.relPathArgs.forEach(function (pathArg) {
          return processPathArg(args, pathArg, true);
        });
      }

      var error = fs.queueOrRun(function () {
        var context = fs.provider.openReadWriteContext(); // Fail early if the filesystem is in an error state (e.g.,
        // provider failed to open.

        if (FS_ERROR === fs.readyState) {
          var err = new Errors.EFILESYSTEMERROR('filesystem unavailable, operation canceled');
          return callback.call(fs, err);
        } // Wrap the callback so we can explicitly close the context


        function complete() {
          context.close();
          callback.apply(fs, arguments);
        } // Either add or replace the callback with our wrapper complete()


        if (missingCallback) {
          args.push(complete);
        } else {
          args[lastArgIndex] = complete;
        } // Forward this call to the impl's version, using the following
        // call signature, with complete() as the callback/last-arg now:
        // fn(fs, context, arg0, arg1, ... , complete);


        var fnArgs = [context].concat(args);
        impl[methodName].apply(null, fnArgs);
      });

      if (error) {
        callback(error);
      }
    }; // Add to fs.promises if appropriate


    if (shouldPromisify) {
      FileSystem.prototype.promises[methodName] = promisify(FileSystem.prototype[methodName].bind(fs));
    }
  });
} // Expose storage providers on FileSystem constructor


FileSystem.providers = providers;
module.exports = FileSystem;
},{"es6-promisify":"c0Ea","../path.js":"UzoP","../providers/index.js":"AiW7","../shell/shell.js":"D1Ra","../../lib/intercom.js":"u7Jv","../fs-watcher.js":"VLEe","../errors.js":"p8GN","../shared.js":"zBMa","../constants.js":"iJA9","./implementation.js":"bsBG","buffer":"dskh"}],"Focm":[function(require,module,exports) {
var Buffer = require("buffer").Buffer;
var fs = null;
var Filer = null;
module.exports = Filer = {
  FileSystem: require('./filesystem/interface.js'),
  Buffer: Buffer,
  // We previously called this Path, but node calls it path. Do both
  Path: require('./path.js'),
  path: require('./path.js'),
  Errors: require('./errors.js'),
  Shell: require('./shell/shell.js')
}; // Add a getter for the `fs` instance, which returns
// a Filer FileSystem instance, using the default provider/flags.

Object.defineProperty(Filer, 'fs', {
  enumerable: true,
  get: function get() {
    if (!fs) {
      fs = new Filer.FileSystem();
    }

    return fs;
  }
});
},{"./filesystem/interface.js":"GMi4","./path.js":"UzoP","./errors.js":"p8GN","./shell/shell.js":"D1Ra","buffer":"dskh"}]},{},["Focm"], "Filer")
//# sourceMappingURL=/filer.js.map