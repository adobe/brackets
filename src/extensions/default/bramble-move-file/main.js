/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, brackets */

define(function (require, exports, module) {
    "use strict";

    var CommandManager = brackets.getModule("command/CommandManager");
    var Commands       = brackets.getModule("command/Commands");
    var Menus          = brackets.getModule("command/Menus");
    var ExtensionUtils = brackets.getModule("utils/ExtensionUtils");
    var Strings        = brackets.getModule("strings");
    var MoveToDialog   = require("MoveToDialog");

    var MOVE_FILE = "bramble-move-file.moveFile";

    CommandManager.register(Strings.CMD_MOVE_FILE, MOVE_FILE, MoveToDialog.open);
    var menu = Menus.getContextMenu(Menus.ContextMenuIds.PROJECT_MENU);
    menu.addMenuItem(MOVE_FILE, null, Menus.AFTER, Commands.FILE_RENAME);

    ExtensionUtils.loadStyleSheet(module, "styles/style.css");
});
