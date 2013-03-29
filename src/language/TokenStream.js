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
 * TO PORT OVER:
 *  / HTMLUtils - BUT required _desyncNext() hack & uses maybePeek()
 *  / CSSUtils - uses maybePeek()
 *  / CSSCodeHints/main
 *  / EditorCommandHandlers - BUT required _editor._codeMirror.indexFromPos() access
 *  - CSSUtils.extractAllSelectors() - does its own token iteration
 *  - JSUtils (CodeMirror.getMode())
 *  - CSSUtils (CodeMirror.getMode())
 *  - svg-preview/XMLPathFinder
 * 
 * https://github.com/adobe/brackets/issues/804
 * https://github.com/adobe/brackets/issues/425
 * 
 * 
 * Initially set to the token containing the char to the left of 'pos' (i.e. the char at ch = pos.ch - 1). This
 * may or may not include the char at pos.ch itself.
 * TODO: this is very counterintuitive, e.g. asking for the token at ch:0 will ALWAYS return null.
 * BUT it's how the CM API works. So on balance is it worth trying to abstract that away?
 * We'd have to recheck a LOT of code...
 * 
 * TODO: document 'pos' after next/prev
 * 
 * TODO: document token.start/end (is end exclusive or inclusive?)
 * 
 * When iteration hits the end of the file (or start if moving in reverse), 'token' is null
 * and 'pos' reflects the EOF/BOF position.
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
        this._ctx.pos = clonePos(this._ctx.pos); // use a temp pos so we can restore from this.pos (which is normally the same obj as _ctx.pos)
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
//        var peekToken = this.peek();
//        var token = this._editor._codeMirror.getTokenAt({ch: this.pos.ch + 1, line: this.pos.line});
//        console.log("@{", this.pos, this.token, "} - Result:", token, "vs true next", peekToken);
//        console.log(this._editor._codeMirror.getLine(this.pos.line));
//        return token;
        
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
    
    /**
     * Returns the mode object and current state of the innermost mode associated with the given token. If the
     * document does not have mode nesting, this will be the same as the overall document mode and
     * token.state, respectively.
     * @return {!{mode:{name:string}, state:Object}}
     */
    TokenStream.prototype.modeInfoAtToken = function () {
        return CodeMirror.innerMode(this._outerMode, this.token.state);
    };
    
    
    function forString(str, initialPos) {
        throw new Error("Not implemented yet");
    }
    
    function forFile(fileEntry, initialPos) {   // TODO: omit? this one would have to be async
        throw new Error("Not implemented yet");
    }
    
    // TODO: fix https://github.com/adobe/brackets/issues/2335 by forcing editor to flush any pending tokenization first
    function forEditor(editor, initialPos) {
        return new TokenStream(editor, initialPos);
    }
    
    function forDocument(doc, initialPos) {
        if (doc._masterEditor) {
            return new TokenStream(doc._masterEditor, initialPos);
        } else {
            return forString(doc.getText());
        }
    }
    
    // Define public API
//    exports.forString = forString;
//    exports.forFile = forFile;
    exports.forEditor = forEditor;
    exports.forDocument = forDocument;
});
