/*
 * Copyright 2012 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, $: false, CodeMirror: false */

/**
 */
define(function (require, exports, module) {
    'use strict';
    
    /**
     */
    function TextRange(document, startLine, endLine) {
        this.startLine = startLine;
        this.endLine = endLine;
    }
    
    /** @type {number} */
    TextRange.prototype.startLine = null;
    /** @type {number} */
    TextRange.prototype.endLine = null;
    
    
    TextRange.prototype._applySingleChangeToRange = function (editor, change) {
        console.log(this + " applying change to (" +
                (change.from && (change.from.line+","+change.from.ch)) + " - " +
                (change.to && (change.to.line+","+change.to.ch)) + ")");
        
        // Special case: the range is no longer meaningful since the entire text was replaced
        if (!change.from || !change.to) {
            this.startLine = null;
            this.endLine = null;
            
        // Special case: certain changes around the edges of the range are problematic, because
        // if they're undone, we'll be unable to determine how to fix up the range to include the
        // undone content. (The "undo" will just look like an insertion outside our bounds.) So
        // in those cases, we destroy the range instead of fixing it up incorrectly. The specific
        // cases are:
        // 1. Edit crosses the start boundary of the inline editor (defined as character 0 
        //    of the first line).
        // 2. Edit crosses the end boundary of the inline editor (defined as the newline at
        //    the end of the last line).
        // Note: we also used to disallow edits that start at the beginning of the range (character 0
        //    of the first line) if they crossed a newline. This was a vestige from before case #1
        //    was added; now that edits crossing the top boundary (actually, undos of such edits) are
        //    out of the picture, edits on the first line of the range unambiguously belong inside it.
        } else if ( (change.from.line < this.startLine && change.to.line >= this.startLine) ||
                    (change.from.line <= this.endLine && change.to.line > this.endLine) ) {
            this.startLine = null;
            this.endLine = null;
            
        // Normal case: update the range end points if any content was added before them. Note that
        // we don't rely on line handles for this since we want to gracefully handle cases where the
        // start or end line was deleted during a change.
        } else {
            var numAdded = change.text.length - (change.to.line - change.from.line + 1);
            
            // Edits that cross into the first line need to cause an adjustment, but edits that
            // are fully within the first line don't.
            if (change.from.line !== this.startLine && change.to.line <= this.startLine) {
                this.startLine += numAdded;
            }
            if (change.to.line <= this.endLine) {
                this.endLine += numAdded;
            }
            
            console.log("Now " + this);
        }
    }
    
    TextRange.prototype._applyChangesToRange = function (editor, changeList) {
        var change;
        for (change = changeList; change; change = change.next) {
            this._applySingleChangeToRange(editor, change);
            
            // If we lost sync with the range, just bail now
            if (this.startLine === null || this.endLine === null) {
                break;
            }
        }
    };
    
    /* (pretty toString(), to aid debugging) */
    TextRange.prototype.toString = function () {
        return "[TextRange " + this.startLine + "-" + this.endLine + "]";
    };
    
    
    
    
    // Define public API
    exports.TextRange = TextRange;
});
