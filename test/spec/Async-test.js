/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, require, describe, it, expect, beforeEach, afterEach, waitsFor, runs, $ */
define(function (require, exports, module) {
    'use strict';
    
    // Load dependent modules
    var Async = require("Async");
    
    
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
            
            setTimeout(function () {
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
        masterPromise = Async.withTimeout(fakeProcess(100, 0), 1000);
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

    describe("Async", function () {

        describe("...TODO...", function () {     // test group (e.g. Open File)
            it("should ...TODO...", function () {    // individual testcase
                runs(function () {
                    // skip rename
                    ProjectManager.createNewItem(testPath, "Untitled.js", true)
                        .done(function () { didCreate = true; })
                        .fail(function () { gotError = true; });
                });
                waitsFor(function () { return didCreate && !gotError; }, "ProjectManager.createNewItem() timeout", 1000);

                runs(function () {
                    expect(gotError).toBeTruthy();
                    expect(didCreate).toBeFalsy();
                });
            });

        });

    });
});
