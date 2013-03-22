var ffi = require('./ffi')

/**
 * CIF provides a JS interface for the libffi "callback info" (CIF) structure.
 * TODO: Deprecate this class. Turn this into a simple function that returns the
 *       CIF pointer.
 */

function CIF (rtype, types) {

  if (!ffi.isValidReturnType(rtype)) {
    throw new Error('Invalid Return Type: ' + rtype)
  }

  var numArgs = types.length

  this._argtypesptr = new ffi.Pointer(types.length * ffi.Bindings.FFI_TYPE_SIZE)
  this._rtypeptr = ffi.ffiTypeFor(rtype)

  var tptr = this._argtypesptr.clone()

  for (var i=0; i<numArgs; i++) {
    var typeName = types[i]

    if (!ffi.isValidParamType(typeName)) {
      throw new Error('Invalid Type: ' + typeName)
    }

    var ffiType = ffi.ffiTypeFor(typeName)
    tptr.putPointer(ffiType, true)
  }

  this.pointer = ffi.Bindings.prepCif(numArgs, this._rtypeptr, this._argtypesptr)
}
module.exports = CIF

CIF.prototype.getPointer = function () { return this.pointer }
