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

/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $ */

/**
 *  Utilities functions related to data collections (arrays & maps)
 */
define(function (require, exports, module) {
    "use strict";

    /**
     * Returns the first index in 'array' for which isMatch() returns true, or -1 if none
     * @param {!Array.<*>|jQueryObject} array
     * @param {!function(*, Number):boolean} isMatch Passed (item, index), same as with forEach()
     */
    function indexOf(array, isMatch) {
        // Old-fashioned loop, instead of Array.some, to support jQuery "arrays"
        var i;
        for (i = 0; i < array.length; i++) {
            if (isMatch(array[i], i)) {
                return i;
            }
        }
        return -1;
    }
    
    /**
     * Iterates over all the properties in an object or elements in an array. Differs from
     * $.each in that it iterates over array-like objects like regular objects.
     * @param {*} object The object or array to iterate over.
     * @param {function(value, key)} callback The function that will be executed on every object.
     */
    function forEach(object, callback) {
        var keys = Object.keys(object),
            len = keys.length,
            i;
        
        for (i = 0; i < len; i++) {
            callback(object[keys[i]], keys[i]);
        }
    }
    
    /**
     * Returns true if the object has the specified property.
     * This calls the Object.prototype.hasOwnProperty function directly, rather than
     * depending on the object having a function named "hasOwnProperty". This way the
     * object *can* have a property named "hasOwnProperty" that is not a function.
     * @param {*} object The object to test
     * @param {string} property The name of the property to query
     * @return {boolean} True if the object contains the property
     */
    function hasProperty(object, property) {
        return Object.prototype.hasOwnProperty.apply(object, [property]);
    }
    
    // Define public API
    exports.indexOf = indexOf;
    exports.forEach = forEach;
    exports.hasProperty = hasProperty;
});
