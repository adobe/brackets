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


/*unittests: Preferences Manager */

/**
 * PreferencesManager
 *
 */
define(function (require, exports, module) {
    "use strict";
    
    var AppInit                 = require("utils/AppInit"),
        Async                   = require("utils/Async"),
        Commands                = require("command/Commands"),
        CommandManager          = require("command/CommandManager"),
        FileUtils               = require("file/FileUtils"),
        PreferencesBase         = require("preferences/PreferencesBase"),
        FileSystem              = require("filesystem/FileSystem"),
        Strings                 = require("strings"),
        PreferencesImpl         = require("preferences/PreferencesImpl"),
        _                       = require("thirdparty/lodash");
    
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
    
    PreferencesImpl.manager.contextNormalizer = _normalizeContext;
    
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
    
    /**
     * Return a promise that is resolved when all preferences have been resolved,
     * or rejected if any have been rejected.
     * 
     * @return {Promise} Resolved when the preferences are done saving.
     */
    function finalize() {
        var promiseList = [
                PreferencesImpl.managerReady,
                PreferencesImpl.smUserScopeLoading,
                PreferencesImpl.manager._finalize(),
                PreferencesImpl.stateManager._finalize()
            ],
            identityFunc = function (promise) { return promise; };
        
        return Async.doSequentially(promiseList, identityFunc, false);
    }
    
    AppInit.appReady(function () {
        PreferencesImpl.manager.resumeChangeEvents();
    });
    
    // Private API for unit testing and use elsewhere in Brackets core
    exports._isUserScopeCorrupt     = PreferencesImpl.isUserScopeCorrupt;
    exports._manager                = PreferencesImpl.manager;
    exports._setCurrentEditingFile  = _setCurrentEditingFile;
    exports._setProjectSettingsFile = _setProjectSettingsFile;
    exports._smUserScopeLoading     = PreferencesImpl.smUserScopeLoading;
    exports._stateProjectLayer      = PreferencesImpl.stateProjectLayer;
    exports._reloadUserPrefs        = PreferencesImpl.reloadUserPrefs;
    
    // Public API
    
    // Context names for preference lookups
    exports.CURRENT_FILE        = CURRENT_FILE;
    exports.CURRENT_PROJECT     = CURRENT_PROJECT;
    
    exports.ready               = PreferencesImpl.managerReady;
    exports.getUserPrefFile     = getUserPrefFile;
    exports.get                 = PreferencesImpl.manager.get.bind(PreferencesImpl.manager);
    exports.set                 = PreferencesImpl.manager.set.bind(PreferencesImpl.manager);
    exports.save                = PreferencesImpl.manager.save.bind(PreferencesImpl.manager);
    exports.on                  = PreferencesImpl.manager.on.bind(PreferencesImpl.manager);
    exports.off                 = PreferencesImpl.manager.off.bind(PreferencesImpl.manager);
    exports.getPreference       = PreferencesImpl.manager.getPreference.bind(PreferencesImpl.manager);
    exports.getExtensionPrefs   = getExtensionPrefs;
    exports.getViewState        = getViewState;
    exports.setViewState        = setViewState;
    exports.finalize            = finalize;
    exports.addScope            = PreferencesImpl.manager.addScope.bind(PreferencesImpl.manager);
    exports.stateManager        = PreferencesImpl.stateManager;
    exports.FileStorage         = PreferencesBase.FileStorage;
    exports.SETTINGS_FILENAME   = PreferencesImpl.SETTINGS_FILENAME;
    exports.definePreference    = PreferencesImpl.manager.definePreference.bind(PreferencesImpl.manager);
    exports.fileChanged         = PreferencesImpl.manager.fileChanged.bind(PreferencesImpl.manager);
});
