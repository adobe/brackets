'use strict';
require(__dirname + '/helper')
  .suite('Functional', __dirname + '/functional', new RegExp("^functional-.+?\\.js$"))
  .export(module);
