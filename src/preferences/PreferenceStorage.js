/*
 * Copyright 2012 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, $: false */

/**
 * PreferenceStorage defines an interface for persisting preference data as
 * name/value pairs for a module or plugin.
 */
define(function (require, exports, module) {
    'use strict';
    
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
    };
    
    /**
     * Assigns a value for a key. Overwrites existing value if present.
     * @param {!string} key A unique identifier
     * @param {object} value A valid JSON value
     */
    PreferenceStorage.prototype.setValue = function (key, value) {
        if (typeof key === "string") {
            // validate temporary JSON
            var temp = {};
            temp[key] = value;
            temp = JSON.parse(JSON.stringify(temp));
            
            if (temp[key] !== undefined) {
                // set value to JSON storage
                this._json[key] = value;
            } else {
                throw new Error("Value must be a valid JSON value");
            }
        } else {
            throw new Error("Preference key must be a string");
        }
    };
    
    /**
     * Retreive the value associated with the specified.
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
    PreferenceStorage.prototype.toJSON = function () {
        return JSON.parse(JSON.stringify(this._json));
    };
    
    /**
     * Writes name-value pairs from a JSON object as preference properties.
     * Invalid JSON values throw an error.
     *
     * @param {!object} obj A JSON object with zero or more preference properties to write.
     * @param {boolean} append When true, properties in the JSON object overwrite and/or append
     *  to the existing set of preference properties. When false, all existing preferences
     *  are deleted before writing new properties from the JSON object.
     */
    PreferenceStorage.prototype.writeJSON = function (obj, append) {
        var self = this;
        
        append = (append !== undefined) ? append : true;
        
        // delete all exiting properties if not appending
        if (!append) {
            $.each(this._json, function (key, value) {
                delete self._json[key];
            });
        }
        
        // copy properties from incoming JSON object
        $.each(obj, function (key, value) {
            self.setValue(key, value);
        });
    };
    
    exports.PreferenceStorage = PreferenceStorage;
});