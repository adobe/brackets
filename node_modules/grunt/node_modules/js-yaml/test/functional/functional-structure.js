'use strict';


var Assert = require('assert');
var Fs = require('fs');
var Loader = require('../../lib/js-yaml/loader');
var Events = require('../../lib/js-yaml/events');
var Helper = require('../helper');


function convertStructure(loader) {
  var event, sequence, mapping, key, value;

  if (loader.checkEvent(Events.ScalarEvent)) {
    event = loader.getEvent();
    return (!!event.tag || !!event.anchor || !!event.value);
  } else if (loader.checkEvent(Events.SequenceStartEvent)) {
    sequence = [];

    loader.getEvent();
    while (!loader.checkEvent(Events.SequenceEndEvent)) {
      sequence.push(convertStructure(loader));
    }
    loader.getEvent();

    return sequence;
  } else if (loader.checkEvent(Events.MappingStartEvent)) {
    mapping = [];

    loader.getEvent();
    while (!loader.checkEvent(Events.MappingEndEvent)) {
      key = convertStructure(loader);
      value = convertStructure(loader);
      mapping.push([key, value]);
    }
    loader.getEvent();

    return mapping;
  } else if (loader.checkEvent(Events.AliasEvent)) {
    loader.getEvent();
    return '*';
  } else {
    loader.getEvent();
    return '?';
  }
}


module.exports = {
  "Test tokens": Helper.functional({
    dirname: __dirname + '/data',
    files: ['.data', '.structure'],
    test: function (dataFile, structureFile) {
      var result = [], expected, loader;

      expected = JSON.parse(Fs.readFileSync(structureFile, 'utf8'));
      loader = new Loader.SafeLoader(Fs.readFileSync(dataFile, 'utf8'));

      while (loader.checkEvent()) {
        if (loader.checkEvent(Events.StreamStartEvent, Events.StreamEndEvent,
                              Events.DocumentStartEvent, Events.DocumentEndEvent)) {
          loader.getEvent();
        } else {
          result.push(convertStructure(loader));
        }
      }

      if (1 === result.length) {
        result = result.shift();
      }

      Assert.deepEqual(result, expected);
    }
  })
};


////////////////////////////////////////////////////////////////////////////////
// vim:ts=2:sw=2
////////////////////////////////////////////////////////////////////////////////
