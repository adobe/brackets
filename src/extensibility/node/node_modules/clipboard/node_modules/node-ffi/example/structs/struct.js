var FFI = require("../../lib/ffi");

var Test = FFI.Struct([
    ['int32', 'a']
  , ['double', 'b']
  , ['string', 'c']
]);
console.log('Test Struct:', Test.__structInfo__)
//var i = new Test()
//console.log(i)

var libstruct = new FFI.Library("./libstruct", {
    test_struct_arg_by_value: [ 'double', [ Test ] ]
  , test_struct_rtn_by_value: [ Test, [ ] ]
  , inspect: ['void', [] ]
});
console.log('After Library')

libstruct.inspect()

var output = libstruct.test_struct_rtn_by_value()

console.log(output.a)
console.log(output.b)
console.log(output.c)

output.c = 'test'

var rtn = libstruct.test_struct_arg_by_value(output)

console.log(rtn)
