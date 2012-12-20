'use strict';


var Assert = require('assert');
var Fs = require('fs');
var JsYaml = require('../../lib/js-yaml');
var Common = require('../../lib/js-yaml/common');
var Nodes = require('../../lib/js-yaml/nodes');
var Helper = require('../helper');


module.exports = {
  "Test implicit resolver": Helper.functional({
    dirname: __dirname + '/data',
    files: ['.data', '.detect'],
    test: function (dataFilename, detectFilename) {
      var correctTag, node;
      
      node = JsYaml.compose(Fs.readFileSync(dataFilename, 'utf8'));
      correctTag = Fs.readFileSync(detectFilename, 'utf8')
        .replace(/^[ \s]+|[ \s]+$/g, '');

      Assert.equal(Common.isInstanceOf(node, Nodes.SequenceNode), true);

      Common.each(node.value, function (scalar) {
        Assert.equal(Common.isInstanceOf(scalar, Nodes.ScalarNode), true);
        Assert.equal(scalar.tag, correctTag);
      });
    }
  })
};


////////////////////////////////////////////////////////////////////////////////
// vim:ts=2:sw=2
////////////////////////////////////////////////////////////////////////////////
