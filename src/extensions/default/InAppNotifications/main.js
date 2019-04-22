/*
 * Copyright (c) 2019 - present Adobe Systems Incorporated. All rights reserved.
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
        Dialogs              = brackets.getModule("widgets/Dialogs"),
        DefaultDialogs       = brackets.getModule("widgets/DefaultDialogs"),
        PreferencesManager   = brackets.getModule("preferences/PreferencesManager"),
        ExtensionUtils       = brackets.getModule("utils/ExtensionUtils"),
        ExtensionManager     = brackets.getModule("extensibility/ExtensionManager"),
        Strings              = brackets.getModule("strings"),
        Mustache             = brackets.getModule("thirdparty/mustache/mustache"),
        HealthLogger         = brackets.getModule("utils/HealthLogger"),
        NotificationBarHtml  = require("text!htmlContent/notificationContainer.html");

    ExtensionUtils.loadStyleSheet(module, "styles/styles.css");

    // duration of one day in milliseconds
    var ONE_DAY = 1000 * 60 * 60 * 24;

    // duration of two minutes in milliseconds
    var TWO_MINUTES = 1000 * 60 * 2;

    // Init default last notification number
    PreferencesManager.stateManager.definePreference("lastHandledNotificationNumber", "number", 0);

    // Init default last info URL fetch time
    PreferencesManager.stateManager.definePreference("lastNotificationURLFetchTime", "number", 0);

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

        // PRERELEASE_BEGIN
        // The following code is needed for supporting notifications in prerelease,
        {
            if (locale) {
                if(locale.length > 2) {
                    locale = locale.substring(0, 2);
                }
                switch(locale)  {
                case "de":
                    break;
                case "es":
                    break;
                case "fr":
                    break;
                case "ja":
                    break;
                case "en":
                default:
                    locale = "en";
                }
                return brackets.config.notification_info_url.replace("<locale>", locale);
            }
        }
        // PRERELEASE_END

        return brackets.config.notification_info_url + '?locale=' + locale;
    }

    /**
     * Get a data structure that has information for all Brackets targeted notifications.
     *
     * _versionInfoUrl is used for unit testing.
     */
    function _getNotificationInformation(_versionInfoUrl) {
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
        if ((new Date()).getTime() > lastInfoURLFetchTime + ONE_DAY) {
            fetchData = true;
        }

        if (fetchData) {
            var lookupPromise = new $.Deferred(),
                localVersionInfoUrl;

            // If the current locale isn't "en" or "en-US", check whether we actually have a
            //   locale-specific notification target, and fall back to "en" if not.
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
    function checkForNotification() {
        var result = new $.Deferred();
        var versionInfoUrl;

        _getNotificationInformation(versionInfoUrl)
            .done(function (notificationInfo) {
                // Get all available notifications
                var notifications = notificationInfo.notifications;
                if (notifications && notifications.length > 0) {
                    // Only show the notification overlay if the user hasn't been
                    // alerted of this notification
                    if (_checkNotificationValidity(notifications[0])) {
                        if (notifications[0].silent) {
                            // silent notifications, to gather user validity based on filters
                            HealthLogger.sendAnalyticsData("notification", notifications[0].sequence, "handled");
                        } else {
                            showNotification(notifications[0]);
                        }
                    }
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
        var allExtensions = ExtensionManager.extensions,
            allExtnsMatched = true,
            userExtensionKeys = Object.keys(allExtensions).filter(function(k) {
                return allExtensions[k].installInfo.locationType === 'user';
            });

        if (!filters.extensions) {
            allExtnsMatched = userExtensionKeys.size === 0;
        } else if (filters.extensions.length === 0) {
            allExtnsMatched = userExtensionKeys.length > 0;
        } else {
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
        $notificationBarElement.find('script').remove();

        // Remove any STYLE tag to avoid styling impact on Brackets DOM
        $notificationBarElement.find('style').remove();

        cleanNotificationBar(); //Remove an already existing notification bar, if any
        $notificationBarElement.prependTo(".content");

        var $notificationBar = $('#notification-bar'),
            $notificationContent = $notificationBar.find('#content-container'),
            $closeIcon = $notificationBar.find('#close-icon');

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

});
