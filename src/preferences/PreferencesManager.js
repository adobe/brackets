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


/*global define, $, localStorage, brackets, console */
/*unittests: Preferences Manager */

/**
 * PreferencesManager
 *
 */
define(function (require, exports, module) {
    "use strict";
    
    var OldPreferenceStorage = require("preferences/PreferenceStorage").PreferenceStorage,
        FileUtils         = require("file/FileUtils"),
        ExtensionLoader   = require("utils/ExtensionLoader"),
        PreferencesBase   = require("preferences/PreferencesBase"),
        FileSystem        = require("filesystem/FileSystem"),
        _                 = require("thirdparty/lodash");
    
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
     * @param {string=} defaults - Default preferences stored as JSON
     * @param {boolean=} _doNotCreate Do not create the storage if it does not already exist. Used for conversion.
     * @return {PreferenceStorage}
     */
    function getPreferenceStorage(clientID, defaults, _doNotCreate) {
        // No one should be calling this to access the old preference storage except for 
        // migrating the old preferences to the new model. So if this is called without 
        // having _doNotCreate set to true, then the caller is using the old preferences model.
        if (!_doNotCreate) {
            console.warn("PreferencesManager.getPreferenceStorage is deprecated. Use PreferencesManager.definePreference instead.");
        }
        if (!clientID || (typeof clientID === "object" && (!clientID.id || !clientID.uri))) {
            console.error("Invalid clientID");
            return;
        }
        if (typeof clientID === "object") {
            clientID = getClientID(clientID);
        }

        var prefs = prefStorage[clientID];

        if (prefs === undefined) {
            if (_doNotCreate) {
                return;
            }
            // create a new empty preferences object
            prefs = (defaults && JSON.stringify(defaults)) ? defaults : {};
            prefStorage[clientID] = prefs;
        } else if (defaults) {
            // add new defaults
            _.forEach(defaults, function (value, key) {
                if (prefs[key] === undefined) {
                    prefs[key] = value;
                }
            });
        }

        return new OldPreferenceStorage(clientID, prefs);
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
    exports.getClientID             = getClientID;


    // Unit test use only
    exports._reset                  = _reset;
    exports._getExtensionPaths      = _getExtensionPaths;
    
    // New code follows. The code above (with the exception of the imports) is
    // deprecated.
    
    // The SETTINGS_FILENAME is used with a preceding "." within user projects
    var SETTINGS_FILENAME = "brackets.json",
        STATE_FILENAME    = "state.json";
    
    // User-level preferences
    var userPrefFile = brackets.app.getApplicationSupportDirectory() + "/" + SETTINGS_FILENAME;
    
    /**
     * Get the full path to the user-level preferences file.
     * 
     * @return {string} Path to the preferences file
     */
    function getUserPrefFile() {
        return userPrefFile;
    }

    // TODO: In order to migrate all view states I have to move the code that creates stateManager 
    // (and adds a user scope to it) before the code that creates preferencesManager and all its scopes.
    // Need to figure out why ???
    //
    // "State" is stored like preferences but it is not generally intended to be user-editable.
    // It's for more internal, implicit things like window size, working set, etc.
    var stateManager = new PreferencesBase.PreferencesSystem();
    var userStateFile = brackets.app.getApplicationSupportDirectory() + "/" + STATE_FILENAME;
    
    var userScope = stateManager.addScope("user", new PreferencesBase.FileStorage(userStateFile, true));
    var projectLayer = new PreferencesBase.ProjectLayer();
    
    userScope.done(function () {
        stateManager.addLayer("user", projectLayer);
    });

    var preferencesManager = new PreferencesBase.PreferencesSystem();
    
    userScope = preferencesManager.addScope("user", new PreferencesBase.FileStorage(userPrefFile, true));
    
    // Set up the .brackets.json file handling
    userScope
        .done(function () {
            preferencesManager.addPathScopes(".brackets.json", {
                before: "user",
                checkExists: function (filename) {
                    var result = new $.Deferred(),
                        file = FileSystem.getFileForPath(filename);
                    file.exists(function (err, doesExist) {
                        result.resolve(doesExist);
                    });
                    return result.promise();
                },
                getScopeForFile: function (filename) {
                    return new PreferencesBase.Scope(new PreferencesBase.FileStorage(filename));
                }
            })
                .done(function () {
                    // Session Scope is for storing prefs in memory only but with the highest precedence.
                    preferencesManager.addScope("session", new PreferencesBase.MemoryStorage());
                });
        });
        
    /**
     * Creates an extension-specific preferences manager using the prefix given.
     * A `.` character will be appended to the prefix. So, a preference named `foo`
     * with a prefix of `myExtension` will be stored as `myExtension.foo` in the
     * preferences files.
     * 
     * @param {string} prefix Prefix to be applied
     */
    function getExtensionPrefs(prefix) {
        return preferencesManager.getPrefixedSystem(prefix);
    }
    
    /**
     * Converts from the old localStorage-based preferences to the new-style
     * preferences according to the "rules" given.
     * 
     * `rules` is an object, the keys of which refer to the preference names.
     * The value tells the converter what to do. The following values are available:
     * 
     * * `user`: convert to a user-level preference
     * * `user newkey`: convert to a user-level preference, changing the key to newkey
     * 
     * Once a key has been converted, it will not be converted again.
     * 
     * @param {string|Object} clientID ClientID used in the old preferences
     * @param {Object} rules Rules for conversion (as defined above)
     * @param {boolean=} isViewState If it is undefined or false, then the preferences
     *      listed in 'rules' are those normal user-editable preferences. Otherwise,
     *      they are view state settings.
     * @param {function(string)=} prefCheckCallback Optional callback function that
     *      exemines each preference key for migration.
     */
    function convertPreferences(clientID, rules, isViewState, prefCheckCallback) {
        userScope.done(function () {
            var prefs = getPreferenceStorage(clientID, null, true);
            
            if (!prefs) {
                return;
            }
            
            var prefsID = getClientID(clientID);
            if (prefStorage.convertedKeysMap === undefined) {
                prefStorage.convertedKeysMap = {};
            }
            var convertedKeysMap = prefStorage.convertedKeysMap;
            
            prefs.convert(rules, convertedKeysMap[prefsID], isViewState, prefCheckCallback)
                .done(function (complete, convertedKeys) {
                    prefStorage.convertedKeysMap[prefsID] = convertedKeys;
                    savePreferences();
                });
        }).fail(function (error) {
            console.error("Error while converting ", getClientID(clientID));
            console.error(error);
        });
    }

    
    /**
     * Convenience function that sets a preference and then saves the file, mimicking the
     * old behavior a bit more closely.
     * 
     * @param {string} id preference to set
     * @param {*} value new value for the preference
     */
    function setValueAndSave(id, value) {
        preferencesManager.set(id, value);
        preferencesManager.save();
    }
    
    /**
     * Convenience function that gets a view state
     * 
     * @param {string} id preference to get
     * @param {?Object} context Optional additional information about the request
     */
    function getViewState(id, context) {
        return stateManager.get(id, context);
    }
    
    /**
     * Convenience function that sets a view state and then saves the file
     * 
     * @param {string} id preference to set
     * @param {*} value new value for the preference
     * @param {?Object} context Optional additional information about the request
     * @param {boolean=} doNotSave If it is undefined or false, then save the 
     *      view state immediately.
     */
    function setViewState(id, value, context, doNotSave) {
        
        stateManager.set(id, value, context);
        
        if (!doNotSave) {
            stateManager.save();
        }
    }
    
    // Private API for unit testing and use elsewhere in Brackets core
    exports._manager               = preferencesManager;
    exports._setCurrentEditingFile = preferencesManager.setPathScopeContext.bind(preferencesManager);
    
    // Public API
    
    exports.getUserPrefFile     = getUserPrefFile;
    exports.get                 = preferencesManager.get.bind(preferencesManager);
    exports.set                 = preferencesManager.set.bind(preferencesManager);
    exports.save                = preferencesManager.save.bind(preferencesManager);
    exports.on                  = preferencesManager.on.bind(preferencesManager);
    exports.off                 = preferencesManager.off.bind(preferencesManager);
    exports.getPreference       = preferencesManager.getPreference.bind(preferencesManager);
    exports.getExtensionPrefs   = getExtensionPrefs;
    exports.setValueAndSave     = setValueAndSave;
    exports.getViewState        = getViewState;
    exports.setViewState        = setViewState;
    exports.addScope            = preferencesManager.addScope.bind(preferencesManager);
    exports.stateManager        = stateManager;
    exports.projectLayer        = projectLayer;
    exports.FileStorage         = PreferencesBase.FileStorage;
    exports.SETTINGS_FILENAME   = SETTINGS_FILENAME;
    exports.definePreference    = preferencesManager.definePreference.bind(preferencesManager);
    exports.fileChanged         = preferencesManager.fileChanged.bind(preferencesManager);
    exports.convertPreferences  = convertPreferences;
});
