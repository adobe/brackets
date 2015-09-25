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

/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, brackets */

define(function (require, exports, module) {
    "use strict";

    var Menus               = brackets.getModule("command/Menus"),
        CommandManager      = brackets.getModule("command/CommandManager"),
        Commands            = brackets.getModule("command/Commands"),
        Strings             = brackets.getModule("strings"),
        PreferencesManager  = brackets.getModule("preferences/PreferencesManager"),
        ViewUtils           = brackets.getModule("utils/ViewUtils"),
        KeyBindingManager   = brackets.getModule("command/KeyBindingManager"),
        WorkspaceManager    = brackets.getModule("view/WorkspaceManager");

    // Constants
    var PREFS_PURE_CODE           = "noDistractions",
        CMD_TOGGLE_PURE_CODE      = "view.togglePureCode";

    //key biding keys
    var togglePureCodeKey         = "Ctrl-Shift-`",
        togglePureCodeKeyMac      = "Cmd-Shift-`";

    //locals
    var _previouslyOpenPanelIDs = [];

    /**
     * @private
     *
     * Updates the command checked status based on the preference name given.
     *
     * @param {string} name Name of preference that has changed
     */
    function _updateCheckedState() {
        CommandManager.get(CMD_TOGGLE_PURE_CODE).setChecked(PreferencesManager.get(PREFS_PURE_CODE));
    }

    function _togglePureCode() {
        PreferencesManager.set(PREFS_PURE_CODE, !PreferencesManager.get(PREFS_PURE_CODE));
    }

    /**
     * hide all open panels
     */
    function _hidePanlesIfRequired() {
        var panelIDs = WorkspaceManager.getAllPanelIDs(), i = 0;
        _previouslyOpenPanelIDs = [];
        for (i = 0; i < panelIDs.length; i++) {
            if (WorkspaceManager.getPanelForID(panelIDs[i]).isVisible()) {
                WorkspaceManager.getPanelForID(panelIDs[i]).hide();
                _previouslyOpenPanelIDs.push(panelIDs[i]);
            }
        }
    }

    /**
     * show all open panels that was previously hidden by _hidePanlesIfRequired()
     */
    function _showPanlesIfRequired() {
        var panelIDs = _previouslyOpenPanelIDs, i = 0;
        for (i = 0; i < panelIDs.length; i++) {
            if (WorkspaceManager.getPanelForID(panelIDs[i])) {
                WorkspaceManager.getPanelForID(panelIDs[i]).show();
            }
        }
        _previouslyOpenPanelIDs = [];
    }

    PreferencesManager.definePreference(PREFS_PURE_CODE, "boolean", false, {
        description: Strings.DESCRIPTION_PURE_CODING_SURFACE
    });

    PreferencesManager.on("change", PREFS_PURE_CODE, function () {
        if (PreferencesManager.get(PREFS_PURE_CODE)) {
            ViewUtils.hideMainToolBar();
            CommandManager.execute(Commands.HIDE_SIDEBAR);
            _hidePanlesIfRequired();
        } else {
            ViewUtils.showMainToolBar();
            CommandManager.execute(Commands.SHOW_SIDEBAR);
            _showPanlesIfRequired();
        }
        _updateCheckedState();
    });

    /**
     * Register the Commands , add the Menu Items and key bindings
     */
    function initializeCommands() {
        CommandManager.register(Strings.CMD_TOGGLE_PURE_CODE, CMD_TOGGLE_PURE_CODE, _togglePureCode);

        Menus.getMenu(Menus.AppMenuBar.VIEW_MENU).addMenuItem(CMD_TOGGLE_PURE_CODE, "", Menus.AFTER, Commands.VIEW_HIDE_SIDEBAR);
        //Menus.getMenu(Menus.AppMenuBar.VIEW_MENU).addMenuItem(CMD_TOGGLE_PURE_CODE);

        KeyBindingManager.addBinding(CMD_TOGGLE_PURE_CODE, [ {key: togglePureCodeKey}, {key: togglePureCodeKeyMac, platform: "mac"} ]);
    }

    initializeCommands();

});
