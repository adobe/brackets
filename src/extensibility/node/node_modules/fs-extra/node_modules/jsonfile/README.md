[![build status](https://secure.travis-ci.org/jprichardson/node-jsonfile.png)](http://travis-ci.org/jprichardson/node-jsonfile)

Node.js - jsonfile
================

Easily read/write JSON files. 


Why?
----

Writing `JSON.stringify()` and then `fs.writeFile()` and `JSON.parse()` with `fs.readFile()` enclosed in `try/catch` blocks became annoying.



Installation
------------

    npm install jsonfile



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

**default:** 4

```
var jf = require('jsonfile');

jf.spaces = 2;

var file = '/tmp/data.json';
var obj = {name: 'JP'};

jf.writeFile(file, obj, function(err) { //json file has two space indenting now
    console.log(err);
});
```


Author
------

`node-jsonfile` was written by [JP Richardson][aboutjp]. You should follow him on Twitter [@jprichardson][twitter]. Also read his coding blog [Procbits][procbits]. If you write software with others, you should checkout [Gitpilot][gitpilot] to make collaboration with Git simple.



License
-------

(MIT License)

Copyright 2012, JP Richardson  <jprichardson@gmail.com>


[aboutjp]: http://about.me/jprichardson
[twitter]: http://twitter.com/jprichardson
[procbits]: http://procbits.com
[gitpilot]: http://gitpilot.com


