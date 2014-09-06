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

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, brackets, $, require, Mustache  */

define(function (require, exports, module) {
    "use strict";
    
    // Brackets modules
    var CommandManager      = brackets.getModule("command/CommandManager"),
        Menus               = brackets.getModule("command/Menus"),
        Dialogs             = brackets.getModule("widgets/Dialogs");

    // 1) Localization using Mustache templates
    // Load an html fragment using the require text plugin. Mustache will later
    // be used to localize some of the text
    var browserWrapperHtml  = require("text!htmlContent/sampleHTMLFragment.html");
    
    // 2) Localization for strings used by JS code
    // Load the string module for this extension. This references the strings.js
    // file next to this extension's main.js file. To access core brackets strings,
    // call brackets.getModule("strings") instead of require("strings").
    var Strings             = require("strings");


    // This sample command shows two modal dialogs, with strings localized using the
    // two approaches above
    function testCommand() {
        // 1) Mustache template
        // Localize the dialog using Strings as the datasource and use it as the dialog template
        var localizedTemplate = Mustache.render(browserWrapperHtml, Strings);
        Dialogs.showModalDialogUsingTemplate(localizedTemplate);
        
        // 2) String used by JS code
        alert(Strings.ALERT_MESSAGE);
    }


    // Register the command
    // Command ID is *not* localized, since it's not user visible and should stay constant.
    // Command name *is* localized, using approach (2) from above.
    var COMMAND_ID = "localizationExample.command";
    var command = CommandManager.register(Strings.COMMAND_NAME, COMMAND_ID, testCommand);

    // Add command to menu - menu will display the localized COMMAND_NAME we used above
    var menu = Menus.getMenu(Menus.AppMenuBar.EDIT_MENU);
    menu.addMenuItem(COMMAND_ID);
});
