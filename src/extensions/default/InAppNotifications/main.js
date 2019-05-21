/*
 * Copyright (c) 2019 - present Adobe. All rights reserved.
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
 *  module for displaying in-app notifications
 *
 */
define(function (require, exports, module) {
    "use strict";

    var AppInit              = brackets.getModule("utils/AppInit"),
        PreferencesManager   = brackets.getModule("preferences/PreferencesManager"),
        ExtensionUtils       = brackets.getModule("utils/ExtensionUtils"),
        ExtensionManager     = brackets.getModule("extensibility/ExtensionManager"),
        HealthLogger         = brackets.getModule("utils/HealthLogger"),
        NotificationBarHtml  = require("text!htmlContent/notificationContainer.html");

    ExtensionUtils.loadStyleSheet(module, "styles/styles.css");

    // duration of one day in milliseconds
    var ONE_DAY = 1000 * 60 * 60 * 24;

    // Init default last notification number
    PreferencesManager.stateManager.definePreference("lastHandledNotificationNumber", "number", 0);

    // Init default last info URL fetch time
    PreferencesManager.stateManager.definePreference("lastNotificationURLFetchTime", "number", 0);

    /**
     * Constructs notification info URL for XHR
     *
     * @param {string=} localeParam - optional locale, defaults to 'brackets.getLocale()' when omitted.
     * @returns {string} the new notification info url
     */
    function _getVersionInfoUrl(localeParam) {

        var locale = localeParam || brackets.getLocale();

        if (locale.length > 2) {
            locale = locale.substring(0, 2);
        }

        return brackets.config.notification_info_url.replace("<locale>", locale);
    }

    /**
     * Get a data structure that has information for all Brackets targeted notifications.
     *
     * _notificationInfoUrl is used for unit testing.
     */
    function _getNotificationInformation(_notificationInfoUrl) {
        // Last time the versionInfoURL was fetched
        var lastInfoURLFetchTime = PreferencesManager.getViewState("lastNotificationURLFetchTime");

        var result = new $.Deferred();
        var fetchData = false;
        var data;

        // If we don't have data saved in prefs, fetch
        data = PreferencesManager.getViewState("notificationInfo");
        if (!data) {
            fetchData = true;
        }

        // If more than 24 hours have passed since our last fetch, fetch again
        if (Date.now() > lastInfoURLFetchTime + ONE_DAY) {
            fetchData = true;
        }

        if (fetchData) {
            var lookupPromise = new $.Deferred(),
                localNotificationInfoUrl;

            // If the current locale isn't "en" or "en-US", check whether we actually have a
            // locale-specific notification target, and fall back to "en" if not.
            var locale = brackets.getLocale().toLowerCase();
            if (locale !== "en" && locale !== "en-us") {
                localNotificationInfoUrl = _notificationInfoUrl || _getVersionInfoUrl();
                // Check if we can reach a locale specific notifications source
                $.ajax({
                    url: localNotificationInfoUrl,
                    cache: false,
                    type: "HEAD"
                }).fail(function (jqXHR, status, error) {
                    // Fallback to "en" locale
                    localNotificationInfoUrl = _getVersionInfoUrl("en");
                }).always(function (jqXHR, status, error) {
                    lookupPromise.resolve();
                });
            } else {
                localNotificationInfoUrl = _notificationInfoUrl || _getVersionInfoUrl("en");
                lookupPromise.resolve();
            }

            lookupPromise.done(function () {
                $.ajax({
                    url: localNotificationInfoUrl,
                    dataType: "json",
                    cache: false
                }).done(function (notificationInfo, textStatus, jqXHR) {
                    lastInfoURLFetchTime = (new Date()).getTime();
                    PreferencesManager.setViewState("lastNotificationURLFetchTime", lastInfoURLFetchTime);
                    PreferencesManager.setViewState("notificationInfo", notificationInfo);
                    result.resolve(notificationInfo);
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
     * Check for notifications, notification overlays are always displayed
     *
     * @return {$.Promise} jQuery Promise object that is resolved or rejected after the notification check is complete.
     */
    function checkForNotification(versionInfoUrl) {
        var result = new $.Deferred();

        _getNotificationInformation(versionInfoUrl)
            .done(function (notificationInfo) {
                // Get all available notifications
                var notifications = notificationInfo.notifications;
                if (notifications && notifications.length > 0) {
                    // Iterate through notifications and act only on the most recent
                    // applicable notification
                    notifications.every(function(notificationObj) {
                        // Only show the notification overlay if the user hasn't been
                        // alerted of this notification
                        if (_checkNotificationValidity(notificationObj)) {
                            if (notificationObj.silent) {
                                // silent notifications, to gather user validity based on filters
                                HealthLogger.sendAnalyticsData("notification", notificationObj.sequence, "handled");
                            } else {
                                showNotification(notificationObj);
                            }
                            // Break, we have acted on one notification already
                            return false;
                        }
                        // Continue, we haven't yet got a notification to act on
                        return true;
                    });
                }
                result.resolve();
            })
            .fail(function () {
                // Error fetching the update data. If this is a forced check, alert the user
                result.reject();
            });

        return result.promise();
    }

    function _checkPlatform(filters, _platform) {
        return !filters.platforms || filters.platforms.length === 0 || filters.platforms.indexOf(_platform) >=0;
    }

    function _checkBuild(filters, _build) {
        return !filters.builds || filters.builds.length === 0 || filters.builds.indexOf(_build) >=0;
    }

    function _checkVersion(filters, _version) {
        var re = new RegExp(filters.version);
        return re.exec(_version);
    }

    function _checkLocale(filters, _locale) {
        return !filters.locales || filters.locales.length === 0 || filters.locales.indexOf(_locale) >=0;
    }

    function _checkExpiry(expiry) {
        return Date.now() <= expiry;
    }

    function _checkExtensions(filters) {
        //if no property called extensions then it's a universal notification
        if (filters.extensions === undefined) {
            console.log("undefined");
            return true;
        }

        var allExtensions = ExtensionManager.extensions,
            allExtnsMatched = true,
            userExtensionKeys = Object.keys(allExtensions).filter(function(k) {
                return allExtensions[k].installInfo.locationType === 'user';
            });

        if (!filters.extensions) {
            console.log("null");
            //if property called extensions exists but has a falsy value
            //then number of user extensions must be zero
            allExtnsMatched = userExtensionKeys.length === 0;
        } else if (filters.extensions.length === 0) {
            console.log('[]');
            //if property called extensions exists but is an empty array
            //then number of user extensions must greater than zero
            allExtnsMatched = userExtensionKeys.length > 0;
        } else {
            //if property called extensions exists but is a non empty array
            //then notification is targetted to users having the fitered extensions
            var filteredExtns = filters.extensions,
                extnIterator = null;
            for (var i=0; i < filteredExtns.length; i++) {
                extnIterator = filteredExtns[i];
                if (userExtensionKeys.indexOf(extnIterator) === -1) {
                    allExtnsMatched = false;
                    break;
                }
            }
        }
        return allExtnsMatched;
    }

    function _checkNotificationValidity(notificationObj) {

        var filters = notificationObj.filters,
            _platform = brackets.getPlatformInfo(),
            _locale = brackets.getLocale(),
            _lastHandledNotificationNumber = PreferencesManager.getViewState("lastHandledNotificationNumber"),
            // Extract current build number from package.json version field 0.0.0-0
            _buildNumber = Number(/-([0-9]+)/.exec(brackets.metadata.version)[1]),
            _version = brackets.metadata.apiVersion;

        if(_locale.length > 2) {
            _locale = _locale.substring(0, 2);
        }

        return  notificationObj.sequence > _lastHandledNotificationNumber
                && _checkExpiry(notificationObj.expiry)
                && _checkPlatform(filters, _platform)
                && _checkLocale(filters, _locale)
                && _checkVersion(filters, _version)
                && _checkBuild(filters, _buildNumber)
                && _checkExtensions(filters);
    }


    /**
     * Removes and cleans up the notification bar from DOM
     */
    function cleanNotificationBar() {
        var $notificationBar = $('#notification-bar');
        if ($notificationBar.length > 0) {
            $notificationBar.remove();
        }
    }

    /**
     * Displays the Notification Bar UI
     * @param   {object} msgObj - json object containing message info to be displayed
     *
     */
    function showNotification(msgObj) {
        var $htmlContent = $(msgObj.html),
            $notificationBarElement = $(NotificationBarHtml);

        // Remove any SCRIPT tag to avoid secuirity issues
        $htmlContent.find('script').remove();

        // Remove any STYLE tag to avoid styling impact on Brackets DOM
        $htmlContent.find('style').remove();

        cleanNotificationBar(); //Remove an already existing notification bar, if any
        $notificationBarElement.prependTo(".content");

        var $notificationBar = $('#notification-bar'),
            $notificationContent = $notificationBar.find('.content-container'),
            $closeIcon = $notificationBar.find('.close-icon');

        $notificationContent.append($htmlContent);
        HealthLogger.sendAnalyticsData("notification", msgObj.sequence, "shown");

        // Click handlers on actionable elements
        if ($closeIcon.length > 0) {
            $closeIcon.click(function () {
                cleanNotificationBar();
                PreferencesManager.setViewState("lastHandledNotificationNumber", msgObj.sequence);
                HealthLogger.sendAnalyticsData("notification", msgObj.sequence, "dismissedByClose");
            });
        }

        if (msgObj.actionables) {
            $(msgObj.actionables).click(function () {
                cleanNotificationBar();
                PreferencesManager.setViewState("lastHandledNotificationNumber", msgObj.sequence);
                HealthLogger.sendAnalyticsData("notification", msgObj.sequence, "dismissedBy" + this.id);
            });
        }
    }


    AppInit.appReady(function () {
        checkForNotification();
    });

    // For unit tests only
    exports.checkForNotification = checkForNotification;
});
