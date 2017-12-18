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
        WrapSelection        = require("WrapSelection");

    var jsRefactoringEnabled     = true;


    // This preference controls whether to create a session and process all JS files or not.
    PreferencesManager.definePreference("refactoring.JSRefactoring", "boolean", true, {
        description: Strings.DESCRIPTION_CODE_REFACTORIG
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


        //TODO- Add submenus instead of context menu
        if (jsRefactoringEnabled) {
            RenameIdentifier.addCommands();
            WrapSelection.addCommands();
        }
    });
});
