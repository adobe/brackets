/*
 * Copyright 2011 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, $: false, CodeMirror: false */

/**
 * EditorManager owns the UI for the editor area. This essentially mirrors the 'current document'
 * property maintained by DocumentManager's model.
 *
 * Note that there is a little bit of unusual overlap between EditorManager and DocumentManager:
 * because the Document state is actually stored in the CodeMirror editor UI, DocumentManager is
 * not a pure headless model. Each Document encapsulates an editor instance, and thus EditorManager
 * must have some knowledge about Document's internal state (we access its _editor property).
 */
define(function (require, exports, module) {
    'use strict';
    
    // Load dependent modules
    var DocumentManager     = require("DocumentManager"),
        EditorUtils         = require("EditorUtils"),
        Strings             = require("strings");
    
    /** @type {jQueryObject} DOM node that contains all editors (visible and hidden alike) */
    var _editorHolder = null;
    
    /** @type {CodeMirror} */
    var _currentEditor = null;
    /** @type {Document} */
    var _currentEditorsDocument = null;
    
    /** @type {number} Used by {@link _updateEditorSize()} */
    var _resizeTimeout = null;
    
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
     * Creates a new CodeMirror editor instance containing text from the 
     * specified fileEntry. The editor is not yet visible.
     * @param {!FileEntry} file  The file being edited. Need not lie within the project.
     * @return {Deferred} a jQuery Deferred that will be resolved with (the new editor, the file's
     *      timestamp at the time it was read, the original text as read off disk); or rejected if
     *      the file cannot be read.
     */
    function _createEditor(fileEntry) {
        var result = new $.Deferred(),
            reader = DocumentManager.readAsText(fileEntry);

        reader.done(function (text, readTimestamp) {
            // NOTE: CodeMirror doesn't actually require calling 'new',
            // but jslint does require it because of the capital 'C'
            var editor = new CodeMirror(_editorHolder.get(0), {
                electricChars: false,
                indentUnit : 4,
                lineNumbers: true,
                extraKeys: {
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
                    "Shift-Ctrl-O": "fileFind"
                },
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
                    
                    return false;
                }
            });
            
            // Set code-coloring mode
            EditorUtils.setModeFromFileExtension(editor, fileEntry.fullPath);
            
            // Initially populate with text. This will send a spurious change event, but that's ok
            // because no one's listening yet (and we clear the undo stack below)
            editor.setValue(text);
            
            // Make sure we can't undo back to the empty state before setValue()
            editor.clearHistory();

            result.resolve(editor, readTimestamp, text);
        });
        reader.fail(function (error) {
            result.reject(error);
        });

        return result;
    }
    
    /**
     * Disposes the given document's editor if the doc is no longer "open" in the UI (visible or in
     * the working set). Otherwise does nothing.
     * @param {!Document} document
     */
    function _destroyEditorIfUnneeded(document) {
        var editor = document._editor;

        if (!editor) {
            return;
        }
        
        // If outgoing editor is no longer needed, dispose it
        if (!DocumentManager.getDocumentForFile(document.file)) {
            
            // Destroy the editor widget: CodeMirror docs for getWrapperElement() say all you have to do
            // is "Remove this from your tree to delete an editor instance."
            $(editor.getWrapperElement()).remove();
            
            // Our callers should really ensure this, but just for safety...
            if (_currentEditor === editor) {
                _currentEditorsDocument = null;
                _currentEditor = null;
            }
        }
    }

    /** Focus the currently visible editor. If no editor visible, does nothing. */
    function focusEditor() {
        if (_currentEditor) {
            _currentEditor.focus();
        }
    }
    
    /** 
     * Resize the editor. This should only be called if the contents of the editor holder are changed
     * or if the height of the editor holder changes. 
     */
    function resizeEditor() {
        // (see _updateEditorSize() handler above)
        $('.CodeMirror-scroll', _editorHolder).height(_editorHolder.height());
        if (_currentEditor) {
            _currentEditor.refresh();
        }
    }

    
    /**
     * @private
     */
    function _doShow(document) {
        // Show new editor
        _currentEditorsDocument = document;
        _currentEditor = document._editor;

        $(_currentEditor.getWrapperElement()).css("display", "");
        
        // Window may have been resized since last time editor was visible, so kick it now
        resizeEditor();
    }

    /**
     * Make the given document's editor visible in the UI, hiding whatever was
     * visible before. Creates a new editor if none is assigned.
     * @param {!Document} document
     */
    function _showEditor(document) {
        // Hide whatever was visible before
        if (!_currentEditor) {
            $("#notEditor").css("display", "none");
        } else {
            $(_currentEditor.getWrapperElement()).css("display", "none");
            _destroyEditorIfUnneeded(_currentEditorsDocument);
        }

        // Lazily create editor for Documents that were restored on-init
        if (!document._editor) {
            var editorResult = _createEditor(document.file);

            editorResult.done(function (editor, readTimestamp, rawText) {
                document._setEditor(editor, readTimestamp, rawText);
                _doShow(document);
            });
            editorResult.fail(function (error) {
                // Edge case where (a) file exists at launch, (b) editor not 
                // yet opened, and (c) file is deleted or permissions are 
                // modified outside of Brackets
                EditorUtils.showFileOpenError(error.code, document.file.fullPath).done(function () {
                    DocumentManager.closeDocument(document);
                    focusEditor();
                });
            });
        } else {
            _doShow(document);
        }
    }


    /** Hide the currently visible editor and show a placeholder UI in its place */
    function _showNoEditor() {
        if (_currentEditor) {
            $(_currentEditor.getWrapperElement()).css("display", "none");
            _destroyEditorIfUnneeded(_currentEditorsDocument);
            
            _currentEditorsDocument = null;
            _currentEditor = null;
            
            $("#notEditor").css("display", "");
        }
    }

    /** Handles changes to DocumentManager.getCurrentDocument() */
    function _onCurrentDocumentChange() {
        var doc = DocumentManager.getCurrentDocument();
        
        // Update the UI to show the right editor (or nothing), and also dispose old editor if no
        // longer needed.
        if (doc) {
            _showEditor(doc);
        } else {
            _showNoEditor();
        }
    }
    
    /** Handles removals from DocumentManager's working set list */
    function _onWorkingSetRemove(event, removedDoc) {
        // There's one case where an editor should be disposed even though the current document
        // didn't change: removing a document from the working set (via the "X" button). (This may
        // also cover the case where the document WAS current, if the editor-swap happens before the
        // removal from the working set.
        _destroyEditorIfUnneeded(removedDoc);
    }
    // Note: there are several paths that can lead to an editor getting destroyed
    //  - file was in working set, but not open; then closed (via working set "X" button)
    //      --> handled by _onWorkingSetRemove()
    //  - file was open, but not in working set; then navigated away from
    //      --> handled by _onCurrentDocumentChange()
    //  - file was open, but not in working set; then closed (via File > Close) (and thus implicitly
    //    navigated away from)
    //      --> handled by _onCurrentDocumentChange()
    //  - file was open AND in working set; then closed (via File > Close OR working set "X" button)
    //    (and thus implicitly navigated away from)
    //      --> handled by _onWorkingSetRemove() currently, but could be _onCurrentDocumentChange()
    //      just as easily (depends on the order of events coming from DocumentManager)
    
    /**
     * Designates the DOM node that will contain the currently active editor instance. EditorManager
     * will own the content of this DOM node.
     * @param {!jQueryObject} holder
     */
    function setEditorHolder(holder) {
        if (_currentEditor) {
            throw new Error("Cannot change editor area after an editor has already been created!");
        }
        
        _editorHolder = holder;
    }
    
    /**
     * Creates a new CodeMirror editor instance containing text from the 
     * specified fileEntry and wraps it in a new Document tied to the given 
     * file. The editor is not yet visible; to display it in the main
     * editor UI area, ask DocumentManager to make this the current document.
     * @param {!FileEntry} file  The file being edited. Need not lie within the project.
     * @return {Deferred} a jQuery Deferred that will be resolved with a new 
     *  document for the fileEntry, or rejected if the file can not be read.
     */
    function createDocumentAndEditor(fileEntry) {
        var result          = new $.Deferred(),
            editorResult    = _createEditor(fileEntry);

        editorResult.done(function (editor, readTimestamp, rawText) {
            // Create the Document wrapping editor & binding it to a file
            var doc = new DocumentManager.Document(fileEntry);
            doc._setEditor(editor, readTimestamp, rawText);
            result.resolve(doc);
        });

        editorResult.fail(function (error) {
            result.reject(error);
        });

        return result;
    }

    /**
     * NJ's editor-resizing fix. Whenever the window resizes, we immediately adjust the editor's
     * height; somewhat less than once per resize event, we also kick it to do a full re-layout.
     */
    function _updateEditorSize() {
        // Don't refresh every single time
        if (!_resizeTimeout) {
            _resizeTimeout = setTimeout(function () {
                _resizeTimeout = null;
                
                if (_currentEditor) {
                    _currentEditor.refresh();
                }
            }, 100);
        }
        $('.CodeMirror-scroll', _editorHolder).height(_editorHolder.height());
        
        // (see also force-resize code in resizeEditor() )
    }
    
    // Initialize: register listeners
    $(DocumentManager).on("currentDocumentChange", _onCurrentDocumentChange);
    $(DocumentManager).on("workingSetRemove", _onWorkingSetRemove);
    $(window).resize(_updateEditorSize);
    
    // Define public API
    exports.setEditorHolder = setEditorHolder;
    exports.createDocumentAndEditor = createDocumentAndEditor;
    exports.focusEditor = focusEditor;
    exports.resizeEditor = resizeEditor;
});
