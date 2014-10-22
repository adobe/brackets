(function() {
  var configuration, preferredLanguages, testConfigurations, testCorrectType, _i, _len,
    _this = this;

  preferredLanguages = require('../lib/language').preferredLanguages;

  this["Should not return a language when no is provided"] = function(test) {
    test.deepEqual(preferredLanguages('*', []), []);
    return test.done();
  };

  this["Should not return a language when no language is acceptable"] = function(test) {
    test.deepEqual(preferredLanguages('en', ['es']), []);
    return test.done();
  };

  this["Should not return a language with q = 0"] = function(test) {
    test.deepEqual(preferredLanguages('en;q=0', ['en']), []);
    return test.done();
  };

  testCorrectType = function(c) {
    return _this["Should return " + c.selected + " for accept-language header " + c.accept + " with provided language " + c.provided] = function(test) {
      test.deepEqual(preferredLanguages(c.accept, c.provided), c.selected);
      return test.done();
    };
  };

  testConfigurations = [
    {
      accept: 'en',
      provided: ['en'],
      selected: ['en']
    }, {
      accept: '*',
      provided: ['en'],
      selected: ['en']
    }, {
      accept: 'en-US, en;q=0.8',
      provided: ['en-US', 'en-GB'],
      selected: ['en-US', 'en-GB']
    }, {
      accept: 'en-US, en-GB',
      provided: ['en-US'],
      selected: ['en-US']
    }, {
      accept: 'en',
      provided: ['en-US'],
      selected: ['en-US']
    }, {
      accept: 'en;q=0.8, es',
      provided: ['en', 'es'],
      selected: ['es', 'en']
    }, {
      accept: 'en-US;q=0.8, es',
      provided: ['en', 'es'],
      selected: ['es', 'en']
    }, {
      accept: 'en-US;q=0.8, es',
      provided: null,
      selected: ['es', 'en-US']
    }
  ];

  for (_i = 0, _len = testConfigurations.length; _i < _len; _i++) {
    configuration = testConfigurations[_i];
    testCorrectType(configuration);
  }

}).call(this);
