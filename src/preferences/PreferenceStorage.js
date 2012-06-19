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
/*global define, $ */

/**
 * PreferenceStorage defines an interface for persisting preference data as
 * name/value pairs for a module or plugin.
 */
define(function (require, exports, module) {
    'use strict';
    
    var PreferencesManager = require("preferences/PreferencesManager");
    
    /**
     * @private
     * Validate JSON keys and values.
     */
    function _validateJSONPair(key, value) {
        if (typeof key === "string") {
            // validate temporary JSON
            var temp = {},
                error = null;
            temp[key] = value;
            
            try {
                temp = JSON.parse(JSON.stringify(temp));
            } catch (err) {
                error = err;
            }
            
            // set value to JSON storage if no errors occurred
            if (!error && (temp[key] !== undefined)) {
                return true;
            } else {
                throw new Error("Value '" + value + "' for key '" + key + "' must be a valid JSON value");
            }
        } else {
            throw new Error("Preference key '" + key + "' must be a string");
        }
    }
    
    /**
     * @private
     * Save to persistent storage.
     */
    function _commit() {
        PreferencesManager.savePreferences();
    }
    
    /**
     * Creates a new PreferenceStorage object.
     * @param {!string} clientID Unique identifier for PreferencesManager to
     *  associate this PreferenceStorage data with.
     * @param {!object} json JSON object to persist preference data.
     */
    function PreferenceStorage(clientID, json) {
        this._clientID = clientID;
        this._json = json;
    }
    
    /**
     * Unique clientID for this PreferenceStorage object.
     * @return {!string} clientID
     */
    PreferenceStorage.prototype.getClientID = function () {
        return this._clientID;
    };
    
    /**
     * Removes a preference from this PreferenceStorage object.
     * @param {!string} key A unique identifier
     */
    PreferenceStorage.prototype.remove = function (key) {
        // remove value from JSON storage
        delete this._json[key];
        _commit();
    };
    
    /**
     * Assigns a value for a key. Overwrites existing value if present.
     * @param {!string} key A unique identifier
     * @param {object} value A valid JSON value
     */
    PreferenceStorage.prototype.setValue = function (key, value) {
        if (_validateJSONPair(key, value)) {
            this._json[key] = value;
            _commit();
        }
    };
    
    /**
     * Retreive the value associated with the specified key.
     * @param {!string} key Key name to lookup.
     * @return {object} Returns the value for the key or undefined.
     */
    PreferenceStorage.prototype.getValue = function (key) {
        return this._json[key];
    };
    
    /**
     * Return all name-value pairs as a single JSON object.
     * @return {!object} JSON object containing name/value pairs for all keys
     *  in this PreferenceStorage object.
     */
    PreferenceStorage.prototype.getAllValues = function () {
        return JSON.parse(JSON.stringify(this._json));
    };
    
    /**
     * Writes name-value pairs from a JSON object as preference properties.
     * Invalid JSON values throw an error and all changes are discarded.
     *
     * @param {!object} obj A JSON object with zero or more preference properties to write.
     * @param {boolean} append Defaults to false. When true, properties in the JSON object
     *  overwrite and/or append to the existing set of preference properties. When false,
     *  all existing preferences are deleted before writing new properties from the JSON object.
     */
    PreferenceStorage.prototype.setAllValues = function (obj, append) {
        var self = this,
            error = null;
        
        // validate all name/value pairs before committing
        $.each(obj, function (key, value) {
            try {
                _validateJSONPair(key, value);
            } catch (err) {
                // fail fast
                error = err;
                return false;
            }
        });
        
        // skip changes if any error is detected
        if (error) {
            throw error;
        }
        
        // delete all exiting properties if not appending
        if (!append) {
            $.each(this._json, function (key, value) {
                delete self._json[key];
            });
        }
        
        // copy properties from incoming JSON object
        $.each(obj, function (key, value) {
            self._json[key] = value;
        });
        
        _commit();
    };
    
    module.exports = PreferenceStorage;
});