/*
 * Copyright (c) 2012 - present Adobe Systems Incorporated. All rights reserved.
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

/*
 * __CodeRefactoringManager Overview:__
 *
 * The CodeRefactoringManager mediates the interaction between the editor and a
 * collection of refactoring providers. If user opens context menus 
 * then the providers registered for the current language are queried
 * for their ability to provide refactoring handlers in order of descending priority by
 * way their hasHanlders methods.
 * Hanlders means all availble methods of refactoring in that provider, For example
 * Rename, Extract, Change Signature etc.
 *
 * Once a provider responds affirmatively to a request for handlers, the
 * manager will add a context menu called Refactor and submenus for all 
 * available handlers by way of its getHandlers method.
 *
 * Provider is reponsible for performing refactor
 * 
 *
 * __CodeRefactoringManager Overview:__
 *
 * A code Refactoring provider should implement the following two functions:
 *
 * - `CodeRefactoringManager.hasHandlers()`
 * - `CodeRefactoringManager.getHandlers()`
 *
 * The behavior of these two functions is described in detail below.
 *
 * __CodeRefactoringManager.hasHandlers()__
 *
 * This method is just to check weather provider has handlers or not.
 * Provider can keep all conditions under this function based on that
 * It will return true or false. We will abort if this is false.
 *
 * __CodeRefactoringManager.getHandlers()__
 *
 * The method by which a provider provides all handlers name for current context
 *
 * Either null or array of objects with name, ID and handler
 *
 *     return [
 *          {
 *              name: string,
 *              id: commandId,
 *              handler: function
 *          }
 *    ]
 * For all commandId's this will add menus under Context menu "Refactor"
 * On clicking menu, handler is responsible for performing any operation
 */

define(function (require, exports, module) {
    "use strict";

    // Load dependent modules
    var AppInit             = require("utils/AppInit"),
        Commands            = require("command/Commands"),
        CommandManager      = require("command/CommandManager"),
        EditorManager       = require("editor/EditorManager"),
        Menus               = require("command/Menus");

    var refactoringProviders    = { "all": [] },
        refactoringProvider = null,
        RefactorContextMenu = "Refactor",
        editorCmenu = null,
        submenu;

    /**
     * Comparator to sort providers from high to low priority
     */
    function _providerSort(a, b) {
        return b.priority - a.priority;
    }

    /**
     * The method by which a CodeRefactoringProvider registers its willingness to
     * help in code refactoring for editors in a given language.
     *
     * @param {!providerInfo} provider
     * The refactoring provider to be registered, described below.
     *
     * @param {!Array.<string>} languageIds
     * The set of language ids for which the provider is capable of
     * doing code refactor. If the special language id name "all" is included then
     * the provider may be called for any language.
     *
     * @param {?number} priority
     * Used to break ties among refactoring providers for a particular language.
     * Providers with a higher number will be asked to refactor code before those
     * with a lower priority value. Defaults to zero.
     */
    function registerRefactoringProvider(providerInfo, languageIds, priority) {
        var providerObj = { provider: providerInfo,
            priority: priority || 0 };

        if (languageIds.indexOf("all") !== -1) {
            // Ignore anything else in languageIds and just register for every language. This includes
            // the special "all" language since its key is in the refactoringProviders map from the beginning.
            var languageId;
            for (languageId in refactoringProviders) {
                if (refactoringProviders.hasOwnProperty(languageId)) {
                    refactoringProviders[languageId].push(providerObj);
                    refactoringProviders[languageId].sort(_providerSort);
                }
            }
        } else {
            languageIds.forEach(function (languageId) {
                if (!refactoringProviders[languageId]) {
                    // Initialize provider list with any existing all-language providers
                    refactoringProviders[languageId] = Array.prototype.concat(refactoringProviders.all);
                }
                refactoringProviders[languageId].push(providerObj);
                refactoringProviders[languageId].sort(_providerSort);
            });
        }
    }

    /**
     *  Return the array of refactoring providers for the given language id.
     *  This gets called on context menu open.
     *
     * @param {!string} languageId
     * @return {?Array.<{provider: Object, priority: number}>}
     */
    function _getProvidersForLanguageId(languageId) {
        var providers = refactoringProviders[languageId] || refactoringProviders.all;

        //@TODO - Exclude providers that are explicitly disabled in the preferences.
        return providers;
    }

    /**
    * This function is responsible for registering command and adding menus for available handlers
    * Remove submenu in case of no handler found
    */
    function _updateHandlers() {
        var response = refactoringProvider.getHandlers();
        if (!response) {
            editorCmenu.removeSubMenu(Commands.CODE_REFACTOR);
        } else {
            response.forEach(function(element) {
                var commandObj = CommandManager.get(element.id);
                if (!commandObj) {
                    CommandManager.register(element.name, element.id, element.handler);
                }

                //Adding Context submenu under Refactor
                submenu.addMenuItem(element.id);
            });
        }
    }

    /**
     * Find a suitable provider for a language id and
     * Add a context menu if there is any provider available
     */
    function getHandlersForLanguageId() {

        var editor   = EditorManager.getActiveEditor();

        // Don't look for refactoring handlers if we have a multiple selection.
        if (editor.getSelections().length > 1) {
            return;
        }

        // Find a suitable provider, if any
        var language = editor.getLanguageForSelection(),
            enabledProviders = _getProvidersForLanguageId(language.getId());

        enabledProviders.some(function (item, index) {
            if (item.provider.hasHandlers(editor)) {
                refactoringProvider = item.provider;
                return true;
            }
        });

        // If a provider is found, add context menu called "Refactor
        if (refactoringProvider) {
            submenu = Menus.getContextMenu(Commands.CODE_REFACTOR);
            if (!submenu) {
                submenu = editorCmenu.addSubMenu(RefactorContextMenu, Commands.CODE_REFACTOR);
            }

            // When mouse enters in Refactor menu then ask provider for handlers
            submenu.on("beforeSubMenuOpen", function () {
                _updateHandlers();
            });
        } else {
            submenu = Menus.getContextMenu(Commands.CODE_REFACTOR);
            if (submenu) {
                editorCmenu.removeSubMenu(Commands.CODE_REFACTOR);
            }
        }
    }
    AppInit.htmlReady(function () {

        editorCmenu = Menus.getContextMenu(Menus.ContextMenuIds.EDITOR_MENU);

        // Check for handlers on right click
        editorCmenu.on("beforeContextMenuOpen", function (e) {
            getHandlersForLanguageId();
        });

    });


    // Define public API
    exports.registerRefactoringProvider    = registerRefactoringProvider;
});
