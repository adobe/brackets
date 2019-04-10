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

/*global Map*/
/* eslint-disable indent */
/* eslint max-len: ["error", { "code": 200 }]*/
define(function (require, exports, module) {
    "use strict";

    var _ = brackets.getModule("thirdparty/lodash");

    var EditorManager = require('editor/EditorManager'),
        DocumentManager = require('document/DocumentManager'),
        ExtensionUtils = require("utils/ExtensionUtils"),
        CommandManager = require("command/CommandManager"),
        Commands = require("command/Commands"),
        TokenUtils = require("utils/TokenUtils"),
        StringMatch = require("utils/StringMatch"),
        CodeInspection = require("language/CodeInspection"),
        PathConverters = require("languageTools/PathConverters"),
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

        var serverCapabilities = this.client.getServerCapabilities();
        if (!serverCapabilities || !serverCapabilities.completionProvider) {
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
        var editor = EditorManager.getActiveEditor(),
            cursor = editor.getCursorPos(),
            token = $hint.data("token"),
            txt = null,
            query = this.query,
            start = {
                line: cursor.line,
                ch: cursor.ch - query.length
            },

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

        var serverCapabilities = this.client.getServerCapabilities();
        if (!serverCapabilities || !serverCapabilities.signatureHelpProvider) {
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
                if (res && res.length) {
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

                    $deferredHints.resolve({
                        parameters: paramList,
                        currentIndex: activeParameter,
                        functionDocumentation: label
                    });
                } else {
                    $deferredHints.reject();
                }
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
     * @param   {Object} curPos - target postion for the cursor after the jump
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

        var serverCapabilities = this.client.getServerCapabilities();
        if (!serverCapabilities || !serverCapabilities.definitionProvider) {
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
            docPathUri = PathConverters.pathToUri(docPath),
            $deferredHints = $.Deferred();

        this.client.gotoDefinition({
            filePath: docPath,
            cursorPos: pos
        }).done(function (msgObj) {
            //For Older servers
            if (Array.isArray(msgObj)) {
                msgObj = msgObj[msgObj.length - 1];
            }

            if (msgObj && msgObj.range) {
                var docUri = msgObj.uri,
                    startCurPos = {};
                startCurPos.line = msgObj.range.start.line;
                startCurPos.ch = msgObj.range.start.character;

                if (docUri !== docPathUri) {
                    let documentPath = PathConverters.uriToPath(docUri);
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
        this._results = new Map();
        this._promiseMap = new Map();
        this._validateOnType = false;
    }

    LintingProvider.prototype.clearExistingResults = function (filePath) {
        var filePathProvided = !!filePath;

        if (filePathProvided) {
            this._results.delete(filePath);
            this._promiseMap.delete(filePath);
        } else {
            //clear all results
            this._results.clear();
            this._promiseMap.clear();
        }
    };

    /**
     * Publish the diagnostics information related to current document
     * @param   {Object} msgObj - json object containing information associated with 'textDocument/publishDiagnostics' notification from server
     */
    LintingProvider.prototype.setInspectionResults = function (msgObj) {
        let diagnostics = msgObj.diagnostics,
            filePath = PathConverters.uriToPath(msgObj.uri),
            errors = [];

        errors = diagnostics.map(function (obj) {
            return {
                pos: {
                    line: obj.range.start.line,
                    ch: obj.range.start.character
                },
                message: obj.message,
                type: (obj.severity === 1 ? CodeInspection.Type.ERROR : (obj.severity === 2 ? CodeInspection.Type.WARNING : CodeInspection.Type.META))
            };
        });

        this._results.set(filePath, {
            errors: errors
        });
        if(this._promiseMap.get(filePath)) {
           this._promiseMap.get(filePath).resolve(this._results.get(filePath));
           this._promiseMap.delete(filePath);
        }
        if (this._validateOnType) {
            var editor = EditorManager.getActiveEditor(),
                docPath = editor ? editor.document.file._path : "";
            if (filePath === docPath) {
                CodeInspection.requestRun();
            }
        }
    };

    LintingProvider.prototype.getInspectionResultsAsync = function (fileText, filePath) {
        var result = $.Deferred();

        if (this._results.get(filePath)) {
            return result.resolve(this._results.get(filePath));
        }
        this._promiseMap.set(filePath, result);
        return result;
    };

    LintingProvider.prototype.getInspectionResults = function (fileText, filePath) {
        return this._results.get(filePath);
    };

    function ReferencesProvider(client) {
        this.client = client;
    }

    ReferencesProvider.prototype.hasReferences = function() {
        return true;
    };

    ReferencesProvider.prototype.getReferences = function() {
        var editor = EditorManager.getActiveEditor(),
            pos = editor.getCursorPos(),
            docPath = editor.document.file._path,
            result = $.Deferred();

        if (this.client) {
            this.client.findReferences({
                filePath: docPath,
                cursorPos: pos
            }).done(function(msgObj){
                    if(msgObj ) {
                        var referenceModel = {};
                        referenceModel.results = {};
                        referenceModel.numFiles = 0;
                        var fulfilled = 0,
                            queryInfo = "";
                        msgObj.forEach((element, i) => {
                            var filePath = PathConverters.uriToPath(element.uri);
                            DocumentManager.getDocumentForPath(filePath)
                                .done(function(doc) {
                                    var startRange = {line: element.range.start.line, ch: element.range.start.character};
                                    var endRange = {line: element.range.end.line, ch: element.range.end.character};
                                    var match = {
                                        start: startRange,
                                        end: endRange,
                                        line: doc.getLine(element.range.start.line)
                                    };
                                    if(!referenceModel.results[filePath]) {
                                        referenceModel.numFiles = referenceModel.numFiles + 1;
                                        referenceModel.results[filePath] = {"matches": []};
                                    }
                                    if(!queryInfo) {
                                        referenceModel.queryInfo = doc.getRange(startRange, endRange);
                                    }
                                    referenceModel.results[filePath]["matches"].push(match);
                                }).always(function() {
                                    fulfilled++;
                                    if(fulfilled === msgObj.length) {
                                        referenceModel.numMatches = msgObj.length;
                                        referenceModel.allResultsAvailable = true;
                                        result.resolve(referenceModel);
                                    }
                                });
                        });
                    } else {
                        result.reject();
                    }
                }).fail(function(){
                    result.reject();
                });
            return result.promise();
        }
        return result.reject();
    };

    exports.CodeHintsProvider = CodeHintsProvider;
    exports.ParameterHintsProvider = ParameterHintsProvider;
    exports.JumpToDefProvider = JumpToDefProvider;
    exports.LintingProvider = LintingProvider;
    exports.ReferencesProvider = ReferencesProvider;
});
