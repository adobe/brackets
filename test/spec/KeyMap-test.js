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
/*global define: false, describe: false, beforeEach: false, afterEach: false, it: false, runs: false, waitsFor: false, expect: false, brackets: false */

define(function (require, exports, module) {
    'use strict';
    
    // Load dependent modules
    var KeyMap = require("command/KeyMap");
    
    describe("KeyMap", function () {

        beforeEach(function () {
        });

        afterEach(function () {
        });
        
        it("should normalize keyboard modifiers", function () {
            var testKeyMap = KeyMap.create({
                "bindings": [
                    {"Ctrl-Alt-Shift-Q": "test.correct_order"},
                    {"Shift-Ctrl-Alt-W": "test.reversed_order"},
                    {"Ctrl-Shift-Alt-E": "test.mixed_order"}
                ]
            });
            var expectedKeyMap = KeyMap.create({
                "bindings": [
                    {"Ctrl-Alt-Shift-Q": "test.correct_order"},
                    {"Ctrl-Alt-Shift-W": "test.reversed_order"},
                    {"Ctrl-Alt-Shift-E": "test.mixed_order"}
                ]
            });
            expect(testKeyMap).toEqual(expectedKeyMap);
        });
        
        it("should filter base on platform", function () {
            var testKeyMap = KeyMap.create({
                "bindings": [
                    {"Ctrl-B": "test.both"},
                    {"Ctrl-M": "test.mac", "platform": "mac"},
                    {"Ctrl-W": "test.win", "platform": "win"}
                ],
                "platform": "mac"
            });
            var expectedKeyMap = KeyMap.create({
                "bindings": [
                    {"Ctrl-B": "test.both"},
                    {"Ctrl-M": "test.mac"}
                ]
            });
            expect(testKeyMap).toEqual(expectedKeyMap);
        });
        
    });
});
