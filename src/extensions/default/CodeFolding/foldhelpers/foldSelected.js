/**
 * Selection range helper for code folding.
 * @author Patrick Oladimeji
 * @date 31/07/2015 00:11:53
 */

define(function (require, exports, module) {
    "use strict";

    /**
     * This helper returns the start and end range represeting the current selection in the editor.
     * @param   {Object} cm    The Codemirror instance
     * @param   {Object} start A Codemirror.Pos object {line, ch} representing the current line we are
     *                          checking for fold ranges
     * @returns {Object} The fold range, {from, to} representing the current selection.
     */
    function SelectionFold(cm, start) {
        if (!cm.somethingSelected()) {
            return;
        }

        var from = cm.getCursor("from"),
            to  = cm.getCursor("to");
        if (from.line === start.line) {
            return {from: from, to: to};
        }
    }

    module.exports = SelectionFold;
});
