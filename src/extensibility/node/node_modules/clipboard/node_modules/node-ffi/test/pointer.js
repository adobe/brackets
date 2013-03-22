
var expect = require('expect.js')
  , ffi = require('../')
  , Pointer = ffi.Pointer

describe('Pointer', function () {

  afterEach(gc)

  it('should be a function', function () {
    expect(Pointer).to.be.a('function')
  })

  it('shoulhd have "name" set to "Pointer"', function () {
    expect(Pointer.name).to.equal('Pointer')
  })

  it('should work with the `new` operator', function () {
    var p = new Pointer(8)
      , test = p instanceof Pointer
    expect(test).to.be(true)
  })

  it('should have its internal __class__ set to "Pointer"', function () {
    var p = new Pointer(1)
    expect(Object.prototype.toString.call(p)).to.equal('[object Pointer]')
  })

  it('should detect the `null` pointer', function () {
    var p = new Pointer(0)
    expect(p.isNull()).to.be(true)
  })

  it('should not free the `null` pointer', function () {
    var p = new Pointer(0)
    expect(p.free).to.be(false)
  })

  it('should have a valid "allocated" property when malloc()\'d', function () {
    var p = new Pointer(1024)
    expect(p.allocated).to.equal(1024)
  })

  it('should have a valid "address"', function () {
    var p = new Pointer(8)
    expect(p.address).to.be.greaterThan(0)
  })

  describe('seek()', function () {

    it('should have function "seek()"', function () {
      expect(Pointer.prototype).to.have.property('seek')
      expect(Pointer.prototype.seek).to.be.a('function')
    })

    it('should return a new Pointer instance', function () {
      var p = new Pointer(8)
        , p2 = p.seek(0)
        , test = p2 instanceof Pointer
      expect(test).to.be(true)
      expect(p).to.not.equal(p2)
    })

    it('should not attempt to `free` the seeked Pointer', function () {
      var p = new Pointer(8)
        , p2 = p.seek(1)
      expect(p.free).to.be(true)
      expect(p2.free).to.be(false)
    })

    it('should return a Pointer with its "address" offset by the specified amount'
    , function () {
      var p = new Pointer(8)
        , p2 = p.seek(32)
      expect(p2.address).to.equal(p.address + 32)
    })

  })

  describe('int8', function () {

    it('should throw on out of bounds values (minimum)', function () {
      var p = new Pointer(8)
        , val = 0 - Math.pow(2, 7) - 1
      expect(p.putInt8.bind(p, val)).to.throwException()
    })

    it('should throw on out of bounds values (maximum)', function () {
      var p = new Pointer(8)
        , val = Math.pow(2, 7) + 1
      expect(p.putInt8.bind(p, val)).to.throwException()
    })

    it('should write an "int8" value properly', function () {
      var p = new Pointer(8)
        , val = 0 - Math.pow(2, 7)
      p.putInt8(val)
      expect(p.getInt8()).to.equal(val)
    })

  })

  describe('uint8', function () {

    it('should throw on out of bounds values (minimum)', function () {
      var p = new Pointer(8)
        , val = -1
      expect(p.putUInt8.bind(p, val)).to.throwException()
    })

    it('should throw on out of bounds values (maximum)', function () {
      var p = new Pointer(8)
        , val = Math.pow(2, 8)
      expect(p.putUInt8.bind(p, val)).to.throwException()
    })

    it('should write a "uint8" value properly', function () {
      var p = new Pointer(8)
        , val = Math.pow(2, 8) - 1
      p.putUInt8(val)
      expect(p.getUInt8()).to.equal(val)
    })

  })

  describe('int16', function () {

    it('should throw on out of bounds values (minimum)', function () {
      var p = new Pointer(8)
        , val = 0 - Math.pow(2, 15) - 1
      expect(p.putInt16.bind(p, val)).to.throwException()
    })

    it('should throw on out of bounds values (maximum)', function () {
      var p = new Pointer(8)
        , val = Math.pow(2, 15) + 1
      expect(p.putInt16.bind(p, val)).to.throwException()
    })

    it('should write an "int16" value properly', function () {
      var p = new Pointer(8)
        , val = 0 - Math.pow(2, 15)
      p.putInt16(val)
      expect(p.getInt16()).to.equal(val)
    })

  })

  describe('uint16', function () {

    it('should throw on out of bounds values (minimum)', function () {
      var p = new Pointer(8)
        , val = -1
      expect(p.putUInt8.bind(p, val)).to.throwException()
    })

    it('should throw on out of bounds values (maximum)', function () {
      var p = new Pointer(8)
        , val = Math.pow(2, 16)
      expect(p.putUInt16.bind(p, val)).to.throwException()
    })

    it('should write a "uint16" value properly', function () {
      var p = new Pointer(8)
        , val = Math.pow(2, 16) - 1
      p.putUInt16(val)
      expect(p.getUInt16()).to.equal(val)
    })

  })

  describe('int64', function () {

    it('should write "int64" values properly', function () {
      var p = new Pointer(8)
        , val = 0 - Math.pow(2, 63)
      p.putInt64(val)
      expect(p.getInt64()).to.eql(val)
    })

    it('should accept String values', function () {
      var p = new Pointer(8)
        , val = '1'
      p.putInt64(val)
      expect(p.getInt64()).to.equal(val)
    })

    it('should return String values', function () {
      var p = new Pointer(8)
        , val = '1'
      p.putInt64(val)
      expect(p.getInt64()).to.be.a('string')
    })

    it('should allow INT64_MAX value', function () {
      var p = new Pointer(8)
        , val = '9223372036854775807'
      p.putInt64(val)
      expect(p.getInt64()).to.equal(val)
    })

    it('should allow INT64_MIX value', function () {
      var p = new Pointer(8)
        , val = '-9223372036854775808'
      p.putInt64(val)
      expect(p.getInt64()).to.equal(val)
    })

  })

  describe('uint64', function () {

    it('should throw on out of bounds values (minimum)', function () {
      var p = new Pointer(8)
        , val = -1
      expect(p.putUInt64.bind(p, val)).to.throwException()
    })

    it('should throw on out of bounds values (maximum)', function () {
      var p = new Pointer(8)
        , val = 18446744073709551616
      expect(p.putUInt64.bind(p, val)).to.throwException()
    })

    it('should allow UINT64_MAX value', function () {
      var p = new Pointer(8)
        , val = '18446744073709551615'
      p.putUInt64(val)
      expect(p.getUInt64()).to.equal(val)
    })

  })

  describe('float', function () {

    it('should write a "float" value properly', function () {
      var p = new Pointer(16)
        , val = 1.5
      p.putFloat(val)
      expect(p.getFloat()).to.equal(val)
    })

  })

  describe('double', function () {

    it('should write a "double" value properly', function () {
      var p = new Pointer(16)
        , val = 1000.005
      p.putDouble(val)
      expect(p.getDouble()).to.equal(val)
    })

  })

  describe('pointer', function () {

    it('should write another Pointer instance properly', function () {
      var p = new Pointer(16)
        , p2 = new Pointer(32)
        , val = 1234.5678
      p2.putDouble(val)
      p.putPointer(p2)
      expect(p.getPointer().address).to.equal(p2.address)
      expect(p.getPointer().getDouble()).to.equal(val)
    })

  })

  describe('string', function () {

    it('should write a C string (char array) properly', function () {
      var p = new Pointer(32)
        , msg = 'Hello World!'
      p.putCString(msg)
      expect(p.getCString()).to.equal(msg)
    })

    // https://github.com/rbranson/node-ffi/issues/27
    it('should write multiple strings properly', function () {
      var p = new Pointer(128)
        , base = p.seek(0)
      p.putCString('one', true)
      p.putCString('two', true)
      p.putCString('three', true)
      expect(base.getCString(true)).to.equal('one')
      expect(base.getCString(true)).to.equal('two')
      expect(base.getCString(true)).to.equal('three')
    })

  })

  describe('Object', function () {

    it('should write a JavaScript Object reference properly', function () {
      var p = new Pointer(32)
        , o = { foo: 'bar' }
      p.putObject(o)
      expect(p.getObject()).to.eql(o)
    })

    it('should write multiple JavaScript Object references properly', function () {
      var p = new Pointer(32)
        , base = p.seek(0)
        , o = { foo: 'bar' }
        , o2 = { test: { equality: true } }
      p.putObject(o, true)
      p.putObject(o2, true)
      expect(base.getObject(true)).to.eql(o)
      expect(base.getObject(true)).to.eql(o2)
    })

  })

  describe('byte', function () {

    it('should write a "byte" properly', function () {
      var p = new Pointer(8)
        , val = 6
      p.putByte(val)
      expect(p.getByte()).to.equal(val)
    })

  })

  describe('char', function () {

    it('should write a "char" properly', function () {
      var p = new Pointer(8)
        , val = 6
      p.putChar(val)
      expect(p.getChar()).to.equal(val)
      val = -6
      p.putChar(val)
      expect(p.getChar()).to.equal(val)
    })

  })

})
