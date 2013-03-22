
var expect = require('expect.js')
  , ffi = require('../')
  , Library = ffi.Library

describe('Library', function () {

  afterEach(gc)

  it('should be a function', function () {
    expect(Library).to.be.a('function')
  })

  it('should work with the `new` operator', function () {
    var l = new Library()
    expect(l).to.be.an('object')
  })

  it('should accept `null` as a first argument', function () {
    var thisFuncs = new Library(null, {
      'printf': [ 'void', [ 'string' ] ]
    })
    var test = thisFuncs.printf instanceof Function
    expect(test).to.be(true)
  })

  it('should accept a lib name as a first argument', function () {
    var lib = process.platform == 'win32' ? 'msvcrt' : 'libm'
    var libm = new Library(lib, {
        'ceil': [ 'double', [ 'double' ] ]
    })
    var test = libm.ceil instanceof Function
    expect(test).to.be(true)
    expect(libm.ceil(1.1)).to.equal(2)
  })

  it('should accept a lib name with file extension', function() {
    var lib = process.platform == 'win32'
      ? 'msvcrt.dll'
      : 'libm' + ffi.PLATFORM_LIBRARY_EXTENSIONS[process.platform]
    var libm = new Library(lib, {
      'ceil': [ 'double', ['double'] ]
    })
    var test = libm.ceil instanceof Function
    expect(test).to.be(true)
    expect(libm.ceil(100.9)).to.equal(101)
  })

  it('should throw when an invalid function name is used', function () {
    expect(function () {
      new Library(null, {
          'doesnotexist__': [ 'void', [] ]
      })
    }).to.throwException()
  })

  it('should work with "strcpy" and a 128 length string', function () {
    var ZEROS_128 = Array(128 + 1).join('0')
    var buf = new ffi.Pointer(256)
    var strcpy = new Library(null, {
        'strcpy': [ 'pointer', [ 'pointer', 'string' ] ]
    }).strcpy
    strcpy(buf, ZEROS_128)
    expect(buf.getCString()).to.equal(ZEROS_128)
  })

  it('should work with "strcpy" and a 2k length string', function () {
    var ZEROS_2K = Array(2e3 + 1).join('0')
    var buf = new ffi.Pointer(4096)
    var strcpy = new Library(null, {
        'strcpy': [ 'pointer', [ 'pointer', 'string' ] ]
    }).strcpy
    strcpy(buf, ZEROS_2K)
    expect(buf.getCString()).to.equal(ZEROS_2K)
  })

  if (process.platform == 'win32') {

    it('should work with "GetTimeOfDay" and a "FILETIME" Struct pointer',
    function () {
      var FILETIME = new ffi.Struct([
          ['uint32', 'dwLowDateTime']
        , ['uint32', 'dwHighDateTime']
      ])
      var l = new Library('kernel32', {
          'GetSystemTimeAsFileTime': [ 'void', [ 'pointer' ]]
      })
      var ft = new FILETIME()
      l.GetSystemTimeAsFileTime(ft.ref())
      // TODO: Add an expect() clause here...
    })

  } else {

    it('should work with "gettimeofday" and a "timeval" Struct pointer',
    function () {
      var timeval = new ffi.Struct([
          ['long','tv_sec']
        , ['long','tv_usec']
      ])
      var l = new Library(null, {
          'gettimeofday': ['int', ['pointer', 'pointer']]
      })
      var tv = new timeval()
      l.gettimeofday(tv.ref(), null)
      expect(tv.tv_sec == Math.floor(Date.now() / 1000)).to.be(true)
    })

  }

  describe('async', function () {

    it('should call a function asynchronously', function (done) {
      var lib = process.platform == 'win32' ? 'msvcrt' : 'libm'
      var libm = new Library(lib, {
          'ceil': [ 'double', [ 'double' ], { async: true } ]
      })
      libm.ceil(1.1).on('success', function (res) {
        expect(res).to.equal(2)
        done()
      })
    })

  })

})
