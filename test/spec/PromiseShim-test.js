/*
 * Copyright (c) 2014 Adobe Systems Incorporated. All rights reserved.
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
 */

/*jslint vars: true, plusplus: true, devel: true, browser: false, nomen: true, indent: 4, maxerr: 50 */
/*global define, describe, it, runs, waits, waitsFor, waitsForDone, waitsForFail, waitsForFulfillment, waitsForRejection, expect, Promise  */

define(function (require, exports, module) {
    "use strict";
    
    describe("Promise Shim", function () {
        
        function promiseThatSucceeds(args) {
            var d = new Promise(function (resolve, reject) {
                setTimeout(function () {
                    resolve(args);
                }, 1);
            });
            return d;
        }

        function promiseThatFails(args) {
            var d = new Promise(function (resolve, reject) {
                setTimeout(function () {
                    reject(args);
                }, 1);
            });
            return d;
        }

        function promiseThatSucceedsImmediately(args) {
            var d = new Promise(function (resolve, reject) {
                resolve(args);
            });
            return d;
        }

        function promiseThatFailsImmediately(args) {
            var d = new Promise(function (resolve, reject) {
                reject(args);
            });
            return d;
        }

        describe("ES6 style promises", function () {

            it("should resolve with no args", function () {
                var promise,
                    success = false,
                    fail    = false;
                
                runs(function () {
                    promise = promiseThatSucceeds();
                    promise.then(function () {
                        success = true;
                    }, function () {
                        fail = true;
                    });
                    
                    waitsForFulfillment(promise, "resolve with no args");
                });
                
                runs(function () {
                    expect(success).toBe(true);
                    expect(fail).toBe(false);
                });
            });
            
            it("should fail with no args", function () {
                var promise,
                    success = false,
                    fail    = false;
                
                runs(function () {
                    promise = promiseThatFails();
                    promise.then(function () {
                        success = true;
                    }, function () {
                        fail = true;
                    });
                    
                    waitsForRejection(promise, "fail with no args");
                });
                
                runs(function () {
                    expect(success).toBe(false);
                    expect(fail).toBe(true);
                });
            });
            
            it("should resolve with args", function () {
                var promise, arg,
                    success = false,
                    fail    = false;
                
                runs(function () {
                    promise = promiseThatSucceeds("success");
                    promise.then(function (result) {
                        success = true;
                        arg = result;
                    }, function (err) {
                        fail = true;
                        arg = err;
                    });
                    
                    waitsForFulfillment(promise, "resolve with args");
                });
                
                runs(function () {
                    expect(success).toBe(true);
                    expect(fail).toBe(false);
                    expect(arg).toBe("success");
                });
            });
            
            it("should fail with args", function () {
                var promise, arg,
                    success = false,
                    fail    = false;
                
                runs(function () {
                    promise = promiseThatFails("fail");
                    promise.then(function (result) {
                        success = true;
                        arg = result;
                    }, function (err) {
                        fail = true;
                        arg = err;
                    });
                    
                    waitsForRejection(promise, "fail with args");
                });
                
                runs(function () {
                    expect(success).toBe(false);
                    expect(fail).toBe(true);
                    expect(arg).toBe("fail");
                });
            });
            
            it("should resolve immediately", function () {
                var promise,
                    success = false,
                    fail    = false;
                
                runs(function () {
                    promise = promiseThatSucceedsImmediately();
                    promise.then(function () {
                        success = true;
                    }, function () {
                        fail = true;
                    });
                    
                    waitsForFulfillment(promise, "resolve with no args");
                });
                
                runs(function () {
                    expect(success).toBe(true);
                    expect(fail).toBe(false);
                });
            });
            
            it("should fail immediately", function () {
                var promise,
                    success = false,
                    fail    = false;
                
                runs(function () {
                    promise = promiseThatFailsImmediately();
                    promise.then(function () {
                        success = true;
                    }, function () {
                        fail = true;
                    });
                    
                    waitsForRejection(promise, "fail with no args");
                });
                
                runs(function () {
                    expect(success).toBe(false);
                    expect(fail).toBe(true);
                });
            });
            
            it("should catch exception", function () {
                var promise,
                    caughtException = false;
                
                runs(function () {
                    promise = new Promise(function (resolve, reject) {
                        throw "InvalidSomething";
                    });
                    
                    // `catch` is a reserved word in IE<9, meaning `promise.catch(func)` throws a syntax error,
                    // so use this form instead. Also, jslint shows an error for this.
                    promise["catch"](function () {
                        caughtException = true;
                    });
                    
                    waitsForRejection(promise, "throws exception");
                });
                
                runs(function () {
                    expect(caughtException).toBe(true);
                });
            });
            
            it("should catch exception as fail", function () {
                var promise,
                    success = false,
                    fail    = false;
                
                runs(function () {
                    promise = new Promise(function (resolve, reject) {
                        throw "InvalidSomething";
                    });
                    promise.then(function () {
                        success = true;
                    }, function () {
                        fail = true;
                    });
                    
                    waitsForRejection(promise, "throws exception");
                });
                
                runs(function () {
                    expect(success).toBe(false);
                    expect(fail).toBe(true);
                });
            });
        });
        
        describe("jQuery style promises (deprecated)", function () {
            
            it("should support jQuery Deferred promise done() & always() methods", function () {
                var promise,
                    success = false,
                    fail    = false,
                    always  = false;
                
                runs(function () {
                    promise = promiseThatSucceeds();
                    promise
                        .done(function () {
                            success = true;
                        })
                        .fail(function () {
                            // handlers should be executed in order added
                            expect(always).toBe(false);
                            fail = true;
                        })
                        .always(function () {
                            // handlers should be executed in order added
                            expect(success).toBe(true);
                            always = true;
                        });
                    
                    waitsForFulfillment(promise, "resolve with no args");
                });
                
                runs(function () {
                    expect(success).toBe(true);
                    expect(fail).toBe(false);
                    expect(always).toBe(true);
                });
            });
            
            it("should support jQuery Deferred promise fail() & always() methods", function () {
                var promise,
                    success = false,
                    fail    = false,
                    always  = false;
                
                runs(function () {
                    promise = promiseThatFails();
                    promise
                        .done(function () {
                            // handlers should be executed in order added
                            expect(always).toBe(false);
                            success = true;
                        })
                        .fail(function () {
                            fail = true;
                        })
                        .always(function () {
                            // handlers should be executed in order added
                            expect(fail).toBe(true);
                            always = true;
                        });
                    
                    waitsForRejection(promise, "fail with no args");
                });
                
                runs(function () {
                    expect(success).toBe(false);
                    expect(fail).toBe(true);
                    expect(always).toBe(true);
                });
            });
        });
    });
});
