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
        Async             = require("utils/Async"),
        Commands          = require("command/Commands"),
        CommandManager    = require("command/CommandManager"),
        FileUtils         = require("file/FileUtils"),
        ExtensionLoader   = require("utils/ExtensionLoader"),
        PreferencesBase   = require("preferences/PreferencesBase"),
        FileSystem        = require("filesystem/FileSystem"),
        Strings           = require("strings"),
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
    
    /** 
     * A boolean property indicating if the user scope configuration file is malformed.
     */
    var _userScopeCorrupt = false;
    
    /**
     * A deferred object which is used to indicate PreferenceManager readiness during the start-up.
     * @private
     * @type {$.Deferred}
     */
    var _deferred = new $.Deferred();
    
    /**
     * Promises to add scopes. Used at init time only. 
     * @private
     * @type {Array.<$.Promise>}
     */
    var _addScopePromises = [];
    
    var preferencesManager = new PreferencesBase.PreferencesSystem();

    // Create a Project scope
    var projectStorage          = new PreferencesBase.FileStorage(undefined, true),
        projectScope            = new PreferencesBase.Scope(projectStorage),
        projectPathLayer        = new PreferencesBase.PathLayer(),
        projectDirectory        = null,
        currentEditedFile       = null,
        projectScopeIsIncluded  = true;
    
    projectScope.addLayer(projectPathLayer);
    
    var userScopeLoading = preferencesManager.addScope("user", new PreferencesBase.FileStorage(userPrefFile, true));
    
    _addScopePromises.push(userScopeLoading);
    
    // Set up the .brackets.json file handling
    userScopeLoading
        .fail(function (err) {
            _addScopePromises.push(preferencesManager.addScope("user", new PreferencesBase.MemoryStorage(), {
                before: "default"
            }));

            if (err.name && err.name === "ParsingError") {
                _userScopeCorrupt = true;
            }
        })
        .done(function () {
            _addScopePromises.push(preferencesManager.addScope("project", projectScope, {
                before: "user"
            }));
    
            // Session Scope is for storing prefs in memory only but with the highest precedence.
            _addScopePromises.push(preferencesManager.addScope("session", new PreferencesBase.MemoryStorage()));

            Async.waitForAll(_addScopePromises)
                .always(function () {
                    _deferred.resolve();
                });
        });
    
    
    /**
     * @private
     * 
     * Determines whether the project Scope should be included based on whether
     * the currently edited file is within the project.
     * 
     * @param {string=} filename Full path to edited file
     * @return {boolean} true if the project Scope should be included.
     */
    function _includeProjectScope(filename) {
        filename = filename || currentEditedFile;
        if (!filename || !projectDirectory) {
            return false;
        }
        return FileUtils.getRelativeFilename(projectDirectory, filename) ? true : false;
    }
    
    /**
     * @private
     * 
     * Adds or removes the project Scope as needed based on whether the currently
     * edited file is within the project.
     */
    function _toggleProjectScope() {
        if (_includeProjectScope() === projectScopeIsIncluded) {
            return;
        }
        if (projectScopeIsIncluded) {
            preferencesManager.removeFromScopeOrder("project");
        } else {
            preferencesManager.addToScopeOrder("project", "user");
        }
        projectScopeIsIncluded = !projectScopeIsIncluded;
    }
    
    /**
     * @private
     * 
     * This is used internally within Brackets for the ProjectManager to signal
     * which file contains the project-level preferences.
     * 
     * @param {string} settingsFile Full path to the project's settings file
     */
    function _setProjectSettingsFile(settingsFile) {
        projectDirectory = FileUtils.getDirectoryPath(settingsFile);
        _toggleProjectScope();
        projectPathLayer.setPrefFilePath(settingsFile);
        projectStorage.setPath(settingsFile);
    }
    
    /**
     * @private
     * 
     * This is used internally within Brackets for the EditorManager to signal
     * to the preferences what the currently edited file is.
     * 
     * @param {string} currentFile Full path to currently edited file
     */
    function _setCurrentEditingFile(currentFile) {
        currentEditedFile = currentFile;
        _toggleProjectScope();
        preferencesManager.setDefaultFilename(currentFile);
    }
    
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
     */
    function convertPreferences(clientID, rules) {
        userScopeLoading.done(function () {
            var prefs = getPreferenceStorage(clientID, null, true);
            
            if (!prefs) {
                return;
            }
            
            var prefsID = getClientID(clientID);
            if (prefStorage.convertedKeysMap === undefined) {
                prefStorage.convertedKeysMap = {};
            }
            var convertedKeysMap = prefStorage.convertedKeysMap;
            
            prefs.convert(rules, convertedKeysMap[prefsID]).done(function (complete, convertedKeys) {
                prefStorage.convertedKeysMap[prefsID] = convertedKeys;
                savePreferences();
            });
        }).fail(function (error) {
            console.error("Error while converting ", getClientID(clientID));
            console.error(error);
        });
    }

    // "State" is stored like preferences but it is not generally intended to be user-editable.
    // It's for more internal, implicit things like window size, working set, etc.
    var stateManager = new PreferencesBase.PreferencesSystem();
    var userStateFile = brackets.app.getApplicationSupportDirectory() + "/" + STATE_FILENAME;
    
    stateManager.addScope("user", new PreferencesBase.FileStorage(userStateFile, true));
    
    // Constants for preference lookup contexts.
    
    /**
     * Context to look up preferences in the current project.
     * @type {Object}
     */
    var CURRENT_PROJECT = {};
    
    /**
     * Context to look up preferences for the currently edited file.
     * This is undefined because this is the default behavior of PreferencesSystem.get.
     * 
     * @type {Object}
     */
    var CURRENT_FILE;
    
    /**
     * Cached copy of the scopeOrder with the project Scope
     */
    var scopeOrderWithProject = null;
    
    /**
     * Cached copy of the scopeOrder without the project Scope
     */
    var scopeOrderWithoutProject = null;
    
    /**
     * @private
     * 
     * Adjusts scopeOrder to have the project Scope if necessary.
     * Returns a new array if changes are needed, otherwise returns
     * the original array.
     * 
     * @param {Array.<string>} scopeOrder initial scopeOrder
     * @param {boolean} includeProject Whether the project Scope should be included
     * @return {Array.<string>} array with or without project Scope as needed.
     */
    function _adjustScopeOrderForProject(scopeOrder, includeProject) {
        var hasProject = scopeOrder.indexOf("project") > -1;
        
        if (hasProject === includeProject) {
            return scopeOrder;
        }
        
        var newScopeOrder;
        
        if (includeProject) {
            var before = scopeOrder.indexOf("user");
            if (before === -1) {
                before = scopeOrder.length - 2;
            }
            newScopeOrder = _.first(scopeOrder, before);
            newScopeOrder.push("project");
            newScopeOrder.push.apply(newScopeOrder, _.rest(scopeOrder, before));
        } else {
            newScopeOrder = _.without(scopeOrder, "project");
        }
        return newScopeOrder;
    }
    
    /**
     * @private
     * 
     * Normalizes the context object to be something that the PreferencesSystem
     * understands. This is how we support CURRENT_FILE and CURRENT_PROJECT
     * preferences.
     * 
     * @param {Object|string} context CURRENT_FILE, CURRENT_PROJECT or a filename
     */
    function _normalizeContext(context) {
        if (typeof context === "string") {
            context = {
                filename: context
            };
            context.scopeOrder = _includeProjectScope(context.filename) ?
                                    scopeOrderWithProject :
                                    scopeOrderWithoutProject;
        }
        return context;
    }
    
    /**
     * @private
     * 
     * Updates the CURRENT_PROJECT context to have the correct scopes.
     */
    function _updateCurrentProjectContext() {
        var context = preferencesManager.buildContext({});
        delete context.filename;
        scopeOrderWithProject = _adjustScopeOrderForProject(context.scopeOrder, true);
        scopeOrderWithoutProject = _adjustScopeOrderForProject(context.scopeOrder, false);
        CURRENT_PROJECT.scopeOrder = scopeOrderWithProject;
    }
    
    _updateCurrentProjectContext();
    
    preferencesManager.on("scopeOrderChange", _updateCurrentProjectContext);
    
    /**
     * Look up a preference in the given context. The default is 
     * CURRENT_FILE (preferences as they would be applied to the
     * currently edited file).
     * 
     * @param {string} id Preference ID to retrieve the value of
     * @param {Object|string=} context CURRENT_FILE, CURRENT_PROJECT or a filename
     */
    function get(id, context) {
        context = _normalizeContext(context);
        return preferencesManager.get(id, context);
    }
    
    /**
     * Sets a preference and notifies listeners that there may
     * have been a change. By default, the preference is set in the same location in which
     * it was defined except for the "default" scope. If the current value of the preference
     * comes from the "default" scope, the new value will be set at the level just above
     * default.
     * 
     * As with the `get()` function, the context can be a filename,
     * CURRENT_FILE, CURRENT_PROJECT or a full context object as supported by
     * PreferencesSystem.
     * 
     * @param {string} id Identifier of the preference to set
     * @param {Object} value New value for the preference
     * @param {{location: ?Object, context: ?Object|string}=} options Specific location in which to set the value or the context to use when setting the value
     * @return {boolean} true if a value was set
     */
    function set(id, value, options) {
        if (options && options.context) {
            options.context = _normalizeContext(options.context);
        }
        return preferencesManager.set(id, value, options);
    }

    /**
     * @private
     */
    function _handleOpenPreferences() {
        var fullPath = getUserPrefFile(),
            file = FileSystem.getFileForPath(fullPath);
        file.exists(function (err, doesExist) {
            if (doesExist) {
                CommandManager.execute(Commands.FILE_OPEN, { fullPath: fullPath });
            } else {
                FileUtils.writeText(file, "", true)
                    .done(function () {
                        CommandManager.execute(Commands.FILE_OPEN, { fullPath: fullPath });
                    });
            }
        });
        
    }
    
    CommandManager.register(Strings.CMD_OPEN_PREFERENCES, Commands.FILE_OPEN_PREFERENCES, _handleOpenPreferences);
    
    /**
     * Convenience function that sets a preference and then saves the file, mimicking the
     * old behavior a bit more closely.
     * 
     * @param {string} id preference to set
     * @param {*} value new value for the preference
     * @param {{location: ?Object, context: ?Object|string}=} options Specific location in which to set the value or the context to use when setting the value
     * @return {boolean} true if a value was set
     */
    function setValueAndSave(id, value, options) {
        var changed = set(id, value, options);
        preferencesManager.save();
        return changed;
    }
    
    
    // Private API for unit testing and use elsewhere in Brackets core
    exports.ready                  = _deferred.promise();
    exports._isUserScopeCorrupt    = function () { return _userScopeCorrupt; };
    exports._manager                = preferencesManager;
    exports._setCurrentEditingFile  = _setCurrentEditingFile;
    exports._setProjectSettingsFile = _setProjectSettingsFile;
    
    // Public API
    
    // Context names for preference lookups
    exports.CURRENT_FILE        = CURRENT_FILE;
    exports.CURRENT_PROJECT     = CURRENT_PROJECT;
    
    exports.getUserPrefFile     = getUserPrefFile;
    exports.get                 = get;
    exports.set                 = set;
    exports.save                = preferencesManager.save.bind(preferencesManager);
    exports.on                  = preferencesManager.on.bind(preferencesManager);
    exports.off                 = preferencesManager.off.bind(preferencesManager);
    exports.getPreference       = preferencesManager.getPreference.bind(preferencesManager);
    exports.getExtensionPrefs   = getExtensionPrefs;
    exports.setValueAndSave     = setValueAndSave;
    exports.addScope            = preferencesManager.addScope.bind(preferencesManager);
    exports.stateManager        = stateManager;
    exports.FileStorage         = PreferencesBase.FileStorage;
    exports.SETTINGS_FILENAME   = SETTINGS_FILENAME;
    exports.definePreference    = preferencesManager.definePreference.bind(preferencesManager);
    exports.fileChanged         = preferencesManager.fileChanged.bind(preferencesManager);
    exports.convertPreferences  = convertPreferences;
});
