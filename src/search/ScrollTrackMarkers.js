/*
 * Copyright (c) 2013 - present Adobe Systems Incorporated. All rights reserved.
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

/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets */


/**
 * Manages tickmarks shown along the scrollbar track.
 * NOT yet intended for use by anyone other than the FindReplace module.
 * It is assumed that markers are always clear()ed when switching editors.
 */
define(function (require, exports, module) {
    "use strict";

    var _ = require("thirdparty/lodash");

    var WorkspaceManager = require("view/WorkspaceManager");


    /**
     * Editor the markers are currently shown for, or null if not shown
     * @type {?Editor}
     */
    var editor;

    /**
     * Top of scrollbar track area, relative to top of scrollbar
     * @type {number}
     */
    var trackOffset;

    /**
     * Height of scrollbar track area
     * @type {number}
     */
    var trackHt;

    /**
     * Text positions of markers
     * @type {!Array.<{line: number, ch: number}>}
     */
    var marks = [];

    /**
     * Tickmark markCurrent() last called on, or null if never called / called with -1.
     * @type {?jQueryObject}
     */
    var $markedTickmark;


    function _getScrollbar(editor) {
        // Be sure to select only the direct descendant, not also elements within nested inline editors
        return $(editor.getRootElement()).children(".CodeMirror-vscrollbar");
    }

    /** Measure scrollbar track */
    function _calcScaling() {
        var $sb = _getScrollbar(editor);

        trackHt = $sb[0].offsetHeight;

        if (trackHt > 0) {
            // Scrollbar visible: determine offset of track from top of scrollbar
            if (brackets.platform === "win") {
                trackOffset = 0;  // Custom scrollbar CSS has no gap around the track
            } else if (brackets.platform === "mac") {
                trackOffset = 4;  // Native scrollbar has padding around the track
            } else { //(Linux)
                trackOffset = 2;  // Custom scrollbar CSS has assymmetrical gap; this approximates it
            }
            trackHt -= trackOffset * 2;

        } else {
            // No scrollbar: use the height of the entire code content
            var codeContainer = $(editor.getRootElement()).find("> .CodeMirror-scroll > .CodeMirror-sizer > div > .CodeMirror-lines > div")[0];
            trackHt = codeContainer.offsetHeight;
            trackOffset = codeContainer.offsetTop;
        }
    }

    /** Add all the given tickmarks to the DOM in a batch */
    function _renderMarks(posArray) {
        var html = "";
        posArray.forEach(function (pos) {
            var top = Math.round(pos.line / editor.lineCount() * trackHt) + trackOffset;
            top--;  // subtract ~1/2 the ht of a tickmark to center it on ideal pos

            html += "<div class='tickmark' style='top:" + top + "px'></div>";
        });
        $(".tickmark-track", editor.getRootElement()).append($(html));
    }


    /**
     * Clear any markers in the editor's tickmark track, but leave it visible. Safe to call when
     * tickmark track is not visible also.
     */
    function clear() {
        if (editor) {
            $(".tickmark-track", editor.getRootElement()).empty();
            marks = [];
            $markedTickmark = null;
        }
    }

    /** Add or remove the tickmark track from the editor's UI */
    function setVisible(curEditor, visible) {
        // short-circuit no-ops
        if ((visible && curEditor === editor) || (!visible && !editor)) {
            return;
        }

        if (visible) {
            console.assert(!editor);
            editor = curEditor;

            // Don't support inline editors yet - search inside them is pretty screwy anyway (#2110)
            if (editor.isTextSubset()) {
                return;
            }

            var $sb = _getScrollbar(editor);
            var $overlay = $("<div class='tickmark-track'></div>");
            $sb.parent().append($overlay);

            _calcScaling();

            // Update tickmarks during editor resize (whenever resizing has paused/stopped for > 1/3 sec)
            WorkspaceManager.on("workspaceUpdateLayout.ScrollTrackMarkers", _.debounce(function () {
                if (marks.length) {
                    _calcScaling();
                    $(".tickmark-track", editor.getRootElement()).empty();
                    _renderMarks(marks);
                }
            }, 300));

        } else {
            console.assert(editor === curEditor);
            $(".tickmark-track", curEditor.getRootElement()).remove();
            editor = null;
            marks = [];
            WorkspaceManager.off("workspaceUpdateLayout.ScrollTrackMarkers");
        }
    }

    /**
     * Add tickmarks to the editor's tickmark track, if it's visible
     * @param curEditor {!Editor}
     * @param posArray {!Array.<{line:Number, ch:Number}>}
     */
    function addTickmarks(curEditor, posArray) {
        console.assert(editor === curEditor);

        marks = marks.concat(posArray);
        _renderMarks(posArray);
    }

    /** @param {number} index Either -1, or an index into the array passed to addTickmarks() */
    function markCurrent(index) {
        // Remove previous highlight first
        if ($markedTickmark) {
            $markedTickmark.removeClass("tickmark-current");
            $markedTickmark = null;
        }
        if (index !== -1) {
            $markedTickmark = $(".tickmark-track > .tickmark", editor.getRootElement()).eq(index).addClass("tickmark-current");
        }
    }

    // Private helper for unit tests
    function _getTickmarks() {
        return marks;
    }


    // For unit tests
    exports._getTickmarks   = _getTickmarks;

    exports.clear           = clear;
    exports.setVisible      = setVisible;
    exports.addTickmarks    = addTickmarks;
    exports.markCurrent     = markCurrent;
});
