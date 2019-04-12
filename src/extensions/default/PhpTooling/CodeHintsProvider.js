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

    var phpSuperGlobalVariables = JSON.parse(require("text!phpGlobals.json"));

    function CodeHintsProvider(client) {
        this.defaultCodeHintProviders = new DefaultProviders.CodeHintsProvider(client);
    }

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
            self = this.defaultCodeHintProviders;

        this.defaultCodeHintProviders.client.requestHints({
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
                    formatTypeDataForToken($fHint, element);
                    hints.push($fHint);
                });
            }

            $deferredHints.resolve({
                "hints": hints,
                "selectInitial": true
            });
        }).fail(function () {
            $deferredHints.reject();
        });

        return $deferredHints;
    };

    CodeHintsProvider.prototype.insertHint = function ($hint) {
        return this.defaultCodeHintProviders.insertHint($hint);
    };

    exports.CodeHintsProvider = CodeHintsProvider;
});
