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

### readFile()

```javascript
var jf = require('jsonfile')
  , util = require('util');

var file = '/tmp/data.json';
js.readFile(file, function(err, obj) {
  console.log(util.inspect(obj)); 
});
```


### readFileSync()

```javascript
var jf = require('jsonfile')
  , util = require('util');

var file = '/tmp/data.json';

console.log(util.inspect(jf.readFileSync(file)));
```


### writeFile()

```javascript
var jf = require('jsonfile')

var file = '/tmp/data.json';
var obj = {name: 'JP'};

jf.writeFile(file, obj, function(err) {
  console.log(err);
})
```

### writeFileSync()

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


License
-------

(MIT License)

Copyright 2012-2013, JP Richardson  <jprichardson@gmail.com>


[aboutjp]: http://about.me/jprichardson
[twitter]: http://twitter.com/jprichardson
[procbits]: http://procbits.com



