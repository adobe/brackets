/*
 * Copyright (c) 2014 - present Adobe Systems Incorporated. All rights reserved.
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
 * Generates the fully configured preferences systems used throughout Brackets. This is intended
 * to be essentially private implementation that can be overridden for tests.
 */
define(function (require, exports, module) {
    "use strict";

    var PreferencesBase = require("./PreferencesBase"),
        Async           = require("utils/Async"),

        // The SETTINGS_FILENAME is used with a preceding "." within user projects
        SETTINGS_FILENAME = "brackets.json",
        STATE_FILENAME    = "state.json",

        // User-level preferences
        userPrefFile = brackets.app.getApplicationSupportDirectory() + "/" + SETTINGS_FILENAME;

    /**
     * A deferred object which is used to indicate PreferenceManager readiness during the start-up.
     * @private
     * @type {$.Deferred}
     */
    var _prefManagerReadyDeferred = new $.Deferred();

    /**
     * A boolean property indicating if the user scope configuration file is malformed.
     */
    var userScopeCorrupt = false;

    function isUserScopeCorrupt() {
        return userScopeCorrupt;
    }

    /**
     * Promises to add scopes. Used at init time only.
     * @private
     * @type {Array.<$.Promise>}
     */
    var _addScopePromises = [];

    var manager = new PreferencesBase.PreferencesSystem();
    manager.pauseChangeEvents();

    // Create a Project scope
    var projectStorage          = new PreferencesBase.FileStorage(undefined, true),
        projectScope            = new PreferencesBase.Scope(projectStorage),
        projectPathLayer        = new PreferencesBase.PathLayer(),
        projectLanguageLayer    = new PreferencesBase.LanguageLayer();

    projectScope.addLayer(projectPathLayer);
    projectScope.addLayer(projectLanguageLayer);

    // Create a User scope
    var userStorage             = new PreferencesBase.FileStorage(userPrefFile, true),
        userScope               = new PreferencesBase.Scope(userStorage),
        userLanguageLayer       = new PreferencesBase.LanguageLayer();

    userScope.addLayer(userLanguageLayer);

    var userScopeLoading = manager.addScope("user", userScope);

    _addScopePromises.push(userScopeLoading);

    // Set up the .brackets.json file handling
    userScopeLoading
        .fail(function (err) {
            _addScopePromises.push(manager.addScope("user", new PreferencesBase.MemoryStorage(), {
                before: "default"
            }));

            if (err.name && err.name === "ParsingError") {
                userScopeCorrupt = true;
            }
        })
        .always(function () {
            _addScopePromises.push(manager.addScope("project", projectScope, {
                before: "user"
            }));

            // Session Scope is for storing prefs in memory only but with the highest precedence.
            _addScopePromises.push(manager.addScope("session", new PreferencesBase.MemoryStorage()));

            Async.waitForAll(_addScopePromises)
                .always(function () {
                    _prefManagerReadyDeferred.resolve();
                });
        });


    // "State" is stored like preferences but it is not generally intended to be user-editable.
    // It's for more internal, implicit things like window size, working set, etc.
    var stateManager = new PreferencesBase.PreferencesSystem();
    var userStateFile = brackets.app.getApplicationSupportDirectory() + "/" + STATE_FILENAME;
    var smUserScope = new PreferencesBase.Scope(new PreferencesBase.FileStorage(userStateFile, true, true));
    var stateProjectLayer = new PreferencesBase.ProjectLayer();
    smUserScope.addLayer(stateProjectLayer);
    var smUserScopeLoading = stateManager.addScope("user", smUserScope);


    // Listen for times where we might be unwatching a root that contains one of the user-level prefs files,
    // and force a re-read of the file in order to ensure we can write to it later (see #7300).
    function _reloadUserPrefs(rootDir) {
        var prefsDir = brackets.app.getApplicationSupportDirectory() + "/";
        if (prefsDir.indexOf(rootDir.fullPath) === 0) {
            manager.fileChanged(userPrefFile);
            stateManager.fileChanged(userStateFile);
        }
    }

    // Semi-Public API. Use this at your own risk. The public API is in PreferencesManager.
    exports.manager             = manager;
    exports.projectStorage      = projectStorage;
    exports.projectPathLayer    = projectPathLayer;
    exports.userScopeLoading    = userScopeLoading;
    exports.stateManager        = stateManager;
    exports.stateProjectLayer   = stateProjectLayer;
    exports.smUserScopeLoading  = smUserScopeLoading;
    exports.userPrefFile        = userPrefFile;
    exports.isUserScopeCorrupt  = isUserScopeCorrupt;
    exports.managerReady        = _prefManagerReadyDeferred.promise();
    exports.reloadUserPrefs     = _reloadUserPrefs;
    exports.STATE_FILENAME      = STATE_FILENAME;
    exports.SETTINGS_FILENAME   = SETTINGS_FILENAME;
});
