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

    var Commands                    = require("command/Commands"),
        AppInit                     = require("utils/AppInit"),
        CommandManager              = require("command/CommandManager"),
        EditorManager               = require("editor/EditorManager"),
        PerfUtils                   = require("utils/PerfUtils"),
        Menus                       = require("command/Menus"),
        ProviderRegistrationHandler = require("features/PriorityBasedRegistration").RegistrationHandler;

    var _providerRegistrationHandler = new ProviderRegistrationHandler(),
        registerJumpToDefProvider    = _providerRegistrationHandler.registerProvider.bind(_providerRegistrationHandler),
        removeJumpToDefProvider      = _providerRegistrationHandler.removeProvider.bind(_providerRegistrationHandler);


    /**
     * Asynchronously asks providers to handle jump-to-definition.
     * @return {!Promise} Resolved when the provider signals that it's done; rejected if no
     * provider responded or the provider that responded failed.
     */
    function _doJumpToDef() {
        var request = null,
            result = new $.Deferred(),
            jumpToDefProvider = null,
            editor = EditorManager.getActiveEditor();

        if (editor) {
            // Find a suitable provider, if any
            var language = editor.getLanguageForSelection(),
                enabledProviders = _providerRegistrationHandler.getProvidersForLanguageId(language.getId());

            PerfUtils.markStart(PerfUtils.JUMP_TO_DEFINITION);

            enabledProviders.some(function (item, index) {
                if (item.provider.canJumpToDef(editor)) {
                    jumpToDefProvider = item.provider;
                    return true;
                }
            });

            if (jumpToDefProvider) {
                request = jumpToDefProvider.doJumpToDef(editor);

                if (request) {
                    request.done(function () {
                        PerfUtils.finalizeMeasurement(PerfUtils.JUMP_TO_DEFINITION);
                        result.resolve();
                    }).fail(function () {
                        // terminate timer that was started above
                        PerfUtils.finalizeMeasurement(PerfUtils.JUMP_TO_DEFINITION);
                        result.reject();
                    });
                } else {
                    // terminate timer that was started above
                    PerfUtils.finalizeMeasurement(PerfUtils.JUMP_TO_DEFINITION);
                    result.reject();
                }
            } else {
                EditorManager.doJumpToDef();
            }
        } else {
            result.reject();
        }

        return result.promise();
    }

    AppInit.htmlReady(function () {
        CommandManager.get(Commands.NAVIGATE_JUMPTO_DEFINITION)._commandFn = _doJumpToDef;
        Menus.getContextMenu(Menus.ContextMenuIds.EDITOR_MENU).addMenuItem(Commands.NAVIGATE_JUMPTO_DEFINITION);
    });

    exports.registerJumpToDefProvider    = registerJumpToDefProvider;
    exports.removeJumpToDefProvider      = removeJumpToDefProvider;
});
