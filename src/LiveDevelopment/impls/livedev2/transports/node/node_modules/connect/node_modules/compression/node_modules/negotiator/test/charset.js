(function() {
  var configuration, preferredCharsets, testConfigurations, testCorrectCharset, _i, _len,
    _this = this;

  preferredCharsets = require('../lib/charset').preferredCharsets;

  this["Should not return a charset when no charset is provided"] = function(test) {
    test.deepEqual(preferredCharsets('*', []), []);
    return test.done();
  };

  this["Should not return a charset when no charset is acceptable"] = function(test) {
    test.deepEqual(preferredCharsets('ISO-8859-1', ['utf-8']), []);
    return test.done();
  };

  this["Should not return a charset with q = 0"] = function(test) {
    test.deepEqual(preferredCharsets('utf-8;q=0', ['utf-8']), []);
    return test.done();
  };

  testCorrectCharset = function(c) {
    return _this["Should return " + c.selected + " for accept-charset header " + c.accept + " with provided charset " + c.provided] = function(test) {
      test.deepEqual(preferredCharsets(c.accept, c.provided), c.selected);
      return test.done();
    };
  };

  testConfigurations = [
    {
      accept: 'utf-8',
      provided: ['utf-8'],
      selected: ['utf-8']
    }, {
      accept: '*',
      provided: ['utf-8'],
      selected: ['utf-8']
    }, {
      accept: 'utf-8',
      provided: ['utf-8', 'ISO-8859-1'],
      selected: ['utf-8']
    }, {
      accept: 'utf-8, ISO-8859-1',
      provided: ['utf-8'],
      selected: ['utf-8']
    }, {
      accept: 'utf-8;q=0.8, ISO-8859-1',
      provided: ['utf-8', 'ISO-8859-1'],
      selected: ['ISO-8859-1', 'utf-8']
    }, {
      accept: 'utf-8;q=0.8, ISO-8859-1',
      provided: null,
      selected: ['ISO-8859-1', 'utf-8']
    }
  ];

  for (_i = 0, _len = testConfigurations.length; _i < _len; _i++) {
    configuration = testConfigurations[_i];
    testCorrectCharset(configuration);
  }

}).call(this);
