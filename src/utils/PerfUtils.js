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
/*global define, brackets */

/**
 * This is a collection of utility functions for gathering performance data.
 */
define(function (require, exports, module) {
    'use strict';
    
    /**
     * Peformance data is stored in this hash object. The key is the name of the
     * test (passed to markStart/addMeasurement), and the value is the time, in 
     * milliseconds, that it took to run the test. If multiple runs of the same test
     * are made, the value is an Array with each run stored as an entry in the Array.
     */
    var perfData = {};
    
    /**
     * Active tests. This is a hash of all tests that have had markStart() called,
     * but have not yet had addMeasurement() called.
     */
    var activeTests = {};
    
    /**
     * Start a new named timer. The name should be as descriptive as possible, since
     * this name will appear as an entry in the performance report. 
     * For example: "Open file: /Users/brackets/src/ProjectManager.js"
     *
     * Multiple timers can be opened simultaneously, but all open timers must have
     * a unique name. 
     */
    function markStart(name) {
        if (activeTests[name]) {
            console.log("Recursive tests with the same name are not supported.");
            return;
        }
        
        activeTests[name] = {
            startTime: brackets.app.getElapsedMilliseconds()
        };
    }
    
    /**
     * Stop a timer and add its measurements to the performance data.
     *
     * Multiple measurements can be stored for any given name. If there are
     * multiple values for a name, they are stored in an Array.
     *
     * If the markStart() was not called for the specified timer, the
     * measured time is relative to app startup.
     */
    function addMeasurement(name) {
        var elapsedTime = brackets.app.getElapsedMilliseconds();
        
        if (activeTests[name]) {
            elapsedTime -= activeTests[name].startTime;
            delete activeTests[name];
        }
        
        if (perfData[name]) {
            // We have existing data, add to it
            if (Array.isArray(perfData[name])) {
                perfData[name].push(elapsedTime);
            } else {
                // Current data is a number, convert to Array
                perfData[name] = [perfData[name], elapsedTime];
            }
        } else {
            perfData[name] = elapsedTime;
        }
    }
    
    exports.markStart       = markStart;
    exports.addMeasurement  = addMeasurement;
    exports.perfData        = perfData;
});