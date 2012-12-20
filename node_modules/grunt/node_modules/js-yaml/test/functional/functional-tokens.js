'use strict';


var Assert = require('assert');
var Fs = require('fs');
var JsYaml = require('../../lib/js-yaml');
var Common = require('../../lib/js-yaml/common');
var Tokens = require('../../lib/js-yaml/tokens');
var Helper = require('../helper');

// Tokens mnemonic:
// directive:            %
// document_start:       ---
// document_end:         ...
// alias:                *
// anchor:               &
// tag:                  !
// scalar                _
// block_sequence_start: [[
// block_mapping_start:  {{
// block_end:            ]}
// flow_sequence_start:  [
// flow_sequence_end:    ]
// flow_mapping_start:   {
// flow_mapping_end:     }
// entry:                ,
// key:                  ?
// value:                :

var REPLACES = new Common.Hash();

REPLACES.store(Tokens.DirectiveToken,           '%');
REPLACES.store(Tokens.DocumentStartToken,       '---');
REPLACES.store(Tokens.DocumentEndToken,         '...');
REPLACES.store(Tokens.AliasToken,               '*');
REPLACES.store(Tokens.AnchorToken,              '&');
REPLACES.store(Tokens.TagToken,                 '!');
REPLACES.store(Tokens.ScalarToken,              '_');
REPLACES.store(Tokens.BlockSequenceStartToken,  '[[');
REPLACES.store(Tokens.BlockMappingStartToken,   '{{');
REPLACES.store(Tokens.BlockEndToken,            ']}');
REPLACES.store(Tokens.FlowSequenceStartToken,   '[');
REPLACES.store(Tokens.FlowSequenceEndToken,     ']');
REPLACES.store(Tokens.FlowMappingStartToken,    '{');
REPLACES.store(Tokens.FlowMappingEndToken,      '}');
REPLACES.store(Tokens.BlockEntryToken,          ',');
REPLACES.store(Tokens.FlowEntryToken,           ',');
REPLACES.store(Tokens.KeyToken,                 '?');
REPLACES.store(Tokens.ValueToken,               ':');


module.exports = {
  "Test tokens": Helper.functional({
    dirname: __dirname + '/data',
    files: ['.data', '.tokens'],
    test: function (dataFile, tokensFile) {
      var result = [], expected = [];
      
      Fs.readFileSync(tokensFile, 'utf8').split(/[ \n]/).forEach(function (t) {
        if (!!t) { expected.push(t); }
      });

      JsYaml.scan(Fs.readFileSync(dataFile, 'utf8'), function (token) {
        if (Common.isInstanceOf(token, Tokens.StreamStartToken) ||
            Common.isInstanceOf(token, Tokens.StreamEndToken)) {
          return;
        }

        result.push(REPLACES.get(token.constructor));
      });

      Assert.equal(result.length, expected.length);

      result.forEach(function (token, i) {
        Assert.equal(expected[i], token);
      });
    }
  })
};


////////////////////////////////////////////////////////////////////////////////
// vim:ts=2:sw=2
////////////////////////////////////////////////////////////////////////////////
