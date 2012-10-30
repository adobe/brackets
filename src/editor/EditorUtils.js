/*
 * Copyright (c) 2012 Adobe Systems Incorporated. All rights reserved.
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
/*global define, PathUtils, FileError, brackets */

/**
 * Set of utilites for working with the code editor
 */
define(function (require, exports, module) {
    "use strict";

    require("thirdparty/path-utils/path-utils.min");
    require("thirdparty/CodeMirror2/mode/xml/xml");
    require("thirdparty/CodeMirror2/mode/javascript/javascript");
    require("thirdparty/CodeMirror2/mode/css/css");
    require("thirdparty/CodeMirror2/mode/less/less");
    require("thirdparty/CodeMirror2/mode/htmlmixed/htmlmixed");
    require("thirdparty/CodeMirror2/mode/clike/clike");
    require("thirdparty/CodeMirror2/mode/php/php");
    require("thirdparty/CodeMirror2/mode/coffeescript/coffeescript");
    require("thirdparty/CodeMirror2/mode/clojure/clojure");
    require("thirdparty/CodeMirror2/mode/perl/perl");
    require("thirdparty/CodeMirror2/mode/ruby/ruby");
    require("thirdparty/CodeMirror2/mode/lua/lua");
    require("thirdparty/CodeMirror2/mode/mysql/mysql");
    require("thirdparty/CodeMirror2/mode/diff/diff");
    require("thirdparty/CodeMirror2/mode/markdown/markdown");
    require("thirdparty/CodeMirror2/mode/yaml/yaml");

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
        if (ext.charAt(0) === ".") {
            ext = ext.substr(1);
        }
        
        // Make checks below case-INsensitive
        ext = ext.toLowerCase();

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
        case "shtm":
        case "shtml":
        case "xhtml":
        case "cfm":
        case "cfml":
        case "cfc":
            return "htmlmixed";

        case "svg":
        case "xml":
        case "wxs":  // Wix XML extensions - used in Brackets installer
        case "wxl":
            return "xml";

        case "php":
        case "php3":
        case "php4":
        case "php5":
        case "phtm":
        case "phtml":
            return "php";

        case "cc":
        case "cp":
        case "cpp":
        case "c++":
        case "cxx":
        case "hh":
        case "hpp":
        case "hxx":
        case "h++":
        case "ii":
            return "text/x-c++src";

        case "c":
        case "h":
        case "i":
            return "text/x-csrc";

        case "cs":
            return "text/x-csharp";

        case "java":
            return "text/x-java";

        case "coffee":
            return "coffeescript";

        case "clj":
            return "clojure";

        case "pl":
            return "perl";

        case "rb":
            return "ruby";
        
        case "lua":
            return "lua";

        case "sql":
            return "mysql";

        case "diff":
        case "patch":
            return "diff";

        case "md":
        case "markdown":
            return "markdown";
        
        case "yaml":
        case "yml":
            return "yaml";

        default:
            console.log("Called EditorUtils.js _getModeFromFileExtensions with an unhandled file extension: " + ext);
            return "";
        }
    }

    // Define public API
    exports.getModeFromFileExtension = getModeFromFileExtension;
});