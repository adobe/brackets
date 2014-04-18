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
    
    var OldPreferenceStorage    = require("preferences/PreferenceStorage").PreferenceStorage,
        AppInit                 = require("utils/AppInit"),
        Commands                = require("command/Commands"),
        CommandManager          = require("command/CommandManager"),
        DeprecationWarning      = require("utils/DeprecationWarning"),
        FileUtils               = require("file/FileUtils"),
        ExtensionLoader         = require("utils/ExtensionLoader"),
        PreferencesBase         = require("preferences/PreferencesBase"),
        FileSystem              = require("filesystem/FileSystem"),
        Strings                 = require("strings"),
        PreferencesImpl         = require("preferences/PreferencesImpl"),
        _                       = require("thirdparty/lodash");
    
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
            var clientString = typeof clientID === "object" ? clientID.uri : clientID;
            DeprecationWarning.deprecationWarning("getPreferenceStorage is called with client ID '" + clientString + ",' use PreferencesManager.definePreference instead.");
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
    
    var currentEditedFile       = null,
        projectDirectory        = null,
        projectScopeIsIncluded  = true;

    
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
        return FileUtils.getRelativeFilename(projectDirectory, filename) !== undefined;
    }
    
    /**
     * Get the full path to the user-level preferences file.
     * 
     * @return {string} Path to the preferences file
     */
    function getUserPrefFile() {
        return PreferencesImpl.userPrefFile;
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
            PreferencesImpl.manager.removeFromScopeOrder("project");
        } else {
            PreferencesImpl.manager.addToScopeOrder("project", "user");
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
        PreferencesImpl.projectPathLayer.setPrefFilePath(settingsFile);
        PreferencesImpl.projectStorage.setPath(settingsFile);
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
        PreferencesImpl.manager.setDefaultFilename(currentFile);
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
        return PreferencesImpl.manager.getPrefixedSystem(prefix);
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
     *      examines each preference key for migration.
     */
    function convertPreferences(clientID, rules, isViewState, prefCheckCallback) {
        PreferencesImpl.smUserScopeLoading.done(function () {
            PreferencesImpl.userScopeLoading.done(function () {
                if (!clientID || (typeof clientID === "object" && (!clientID.id || !clientID.uri))) {
                    console.error("Invalid clientID");
                    return;
                }
                var prefs = getPreferenceStorage(clientID, null, true);

                if (!prefs) {
                    return;
                }

                var prefsID = typeof clientID === "object" ? getClientID(clientID) : clientID;
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
                console.error("Error while converting ", typeof clientID === "object" ? getClientID(clientID) : clientID);
                console.error(error);
            });
        });
    }

    
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
        var context = PreferencesImpl.manager.buildContext({});
        delete context.filename;
        scopeOrderWithProject = _adjustScopeOrderForProject(context.scopeOrder, true);
        scopeOrderWithoutProject = _adjustScopeOrderForProject(context.scopeOrder, false);
        CURRENT_PROJECT.scopeOrder = scopeOrderWithProject;
    }
    
    _updateCurrentProjectContext();
    
    PreferencesImpl.manager.on("scopeOrderChange", _updateCurrentProjectContext);
    
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
        return PreferencesImpl.manager.get(id, context);
    }
    
    /**
     * Sets a preference and notifies listeners that there may
     * have been a change. By default, the preference is set in the same location in which
     * it was defined except for the "default" scope. If the current value of the preference
     * comes from the "default" scope, the new value will be set at the level just above
     * default.
     * 
     * The preferences are saved automatically unless doNotSave is true.
     * 
     * As with the `get()` function, the context can be a filename,
     * CURRENT_FILE, CURRENT_PROJECT or a full context object as supported by
     * PreferencesSystem.
     * 
     * @param {string} id Identifier of the preference to set
     * @param {Object} value New value for the preference
     * @param {{location: ?Object, context: ?Object|string}=} options Specific location in which to set the value or the context to use when setting the value
     * @param {boolean=} doNotSave True if the preference change should not be saved automatically.
     * @return {valid:  {boolean}, true if no validator specified or if value is valid
     *          stored: {boolean}} true if a value was stored
     */
    function set(id, value, options, doNotSave) {
        if (options && options.context) {
            options.context = _normalizeContext(options.context);
        }
        var wasSet = PreferencesImpl.manager.set(id, value, options);
        if (!doNotSave) {
            PreferencesImpl.manager.save();
        }
        return wasSet;
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
     * @deprecated Use set instead.
     * 
     * Convenience function that sets a preference and then saves the file, mimicking the
     * old behavior a bit more closely.
     * 
     * @param {string} id preference to set
     * @param {*} value new value for the preference
     * @param {{location: ?Object, context: ?Object|string}=} options Specific location in which to set the value or the context to use when setting the value
     * @return {boolean} true if a value was set
     */
    function setValueAndSave(id, value, options) {
        DeprecationWarning.deprecationWarning("setValueAndSave called for " + id + ". Use set instead.");
        var changed = set(id, value, options).stored;
        PreferencesImpl.manager.save();
        return changed;
    }
    
    /**
     * Convenience function that gets a view state
     * 
     * @param {string} id preference to get
     * @param {?Object} context Optional additional information about the request
     */
    function getViewState(id, context) {
        return PreferencesImpl.stateManager.get(id, context);
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
        
        PreferencesImpl.stateManager.set(id, value, context);
        
        if (!doNotSave) {
            PreferencesImpl.stateManager.save();
        }
    }
    
    AppInit.appReady(function () {
        PreferencesImpl.manager.resumeChangeEvents();
    });
    
    // Private API for unit testing and use elsewhere in Brackets core
    exports._isUserScopeCorrupt    = function () { return PreferencesImpl._userScopeCorrupt; };
    exports._manager                = PreferencesImpl.manager;
    exports._setCurrentEditingFile  = _setCurrentEditingFile;
    exports._setProjectSettingsFile = _setProjectSettingsFile;
    exports._smUserScopeLoading     = PreferencesImpl.smUserScopeLoading;
    exports._stateProjectLayer      = PreferencesImpl.stateProjectLayer;
    
    // Public API
    
    // Context names for preference lookups
    exports.CURRENT_FILE        = CURRENT_FILE;
    exports.CURRENT_PROJECT     = CURRENT_PROJECT;
    
    exports.ready               = PreferencesImpl.managerReady;
    exports.getUserPrefFile     = getUserPrefFile;
    exports.get                 = get;
    exports.set                 = set;
    exports.save                = PreferencesImpl.manager.save.bind(PreferencesImpl.manager);
    exports.on                  = PreferencesImpl.manager.on.bind(PreferencesImpl.manager);
    exports.off                 = PreferencesImpl.manager.off.bind(PreferencesImpl.manager);
    exports.getPreference       = PreferencesImpl.manager.getPreference.bind(PreferencesImpl.manager);
    exports.getExtensionPrefs   = getExtensionPrefs;
    exports.setValueAndSave     = setValueAndSave;
    exports.getViewState        = getViewState;
    exports.setViewState        = setViewState;
    exports.addScope            = PreferencesImpl.manager.addScope.bind(PreferencesImpl.manager);
    exports.stateManager        = PreferencesImpl.stateManager;
    exports.FileStorage         = PreferencesBase.FileStorage;
    exports.SETTINGS_FILENAME   = PreferencesImpl.SETTINGS_FILENAME;
    exports.definePreference    = PreferencesImpl.manager.definePreference.bind(PreferencesImpl.manager);
    exports.fileChanged         = PreferencesImpl.manager.fileChanged.bind(PreferencesImpl.manager);
    exports.convertPreferences  = convertPreferences;
});
