/*
 * Copyright 2012 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, describe: false, beforeEach: false, afterEach: false, it: false, runs: false, waitsFor: false, expect: false, brackets: false */

define(function (require, exports, module) {
    'use strict';
    
    // Load dependent modules
    var KeyMap = require("KeyMap");
    
    describe("KeyMap", function () {

        beforeEach(function () {
        });

        afterEach(function () {
        });
        
        it("should normalize keyboard modifiers", function () {
            var testKeyMap = KeyMap.create({
                "Ctrl-Alt-Shift-Q": "test.correct_order",
                "Shift-Ctrl-Alt-W": "test.reversed_order",
                "Ctrl-Shift-Alt-E": "test.mixed_order"
            });
            var expectedKeyMap = KeyMap.create({
                "Ctrl-Alt-Shift-Q": "test.correct_order",
                "Ctrl-Alt-Shift-W": "test.reversed_order",
                "Ctrl-Alt-Shift-E": "test.mixed_order"
            });
            expect(testKeyMap).toEqual(expectedKeyMap);
        });
        
    });
});
