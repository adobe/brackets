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
/*global define, $ */

define(function (require, exports, module) {
    "use strict";
    
    var NativeFileSystem    = require("file/NativeFileSystem").NativeFileSystem,
        EditorManager       = require("editor/EditorManager"),
        FileUtils           = require("file/FileUtils"),
        PerfUtils           = require("utils/PerfUtils"),
        LanguageManager     = require("language/LanguageManager");
    
    /**
     * @constructor
     * Model for the contents of a single file and its current modification state.
     * See DocumentManager documentation for important usage notes.
     *
     * Document dispatches these events:
     *
     * change -- When the text of the editor changes (including due to undo/redo). 
     *
     *        Passes ({Document}, {ChangeList}), where ChangeList is a linked list (NOT an array)
     *        of change record objects. Each change record looks like:
     *
     *            { from: start of change, expressed as {line: <line number>, ch: <character offset>},
     *              to: end of change, expressed as {line: <line number>, ch: <chracter offset>},
     *              text: array of lines of text to replace existing text,
     *              next: next change record in the linked list, or undefined if this is the last record }
     *      
     *        The line and ch offsets are both 0-based.
     *
     *        The ch offset in "from" is inclusive, but the ch offset in "to" is exclusive. For example,
     *        an insertion of new content (without replacing existing content) is expressed by a range
     *        where from and to are the same.
     *
     *        If "from" and "to" are undefined, then this is a replacement of the entire text content.
     *
     *        IMPORTANT: If you listen for the "change" event, you MUST also addRef() the document 
     *        (and releaseRef() it whenever you stop listening). You should also listen to the "deleted"
     *        event.
     *  
     *        (FUTURE: this is a modified version of the raw CodeMirror change event format; may want to make 
     *        it an ordinary array)
     *
     * deleted -- When the file for this document has been deleted. All views onto the document should
     *      be closed. The document will no longer be editable or dispatch "change" events.
     *
     * @param {!FileEntry} file  Need not lie within the project.
     * @param {!Date} initialTimestamp  File's timestamp when we read it off disk.
     * @param {!string} rawText  Text content of the file.
     */
    function Document(file, initialTimestamp, rawText) {
        if (!(this instanceof Document)) {  // error if constructor called without 'new'
            throw new Error("Document constructor must be called with 'new'");
        }
        
        this.file = file;
        this._updateLanguage();
        this.refreshText(rawText, initialTimestamp);
    }
    
    /**
     * Number of clients who want this Document to stay alive. The Document is listed in
     * DocumentManager._openDocuments whenever refCount > 0.
     */
    Document.prototype._refCount = 0;
    
    /**
     * The FileEntry for this document. Need not lie within the project.
     * @type {!FileEntry}
     */
    Document.prototype.file = null;

    /**
     * The Language for this document. Will be resolved by file extension in the constructor
     * @type {!Language}
     */
    Document.prototype.language = null;
    
    /**
     * Whether this document has unsaved changes or not.
     * When this changes on any Document, DocumentManager dispatches a "dirtyFlagChange" event.
     * @type {boolean}
     */
    Document.prototype.isDirty = false;
    
    /**
     * What we expect the file's timestamp to be on disk. If the timestamp differs from this, then
     * it means the file was modified by an app other than Brackets.
     * @type {!Date}
     */
    Document.prototype.diskTimestamp = null;
    
    /**
     * The text contents of the file, or null if our backing model is _masterEditor.
     * @type {?string}
     */
    Document.prototype._text = null;
    
    /**
     * Editor object representing the full-size editor UI for this document. May be null if Document
     * has not yet been modified or been the currentDocument; in that case, our backing model is the
     * string _text.
     * @type {?Editor}
     */
    Document.prototype._masterEditor = null;
    
    /**
     * The content's line-endings style. If a Document is created on empty text, or text with
     * inconsistent line endings, defaults to the current platform's standard endings.
     * @type {FileUtils.LINE_ENDINGS_CRLF|FileUtils.LINE_ENDINGS_LF}
     */
    Document.prototype._lineEndings = null;

    /** Add a ref to keep this Document alive */
    Document.prototype.addRef = function () {
        //console.log("+++REF+++ "+this);
        
        if (this._refCount === 0) {
            //console.log("+++ adding to open list");
            if ($(exports).triggerHandler("_afterDocumentCreate", this)) {
                return;
            }
        }
        this._refCount++;
    };
    /** Remove a ref that was keeping this Document alive */
    Document.prototype.releaseRef = function () {
        //console.log("---REF--- "+this);

        this._refCount--;
        if (this._refCount < 0) {
            console.error("Document ref count has fallen below zero!");
            return;
        }
        if (this._refCount === 0) {
            //console.log("--- removing from open list");
            if ($(exports).triggerHandler("_beforeDocumentDelete", this)) {
                return;
            }
        }
    };
    
    /**
     * Attach a backing Editor to the Document, enabling setText() to be called. Assumes Editor has
     * already been initialized with the value of getText(). ONLY Editor should call this (and only
     * when EditorManager has told it to act as the master editor).
     * @param {!Editor} masterEditor
     */
    Document.prototype._makeEditable = function (masterEditor) {
        if (this._masterEditor) {
            console.error("Document is already editable");
        } else {
            this._text = null;
            this._masterEditor = masterEditor;
            $(masterEditor).on("change", this._handleEditorChange.bind(this));
        }
    };
    
    /**
     * Detach the backing Editor from the Document, disallowing setText(). The text content is
     * stored back onto _text so other Document clients continue to have read-only access. ONLY
     * Editor.destroy() should call this.
     */
    Document.prototype._makeNonEditable = function () {
        if (!this._masterEditor) {
            console.error("Document is already non-editable");
        } else {
            // _text represents the raw text, so fetch without normalized line endings
            this._text = this.getText(true);
            this._masterEditor = null;
        }
    };
    
    /**
     * Guarantees that _masterEditor is non-null. If needed, asks EditorManager to create a new master
     * editor bound to this Document (which in turn causes Document._makeEditable() to be called).
     * Should ONLY be called by Editor and Document.
     */
    Document.prototype._ensureMasterEditor = function () {
        if (!this._masterEditor) {
            EditorManager._createFullEditorForDocument(this);
        }
    };
    
    /**
     * Returns the document's current contents; may not be saved to disk yet. Whenever this
     * value changes, the Document dispatches a "change" event.
     *
     * @param {boolean=} useOriginalLineEndings If true, line endings in the result depend on the
     *      Document's line endings setting (based on OS & the original text loaded from disk).
     *      If false, line endings are always \n (like all the other Document text getter methods).
     * @return {string}
     */
    Document.prototype.getText = function (useOriginalLineEndings) {
        if (this._masterEditor) {
            // CodeMirror.getValue() always returns text with LF line endings; fix up to match line
            // endings preferred by the document, if necessary
            var codeMirrorText = this._masterEditor._codeMirror.getValue();
            if (useOriginalLineEndings) {
                if (this._lineEndings === FileUtils.LINE_ENDINGS_CRLF) {
                    return codeMirrorText.replace(/\n/g, "\r\n");
                }
            }
            return codeMirrorText;
            
        } else {
            // Optimized path that doesn't require creating master editor
            if (useOriginalLineEndings) {
                return this._text;
            } else {
                return this._text.replace(/\r\n/g, "\n");
            }
        }
    };
    
    /**
     * Sets the contents of the document. Treated as an edit. Line endings will be rewritten to
     * match the document's current line-ending style.
     * @param {!string} text The text to replace the contents of the document with.
     */
    Document.prototype.setText = function (text) {
        this._ensureMasterEditor();
        this._masterEditor._codeMirror.setValue(text);
        // _handleEditorChange() triggers "change" event
    };
    
    /**
     * Sets the contents of the document. Treated as reloading the document from disk: the document
     * will be marked clean with a new timestamp, the undo/redo history is cleared, and we re-check
     * the text's line-ending style. CAN be called even if there is no backing editor.
     * @param {!string} text The text to replace the contents of the document with.
     * @param {!Date} newTimestamp Timestamp of file at the time we read its new contents from disk.
     */
    Document.prototype.refreshText = function (text, newTimestamp) {
        var perfTimerName = PerfUtils.markStart("refreshText:\t" + (!this.file || this.file.fullPath));

        if (this._masterEditor) {
            this._masterEditor._resetText(text);
            // _handleEditorChange() triggers "change" event for us
        } else {
            this._text = text;
            // We fake a change record here that looks like CodeMirror's text change records, but
            // omits "from" and "to", by which we mean the entire text has changed.
            // TODO: Dumb to split it here just to join it again in the change handler, but this is
            // the CodeMirror change format. Should we document our change format to allow this to
            // either be an array of lines or a single string?
            $(this).triggerHandler("change", [this, {text: text.split(/\r?\n/)}]);
        }
        this._markClean();
        this.diskTimestamp = newTimestamp;
        
        // Sniff line-ending style
        this._lineEndings = FileUtils.sniffLineEndings(text);
        if (!this._lineEndings) {
            this._lineEndings = FileUtils.getPlatformLineEndings();
        }
        
        $(exports).triggerHandler("_documentRefreshed", this);

        PerfUtils.addMeasurement(perfTimerName);
    };
    
    /**
     * Adds, replaces, or removes text. If a range is given, the text at that range is replaced with the
     * given new text; if text == "", then the entire range is effectively deleted. If 'end' is omitted,
     * then the new text is inserted at that point and all existing text is preserved. Line endings will
     * be rewritten to match the document's current line-ending style.
     * 
     * IMPORTANT NOTE: Because of #1688, do not use this in cases where you might be
     * operating on a linked document (like the main document for an inline editor) 
     * during an outer CodeMirror operation (like a key event that's handled by the
     * editor itself). A common case of this is code hints in inline editors. In
     * such cases, use `editor._codeMirror.replaceRange()` instead. This should be
     * fixed when we migrate to use CodeMirror's native document-linking functionality.
     *
     * @param {!string} text  Text to insert or replace the range with
     * @param {!{line:number, ch:number}} start  Start of range, inclusive (if 'to' specified) or insertion point (if not)
     * @param {?{line:number, ch:number}} end  End of range, exclusive; optional
     * @param {?string} origin  Optional string used to batch consecutive edits for undo.
     *     If origin starts with "+", then consecutive edits with the same origin will be batched for undo if 
     *     they are close enough together in time.
     *     If origin starts with "*", then all consecutive edit with the same origin will be batched for
     *     undo.
     *     Edits with origins starting with other characters will not be batched.
     *     (Note that this is a higher level of batching than batchOperation(), which already batches all
     *     edits within it for undo. Origin batching works across operations.)
     */
    Document.prototype.replaceRange = function (text, start, end, origin) {
        this._ensureMasterEditor();
        this._masterEditor._codeMirror.replaceRange(text, start, end, origin);
        // _handleEditorChange() triggers "change" event
    };
    
    /**
     * Returns the characters in the given range. Line endings are normalized to '\n'.
     * @param {!{line:number, ch:number}} start  Start of range, inclusive
     * @param {!{line:number, ch:number}} end  End of range, exclusive
     * @return {!string}
     */
    Document.prototype.getRange = function (start, end) {
        this._ensureMasterEditor();
        return this._masterEditor._codeMirror.getRange(start, end);
    };
    
    /**
     * Returns the text of the given line (excluding any line ending characters)
     * @param {number} Zero-based line number
     * @return {!string}
     */
    Document.prototype.getLine = function (lineNum) {
        this._ensureMasterEditor();
        return this._masterEditor._codeMirror.getLine(lineNum);
    };
    
    /**
     * Batches a series of related Document changes. Repeated calls to replaceRange() should be wrapped in a
     * batch for efficiency. Begins the batch, calls doOperation(), ends the batch, and then returns.
     * @param {function()} doOperation
     */
    Document.prototype.batchOperation = function (doOperation) {
        this._ensureMasterEditor();
        
        var self = this;
        self._masterEditor._codeMirror.operation(doOperation);
    };
    
    /**
     * Handles changes from the master backing Editor. Changes are triggered either by direct edits
     * to that Editor's UI, OR by our setText()/refreshText() methods.
     * @private
     */
    Document.prototype._handleEditorChange = function (event, editor, changeList) {
        // On any change, mark the file dirty. In the future, we should make it so that if you
        // undo back to the last saved state, we mark the file clean.
        var wasDirty = this.isDirty;
        this.isDirty = !editor._codeMirror.isClean();
        
        // If file just became dirty, notify listeners, and add it to working set (if not already there)
        if (wasDirty !== this.isDirty) {
            $(exports).triggerHandler("_dirtyFlagChange", [this]);
        }
        
        // Notify that Document's text has changed
        // TODO: This needs to be kept in sync with SpecRunnerUtils.createMockDocument(). In the
        // future, we should fix things so that we either don't need mock documents or that this
        // is factored so it will just run in both.
        $(this).triggerHandler("change", [this, changeList]);
    };
    
    /**
     * @private
     */
    Document.prototype._markClean = function () {
        this.isDirty = false;
        if (this._masterEditor) {
            this._masterEditor._codeMirror.markClean();
        }
        $(exports).triggerHandler("_dirtyFlagChange", this);
    };
    
    /** 
     * Called when the document is saved (which currently happens in DocumentCommandHandlers). Marks the
     * document not dirty and notifies listeners of the save.
     */
    Document.prototype.notifySaved = function () {
        if (!this._masterEditor) {
            console.log("### Warning: saving a Document that is not modifiable!");
        }
        
        this._markClean();
        
        // TODO: (issue #295) fetching timestamp async creates race conditions (albeit unlikely ones)
        var thisDoc = this;
        this.file.getMetadata(
            function (metadata) {
                thisDoc.diskTimestamp = metadata.modificationTime;
                $(exports).triggerHandler("_documentSaved", thisDoc);
            },
            function (error) {
                console.log("Error updating timestamp after saving file: " + thisDoc.file.fullPath);
                $(exports).triggerHandler("_documentSaved", thisDoc);
            }
        );
    };
    
    /* (pretty toString(), to aid debugging) */
    Document.prototype.toString = function () {
        var dirtyInfo = (this.isDirty ? " (dirty!)" : " (clean)");
        var editorInfo = (this._masterEditor ? " (Editable)" : " (Non-editable)");
        var refInfo = " refs:" + this._refCount;
        return "[Document " + this.file.fullPath + dirtyInfo + editorInfo + refInfo + "]";
    };
    
    /**
     * Returns the language this document is written in.
     * The language returned is based on the file extension.
     * @return {Language} An object describing the language used in this document
     */
    Document.prototype.getLanguage = function () {
        return this.language;
    };

    /**
     * Updates the language according to the file extension
     */
    Document.prototype._updateLanguage = function () {
        var oldLanguage = this.language;
        this.language = LanguageManager.getLanguageForPath(this.file.fullPath);
        
        if (oldLanguage && oldLanguage !== this.language) {
            $(this).triggerHandler("languageChanged", [oldLanguage, this.language]);
        }
    };
    
    /** Called when Document.file has been modified (due to a rename) */
    Document.prototype._notifyFilePathChanged = function () {
        // File extension may have changed
        this._updateLanguage();
    };
    
    /**
     * Is this an untitled document?
     * 
     * @return {boolean} - whether or not the document is untitled
     */
    Document.prototype.isUntitled = function () {
        return this.file instanceof NativeFileSystem.InaccessibleFileEntry;
    };


    // Define public API
    exports.Document = Document;
});
