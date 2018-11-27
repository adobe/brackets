/*
 * Copyright (c) 2018 - present Adobe Systems Incorporated. All rights reserved.
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

    var _ = brackets.getModule("thirdparty/lodash");

    var Commands        = brackets.getModule("command/Commands"),
        AppInit         = brackets.getModule("utils/AppInit"),
        CommandManager  = brackets.getModule("command/CommandManager"),
        KeyEvent        = brackets.getModule("utils/KeyEvent"),
        Menus           = brackets.getModule("command/Menus"),
        Strings         = brackets.getModule("strings"), 
        Utils           = require("lsp/Utils");

    
    var clientList = {};

    /** @const {string} Show Function Hint command ID */
    var SHOW_PARAMETER_HINT_CMD_ID   = "showParameterHint", // string must MATCH string in native code (brackets_extensions)
        PUSH_EXISTING_HINT           = true,
        OVERWRITE_EXISTING_HINT      = false,
        hintContainerHTML            = require("text!lsp/ParameterHintTemplate.html");

    var $hintContainer,    // function hint container
        $hintContent,      // function hint content holder
        hintState = {},
        session;           // current editor session, updated by main

    // Constants
    var POINTER_TOP_OFFSET          = 4,    // Size of margin + border of hint.
        POSITION_BELOW_OFFSET       = 4;    // Amount to adjust to top position when the preview bubble is below the text

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
     * @return {boolean} - true if a function hint is being displayed, false
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
            editorLeft;

        if ($editorHolder.offset() === undefined) {
            // this happens in jasmine tests that run
            // without a windowed document.
            return;
        }

        editorLeft = $editorHolder.offset().left;
        left = Math.max(left, editorLeft);
        //left = Math.min(left, editorLeft + $editorHolder.width() - hintWidth);

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
     *  @param hints Array of parameters needs to be displayed
     */
    function formatHint(hints) {
        
        $hintContent.empty();
        $hintContent.addClass("brackets-hints");

        function appendSeparators(separators) {
            $hintContent.append(separators);
        }

        function appendParameter(param, index) {
            if (hints.currentIndex === index) {
                $hintContent.append($("<span>")
                    .append(_.escape(param))
                    .addClass("current-parameter"));
            } else {
                $hintContent.append(_.escape(param));
            }
        }

        if (hints.length > 0) {
            Utils.formatParameterHint(hints, appendSeparators, appendParameter);
        } else {
            $hintContent.append(_.escape(hints));
        }
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
            session.editor.off("cursorActivity", handleCursorActivity);
        }
    }

    /**
     * Pop up a function hint on the line above the caret position.
     * @return {jQuery.Promise} - The promise will not complete until the
     *      hint has completed. Returns null, if the function hint is already
     *      displayed or there is no function hint at the cursor.
     *
     */
    function popUpHint() {
        dismissHint();
        var request = null;
        var $deferredPopUp = $.Deferred();
        let langId = session.editor.document.getLanguage().getId();
        if (clientList[langId]) {
            request = clientList[langId].getParameterHints();
        } else {
            request = $.Deferred();
            request.resolveWith(null);
            $deferredPopUp.resolveWith(null);
        }

        request.done(function (label) {
            var cm = session.editor._codeMirror,
                pos = cm.charCoords(session.editor.getCursorPos());
            formatHint(label);
            $hintContainer.show();
            positionHint(pos.left, pos.top, pos.bottom);
            hintState.visible = true;
            session.editor.on("cursorActivity", handleCursorActivity);
            $deferredPopUp.resolveWith(null);
        }).fail(function () {
            hintState = {};
        });

        return $deferredPopUp;
    }

    /**
     * Pop up a function hint on the line above the caret position if the character before
     *      the current cursor is an open parenthesis
     *
     * @return {jQuery.Promise} - The promise will not complete until the
     *      hint has completed. Returns null, if the function hint is already
     *      displayed or there is no function hint at the cursor.
     */
    function popUpHintAtOpenParen() {
        var token = session.getToken();
        if (token && token.string === "(") {
            return popUpHint();
        } else {
            dismissHint();
        }
        return null;
    }

     /**
     *  Dismiss the pop up when the cursor moves off.
     */
    handleCursorActivity = function () {
        dismissHint();
    };

    /**
     * Install function hint listeners.
     *
     * @param {Editor} editor - editor context on which to listen for
     *      changes
     */
    function installListeners(editor) {
        editor.on("keydown.ParameterHints", function (event, editor, domEvent) {
            if (domEvent.keyCode === KeyEvent.DOM_VK_ESCAPE) {
                dismissHint();
            }
        }).on("scroll.ParameterHints", function () {
            dismissHint();
        });
    }

    /**
     * Clean up after installListeners()
     * @param {!Editor} editor
     */
    function uninstallListeners(editor) {
        editor.off(".ParameterHints");
    }

    /**
     * Add the function hint command at start up.
     */
    function addCommands() {
        CommandManager.on("beforeExecuteCommand", function (event, commandId) {
            if (commandId !== SHOW_PARAMETER_HINT_CMD_ID &&
                    commandId !== Commands.SHOW_CODE_HINTS) {
                dismissHint();
            }
        });
    }

    function registerHintProvider(client, languages){
        languages.forEach((lang)=>{
            clientList[lang] = client;
        });
    }

    AppInit.appReady(function(){
    // Create the function hint container
    $hintContainer = $(hintContainerHTML).appendTo($("body"));
    $hintContent = $hintContainer.find(".function-hint-content-new");
    });

    exports.addCommands             = addCommands;
    exports.installListeners        = installListeners;
    exports.uninstallListeners      = uninstallListeners;
    exports.popUpHintAtOpenParen    = popUpHintAtOpenParen;
    exports.setSession              = setSession;
    exports.registerHintProvider    = registerHintProvider;
});
