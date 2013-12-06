// TOML parser implementation, v0.0.8
// Copyright (c)2013 alexander.beletsky@gmail.com
// Distributed under MIT license
// http://github.com/alexander.beletsky/toml.js
(function (root, factory) {
  if (typeof exports === 'object') {

    module.exports = factory();

  } else if (typeof define === 'function' && define.amd) {

    define(factory);

  } 
}(this, function () {

  var toml = (function () {
  
      var parseGroup = function (context, str) {
          var result = context.result;
          var group = parseGroupName(str);
          if (group.indexOf('.') !== -1) {
              var groups = parseSubGroups(group);
              addGroups(result, groups);
          } else {
              addGroup(result, group);
          }
  
          function parseGroupName(str) {
              var start = str.indexOf('['), end = str.indexOf(']');
              return str.substring(start + 1, end);
          }
  
          function parseSubGroups(str) {
              return str.split('.');
          }
  
          function addGroup(result, group) {
              if (result[group]) {
                  throw new Error('"' + group + '" is overriding existing value');
              }
  
              var current = result[group] = {};
              context.currentGroup = current;
          }
  
          function addGroups(result, groups) {
              groups.reduce(function (prev, current) {
                  if (!result[prev]) {
                      addGroup(result, prev);
                  }
                  addGroup(result[prev], current);
                  return current;
              });
          }
      };
  
      var parseExpression = function (context, line) {
          var pair = parseNameValue(line);
          var value = parseValue(pair.value);
          var currentGroup = context.currentGroup || context.result;
  
          currentGroup[pair.name] = value;
  
          function parseNameValue(line) {
              var equal = line.indexOf('=');
              return {
                  name: line.substring(0, equal),
                  value: line.substring(equal + 1)
              };
          }
  
          function parseValue(value) {
              if (array(value)) {
                  return parseArray(value);
              }
  
              return parsePrimitive(value);
  
              function array(value) {
                  return value.charAt(0) === '[' && value.charAt(value.length - 1) === ']';
              }
          }
  
          function parseArray(value) {
              var values = parseArrayValues(value);
              return values.map(function(v) {
                  return parseValue(v);
              });
  
              function parseArrayValues(value) {
                  var parsed = [];
                  var array = value.substring(1, value.length - 1);
                  var map = commasMap(array);
                  map.reduce(function(prev, next) {
                      parsed.push(array.substring(prev + 1, next));
                      return next;
                  }, -1);
  
                  return parsed;
  
                  function commasMap(value) {
                      var map = [];
                      var inArray = false, depth = 0;
                      for(var index = 0; index < value.length; index++) {
                          var element = value[index];
                          if (element === '[') {
                              depth++;
                          } else if (element === ']') {
                              depth--;
                          }
  
                          if (element === ',' && depth === 0) {
                              map.push(index);
                          }
                      }
  
                      map.push(value.length);
  
                      return map;
                  }
              }
          }
  
          function parsePrimitive(value) {
              if (date(value)) {
                  return new Date(value);
              }
  
              return eval(value);
  
              function date(value) {
                  return (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/).test(value);
              }
          }
      };
  
      var parseLine = function (context, line) {
          if (group(line)) {
              parseGroup(context, line);
          } else if (expression(line)) {
              parseExpression(context, line);
          } else if (empty(line)) {
              resetContext();
          }
  
          function group(line) {
              return line.charAt(0) === '[';
          }
  
          function expression(line) {
              return line.indexOf('=') > 0;
          }
  
          function empty(line) {
              return line === '';
          }
  
          function resetContext() {
              delete context.currentGroup;
          }
      };
  
      var parse = function (context, lines) {
          mergeMultilines(lines).forEach(function (line) {
              line = stripComments(replaceWhitespaces(line));
              parseLine(context, line);
          });
  
          function replaceWhitespaces(line) {
              return line.replace(/\s/g, '');
          }
  
          function stripComments(line) {
              return line.split('#')[0];
          }
  
          function mergeMultilines(lines) {
              var merged = [], acc = [], capture = false, merge = false;
              lines.forEach(function (line) {
                  if (multilineArrayStart(line)) {
                      capture = true;
                  }
  
                  if (capture && multilineArrayEnd(line)) {
                      merge = true;
                  }
  
                  if (capture) {
                      acc.push(line);
                  } else {
                      merged.push(line);
                  }
  
                  if (merge) {
                      capture = false; merge = false;
                      merged.push(acc.join(''));
                      acc = [];
                  }
              });
  
              return merged;
  
              function multilineArrayStart(line) {
                  return line.indexOf('[') !== -1 && line.indexOf(']') === -1;
              }
  
              function multilineArrayEnd(line) {
                  return line.indexOf(']') !== -1;
              }
          }
      };
  
      var startParser = function (str) {
          var context = {}; context.result = {};
          var lines = str.toString().split('\n');
  
          parse(context, lines);
  
          return context.result;
      };
  
      String.prototype.replaceAll = function (find, replace) {
          var str = this;
          return str.replace(new RegExp(find, 'g'), replace);
      };
  
      var escapeString = function(str) {
          return str
              .replaceAll('\b', '\\b')
              .replaceAll('\t', '\\t')
              .replaceAll('\n', '\\n')
              .replaceAll('\f', '\\f')
              .replaceAll('\r', '\\r')
              .replaceAll('\"', '\\"');
      };
  
      var isSimpleType = function(value){
          var type = typeof value;
          var strType = Object.prototype.toString.call(value);
          return type === 'string' || type === 'number' || type === 'boolean' || strType === '[object Date]' || strType === '[object Array]';
      };
  
      var dumpObject = function(value, context) {
          context = context || [];
          var type = Object.prototype.toString.call(value);
          if(type === '[object Date]') {
              return value.toISOString();
          } else if(type === '[object Array]' ) {
              if(value.length === 0) {
                  return null;
              }
              var bracket = '[';
              for (var index = 0; index < value.length; ++index) {
                 bracket += dump(value[index]) + ', ';
              }
              return bracket.substring(0, bracket.length - 2) + ']';
          }
  
          var result = '', simleProps = '';
          var propertyName;
  
          for(propertyName in value) {
              if(isSimpleType(value[propertyName])){
                  simleProps += propertyName + ' = ' + dump(value[propertyName]) + '\n';
              }
          }
  
          if(simleProps){
              if(context.length > 0){
                 var contextName = context.join('.');
                 result += '[' + contextName + ']\n';
              }
              result += simleProps + '\n';
          }
  
          for(propertyName in value) {
              if(!isSimpleType(value[propertyName])){
                  result += dump(value[propertyName], context.concat(propertyName));
              }
          }
  
          return result;
      };
  
      var dump = function(value, context) {
          switch (typeof value) {
              case 'string':
                  return '"' + escapeString(value) + '"';
              case 'number':
                  return '' + value;
              case 'boolean':
                  return value ? 'true' : 'false';
              case 'object':
                  return dumpObject(value, context);
          }
      };
  
      return {
          parse: startParser,
          dump: dump
      };
  
  })();
  return toml;

}));
