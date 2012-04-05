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
    
    TextRange.prototype.startLine = null;
    TextRange.prototype.endLine = null;
    
    // TEMPORARY
    TextRange.prototype.clone = function() {
        return new TextRange(null, this.startLine, this.endLine);
    }
    
    
    TextRange.prototype._applySingleChangeToRange = function (editor, change) {
        // Logic from Editor._applyChangesToEditor() & Editor._handleDocumentChange()
        
        console.log("Range(" + this.startLine + "-" + this.endLine + ") applying change to (" + 
                (change.from && (change.from.line+","+change.from.ch)) + " - " +
                (change.to && (change.to.line+","+change.to.ch)) + ")");
        
        // Special case: the range is no longer meaningful since the entire text was replaced
        if (!change.from || !change.to) {
            console.log("All of text changed!!");
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
        // 3. Edit starts at the very beginning of the inline editor (defined as character 0 
        //    of the first line) and crosses at least one newline.
        } else if ( (change.from.line < this.startLine && change.to.line >= this.startLine) ||
                    (change.from.line <= this.endLine && change.to.line > this.endLine) ||
                    (change.from.line === this.startLine && change.from.ch === 0 && change.to.line > change.from.line) ) {
            console.log("Lost sync with text!");
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
            
            // FIXME FIXME FIXME
            // Editor's hideLine() logic used to go here... what now???
            
            console.log("Now Range(" + this.startLine + "-" + this.endLine + ")");
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
    
    
    
    // Define public API
    exports.TextRange = TextRange;
});
