"use strict";

var Q = require("../../q");

// We get back blocking semantics: can use promises with `if`, `while`, `for`,
// etc.
var filter = Q.async(function* (promises, test) {
    var results = [];
    for (var i = 0; i < promises.length; i++) {
        var val = yield promises[i];
        if (test(val)) {
            results.push(val);
        }
    }
    return results;
});

var promises = [
    Q.delay("a", 500),
    Q.delay("d", 1000),
    Q("l")
];

filter(promises, function (letter) {
    return "f" > letter;
}).done(function (all) {
    console.log(all); // [ "a", "d" ]
});


// we can use try and catch to handle rejected promises
var logRejections = Q.async(function* (work) {
    try {
        yield work;
        console.log("Never end up here");
    } catch (e) {
        console.log("Caught:", e.message);
    }
});

var rejection = Q.reject(new Error("Oh dear"));
logRejections(rejection); // Caught: Oh dear
