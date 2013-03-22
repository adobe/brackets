var ffi = require('node-ffi');

module.exports = {
  Library: Library,
  Pointer: ffi.Pointer,
  errno: ffi.errno,
  NULL: ffi.Pointer.NULL,
  POINTER_SIZE: ffi.Bindings.POINTER_SIZE,
};

function Library(name, functions) {
  this.name = name;
  this._lib = new ffi.DynamicLibrary(name ? name + Library.extension : null, ffi.DynamicLibrary.FLAGS.RTLD_NOW);
  functions && this.createFunction(functions);
}
Library.extension = ffi.PLATFORM_LIBRARY_EXTENSIONS[process.platform];

Library.prototype = {
  constructor: Library,

  createFunction: function createFunction(name, ret, params){
    if (typeof name === 'object') {
      // multiple functions were provided
      var self = this;
      return Object.keys(name).reduce(function(fns, name){
        fns[name] = createFunction.apply(self, [name].concat(fns[name]));
        return fns;
      }, name);
    }

    var paramNames = params ? Object.keys(params) : [];
    var paramTypes = paramNames.map(function(param){ return params[param] });

    var func = this[name] = new ffi.ForeignFunction(this._lib.get(name), ret, paramTypes);
    // getFunction is a useless artifact from an older node-ffi version
    delete func.getFunction;

    paramNames.forEach(function(name,i){
      // put the param names on the function for potential usage for debugging/introspection
      Object.defineProperty(func, i, { value: name, configurable: true })
    });

    return func;
  },

  set _lib(v){ Object.defineProperty(this, '_lib', { value: v }) },
};

