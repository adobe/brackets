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
/*global define, describe, beforeEach, afterEach, it, runs, waits, waitsFor, waitsForDone, expect, $, jasmine  */

define(function (require, exports, module) {
    "use strict";
    
    var Async = require("utils/Async"),
        PromiseQueue = Async.PromiseQueue;
    
    describe("Async", function () {
        
        describe("Chain", function () {

            function zeroArgThatSucceeds() {
                var d = $.Deferred();
                setTimeout(function () {
                    d.resolve();
                }, 1);
                return d.promise();
            }
            
            function zeroArgThatFails() {
                var d = $.Deferred();
                setTimeout(function () {
                    d.reject();
                }, 1);
                return d.promise();
            }

            function oneArgThatSucceeds(x) {
                var d = $.Deferred();
                setTimeout(function () {
                    d.resolveWith(null, [x]);
                }, 1);
                return d.promise();
            }

            function twoArgThatSucceeds(x, y) {
                var d = $.Deferred();
                setTimeout(function () {
                    d.resolveWith(null, [x, y]);
                }, 1);
                return d.promise();
            }
            
            function twoArgThatFails(x, y) {
                var d = $.Deferred();
                setTimeout(function () {
                    d.rejectWith(null, [x, y]);
                }, 1);
                return d.promise();
            }
            
            function syncAddTwoArg(x, y) {
                return x + y;
            }
            
            function syncException() {
                throw new Error("sync error");
            }
            
            function createArrayComparator(arrayOne) {
                return function (arrayTwo) {
                    var i, l;
                    expect(arrayOne.length).toBe(arrayTwo.length);
                    l = Math.min(arrayOne.length, arrayTwo.length);
                    for (i = 0; i < l; i++) {
                        expect(arrayOne[i]).toBe(arrayTwo[i]);
                    }
                };
            }
            
            function expectChainHelper(functions, args, shouldSucceed, responseComparator) {
                var done = false;
                var success = false;
                var response = null;
                runs(function () {
                    var result = Async.chain(
                        functions,
                        args
                    );
                    result.done(function () {
                        done = true;
                        success = true;
                        response = arguments;
                    });
                    result.fail(function () {
                        done = true;
                        success = false;
                        response = arguments;
                    });
                });
                waitsFor(function () {
                    return done;
                }, "The chain should complete", 100);
                runs(function () {
                    expect(success).toBe(shouldSucceed);
                    responseComparator(response);
                });
            }
            
            describe("Zero-argument deferreds", function () {
                it("[zero-arg] work with a null argument array", function () {
                    expectChainHelper(
                        [zeroArgThatSucceeds, zeroArgThatSucceeds, zeroArgThatSucceeds],
                        null,
                        true,
                        createArrayComparator([])
                    );
                });
                
                it("[zero-arg] call error callback when first deferred fails", function () {
                    expectChainHelper(
                        [zeroArgThatFails, zeroArgThatSucceeds, zeroArgThatSucceeds],
                        [],
                        false,
                        createArrayComparator([])
                    );
                });
                
                it("[zero-arg] call error callback when middle deferred fails", function () {
                    expectChainHelper(
                        [zeroArgThatSucceeds, zeroArgThatFails, zeroArgThatSucceeds],
                        [],
                        false,
                        createArrayComparator([])
                    );
                });
                
                it("[zero-arg] call error callback when last deferred fails", function () {
                    expectChainHelper(
                        [zeroArgThatSucceeds, zeroArgThatSucceeds, zeroArgThatFails],
                        [],
                        false,
                        createArrayComparator([])
                    );
                });
                
                it("[zero-arg] call success callback when all deferreds succeed", function () {
                    expectChainHelper(
                        [zeroArgThatSucceeds, zeroArgThatSucceeds, zeroArgThatSucceeds],
                        [],
                        true,
                        createArrayComparator([])
                    );
                });
                
                it("[zero-arg] call success callback immediately if there are no deferreds", function () {
                    expectChainHelper(
                        [],
                        [],
                        true,
                        createArrayComparator([])
                    );
                });
            });
            
            describe("Nonzero-argument deferreds", function () {
                it("[nonzero-arg] call error callback when first deferred fails", function () {
                    expectChainHelper(
                        [twoArgThatFails, twoArgThatSucceeds, twoArgThatSucceeds],
                        [1, 2],
                        false,
                        createArrayComparator([1, 2])
                    );
                });
                
                it("[nonzero-arg] call error callback when middle deferred fails", function () {
                    expectChainHelper(
                        [twoArgThatSucceeds, twoArgThatFails, twoArgThatSucceeds],
                        [1, 2],
                        false,
                        createArrayComparator([1, 2])
                    );
                });
                
                it("[nonzero-arg] call error callback when last deferred fails", function () {
                    expectChainHelper(
                        [twoArgThatSucceeds, twoArgThatSucceeds, twoArgThatFails],
                        [1, 2],
                        false,
                        createArrayComparator([1, 2])
                    );
                });
                
                it("[nonzero-arg] call success callback when all deferreds succeed", function () {
                    expectChainHelper(
                        [twoArgThatSucceeds, twoArgThatSucceeds, twoArgThatSucceeds],
                        [1, 2],
                        true,
                        createArrayComparator([1, 2])
                    );
                });
                
                it("[nonzero-arg] call success callback immediately if there are no deferreds", function () {
                    expectChainHelper(
                        [],
                        [1, 2],
                        true,
                        createArrayComparator([1, 2])
                    );
                });
            });
            
            
            describe("Async/sync mix", function () {
                it("[async/sync] succeed with sync command at beginning", function () {
                    expectChainHelper(
                        [syncAddTwoArg, oneArgThatSucceeds, oneArgThatSucceeds],
                        [1, 2],
                        true,
                        createArrayComparator([3])
                    );
                });
                
                it("[async/sync] succeed with sync command at middle", function () {
                    expectChainHelper(
                        [twoArgThatSucceeds, syncAddTwoArg, oneArgThatSucceeds],
                        [1, 2],
                        true,
                        createArrayComparator([3])
                    );
                });

                it("[async/sync] succeed with sync command at end", function () {
                    expectChainHelper(
                        [twoArgThatSucceeds, twoArgThatSucceeds, syncAddTwoArg],
                        [1, 2],
                        true,
                        createArrayComparator([3])
                    );
                });
                
                it("[async/sync] call error callback if sync command fails", function () {
                    expectChainHelper(
                        [twoArgThatSucceeds, syncException, twoArgThatSucceeds],
                        [1, 2],
                        false,
                        function (response) {
                            expect(response.length).toBe(1);
                            expect(response[0] instanceof Error).toBe(true);
                        }
                    );
                });
                
                it("[async/sync] two sync commands in order are executed completely synchronously", function () {
                    var promise = null,
                        flag = true;

                    runs(function () {
                    
                        function negate(b) {
                            return !b;
                        }
                        function setFlag(b) {
                            flag = b;
                            return flag;
                        }
                    
                        promise = Async.chain([negate, setFlag], [flag]);
                        promise.done(function (b) {
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
                        waitsForDone(promise, "The chain to complete");
                    });
                });
                
            });
                        
        });
        
        
        describe("Async PromiseQueue", function () {
            var queue, calledFns;
            
            beforeEach(function () {
                queue = new PromiseQueue();
                calledFns = {};
            });
            
            function makeFn(id, resolveNow) {
                var result = new $.Deferred();
                return {
                    fn: function () {
                        calledFns[id] = true;
                        if (resolveNow) {
                            result.resolve();
                        }
                        return result.promise();
                    },
                    deferred: result
                };
            }
            
            it("should immediately execute a function when the queue is empty", function () {
                var fnInfo = makeFn("one");
                
                queue.add(fnInfo.fn);
                expect(calledFns.one).toBe(true);
                
                fnInfo.deferred.resolve();
                expect(queue._queue.length).toBe(0);
                expect(queue._curPromise).toBe(null);
            });
            
            it("should wait to execute the second added function", function () {
                var fnInfo1 = makeFn("one"),
                    fnInfo2 = makeFn("two");
                
                queue.add(fnInfo1.fn);
                expect(calledFns.one).toBe(true);
                
                queue.add(fnInfo2.fn);
                expect(calledFns.two).toBeUndefined();
                
                fnInfo1.deferred.resolve();
                expect(calledFns.two).toBe(true);
                
                fnInfo2.deferred.resolve();
                expect(queue._queue.length).toBe(0);
                expect(queue._curPromise).toBe(null);
            });
            
            it("should properly handle the case where the first function completes synchronously", function () {
                var fnInfo1 = makeFn("one", true),
                    fnInfo2 = makeFn("two");
                
                queue.add(fnInfo1.fn);
                expect(calledFns.one).toBe(true);
                
                queue.add(fnInfo2.fn);
                expect(calledFns.two).toBe(true);
                
                fnInfo2.deferred.resolve();
                expect(queue._queue.length).toBe(0);
                expect(queue._curPromise).toBe(null);
            });
            
            it("should sequentially execute a second and third function if they're both added while the first is executing", function () {
                var fnInfo1 = makeFn("one"),
                    fnInfo2 = makeFn("two"),
                    fnInfo3 = makeFn("three");
                
                queue.add(fnInfo1.fn);
                expect(calledFns.one).toBe(true);
                
                queue.add(fnInfo2.fn);
                queue.add(fnInfo3.fn);
                expect(calledFns.two).toBeUndefined();
                expect(calledFns.three).toBeUndefined();
                
                fnInfo1.deferred.resolve();
                expect(calledFns.two).toBe(true);
                expect(calledFns.three).toBeUndefined();
                
                fnInfo2.deferred.resolve();
                expect(calledFns.three).toBe(true);
                
                fnInfo3.deferred.resolve();
                expect(queue._queue.length).toBe(0);
                expect(queue._curPromise).toBe(null);
            });
    
            it("should sequentially execute a second and third function if the third is added while the second is executing", function () {
                var fnInfo1 = makeFn("one"),
                    fnInfo2 = makeFn("two"),
                    fnInfo3 = makeFn("three");
                
                queue.add(fnInfo1.fn);
                expect(calledFns.one).toBe(true);
                
                queue.add(fnInfo2.fn);
                expect(calledFns.two).toBeUndefined();
    
                fnInfo1.deferred.resolve();
                expect(calledFns.two).toBe(true);
    
                queue.add(fnInfo3.fn);
                expect(calledFns.three).toBeUndefined();
                
                fnInfo2.deferred.resolve();
                expect(calledFns.three).toBe(true);
                
                fnInfo3.deferred.resolve();
                expect(queue._queue.length).toBe(0);
                expect(queue._curPromise).toBe(null);
            });
            
            it("should execute a second function when added to the empty queue after the first function has completed", function () {
                var fnInfo1 = makeFn("one"),
                    fnInfo2 = makeFn("two");
                
                queue.add(fnInfo1.fn);
                expect(calledFns.one).toBe(true);
                
                fnInfo1.deferred.resolve();
                expect(queue._queue.length).toBe(0);
                expect(queue._curPromise).toBe(null);
                
                queue.add(fnInfo2.fn);
                expect(calledFns.two).toBe(true);
    
                fnInfo2.deferred.resolve();
                expect(queue._queue.length).toBe(0);
                expect(queue._curPromise).toBe(null);
            });
        });
        
        
        describe("whenIdle()", function () {
            var spy, handler;
            beforeEach(function () {
                spy = jasmine.createSpy();
                handler = Async.whenIdle(100, spy);
            });
            
            function ping(expectedCallCount) {
                runs(function () {
                    expect(spy.callCount).toBe(expectedCallCount);
                    handler();
                    expect(spy.callCount).toBe(expectedCallCount);
                });
            }
            
            it("should execute at end of tight sequence", function () {
                ping(0);
                waits(10);
                ping(0);
                waits(10);
                ping(0);
                waits(10);
                
                waits(100);
                runs(function () {
                    expect(spy.callCount).toBe(1);
                });
            });
            
            it("should execute during gap and at end of sequence", function () {
                ping(0);
                waits(10);
                ping(0);
                waits(10);
                
                waits(100);
                runs(function () {
                    expect(spy.callCount).toBe(1);
                });
                
                ping(1);
                waits(10);
                runs(function () {
                    expect(spy.callCount).toBe(1);
                });
                
                waits(100);
                runs(function () {
                    expect(spy.callCount).toBe(2);
                });
            });
        });
        
    });
});