/*
 * Copyright 2011 Adobe Systems Incorporated. All Rights Reserved.
 */

/**
 * Set of utilites for working with the code editor
 */
define(function(require, exports, module) {

    require("thirdparty/path-utils/path-utils.min");
    require("thirdparty/CodeMirror2/mode/xml/xml");
    require("thirdparty/CodeMirror2/mode/javascript/javascript");
    require("thirdparty/CodeMirror2/mode/css/css");
    require("thirdparty/CodeMirror2/mode/less/less");
    require("thirdparty/CodeMirror2/mode/htmlmixed/htmlmixed");
    
    var Strings = require("strings");

    /**
     * Change the current mode of the editor based on file extension 
     * @param {object} editor  An instance of a CodeMirror editor
     * @param {string} fileUrl  A cannonical file URL to extract the extension from
     */
    function setModeFromFileExtension( editor, fileUrl ) {
        var mode = _getModeFromFileExtensions( fileUrl );
        editor.setOption("mode", mode);
    }

    /**
     * @private
     * Given a file URL, determines the mode to use based
     * off the files extensions.
     * @param {string} fileUrl  A cannonical file URL to extract the extension from
     */
    function _getModeFromFileExtensions( fileUrl ) {
        var ext = PathUtils.filenameExtension( fileUrl );
        //incase the arg is just the ext
        if( !ext )
            ext = fileUrl; 
        if( ext.charAt(0) == '.' )
            ext = ext.substr(1);

        switch( ext ) {

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

    function showFileOpenError(code, path) {
        return brackets.showModalDialog(
              brackets.DIALOG_ID_ERROR
            , Strings.ERROR_OPENING_FILE_TITLE
            , Strings.format(
                    Strings.ERROR_OPENING_FILE
                  , path
                  , getFileErrorString(code))
        );
    }

    function getFileErrorString(code) {
        // There are a few error codes that we have specific error messages for. The rest are
        // displayed with a generic "(error N)" message.
        var result;

        if (code == FileError.NOT_FOUND_ERR)
            result = Strings.NOT_FOUND_ERR;
        else if (code == FileError.NOT_READABLE_ERR)
            result = Strings.NOT_READABLE_ERR;
        else if (code == FileError.NO_MODIFICATION_ALLOWED_ERR)
            result = Strings.NO_MODIFICATION_ALLOWED_ERR_FILE;
        else
            result = Strings.format(Strings.GENERIC_ERROR, code);

        return result;
    }

    // Define public API
    exports.setModeFromFileExtension = setModeFromFileExtension;
    exports.showFileOpenError        = showFileOpenError;
    exports.getFileErrorString       = getFileErrorString;
});