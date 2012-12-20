# findup-sync

Find the first file matching a given pattern in the current directory or the nearest ancestor directory.

## Getting Started
Install the module with: `npm install findup-sync`

```js
var findup = require('findup-sync');

// Start looking in the CWD.
var filepath1 = findup('{a,b}*.txt');

// Start looking somewhere else, and ignore case (probably a good idea).
var filepath2 = findup('{a,b}*.txt', {cwd: '/some/path', nocase: true});
```

## Usage

```js
findup(patternOrPatterns [, minimatchOptions])
```

### patternOrPatterns
Type: `String` or `Array`  
Default: none

One or more wildcard glob patterns. Or just filenames.

### minimatchOptions
Type: `Object`  
Default: `{}`

Options to be passed to [minimatch](https://github.com/isaacs/minimatch).

Note that if you want to start in a different directory than the current working directory, specify a `cwd` property here.
