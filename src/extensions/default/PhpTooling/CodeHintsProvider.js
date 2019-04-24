/*
 * Copyright (c) 2019 - present Adobe. All rights reserved.
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

/* eslint-disable indent */
/* eslint max-len: ["error", { "code": 200 }]*/
define(function (require, exports, module) {
    "use strict";

    var _ = brackets.getModule("thirdparty/lodash");

    var DefaultProviders = brackets.getModule("languageTools/DefaultProviders"),
        EditorManager = brackets.getModule('editor/EditorManager'),
        TokenUtils = brackets.getModule("utils/TokenUtils"),
        StringMatch = brackets.getModule("utils/StringMatch"),
        matcher = new StringMatch.StringMatcher({
            preferPrefixMatches: true
        });

    var phpSuperGlobalVariables = JSON.parse(require("text!phpGlobals.json")),
        hintType = {
             "2": "Method",
             "3": "Function",
             "4": "Constructor",
             "6": "Variable",
             "7": "Class",
             "8": "Interface",
             "9": "Module",
             "10": "Property",
             "14": "Keyword",
             "21": "Constant"
        };

    function CodeHintsProvider(client) {
        this.defaultCodeHintProviders = new DefaultProviders.CodeHintsProvider(client);
    }

    function setStyleAndCacheToken($hintObj, token) {
        $hintObj.addClass('brackets-hints-with-type-details');
        $hintObj.data('completionItem', token);
    }

    function filterWithQueryAndMatcher(hints, query) {
        var matchResults = $.map(hints, function (hint) {
            var searchResult = matcher.match(hint.label, query);
            if (searchResult) {
                for (var key in hint) {
                    searchResult[key] = hint[key];
                }
            }

            return searchResult;
        });

        return matchResults;
    }

    CodeHintsProvider.prototype.hasHints = function (editor, implicitChar) {
        return this.defaultCodeHintProviders.hasHints(editor, implicitChar);
    };

    CodeHintsProvider.prototype.getHints = function (implicitChar) {
        if (!this.defaultCodeHintProviders.client) {
            return null;
        }

        var editor = EditorManager.getActiveEditor(),
            pos = editor.getCursorPos(),
            docPath = editor.document.file._path,
            $deferredHints = $.Deferred(),
            self = this.defaultCodeHintProviders,
            client = this.defaultCodeHintProviders.client;

        setTimeout(function(){
            client.requestHints({
                filePath: docPath,
                cursorPos: pos
        }).done(function (msgObj) {
            var context = TokenUtils.getInitialContext(editor._codeMirror, pos),
                hints = [];

            self.query = context.token.string.slice(0, context.pos.ch - context.token.start);
            if (msgObj) {
                var res = msgObj.items || [],
                    trimmedQuery = self.query.trim(),
                    hasIgnoreCharacters = self.ignoreQuery.includes(implicitChar) || self.ignoreQuery.includes(trimmedQuery),
                    isExplicitInvokation = implicitChar === null;

                // There is a bug in Php Language Server, Php Language Server does not provide superGlobals
                // Variables as completion. so these variables are being explicity put in response objects
                // below code should be removed if php server fix this bug.
                if((isExplicitInvokation || trimmedQuery) && !hasIgnoreCharacters) {
                    for(var key in phpSuperGlobalVariables) {
                        res.push({
                            label: key,
                            documentation: phpSuperGlobalVariables[key].description,
                            detail: phpSuperGlobalVariables[key].type
                        });
                    }
                }

                var filteredHints = [];
                if (hasIgnoreCharacters || (isExplicitInvokation && !trimmedQuery)) {
                    filteredHints = filterWithQueryAndMatcher(res, "");
                } else {
                    filteredHints = filterWithQueryAndMatcher(res, self.query);
                }

                StringMatch.basicMatchSort(filteredHints);
                filteredHints.forEach(function (element) {
                    var $fHint = $("<span>")
                        .addClass("brackets-hints");

                    if (element.stringRanges) {
                        element.stringRanges.forEach(function (item) {
                            if (item.matched) {
                                $fHint.append($("<span>")
                                    .append(_.escape(item.text))
                                    .addClass("matched-hint"));
                            } else {
                                $fHint.append(_.escape(item.text));
                            }
                        });
                    } else {
                        $fHint.text(element.label);
                    }

                    $fHint.data("token", element);
                    setStyleAndCacheToken($fHint, element);
                    hints.push($fHint);
                });
            }

            var token = self.query;
            $deferredHints.resolve({
                "hints": hints,
                "enableDescription": true,
                "selectInitial": token && /\S/.test(token) && isNaN(parseInt(token, 10)) // If the active token is blank then don't put default selection
            });
        }).fail(function () {
            $deferredHints.reject();
        });
        }, 0);

        return $deferredHints;
    };

    CodeHintsProvider.prototype.insertHint = function ($hint) {
        return this.defaultCodeHintProviders.insertHint($hint);
    };

    CodeHintsProvider.prototype.updateHintDescription = function ($hint, $hintDescContainer) {
        var $hintObj = $hint.find('.brackets-hints-with-type-details'),
            token = $hintObj.data('completionItem'),
            $desc = $('<div>');

        if(!token) {
            $hintDescContainer.empty();
            return;
        }

        if (token.detail) {
            if (token.detail.trim() !== '?') {
                $('<div>' + token.detail.split('->').join(':').toString().trim() + '</div>').appendTo($desc).addClass("codehint-desc-type-details");
            }
        } else {
            if (hintType[token.kind]) {
                $('<div>' + hintType[token.kind] + '</div>').appendTo($desc).addClass("codehint-desc-type-details");
            }
        }
        if (token.documentation) {
            $('<div></div>').html(token.documentation.trim()).appendTo($desc).addClass("codehint-desc-documentation");
        }

        //To ensure CSS reflow doesn't cause a flicker.
        $hintDescContainer.empty();
        $hintDescContainer.append($desc);
    };

    exports.CodeHintsProvider = CodeHintsProvider;
});
