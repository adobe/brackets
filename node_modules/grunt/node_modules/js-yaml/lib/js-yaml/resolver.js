'use strict';


var $$ = require('./common');
var _nodes = require('./nodes');


var DEFAULT_SCALAR_TAG = 'tag:yaml.org,2002:str';
var DEFAULT_SEQUENCE_TAG = 'tag:yaml.org,2002:seq';
var DEFAULT_MAPPING_TAG = 'tag:yaml.org,2002:map';


function BaseResolver() {
  this.resolverExactPaths = [];
  this.resolverPrefixPaths = [];
  this.yamlImplicitResolvers = BaseResolver.yamlImplicitResolvers;
}

BaseResolver.yamlImplicitResolvers = {};
BaseResolver.addImplicitResolver = function addImplicitResolver(tag, regexp, first) {
  var self = this;

  if (undefined === first) {
    first = [null];
  }

  first.forEach(function (ch) {
    if (undefined === self.yamlImplicitResolvers[ch]) {
      self.yamlImplicitResolvers[ch] = [];
    }

    self.yamlImplicitResolvers[ch].push([tag, regexp]);
  });
};

BaseResolver.prototype.resolve = function resolve(kind, value, implicit) {
  var resolvers, i, tag, regexp;

  if (kind === _nodes.ScalarNode && implicit && implicit[0]) {
    if (value === '') {
      resolvers = this.yamlImplicitResolvers[''] || [];
    } else {
      resolvers = this.yamlImplicitResolvers[value[0]] || [];
    }

    resolvers = resolvers.concat(this.yamlImplicitResolvers[null] || []);

    for (i = 0; i < resolvers.length; i += 1) {
      tag = resolvers[i][0];
      regexp = resolvers[i][1];

      if (regexp.test(value)) {
        return tag;
      }
    }
  }

  if (kind === _nodes.ScalarNode) {
    tag = DEFAULT_SCALAR_TAG;
  } else if (kind === _nodes.SequenceNode) {
    tag = DEFAULT_SEQUENCE_TAG;
  } else if (kind === _nodes.MappingNode) {
    tag = DEFAULT_MAPPING_TAG;
  } else {
    tag = null;
  }

  return tag;
};


function Resolver() {
  BaseResolver.apply(this, arguments);
  this.yamlImplicitResolvers = Resolver.yamlImplicitResolvers;
}

$$.inherits(Resolver, BaseResolver);

Resolver.yamlImplicitResolvers = {};
Resolver.addImplicitResolver = BaseResolver.addImplicitResolver;

Resolver.addImplicitResolver('tag:yaml.org,2002:bool',
  new RegExp('^(?:true|True|TRUE|false|False|FALSE)$'),
  ['t', 'T', 'f', 'F']);

Resolver.addImplicitResolver('tag:yaml.org,2002:float',
  new RegExp('^(?:[-+]?(?:[0-9][0-9_]*)\\.[0-9_]*(?:[eE][-+][0-9]+)?' +
             '|\\.[0-9_]+(?:[eE][-+][0-9]+)?' +
             '|[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+\\.[0-9_]*' +
             '|[-+]?\\.(?:inf|Inf|INF)' +
             '|\\.(?:nan|NaN|NAN))$'),
  ['-', '+', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.']);

Resolver.addImplicitResolver('tag:yaml.org,2002:int',
  new RegExp('^(?:[-+]?0b[0-1_]+' +
             '|[-+]?0[0-7_]+' +
             '|[-+]?(?:0|[1-9][0-9_]*)' +
             '|[-+]?0x[0-9a-fA-F_]+' +
             '|[-+]?[1-9][0-9_]*(?::[0-5]?[0-9])+)$'),
  ['-', '+', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9']);

Resolver.addImplicitResolver('tag:yaml.org,2002:merge',
  new RegExp('^(?:<<)$'),
  ['<']);

Resolver.addImplicitResolver('tag:yaml.org,2002:null',
  new RegExp('^(?:~|null|Null|NULL|)$'),
  ['~', 'n', 'N', '']);

Resolver.addImplicitResolver('tag:yaml.org,2002:timestamp',
  new RegExp('^(?:[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]' +
             '|[0-9][0-9][0-9][0-9]-[0-9][0-9]?-[0-9][0-9]?' +
             '(?:[Tt]|[ \\t]+)[0-9][0-9]?' +
             ':[0-9][0-9]:[0-9][0-9](?:\\.[0-9]*)?' +
             '(?:[ \\t]*(?:Z|[-+][0-9][0-9]?(?::[0-9][0-9])?))?)$'),
  ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']);

Resolver.addImplicitResolver('tag:yaml.org,2002:value',
  new RegExp('^(?:=)$'),
  ['=']);

// The following resolver is only for documentation purposes. It cannot work
// because plain scalars cannot start with '!', '&', or '*'.
Resolver.addImplicitResolver('tag:yaml.org,2002:yaml',
  new RegExp('^(?:!|&|\\*)$'),
  ['!', '&', '*']);



module.exports.BaseResolver = BaseResolver;
module.exports.Resolver = Resolver;


////////////////////////////////////////////////////////////////////////////////
// vim:ts=2:sw=2
////////////////////////////////////////////////////////////////////////////////
