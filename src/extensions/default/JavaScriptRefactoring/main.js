/*
 * Copyright (c) 2013 - present Adobe Systems Incorporated. All rights reserved.
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


    var AppInit              = brackets.getModule("utils/AppInit"),
        PreferencesManager   = brackets.getModule("preferences/PreferencesManager"),
        Strings              = brackets.getModule("strings"),
        RenameIdentifier     = require("RenameIdentifier"),
        ExtractToVariable    = require("ExtractToVariable"),
        ExtractToFunction    = require("ExtractToFunction"),
        WrapSelection        = require("WrapSelection"),
        CommandManager       = brackets.getModule("command/CommandManager"),
        Menus                = brackets.getModule("command/Menus"),
        KeyBindingManager    = brackets.getModule("command/KeyBindingManager");

    var jsRefactoringEnabled     = true;

    var KeyboardPrefs = JSON.parse(require("text!keyboard.json"));

    // Command ids
    var EXTRACTTO_VARIABLE       = "refactoring.extractToVariable",
        EXTRACTTO_FUNCTION       = "refactoring.extractToFunction",
        REFACTOR_RENAME          = "refactoring.renamereference",
        REFACTORWRAPINTRYCATCH   = "refactoring.wrapintrycatch",
        REFACTORWRAPINCONDITION  = "refactoring.wrapincondition",
        REFACTORCONVERTTOARROWFN = "refactoring.converttoarrowfunction",
        REFACTORCREATEGETSET     = "refactoring.creategettersandsetters";

    // This preference controls whether to create a session and process all JS files or not.
    PreferencesManager.definePreference("refactoring.JSRefactoring", "boolean", true, {
        description: Strings.DESCRIPTION_CODE_REFACTORING
    });


    /**
     * Check whether any of refactoring hints preferences for JS Refactoring is disabled
     * @return {boolean} enabled/disabled
     */
    function _isRefactoringEnabled() {
        return (PreferencesManager.get("refactoring.JSRefactoring") !== false);
    }

    PreferencesManager.on("change", "refactoring.JSRefactoring", function () {
        jsRefactoringEnabled = _isRefactoringEnabled();
    });

    AppInit.appReady(function () {

        if (jsRefactoringEnabled) {
            var subMenu = Menus.getContextMenu(Menus.ContextMenuIds.EDITOR_MENU).addSubMenu("Refactor", "test");

            var menuLocation = Menus.AppMenuBar.EDIT_MENU;

            Menus.getMenu(menuLocation).addMenuDivider();

            // Rename Identifier
            CommandManager.register(Strings.CMD_REFACTORING_RENAME, REFACTOR_RENAME, RenameIdentifier.handleRename);
            KeyBindingManager.addBinding(REFACTOR_RENAME, KeyboardPrefs.renameIdentifier);
            subMenu.addMenuItem(REFACTOR_RENAME);
            Menus.getMenu(menuLocation).addMenuItem(REFACTOR_RENAME, KeyboardPrefs.renameIdentifier);

            // Extract to Variable
            CommandManager.register(Strings.CMD_EXTRACTTO_VARIABLE, EXTRACTTO_VARIABLE, ExtractToVariable.handleExtractToVariable);
            KeyBindingManager.addBinding(EXTRACTTO_VARIABLE, KeyboardPrefs.extractToVariable);
            subMenu.addMenuItem(EXTRACTTO_VARIABLE);
            Menus.getMenu(menuLocation).addMenuItem(EXTRACTTO_VARIABLE, KeyboardPrefs.extractToVariable);

            // Extract to Function
            CommandManager.register(Strings.CMD_EXTRACTTO_FUNCTION, EXTRACTTO_FUNCTION, ExtractToFunction.handleExtractToFunction);
            KeyBindingManager.addBinding(EXTRACTTO_FUNCTION, KeyboardPrefs.extractToFunction);
            subMenu.addMenuItem(EXTRACTTO_FUNCTION);
            Menus.getMenu(menuLocation).addMenuItem(EXTRACTTO_FUNCTION, KeyboardPrefs.extractToFunction);

            // Wrap Selection
            CommandManager.register(Strings.CMD_REFACTORING_TRY_CATCH, REFACTORWRAPINTRYCATCH, WrapSelection.wrapInTryCatch);
            subMenu.addMenuItem(REFACTORWRAPINTRYCATCH);
            Menus.getMenu(menuLocation).addMenuItem(REFACTORWRAPINTRYCATCH);

            CommandManager.register(Strings.CMD_REFACTORING_CONDITION, REFACTORWRAPINCONDITION, WrapSelection.wrapInCondition);
            subMenu.addMenuItem(REFACTORWRAPINCONDITION);
            Menus.getMenu(menuLocation).addMenuItem(REFACTORWRAPINCONDITION);

            CommandManager.register(Strings.CMD_REFACTORING_ARROW_FUNCTION, REFACTORCONVERTTOARROWFN, WrapSelection.convertToArrowFunction);
            subMenu.addMenuItem(REFACTORCONVERTTOARROWFN);
            Menus.getMenu(menuLocation).addMenuItem(REFACTORCONVERTTOARROWFN);

            CommandManager.register(Strings.CMD_REFACTORING_GETTERS_SETTERS, REFACTORCREATEGETSET, WrapSelection.createGettersAndSetters);
            subMenu.addMenuItem(REFACTORCREATEGETSET);
            Menus.getMenu(menuLocation).addMenuItem(REFACTORCREATEGETSET);
        }
    });
});
