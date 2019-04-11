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

/*jslint regexp: true */

define(function (require, exports, module) {
    "use strict";

    var EditorManager = brackets.getModule("editor/EditorManager"),
        QuickOpen = brackets.getModule("search/QuickOpen"),
        Commands = brackets.getModule("command/Commands"),
        DocumentManager = brackets.getModule("document/DocumentManager"),
        CommandManager = brackets.getModule("command/CommandManager"),
        PathConverters = brackets.getModule("languageTools/PathConverters");

    var SymbolKind = QuickOpen.SymbolKind;

    function convertRangePosToEditorPos(rangePos) {
        return {
            line: rangePos.line,
            ch: rangePos.character
        };
    }

    function SymbolInformation(label, fullPath, selectionRange, type, scope, isDocumentSymbolRequest) {
        this.label = label;
        this.fullPath = fullPath;
        this.selectionRange = selectionRange;
        this.type = type;
        this.scope = scope;
        this.isDocumentSymbolRequest = isDocumentSymbolRequest;
    }

    function createList(list, isDocumentSymbolRequest) {
        var doc = DocumentManager.getCurrentDocument();

        //Should only function when a document is open
        if (!doc) {
            return [];
        }

        var newlist = [];
        for (var i = 0; i < list.length; i++) {
            var symbolInfo = list[i],
                label = symbolInfo.name,
                type = SymbolKind[symbolInfo.kind.toString()],
                fullPath = null,
                selectionRange = null,
                scope = symbolInfo.containerName,
                range = null;

            if (!isDocumentSymbolRequest) {
                fullPath = PathConverters.uriToPath(symbolInfo.location.uri);
            } else {
                if (symbolInfo.selectionRange) {
                    range = symbolInfo.selectionRange;
                    selectionRange = {
                        from: convertRangePosToEditorPos(range.start),
                        to: convertRangePosToEditorPos(range.end)
                    };
                }
            }

            if (!selectionRange) {
                range = symbolInfo.location.range;
                selectionRange = {
                    from: convertRangePosToEditorPos(range.start),
                    to: convertRangePosToEditorPos(range.end)
                };
            }

            newlist.push(new SymbolInformation(label, fullPath, selectionRange, type, scope, isDocumentSymbolRequest));
        }

        return newlist;
    }

    function transFormToSymbolList(query, matcher, results, isDocumentSymbolRequest) {
        var list = createList(results, isDocumentSymbolRequest);

        // Filter and rank how good each match is
        var filteredList = $.map(list, function (symbolInfo) {
            var searchResult = matcher.match(symbolInfo.label, query);
            if (searchResult) {
                searchResult.symbolInfo = symbolInfo;
            }
            return searchResult;
        });

        // Sort based on ranking & basic alphabetical order
        QuickOpen.basicMatchSort(filteredList);

        return filteredList;
    }

    function PHPSymbolsProvider(client) {
        this.client = client;
    }

    PHPSymbolsProvider.prototype.search = function (query, matcher) {
        var queryText = query.slice(1);
        if (query.startsWith("~")) {
            return this.getDocumentSymbols(queryText, matcher);
        } else if (query.startsWith("#")) {
            return this.getWorkspaceSymbols(queryText, matcher);
        }
    };

    PHPSymbolsProvider.prototype.getDocumentSymbols = function (query, matcher) {
        var editor = EditorManager.getActiveEditor(),
            docPath = editor.document.file._path,
            retval = $.Deferred();

        this.client.requestSymbolsForDocument({
            filePath: docPath
        }).done(function (results) {
            console.log("Document Symbols:", results);
            var resultList = transFormToSymbolList(query, matcher, results, true);
            retval.resolve(resultList);
        });

        return retval;
    };

    PHPSymbolsProvider.prototype.getWorkspaceSymbols = function (query, matcher) {
        var retval = $.Deferred();

        this.client.requestSymbolsForWorkspace({
            query: query
        }).done(function (results) {
            console.log("Workspace Symbols:", results);
            var resultList = transFormToSymbolList(query, matcher, results);
            retval.resolve(resultList);
        });

        return retval;
    };

    PHPSymbolsProvider.prototype.match = function (query) {
        return (query.startsWith("~") || query.startsWith("#"));
    };

    PHPSymbolsProvider.prototype.itemFocus = function (selectedItem, query, explicit) {
        if (!selectedItem || (query.length < 2 && !explicit)) {
            return;
        }

        if (selectedItem.symbolInfo.isDocumentSymbolRequest) {
            var range = selectedItem.symbolInfo.selectionRange;
            EditorManager.getCurrentFullEditor().setSelection(range.from, range.to, true);
        }
    };

    PHPSymbolsProvider.prototype.itemSelect = function (selectedItem, query) {
        if (selectedItem.symbolInfo.isDocumentSymbolRequest) {
            this.itemFocus(selectedItem, query, true);
        } else {
            var fullPath = selectedItem.symbolInfo.fullPath,
                range = selectedItem.symbolInfo.selectionRange;

            if (fullPath) {
                CommandManager.execute(Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN, {
                    fullPath: fullPath
                })
                    .done(function () {
                        if (range.from) {
                            var editor = EditorManager.getCurrentFullEditor();
                            editor.setCursorPos(range.from.line, range.from.ch, true);
                        }
                    });
            }
        }
    };

    PHPSymbolsProvider.prototype.resultsFormatter = function (item, query) {
        var displayName = QuickOpen.highlightMatch(item);
        query = query.slice(1);

        if (item.symbolInfo.isDocumentSymbolRequest) {
            if (item.symbolInfo.scope) {
                return "<li>" + displayName + " (" + item.symbolInfo.type + ")" + "<br /><span class='quick-open-path'>" + item.symbolInfo.scope + "</span></li>";
            }
            return "<li>" + displayName + " (" + item.symbolInfo.type + ")" + "</li>";
        }

        if (item.symbolInfo.scope) {
            return "<li>" + displayName + " (" + item.symbolInfo.type + ")" + "<br /><span class='quick-open-path'>" + item.symbolInfo.scope + "</span><br /><br /><span class='quick-open-path'>" + item.symbolInfo.fullPath + "</span></li>";
        }
        return "<li>" + displayName + " (" + item.symbolInfo.type + ")" + "<br /><br /><span class='quick-open-path'>" + item.symbolInfo.fullPath + "</span></li>";
    };

    exports.SymbolsProvider = PHPSymbolsProvider;
});
