/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global $, brackets, define */

define(function (require, exports, module) {
    "use strict";

    var Dialogs = require("widgets/Dialogs");
    var Strings = require("strings");
    var DocumentManager = require("document/DocumentManager");
    var ProjectManager = require("project/ProjectManager");

    var $input;

    function _message(message, path) {
        var $container = $("<div>");
        var $label = $("<p>")
            .text(message)
            .appendTo($container);
        $input = $("<input>")
            .val(path)
            .css("width", "550px")
            .appendTo($container);
        return $container;
    }

    function _showOpenFileDialog() {
        var doc = DocumentManager.getCurrentDocument();
        var path = doc ? doc.file.fullPath : ProjectManager.getProjectRoot().fullPath;
        return Dialogs.showModalDialog(
            Dialogs.DIALOG_ID_OPEN_FILE,
            Strings.OPEN_FILE_TITLE,
            _message(Strings.OPEN_FILE_MESSAGE, path)
        );
    }

    function _showOpenFolderDialog() {
        var path = ProjectManager.getProjectRoot().fullPath;
        return Dialogs.showModalDialog(
            Dialogs.DIALOG_ID_OPEN_FOLDER,
            Strings.OPEN_FOLDER_TITLE,
            _message(Strings.OPEN_FOLDER_MESSAGE, path)
        );
    }

    function _showOpenDialog(allowMultipleSelection, chooseDirectory, title, initialPath, fileTypes, callback) {
        var handler = chooseDirectory ? _showOpenFolderDialog : _showOpenFileDialog;
        var r = handler();
        $input.select().focus();
        r.then(function (id) {
            var paths = [];
            if (id === Dialogs.DIALOG_BTN_OK) {
                paths.push($input.val());
            }
            callback(undefined, paths);
        }, callback);
    }

    function _showConnectErrorDialog(callback) {
        var r = Dialogs.showModalDialog(
            Dialogs.DIALOG_ID_CONNECT,
            Strings.ERROR_PROXY_SERVER_TITLE,
            Strings.ERROR_PROXY_SERVER
        );
        r.then(function (id) {
            callback(undefined);
        }, callback);
    }

    function init() {
        brackets.fs.showOpenDialog = _showOpenDialog;
        brackets.fs.showConnectErrorDialog = _showConnectErrorDialog;
    }

    exports.init = init;
});