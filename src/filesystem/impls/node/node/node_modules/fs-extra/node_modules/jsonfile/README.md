[![build status](https://secure.travis-ci.org/jprichardson/node-jsonfile.png)](http://travis-ci.org/jprichardson/node-jsonfile)

Node.js - jsonfile
================

Easily read/write JSON files. 


Why?
----

Writing `JSON.stringify()` and then `fs.writeFile()` and `JSON.parse()` with `fs.readFile()` enclosed in `try/catch` blocks became annoying.



Installation
------------

    npm install jsonfile --save



API
---

### readFile(filename, [options], callback)

```javascript
var jf = require('jsonfile')
  , util = require('util');

var file = '/tmp/data.json';
js.readFile(file, function(err, obj) {
  console.log(util.inspect(obj)); 
});
```


### readFileSync(filename, [options])

```javascript
var jf = require('jsonfile')
  , util = require('util');

var file = '/tmp/data.json';

console.log(util.inspect(jf.readFileSync(file)));
```


### writeFile(filename, [options], callback)

```javascript
var jf = require('jsonfile')

var file = '/tmp/data.json';
var obj = {name: 'JP'};

jf.writeFile(file, obj, function(err) {
  console.log(err);
})
```

### writeFileSync(filename, [options])

```javascript
var jf = require('jsonfile')

var file = '/tmp/data.json';
var obj = {name: 'JP'};

jf.writeFileSync(file, obj);
```


### spaces

Number of spaces to indent JSON files. 

**default:** 2

```
var jf = require('jsonfile');

jf.spaces = 4;

var file = '/tmp/data.json';
var obj = {name: 'JP'};

jf.writeFile(file, obj, function(err) { //json file has four space indenting now
  console.log(err);
});
```


Contributions
-------------

If you contribute to this library, please don't change the version numbers in your pull request.


### Contributors

(You can add your name, or I'll add it if you forget)

- [JP Richardson](https://github.com/jprichardson)
- [Sean O'Dell](https://github.com/seanodell)


License
-------

(MIT License)

Copyright 2012-2013, JP Richardson  <jprichardson@gmail.com>





