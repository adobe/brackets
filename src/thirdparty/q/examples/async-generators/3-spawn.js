"use strict";

var Q = require("../../q");

function foo() {
    return Q.delay(5, 1000);
}

function bar() {
    return Q.delay(10, 1000);
}

Q.spawn(function* () {
    var x = yield foo();
    console.log(x);

    var y = yield bar();
    console.log(y);

    console.log("result", x + y);
});
