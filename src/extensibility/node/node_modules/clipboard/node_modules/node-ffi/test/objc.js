
var expect = require('expect.js')
  , ffi = require('../')

if (ffi.Bindings.HAS_OBJC) {

  describe('@try / @catch', function () {

    afterEach(gc)

    var objcLib = new ffi.Library('libobjc', {
        'objc_msgSend': [ 'pointer', [ 'pointer', 'pointer' ] ]
      , 'objc_getClass': [ 'pointer', [ 'string' ] ]
      , 'sel_registerName': [ 'pointer', [ 'string' ] ]
    })

    var NSAutoreleasePool = objcLib.objc_getClass('NSAutoreleasePool')
      , sel_new = objcLib.sel_registerName('new')
      , pool = objcLib.objc_msgSend(NSAutoreleasePool, sel_new)

    it('should proxy @try/@catch to JavaScript via try/catch/throw', function () {
      var sel_retain = objcLib.sel_registerName('retain')
      expect(function () {
        objcLib.objc_msgSend(pool, sel_retain)
      }).to.throwException()
    })

    it('should throw a Pointer instance when an exception happens', function () {
      var sel_retain = objcLib.sel_registerName('retain')
      try {
        objcLib.objc_msgSend(pool, sel_retain)
        expect(false).to.be(true)
      } catch (e) {
        expect(ffi.Pointer.isPointer(e)).to.be(true)
        expect(e.isNull()).to.be(false)
        expect(e.address).to.be.greaterThan(0)
      }
    })

  })

}
