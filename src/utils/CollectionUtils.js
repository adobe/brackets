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
/*global define */

/**
 *  Utilities functions related to data collections (arrays & maps)
 */
define(function (require, exports, module) {
    "use strict";
    
    var _ = require("thirdparty/lodash");

    /**
     * Returns the first index in 'array' for which isMatch() returns true, or -1 if none
     * @param {!Array.<*>|jQueryObject} array
     * @param {!function(*, Number):boolean} isMatch Passed (item, index), same as with forEach()
     * @deprecated
     */
    function indexOf(array, isMatch) {
        console.warn("CollectionUtils.indexOf is deprecated. Use _.findIndex instead.");
        return _.findIndex(array, isMatch);
    }
    
    /**
     * Iterates over all the properties in an object or elements in an array. Differs from
     * $.each in that it always iterates over the properties of an object, even if it has a length
     * property making it look like an array.
     * @param {*} object The object or array to iterate over.
     * @param {function(value, key)} callback The function that will be executed on every object.
     * @deprecated
     */
    function forEach(object, callback) {
        console.warn("CollectionUtils.forEach is deprecated. Use _.forEach instead.");
        _.forEach(object, callback);
    }
    
    /**
     * Iterates over all the properties in an object or elements in an array. If a callback returns a
     * truthly value then it will immediately return true, if not, it will return false. Differs from
     * $.each in that it always iterates over the properties of an object, even if it has a length
     * property making it look like an array.
     * @param {*} object The object or array to iterate over.
     * @param {function(value, key)} callback The function that will be executed on every object.
     * @return {boolean}
     * @deprecated
     */
    function some(object, callback) {
        console.warn("CollectionUtils.some is deprecated. Use _.some instead.");
        return _.some(object, callback);
    }
    
    /**
     * Returns true if the object has the specified property.
     * This calls the Object.prototype.hasOwnProperty function directly, rather than
     * depending on the object having a function named "hasOwnProperty". This way the
     * object *can* have a property named "hasOwnProperty" that is not a function.
     * @param {*} object The object to test
     * @param {string} property The name of the property to query
     * @return {boolean} True if the object contains the property
     * @deprecated
     */
    function hasProperty(object, property) {
        console.warn("CollectionUtils.hasProperty is deprecated. Use _.has instead.");
        return _.has(object, property);
    }
    
    // Define public API
    exports.indexOf     = indexOf;
    exports.forEach     = forEach;
    exports.some        = some;
    exports.hasProperty = hasProperty;
});
