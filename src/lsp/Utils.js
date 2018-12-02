/*
 * Copyright (c) 2018 - present Adobe Systems Incorporated. All rights reserved.
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

define(function (require, exports, module) {
    "use strict";

    function formatTypeDataForToken($hintObj, token) {
        $hintObj.addClass('brackets-hints-with-type-details');
        if (token.detail) {
            if (token.detail.trim() !== '?') {
                if (token.detail.length < 30) {
                    $('<span>' + token.detail.split('->').join(':').toString().trim() + '</span>').appendTo($hintObj).addClass("brackets-hints-type-details");
                }
                $('<span>' + token.detail.split('->').join(':').toString().trim() + '</span>').appendTo($hintObj).addClass("hint-description");
            }
        } else {
            if (token.keyword) {
                $('<span>keyword</span>').appendTo($hintObj).addClass("brackets-hints-keyword");
            }
        }
        if (token.documentation) {
            $hintObj.attr('title', token.documentation);
            $('<span></span>').text(token.documentation.trim()).appendTo($hintObj).addClass("hint-doc");
        }
    }

    /**
     * Check whether to show codehint at the current token 
     * @param   {String} token - current char entered by user
     * @returns {Bool} true/false - whether to show codehint or not
     */
    function hintable(token){
        if(token.string === '(' || token.string === ' '){
            return false;
        }
        return true;
    }

     /**
     * Check whether the current char code can be a part of identifier
     * @param   {Char} code - character code to be checked
     * @returns {Bool} true/false - is Identifier char
     */
    function isIdentifierChar(code){
        //taken from Acorn ** INCOMPLETE**
        if (code < 48){ return code === 36;}
        if (code < 58){ return true;}
        if (code < 65){ return false;}
        if (code < 91){ return true;}
        if (code < 97){ return code === 95;}
        if (code < 123){ return true;}
    }

    /**
     * Check whether the charcters in curr string can be a part of identifier
     * @param   {String} key - string to be checked
     * @returns {Bool} true/false - input can be a part of identifier.
     */
    function maybeIdentifier(key){
        //TODO: This should be dynamic based on the doc language
        let result = false;
        for (let i = 0; i < key.length; i++) {
            result = isIdentifierChar(key.charCodeAt(i));
            if (!result) {
                break;
            }
        }
        return result;
    }

    /**
     * Format the given parameter array. Handles separators between
     * parameters, syntax for optional parameters, and the order of the
     * parameter type and parameter name.
     *
     * @param {!Array.<{label: string}>} params - array of parameter labels
     * @param {function(string)=} appendSeparators - callback function to append separators.
     * @param {function(string, number)=} appendParameter - callback function to append parameter.
     * @return {string} - formatted parameter hint
     */
    function formatParameterHint(params, appendSeparators, appendParameter) {
        var result = "",
            pendingOptional = false;

        params.forEach(function (value, i) {
            var param = value,
                separators = "";
            if (i > 0) {
                separators += ", ";
            }
            if (appendSeparators) {
                appendSeparators(separators);
            }
            result += separators;
            if (appendParameter) {
                appendParameter(param, i);
            }
            result += param;
        });
    }
    /**
     * get IDE capabilities
     * @returns _capabilities - json containing capabilities supported by client
     */
    function getCapabilities(){
        let _capabilities = { //client specific capabilities
            workspace: {
                applyEdit: false,
                configuration: false,
                workspaceEdit: {
                documentChanges: true
                },
                workspaceFolders: true,
                didChangeConfiguration: {
                dynamicRegistration: false
                },
                didChangeWatchedFiles: {
                dynamicRegistration: false
                },
                symbol: {
                dynamicRegistration: false
                },
                executeCommand: {
                dynamicRegistration: false
                }
            },
            textDocument: {
                synchronization: {
                    dynamicRegistration: false,
                    willSave: false,
                    willSaveWaitUntil: true,
                    didSave: false
                },
                completion: {
                    dynamicRegistration: false,
                    completionItem: {
                    snippetSupport: false,
                    commitCharactersSupport: false
                    },
                    contextSupport: true
                },
                hover: {
                    dynamicRegistration: false
                },
                signatureHelp: {
                    dynamicRegistration: false
                },
                references: {
                    dynamicRegistration: false
                },
                documentHighlight: {
                    dynamicRegistration: false
                },
                documentSymbol: {
                    dynamicRegistration: false,
                    hierarchicalDocumentSymbolSupport: false
                },
                formatting: {
                    dynamicRegistration: false
                },
                rangeFormatting: {
                    dynamicRegistration: false
                },
                onTypeFormatting: {
                    dynamicRegistration: false
                },
                definition: {
                    dynamicRegistration: false
                },
                codeAction: {
                    dynamicRegistration: false
                },
                codeLens: {
                    dynamicRegistration: false
                },
                documentLink: {
                    dynamicRegistration: false
                },
                rename: {
                    dynamicRegistration: false
                }
            },
            experimental: {}
        };
        return _capabilities;
    }
    
    exports.getCapabilities = getCapabilities;
    exports.hintable = hintable;
    exports.formatTypeDataForToken = formatTypeDataForToken;
    exports.formatParameterHint = formatParameterHint;
    exports.maybeIdentifier = maybeIdentifier;
});