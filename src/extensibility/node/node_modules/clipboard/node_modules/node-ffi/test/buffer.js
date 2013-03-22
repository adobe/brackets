
var expect = require('expect.js')
  , ffi = require('../')
  , Pointer = ffi.Pointer

describe('Pointer', function () {

  afterEach(gc)

  describe('toBuffer()', function () {

    it('should return a "Buffer" instance', function () {
      var p = new Pointer(8)
        , b = p.toBuffer()
      expect(Buffer.isBuffer(b)).to.be(true)
    })

    it('`Buffer#length` should match `Pointer#allocated`', function () {
      var p = new Pointer(128)
        , b = p.toBuffer()
      expect(b.length).to.equal(p.allocated)
    })

    it('should work when writing to Buffer, reading from Pointer', function () {
      var p = new Pointer(6)
        , b = p.toBuffer()
        , msg = 'hello'
      b.write(msg + '\0')
      expect(p.getCString()).to.equal(msg)
    })

    it('should work when writing to Pointer, reading from Buffer', function () {
      var p = new Pointer(12)
        , b = p.toBuffer()
        , msg = 'hello world'
      p.putCString(msg)
      expect(b.toString('ascii', 0, msg.length)).to.equal(msg)
    })

    it('should work when modifying a single byte in the Buffer', function () {
      var p = new Pointer(6)
        , b = p.toBuffer()
      p.putCString('hello')
      b[2] = 'L'.charCodeAt(0)
      expect(p.getCString()).to.equal('heLlo')
    })

  })

})
