/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, window, document */

//Extension from: https://github.com/sathyamoorthi/brackets-close-others

define(function (require, exports, module) {
    "use strict";

    var Menus = brackets.getModule("command/Menus");
    var CommandManager = brackets.getModule("command/CommandManager");
    var Commands = brackets.getModule("command/Commands");
    var working_set_cmenu = Menus.getContextMenu(Menus.ContextMenuIds.WORKING_SET_MENU);
    var dm = brackets.getModule("document/DocumentManager");
    var settings = JSON.parse(require("text!settings.json"));

    function handleClose(mode) {

        var currDmFullPath = dm.getCurrentDocument().file.fullPath;
        var workingSet = dm.getWorkingSet().slice(0), flag = false;

        CommandManager.execute(Commands.FILE_CLOSE_ALL, {promptOnly: true}).done(function () {
            
            if (mode === "close_others") {

                workingSet.forEach(function (value) {
                    if (value.fullPath !== currDmFullPath) {
                        dm.removeFromWorkingSet(value);
                    }
                });

            } else if (mode === "close_below") {

                workingSet.forEach(function (value) {
                    if (flag) {
                        dm.removeFromWorkingSet(value);
                    } else if (value.fullPath === currDmFullPath) {
                        flag = true;
                    }
                });

            } else if (mode === "close_above") {

                workingSet.forEach(function (value) {
                    if (value.fullPath === currDmFullPath) {
                        flag = true;
                    } else if (!flag) {
                        dm.removeFromWorkingSet(value);
                    }
                });
            }
        });
    }

    if (settings.close_below === "true") {
        CommandManager.register("Close Others Below", "file.close_below", function () {
            handleClose("close_below");
        });
        working_set_cmenu.addMenuItem("file.close_below", "", Menus.AFTER, Commands.FILE_CLOSE);
    }

    if (settings.close_others === "true") {
        CommandManager.register("Close Others", "file.close_others", function () {
            handleClose("close_others");
        });
        working_set_cmenu.addMenuItem("file.close_others", "", Menus.AFTER, Commands.FILE_CLOSE);
    }

    if (settings.close_above === "true") {
        CommandManager.register("Close Others Above", "file.close_above", function () {
            handleClose("close_above");
        });
        working_set_cmenu.addMenuItem("file.close_above", "", Menus.AFTER, Commands.FILE_CLOSE);
    }
});