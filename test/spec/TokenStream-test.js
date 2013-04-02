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

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, describe: false, $: false, beforeEach: false, afterEach: false, it: false, expect: false, brackets: false */

define(function (require, exports, module) {
    'use strict';
    
    // Load dependent modules
    var TokenStream     = require("language/TokenStream"),
        SpecRunnerUtils = require("spec/SpecRunnerUtils");
    
    describe("TokenStream", function () {
        
        /**
         * Array of lines. Each line is an array of token representations. Each token is
         * an array with two items: string content and string type.
         * @param {Array.<Array.<[string, string]>>} tokens
         */
        function expectTokens(stream, tokens, reverse) {
//            console.log("ExpectTokens from " + stream + ", reverse? " + reverse);

            var line, ch,
                tokenIndexOnLine;
            var skip = reverse;
            
//            function expect2(actualVal) {
//                var expectObj = expect(actualVal);
//                var oldToBe = expectObj.toBe;
//                expectObj.toBe = function (expectedVal) {
//                    if (actualVal !== expectedVal) {
//                        console.log("At " + line + ":" + ch + " expected", actualVal, "to be", expectedVal);
//                    }
//                    oldToBe.call(expectObj, expectedVal);
//                };
//                return expectObj;
//            }
            
            function lastTokenStartCh() {
                var index = 0;
                tokens[line].forEach(function (token) { index += token[0].length; });
                index -= tokens[line][tokens[line].length - 1][0].length;
                return index;
            }
            
            line = reverse ? tokens.length - 1 : 0;
            ch = reverse ? lastTokenStartCh() : 0;
            tokenIndexOnLine = reverse ? tokens[line].length - 1 : 0;
            
            function nextLineWithTokens() {
                var i = line;
                var inc = (reverse ? -1 : 1);
                do {
                    i += inc;
                } while (i < tokens.length && tokens[i].length === 0);
                expect(i).toBeLessThan(tokens.length);
                return i;
            }
            
            function move() {
                // When moving in reverse, we must start from a predefined point, i.e. the last token. We can't start from
                // a state *after* the last token. This is different from moving forward, where we start without a specified
                // pos, and therefore the stream begins in a state *before* any tokens.
                if (reverse && skip) {
                    skip = false;
                    return true;
                }
                return reverse ? stream.prev() : stream.next();
            }
            
//            console.log("Initial state: " + line + ":" + ch + ", token #" + tokenIndexOnLine);
//            console.log("           vs: " + stream.pos.line + ":" + stream.pos.ch);
        
            while (move()) {
//                console.log("TOKEN", stream.token, "@", stream.pos.line + ":" + stream.pos.ch);
                
                if (stream.pos.line !== line) {
                    if (reverse) {
                        expect(tokenIndexOnLine).toBe(-1);
                        expect(stream.pos.line).toBe(line - 1);
                    } else {
                        expect(tokenIndexOnLine).toBe(tokens[line].length);
                        expect(stream.pos.line).toBe(line + 1);
                    }
                    expect(stream.pos.line).toBe(nextLineWithTokens());
                    
                    line = stream.pos.line;
                    tokenIndexOnLine = reverse ? tokens[line].length - 1 : 0;
                    ch = reverse ? lastTokenStartCh() : 0;
                }
                
                var actualToken = stream.token;
                
                if (actualToken.string !== "") {
                    var expectedToken = tokens[line][tokenIndexOnLine];
                    expect(actualToken.string).toBe(expectedToken[0]);
                    expect(actualToken.type).toBe(expectedToken[1] || null);
                    expect(actualToken.start).toBe(ch);
                    expect(actualToken.end).toBe(actualToken.start + actualToken.string.length);
                    
                    var oldCh = ch;
                    if (reverse) {
                        expect(stream.pos.ch).toBe(actualToken.end);
                        if (tokenIndexOnLine > 0) {
                            ch -= tokens[line][tokenIndexOnLine - 1][0].length;
                        }
                    } else {
                        expect(stream.pos.ch).toBe(actualToken.start + 1);
                        ch = stream.token.end;
                    }
                    
                    tokenIndexOnLine += (reverse ? -1 : 1);
                    
                } else {
                    console.log("Warning: emtpy token");    // TODO: don't accept these
                }
            }
            
            if (reverse) {
                expect(stream.pos.line).toBe(0);
                expect(tokenIndexOnLine).toBe(-1);
            } else {
                expect(stream.pos.line).toBe(tokens.length - 1);
                expect(tokenIndexOnLine).toBe(tokens[line].length);
            }
        }
        
        var simpleFunction = "function simple() {\n" +
                             "    // test\n" +
                             "}";
        var simpleFunctonTokens = [
            [ ["function", "keyword"], [" "], ["simple", "variable"], ["("], [")"], [" "], ["{"] ],
            [ ["    "], ["// test", "comment"] ],
            [ ["}"] ]
        ];
        
        var wsFunction = "function simple() {\n" +
                         "\n" +
                         "    // test\n" +
                         "    \n" +
                         "}";
        var wsFunctionTokens = [
            [ ["function", "keyword"], [" "], ["simple", "variable"], ["("], [")"], [" "], ["{"] ],
            [],
            [ ["    "], ["// test", "comment"] ],
            [ ["    "] ],
            [ ["}"] ]
        ];

        describe("Editor-based tokens", function () {
            var editor;
            
            function createEditor(content) {
                var mocks = SpecRunnerUtils.createMockEditor(content, "javascript");
                editor = mocks.editor;
            }
            
            afterEach(function () {
                SpecRunnerUtils.destroyMockEditor(editor);
                editor = null;
            });
            
            it("should provide tokens for simple functon, forward", function () {
                createEditor(simpleFunction);
                var stream = TokenStream.forEditor(editor);
                expectTokens(stream, simpleFunctonTokens, false, false);
            });
            
            it("should provide tokens for simple functon, in reverse", function () {
                createEditor(simpleFunction);
                var stream = TokenStream.forEditor(editor, {line: 2, ch: 1});
                expectTokens(stream, simpleFunctonTokens, true, false);
            });
            
            // TODO: editor streams emit a single "" token for blank links
//            it("should provide tokens for code with whitespace/blank lines", function () {
//                createEditor(wsFunction);
//                var stream = TokenStream.forEditor(editor);
//                expectTokens(stream, wsFunctionTokens, false, false);
//            });
            
//            it("should skip whitespace, forward", function () {
//                createEditor(wsFunction);
//                var stream = TokenStream.forEditor(editor);
//                expectTokens(stream, wsFunctionTokens_noWs, false, true);
//            });
//            
//            it("should skip whitespace, in reverse", function () {
//                createEditor(wsFunction);
//                var stream = TokenStream.forEditor(editor);
//                expectTokens(stream, wsFunctionTokens_noWs, true, true);
//            });
            
            // TODO: initial state
            // TODO: state at EOF
            // TODO: moving forward from specified position
            // TODO: moving backward from specified position
            // TODO: clone()
            // TODO: peek()
            // TODO: getOffsetFromTokenStart()
            // TODO: lineText()
            // TODO: modeInfoAtToken()
            // TODO: indexOfTokenStart() ?
            
            it("should handle empty string", function () {
                createEditor("");
                var stream = TokenStream.forEditor(editor);
//                expect(stream.token).toBe(null); TODO
                expect(stream.next()).toBeFalsy();
            });
        });
            
        describe("String-based tokens", function () {
            it("should provide tokens for simple functon, forward", function () {
                var stream = TokenStream.forString(simpleFunction, "javascript");
                expectTokens(stream, simpleFunctonTokens);
            });
            
            // TODO: ws-skipping move next
            // TODO: initial state
            // TODO: state at EOF
            // TODO: clone()
            // TODO: getOffsetFromTokenStart()
            // TODO: lineText()
            // TODO: modeInfoAtToken()
            // TODO: indexOfTokenStart()

            it("should handle empty string", function () {
                var stream = TokenStream.forString("", "javascript");
                expect(stream.token).toBe(null);
                expect(stream.next()).toBeFalsy();
            });
        });
    });
});
