"use strict"; // run code in ES5 strict mode

function doSomethingUnstrict() {
    var caller = arguments.callee.caller;   // this should throw an error as a proof that strict mode is on
}

exports.doSomethingUnstrict = doSomethingUnstrict;