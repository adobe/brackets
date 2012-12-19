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
/*global define: false, require: false, describe: false, it: false, expect: false, beforeEach: false, afterEach: false, waitsFor: false, runs: false */
/*unittests: QuickOpen */

define(function (require, exports, module) {
    'use strict';
    
    var QuickOpen = require("search/QuickOpen");
    
    describe("QuickOpen", function () {
        describe("stringMatch", function () {
            var stringMatch = QuickOpen.stringMatch;
            
            it("should return appropriate matching ranges", function () {
                var result;
                expect(stringMatch("foo/bar/baz.js", "bingo")).toBeUndefined();
                result = stringMatch("foo/bar/baz.js", "fbb.js");
                expect(result).not.toBeUndefined();
                expect(result.matchGoodness).toBeLessThan(-100);
                var ranges = result.stringRanges;
                expect(ranges.length).toBe(7);
                
                // verify the important bit of the ranges
                var range = ranges.shift();
                expect(range.text).toBe("f");
                expect(range.matched).toBe(true);
                
                range = ranges.shift();
                expect(range.text).toBe("oo/");
                expect(range.matched).toBe(false);
                
                range = ranges.shift();
                expect(range.text).toBe("b");
                expect(range.matched).toBe(true);
            });
        });
    });
});
