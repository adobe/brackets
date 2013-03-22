var ffi = require('./ffi')
  , EXT = ffi.PLATFORM_LIBRARY_EXTENSIONS[process.platform]
  , RTLD_NOW = ffi.DynamicLibrary.FLAGS.RTLD_NOW

/**
 * Provides a friendly abstraction/API on-top of DynamicLibrary and
 * ForeignFunction.
 */
function Library (libfile, funcs) {
  if (libfile && libfile.indexOf(EXT) === -1) {
    libfile += EXT
  }

  var lib = {}
    , dl = new ffi.DynamicLibrary(libfile || null, RTLD_NOW)

  if (funcs) {
    Object.keys(funcs).forEach(function (func) {
      var fptr = dl.get(func)
        , info = funcs[func]

      if (fptr.isNull()) {
        throw new Error('DynamicLibrary "'+libfile+'" returned NULL function pointer for "'+func+'"')
      }

      var resultType = info[0]
        , paramTypes = info[1]
        , fopts = info[2]
        , async = fopts ? fopts.async : false

      lib[func] = ffi.ForeignFunction(fptr, resultType, paramTypes, async)
    })
  }

  return lib
}
module.exports = Library
