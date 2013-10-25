/*
 * Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
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
/*global define, $, brackets, window, document */

define(function (require, exports, module) {
    "use strict";

    var Menus             = brackets.getModule("command/Menus"),
        CommandManager    = brackets.getModule("command/CommandManager"),
        Commands          = brackets.getModule("command/Commands"),
        dm                = brackets.getModule("document/DocumentManager"),
        docCH             = brackets.getModule("document/DocumentCommandHandlers"),
        strings           = brackets.getModule("i18n!nls/strings"),
        settings          = JSON.parse(require("text!settings.json")),
        working_set_cmenu = Menus.getContextMenu(Menus.ContextMenuIds.WORKING_SET_MENU),
        close_others      = "file.close_others",
        close_above       = "file.close_above",
        close_below       = "file.close_below";

    function handleClose(mode) {

        var targetIndex = dm.findInWorkingSet(dm.getCurrentDocument().file.fullPath),
            workingSet   = dm.getWorkingSet().slice(0),
            start = (mode === close_below) ? (targetIndex + 1) : 0,
            end   = (mode === close_above) ? (targetIndex) : (workingSet.length),
            docList = [],
            i;
        
        if (mode === close_others) {
            end--;
            workingSet.splice(targetIndex, 1);
        }
        
        for (i = start; i < end; i++) {
            docList.push(workingSet[i]);
        }
        
        CommandManager.execute(Commands.FILE_CLOSE_LIST, {documentList: docList});
    }

    if (settings.close_below) {
        CommandManager.register(strings.CMD_FILE_CLOSE_BELOW, close_below, function () {
            handleClose(close_below);
        });
        working_set_cmenu.addMenuItem(close_below, "", Menus.AFTER, Commands.FILE_CLOSE);
    }

    if (settings.close_others) {
        CommandManager.register(strings.CMD_FILE_CLOSE_OTHERS, close_others, function () {
            handleClose(close_others);
        });
        working_set_cmenu.addMenuItem(close_others, "", Menus.AFTER, Commands.FILE_CLOSE);
    }

    if (settings.close_above) {
        CommandManager.register(strings.CMD_FILE_CLOSE_ABOVE, close_above, function () {
            handleClose(close_above);
        });
        working_set_cmenu.addMenuItem(close_above, "", Menus.AFTER, Commands.FILE_CLOSE);
    }
});