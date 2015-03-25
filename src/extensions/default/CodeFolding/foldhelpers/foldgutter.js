/**
 * Based on http://codemirror.net/addon/fold/foldgutter.js
   Modulised by:
 * @author Patrick Oladimeji
 * @date 10/24/13 10:14:01 AM
 */
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, brackets, document, clearTimeout, setTimeout, $*/
define(function (require, exports, module) {
    "use strict";
    var CodeMirror = brackets.getModule("thirdparty/CodeMirror2/lib/codemirror");
	var prefs = require("Prefs");
    
    module.exports = function () {
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
    
        function marker(spec) {
            if (typeof spec === "string") {
                var elt = document.createElement("div");
                elt.className = spec;
                return elt;
            } else {
                return spec.cloneNode(true);
            }
        }
        
        /**
         Updates the gutter markers for the specified range
         @param cm the codemirror object
         @param {Number} from the starting line for the update
         @param {Number} to the ending line for the update
        */
        function updateFoldInfo(cm, from, to) {
			var minFoldSize = prefs.getSetting("minFoldSize") || 2;
            var opts = cm.state.foldGutter.options;
            var fade = prefs.getSetting("fadeFoldButtons");
            var gutter = $(cm.getGutterElement());
            var i = from;
            var isFold = function (m) {
                return m.__isFold;
            }, clear = function (m) {return m.clear(); };
            
            /**
                helper function to check if the given line is in a folded region in the editor.
                @param {Number} line the 
                @return {from: {ch: Number, line: Number}, to: {ch: Number, line: Number}} the range that hides the specified line or undefine if the line is not hidden
            */
            function _isCurrentlyFolded(line) {
                var keys = Object.keys(cm._lineFolds), i = 0, r;
                while (i < keys.length) {
                    r = cm._lineFolds[keys[i]];
                    if (r.from.line < line && r.to.line >= line) {
                        return r;
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
                setTimeout(function () {
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

        function updateInViewport(cm, from, to) {
            var vp = cm.getViewport(), state = cm.state.foldGutter;
            from = !isNaN(from) ? from : vp.from;
            to = !isNaN(to) ? to : vp.to;
            
            if (!state) { return; }
            cm.operation(function () {
                updateFoldInfo(cm, from, to);
            });
            state.from = from;
            state.to = to;
        }
        
        function updateFoldsCache(cm, from, linesDiff) {
            var range;
			var minFoldSize = prefs.getSetting("minFoldSize") || 2;

            if (linesDiff === 0 && cm._lineFolds) {
                var opts = cm.state.foldGutter.options;
                var rf = opts.rangeFinder || CodeMirror.fold.auto;
                range = rf(cm, CodeMirror.Pos(from));
                
                if (range && range.from.line - range.to.line >= minFoldSize) {
                    cm._lineFolds[from] = range;
                } else {
                    delete cm._lineFolds[from];
                }
            } else if (cm._lineFolds) {
                var newFolds = {};
                Object.keys(cm._lineFolds).forEach(function (line) {
                    line = +line;
                    if (line < from) {
                        newFolds[line] = cm._lineFolds[line];
                    } else {
                        range = cm._lineFolds[line];
                        range.from.line = range.from.line + linesDiff;
                        range.to.line = range.to.line + linesDiff;
                        newFolds[line + linesDiff] = range;
                        
                    }
                });
                cm._lineFolds = newFolds;
            }
        }
        
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
                    if (lineChanges > 0) {
                        updateFoldInfo(cm, changeObj.from.line + lineChanges, changeObj.from.line + lineChanges + 1);
                    }
                }
                state.from = changeObj.from.line;
                state.to = 0;
                clearTimeout(state.changeUpdate);
                state.changeUpdate = setTimeout(function () {
                    updateInViewport(cm);
                }, prefs.getSetting("foldOnChangeTimeSpan") || 600);
            }
        }
        
        function onViewportChange(cm) {
            var state = cm.state.foldGutter;
            clearTimeout(state.changeUpdate);
            state.changeUpdate = setTimeout(function () {
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
        
        function onFold(cm, from, to) {
            var state = cm.state.foldGutter, line = from.line;
            if (line >= state.from && line < state.to) {
                updateFoldInfo(cm, line, line + 1);
            }
        }
        
        function onUnFold(cm, from, to) {
            var state = cm.state.foldGutter, line = from.line;
            var vp = cm.getViewport();
            if (line >= state.from && line < state.to) {
                updateFoldInfo(cm, line, Math.min(vp.to, to.line));
            }
        }
        
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
        
        return {
            clearGutter: clearGutter,
            updateInViewport: updateInViewport
        };
    };
});
