(function() {
  var configuration, preferredMediaTypes, testConfigurations, testCorrectType, _i, _len,
    _this = this;

  preferredMediaTypes = require('../lib/mediaType').preferredMediaTypes;

  this["Should not return a media type when no media type provided"] = function(test) {
    test.deepEqual(preferredMediaTypes('*/*', []), []);
    return test.done();
  };

  this["Should not return a media type when no media type is acceptable"] = function(test) {
    test.deepEqual(preferredMediaTypes('application/json', ['text/html']), []);
    return test.done();
  };

  this["Should not return a media type with q = 0"] = function(test) {
    test.deepEqual(preferredMediaTypes('text/html;q=0', ['text/html']), []);
    return test.done();
  };

  testCorrectType = function(c) {
    return _this["Should return " + c.selected + " for access header " + c.accept + " with provided types " + c.provided] = function(test) {
      test.deepEqual(preferredMediaTypes(c.accept, c.provided), c.selected);
      return test.done();
    };
  };

  testConfigurations = [
    {
      accept: 'text/html',
      provided: ['text/html'],
      selected: ['text/html']
    }, {
      accept: '*/*',
      provided: ['text/html'],
      selected: ['text/html']
    }, {
      accept: 'text/*',
      provided: ['text/html'],
      selected: ['text/html']
    }, {
      accept: 'application/json, text/html',
      provided: ['text/html'],
      selected: ['text/html']
    }, {
      accept: 'text/html;q=0.1',
      provided: ['text/html'],
      selected: ['text/html']
    }, {
      accept: 'application/json, text/html',
      provided: ['application/json', 'text/html'],
      selected: ['application/json', 'text/html']
    }, {
      accept: 'application/json;q=0.2, text/html',
      provided: ['application/json', 'text/html'],
      selected: ['text/html', 'application/json']
    }, {
      accept: 'application/json;q=0.2, text/html',
      provided: null,
      selected: ['text/html', 'application/json']
    }
  ];

  for (_i = 0, _len = testConfigurations.length; _i < _len; _i++) {
    configuration = testConfigurations[_i];
    testCorrectType(configuration);
  }

}).call(this);
