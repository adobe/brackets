var FFI     = require("../lib/ffi"),
    util    = require("util");

function measureIterationsOverTime(what, duration, f, granularity) {
    granularity = granularity || 1000;

    var iterations  = 0,
        start       = Date.now();

    while (Date.now() < (start + duration)) {
        for (var i = 0; i < granularity; i++) {
            f();
        }
        iterations += granularity;
    };

    var duration    = Date.now() - start,
        persec      = (iterations / (Date.now() - start)) * 1000;

    util.log("Executed " + what + " " + iterations + " times in " + duration + "ms " + "(" + persec + "/sec)");
}


var benchLibrary = new FFI.Library(null, {
    "abs":        [ "int",    [ "int" ] ],
    "strtoul":    [ "ulong",  [ "string", "pointer", "int" ] ]
});

var blabs = benchLibrary.abs;
var blstrtoul = benchLibrary.strtoul;

measureIterationsOverTime("FFI abs", 5000, function() {
    blabs(1234);
});

measureIterationsOverTime("FFI strtoul", 5000, function() {
    blstrtoul("1234567890", null, 0);
});

strtoulFunc = FFI.Bindings.strtoul;
strtoulPtr  = FFI.Pointer.NULL;

measureIterationsOverTime("Binding strtoul", 5000, function() {
    strtoulFunc("1234567890", strtoulPtr, 0);
});
