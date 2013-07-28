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
        settings          = JSON.parse(require("text!settings.json")),
        working_set_cmenu = Menus.getContextMenu(Menus.ContextMenuIds.WORKING_SET_MENU);

    function handleClose(mode) {

        var targetIndex = dm.findInWorkingSet(dm.getCurrentDocument().file.fullPath),
            workingSet   = dm.getWorkingSet().slice(0),
            start = (mode === "close_below") ? (targetIndex + 1) : 0,
            end   = (mode === "close_above") ? (targetIndex) : (workingSet.length),
            unsavedDocs = [],
            doc,
            i;
        
        if (mode === "close_others") {
            end--;
            workingSet.splice(targetIndex, 1);
        }
        
        for (i = start; i < end; i++) {
            doc = dm.getOpenDocumentForPath(workingSet[i].fullPath);

            if (doc && doc.isDirty) {
                unsavedDocs.push(doc);
            }
        }

        CommandManager.execute(Commands.FILE_CLOSE_ALL, {promptOnly: true, unsavedDocs: unsavedDocs}).done(function () {
            for (i = start; i < end; i++) {
                dm.removeFromWorkingSet(workingSet[i]);
            }
        });
    }

    if (settings.close_below) {
        CommandManager.register("Close Others Below", "file.close_below", function () {
            handleClose("close_below");
        });
        working_set_cmenu.addMenuItem("file.close_below", "", Menus.AFTER, Commands.FILE_CLOSE);
    }

    if (settings.close_others) {
        CommandManager.register("Close Others", "file.close_others", function () {
            handleClose("close_others");
        });
        working_set_cmenu.addMenuItem("file.close_others", "", Menus.AFTER, Commands.FILE_CLOSE);
    }

    if (settings.close_above) {
        CommandManager.register("Close Others Above", "file.close_above", function () {
            handleClose("close_above");
        });
        working_set_cmenu.addMenuItem("file.close_above", "", Menus.AFTER, Commands.FILE_CLOSE);
    }
});