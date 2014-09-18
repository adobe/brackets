/*
 * Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
 *  
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"), 
 * to deal in the Software without restriction, including without limitation 
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, 
 * and/or sell copies of the Software, and to permit persons to whom the 
 * Software is furnished to do so, subject to the following conditions:
 *  
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *  
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING 
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
 * DEALINGS IN THE SOFTWARE.
 * 
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, describe, beforeEach, it, runs, waitsFor, waitsForFulfillment, waitsForRejection, expect, $  */

define(function (require, exports, module) {
    "use strict";
    
    var Async = require("utils/Async"),
        PromiseQueue = Async.PromiseQueue;
    
    describe("Async", function () {
        
        describe("Chain", function () {

            function noArgThatSucceeds() {
                var d = new Promise(function (resolve, reject) {
                    setTimeout(function () {
                        resolve();
                    }, 1);
                });
                return d;
            }
            
            function noArgThatFails() {
                var d = new Promise(function (resolve, reject) {
                    setTimeout(function () {
                        reject();
                    }, 1);
                });
                return d;
            }

            function withArgThatSucceeds(arg) {
                var d = new Promise(function (resolve, reject) {
                    setTimeout(function () {
                        resolve(arg);
                    }, 1);
                });
                return d;
            }
            
            function withArgThatFails(arg) {
                var d = new Promise(function (resolve, reject) {
                    setTimeout(function () {
                        reject(arg);
                    }, 1);
                });
                return d;
            }
            
            function syncAddArrayElements(arg) {
                var sum = 0;
                arg.forEach(function (element) {
                    sum += element;
                });
                return sum;
            }
            
            function syncException() {
                var d = new Promise(function (resolve, reject) {
                    throw new Error("sync error");
                });
                return d;
            }
            
            function createArrayComparator(arrayOne) {
                return function (arrayTwo) {
                    var i, l;
                    expect(!arrayOne).toBe(!arrayTwo);
                    if (arrayOne && arrayTwo) {
                        expect(arrayOne.length).toBe(arrayTwo.length);
                        l = Math.min(arrayOne.length, arrayTwo.length);
                        for (i = 0; i < l; i++) {
                            expect(arrayOne[i]).toBe(arrayTwo[i]);
                        }
                    }
                };
            }
            
            function expectChainHelper(functions, args, shouldSucceed, responseComparator) {
                var done      = false,
                    success   = false,
                    response  = null,
                    responses = null;
                
                runs(function () {
                    var result,
                        promises = [];
                    
                    functions.forEach(function (fn) {
                        promises.push(fn(args));
                    });
                    result = Promise.all(promises);
                    
                    result.then(function () {
                        done = true;
                        success = true;
                        // on success, an array of args from all promises is returned
                        responses = arguments["0"];
                    });
                    result.catch(function () {
                        done = true;
                        success = false;
                        // on fail, only args from first failing promise is returned
                        response = arguments["0"];
                    });
                });
                
                waitsFor(function () {
                    return done;
                }, "The chain should complete", 100);
                
                runs(function () {
                    expect(success).toBe(shouldSucceed);

                    if (response) {
                        // should be single comparator for single response
                        responseComparator(response);
                    } else if (responses) {
                        // should be array of comparators for array of responses
                        responses.forEach(function (response, index) {
                            (responseComparator[index])(response);
                        });
                    }
                });
            }
            
            describe("Zero-argument deferreds", function () {
                it("[no-arg] work with a null argument array", function () {
                    expectChainHelper(
                        [noArgThatSucceeds, noArgThatSucceeds, noArgThatSucceeds],
                        null,
                        true,
                        [createArrayComparator(null), createArrayComparator(null), createArrayComparator(null)]
                    );
                });
                
                it("[no-arg] call error callback when first deferred fails", function () {
                    expectChainHelper(
                        [noArgThatFails, noArgThatSucceeds, noArgThatSucceeds],
                        null,
                        false,
                        createArrayComparator(null)
                    );
                });
                
                it("[no-arg] call error callback when middle deferred fails", function () {
                    expectChainHelper(
                        [noArgThatSucceeds, noArgThatFails, noArgThatSucceeds],
                        null,
                        false,
                        createArrayComparator(null)
                    );
                });
                
                it("[no-arg] call error callback when last deferred fails", function () {
                    expectChainHelper(
                        [noArgThatSucceeds, noArgThatSucceeds, noArgThatFails],
                        null,
                        false,
                        createArrayComparator(null)
                    );
                });
                
                it("[no-arg] call success callback when all deferreds succeed", function () {
                    expectChainHelper(
                        [noArgThatSucceeds, noArgThatSucceeds, noArgThatSucceeds],
                        null,
                        true,
                        [createArrayComparator(null), createArrayComparator(null), createArrayComparator(null)]
                    );
                });
                
                it("[no-arg] call success callback immediately if there are no deferreds", function () {
                    expectChainHelper(
                        [],
                        null,
                        true,
                        [createArrayComparator(null), createArrayComparator(null), createArrayComparator(null)]
                    );
                });
            });
            
            describe("Nonzero-argument deferreds", function () {
                it("[nonzero-arg] call error callback when first deferred fails", function () {
                    expectChainHelper(
                        [withArgThatFails, withArgThatSucceeds, withArgThatSucceeds],
                        [1, 2],
                        false,
                        createArrayComparator([1, 2])
                    );
                });
                
                it("[nonzero-arg] call error callback when middle deferred fails", function () {
                    expectChainHelper(
                        [withArgThatSucceeds, withArgThatFails, withArgThatSucceeds],
                        [1, 2],
                        false,
                        createArrayComparator([1, 2])
                    );
                });
                
                it("[nonzero-arg] call error callback when last deferred fails", function () {
                    expectChainHelper(
                        [withArgThatSucceeds, withArgThatSucceeds, withArgThatFails],
                        [1, 2],
                        false,
                        createArrayComparator([1, 2])
                    );
                });
                
                it("[nonzero-arg] call success callback when all deferreds succeed", function () {
                    expectChainHelper(
                        [withArgThatSucceeds, withArgThatSucceeds, withArgThatSucceeds],
                        [1, 2],
                        true,
                        [createArrayComparator([1, 2]), createArrayComparator([1, 2]), createArrayComparator([1, 2])]
                    );
                });
                
                it("[nonzero-arg] call success callback immediately if there are no deferreds", function () {
                    expectChainHelper(
                        [],
                        [1, 2],
                        true,
                        [createArrayComparator([1, 2]), createArrayComparator([1, 2]), createArrayComparator([1, 2])]
                    );
                });
            });
            
            
            describe("With Timeout", function () {
                function promiseThatSucceeds(duration) {
                    var d = new Promise(function (resolve, reject) {
                        setTimeout(function () {
                            resolve();
                        }, duration);
                    });
                    return d;
                }
                
                function promiseThatFails(duration) {
                    var d = new Promise(function (resolve, reject) {
                        setTimeout(function () {
                            reject();
                        }, duration);
                    });
                    return d;
                }
                
                it("should resolve promise before rejected with timeout", function () {
                    var promiseBase, promiseWrapper,
                        baseSuccess = false,
                        baseFail    = false,
                        wrapSuccess = false,
                        wrapFail    = false;
                    
                    runs(function () {
                        promiseBase = promiseThatSucceeds(5);
                        promiseBase.then(function () {
                            baseSuccess = true;
                        }, function () {
                            baseFail = true;
                        });
                        
                        promiseWrapper = Async.withTimeout(promiseBase, 10);
                        promiseWrapper.then(function () {
                            wrapSuccess = true;
                        }, function () {
                            wrapFail = true;
                        });
                        
                        waitsForFulfillment(promiseWrapper, "promise resolves before timeout", 100);
                    });
                    
                    runs(function () {
                        // base promise resolves wrapper promise timesout
                        expect(baseSuccess).toBe(true);
                        expect(baseFail).toBe(false);
                        expect(wrapSuccess).toBe(true);
                        expect(wrapFail).toBe(false);
                    });
                });
                
                it("should reject promise before resolved with timeout", function () {
                    var promiseBase, promiseWrapper,
                        baseSuccess = false,
                        baseFail    = false,
                        wrapSuccess = false,
                        wrapFail    = false;
                    
                    runs(function () {
                        promiseBase = promiseThatFails(5);
                        promiseBase.then(function () {
                            baseSuccess = true;
                        }, function () {
                            baseFail = true;
                        });
                        
                        promiseWrapper = Async.withTimeout(promiseBase, 10, true);
                        promiseWrapper.then(function () {
                            wrapSuccess = true;
                        }, function () {
                            wrapFail = true;
                        });
                        
                        waitsForRejection(promiseWrapper, "promise rejected before timeout");
                    });
                    
                    runs(function () {
                        // base promise rejects wrapper promise
                        expect(baseSuccess).toBe(false);
                        expect(baseFail).toBe(true);
                        expect(wrapSuccess).toBe(false);
                        expect(wrapFail).toBe(true);
                    });
                });
                
                it("should timeout with reject before promise resolves", function () {
                    var promiseBase, promiseWrapper,
                        baseSuccess = false,
                        baseFail    = false,
                        wrapSuccess = false,
                        wrapFail    = false;
                    
                    runs(function () {
                        promiseBase = promiseThatSucceeds(10);
                        promiseBase.then(function () {
                            baseSuccess = true;
                        }, function () {
                            baseFail = true;
                        });
                        
                        promiseWrapper = Async.withTimeout(promiseBase, 5);
                        promiseWrapper.then(function () {
                            wrapSuccess = true;
                        }, function () {
                            wrapFail = true;
                        });
                        
                        waitsForRejection(promiseWrapper, "times out before promise resolves");
                    });
                    
                    runs(function () {
                        expect(wrapSuccess).toBe(false);
                        expect(wrapFail).toBe(true);
                        waitsForFulfillment(promiseBase, "promise resolves after timeout", 100);
                    });
                    
                    runs(function () {
                        expect(baseSuccess).toBe(true);
                        expect(baseFail).toBe(false);
                    });
                });
                
                it("should timeout with resolve before promise rejected", function () {
                    var promiseBase, promiseWrapper,
                        baseSuccess = false,
                        baseFail    = false,
                        wrapSuccess = false,
                        wrapFail    = false;
                    
                    runs(function () {
                        promiseBase = promiseThatFails(10);
                        promiseBase.then(function () {
                            baseSuccess = true;
                        }, function () {
                            baseFail = true;
                        });
                        
                        promiseWrapper = Async.withTimeout(promiseBase, 5, true);
                        promiseWrapper.then(function () {
                            wrapSuccess = true;
                        }, function () {
                            wrapFail = true;
                        });
                        
                        waitsForFulfillment(promiseWrapper, "times out before promise is rejected", 100);
                    });
                    
                    runs(function () {
                        expect(wrapSuccess).toBe(true);
                        expect(wrapFail).toBe(false);
                        waitsForRejection(promiseBase, "promise is rejected after timeout");
                    });
                    
                    runs(function () {
                        expect(baseSuccess).toBe(false);
                        expect(baseFail).toBe(true);
                    });
                });
            });
            
            describe("Async/sync mix", function () {
                it("[async/sync] succeed with sync command at beginning", function () {
                    expectChainHelper(
                        [syncAddArrayElements, withArgThatSucceeds, withArgThatSucceeds],
                        [1, 2],
                        true,
                        [createArrayComparator(3), createArrayComparator([1, 2]), createArrayComparator([1, 2])]
                    );
                });
                
                it("[async/sync] succeed with sync command at middle", function () {
                    expectChainHelper(
                        [withArgThatSucceeds, syncAddArrayElements, withArgThatSucceeds],
                        [1, 2],
                        true,
                        [createArrayComparator([1, 2]), createArrayComparator(3), createArrayComparator([1, 2])]
                    );
                });
                
                it("[async/sync] succeed with sync command at end", function () {
                    expectChainHelper(
                        [withArgThatSucceeds, withArgThatSucceeds, syncAddArrayElements],
                        [1, 2],
                        true,
                        [createArrayComparator([1, 2]), createArrayComparator([1, 2]), createArrayComparator(3)]
                    );
                });
                
                it("[async/sync] call error callback if sync command fails", function () {
                    expectChainHelper(
                        [withArgThatSucceeds, syncException, withArgThatSucceeds],
                        [1, 2],
                        false,
                        function (response) {
                            expect(response instanceof Error).toBe(true);
                        }
                    );
                });
                
                // ES6 Promise shim does not execute callbacks synchronously when promise resolved or rejected synchronously
                xit("[async/sync] two sync commands in order are executed completely synchronously", function () {
                    var result = null,
                        flag = true;
                    
                    runs(function () {
                        
                        function negate(b) {
                            return !b;
                        }
                        function setFlag(b) {
                            flag = b;
                            return flag;
                        }
                        
                        var functions = [negate, setFlag],
                            promises  = [];

                        functions.forEach(function (fn) {
                            promises.push(fn(flag));
                        });
                        result = Promise.all(promises);
                        result.then(function (b) {
                            expect(b).toBe(flag);
                        });

                        // note, we WANT to test this synchronously. This is not a bug
                        // in the unit test. A series of synchronous functions should
                        // execute synchronously.
                        expect(flag).toBe(false);
                    });
                    
                    runs(function () {
                        // With (the current version) of jQuery promises, resolution and
                        // resolution handlers will get called synchronously. However, if we
                        // move to a different promise implementation (e.g. Q) then resolution
                        // handlers will get called asynchronously. So, we check completion
                        // of the promise on a separate pass.
                        waitsForFulfillment(result, "The chain to complete", 100);
                    });
                });
            });
        });
        
        describe("promisify", function () {
            var testObj = {
                someVal: 5,
                succeeder: function (input, cb) {
                    cb(null, { input: input, someVal: this.someVal });
                },
                failer: function (input, cb) {
                    cb("this is an error");
                }
            };
            
            it("should resolve its returned promise when the errback is called with null err", function () {
                Async.promisify(testObj, "succeeder", "myInput")
                    .then(function (result) {
                        expect(result.input).toBe("myInput");
                        expect(result.someVal).toBe(testObj.someVal);
                    }, function (err) {
                        expect("should not have called fail callback").toBe(false);
                    });
            });
            
            it("should reject its returned promise when the errback is called with an err", function () {
                Async.promisify(testObj, "failer", "myInput")
                    .then(function (result) {
                        expect("should not have called success callback").toBe(false);
                    }, function (err) {
                        expect(err).toBe("this is an error");
                    });
            });
        });
        
        describe("Async PromiseQueue", function () {
            var queue, calledFns;
            
            beforeEach(function () {
                queue = new PromiseQueue();
                calledFns = {};
            });

            function makeFn(id, resolveTimeout, rejectTimeout) {
                var func;
                var result = new Promise(function (resolve, reject) {
                    func = function () {
                        calledFns[id] = true;
                        if (rejectTimeout !== null) {
                            if (rejectTimeout === 0) {
                                reject();
                            } else {
                                setTimeout(function () {
                                    reject();
                                }, rejectTimeout);
                            }
                        } else if (resolveTimeout !== null) {
                            if (resolveTimeout === 0) {
                                resolve();
                            } else {
                                setTimeout(function () {
                                    resolve();
                                }, resolveTimeout);
                            }
                        }
                        return result;
                    };
                });
                return {
                    fn: func,
                    promise: result
                };
            }
            
            it("should immediately execute a function when the queue is empty", function () {
                var fnInfo;
                
                runs(function () {
                    fnInfo = makeFn("one", 5, null);
                    queue.add(fnInfo.fn);
                    expect(calledFns.one).toBe(true);
                    waitsForFulfillment(fnInfo.promise, "promise one", 100);
                });
                
                runs(function () {
                    expect(queue._queue.length).toBe(0);
                    expect(queue._curPromise).toBe(null);
                });
            });
            
            it("should wait to execute the second added function", function () {
                var fnInfo1, fnInfo2;
                
                runs(function () {
                    fnInfo1 = makeFn("one",  5, null);
                    fnInfo2 = makeFn("two", 10, null);
                    
                    queue.add(fnInfo1.fn);
                    expect(calledFns.one).toBe(true);
                    queue.add(fnInfo2.fn);
                    expect(calledFns.two).toBeUndefined();

                    waitsForFulfillment(fnInfo1.promise, "promise one", 100);
                });
                
                runs(function () {
                    expect(calledFns.two).toBe(true);
                    waitsForFulfillment(fnInfo2.promise, "promise two", 100);
                });
                
                runs(function () {
                    expect(queue._queue.length).toBe(0);
                    expect(queue._curPromise).toBe(null);
                });
            });
            
            // ES6 Promise shim does not execute callbacks synchronously when promise resolved or rejected synchronously
            xit("should properly handle the case where the first function completes synchronously", function () {
                var fnInfo1, fnInfo2;
                
                runs(function () {
                    fnInfo1 = makeFn("one", 0, null);
                    fnInfo2 = makeFn("two", 5, null);

                    queue.add(fnInfo1.fn);
                    expect(calledFns.one).toBe(true);

                    queue.add(fnInfo2.fn);
                    expect(calledFns.two).toBe(true);

                    waitsForFulfillment(fnInfo2.promise, "promise two", 100);
                });
                
                runs(function () {
                    expect(queue._queue.length).toBe(0);
                    expect(queue._curPromise).toBe(null);
                });
            });
            
            // ES6 Promise shim does not execute callbacks synchronously when promise resolved or rejected synchronously
            xit("should sequentially execute a second and third function if they're both added while the first is executing", function () {
                var fnInfo1, fnInfo2, fnInfo3;
                
                runs(function () {
                    fnInfo1 = makeFn("one",   5, null);
                    fnInfo2 = makeFn("two",   0, null);
                    fnInfo3 = makeFn("three", 0, null);

                    queue.add(fnInfo1.fn);
                    expect(calledFns.one).toBe(true);

                    queue.add(fnInfo2.fn);
                    queue.add(fnInfo3.fn);
                    expect(calledFns.two).toBeUndefined();
                    expect(calledFns.three).toBeUndefined();

                    waitsForFulfillment(fnInfo1.promise, "promise one", 100);
                });
                
                runs(function () {
                    expect(calledFns.two).toBe(true);
                    expect(calledFns.three).toBeUndefined();
                    waitsForFulfillment(fnInfo2.promise, "promise two", 100);
                });
                
                runs(function () {
                    expect(calledFns.three).toBe(true);
                    waitsForFulfillment(fnInfo3.promise, "promise three", 100);
                });
                
                runs(function () {
                    expect(queue._queue.length).toBe(0);
                    expect(queue._curPromise).toBe(null);
                });
            });
    
            // ES6 Promise shim does not execute callbacks synchronously when promise resolved or rejected synchronously
            xit("should sequentially execute a second and third function if the third is added while the second is executing", function () {
                var fnInfo1, fnInfo2, fnInfo3;
                
                runs(function () {
                    fnInfo1 = makeFn("one",   0, null);
                    fnInfo2 = makeFn("two",   5, null);
                    fnInfo3 = makeFn("three", 0, null);

                    queue.add(fnInfo1.fn);
                    expect(calledFns.one).toBe(true);

                    queue.add(fnInfo2.fn);
                    expect(calledFns.two).toBeUndefined();

                    waitsForFulfillment(fnInfo1.promise, "promise one", 100);
                });
                
                runs(function () {
                    expect(calledFns.two).toBe(true);

                    queue.add(fnInfo3.fn);
                    expect(calledFns.three).toBeUndefined();

                    waitsForFulfillment(fnInfo2.promise, "promise two", 100);
                });
                
                runs(function () {
                    expect(calledFns.three).toBe(true);
                    waitsForFulfillment(fnInfo3.promise, "promise three", 100);
                });
                
                runs(function () {
                    expect(queue._queue.length).toBe(0);
                    expect(queue._curPromise).toBe(null);
                });
            });
            
            it("should execute a second function when added to the empty queue after the first function has completed", function () {
                var fnInfo1, fnInfo2;
                
                runs(function () {
                    fnInfo1 = makeFn("one", 0, null);
                    fnInfo2 = makeFn("two", 5, null);

                    queue.add(fnInfo1.fn);
                    expect(calledFns.one).toBe(true);

                    waitsForFulfillment(fnInfo1.promise, "promise one", 100);
                });
                
                runs(function () {
                    expect(queue._queue.length).toBe(0);
                    expect(queue._curPromise).toBe(null);

                    queue.add(fnInfo2.fn);
                    expect(calledFns.two).toBe(true);

                    waitsForFulfillment(fnInfo2.promise, "promise two", 100);
                });
                
                runs(function () {
                    expect(queue._queue.length).toBe(0);
                    expect(queue._curPromise).toBe(null);
                });
            });
            
            it("should execute the second function if the first function is rejected", function () {
                var fnInfo1, fnInfo2;
                
                runs(function () {
                    fnInfo1 = makeFn("one", null, 5);
                    fnInfo2 = makeFn("two",   10, null);

                    queue.add(fnInfo1.fn);
                    expect(calledFns.one).toBe(true);

                    queue.add(fnInfo2.fn);
                    expect(calledFns.two).toBeUndefined();

                    waitsForRejection(fnInfo1.promise, "promise one", 100);
                });
                
                runs(function () {
                    expect(calledFns.two).toBe(true);
                    waitsForFulfillment(fnInfo2.promise, "promise two", 100);
                });
                
                runs(function () {
                    expect(queue._queue.length).toBe(0);
                    expect(queue._curPromise).toBe(null);
                });
            });
            
            it("should execute the third function after first and second functions are rejected", function () {
                var fnInfo1, fnInfo2, fnInfo3;
                
                runs(function () {
                    fnInfo1 = makeFn("one",  null,    5);
                    fnInfo2 = makeFn("two",  null,   10);
                    fnInfo3 = makeFn("three",  15, null);

                    queue.add(fnInfo1.fn);
                    expect(calledFns.one).toBe(true);

                    queue.add(fnInfo2.fn);
                    queue.add(fnInfo3.fn);
                    expect(calledFns.two).toBeUndefined();
                    expect(calledFns.three).toBeUndefined();

                    waitsForRejection(fnInfo1.promise, "promise one", 100);
                });
                
                runs(function () {
                    expect(calledFns.two).toBe(true);
                    waitsForRejection(fnInfo2.promise, "promise two", 100);
                });
                
                runs(function () {
                    expect(calledFns.three).toBe(true);
                    waitsForFulfillment(fnInfo3.promise, "promise three", 100);
                });
                
                runs(function () {
                    expect(queue._queue.length).toBe(0);
                    expect(queue._curPromise).toBe(null);
                });
            });
            
            // ES6 Promise shim does not execute callbacks synchronously when promise resolved or rejected synchronously
            xit("should execute the second function after the already-rejected first function is added to the queue", function () {
                var fnInfo1, fnInfo2;
                
                runs(function () {
                    fnInfo1 = makeFn("one", null,    0);
                    fnInfo2 = makeFn("two",    5, null);

                    queue.add(fnInfo1.fn);
                    expect(calledFns.one).toBe(true);

                    queue.add(fnInfo2.fn);
                    expect(calledFns.two).toBe(true);

                    waitsForFulfillment(fnInfo2.promise, "promise two", 100);
                });
                
                runs(function () {
                    expect(queue._queue.length).toBe(0);
                    expect(queue._curPromise).toBe(null);
                });
            });
            
            it("should be able to run two queues simultaneously without clashing", function () {
                var queue2, q1FnInfo1, q1FnInfo2, q2FnInfo3, q2FnInfo4;
                
                runs(function () {
                    queue2 = new PromiseQueue();
                    q1FnInfo1 = makeFn("one",    5, null);
                    q1FnInfo2 = makeFn("two",   10, null);
                    q2FnInfo3 = makeFn("three",  5, null);
                    q2FnInfo4 = makeFn("four",  10, null);

                    //queue one
                    queue.add(q1FnInfo1.fn);
                    queue.add(q1FnInfo2.fn);
                    expect(calledFns.one).toBe(true);
                    expect(calledFns.two).toBeUndefined();
                    
                    //queue one should have one in _queue,
                    //queue two should have zero in _queue
                    expect(queue._queue.length).toBe(1);
                    expect(queue2._queue.length).toBe(0);

                    //queue two
                    queue2.add(q2FnInfo3.fn);
                    queue2.add(q2FnInfo4.fn);
                    expect(calledFns.three).toBe(true);
                    expect(calledFns.four).toBeUndefined();
                    
                    //queue one and two should have one in _queue
                    expect(queue._queue.length).toBe(1);
                    expect(queue2._queue.length).toBe(1);
                    waitsForFulfillment(q1FnInfo1.promise, "promise one", 100);
                });
                
                runs(function () {
                    expect(calledFns.two).toBe(true);
                    expect(queue._queue.length).toBe(0);
                    waitsForFulfillment(q1FnInfo2.promise, "promise two", 100);
                });
                
                runs(function () {
                    expect(queue._queue.length).toBe(0);
                    expect(queue._curPromise).toBe(null);
                    waitsForFulfillment(q2FnInfo3.promise, "promise three", 100);
                });
                
                runs(function () {
                    expect(calledFns.three).toBe(true);
                    expect(queue2._queue.length).toBe(0);
                    waitsForFulfillment(q2FnInfo4.promise, "promise four", 100);
                });
                
                runs(function () {
                    expect(queue2._queue.length).toBe(0);
                    expect(queue2._curPromise).toBe(null);
                });
            });
        });
    });
});
