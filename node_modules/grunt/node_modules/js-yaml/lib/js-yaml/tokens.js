'use strict';


var $$ = require('./common');


function Token(startMark, endMark) {
  this.startMark = startMark || null;
  this.endMark = endMark || null;
}

Token.prototype.hash =
Token.prototype.toString = function toString() {
  var values = [], self = this;
    
  Object.getOwnPropertyNames(this).forEach(function (key) {
    if (!/startMark|endMark|__meta__/.test(key)) {
      values.push(key + ':' + self[key]);
    }
  });

  return this.constructor.name + '(' + values.join(', ') + ')';
};


function DirectiveToken(name, value, startMark, endMark) {
  Token.call(this, startMark, endMark);
  this.name = name;
  this.value = value;
}
$$.inherits(DirectiveToken, Token);
DirectiveToken.id = '<directive>';


function DocumentStartToken() { Token.apply(this, arguments); }
$$.inherits(DocumentStartToken, Token);
DocumentStartToken.id = '<document start>';


function DocumentEndToken() { Token.apply(this, arguments); }
$$.inherits(DocumentEndToken, Token);
DocumentEndToken.id = '<document end>';


function StreamStartToken(startMark, endMark, encoding) {
  Token.call(this, startMark, endMark);
  this.encoding = encoding || null;
}
$$.inherits(StreamStartToken, Token);
StreamStartToken.id = '<stream start>';


function StreamEndToken() { Token.apply(this, arguments); }
$$.inherits(StreamEndToken, Token);
StreamEndToken.id = '<stream end>';


function BlockSequenceStartToken() { Token.apply(this, arguments); }
$$.inherits(BlockSequenceStartToken, Token);
BlockSequenceStartToken.id = '<block sequence start>';


function BlockMappingStartToken() { Token.apply(this, arguments); }
$$.inherits(BlockMappingStartToken, Token);
BlockMappingStartToken.id = '<block mapping start>';


function BlockEndToken() { Token.apply(this, arguments); }
$$.inherits(BlockEndToken, Token);
BlockEndToken.id = '<block end>';


function FlowSequenceStartToken() { Token.apply(this, arguments); }
$$.inherits(FlowSequenceStartToken, Token);
FlowSequenceStartToken.id = '[';


function FlowMappingStartToken() { Token.apply(this, arguments); }
$$.inherits(FlowMappingStartToken, Token);
FlowMappingStartToken.id = '{';


function FlowSequenceEndToken() { Token.apply(this, arguments); }
$$.inherits(FlowSequenceEndToken, Token);
FlowSequenceEndToken.id = ']';


function FlowMappingEndToken() { Token.apply(this, arguments); }
$$.inherits(FlowMappingEndToken, Token);
FlowMappingEndToken.id = '}';


function KeyToken() { Token.apply(this, arguments); }
$$.inherits(KeyToken, Token);
KeyToken.id = '?';


function ValueToken() { Token.apply(this, arguments); }
$$.inherits(ValueToken, Token);
ValueToken.id = ':';


function BlockEntryToken() { Token.apply(this, arguments); }
$$.inherits(BlockEntryToken, Token);
BlockEntryToken.id = '-';


function FlowEntryToken() { Token.apply(this, arguments); }
$$.inherits(FlowEntryToken, Token);
FlowEntryToken.id = ',';


function AliasToken(value, startMark, endMark) {
  Token.call(this, startMark, endMark);
  this.value = value;
}
$$.inherits(AliasToken, Token);
AliasToken.id = '<alias>';


function AnchorToken(value, startMark, endMark) {
  Token.call(this, startMark, endMark);
  this.value = value;
}
$$.inherits(AnchorToken, Token);
AnchorToken.id = '<anchor>';


function TagToken(value, startMark, endMark) {
  Token.call(this, startMark, endMark);
  this.value = value;
}
$$.inherits(TagToken, Token);
TagToken.id = '<tag>';


function ScalarToken(value, plain, startMark, endMark, style) {
  Token.call(this, startMark, endMark);
  this.value = value;
  this.plain = plain;
  this.style = style || null;
}
$$.inherits(ScalarToken, Token);
TagToken.id = '<scalar>';


module.exports.DirectiveToken = DirectiveToken;
module.exports.DocumentStartToken = DocumentStartToken;
module.exports.DocumentEndToken = DocumentEndToken;
module.exports.StreamStartToken = StreamStartToken;
module.exports.StreamEndToken = StreamEndToken;
module.exports.BlockSequenceStartToken = BlockSequenceStartToken;
module.exports.BlockMappingStartToken = BlockMappingStartToken;
module.exports.BlockEndToken = BlockEndToken;
module.exports.FlowSequenceStartToken = FlowSequenceStartToken;
module.exports.FlowMappingStartToken = FlowMappingStartToken;
module.exports.FlowSequenceEndToken = FlowSequenceEndToken;
module.exports.FlowMappingEndToken = FlowMappingEndToken;
module.exports.KeyToken = KeyToken;
module.exports.ValueToken = ValueToken;
module.exports.BlockEntryToken = BlockEntryToken;
module.exports.FlowEntryToken = FlowEntryToken;
module.exports.AliasToken = AliasToken;
module.exports.AnchorToken = AnchorToken;
module.exports.TagToken = TagToken;
module.exports.ScalarToken = ScalarToken;


////////////////////////////////////////////////////////////////////////////////
// vim:ts=2:sw=2
////////////////////////////////////////////////////////////////////////////////
