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
    var SHOW_PARAMETER_HINT_CMD_ID   = "showParameterHint", // string must MATCH string in native code (brackets_extensions)
        PUSH_EXISTING_HINT           = true,
        OVERWRITE_EXISTING_HINT      = false,
        PRESERVE_FUNCTION_STACK      = true,
        hintContainerHTML            = require("text!ParameterHintTemplate.html"),
        KeyboardPrefs                = JSON.parse(require("text!keyboard.json"));

    var $hintContainer,    // function hint container
        $hintContent,      // function hint content holder

        /** @type {{inFunctionCall: boolean, functionCallPos: {line: number, ch: number},
        *           fnType: {string}}
        */
        hintState = {},
        hintStack = [],    // stack for previous function hint to restore
        preserveHintStack, // close a function hint without clearing stack
        session;                   // current editor session, updated by main

    // Constants
    var
        POSITION_OFFSET             = 38,   // Distance between the bottom of the line and the bottom of the preview container
        POINTER_LEFT_OFFSET         = 17,   // Half of the pointer width, used to find the center of the pointer
        POINTER_TOP_OFFSET          = 4,    // Size of margin + border of hint.
        POSITION_BELOW_OFFSET       = 16,   // Amount to adjust to top position when the preview bubble is below the text
        POPOVER_HORZ_MARGIN         =  5;   // Horizontal margin

    // keep jslint from complaining about handleCursorActivity being used before
    // it was defined.
    var handleCursorActivity;

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
    function isHintDisplayed() {
        return hintState.visible === true;
    }

    /**
     * Position a function hint.
     *
     * @param {number} xpos
     * @param {number} ypos
     * @param {number} ybot
     */
    function positionHint(xpos, ypos, ybot) {
        var hintWidth  = $hintContainer.width(),
            hintHeight = $hintContainer.height(),
            top           = ypos - hintHeight - POINTER_TOP_OFFSET,
            left          = xpos,
            $editorHolder = $("#editor-holder"),
            editorLeft    = $editorHolder.offset().left;

        left = Math.max(left, editorLeft);
        left = Math.min(left, editorLeft + $editorHolder.width() - hintWidth);

        if (top < 0) {
            $hintContainer.removeClass("preview-bubble-above");
            $hintContainer.addClass("preview-bubble-below");
            top = ybot + POSITION_BELOW_OFFSET;
            $hintContainer.offset({
                left: left,
                top: top
            });
        } else {
            $hintContainer.removeClass("preview-bubble-below");
            $hintContainer.addClass("preview-bubble-above");
            $hintContainer.offset({
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
    function formatHint(functionInfo) {
        var hints = session.getParameterHint(functionInfo.functionCallPos);

        $hintContent.empty();
        $hintContent.addClass("brackets-js-hints");
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
                $hintContent.append(separator);
            }

            if (hints.currentIndex === i) {
                $hintContent.append($("<span>")
                    .append(StringUtils.htmlEscape(param))
                    .addClass("current-parameter"));
            } else {
                $hintContent.append(StringUtils.htmlEscape(param));
            }

            if (value.isOptional) {
                $hintContent.append("]");
            }
        });

        if (hints.parameters.length === 0) {
            $hintContent.append(StringUtils.htmlEscape(Strings.NO_ARGUMENTS));
        }
    }

    /**
     * Save the state of the current hint. Called when popping up a parameter hint
     * for a parameter, when the parameter already part of an existing parameter
     * hint.
     */
    function pushHintOnStack() {
        hintStack.push(hintState);
    }

    /**
     * Restore the state of the previous function hint.
     *
     * @returns {boolean} - true the a parameter hint has been pushed, false otherwise.
     */
    function popHintFromStack() {
        if (hintStack.length > 0) {
            hintState = hintStack.pop();
            hintState.visible = false;
            return true;
        }

        return false;
    }

    /**
     * Reset the function hint stack.
     */
    function clearFunctionHintStack() {
        hintStack = [];
    }

    /**
     * Test if the function call at the cursor is different from the currently displayed
     * function hint.
     *
     * @param functionCallPos
     * @returns {boolean}
     */
    function hasFunctionCallPosChanged(functionCallPos) {
        var oldFunctionCallPos = hintState.functionCallPos;
        return (oldFunctionCallPos === undefined ||
            oldFunctionCallPos.line !== functionCallPos.line ||
            oldFunctionCallPos.ch !== functionCallPos.ch);
    }

    /**
     * Dismiss the function hint.
     *
     */
    function dismissHint() {

        if (hintState.visible) {
            $hintContainer.hide();
            $hintContent.empty();
            hintState = {};
            $(session.editor).off("cursorActivity", handleCursorActivity);

            if (!preserveHintStack) {
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
     * @param {{inFunctionCall: boolean, functionCallPos:
     * {{line: number, ch: number}}=} functionInfo -
     * if the functionInfo is already known, it can be passed in to avoid
     * figuring it out again.
     * @return {jQuery.Promise} - The promise will not complete until the
     *      hint has completed. Returns null, if the function hint is already
     *      displayed or the there is no function hint at the cursor.
     *
     */
    function popUpHint(pushExistingHint, hint, functionInfo) {

        functionInfo = functionInfo || session.getFunctionInfo();
        if (!functionInfo.inFunctionCall) {
            dismissHint();
            return null;
        }

        if (hasFunctionCallPosChanged(functionInfo.functionCallPos)) {

            var pushHint = pushExistingHint && isHintDisplayed();
            if (pushHint) {
                pushHintOnStack();
                preserveHintStack = true;
            }

            dismissHint();
            preserveHintStack = false;
        } else if (isHintDisplayed()) {
            return null;
        }

        hintState.functionCallPos = functionInfo.functionCallPos;

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

            formatHint(functionInfo);

            $hintContainer.show();
            positionHint(pos.left, pos.top, pos.bottom);
            hintState.visible = true;
            hintState.fnType = fnType;

            $(session.editor).on("cursorActivity", handleCursorActivity);
        });

        return request;
    }

    /**
     *  Show the parameter the cursor is on in bold when the cursor moves.
     *  Dismiss the pop up when the cursor moves off the function.
     */
    handleCursorActivity = function () {
        var functionInfo = session.getFunctionInfo();

        if (functionInfo.inFunctionCall) {
            // If in a different function hint, then dismiss the old one a
            // display the new one if there is one on the stack
            if (hasFunctionCallPosChanged(functionInfo.functionCallPos)) {
                if (popHintFromStack()) {
                    var poppedFunctionCallPos = hintState.functionCallPos,
                        currentFunctionCallPos = functionInfo.functionCallPos;

                    if (poppedFunctionCallPos.line === currentFunctionCallPos.line &&
                            poppedFunctionCallPos.ch === currentFunctionCallPos.ch) {
                        preserveHintStack = true;
                        popUpHint(OVERWRITE_EXISTING_HINT,
                            hintState.fnType, functionInfo);
                        preserveHintStack = false;
                        return;
                    }
                } else {
                    dismissHint();
                }
            }

            formatHint(functionInfo);
            return;
        }

        dismissHint();
    };

    /**
     * Enable cursor tracking in the current session.
     *
     * @param {Session} session - session to stop cursor tracking on.
     */
    function startCursorTracking(session) {
        $(session.editor).on("cursorActivity", handleCursorActivity);
    }

    /**
     * Stop cursor tracking in the current session.
     *
     * Use this to move the cursor without changing the function hint state.
     *
     * @param {Session} session - session to stop cursor tracking on.
     */
    function stopCursorTracking(session) {
        $(session.editor).off("cursorActivity", handleCursorActivity);
    }

    /**
     * Show a parameter hint in its own pop-up.
     *
     * @param commandData
     */
    function handleShowParameterHint(commandData) {

        // Pop up function hint
        popUpHint();
    }

    /**
     * Install function hint listeners.
     *
     * @param {Editor} editor - editor context on which to listen for
     *      changes
     */
    function installListeners(editor) {

        $(editor).on("keyEvent", function (jqEvent, editor, event) {
            if (event.type === "keydown" && event.keyCode === KeyEvent.DOM_VK_ESCAPE) {
                dismissHint();
            }
        }).on("scroll", function () {
            dismissHint();
        });
    }

    /**
     * Add the function hint command at start up.
     */
    function addCommands() {
        /* Register the command handler */
        CommandManager.register(Strings.CMD_SHOW_PARAMETER_HINT, SHOW_PARAMETER_HINT_CMD_ID, handleShowParameterHint);

        // Add the menu items
        var menu = Menus.getMenu(Menus.AppMenuBar.EDIT_MENU);
        if (menu) {
            menu.addMenuItem(SHOW_PARAMETER_HINT_CMD_ID, KeyboardPrefs.showParameterHint, Menus.AFTER, Commands.SHOW_CODE_HINTS);
        }

        // Close the function hint when commands are executed, except for the commands
        // to show function hints for code hints.
        $(CommandManager).on("beforeExecuteCommand", function (jqEvent, commandId) {
            if (commandId !== SHOW_PARAMETER_HINT_CMD_ID &&
                    commandId !== Commands.SHOW_CODE_HINTS) {
                dismissHint();
            }
        });
    }

    // Create the function hint container
    $hintContainer = $(hintContainerHTML).appendTo($("body"));
    $hintContent = $hintContainer.find(".function-hint-content");

    exports.PUSH_EXISTING_HINT      = PUSH_EXISTING_HINT;
    exports.addCommands             = addCommands;
    exports.dismissHint             = dismissHint;
    exports.installListeners    = installListeners;
    exports.isHintDisplayed         = isHintDisplayed;
    exports.popUpHint               = popUpHint;
    exports.setSession              = setSession;
    exports.startCursorTracking     = startCursorTracking;
    exports.stopCursorTracking      = stopCursorTracking;

});