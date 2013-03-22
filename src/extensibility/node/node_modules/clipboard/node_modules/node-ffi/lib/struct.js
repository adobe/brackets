var ffi = require('./ffi')

/**
 * An interface for modeling and instantiating C-style data structures. This is
 * not a constructor per-say, but a constructor generator. It takes an array of
 * tuples, the left side being the type, and the right side being a field name.
 * The order should be the same order it would appear in the C-style struct
 * definition. It returns a function that can be used to construct an object that
 * reads and writes to the data structure using properties specified by the
 * initial field list.
 *
 * Example:
 *
 *     var PasswordEntry = ffi.Struct(
 *         ['string', 'username']
 *       , ['string', 'password']
 *     )
 *     var pwd = new PasswordEntry()
 *     pwd.username = 'ricky'
 *     pwd.password = 'rbransonlovesnode.js'
 */

function Struct () {
  var struct = {}
    , fields = arguments

  // Legacy API, pass an Array of Arrays
  if (arguments.length > 0) {
    var firstArg = arguments[0]
    if (Array.isArray(firstArg) && firstArg.length > 0 && Array.isArray(firstArg[0])) {
      fields = firstArg
    }
  }

  struct.struct    = {}
  struct.members   = []
  struct.size      = 0
  struct.alignment = 0

  function read (ptr, name) {
    var info = struct.struct[name]
    var fptr = ptr.seek(info.offset)

    if (ffi.isStructType(info.type)) {
      return new info.type(fptr)
    } else if (info.type == 'string') {
      return fptr.getPointer().getCString()
    } else {
      return fptr['get' + ffi.TYPE_TO_POINTER_METHOD_MAP[info.type]]()
    }
  }

  function write (ptr, name, val) {
    var info = struct.struct[name]
    var fptr = ptr.seek(info.offset)

    if (ffi.isStructType(info.type)) {
      new info.type(fptr, val)
    } else if (info.type == 'string') {
      if (typeof val == 'undefined' || val === null) {
        return fptr.putPointer(ffi.Pointer.NULL)
      }
      var len = Buffer.byteLength(val, 'utf8')
      var strPtr = new ffi.Pointer(len+1)
      strPtr.putCString(val)
      fptr.putPointer(strPtr)
    } else {
      return fptr['put' + ffi.TYPE_TO_POINTER_METHOD_MAP[info.type]](val)
    }
  }

  // Read the fields list and apply all the fields to the struct
  for (var i=0, len=fields.length; i<len; i++) {
    var field   = fields[i]
      , type    = field[0]
      , name    = field[1]
    //console.log(name)

    if (name in struct.struct) {
      throw new Error('Error when constructing Struct: ' + name + ' field specified twice!')
    }

    var stype   = ffi.isStructType(type)
      , sz      = ffi.sizeOf(type)
      , asz     = stype ? type.__structInfo__.alignment : sz
    //console.log('  size:',sz)
    //console.log('  offset:', struct.size)
    //console.log('  asz:',asz)

    struct.alignment  = Math.max(struct.alignment, asz)

    var left = struct.size % struct.alignment
      , offset = struct.size

    if (sz > left) {
      offset += left
    }

    struct.size = offset + sz

    struct.struct[name] = {
        name: name
      , type: type
      , size: sz
      , offset: offset
    }
    struct.members.push(name)
  }
  //console.log('before left:', struct.size, struct.alignment)
  var left = struct.size % struct.alignment
  if (left) {
    struct.size += struct.alignment - left
  }
  //console.log('after left:', struct.size)

  var constructor = function (arg, data) {
    if (!(this instanceof constructor)) {
      return new constructor(arg, data)
    }
    if (ffi.Pointer.isPointer(arg)) {
      this.pointer = arg
      arg = data
    } else {
      this.pointer = new ffi.Pointer(struct.size)
    }
    if (arg) {
      for (var key in arg) {
        write(this.pointer, key, arg[key])
      }
    }
  }

  // Function to return an `FFI_TYPE` struct instance from this struct
  constructor._ffiType = function ffiType () {
    // return cached if available
    if (this._ffiTypeCached) {
      return this._ffiTypeCached
    }
    var props = this.__structInfo__.struct
      , propNames = Object.keys(props)
      , numProps = propNames.length
    var t = new ffi.FFI_TYPE()
    t.size = 0
    t.alignment = 0
    t.type = 13 // FFI_TYPE_STRUCT
    t.elements = new ffi.Pointer(ffi.Bindings.POINTER_SIZE * (numProps+1))
    var tptr = t.elements.clone()
    for (var i=0; i<numProps; i++) {
      var prop = props[propNames[i]]
      tptr.putPointer(ffi.ffiTypeFor(prop.type), true)
    }
    // Final NULL pointer to terminate the Array
    tptr.putPointer(ffi.Pointer.NULL)
    return this._ffiTypeCached = t
  }

  // Add getters & setters for each field to the constructor's prototype
  struct.members.forEach(function (field) {
    Object.defineProperty(constructor.prototype, field, {
        get: function () {
          return read(this.pointer, field)
        }
      , set: function (val) {
          write(this.pointer, field, val)
        }
      , enumerable: true
      , configurable: true
    })
  })

  constructor.prototype.__isStructInstance__ == true
  constructor.prototype.__structInfo__ = struct
  constructor.prototype.ref = function ref () {
    return this.pointer
  }

  constructor.__isStructType__ = true
  constructor.__structInfo__ = struct

  return constructor
}
module.exports = Struct
