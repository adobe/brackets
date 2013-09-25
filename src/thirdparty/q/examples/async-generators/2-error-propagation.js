"use strict";

var Q = require("../../q");

var generator = Q.async(function* () {
    try {
        var ten = yield Q.reject(new Error("Rejected!"));
        console.log("Should not get here 1");
    } catch (exception) {
        console.log("Should get here 1");
        console.log(exception.message, "should be", "Rejected!");
        throw new Error("Threw!");
    }
});

generator().then(function () {
    console.log("Should not get here 2");
}, function (reason) {
    console.log("Should get here 2");
    console.log(reason.message, "should be", "Threw!");
});
