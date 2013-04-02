/*
 * Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
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


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, CodeMirror */

/**
 * 
 * TODO: better document initial state before first calling next() (is token null?)
 * 
 * Initially set to the token containing the char to the left of 'pos' (i.e. the char at ch = pos.ch - 1). This
 * may or may not include the char at pos.ch itself.
 * TODO: this is very counterintuitive, e.g. asking for the token at ch:0 will ALWAYS return null.
 * BUT it's how the CM API works. So on balance is it worth trying to abstract that away?
 * We'd have to recheck a LOT of code...
 * 
 * After next, pos is the char after the first char in the token (if the token is length 1, then this char is not
 * actually in the token). (This is true even for the 1st token on the line: starting a new line sets ch to 0, but
 * we emit an empty "" token first and then when we omit the actual first token, ch is again 1 char past start of token).
 * 
 * After prev, pos is the char after the last char in the token. True for the last token in the line too, in which
 * case pos point to a ch that does not exist (just past the actual last ch in the line).
 * 
 * When iteration hits the end of the file (or start if moving in reverse), 'token' is null and 'pos' reflects the
 * EOF/BOF position. Calling next() after this point does not further change 'pos'.
 * 
 * TODO: behavior for blank lines - StringTokenStream skips them, TokenStream emits a "" null token
 * 
 * TODO: clarify behavior if started on an empty string
 * 
 * TODO: document token.start/end (is end exclusive or inclusive?)
 * 
 * TOOD: document difference between editor & string based streams
 * 
 * TODO: editor stream emits a null "" token at START of each line
 * 
 * 
 * TODO: add nextUntil()/prevUntil()/nextWhile()/prevWhile() for convenience
 */
define(function (require, exports, module) {
    "use strict";
    
    // Load dependent modules
    var TokenUtils              = require("utils/TokenUtils"),
        DocumentManager         = require("document/DocumentManager"),
        EditorManager           = require("editor/EditorManager");
    
    
    function clonePos(pos) {
        return { line: pos.line, ch: pos.ch };
    }
    
    
    function TokenStream(editor, initialPos) {
        if (initialPos) {
            // clone the pos we were handed since TokenUtils will modify it
            this.pos = clonePos(initialPos);
        } else {
            this.pos = { line: 0, ch: 0 };
        }
        this._ctx = TokenUtils.getInitialContext(editor._codeMirror, this.pos);
        this.token = this._ctx.token;
        this._editor = editor;
        this._outerMode = editor._codeMirror.getMode();
    }
    
    TokenStream.prototype.pos = null;   // TODO: should this be immutable too? (i.e. cloned on each move so clients can store it in data structs, etc.)
    TokenStream.prototype.token = null;
    // TODO: document private members
    
    /**
     * Returns a new TokenStream with the exact same state as this one. Moving forward/backward
     * in the cloned stream does not affect the state of the original stream.
     * @return {!TokenStream}
     */
    TokenStream.prototype.clone = function () {
        return new TokenStream(this._editor, this.pos);
    };
    
    
    // TODO: is this only ever used to get the offset of the initial pos? seems like it will always be 0 once we start moving
    TokenStream.prototype.getOffsetFromTokenStart = function () {
        return TokenUtils.offsetInToken(this._ctx);
    };
    
    // Two codepaths in HTMLUtils.getTagInfo() rely on the current token being one ahead of the indicated current pos
    // TODO: clean up and remove this
    TokenStream.prototype._desyncNext = function () {
        var oldPos = { line: this.pos.line, ch: this.pos.ch };
        this.next();
        this._ctx.pos = oldPos;
        this.pos = oldPos;
    };
    
    /** Returns what next() would return, except without changing the stream's current state */
    TokenStream.prototype.peek = function () {
        this._ctx.pos = clonePos(this._ctx.pos);  // use a temp pos so we can restore from this.pos (which is normally the same obj as _ctx.pos)
        var result = TokenUtils.moveNextToken(this._ctx) ? this._ctx.token : null;
        this._ctx.pos = this.pos;
        this._ctx.token = this.token;
        return result;
    };
    
    /**
     * Returns the token that is 1 char ahead of the current pos, without changing the stream's current state.
     * This may be THE SAME token as the current one - depending on the token's length and the offset of pos
     * from the token's start.
     */
    TokenStream.prototype.maybePeek = function () {
        return this._editor._codeMirror.getTokenAt({ch: this.pos.ch + 1, line: this.pos.line});
    };
    
    TokenStream.prototype.next = function () {
        if (TokenUtils.moveNextToken(this._ctx)) {
            this.pos = this._ctx.pos;
            this.token = this._ctx.token;
            return this.token;
        } else {
            this.token = null;
            return null;
        }
    };
    TokenStream.prototype.nextSkipWs = function () {
        if (TokenUtils.moveSkippingWhitespace(TokenUtils.moveNextToken, this._ctx)) {
            this.pos = this._ctx.pos;
            this.token = this._ctx.token;
            return this.token;
        } else {
            this.token = null;
            return null;
        }
    };
    
    TokenStream.prototype.prev = function () {
        if (TokenUtils.movePrevToken(this._ctx)) {
            this.pos = this._ctx.pos;
            this.token = this._ctx.token;
            return this.token;
        } else {
            this.token = null;
            return null;
        }
    };
    TokenStream.prototype.prevSkipWs = function () {
        if (TokenUtils.moveSkippingWhitespace(TokenUtils.movePrevToken, this._ctx)) {
            this.pos = this._ctx.pos;
            this.token = this._ctx.token;
            return this.token;
        } else {
            this.token = null;
            return null;
        }
    };
    
    /** Returns the complete text of the current line, excluding \n */
    TokenStream.prototype.lineText = function () {
        return this._editor._codeMirror.getLine(this.pos.line);
    };
    
    /**
     * Returns the mode object and current state of the innermost mode associated with the given token. If the
     * document does not have mode nesting, this will be the same as the overall document mode and
     * token.state, respectively.
     * @return {!{mode:{name:string}, state:Object}}
     */
    TokenStream.prototype.modeInfoAtToken = function () {
        return CodeMirror.innerMode(this._outerMode, this.token.state);
    };
    
    TokenStream.prototype.indexOfTokenStart = function () { // this is NOT index of ch: that's always +1 this value (which may be past EOF)
        // FIXME
    };
    
    
    function StringTokenStream(text, modeName) {
        this._mode = CodeMirror.getMode({}, modeName);
        if (!this._mode) {
            throw new Error("No CodeMirror mode exists for " + modeName);
        }
        this._modeState = CodeMirror.startState(this._mode);
        
        if (text.indexOf("\r") !== -1) {  // we expect CodeMirror/Document-style line endings
            console.error("StringTokenStream requires line endings normalized to \\n");
        }
        this._text = text;
        
        this._nextEol = -1;
        //this._index
        //this._stream
        this.pos = { line: -1 };
        
        this._nextLine();
    }
    // TODO: document private members
    
    StringTokenStream.prototype._nextLine = function () {
        var lineText;
        do {
            this._index = this._nextEol + 1;
            if (this._index >= this._text.length) {
                return false;
            }
            this._nextEol = this._text.indexOf("\n", this._index);
            if (this._nextEol === -1) {
                this._nextEol = this._text.length;  // last line
            }
            this.pos.line++;
            this.pos.ch = 1;
            
            lineText = this._text.substring(this._index, this._nextEol);
        } while (lineText === "");
        
        this._stream = new CodeMirror.StringStream(lineText);
        return true;
        // at this point, _stream.pos and _index both point to the start of the line; and pos.ch points to 1 char later
    };
    
    StringTokenStream.prototype.pos = null;
    StringTokenStream.prototype.token = null;
    
    StringTokenStream.prototype.clone = function () {
        // FIXME!
    };
    
    StringTokenStream.prototype.getOffsetFromTokenStart = function () {
        return TokenUtils.offsetInToken({pos: this.pos, token: this.token});
    };
    
    /**
     * Returns the token that is 1 char ahead of the current pos, without changing the stream's current state.
     * This may be THE SAME token as the current one - depending on the token's length and the offset of pos
     * from the token's start.
     */
    StringTokenStream.prototype.maybePeek = function () {
        throw new Error();  // only supported for the HTMLUtils/CSSUtils use cases
    };
    
    StringTokenStream.prototype.next = function () {
        if (!this._stream) {
            return null;  // special case if fed empty string or string of nothing but empty lines
        }
        
        this._stream.start = this._stream.pos;  // move stream to start of next token (just past end of prev token)
        
        // Advance our position before trying to advance stream, since we want our state to point past EOF if we bail due to EOF
        var oldPos = this.pos.ch;
        this.pos.ch = this._stream.start + 1;  // +1 to line up with the odd way editor-driven iteration works
        this._index += (this.pos.ch - oldPos);
        // now pos.ch and _index also reflect the start of the token we're about to emit
        
        if (this._stream.eol()) {
            console.assert(this._index >= this._nextEol, this._index + " < " + this._nextEol + " but stream IS at EOL - stream.pos=" + this._stream.pos);
        } else {
            console.assert(this._index < this._nextEol, this._index + " >= " + this._nextEol + " but stream is NOT at EOL ?????");
        }
        
        if (this._stream.eol()) {
            if (!this._nextLine()) {
                this.token = null;
                return null;
            }
        }

        if (this._stream.eol()) {
            console.assert(this._index >= this._nextEol, this._index + " < " + this._nextEol + " but stream IS at EOL");
        } else {
            console.assert(this._index < this._nextEol, this._index + " >= " + this._nextEol + " but stream is NOT at EOL");
        }

        var stream = this._stream;
        
        var style = this._mode.token(stream, this._modeState);  // advances stream.pos to end of token
        var tokenText = stream.current();
        
        console.assert(stream.pos - stream.start === tokenText.length);
        
        this.token = {
            start: stream.start,        // inclusive
            end: stream.pos,            // exclusive (end === start + string.length)
            string: tokenText,
            className: style || null,  // normalize undefined style to null, just like CM does
            type: style || null
            // state: CodeMirror.copyState(this._mode, this._state) - TODO: need to clone state each time??
        };
        return this.token;
        // at this point, _stream.pos points to 1st char AFTER the token (which may be past EOL); _index still points to start of token, and pos.ch still points to 1 char later (may also be past EOL if token was len 1)
    };
    StringTokenStream.prototype.nextSkipWs = function () {
        TokenUtils.moveSkippingWhitespace(this.next.bind(this), this);
        return this.token;
    };
    
    StringTokenStream.prototype.lineText = function () {
        return this._stream.string;
    };

    StringTokenStream.prototype.modeInfoAtToken = function () {
        return CodeMirror.innerMode(this._mode, this._state);   // WARNING: unlike the EditorTokenStream case, this state object WILL change when the stream moves
    };
    
    StringTokenStream.prototype.indexOfTokenStart = function () { // this is NOT index of ch: that's always +1 this value (which may be past EOF)
        return this._index;
    };
    
    
    /**
     * Token streams created without an editor are missing certain capabilities:
     *  - must start at beginning of string
     *  - cannot move backwards
     *  - cannot peek()
     *  - tokens do not contain a 'state' property
     */
    function forString(str, modeName) {
        return new StringTokenStream(str, modeName);
    }
    
    // TODO: fix https://github.com/adobe/brackets/issues/2335 by forcing editor to flush any pending tokenization first
    function forEditor(editor, initialPos) {
        return new TokenStream(editor, initialPos);
    }
    
    function forDocument(doc, initialPos) {
        if (doc._masterEditor) {
            return new TokenStream(doc._masterEditor, initialPos);
        } else {
            return forString(doc.getText(), doc.getLanguage().getMode());
        }
    }
    
    // Define public API
    exports.forString = forString;
    exports.forEditor = forEditor;
    exports.forDocument = forDocument;
});
