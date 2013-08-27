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
/*global define, $, localStorage */

/**
 * PreferencesManager
 *
 */
define(function (require, exports, module) {
    "use strict";
    
    var PreferenceStorage = require("preferences/PreferenceStorage").PreferenceStorage,
        FileUtils         = require("file/FileUtils"),
        ExtensionLoader   = require("utils/ExtensionLoader"),
        CollectionUtils   = require("utils/CollectionUtils");
    
    /**
     * The local storage ID
     * @const
     * @type {string}
     */
    var PREFERENCES_CLIENT_ID = "com.adobe.brackets.preferences";
    
    /**
     * The prefix used in the generated client ID
     * @const
     * @type {string}
     */
    var CLIENT_ID_PREFIX = "com.adobe.brackets.";
    
    
    // Private Properties
    var preferencesKey,
        prefStorage,
        persistentStorage,
        extensionPaths,
        doLoadPreferences   = false;
    
    
    /**
     * @private
     * Returns an array with the extension paths used in Brackets. The result is stored on a
     * private variable on the first call and used to return the value on the next calls.
     * @return {Array.<string>}
     */
    function _getExtensionPaths() {
        if (!extensionPaths) {
            var dirPath = FileUtils.getNativeBracketsDirectoryPath();
            
            extensionPaths = [
                dirPath + "/extensions/default/",
                dirPath + "/extensions/dev/",
                ExtensionLoader.getUserExtensionPath() + "/"
            ];
        }
        return extensionPaths;
    }

    /**
     * This method returns a standardized ClientID for a given requireJS module object
     * @param {!{id: string, uri: string}} module - A requireJS module object
     * @return {string} The ClientID
     */
    function getClientID(module) {
        var paths = exports._getExtensionPaths();
        var pathExp, pathUrl, clientID;

        paths.some(function (path) {
            if (module.uri.toLocaleLowerCase().indexOf(path.toLocaleLowerCase()) === 0) {
                pathUrl = path;
                return true;
            }
        });

        if (pathUrl) {
            clientID = CLIENT_ID_PREFIX + module.uri.replace(pathUrl, "");
        } else {
            clientID = CLIENT_ID_PREFIX + module.id;
        }
        return clientID;
    }
    
    /**
     * Retreive the preferences data for the given clientID.
     * @param {string|{id: string, uri: string}} clientID - A unique identifier or a requireJS module object
     * @param {string} defaults - Default preferences stored as JSON
     * @return {PreferenceStorage} 
     */
    function getPreferenceStorage(clientID, defaults) {
        if (!clientID || (typeof clientID === "object" && (!clientID.id || !clientID.uri))) {
            console.error("Invalid clientID");
            return;
        }
        if (typeof clientID === "object") {
            clientID = getClientID(clientID);
        }

        var prefs = prefStorage[clientID];

        if (prefs === undefined) {
            // create a new empty preferences object
            prefs = (defaults && JSON.stringify(defaults)) ? defaults : {};
            prefStorage[clientID] = prefs;
        } else if (defaults) {
            // add new defaults
            CollectionUtils.forEach(defaults, function (value, key) {
                if (prefs[key] === undefined) {
                    prefs[key] = value;
                }
            });
        }

        return new PreferenceStorage(clientID, prefs);
    }

    /**
     * Save all preference clients.
     */
    function savePreferences() {
        // save all preferences
        persistentStorage.setItem(preferencesKey, JSON.stringify(prefStorage));
    }

    /**
     * @private
     * Reset preferences and callbacks
     */
    function _reset() {
        prefStorage = {};

        // Note that storage.clear() is not used. Production and unit test code
        // both rely on the same backing storage but unique item keys.
        persistentStorage.setItem(preferencesKey, JSON.stringify(prefStorage));
    }

    /**
     * @private
     * Initialize persistent storage implementation
     */
    function _initStorage(storage) {
        persistentStorage = storage;

        if (doLoadPreferences) {
            prefStorage = JSON.parse(persistentStorage.getItem(preferencesKey));
        }

        // initialize empty preferences if none were found in storage
        if (!prefStorage) {
            _reset();
        }
    }
    
    /**
     * This method handles the copy of all old prefs to the new prefs
     * TODO: remove All calls to this function and the function itself
     * 
     * @param {!PreferenceStorage} newPrefs The new PreferenceStorage
     * @param {!string} oldID The id of the old PreferenceStorage
     */
    function handleClientIdChange(newPrefs, oldID) {
        if (prefStorage[oldID]) {
            var oldPrefs = getPreferenceStorage(oldID);
            
            if (!newPrefs.getValue("newClientID")) {
                var data = oldPrefs.getAllValues();
                
                if (!$.isEmptyObject(data)) {
                    newPrefs.setAllValues(data, true);
                }
                newPrefs.setValue("newClientID", true);
            }
            delete prefStorage[oldID];
        }
    }

    // Check localStorage for a preferencesKey. Production and unit test keys
    // are used to keep preferences separate within the same storage implementation.
    preferencesKey = localStorage.getItem("preferencesKey");
    
    if (!preferencesKey) {
        // use default key if none is found
        preferencesKey = PREFERENCES_CLIENT_ID;
        doLoadPreferences = true;
    } else {
        // using a non-default key, check for additional settings
        doLoadPreferences = !!(localStorage.getItem("doLoadPreferences"));
    }

    // Use localStorage by default
    _initStorage(localStorage);

    // Public API
    exports.getPreferenceStorage    = getPreferenceStorage;
    exports.savePreferences         = savePreferences;
    exports.handleClientIdChange    = handleClientIdChange;
    exports.getClientID             = getClientID;

    // Unit test use only
    exports._reset                  = _reset;
    exports._getExtensionPaths      = _getExtensionPaths;
});
