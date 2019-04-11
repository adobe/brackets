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

define(function (require, exports, module) {
    "use strict";

    var AppInit                     = require("utils/AppInit"),
        CommandManager              = require("command/CommandManager"),
        EditorManager               = require("editor/EditorManager"),
        Menus                       = require("command/Menus"),
        ProviderRegistrationHandler = require("features/PriorityBasedRegistration").RegistrationHandler,
        SearchResultsView           = require("search/SearchResultsView").SearchResultsView,
        SearchModel                 = require("search/SearchModel").SearchModel,
        Strings                     = require("strings");

    var _providerRegistrationHandler = new ProviderRegistrationHandler(),
        registerFindReferencesProvider = _providerRegistrationHandler.registerProvider.bind(
            _providerRegistrationHandler
        ),
        removeFindReferencesProvider = _providerRegistrationHandler.removeProvider.bind(_providerRegistrationHandler);

    var SHOW_FIND_REFERENCES_CMD_ID   = "showReferences",
        KeyboardPrefs = JSON.parse(require("text!features/keyboard.json"));

    var searchModel = new SearchModel(),
        _resultsView;

    function _getReferences(provider, hostEditor, pos) {
        var result = new $.Deferred();

        if(!provider) {
            return result.reject();
        }

        provider.getReferences(hostEditor, pos)
            .done(function (rcvdObj) {

                searchModel.results = rcvdObj.results;
                searchModel.numFiles = rcvdObj.numFiles;
                searchModel.numMatches = rcvdObj.numMatches;
                searchModel.allResultsAvailable = true;
                searchModel.setQueryInfo({query: rcvdObj.queryInfo, caseSensitive: true, isRegExp: false});
                result.resolve();
            }).fail(function (){
                result.reject();
            });
        return result.promise();

    }

    function _openReferencesPanel() {
        var editor = EditorManager.getActiveEditor(),
            pos = editor ? editor.getCursorPos() : null,
            referencesPromise,
            result = new $.Deferred(),
            errorMsg = Strings.REFERENCES_NO_RESULTS,
            referencesProvider;

        var language = editor.getLanguageForSelection(),
            enabledProviders = _providerRegistrationHandler.getProvidersForLanguageId(language.getId());

        enabledProviders.some(function (item, index) {
            if (item.provider.hasReferences(editor)) {
                referencesProvider = item.provider;
                return true;
            }
        });

        referencesPromise = _getReferences(referencesProvider, editor, pos);

        // If one of them will provide a widget, show it inline once ready
        if (referencesPromise) {
            referencesPromise.done(function () {
                _resultsView.open();
            }).fail(function () {
                _resultsView.close();
                editor.displayErrorMessageAtCursor(errorMsg);
                result.reject();
            });
        } else {
            _resultsView.close();
            editor.displayErrorMessageAtCursor(errorMsg);
            result.reject();
        }

        return result.promise();
    }

    /**
     * @private
     * Clears any previous search information, removing update listeners and clearing the model.
     */
    function _clearSearch() {
        searchModel.clear();
    }

    AppInit.appReady(function () {
        _resultsView = new SearchResultsView(
            searchModel,
            "reference-in-files-results",
            "reference-in-files.results",
            "reference"
        );
        _resultsView
            .on("close", function () {
                _clearSearch();
            })
            .on("getNextPage", function () {
                if (searchModel.hasResults()) {
                    _resultsView.showNextPage();
                }
            })
            .on("getLastPage", function () {
                if (searchModel.hasResults()) {
                    _resultsView.showLastPage();
                }
            });

        CommandManager.register(Strings.FIND_ALL_REFERENCES, SHOW_FIND_REFERENCES_CMD_ID, _openReferencesPanel);
        Menus.getContextMenu(Menus.ContextMenuIds.EDITOR_MENU).addMenuItem(
            SHOW_FIND_REFERENCES_CMD_ID,
            KeyboardPrefs.findAllReferences
        );
    });

    exports.registerFindReferencesProvider    = registerFindReferencesProvider;
    exports.removeFindReferencesProvider      = removeFindReferencesProvider;
});
