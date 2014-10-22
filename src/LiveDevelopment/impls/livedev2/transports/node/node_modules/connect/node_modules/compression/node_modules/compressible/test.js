var assert = require('assert')

var specifications = require('./specifications.json')
var compressible = require('./')

// None of these should be actual types so that the lookup will never include them.
var example_types = [
  { type: 'something/text', should: true },
  { type: 'thingie/dart', should: true },
  { type: 'type/json', should: true },
  { type: 'ecmascript/6', should: true },
  { type: 'data/beans+xml', should: true },
  { type: 'asdf/nope', should: false },
  { type: 'cats', should: false }
]

var invalid_types = [
  undefined,
  null,
  0,
  1,
  false,
  true
]

var object_true = {
  compressible: true,
  sources: ["compressible.regex"],
  notes: "Automatically generated via regex."
}, object_false = {
  compressible: false,
  sources: ["compressible.regex"],
  notes: "Automatically generated via regex."
}

describe('Testing if spec lookups are correct.', function () {
  for (var type in specifications) {
    var value = specifications[type].compressible
    it(type + ' should' + (value ? ' ' : ' not ') + 'be compressible', function () {
      assert.equal(compressible(type), value)
    })
  }
})

describe('Testing if the regex works as intended.', function () {
  example_types.forEach(function (example) {
    it(example.type + ' should' + (example.should ? ' ' : ' not ') + 'be compressible', function () {
      assert.equal(compressible(example.type), example.should)
    })
  })
})

describe('Testing if getter returns the correct objects.', function () {
  it('All spec objects should be get-able', function () {
    for (var type in specifications) {
      assert.equal(compressible.get(type), specifications[type])
    }
  })
  example_types.forEach(function (example) {
    it(example.type + ' should generate a ' + (example.should ? 'true' : 'false') + ' object', function () {
      assert.deepEqual(compressible.get(example.type), example.should ? object_true: object_false)
    })
  })
})

describe('Testing if charsets are handled correctly.', function () {
  it('Charsets should be stripped off without issue', function () {
    for (var type in specifications) {
      var value = specifications[type].compressible
      assert.equal(compressible(type + '; charset=utf-8'), value)
    }
  })
  it('Types with charsets should be get-able', function () {
    for (var type in specifications) {
      assert.equal(compressible.get(type + '; charset=utf-8'), specifications[type])
    }
  })
})

describe('Ensuring invalid types do not cause errors.', function () {
  it('No arguments should return false without error', function () {
    assert.equal(compressible(), false)
  })

  invalid_types.forEach(function (invalid) {
    it(invalid + ' should return false without error', function () {
      assert.doesNotThrow(function () {
        assert.equal(compressible(invalid), false)
      })
    })
  })
})