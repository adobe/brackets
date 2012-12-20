'use strict';


var $$ = require('./common');
var _nodes = require('./nodes');
var _events = require('./events');
var _errors = require('./errors');


function ComposerError() {
  _errors.MarkedYAMLError.apply(this, arguments);
  this.name = 'ComposerError';
}
$$.inherits(ComposerError, _errors.MarkedYAMLError);


function Composer() {
  this.anchors = {};
}


Composer.prototype.checkNode = function checkNode() {
  // Drop the STREAM-START event
  if (this.checkEvent(_events.StreamStartEvent)) {
    this.getEvent();
  }

  // If there are more documents vailable?
  return !this.checkEvent(_events.StreamEndEvent);
};

Composer.prototype.getNode = function getNode() {
  // Get the root node of the next document.
  if (!this.checkEvent(_events.StreamEndEvent)) {
    return this.composeDocument();
  }

  return null;
};

Composer.prototype.getSingleNode = function getSingleNode() {
  var document = null;

  // Drop the STREAM-START event.
  this.getEvent();

  // Compose a document if the stream is not empty.
  if (!this.checkEvent(_events.StreamEndEvent)) {
    document = this.composeDocument();
  }

  // Ensure that the stream contains no more documents.
  if (!this.checkEvent(_events.StreamEndEvent)) {
    throw new ComposerError("expected a single document in the stream",
            document.startMark, "but found another document",
            this.getEvent().startMark);
  }

  // Drop the STREAM-END event.
  this.getEvent();

  return document;
};

Composer.prototype.composeDocument = function composeDocument() {
  var node;

  // Drop the DOCUMENT-START event.
  this.getEvent();

  // Compose the root node.
  node = this.composeNode(null, null);

  // Drop the DOCUMENT-END event.
  this.getEvent();

  this.anchors = {};

  return node;
};

Composer.prototype.composeNode = function composeNode() {
  var node = null, event, anchor;

  if (this.checkEvent(_events.AliasEvent)) {
    event = this.getEvent();
    anchor = event.anchor;

    if (undefined === this.anchors[anchor]) {
      throw new ComposerError(null, null, "found undefined alias " + anchor,
                              event.startMark);
    }

    return this.anchors[anchor];
  }

  event = this.peekEvent();
  anchor = event.anchor;

  if (null !== anchor && undefined !== this.anchors[anchor]) {
    throw new ComposerError("found duplicate anchor " + anchor + "; first occurence",
                            this.anchors[anchor].startMark, "second occurence",
                            event.startMark);
  }

  if (this.checkEvent(_events.ScalarEvent)) {
    node = this.composeScalarNode(anchor);
  } else if (this.checkEvent(_events.SequenceStartEvent)) {
    node = this.composeSequenceNode(anchor);
  } else if (this.checkEvent(_events.MappingStartEvent)) {
    node = this.composeMappingNode(anchor);
  }

  return node;
};

Composer.prototype.composeScalarNode = function composeScalarNode(anchor) {
  var event, tag, node;

  event = this.getEvent();
  tag = event.tag;

  if (null === tag) {
    tag = this.resolve(_nodes.ScalarNode, event.value, event.implicit);
  } else if ("!" === tag) {
    tag = this.resolve(_nodes.ScalarNode, event.value, false);
  }

  node = new _nodes.ScalarNode(tag, event.value, event.startMark, event.endMark,
                           event.style);

  if (null !== anchor) {
    this.anchors[anchor] = node;
  }

  return node;
};

Composer.prototype.composeSequenceNode = function composeSequenceNode(anchor) {
  var start_event, tag, node, index, end_event;

  start_event = this.getEvent();
  tag = start_event.tag;

  if (null === tag) {
    tag = this.resolve(_nodes.SequenceNode, null, start_event.implicit);
  } else if ("!" === tag) {
    tag = this.resolve(_nodes.SequenceNode, null, false);
  }

  node = new _nodes.SequenceNode(tag, [], start_event.startMark, null,
                             start_event.flowStyle);

  if (null !== anchor) {
    this.anchors[anchor] = node;
  }

  index = 0;

  while (!this.checkEvent(_events.SequenceEndEvent)) {
    node.value.push(this.composeNode(node, index));
    index += 1;
  }

  end_event = this.getEvent();
  node.endMark = end_event.endMark;

  return node;
};


Composer.prototype.composeMappingNode = function composeMappingNode(anchor) {
  var startEvent, tag, node, itemKey, itemValue, endEvent;

  startEvent = this.getEvent();
  tag = startEvent.tag;

  if (null === tag) {
    tag = this.resolve(_nodes.MappingNode, null, startEvent.implicit);
  } else if ("!" === tag) {
    tag = this.resolve(_nodes.MappingNode, null, false);
  }

  node = new _nodes.MappingNode(tag, [], startEvent.startMark, null,
                            startEvent.flowStyle);

  if (null !== anchor) {
    this.anchors[anchor] = node;
  }

  while (!this.checkEvent(_events.MappingEndEvent)) {
    itemKey = this.composeNode(node, null);
    itemValue = this.composeNode(node, itemKey);
    node.value.push([itemKey, itemValue]);
  }

  endEvent = this.getEvent();
  node.endMark = endEvent.endMark;

  return node;
};


module.exports.Composer = Composer;


////////////////////////////////////////////////////////////////////////////////
// vim:ts=2:sw=2
////////////////////////////////////////////////////////////////////////////////
