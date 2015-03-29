/**
 * Fold range finder based on line indentations. Ignores blank lines and commented lines
 * @author Patrick Oladimeji
 * @date 12/27/13 21:54:41 PM
 */
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, brackets*/

define(function (require, exports, module) {
    "use strict";
    var CodeMirror = brackets.getModule("thirdparty/CodeMirror2/lib/codemirror");
    var cols = CodeMirror.countColumn, pos = CodeMirror.Pos;

    function lastNonEmptyLineNumber(cm) {
        var lc = cm.lastLine(), line = cm.getLine(lc);
        while (lc > 0 && line.trim().length === 0) {
            lc--;
            line = cm.getLine(lc);
        }
        return lc;
    }

    function indentFold(cm, start) {
        var lineText = cm.getLine(start.line), tabSize = cm.getOption("tabSize");

        var lineIndent = cols(lineText, null, tabSize), collapsible = false, lineCount = cm.lineCount();
        var token = cm.getTokenAt(pos(start.line, lineIndent + 1));
        //no folding for blank lines or commented lines
        if (lineText.trim().length === 0 || (token && token.type === "comment")) {
            return;
        }
        var i, indent, currentLine;
        for (i = start.line + 1; i < lineCount; i++) {
            currentLine = cm.getLine(i);
            indent = cols(currentLine, null, tabSize);

            token = cm.getTokenAt(pos(i, indent + 1));
            //only fold for non blank lines or non commented lines
            if (currentLine.trim().length !== 0 && (token && token.type !== "comment")) {
                if (!collapsible) {
                    if (indent > lineIndent) {
                        collapsible = true;
                    }
                } else {
                    if (indent <= lineIndent) {
                        return {from: pos(start.line, lineText.length),
                                to: pos(i - 1, cm.getLine(i - 1).length)};
                    }
                }

                if (indent === lineIndent || indent < lineIndent) {
                    return;
                }
            }
        }
        //use last nonempty line as the end of the folding region if there is no explicit end to this indent
        if (collapsible) {
            i = lastNonEmptyLineNumber(cm);
            return {from: pos(start.line, lineText.length), to: pos(i, cm.getLine(i).length)};
        }
    }

    module.exports = indentFold;
});
