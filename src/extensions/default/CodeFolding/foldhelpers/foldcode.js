/**
 * Based on http://codemirror.net/addon/fold/foldcode.js
 * @author Patrick Oladimeji
 * @date 10/28/13 8:41:46 AM
 * @last modified 20 April 2014
 */
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, brackets, document*/
define(function (require, exports, module) {
    "use strict";
    var CodeMirror = brackets.getModule("thirdparty/CodeMirror2/lib/codemirror"),
		prefs = require("Prefs");

    module.exports = function () {
        function doFold(cm, pos, options, force) {
            force = force || "fold";
            if (typeof pos === "number") {
                pos = CodeMirror.Pos(pos, 0);
            }
            var finder = (options && options.rangeFinder) || CodeMirror.fold.auto;
            var minSize = (options && options.minFoldSize) || prefs.getSetting("minFoldSize");

            function getRange(allowFolded) {
                var range = options && options.range ? options.range : finder(cm, pos);
                if (!range || range.to.line - range.from.line < minSize) {
                    return null;
                }
                var marks = cm.findMarksAt(range.from),
                    i;
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
                var lastMark, foldMarks;
                if (marks && marks.length) {
                    foldMarks = marks.filter(function (d) { return d.__isFold; });
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

            var range = getRange(true);
            if (options && options.scanUp) {
                while (!range && pos.line > cm.firstLine()) {
                    pos = CodeMirror.Pos(pos.line - 1, 0);
                    range = getRange(false);
                }
            }
            if (!range || range.cleared || force === "unfold" || range.to.line - range.from.line < minSize) {
                if (range) { range.cleared = false; }
                return;
            }

            var myWidget = makeWidget();
            var myRange = cm.markText(range.from, range.to, {
                replacedWith: myWidget,
                clearOnEnter: true,
                __isFold: true
            });
            CodeMirror.on(myWidget, "mousedown", function () {
                myRange.clear();
            });
            myRange.on("clear", function (from, to) {
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

        CodeMirror.defineExtension("foldCode", function (pos, options, force) {
            return doFold(this, pos, options, force);
        });

        //define an unfoldCode extension to quickly unfold folded code
        CodeMirror.defineExtension("unfoldCode", function (pos, options) {
            return doFold(this, pos, options, "unfold");
        });

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

        CodeMirror.defineExtension("isFolded", function (line) {
            return this._lineFolds[line];
        });
        /**
          Checks the validity of the ranges passed in the parameter and returns the foldranges
          that are still valid in the current document
          @param {object} folds the dictionary of lines in the current document that should be folded
          @returns {object} valid folds found in those passed in parameter
        */
        CodeMirror.defineExtension("getValidFolds", function (folds) {
            var keys, rf = CodeMirror.fold.auto, cm = this, result = {};
            if (folds && (keys = Object.keys(folds)).length) {
                var i, range, cachedRange;
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

        CodeMirror.commands.toggleFold = function (cm) {
            cm.foldCode(cm.getCursor());
        };
        CodeMirror.commands.fold = function (cm, options, force) {
            cm.foldCode(cm.getCursor(), options, "fold");
        };
        CodeMirror.commands.unfold = function (cm, options, force) {
            cm.foldCode(cm.getCursor(), options, "unfold");
        };
        CodeMirror.commands.foldAll = function (cm) {
            cm.operation(function () {
                var i, e;
                for (i = cm.firstLine(), e = cm.lastLine(); i <= e; i++) {
                    cm.foldCode(CodeMirror.Pos(i, 0), null, "fold");
                }
            });
        };
        /**
            Folds the specified range. The descendants of any fold regions within the range are also folded up to
            a level set globally in the codeFolding preferences
        */
        CodeMirror.commands.foldToLevel = function (cm, start, end) {
            var rf = CodeMirror.fold.auto, level = prefs.getSetting("maxFoldLevel");
            function foldLevel(n, from, to) {
                if (n > 0) {
                    var i = from, e, range;
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
                foldLevel(level, start, end);
            });
        };
        
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
    };
});