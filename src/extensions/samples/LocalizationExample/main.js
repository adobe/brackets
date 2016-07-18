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


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, brackets, require */


require.config({
    paths: {
        "text" : "lib/text",
        "i18n" : "lib/i18n"
    },
    locale: brackets.getLocale()
});

define(function (require, exports, module) {
    "use strict";

    // Brackets modules
    var CommandManager      = brackets.getModule("command/CommandManager"),
        Menus               = brackets.getModule("command/Menus"),
        Dialogs             = brackets.getModule("widgets/Dialogs"),
        Mustache            = brackets.getModule("thirdparty/mustache/mustache");

    // Load an html fragment using the require text plugin. Mustache will later
    // be used to localize some of the text
    var browserWrapperHtml  = require("text!htmlContent/sampleHTMLFragment.html");

    // Load the string module for this plugin. Not this references to the strings.js
    // file next to the main.js fiel for this plugin. To access core brackets strings
    // you would call brackets.getModule("strings") instead of require("strings")
    var Strings             = require("strings");


    // This sample command first shows an alert passing in a localized
    // string in JavaScript then it shows a localized HTML dialog.
    function testCommand() {
        alert(Strings.ALERT_MESSAGE);

        // Localize the dialog using Strings as the datasource and use it as the dialog template
        var localizedTemplate = Mustache.render(browserWrapperHtml, Strings);
        Dialogs.showModalDialogUsingTemplate(localizedTemplate);
    }


    // Register the command
    // A localized command name is used by passing in Strings.COMMAND_NAME
    var myCommandID = "localizationExample.command";
    CommandManager.register(Strings.COMMAND_NAME, myCommandID, testCommand);

    var menu = Menus.getMenu(Menus.AppMenuBar.EDIT_MENU);
    menu.addMenuItem(myCommandID, null, Menus.AFTER, myCommandID);
});
