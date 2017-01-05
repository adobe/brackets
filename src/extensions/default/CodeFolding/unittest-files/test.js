/**
  * Synchronises the code folding states in the CM doc to cm._lineFolds cache.
  * When an undo operation is done, if folded code fragments are restored, then
  * we need to update cm._lineFolds with the fragments
  * @param {Object}   cm        cm the CodeMirror instance for the active  editor
  * @param {Object}   from      starting position in the doc to sync the fold states from
  * @param {[[Type]]} lineAdded a number to show how many lines where added to the document
*/
/*global define, brackets, document, window, $, CodeMirror, isFold, prefs*/

function syncDocToFoldsCache(cm, from, lineAdded) {
    "use strict";
    var minFoldSize = prefs.getSetting("minFoldSize") || 2;
    var opts = cm.state.foldGutter.options || {};
    var rf = opts.rangeFinder || CodeMirror.fold.auto;
    var i, pos, folds, fold, range;
    if (lineAdded <= 0) {
        return;
    }

    for (i = from; i <= from + lineAdded; i = i + 1) {
        pos = CodeMirror.Pos(i);
        folds = cm.doc.findMarksAt(pos).filter(isFold);
        fold = folds.length ? fold = folds[0] : undefined;
        if (fold) {
            range = rf(cm, CodeMirror.Pos(i));
            if (range && range.to.line - range.from.line >= minFoldSize) {
                cm._lineFolds[i] = range;
                i = range.to.line;
            } else {
                delete cm._lineFolds[i];
            }
        }
    }

}
