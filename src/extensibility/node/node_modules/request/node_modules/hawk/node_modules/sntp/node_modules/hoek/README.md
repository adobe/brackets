<a href="https://github.com/walmartlabs/blammo"><img src="https://raw.github.com/walmartlabs/blammo/master/images/from.png" align="right" /></a>
![hoek Logo](https://raw.github.com/walmartlabs/hoek/master/images/hoek.png)

General purpose node utilities

[![Build Status](https://secure.travis-ci.org/walmartlabs/hoek.png)](http://travis-ci.org/walmartlabs/hoek)

# Table of Contents

* [Introduction](#introduction "Introduction")
* [Object](#object "Object")
  * [clone](#cloneobj "clone")
  * [merge](#mergetarget-source-isnulloverride-ismergearrays "merge")
  * [applyToDefaults](#applytodefaultsdefaults-options "applyToDefaults")
  * [unique](#uniquearray-key "unique")
  * [mapToObject](#maptoobjectarray-key "mapToObject")
  * [intersect](#intersectarray1-array2 "intersect")
  * [matchKeys](#matchkeysobj-keys "matchKeys")
  * [flatten](#flattenarray-target "flatten")
  * [removeKeys](#removekeysobject-keys "removeKeys")
  * [reach](#reachobj-chain "reach")
  * [inheritAsync](#inheritasyncself-obj-keys "inheritAsync")
  * [rename](#renameobj-from-to "rename")
* [Timer](#timer "Timer")
* [Binary Encoding/Decoding](#binary "Binary Encoding/Decoding")
  * [base64urlEncode](#binary64urlEncodevalue "binary64urlEncode")
  * [base64urlDecode](#binary64urlDecodevalue "binary64urlDecode")
* [Escaping Characters](#escaped "Escaping Characters")
  * [escapeHTML](#escapeHTMLstring "escapeHTML")
  * [escapeHeaderAttribute](#escapeHeaderAttributeattribute "escapeHeaderAttribute")
  * [escapeRegex](#escapeRegexstring "escapeRegex")
* [Errors](#errors "Errors")
  * [assert](#assertmessage "assert")
  * [abort](#abortmessage "abort")
  * [displayStack](#displayStackslice "displayStack")
  * [callStack](#callStackslice "callStack")



# Introduction

The *Hoek* general purpose node utilities library is used to aid in a variety of manners. It comes with useful methods for Ararys (clone, merge, applyToDefaults), Objects (removeKeys, copy), Asserting and more. 

For example, to use Hoek to set configuration with default options:
```javascript
var Hoek = require('hoek');

var default = {url : "www.github.com", port : "8000", debug : true}

var config = Hoek.applyToDefaults(default, {port : "3000", admin : true});

// In this case, config would be { url: 'www.github.com', port: '3000', debug: true, admin: true }
```

Under each of the sections (such as Array), there are subsections which correspond to Hoek methods. Each subsection will explain how to use the corresponding method. In each js excerpt below, the var Hoek = require('hoek') is omitted for brevity.

## Object

Hoek provides several helpful methods for objects and arrays.

### clone(obj)

This method is used to clone an object or an array. A *deep copy* is made (duplicates everything, including values that are objects). 

```javascript

var nestedObj = {
        w: /^something$/ig,
        x: {
            a: [1, 2, 3],
            b: 123456,
            c: new Date()
        },
        y: 'y',
        z: new Date()
    };

var copy = Hoek.clone(nestedObj);

copy.x.b = 100;

console.log(copy.y)        // results in 'y'
console.log(nestedObj.x.b) // results in 123456
console.log(copy.x.b)      // results in 100
```

### merge(target, source, isNullOverride, isMergeArrays)
isNullOverride, isMergeArrays default to true

Merge all the properties of source into target, source wins in conflic, and by default null and undefined from source are applied


```javascript

var target = {a: 1, b : 2}
var source = {a: 0, c: 5}
var source2 = {a: null, c: 5}

var targetArray = [1, 2, 3];
var sourceArray = [4, 5];

var newTarget = Hoek.merge(target, source);     // results in {a: 0, b: 2, c: 5}
newTarget = Hoek.merge(target, source2);        // results in {a: null, b: 2, c: 5}
newTarget = Hoek.merge(target, source2, false); // results in {a: 1, b:2, c: 5}

newTarget = Hoek.merge(target, source)              // results in [1, 2, 3, 4, 5]
newTarget = Hoek.merge(target, source, true, false) // results in [4, 5]




```

### applyToDefaults(defaults, options)

Apply options to a copy of the defaults

```javascript

var defaults = {host: "localhost", port: 8000};
var options = {port: 8080};

var config = Hoek.applyToDefaults(defaults, options); // results in {host: "localhost", port: 8080};


```

### unique(array, key)

Remove duplicate items from Array

```javascript

var array = [1, 2, 2, 3, 3, 4, 5, 6];

var newArray = Hoek.unique(array); // results in [1,2,3,4,5,6];

array = [{id: 1}, {id: 1}, {id: 2}];

newArray = Hoek.unique(array, "id") // results in [{id: 1}, {id: 2}]

```

### mapToObject(array, key)

Convert an Array into an Object

```javascript

var array = [1,2,3];
var newObject = Hoek.mapToObject(array); // results in [{"1": true}, {"2": true}, {"3": true}]

array = [{id: 1}, {id: 2}];
newObject = Hoek.mapToObject(array, "id") // results in [{"id": 1}, {"id": 2}]

```
### intersect(array1, array2)

Find the common unique items in two arrays

```javascript

var array1 = [1, 2, 3];
var array2 = [1, 4, 5];

var newArray = Hoek.intersect(array1, array2) // results in [1]

```

### matchKeys(obj, keys) 

Find which keys are present

```javascript

var obj = {a: 1, b: 2, c: 3};
var keys = ["a", "e"];

Hoek.matchKeys(obj, keys) // returns ["a"]

```

### flatten(array, target)

Flatten an array

```javascript

var array = [1, 2, 3];
var target = [4, 5]; 

var flattenedArray = Hoek.flatten(array, target) // results in [4, 5, 1, 2, 3];

```

### removeKeys(object, keys)

Remove keys

```javascript

var object = {a: 1, b: 2, c: 3, d: 4};

var keys = ["a", "b"];

Hoek.removeKeys(object, keys) // object is now {c: 3, d: 4}

```

### reach(obj, chain)

Converts an object key chain string to reference

```javascript

var chain = 'a.b.c';
var obj = {a : {b : { c : 1}}};

Hoek.reach(obj, chain) // returns 1

```

### inheritAsync(self, obj, keys) 

Inherits a selected set of methods from an object, wrapping functions in asynchronous syntax and catching errors

```javascript

var targetFunc = function () { };

var proto = {
                a: function () {
                    return 'a!';
                },
                b: function () {
                    return 'b!';
                },
                c: function () {
                    throw new Error('c!');
                }
            };

var keys = ['a', 'c'];

Hoek.inheritAsync(targetFunc, proto, ['a', 'c']);

var target = new targetFunc();

target.a()                         // returns 'a!'                         
target.c()                         // returns 'c!'
target.b()                         // returns undefined


```

# rename(obj, from, to)

Rename a key of an object

```javascript

var obj = {a : 1, b : 2};

Hoek.rename(obj, "a", "c");     // obj is now {c : 1, b : 2}

```


# Timer

A Timer object

```javascript


example : 


var timerObj = new Hoek.Timer();
console.log("Time is now: " + timerObj.ts)
console.log("Elapsed time from initialization: " + timerObj.elapsed)



