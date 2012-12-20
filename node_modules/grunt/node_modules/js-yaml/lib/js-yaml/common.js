'use strict';


var $$ = module.exports = {};


// UTILITY METHODS
////////////////////////////////////////////////////////////////////////////////


// <object> $$.extend(receiver, *sources)
//
// Copy all of the properties in the source objects over to the target object.
// It's in-order, so the last source will override properties of the same name
// in previous arguments.
//
// Example: var o = $$.extend({}, a, b, c);
$$.extend = function extend(receiver) {
  var i, l, key, skip = [];

  receiver = receiver || {};
  l = arguments.length;

  if (!!arguments[l - 1] && !!arguments[l - 1].except) {
    skip = arguments[l - 1].except;
    l -= 1;
  }

  for (i = 1; i < l; i += 1) {
    if (!!arguments[i] && 'object' === typeof arguments[i]) {
      for (key in arguments[i]) {
        if (arguments[i].hasOwnProperty(key) && -1 === skip.indexOf(key)) {
          receiver[key] = arguments[i][key];
        }
      }
    }
  }

  return receiver;
};


// simple inheritance algorithm
$$.inherits = function inherits(child, parent) {
  var InheritanceGlue = function () {};

  InheritanceGlue.prototype = parent.prototype;
  child.prototype = new InheritanceGlue();

  // copy parent prototype' methods into child, so mixing made possible
  // think of it as of caching of parent's prototype methods in child
  $$.extend(child.prototype, parent.prototype, {except: [
    'arguments', 'length', 'name', 'prototype', 'caller'
  ]});

  // restore constructor
  $$.extend(child.prototype, {constructor: child});

  child.__parent__ = parent;
};


// wrapper for instanceof that allows to check inheritance after $$.inherits
$$.isInstanceOf = function isInstanceOf(obj, klass) {
  var parent;

  if (obj instanceof klass) {
    return true;
  }

  if (!!obj && !!obj.constructor) {
    parent = obj.constructor.__parent__;
    return (parent === klass || $$.isInstanceOf(parent, klass));
  }

  return false;
};


// iterates through all object keys-value pairs calling iterator on each one
// example: $$.each(objOrArr, function (val, key) { /* ... */ });
$$.each = function each(obj, iterator, context) {
  var keys, i, l;

  if (null === obj || undefined === obj) {
    return;
  }

  context = context || iterator;

  if (obj.forEach === Array.prototype.forEach) {
    obj.forEach(iterator, context);
  } else {
    keys = Object.getOwnPropertyNames(obj);
    for (i = 0, l = keys.length; i < l; i += 1) {
      iterator.call(context, obj[keys[i]], keys[i], obj);
    }
  }
};


// returns reversed copy of array
$$.reverse = function reverse(arr) {
  var result = [], i, l;
  for (i = 0, l = arr.length; i < l; i += 1) {
    result.unshift(arr[i]);
  }
  return result;
};


// Modified from:
// https://raw.github.com/kanaka/noVNC/d890e8640f20fba3215ba7be8e0ff145aeb8c17c/include/base64.js
$$.decodeBase64 = (function () {
  var padding = '=', binTable = [
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 62, -1, -1, -1, 63,
    52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1, -1, -1,  0, -1, -1,
    -1,  0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14,
    15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, -1, -1, -1, -1, -1,
    -1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
    41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, -1, -1, -1, -1, -1
  ];

  return function decode(data) {
    var value, code, idx = 0, result = [], leftbits, leftdata;

    leftbits = 0; // number of bits decoded, but yet to be appended
    leftdata = 0; // bits decoded, but yet to be appended

    // Convert one by one.
    for (idx = 0; idx < data.length; idx += 1) {
      code = data.charCodeAt(idx);
      value = binTable[code & 0x7F];

      // Skip LF(NL) || CR
      if (0x0A !== code && 0x0D !== code) {
        // Fail on illegal characters
        if (-1 === value) {
          throw new Error("Illegal characters (code=" + code + ") in position " +
                          idx + ": ordinal not in range(0..128)");
        }

        // Collect data into leftdata, update bitcount
        leftdata = (leftdata << 6) | value;
        leftbits += 6;

        // If we have 8 or more bits, append 8 bits to the result
        if (leftbits >= 8) {
          leftbits -= 8;
          // Append if not padding.
          if (padding !== data.charAt(idx)) {
            result.push((leftdata >> leftbits) & 0xFF);
          }
          leftdata &= (1 << leftbits) - 1;
        }
      }
    }

    // If there are any bits left, the base64 string was corrupted
    if (leftbits) {
      throw new Error("Corrupted base64 string");
    }

    return new Buffer(result);
  };
}());


// CLASSES
////////////////////////////////////////////////////////////////////////////////


// Dummy alternative of delayed population based on generators in PyYAML
$$.Populator = function Populator(data, callback, context) {
  if (!(this instanceof $$.Populator)) {
    return new $$.Populator(data, callback, context);
  }

  this.data = data;
  this.execute = function () {
    callback.call(context || callback);
  };
};


// Simple implementation of hashtable
$$.Hash = function Hash(defaultValue) {
  var keys, values, index;

  if (!(this instanceof $$.Hash)) {
    return new $$.Hash(defaultValue);
  }

  index = 0;
  keys = [];
  values = [];

  this.store = function store(key, value) {
    var i = keys.indexOf(key);

    if (0 <= i) {
      values[i] = value;
      return;
    }

    i = index;
    index += 1;

    keys[i] = key;
    values[i] = value;
  };


  this.remove = function remove(key) {
    var i = keys.indexOf(key);

    if (0 <= i) {
      delete keys[i];
      delete values[i];
    }
  };


  this.hasKey = function hasKey(key) {
    return 0 <= keys.indexOf(key);
  };


  this.get = function get(key) {
    var i = keys.indexOf(key);
    return (0 <= i) ? values[i] : defaultValue;
  };
};


////////////////////////////////////////////////////////////////////////////////
// vim:ts=2:sw=2
////////////////////////////////////////////////////////////////////////////////
