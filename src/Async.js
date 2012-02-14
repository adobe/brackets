/*
 * Copyright 2012 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $ */

/**
 * Utilities for working with Deferred, Promise, and other asynchronous processes.
 */
define(function (require, exports, module) {
    'use strict';
    
    // TODO: add utilities for blocking UI until a Promise completes?
    
    // TODO: another architectural issue with Deferred/Promise is the inability to do anything
    // akin to a 'finally' block. It'd be nice if we could harvest exceptions across all steps of
    // an async process and pipe them to a handler, so that we don't leave UI-blocking overlays up
    // forever, etc.
    
    // The closest analogue to these utils I can find is the Node.JS implementation of Promise/Deferred, which
    // offers utilities called all() and seq(). But they do not distinguish resolve() from reject(), and require
    // more work to use (e.g. seq() takes an array of functions rather than an array plus a function).
    //  - https://github.com/kriszyp/node-promise  (via http://www.hermanradtke.com/blog/managing-multiple-jquery-promises/)
    
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
                });
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
        
        var parallelResult = doInParallel(
            items,
            function (item, i) {
                var itemResult = beginProcessItem(item, i);
                itemResult.fail(function (error) {
                    errors.push({ item: item, error: error });
                });
                return itemResult;
            },
            false
        );
        
        parallelResult
            .done(function () {
                masterPromise.resolve();
            })
            .fail(function () {
                masterPromise.reject(errors);
            });
        
        return masterPromise.promise();
    }
    
    
    /** Value passed to fail() handlers that have been triggered due to withTimeout()'s timeout */
    var ERROR_TIMEOUT = {};
    
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
        
        // If the wrapper was already rejected due to timeout, the Promise's calls to resolve/reject
        // won't do anything
        promise.pipe(wrapper.resolve, wrapper.reject);
        
        return wrapper.promise();
    }
    
    

    // Define public API
    exports.doInParallel   = doInParallel;
    exports.doSequentially = doSequentially;
    exports.doInParallel_aggregateErrors = doInParallel_aggregateErrors;
    exports.withTimeout    = withTimeout;
    exports.ERROR_TIMEOUT  = ERROR_TIMEOUT;
});