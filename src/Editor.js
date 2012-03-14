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
 * For now, direct access to the underlying CodeMirror object is still possible via _codeMirror --
 * but this is considered deprecated and may go away.
 *  
 * The Editor object dispatches the following events:
 *    - change -- When the text of the editor changes (including due to undo/redo)
 *    - keyEvent -- When any key event happens in the editor (whether it changes the text or not).
 *          Event handlers are passed ({Editor}, {KeyboardEvent}). The 2nd arg is the raw DOM event.
 *          Note: most listeners will only want to respond when event.type === "keypress".
 *
 * These are jQuery events, so to listen for them you do something like this:
 *    $(editorInstance).on("eventname", handler);
 */
define(function (require, exports, module) {
    'use strict';
    
    
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
     * Checks if the user just typed a closing brace/bracket/paren, and considers automatically
     * back-indenting it if so.
     */
    function _checkElectricChars(jqEvent, editor, event) {
        var instance = editor._codeMirror;
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
    }
    

    /**
     * Creates a new CodeMirror editor instance containing the given text. The editor's mode is set
     * based on the given filename's extension (the actual file on disk is never examined).
     *
     * @param {!string} text  The text content of the editor.
     * @param {!string} mode  Syntax-highlighting language mode.
     *          See {@link EditorUtils#getModeFromFileExtension()}.
     * @param {!jQueryObject} container  Container to add the editor to.
     * @param {!Object<string, function(Editor)} additionalKeys  Mapping of keyboard shortcuts to
     *          custom handler functions. Mapping is in CodeMirror format, NOT in our KeyMap format.
     */
    function Editor(text, mode, container, additionalKeys) {
        var self = this;
        
        this._inlineWidgets = [];
        
        // Editor supplies some standard keyboard behavior extensions of its own
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
            "Shift-Insert": "paste"
        };
        
        // Merge in the additionalKeys we were passed
        function wrapEventHandler(externalHandler) {
            return function (instance) {
                externalHandler(self);
            };
        }
        var key;
        for (key in additionalKeys) {
            if (additionalKeys.hasOwnProperty(key)) {
                if (codeMirrorKeyMap.hasOwnProperty(key)) {
                    console.log("Warning: overwriting standard Editor shortcut " + key);
                }
                codeMirrorKeyMap[key] = wrapEventHandler(additionalKeys[key]);
            }
        }
        
        // Create the CodeMirror instance
        // (note: CodeMirror doesn't actually require using 'new', but jslint complains without it)
        this._codeMirror = new CodeMirror(container, {
            electricChars: false,   // we use our own impl of this to avoid CodeMirror bugs; see _checkElectricChars()
            indentUnit : 4,
            lineNumbers: true,
            matchBrackets: true,
            extraKeys: codeMirrorKeyMap
        });
        
        this._installEditorListeners();
        
        $(this).on("keyEvent", _checkElectricChars);
        
        // Set code-coloring mode BEFORE populating with text, to avoid a flash of uncolored text
        this._codeMirror.setOption("mode", mode);
        
        // Initially populate with text. This will send a spurious change event, but that's ok
        // because no one's listening yet (and we clear the undo stack below)
        this.resetText(text);
    }
    
    /**
     * Install singleton event handlers on the CodeMirror instance, translating them into multi-
     * listener-capable jQuery events on the Editor instance.
     */
    Editor.prototype._installEditorListeners = function () {
        var self = this;
        
        // FUTURE: if this list grows longer, consider making this a more generic mapping
        this._codeMirror.setOption("onChange", function () {
            $(self).triggerHandler("change");
        });
        this._codeMirror.setOption("onKeyEvent", function (instance, event) {
            $(self).triggerHandler("keyEvent", [self, event]);
            return false;   // false tells CodeMirror we didn't eat the event
        });
    };
    
    
    /** @return {string} The editor's current contents */
    Editor.prototype.getText = function () {
        return this._codeMirror.getValue();
    };
    
    /**
     * Sets the contents of the editor. Treated as an edit: adds an undo step and dispatches a
     * change event.
     * Note: all line endings will be changed to LFs.
     * @param {!string} text
     */
    Editor.prototype.setText = function (text) {
        this._codeMirror.setValue(text);
    };
    
    /**
     * Sets the contents of the editor and clears the undo/redo history. Dispatches a change event.
     * @param {!string} text
     */
    Editor.prototype.resetText = function (text) {
        // This *will* fire a change event, but we clear the undo immediately afterward
        this._codeMirror.setValue(text);
        
        // Make sure we can't undo back to the empty state before setValue()
        this._codeMirror.clearHistory();
    };
    
    
    /**
     * Gets the current cursor position within the editor. If there is a selection, returns whichever
     * end of the range the cursor lies at.
     * @return !{line:number, ch:number}
     */
    Editor.prototype.getCursorPos = function () {
        return this._codeMirror.getCursor();
    };
    
    /**
     * Sets the cursor position within the editor. Removes any selection.
     * @param {number} line The 0 based line number.
     * @param {number} ch   The 0 based character position.
     */
    Editor.prototype.setCursorPos = function (line, ch) {
        this._codeMirror.setCursor(line, ch);
    };
    
    /**
     * Gets the current selection. Start is inclusive, end is exclusive. If there is no selection,
     * returns the current cursor position as both the start and end of the range (i.e. a selection
     * of length zero).
     * @return !{start:{line:number, ch:number}, end:{line:number, ch:number}}
     */
    Editor.prototype.getSelection = function () {
        var selStart = this._codeMirror.getCursor(true),
            selEnd = this._codeMirror.getCursor(false);
        return { start: selStart, end: selEnd };
    };
    
    /**
     * Sets the current selection. Start is inclusive, end is exclusive. Places the cursor at the
     * end of the selection range.
     * @param {!{line:number, ch:number}} start
     * @param {!{line:number, ch:number}} end
     */
    Editor.prototype.setSelection = function (start, end) {
        this._codeMirror.setSelection(start, end);
    };

    /**
     * Gets the total number of lines in the the document (includes lines not visible in the viewport)
     * @returns {!number}
     */
    Editor.prototype.lineCount = function () {
        return this._codeMirror.lineCount();
    };

    /* Hides the specified line number in the editor
     * @param {!number}
     */
    Editor.prototype.hideLine = function (lineNumber) {
        return this._codeMirror.hideLine(lineNumber);
    };

    /**
     * Gets the total height of the document in pixels (not the viewport)
     * @param {!boolean} includePadding
     * @returns {!number} height in pixels
     */
    Editor.prototype.totalHeight = function (includePadding) {
        return this._codeMirror.totalHeight(includePadding);
    };


    /**
     * Gets the total number of displayed lines for the document (not the viewport).
     * This function accounts for extra lines due to word wrapping if wordWrapping is enabled.
     * @returns {!number} height in lines
     */
    Editor.prototype.heightInLines = function () {
        return this._codeMirror.heightInLines();
    };

    /**
     * Gets the scroller element from the editor.
     * @returns {!HTMLDivElement} scroller
     */
    Editor.prototype.getScrollerElement = function () {
        return this._codeMirror.getScrollerElement();
    };
    
    
    /**
     * Adds an inline widget below the given line. If any inline widget was already open for that
     * line, it is closed without warning.
     * @param {!{line:number, ch:number}} pos  Position in text to anchor the inline.
     * @param {!DOMElement} domContent  DOM node of widget UI to insert.
     * @param {number} initialHeight  Initial height to accomodate.
     * @param {Object} data  Extra data to track along with the widget. Accessible later via
     *          {@link #getInlineWidgets()}.
     * @return {number} id for this inline widget instance; unique to this Editor
     */
    Editor.prototype.addInlineWidget = function (pos, domContent, initialHeight, data) {
        // If any other inline widget is alrady open on this line, CodeMirror will automatically
        // close it. We don't want to leak an _inlineWidgets entry, so check for this case and
        // remove it manually instead.
        var i;
        for (i = 0; i < this._inlineWidgets.length; i++) {
            var info = this._codeMirror.getInlineWidgetInfo(this._inlineWidgets[i].id);
            if (info.line === pos.line) {
                this.removeInlineWidget(this._inlineWidgets[i].id);
                break;
            }
        }
        
        // Now add the new widget
        var inlineId = this._codeMirror.addInlineWidget(pos, domContent, initialHeight);
        this._inlineWidgets.push({ id: inlineId, data: data });
        
        return inlineId;
    };
    
    /**
     * Removes the given inline widget.
     * @param {number} inlineId  id returned by addInlineWidget().
     */
    Editor.prototype.removeInlineWidget = function (inlineId) {
        this._codeMirror.removeInlineWidget(inlineId);
        
        var i;
        for (i = 0; i < this._inlineWidgets.length; i++) {
            if (this._inlineWidgets[i].id === inlineId) {
                this._inlineWidgets.splice(i, 1);
                break;
            }
        }
    };

    /**
     * Returns a list of all inline widgets currently open in this editor. Each entry contains the
     * inline's id, and the data parameter that was passed to addInlineWidget().
     * @return {!Array.<{id:number, data:Object}>}
     */
    Editor.prototype.getInlineWidgets = function () {
        return this._inlineWidgets;
    };

    /**
     * Sets the height of the inline widget for this editor. The inline editor is identified by id.
     * @param {!number} id
     * @param {!height} height
     * @param {boolean} ensureVisible
     */
    Editor.prototype.setInlineWidgetHeight = function (id, height, ensureVisible) {
        this._codeMirror.setInlineWidgetHeight(id, height, ensureVisible);
    };
    
    
    /** Gives focus to the editor control */
    Editor.prototype.focus = function () {
        this._codeMirror.focus();
    };
    
    /**
     * Refreshes the editor control
     */
    Editor.prototype.refresh = function () {
        this._codeMirror.refresh();
    };
    
    
    /**
     * @private
     * NOTE: this is actually "semi-private": EditorManager also accesses this field... as well as
     * a few other modules. However, we should try to gradually move most code away from talking to
     * CodeMirror directly.
     * @type {!CodeMirror}
     */
    Editor.prototype._codeMirror = null;
    
    /**
     * @private
     * @type {!Array.<{id:number, data:Object}>}
     */
    Editor.prototype._inlineWidgets = null;



    // Define public API
    exports.Editor = Editor;
});
