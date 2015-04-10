// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE
// Based on http://codemirror.net/addon/fold/foldcode.js
// Modified by Patrick Oladimeji for Brackets
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, brackets, document*/
define(function (require, exports, module) {
    "use strict";
    var CodeMirror          = brackets.getModule("thirdparty/CodeMirror2/lib/codemirror"),
        prefs               = require("Prefs");

    /**
      * Performs the folding and unfolding of code regions.
      * @param {CodeMirror} cm the CodeMirror instance
      * @param {number| Object} pos
      */
    function doFold(cm, pos, options, force) {
        options = options || {};
        force = force || "fold";
        if (typeof pos === "number") {
            pos = CodeMirror.Pos(pos, 0);
        }

        var finder = options.rangeFinder || CodeMirror.fold.auto,
            range,
            widget,
            textRange;

        function getRange(allowFolded) {
            var range = options.range || finder(cm, pos);
            if (!range || range.to.line - range.from.line < prefs.getSetting("minFoldSize")) {
                return null;
            }
            var marks = cm.findMarksAt(range.from),
                i,
                lastMark,
                foldMarks;
            for (i = 0; i < marks.length; ++i) {
                if (marks[i].__isFold && force !== "fold") {
                    if (!allowFolded) {
                        return null;
                    }
                    range.cleared = true;
                    marks[i].clear();
                }
            }
            //check for overlapping folds
            if (marks && marks.length) {
                foldMarks = marks.filter(function (d) {
                    return d.__isFold;
                });
                if (foldMarks && foldMarks.length) {
                    lastMark = foldMarks[foldMarks.length - 1].find();
                    if (lastMark && range.from.line <= lastMark.to.line && lastMark.to.line < range.to.line) {
                        return null;
                    }
                }
            }
            return range;
        }

        function makeWidget() {
            var widget = document.createElement("span");
            widget.className = "CodeMirror-foldmarker";
            return widget;
        }

        range = getRange(true);
        if (options.scanUp) {
            while (!range && pos.line > cm.firstLine()) {
                pos = CodeMirror.Pos(pos.line - 1, 0);
                range = getRange(false);
            }
        }
        if (!range || range.cleared || force === "unfold" || range.to.line - range.from.line < prefs.getSetting("minFoldSize")) {
            if (range) { range.cleared = false; }
            return;
        }

        widget = makeWidget();
        textRange = cm.markText(range.from, range.to, {
            replacedWith: widget,
            clearOnEnter: true,
            __isFold: true
        });

        CodeMirror.on(widget, "mousedown", function () {
            textRange.clear();
        });

        textRange.on("clear", function (from, to) {
            delete cm._lineFolds[from.line];
            CodeMirror.signal(cm, "unfold", cm, from, to);
        });

        if (force === "fold") {
            delete range.cleared;
            cm._lineFolds[pos.line] = range;
        } else {
            delete cm._lineFolds[pos.line];
        }

        CodeMirror.signal(cm, force, cm, range.from, range.to);
        return range;
    }

    /**
        Initialises extensions and helpers on the CodeMirror object
    */
    function init() {
        CodeMirror.defineExtension("foldCode", function (pos, options, force) {
            return doFold(this, pos, options, force);
        });

        CodeMirror.defineExtension("unfoldCode", function (pos, options) {
            return doFold(this, pos, options, "unfold");
        });

        CodeMirror.defineExtension("isFolded", function (line) {
            return this._lineFolds && this._lineFolds[line];
        });

        /**
          * Checks the validity of the ranges passed in the parameter and returns the foldranges
          * that are still valid in the current document
          * @param {object} folds the dictionary of lines in the current document that should be folded
          * @returns {object} valid folds found in those passed in parameter
          */
        CodeMirror.defineExtension("getValidFolds", function (folds) {
            var keys, rf = CodeMirror.fold.auto, cm = this, result = {}, range, cachedRange;
            if (folds && (keys = Object.keys(folds)).length) {
                keys.forEach(function (lineNumber) {
                    lineNumber = +lineNumber;
                    if (lineNumber >= cm.firstLine() && lineNumber <= cm.lastLine()) {
                        range = rf(cm, CodeMirror.Pos(lineNumber));
                        cachedRange = folds[lineNumber];
                        if (range && cachedRange && range.from.line === cachedRange.from.line &&
                                range.to.line === cachedRange.to.line) {
                            cm.foldCode(lineNumber, {range: folds[lineNumber]}, "fold");
                            result[lineNumber] = folds[lineNumber];
                        }
                    }
                });
            }
            return result;
        });

        /**
          * Utility function to fold the region at the current cursor position in  a document
          * @param {CodeMirror} cm the CodeMirror instance
          * @param {?options} options extra options to pass to the fold function
          */
        CodeMirror.commands.fold = function (cm, options) {
            cm.foldCode(cm.getCursor(), options, "fold");
        };

        /**
          * Utility function to unfold the region at the current cursor position in  a document
          * @param {CodeMirror} cm the CodeMirror instance
          * @param {?options} options extra options to pass to the fold function
          */
        CodeMirror.commands.unfold = function (cm, options) {
            cm.foldCode(cm.getCursor(), options, "unfold");
        };

        /**
          * Utility function to fold all foldable regions in a document
          * @param {CodeMirror} cm the CodeMirror instance
          */
        CodeMirror.commands.foldAll = function (cm) {
            cm.operation(function () {
                var i, e;
                for (i = cm.firstLine(), e = cm.lastLine(); i <= e; i++) {
                    cm.foldCode(CodeMirror.Pos(i, 0), null, "fold");
                }
            });
        };

        /**
          * Utility function to unfold all folded regions in a document
          * @param {CodeMirror} cm the CodeMirror instance
          * @param {?number} from the line number for the beginning of the region to unfold
          * @param {?number} to the line number for the end of the region to unfold
          */
        CodeMirror.commands.unfoldAll = function (cm, from, to) {
            from = from || cm.firstLine();
            to = to || cm.lastLine();
            cm.operation(function () {
                var i, e;
                for (i = from, e = to; i <= e; i++) {
                    if (cm.isFolded(i)) { cm.unfoldCode(i, {range: cm._lineFolds[i]}); }
                }
            });
        };

        /**
          * Folds the specified range. The descendants of any fold regions within the range are also folded up to
          * a level set globally in the `maxFoldLevel' preferences
          * @param {CodeMirror} cm the CodeMirror instance
          * @param {?number} start the line number for the beginning of the region to fold
          * @param {?number} end the line number for the end of the region to fold
          */
        CodeMirror.commands.foldToLevel = function (cm, start, end) {
            var rf = CodeMirror.fold.auto;
            function foldLevel(n, from, to) {
                if (n > 0) {
                    var i = from, range;
                    while (i < to) {
                        range = rf(cm, CodeMirror.Pos(i, 0));
                        if (range) {
                            //call fold level for the range just folded
                            foldLevel(n - 1, range.from.line + 1, range.to.line - 1);
                            cm.foldCode(CodeMirror.Pos(i, 0), null, "fold");
                            i = range.to.line + 1;
                        } else {
                            i++;
                        }
                    }
                }
            }
            cm.operation(function () {
                start = start === undefined ? cm.firstLine() : start;
                end = end || cm.lastLine();
                foldLevel(prefs.getSetting("maxFoldLevel"), start, end);
            });
        };

        /**
          * Helper to combine an array of fold range finders into one
          */
        CodeMirror.registerHelper("fold", "combine", function () {
            var funcs = Array.prototype.slice.call(arguments, 0);
            return function (cm, start) {
                var i;
                for (i = 0; i < funcs.length; ++i) {
                    var found = funcs[i] && funcs[i](cm, start);
                    if (found) {
                        return found;
                    }
                }
            };
        });

        /**
          * Creates a helper which returns the appropriate fold function based on the mode of the current position in
          * a document.
          * @param {CodeMirror} cm the CodeMirror instance
          * @param {number} start the current position in the document
          */
        CodeMirror.registerHelper("fold", "auto", function (cm, start) {
            var helpers = cm.getHelpers(start, "fold"), i, cur;
            //ensure mode helper is loaded if there is one
            var mode = cm.getMode().name;
            var modeHelper = CodeMirror.fold[mode];
            if (modeHelper && helpers.indexOf(modeHelper) < 0) {
                helpers.push(modeHelper);
            }
            for (i = 0; i < helpers.length; i++) {
                cur = helpers[i](cm, start);
                if (cur) { return cur; }
            }
        });
    }

    exports.init = init;
});
