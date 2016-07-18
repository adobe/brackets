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

/*jslint vars: true, indent: 4, maxerr: 50 */
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
        HealthLogger        = brackets.getModule("utils/HealthLogger"),
        WorkspaceManager    = brackets.getModule("view/WorkspaceManager");

    // Constants
    var PREFS_PURE_CODE           = "noDistractions",
        CMD_TOGGLE_PURE_CODE      = "view.togglePureCode",
        CMD_TOGGLE_PANELS         = "view.togglePanels",
        HEALTH_NO_DISTRACTION     = "noDistractionModeUsed",
        HEALTH_TOGGLE_PANELS      = "togglePanels";

    //key binding keys
    var togglePureCodeKey         = "Ctrl-Shift-2",
        togglePureCodeKeyMac      = "Cmd-Shift-2",
        togglePanelsKey           = "Ctrl-Shift-1",
        togglePanelsKeyMac        = "Cmd-Shift-1",
        togglePanelsKey_EN        = "Ctrl-Shift-`",
        togglePanelsKeyMac_EN     = "Cmd-Shift-`";

    //locals
    var _previouslyOpenPanelIDs = [],
        panelsToggled = false,
        layoutUpdated = false;

    /**
     * @private
     * Updates the command checked status based on the preference for noDestraction mode
     */
    function _updateCheckedState() {
        CommandManager.get(CMD_TOGGLE_PURE_CODE).setChecked(PreferencesManager.get(PREFS_PURE_CODE));
    }

    /**
     * @private
     * toggles noDisraction preference
     */
    function _togglePureCode() {
        PreferencesManager.set(PREFS_PURE_CODE, !PreferencesManager.get(PREFS_PURE_CODE));
        HealthLogger.setHealthDataLog(HEALTH_NO_DISTRACTION, true);
    }

    /**
     * hide all open panels
     */
    function _hidePanelsIfRequired() {
        var panelIDs = WorkspaceManager.getAllPanelIDs();
        _previouslyOpenPanelIDs = [];
        panelIDs.forEach(function (panelID) {
            var panel = WorkspaceManager.getPanelForID(panelID);
            if (panel && panel.isVisible()) {
                panel.hide();
                _previouslyOpenPanelIDs.push(panelID);
            }
        });
    }

    /**
     * show all open panels that was previously hidden by _hidePanelsIfRequired()
     */
    function _showPanelsIfRequired() {
        var panelIDs = _previouslyOpenPanelIDs;
        panelIDs.forEach(function (panelID) {
            var panel = WorkspaceManager.getPanelForID(panelID);
            if (panel) {
                panel.show();
            }
        });
        _previouslyOpenPanelIDs = [];
    }

    function _updateLayout() {
        layoutUpdated = true;
        panelsToggled = false;
    }

    /**
     * We toggle panels in certain cases only :
     * 1. if a panel is shown, toggle can hide it, and successive toggle can show the panel and repeat.
     * 2. if a panel is hidden by toggle, and say the workspace changed making another panel visible by some operation;
     * we reset toggle states so that toggle would hide the panel already present in the workspace.
     * The already hidden panel should not be shown in the specific case for better UX.
     */
    function _togglePanels() {
        var togglePanelCount;
        panelsToggled = !panelsToggled;
        if (panelsToggled) {
            _hidePanelsIfRequired();
            layoutUpdated = false;
            panelsToggled = true;
        } else if (!layoutUpdated) {
            _showPanelsIfRequired();
        }

        //log health data
        togglePanelCount = HealthLogger.getHealthDataLog(HEALTH_TOGGLE_PANELS);
        togglePanelCount = (typeof togglePanelCount === 'number') ? togglePanelCount + 1 : 0;
        HealthLogger.setHealthDataLog(HEALTH_TOGGLE_PANELS, togglePanelCount);
    }

    PreferencesManager.definePreference(PREFS_PURE_CODE, "boolean", false, {
        description: Strings.DESCRIPTION_PURE_CODING_SURFACE
    });

    PreferencesManager.on("change", PREFS_PURE_CODE, function () {
        if (PreferencesManager.get(PREFS_PURE_CODE)) {
            ViewUtils.hideMainToolBar();
            CommandManager.execute(Commands.HIDE_SIDEBAR);
            _hidePanelsIfRequired();
        } else {
            ViewUtils.showMainToolBar();
            CommandManager.execute(Commands.SHOW_SIDEBAR);
            _showPanelsIfRequired();
        }
        _updateCheckedState();
    });

    WorkspaceManager.on(WorkspaceManager.EVENT_WORKSPACE_PANEL_SHOWN, _updateLayout);

    /**
     * Register the Commands , add the Menu Items and key bindings
     */
    function initializeCommands() {
        CommandManager.register(Strings.CMD_TOGGLE_PURE_CODE, CMD_TOGGLE_PURE_CODE, _togglePureCode);
        CommandManager.register(Strings.CMD_TOGGLE_PANELS, CMD_TOGGLE_PANELS, _togglePanels);

        Menus.getMenu(Menus.AppMenuBar.VIEW_MENU).addMenuItem(CMD_TOGGLE_PANELS, "", Menus.AFTER, Commands.VIEW_HIDE_SIDEBAR);
        Menus.getMenu(Menus.AppMenuBar.VIEW_MENU).addMenuItem(CMD_TOGGLE_PURE_CODE, "", Menus.AFTER, CMD_TOGGLE_PANELS);

        KeyBindingManager.addBinding(CMD_TOGGLE_PURE_CODE, [ {key: togglePureCodeKey}, {key: togglePureCodeKeyMac, platform: "mac"} ]);

        //default toggle panel shortcut was ctrl+shift+` as it is present in one vertical line in the keyboard. However, we later learnt
        //from IQE team than non-English keyboards does not have the ` char. So added one more shortcut ctrl+shift+1 which will be preferred
        KeyBindingManager.addBinding(CMD_TOGGLE_PANELS, [ {key: togglePanelsKey}, {key: togglePanelsKeyMac, platform: "mac"} ]);
        KeyBindingManager.addBinding(CMD_TOGGLE_PANELS, [ {key: togglePanelsKey_EN}, {key: togglePanelsKeyMac_EN, platform: "mac"} ]);
    }

    initializeCommands();

});
