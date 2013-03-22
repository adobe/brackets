var ffi = require('./ffi')
  , read  = require('fs').readFileSync
  , dlopen = ffi.ForeignFunction(ffi.Bindings.StaticFunctions.dlopen
      , 'pointer', [ 'string', 'int32' ])
  , dlclose = ffi.ForeignFunction(ffi.Bindings.StaticFunctions.dlclose
      , 'int32', [ 'pointer' ])
  , dlsym = ffi.ForeignFunction(ffi.Bindings.StaticFunctions.dlsym
      , 'pointer', [ 'pointer', 'string' ])
  , dlerror = ffi.ForeignFunction(ffi.Bindings.StaticFunctions.dlerror
      , 'string', [ ])

/**
 * `DynamicLibrary` loads and fetches function pointers for dynamic libraries
 * (.so, .dylib, etc). After the libray's function pointer is acquired, then you
 * call `get(symbol)` to retreive a pointer to an exported symbol. You need to
 * call `get___()` on the pointer to dereference it into it's acutal value, or
 * turn the pointer into a callable function with `ForeignFunction`.
 */

function DynamicLibrary (path, mode) {
  this._handle = dlopen(path, mode || DynamicLibrary.FLAGS.RTLD_NOW)

  if (this._handle.isNull()) {
    var err = this.error()

    // THIS CODE IS BASED ON GHC Trac ticket #2615
    // http://hackage.haskell.org/trac/ghc/attachment/ticket/2615

    // On some systems (e.g., Gentoo Linux) dynamic files (e.g. libc.so)
    // contain linker scripts rather than ELF-format object code. This
    // code handles the situation by recognizing the real object code
    // file name given in the linker script.

    // If an "invalid ELF header" error occurs, it is assumed that the
    // .so file contains a linker script instead of ELF object code.
    // In this case, the code looks for the GROUP ( ... ) linker
    // directive. If one is found, the first file name inside the
    // parentheses is treated as the name of a dynamic library and the
    // code attempts to dlopen that file. If this is also unsuccessful,
    // an error message is returned.

    // see if the error message is due to an invalid ELF header
    var match

    if (match = err.match(/^(([^ \t()])+\.so([^ \t:()])*):([ \t])*invalid ELF header$/)) {
      var content = read(match[1], 'ascii')
      // try to find a GROUP ( ... ) command
      if (match = content.match(/GROUP *\( *(([^ )])+)/)){
        return DynamicLibrary.call(this, match[1], mode)
      }
    }

    throw new Error('Dynamic Linking Error: ' + err)
  }
}
module.exports = DynamicLibrary

DynamicLibrary.FLAGS = {
    'RTLD_LAZY':    0x1
  , 'RTLD_NOW':     0x2
  , 'RTLD_LOCAL':   0x4
  , 'RTLD_GLOBAL':  0x8
}

/**
 * Close this library, returns the result of the dlclose() system function.
 */

DynamicLibrary.prototype.close = function () {
  return dlclose(this._handle)
}

/**
 * Get a symbol from this library, returns a Pointer for (memory address of) the symbol
 */

DynamicLibrary.prototype.get = function (symbol) {
  var ptr = dlsym(this._handle, symbol)

  if (ptr.isNull()) {
    throw new Error('Dynamic Symbol Retrieval Error: ' + this.error())
  }

  return ptr
}

/**
 * Returns the result of the dlerror() system function
 */

DynamicLibrary.prototype.error = function error () {
  return dlerror()
}
