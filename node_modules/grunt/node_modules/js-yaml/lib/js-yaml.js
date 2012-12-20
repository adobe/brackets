/**
 *  jsyaml
 **/


'use strict';


var fs = require('fs');
var _loader = require('./js-yaml/loader');


var jsyaml = module.exports = {};


jsyaml.scan = function scan(stream, callback, Loader) {
  Loader = (Loader || _loader.SafeLoader);

  var loader = new Loader(stream);
  while (loader.checkToken()) {
    callback(loader.getToken());
  }
};


jsyaml.compose = function compose(stream, Loader) {
  Loader = (Loader || _loader.SafeLoader);

  var loader = new Loader(stream);
  return loader.getSingleNode();
};


jsyaml.load = function load(stream, Loader) {
  Loader = (Loader || _loader.Loader);

  var loader = new Loader(stream);
  return loader.getSingleData();
};


jsyaml.loadAll = function loadAll(stream, callback, Loader) {
  Loader = (Loader || _loader.Loader);

  var loader = new Loader(stream);
  while (loader.checkData()) {
    callback(loader.getData());
  }
};


jsyaml.safeLoad = function load(stream) {
  return jsyaml.load(stream, _loader.SafeLoader);
};


jsyaml.safeLoadAll = function loadAll(stream, callback) {
  jsyaml.loadAll(stream, callback, _loader.SafeLoader);
};


/**
 *  jsyaml.addConstructor(tag, constructor[, Loader]) -> Void
 *
 *  Add a constructor for the given tag.
 *
 *  Constructor is a function that accepts a Loader instance
 *  and a node object and produces the corresponding JavaScript object.
 **/
jsyaml.addConstructor = function addConstructor(tag, constructor, Loader) {
  (Loader || _loader.Loader).addConstructor(tag, constructor);
};


// Register extensions handler
(function () {
  var require_handler = function (module, filename) {
    var str = fs.readFileSync(filename, 'utf8');

    // fill in documents
    module.exports = jsyaml.load(str);
  };

  // register require extensions only if we're on node.js
  // hack for browserify
  if (undefined !== require.extensions) {
    require.extensions['.yml'] = require_handler;
    require.extensions['.yaml'] = require_handler;
  }
}());
