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

    var EditorManager = require('editor/EditorManager'),
        ExtensionUtils = require("utils/ExtensionUtils"),
        CommandManager = require("command/CommandManager"),
        Commands = require("command/Commands"),
        TokenUtils = require("utils/TokenUtils"),
        StringMatch = require("utils/StringMatch"),
        CodeInspection = require("language/CodeInspection"),
        matcher = new StringMatch.StringMatcher({
            preferPrefixMatches: true
        });

    ExtensionUtils.loadStyleSheet(module, "styles/default_provider_style.css");

    function CodeHintsProvider(client) {
        this.client = client;
        this.query = "";
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
        if (!this.client) {
            return false;
        }

        return true;
    };

    CodeHintsProvider.prototype.getHints = function (implicitChar) {
        if (!this.client) {
            return null;
        }

        var editor = EditorManager.getActiveEditor(),
            pos = editor.getCursorPos(),
            docPath = editor.document.file._path,
            $deferredHints = $.Deferred(),
            self = this;

        this.client.requestHints({
            filePath: docPath,
            cursorPos: pos
        }).done(function (msgObj) {
            var context = TokenUtils.getInitialContext(editor._codeMirror, pos),
                hints = [];

            self.query = context.token.string.slice(0, context.pos.ch - context.token.start);
            if (msgObj) {
                var res = msgObj.items,
                    filteredHints = filterWithQueryAndMatcher(res, self.query);

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
                "hints": hints
            });
        }).fail(function () {
            $deferredHints.reject();
        });

        return $deferredHints;
    };

    CodeHintsProvider.prototype.insertHint = function ($hint) {
        var start = {
                line: -1,
                ch: -1
            },
            end = {
                line: -1,
                ch: -1
            },
            editor = EditorManager.getActiveEditor(),
            cursor = editor.getCursorPos(),
            token = $hint.data("token"),
            txt = null,
            query = this.query;

        start = {
            line: cursor.line,
            ch: cursor.ch - query.length
        };

        end = {
            line: cursor.line,
            ch: cursor.ch
        };

        txt = token.label;
        if (token.textEdit && token.textEdit.newText) {
            txt = token.textEdit.newText;
            start = {
                line: token.textEdit.range.start.line,
                ch: token.textEdit.range.start.character
            };
            end = {
                line: token.textEdit.range.end.line,
                ch: token.textEdit.range.end.character
            };
        }

        if (editor) {
            editor.document.replaceRange(txt, start, end);
        }
        // Return false to indicate that another hinting session is not needed
        return false;
    };

    function ParameterHintsProvider(client) {
        this.client = client;
    }

    ParameterHintsProvider.prototype.hasParameterHints = function (editor, implicitChar) {
        if (!this.client) {
            return false;
        }

        return true;
    };

    ParameterHintsProvider.prototype.getParameterHints = function () {
        if (!this.client) {
            return null;
        }

        var editor = EditorManager.getActiveEditor(),
            pos = editor.getCursorPos(),
            docPath = editor.document.file._path,
            $deferredHints = $.Deferred();

        this.client.requestParameterHints({
            filePath: docPath,
            cursorPos: pos
        }).done(function (msgObj) {
            let paramList = [];
            let label;
            let activeParameter;
            if (msgObj) {
                let res;
                res = msgObj.signatures;
                activeParameter = msgObj.activeParameter;
                if (res) {
                    res.forEach(function (element) {
                        label = element.documentation;
                        let param = element.parameters;
                        param.forEach(ele => {
                            paramList.push({
                                label: ele.label,
                                documentation: ele.documentation
                            });
                        });
                    });
                }

                $deferredHints.resolve({
                    parameters: paramList,
                    currentIndex: activeParameter,
                    functionDocumentation: label
                });
            } else {
                $deferredHints.reject();
            }
        }).fail(function () {
            $deferredHints.reject();
        });

        return $deferredHints;
    };

    /**
     * Utility function to make the jump
     * @param   {Object} curPos - target postion fo the cursor after the jump
     */
    function setJumpPosition(curPos) {
        EditorManager.getCurrentFullEditor().setCursorPos(curPos.line, curPos.ch, true);
    }

    function JumpToDefProvider(client) {
        this.client = client;
    }

    JumpToDefProvider.prototype.canJumpToDef = function (editor, implicitChar) {
        if (!this.client) {
            return false;
        }

        return true;
    };

    /**
     * Method to handle jump to definition feature.
     */
    JumpToDefProvider.prototype.doJumpToDef = function () {
        if (!this.client) {
            return null;
        }

        var editor = EditorManager.getFocusedEditor(),
            pos = editor.getCursorPos(),
            docPath = editor.document.file._path,
            docPathUri = "file://" + docPath,
            $deferredHints = $.Deferred();

        this.client.gotoDefinition({
            filePath: docPath,
            cursorPos: pos
        }).done(function (msgObj) {
            if (msgObj && msgObj.range) {
                var docUri = msgObj.uri,
                    startCurPos = {};
                startCurPos.line = msgObj.range.start.line;
                startCurPos.ch = msgObj.range.start.character;

                if (docUri !== docPathUri) {
                    let documentPath = docUri.substr(7);
                    CommandManager.execute(Commands.FILE_OPEN, {
                            fullPath: documentPath
                        })
                        .done(function () {
                            setJumpPosition(startCurPos);
                            $deferredHints.resolve();
                        });
                } else { //definition is in current document
                    setJumpPosition(startCurPos);
                    $deferredHints.resolve();
                }
            }
        }).fail(function () {
            $deferredHints.reject();
        });

        return $deferredHints;
    };

    function LintingProvider() {
        this._results = null;
    }

    /**
     * Publish the diagnostics information related to current document
     * @param   {Object} msgObj - json object containg information associated with 'textDocument/publishDiagnostics' notification from server
     */
    LintingProvider.prototype.setInspectionResults = function (msgObj) {
        let diagnostics = msgObj.diagnostics;
        let errors = [];
        diagnostics.forEach(obj => {
            let err = {
                pos: {
                    line: obj.range.start.line,
                    ch: obj.range.start.character
                },
                message: obj.message,
                type: (obj.severity === 1 ? CodeInspection.Type.ERROR : (obj.severity === 2 ? CodeInspection.Type.WARNING : CodeInspection.Type.META))
            };
            errors.push(err);
        });

        this._results = {
            errors: errors
        };
    };

    LintingProvider.prototype.getInspectionResults = function () {
        return this._results;
    };

    exports.CodeHintsProvider = CodeHintsProvider;
    exports.ParameterHintsProvider = ParameterHintsProvider;
    exports.JumpToDefProvider = JumpToDefProvider;
    exports.LintingProvider = LintingProvider;
});
