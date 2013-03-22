
var expect = require('expect.js')
  , ffi = require('../')
  , Pointer = ffi.Pointer
  , Callback = ffi.Callback

describe('Callback', function () {

  afterEach(gc)

  it('should create a C function pointer for a JS function', function () {
    var callback = new Callback(['int32', ['int32']], function (val) {
      return Math.abs(val)
    })
    var pointer = callback.getPointer()
    expect(Pointer.isPointer(pointer)).to.be(true)
  })

  it('should be invokable', function () {
    var callback = new Callback(['int32', ['int32']], function (val) {
      return Math.abs(val)
    })
    var pointer = callback.getPointer()
      , func = ffi.ForeignFunction.build(pointer, 'int32', ['int32'])
    expect(func(-1234)).to.equal(1234)
  })

})
