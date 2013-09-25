"use strict";

var Q = require("../../q");

var generator = Q.async(function* () {
    var ten = yield 10;
    console.log(ten, 10);
    var twenty = yield ten + 10;
    console.log(twenty, 20);
    var thirty = yield twenty + 10;
    console.log(thirty, 30);
    return thirty + 10;
});

generator().then(function (forty) {
    console.log(forty, 40);
}, function (reason) {
    console.log("reason", reason);
});
