/*
 * Copyright 2011 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define: false, PathUtils: false, FileError: false, brackets: false */

/**
 * Set of utilites for working with the code editor
 */
define(function (require, exports, module) {
    'use strict';

    require("thirdparty/path-utils/path-utils.min");
    require("thirdparty/CodeMirror2/mode/xml/xml");
    require("thirdparty/CodeMirror2/mode/javascript/javascript");
    require("thirdparty/CodeMirror2/mode/css/css");
    require("thirdparty/CodeMirror2/mode/less/less");
    require("thirdparty/CodeMirror2/mode/htmlmixed/htmlmixed");
    
    var Strings = require("strings");

    /**
     * @private
     * Given a file URL, determines the mode to use based
     * off the file's extension.
     * @param {string} fileUrl  A cannonical file URL to extract the extension from
     */
    function _getModeFromFileExtensions(fileUrl) {
        var ext = PathUtils.filenameExtension(fileUrl);
        //incase the arg is just the ext
        if (!ext) {
            ext = fileUrl;
        }
        if (ext.charAt(0) === '.') {
            ext = ext.substr(1);
        }

        switch (ext) {

        case "js":
            return "javascript";

        case "json":
            return {name: "javascript", json: true};

        case "css":
            return "css";

        case "less":
            return "less";

        case "html":
        case "htm":
            return "htmlmixed";

        default:
            console.log("Called EditorUtils.js _getModeFromFileExtensions with an unhandled file extension: " + ext);
            return "";
        }
    }

    /**
     * Change the current mode of the editor based on file extension 
     * @param {object} editor  An instance of a CodeMirror editor
     * @param {string} fileUrl  A cannonical file URL to extract the extension from
     */
    function setModeFromFileExtension(editor, fileUrl) {
        var mode = _getModeFromFileExtensions(fileUrl);
        editor.setOption("mode", mode);
    }

    
    /** @const */
    var LINE_ENDINGS_CRLF = "CRLF";
    /** @const */
    var LINE_ENDINGS_LF = "LF";
    
    /**
     * Returns the standard line endings for the current platform
     * @return {LINE_ENDINGS_CRLF|LINE_ENDINGS_LF}
     */
    function getPlatformLineEndings() {
        return brackets.isWin ? LINE_ENDINGS_CRLF : LINE_ENDINGS_LF;
    }
    
    /**
     * Scans the first 1000 chars of the text to determine how it encodes line endings. Returns
     * null if usage is mixed or if no line endings found.
     * @param {!string} text
     * @return {null|LINE_ENDINGS_CRLF|LINE_ENDINGS_LF}
     */
    function sniffLineEndings(text) {
        var subset = text.substr(0, 1000);  // (length is clipped to text.length)
        var hasCRLF = /\r\n/.test(subset);
        var hasLF = /[^\r]\n/.test(subset);
        
        if ((hasCRLF && hasLF) || (!hasCRLF && !hasLF)) {
            return null;
        } else {
            return hasCRLF ? LINE_ENDINGS_CRLF : LINE_ENDINGS_LF;
        }
    }


    function getFileErrorString(code) {
        // There are a few error codes that we have specific error messages for. The rest are
        // displayed with a generic "(error N)" message.
        var result;

        if (code === FileError.NOT_FOUND_ERR) {
            result = Strings.NOT_FOUND_ERR;
        } else if (code === FileError.NOT_READABLE_ERR) {
            result = Strings.NOT_READABLE_ERR;
        } else if (code === FileError.NO_MODIFICATION_ALLOWED_ERR) {
            result = Strings.NO_MODIFICATION_ALLOWED_ERR_FILE;
        } else {
            result = Strings.format(Strings.GENERIC_ERROR, code);
        }

        return result;
    }
    
    function showFileOpenError(code, path) {
        return brackets.showModalDialog(
            brackets.DIALOG_ID_ERROR,
            Strings.ERROR_OPENING_FILE_TITLE,
            Strings.format(
                Strings.ERROR_OPENING_FILE,
                path,
                getFileErrorString(code)
            )
        );
    }

    // Define public API
    exports.setModeFromFileExtension = setModeFromFileExtension;
    exports.LINE_ENDINGS_CRLF        = LINE_ENDINGS_CRLF;
    exports.LINE_ENDINGS_LF          = LINE_ENDINGS_LF;
    exports.getPlatformLineEndings   = getPlatformLineEndings;
    exports.sniffLineEndings         = sniffLineEndings;
    exports.showFileOpenError        = showFileOpenError;
    exports.getFileErrorString       = getFileErrorString;
});