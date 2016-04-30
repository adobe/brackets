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

/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, window, Mustache */

/**
 *  Utilities functions for displaying update notifications
 *
 */
define(function (require, exports, module) {
    "use strict";

    var Dialogs              = require("widgets/Dialogs"),
        DefaultDialogs       = require("widgets/DefaultDialogs"),
        ExtensionManager     = require("extensibility/ExtensionManager"),
        PreferencesManager   = require("preferences/PreferencesManager"),
        NativeApp            = require("utils/NativeApp"),
        Strings              = require("strings"),
        UpdateDialogTemplate = require("text!htmlContent/update-dialog.html"),
        UpdateListTemplate   = require("text!htmlContent/update-list.html");

    // make sure the global brackets variable is loaded
    require("utils/Global");

    // duration of one day in milliseconds
    var ONE_DAY = 1000 * 60 * 60 * 24;

    // duration of two minutes in milliseconds
    var TWO_MINUTES = 1000 * 60 * 2;

    // Extract current build number from package.json version field 0.0.0-0
    var _buildNumber = Number(/-([0-9]+)/.exec(brackets.metadata.version)[1]);

    // Init default last build number
    PreferencesManager.stateManager.definePreference("lastNotifiedBuildNumber", "number", 0);

    // Init default last info URL fetch time
    PreferencesManager.stateManager.definePreference("lastInfoURLFetchTime", "number", 0);

    // Time of last registry check for update
    PreferencesManager.stateManager.definePreference("lastExtensionRegistryCheckTime", "number", 0);
    // Data about available updates in the registry
    PreferencesManager.stateManager.definePreference("extensionUpdateInfo", "Array", []);

    PreferencesManager.convertPreferences(module, {
        "lastNotifiedBuildNumber": "user",
        "lastInfoURLFetchTime": "user",
        "updateInfo": "user"
    }, true);

    // URL to load version info from. By default this is loaded no more than once a day. If
    // you force an update check it is always loaded.

    // Information on all posted builds of Brackets. This is an Array, where each element is
    // an Object with the following fields:
    //
    //  {Number} buildNumber Number of the build
    //  {String} versionString String representation of the build number (ie "Release 0.40")
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
     * Construct a new version update url with the given locale.
     *
     * @param {string=} locale - optional locale, defaults to 'brackets.getLocale()' when omitted.
     * @param {boolean=} removeCountryPartOfLocale - optional, remove existing country information from locale 'en-gb' => 'en'
     * return {string} the new version update url
     */
    function _getVersionInfoUrl(locale, removeCountryPartOfLocale) {
        locale = locale || brackets.getLocale();

        if (removeCountryPartOfLocale) {
            locale = locale.substring(0, 2);
        }

        return brackets.config.update_info_url + '?locale=' + locale;
    }

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
     * _versionInfoUrl is used for unit testing.
     */
    function _getUpdateInformation(force, dontCache, _versionInfoUrl) {
        // Last time the versionInfoURL was fetched
        var lastInfoURLFetchTime = PreferencesManager.getViewState("lastInfoURLFetchTime");

        var result = new $.Deferred();
        var fetchData = false;
        var data;

        // If force is true, always fetch
        if (force) {
            fetchData = true;
        }

        // If we don't have data saved in prefs, fetch
        data = PreferencesManager.getViewState("updateInfo");
        if (!data) {
            fetchData = true;
        }

        // If more than 24 hours have passed since our last fetch, fetch again
        if ((new Date()).getTime() > lastInfoURLFetchTime + ONE_DAY) {
            fetchData = true;
        }

        if (fetchData) {
            var lookupPromise = new $.Deferred(),
                localVersionInfoUrl;

            // If the current locale isn't "en" or "en-US", check whether we actually have a
            //   locale-specific update notification, and fall back to "en" if not.
            // Note: we check for both "en" and "en-US" to watch for the general case or
            //    country-specific English locale.  The former appears default on Mac, while
            //    the latter appears default on Windows.
            var locale = brackets.getLocale().toLowerCase();
            if (locale !== "en" && locale !== "en-us") {
                localVersionInfoUrl = _versionInfoUrl || _getVersionInfoUrl();
                $.ajax({
                    url: localVersionInfoUrl,
                    cache: false,
                    type: "HEAD"
                }).fail(function (jqXHR, status, error) {
                    // get rid of any country information from locale and try again
                    var tmpUrl = _getVersionInfoUrl(brackets.getLocale(), true);
                    if (tmpUrl !== localVersionInfoUrl) {
                        $.ajax({
                            url: tmpUrl,
                            cache: false,
                            type: "HEAD"
                        }).fail(function (jqXHR, status, error) {
                            localVersionInfoUrl = _getVersionInfoUrl("en");
                        }).done(function (jqXHR, status, error) {
                            localVersionInfoUrl = tmpUrl;
                        }).always(function (jqXHR, status, error) {
                            lookupPromise.resolve();
                        });
                    } else {
                        localVersionInfoUrl = _getVersionInfoUrl("en");
                        lookupPromise.resolve();
                    }
                }).done(function (jqXHR, status, error) {
                    lookupPromise.resolve();
                });
            } else {
                localVersionInfoUrl = _versionInfoUrl || _getVersionInfoUrl("en");
                lookupPromise.resolve();
            }

            lookupPromise.done(function () {
                $.ajax({
                    url: localVersionInfoUrl,
                    dataType: "json",
                    cache: false
                }).done(function (updateInfo, textStatus, jqXHR) {
                    if (!dontCache) {
                        lastInfoURLFetchTime = (new Date()).getTime();
                        PreferencesManager.setViewState("lastInfoURLFetchTime", lastInfoURLFetchTime);
                        PreferencesManager.setViewState("updateInfo", updateInfo);
                    }
                    result.resolve(updateInfo);
                }).fail(function (jqXHR, status, error) {
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
                });
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
        var $dlg        = $(".update-dialog.instance"),
            $updateList = $dlg.find(".update-info");

        updates.Strings = Strings;
        $updateList.html(Mustache.render(UpdateListTemplate, updates));
    }

    /**
     * Calculate state of notification everytime registries are downloaded - no matter who triggered the download
     */
    function _onRegistryDownloaded() {
        var availableUpdates = ExtensionManager.getAvailableUpdates();
        PreferencesManager.setViewState("extensionUpdateInfo", availableUpdates);
        PreferencesManager.setViewState("lastExtensionRegistryCheckTime", (new Date()).getTime());
        $("#toolbar-extension-manager").toggleClass("updatesAvailable", availableUpdates.length > 0);
    }

    /**
     *  Every 24 hours downloads registry information to check for update, but only if the registry download
     *  wasn't triggered by another action (like opening extension manager)
     *  If there isn't 24 hours elapsed from the last download, use cached information from last download
     *  to determine state of the update notification.
     */
    function checkForExtensionsUpdate() {
        var lastExtensionRegistryCheckTime = PreferencesManager.getViewState("lastExtensionRegistryCheckTime"),
            timeOfNextCheck = lastExtensionRegistryCheckTime + ONE_DAY,
            currentTime = (new Date()).getTime();

        // update icon according to previously saved information
        var availableUpdates = PreferencesManager.getViewState("extensionUpdateInfo");
        availableUpdates = ExtensionManager.cleanAvailableUpdates(availableUpdates);
        $("#toolbar-extension-manager").toggleClass("updatesAvailable", availableUpdates.length > 0);

        if (availableUpdates.length === 0) {
            // icon is gray, no updates available
            if (currentTime > timeOfNextCheck) {
                // downloadRegistry, will be resolved in _onRegistryDownloaded
                ExtensionManager.downloadRegistry().done(function () {
                    // schedule another check in 24 hours + 2 minutes
                    setTimeout(checkForExtensionsUpdate, ONE_DAY + TWO_MINUTES);
                });
            } else {
                // schedule the download of the registry in appropriate time
                setTimeout(checkForExtensionsUpdate, (timeOfNextCheck - currentTime) + TWO_MINUTES);
            }
        }
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
        // This is the last version we notified the user about. If checkForUpdate()
        // is called with "false", only show the update notification dialog if there
        // is an update newer than this one. This value is saved in preferences.
        var lastNotifiedBuildNumber = PreferencesManager.getViewState("lastNotifiedBuildNumber");

        // The second param, if non-null, is an Object containing value overrides. Values
        // in the object temporarily override the local values. This should *only* be used for testing.
        // If any overrides are set, permanent changes are not made (including showing
        // the update notification icon and saving prefs).
        var oldValues;
        var usingOverrides = false; // true if any of the values are overridden.
        var result = new $.Deferred();
        var versionInfoUrl;

        if (_testValues) {
            oldValues = {};

            if (_testValues.hasOwnProperty("_buildNumber")) {
                oldValues._buildNumber = _buildNumber;
                _buildNumber = _testValues._buildNumber;
                usingOverrides = true;
            }

            if (_testValues.hasOwnProperty("lastNotifiedBuildNumber")) {
                oldValues.lastNotifiedBuildNumber = lastNotifiedBuildNumber;
                lastNotifiedBuildNumber = _testValues.lastNotifiedBuildNumber;
                usingOverrides = true;
            }

            if (_testValues.hasOwnProperty("_versionInfoURL")) {
                versionInfoUrl = _testValues._versionInfoURL;
                usingOverrides = true;
            }
        }

        _getUpdateInformation(force || usingOverrides, usingOverrides, versionInfoUrl)
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

                    $updateNotification.css("display", "block");
                    if (!_addedClickHandler) {
                        _addedClickHandler = true;
                        $updateNotification.on("click", function () {
                            checkForUpdate(true);
                        });
                    }

                    // Only show the update dialog if force = true, or if the user hasn't been
                    // alerted of this update
                    if (force || allUpdates[0].buildNumber >  lastNotifiedBuildNumber) {
                        _showUpdateNotificationDialog(allUpdates);

                        // Update prefs with the last notified build number
                        lastNotifiedBuildNumber = allUpdates[0].buildNumber;
                        // Don't save prefs is we have overridden values
                        if (!usingOverrides) {
                            PreferencesManager.setViewState("lastNotifiedBuildNumber", lastNotifiedBuildNumber);
                        }
                    }
                } else if (force) {
                    // No updates are available. If force == true, let the user know.
                    Dialogs.showModalDialog(
                        DefaultDialogs.DIALOG_ID_ERROR,
                        Strings.NO_UPDATE_TITLE,
                        Strings.NO_UPDATE_MESSAGE
                    );
                }

                if (oldValues) {
                    if (oldValues.hasOwnProperty("_buildNumber")) {
                        _buildNumber = oldValues._buildNumber;
                    }
                    if (oldValues.hasOwnProperty("lastNotifiedBuildNumber")) {
                        lastNotifiedBuildNumber = oldValues.lastNotifiedBuildNumber;
                    }
                }
                result.resolve();
            })
            .fail(function () {
                // Error fetching the update data. If this is a forced check, alert the user
                if (force) {
                    Dialogs.showModalDialog(
                        DefaultDialogs.DIALOG_ID_ERROR,
                        Strings.ERROR_FETCHING_UPDATE_INFO_TITLE,
                        Strings.ERROR_FETCHING_UPDATE_INFO_MSG
                    );
                }
                result.reject();
            });

        return result.promise();
    }

    /**
     * Launches both check for Brackets update and check for installed extensions update
     */
    function launchAutomaticUpdate() {
        // launch immediately and then every 24 hours + 2 minutes
        checkForUpdate();
        checkForExtensionsUpdate();
        window.setInterval(checkForUpdate, ONE_DAY + TWO_MINUTES);
    }

    // Events listeners
    ExtensionManager.on("registryDownload", _onRegistryDownloaded);

    // Define public API
    exports.launchAutomaticUpdate = launchAutomaticUpdate;
    exports.checkForUpdate        = checkForUpdate;
});
