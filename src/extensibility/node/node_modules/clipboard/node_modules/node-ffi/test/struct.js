
var expect = require('expect.js')
  , ffi = require('../')
  , Struct = ffi.Struct

describe('Struct', function () {

  afterEach(gc)

  it('should be a function', function () {
    expect(Struct).to.be.a('function')
  })

  it('should return a struct constuctor function', function () {
    var S = Struct()
    expect(S).to.be.a('function')
  })

  it('should throw when the same field name is speicified more than once', function () {
    expect(Struct.bind(null, [
        [ 'byte', 'a' ]
      , [ 'byte', 'a' ]
    ])).to.throwException()
  })

  it('should work in a simple case', function () {
    var SimpleStruct = new Struct([
        ['byte', 'first']
      , ['byte', 'last']
    ])
    var ss = new SimpleStruct({ first: 50, last: 100 })
    expect(ss.first).to.be.equal(50)
    expect(ss.last).to.be.equal(100)
  })

  it('should work in a more complex case', function () {
    var MegaStruct = new Struct([
        ['byte', 'byteVal']
      , ['int8', 'int8Val']
      , ['int16', 'int16Val']
      , ['uint16', 'uint16Val']
      , ['int32', 'int32Val']
      , ['uint32', 'uint32Val']
      , ['float', 'floatVal']
      , ['double', 'doubleVal']
      , ['pointer', 'pointerVal']
    ])
    var msTestPtr = new ffi.Pointer(1)
    var ms = new MegaStruct({
        byteVal: 100
      , int8Val: -100
      , int16Val: -1000
      , uint16Val: 1000
      , int32Val: -10000
      , uint32Val: 10000
      , floatVal: 1.25
      , doubleVal: 1000.0005
      , pointerVal: msTestPtr
    })
    expect(ms.byteVal).to.equal(100)
    expect(ms.int8Val).to.equal(-100)
    expect(ms.int16Val).to.equal(-1000)
    expect(ms.uint16Val).to.equal(1000)
    expect(ms.int32Val).to.equal(-10000)
    expect(ms.uint32Val).to.equal(10000)
    expect(ms.floatVal).to.equal(1.25)
    expect(ms.doubleVal).to.equal(1000.0005)
    expect(ms.pointerVal.address).to.equal(msTestPtr.address)
  })

  it('should allow Struct nesting', function () {

    var ChildStruct = new Struct([
        ['int', 'a']
      , ['int', 'b']
    ])
    var ParentStruct = new Struct([
        [ChildStruct, 'childA']
      , [ChildStruct, 'childB']
    ])

    var ps = new ParentStruct({
        childA: { a: 100, b: 200 }
      , childB: { a: 300, b: 400 }
    })

    expect(ps.childA.a).to.equal(100)
    expect(ps.childA.b).to.equal(200)
    expect(ps.childB.a).to.equal(300)
    expect(ps.childB.b).to.equal(400)
  })

  describe('offsets and sizeofs', function () {

    function inspect (struct, expectedSize, expectedOffsets) {
      var info = struct.__structInfo__
        , props = info.struct
        , types = []

      Object.keys(props).forEach(function (prop) {
        var type = props[prop].type
        if (ffi.isStructType(type)) {
          // Output more info about the struct
          type = 'Struct'
        }
        types.push(type)
      })

      it('Struct {'+types.join(', ')+'},  expectedSize='+expectedSize+',  expectedOffsets=['+expectedOffsets.join(',')+']', function () {

        expect(ffi.sizeOf(struct)).to.equal(expectedSize)

        Object.keys(props).forEach(function (prop, i) {
          expect(props[prop].offset).to.equal(expectedOffsets[i])
        })

      })

    }

    // TODO: build struct examples statically as part of the build and expose
    // via the bindings interface.

    var test1 = ffi.Struct([
        ['int32', 'a']
      , ['int32', 'b']
      , ['double', 'c']
    ])
    inspect(test1, 16, [0,4,8])

    var test2 = ffi.Struct([
        ['int32', 'a']
      , ['double', 'b']
      , ['int32', 'c']
    ])
    inspect(test2, 24, [0,8,16])

    var test3 = ffi.Struct([
        ['double', 'a']
      , ['int32', 'b']
      , ['int32', 'c']
    ])
    inspect(test3, 16, [0,8,12])

    var test4 = ffi.Struct([
        ['double', 'a']
      , ['double', 'b']
      , ['int32', 'c']
    ])
    inspect(test4, 24, [0,8,16])

    var test5 = ffi.Struct([
        ['int32', 'a']
      , ['double', 'b']
      , ['double', 'c']
    ])
    inspect(test5, 24, [0,8,16])

    var test6 = ffi.Struct([
        ['char', 'a']
      , ['short','b']
      , ['int32','c']
    ])
    inspect(test6, 8, [0,2,4])

    var test7 = ffi.Struct([
        ['int32','a']
      , ['short','b']
      , ['char', 'c']
    ])
    inspect(test7, 8, [0,4,6])

    var test8 = ffi.Struct([
        ['int32','a']
      , ['short','b']
      , ['char', 'c']
      , ['char', 'd']
    ])
    inspect(test8, 8, [0,4,6,7])

    var test9 = ffi.Struct([
        ['int32','a']
      , ['short','b']
      , ['char', 'c']
      , ['char', 'd']
      , ['char', 'e']
    ])
    inspect(test9, 12, [0,4,6,7,8])

    var test10 = ffi.Struct([
        [test1, 'a']
      , ['char','b']
    ])
    inspect(test10, 24, [0,16])

    var ffi_type = ffi.Struct([
        ['size_t','size']
      , ['ushort','alignment']
      , ['ushort','type']
      , ['pointer','elements']
    ])
    if (ffi.Bindings.POINTER_SIZE == 4) {
      inspect(ffi_type, 12, [0,4,6,8])
    } else if (ffi.Bindings.POINTER_SIZE == 8) {
      inspect(ffi_type, 24, [0,8,10,16])
    } else {
      throw new Error("Bad platform pointer size: %d bytes", ffi.Bindings.POINTER_SIZE)
    }

  })

})
