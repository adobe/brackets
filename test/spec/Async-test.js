/*
 * Copyright (c) 2012 Adobe Systems Incorporated. All rights reserved.
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
/*global define, describe, beforeEach, afterEach, it, runs, waits, waitsFor, expect, $  */

define(function (require, exports, module) {
    "use strict";
    
    var Async = require("utils/Async");
    
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
                    Async.chain(
                        functions,
                        args,
                        function () {
                            done = true;
                            success = true;
                            response = Array.prototype.slice.call(arguments, 0);
                        },
                        function () {
                            done = true;
                            success = false;
                            response = Array.prototype.slice.call(arguments, 0);
                        }
                    );
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
                
            });
                        
        });
        
    });
    
});