/*
 * Copyright (c) 2013 Adobe Systems Incorporated.
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
 */

/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets */

/**
 * The CSS Shapes Editor extension adds a GUI for editing shapes when LivePreview mode is on,
 * and the cursor is focused on a CSS Shapes property value, like polygon(), circle() or ellipse();
 * Other properties, such as border-box and inset() is not yet supported.
 *
 * The code for the shapes editor lives in ./thirdparty/CSSShapesEditor.js
 * @see https://github.com/adobe-webplatform/css-shapes-editor/
 *
 * The shapes editor turns on over the first element matched by the selector associated to the
 * CSS Declaration Block being edited. The editor will not turn on if the focused CSS Rule does
 * not apply, either because of media queries not matching or selector specificity being overturned.
 *
 * On LiveDevelopment.STATUS_ACTIVE, the CSS Shapes Editor library from /thirdparty/, and its dependencies
 * are injected into the page in LivePreview. A mirror LiveEditorRemoteDriver.js is also injected.
 * This will be driven by LiveEditorLocalDriver.js

 * A Model with the currently focused CSS property, value and their range is built on every cursor
 * navigation or change in the document. This model will be passed onto the injected LiveEditorRemoteDriver.js
 * and will be kept in sync to mirror the changes between the Brackets code editor and the CSS Shapes Editor
 * from the LivePreview page.
 *
 * This extension can be extended to handle other CSS properties by adding other GUI editor & dependencies
 * to the _remoteEditors array and mention which properties they operate on in the SUPPORTED_PROPS array.
 * See ./thirdparty/CSSShapesEditorProvider.js for the minimal API other editors must provide.
 */
define(function (require, exports, module) {
    "use strict";

    var EditorManager       = brackets.getModule("editor/EditorManager"),
        CSSUtils            = brackets.getModule("language/CSSUtils"),
        LiveDevelopment     = brackets.getModule("LiveDevelopment/LiveDevelopment"),
        CSSAgent            = brackets.getModule("LiveDevelopment/Agents/CSSAgent"),
        ProjectManager      = brackets.getModule("project/ProjectManager"),
        Model               = require("Model"),
        LiveEditorDriver    = require("LiveEditorLocalDriver");

    // TODO: Keep this list up to date with newly added/supported properties
    var SUPPORTED_PROPS = ["shape-inside", "-webkit-shape-inside", "shape-outside", "-webkit-shape-outside"];

    // Intentional bias towards only -webkit-clip-path (prefixed),
    //   because clip-path (unprefixed) only applies to SVG.
    //   -webkit-clip-path applies to HTML & SVG. The properties will merge, eventually.
    SUPPORTED_PROPS.push("-webkit-clip-path");

    // String source of editor and provider
    var CSSShapesEditor         = require("text!thirdparty/CSSShapesEditor.js"),
        CSSShapesEditorProvider = require("text!thirdparty/CSSShapesEditorProvider.js");

    /** @type {Array} Dependencies as strings to be injected in the HTML page in LivePreview */
    var _remoteEditors = [CSSShapesEditor, CSSShapesEditorProvider];

    /** @type {Array} Stylesheet URLs that are used by the active HTML page in LivePreview */
    var _relatedStylesheets = [];

    /** @type {Editor} */
    var _currentEditor = EditorManager.getActiveEditor();

    /** @type {boolean} Flag set to true if the LivePreview has just been turned on */
    var _isFirstLaunch = false;

    /** @type {Model} Stores state to sync between code editor and in-browser editor */
    var model = new Model({
        property: null,
        value:    null,
        selector: null
    });

    /**
     * @private
     * Returns the range that wraps the CSS value at the given pos.
     * Assumes pos is within or adjacent to a CSS value (between : and ; or })
     * @param {!Editor} editor
     * @param {!{line:number, ch:number}} pos
     * @param {boolean=} trimWhitespace Ignore whitepace surrounding css value; optional
     * @return {{!start: {line:number, ch:number}, end: {line:number, ch:number}}}
     */
    function _getRangeForCSSValueAt(editor, pos, trimWhitespace) {
        // TODO: support multi-line values
        var line    = editor.document.getLine(pos.line),
            start   = pos.ch,
            end     = pos.ch,
            value;

        // css values start after a colon (:)
        start = line.lastIndexOf(":", pos.ch) + 1;

        // css values end before a semicolon (;) or closing bracket (})
        // TODO support closing bracket and multi-line. Bracket may be lower.
        end = line.indexOf(";", pos.ch);

        if (trimWhitespace) {
            value = line.substring(start, end);
            start = start + value.match(/^\s*/)[0].length;
            end = end - value.match(/\s*$/)[0].length;
        }

        return {
            "start": { line: pos.line, ch: start },
            "end": { line: pos.line, ch: end }
        };
    }

    /**
     * @private
     * Constructs the global model with data if the cursor is on a CSS rule
     * with a property from SUPPORTED_PROPS.
     *
     * Adds attributes to the model:
     *   {
     *        value: {string},    // the CSS value
     *        property: {string}, // the CSS property
     *        selector: {string}, // the selector associated with the CSS block
     *        range: {Object}     // the range in the code editor for the CSS value
     *    }
     *
     * Resets the existing model if:
     *  - the cursor is not on a CSS value;
     *  - the css property is not supported; @see SUPPORTED_PROPS
     *  - a selector cannot be extracted for the CSS block;
     *
     * Model triggers 'change' event if any attribute value has changed since last stored.
     * Does not trigger 'change' event if cursor is just moving within the same CSS value.
     *
     * @param {!Event} e 'change' or 'cursorActivity' event dispatched by editor
     */
    function _constructModel(e) {
        var editor      = e.target,
            selection   = editor.getSelection(),
            info,
            selector,
            range;

        // Get the CSS rule info at the selection start position
        info = CSSUtils.getInfoAtPos(editor, selection.start);

        if (info.context !== CSSUtils.PROP_VALUE || (SUPPORTED_PROPS.indexOf(info.name) < 0)) {
            model.reset();
            return;
        }

        selector = CSSUtils.findSelectorAtDocumentPos(editor, selection.start);

        if (!selector || typeof selector !== "string") {
            model.reset();
            return;
        }

        // TODO: remove _getRangeForCSSValueAt after CSSInfo.range is merged https://github.com/adobe/brackets/pull/7390
        range = info.range || _getRangeForCSSValueAt(editor, selection.start, true);

        // TODO: support multi-line values when we can handle line breaks.
        if (info.range && (info.range.start.line !== info.range.end.line)) {
            model.reset();
            return;
        }

        model.set({
            selector: selector,
            property: info.name,
            range: range,
            value: editor.document.getRange(range.start, range.end)
        });
    }

    /**
     * @private
     * Check if the current editor is attached to a stylesheet
     * related to the page in LivePreview mode.
     *
     * @return {boolean}
     */
    function _isEditingRelatedStylesheet() {
        var fullPath = _currentEditor.document.file.fullPath,
            projectPath = ProjectManager.getProjectRoot().fullPath,
            relativePath = fullPath.replace(projectPath, "");

        return (_relatedStylesheets.indexOf(relativePath) > -1);
    }

    /**
     * @private
     * Update the Brackets text editor property value using the given model,
     * which contains the range and the new property value.
     * @param {!Model} model
     */
    function _updateCodeEditor(model) {

        var range = model.get("range"),
            value = model.get("value"),
            rangeText;

        if (!range) {
            return;
        }

        rangeText = _currentEditor.document.getRange(range.start, range.end);

        if (rangeText === value) {
            return;
        }

        _currentEditor.document.replaceRange(value, range.start, range.end, "+");
    }

    /**
     * @private
     * Send a command to the LiveEditorDriver update the in-browser editor using the given model
     * @param {!Model} model
     */
    function _updateLiveEditor(model) {
        if (!LiveDevelopment.status || LiveDevelopment.status < LiveDevelopment.STATUS_ACTIVE) {
            return;
        }


        // Emit commands to the live editor only if:
        // - the code editor is focused (hence, data comes from input in Brackets)
        //   OR
        // - LivePreview has just started (to immediately show the editor if a shape property is focused)
        //
        //   AND
        // - the code editor is invoked on a stylesheet linked to the page in LivePreview
        //
        // Checking for this avoids echoing back data received from the in-browser editor.
        // The echoed data might be stale if the in-browser editor is being actively used.
        if ((_isFirstLaunch || EditorManager.getFocusedEditor()) && _isEditingRelatedStylesheet()) {
            if (model.get("property")) {
                LiveEditorDriver.update(model);
                _isFirstLaunch = false;
            } else {
                LiveEditorDriver.remove();
            }
        }
    }

    /**
     * @private
     * Handle swapping of the currently active editor.
     * Remove in-browser editor, event handlers from old code editor.
     */
    function _onActiveEditorChange() {
        if (_currentEditor) {
            $(_currentEditor).off("cursorActivity change", _constructModel);
            LiveEditorDriver.remove();
            model.reset();
        }

        _currentEditor = EditorManager.getActiveEditor();

        if (_currentEditor) {
            $(_currentEditor).on("cursorActivity change", _constructModel);
            $(_currentEditor).triggerHandler("cursorActivity");
        }
    }

    /**
     * @private
     * Handle adding new stylesheet to the page in LivePreview
     * Extracts relative URL of added stylesheet
     * @param {!Event} styleSheetAdded event
     * @param {!string} url of stylesheet
     */
    function _onStyleSheetAdded(e, url) {
        var baseUrl = LiveDevelopment.getServerBaseUrl();
        var relUrl = url.replace(baseUrl, "");
        _relatedStylesheets.push(relUrl);
    }

    /**
     * @private
     * Setup the extension after LiveDevelopment is turned on
     *
     * Listen to "change" events to global model of the focused CSS property, its value and its range,
     *  to synchronize the Brackets editor and the CSS Shapes Editor, which lives in the page in LivePreview
     *
     * Listen to "styleSheetAdded" events of the page currently in LivePreview to track related stylesheets,
     *  so we don't edit un-related stylesheets, even if the selector matches.
     *
     * Listen to changes of the currently active editor
     *
     * Inject the CSS Shapes Editor and its dependencies into the page in LivePreview
     *
     * Listen for changes to the model coming from the in-browser editor and synchronize them
     * to the model in Brackets
     */
    function _setup() {
        $(model).on("change", function () {
            _updateCodeEditor(model);
            _updateLiveEditor(model);
        });

        $(CSSAgent).on("styleSheetAdded", _onStyleSheetAdded);
        $(EditorManager).on("activeEditorChange", _onActiveEditorChange);

        LiveEditorDriver.init(_remoteEditors).then(function () {

            // Force a first-pass through the workflow after the page loads.
            // This will automatically turn on the shape editor if the cursor was focused on a supported property
            _isFirstLaunch = true;
            $(EditorManager).triggerHandler("activeEditorChange");
        });

        $(LiveEditorDriver).on("update.model", function (e, data, force) {

            // Ignore model updates from live editor if the user is still typing in the code editor.
            //
            // The code editor and live editor in live preview cannot be both focused at the same time;
            // state updates from live editor are likely echoes after syncing with the code editor.
            //
            // Avoids weird state bugs as a result of the frequency of sync loop in LiveEditorDriver.
            //
            // ---
            //
            // If there is a request to force a model update, circumvent this.
            //
            // A forced update is required when leveraging the live editor to infer coordinates.
            // @example circle() -> circle(50%, 50%, 50%)
            if (EditorManager.getFocusedEditor() && !force) {
                return;
            }

            model.set(data);
        });
    }

    /**
     * @private
     * Remove all handlers and clean-up after LiveDevelopment is turned off.
     */
    function _teardown() {
        $(model).off("change");
        $(EditorManager).off("activeEditorChange", _onActiveEditorChange);
        $(CSSAgent).off("styleSheetAdded", _onStyleSheetAdded);

        _relatedStylesheets.length = 0;

        LiveEditorDriver.remove();
        $(LiveEditorDriver).off("update.model");
    }

    /**
     * @private
     * Handle change in LiveDevelopment (LivePreview) state
     * @param {!Event} event
     * @param {!number} status
     */
    function _onLiveDevelopmentStatusChange(event, status) {

        switch (status) {

        case LiveDevelopment.STATUS_ACTIVE:
            _setup();
            break;

        case LiveDevelopment.STATUS_LOADING_AGENTS:
            // Collects stylesheets on first page load of the LiveDevelopment mode.
            //
            // Navigations through other pages while LiveDevelopment is on do not cause reloading of agents,
            // so LiveDevelopment.STATUS_LOADING_AGENTS is not reached again. For those cases, reusing this method in _setup().
            //
            // Can't use this only in _setup() because on the first run
            // the 'styleSheetAdded' events will have already triggered before reaching LiveDevelopment.STATUS_ACTIVE.
            $(CSSAgent).on("styleSheetAdded", _onStyleSheetAdded);
            break;

        case LiveDevelopment.STATUS_CONNECTING:
        case LiveDevelopment.STATUS_INACTIVE:
        case LiveDevelopment.STATUS_ERROR:
            _teardown();
            break;
        }
    }

    $(LiveDevelopment).on("statusChange", _onLiveDevelopmentStatusChange);

    // for testing only
    exports.model = model;
    exports._constructModel = _constructModel;
    exports._getRangeForCSSValueAt = _getRangeForCSSValueAt;
    exports._setCurrentEditor = function (editor) { _currentEditor = editor; };
    exports._updateCodeEditor = _updateCodeEditor;
    exports._updateLiveEditor = _updateLiveEditor;
    exports._setup = _setup;
    exports._teardown = _teardown;
});
