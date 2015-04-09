/**
 * Based on http://codemirror.net/addon/fold/foldgutter.js
 * @author Patrick Oladimeji
 * @date 10/24/13 10:14:01 AM
 */
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, brackets, document, window, $*/
define(function (require, exports, module) {
    "use strict";
    var CodeMirror      = brackets.getModule("thirdparty/CodeMirror2/lib/codemirror"),
        prefs           = require("Prefs");

    function State(options) {
        this.options = options;
        this.from = this.to = 0;
    }

    function parseOptions(opts) {
        if (opts === true) { opts = {}; }
        if (!opts.gutter) { opts.gutter = "CodeMirror-foldgutter"; }
        if (!opts.indicatorOpen) { opts.indicatorOpen = "CodeMirror-foldgutter-open"; }
        if (!opts.indicatorFolded) { opts.indicatorFolded = "CodeMirror-foldgutter-folded"; }
        return opts;
    }

    /**
      * Utility for creating fold markers in fold gutter
      * @param {string} spec the className for the marker
      * @return {HTMLElement} a htmlelement representing the fold marker
      */
    function marker(spec) {
        var elt = document.createElement("div");
        elt.className = spec;
        return elt;
    }

    /**
      * Updates the gutter markers for the specified range
      * @param {!CodeMirror} cm the CodeMirror instance for the active editor
      * @param {!number} from the starting line for the update
      * @param {!number} to the ending line for the update
      */
    function updateFoldInfo(cm, from, to) {
        var minFoldSize = prefs.getSetting("minFoldSize") || 2;
        var opts = cm.state.foldGutter.options;
        var fade = prefs.getSetting("fadeFoldButtons");
        var gutter = $(cm.getGutterElement());
        var i = from;

        function isFold(m) {
            return m.__isFold;
        }

        function clear(m) {
            return m.clear();
        }

        /**
          * @private
          * helper function to check if the given line is in a folded region in the editor.
          * @param {number} line the
          * @return {Object} the range that hides the specified line or undefine if the line is not hidden
          */
        function _isCurrentlyFolded(line) {
            var keys = Object.keys(cm._lineFolds), i = 0, range;
            while (i < keys.length) {
                range = cm._lineFolds[keys[i]];
                if (range.from.line < line && range.to.line >= line) {
                    return range;
                }
                i++;
            }
        }

        /**
            This case is needed when unfolding a region that does not cause the viewport to change.
            For instance in a file with about 15 lines, if some code regions are folded and unfolded, the
            viewport change event isnt fired by codeMirror. The setTimeout is a workaround to trigger the
            gutter update after the viewport has been drawn.
        */
        if (i === to) {
            window.setTimeout(function () {
                var vp = cm.getViewport();
                updateFoldInfo(cm, vp.from, vp.to);
            }, 200);
        }

        while (i < to) {
            var sr = _isCurrentlyFolded(i),//surrounding range for the current line if one exists
                range;
            var mark = marker("CodeMirror-foldgutter-blank");
            var pos = CodeMirror.Pos(i),
                func = opts.rangeFinder || CodeMirror.fold.auto;
            //dont look inside collapsed ranges
            if (sr) {
                i = sr.to.line + 1;
            } else {
                range = cm._lineFolds[i] || (func && func(cm, pos));
                if (!fade || (fade && gutter.is(":hover"))) {
                    if (cm.isFolded(i)) {
                        //expand fold if invalid
                        if (range) {
                            mark = marker(opts.indicatorFolded);
                        } else {
                            cm.findMarksAt(pos).filter(isFold)
                                .forEach(clear);
                        }
                    } else {
                        if (range && range.to.line - range.from.line >= minFoldSize) {
                            mark = marker(opts.indicatorOpen);
                        }
                    }
                }
                cm.setGutterMarker(i, opts.gutter, mark);
                i++;
            }
        }
    }

    /**
      * Updates the fold infor in the viewport for the specifiec range
      * @param {CodeMirror} cm the instance of the CodeMirror object
      * @param {?number} from the starting line number for the update
      * @param {?number} to the end line number for the update
      */
    function updateInViewport(cm, from, to) {
        var vp = cm.getViewport(), state = cm.state.foldGutter;
        from = isNaN(from) ? vp.from : from;
        to = isNaN(to) ? vp.to : to;

        if (!state) { return; }
        cm.operation(function () {
            updateFoldInfo(cm, from, to);
        });
        state.from = from;
        state.to = to;
    }

    /**
      * Clears the code folding gutter
      * @param {!CodeMirror} cm the CodeMirror instance for the active  editor
      */
    function clearGutter(cm) {
        var opts = cm.state.foldGutter.options;
        cm.clearGutter(opts.gutter);
        var blank = marker("CodeMirror-foldgutter-blank");
        var vp = cm.getViewport();
        cm.operation(function () {
            cm.eachLine(vp.from, vp.to, function (line) {
                cm.setGutterMarker(line.lineNo(), opts.gutter, blank);
            });
        });
    }

    /**
      * Updates the line folds cache usually when the document changes.
      * @param {!CodeMirror} cm the CodeMirror instance for the active editor
      * @param {!number} from the line number designating the start position of the change
      * @param {!number} linesDiff a number to show how many lines where removed or added to the document
      */
    function updateFoldsCache(cm, from, linesDiff) {
        var range;
        var minFoldSize = prefs.getSetting("minFoldSize") || 2;
        var foldedLines = Object.keys(cm._lineFolds).map(function (d) {
            return +d;
        });
        if (linesDiff === 0) {
            if (foldedLines.indexOf(from) > -1) {
                var opts = cm.state.foldGutter.options || {};
                var rf = opts.rangeFinder || CodeMirror.fold.auto;
                range = rf(cm, CodeMirror.Pos(from));

                if (range && range.to.line - range.from.line >= minFoldSize) {
                    cm._lineFolds[from] = range;
                } else {
                    delete cm._lineFolds[from];
                }
            }
        } else if (foldedLines.length) {
            var newFolds = {};
            foldedLines.forEach(function (line) {
                range = cm._lineFolds[line];
                if (line < from || linesDiff === 0) {
                    newFolds[line] = range;
                } else {
                    range.from.line = range.from.line + linesDiff;
                    range.to.line = range.to.line + linesDiff;
                    newFolds[line + linesDiff] = range;

                }
            });
            cm._lineFolds = newFolds;
        }
    }

    /**
      * Triggered when the content of the document changes. When the entire content of the document
      * is changed - e.g., changes made from a different editor, the same lineFolds are kept only if
      * they are still valid in the context of the new document content.
      * @param {!CodeMirror} cm the CodeMirror instance for the active editor
      * @param {!Object} changeObj detailed information about the change that occurred in the document
      */
    function onChange(cm, changeObj) {
        if (changeObj.origin === "setValue") {//text content has changed outside of brackets
            var folds = cm.getValidFolds(cm._lineFolds);
            cm._lineFolds = folds;
            Object.keys(folds).forEach(function (line) {
                cm.foldCode(+line);
            });
        } else {
            var state = cm.state.foldGutter;
            var lineChanges = changeObj.text.length - changeObj.removed.length;
            //update the lineFolds cache
            updateFoldsCache(cm, changeObj.from.line, lineChanges);
            if (lineChanges !== 0) {
                updateFoldInfo(cm, changeObj.from.line + lineChanges, changeObj.from.line + lineChanges + 1);
            }
            state.from = changeObj.from.line;
            state.to = 0;
            window.clearTimeout(state.changeUpdate);
            state.changeUpdate = window.setTimeout(function () {
                updateInViewport(cm);
            }, prefs.getSetting("foldOnChangeTimeSpan") || 600);
        }
    }

    /**
      * Triggered on viewport changes e.g., user scrolls or resizes the viewport.
      * @param {!CodeMirror} cm the CodeMirror instance for the active editor
      */
    function onViewportChange(cm) {
        var state = cm.state.foldGutter;
        window.clearTimeout(state.changeUpdate);
        state.changeUpdate = window.setTimeout(function () {
            var vp = cm.getViewport();
            if (state.from === state.to || vp.from - state.to > 20 || state.from - vp.to > 20) {
                updateInViewport(cm);
            } else {
                cm.operation(function () {
                    if (vp.from < state.from) {
                        updateFoldInfo(cm, vp.from, state.from);
                        state.from = vp.from;
                    }
                    if (vp.to > state.to) {
                        updateFoldInfo(cm, state.to, vp.to);
                        state.to = vp.to;
                    } else {
                        updateFoldInfo(cm, vp.from, vp.to);
                        state.to = vp.to;
                        state.from = vp.from;
                    }
                });
            }
        }, prefs.getSetting("updateViewportTimeSpan") || 400);
    }

    /**
      * Triggered when a code segment is folded.
      * @param {!CodeMirror} cm the CodeMirror instance for the active editor
      * @param {!Object} from  the ch and line position that designates the start of the region
      * @param {!Object} to the ch and line position that designates the end of the region
      */
    function onFold(cm, from, to) {
        var state = cm.state.foldGutter, line = from.line;
        if (line >= state.from && line < state.to) {
            updateFoldInfo(cm, line, line + 1);
        }
    }

    /**
      * Triggered when a folded code segment is unfolded.
      * @param {!CodeMirror} cm the CodeMirror instance for the active editor
      * @param {!{line:number, ch:number}} from  the ch and line position that designates the start of the region
      * @param {!{line:number, ch:number}} to the ch and line position that designates the end of the region
      */
    function onUnFold(cm, from, to) {
        var state = cm.state.foldGutter, line = from.line;
        var vp = cm.getViewport();
        if (line >= state.from && line < state.to) {
            updateFoldInfo(cm, line, Math.min(vp.to, to.line));
        }
    }

    /**
      * Initialises the fold gutter and registers event handlers for changes to document, viewport
      * and user interactions.
      */
    function init() {
        CodeMirror.defineOption("foldGutter", false, function (cm, val, old) {
            if (old && old !== CodeMirror.Init) {
                cm.clearGutter(cm.state.foldGutter.options.gutter);
                cm.state.foldGutter = null;
                cm.off("gutterClick", old.onGutterClick);
                cm.off("change", onChange);
                cm.off("viewportChange", onViewportChange);
                cm.off("fold", onFold);
                cm.off("unfold", onUnFold);
                cm.off("swapDoc", updateInViewport);
            }
            if (val) {
                cm.state.foldGutter = new State(parseOptions(val));
                updateInViewport(cm);
                cm.on("gutterClick", val.onGutterClick);
                cm.on("change", onChange);
                cm.on("viewportChange", onViewportChange);
                cm.on("fold", onFold);
                cm.on("unfold", onUnFold);
                cm.on("swapDoc", updateInViewport);
            }
        });
    }


    exports.init = init;
    exports.clearGutter = clearGutter;
    exports.updateInViewport = updateInViewport;

});
