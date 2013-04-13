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
/*global define, window, $, Mustache */

define(function (require, exports, module) {
    "use strict";
    
    var Dialogs           = require("widgets/Dialogs"),
        Strings           = require("strings"),
        Commands          = require("command/Commands"),
        CommandManager    = require("command/CommandManager"),
        ExtensionMgrView  = require("extensibility/ExtensionMgrView").ExtensionMgrView,
        ExtensionMgrModel = require("extensibility/ExtensionMgrModel").ExtensionMgrModel;
    
    var dialogTemplate    = require("text!extensibility/extension-mgr-dialog.html");

    /**
     * @private
     * Show a dialog that allows the user to browse and manage extensions.
     */
    function _showDialog() {
        Dialogs.showModalDialogUsingTemplate(
            Mustache.render(dialogTemplate, Strings)
        );
        
        var view = new ExtensionMgrView(new ExtensionMgrModel());
        view.$el.appendTo($(".extension-mgr-dialog .modal-body"));
    }
    
    CommandManager.register(Strings.CMD_EXTENSION_MANAGER, Commands.FILE_EXTENSION_MANAGER, _showDialog);
});
