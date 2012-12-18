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

/*jslint vars: true, plusplus: true, nomen: true, regexp: true, maxerr: 50 */
/*global define, brackets, $, document */

define(function (require, exports, module) {
    "use strict";

    console.log("Loading MORE support");

    brackets.libRequire("thirdparty/path-utils/path-utils.min");
    var Commands              = brackets.getModule("command/Commands"),
        CommandManager        = brackets.getModule("command/CommandManager"),
        EditorCommandHandlers = brackets.getModule("editor/EditorCommandHandlers"),
        EditorManager         = brackets.getModule("editor/EditorManager"),
        EditorUtils           = brackets.getModule("editor/EditorUtils"),
        Strings               = brackets.getModule("strings");
    
    // Adding CodeMirror mode "more"
    require("thirdparty/CodeMirror2/mode/more/more");
    
    // Monkey-patch EditorUtils.getModeFromFileExtension to use the file extension as the mode name if there is such a mode
    var previousGetModeFromFileExtension = EditorUtils.getModeFromFileExtension;
    EditorUtils.getModeFromFileExtension = function getModeFromFileExtension(fileUrl) {
        // ---8<--- The following is copied from EditorUtils.js ---8<--- //
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
        
        // -------- The following is new -------- //
        if (CodeMirror.modes[ext]) {
            return ext;
        }
        
        return previousGetModeFromFileExtension.apply(EditorUtils, arguments);
    }
    
    EditorCommandHandlers.modeSettings.more = {
        blockComment: {
            prefix: "/*",
            suffix: "*/"
        },
        lineComment: {
            prefix: "//"
        }
    };
});
