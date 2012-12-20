#!/usr/bin/env node


'use strict';


// stdlib
var fs    = require('fs');
var util  = require('util');


// 3rd-party
var ArgumentParser = require('argparse').ArgumentParser;


// internal
var yaml = require('..');


////////////////////////////////////////////////////////////////////////////////


var cli = new ArgumentParser({
  prog:     'js-yaml',
  version:  require('../package.json').version,
  addHelp:  true
});


cli.addArgument(['-c', '--compact'], {
  help:   'Display errors in compact mode',
  action: 'storeTrue'
});


cli.addArgument(['-j', '--to-json'], {
  help:   'Output a non-funky boring JSON',
  dest:   'json',
  action: 'storeTrue'
});


cli.addArgument(['-t', '--trace'], {
  help:   'Show stack trace on error',
  action: 'storeTrue'
});


cli.addArgument(['file'], {
  help:   'File with YAML document(s)'
});


////////////////////////////////////////////////////////////////////////////////


var options = cli.parseArgs();


////////////////////////////////////////////////////////////////////////////////


fs.readFile(options.file, 'utf8', function (err, str) {
  var docs = [], out;

  if (err) {
    if ('ENOENT' === err.code) {
      console.error('File not found: ' + options.file);
      process.exit(2);
    }

    // Fatal fuckup
    console.error(options.trace && err.stack || err.message || String(err));
    process.exit(1);
  }

  try {
    // try load all documents from the file
    yaml.loadAll(str, function (doc) { docs.push(doc); });
    out = (1 >= docs.length) ? (docs.shift() || null) : docs;
  } catch (err) {
    console.error(options.trace && err.stack || err.message || err.toString(options.compact));
    process.exit(1);
  }

  if (options.json) {
    console.log(JSON.stringify(out, null, '  '));
    process.exit(0);
  }

  console.log("\n" + util.inspect(out, false, 10, true) + "\n");
  process.exit(0);
});
