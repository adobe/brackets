/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, window, document */

//Extension from: https://github.com/sathyamoorthi/brackets-close-others

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
            fileEntry   = dm.getWorkingSet().slice(0);

        CommandManager.execute(Commands.FILE_CLOSE_ALL, {promptOnly: true}).done(function () {
            
            var start = (mode === "close_below") ? (targetIndex + 1) : 0,
                end   = (mode === "close_above") ? (targetIndex) : (fileEntry.length),
                i;

            if (mode === "close_others") {
                fileEntry.splice(targetIndex, 1);
            }

            for (i = start; i < end; i++) {
                dm.removeFromWorkingSet(fileEntry[i]);
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