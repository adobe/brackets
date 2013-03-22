var ffi = require('./ffi')
  , EventEmitter = require('events').EventEmitter
  , POINTER_SIZE = ffi.Bindings.POINTER_SIZE

/**
 * Represents a foreign function in another library. Manages all of the aspects
 * of function execution, including marshalling the data parameters for the
 * function into native types and also unmarshalling the return from function
 * execution.
 */

function ForeignFunction (ptr, returnType, types, async) {
  if (!(this instanceof ForeignFunction)) {
    return new ForeignFunction(ptr, returnType, types, async)
  }

  var self = this
    , numArgs = types.length
    , drefVal = ffi.derefValuePtrFunc(returnType)
    , result = new ffi.Pointer(ffi.sizeOf(returnType))
    , argsList = new ffi.Pointer(numArgs * POINTER_SIZE)
    , cif = new ffi.CIF(returnType, types)
    , caller = new ffi.Bindings.ForeignCaller(
        cif.getPointer()
      , ptr
      , argsList
      , result
      , async
    )

  // XXX: Can't remove or shit segsaults... WTF....
  this._ = cif

  // allocate a storage area for each argument,
  // then write the pointer to the argument list
  var argputf = types.map(function (type, i) {
    var argPtr = argsList.seek(i * POINTER_SIZE)

    if (ffi.isStructType(type)) {
      return function (val) {
        argPtr.putPointer(val.ref())
      }
    }

    var valPtr = new ffi.Pointer(ffi.sizeOf(type))
    argPtr.putPointer(valPtr)

    if (type == 'string') {
      return function (val) {
        var ptr = ffi.Pointer.NULL
        if (typeof val !== 'undefined' && val !== null) {
          var len = Buffer.byteLength(val, 'utf8')
          ptr = new ffi.Pointer(len+1)
          ptr.putCString(val)
        }
        valPtr.putPointer(ptr)
      }
    } else if (type == 'pointer') {
      // Bypass the struct check for non-struct types
      return function (val) {
        valPtr._putPointer(val)
      }
    } else {
      // Generic type putter function
      var putCall = 'put' + ffi.TYPE_TO_POINTER_METHOD_MAP[type]
      return function (val) {
        valPtr[putCall](val)
      }
    }
  })

  var proxy = function () {
    self // XXX: if this isn't in here, callbacks segfault. what.. the.. f?

    if (arguments.length !== numArgs) {
      throw new Error('Function arguments did not meet specification')
    }

    // write arguments to storage areas
    for (var i=0; i<numArgs; i++) {
      argputf[i](arguments[i])
    }

    var r = caller.exec()

    if (async) {
      var emitter = new EventEmitter()
      r.on('success', function () {
        emitter.emit('success', drefVal(result))
      })
      return emitter
    }

    return drefVal(result)
  }

  // Backwards compat
  // XXX: Remove soon...
  proxy.getFunction = function () { return this }

  return proxy
}
module.exports = ForeignFunction

/**
 * Deprecated. Just invoke ForeignFunction() instead.
 */

ForeignFunction.build = ForeignFunction
