// The following YAML grammar is LL(1) and is parsed by a recursive descent
// parser.
//
// stream            ::= STREAM-START implicit_document? explicit_document* STREAM-END
// implicit_document ::= block_node DOCUMENT-END*
// explicit_document ::= DIRECTIVE* DOCUMENT-START block_node? DOCUMENT-END*
// block_node_or_indentless_sequence ::=
//                       ALIAS
//                       | properties (block_content | indentless_block_sequence)?
//                       | block_content
//                       | indentless_block_sequence
// block_node        ::= ALIAS
//                       | properties block_content?
//                       | block_content
// flow_node         ::= ALIAS
//                       | properties flow_content?
//                       | flow_content
// properties        ::= TAG ANCHOR? | ANCHOR TAG?
// block_content     ::= block_collection | flow_collection | SCALAR
// flow_content      ::= flow_collection | SCALAR
// block_collection  ::= block_sequence | block_mapping
// flow_collection   ::= flow_sequence | flow_mapping
// block_sequence    ::= BLOCK-SEQUENCE-START (BLOCK-ENTRY block_node?)* BLOCK-END
// indentless_sequence   ::= (BLOCK-ENTRY block_node?)+
// block_mapping     ::= BLOCK-MAPPING_START
//                       ((KEY block_node_or_indentless_sequence?)?
//                       (VALUE block_node_or_indentless_sequence?)?)*
//                       BLOCK-END
// flow_sequence     ::= FLOW-SEQUENCE-START
//                       (flow_sequence_entry FLOW-ENTRY)*
//                       flow_sequence_entry?
//                       FLOW-SEQUENCE-END
// flow_sequence_entry   ::= flow_node | KEY flow_node? (VALUE flow_node?)?
// flow_mapping      ::= FLOW-MAPPING-START
//                       (flow_mapping_entry FLOW-ENTRY)*
//                       flow_mapping_entry?
//                       FLOW-MAPPING-END
// flow_mapping_entry    ::= flow_node | KEY flow_node? (VALUE flow_node?)?
//
// FIRST sets:
//
// stream: { STREAM-START }
// explicit_document: { DIRECTIVE DOCUMENT-START }
// implicit_document: FIRST(block_node)
// block_node: { ALIAS TAG ANCHOR SCALAR BLOCK-SEQUENCE-START BLOCK-MAPPING-START FLOW-SEQUENCE-START FLOW-MAPPING-START }
// flow_node: { ALIAS ANCHOR TAG SCALAR FLOW-SEQUENCE-START FLOW-MAPPING-START }
// block_content: { BLOCK-SEQUENCE-START BLOCK-MAPPING-START FLOW-SEQUENCE-START FLOW-MAPPING-START SCALAR }
// flow_content: { FLOW-SEQUENCE-START FLOW-MAPPING-START SCALAR }
// block_collection: { BLOCK-SEQUENCE-START BLOCK-MAPPING-START }
// flow_collection: { FLOW-SEQUENCE-START FLOW-MAPPING-START }
// block_sequence: { BLOCK-SEQUENCE-START }
// block_mapping: { BLOCK-MAPPING-START }
// block_node_or_indentless_sequence: { ALIAS ANCHOR TAG SCALAR BLOCK-SEQUENCE-START BLOCK-MAPPING-START FLOW-SEQUENCE-START FLOW-MAPPING-START BLOCK-ENTRY }
// indentless_sequence: { ENTRY }
// flow_collection: { FLOW-SEQUENCE-START FLOW-MAPPING-START }
// flow_sequence: { FLOW-SEQUENCE-START }
// flow_mapping: { FLOW-MAPPING-START }
// flow_sequence_entry: { ALIAS ANCHOR TAG SCALAR FLOW-SEQUENCE-START FLOW-MAPPING-START KEY }
// flow_mapping_entry: { ALIAS ANCHOR TAG SCALAR FLOW-SEQUENCE-START FLOW-MAPPING-START KEY }


'use strict';


var $$ = require('./common');
var _errors = require('./errors');
var _tokens = require('./tokens');
var _events = require('./events');


function ParserError() {
  _errors.MarkedYAMLError.apply(this, arguments);
  this.name = 'ParserError';
}
$$.inherits(ParserError, _errors.MarkedYAMLError);


var DEFAULT_TAGS = {
  '!':  '!',
  '!!': 'tag:yaml.org,2002:'
};


function Parser() {
  this.currentEvent = null;
  this.yamlVersion = null;
  this.tagHandles = {};
  this.states = [];
  this.marks = [];
  this.state = this.parseStreamStart.bind(this);
}


Parser.prototype.dispose = function dispose() {
  // Reset the state attributes (to clear self-references)
  this.states = [];
  this.state = null;
};

Parser.prototype.checkEvent = function checkEvent() {
  var i;

  // Check the type of the next event.
  if (null === this.currentEvent && !!this.state) {
    this.currentEvent = this.state();
  }

  if (null !== this.currentEvent) {
    if (0 === arguments.length) {
      return true;
    }

    for (i = 0; i < arguments.length; i += 1) {
      if ($$.isInstanceOf(this.currentEvent, arguments[i])) {
        return true;
      }
    }
  }

  return false;
};

Parser.prototype.peekEvent = function peekEvent() {
  // Get the next event.
  if (null === this.currentEvent && !!this.state) {
    this.currentEvent = this.state();
  }

  return this.currentEvent;
};

Parser.prototype.getEvent = function getEvent() {
  var value;

  // Get the next event and proceed further.
  if (null === this.currentEvent && !!this.state) {
    this.currentEvent = this.state();
  }

  value = this.currentEvent;
  this.currentEvent = null;

  return value;
};

Parser.prototype.parseStreamStart = function parseStreamStart() {
  var token, event;

  // Parse the stream start.
  token = this.getToken();
  event = new _events.StreamStartEvent(token.startMark, token.endMark,
                                  token.encoding);

  // Prepare the next state.
  this.state = this.parseImplicitDocumentStart.bind(this);

  return event;
};

Parser.prototype.parseImplicitDocumentStart = function parseImplicitDocumentStart() {
  var token, event;
  if (this.checkToken(_tokens.DirectiveToken, _tokens.DocumentStartToken, _tokens.StreamEndToken)) {
    return this.parseDocumentStart();
  }

  // Parse an implicit document.
  this.tagHandles = DEFAULT_TAGS;
  token = this.peekToken();
  event = new _events.DocumentStartEvent(token.startMark, token.startMark, false);

  // Prepare the next state.
  this.states.push(this.parseDocumentEnd.bind(this));
  this.state = this.parseBlockNode.bind(this);

  return event;
};

Parser.prototype.parseDocumentStart = function parseDocumentStart() {
  var token, event, version, tags, startMark, tuple;

  // Parse any extra document end indicators.
  while (this.checkToken(_tokens.DocumentEndToken)) {
    this.getToken();
  }

  if (this.checkToken(_tokens.StreamEndToken)) {
    // Parse the end of the stream.
    token = this.getToken();
    event = new _events.StreamEndEvent(token.startMark, token.endMark);

    // Should be empty arrays
    if (this.states && this.states.length) {
      throw new _errors.YAMLError('States supposed to be empty');
    }
    if (this.marks && this.marks.length) {
      throw new _errors.YAMLError('Marks supposed to be empty');
    }

    this.state = null;
    return event;
  }

  // Parse an explicit document.
  token = this.peekToken();
  startMark = token.startMark;

  tuple = this.processDirectives();
  version = tuple.shift();
  tags = tuple.shift();

  if (!this.checkToken(_tokens.DocumentStartToken)) {
    throw new ParserError(null, null,
                "expected '<document start>', but found " + this.peekToken().constructor.id,
                this.peekToken().startMark);
  }

  token = this.getToken();
  event = new _events.DocumentStartEvent(startMark, token.endMark, true, version, tags);

  this.states.push(this.parseDocumentEnd.bind(this));
  this.state = this.parseDocumentContent.bind(this);

  return event;
};

Parser.prototype.parseDocumentEnd = function parseDocumentEnd() {
  var token, event, explicit, startMark, endMark;

  // Parse the document end.
  token = this.peekToken();
  startMark = endMark = token.startMark;
  explicit = false;

  if (this.checkToken(_tokens.DocumentEndToken)) {
    token = this.getToken();
    endMark = token.endMark;
    explicit = true;
  }

  event = new _events.DocumentEndEvent(startMark, endMark, explicit);

  // Prepare the next state.
  this.state = this.parseDocumentStart.bind(this);

  return event;
};

Parser.prototype.parseDocumentContent = function parseDocumentContent() {
  var event;

  if (!this.checkToken(_tokens.DirectiveToken, _tokens.DocumentStartToken,
                       _tokens.DocumentEndToken, _tokens.StreamEndToken)) {
    return this.parseBlockNode();
  }

  event = this.processEmptyScalar(this.peekToken().startMark);
  this.state = this.states.pop();

  return event;
};

Parser.prototype.processDirectives = function processDirectives() {
  var token, handle, prefix, value;

  this.yamlVersion = null;
  this.tagHandles = {};

  while (this.checkToken(_tokens.DirectiveToken)) {
    token = this.getToken();

    if ('YAML' === token.name) {
      if (null !== this.yamlVersion) {
        throw new ParserError(null, null, "found duplicate YAML directive",
                              token.startMark);
      }

      // token.value => [major, minor]
      if (1 !== +(token.value[0])) {
        throw new ParserError(null, null, "found incompatible YAML document (version 1.* is required)",
                              token.startMark);
      }

      this.yamlVersion = token.value;
    } else if ('TAG' === token.name) {
      handle = token.value[0];
      prefix = token.value[1];

      if (undefined !== this.tagHandles[handle]) {
        throw new ParserError(null, null, "duplicate tag handle " + handle,
                              token.startMark);
      }

      this.tagHandles[handle] = prefix;
    }
  }

  if (!Object.getOwnPropertyNames(this.tagHandles).length) {
    value = [this.yamlVersion, null];
  } else {
    value = [this.yamlVersion, {}];
    Object.getOwnPropertyNames(this.tagHandles).forEach(function (key) {
      value[1][key] = this.tagHandles[key];
    }.bind(this));
  }

  Object.getOwnPropertyNames(DEFAULT_TAGS).forEach(function (key) {
    if (undefined === this.tagHandles[key]) {
      this.tagHandles[key] = DEFAULT_TAGS[key];
    }
  }.bind(this));

  return value;
};

Parser.prototype.parseBlockNode = function parseBlockNode() {
  return this.parseNode(true);
};

Parser.prototype.parseFlowNode = function parseFlowNode() {
  return this.parseNode();
};

Parser.prototype.parseBlockNodeOrIndentlessSequence = function parseBlockNodeOrIndentlessSequence() {
  return this.parseNode(true, true);
};

Parser.prototype.parseNode = function parseNode(block, indentlessSequence) {
  var token, event, anchor = null, tag = null, startMark = null,
      endMark, tagMark, handle = null, suffix = null, implicit, node;

  block = block || false;
  indentlessSequence = indentlessSequence || false;

  if (this.checkToken(_tokens.AliasToken)) {
    token = this.getToken();
    event = new _events.AliasEvent(token.value, token.startMark, token.endMark);
    this.state = this.states.pop();
  } else {
    anchor = null;
    tag = null;
    startMark = endMark = tagMark = null;

    if (this.checkToken(_tokens.AnchorToken)) {
      token = this.getToken();
      startMark = token.startMark;
      endMark = token.endMark;
      anchor = token.value;

      if (this.checkToken(_tokens.TagToken)) {
        token = this.getToken();
        tagMark = token.startMark;
        endMark = token.endMark;
        tag = token.value;
      }
    } else if (this.checkToken(_tokens.TagToken)) {

      token = this.getToken();
      startMark = tagMark = token.startMark;
      endMark = token.endMark;
      tag = token.value;

      if (this.checkToken(_tokens.AnchorToken)) {
        token = this.getToken();
        endMark = token.endMark;
        anchor = token.value;
      }

    }

    if (null !== tag) {
      handle = tag[0];
      suffix = tag[1];

      if (null === handle) {
        tag = suffix;
      } else {
        if (undefined === this.tagHandles[handle]) {
          throw new ParserError("while parsing a node", startMark,
                                "found undefined tag handle " + handle,
                                tagMark);
        }

        tag = this.tagHandles[handle] + suffix;
      }
    }

    if (null === startMark) {
      startMark = endMark = this.peekToken().startMark;
    }

    event = null;
    implicit = (null === tag || '!' === tag);

    if (indentlessSequence && this.checkToken(_tokens.BlockEntryToken)) {
      endMark = this.peekToken().endMark;
      event = new _events.SequenceStartEvent(anchor, tag, implicit,
                                        startMark, endMark);
      this.state = this.parseIndentlessSequenceEntry.bind(this);
    } else {
      if (this.checkToken(_tokens.ScalarToken)) {
        token = this.getToken();
        endMark = token.endMark;

        if ((token.plain && null === tag) || '!' === tag) {
          implicit = [true, false];
        } else if (null === tag) {
          implicit = [false, true];
        } else {
          implicit = [false, false];
        }

        event = new _events.ScalarEvent(anchor, tag, implicit, token.value,
                                   startMark, endMark, token.style);
        this.state = this.states.pop();

      } else if (this.checkToken(_tokens.FlowSequenceStartToken)) {

        endMark = this.peekToken().endMark;
        event = new _events.SequenceStartEvent(anchor, tag, implicit,
                                          startMark, endMark, true);
        this.state = this.parseFlowSequenceFirstEntry.bind(this);

      } else if (this.checkToken(_tokens.FlowMappingStartToken)) {

        endMark = this.peekToken().endMark;
        event = new _events.MappingStartEvent(anchor, tag, implicit,
                                         startMark, endMark, true);
        this.state = this.parseFlowMappingFirstKey.bind(this);

      } else if (block && this.checkToken(_tokens.BlockSequenceStartToken)) {

        endMark = this.peekToken().startMark;
        event = new _events.SequenceStartEvent(anchor, tag, implicit,
                                          startMark, endMark, false);
        this.state = this.parseBlockSequenceFirstEntry.bind(this);

      } else if (block && this.checkToken(_tokens.BlockMappingStartToken)) {

        endMark = this.peekToken().startMark;
        event = new _events.MappingStartEvent(anchor, tag, implicit,
                                         startMark, endMark, false);
        this.state = this.parseBlockMappingFirstKey.bind(this);

      } else if (null !== anchor || null !== tag) {

        // Empty scalars are allowed even if a tag or an anchor is
        // specified.
        event = new _events.ScalarEvent(anchor, tag, [implicit, false], '',
                                   startMark, endMark);
        this.state = this.states.pop();

      } else {

        node = !!block ? 'block' : 'flow';
        token = this.peekToken();
        throw new ParserError("while parsing a " + node + " node", startMark,
                  "expected the node content, but found " + token.constructor.id,
                  token.startMark);
      }
    }
  }

  return event;
};

Parser.prototype.parseBlockSequenceFirstEntry = function parseBlockSequenceFirstEntry() {
  var token = this.getToken();
  this.marks.push(token.startMark);
  return this.parseBlockSequenceEntry();
};

Parser.prototype.parseBlockSequenceEntry = function parseBlockSequenceEntry() {
  var token, event;

  if (this.checkToken(_tokens.BlockEntryToken)) {
    token = this.getToken();

    if (!this.checkToken(_tokens.BlockEntryToken, _tokens.BlockEndToken)) {
      this.states.push(this.parseBlockSequenceEntry.bind(this));
      return this.parseBlockNode();
    }

    this.state = this.parseBlockSequenceEntry.bind(this);
    return this.processEmptyScalar(token.endMark);
  }

  if (!this.checkToken(_tokens.BlockEndToken)) {
    token = this.peekToken();
    throw new ParserError("while parsing a block collection", this.marks[this.marks.length - 1],
                          "expected <block end>, but found " + token.constructor.id,
                          token.startMark);
  }

  token = this.getToken();
  event = new _events.SequenceEndEvent(token.startMark, token.endMark);

  this.state = this.states.pop();
  this.marks.pop();

  return event;
};

Parser.prototype.parseIndentlessSequenceEntry = function parseIndentlessSequenceEntry() {
  var token, event;

  if (this.checkToken(_tokens.BlockEntryToken)) {
    token = this.getToken();

    if (!this.checkToken(_tokens.BlockEntryToken, _tokens.KeyToken,
                         _tokens.ValueToken, _tokens.BlockEndToken)) {
      this.states.push(this.parseIndentlessSequenceEntry.bind(this));
      return this.parseBlockNode();
    }

    this.state = this.parseIndentlessSequenceEntry.bind(this);
    return this.processEmptyScalar(token.endMark);
  }

  token = this.peekToken();
  event = new _events.SequenceEndEvent(token.startMark, token.startMark);
  this.state = this.states.pop();
  return event;
};

// block_mapping     ::= BLOCK-MAPPING_START
//                       ((KEY block_node_or_indentless_sequence?)?
//                       (VALUE block_node_or_indentless_sequence?)?)*
//                       BLOCK-END

Parser.prototype.parseBlockMappingFirstKey = function parseBlockMappingFirstKey() {
  var token = this.getToken();
  this.marks.push(token.startMark);
  return this.parseBlockMappingKey();
};

Parser.prototype.parseBlockMappingKey = function parseBlockMappingKey() {
  var token, event;

  if (this.checkToken(_tokens.KeyToken)) {
    token = this.getToken();

    if (!this.checkToken(_tokens.KeyToken, _tokens.ValueToken, _tokens.BlockEndToken)) {
      this.states.push(this.parseBlockMappingValue.bind(this));
      return this.parseBlockNodeOrIndentlessSequence();
    }

    this.state = this.parseBlockMappingValue.bind(this);
    return this.processEmptyScalar(token.endMark);
  }

  if (!this.checkToken(_tokens.BlockEndToken)) {
    token = this.peekToken();
    throw new ParserError("while parsing a block mapping", this.marks[this.marks.length - 1],
                          "expected <block end>, but found " + token.constructor.id,
                          token.startMark);
  }

  token = this.getToken();
  event = new _events.MappingEndEvent(token.startMark, token.endMark);

  this.state = this.states.pop();
  this.marks.pop();

  return event;
};

Parser.prototype.parseBlockMappingValue = function parseBlockMappingValue() {
  var token;

  if (this.checkToken(_tokens.ValueToken)) {
    token = this.getToken();

    if (!this.checkToken(_tokens.KeyToken, _tokens.ValueToken, _tokens.BlockEndToken)) {
      this.states.push(this.parseBlockMappingKey.bind(this));
      return this.parseBlockNodeOrIndentlessSequence();
    }

    this.state = this.parseBlockMappingKey.bind(this);
    return this.processEmptyScalar(token.endMark);
  }

  this.state = this.parseBlockMappingKey.bind(this);
  token = this.peekToken();

  return this.processEmptyScalar(token.startMark);
};

// flow_sequence     ::= FLOW-SEQUENCE-START
//                       (flow_sequence_entry FLOW-ENTRY)*
//                       flow_sequence_entry?
//                       FLOW-SEQUENCE-END
// flow_sequence_entry   ::= flow_node | KEY flow_node? (VALUE flow_node?)?
//
// Note that while production rules for both flow_sequence_entry and
// flow_mapping_entry are equal, their interpretations are different.
// For `flow_sequence_entry`, the part `KEY flow_node? (VALUE flow_node?)?`
// generate an inline mapping (set syntax).

Parser.prototype.parseFlowSequenceFirstEntry = function parseFlowSequenceFirstEntry() {
  var token = this.getToken();
  this.marks.push(token.startMark);
  return this.parseFlowSequenceEntry(true);
};

Parser.prototype.parseFlowSequenceEntry = function parseFlowSequenceEntry(first) {
  var token, event;

  first = first || false;

  if (!this.checkToken(_tokens.FlowSequenceEndToken)) {
    if (!first) {
      if (this.checkToken(_tokens.FlowEntryToken)) {
        this.getToken();
      } else {
        token = this.peekToken();
        throw new ParserError("while parsing a flow sequence", this.marks[this.marks.length - 1],
                              "expected ',' or ']', but got " + token.constructor.id, token.startMark);
      }
    }
      
    if (this.checkToken(_tokens.KeyToken)) {
      token = this.peekToken();
      event = new _events.MappingStartEvent(null, null, true,
                                       token.startMark, token.endMark, true);
      this.state = this.parseFlowSequenceEntryMappingKey.bind(this);
      return event;
    } else if (!this.checkToken(_tokens.FlowSequenceEndToken)) {
      this.states.push(this.parseFlowSequenceEntry.bind(this));
      return this.parseFlowNode();
    }
  }

  token = this.getToken();
  event = new _events.SequenceEndEvent(token.startMark, token.endMark);

  this.state = this.states.pop();
  this.marks.pop();

  return event;
};

Parser.prototype.parseFlowSequenceEntryMappingKey = function parseFlowSequenceEntryMappingKey() {
  var token = this.getToken();

  if (!this.checkToken(_tokens.ValueToken, _tokens.FlowEntryToken, _tokens.FlowSequenceEndToken)) {
    this.states.push(this.parseFlowSequenceEntryMappingValue.bind(this));
    return this.parseFlowNode();
  }

  this.state = this.parseFlowSequenceEntryMappingValue.bind(this);
  return this.processEmptyScalar(token.endMark);
};

Parser.prototype.parseFlowSequenceEntryMappingValue = function parseFlowSequenceEntryMappingValue() {
  var token;

  if (this.checkToken(_tokens.ValueToken)) {
    token = this.getToken();

    if (!this.checkToken(_tokens.FlowEntryToken, _tokens.FlowSequenceEndToken)) {
      this.states.push(this.parseFlowSequenceEntryMappingEnd.bind(this));
      return this.parseFlowNode();
    }

    this.state = this.parseFlowSequenceEntryMappingEnd.bind(this);
    return this.processEmptyScalar(token.endMark);
  }

  this.state = this.parseFlowSequenceEntryMappingEnd.bind(this);
  token = this.peekToken();
  return this.processEmptyScalar(token.startMark);
};

Parser.prototype.parseFlowSequenceEntryMappingEnd = function parseFlowSequenceEntryMappingEnd() {
  var token;

  this.state = this.parseFlowSequenceEntry.bind(this);
  token = this.peekToken();

  return new _events.MappingEndEvent(token.startMark, token.startMark);
};

// flow_mapping  ::= FLOW-MAPPING-START
//                   (flow_mapping_entry FLOW-ENTRY)*
//                   flow_mapping_entry?
//                   FLOW-MAPPING-END
// flow_mapping_entry    ::= flow_node | KEY flow_node? (VALUE flow_node?)?

Parser.prototype.parseFlowMappingFirstKey = function parseFlowMappingFirstKey() {
  var token = this.getToken();
  this.marks.push(token.startMark);
  return this.parseFlowMappingKey(true);
};

Parser.prototype.parseFlowMappingKey = function parseFlowMappingKey(first) {
  var token, event;

  first = first || false;

  if (!this.checkToken(_tokens.FlowMappingEndToken)) {
    if (!first) {
      if (this.checkToken(_tokens.FlowEntryToken)) {
        this.getToken();
      } else {
        token = this.peekToken();
        throw new ParserError("while parsing a flow mapping", this.marks[this.marks.length - 1],
                              "expected ',' or '}', but got " + token.constructor.id, token.startMark);
      }
    }

    if (this.checkToken(_tokens.KeyToken)) {
      token = this.getToken();

      if (!this.checkToken(_tokens.ValueToken, _tokens.FlowEntryToken, _tokens.FlowMappingEndToken)) {
        this.states.push(this.parseFlowMappingValue.bind(this));
        return this.parseFlowNode();
      }

      this.state = this.parseFlowMappingValue.bind(this);
      return this.processEmptyScalar(token.endMark);
    } else if (!this.checkToken(_tokens.FlowMappingEndToken)) {
      this.states.push(this.parseFlowMappingEmptyValue.bind(this));
      return this.parseFlowNode();
    }
  }

  token = this.getToken();
  event = new _events.MappingEndEvent(token.startMark, token.endMark);

  this.state = this.states.pop();
  this.marks.pop();

  return event;
};

Parser.prototype.parseFlowMappingValue = function parseFlowMappingValue() {
  var token;

  if (this.checkToken(_tokens.ValueToken)) {
    token = this.getToken();

    if (!this.checkToken(_tokens.FlowEntryToken, _tokens.FlowMappingEndToken)) {
      this.states.push(this.parseFlowMappingKey.bind(this));
      return this.parseFlowNode();
    }

    this.state = this.parseFlowMappingKey.bind(this);
    return this.processEmptyScalar(token.endMark);
  }

  this.state = this.parseFlowMappingKey.bind(this);
  token = this.peekToken();
  return this.processEmptyScalar(token.startMark);
};

Parser.prototype.parseFlowMappingEmptyValue = function parseFlowMappingEmptyValue() {
  this.state = this.parseFlowMappingKey.bind(this);
  return this.processEmptyScalar(this.peekToken().startMark);
};

Parser.prototype.processEmptyScalar = function processEmptyScalar(mark) {
  return new _events.ScalarEvent(null, null, [true, false], '', mark, mark);
};


module.exports.Parser = Parser;


////////////////////////////////////////////////////////////////////////////////
// vim:ts=2:sw=2
////////////////////////////////////////////////////////////////////////////////
