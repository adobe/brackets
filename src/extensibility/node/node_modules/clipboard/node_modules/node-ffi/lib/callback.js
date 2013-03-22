var ffi = require('./ffi')

/**
 * Turns a JavaScript function into a C function pointer.
 * The function pointer may be used in other C functions that
 * accept C callback functions.
 * TODO: Deprecate this class, make this function return the callback pointer
 *       directly.
 */

function Callback (typedata, func) {
  var retType = typedata[0]
    , types   = typedata[1]

  this._cif   = new ffi.CIF(retType, types)
  this._info  = new ffi.CallbackInfo(this._cif.getPointer(), function (retval, params) {
    var pptr = params.clone()
    var args = types.map(function (type) {
      return ffi.derefValuePtr(type, pptr.getPointer(true))
    })

    // Invoke the user-given function
    var result = func.apply(null, args)

    if (retType !== 'void') {
      retval['put' + ffi.TYPE_TO_POINTER_METHOD_MAP[retType]](result)
    }
  })

  this.pointer = this._info.pointer
}
module.exports = Callback

/**
 * Returns the callback function pointer. Deprecated. Use `callback.pointer`
 * instead.
 */

Callback.prototype.getPointer = function getPointer () {
  return this.pointer
}
