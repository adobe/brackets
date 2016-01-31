/*
 * Copyright (c) 2015 - present Adobe Systems Incorporated. All rights reserved.
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

/*jslint vars: true, plusplus: true, devel: true, nomen: true,  regexp: true, indent: 4, maxerr: 50 */
/*global define, brackets*/

define(function (require, exports, module) {
    "use strict";

    var AppInit                 = brackets.getModule("utils/AppInit"),
        HealthLogger            = brackets.getModule("utils/HealthLogger"),
        Menus                   = brackets.getModule("command/Menus"),
        CommandManager          = brackets.getModule("command/CommandManager"),
        Strings                 = brackets.getModule("strings"),
        Commands                = brackets.getModule("command/Commands"),
        PreferencesManager      = brackets.getModule("preferences/PreferencesManager"),

        HealthDataNotification  = require("HealthDataNotification"),  // self-initializes to show first-launch notification
        HealthDataManager       = require("HealthDataManager"),  // self-initializes timer to send data
        HealthDataPopup         = require("HealthDataPopup");

    var menu            = Menus.getMenu(Menus.AppMenuBar.HELP_MENU),
        healthDataCmdId = "healthData.healthDataStatistics";

    // Handles the command execution for Health Data menu item
    function handleHealthDataStatistics() {
        HealthDataNotification.handleHealthDataStatistics();
    }

    // Register the command and add the menu item for the Health Data Statistics
    function addCommand() {
        CommandManager.register(Strings.CMD_HEALTH_DATA_STATISTICS, healthDataCmdId, handleHealthDataStatistics);

        menu.addMenuItem(healthDataCmdId, "", Menus.AFTER, Commands.HELP_SHOW_EXT_FOLDER);
        menu.addMenuDivider(Menus.AFTER, Commands.HELP_SHOW_EXT_FOLDER);
    }

    function initTest() {
        brackets.test.HealthDataPreview      = require("HealthDataPreview");
        brackets.test.HealthDataManager      = HealthDataManager;
        brackets.test.HealthDataNotification = HealthDataNotification;
        brackets.test.HealthDataPopup        = HealthDataPopup;

        var prefs = PreferencesManager.getExtensionPrefs("healthData");
        HealthLogger.setHealthLogsEnabled(prefs.get("healthDataTracking"));
    }

    AppInit.appReady(function () {
        initTest();
        HealthLogger.init();
    });

    addCommand();

});
