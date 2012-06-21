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


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, brackets, $, window */

define(function (require, exports, module) {
    'use strict';
    
    var ExtensionUtils  = brackets.getModule("utils/ExtensionUtils"),
        EditorManager   = brackets.getModule("editor/EditorManager"),
        Async           = brackets.getModule("utils/Async"),
        CommandManager  = brackets.getModule("command/CommandManager"),
        Menus           = brackets.getModule("command/Menus");
    
    var theme = "default",
        stylesLoaded = false,
        cmd,
        $links = [];
    
    function _updateCodeMirrorTheme() {
        var editor = EditorManager.getCurrentFullEditor();
        
        if (editor) {
            editor._codeMirror.setOption("theme", theme);
        }
    }

    function toggleMoonMode() {
        if (theme === "default") {
            theme = "monokai";
            $(EditorManager).on("focusedEditorChange", _updateCodeMirrorTheme);
            
            Async.doInParallel(["monokai.css", "theme.css"], function (file) {
                var result = new $.Deferred(),
                    loadResult = ExtensionUtils.loadStyleSheet(module, file).done(function ($link) {
                        $links.push($link);
                    }).pipe(result.resolve, result.reject);
                
                return result.promise();
            }).done(function () {
                _updateCodeMirrorTheme();
            });
            
            cmd.setChecked(true);
        } else {
            theme = "default";
            $(EditorManager).off("focusedEditorChange", _updateCodeMirrorTheme);
            _updateCodeMirrorTheme();
            
            $links.forEach(function ($link) {
                $link.remove();
            });
            
            $links = [];
            
            cmd.setChecked(false);
        }
    }
    
    // init command, menu
    var THEME_MOON_MODE = "theme.moon_mode";
    cmd = CommandManager.register("Moon Mode", THEME_MOON_MODE, toggleMoonMode);

    var menu = Menus.getMenu(Menus.AppMenuBar.VIEW_MENU);
    menu.addMenuItem(THEME_MOON_MODE);
});
