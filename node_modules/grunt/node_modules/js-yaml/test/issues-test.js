'use strict';
require(__dirname + '/helper')
  .suite('Issues', __dirname + '/issues', new RegExp("^issue-[1-9][0-9]*\\.js$"))
  .export(module);
