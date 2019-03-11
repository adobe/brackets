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

/* eslint max-len: ["error", { "code": 200 }]*/
define(function (require, exports, module) {
    "use strict";

    var _ = require("thirdparty/lodash");

    var Commands = require("command/Commands"),
        AppInit = require("utils/AppInit"),
        CommandManager = require("command/CommandManager"),
        EditorManager = require("editor/EditorManager"),
        KeyEvent = require("utils/KeyEvent"),
        Strings = require("strings"),
        ProviderRegistrationHandler = require("features/PriorityBasedRegistration").RegistrationHandler;


    /** @const {string} Show Function Hint command ID */
    var SHOW_PARAMETER_HINT_CMD_ID = "showParameterHint", // string must MATCH string in native code (brackets_extensions)
        hintContainerHTML = require("text!htmlContent/parameter-hint-template.html");

    var $hintContainer, // function hint container
        $hintContent, // function hint content holder
        hintState = {},
        lastChar = null,
        sessionEditor = null,
        keyDownEditor = null;

    // Constants
    var POINTER_TOP_OFFSET = 4, // Size of margin + border of hint.
        POSITION_BELOW_OFFSET = 4; // Amount to adjust to top position when the preview bubble is below the text

    // keep jslint from complaining about handleCursorActivity being used before
    // it was defined.
    var handleCursorActivity;

    var _providerRegistrationHandler = new ProviderRegistrationHandler(),
        registerHintProvider = _providerRegistrationHandler.registerProvider.bind(_providerRegistrationHandler),
        removeHintProvider = _providerRegistrationHandler.removeProvider.bind(_providerRegistrationHandler);

    /**
     * Position a function hint.
     *
     * @param {number} xpos
     * @param {number} ypos
     * @param {number} ybot
     */
    function positionHint(xpos, ypos, ybot) {
        var hintWidth = $hintContainer.width(),
            hintHeight = $hintContainer.height(),
            top = ypos - hintHeight - POINTER_TOP_OFFSET,
            left = xpos,
            $editorHolder = $("#editor-holder"),
            editorLeft;

        if ($editorHolder.offset() === undefined) {
            // this happens in jasmine tests that run
            // without a windowed document.
            return;
        }

        editorLeft = $editorHolder.offset().left;
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
     * Format the given parameter array. Handles separators between
     * parameters, syntax for optional parameters, and the order of the
     * parameter type and parameter name.
     *
     * @param {!Array.<{name: string, type: string, isOptional: boolean}>} params -
     * array of parameter descriptors
     * @param {function(string)=} appendSeparators - callback function to append separators.
     * The separator is passed to the callback.
     * @param {function(string, number)=} appendParameter - callback function to append parameter.
     * The formatted parameter type and name is passed to the callback along with the
     * current index of the parameter.
     * @param {boolean=} typesOnly - only show parameter types. The
     * default behavior is to include both parameter names and types.
     * @return {string} - formatted parameter hint
     */
    function _formatParameterHint(params, appendSeparators, appendParameter, typesOnly) {
        var result = "",
            pendingOptional = false;

        appendParameter("(", "", -1);
        params.forEach(function (value, i) {
            var param = value.label,
                documentation = value.documentation,
                separators = "";

            if (value.isOptional) {
                // if an optional param is following by an optional parameter, then
                // terminate the bracket. Otherwise enclose a required parameter
                // in the same bracket.
                if (pendingOptional) {
                    separators += "]";
                }

                pendingOptional = true;
            }

            if (i > 0) {
                separators += ", ";
            }

            if (value.isOptional) {
                separators += "[";
            }

            if (appendSeparators) {
                appendSeparators(separators);
            }

            result += separators;

            /*if (!typesOnly) {
                param += " " + value.name;
            }*/

            if (appendParameter) {
                appendParameter(param, documentation, i);
            }

            result += param;

        });

        if (pendingOptional) {
            if (appendSeparators) {
                appendSeparators("]");
            }

            result += "]";
        }
        appendParameter(")", "", -1);

        return result;
    }

    /**
     *  Bold the parameter at the caret.
     *
     *  @param {{inFunctionCall: boolean, functionCallPos: {line: number, ch: number}}} functionInfo -
     *  tells if the caret is in a function call and the position
     *  of the function call.
     */
    function formatHint(hints) {
        $hintContent.empty();
        $hintContent.addClass("brackets-hints");

        function appendSeparators(separators) {
            $hintContent.append(separators);
        }

        function appendParameter(param, documentation, index) {
            if (hints.currentIndex === index) {
                $hintContent.append($("<span>")
                    .append(_.escape(param))
                    .addClass("current-parameter"));
            } else {
                $hintContent.append($("<span>")
                    .append(_.escape(param))
                    .addClass("parameter"));
            }
        }

        if (hints.parameters.length > 0) {
            _formatParameterHint(hints.parameters, appendSeparators, appendParameter);
        } else {
            $hintContent.append(_.escape(Strings.NO_ARGUMENTS));
        }
    }

    /**
     * Dismiss the function hint.
     *
     */
    function dismissHint(editor) {
        if (hintState.visible) {
            $hintContainer.hide();
            $hintContent.empty();
            hintState = {};

            if (editor) {
                editor.off("cursorActivity.ParameterHints", handleCursorActivity);
                sessionEditor = null;
            } else if (sessionEditor) {
                sessionEditor.off("cursorActivity.ParameterHints", handleCursorActivity);
                sessionEditor = null;
            }
        }
    }

    /**
     * Pop up a function hint on the line above the caret position.
     *
     * @param {object=} editor - current Active Editor
     * @return {jQuery.Promise} - The promise will not complete until the
     *      hint has completed. Returns null, if the function hint is already
     *      displayed or there is no function hint at the cursor.
     *
     */
    function popUpHint(editor) {
        var request = null;
        var $deferredPopUp = $.Deferred();
        var sessionProvider = null;

        // Find a suitable provider, if any
        var language = editor.getLanguageForSelection(),
            enabledProviders = _providerRegistrationHandler.getProvidersForLanguageId(language.getId());

        enabledProviders.some(function (item, index) {
            if (item.provider.hasParameterHints(editor, lastChar)) {
                sessionProvider = item.provider;
                return true;
            }
        });

        if (sessionProvider) {
            request = sessionProvider.getParameterHints();
        }

        if (request) {
            request.done(function (parameterHint) {
                var cm = editor._codeMirror,
                    pos = cm.charCoords(editor.getCursorPos());

                formatHint(parameterHint);

                $hintContainer.show();
                positionHint(pos.left, pos.top, pos.bottom);
                hintState.visible = true;

                sessionEditor = editor;
                editor.on("cursorActivity.ParameterHints", handleCursorActivity);
                $deferredPopUp.resolveWith(null);
            }).fail(function () {
                hintState = {};
            });
        }

        return $deferredPopUp;
    }

    /**
     *  Show the parameter the cursor is on in bold when the cursor moves.
     *  Dismiss the pop up when the cursor moves off the function.
     */
    handleCursorActivity = function (event, editor) {
        dismissHint(editor);
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
                    dismissHint(editor);
                }
            }).on("scroll.ParameterHints", function () {
                dismissHint(editor);
            })
            .on("editorChange.ParameterHints", _handleChange)
            .on("keypress.ParameterHints", _handleKeypressEvent);
    }

    /**
     * Clean up after installListeners()
     * @param {!Editor} editor
     */
    function uninstallListeners(editor) {
        editor.off(".ParameterHints");
    }

    function _handleKeypressEvent(jqEvent, editor, event) {
        keyDownEditor = editor;
        // Last inserted character, used later by handleChange
        lastChar = String.fromCharCode(event.charCode);
    }

    /**
     * Start a new implicit hinting session, or update the existing hint list.
     * Called by the editor after handleKeyEvent, which is responsible for setting
     * the lastChar.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {{from: Pos, to: Pos, text: Array, origin: string}} changeList
     */
    function _handleChange(event, editor, changeList) {
        if (lastChar && (lastChar === '(' || lastChar === ',') && editor === keyDownEditor) {
            keyDownEditor = null;
            popUpHint(editor);
        }
    }

    function activeEditorChangeHandler(event, current, previous) {

        if (previous) {
            //Removing all old Handlers
            previous.document
                .off("languageChanged.ParameterHints");
            uninstallListeners(previous);
        }

        if (current) {
            current.document
                .on("languageChanged.ParameterHints", function () {
                    // If current doc's language changed, reset our state by treating it as if the user switched to a
                    // different document altogether
                    uninstallListeners(current);
                    installListeners(current);
                });
            installListeners(current);
        }
    }

    AppInit.appReady(function () {
        // Create the function hint container
        $hintContainer = $(hintContainerHTML).appendTo($("body"));
        $hintContent = $hintContainer.find(".function-hint-content-new");
        activeEditorChangeHandler(null, EditorManager.getActiveEditor(), null);

        EditorManager.on("activeEditorChange", activeEditorChangeHandler);

        CommandManager.on("beforeExecuteCommand", function (event, commandId) {
            if (commandId !== SHOW_PARAMETER_HINT_CMD_ID &&
                commandId !== Commands.SHOW_CODE_HINTS) {
                dismissHint();
            }
        });
    });

    exports.registerHintProvider = registerHintProvider;
    exports.removeHintProvider = removeHintProvider;
});
