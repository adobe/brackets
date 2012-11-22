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
/*global define, $, CodeMirror, window */

/**
 * Editor is a 1-to-1 wrapper for a CodeMirror editor instance. It layers on Brackets-specific
 * functionality and provides APIs that cleanly pass through the bits of CodeMirror that the rest
 * of our codebase may want to interact with. An Editor is always backed by a Document, and stays
 * in sync with its content; because Editor keeps the Document alive, it's important to always
 * destroy() an Editor that's going away so it can release its Document ref.
 *
 * For now, there's a distinction between the "master" Editor for a Document - which secretly acts
 * as the Document's internal model of the text state - and the multitude of "slave" secondary Editors
 * which, via Document, sync their changes to and from that master.
 *
 * For now, direct access to the underlying CodeMirror object is still possible via _codeMirror --
 * but this is considered deprecated and may go away.
 *  
 * The Editor object dispatches the following events:
 *    - keyEvent -- When any key event happens in the editor (whether it changes the text or not).
 *          Event handlers are passed ({Editor}, {KeyboardEvent}). The 2nd arg is the raw DOM event.
 *          Note: most listeners will only want to respond when event.type === "keypress".
 *    - cursorActivity -- When the user moves the cursor or changes the selection, or an edit occurs.
 *          Note: do not listen to this in order to be generally informed of edits--listen to the
 *          "change" event on Document instead.
 *    - scroll -- When the editor is scrolled, either by user action or programmatically.
 *    - lostContent -- When the backing Document changes in such a way that this Editor is no longer
 *          able to display accurate text. This occurs if the Document's file is deleted, or in certain
 *          Document->editor syncing edge cases that we do not yet support (the latter cause will
 *          eventually go away). 
 *
 * The Editor also dispatches "change" events internally, but you should listen for those on
 * Documents, not Editors.
 *
 * These are jQuery events, so to listen for them you do something like this:
 *    $(editorInstance).on("eventname", handler);
 */
define(function (require, exports, module) {
    "use strict";
    
    var EditorManager      = require("editor/EditorManager"),
        CodeHintManager    = require("editor/CodeHintManager"),
        Commands           = require("command/Commands"),
        CommandManager     = require("command/CommandManager"),
        Menus              = require("command/Menus"),
        PerfUtils          = require("utils/PerfUtils"),
        PreferencesManager = require("preferences/PreferencesManager"),
        Strings            = require("strings"),
        TextRange          = require("document/TextRange").TextRange,
        ViewUtils          = require("utils/ViewUtils");
    
    var PREFERENCES_CLIENT_ID = "com.adobe.brackets.Editor",
        defaultPrefs = { useTabChar: false, tabSize: 4, indentUnit: 4 };
    
    /** Editor preferences */
    var _prefs = PreferencesManager.getPreferenceStorage(PREFERENCES_CLIENT_ID, defaultPrefs);
    
    /** @type {boolean}  Global setting: When inserting new text, use tab characters? (instead of spaces) */
    var _useTabChar = _prefs.getValue("useTabChar");
    
    /** @type {boolean}  Global setting: Tab size */
    var _tabSize = _prefs.getValue("tabSize");
    
    /** @type {boolean}  Global setting: Indent unit (i.e. number of spaces when indenting) */
    var _indentUnit = _prefs.getValue("indentUnit");
    
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
                var i, ins = "", numSpaces = _indentUnit;
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
                jump = cursor.ch % _indentUnit,
                line = instance.getLine(cursor.line);

            if (direction === 1) {
                jump = _indentUnit - jump;

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
                    jump = _indentUnit;
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
            if (/[\]\{\}\)]/.test(keyStr)) {
                // If all text before the cursor is whitespace, auto-indent it
                var cursor = instance.getCursor();
                var lineStr = instance.getLine(cursor.line);
                var nonWS = lineStr.search(/\S/);
                
                if (nonWS === -1 || nonWS >= cursor.ch) {
                    // Need to do the auto-indent on a timeout to ensure
                    // the keypress is handled before auto-indenting.
                    // This is the same timeout value used by the
                    // electricChars feature in CodeMirror.
                    window.setTimeout(function () {
                        instance.indentLine(cursor.line);
                    }, 75);
                }
            }
        }
    }

    function _handleKeyEvents(jqEvent, editor, event) {
        _checkElectricChars(jqEvent, editor, event);

        // Pass the key event to the code hint manager. It may call preventDefault() on the event.
        CodeHintManager.handleKeyEvent(editor, event);
    }

    function _handleSelectAll() {
        var editor = EditorManager.getFocusedEditor();
        if (editor) {
            editor._selectAllVisible();
        }
    }
    
    /**
     * List of all current (non-destroy()ed) Editor instances. Needed when changing global preferences
     * that affect all editors, e.g. tabbing or color scheme settings.
     * @type {Array.<Editor>}
     */
    var _instances = [];
    
    
    /**
     * @constructor
     *
     * Creates a new CodeMirror editor instance bound to the given Document. The Document need not have
     * a "master" Editor realized yet, even if makeMasterEditor is false; in that case, the first time
     * an edit occurs we will automatically ask EditorManager to create a "master" editor to render the
     * Document modifiable.
     *
     * ALWAYS call destroy() when you are done with an Editor - otherwise it will leak a Document ref.
     *
     * @param {!Document} document  
     * @param {!boolean} makeMasterEditor  If true, this Editor will set itself as the (secret) "master"
     *          Editor for the Document. If false, this Editor will attach to the Document as a "slave"/
     *          secondary editor.
     * @param {!string} mode  Syntax-highlighting language mode; "" means plain-text mode.
     *          See {@link EditorUtils#getModeFromFileExtension()}.
     * @param {!jQueryObject} container  Container to add the editor to.
     * @param {!Object<string, function(Editor)>} additionalKeys  Mapping of keyboard shortcuts to
     *          custom handler functions. Mapping is in CodeMirror format
     * @param {{startLine: number, endLine: number}=} range If specified, range of lines within the document
     *          to display in this editor. Inclusive.
     */
    function Editor(document, makeMasterEditor, mode, container, additionalKeys, range) {
        var self = this;
        
        _instances.push(this);
        
        // Attach to document: add ref & handlers
        this.document = document;
        document.addRef();
        
        if (range) {    // attach this first: want range updated before we process a change
            this._visibleRange = new TextRange(document, range.startLine, range.endLine);
        }
        
        // store this-bound version of listeners so we can remove them later
        this._handleDocumentChange = this._handleDocumentChange.bind(this);
        this._handleDocumentDeleted = this._handleDocumentDeleted.bind(this);
        $(document).on("change", this._handleDocumentChange);
        $(document).on("deleted", this._handleDocumentDeleted);
        
        // (if makeMasterEditor, we attach the Doc back to ourselves below once we're fully initialized)
        
        this._inlineWidgets = [];
        
        // Editor supplies some standard keyboard behavior extensions of its own
        var codeMirrorKeyMap = {
            "Tab": _handleTabKey,
            "Shift-Tab": "indentLess",

            "Left": function (instance) {
                if (!_handleSoftTabNavigation(instance, -1, "moveH")) {
                    CodeMirror.commands.goCharLeft(instance);
                }
            },
            "Right": function (instance) {
                if (!_handleSoftTabNavigation(instance, 1, "moveH")) {
                    CodeMirror.commands.goCharRight(instance);
                }
            },
            "Backspace": function (instance) {
                if (!_handleSoftTabNavigation(instance, -1, "deleteH")) {
                    CodeMirror.commands.delCharLeft(instance);
                }
            },
            "Delete": function (instance) {
                if (!_handleSoftTabNavigation(instance, 1, "deleteH")) {
                    CodeMirror.commands.delCharRight(instance);
                }
            },
            "Esc": function (instance) {
                self.removeAllInlineWidgets();
            },
            "'>'": function (cm) { cm.closeTag(cm, '>'); },
            "'/'": function (cm) { cm.closeTag(cm, '/'); }
        };
        
        EditorManager.mergeExtraKeys(self, codeMirrorKeyMap, additionalKeys);
        
        // We'd like null/"" to mean plain text mode. CodeMirror defaults to plaintext for any
        // unrecognized mode, but it complains on the console in that fallback case: so, convert
        // here so we're always explicit, avoiding console noise.
        if (!mode) {
            mode = "text/plain";
        }
        
        // Create the CodeMirror instance
        // (note: CodeMirror doesn't actually require using 'new', but jslint complains without it)
        this._codeMirror = new CodeMirror(container, {
            electricChars: false,   // we use our own impl of this to avoid CodeMirror bugs; see _checkElectricChars()
            indentWithTabs: _useTabChar,
            tabSize: _tabSize,
            indentUnit: _indentUnit,
            lineNumbers: true,
            matchBrackets: true,
            dragDrop: false,    // work around issue #1123
            extraKeys: codeMirrorKeyMap
        });
        
        // Can't get CodeMirror's focused state without searching for
        // CodeMirror-focused. Instead, track focus via onFocus and onBlur
        // options and track state with this._focused
        this._focused = false;
        
        this._installEditorListeners();
        
        $(this)
            .on("keyEvent", _handleKeyEvents)
            .on("change", this._handleEditorChange.bind(this));
        
        // Set code-coloring mode BEFORE populating with text, to avoid a flash of uncolored text
        this._codeMirror.setOption("mode", mode);
        
        // Initially populate with text. This will send a spurious change event, so need to make
        // sure this is understood as a 'sync from document' case, not a genuine edit
        this._duringSync = true;
        this._resetText(document.getText());
        this._duringSync = false;
        
        if (range) {
            // Hide all lines other than those we want to show. We do this rather than trimming the
            // text itself so that the editor still shows accurate line numbers.
            this._codeMirror.operation(function () {
                var i;
                for (i = 0; i < range.startLine; i++) {
                    self._hideLine(i);
                }
                var lineCount = self.lineCount();
                for (i = range.endLine + 1; i < lineCount; i++) {
                    self._hideLine(i);
                }
            });
            this.setCursorPos(range.startLine, 0);
        }

        // Now that we're fully initialized, we can point the document back at us if needed
        if (makeMasterEditor) {
            document._makeEditable(this);
        }
        
        // Add scrollTop property to this object for the scroll shadow code to use
        Object.defineProperty(this, "scrollTop", {
            get: function () {
                return this._codeMirror.getScrollInfo().y;
            }
        });
    }
    
    /**
     * Removes this editor from the DOM and detaches from the Document. If this is the "master"
     * Editor that is secretly providing the Document's backing state, then the Document reverts to
     * a read-only string-backed mode.
     */
    Editor.prototype.destroy = function () {
        // CodeMirror docs for getWrapperElement() say all you have to do is "Remove this from your
        // tree to delete an editor instance."
        $(this.getRootElement()).remove();
        
        _instances.splice(_instances.indexOf(this), 1);
        
        // Disconnect from Document
        this.document.releaseRef();
        $(this.document).off("change", this._handleDocumentChange);
        $(this.document).off("deleted", this._handleDocumentDeleted);
        
        if (this._visibleRange) {   // TextRange also refs the Document
            this._visibleRange.dispose();
        }
        
        // If we're the Document's master editor, disconnecting from it has special meaning
        if (this.document._masterEditor === this) {
            this.document._makeNonEditable();
        }
        
        // Destroying us destroys any inline widgets we're hosting. Make sure their closeCallbacks
        // run, at least, since they may also need to release Document refs
        this._inlineWidgets.forEach(function (inlineWidget) {
            inlineWidget.onClosed();
        });
    };
    
        
    /** 
     * Handles Select All specially when we have a visible range in order to work around
     * bugs in CodeMirror when lines are hidden.
     */
    Editor.prototype._selectAllVisible = function () {
        var startLine = this.getFirstVisibleLine(),
            endLine = this.getLastVisibleLine();
        this.setSelection({line: startLine, ch: 0},
                          {line: endLine, ch: this.document.getLine(endLine).length});
    };
    
    /**
     * Ensures that the lines that are actually hidden in the inline editor correspond to
     * the desired visible range.
     */
    Editor.prototype._updateHiddenLines = function () {
        if (this._visibleRange) {
            var cm = this._codeMirror,
                self = this;
            cm.operation(function () {
                // TODO: could make this more efficient by only iterating across the min-max line
                // range of the union of all changes
                var i;
                for (i = 0; i < cm.lineCount(); i++) {
                    if (i < self._visibleRange.startLine || i > self._visibleRange.endLine) {
                        self._hideLine(i);
                    } else {
                        // Double-check that the set of NON-hidden lines matches our range too
                        console.assert(!cm.getLineHandle(i).hidden);
                    }
                }
            });
        }
    };
    
    Editor.prototype._applyChanges = function (changeList) {
        // _visibleRange has already updated via its own Document listener. See if this change caused
        // it to lose sync. If so, our whole view is stale - signal our owner to close us.
        if (this._visibleRange) {
            if (this._visibleRange.startLine === null || this._visibleRange.endLine === null) {
                $(this).triggerHandler("lostContent");
                return;
            }
        }
        
        // Apply text changes to CodeMirror editor
        var cm = this._codeMirror;
        cm.operation(function () {
            var change, newText;
            for (change = changeList; change; change = change.next) {
                newText = change.text.join('\n');
                if (!change.from || !change.to) {
                    if (change.from || change.to) {
                        console.assert(false, "Change record received with only one end undefined--replacing entire text");
                    }
                    cm.setValue(newText);
                } else {
                    cm.replaceRange(newText, change.from, change.to);
                }
                
            }
        });
        
        // The update above may have inserted new lines - must hide any that fall outside our range
        this._updateHiddenLines();
    };
    
    /**
     * Responds to changes in the CodeMirror editor's text, syncing the changes to the Document.
     * There are several cases where we want to ignore a CodeMirror change:
     *  - if we're the master editor, editor changes can be ignored because Document is already listening
     *    for our changes
     *  - if we're a secondary editor, editor changes should be ignored if they were caused by us reacting
     *    to a Document change
     */
    Editor.prototype._handleEditorChange = function (event, editor, changeList) {
        // we're currently syncing from the Document, so don't echo back TO the Document
        if (this._duringSync) {
            return;
        }
        
        // Secondary editor: force creation of "master" editor backing the model, if doesn't exist yet
        this.document._ensureMasterEditor();
        
        if (this.document._masterEditor !== this) {
            // Secondary editor:
            // we're not the ground truth; if we got here, this was a real editor change (not a
            // sync from the real ground truth), so we need to sync from us into the document
            // (which will directly push the change into the master editor).
            // FUTURE: Technically we should add a replaceRange() method to Document and go through
            // that instead of talking to its master editor directly. It's not clear yet exactly
            // what the right Document API would be, though.
            this._duringSync = true;
            this.document._masterEditor._applyChanges(changeList);
            this._duringSync = false;
            
            // Update which lines are hidden inside our editor, since we're not going to go through
            // _applyChanges() in our own editor.
            this._updateHiddenLines();
        }
        // Else, Master editor:
        // we're the ground truth; nothing else to do, since Document listens directly to us
        // note: this change might have been a real edit made by the user, OR this might have
        // been a change synced from another editor
        
        CodeHintManager.handleChange(this);
    };
    
    /**
     * Responds to changes in the Document's text, syncing the changes into our CodeMirror instance.
     * There are several cases where we want to ignore a Document change:
     *  - if we're the master editor, Document changes should be ignored becuase we already have the right
     *    text (either the change originated with us, or it has already been set into us by Document)
     *  - if we're a secondary editor, Document changes should be ignored if they were caused by us sending
     *    the document an editor change that originated with us
     */
    Editor.prototype._handleDocumentChange = function (event, doc, changeList) {
        var change;
        
        // we're currently syncing to the Document, so don't echo back FROM the Document
        if (this._duringSync) {
            return;
        }
        
        if (this.document._masterEditor !== this) {
            // Secondary editor:
            // we're not the ground truth; and if we got here, this was a Document change that
            // didn't come from us (e.g. a sync from another editor, a direct programmatic change
            // to the document, or a sync from external disk changes)... so sync from the Document
            this._duringSync = true;
            this._applyChanges(changeList);
            this._duringSync = false;
        }
        // Else, Master editor:
        // we're the ground truth; nothing to do since Document change is just echoing our
        // editor changes
    };
    
    /**
     * Responds to the Document's underlying file being deleted. The Document is now basically dead,
     * so we must close.
     */
    Editor.prototype._handleDocumentDeleted = function (event) {
        // Pass the delete event along as the cause (needed in MultiRangeInlineEditor)
        $(this).triggerHandler("lostContent", [event]);
    };
    
    
    /**
     * Install singleton event handlers on the CodeMirror instance, translating them into multi-
     * listener-capable jQuery events on the Editor instance.
     */
    Editor.prototype._installEditorListeners = function () {
        var self = this;
        
        // FUTURE: if this list grows longer, consider making this a more generic mapping
        // NOTE: change is a "private" event--others shouldn't listen to it on Editor, only on
        // Document
        this._codeMirror.setOption("onChange", function (instance, changeList) {
            $(self).triggerHandler("change", [self, changeList]);
        });
        this._codeMirror.setOption("onKeyEvent", function (instance, event) {
            $(self).triggerHandler("keyEvent", [self, event]);
            return event.defaultPrevented;   // false tells CodeMirror we didn't eat the event
        });
        this._codeMirror.setOption("onCursorActivity", function (instance) {
            $(self).triggerHandler("cursorActivity", [self]);
        });
        this._codeMirror.setOption("onScroll", function (instance) {
            // If this editor is visible, close all dropdowns on scroll.
            // (We don't want to do this if we're just scrolling in a non-visible editor
            // in response to some document change event.)
            if (self.isFullyVisible()) {
                Menus.closeAll();
            }

            $(self).triggerHandler("scroll", [self]);
        
            // notify all inline widgets of a position change
            self._fireWidgetOffsetTopChanged(self.getFirstVisibleLine() - 1);
        });

        // Convert CodeMirror onFocus events to EditorManager activeEditorChanged
        this._codeMirror.setOption("onFocus", function () {
            self._focused = true;
            EditorManager._notifyActiveEditorChanged(self);
        });
        
        this._codeMirror.setOption("onBlur", function () {
            self._focused = false;
            // EditorManager only cares about other Editors gaining focus, so we don't notify it of anything here
        });
    };
    
    /**
     * Sets the contents of the editor and clears the undo/redo history. Dispatches a change event.
     * Semi-private: only Document should call this.
     * @param {!string} text
     */
    Editor.prototype._resetText = function (text) {
        var perfTimerName = PerfUtils.markStart("Edtitor._resetText()\t" + (!this.document || this.document.file.fullPath));

        var cursorPos = this.getCursorPos(),
            scrollPos = this.getScrollPos();
        
        // This *will* fire a change event, but we clear the undo immediately afterward
        this._codeMirror.setValue(text);
        
        // Make sure we can't undo back to the empty state before setValue()
        this._codeMirror.clearHistory();
        
        // restore cursor and scroll positions
        this.setCursorPos(cursorPos);
        this.setScrollPos(scrollPos.x, scrollPos.y);

        PerfUtils.addMeasurement(perfTimerName);
    };
    
    
    /**
     * Gets the current cursor position within the editor. If there is a selection, returns whichever
     * end of the range the cursor lies at.
     * @param {boolean} expandTabs If true, return the actual visual column number instead of the character offset in
     *      the "ch" property.
     * @return !{line:number, ch:number}
     */
    Editor.prototype.getCursorPos = function (expandTabs) {
        var cursor = this._codeMirror.getCursor();
        
        if (expandTabs) {
            var line    = this._codeMirror.getRange({line: cursor.line, ch: 0}, cursor),
                tabSize = Editor.getTabSize(),
                column  = 0,
                i;

            for (i = 0; i < line.length; i++) {
                if (line[i] === '\t') {
                    column += (tabSize - (column % tabSize));
                } else {
                    column++;
                }
            }
            
            cursor.ch = column;
        }
        
        return cursor;
    };
    
    /**
     * Sets the cursor position within the editor. Removes any selection.
     * @param {number} line The 0 based line number.
     * @param {number=} ch  The 0 based character position; treated as 0 if unspecified.
     */
    Editor.prototype.setCursorPos = function (line, ch) {
        this._codeMirror.setCursor(line, ch);
    };

    /**
     * Given a position, returns its index within the text (assuming \n newlines)
     * @param {!{line:number, ch:number}}
     * @return {number}
     */
    Editor.prototype.indexFromPos = function (coords) {
        return this._codeMirror.indexFromPos(coords);
    };

    /**
     * Returns true if pos is between start and end (inclusive at both ends)
     * @param {{line:number, ch:number}} pos
     * @param {{line:number, ch:number}} start
     * @param {{line:number, ch:number}} end
     *
     */
    Editor.prototype.posWithinRange = function (pos, start, end) {
        var startIndex = this.indexFromPos(start),
            endIndex = this.indexFromPos(end),
            posIndex = this.indexFromPos(pos);

        return posIndex >= startIndex && posIndex <= endIndex;
    };
    
    /**
     * @return {boolean} True if there's a text selection; false if there's just an insertion point
     */
    Editor.prototype.hasSelection = function () {
        return this._codeMirror.somethingSelected();
    };
    
    /**
     * Gets the current selection. Start is inclusive, end is exclusive. If there is no selection,
     * returns the current cursor position as both the start and end of the range (i.e. a selection
     * of length zero).
     * @return {!{start:{line:number, ch:number}, end:{line:number, ch:number}}}
     */
    Editor.prototype.getSelection = function () {
        var selStart = this._codeMirror.getCursor(true),
            selEnd   = this._codeMirror.getCursor(false);
        return { start: selStart, end: selEnd };
    };
    
    /**
     * @return {!string} The currently selected text, or "" if no selection. Includes \n if the
     * selection spans multiple lines (does NOT reflect the Document's line-endings style).
     */
    Editor.prototype.getSelectedText = function () {
        return this._codeMirror.getSelection();
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
     * Selects word that the given pos lies within or adjacent to. If pos isn't touching a word
     * (e.g. within a token like "//"), moves the cursor to pos without selecting a range.
     * Adapted from selectWordAt() in CodeMirror v2.
     * @param {!{line:number, ch:number}}
     */
    Editor.prototype.selectWordAt = function (pos) {
        var line = this.document.getLine(pos.line),
            start = pos.ch,
            end = pos.ch;
        
        function isWordChar(ch) {
            return (/\w/).test(ch) || ch.toUpperCase() !== ch.toLowerCase();
        }
        
        while (start > 0 && isWordChar(line.charAt(start - 1))) {
            --start;
        }
        while (end < line.length && isWordChar(line.charAt(end))) {
            ++end;
        }
        this.setSelection({line: pos.line, ch: start}, {line: pos.line, ch: end});
    };
    
    /**
     * Gets the total number of lines in the the document (includes lines not visible in the viewport)
     * @returns {!number}
     */
    Editor.prototype.lineCount = function () {
        return this._codeMirror.lineCount();
    };
    
    /**
     * Gets the number of the first visible line in the editor.
     * @returns {number} The 0-based index of the first visible line.
     */
    Editor.prototype.getFirstVisibleLine = function () {
        return (this._visibleRange ? this._visibleRange.startLine : 0);
    };
    
    /**
     * Gets the number of the last visible line in the editor.
     * @returns {number} The 0-based index of the last visible line.
     */
    Editor.prototype.getLastVisibleLine = function () {
        return (this._visibleRange ? this._visibleRange.endLine : this.lineCount() - 1);
    };

    // FUTURE change to "hideLines()" API that hides a range of lines at once in a single operation, then fires offsetTopChanged afterwards.
    /* Hides the specified line number in the editor
     * @param {!number}
     */
    Editor.prototype._hideLine = function (lineNumber) {
        var value = this._codeMirror.hideLine(lineNumber);
        
        // when this line is hidden, notify all following inline widgets of a position change
        this._fireWidgetOffsetTopChanged(lineNumber);
        
        return value;
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
     * Gets the scroller element from the editor.
     * @returns {!HTMLDivElement} scroller
     */
    Editor.prototype.getScrollerElement = function () {
        return this._codeMirror.getScrollerElement();
    };
    
    /**
     * Gets the root DOM node of the editor.
     * @returns {!HTMLDivElement} The editor's root DOM node.
     */
    Editor.prototype.getRootElement = function () {
        return this._codeMirror.getWrapperElement();
    };
    
    /**
     * Gets the lineSpace element within the editor (the container around the individual lines of code).
     * FUTURE: This is fairly CodeMirror-specific. Logic that depends on this may break if we switch
     * editors.
     * @returns {!HTMLDivElement} The editor's lineSpace element.
     */
    Editor.prototype._getLineSpaceElement = function () {
        return $(".CodeMirror-lines", this.getScrollerElement()).children().get(0);
    };
    
    /**
     * Returns the current scroll position of the editor.
     * @returns {{x:number, y:number}} The x,y scroll position in pixels
     */
    Editor.prototype.getScrollPos = function () {
        return this._codeMirror.getScrollInfo();
    };
    
    /**
     * Sets the current scroll position of the editor.
     * @param {number} x scrollLeft position in pixels
     * @param {number} y scrollTop position in pixels
     */
    Editor.prototype.setScrollPos = function (x, y) {
        this._codeMirror.scrollTo(x, y);
    };

    /**
     * Adds an inline widget below the given line. If any inline widget was already open for that
     * line, it is closed without warning.
     * @param {!{line:number, ch:number}} pos  Position in text to anchor the inline.
     * @param {!InlineWidget} inlineWidget The widget to add.
     */
    Editor.prototype.addInlineWidget = function (pos, inlineWidget) {
        var self = this;
        inlineWidget.id = this._codeMirror.addInlineWidget(pos, inlineWidget.htmlContent, inlineWidget.height, function (id) {
            self._removeInlineWidgetInternal(id);
            inlineWidget.onClosed();
        });
        this._inlineWidgets.push(inlineWidget);
        inlineWidget.onAdded();
        
        // once this widget is added, notify all following inline widgets of a position change
        this._fireWidgetOffsetTopChanged(pos.line);
    };
    
    /**
     * Removes all inline widgets
     */
    Editor.prototype.removeAllInlineWidgets = function () {
        // copy the array because _removeInlineWidgetInternal will modifying the original
        var widgets = [].concat(this.getInlineWidgets());
        
        widgets.forEach(function (widget) {
            this.removeInlineWidget(widget);
        }, this);
    };
    
    /**
     * Removes the given inline widget.
     * @param {number} inlineWidget The widget to remove.
     */
    Editor.prototype.removeInlineWidget = function (inlineWidget) {
        var lineNum = this._getInlineWidgetLineNumber(inlineWidget);
        
        // _removeInlineWidgetInternal will get called from the destroy callback in CodeMirror.
        this._codeMirror.removeInlineWidget(inlineWidget.id);
        
        // once this widget is removed, notify all following inline widgets of a position change
        this._fireWidgetOffsetTopChanged(lineNum);
    };
    
    /**
     * Cleans up the given inline widget from our internal list of widgets.
     * @param {number} inlineId  id returned by addInlineWidget().
     */
    Editor.prototype._removeInlineWidgetInternal = function (inlineId) {
        var i;
        var l = this._inlineWidgets.length;
        for (i = 0; i < l; i++) {
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
     * Sets the height of an inline widget in this editor. 
     * @param {!InlineWidget} inlineWidget The widget whose height should be set.
     * @param {!number} height The height of the widget.
     * @param {boolean} ensureVisible Whether to scroll the entire widget into view.
     */
    Editor.prototype.setInlineWidgetHeight = function (inlineWidget, height, ensureVisible) {
        var info = this._codeMirror.getInlineWidgetInfo(inlineWidget.id),
            oldHeight = (info && info.height) || 0;
        
        this._codeMirror.setInlineWidgetHeight(inlineWidget.id, height, ensureVisible);
        
        // update position for all following inline editors
        if (oldHeight !== height) {
            var lineNum = this._getInlineWidgetLineNumber(inlineWidget);
            this._fireWidgetOffsetTopChanged(lineNum);
        }
    };
    
    /**
     * @private
     * Get the starting line number for an inline widget.
     * @param {!InlineWidget} inlineWidget 
     * @return {number} The line number of the widget or -1 if not found.
     */
    Editor.prototype._getInlineWidgetLineNumber = function (inlineWidget) {
        var info = this._codeMirror.getInlineWidgetInfo(inlineWidget.id);
        return (info && info.line) || -1;
    };
    
    /**
     * @private
     * Fire "offsetTopChanged" events when inline editor positions change due to
     * height changes of other inline editors.
     * @param {!InlineWidget} inlineWidget 
     */
    Editor.prototype._fireWidgetOffsetTopChanged = function (lineNum) {
        var self = this,
            otherLineNum;
        
        this.getInlineWidgets().forEach(function (other) {
            otherLineNum = self._getInlineWidgetLineNumber(other);
            
            if (otherLineNum > lineNum) {
                $(other).triggerHandler("offsetTopChanged");
            }
        });
    };
    
    /** Gives focus to the editor control */
    Editor.prototype.focus = function () {
        this._codeMirror.focus();
    };
    
    /** Returns true if the editor has focus */
    Editor.prototype.hasFocus = function () {
        return this._focused;
    };
    
    /**
     * Re-renders the editor UI
     */
    Editor.prototype.refresh = function () {
        this._codeMirror.refresh();
    };
    
    /**
     * Re-renders the editor, and all children inline editors.
     */
    Editor.prototype.refreshAll = function () {
        this.refresh();
        this.getInlineWidgets().forEach(function (inlineWidget) {
            inlineWidget.refresh();
        });
    };
    
    /**
     * Shows or hides the editor within its parent. Does not force its ancestors to
     * become visible.
     * @param {boolean} show true to show the editor, false to hide it
     */
    Editor.prototype.setVisible = function (show) {
        $(this.getRootElement()).css("display", (show ? "" : "none"));
        this._codeMirror.refresh();
        if (show) {
            this._inlineWidgets.forEach(function (inlineWidget) {
                inlineWidget.onParentShown();
            });
        }
    };
    
    /**
     * Returns true if the editor is fully visible--i.e., is in the DOM, all ancestors are
     * visible, and has a non-zero width/height.
     */
    Editor.prototype.isFullyVisible = function () {
        return $(this.getRootElement()).is(":visible");
    };
    
    /**
     * Gets the syntax-highlighting mode for the current selection or cursor position. (The mode may
     * vary within one file due to embedded languages, e.g. JS embedded in an HTML script block).
     *
     * Returns null if the mode at the start of the selection differs from the mode at the end -
     * an *approximation* of whether the mode is consistent across the whole range (a pattern like
     * A-B-A would return A as the mode, not null).
     *
     * @return {?(Object|String)} Object or Name of syntax-highlighting mode; see {@link EditorUtils#getModeFromFileExtension()}.
     */
    Editor.prototype.getModeForSelection = function () {
        var sel = this.getSelection();
        
        // Check for mixed mode info (meaning mode varies depending on position)
        // TODO (#921): this only works for certain mixed modes; some do not expose this info
        var startState = this._codeMirror.getTokenAt(sel.start).state;
        if (startState.mode) {
            var startMode = startState.mode;
            
            // If mixed mode, check that mode is the same at start & end of selection
            if (sel.start.line !== sel.end.line || sel.start.ch !== sel.end.ch) {
                var endState = this._codeMirror.getTokenAt(sel.end).state;
                var endMode = endState.mode;
                if (startMode !== endMode) {
                    return null;
                }
            }
            return startMode;
            
        } else {
            // Mode does not vary: just use the editor-wide mode
            return this._codeMirror.getOption("mode");
        }
    };
    
    /**
     * Gets the syntax-highlighting mode for the document.
     *
     * @return {Object|String} Object or Name of syntax-highlighting mode; see {@link EditorUtils#getModeFromFileExtension()}.
     */
    Editor.prototype.getModeForDocument = function () {
        return this._codeMirror.getOption("mode");
    };
    
    /**
     * Sets the syntax-highlighting mode for the document.
     *
     * @param {string} mode Name of syntax highlighting mode.
     */
    Editor.prototype.setModeForDocument = function (mode) {
        this._codeMirror.setOption("mode", mode);
    };

    /**
     * The Document we're bound to
     * @type {!Document}
     */
    Editor.prototype.document = null;
    
    /**
     * If true, we're in the middle of syncing to/from the Document. Used to ignore spurious change
     * events caused by us (vs. change events caused by others, which we need to pay attention to).
     * @type {!boolean}
     */
    Editor.prototype._duringSync = false;
    
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

    /**
     * @private
     * @type {?TextRange}
     */
    Editor.prototype._visibleRange = null;
    
    
    // Global settings that affect all Editor instances (both currently open Editors as well as those created
    // in the future)

    /**
     * Sets whether to use tab characters (vs. spaces) when inserting new text. Affects all Editors.
     * @param {boolean} value
     */
    Editor.setUseTabChar = function (value) {
        _useTabChar = value;
        _instances.forEach(function (editor) {
            editor._codeMirror.setOption("indentWithTabs", _useTabChar);
        });
        
        _prefs.setValue("useTabChar", Boolean(_useTabChar));
    };
    
    /** @type {boolean} Gets whether all Editors use tab characters (vs. spaces) when inserting new text */
    Editor.getUseTabChar = function (value) {
        return _useTabChar;
    };

    /**
     * Sets tab character width. Affects all Editors.
     * @param {number} value
     */
    Editor.setTabSize = function (value) {
        _tabSize = value;
        _instances.forEach(function (editor) {
            editor._codeMirror.setOption("tabSize", _tabSize);
        });
        
        _prefs.setValue("tabSize", _tabSize);
    };
    
    /** @type {number} Get indent unit  */
    Editor.getTabSize = function (value) {
        return _tabSize;
    };

    /**
     * Sets indentation width. Affects all Editors.
     * @param {number} value
     */
    Editor.setIndentUnit = function (value) {
        _indentUnit = value;
        _instances.forEach(function (editor) {
            editor._codeMirror.setOption("indentUnit", _indentUnit);
        });
        
        _prefs.setValue("indentUnit", _indentUnit);
    };
    
    /** @type {number} Get indentation width */
    Editor.getIndentUnit = function (value) {
        return _indentUnit;
    };
    
    // Global commands that affect the currently focused Editor instance, wherever it may be
    CommandManager.register(Strings.CMD_SELECT_ALL,     Commands.EDIT_SELECT_ALL, _handleSelectAll);

    // Define public API
    exports.Editor = Editor;
});
