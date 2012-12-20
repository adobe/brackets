JS-YAML - YAML 1.1 parser for JavaScript
========================================

[![Build Status](https://secure.travis-ci.org/nodeca/js-yaml.png)](http://travis-ci.org/nodeca/js-yaml)

[Online Demo](http://nodeca.github.com/js-yaml/)

This is a native port of [PyYAML](http://pyyaml.org/), the most advanced YAML parser.
Now you can use all modern YAML feature right in JavaScript. Originally snapshoted
version - PyYAML 3.10 (2011-05-30).


## Breaking changes in 0.3.x -> 1.0.x

- `y`, `yes`, `n`, `no`, `on`, `off` are not converted to Booleans anymore.
  Decision to drop support of such "magic" was made after speaking with YAML
  core developers: from now on we try to keep as minimal subset of rules as
  possible to keep things obvious. Booleans are following YAML 1.2 core schema
  now: http://www.yaml.org/spec/1.2/spec.html#id2804923
- `require('file.yml')` now returns a single document (was array of documents)
  and throws an error when file contains multiple documents. That should improve
  switching between YAML <-> JSON. So `require('file.yml')` will give the same
  result as if it was `require('file.json')` now.
- CLI tool `js-yaml` become part of `js-yaml` again.


## Installation

### YAML module for node.js

```
npm install js-yaml
```


### CLI executable

If you want to inspect your YAML files from CLI, install js-yaml globally:

```
npm install js-yaml -g
```

##### Usage

    usage: js-yaml [-h] [-v] [-c] [-j] [-t] file

    Positional arguments:
      file           File with YAML document(s)

    Optional arguments:
      -h, --help     Show this help message and exit.
      -v, --version  Show program's version number and exit.
      -c, --compact  Display errors in compact mode
      -j, --to-json  Output a non-funky boring JSON
      -t, --trace    Show stack trace on error



### bundled YAML library for browser

``` html
<script src="js-yaml.min.js"></script>
<script type="text/javascript">
var doc = jsyaml.load('greeting: hello\nname: world');
</script>
```

Browser support is still buggy, and mostly done to run online demo. If you
can help to improve browser compatibility and AMD support - rise pull request.

**Support of oldIEs** and some other prehistoric browsers is possible using
[es5-shims](https://github.com/kriskowal/es5-shim). Just include shims before
jsyaml to use it with outdated browsers.


## API

JS-YAML automatically registers handlers for `.yml` and `.yaml` files. You can load them just with `require`.
That's mostly equivalent to calling loadAll() on file handler ang gathering all documents into array.
Just with one string!

``` javascript
require('js-yaml');

// Get document, or throw exception on error
var doc = require('/home/ixti/example.yml');

console.log(doc);
```


### load (string|buffer|file\_resource)

Parses source as single YAML document. Returns JS object or throws exception on error.

This function does NOT understands multi-doc sources, it throws exception on those.

``` javascript
var yaml = require('js-yaml');

// pass the string
fs.readFile('/home/ixti/example.yml', 'utf8', function (err, data) {
  if (err) {
    // handle error
    return;
  }
  try {
    console.log( yaml.load(data) );
  } catch(e) {
    console.log(e);
  }
});
```


### loadAll (string|buffer|file\_resource, iterator)

Same as `Load`, but understands multi-doc sources and apply iterator to each document.

``` javascript
var yaml = require('js-yaml');

// pass the string
fs.readFile('/home/ixti/example.yml', 'utf8', function (err, data) {
  if (err) {
    // handle error
    return;
  }

  try {
    yaml.loadAll(data, function (doc) {
      console.log(doc);
    });
  } catch(e) {
    console.log(e);
  }
});
```


### safeLoad (string|buffer|file\_resource)

Same as `load()` but uses _safe_ schema - only recommended tags of YAML
specification (no JavaScript-specific tags, e.g. `!!js/regexp`).


### safeLoadAll (string|buffer|file\_resource, iterator)

Same as `loadAll()` but uses _safe_ schema - only recommended tags of YAML
specification (no JavaScript-specific tags, e.g. `!!js/regexp`).


## JavaScript YAML tags scheme

The list of standard YAML tags and corresponding JavaScipt types. See also
[YAML Tag Discussion](http://pyyaml.org/wiki/YAMLTagDiscussion) and [Yaml Types](http://yaml.org/type/).

```
!!null ''                   # null
!!bool 'yes'                # bool
!!int '3...'                # number
!!float '3.14...'           # number
!!binary '...base64...'     # buffer
!!timestamp 'YYYY-...'      # date
!!omap [ ... ]              # array of key-value pairs
!!pairs [ ... ]             # array or array pairs
!!set { ... }               # array of objects with given keys and null values
!!str '...'                 # string
!!seq [ ... ]               # array
!!map { ... }               # object
```

**JavaScript-specific tags**

```
!!js/regexp /pattern/gim            # RegExp
!!js/undefined ''                   # Undefined
!!js/function 'function () {...}'   # Function
```

### Caveats

Note, that you use arrays or objects as key in JS-YAML. JS do not allows objects
or array as keys, and stringifies them at the moment of adding them.

``` yaml
---
? [ foo, bar ]
: - baz
? { foo: bar }
: - baz
  - baz
```

=>

``` javascript
{ "": ["baz"], "[object Object]": ["baz", "baz"] }
```

## License

View the [LICENSE](https://github.com/nodeca/js-yaml/blob/master/LICENSE) file (MIT).
