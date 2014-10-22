var assert = require('assert')
  , Benchmark = require('benchmark')
  , suite = new Benchmark.Suite
  , mime = require('mime')
  , keys = Object.keys(mime.types)
  , compressible = require('./index.js')
  , benchmarks = require('beautify-benchmark')

function getRandomType () {
  var type = mime.types[keys[Math.floor(Math.random() * keys.length)]]
  return type + mime.charsets.lookup(type)
}

function legacy (type) {
  if (!type || typeof type !== "string") return false
  var spec = compressible.specs[type.split(';')]
  return spec ? spec.compressible : compressible.regex.test(type)
}

function previous (type) {
  if (!type || typeof type !== "string") return false
  var i = type.indexOf(';')
    , spec = compressible.specs[i < 0 ? type : type.slice(0, i)]
  return spec ? spec.compressible : compressible.regex.test(type)
}

describe('Compressible performance benchmarks.', function () {
  it('Performance of `current` should be within the top 95%', function () {
    suite.add('current', function() {
      compressible(getRandomType())
    })
    .add('previous', function () {
      previous(getRandomType())
    })
    .add('legacy', function () {
      legacy(getRandomType())
    })
    .on('cycle', function (event) {
      benchmarks.add(event.target)
    })
    .on('start', function (event) {
      console.log('\n  Starting...')
    })
    .on('complete', function done () {
      console.log('\n  Done!')
      var result = benchmarks.getPercent('current')
      benchmarks.log()
      if (result < 95)
        assert.fail('' + result + '%', '95%`', null, '>=', done)
    })
    .run({ 'async': false })
  })
})