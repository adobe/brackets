define(function (require, exports, module) {
    "use strict";

    var CommandManager          = brackets.getModule("command/CommandManager");
    var ExtensionUtils          = brackets.getModule("utils/ExtensionUtils");

    var UploadFilesDialog       = require("UploadFilesDialog");

    var CMD_UPLOAD_FILES_TEXT   = "Show Upload Files Dialog";
    var CMD_UPLOAD_FILES_ID     = "bramble.showUploadFiles";

    function showUploadFiles() {
        return UploadFilesDialog.show();
    }

    function addCommand() {
        CommandManager.register(CMD_UPLOAD_FILES_TEXT, CMD_UPLOAD_FILES_ID, showUploadFiles);
    }

    ExtensionUtils.loadStyleSheet(module, "styles.less");
    addCommand();
});
