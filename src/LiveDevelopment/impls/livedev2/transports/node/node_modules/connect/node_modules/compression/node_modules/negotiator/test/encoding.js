(function() {
  var configuration, preferredEncodings, testConfigurations, testCorrectEncoding, _i, _len,
    _this = this;

  preferredEncodings = require('../lib/encoding').preferredEncodings;

  this["Should return identity encoding when no encoding is provided"] = function(test) {
    test.deepEqual(preferredEncodings(null), ['identity']);
    return test.done();
  };

  this["Should include the identity encoding even if not explicity listed"] = function(test) {
    test.ok(preferredEncodings('gzip').indexOf('identity') !== -1);
    return test.done();
  };

  this["Should not return identity encoding if q = 0"] = function(test) {
    test.ok(preferredEncodings('identity;q=0').indexOf('identity') === -1);
    return test.done();
  };

  testCorrectEncoding = function(c) {
    return _this["Should return " + c.selected + " for accept-encoding header " + c.accept + " with provided encoding " + c.provided] = function(test) {
      test.deepEqual(preferredEncodings(c.accept, c.provided), c.selected);
      return test.done();
    };
  };

  testConfigurations = [
    {
      accept: 'gzip',
      provided: ['identity', 'gzip'],
      selected: ['gzip', 'identity']
    }, {
      accept: 'gzip, compress',
      provided: ['compress'],
      selected: ['compress']
    }, {
      accept: 'deflate',
      provided: ['gzip', 'identity'],
      selected: ['identity']
    }, {
      accept: '*',
      provided: ['identity', 'gzip'],
      selected: ['identity', 'gzip']
    }, {
      accept: 'gzip, compress',
      provided: ['compress', 'identity'],
      selected: ['compress', 'identity']
    }, {
      accept: 'gzip;q=0.8, identity;q=0.5, *;q=0.3',
      provided: ['identity', 'gzip', 'compress'],
      selected: ['gzip', 'identity', 'compress']
    }, {
      accept: 'gzip;q=0.8, compress',
      provided: ['gzip', 'compress'],
      selected: ['compress', 'gzip']
    }, {
      accept: 'gzip;q=0.8, compress',
      provided: null,
      selected: ['compress', 'gzip', 'identity']
    }
  ];

  for (_i = 0, _len = testConfigurations.length; _i < _len; _i++) {
    configuration = testConfigurations[_i];
    testCorrectEncoding(configuration);
  }

}).call(this);
