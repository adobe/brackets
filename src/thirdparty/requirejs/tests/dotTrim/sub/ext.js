define(['../util/helper', 'require'], function(helper, require) {
  var helperPath = require.toUrl('../util/helper');
  return {
    name: 'ext',
    helperPath: helperPath,
    helper: helper
  };
});
