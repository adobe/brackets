/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, brackets: true */

define(function (require, exports, module) {
    "use strict";

    var CommandManager = brackets.getModule("command/CommandManager");
    var EditorManager  = brackets.getModule("editor/EditorManager");
// todo - needed?
//    var Editor               = brackets.getModule("editor/Editor").Editor;
    var Commands       = brackets.getModule("command/Commands");
    var HTMLRewriter   = brackets.getModule("filesystem/impls/filer/lib/HTMLRewriter");
    var SidebarView    = brackets.getModule("project/SidebarView");
    var StatusBar      = brackets.getModule("widgets/StatusBar");

    var PostMessageTransport = require("lib/PostMessageTransport");
    var Theme = require("lib/Theme");
    var UI = require("lib/UI");

    // Built-in Brackets Commands
    function _bracketsCommand(command) {
        function executeCommand() {
            CommandManager.execute(Commands[command]);
        }

        // Make sure the last-focused editor gets focus before executing
        var editor = EditorManager.getActiveEditor();
        if (editor && !editor.hasFocus()) {
            editor.one("focus", executeCommand);
            editor.focus();
        } else {
            executeCommand();
        }
    }

    // Custom Bramble commands
    function _brambleCommand(command) {
        switch(command) {
        case "BRAMBLE_RELOAD":
            PostMessageTransport.reload();
            break;
        case "BRAMBLE_MOBILE_PREVIEW":
            UI.showMobileView();
            break;
        case "BRAMBLE_DESKTOP_PREVIEW":
            UI.showDesktopView();
            break;
        case "BRAMBLE_ENABLE_SCRIPTS":
            HTMLRewriter.enableScripts();
            PostMessageTransport.reload();
            break;
        case "BRAMBLE_DISABLE_SCRIPTS":
            HTMLRewriter.disableScripts();
            PostMessageTransport.reload();
            break;
        case "BRAMBLE_LIGHT_THEME":
            Theme.setTheme("light-theme");
            break;
        case "BRAMBLE_DARK_THEME":
            Theme.setTheme("dark-theme");
            break;
        case "BRAMBLE_SHOW_SIDEBAR":
            SidebarView.show();
            break;
        case "BRAMBLE_HIDE_SIDEBAR":
            SidebarView.hide();
            break;
        case "BRAMBLE_HIDE_STATUSBAR":
            StatusBar.disable();
            break;
        case "BRAMBLE_SHOW_STATUSBAR":
            StatusBar.enable();
            break;
        default:
            console.log('[Bramble] unknown command:', command);
            break;
        }
    }

    function handleRequest(e) {
        var remoteRequest;
        try {
            remoteRequest = JSON.parse(e.data);
        } catch(err) {
            console.log('[Bramble] unable to parse remote request:', e.data);
            return;
        }

        if (remoteRequest.type !== "bramble:remoteCommand") {
            return;
        }

        switch(remoteRequest.commandCategory) {
        case "brackets":
            _bracketsCommand(remoteRequest.command);
            break;
// todo - what is this?
//        case "editorCommand":
//  Editor[msgObj.command](msgObj.params);
//            _editorCommand(remoteRequest);
//            break;
        case "bramble":
            _brambleCommand(remoteRequest.command);
            break;
        default:
            console.error('[Bramble] unknown remote command request:', remoteRequest);
            break;
        }
    }

    exports.handleRequest = handleRequest;
});
