'use strict';


var $$ = require('./common');


var HASHIFY_KEYS = ['anchor', 'tag', 'implicit', 'value'];


function Event(startMark, endMark) {
  this.startMark = startMark || null;
  this.endMark = endMark || null;
}

Event.prototype.hash = Event.prototype.toString = function toString() {
  var self = this, values = [];

  Object.getOwnPropertyNames(this).forEach(function (key) {
    if (0 <= HASHIFY_KEYS.indexOf(key)) {
      values.push(key + '=' + self[key]);
    }
  });

  return this.constructor.name + '(' + values.join(', ') + ')';
};


function NodeEvent(anchor, startMark, endMark) {
  Event.call(this, startMark, endMark);
  this.anchor = anchor;
}
$$.inherits(NodeEvent, Event);


function CollectionStartEvent(anchor, tag, implicit, startMark, endMark, flowStyle) {
  NodeEvent.call(this, anchor, startMark, endMark);
  this.tag = tag;
  this.implicit = implicit;
  this.flowStyle = flowStyle || null;
}
$$.inherits(CollectionStartEvent, NodeEvent);


function CollectionEndEvent() { Event.apply(this, arguments); }
$$.inherits(CollectionEndEvent, Event);


function StreamStartEvent(startMark, endMark, encoding) {
  Event.call(this, startMark, endMark);
  this.encoding = encoding || null;
}
$$.inherits(StreamStartEvent, Event);


function StreamEndEvent() { Event.apply(this, arguments); }
$$.inherits(StreamEndEvent, Event);


function DocumentStartEvent(startMark, endMark, explicit, version, tags) {
  Event.call(this, startMark, endMark);
  this.explicit = explicit || null;
  this.version = version || null;
  this.tags = tags || null;
}
$$.inherits(DocumentStartEvent, Event);


function DocumentEndEvent(startMark, endMark, explicit) {
  Event.call(this, startMark, endMark);
  this.explicit = explicit || null;
}
$$.inherits(DocumentEndEvent, Event);


function AliasEvent() { NodeEvent.apply(this, arguments); }
$$.inherits(AliasEvent, NodeEvent);


function ScalarEvent(anchor, tag, implicit, value, startMark, endMark, style) {
  NodeEvent.call(this, anchor, startMark, endMark);
  this.tag = tag;
  this.implicit = implicit;
  this.value = value;
  this.style = style || null;
}
$$.inherits(ScalarEvent, NodeEvent);


function SequenceStartEvent() { CollectionStartEvent.apply(this, arguments); }
$$.inherits(SequenceStartEvent, CollectionStartEvent);


function SequenceEndEvent() { CollectionEndEvent.apply(this, arguments); }
$$.inherits(SequenceEndEvent, CollectionEndEvent);


function MappingStartEvent() { CollectionStartEvent.apply(this, arguments); }
$$.inherits(MappingStartEvent, CollectionStartEvent);


function MappingEndEvent() { CollectionEndEvent.apply(this, arguments); }
$$.inherits(MappingEndEvent, CollectionEndEvent);


module.exports.NodeEvent = NodeEvent;
module.exports.CollectionStartEvent = CollectionStartEvent;
module.exports.CollectionEndEvent = CollectionEndEvent;
module.exports.StreamStartEvent = StreamStartEvent;
module.exports.StreamEndEvent = StreamEndEvent;
module.exports.DocumentStartEvent = DocumentStartEvent;
module.exports.DocumentEndEvent = DocumentEndEvent;
module.exports.AliasEvent = AliasEvent;
module.exports.ScalarEvent = ScalarEvent;
module.exports.SequenceStartEvent = SequenceStartEvent;
module.exports.SequenceEndEvent = SequenceEndEvent;
module.exports.MappingStartEvent = MappingStartEvent;
module.exports.MappingEndEvent = MappingEndEvent;


////////////////////////////////////////////////////////////////////////////////
// vim:ts=2:sw=2
////////////////////////////////////////////////////////////////////////////////
