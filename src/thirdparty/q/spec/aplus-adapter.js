"use strict";

var Q = require("../q");

exports.fulfilled = Q.resolve;
exports.rejected = Q.reject;
exports.pending = function () {
    var deferred = Q.defer();

    return {
        promise: deferred.promise,
        fulfill: deferred.resolve,
        reject: deferred.reject
    };
};
