#!/usr/bin/env node
'use strict';

var DecompressZip = require('../lib/decompress-zip');
var zip = new DecompressZip(process.argv[2]);

zip.on('file', function (file) {
    console.log(file.name);
});

zip.on('error', function (error) {
    console.error(error.message, error.stack);
});

zip.extract();
