require('./helper');

var fs = require('fs');
var path = require('path');
var specsDir = path.join(__dirname, 'spec/specs');

var skipTests = {
  comments: [
    'Standalone Without Newline'
  ],
  delimiters: [
    'Standalone Without Newline'
  ],
  inverted: [
    'Standalone Without Newline'
  ],
  partials: [
    'Standalone Without Previous Line',
    'Standalone Without Newline',
    'Standalone Indentation'
  ],
  sections: [
    'Standalone Without Newline'
  ],
  '~lambdas': [
    'Interpolation',
    'Interpolation - Expansion',
    'Interpolation - Alternate Delimiters',
    'Interpolation - Multiple Calls',
    'Escaping',
    'Section - Expansion',
    'Section - Alternate Delimiters'
  ]
};

// You can run the skiped tests by setting the NOSKIP environment variable to
// true (e.g. NOSKIP=true mocha test/mustache-spec-test.js)
var noSkip = process.env.NOSKIP;

// You can put the name of a specific test file to run in the TEST environment
// variable (e.g. TEST=interpolation mocha test/mustache-spec-test.js)
var fileToRun = process.env.TEST;

// Mustache should work on node 0.6 that doesn't have fs.exisisSync
function existsDir(path) {
  try {
    return fs.statSync(path).isDirectory();
  } catch (x) {
    return false;
  }
}

var specFiles;
if (fileToRun) {
  specFiles = [fileToRun];
} else if (existsDir(specsDir)) {
  specFiles = fs.readdirSync(specsDir).filter(function (file) {
    return (/\.json$/).test(file);
  }).map(function (file) {
    return path.basename(file).replace(/\.json$/, '');
  }).sort();
} else {
  specFiles = [];
}

function getSpecs(specArea) {
  return JSON.parse(fs.readFileSync(path.join(specsDir, specArea + '.' + 'json'), 'utf8'));
}

describe('Mustache spec compliance', function() {
  beforeEach(function () {
    Mustache.clearCache();
  });

  specFiles.forEach(function(specArea) {
    describe('- ' + specArea + ':', function() {
      var specs = getSpecs(specArea);
      specs.tests.forEach(function(test) {
        var it_ = (!noSkip && skipTests[specArea] && skipTests[specArea].indexOf(test.name) >= 0) ? it.skip : it;
        it_(test.name + ' - ' + test.desc, function() {
          if (test.data.lambda && test.data.lambda.__tag__ === 'code')
            test.data.lambda = eval('(function() { return ' + test.data.lambda.js + '; })');
          var output = Mustache.render(test.template, test.data, test.partials);
          assert.equal(output, test.expected);
        });
      });
    });
  });
});