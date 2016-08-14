/*
 * Copyright (c) 2012 - present Adobe Systems Incorporated. All rights reserved.
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

/**
 * PreferenceStorage defines an interface for persisting preference data as
 * name/value pairs for a module or plugin.
 *
 * @deprecated Use PreferencesManager APIs instead.
 */
define(function (require, exports, module) {
    "use strict";

    var _ = require("thirdparty/lodash");

    var PreferencesManager = require("preferences/PreferencesManager"),
        DeprecationWarning = require("utils/DeprecationWarning");

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
                console.error("Value '" + value + "' for key '" + key + "' must be a valid JSON value");
                return false;
            }
        } else {
            console.error("Preference key '" + key + "' must be a string");
            return false;
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
        DeprecationWarning.deprecationWarning("remove is called to remove a preference '" + key + ",' use PreferencesManager.set (with value of undefined) instead.");
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
        DeprecationWarning.deprecationWarning("setValue is called to set preference '" + key + ",' use PreferencesManager.set instead.");
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
        DeprecationWarning.deprecationWarning("getValue is called to get preference '" + key + ",' use PreferencesManager.get instead.");
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
     * Invalid JSON values report an error and all changes are discarded.
     *
     * @param {!object} obj A JSON object with zero or more preference properties to write.
     * @param {boolean} append Defaults to false. When true, properties in the JSON object
     *  overwrite and/or append to the existing set of preference properties. When false,
     *  all existing preferences are deleted before writing new properties from the JSON object.
     */
    PreferenceStorage.prototype.setAllValues = function (obj, append) {
        DeprecationWarning.deprecationWarning("setAllValues is called to set preferences '" + Object.keys(obj) + ",' use PreferencesManager.set (probably with doNotSave flag) instead.");

        var self = this,
            error = null;

        // validate all name/value pairs before committing
        _.some(obj, function (value, key) {
            try {
                _validateJSONPair(key, value);
            } catch (err) {
                // fail fast
                error = err;
                return true;
            }
        });

        // skip changes if any error is detected
        if (error) {
            console.error(error);
            return;
        }

        // delete all exiting properties if not appending
        if (!append) {
            _.forEach(this._json, function (value, key) {
                delete self._json[key];
            });
        }

        // copy properties from incoming JSON object
        _.forEach(obj, function (value, key) {
            self._json[key] = value;
        });

        _commit();
    };

    /**
     * Converts preferences to the new-style file-based preferences according to the
     * rules. (See PreferencesManager.ConvertPreferences for information about the rules).
     *
     * @param {Object} rules Conversion rules.
     * @param {Array.<string>} convertedKeys List of keys that were previously converted
     *                                      (will not be reconverted)
     * @param {boolean=} isViewState If it is undefined or false, then the preferences
     *      listed in 'rules' are those normal user-editable preferences. Otherwise,
     *      they are view state settings.
     * @param {function(string)=} prefCheckCallback Optional callback function that
     *      examines each preference key for migration.
     * @return {Promise} promise that is resolved once the conversion is done. Callbacks are given a
     *                      `complete` flag that denotes whether everything from this object
     *                      was converted (making it safe to delete entirely).
     */
    PreferenceStorage.prototype.convert = function (rules, convertedKeys, isViewState, prefCheckCallback) {
        var prefs = this._json,
            self = this,
            complete = true,
            manager  = isViewState ? PreferencesManager.stateManager : PreferencesManager,
            deferred = new $.Deferred();

        if (!convertedKeys) {
            convertedKeys = [];
        }

        Object.keys(prefs).forEach(function (key) {
            if (convertedKeys.indexOf(key) > -1) {
                return;
            }

            var rule = rules[key];
            if (!rule && prefCheckCallback) {
                rule = prefCheckCallback(key);
            } else if (prefCheckCallback) {
                // Check whether we have a new preference key-value pair
                // for an old preference.
                var newRule = prefCheckCallback(key, prefs[key]);
                if (newRule) {
                    rule = _.cloneDeep(newRule);
                }
            }
            if (!rule) {
                console.warn("Preferences conversion for ", self._clientID, " has no rule for", key);
                complete = false;
            } else if (_.isString(rule)) {
                var parts = rule.split(" ");
                if (parts[0] === "user") {
                    var newKey = parts.length > 1 ? parts[1] : key;
                    var options = null;

                    if (parts.length > 2 && parts[2].indexOf("/") !== -1) {
                        var projectPath = rule.substr(rule.indexOf(parts[2]));
                        options = { location: { scope: "user",
                                                layer: "project",
                                                layerID: projectPath } };
                    }

                    manager.set(newKey, prefs[key], options);
                    convertedKeys.push(key);
                }
            } else if (_.isObject(rule)) {
                Object.keys(rule).forEach(function (ruleKey) {
                    manager.set(ruleKey, rule[ruleKey]);
                });
                convertedKeys.push(key);
            } else {
                complete = false;
            }
        });

        if (convertedKeys.length > 0) {
            manager.save().done(function () {
                _commit();
                deferred.resolve(complete, convertedKeys);
            }).fail(function (error) {
                deferred.reject(error);
            });
        } else {
            deferred.resolve(complete, convertedKeys);
        }

        return deferred.promise();
    };

    exports.PreferenceStorage = PreferenceStorage;
});
