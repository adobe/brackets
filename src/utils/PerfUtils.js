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

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, brackets, $, window */

/**
 * This is a collection of utility functions for gathering performance data.
 */
define(function (require, exports, module) {
    "use strict";
    
    var Global = require("utils/Global");

    /**
     * Flag to enable/disable performance data gathering. Default is true (enabled)
     * @type {boolean} enabled
     */
    var enabled = brackets && !!brackets.app.getElapsedMilliseconds;
    
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
     * Updatable tests. This is a hash of all tests that have had markStart() called,
     * and have had updateMeasurement() called. Caller must explicitly remove tests
     * from this list using finalizeMeasurement()
     */
    var updatableTests = {};
    
    /**
     * Hash of measurement IDs
     */
    var perfMeasurementIds = {};
    
    /**
     * @private
     * A unique key to log performance data
     *
     * @param {!string} id Unique ID for this measurement name
     * @param {!name} name A short name for this measurement
     */
    function PerfMeasurement(id, name) {
        this.id = id;
        this.name = name;
    }
    
    /**
     * Create a new PerfMeasurement key. Adds itself to the module export.
     * Can be accessed on the module, e.g. PerfUtils.MY_PERF_KEY.
     *
     * @param {!string} id Unique ID for this measurement name
     * @param {!name} name A short name for this measurement
     */
    function createPerfMeasurement(id, name) {
        if (perfMeasurementIds[id]) {
            console.error("Performance measurement " + id + " is already defined");
        }
        
        var pm = new PerfMeasurement(id, name);
        exports[id] = pm;
        
        return pm;
    }
    
    /**
     * @private
     * Convert a PerfMeasurement instance to it's id. Otherwise uses the string name for backwards compatibility.
     */
    function toMeasurementId(o) {
        return (o instanceof PerfMeasurement) ? o.id : o;
    }
    
    /**
     * @private
     * Helper function for markStart()
     *
     * @param {string} name  Timer name.
     * @param {number} time  Timer start time.
     */
    function _markStart(name, time) {
        if (activeTests[name]) {
            console.error("Recursive tests with the same name are not supported. Timer name: " + name);
        }
        
        activeTests[name] = { startTime: time };
    }
    
    /**
     * Start a new named timer. The name should be as descriptive as possible, since
     * this name will appear as an entry in the performance report. 
     * For example: "Open file: /Users/brackets/src/ProjectManager.js"
     *
     * Multiple timers can be opened simultaneously, but all open timers must have
     * a unique name.
     *
     * @param {(string|Array.<string>)} name  Single name or an Array of names.
     * @returns {string} timer name. Returned for convenience to store and use
     *      for calling addMeasure(). Since name is often creating via concatenating
     *      strings this return value allows clients to construct the name once.
     */
    function markStart(name) {
        if (!enabled) {
            return;
        }

        var time = brackets.app.getElapsedMilliseconds();
        name = toMeasurementId(name);

        // Array of names can be passed in to have multiple timers with same start time
        if (Array.isArray(name)) {
            var i;
            for (i = 0; i < name.length; i++) {
                _markStart(name[i], time);
            }
        } else {
            _markStart(name, time);
        }

        return name;
    }
    
    /**
     * Stop a timer and add its measurements to the performance data.
     *
     * Multiple measurements can be stored for any given name. If there are
     * multiple values for a name, they are stored in an Array.
     *
     * If markStart() was not called for the specified timer, the
     * measured time is relative to app startup.
     *
     * @param {string} name  Timer name.
     */
    function addMeasurement(name) {
        if (!enabled) {
            return;
        }

        var elapsedTime = brackets.app.getElapsedMilliseconds();
        name = toMeasurementId(name);
        
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

        // Real time logging
        //console.log(name + " " + elapsedTime);
    }

    /**
     * This function is similar to addMeasurement(), but it allows timing the
     * *last* event, when you don't know which event will be the last one.
     *
     * Tests that are in the activeTests list, have not yet been added, so add
     * measurements to the performance data, and move test to updatableTests list.
     * A test is moved to the updatable list so that it no longer passes isActive().
     *
     * Tests that are already in the updatableTests list are updated.
     *
     * Caller must explicitly remove test from the updatableTests list using
     * finalizeMeasurement().
     *
     * If markStart() was not called for the specified timer, there is no way to
     * determine if this is the first or subsequent call, so the measurement is
     * not updatable, and it is handled in addMeasurement().
     *
     * @param {string} name  Timer name.
     */
    function updateMeasurement(name) {
        var elapsedTime = brackets.app.getElapsedMilliseconds();

        name = toMeasurementId(name);

        if (updatableTests[name]) {
            // update existing measurement
            elapsedTime -= updatableTests[name].startTime;
            
            // update
            if (perfData[name] && Array.isArray(perfData[name])) {
                // We have existing data and it's an array, so update the last entry
                perfData[name][perfData[name].length - 1] = elapsedTime;
            } else {
                // No current data or a single entry, so set/update it
                perfData[name] = elapsedTime;
            }
            
        } else {
            // not yet in updatable list

            if (activeTests[name]) {
                // save startTime in updatable list before addMeasurement() deletes it
                updatableTests[name] = { startTime: activeTests[name].startTime };
            }
            
            // let addMeasurement() handle the initial case
            addMeasurement(name);
        }
    }

    /**
     * Remove timer from lists so next action starts a new measurement
     * 
     * updateMeasurement may not have been called, so timer may be
     * in either or neither list, but should never be in both.
     *
     * @param {string} name  Timer name.
     */
    function finalizeMeasurement(name) {

        name = toMeasurementId(name);

        if (activeTests[name]) {
            delete activeTests[name];
        }

        if (updatableTests[name]) {
            delete updatableTests[name];
        }
    }
    
    /**
     * Returns whether a timer is active or not, where "active" means that
     * timer has been started with addMark(), but has not been added to perfdata
     * with addMeasurement().
     *
     * @param {string} name  Timer name.
     * @return {boolean} Whether a timer is active or not.
     */
    function isActive(name) {
        return (activeTests[name]) ? true : false;
    }

    /**
      * Returns the performance data as a tab deliminted string
      * @returns {string}
      */
    function getDelimitedPerfData() {
        var getValue = function (entry) {
            // return single value, or tab deliminted values for an array
            if (Array.isArray(entry)) {
                var i, values = "";
                 
                for (i = 0; i < entry.length; i++) {
                    values += entry[i];
                    if (i < entry.length - 1) {
                        values += ", ";
                    }
                }
                return values;
            } else {
                return entry;
            }
        };

        var testName,
            index,
            result = "";
        $.each(perfData, function (testName, entry) {
            result += getValue(entry) + "\t" + testName + "\n";
        });

        return result;
    }
    
    /**
     * Returns the measured value for the given measurement name.
     * @param {string|PerfMeasurement} name The measurement to retreive.
     */
    function getData(name) {
        if (!name) {
            return perfData;
        }
        
        return perfData[toMeasurementId(name)];
    }
    
    function searchData(regExp) {
        var keys = Object.keys(perfData).filter(function (key) {
            return regExp.test(key);
        });
        
        var datas = [];
        
        keys.forEach(function (key) {
            datas.push(perfData[key]);
        });
        
        return datas;
    }
    
    /**
     * Clear all logs including metric data and active tests.
     */
    function clear() {
        perfData = {};
        activeTests = {};
        updatableTests = {};
    }
    
    // create performance measurement constants
    createPerfMeasurement("INLINE_EDITOR_OPEN", "Open inline editor");
    createPerfMeasurement("INLINE_EDITOR_CLOSE", "Close inline editor");
    
    // extensions may create additional measurement constants during their lifecycle

    exports.addMeasurement          = addMeasurement;
    exports.finalizeMeasurement     = finalizeMeasurement;
    exports.isActive                = isActive;
    exports.markStart               = markStart;
    exports.getData                 = getData;
    exports.searchData              = searchData;
    exports.updateMeasurement       = updateMeasurement;
    exports.getDelimitedPerfData    = getDelimitedPerfData;
    exports.createPerfMeasurement   = createPerfMeasurement;
    exports.clear                   = clear;
});
