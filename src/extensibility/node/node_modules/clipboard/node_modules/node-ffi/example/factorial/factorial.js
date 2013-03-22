var FFI = require("../../lib/ffi");

var libfactorial = new FFI.Library("./libfactorial", {
    "factorial": [ "uint64", [ "int" ] ]
});

if (process.argv.length < 3) {
    console.log("Arguments: " + process.argv[0] + " " + process.argv[1] + " <max>");
    process.exit();
}

var output = libfactorial.factorial(parseInt(process.argv[2]))

console.log("Your output: " + output);
