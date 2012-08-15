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
/*global define, $, brackets */

/**
 *  Utilities functions for displaying update notifications
 *
 */
define(function (require, exports, module) {
    "use strict";
    
    var Dialogs             = require("widgets/Dialogs"),
        NativeApp           = require("utils/NativeApp"),
        PreferencesManager  = require("preferences/PreferencesManager"),
        Strings             = require("strings"),
        BuildNumberJSON     = require("text!buildNumber.json");
    
    // Current build number.
    var _buildNumber = JSON.parse(BuildNumberJSON).buildNumber;
    
    // PreferenceStorage
    var _prefs = PreferencesManager.getPreferenceStorage(module.id, {lastNotifiedBuildNumber: 0});
        
    // This is the last version we notified the user about. If checkForUpdate()
    // is called with "false", only show the update notification dialog if there
    // is an update newer than this one. This value is saved in preferences.
    var _lastNotifiedBuildNumber = _prefs.getValue("lastNotifiedBuildNumber");

    // Information on all posted builds of Brackets. This is an Array, where each element is 
    // an Object with the following fields:
    //
    //  {Number} buildNumber Number of the build
    //  {String} versionString String representation of the build number (ie "Sprint 14")
    //  {String} releaseNotesURL URL of the release notes for this build
    //  {String} downloadURL URL to download this build
    //  {Array} newFeatures Array of new features in this build. Each entry has two fields:
    //      {String} name Name of the feature
    //      {String} description Description of the feature
    //
    // This array must be sorted by buildNumber
    var versionInfo;
    
    // TEMPORARY: structure describing version information. This should be fetched from a server.
    versionInfo = [
        {
            buildNumber: 93,
            versionString: "Sprint 12",
            releaseNotesURL: "https://github.com/adobe/brackets/wiki/Release-Notes:-Sprint-12",
            downloadURL: "https://github.com/adobe/brackets/downloads",
            newFeatures: [
                {
                    name: "Code Completion for HTML Attributes",
                    description: "Basic code hinting for HTML attribute names. Appears when you type Space within a tag (or press Ctrl+Space)."
                },
                {
                    name: "CEF3 Shell Enhancements",
                    description: "Add support for Live Development and fix a bunch of bugs. All unit tests now pass in the CEF3 shell."
                },
                {
                    name: "Other Enhancements",
                    description: "Add Move Line(s) Up/Down command. Add Save All command."
                }
            ]
        },
        {
            buildNumber: 72,
            versionString: "Sprint 11",
            releaseNotesURL: "https://github.com/adobe/brackets/wiki/Release-Notes:-Sprint-11",
            downloadURL: "https://github.com/adobe/brackets/downloads",
            newFeatures: [
                {
                    name: "Code Completion for HTML Tags",
                    description: "Basic code hinting for HTML tag names. Appears when you type \"<\" or Ctrl+Space."
                },
                {
                    name: "CEF3 Shell Enhancements",
                    description: "Fix bugs and get most unit tests passing in the experimental new shell, based on Chromium Embedding Framework 3 (Brackets currently uses CEF 1)."
                },
                {
                    name: "Performance Improvements",
                    description: "Improve performance when switching projects."
                }
            ]
        },
        {
            buildNumber: 56,
            versionString: "Sprint 10",
            releaseNotesURL: "https://github.com/adobe/brackets/wiki/Release-Notes:-Sprint-10",
            downloadURL: "https://github.com/adobe/brackets/downloads",
            newFeatures: [
                {
                    name: "JavaScript Quick Edit",
                    description: "Hitting Cmd/Ctrl-E on a function name opens all function definitions with that name in an inline editor."
                },
                {
                    name: "HTML Context Menus",
                    description: "This extends the previous menu API to support context menus."
                },
                {
                    name: "Extension Stylesheets",
                    description: "Extensions may now use the ExtensionUtils.loadStyleSheet() API to load a custom stylesheet for extension UI."
                }
            ]
        }
    ];
    
    /**
     * @private
     * Flag that indicates if we've added a click handler to the update notification icon.
     */
    var _addedClickHandler = false;
    
    /**
     * Get a data structure that has information for *all* builds of Brackets.
     */
    function _getVersionInformation() {
        // For now we're just using the hard-coded info. This will come from a server.
        var result = new $.Deferred().resolve(versionInfo);
        
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
        Dialogs.showModalDialog(Dialogs.DIALOG_ID_UPDATE)
            .done(function (id) {
                if (id === Dialogs.DIALOG_BTN_DOWNLOAD) {
                    // The first entry in the updates array has the latest download link
                    NativeApp.openURLInDefaultBrowser(updates[0].downloadURL);
                }
            });
        
        // Populate the update data
        var $dlg = $(".update-dialog.instance");
        var $updateList = $dlg.find(".update-info");
        
        // TODO: Use a template instead of hand-rolling HTML code
        updates.forEach(function (item, index) {
            var $features = $("<ul>");
            
            item.newFeatures.forEach(function (feature, index) {
                $features.append("<li><b>" + feature.name + "</b> - " + feature.description + "</li>");
            });
            
            var $item = $("<div>")
                // TODO: Put "Release Notes" into localizable string
                .append("<h3>" + item.versionString + " (<a href='#' data-url='" + item.releaseNotesURL + "'>Release Notes</a>)</h3>")
                .append($features)
                .appendTo($updateList);
        });
        
        $dlg.on("click", "a", function (e) {
            var url = $(e.target).attr("data-url");
            
            if (url) {
                NativeApp.openURLInDefaultBrowser(url);
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
     * @return None.
     */
    function checkForUpdate(force) {
        _getVersionInformation().done(
            function (versionInfo) {
                // Get all available updates
                var allUpdates = _stripOldVersionInfo(versionInfo, _buildNumber);
                
                if (allUpdates) {
                    // Always show the "update available" icon if any updates are available
                    var $updateNotification = $("#update-notification");
                    
                    $updateNotification.show();
                    if (!_addedClickHandler) {
                        _addedClickHandler = true;
                        $updateNotification.on("click", function () {
                            checkForUpdate(true);
                        });
                    }
                    
                    // Only show the update dialog if force = true, or if the user hasn't been 
                    // alerted of this update
                    if (force || _stripOldVersionInfo(allUpdates, _lastNotifiedBuildNumber)) {
                        _showUpdateNotificationDialog(allUpdates);
                        
                        // Update prefs with the last notified build number
                        _lastNotifiedBuildNumber = allUpdates[0].buildNumber;
                        _prefs.setValue("lastNotifiedBuildNumber", _lastNotifiedBuildNumber);
                    }
                } else if (force) {
                    // No updates are available. If force == true, let the user know.
                    Dialogs.showModalDialog(
                        Dialogs.DIALOG_ID_ERROR,
                        Strings.NO_UPDATE_TITLE,
                        Strings.NO_UPDATE_MESSAGE
                    );
                }
            }
        );
    }
    
    // Define public API
    exports.checkForUpdate = checkForUpdate;
});
