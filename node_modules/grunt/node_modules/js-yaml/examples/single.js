var inspect = require('util').inspect;

// just require jsyaml
require(__dirname + '/../lib/js-yaml');

try {
  var doc = require(__dirname + '/single.yml');
  console.log(inspect(doc, false, 10, true));
} catch (e) {
  console.log(e.stack || e.toString());
}
