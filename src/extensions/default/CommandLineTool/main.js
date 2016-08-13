/*
 * Copyright (c) 2015 - present Adobe Systems Incorporated. All rights reserved.
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

/*global appshell */

define(function (require, exports, module) {
    "use strict";

    var Menus                   = brackets.getModule("command/Menus"),
        CommandManager          = brackets.getModule("command/CommandManager"),
        Strings                 = brackets.getModule("strings"),
        Dialogs                 = brackets.getModule("widgets/Dialogs"),
        DefaultDialogs          = brackets.getModule("widgets/DefaultDialogs"),
        StringUtils             = brackets.getModule("utils/StringUtils");

    function _mapCLToolsErrorCodeToString(errorCode) {

        var errorString;
        switch (errorCode) {
        case appshell.app.ERR_CL_TOOLS_RMFAILED:
            errorString = Strings.ERROR_CLTOOLS_RMFAILED;
            break;
        case appshell.app.ERR_CL_TOOLS_MKDIRFAILED:
            errorString = Strings.ERROR_CLTOOLS_MKDIRFAILED;
            break;
        case appshell.app.ERR_CL_TOOLS_SYMLINKFAILED:
            errorString = Strings.ERROR_CLTOOLS_LNFAILED;
            break;
        case appshell.app.ERR_CL_TOOLS_SERVFAILED:
            errorString = Strings.ERROR_CLTOOLS_SERVFAILED;
            break;
        case appshell.app.ERR_CL_TOOLS_NOTSUPPORTED:
            errorString = Strings.ERROR_CLTOOLS_NOTSUPPORTED;
            break;
        default:
            errorString = StringUtils.format(Strings.GENERIC_ERROR, errorCode);
            break;
        }

        return errorString;
    }

    function handleInstallCommandResult(errorCode) {
        var dialog;

        if (errorCode === appshell.app.ERR_CL_TOOLS_CANCELLED) {
            // The user has cancelled the authentication dialog.
            return;
        } else if (errorCode === appshell.app.NO_ERROR) {
            // flag success message here.
            dialog = Dialogs.showModalDialog(
                DefaultDialogs.DIALOG_ID_INFO,
                Strings.CREATING_LAUNCH_SCRIPT_TITLE,
                Strings.LAUNCH_SCRIPT_CREATE_SUCCESS
            );
            Dialogs.addLinkTooltips(dialog);

        } else {
            var errorString = _mapCLToolsErrorCodeToString(errorCode);
            var errMsg = StringUtils.format(Strings.ERROR_CREATING_LAUNCH_SCRIPT, errorString);
            dialog = Dialogs.showModalDialog(
                DefaultDialogs.DIALOG_ID_ERROR,
                Strings.CREATING_LAUNCH_SCRIPT_TITLE,
                errMsg
            );
            Dialogs.addLinkTooltips(dialog);
        }
    }

    function handleInstallCommand() {
        appshell.app.installCommandLine(function (serviceCode) {
            handleInstallCommandResult(serviceCode);
        });
    }

    // Register the command and add the menu to file menu.
    function addCommand() {

        var menu                    = Menus.getMenu(Menus.AppMenuBar.FILE_MENU),
            INSTALL_COMMAND_SCRIPT  = "file.installCommandScript";

        CommandManager.register(Strings.CMD_LAUNCH_SCRIPT_MAC, INSTALL_COMMAND_SCRIPT, handleInstallCommand);
        menu.addMenuDivider();
        menu.addMenuItem(INSTALL_COMMAND_SCRIPT);
    }

    // Append this menu only for Mac.
    if (brackets.platform === "mac") {
        addCommand();
    }

});
