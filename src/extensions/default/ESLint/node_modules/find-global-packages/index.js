module.exports = process.platform === 'win32' ?
  require('./win32') :
  resolveGlobals

var which = require('which')
  , path = require('path')
  , fs = require('fs')

function resolveGlobals(ready) {
  which('npm', onnpmpath)
    
  function onnpmpath(err, dir) {
    if(err) {
      return ready(err)
    }

    fs.realpath(dir, onrealpath)
  }

  function onrealpath(err, resolvedPath) {
    findRoot(resolvedPath, onrootpath) 
  }

  function onrootpath(err, npmPath) {

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
  }
}

function findRoot(filepath, ready) {
  var cur = filepath
    , allPaths = []
    , last = null
    , pending

  do {
    allPaths.push(
        path.join(cur, 'package.json')
    )
    last = cur
    cur = path.resolve(cur, '..')
  } while(cur !== last)

  runAll(allPaths, function(err, stats) {
    if(err) {
      return ready(err)
    }

    for(var i = 0, len = stats.length; i < len; ++i) {
      if(stats[i] && stats[i].isFile()) {
        break
      }
    }

    if(i === len) {
      return ready(new Error('no root'))
    }

    return ready(null, path.resolve(allPaths[i], '..', '..'))
  })
}

function runAll(items, ready) {
  var pending = items.length
    , out = []

  if(!pending) {
    return ready(null, [])
  }

  items.forEach(function(item, idx) {
    fs.lstat(item, function(err, stat) {
      // "err" just means we don't see anything.

      out[idx] = stat

      !--pending && ready(null, out)
    })
  })
}
