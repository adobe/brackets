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
 *    - optionChange -- Triggered when an option for the editor is changed. The 2nd arg to the listener
 *          is a string containing the editor option that is changing. The 3rd arg, which can be any
 *          data type, is the new value for the editor option.
 *
 * The Editor also dispatches "change" events internally, but you should listen for those on
 * Documents, not Editors.
 *
 * These are jQuery events, so to listen for them you do something like this:
 *    $(editorInstance).on("eventname", handler);
 */
define(function (require, exports, module) {
    "use strict";
    
    var Menus              = require("command/Menus"),
        PerfUtils          = require("utils/PerfUtils"),
        PreferencesManager = require("preferences/PreferencesManager"),
        Strings            = require("strings"),
        TextRange          = require("document/TextRange").TextRange,
        TokenUtils         = require("utils/TokenUtils"),
        ViewUtils          = require("utils/ViewUtils"),
        Async              = require("utils/Async"),
        AnimationUtils     = require("utils/AnimationUtils"),
        _                  = require("thirdparty/lodash");
    
    /** Editor preferences */
    var SMART_INDENT      = "smartIndent",
        USE_TAB_CHAR      = "useTabChar",
        TAB_SIZE          = "tabSize",
        SPACE_UNITS       = "spaceUnits",
        CLOSE_BRACKETS    = "closeBrackets",
        SHOW_LINE_NUMBERS = "showLineNumbers",
        STYLE_ACTIVE_LINE = "styleActiveLine",
        WORD_WRAP         = "wordWrap",
        CLOSE_TAGS        = "closeTags",
        SOFT_TABS         = "softTabs",
        cmOptions         = {};
    
    // Mappings from Brackets preferences to CodeMirror options
    cmOptions[SMART_INDENT]       = "smartIndent";
    cmOptions[USE_TAB_CHAR]       = "indentWithTabs";
    cmOptions[TAB_SIZE]           = "indentUnit";
    cmOptions[SPACE_UNITS]        = "indentUnit";
    cmOptions[CLOSE_BRACKETS]     = "autoCloseBrackets";
    cmOptions[SHOW_LINE_NUMBERS]  = "lineNumbers";
    cmOptions[STYLE_ACTIVE_LINE]  = "styleActiveLine";
    cmOptions[WORD_WRAP]          = "lineWrapping";
    cmOptions[CLOSE_TAGS]         = "autoCloseTags";
    
    PreferencesManager.definePreference(SMART_INDENT, "boolean", true);
    PreferencesManager.definePreference(USE_TAB_CHAR, "boolean", false);
    PreferencesManager.definePreference(TAB_SIZE, "number", 4);
    PreferencesManager.definePreference(SPACE_UNITS, "number", 4);
    PreferencesManager.definePreference(CLOSE_BRACKETS, "boolean", false);
    PreferencesManager.definePreference(SHOW_LINE_NUMBERS, "boolean", true);
    PreferencesManager.definePreference(STYLE_ACTIVE_LINE, "boolean", false);
    PreferencesManager.definePreference(WORD_WRAP, "boolean", true);
    PreferencesManager.definePreference(CLOSE_TAGS, "Object", { whenOpening: true, whenClosing: true, indentTags: [] });
    PreferencesManager.definePreference(SOFT_TABS, "boolean", true);
    
    var editorOptions = [SMART_INDENT, USE_TAB_CHAR, TAB_SIZE, SPACE_UNITS, CLOSE_BRACKETS,
                          SHOW_LINE_NUMBERS, STYLE_ACTIVE_LINE, WORD_WRAP, CLOSE_TAGS];

    /** Editor preferences */
    
    /** @type {boolean}  Guard flag to prevent focus() reentrancy (via blur handlers), even across Editors */
    var _duringFocus = false;

    /** @type {number}  Constant: ignore upper boundary when centering text */
    var BOUNDARY_CHECK_NORMAL   = 0,
        BOUNDARY_IGNORE_TOP     = 1;

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
        // 2. If the selection is multi-line, indent all the lines.
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
            
            // If the amount of whitespace and the cursor position didn't change, we must have
            // already been at the correct indentation level as far as CM is concerned, so insert 
            // another tab.
            if (instance.getLine(from.line).length === currentLength) {
                var newFrom = instance.getCursor(true),
                    newTo = instance.getCursor(false);
                if (newFrom.line === from.line && newFrom.ch === from.ch &&
                        newTo.line === to.line && newTo.ch === to.ch) {
                    insertTab = true;
                    to.ch = 0;
                }
            }
        } else if (instance.somethingSelected() && from.line !== to.line) {
            CodeMirror.commands.indentMore(instance);
        } else {
            insertTab = true;
        }
        
        if (insertTab) {
            if (instance.getOption("indentWithTabs")) {
                CodeMirror.commands.insertTab(instance);
            } else {
                var i, ins = "", numSpaces = instance.getOption("indentUnit");
                numSpaces -= from.ch % numSpaces;
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

        if (!instance.getOption("indentWithTabs") && PreferencesManager.get(SOFT_TABS)) {
            var indentUnit = instance.getOption("indentUnit"),
                cursor     = instance.getCursor(),
                jump       = cursor.ch % indentUnit,
                line       = instance.getLine(cursor.line);

            if (direction === 1) {
                jump = indentUnit - jump;

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
                    jump = indentUnit;
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
    
    /**
     * @private
     * Handle any cursor movement in editor, including selecting and unselecting text.
     * @param {jQueryObject} jqEvent jQuery event object
     * @param {Editor} editor Current, focused editor (main or inline)
     * @param {!Event} event
     */
    function _handleCursorActivity(jqEvent, editor, event) {
        editor._updateStyleActiveLine();
    }
    
    function _handleKeyEvents(jqEvent, editor, event) {
        _checkElectricChars(jqEvent, editor, event);
    }

    /**
     * Helper functions to check options.
     * @param {number} options BOUNDARY_CHECK_NORMAL or BOUNDARY_IGNORE_TOP
     */
    function _checkTopBoundary(options) {
        return (options !== BOUNDARY_IGNORE_TOP);
    }
    function _checkBottomBoundary(options) {
        return true;
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
     * @param {!jQueryObject} container  Container to add the editor to.
     * @param {{startLine: number, endLine: number}=} range If specified, range of lines within the document
     *          to display in this editor. Inclusive.
     */
    function Editor(document, makeMasterEditor, container, range) {
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
        this._handleDocumentLanguageChanged = this._handleDocumentLanguageChanged.bind(this);
        $(document).on("change", this._handleDocumentChange);
        $(document).on("deleted", this._handleDocumentDeleted);
        $(document).on("languageChanged", this._handleDocumentLanguageChanged);

        var mode = this._getModeFromDocument();
        
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
                    CodeMirror.commands.delCharBefore(instance);
                }
            },
            "Delete": function (instance) {
                if (!_handleSoftTabNavigation(instance, 1, "deleteH")) {
                    CodeMirror.commands.delCharAfter(instance);
                }
            },
            "Esc": function (instance) {
                self.removeAllInlineWidgets();
            },
            "Cmd-Left": "goLineStartSmart"
        };
        
        var currentOptions = this._currentOptions = _.zipObject(
            editorOptions,
            _.map(editorOptions, function (prefName) {
                return self._getOption(prefName);
            })
        );
        
        // Create the CodeMirror instance
        // (note: CodeMirror doesn't actually require using 'new', but jslint complains without it)
        this._codeMirror = new CodeMirror(container, {
            electricChars: false,   // we use our own impl of this to avoid CodeMirror bugs; see _checkElectricChars()
            smartIndent: currentOptions[SMART_INDENT],
            indentWithTabs: currentOptions[USE_TAB_CHAR],
            tabSize: currentOptions[TAB_SIZE],
            indentUnit: currentOptions[USE_TAB_CHAR] ? currentOptions[TAB_SIZE] : currentOptions[SPACE_UNITS],
            lineNumbers: currentOptions[SHOW_LINE_NUMBERS],
            lineWrapping: currentOptions[WORD_WRAP],
            styleActiveLine: currentOptions[STYLE_ACTIVE_LINE],
            coverGutterNextToScrollbar: true,
            matchBrackets: true,
            matchTags: {bothTags: true},
            dragDrop: false,
            extraKeys: codeMirrorKeyMap,
            autoCloseBrackets: currentOptions[CLOSE_BRACKETS],
            autoCloseTags: currentOptions[CLOSE_TAGS],
            cursorScrollMargin: 3
        });
        
        // Can't get CodeMirror's focused state without searching for
        // CodeMirror-focused. Instead, track focus via onFocus and onBlur
        // options and track state with this._focused
        this._focused = false;
        
        this._installEditorListeners();
        
        $(this)
            .on("cursorActivity", _handleCursorActivity)
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
            this._updateHiddenLines();
            this.setCursorPos(range.startLine, 0);
        }

        // Now that we're fully initialized, we can point the document back at us if needed
        if (makeMasterEditor) {
            document._makeEditable(this);
        }
        
        // Add scrollTop property to this object for the scroll shadow code to use
        Object.defineProperty(this, "scrollTop", {
            get: function () {
                return this._codeMirror.getScrollInfo().top;
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
        $(this.document).off("languageChanged", this._handleDocumentLanguageChanged);
        
        if (this._visibleRange) {   // TextRange also refs the Document
            this._visibleRange.dispose();
        }
        
        // If we're the Document's master editor, disconnecting from it has special meaning
        if (this.document._masterEditor === this) {
            this.document._makeNonEditable();
        }
        
        // Destroying us destroys any inline widgets we're hosting. Make sure their closeCallbacks
        // run, at least, since they may also need to release Document refs
        var self = this;
        this._inlineWidgets.forEach(function (inlineWidget) {
            self._removeInlineWidgetInternal(inlineWidget);
        });
    };
    
    /**
     * Determine the mode to use from the document's language
     * Uses "text/plain" if the language does not define a mode
     * @return string The mode to use
     */
    Editor.prototype._getModeFromDocument = function () {
        // We'd like undefined/null/"" to mean plain text mode. CodeMirror defaults to plaintext for any
        // unrecognized mode, but it complains on the console in that fallback case: so, convert
        // here so we're always explicit, avoiding console noise.
        return this.document.getLanguage().getMode() || "text/plain";
    };
    
        
    /**
     * Selects all text and maintains the current scroll position.
     */
    Editor.prototype.selectAllNoScroll = function () {
        var cm = this._codeMirror,
            info = this._codeMirror.getScrollInfo();
        
        // Note that we do not have to check for the visible range here. This
        // concern is handled internally by code mirror.
        cm.operation(function () {
            cm.scrollTo(info.left, info.top);
            cm.execCommand("selectAll");
        });
    };
    
    /** @return {boolean} True if editor is not showing the entire text of the document (i.e. an inline editor) */
    Editor.prototype.isTextSubset = function () {
        return Boolean(this._visibleRange);
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
                self._hideMarks.forEach(function (mark) {
                    if (mark) {
                        mark.clear();
                    }
                });
                self._hideMarks = [];
                self._hideMarks.push(self._hideLines(0, self._visibleRange.startLine));
                self._hideMarks.push(self._hideLines(self._visibleRange.endLine + 1, self.lineCount()));
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
                        console.error("Change record received with only one end undefined--replacing entire text");
                    }
                    cm.setValue(newText);
                } else {
                    cm.replaceRange(newText, change.from, change.to, change.origin);
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
        
        // The "editorChange" event is mostly for the use of the CodeHintManager.
        // It differs from the normal "change" event, that it's actually publicly usable,
        // whereas the "change" event should be listened to on the document. Also the
        // Editor dispatches a change event before this event is dispatched, because
        // CodeHintManager needs to hook in here when other things are already done.
        $(this).triggerHandler("editorChange", [this, changeList]);
    };
    
    /**
     * Responds to changes in the Document's text, syncing the changes into our CodeMirror instance.
     * There are several cases where we want to ignore a Document change:
     *  - if we're the master editor, Document changes should be ignored because we already have the right
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
     * Responds to language changes, for instance when the file extension is changed.
     */
    Editor.prototype._handleDocumentLanguageChanged = function (event) {
        this._codeMirror.setOption("mode", this._getModeFromDocument());
    };
    
    
    /**
     * Install event handlers on the CodeMirror instance, translating them into
     * jQuery events on the Editor instance.
     */
    Editor.prototype._installEditorListeners = function () {
        var self = this;
        
        // onKeyEvent is an option in CodeMirror rather than an event--it's a
        // low-level hook for all keyboard events rather than a specific event. For
        // our purposes, though, it's convenient to treat it as an event internally,
        // so we bridge it to jQuery events the same way we do ordinary CodeMirror
        // events.
        this._codeMirror.setOption("onKeyEvent", function (instance, event) {
            $(self).triggerHandler("keyEvent", [self, event]);
            return event.defaultPrevented;   // false tells CodeMirror we didn't eat the event
        });
        
        // FUTURE: if this list grows longer, consider making this a more generic mapping
        // NOTE: change is a "private" event--others shouldn't listen to it on Editor, only on
        // Document
        this._codeMirror.on("change", function (instance, changeList) {
            $(self).triggerHandler("change", [self, changeList]);
        });
        this._codeMirror.on("beforeChange", function (instance, changeObj) {
            $(self).triggerHandler("beforeChange", [self, changeObj]);
        });
        this._codeMirror.on("cursorActivity", function (instance) {
            $(self).triggerHandler("cursorActivity", [self]);
        });
        this._codeMirror.on("scroll", function (instance) {
            // If this editor is visible, close all dropdowns on scroll.
            // (We don't want to do this if we're just scrolling in a non-visible editor
            // in response to some document change event.)
            if (self.isFullyVisible()) {
                Menus.closeAll();
            }

            $(self).triggerHandler("scroll", [self]);
        });

        // Convert CodeMirror onFocus events to EditorManager activeEditorChanged
        this._codeMirror.on("focus", function () {
            self._focused = true;
            $(self).triggerHandler("focus", [self]);
        });
        
        this._codeMirror.on("blur", function () {
            self._focused = false;
            // EditorManager only cares about other Editors gaining focus, so we don't notify it of anything here
        });

        this._codeMirror.on("update", function (instance) {
            $(self).triggerHandler("update", [self]);
        });
        this._codeMirror.on("overwriteToggle", function (instance, newstate) {
            $(self).triggerHandler("overwriteToggle", [self, newstate]);
        });
    };
    
    /**
     * Sets the contents of the editor, clears the undo/redo history and marks the document clean. Dispatches a change event.
     * Semi-private: only Document should call this.
     * @param {!string} text
     */
    Editor.prototype._resetText = function (text) {
        var perfTimerName = PerfUtils.markStart("Editor._resetText()\t" + (!this.document || this.document.file.fullPath));

        var cursorPos = this.getCursorPos(),
            scrollPos = this.getScrollPos();
        
        // This *will* fire a change event, but we clear the undo immediately afterward
        this._codeMirror.setValue(text);
        
        // Make sure we can't undo back to the empty state before setValue(), and mark
        // the document clean.
        this._codeMirror.clearHistory();
        this._codeMirror.markClean();
        
        // restore cursor and scroll positions
        this.setCursorPos(cursorPos);
        this.setScrollPos(scrollPos.x, scrollPos.y);

        PerfUtils.addMeasurement(perfTimerName);
    };
    
    
    /**
     * Gets the current cursor position within the editor. If there is a selection, returns whichever
     * end of the range the cursor lies at.
     * @param {boolean} expandTabs  If true, return the actual visual column number instead of the character offset in
     *      the "ch" property.
     * @return !{line:number, ch:number}
     */
    Editor.prototype.getCursorPos = function (expandTabs) {
        var cursor = this._codeMirror.getCursor();
        
        if (expandTabs) {
            cursor.ch = this.getColOffset(cursor);
        }
        return cursor;
    };
    
    /**
     * Returns the display column (zero-based) for a given string-based pos. Differs from pos.ch only
     * when the line contains preceding \t chars. Result depends on the current tab size setting.
     * @param {!{line:number, ch:number}} pos
     * @return {number}
     */
    Editor.prototype.getColOffset = function (pos) {
        var line    = this._codeMirror.getRange({line: pos.line, ch: 0}, pos),
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
        return column;
    };
    
    /**
     * Sets the cursor position within the editor. Removes any selection.
     * @param {number} line  The 0 based line number.
     * @param {number} ch  The 0 based character position; treated as 0 if unspecified.
     * @param {boolean=} center  True if the view should be centered on the new cursor position.
     * @param {boolean=} expandTabs  If true, use the actual visual column number instead of the character offset as
     *      the "ch" parameter.
     */
    Editor.prototype.setCursorPos = function (line, ch, center, expandTabs) {
        if (expandTabs) {
            ch = this.getColOffset({line: line, ch: ch});
        }
        this._codeMirror.setCursor(line, ch);
        if (center) {
            this.centerOnCursor();
        }
    };
    
    /**
     * Set the editor size in pixels or percentage
     * @param {(number|string)} width
     * @param {(number|string)} height
     */
    Editor.prototype.setSize = function (width, height) {
        this._codeMirror.setSize(width, height);
    };
    
    var CENTERING_MARGIN = 0.15;
    
    /**
     * Scrolls the editor viewport to vertically center the line with the cursor,
     * but only if the cursor is currently near the edges of the viewport or
     * entirely outside the viewport.
     *
     * This does not alter the horizontal scroll position.
     *
     * @param {number} centerOptions Option value, or 0 for no options.
     */
    Editor.prototype.centerOnCursor = function (centerOptions) {
        var $scrollerElement = $(this.getScrollerElement());
        var editorHeight = $scrollerElement.height();
        
        // we need to make adjustments for the statusbar's padding on the bottom and the menu bar on top.
        var statusBarHeight = $scrollerElement.outerHeight() - editorHeight;
        var menuBarHeight = $scrollerElement.offset().top;
        
        var documentCursorPosition = this._codeMirror.cursorCoords(null, "local").bottom;
        var screenCursorPosition = this._codeMirror.cursorCoords(null, "page").bottom - menuBarHeight;
        
        // If the cursor is already reasonably centered, we won't
        // make any change. "Reasonably centered" is defined as
        // not being within CENTERING_MARGIN of the top or bottom
        // of the editor (where CENTERING_MARGIN is a percentage
        // of the editor height).
        // For finding the first item (i.e. find while typing), do
        // not center if hit is in first half of screen because this
        // appears to be an unnecesary scroll.
        if ((_checkTopBoundary(centerOptions) && (screenCursorPosition < editorHeight * CENTERING_MARGIN)) ||
                (_checkBottomBoundary(centerOptions) && (screenCursorPosition > editorHeight * (1 - CENTERING_MARGIN)))) {

            var pos = documentCursorPosition - editorHeight / 2 + statusBarHeight;
            var info = this._codeMirror.getScrollInfo();
            pos = Math.min(Math.max(pos, 0), (info.height - info.clientHeight));
            this.setScrollPos(null, pos);
        }
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
     * Returns true if pos is between start and end (INclusive at start; EXclusive at end by default,
     * but overridable via the endInclusive flag).
     * @param {{line:number, ch:number}} pos
     * @param {{line:number, ch:number}} start
     * @param {{line:number, ch:number}} end
     * @param {boolean} endInclusive
     *
     */
    Editor.prototype.posWithinRange = function (pos, start, end, endInclusive) {
        if (start.line <= pos.line && end.line >= pos.line) {
            if (endInclusive) {
                return (start.line < pos.line || start.ch <= pos.ch) &&  // inclusive
                    (end.line > pos.line   || end.ch >= pos.ch);      // inclusive
            } else {
                return (start.line < pos.line || start.ch <= pos.ch) &&  // inclusive
                    (end.line > pos.line   || end.ch > pos.ch);       // exclusive
            }
                   
        }
        return false;
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
     * end of the selection range. Optionally centers the around the cursor after
     * making the selection
     *
     * @param {!{line:number, ch:number}} start
     * @param {!{line:number, ch:number}} end
     * @param {boolean} center true to center the viewport
     * @param {number} centerOptions Option value, or 0 for no options.
     */
    Editor.prototype.setSelection = function (start, end, center, centerOptions) {
        this._codeMirror.setSelection(start, end);
        if (center) {
            this.centerOnCursor(centerOptions);
        }
    };

    /**
     * Sets the editors overwrite mode state. If null is passed, the state is toggled.
     *
     * @param {?boolean} start
     */
    Editor.prototype.toggleOverwrite = function (state) {
        this._codeMirror.toggleOverwrite(state);
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
     * Deterines if line is fully visible.
     * @param {number} zero-based index of the line to test
     * @return {boolean} true if the line is fully visible, false otherwise
     */
    Editor.prototype.isLineVisible = function (line) {
        var coords = this._codeMirror.charCoords({line: line, ch: 0}, "local"),
            scrollInfo = this._codeMirror.getScrollInfo(),
            top = scrollInfo.top,
            bottom = scrollInfo.top + scrollInfo.clientHeight;

        // Check top and bottom and return false for partially visible lines.
        return (coords.top >= top && coords.bottom <= bottom);
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

    /* Hides the specified line number in the editor
     * @param {!from} line to start hiding from (inclusive)
     * @param {!to} line to end hiding at (exclusive)
     * @return {TextMarker} The CodeMirror mark object that's hiding the lines
     */
    Editor.prototype._hideLines = function (from, to) {
        if (to <= from) {
            return;
        }
        
        // We set clearWhenEmpty: false so that if there's a blank line at the beginning or end of
        // the document, and that's the only hidden line, we can still actually hide it. Doing so
        // requires us to create a 0-length marked span, which would ordinarily be cleaned up by CM
        // if clearWithEmpty is true. See https://groups.google.com/forum/#!topic/codemirror/RB8VNF8ow2w
        var value = this._codeMirror.markText(
            {line: from, ch: 0},
            {line: to - 1, ch: this._codeMirror.getLine(to - 1).length},
            {collapsed: true, inclusiveLeft: true, inclusiveRight: true, clearWhenEmpty: false}
        );
        
        return value;
    };

    /**
     * Gets the total height of the document in pixels (not the viewport)
     * @returns {!number} height in pixels
     */
    Editor.prototype.totalHeight = function () {
        return this.getScrollerElement().scrollHeight;
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
        var scrollInfo = this._codeMirror.getScrollInfo();
        return { x: scrollInfo.left, y: scrollInfo.top };
    };
    
    /**
     * Sets the current scroll position of the editor.
     * @param {number} x scrollLeft position in pixels
     * @param {number} y scrollTop position in pixels
     */
    Editor.prototype.setScrollPos = function (x, y) {
        this._codeMirror.scrollTo(x, y);
    };
    
    /*
     * Returns the current text height of the editor.
     * @returns {number} Height of the text in pixels
     */
    Editor.prototype.getTextHeight = function () {
        return this._codeMirror.defaultTextHeight();
    };
    
    /**
     * Adds an inline widget below the given line. If any inline widget was already open for that
     * line, it is closed without warning.
     * @param {!{line:number, ch:number}} pos  Position in text to anchor the inline.
     * @param {!InlineWidget} inlineWidget The widget to add.
     * @param {boolean=} scrollLineIntoView Scrolls the associated line into view. Default true.
     * @return {$.Promise} A promise object that is resolved when the widget has been added (but might
     *     still be animating open). Never rejected.
     */
    Editor.prototype.addInlineWidget = function (pos, inlineWidget, scrollLineIntoView) {
        var self = this,
            queue = this._inlineWidgetQueues[pos.line],
            deferred = new $.Deferred();
        if (!queue) {
            queue = new Async.PromiseQueue();
            this._inlineWidgetQueues[pos.line] = queue;
        }
        queue.add(function () {
            self._addInlineWidgetInternal(pos, inlineWidget, scrollLineIntoView, deferred);
            return deferred.promise();
        });
        return deferred.promise();
    };
    
    /**
     * @private
     * Does the actual work of addInlineWidget().
     */
    Editor.prototype._addInlineWidgetInternal = function (pos, inlineWidget, scrollLineIntoView, deferred) {
        var self = this;
        
        this.removeAllInlineWidgetsForLine(pos.line).done(function () {
            if (scrollLineIntoView === undefined) {
                scrollLineIntoView = true;
            }
    
            if (scrollLineIntoView) {
                self._codeMirror.scrollIntoView(pos);
            }
    
            inlineWidget.info = self._codeMirror.addLineWidget(pos.line, inlineWidget.htmlContent,
                                                               { coverGutter: true, noHScroll: true });
            CodeMirror.on(inlineWidget.info.line, "delete", function () {
                self._removeInlineWidgetInternal(inlineWidget);
            });
            self._inlineWidgets.push(inlineWidget);

            // Set up the widget to start closed, then animate open when its initial height is set.
            inlineWidget.$htmlContent.height(0);
            AnimationUtils.animateUsingClass(inlineWidget.htmlContent, "animating")
                .done(function () {
                    deferred.resolve();
                });

            // Callback to widget once parented to the editor. The widget should call back to
            // setInlineWidgetHeight() in order to set its initial height and animate open.
            inlineWidget.onAdded();
        });
    };
    
    /**
     * Removes all inline widgets
     */
    Editor.prototype.removeAllInlineWidgets = function () {
        // copy the array because _removeInlineWidgetInternal will modify the original
        var widgets = [].concat(this.getInlineWidgets());
        
        return Async.doInParallel(
            widgets,
            this.removeInlineWidget.bind(this)
        );
    };
    
    /**
     * Removes the given inline widget.
     * @param {number} inlineWidget The widget to remove.
     * @return {$.Promise} A promise that is resolved when the inline widget is fully closed and removed from the DOM.
     */
    Editor.prototype.removeInlineWidget = function (inlineWidget) {
        var deferred = new $.Deferred(),
            self = this;

        function finishRemoving() {
            self._codeMirror.removeLineWidget(inlineWidget.info);
            self._removeInlineWidgetInternal(inlineWidget);
            deferred.resolve();
        }
            
        if (!inlineWidget.closePromise) {
            var lineNum = this._getInlineWidgetLineNumber(inlineWidget);
            
            // Remove the inline widget from our internal list immediately, so
            // everyone external to us knows it's essentially already gone. We
            // don't want to wait until it's done animating closed (but we do want
            // the other stuff in _removeInlineWidgetInternal to wait until then).
            self._removeInlineWidgetFromList(inlineWidget);
            
            // If we're not visible (in which case the widget will have 0 client height),
            // don't try to do the animation, because nothing will happen and we won't get
            // called back right away. (The animation would happen later when we switch
            // back to the editor.)
            if (self.isFullyVisible()) {
                AnimationUtils.animateUsingClass(inlineWidget.htmlContent, "animating")
                    .done(finishRemoving);
                inlineWidget.$htmlContent.height(0);
            } else {
                finishRemoving();
            }
            inlineWidget.closePromise = deferred.promise();
        }
        return inlineWidget.closePromise;
    };
    
    /**
     * Removes all inline widgets for a given line
     * @param {number} lineNum The line number to modify
     */
    Editor.prototype.removeAllInlineWidgetsForLine = function (lineNum) {
        var lineInfo = this._codeMirror.lineInfo(lineNum),
            widgetInfos = (lineInfo && lineInfo.widgets) ? [].concat(lineInfo.widgets) : null,
            self = this;
        
        if (widgetInfos && widgetInfos.length) {
            // Map from CodeMirror LineWidget to Brackets InlineWidget
            var inlineWidget,
                allWidgetInfos = this._inlineWidgets.map(function (w) {
                    return w.info;
                });

            return Async.doInParallel(
                widgetInfos,
                function (info) {
                    // Lookup the InlineWidget object using the same index
                    inlineWidget = self._inlineWidgets[allWidgetInfos.indexOf(info)];
                    if (inlineWidget) {
                        return self.removeInlineWidget(inlineWidget);
                    } else {
                        return new $.Deferred().resolve().promise();
                    }
                }
            );
        } else {
            return new $.Deferred().resolve().promise();
        }
    };
    
    /**
     * Cleans up the given inline widget from our internal list of widgets. It's okay
     * to call this multiple times for the same widget--it will just do nothing if
     * the widget has already been removed.
     * @param {InlineWidget} inlineWidget  an inline widget.
     */
    Editor.prototype._removeInlineWidgetFromList = function (inlineWidget) {
        var l = this._inlineWidgets.length,
            i;
        for (i = 0; i < l; i++) {
            if (this._inlineWidgets[i] === inlineWidget) {
                this._inlineWidgets.splice(i, 1);
                break;
            }
        }
    };
    
    /**
     * Removes the inline widget from the editor and notifies it to clean itself up.
     * @param {InlineWidget} inlineWidget  an inline widget.
     */
    Editor.prototype._removeInlineWidgetInternal = function (inlineWidget) {
        if (!inlineWidget.isClosed) {
            this._removeInlineWidgetFromList(inlineWidget);
            inlineWidget.onClosed();
            inlineWidget.isClosed = true;
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
     * Returns the offset of the top of the virtual scroll area relative to the browser window (not the editor
     * itself). Mainly useful for calculations related to scrollIntoView(), where you're starting with the
     * offset() of a child widget (relative to the browser window) and need to figure out how far down it is from
     * the top of the virtual scroll area (excluding the top padding).
     * @return {number}
     */
    Editor.prototype.getVirtualScrollAreaTop = function () {
        var topPadding = this._getLineSpaceElement().offsetTop, // padding within mover
            scroller = this.getScrollerElement();
        return $(scroller).offset().top - scroller.scrollTop + topPadding;
    };

    /**
     * Sets the height of an inline widget in this editor.
     * @param {!InlineWidget} inlineWidget The widget whose height should be set.
     * @param {!number} height The height of the widget.
     * @param {boolean} ensureVisible Whether to scroll the entire widget into view.
     */
    Editor.prototype.setInlineWidgetHeight = function (inlineWidget, height, ensureVisible) {
        var self = this,
            node = inlineWidget.htmlContent,
            oldHeight = (node && $(node).height()) || 0,
            changed = (oldHeight !== height),
            isAttached = inlineWidget.info !== undefined;

        function updateHeight() {
            // Notify CodeMirror for the height change.
            if (isAttached) {
                inlineWidget.info.changed();
            }
        }
        
        function setOuterHeight() {
            function finishAnimating(e) {
                if (e.target === node) {
                    updateHeight();
                    $(node).off("webkitTransitionEnd", finishAnimating);
                }
            }
            $(node).height(height);
            if ($(node).hasClass("animating")) {
                $(node).on("webkitTransitionEnd", finishAnimating);
            } else {
                updateHeight();
            }
        }

        // Make sure we set an explicit height on the widget, so children can use things like
        // min-height if they want.
        if (changed || !node.style.height) {
            // If we're animating, set the wrapper's height on a timeout so the layout is finished before we animate.
            if ($(node).hasClass("animating")) {
                window.setTimeout(setOuterHeight, 0);
            } else {
                setOuterHeight();
            }
        }

        if (ensureVisible && isAttached) {
            var offset = $(node).offset(), // offset relative to document
                position = $(node).position(), // position within parent linespace
                scrollerTop = self.getVirtualScrollAreaTop();

            self._codeMirror.scrollIntoView({
                left: position.left,
                top: offset.top - scrollerTop,
                right: position.left, // don't try to make the right edge visible
                bottom: offset.top + height - scrollerTop
            });
        }
    };
    
    /**
     * @private
     * Get the starting line number for an inline widget.
     * @param {!InlineWidget} inlineWidget
     * @return {number} The line number of the widget or -1 if not found.
     */
    Editor.prototype._getInlineWidgetLineNumber = function (inlineWidget) {
        return this._codeMirror.getLineNumber(inlineWidget.info.line);
    };
    
    /** Gives focus to the editor control */
    Editor.prototype.focus = function () {
        // Focusing an editor synchronously triggers focus/blur handlers. If a blur handler attemps to focus
        // another editor, we'll put CM in a bad state (because CM assumes programmatically focusing itself
        // will always succeed, and if you're in the middle of another focus change that appears to be untrue).
        // So instead, we simply ignore reentrant focus attempts.
        // See bug #2951 for an example of this happening and badly hosing things.
        if (_duringFocus) {
            return;
        }
        
        _duringFocus = true;
        try {
            this._codeMirror.focus();
        } finally {
            _duringFocus = false;
        }
    };
    
    /** Returns true if the editor has focus */
    Editor.prototype.hasFocus = function () {
        return this._focused;
    };
    
    /**
     * Re-renders the editor UI
     * @param {boolean=} handleResize true if this is in response to resizing the editor. Default false.
     */
    Editor.prototype.refresh = function (handleResize) {
        // If focus is currently in a child of the CodeMirror editor (e.g. in an inline widget), but not in
        // the CodeMirror input field itself, remember the focused item so we can restore focus after the
        // refresh (which might cause the widget to be removed from the display list temporarily).
        var focusedItem = window.document.activeElement,
            restoreFocus = $.contains(this._codeMirror.getScrollerElement(), focusedItem);
        this._codeMirror.refresh();
        if (restoreFocus) {
            focusedItem.focus();
        }
    };
    
    /**
     * Re-renders the editor, and all children inline editors.
     * @param {boolean=} handleResize true if this is in response to resizing the editor. Default false.
     */
    Editor.prototype.refreshAll = function (handleResize) {
        this.refresh(handleResize);
        this.getInlineWidgets().forEach(function (inlineWidget) {
            inlineWidget.refresh();
        });
    };
    
    /** Undo the last edit. */
    Editor.prototype.undo = function () {
        this._codeMirror.undo();
    };
    
    /** Redo the last un-done edit. */
    Editor.prototype.redo = function () {
        this._codeMirror.redo();
    };
    
    /**
     * Shows or hides the editor within its parent. Does not force its ancestors to
     * become visible.
     * @param {boolean} show true to show the editor, false to hide it
     * @param {boolean} refresh true (default) to refresh the editor, false to skip refreshing it
     */
    Editor.prototype.setVisible = function (show, refresh) {
        $(this.getRootElement()).css("display", (show ? "" : "none"));
        if (show && (refresh || refresh === undefined)) {
            this.refresh();
        }
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
     * @return {?(Object|string)} Name of syntax-highlighting mode, or object containing a "name" property
     *     naming the mode along with configuration options required by the mode.
     *     See {@link LanguageManager#getLanguageForPath()} and {@link Language#getMode()}.
     */
    Editor.prototype.getModeForSelection = function () {
        // Check for mixed mode info
        var sel         = this.getSelection(),
            outerMode   = this._codeMirror.getMode(),
            startMode   = TokenUtils.getModeAt(this._codeMirror, sel.start),
            isMixed     = (outerMode.name !== startMode.name);

        if (isMixed) {
            // If mixed mode, check that mode is the same at start & end of selection
            if (sel.start.line !== sel.end.line || sel.start.ch !== sel.end.ch) {
                var endMode = TokenUtils.getModeAt(this._codeMirror, sel.end);
                
                if (startMode.name !== endMode.name) {
                    return null;
                }
            }

            return startMode.name;
        } else {
            // Mode does not vary: just use the editor-wide mode
            return this._codeMirror.getOption("mode");
        }
    };
    
    Editor.prototype.getLanguageForSelection = function () {
        return this.document.getLanguage().getLanguageForMode(this.getModeForSelection());
    };
    
    /**
     * Gets the syntax-highlighting mode for the document.
     *
     * @return {Object|String} Object or Name of syntax-highlighting mode; see {@link LanguageManager#getLanguageForPath()} and {@link Language#getMode()}.
     */
    Editor.prototype.getModeForDocument = function () {
        return this._codeMirror.getOption("mode");
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
    
    /**
     * @private
     * @type {Object}
     * Promise queues for inline widgets being added to a given line.
     */
    Editor.prototype._inlineWidgetQueues = {};
    
    /**
     * @private
     * @type {Array}
     * A list of objects corresponding to the markers that are hiding lines in the current editor.
     */
    Editor.prototype._hideMarks = [];
    
    /**
     * @private
     * 
     * Retrieve the value of the named preference for this document.
     * 
     * @param {string} prefName Name of preference to retrieve.
     * @return {*} current value of that pref
     */
    Editor.prototype._getOption = function (prefName) {
        return PreferencesManager.get(prefName, this.document.file.fullPath);
    };
    
    /**
     * @private
     * 
     * Updates the editor to the current value of prefName for the file being edited.
     * 
     * @param {string} prefName Name of the preference to visibly update
     */
    Editor.prototype._updateOption = function (prefName) {
        var oldValue = this._currentOptions[prefName],
            newValue = this._getOption(prefName);
        
        if (oldValue !== newValue) {
            this._currentOptions[prefName] = newValue;
            
            if (prefName === USE_TAB_CHAR) {
                this._codeMirror.setOption(cmOptions[prefName], newValue);
                this._codeMirror.setOption("indentUnit", newValue === true ?
                                           this._currentOptions[TAB_SIZE] :
                                           this._currentOptions[SPACE_UNITS]
                                          );
            } else if (prefName === STYLE_ACTIVE_LINE) {
                this._updateStyleActiveLine();
            } else {
                // Set the CodeMirror option as long as it's not a change
                // that is in conflict with the useTabChar setting.
                var useTabChar = this._currentOptions[USE_TAB_CHAR];
                if ((useTabChar && prefName === SPACE_UNITS) ||
                        (!useTabChar && prefName === TAB_SIZE)) {
                    return;
                }
                
                this._codeMirror.setOption(cmOptions[prefName], newValue);
            }
            
            $(this).triggerHandler("optionChange", [prefName, newValue]);
        }
    };
    
    /**
     * @private
     * 
     * Used to ensure that "style active line" is turned off when there is a selection.
     */
    Editor.prototype._updateStyleActiveLine = function () {
        if (this.hasSelection()) {
            if (this._codeMirror.getOption("styleActiveLine")) {
                this._codeMirror.setOption("styleActiveLine", false);
            }
        } else {
            this._codeMirror.setOption("styleActiveLine", this._currentOptions[STYLE_ACTIVE_LINE]);
        }
    };
    
    // Global settings that affect Editor instances that share the same preference locations

    /**
     * Sets whether to use tab characters (vs. spaces) when inserting new text.
     * Affects any editors that share the same preference location.
     * @param {boolean} value
     */
    Editor.setUseTabChar = function (value) {
        PreferencesManager.set(USE_TAB_CHAR, value);
    };
    
    /** @type {boolean} Gets whether the current editor uses tab characters (vs. spaces) when inserting new text */
    Editor.getUseTabChar = function () {
        return PreferencesManager.get(USE_TAB_CHAR);
    };
    
    /**
     * Sets tab character width.
     * Affects any editors that share the same preference location.
     * @param {number} value
     */
    Editor.setTabSize = function (value) {
        PreferencesManager.set(TAB_SIZE, value);
    };
    
    /** @type {number} Get indent unit  */
    Editor.getTabSize = function () {
        return PreferencesManager.get(TAB_SIZE);
    };
    
    /**
     * Sets indentation width.
     * Affects any editors that share the same preference location.
     * @param {number} value
     */
    Editor.setSpaceUnits = function (value) {
        PreferencesManager.set(SPACE_UNITS, value);
    };
    
    /** @type {number} Get indentation width */
    Editor.getSpaceUnits = function () {
        return PreferencesManager.get(SPACE_UNITS);
    };
    
    /**
     * Sets the auto close brackets.
     * Affects any editors that share the same preference location.
     * @param {boolean} value
     */
    Editor.setCloseBrackets = function (value) {
        PreferencesManager.set(CLOSE_BRACKETS, value);
    };
    
    /** @type {boolean} Gets whether the current editor uses auto close brackets */
    Editor.getCloseBrackets = function () {
        return PreferencesManager.get(CLOSE_BRACKETS);
    };
    
    /**
     * Sets show line numbers option.
     * Affects any editors that share the same preference location.
     * @param {boolean} value
     */
    Editor.setShowLineNumbers = function (value) {
        PreferencesManager.set(SHOW_LINE_NUMBERS, value);
    };
    
    /** @type {boolean} Returns true if show line numbers is enabled for the current editor */
    Editor.getShowLineNumbers = function () {
        return PreferencesManager.get(SHOW_LINE_NUMBERS);
    };
    
    /**
     * Sets show active line option.
     * Affects any editors that share the same preference location.
     * @param {boolean} value
     */
    Editor.setShowActiveLine = function (value) {
        PreferencesManager.set(STYLE_ACTIVE_LINE, value);
    };
    
    /** @type {boolean} Returns true if show active line is enabled for the current editor */
    Editor.getShowActiveLine = function () {
        return PreferencesManager.get(STYLE_ACTIVE_LINE);
    };
    
    /**
     * Sets word wrap option.
     * Affects any editors that share the same preference location.
     * @param {boolean} value
     */
    Editor.setWordWrap = function (value) {
        PreferencesManager.set(WORD_WRAP, value);
    };
    
    /** @type {boolean} Returns true if word wrap is enabled for the current editor */
    Editor.getWordWrap = function () {
        return PreferencesManager.get(WORD_WRAP);
    };
    
    /**
     * Sets the soft tabs.
     * Affects any editors that share the same preference location.
     * @param {boolean} value
     */
    Editor.setSoftTabs = function (value) {
        PreferencesManager.set(SOFT_TABS, value);
    };
    
    /** @type {boolean} Gets whether the current editor uses soft tabs */
    Editor.getSoftTabs = function () {
        return PreferencesManager.get(SOFT_TABS);
    };
    
    // Set up listeners for preference changes
    editorOptions.forEach(function (prefName) {
        PreferencesManager.on("change", prefName, function () {
            _instances.forEach(function (editor) {
                editor._updateOption(prefName);
            });
        });
    });
    
    /**
     * @private
     * 
     * Manage the conversion from old-style localStorage prefs to the new file-based ones.
     */
    function _convertPreferences() {
        var rules = {};
        editorOptions.forEach(function (setting) {
            rules[setting] = "user";
        });
        PreferencesManager.convertPreferences(module, rules);
    }
    
    _convertPreferences();
    
    // Define public API
    exports.Editor                  = Editor;
    exports.BOUNDARY_CHECK_NORMAL   = BOUNDARY_CHECK_NORMAL;
    exports.BOUNDARY_IGNORE_TOP     = BOUNDARY_IGNORE_TOP;
});
