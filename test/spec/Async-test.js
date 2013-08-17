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
/*global define, describe, beforeEach, afterEach, it, runs, waits, waitsForDone, expect, $  */

define(function (require, exports, module) {
    "use strict";
    
    var PromiseQueue = require("utils/Async").PromiseQueue;
    
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
});