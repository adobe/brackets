/*
 * Copyright 2012 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false */

/**
 * Utilities for working with Deferred, Promise, and other asynchronous processes.
 */
define(function(require, exports, module) {
    
    // TODO: add utilities for blocking UI until a Promise completes
    
    // TODO: another architectural issue with Deferred/Promise is the inability to do anything
    // akin to a 'finally' block. It'd be nice if we could harvest exceptions across all steps of
    // an async process and pipe them to a handler, so that we don't leave UI-blocking overlays up
    // forever, etc.
    
    // TODO: see..
    //  - https://github.com/kriszyp/node-promise  (via http://www.hermanradtke.com/blog/managing-multiple-jquery-promises/)
    //  - http://api.jquery.com/deferred.pipe/
    
    // TODO:
    // A "SuperDeferred" could feature some very useful enhancements:
    //  - API for cancellation (non guaranteed, best attempt)
    //  - easy way to add a timeout clause (withTimeout() wrapper below is more verbose)
    //  - encapsulate the task kickoff code so you can start it later, e.g. superDeferred.start()
    //  - try/catch guards on the code that calls done()/fail() handlers with some way to chain
    //    that back to other Deferreds that *would* have been resolved/rejected if the handler had
    //    run properly...??

    /**
     * Executes a series of tasks in parallel, returning a "master" Promise that is resolved once
     * all the tasks have resolved. If one or more tasks fail, behavior depends on the failFast
     * flag:
     *   - If true, the master Promise is rejected as soon as the first task fails. The remaining
     *     tasks continue to completion in the background.
     *   - If false, the master Promise is rejected after all tasks have completed.
     *
     * If nothing fails:          (M = master promise; 1-4 = tasks; d = done; F = fail)
     *  M  ------------d
     *  1 >---d        .
     *  2 >------d     .
     *  3 >---------d  .
     *  4 >------------d
     *
     * With failFast = false:
     *  M  ------------F
     *  1 >---d     .  .
     *  2 >------d  .  .
     *  3 >---------F  .
     *  4 >------------d
     *
     * With failFast = true: -- equivalent to $.when()
     *  M  ---------F
     *  1 >---d     .
     *  2 >------d  .
     *  3 >---------F
     *  4 >------------d   (#4 continues even though master Promise has failed)
     * (Note: if tasks finish synchronously, the behavior is more like failFast=false because you
     * won't get a chance to respond to the master Promise until after all items have been processed)
     *
     * To perform task-specific work after an individual task completes, attach handlers to each
     * Promise before beginProcessItem() returns it.
     *
     * Note: don't use this if individual tasks (or their done/fail handlers) could ever show a user-
     * visible dialog: because they run in parallel, you could show multiple dialogs atop each other.
     *
     * @param {!Array.<*>} items
     * @param {!function(*, number):Promise} beginProcessItem
     * @param {!boolean} failFast
     * @return {$.Promise}
     */
    function doInParallel(items, beginProcessItem, failFast) {
        var promises = [];
        var masterPromise = new $.Deferred();
        
        if (items.length === 0) {
            masterPromise.resolve();
            
        } else {
            var numCompleted = 0;
            var hasFailed = false;
            
            items.forEach(function (item, i) {
                var itemPromise = beginProcessItem(item, i);
                promises.push(itemPromise);
                
                itemPromise.fail(function () {
                   if (failFast) {
                       masterPromise.reject();
                   } else {
                       hasFailed = true;
                   }
                });
                itemPromise.always(function () {
                    numCompleted++;
                    if (numCompleted === items.length) {
                        if (hasFailed) {
                            masterPromise.reject();
                        } else {
                            masterPromise.resolve();
                        }
                    }
                })
            });
            
        }
        
        return masterPromise.promise();
    }
    
    /**
     * Executes a series of tasks in serial (task N does not begin until task N-1 has completed).
     * Returns a "master" Promise that is resolved once all the tasks have resolved. If one or more
     * tasks fail, behavior depends on the failAndStopFast flag:
     *   - If true, the master Promise is rejected as soon as the first task fails. The remaining
     *     tasks are never started (the serial sequence is stopped).
     *   - If false, the master Promise is rejected after all tasks have completed.
     *
     * If nothing fails:
     *  M  ------------d
     *  1 >---d        .
     *  2     >--d     .
     *  3        >--d  .
     *  4           >--d
     *
     * With failAndStopFast = false:
     *  M  ------------F
     *  1 >---d     .  .
     *  2     >--d  .  .
     *  3        >--F  .
     *  4           >--d
     *
     * With failAndStopFast = true:
     *  M  ---------F
     *  1 >---d     .
     *  2     >--d  .
     *  3        >--F
     *  4          (#4 never runs)
     *
     * To perform task-specific work after an individual task completes, attach handlers to each
     * Promise before beginProcessItem() returns it.
     *
     * @param {!Array.<*>} items
     * @param {!function(*, number):Promise} beginProcessItem
     * @param {!boolean} failAndStopFast
     * @return {$.Promise}
     */
    function doSequentially(items, beginProcessItem, failAndStopFast) {

        var masterPromise = new $.Deferred();
        var hasFailed = false;
        
        function doItem(i) {
            if (i >= items.length) {
                if (hasFailed) {
                    masterPromise.reject();
                } else {
                    masterPromise.resolve();
                }
                return;
            }
            
            var itemPromise = beginProcessItem(items[i], i);
            
            itemPromise.done(function () {
                doItem(i + 1);
            });
            itemPromise.fail(function () {
                if (failAndStopFast) {
                    masterPromise.reject();
                    // note: we do NOT process any further items in this case
                } else {
                    hasFailed = true;
                    doItem(i + 1);
                }
            });
        }
        
        doItem(0);
        
        return masterPromise.promise();
    }
    
    
    /**
     * Executes a series of tasks in parallel, saving up error info from any that fail along the way.
     * Returns a Promise that is only resolved/rejected once all tasks are complete. This is
     * essentially a wrapper around doInParallel(..., false).
     *
     * If one or more tasks failed, the entire "master" promise is rejected at the end - with one
     * argument: an array objects, one per failed task. Each error object contains:
     *  - item -- the entry in items whose task failed
     *  - error -- the first argument passed to the fail() handler when the task failed
     *
     * @param {!Array.<*>} items
     * @param {!function(*, number):Promise} beginProcessItem
     * @return {$.Promise}
     */
    function doInParallel_aggregateErrors(items, beginProcessItem) {
        var errors = [];
        
        var masterPromise = new $.Deferred();
        
        var parallelResult =
            doInParallel(
                items,
                function (item, i) {
                    var itemResult = beginProcessItem(item, i);
                    itemResult.fail(function (error) {
                        errors.push({ item:item, error:error });
                    });
                    return itemResult;
                },
                false
            );
        
        parallelResult.done(function () {
            masterPromise.resolve();
        })
        .fail(function () {
            masterPromise.reject(errors);
        });
        
        return masterPromise.promise();
    }
    
    
    /**
     * Adds timeout-driven failure to a Promise: returns a new Promise that is resolved/rejected when
     * the given original Promise is resolved/rejected, OR is rejected after the given delay - whichever
     * happens first.
     * 
     * If the original Promise is resolved/rejected first, done()/fail() handlers receive arguments
     * piped from the original Promise. If the timeout occurs first instead, fail() is called with the
     * token Async.ERROR_TIMEOUT.
     * 
     * @param {$.Promise} promise
     * @param {number} timeout
     * @return {$.Promise}
     */
    function withTimeout(promise, timeout) {
        var wrapper = new $.Deferred();
        
        var timer = setTimeout(function () {
            wrapper.reject(ERROR_TIMEOUT);
        }, timeout);
        promise.always(function () {
            clearTimeout(timer);
        });
        promise.pipe(wrapper.resolve, wrapper.reject);
        
        return wrapper.promise();
    }
    
    /** Value passed to fail() handlers that have been triggered due to withTimeout()'s timeout */
    var ERROR_TIMEOUT = {};
    
    
    
    
    
    
    
    
    
    
    function test() {
        var items = [100, 200, 300, 400];
        var itemsDone;
        var failItemI = -1;
        var expectShortCircuit = false;
        var expectFailFast = false;
        
        function fakeProcess(delay, itemI) {
            var result = new $.Deferred();
            if (expectShortCircuit && itemI > failItemI)
                console.log("### Fail - should have short circuited before "+itemI);
            
            setTimeout(function() {
                itemsDone[itemI] = true;
                if (itemI === failItemI) {
                    console.log("  item "+itemI+" reject()");
                    result.reject(itemI); //(args checked in some tests)
                } else {
                    console.log("  item "+itemI+" resolve()");
                    result.resolve(itemI); //(args checked in some tests)
                }
            }, delay);
            return result.promise();
        }
        function fakeSyncProcess(delay, itemI) {
            var result = new $.Deferred();
            if (expectShortCircuit && itemI > failItemI)
                console.log("### Fail - should have short circuited before "+itemI);
            
            itemsDone[itemI] = true;
            if (itemI === failItemI) {
                console.log("  item "+itemI+" reject()");
                result.reject();
            } else {
                console.log("  item "+itemI+" resolve()");
                result.resolve();
            }
            return result.promise();
        }
        function shouldNeverCall() {
            console.log("### TEST FAILED");
        }
        
        
        var masterPromise;
        
        // console.log("Testing 0-length arrays...");
        // itemsDone = [];
        // // masterPromise = doInParallel([], shouldNeverCall, true);
        // // masterPromise = doInParallel([], shouldNeverCall, false);
        // // masterPromise = doSequentially([], shouldNeverCall, true);
        // masterPromise = doSequentially([], shouldNeverCall, false);
        // masterPromise.done(function () {
        //     console.log("Pass");
        // });
        // masterPromise.fail(function () {
        //     console.log("### Fail");
        // });
        
        
        // console.log("Test passing");
        // itemsDone = [];
        // failItemI = -1;
        // // masterPromise = doInParallel(items, fakeProcess, true);
        // // masterPromise = doInParallel(items, fakeProcess, false);
        // // masterPromise = doSequentially(items, fakeProcess, true);
        // masterPromise = doSequentially(items, fakeProcess, false);
        // masterPromise.done(function () {
        //     console.log("Pass");
        // });
        // masterPromise.fail(function () {
        //     console.log("### Fail");
        // });
        
        
        // console.log("Test mid failing");
        // itemsDone = [];
        // failItemI = 2;
        // expectShortCircuit = false;
        // expectFailFast = true;
        // masterPromise = doInParallel(items, fakeProcess, true);
        // // expectShortCircuit = false;
        // // expectFailFast = false;
        // // masterPromise = doInParallel(items, fakeProcess, false);
        // // expectShortCircuit = true;
        // // expectFailFast = true;
        // // masterPromise = doSequentially(items, fakeProcess, true);
        // // expectShortCircuit = false;
        // // expectFailFast = false;
        // // masterPromise = doSequentially(items, fakeProcess, false);
        
        // masterPromise.done(function () {
        //     console.log("### Fail");
        // });
        // masterPromise.fail(function () {
        //     if (expectFailFast && itemsDone[failItemI+1])
        //         console.log("### Fail - should not have completed "+(failItemI+1)+" yet");
        //     else
        //         console.log("Pass");
        // });
        
        
        // console.log("Test sync items, mid fail");
        // itemsDone = [];
        // failItemI = 2;
        // // expectShortCircuit = false;
        // // expectFailFast = false; //see note in doInParallel
        // // masterPromise = doInParallel(items, fakeSyncProcess, true);
        // // expectShortCircuit = false;
        // // expectFailFast = false;
        // // masterPromise = doInParallel(items, fakeSyncProcess, false);
        // // expectShortCircuit = true;
        // // expectFailFast = true;
        // // masterPromise = doSequentially(items, fakeSyncProcess, true);
        // expectShortCircuit = false;
        // expectFailFast = false;
        // masterPromise = doSequentially(items, fakeSyncProcess, false);
        
        // masterPromise.done(function () {
        //     console.log("### Fail");
        // });
        // masterPromise.fail(function () {
        //     if (expectFailFast && itemsDone[failItemI+1])
        //         console.log("### Fail - should not have completed "+(failItemI+1)+" yet");
        //     else
        //         console.log("Pass");
        // });
        
        
        // console.log("Test sync items, all pass");
        // itemsDone = [];
        // failItemI = -1;
        // masterPromise = doInParallel(items, fakeSyncProcess, true);
        // // masterPromise = doInParallel(items, fakeSyncProcess, false);
        // // masterPromise = doSequentially(items, fakeSyncProcess, true);
        // // masterPromise = doSequentially(items, fakeSyncProcess, false);
        
        // masterPromise.done(function () {
        //     console.log("Pass");
        // });
        // masterPromise.fail(function () {
        //     console.log("### Fail");
        // });
        
        
        // console.log("Test error aggregation");
        // function failWithInfo(delay, itemI) {
        //     var result = new $.Deferred();
        //     setTimeout(function () {
        //         result.reject(delay);
        //     }, delay);
        //     return result.promise();
        // }
        // itemsDone = [];
        // masterPromise = doInParallel_aggregateErrors(items, failWithInfo);
        // masterPromise.done(function () {
        //     console.log("### Fail - shouldn't resolve");
        // });
        // masterPromise.fail(function (errors) {
        //     var pass = (errors.length == 4);
        //     errors.forEach(function (error) {
        //         console.log("  error result: item="+error.item+" error="+error.error);
        //         pass = pass && (error.item == error.error); 
        //     });
        //     if (pass)
        //         console.log("Pass");
        //     else
        //         console.log("### Fail - bad error info");
        // });
        
        
        console.log("Test withTimeout");
        itemsDone = [];
        // failItemI = -1;
        // masterPromise = withTimeout(fakeProcess(100, 0), 1000);
        // masterPromise.done(function () {
        //     console.log("Pass");
        // });
        // masterPromise.fail(function (cause) {
        //     console.log("### Fail");
        // });
        // failItemI = -1;
        // masterPromise = withTimeout(fakeProcess(1000, 0), 100);
        // masterPromise.done(function () {
        //     console.log("### Fail");
        // });
        // masterPromise.fail(function (cause) {
        //     if (cause === ERROR_TIMEOUT)
        //         console.log("Pass");
        //     else
        //         console.log("### Fail - wrong error arg "+cause);
        // });
        // failItemI = 0;
        // masterPromise = withTimeout(fakeProcess(1000, 0), 100);
        // masterPromise.done(function () {
        //     console.log("### Fail");
        // });
        // masterPromise.fail(function (cause) {
        //     if (cause === ERROR_TIMEOUT)
        //         console.log("Pass");
        //     else
        //         console.log("### Fail - wrong error arg "+cause);
        // });
        failItemI = 0;
        masterPromise = withTimeout(fakeProcess(100, 0), 1000);
        masterPromise.done(function () {
            console.log("### Fail");
        });
        masterPromise.fail(function (cause) {
            if (cause === failItemI)
                console.log("Pass");
            else
                console.log("### Fail - wrong error arg "+cause);
        });

        
        // console.log("Test passing, completion out of order");
        // var items = [300, 400, 100, 200]; //order: 2,3,0,1 *IF PARALLEL*
        // itemsDone = [];
        // failItemI = -1;
        // // masterPromise = doInParallel(items, fakeProcess, true);
        // masterPromise = doInParallel(items, fakeProcess, false);
        // // masterPromise = doSequentially(items, fakeProcess, true);
        // // masterPromise = doSequentially(items, fakeProcess, false);
        // masterPromise.done(function () {
        //     console.log("Pass");
        // });
        // masterPromise.fail(function () {
        //     console.log("### Fail");
        // });
        
        
        // TODO
        // console.log("Test 1st failing");
        // console.log("Test end failing");
        // - ensure parallel items all start before any begin completion
        // - ensure seq items never overlap
        // - test completion out of order
        // - test synchronous completion
    }
    

    // Define public API
    exports.doInParallel   = doInParallel;
    exports.doSequentially = doSequentially;
    exports.doInParallel_aggregateErrors = doInParallel_aggregateErrors;
    exports.withTimeout    = withTimeout;
    
    // TEMP
    exports.test = test;
});