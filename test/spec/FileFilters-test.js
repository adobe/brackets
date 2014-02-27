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

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, describe, it, expect, beforeFirst, afterLast, beforeEach, afterEach, waitsForDone, runs */
/*unittests: FileFilters*/

define(function (require, exports, module) {
    'use strict';
    
    var FileFilters           = require("search/FileFilters");

    describe("FileFilters", function () {
        
        describe("'Compiling' user filters", function () {
            it("should add ** prefix & suffix", function () {
                expect(FileFilters.compile(["node_modules"])).toEqual(["**node_modules**"]);
                expect(FileFilters.compile(["/node_modules/"])).toEqual(["**/node_modules/**"]);
                expect(FileFilters.compile(["node_*"])).toEqual(["**node_***"]);
                expect(FileFilters.compile(["node_?"])).toEqual(["**node_?**"]);
                expect(FileFilters.compile(["*-test-files/"])).toEqual(["***-test-files/**"]);
                expect(FileFilters.compile(["LiveDevelopment/**/Inspector"])).toEqual(["**LiveDevelopment/**/Inspector**"]);
            });

            it("shouldn't add ** suffix", function () {
                expect(FileFilters.compile(["README.md"])).toEqual(["**README.md"]);
                expect(FileFilters.compile(["/README.md"])).toEqual(["**/README.md"]);
                expect(FileFilters.compile(["*.ttf"])).toEqual(["***.ttf"]);
                expect(FileFilters.compile(["*.cf?"])).toEqual(["***.cf?"]);
                expect(FileFilters.compile(["/jquery*.js"])).toEqual(["**/jquery*.js"]);
                expect(FileFilters.compile(["/jquery-1.?.js"])).toEqual(["**/jquery-1.?.js"]);
                expect(FileFilters.compile(["thirdparty/**/jquery*.js"])).toEqual(["**thirdparty/**/jquery*.js"]);
            });
            
            it("shouldn't add extra ** prefix", function () {
                expect(FileFilters.compile(["**node_modules"])).toEqual(["**node_modules**"]);
                expect(FileFilters.compile(["**/node_modules/**"])).toEqual(["**/node_modules/**"]);
                expect(FileFilters.compile(["**README.md"])).toEqual(["**README.md"]);
            });
        });
        
        describe("Updating MRU list", function () {
            
            // TODO: call FileFilters.editFilter() / FileFilters.commitPicker(),
            //       then check that FileFilters.getFilters() has updated accordingly
            
        });
        
        describe("Find in Files filtering", function () {
            
            // TODO: open FindInFiles search bar, pick item from dropdown, run search - make sure filter was applied
            // (some of the utilities in FindReplace-test may be useful here)
            
        });
        
    });
    
});
