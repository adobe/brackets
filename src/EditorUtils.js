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

    /**
     * @private
     * Given a file URL, determines the mode to use based
     * off the file's extension.
     * @param {string} fileUrl  A cannonical file URL to extract the extension from
     */
    function getModeFromFileExtension(fileUrl) {
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

    // Define public API
    exports.getModeFromFileExtension = getModeFromFileExtension;
});