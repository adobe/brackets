/*
* Copyright (c) 2013 Patrick Oladimeji. All rights reserved.
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
/**
 * Code folding extension for brackets
 * @author Patrick Oladimeji
 * @date 10/24/13 9:35:26 AM
 */
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $, brackets*/
define(function (require, exports, module) {
    "use strict";
    var CodeMirror              = brackets.getModule("thirdparty/CodeMirror2/lib/codemirror"),
        Strings                 = brackets.getModule("strings"),
        AppInit                 = brackets.getModule("utils/AppInit"),
        CommandManager          = brackets.getModule("command/CommandManager"),
        DocumentManager         = brackets.getModule("document/DocumentManager"),
        EditorManager           = brackets.getModule("editor/EditorManager"),
        ProjectManager          = brackets.getModule("project/ProjectManager"),
        KeyBindingManager       = brackets.getModule("command/KeyBindingManager"),
        ExtensionUtils          = brackets.getModule("utils/ExtensionUtils"),
        Menus					= brackets.getModule("command/Menus"),
        prefs                   = require("Prefs"),
        COLLAPSE_ALL            = "codefolding.collapse.all",
        COLLAPSE                = "codefolding.collapse",
        EXPAND                  = "codefolding.expand",
        EXPAND_ALL              = "codefolding.expand.all",
        gutterName              = "CodeMirror-foldgutter",
        codeFoldingMenuDivider  = "codefolding.divider",
        collapseKey             = "Ctrl-Alt-[",
        expandKey               = "Ctrl-Alt-]",
        collapseAllKey          = "Alt-1",
        expandAllKey            = "Shift-Alt-1";

    ExtensionUtils.loadStyleSheet(module, "main.less");

    //load code mirror addons
    brackets.getModule(["thirdparty/CodeMirror2/addon/fold/brace-fold"]);
    brackets.getModule(["thirdparty/CodeMirror2/addon/fold/comment-fold"]);
    brackets.getModule(["thirdparty/CodeMirror2/addon/fold/markdown-fold"]);

    //still using slightly modified versions of the foldcode.js and foldgutter.js since we
    //need to modify the gutter click handler to take care of some collapse and expand features
    //e.g. collapsing all children when 'alt' key is pressed
    var foldGutter              = require("foldhelpers/foldgutter"),
        foldCode                = require("foldhelpers/foldcode"),
        indentFold              = require("foldhelpers/indentFold");
    /**
      * Restores the linefolds in the editor using values fetched from the preference store
      * Checks the document to ensure that changes have not been made (e.g., in a different editor)
      * to invalidate the saved line folds.
      * @param {Editor} editor  the editor whose saved line folds should be restored
      */
    function restoreLineFolds(editor) {
        var saveFolds = prefs.getSetting("saveFoldStates");
        if (!editor || !saveFolds) {
            return;
        }
        var cm = editor._codeMirror;
        var path = editor.document.file.fullPath;
        var folds = cm._lineFolds || prefs.getFolds(path);
        cm._lineFolds = cm.getValidFolds(folds);
        prefs.setFolds(path, cm._lineFolds);
        Object.keys(cm._lineFolds).forEach(function (line) {
            cm.foldCode(+line);
        });
    }

    /**
      * Saves the line folds in the editor using the preference storage
      * @param {Editor} editor the editor whose line folds should be saved
      */
    function saveLineFolds(editor) {
        var saveFolds = prefs.getSetting("saveFoldStates");
        if (!editor || !saveFolds) {
            return;
        }
        var folds = editor._codeMirror._lineFolds || {};
        var path = editor.document.file.fullPath;
        if (Object.keys(folds).length) {
            prefs.setFolds(path, folds);
        } else {
            prefs.setFolds(path, undefined);
        }
    }

    /**
      * Event handler for gutter click. Manages folding and unfolding code regions. If the Alt key
      * is pressed while clicking the fold gutter, child code fragments are also folded/unfolded
      * up to a level defined in the `maxFoldLevel' preference.
      * @param {object} cm the codeMirror object
      * @param {number} line the line number for the clicked gutter
      * @param {string} gutter the name of the gutter element clicked
      * @param {object} event the underlying dom event triggered for the gutter click
      */
    function onGutterClick(cm, line, gutter, event) {
        var opts = cm.state.foldGutter.options, pos = CodeMirror.Pos(line);
        if (gutter !== opts.gutter) { return; }
        var range;
        var _lineFolds = cm._lineFolds;
        if (cm.isFolded(line)) {
            if (event.altKey) {//unfold code including children
                range = _lineFolds[line];
                CodeMirror.commands.unfoldAll(cm, range.from.line, range.to.line);
            } else {
                cm.unfoldCode(line, {range: _lineFolds[line]});
            }
        } else {
            if (event.altKey) {
                var rf = CodeMirror.fold.auto;
                range = rf(cm, pos);
                if (range) {
                    CodeMirror.commands.foldToLevel(cm, range.from.line, range.to.line);
                }
            } else {
                cm.foldCode(line);
            }
        }
    }

    /**
      * Collapses the code region nearest the current cursor position.
      * Nearest is found by searching from the current line and moving up the document until an
      * opening code-folding region is found.
      */
    function collapseCurrent() {
        var editor = EditorManager.getFocusedEditor();
        if (!editor) {
            return;
        }
        var cm = editor._codeMirror;
        var cursor = editor.getCursorPos(), i;
        //move cursor up until a collapsible line is found
        for (i = cursor.line; i >= 0; i--) {
            if (cm.foldCode(i)) {
                editor.setCursorPos(i);
                return;
            }
        }
    }

    /**
      * Expands the code region at the current cursor position.
      */
    function expandCurrent() {
        var editor = EditorManager.getFocusedEditor();
        if (editor) {
            var cursor = editor.getCursorPos(), cm = editor._codeMirror;
            cm.unfoldCode(cursor.line);
        }
    }

    /**
      * Collapses all foldable regions in the current document. Folding is done up to a level 'n'
      * which is defined in the `maxFoldLevel preference. Levels refer to fold heirarchies e.g., for the following
      * code fragment, the function is level 1, the if statement is level 2 and the forEach is level 3
      *
      *     function sample() {
      *         if (debug) {
      *             logMessages.forEach(function (m) {
      *                 console.debug(m);
      *             });
      *         }
      *     }
      */
    function collapseAll() {
        var editor = EditorManager.getFocusedEditor();
        if (editor) {
            var cm = editor._codeMirror;
            CodeMirror.commands.foldToLevel(cm);
        }
    }

    /**
      * Expands all folded regions in the current document
      */
    function expandAll() {
        var editor = EditorManager.getFocusedEditor();
        if (editor) {
            var cm = editor._codeMirror;
            CodeMirror.commands.unfoldAll(cm);
        }
    }

    /**
      * Initialises and creates the code-folding gutter.
      * @param {Editor} editor the editor on which to initialise the fold gutter
      */
    function createGutter(editor) {
        if (!editor) {
            return;
        }
        var cm = editor._codeMirror;
        var path = editor.document.file.fullPath, _lineFolds = prefs.getFolds(path);
        _lineFolds = _lineFolds || {};
        cm._lineFolds = _lineFolds;
        var gutters = cm.getOption("gutters").slice(0);

        var lnIndex = gutters.indexOf("CodeMirror-linenumbers");
        //reuse any existing fold gutter
        if (gutters.indexOf(gutterName) < 0) {
            gutters.splice(lnIndex + 1, 0, gutterName);
        }
        cm.setOption("gutters",  gutters);
        cm.setOption("foldGutter", {onGutterClick: onGutterClick});

        $(cm.getGutterElement()).on({
            mouseenter: function () {
                if (prefs.getSetting("fadeFoldButtons")) {
                    foldGutter.updateInViewport(cm);
                }
            },
            mouseleave: function () {
                if (prefs.getSetting("fadeFoldButtons")) {
                    foldGutter.clearGutter(cm);
                }
            }
        });
    }

    /**
     * Remove the fold gutter for a given CodeMirror instance.
     * @param {CodeMirror} cm the CodeMirror instance whose gutter should be removed
     */
    function removeGutter(cm) {
        var gutters = cm.getOption("gutters").slice(0);
        var index = gutters.indexOf(gutterName);
        gutters.splice(index, 1);
        cm.setOption("gutters",  gutters);
        CodeMirror.defineOption("foldGutter", false, null);
    }

    /**
      * Event handler to initialise fold-gutter and restores/saves line folds in editors whenever the active editor changes
      * @param {object} event the event object
      * @param {Editor} current the current editor
      * @param {Editor} previous the previous editor
      */
    function onActiveEditorChanged(event, current, previous) {
        if (prefs.getSetting("enabled")) {
            if (current && current._codeMirror.getOption("gutters").indexOf(gutterName) === -1) {
                createGutter(current);
                restoreLineFolds(current);
            }
            if (previous) {
                saveLineFolds(previous);
            }
        } else {
            if (current && current._codeMirror) {
                CodeMirror.commands.unfoldAll(current._codeMirror);
                removeGutter(current._codeMirror);
            }
        }
    }

    /**
      * Saves the line folds in the current full editor before it is closed.
      */
    function saveBeforeClose() {
        saveLineFolds(EditorManager.getCurrentFullEditor());
    }

    /**
      * Utility function to check if the code folding menu options exist in the menu
      */
    function menuExists(id) {
        var viewMenu = Menus.getMenu(Menus.AppMenuBar.VIEW_MENU);
        return Menus.getMenuItem(viewMenu._getMenuItemId(id));
    }

    /**
      * Create the codefolding menu items and register key bindings if they dont already exist
      */
    function createMenuItems() {
        //register commands
        if (!CommandManager.get(COLLAPSE_ALL)) {
            CommandManager.register(Strings.COLLAPSE_ALL, COLLAPSE_ALL, collapseAll);
        }

        if (!CommandManager.get(EXPAND_ALL)) {
            CommandManager.register(Strings.EXPAND_ALL, EXPAND_ALL, expandAll);
        }

        if (!CommandManager.get(COLLAPSE)) {
            CommandManager.register(Strings.COLLAPSE_CURRENT, COLLAPSE, collapseCurrent);
        }

        if (!CommandManager.get(EXPAND)) {
            CommandManager.register(Strings.EXPAND_CURRENT, EXPAND, expandCurrent);
        }

        //create menus
        if (!menuExists(codeFoldingMenuDivider)) {
            Menus.getMenu(Menus.AppMenuBar.VIEW_MENU).addMenuDivider(Menus.LAST, codeFoldingMenuDivider);
        }

        if (!menuExists(COLLAPSE_ALL)) {
            Menus.getMenu(Menus.AppMenuBar.VIEW_MENU).addMenuItem(COLLAPSE_ALL);
        }

        if (!menuExists(EXPAND_ALL)) {
            Menus.getMenu(Menus.AppMenuBar.VIEW_MENU).addMenuItem(EXPAND_ALL);
        }

        if (!menuExists(COLLAPSE)) {
            Menus.getMenu(Menus.AppMenuBar.VIEW_MENU).addMenuItem(COLLAPSE);
        }

        if (!menuExists(EXPAND)) {
            Menus.getMenu(Menus.AppMenuBar.VIEW_MENU).addMenuItem(EXPAND);
        }
        //register keybindings
        if (KeyBindingManager.getKeyBindings(COLLAPSE_ALL).length === 0) {
            KeyBindingManager.addBinding(COLLAPSE_ALL, collapseAllKey);
        }
        if (KeyBindingManager.getKeyBindings(EXPAND_ALL).length === 0) {
            KeyBindingManager.addBinding(EXPAND_ALL, expandAllKey);
        }
        if (KeyBindingManager.getKeyBindings(COLLAPSE).length === 0) {
            KeyBindingManager.addBinding(COLLAPSE, collapseKey);
        }
        if (KeyBindingManager.getKeyBindings(EXPAND).length === 0) {
            KeyBindingManager.addBinding(EXPAND, expandKey);
        }
    }

    /**
      * Remove the codefolding menu items and removeany key bindings attributed to them
      */
    function removeMenuItems() {
        //remove keybindings
        if (KeyBindingManager.getKeyBindings(COLLAPSE).length > 0) {
            KeyBindingManager.removeBinding(collapseKey);
        }

        if (KeyBindingManager.getKeyBindings(EXPAND).length > 0) {
            KeyBindingManager.removeBinding(expandKey);
        }

        if (KeyBindingManager.getKeyBindings(COLLAPSE_ALL).length > 0) {
            KeyBindingManager.removeBinding(collapseAllKey);
        }

        if (KeyBindingManager.getKeyBindings(EXPAND_ALL).length > 0) {
            KeyBindingManager.removeBinding(expandAllKey);
        }

        //remove menus
        if (menuExists(codeFoldingMenuDivider)) {
            Menus.getMenu(Menus.AppMenuBar.VIEW_MENU).removeMenuDivider(codeFoldingMenuDivider);
        }

        if (menuExists(COLLAPSE)) {
            Menus.getMenu(Menus.AppMenuBar.VIEW_MENU).removeMenuItem(COLLAPSE);
        }

        if (menuExists(EXPAND)) {
            Menus.getMenu(Menus.AppMenuBar.VIEW_MENU).removeMenuItem(EXPAND);
        }

        if (menuExists(COLLAPSE_ALL)) {
            Menus.getMenu(Menus.AppMenuBar.VIEW_MENU).removeMenuItem(COLLAPSE_ALL);
        }

        if (menuExists(EXPAND_ALL)) {
            Menus.getMenu(Menus.AppMenuBar.VIEW_MENU).removeMenuItem(EXPAND_ALL);
        }
    }

    /**
        Initialise the extension
    */
    function init() {
        if (!prefs.getSetting("enabled")) {
            removeMenuItems();
            return;
        }
        foldCode.init();
        foldGutter.init();
        //register a global fold helper based on indentation folds
        CodeMirror.registerGlobalHelper("fold", "indent", function (mode, cm) {
            return prefs.getSetting("alwaysUseIndentFold");
        }, indentFold);

        CodeMirror.registerHelper("fold", "django", CodeMirror.helpers.fold.brace);
        CodeMirror.registerHelper("fold", "tornado", CodeMirror.helpers.fold.brace);

        EditorManager.on("activeEditorChange", onActiveEditorChanged);
        DocumentManager.on("documentRefreshed", function (event, doc) {
            if (prefs.getSetting("enabled")) {
                restoreLineFolds(doc._masterEditor);
            }
        });

        ProjectManager.on("beforeProjectClose beforeAppClose", saveBeforeClose);
        ProjectManager.on("projectOpen projectReferesh", function () {
            init();
        });

        createMenuItems();

        var editor = EditorManager.getCurrentFullEditor();
        if (editor) {
            var cm = editor._codeMirror;
            createGutter(editor);
            if (prefs.getSetting("fadeFoldButtons")) {
                foldGutter.clearGutter(cm);
            } else {
                foldGutter.updateInViewport(cm);
            }
        }
    }

    /**
      * Register change listener for the preferences file.
      */
    function watchPrefsForChanges() {
        prefs.prefBase.on("change", function (e, data) {
            if (data.ids.indexOf("enabled") > -1) {
                if (prefs.getSetting("enabled")) {
                    init();
                } else {
                    var editor = EditorManager.getCurrentFullEditor();
                    if (editor && editor._codeMirror && CodeMirror.commands.unfoldAll) {
                        CodeMirror.commands.unfoldAll(editor._codeMirror);
                        removeGutter(editor._codeMirror);
                    }
                    removeMenuItems();
                }
            }
        });
    }

    AppInit.appReady(function () {
        init();
        watchPrefsForChanges();
    });
});
