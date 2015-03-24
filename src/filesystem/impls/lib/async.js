/*!
 * Portions used from `async` module
 * https://github.com/caolan/async
 * Copyright 2010-2014 Caolan McMahon
 * Released under the MIT license
 */

/*jshint onevar: false, indent:4, expr: true */
/*global define */
define(function (require, exports, module) {
    "use strict";

    var Async = brackets.getModule('utils/Async');
    var noop = function() {};

    exports.eachSeries = function(array, iterator, callback) {
        callback = callback || noop;
        var error;

        if(!array.length) {
            return callback();
        }

        function iterate(item) {
            var deferred = new $.Deferred();

            iterator(item, function(err) {
                if(err) {
                    error = err;
                    deferred.reject();
                } else {
                    deferred.resolve();
                }
            });

            return deferred.promise();
        }

        var promise = Async.doSequentially(array, iterate, true);

        promise.done(callback);
        promise.fail(function() {
            callback(error);
        });
    };

    // Series can take in either an array of tasks or an object
    // of tasks. Correspondingly, the results passed back to the
    // callback will either be an array or an object
    exports.series = function(tasks, callback) {
        callback = callback || noop;
        var results;
        var items = tasks;
        var isArray = true;

        function iterator(fn, callback) {
            var callFn = fn;

            if(!isArray) {
                callFn = tasks[fn];
            }

            callFn(function(err, result) {
                if(err) {
                    return callback(err);
                } else if(result) {
                    isArray ? results.push(result) : results[fn] = result;
                }

                callback();
            });
        }

        if(Array.isArray(tasks)) {
            results = [];
        } else {
            results = {};
            items = Object.keys(tasks);
            isArray = false;
        }

        exports.eachSeries(items, iterator, function(err) {
            if(err) {
                callback(err);
            } else {
                callback(null, results);
            }
        });
    };
});
