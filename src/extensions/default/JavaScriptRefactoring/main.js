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
        HealthLogger         = brackets.getModule("utils/HealthLogger"),
        _                    = brackets.getModule("thirdparty/lodash");

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

    function _handleRefactor(functionName) {
        var eventName,
            eventType = "";
        switch(functionName) {
        case REFACTOR_RENAME:
            eventName = REFACTOR_RENAME;
            eventType = "rename";
            RenameIdentifier.handleRename();
            break;
        case EXTRACTTO_VARIABLE:
            eventName = EXTRACTTO_VARIABLE;
            eventType = "extractToVariable";
            ExtractToVariable.handleExtractToVariable();
            break;
        case EXTRACTTO_FUNCTION:
            eventName = EXTRACTTO_FUNCTION;
            eventType = "extractToFunction";
            ExtractToFunction.handleExtractToFunction();
            break;
        case REFACTORWRAPINTRYCATCH:
            eventName = REFACTORWRAPINTRYCATCH;
            eventType = "tryCatch";
            WrapSelection.wrapInTryCatch();
            break;
        case REFACTORWRAPINCONDITION:
            eventName = REFACTORWRAPINCONDITION;
            eventType = "wrapInCondition";
            WrapSelection.wrapInCondition();
            break;
        case REFACTORCONVERTTOARROWFN:
            eventName = REFACTORCONVERTTOARROWFN;
            eventType = "convertToFunction";
            WrapSelection.convertToArrowFunction();
            break;
        case REFACTORCREATEGETSET:
            eventName = REFACTORCREATEGETSET;
            eventType = "createGetterSetter";
            WrapSelection.createGettersAndSetters();
            break;
        }
        if (eventName) {
            // Send analytics data for refactoring
            HealthLogger.sendAnalyticsData(
                eventName,
                "usage",
                "jsRefactor",
                eventType,
                ""
            );
        }
    }

    AppInit.appReady(function () {

        if (jsRefactoringEnabled) {
            var subMenu = Menus.getContextMenu(Menus.ContextMenuIds.EDITOR_MENU).addSubMenu(Strings.CMD_REFACTOR, "refactor-submenu");

            var menuLocation = Menus.AppMenuBar.EDIT_MENU;

            Menus.getMenu(menuLocation).addMenuDivider();

            // Rename Identifier
            CommandManager.register(Strings.CMD_REFACTORING_RENAME, REFACTOR_RENAME, _.partial(_handleRefactor, REFACTOR_RENAME));
            subMenu.addMenuItem(REFACTOR_RENAME);
            Menus.getMenu(menuLocation).addMenuItem(REFACTOR_RENAME, KeyboardPrefs.renameIdentifier);

            // Extract to Variable
            CommandManager.register(Strings.CMD_EXTRACTTO_VARIABLE, EXTRACTTO_VARIABLE, _.partial(_handleRefactor, EXTRACTTO_VARIABLE));
            subMenu.addMenuItem(EXTRACTTO_VARIABLE);
            Menus.getMenu(menuLocation).addMenuItem(EXTRACTTO_VARIABLE, KeyboardPrefs.extractToVariable);

            // Extract to Function
            CommandManager.register(Strings.CMD_EXTRACTTO_FUNCTION, EXTRACTTO_FUNCTION, _.partial(_handleRefactor, EXTRACTTO_FUNCTION));
            subMenu.addMenuItem(EXTRACTTO_FUNCTION);
            Menus.getMenu(menuLocation).addMenuItem(EXTRACTTO_FUNCTION, KeyboardPrefs.extractToFunction);

            // Wrap Selection
            CommandManager.register(Strings.CMD_REFACTORING_TRY_CATCH, REFACTORWRAPINTRYCATCH, _.partial(_handleRefactor, REFACTORWRAPINTRYCATCH));
            subMenu.addMenuItem(REFACTORWRAPINTRYCATCH);
            Menus.getMenu(menuLocation).addMenuItem(REFACTORWRAPINTRYCATCH);

            CommandManager.register(Strings.CMD_REFACTORING_CONDITION, REFACTORWRAPINCONDITION, _.partial(_handleRefactor, REFACTORWRAPINCONDITION));
            subMenu.addMenuItem(REFACTORWRAPINCONDITION);
            Menus.getMenu(menuLocation).addMenuItem(REFACTORWRAPINCONDITION);

            CommandManager.register(Strings.CMD_REFACTORING_ARROW_FUNCTION, REFACTORCONVERTTOARROWFN, _.partial(_handleRefactor, REFACTORCONVERTTOARROWFN));
            subMenu.addMenuItem(REFACTORCONVERTTOARROWFN);
            Menus.getMenu(menuLocation).addMenuItem(REFACTORCONVERTTOARROWFN);

            CommandManager.register(Strings.CMD_REFACTORING_GETTERS_SETTERS, REFACTORCREATEGETSET, _.partial(_handleRefactor, REFACTORCREATEGETSET));
            subMenu.addMenuItem(REFACTORCREATEGETSET);
            Menus.getMenu(menuLocation).addMenuItem(REFACTORCREATEGETSET);
        }
    });
});
