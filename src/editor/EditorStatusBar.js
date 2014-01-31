/*
 * Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
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
/*global define, $, window */

/**
 * Manages parts of the status bar related to the current editor's state.
 */
define(function (require, exports, module) {
    "use strict";
    
    // Load dependent modules
    var AppInit             = require("utils/AppInit"),
        EditorManager       = require("editor/EditorManager"),
        Editor              = require("editor/Editor").Editor,
        KeyEvent            = require("utils/KeyEvent"),
        StatusBar           = require("widgets/StatusBar"),
        Strings             = require("strings"),
        StringUtils         = require("utils/StringUtils");
    
    /* StatusBar indicators */
    var $languageInfo,
        $cursorInfo,
        $fileInfo,
        $indentType,
        $indentWidthLabel,
        $indentWidthInput;
    
    
    function _formatCountable(number, singularStr, pluralStr) {
        return StringUtils.format(number > 1 ? pluralStr : singularStr, number);
    }
    
    function _updateLanguageInfo(editor) {
        $languageInfo.text(editor.document.getLanguage().getName());
    }
    
    function _updateFileInfo(editor) {
        var lines = editor.lineCount();
        $fileInfo.text(_formatCountable(lines, Strings.STATUSBAR_LINE_COUNT_SINGULAR, Strings.STATUSBAR_LINE_COUNT_PLURAL));
    }
    
    function _updateIndentType() {
        var indentWithTabs = Editor.getUseTabChar();
        $indentType.text(indentWithTabs ? Strings.STATUSBAR_TAB_SIZE : Strings.STATUSBAR_SPACES);
        $indentType.attr("title", indentWithTabs ? Strings.STATUSBAR_INDENT_TOOLTIP_SPACES : Strings.STATUSBAR_INDENT_TOOLTIP_TABS);
        $indentWidthLabel.attr("title", indentWithTabs ? Strings.STATUSBAR_INDENT_SIZE_TOOLTIP_TABS : Strings.STATUSBAR_INDENT_SIZE_TOOLTIP_SPACES);
    }

    function _getIndentSize() {
        return Editor.getUseTabChar() ? Editor.getTabSize() : Editor.getSpaceUnits();
    }
    
    function _updateIndentSize() {
        var size = _getIndentSize();
        $indentWidthLabel.text(size);
        $indentWidthInput.val(size);
    }
    
    function _toggleIndentType() {
        Editor.setUseTabChar(!Editor.getUseTabChar());
        _updateIndentType();
        _updateIndentSize();
    }
    
    function _updateCursorInfo(event, editor) {
        editor = editor || EditorManager.getActiveEditor();

        // compute columns, account for tab size
        var cursor = editor.getCursorPos(true);
        
        var cursorStr = StringUtils.format(Strings.STATUSBAR_CURSOR_POSITION, cursor.line + 1, cursor.ch + 1);
        if (editor.hasSelection()) {
            // Show info about selection size when one exists
            var sels = editor.getSelections(),
                selStr;
            
            if (sels.length > 1) {
                selStr = StringUtils.format(Strings.STATUSBAR_SELECTION_MULTIPLE, sels.length);
            } else {
                var sel = sels[0];
                if (sel.start.line !== sel.end.line) {
                    var lines = sel.end.line - sel.start.line + 1;
                    if (sel.end.ch === 0) {
                        lines--;  // end line is exclusive if ch is 0, inclusive otherwise
                    }
                    selStr = _formatCountable(lines, Strings.STATUSBAR_SELECTION_LINE_SINGULAR, Strings.STATUSBAR_SELECTION_LINE_PLURAL);
                } else {
                    var cols = editor.getColOffset(sel.end) - editor.getColOffset(sel.start);  // end ch is exclusive always
                    selStr = _formatCountable(cols, Strings.STATUSBAR_SELECTION_CH_SINGULAR, Strings.STATUSBAR_SELECTION_CH_PLURAL);
                }
            }
            $cursorInfo.text(cursorStr + selStr);
        } else {
            $cursorInfo.text(cursorStr);
        }
    }
    
    function _changeIndentWidth(value) {
        $indentWidthLabel.removeClass("hidden");
        $indentWidthInput.addClass("hidden");
        
        // remove all event handlers from the input field
        $indentWidthInput.off("blur keyup");
        
        // restore focus to the editor
        EditorManager.focusEditor();
        
        if (!value || isNaN(value)) {
            return;
        }
        
        value = Math.max(Math.min(Math.floor(value), 10), 1);
        if (Editor.getUseTabChar()) {
            Editor.setTabSize(value);
        } else {
            Editor.setSpaceUnits(value);
        }

        // update indicator
        _updateIndentSize();

        // column position may change when tab size changes
        _updateCursorInfo();
    }
    
    function _onActiveEditorChange(event, current, previous) {
        if (previous) {
            $(previous).off(".statusbar");
            $(previous.document).off(".statusbar");
            previous.document.releaseRef();
        }
        
        if (!current) {
            StatusBar.hide();  // calls resizeEditor() if needed
        } else {
            StatusBar.show();  // calls resizeEditor() if needed
            
            $(current).on("cursorActivity.statusbar", _updateCursorInfo);
            $(current).on("optionChange.statusbar", function () {
                _updateIndentType();
                _updateIndentSize();
            });
            $(current).on("change.statusbar", function () {
                // async update to keep typing speed smooth
                window.setTimeout(function () { _updateFileInfo(current); }, 0);
            });
            
            current.document.addRef();
            $(current.document).on("languageChanged.statusbar", function () { _updateLanguageInfo(current); });
            
            _updateCursorInfo(null, current);
            _updateLanguageInfo(current);
            _updateFileInfo(current);
            _updateIndentType();
            _updateIndentSize();
        }
    }
    
    function _init() {
        $languageInfo       = $("#status-language");
        $cursorInfo         = $("#status-cursor");
        $fileInfo           = $("#status-file");
        $indentType         = $("#indent-type");
        $indentWidthLabel   = $("#indent-width-label");
        $indentWidthInput   = $("#indent-width-input");
        
        // indentation event handlers
        $indentType.on("click", _toggleIndentType);
        $indentWidthLabel
            .on("click", function () {
                // update the input value before displaying
                $indentWidthInput.val(_getIndentSize());

                $indentWidthLabel.addClass("hidden");
                $indentWidthInput.removeClass("hidden");
                $indentWidthInput.focus();
        
                $indentWidthInput
                    .on("blur", function () {
                        _changeIndentWidth($indentWidthInput.val());
                    })
                    .on("keyup", function (event) {
                        if (event.keyCode === KeyEvent.DOM_VK_RETURN) {
                            $indentWidthInput.blur();
                        } else if (event.keyCode === KeyEvent.DOM_VK_ESCAPE) {
                            _changeIndentWidth(false);
                        }
                    });
            });

        $indentWidthInput.focus(function () { $indentWidthInput.select(); });

        _onActiveEditorChange(null, EditorManager.getActiveEditor(), null);
    }

    // Initialize: status bar focused listener
    $(EditorManager).on("activeEditorChange", _onActiveEditorChange);
    
    AppInit.htmlReady(_init);
});
