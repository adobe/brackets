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
/*global define, $, brackets, PathUtils, window, Mustache */

/**
 *  Utilities functions for displaying update notifications
 *
 */
define(function (require, exports, module) {
    "use strict";
    
    var Dialogs              = require("widgets/Dialogs"),
        NativeApp            = require("utils/NativeApp"),
        PreferencesManager   = require("preferences/PreferencesManager"),
        Strings              = require("strings"),
        StringUtils          = require("utils/StringUtils"),
        Global               = require("utils/Global"),
        UpdateDialogTemplate = require("text!htmlContent/update-dialog.html"),
        UpdateListTemplate   = require("text!htmlContent/update-list.html");
    
    // Extract current build number from package.json version field 0.0.0-0
    var _buildNumber = Number(/-([0-9]+)/.exec(brackets.metadata.version)[1]);
    
    // PreferenceStorage
    var _prefs = PreferencesManager.getPreferenceStorage(module.id, {lastNotifiedBuildNumber: 0});
        
    // This is the last version we notified the user about. If checkForUpdate()
    // is called with "false", only show the update notification dialog if there
    // is an update newer than this one. This value is saved in preferences.
    var _lastNotifiedBuildNumber = _prefs.getValue("lastNotifiedBuildNumber");
    
    // Last time the versionInfoURL was fetched
    var _lastInfoURLFetchTime = _prefs.getValue("lastInfoURLFetchTime");

    // URL to load version info from. By default this is loaded no more than once a day. If 
    // you force an update check it is always loaded.
    
    // URL to fetch the version information.
    var _versionInfoURL;
    
    // Information on all posted builds of Brackets. This is an Array, where each element is 
    // an Object with the following fields:
    //
    //  {Number} buildNumber Number of the build
    //  {String} versionString String representation of the build number (ie "Sprint 14")
    //  {String} dateString Date of the build
    //  {String} releaseNotesURL URL of the release notes for this build
    //  {String} downloadURL URL to download this build
    //  {Array} newFeatures Array of new features in this build. Each entry has two fields:
    //      {String} name Name of the feature
    //      {String} description Description of the feature
    //
    // This array must be reverse sorted by buildNumber (newest build info first)
    
    /**
     * @private
     * Flag that indicates if we've added a click handler to the update notification icon.
     */
    var _addedClickHandler = false;
    
    /**
     * Get a data structure that has information for all builds of Brackets.
     *
     * If force is true, the information is always fetched from _versionInfoURL.
     * If force is false, we try to use cached information. If more than
     * 24 hours have passed since the last fetch, or if cached data can't be found, 
     * the data is fetched again.
     *
     * If new data is fetched and dontCache is false, the data is saved in preferences
     * for quick fetching later.
     */
    function _getUpdateInformation(force, dontCache) {
        var result = new $.Deferred();
        var fetchData = false;
        var data;
        
        // If force is true, always fetch
        if (force) {
            fetchData = true;
        }
        
        // If we don't have data saved in prefs, fetch
        data = _prefs.getValue("updateInfo");
        if (!data) {
            fetchData = true;
        }
        
        // If more than 24 hours have passed since our last fetch, fetch again
        if ((new Date()).getTime() > _lastInfoURLFetchTime + (1000 * 60 * 60 * 24)) {
            fetchData = true;
        }
        
        if (fetchData) {
            $.ajax(_versionInfoURL, {
                dataType: "text",
                cache: false,
                complete: function (jqXHR, status) {
                    if (status === "success") {
                        try {
                            data = JSON.parse(jqXHR.responseText);
                            if (!dontCache) {
                                _lastInfoURLFetchTime = (new Date()).getTime();
                                _prefs.setValue("lastInfoURLFetchTime", _lastInfoURLFetchTime);
                                _prefs.setValue("updateInfo", data);
                            }
                            result.resolve(data);
                        } catch (e) {
                            console.log("Error parsing version information");
                            console.log(e);
                            result.reject();
                        }
                    }
                },
                error: function (jqXHR, status, error) {
                    // When loading data for unit tests, the error handler is 
                    // called but the responseText is valid. Try to use it here,
                    // but *don't* save the results in prefs.
                    
                    if (!jqXHR.responseText) {
                        // Text is NULL or empty string, reject().
                        result.reject();
                        return;
                    }
                    
                    try {
                        data = JSON.parse(jqXHR.responseText);
                        result.resolve(data);
                    } catch (e) {
                        result.reject();
                    }
                }
            });
        } else {
            result.resolve(data);
        }
        
        return result.promise();
    }
    
    /**
     * Return a new array of version information that is newer than "buildNumber".
     * Returns null if there is no new version information.
     */
    function _stripOldVersionInfo(versionInfo, buildNumber) {
        // Do a simple linear search. Since we are going in reverse-chronological order, we
        // should get through the search quickly.
        var lastIndex = 0;
        var len = versionInfo.length;
        
        while (lastIndex < len) {
            if (versionInfo[lastIndex].buildNumber <= buildNumber) {
                break;
            }
            lastIndex++;
        }
        
        if (lastIndex > 0) {
            return versionInfo.slice(0, lastIndex);
        }
        
        // No new version info
        return null;
    }
    
    /**
     * Show a dialog that shows the update 
     */
    function _showUpdateNotificationDialog(updates) {
        Dialogs.showModalDialogUsingTemplate(Mustache.render(UpdateDialogTemplate, Strings))
            .done(function (id) {
                if (id === Dialogs.DIALOG_BTN_DOWNLOAD) {
                    // The first entry in the updates array has the latest download link
                    NativeApp.openURLInDefaultBrowser(updates[0].downloadURL);
                }
            });
        
        // Populate the update data
        var $dlg = $(".update-dialog.instance");
        var $updateList = $dlg.find(".update-info");
        var templateVars = $.extend(updates, Strings);
        
        $updateList.html(Mustache.render(UpdateListTemplate, templateVars));
        
        $dlg.on("click", "a", function (e) {
            var url = $(e.target).attr("data-url");
            
            if (url) {
                // Make sure the URL has a domain that we know about
                if (/(brackets\.io|github\.com|adobe\.com)$/i.test(PathUtils.parseUrl(url).hostname)) {
                    NativeApp.openURLInDefaultBrowser(url);
                }
            }
        });
    }
    
    /**
     * Check for updates. If "force" is true, update notification dialogs are always displayed 
     * (if an update is available). If "force" is false, the update notification is only 
     * displayed for newly available updates.
     * 
     * If an update is available, show the "update available" notification icon in the title bar.
     *
     * @param {boolean} force If true, always show the notification dialog.
     * @param {Object} _testValues This should only be used for testing purposes. See comments for details.
     * @return {$.Promise} jQuery Promise object that is resolved or rejected after the update check is complete.
     */
    function checkForUpdate(force, _testValues) {
        // The second param, if non-null, is an Object containing value overrides. Values
        // in the object temporarily override the local values. This should *only* be used for testing.
        // If any overrides are set, permanent changes are not made (including showing
        // the update notification icon and saving prefs).
        var oldValues;
        var usingOverrides = false; // true if any of the values are overridden.
        var result = new $.Deferred();
        
        if (_testValues) {
            oldValues = {};
            
            if (_testValues.hasOwnProperty("_buildNumber")) {
                oldValues._buildNumber = _buildNumber;
                _buildNumber = _testValues._buildNumber;
                usingOverrides = true;
            }

            if (_testValues.hasOwnProperty("_lastNotifiedBuildNumber")) {
                oldValues._lastNotifiedBuildNumber = _lastNotifiedBuildNumber;
                _lastNotifiedBuildNumber = _testValues._lastNotifiedBuildNumber;
                usingOverrides = true;
            }

            if (_testValues.hasOwnProperty("_versionInfoURL")) {
                oldValues._versionInfoURL = _versionInfoURL;
                _versionInfoURL = _testValues._versionInfoURL;
                usingOverrides = true;
            }
        }
        
        _getUpdateInformation(force || usingOverrides, usingOverrides)
            .done(function (versionInfo) {
                // Get all available updates
                var allUpdates = _stripOldVersionInfo(versionInfo, _buildNumber);
                
                // When running directly from GitHub source (as opposed to 
                // an installed build), _buildNumber is 0. In this case, if the
                // test is not forced, don't show the update notification icon or
                // dialog.
                if (_buildNumber === 0 && !force) {
                    result.resolve();
                    return;
                }
                
                if (allUpdates) {
                    // Always show the "update available" icon if any updates are available
                    var $updateNotification = $("#update-notification");
                    
                    $updateNotification.css("display", "inline-block");
                    if (!_addedClickHandler) {
                        _addedClickHandler = true;
                        $updateNotification.on("click", function () {
                            checkForUpdate(true);
                        });
                    }
                
                    // Only show the update dialog if force = true, or if the user hasn't been 
                    // alerted of this update
                    if (force || allUpdates[0].buildNumber >  _lastNotifiedBuildNumber) {
                        _showUpdateNotificationDialog(allUpdates);
                        
                        // Update prefs with the last notified build number
                        _lastNotifiedBuildNumber = allUpdates[0].buildNumber;
                        // Don't save prefs is we have overridden values
                        if (!usingOverrides) {
                            _prefs.setValue("lastNotifiedBuildNumber", _lastNotifiedBuildNumber);
                        }
                    }
                } else if (force) {
                    // No updates are available. If force == true, let the user know.
                    Dialogs.showModalDialog(
                        Dialogs.DIALOG_ID_ERROR,
                        Strings.NO_UPDATE_TITLE,
                        Strings.NO_UPDATE_MESSAGE
                    );
                }
        
                if (oldValues) {
                    if (oldValues.hasOwnProperty("_buildNumber")) {
                        _buildNumber = oldValues._buildNumber;
                    }
                    if (oldValues.hasOwnProperty("_lastNotifiedBuildNumber")) {
                        _lastNotifiedBuildNumber = oldValues._lastNotifiedBuildNumber;
                    }
                    if (oldValues.hasOwnProperty("_versionInfoURL")) {
                        _versionInfoURL = oldValues._versionInfoURL;
                    }
                }
                result.resolve();
            })
            .fail(function () {
                // Error fetching the update data. If this is a forced check, alert the user
                if (force) {
                    Dialogs.showModalDialog(
                        Dialogs.DIALOG_ID_ERROR,
                        Strings.ERROR_FETCHING_UPDATE_INFO_TITLE,
                        Strings.ERROR_FETCHING_UPDATE_INFO_MSG
                    );
                }
                result.reject();
            });
        
        return result.promise();
    }
    
    // Append locale to version info URL
    _versionInfoURL = brackets.config.update_info_url + brackets.getLocale() + ".json";
    
    // Define public API
    exports.checkForUpdate = checkForUpdate;
});
