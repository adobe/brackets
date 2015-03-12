/*
 * Copyright (c) 2015 Adobe Systems Incorporated. All rights reserved.
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

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, Mustache */

define(function (require, exports, module) {
    "use strict";
    
    var AppInit                      = require("utils/AppInit"),
        PreferencesManager           = require("preferences/PreferencesManager"),
        Strings                      = require("strings"),
        Dialogs                      = require("widgets/Dialogs"),
        HealthDataNotificationDialog = require("text!htmlContent/healthdata-notification-dialog.html");
    
    PreferencesManager.definePreference("healthDataNotification", "number", 0);
    
    var prefs = PreferencesManager.getExtensionPrefs("healthData");
    /**
    * Show dialog for fist time to the user regarding log capturing by Brackets
    */
    
    function showDialogHealthDataNotification() {
        var template = Mustache.render(HealthDataNotificationDialog, {Strings: Strings});
        Dialogs.showModalDialogUsingTemplate(template).done(function (id) {
            PreferencesManager.setViewState("healthDataNotification", (new Date()).getTime());
     
            if (id === Dialogs.DIALOG_BTN_OK) {
                prefs.set("healthDataTracking", true);
            } else if (id === Dialogs.DIALOG_BTN_CANCEL) {
                prefs.set("healthDataTracking", false);
            }
        });
    }
    
    AppInit.appReady(function () {
        // check for showing the HealthData Notification to the user. It will be shown one time.
        var isShown = PreferencesManager.getViewState("healthDataNotification");
        
        if (!isShown) {
            showDialogHealthDataNotification();
        }
        
    });
    
    exports.showDialogHealthDataNotification = showDialogHealthDataNotification;
                                     
});