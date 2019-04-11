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
        StringMatch = brackets.getModule("utils/StringMatch"),
        StringUtils = brackets.getModule("utils/StringUtils"),
        CommandManager = brackets.getModule("command/CommandManager"),
        PathConverters = brackets.getModule("languageTools/PathConverters");


    function match(query) {
        return (query[0] === "~") || (query[0] === "#");
    }

    function itemFocus(selectedItem, query, explicit) {
        if (!selectedItem || (query.length < 2 && !explicit)) {
            return;
        }
        if (selectedItem.fileLocation.docSymbol) {
            var fileLocation = selectedItem.fileLocation;

            var from = {
                line: fileLocation.lineFrom,
                ch: fileLocation.chFrom
            };
            var to = {
                line: fileLocation.lineTo,
                ch: fileLocation.chTo
            };
            EditorManager.getCurrentFullEditor().setSelection(from, to, true);
        }
    }

    function itemSelect(selectedItem, query) {
        if (selectedItem.fileLocation.docSymbol) {
            itemFocus(selectedItem, query, true);
        } else {
            var fullPath = selectedItem.fileLocation && selectedItem.fileLocation.fullPath;
            var from = {
                line: selectedItem.fileLocation.lineFrom,
                ch: selectedItem.fileLocation.chFrom
            };
            if (fullPath) {
                CommandManager.execute(Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN, {
                        fullPath: fullPath
                    })
                    .done(function () {
                        if (from) {
                            var editor = EditorManager.getCurrentFullEditor();
                            editor.setCursorPos(from.line, from.ch, true);
                        }
                    });
            }
        }
    }

    var SymbolKind = {
        "1": "File",
        "2": "Module",
        "3": "Namespace",
        "4": "Package",
        "5": "Class",
        "6": "Method",
        "7": "Property",
        "8": "Field",
        "9": "Constructor",
        "10": "Enum",
        "11": "Interface",
        "12": "Function",
        "13": "Variable",
        "14": "Constant",
        "15": "String",
        "16": "Number",
        "17": "Boolean",
        "18": "Array",
        "19": "Object",
        "20": "Key",
        "21": "Null",
        "22": "EnumMember",
        "23": "Struct",
        "24": "Event",
        "25": "Operator",
        "26": "TypeParameter"
    };

    function highlightMatch(item, matchClass, rangeFilter) {
        var label = item.label || item;
        matchClass = matchClass || "quicksearch-namematch";

        var stringRanges = item.stringRanges;
        if (!stringRanges) {
            // If result didn't come from stringMatch(), highlight nothing
            stringRanges = [{
                text: label,
                matched: false,
                includesLastSegment: true
            }];
        }

        var displayName = "";
        if (item.scoreDebug) {
            var sd = item.scoreDebug;
            displayName += '<span title="sp:' + sd.special + ', m:' + sd.match +
                ', ls:' + sd.lastSegment + ', b:' + sd.beginning +
                ', ld:' + sd.lengthDeduction + ', c:' + sd.consecutive + ', nsos: ' +
                sd.notStartingOnSpecial + ', upper: ' + sd.upper + '">(' + item.matchGoodness + ') </span>';
        }

        // Put the path pieces together, highlighting the matched parts
        stringRanges.forEach(function (range) {
            if (range.matched) {
                displayName += "<span class='" + matchClass + "'>";
            }

            var rangeText = rangeFilter ? rangeFilter(range.includesLastSegment, range.text) : range.text;
            displayName += StringUtils.breakableUrl(rangeText);

            if (range.matched) {
                displayName += "</span>";
            }
        });
        return displayName;
    }

    function _resultsFormatter(item, query) {
        if (item.fileLocation.docSymbol) {
            query = query.slice(query.indexOf("~") + 1, query.length);
            var displayName = highlightMatch(item);
            if (item.fileLocation.containerName) {
                return "<li>" + displayName + " (" + item.fileLocation.type + ")" + "<br /><span class='quick-open-path'>" + item.fileLocation.containerName + "</span></li>";
            }
            return "<li>" + displayName + " (" + item.fileLocation.type + ")" + "</li>";
        }
        query = query.slice(query.indexOf("#") + 1, query.length);
        var displayName = highlightMatch(item);
        if (item.fileLocation.containerName) {
            return "<li>" + displayName + " (" + item.fileLocation.type + ")" + "<br /><span class='quick-open-path'>" + item.fileLocation.containerName + "</span><br /><br /><span class='quick-open-path'>" + item.fileLocation.fullPath + "</span></li>";
        }
        return "<li>" + displayName + " (" + item.fileLocation.type + ")" + "<br /><br /><span class='quick-open-path'>" + item.fileLocation.fullPath + "</span></li>";
    }

    /**
     * FileLocation class
     * @constructor
     * @param {string} fullPath
     * @param {number} line
     * @param {number} chFrom column start position
     * @param {number} chTo column end position
     * @param {string} id
     */
    function FileLocation(fullPath, line, chFrom, chTo, id, lineFrom, lineTo, docSymbol, containerName, type) {
        this.fullPath = fullPath;
        this.line = line;
        this.lineFrom = lineFrom;
        this.lineTo = lineTo;
        this.chFrom = chFrom;
        this.docSymbol = docSymbol;
        this.containerName = containerName;
        this.type = type;
        this.chTo = chTo;
        this.id = id;
    }

    /**
     * Returns a list of information about ID's for a single document. This array is populated
     * by createIDList()
     * @type {?Array.<FileLocation>}
     */
    function createList(list, isDocumentSymbol) {
        var doc = DocumentManager.getCurrentDocument();
        if (!doc) { //Add guard for current document and results
            return;
        }

        var newlist = [];
        for (var i = 0; i < list.length; i++) {
            var symbolInfo = list[i],
                symbolName = symbolInfo.name,
                symbolType = SymbolKind[symbolInfo.kind.toString()],
                symbolFile = isDocumentSymbol ? null : PathConverters.uriToPath(symbolInfo.location.uri),
                symbolLine, symbolTo, symbolFrom;

            var rangeInSameLine = (symbolInfo.location.range.start.line === symbolInfo.location.range.end.line);
            symbolLine = symbolInfo.location.range.start.line;
            if (rangeInSameLine) {
                symbolFrom = symbolInfo.location.range.start.character;
                symbolTo = symbolInfo.location.range.end.character;
            } else {
                symbolFrom = symbolTo = symbolInfo.location.range.start.character;
            }

            var lineFrom = symbolInfo.location.range.start.line,
                lineTo = symbolInfo.location.range.end.line;

            newlist.push(new FileLocation(symbolFile, symbolLine, symbolFrom, symbolTo, symbolName, lineFrom, lineTo, isDocumentSymbol, symbolInfo.containerName, symbolType));
        }
        return newlist;
    }



    function PHPSymbolsProvider(client) {
        this.client = client;
        this._registerSymbolsProvider();
    }

    PHPSymbolsProvider.prototype._registerSymbolsProvider = function () {
        var self = this;
        QuickOpen.addQuickOpenPlugin({
            name: "PHP Symbols",
            languageIds: ["php"],
            search: self.search.bind(self),
            match: match,
            itemFocus: itemFocus,
            itemSelect: itemSelect,
            resultsFormatter: _resultsFormatter
        });
    };

    PHPSymbolsProvider.prototype.search = function (query, matcher) {
        var queryText = "";
        if (query.startsWith("~")) {
            queryText = query.slice(query.indexOf("~") + 1, query.length);
            return this.getDocumentSymbols(queryText, matcher);
        } else if (query.startsWith("#")) {
            queryText = query.slice(query.indexOf("#") + 1, query.length);
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

            var list = createList(results, true);

            // Filter and rank how good each match is
            var filteredList = $.map(list, function (fileLocation) {
                var searchResult = matcher.match(fileLocation.id, query);
                if (searchResult) {
                    searchResult.fileLocation = fileLocation;
                }
                return searchResult;
            });

            // Sort based on ranking & basic alphabetical order
            StringMatch.basicMatchSort(filteredList);

            retval.resolve(filteredList);
        });

        return retval;
    };

    PHPSymbolsProvider.prototype.getWorkspaceSymbols = function (query, matcher) {
        var retval = $.Deferred();

        this.client.requestSymbolsForWorkspace({
            query: query
        }).done(function (results) {
            console.log("Workspace Symbols:", results);

            var list = createList(results);

            // Filter and rank how good each match is
            var filteredList = $.map(list, function (fileLocation) {
                var searchResult = matcher.match(fileLocation.id, query);
                if (searchResult) {
                    searchResult.fileLocation = fileLocation;
                }
                return searchResult;
            });

            // Sort based on ranking & basic alphabetical order
            StringMatch.basicMatchSort(filteredList);

            retval.resolve(filteredList);
        });

        return retval;
    };

    exports.PHPSymbolsProvider = PHPSymbolsProvider;
});
