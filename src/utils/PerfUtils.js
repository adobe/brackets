/*
 * Copyright 2012 Adobe Systems Incorporated. All Rights Reserved.
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