module.exports = win32

var exec = require('child_process').exec
  , path = require('path')
  , fs = require('fs')

function win32(ready) {
  exec('npm config ls -g', function(err, stdout, stderr) {
    if(err) {
      return ready(err)
    }

    var match = /^prefix\s+=\s+(.*)$/gm.exec(stdout || '')
      , npmPath

    if(!match) {
      return ready(new Error('could not find prefix'))
    }

    npmPath = match[1][0] === '"' ? JSON.parse(match[1]) : match[1]
    npmPath = path.join(npmPath, 'node_modules')

    fs.readdir(npmPath, function(err, dirs) {
      if(err) {
        return ready(err)
      }

      var pending = dirs.length
        , output = []

      dirs.forEach(function(xs, idx) {
        fs.exists(path.join(npmPath, xs, 'package.json'), function(exists) {
          if(exists) {
            output.push(path.join(npmPath, xs))
          }

          !--pending && ready(null, output)
        })
      })

      !pending && ready(null, output)
    })
  })
}
