var util = require("util");

var assert  = require("assert"),
    FFI     = require("../lib/ffi"),
    rss     = process.memoryUsage()["rss"];

var Pointer = FFI.Pointer;

////////////////

assert.throws(function() { ptr.putInt32(Math.pow(2, 31) + 1); });
assert.throws(function() { ptr.putInt32(0 - Math.pow(2, 31) - 1); });

ptr.putInt32(0 - Math.pow(2, 31));
assert.equal(0 - Math.pow(2, 31), ptr.getInt32());

assert.throws(function() { ptr.putUInt32(-1); });
assert.throws(function() { ptr.putUInt32(Math.pow(2, 32)); });

ptr.putUInt32(Math.pow(2, 32) - 1);
assert.equal(Math.pow(2, 32) - 1, ptr.getUInt32());

////////////////

// This checks for int64 behavior remaining the same (V8 using floats for these numbers)
assert.notEqual(Math.pow(2, 64).toString(), "18446744073709551616");
assert.notEqual(Math.pow(2, 63).toString(), "9223372036854775808");

//assert.throws(function() { ptr.putInt64(-9223372036854785808); });
//assert.throws(function() { ptr.putInt64(9223372036854785808); });

ptr.putInt64(0 - Math.pow(2, 63));
assert.equal(0 - Math.pow(2, 63), ptr.getInt64());

assert.throws(function() { ptr.putUInt64(-1); });
assert.throws(function() { ptr.putUInt64(18446744073709551616); });

ptr.putUInt64(Math.pow(2, 63) - 10000);
assert.equal(Math.pow(2, 63) - 10000, ptr.getUInt64());

// check for string support
assert.throws(function() { ptr.putInt64("9223372036854775808"); });
assert.throws(function() { ptr.putInt64("-9223372036854775809"); });

// allows INT64_MAX value
ptr.putInt64("9223372036854775807");
assert.equal("9223372036854775807", ptr.getInt64());

// allows INT64_MIN value
ptr.putInt64("-9223372036854775808");
assert.equal("-9223372036854775808", ptr.getInt64());

// Uint should throw error on value > UINT64_MAX or negative number
assert.throws(function() { ptr.putUInt64("18446744073709551616"); });
assert.throws(function() { ptr.putUInt64("-1"); });

// allows UINT64_MAX value
ptr.putUInt64("18446744073709551615");
assert.equal("18446744073709551615", ptr.getUInt64());

///////////////////////////////

assert.throws(function() {
    ptr.putUChar(-8);
});
ptr.putChar(-8);
assert.ok(ptr.getUChar() != 8 && ptr.getUChar() > 0);

ptr.putUChar(8);
assert.equal(8, ptr.getUChar());

///////////////////////////////

ptr.putShort(9);
assert.equal(9, ptr.getShort());

ptr.putShort(-9);
assert.equal(-9, ptr.getShort());

///////////////////////////////

assert.throws(function() {
    ptr.putUShort(-8);
});
ptr.putShort(-8);
assert.ok(ptr.getUShort() != 8 && ptr.getUShort() > 0);

ptr.putUShort(11);
assert.equal(11, ptr.getUShort());

///////////////////////////////

ptr.putInt(12);
assert.equal(12, ptr.getInt());

ptr.putInt(-12);
assert.equal(-12, ptr.getInt());

///////////////////////////////

assert.throws(function() {
    ptr.putUInt(-8);
});
ptr.putInt(-8);
assert.ok(ptr.getUInt() != 8 && ptr.getUInt() > 0);

ptr.putUInt(13);
assert.equal(13, ptr.getUInt());

///////////////////////////////

ptr.putLong(14);
assert.equal(14, ptr.getLong());

ptr.putLong(-14);
assert.equal(-14, ptr.getLong());

///////////////////////////////

assert.throws(function() {
    ptr.putULong(-8);
});
ptr.putLong(-8);
assert.ok(ptr.getULong() != 8 && ptr.getULong() > 0);

ptr.putULong(15);
assert.equal(15, ptr.getULong());

///////////////////////////////

ptr.putLongLong(16);
assert.equal(16, ptr.getLongLong());

ptr.putLongLong(-16);
assert.equal(-16, ptr.getLongLong());

///////////////////////////////

assert.throws(function() {
    ptr.putULongLong(-8);
});
ptr.putLongLong(-8);
assert.ok(ptr.getULongLong() != 8 && ptr.getULongLong() > 0);

ptr.putULongLong(17);
assert.equal(17, ptr.getULongLong());

///////////////////////////////

assert.throws(function() {
   ptr.putSizeT(-1);
});

ptr.putSizeT(18);
assert.equal(18, ptr.getSizeT());

// test put + advance calls
var advptr = ptr.seek(0);
assert.ok(advptr.address == ptr.address);
advptr.putByte(1, true);
assert.ok(advptr.address > ptr.address);

advptr = ptr.seek(0);
assert.ok(advptr.address == ptr.address);
advptr.putInt8(1, true);
assert.ok(advptr.address > ptr.address);

advptr = ptr.seek(0);
assert.ok(advptr.address == ptr.address);
advptr.putInt16(1, true);
assert.ok(advptr.address > ptr.address);

advptr = ptr.seek(0);
assert.ok(advptr.address == ptr.address);
advptr.putUInt16(1, true);
assert.ok(advptr.address > ptr.address);

advptr = ptr.seek(0);
assert.ok(advptr.address == ptr.address);
advptr.putInt32(1, true);
assert.ok(advptr.address > ptr.address);

advptr = ptr.seek(0);
assert.ok(advptr.address == ptr.address);
advptr.putUInt32(1, true);
assert.ok(advptr.address > ptr.address);

advptr = ptr.seek(0);
assert.ok(advptr.address == ptr.address);
advptr.putInt64(1, true);
assert.ok(advptr.address > ptr.address);

advptr = ptr.seek(0);
assert.ok(advptr.address == ptr.address);
advptr.putUInt64(1, true);
assert.ok(advptr.address > ptr.address);

advptr = ptr.seek(0);
assert.ok(advptr.address == ptr.address);
advptr.putFloat(1, true);
assert.ok(advptr.address > ptr.address);

advptr = ptr.seek(0);
assert.ok(advptr.address == ptr.address);
advptr.putDouble(1, true);
assert.ok(advptr.address > ptr.address);

advptr = ptr.seek(0);
assert.ok(advptr.address == ptr.address);
advptr.putPointer(ptr, true);
assert.ok(advptr.address > ptr.address);

advptr = ptr.seek(0);
assert.ok(advptr.address == ptr.address);
advptr.putCString("hi", true);
assert.ok(advptr.address > ptr.address);

// test get + advance calls

advptr = ptr.seek(0);
assert.ok(advptr.address == ptr.address);
advptr.getByte(true);
assert.ok(advptr.address > ptr.address);

advptr = ptr.seek(0);
assert.ok(advptr.address == ptr.address);
advptr.getInt8(true);
assert.ok(advptr.address > ptr.address);

advptr = ptr.seek(0);
assert.ok(advptr.address == ptr.address);
advptr.getInt16(true);
assert.ok(advptr.address > ptr.address);

advptr = ptr.seek(0);
assert.ok(advptr.address == ptr.address);
advptr.getUInt16(true);
assert.ok(advptr.address > ptr.address);

advptr = ptr.seek(0);
assert.ok(advptr.address == ptr.address);
advptr.getInt32(true);
assert.ok(advptr.address > ptr.address);

advptr = ptr.seek(0);
assert.ok(advptr.address == ptr.address);
advptr.getUInt32(true);
assert.ok(advptr.address > ptr.address);

advptr = ptr.seek(0);
assert.ok(advptr.address == ptr.address);
advptr.getInt64(true);
assert.ok(advptr.address > ptr.address);

advptr = ptr.seek(0);
assert.ok(advptr.address == ptr.address);
advptr.getUInt64(true);
assert.ok(advptr.address > ptr.address);

advptr = ptr.seek(0);
assert.ok(advptr.address == ptr.address);
advptr.getFloat(true);
assert.ok(advptr.address > ptr.address);

advptr = ptr.seek(0);
assert.ok(advptr.address == ptr.address);
advptr.getDouble(true);
assert.ok(advptr.address > ptr.address);

advptr = ptr.seek(0);
assert.ok(advptr.address == ptr.address);
advptr.getPointer(true);
assert.ok(advptr.address > ptr.address);

advptr = ptr.seek(0);
assert.ok(advptr.address == ptr.address);
advptr.getCString(true);
assert.ok(advptr.address > ptr.address);

//////////////////////

var tcif = new FFI.CIF("int32", ["int32"]);
assert.ok(tcif.getArgTypesPointer() instanceof FFI.Pointer);
var cifat = tcif.getArgTypesPointer().seek(0);
assert.equal(FFI.Bindings.FFI_TYPES["int32"].address, cifat.getPointer(true).address);

//////////////////////

var builtValuePtr = FFI.Pointer.alloc("int32", 1234);
assert.equal(1234, builtValuePtr.getInt32());
assert.equal(1234, FFI.derefValuePtr("int32", builtValuePtr));

var int32Derefer = FFI.derefValuePtrFunc("int32");
assert.equal(1234, int32Derefer(builtValuePtr));

var builtStringPtr = FFI.Pointer.alloc("string", "Hello World!");
assert.equal("Hello World!", FFI.derefValuePtr("string", builtStringPtr));

var stringDerefer = FFI.derefValuePtrFunc("string");
assert.equal("Hello World!", stringDerefer(builtStringPtr));

//////////////////////

var libm = new FFI.DynamicLibrary("libm" + FFI.PLATFORM_LIBRARY_EXTENSIONS[process.platform], FFI.DynamicLibrary.FLAGS.RTLD_NOW);
assert.ok(libm instanceof FFI.DynamicLibrary);

var ceilPtr = libm.get("ceil");
assert.ok(ceilPtr instanceof FFI.Pointer);
assert.ok(!ceilPtr.isNull());

var ceil = FFI.ForeignFunction.build(ceilPtr, "double", [ "double" ]);
assert.ok(ceil instanceof Function);

assert.equal(2, ceil(1.5));

libm.close();

///////////////////////

var closureCalled = 0;
var cifPtr = new FFI.CIF("int32", [ "int32" ]);
var clz = new FFI.CallbackInfo(cifPtr.getPointer(), function(result, args) {
    closureCalled++;
});

var callMyTestClosure = FFI.ForeignFunction.build(clz.pointer, "int32", [ "int32" ]);
callMyTestClosure(1);
assert.equal(1, closureCalled);
callMyTestClosure(1);
assert.equal(2, closureCalled);

///////////////////////

// Test string argument NULL handling
var memcpyLib   = new FFI.Library(null, { "memcpy": [ "int", [ "pointer", "string", "size_t" ] ] });
var bufPtr      = new Pointer(128);

memcpyLib.memcpy(bufPtr, "1234", 5);
assert.equal("1234", bufPtr.getCString());

memcpyLib.memcpy(bufPtr, null, 0);

memcpyLib.memcpy(bufPtr, "4321", 5);
assert.equal("4321", bufPtr.getCString());

///////////////////////

util.log("Heap increased by " + ((process.memoryUsage()["rss"] - rss) / 1024) + " KB");
