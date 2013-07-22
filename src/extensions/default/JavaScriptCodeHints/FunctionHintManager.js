/*
 * Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
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

/*jslint undef: true, vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true */
/*global define, brackets, $ */

define(function (require, exports, module) {
    "use strict";

    var Commands        = brackets.getModule("command/Commands"),
        CommandManager  = brackets.getModule("command/CommandManager"),
        KeyEvent        = brackets.getModule("utils/KeyEvent"),
        Menus           = brackets.getModule("command/Menus"),
        Strings         = brackets.getModule("strings"),
        StringUtils     = brackets.getModule("utils/StringUtils"),
        ScopeManager    = require("ScopeManager"),
        Session         = require("Session");


    /** @const {string} Show Function Hint command ID */
    var SHOW_FUNCTION_HINT_CMD_ID    = "showFunctionHint", // string must MATCH string in native code (brackets_extensions)
        PUSH_EXISTING_HINT           = true,
        OVERWRITE_EXISTING_HINT      = false,
        PRESERVE_FUNCTION_STACK      = true,
        functionHintContainerHTML    = require("text!FunctionHintTemplate.html"),
        KeyboardPrefs                = JSON.parse(require("text!keyboard.json"));

    var $functionHintContainer,    // function hint container
        $functionHintContent,      // function hint content holder

        /** @type {{inFunctionCall: boolean, functionCallPos: {line: number, ch: number},
        *           fnType: {string}}
        */
        functionHintState = {},
        functionHintStack = [],    // stack for previous function hint to restore
        preserveFunctionHintStack, // close a function hint without clearing stack
        session;                   // current editor session, updated by main

    // Constants
    var
        POSITION_OFFSET             = 38,   // Distance between the bottom of the line and the bottom of the preview container
        POINTER_LEFT_OFFSET         = 17,   // Half of the pointer width, used to find the center of the pointer
        POINTER_TOP_OFFSET          = 4,    // Size of margin + border of hint.
        POSITION_BELOW_OFFSET       = 16,   // Amount to adjust to top position when the preview bubble is below the text
        POPOVER_HORZ_MARGIN         =  5;   // Horizontal margin


    /**
     * Update the current session for use by the Function Hint Manager.
     *
     * @param {Session} value - current session.
     */
    function setSession(value) {
        session = value;
    }

    /**
     * Test if a function hint is being displayed.
     *
     * @returns {boolean} - true if a function hint is being displayed, false
     * otherwise.
     */
    function isFunctionHintDisplayed() {
        return functionHintState.visible === true;
    }

    /**
     * Position a function hint.
     *
     * @param {number} xpos
     * @param {number} ypos
     * @param {number} ybot
     */
    function positionFunctionHint(xpos, ypos, ybot) {
        var hintWidth  = $functionHintContainer.width(),
            hintHeight = $functionHintContainer.height(),
            top           = ypos - hintHeight - POINTER_TOP_OFFSET,
            left          = xpos,
            $editorHolder = $("#editor-holder"),
            editorLeft    = $editorHolder.offset().left;

        left = Math.max(left, editorLeft);
        left = Math.min(left, editorLeft + $editorHolder.width() - hintWidth);

        if (top < 0) {
            $functionHintContainer.removeClass("preview-bubble-above");
            $functionHintContainer.addClass("preview-bubble-below");
            top = ybot + POSITION_BELOW_OFFSET;
            $functionHintContainer.offset({
                left: left,
                top: top
            });
        } else {
            $functionHintContainer.removeClass("preview-bubble-below");
            $functionHintContainer.addClass("preview-bubble-above");
            $functionHintContainer.offset({
                left: left,
                top: top - POINTER_TOP_OFFSET
            });
        }
    }

    /**
     *  Bold the parameter at the caret.
     *
     *  @param {{inFunctionCall: boolean, functionCallPos: {{line: number, ch: number}}}
     *  functionInfo - tells if the caret is in a function call and the position
      * of the function call.
     */
    function formatFunctionHint(functionInfo) {
        var hints = session.getFunctionHint(functionInfo.functionCallPos);

        $functionHintContent.empty();
        $functionHintContent.addClass("brackets-js-hints");
        hints.parameters.forEach(function (value, i) {
            var param = value.type + " " + value.name,
                separator = "";

            if (value.isOptional) {
                if (i > 0) {
                    separator += " ";
                }

                separator += "[";
            }

            if (i > 0) {
                separator += ", ";
            }

            if (separator) {
                $functionHintContent.append(separator);
            }

            if (hints.currentIndex === i) {
                $functionHintContent.append($("<span>")
                    .append(StringUtils.htmlEscape(param))
                    .addClass("current-parameter"));
            } else {
                $functionHintContent.append(StringUtils.htmlEscape(param));
            }

            if (value.isOptional) {
                $functionHintContent.append("]");
            }
        });

        if (hints.parameters.length === 0) {
            $functionHintContent.append(StringUtils.htmlEscape(Strings.NO_ARGUMENTS));
        }
    }

    /**
     * Save the state of the current hint. Called when popping up a parameter hint
     * for a parameter, when the parameter already part of an existing parameter
     * hint.
     */
    function pushFunctionHintOnStack() {
        functionHintStack.push(functionHintState);
    }

    /**
     * Restore the state of the previous function hint.
     *
     * @returns {boolean} - true the a parameter hint has been pushed, false otherwise.
     */
    function popFunctionHintFromStack() {
        if (functionHintStack.length > 0) {
            functionHintState = functionHintStack.pop();
            functionHintState.visible = false;
            return true;
        }

        return false;
    }

    /**
     * Reset the function hint stack.
     */
    function clearFunctionHintStack() {
        functionHintStack = [];
    }

    /**
     * Test if the function call at the cursor is different from the currently displayed
     * function hint.
     *
     * @param functionCallPos
     * @returns {boolean}
     */
    function hasFunctionCallPosChanged(functionCallPos) {
        var oldFunctionCallPos = functionHintState.functionCallPos;
        return (oldFunctionCallPos === undefined ||
            oldFunctionCallPos.line !== functionCallPos.line ||
            oldFunctionCallPos.ch !== functionCallPos.ch);
    }

    /**
     * Dismiss the function hint.
     *
     */
    function dismissFunctionHint() {

        if (functionHintState.visible) {
            $functionHintContainer.hide();
            $functionHintContent.empty();
            functionHintState = {};
            $(session.editor).off("cursorActivity", handleFunctionHintCursorActivity);

            if (!preserveFunctionHintStack) {
                clearFunctionHintStack();
            }
        }
    }

    /**
     * Pop up a function hint on the line above the caret position.
     *
     * @param {boolean=} pushExistingHint - if true, push the existing hint on the stack. Default is false, not
     * to push the hint.
     * @param {string=} hint - function hint string from tern.
     * @param {{inFunctionCall: boolean, functionCallPos: {{line: number, ch: number}}=} functionInfo -
     *
     */
    function popUpFunctionHint(pushExistingHint, hint, functionInfo) {

        functionInfo = functionInfo || session.getFunctionInfo();
        if (!functionInfo.inFunctionCall) {
            dismissFunctionHint();
            return;
        }

        if (hasFunctionCallPosChanged(functionInfo.functionCallPos)) {

            var pushHint = pushExistingHint && isFunctionHintDisplayed();
            if (pushHint) {
                pushFunctionHintOnStack();
                preserveFunctionHintStack = true;
            }

            dismissFunctionHint();
            preserveFunctionHintStack = false;
        } else if (isFunctionHintDisplayed()) {
            return;
        }

        functionHintState.functionCallPos = functionInfo.functionCallPos;

        var request = null;
        if (!hint) {
            request = ScopeManager.requestFunctionHint(session, functionInfo.functionCallPos);
        } else {
            session.setFnType(hint);
            request = $.Deferred();
            request.resolveWith(null, [hint]);
        }

        request.done(function (fnType) {
            var cm = session.editor._codeMirror;

            var pos = cm.charCoords(functionInfo.functionCallPos);

            formatFunctionHint(functionInfo);

            $functionHintContainer.show();
            positionFunctionHint(pos.left, pos.top, pos.bottom);
            functionHintState.visible = true;
            functionHintState.fnType = fnType;

            $(session.editor).on("cursorActivity", handleFunctionHintCursorActivity);
        });
    }

    /**
     *  Show the parameter the cursor is on in bold when the cursor moves.
     *  Dismiss the pop up when the cursor moves off the function.
     */
    function handleFunctionHintCursorActivity() {
        var functionInfo = session.getFunctionInfo();

        if (functionInfo.inFunctionCall) {
            // If in a different function hint, then dismiss the old one a
            // display the new one if there is one on the stack
            if (hasFunctionCallPosChanged(functionInfo.functionCallPos)) {
                if (popFunctionHintFromStack()) {
                    var poppedFunctionCallPos = functionHintState.functionCallPos,
                        currentFunctionCallPos = functionInfo.functionCallPos;

                    if (poppedFunctionCallPos.line === currentFunctionCallPos.line &&
                            poppedFunctionCallPos.ch === currentFunctionCallPos.ch) {
                        preserveFunctionHintStack = true;
                        popUpFunctionHint(OVERWRITE_EXISTING_HINT,
                            functionHintState.fnType, functionInfo);
                        preserveFunctionHintStack = false;
                        return;
                    }
                } else {
                    dismissFunctionHint();
                }
            }

            formatFunctionHint(functionInfo);
            return;
        }

        dismissFunctionHint();
    }

    /**
     * Enable cursor tracking in the current session.
     *
     * @param {Session} session - session to stop cursor tracking on.
     */
    function startCursorTracking(session) {
        $(session.editor).on("cursorActivity", handleFunctionHintCursorActivity);
    }

    /**
     * Stop cursor tracking in the current session.
     *
     * Use this to move the cursor without changing the function hint state.
     *
     * @param {Session} session - session to stop cursor tracking on.
     */
    function stopCursorTracking(session) {
        $(session.editor).off("cursorActivity", handleFunctionHintCursorActivity);
    }

    /**
     * Show a function hint in its own pop-up.
     *
     * @param commandData
     */
    function handleShowFunctionHint(commandData) {

        // Pop up function hint
        popUpFunctionHint();
    }

    /**
     * Install function hint listeners.
     *
     * @param {Editor} editor - editor context on which to listen for
     *      changes
     */
    function installFunctionHintListeners(editor) {

        $(editor).on("keyEvent", function (jqEvent, editor, event) {
            if (event.type === "keydown" && event.keyCode === KeyEvent.DOM_VK_ESCAPE) {
                dismissFunctionHint();
            }
        }).on("scroll", function () {
            dismissFunctionHint();
        });
    }

    // Create the function hint container
    $functionHintContainer = $(functionHintContainerHTML).appendTo($("body"));
    $functionHintContent = $functionHintContainer.find(".function-hint-content");

    /* Register all the command handlers */
    CommandManager.register(Strings.CMD_SHOW_FUNCTION_HINT, SHOW_FUNCTION_HINT_CMD_ID, handleShowFunctionHint);

    // Close the function hint when commands are executed, except for the commands
    // to show function hints for code hints.
    $(CommandManager).on("beforeExecuteCommand", function (jqEvent, commandId) {
        if (commandId !== SHOW_FUNCTION_HINT_CMD_ID &&
                commandId !== Commands.SHOW_CODE_HINTS) {
            dismissFunctionHint();
        }
    });

    // Add the menu items
    var menu = Menus.getMenu(Menus.AppMenuBar.EDIT_MENU);
    menu.addMenuItem(SHOW_FUNCTION_HINT_CMD_ID, KeyboardPrefs.showFunctionHint, Menus.AFTER, Commands.SHOW_CODE_HINTS);

    exports.PUSH_EXISTING_HINT              = PUSH_EXISTING_HINT;
    exports.dismissFunctionHint             = dismissFunctionHint;
    exports.installFunctionHintListeners    = installFunctionHintListeners;
    exports.isFunctionHintDisplayed         = isFunctionHintDisplayed;
    exports.popUpFunctionHint               = popUpFunctionHint;
    exports.setSession                      = setSession;
    exports.startCursorTracking             = startCursorTracking;
    exports.stopCursorTracking              = stopCursorTracking;

});