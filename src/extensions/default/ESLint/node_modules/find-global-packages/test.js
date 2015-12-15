var exec = require('child_process').exec
  , path = require('path')
  , test = require('tape')

var find = require('./index')

test('matches expectations', function(assert) {
  exec('npm ls -g', function(err, stdout, stderr) {
    if(!stdout) {
      assert.ok(false, 'exec had no stdout')
      assert.end()

      return
    }

    var expect = stdout.split('\n').map(function(xs) {
      return xs[0] === '├' || xs[0] === '└' ?
        xs.replace(/^[^\s]+\s/g, '').replace(/@.*$/g, '') :
        false
    }).filter(Boolean).sort()

    find(function(err, foundPaths) {
      if(err) {
        assert.ok(false, 'findGlobalPackages encountered error: ' + err.stack)
        assert.end()

        return
      }

      assert.deepEqual(foundPaths.map(path.basename).sort(), expect)
      assert.end()
    })
  })
})
