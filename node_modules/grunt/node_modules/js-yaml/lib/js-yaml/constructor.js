'use strict';


var $$ = require('./common');
var _errors = require('./errors');
var _nodes = require('./nodes');


function ConstructorError() {
  _errors.MarkedYAMLError.apply(this, arguments);
  this.name = 'ConstructorError';
}
$$.inherits(ConstructorError, _errors.MarkedYAMLError);


var BOOL_VALUES = {
  'y':        true,
  'yes':      true,
  'n':        false,
  'no':       false,
  'true':     true,
  'false':    false,
  'on':       true,
  'off':      false
};


var TIMESTAMP_REGEXP = new RegExp(
  '^([0-9][0-9][0-9][0-9])'           + // [1] year
  '-([0-9][0-9]?)'                    + // [2] month
  '-([0-9][0-9]?)'                    + // [3] day
  '(?:(?:[Tt]|[ \\t]+)'               + // ...
  '([0-9][0-9]?)'                     + // [4] hour
  ':([0-9][0-9])'                     + // [5] minute
  ':([0-9][0-9])'                     + // [6] second
  '(?:\\.([0-9]*))?'                  + // [7] fraction
  '(?:[ \\t]*(Z|([-+])([0-9][0-9]?)'  + // [8] tz [9] tz_sign [10] tz_hour
  '(?::([0-9][0-9]))?))?)?$'            // [11] tz_minute
);


function BaseConstructor() {
  this.constructedObjects = new $$.Hash();
  this.recursiveObjects = new $$.Hash();
  this.statePopulators = []; // was state_generators
  this.deepConstruct = false;

  this.yamlConstructors = BaseConstructor.yamlConstructors;
}

BaseConstructor.yamlConstructors = {};
BaseConstructor.addConstructor = function addConstructor(tag, constructor) {
  this.yamlConstructors[tag] = constructor;
};

BaseConstructor.prototype.checkData = function checkData() {
  return this.checkNode();
};

BaseConstructor.prototype.getData = function getData() {
  if (this.checkNode()) {
    return this.constructDocument(this.getNode());
  }
};

BaseConstructor.prototype.getSingleData = function getSingleData() {
  var node = this.getSingleNode();
  if (null !== node) {
    return this.constructDocument(node);
  }
  return null;
};

BaseConstructor.prototype.constructDocument = function constructDocument(node) {
  var data = this.constructObject(node),
      stateIterator, statePopulators;

  stateIterator = function (populator) { populator.execute(); };

  while (!!this.statePopulators.length) {
    statePopulators = this.statePopulators;
    this.statePopulators = [];

    statePopulators.forEach(stateIterator);
  }

  this.constructedObjects = new $$.Hash();
  this.recursiveObjects = new $$.Hash();
  this.deepConstruct = false;

  return data;
};

BaseConstructor.prototype.constructObject = function constructObject(node, deep) {
  var data, old_deep, constructor, populator;

  if (this.constructedObjects.hasKey(node)) {
    return this.constructedObjects.get(node);
  }

  if (!!deep) {
    old_deep = this.deepConstruct;
    this.deepConstruct = true;
  }

  if (this.recursiveObjects.hasKey(node)) {
    throw new ConstructorError(null, null,
                "found unconstructable recursive node",
                node.startMark);
  }

  this.recursiveObjects.store(node, null);

  if (undefined !== this.yamlConstructors[node.tag]) {
    constructor = this.yamlConstructors[node.tag];
  } else {
    if (undefined !== this.yamlConstructors[null]) {
      constructor = this.yamlConstructors[null];
    } else {
      throw new ConstructorError(null, null,
                  "can't find any constructor for tag=" + node.tag,
                  node.startMark);
    }
  }

  data = constructor.call(this, node);

  if (data instanceof $$.Populator) {
    populator = data;
    data = populator.data;

    if (this.deepConstruct) {
      populator.execute();
    } else {
      this.statePopulators.push(populator);
    }
  }

  this.constructedObjects.store(node, data);
  this.recursiveObjects.remove(node);

  if (deep) {
    this.deepConstruct = old_deep;
  }

  return data;
};

BaseConstructor.prototype.constructScalar = function constructScalar(node) {
  if (!$$.isInstanceOf(node, _nodes.ScalarNode)) {
    throw new ConstructorError(null, null,
                "expected a scalar node, but found " + node.id,
                node.startMark);
  }

  return node.value;
};

BaseConstructor.prototype.constructSequence = function constructSequence(node, deep) {
  if (!$$.isInstanceOf(node, _nodes.SequenceNode)) {
    throw new ConstructorError(null, null,
                "expected a sequence node, but found " + node.id,
                node.startMark);
  }

  return node.value.map(function (child) {
    return this.constructObject(child, deep);
  }, this);
};

BaseConstructor.prototype.constructMapping = function constructMapping(node, deep) {
  var mapping;

  if (!$$.isInstanceOf(node, _nodes.MappingNode)) {
    throw new ConstructorError(null, null,
                "expected a mapping node, but found " + node.id,
                node.startMark);
  }

  mapping = {};

  $$.each(node.value, function (pair) {
    var key_node = pair[0], value_node = pair[1], key, value;

    key = this.constructObject(key_node, deep);
    // TODO: Do we need to check
    if (undefined === key_node.hash) {
      throw new ConstructorError("while constructing a mapping", key_node.startMark,
                  "found unhashable key", key_node.startMark);
    }
    value = this.constructObject(value_node, deep);

    mapping[key] = value;
  }, this);

  return mapping;
};

BaseConstructor.prototype.constructPairs = function constructPairs(node, deep) {
  var pairs;

  if (!$$.isInstanceOf(node, _nodes.MappingNode)) {
    throw new ConstructorError(null, null,
                "expected a mapping node, but found " + node.id,
                node.startMark);
  }

  pairs = [];

  $$.each(node.value, function (pair) {
    var key, value;
    key = this.constructObject(pair[0], deep);
    value = this.constructObject(pair[1], deep);
    pairs.store(key, value);
  }, this);

  return pairs;
};


function SafeConstructor() {
  BaseConstructor.apply(this);
  this.yamlConstructors = SafeConstructor.yamlConstructors;
}

$$.inherits(SafeConstructor, BaseConstructor);

SafeConstructor.yamlConstructors = $$.extend({}, BaseConstructor.yamlConstructors);
SafeConstructor.addConstructor = BaseConstructor.addConstructor;

SafeConstructor.prototype.constructScalar = function constructScalar(node) {
  var result;

  if ($$.isInstanceOf(node, _nodes.MappingNode)) {
    $$.each(node.value, function (pair) {
      var key_node = pair[0], value_node = pair[1];

      if ('tag:yaml.org,2002:value' === key_node.tag) {
        result = this.constructScalar(value_node);
      }
    }, this);

    if (undefined !== result) {
      return result;
    }
  }

  return BaseConstructor.prototype.constructScalar.call(this, node);
};

SafeConstructor.prototype.flattenMapping = function flattenMapping(node) {
  var self = this, merge = [], index = 0, keyNode, valueNode, submerge,
      pushSingleValue, pushMultipleValues, submergeIterator;

  pushSingleValue = function (value) {
    merge.push(value);
  };

  pushMultipleValues = function (values) {
    values.forEach(pushSingleValue);
  };

  submergeIterator = function (subnode) {
    if (!$$.isInstanceOf(subnode, _nodes.MappingNode)) {
      throw new ConstructorError("while constructing a mapping", node.startMark,
                  "expected a mapping for merging, but found " + subnode.id,
                  subnode.startMark);
    }
    self.flattenMapping(subnode);
    submerge.push(subnode.value);
  };

  while (index < node.value.length) {
    keyNode = node.value[index][0];
    valueNode = node.value[index][1];

    if ('tag:yaml.org,2002:merge' === keyNode.tag) {
      node.value.splice(index, 1);

      if ($$.isInstanceOf(valueNode, _nodes.MappingNode)) {
        self.flattenMapping(valueNode);
        $$.each(valueNode.value, pushSingleValue);
      } else if ($$.isInstanceOf(valueNode, _nodes.SequenceNode)) {
        submerge = [];
        $$.each(valueNode.value, submergeIterator);
        $$.reverse(submerge).forEach(pushMultipleValues);
      } else {
        throw new ConstructorError("while constructing a mapping", node.startMark,
                    "expected a mapping or list of mappings for merging, but found " + valueNode.id,
                    valueNode.startMark);
      }
    } else if ('tag:yaml.org,2002:value' === keyNode.tag) {
      keyNode.tag = 'tag:yaml.org,2002:str';
      index += 1;
    } else {
      index += 1;
    }
  }

  if (!!merge.length) {
    $$.each(node.value, function (value) { merge.push(value); });
    node.value = merge;
  }
};

SafeConstructor.prototype.constructMapping = function constructMapping(node) {
  if ($$.isInstanceOf(node, _nodes.MappingNode)) {
    this.flattenMapping(node);
  }
  return BaseConstructor.prototype.constructMapping.call(this, node);
};

SafeConstructor.prototype.constructYamlNull = function constructYamlNull(node) {
  this.constructScalar(node);
  return null;
};

SafeConstructor.prototype.constructYamlBool = function constructYamlBool(node) {
  var value = this.constructScalar(node);
  return BOOL_VALUES[value.toLowerCase()];
};

SafeConstructor.prototype.constructYamlInt = function constructYamlInt(node) {
  var value = this.constructScalar(node).replace(/_/g, ''),
      sign = ('-' === value[0]) ? -1 : 1,
      base, digits = [];

  if (0 <= '+-'.indexOf(value[0])) {
    value = value.slice(1);
  }

  if ('0' === value) {
    return 0;
  } else if (/^0b/.test(value)) {
    return sign * parseInt(value.slice(2), 2);
  } else if (/^0x/.test(value)) {
    return sign * parseInt(value, 16);
  } else if ('0' === value[0]) {
    return sign * parseInt(value, 8);
  } else if (0 <= value.indexOf(':')) {
    value.split(':').forEach(function (v) {
      digits.unshift(parseInt(v, 10));
    });
    value = 0;
    base = 1;
    digits.forEach(function (d) {
      value += (d * base);
      base *= 60;
    });
    return sign * value;
  } else {
    return sign * parseInt(value, 10);
  }
};

SafeConstructor.prototype.constructYamlFloat = function constructYamlFloat(node) {
  var value = this.constructScalar(node).replace(/_/g, ''),
      sign = ('-' === value[0]) ? -1 : 1,
      base, digits = [];

  if (0 <= '+-'.indexOf(value[0])) {
    value = value.slice(1);
  }

  if ('.inf' === value) {
    return (1 === sign) ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
  } else if ('.nan' === value) {
    return NaN;
  } else if (0 <= value.indexOf(':')) {
    value.split(':').forEach(function (v) {
      digits.unshift(parseFloat(v, 10));
    });
    value = 0.0;
    base = 1;
    digits.forEach(function (d) {
      value += d * base;
      base *= 60;
    });
    return sign * value;
  } else {
    return sign * parseFloat(value, 10);
  }
};

SafeConstructor.prototype.constructYamlBinary = function constructYamlBinary(node) {
  try {
    return $$.decodeBase64(this.constructScalar(node));
  } catch (err) {
    throw new ConstructorError(null, null,
                "failed to decode base64 data: " + err.toString(), node.startMark);
  }
};

SafeConstructor.prototype.constructYamlTimestamp = function constructYamlTimestamp(node) {
  var match, year, month, day, hour, minute, second, fraction = 0,
      delta = null, tz_hour, tz_minute, data;

  match = TIMESTAMP_REGEXP.exec(this.constructScalar(node));

  // match: [1] year [2] month [3] day

  year = +(match[1]);
  month = +(match[2]) - 1; // JS month starts with 0
  day = +(match[3]);

  if (!match[4]) { // no hour
    return new Date(Date.UTC(year, month, day));
  }

  // match: [4] hour [5] minute [6] second [7] fraction

  hour = +(match[4]);
  minute = +(match[5]);
  second = +(match[6]);

  if (!!match[7]) {
    fraction = match[7].slice(0, 3);
    while (fraction.length < 3) { // milli-seconds
      fraction += '0';
    }
    fraction = +fraction;
  }

  // match: [8] tz [9] tz_sign [10] tz_hour [11] tz_minute

  if (!!match[9]) {
    tz_hour = +(match[10]);
    tz_minute = +(match[11] || 0);
    delta = (tz_hour * 60 + tz_minute) * 60000; // delta in mili-seconds
    if ('-' === match[9]) {
      delta = -delta;
    }
  }

  data = new Date(Date.UTC(year, month, day, hour, minute, second, fraction));

  if (!!delta) {
    data.setTime(data.getTime() - delta);
  }

  return data;
};

SafeConstructor.prototype.constructYamlOmap = function constructYamlOmap(node) {
  var self = this, omap = [];
  return $$.Populator(omap, function () {
    if (!$$.isInstanceOf(node, _nodes.SequenceNode)) {
      throw new ConstructorError("while constructing an ordered map", node.startMark,
                  "expected a sequence, but found " + node.id, node.startMark);
    }

    node.value.forEach(function (subnode) {
      var data, key, value;

      if (!$$.isInstanceOf(subnode, _nodes.MappingNode)) {
        throw new ConstructorError("while constructing an ordered map", node.startMark,
                    "expected a mapping of length 1, but found " + subnode.id,
                    subnode.startMark);
      }

      if (1 !== subnode.value.length) {
        throw new ConstructorError("while constructing an ordered map", node.startMark,
                      "expected a single mapping item, but found " + subnode.value.length + " items",
                      subnode.startMark);
      }

      key = self.constructObject(subnode.value[0][0]);
      value = self.constructObject(subnode.value[0][1]);
      data = Object.create(null);

      data[key] = value;

      omap.push(data);
    });
  });
};

SafeConstructor.prototype.constructYamlPairs = function constructYamlPairs(node) {
  var self = this, pairs = [];
  return $$.Populator(pairs, function () {
    if (!$$.isInstanceOf(node, _nodes.SequenceNode)) {
      throw new ConstructorError("while constructing pairs", node.startMark,
                "expected a sequence, but found " + node.id, node.startMark);
    }

    node.value.forEach(function (subnode) {
      var key, value;
     
      if (!$$.isInstanceOf(subnode, _nodes.MappingNode)) {
        throw new ConstructorError("while constructing pairs", node.startMark,
                    "expected a mapping of length 1, but found " + subnode.id,
                    subnode.startMark);
      }

      if (1 !== subnode.value.length) {
        throw new ConstructorError("while constructing pairs", node.startMark,
                    "expected a single mapping item, but found " + subnode.value.length + " items",
                    subnode.startMark);
      }

      key = self.constructObject(subnode.value[0][0]);
      value = self.constructObject(subnode.value[0][1]);

      pairs.push([key, value]);
    });
  });
};

SafeConstructor.prototype.constructYamlSet = function constructYamlSet(node) {
  var data = {};
  return $$.Populator(data, function () {
    $$.extend(data, this.constructMapping(node));
  }, this);
};

SafeConstructor.prototype.constructYamlStr = function constructYamlStr(node) {
  return this.constructScalar(node);
};

SafeConstructor.prototype.constructYamlSeq = function constructYamlSeq(node) {
  var data = [];
  return $$.Populator(data, function () {
    this.constructSequence(node).forEach(function (value) {
      data.push(value);
    });
  }, this);
};

SafeConstructor.prototype.constructYamlMap = function constructYamlMap(node) {
  var data = {};
  return $$.Populator(data, function () {
    $$.extend(data, this.constructMapping(node, true));
  }, this);
};

SafeConstructor.prototype.constructUndefined = function constructUndefined(node) {
  throw new ConstructorError(null, null,
              "could not determine constructor for the tag " + node.tag,
              node.startMark);
};


SafeConstructor.addConstructor(
  'tag:yaml.org,2002:null',
  SafeConstructor.prototype.constructYamlNull);

SafeConstructor.addConstructor(
  'tag:yaml.org,2002:bool',
  SafeConstructor.prototype.constructYamlBool);

SafeConstructor.addConstructor(
  'tag:yaml.org,2002:int',
  SafeConstructor.prototype.constructYamlInt);

SafeConstructor.addConstructor(
  'tag:yaml.org,2002:float',
  SafeConstructor.prototype.constructYamlFloat);

SafeConstructor.addConstructor(
  'tag:yaml.org,2002:binary',
  SafeConstructor.prototype.constructYamlBinary);

SafeConstructor.addConstructor(
  'tag:yaml.org,2002:timestamp',
  SafeConstructor.prototype.constructYamlTimestamp);

SafeConstructor.addConstructor(
  'tag:yaml.org,2002:omap',
  SafeConstructor.prototype.constructYamlOmap);

SafeConstructor.addConstructor(
  'tag:yaml.org,2002:pairs',
  SafeConstructor.prototype.constructYamlPairs);

SafeConstructor.addConstructor(
  'tag:yaml.org,2002:set',
  SafeConstructor.prototype.constructYamlSet);

SafeConstructor.addConstructor(
  'tag:yaml.org,2002:str',
  SafeConstructor.prototype.constructYamlStr);

SafeConstructor.addConstructor(
  'tag:yaml.org,2002:seq',
  SafeConstructor.prototype.constructYamlSeq);

SafeConstructor.addConstructor(
  'tag:yaml.org,2002:map',
  SafeConstructor.prototype.constructYamlMap);

SafeConstructor.addConstructor(
  null,
  SafeConstructor.prototype.constructUndefined);


function Constructor() {
  SafeConstructor.apply(this);
  this.yamlConstructors = Constructor.yamlConstructors;
}

$$.inherits(Constructor, SafeConstructor);

Constructor.yamlConstructors = $$.extend({}, SafeConstructor.yamlConstructors);
Constructor.addConstructor = SafeConstructor.addConstructor;

Constructor.prototype.constructJavascriptRegExp = function constructJavascriptRegExp(node) {
  var regexp = this.constructScalar(node),
      tail = /\/([gim]*)$/.exec(regexp),
      modifiers;

  // `/foo/gim` - tail can be maximum 4 chars
  if ('/' === regexp[0] && !!tail && 4 >= tail[0].length) {
    regexp = regexp.slice(1, regexp.length - tail[0].length);
    modifiers = tail[1];
  }

  return new RegExp(regexp, modifiers);
};

Constructor.prototype.constructJavascriptUndefined = function constructJavascriptUndefined() {
  var undef;
  return undef;
};

Constructor.prototype.constructJavascriptFunction = function constructJavascriptFunction(node) {
  /*jslint evil:true*/
  var func = new Function('return ' + this.constructScalar(node));
  return func();
};

Constructor.addConstructor(
  'tag:yaml.org,2002:js/undefined',
  Constructor.prototype.constructJavascriptUndefined);

Constructor.addConstructor(
  'tag:yaml.org,2002:js/regexp',
  Constructor.prototype.constructJavascriptRegExp);

Constructor.addConstructor(
  'tag:yaml.org,2002:js/function',
  Constructor.prototype.constructJavascriptFunction);


module.exports.BaseConstructor = BaseConstructor;
module.exports.SafeConstructor = SafeConstructor;
module.exports.Constructor = Constructor;


////////////////////////////////////////////////////////////////////////////////
// vim:ts=2:sw=2
////////////////////////////////////////////////////////////////////////////////
