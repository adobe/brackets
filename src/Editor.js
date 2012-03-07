/*
 * Copyright 2012 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, $: false, CodeMirror: false */

/**
 * Editor is a 1-to-1 wrapper for a CodeMirror editor instance. It layers on Brackets-specific
 * functionality and provides APIs that cleanly pass through the bits of CodeMirror that the rest
 * of our codebase may want to interact with.
 *
 * For now, direct access to the underlying CodeMirror object is provided -- but this is considered
 * deprecated.
 *  
 * The Editor object dispatches the following events:
 *    - onChange -- When the text of the editor changes (including due to undo/redo)
 *
 * These are jQuery events, so to listen for them you do something like this:
 *    $(editorInstance).on("eventname", handler);
 */
define(function (require, exports, module) {
    'use strict';
    
    // Load dependent modules
    // var FileUtils           = require("FileUtils"),
    //     DocumentManager     = require("DocumentManager"),
    //     EditorUtils         = require("EditorUtils"),
    //     Strings             = require("strings");
    
    
    /**
     * @private
     * Handle Tab key press.
     * @param {!CodeMirror} instance CodeMirror instance.
     */
    function _handleTabKey(instance) {
        // Tab key handling is done as follows:
        // 1. If the selection is before any text and the indentation is to the left of 
        //    the proper indentation then indent it to the proper place. Otherwise,
        //    add another tab. In either case, move the insertion point to the 
        //    beginning of the text.
        // 2. If the selection is after the first non-space character, and is not an 
        //    insertion point, indent the entire line(s).
        // 3. If the selection is after the first non-space character, and is an 
        //    insertion point, insert a tab character or the appropriate number 
        //    of spaces to pad to the nearest tab boundary.
        var from = instance.getCursor(true),
            to = instance.getCursor(false),
            line = instance.getLine(from.line),
            indentAuto = false,
            insertTab = false;
        
        if (from.line === to.line) {
            if (line.search(/\S/) > to.ch || to.ch === 0) {
                indentAuto = true;
            }
        }

        if (indentAuto) {
            var currentLength = line.length;
            CodeMirror.commands.indentAuto(instance);
            // If the amount of whitespace didn't change, insert another tab
            if (instance.getLine(from.line).length === currentLength) {
                insertTab = true;
                to.ch = 0;
            }
        } else if (instance.somethingSelected()) {
            CodeMirror.commands.indentMore(instance);
        } else {
            insertTab = true;
        }
        
        if (insertTab) {
            if (instance.getOption("indentWithTabs")) {
                CodeMirror.commands.insertTab(instance);
            } else {
                var i, ins = "", numSpaces = instance.getOption("tabSize");
                numSpaces -= to.ch % numSpaces;
                for (i = 0; i < numSpaces; i++) {
                    ins += " ";
                }
                instance.replaceSelection(ins, "end");
            }
        }
    }
    
    /**
     * @private
     * Handle left arrow, right arrow, backspace and delete keys when soft tabs are used.
     * @param {!CodeMirror} instance CodeMirror instance 
     * @param {number} direction Direction of movement: 1 for forward, -1 for backward
     * @param {function} functionName name of the CodeMirror function to call
     * @return {boolean} true if key was handled
     */
    function _handleSoftTabNavigation(instance, direction, functionName) {
        var handled = false;
        if (!instance.getOption("indentWithTabs")) {
            var cursor = instance.getCursor(),
                tabSize = instance.getOption("tabSize"),
                jump = cursor.ch % tabSize,
                line = instance.getLine(cursor.line);

            if (direction === 1) {
                jump = tabSize - jump;

                if (cursor.ch + jump > line.length) { // Jump would go beyond current line
                    return false;
                }

                if (line.substr(cursor.ch, jump).search(/\S/) === -1) {
                    instance[functionName](jump, "char");
                    handled = true;
                }
            } else {
                // Quick exit if we are at the beginning of the line
                if (cursor.ch === 0) {
                    return false;
                }
                
                // If we are on the tab boundary, jump by the full amount, 
                // but not beyond the start of the line.
                if (jump === 0) {
                    jump = tabSize;
                }

                // Search backwards to the first non-space character
                var offset = line.substr(cursor.ch - jump, jump).search(/\s*$/g);

                if (offset !== -1) { // Adjust to jump to first non-space character
                    jump -= offset;
                }

                if (jump > 0) {
                    instance[functionName](-jump, "char");
                    handled = true;
                }
            }
        }

        return handled;
    }
    

    /**
     * Creates a new CodeMirror editor instance containing the given text. The editor's mode is set
     * based on the given filename's extension (the actual file on disk is never examined).
     *
     * @param {!string} text  The text content of the editor.
     * @param {!string} mode  Syntax-highlighting language mode.
     *          See {@link EditorUtils#getModeFromFileExtension()}.
     * @param {!jQueryObject} container  Container to add the editor to.
     * @param {!Object<string, function(CodeMirror)} additionalKeys  ...TODO...
     * @return {CodeMirror} the newly created editor.
     */
    function Editor(text, mode, container, additionalKeys) {
        var self = this;
        
        var codeMirrorKeyMap = {
            "Tab"  : _handleTabKey,
            "Left" : function (instance) {
                if (!_handleSoftTabNavigation(instance, -1, "moveH")) {
                    CodeMirror.commands.goCharLeft(instance);
                }
            },
            "Right" : function (instance) {
                if (!_handleSoftTabNavigation(instance, 1, "moveH")) {
                    CodeMirror.commands.goCharRight(instance);
                }
            },
            "Backspace" : function (instance) {
                if (!_handleSoftTabNavigation(instance, -1, "deleteH")) {
                    CodeMirror.commands.delCharLeft(instance);
                }
            },
            "Delete" : function (instance) {
                if (!_handleSoftTabNavigation(instance, 1, "deleteH")) {
                    CodeMirror.commands.delCharRight(instance);
                }
            },
            "F3": "findNext",
            "Shift-F3": "findPrev",
            "Ctrl-H": "replace",
            "Shift-Delete": "cut",
            "Ctrl-Insert": "copy",
            "Shift-Insert": "paste",
        };
        for (var key in additionalKeys) {
            if (codeMirrorKeyMap.hasOwnProperty(key)) {
                console.log("Warning: overwriting standard Editor shortcut "+key);
            }
            codeMirrorKeyMap[key] = function(instance) {
                additionalKeys[key](self);
            }
        }
        
        // NOTE: CodeMirror doesn't actually require calling 'new',
        // but jslint does require it because of the capital 'C'
        this._codeMirror = new CodeMirror(container, {
            electricChars: false,
            indentUnit : 4,
            lineNumbers: true,
            matchBrackets: true,
            extraKeys: codeMirrorKeyMap,
            onKeyEvent: function (instance, event) {
                if (event.type === "keypress") {
                    var keyStr = String.fromCharCode(event.which || event.keyCode);
                    if (/[\]\}\)]/.test(keyStr)) {
                        // If the whole line is whitespace, auto-indent it
                        var lineNum = instance.getCursor().line;
                        var lineStr = instance.getLine(lineNum);
                        
                        if (!/\S/.test(lineStr)) {
                            // Need to do the auto-indent on a timeout to ensure
                            // the keypress is handled before auto-indenting.
                            // This is the same timeout value used by the
                            // electricChars feature in CodeMirror.
                            setTimeout(function () {
                                instance.indentLine(lineNum);
                            }, 75);
                        }
                    }
                }
                
                
                $(exports).triggerHandler("onKeyEvent", [instance, event]);
                return false;
            }
        });
        
        this._installEditorListeners();
        
        // Set code-coloring mode BEFORE populating with text, to avoid a flash of uncolored text
        this._codeMirror.setOption("mode", mode);
        
        // Initially populate with text. This will send a spurious change event, but that's ok
        // because no one's listening yet (and we clear the undo stack below)
        this.resetText(text);
    }
    
    Editor.prototype._installEditorListeners = function() {
        var self = this;
        
        this._codeMirror.setOption("onChange", function () {
            $(self).triggerHandler("onChange");
        });
    }
    
    
    /**
     * @return {string} The editor's current contents
     */
    Editor.prototype.getText = function() {
        return this._codeMirror.getValue();
    }
    /**
     * Sets the contents of the editor. Treated as an edit, so it adds an undo step and dispatches
     * onChange. Note: all line endings will be changed to LFs.
     * @param {!string} text
     */
    Editor.prototype.setText = function(text) {
        this._codeMirror.setValue(text);
    }
    /**
     * Sets the contents of the editor and clears the undo/redo history. Dispatches onChange.
     * @param {!string} text
     */
    Editor.prototype.resetText = function(text) {
        // This *will* fire a change event, but we clear the undo immediately afterward
        this._codeMirror.setValue(text);
        
        // Make sure we can't undo back to the empty state before setValue()
        this._codeMirror.clearHistory();
    }
    
    
    /**
     * Gets the current cursor position within the editor. If there is a selection, returns whichever
     * end of the range the cursor lies at.
     * @return !{line:number, ch:number}
     */
    Editor.prototype.getCursorPos = function() {
        return this._codeMirror.getCursor();
    }
    /**
     * Sets the cursor position within the editor. Removes any selection.
     * @param {number} line The 0 based line number.
     * @param {number} ch   The 0 based character position.
     */
    Editor.prototype.setCursorPos = function(line, ch) {
        this._codeMirror.setCursor(line, ch);
    }
    
    /**
     * Gets the current selection. Start is inclusive, end is exclusive. If there is no selection,
     * returns the current cursor position as both the start and end of the range (i.e. a selection
     * length of zero).
     * @return !{start:{line:number, ch:number}, end:{line:number, ch:number}}
     */
    Editor.prototype.getSelection = function() {
        var selStart = this._codeMirror.getCursor(true),
            selEnd = this._codeMirror.getCursor(false);
        return { start: selStart, end: selEnd };
    }
    
    
    
    /**
     * @private
     * NOTE: this is actually "semi-private": EditorManager also accesses this field.
     * @type {!CodeMirror}
     */
    Editor.prototype._codeMirror = null;



    // Define public API
    exports.Editor = Editor;
});
