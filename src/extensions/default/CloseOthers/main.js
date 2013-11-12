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
        workingSetCmenu   = Menus.getContextMenu(Menus.ContextMenuIds.WORKING_SET_MENU),
        close_others      = "file.close_others",
        close_above       = "file.close_above",
        close_below       = "file.close_below";
    
    /*
    This function collects files based on passing command (close_others/above/below) and execute 'FILE_CLOSE_LIST'.
    */
    function handleClose(cmd) {

        var targetIndex = dm.findInWorkingSet(dm.getCurrentDocument().file.fullPath),
            workingSet   = dm.getWorkingSet().slice(0),
            start = (cmd === close_below) ? (targetIndex + 1) : 0,
            end   = (cmd === close_above) ? (targetIndex) : (workingSet.length),
            docList = [],
            i;
        
        if (cmd === close_others) {
            end--;
            workingSet.splice(targetIndex, 1);
        }
        
        for (i = start; i < end; i++) {
            docList.push(workingSet[i]);
        }
        
        CommandManager.execute(Commands.FILE_CLOSE_LIST, {documentList: docList});
    }
    
    /*
    Pass 'command id' and it'll let you know, whether contextmenu item for that command is existing or not.
    */
    function isMenuThere(cmd) {
        return Menus.getMenuItem(workingSetCmenu.id + "-" + cmd) ? true : false;
    }
    
    /*
    This function is responsible for add/remove context menus based on current file selection.
    If there is only one file in working set, we won't show any of the three (Close Others, Close Others Above/Below).
    If there is more than one file, but selected file is first / last in working set, we will show only "Close Others".
    In other cases we will show all three.
    */
    $(workingSetCmenu).on("beforeContextMenuOpen", function () {
        var targetIndex = dm.findInWorkingSet(dm.getCurrentDocument().file.fullPath),
            closeOthers = (dm.getWorkingSet().length > 1),
            closeOthersAbove = (targetIndex > 0),
            closeOthersBelow = (targetIndex < dm.getWorkingSet().length - 1);
        
        if (closeOthersAbove && closeOthersBelow) {
            if (!isMenuThere(close_above)) {
                
                CommandManager.register(strings.CMD_FILE_CLOSE_ABOVE, close_above, function () {
                    handleClose(close_above);
                });
                workingSetCmenu.addMenuItem(close_above, "", Menus.AFTER, Commands.FILE_CLOSE);
            }
            
            if (!isMenuThere(close_below)) {
                CommandManager.register(strings.CMD_FILE_CLOSE_BELOW, close_below, function () {
                    handleClose(close_below);
                });
                workingSetCmenu.addMenuItem(close_below, "", Menus.BEFORE, Commands.FILE_SAVE);
            }
        } else {
            if (isMenuThere(close_above)) {
                workingSetCmenu.removeMenuItem(close_above);
            }
            
            if (isMenuThere(close_below)) {
                workingSetCmenu.removeMenuItem(close_below);
            }
        }
        
        if (closeOthers) {
            if (!isMenuThere(close_others)) {
                CommandManager.register(strings.CMD_FILE_CLOSE_OTHERS, close_others, function () {
                    handleClose(close_others);
                });
                
                if (isMenuThere(close_above)) { //if "Close Others Above" exists add "Close Others" next to it
                    workingSetCmenu.addMenuItem(close_others, "", Menus.AFTER, close_above);
                } else {                        //else add "Close Others" next to "Close"
                    workingSetCmenu.addMenuItem(close_others, "", Menus.AFTER, Commands.FILE_CLOSE);
                }
            }
        } else {
            if (isMenuThere(close_others)) {
                workingSetCmenu.removeMenuItem(close_others);
            }
        }
    });
});