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

    // Define public API
    exports.setModeFromFileExtension = setModeFromFileExtension;
});