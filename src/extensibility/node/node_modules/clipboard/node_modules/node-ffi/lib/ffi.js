var ffi = module.exports

ffi.Bindings = require('bindings')('ffi_bindings.node')

ffi.VERSION = '0.5.0'

ffi.TYPE_TO_POINTER_METHOD_MAP = {
    'uint8':   'UInt8'
  , 'int8':    'Int8'
  , 'uint8':   'UInt8'
  , 'int16':   'Int16'
  , 'uint16':  'UInt16'
  , 'int32':   'Int32'
  , 'uint32':  'UInt32'
  , 'int64':   'Int64'
  , 'uint64':  'UInt64'
  , 'float':   'Float'
  , 'double':  'Double'
  , 'string':  'CString'
  , 'pointer': 'Pointer'
}

ffi.SIZE_TO_POINTER_METHOD_MAP = {
    1: 'Int8'
  , 2: 'Int16'
  , 4: 'Int32'
  , 8: 'Int64'
}

ffi.PLATFORM_LIBRARY_EXTENSIONS = {
    'linux':  '.so'
  , 'linux2': '.so'
  , 'sunos':  '.so'
  , 'solaris':'.so'
  , 'darwin': '.dylib'
  , 'mac':    '.dylib'
  , 'win32':  '.dll'
}

// A list of types with no hard C++ methods to read/write them
ffi.NON_SPECIFIC_TYPES = {
    'byte':      'Byte'
  , 'char':      'Char'
  , 'uchar':     'UChar'
  , 'short':     'Short'
  , 'ushort':    'UShort'
  , 'int':       'Int'
  , 'uint':      'UInt'
  , 'long':      'Long'
  , 'ulong':     'ULong'
  , 'longlong':  'LongLong'
  , 'ulonglong': 'ULongLong'
  , 'size_t':    'SizeT'
}

// ------------------------------------------------------
// Miscellaneous Utility Functions
// ------------------------------------------------------

// Returns true if the passed type is a valid param type
ffi.isValidParamType = function(type) {
  return ffi.isStructType(type) || ffi.Bindings.FFI_TYPES[type] != undefined
}

// Returns true if the passed type is a valid return type
ffi.isValidReturnType = function(type) {
  return ffi.isValidParamType(type) || type == 'void'
}

ffi.derefValuePtr = function(type, ptr) {
  if (!ffi.isValidParamType(type)) {
    throw new Error('Invalid Type: ' + type)
  }

  if (ffi.isStructType(type)) {
    return new type(ptr)
  }

  if (type == 'void') {
    return null
  }

  var dptr = ptr

  if (type == 'string') {
    dptr = ptr.getPointer()
    if (dptr.isNull()) {
      return null
    }
  }

  return dptr['get' + ffi.TYPE_TO_POINTER_METHOD_MAP[type]]()
}

// Generates a derefValuePtr for a specific type
ffi.derefValuePtrFunc = function(type) {
  if (!ffi.isValidParamType(type)) {
    throw new Error('Invalid Type: ' + type)
  }

  if (ffi.isStructType(type)) {
    return function(ptr) {
      return new type(ptr)
    }
  }

  if (type == 'void') {
    return function(ptr) { return null; }
  }

  var getf = 'get' + ffi.TYPE_TO_POINTER_METHOD_MAP[type]

  if (type == 'string') {
    return function(ptr) {
      var dptr = ptr.getPointer()
      if (dptr.isNull()) {
        return null
      }
      return dptr[getf]()
    }
  } else {
    return function(ptr) {
      return ptr[getf]()
    }
  }
}

/**
 * Returns the byte size of the given type. `type` may be a string name
 * identifier or a Struct type.
 * Roughly equivalent to the C sizeof() operator.
 */

function sizeof (type) {
  return ffi.isStructType(type)
      ? type.__structInfo__.size
      : ffi.Bindings.TYPE_SIZE_MAP[type]
}
ffi.sizeOf = ffi.sizeof = sizeof

/**
 * Returns the FFI_TYPE for the given `type`. May be a `Struct` type.
 */

function ffiTypeFor (type) {
  return ffi.isStructType(type)
      ? type._ffiType().ref()
      : ffi.Bindings.FFI_TYPES[type]
}
ffi.ffiTypeFor = ffiTypeFor

/**
 * Returns true if the given `type` is a Struct type, false otherwise.
 */

function isStructType (type) {
  return !!type.__isStructType__
}
ffi.isStructType = isStructType

// Direct exports from the bindings
ffi.free = ffi.Bindings.free
ffi.CallbackInfo = ffi.Bindings.CallbackInfo

// Include our other modules
ffi.Pointer = require('./pointer')
ffi.CIF = require('./cif')
ffi.ForeignFunction = require('./foreign_function')
ffi.DynamicLibrary = require('./dynamic_library')
ffi.Library = require('./library')
ffi.Callback = require('./callback')
ffi.Struct = require('./struct')
ffi.errno = require('./errno')

/**
 * Define the `FFI_TYPE` struct for use in JS.
 * This struct type is used internally to define custom struct rtn/arg types.
 */

ffi.FFI_TYPE = ffi.Struct([
    ['size_t', 'size']
  , ['ushort', 'alignment']
  , ['ushort', 'type']
  , ['pointer','elements']
])

