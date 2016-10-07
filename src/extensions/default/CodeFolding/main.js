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

define(function (require, exports, module) {
    "use strict";

    var CodeMirror              = brackets.getModule("thirdparty/CodeMirror/lib/codemirror"),
        Strings                 = brackets.getModule("strings"),
        AppInit                 = brackets.getModule("utils/AppInit"),
        CommandManager          = brackets.getModule("command/CommandManager"),
        DocumentManager         = brackets.getModule("document/DocumentManager"),
        Editor                  = brackets.getModule("editor/Editor").Editor,
        EditorManager           = brackets.getModule("editor/EditorManager"),
        ProjectManager          = brackets.getModule("project/ProjectManager"),
        ViewStateManager        = brackets.getModule("view/ViewStateManager"),
        KeyBindingManager       = brackets.getModule("command/KeyBindingManager"),
        ExtensionUtils          = brackets.getModule("utils/ExtensionUtils"),
        Menus                   = brackets.getModule("command/Menus"),
        prefs                   = require("Prefs"),
        COLLAPSE_ALL            = "codefolding.collapse.all",
        COLLAPSE                = "codefolding.collapse",
        EXPAND                  = "codefolding.expand",
        EXPAND_ALL              = "codefolding.expand.all",
        GUTTER_NAME             = "CodeMirror-foldgutter",
        codeFoldingMenuDivider  = "codefolding.divider",
        collapseKey             = "Ctrl-Alt-[",
        expandKey               = "Ctrl-Alt-]",
        collapseAllKey          = "Alt-1",
        expandAllKey            = "Shift-Alt-1",
        collapseAllKeyMac       = "Cmd-1",
        expandAllKeyMac         = "Cmd-Shift-1";

    ExtensionUtils.loadStyleSheet(module, "main.less");

    // Load CodeMirror addons
    brackets.getModule(["thirdparty/CodeMirror/addon/fold/brace-fold"]);
    brackets.getModule(["thirdparty/CodeMirror/addon/fold/comment-fold"]);
    brackets.getModule(["thirdparty/CodeMirror/addon/fold/markdown-fold"]);

    // Still using slightly modified versions of the foldcode.js and foldgutter.js since we
    // need to modify the gutter click handler to take care of some collapse and expand features
    // e.g. collapsing all children when 'alt' key is pressed
    var foldGutter              = require("foldhelpers/foldgutter"),
        foldCode                = require("foldhelpers/foldcode"),
        indentFold              = require("foldhelpers/indentFold"),
        handlebarsFold          = require("foldhelpers/handlebarsFold"),
        selectionFold           = require("foldhelpers/foldSelected");


    /** Set to true when init() has run; set back to false after deinit() has run */
    var _isInitialized = false;

    /**
      * Restores the linefolds in the editor using values fetched from the preference store
      * Checks the document to ensure that changes have not been made (e.g., in a different editor)
      * to invalidate the saved line folds.
      * Selection Folds are found by comparing the line folds in the preference store with the
      * selection ranges in the viewState of the current document. Any selection range in the view state
      * that is folded in the prefs will be folded. Unlike other fold range finder, the only validation
      * on selection folds is to check that they satisfy the minimum fold range.
      * @param {Editor} editor  the editor whose saved line folds should be restored
      */
    function restoreLineFolds(editor) {
        /**
         * Checks if the range from and to Pos is the same as the selection start and end Pos
         * @param   {Object}  range     {from, to} where from and to are CodeMirror.Pos objects
         * @param   {Object}  selection {start, end} where start and end are CodeMirror.Pos objects
         * @returns {Boolean} true if the range and selection span the same region and false otherwise
         */
        function rangeEqualsSelection(range, selection) {
            return range.from.line === selection.start.line && range.from.ch === selection.start.ch &&
                range.to.line === selection.end.line && range.to.ch === selection.end.ch;
        }

        /**
         * Checks if the range is equal to one of the selections in the viewState
         * @param   {Object}  range     {from, to} where from and to are CodeMirror.Pos objects.
         * @param   {Object}  viewState The current editor's ViewState object
         * @returns {Boolean} true if the range is found in the list of selections or false if not.
         */
        function isInViewStateSelection(range, viewState) {
            if (!viewState || !viewState.selections) {
                return false;
            }

            return viewState.selections.some(function (selection) {
                return rangeEqualsSelection(range, selection);
            });
        }

        var saveFolds = prefs.getSetting("saveFoldStates");
        if (!editor || !saveFolds) {
            return;
        }
        var viewState = ViewStateManager.getViewState(editor.document.file);
        var cm = editor._codeMirror;
        var path = editor.document.file.fullPath;
        var folds = cm._lineFolds || prefs.getFolds(path);
        //separate out selection folds from non-selection folds
        var nonSelectionFolds = {}, selectionFolds = {}, range;
        Object.keys(folds).forEach(function (line) {
            range = folds[line];
            if (isInViewStateSelection(range, viewState)) {
                selectionFolds[line] = range;
            } else {
                nonSelectionFolds[line] = range;
            }
        });
        nonSelectionFolds = cm.getValidFolds(nonSelectionFolds);
        //add the selection folds
        Object.keys(selectionFolds).forEach(function (line) {
            nonSelectionFolds[line] = selectionFolds[line];
        });
        cm._lineFolds = nonSelectionFolds;
        prefs.setFolds(path, cm._lineFolds);
        Object.keys(cm._lineFolds).forEach(function (line) {
            cm.foldCode(Number(line), {range: cm._lineFolds[line]});
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
      * @param {!CodeMirror} cm the CodeMirror object
      * @param {number} line the line number for the clicked gutter
      * @param {string} gutter the name of the gutter element clicked
      * @param {!KeyboardEvent} event the underlying dom event triggered for the gutter click
      */
    function onGutterClick(cm, line, gutter, event) {
        var opts = cm.state.foldGutter.options, pos = CodeMirror.Pos(line);
        if (gutter !== opts.gutter) { return; }
        var range;
        var _lineFolds = cm._lineFolds;
        if (cm.isFolded(line)) {
            if (event.altKey) { // unfold code including children
                range = _lineFolds[line];
                CodeMirror.commands.unfoldAll(cm, range.from.line, range.to.line);
            } else {
                cm.unfoldCode(line, {range: _lineFolds[line]});
            }
        } else {
            if (event.altKey) {
                range = CodeMirror.fold.auto(cm, pos);
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
        // Move cursor up until a collapsible line is found
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
      * which is defined in the `maxFoldLevel` preference. Levels refer to fold heirarchies e.g., for the following
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
        var cm = editor._codeMirror;
        var path = editor.document.file.fullPath, _lineFolds = prefs.getFolds(path);
        _lineFolds = _lineFolds || {};
        cm._lineFolds = _lineFolds;
        var gutters = cm.getOption("gutters").slice(0);

        // Reuse any existing fold gutter
        if (gutters.indexOf(GUTTER_NAME) < 0) {
            var lnIndex = gutters.indexOf("CodeMirror-linenumbers");
            $(editor.getRootElement()).addClass("folding-enabled");
            gutters.splice(lnIndex + 1, 0, GUTTER_NAME);
            cm.setOption("gutters",  gutters);
            cm.refresh();  // force recomputing gutter width - .folding-enabled class affects linenumbers gutter which has existing cached width
        }
        cm.setOption("foldGutter", {onGutterClick: onGutterClick});

        $(cm.getGutterElement()).on({
            mouseenter: function () {
                if (prefs.getSetting("hideUntilMouseover")) {
                    foldGutter.updateInViewport(cm);
                } else {
                    $(editor.getRootElement()).addClass("over-gutter");
                }
            },
            mouseleave: function () {
                if (prefs.getSetting("hideUntilMouseover")) {
                    foldGutter.clearGutter(cm);
                } else {
                    $(editor.getRootElement()).removeClass("over-gutter");
                }
            }
        });
    }

    /**
     * Remove the fold gutter for a given CodeMirror instance.
     * @param {CodeMirror} cm the CodeMirror instance whose gutter should be removed
     */
    function removeGutter(editor) {
        var cm = editor._codeMirror;
        var gutters = cm.getOption("gutters").slice(0);
        var index = gutters.indexOf(GUTTER_NAME);
        $(editor.getRootElement()).removeClass("folding-enabled");
        gutters.splice(index, 1);
        cm.setOption("gutters",  gutters);
        cm.refresh();  // force recomputing gutter width - .folding-enabled class affected linenumbers gutter
        CodeMirror.defineOption("foldGutter", false, null);
    }

    /** Add gutter and restore saved expand/collapse state */
    function enableFoldingInEditor(editor) {
        if (editor._codeMirror.getOption("gutters").indexOf(GUTTER_NAME) === -1) {
            createGutter(editor);
            restoreLineFolds(editor);
        }
    }

    /**
      * When a brand new editor is seen, initialise fold-gutter and restore line folds in it. Save line folds in
      * departing editor in case it's getting closed.
      * @param {object} event the event object
      * @param {Editor} current the current editor
      * @param {Editor} previous the previous editor
      */
    function onActiveEditorChanged(event, current, previous) {
        if (current) {
            enableFoldingInEditor(current);
        }
        if (previous) {
            saveLineFolds(previous);
        }
    }

    /**
      * Saves the line folds in the current full editor before it is closed.
      */
    function saveBeforeClose() {
        // We've already saved all other open editors when they go active->inactive
        saveLineFolds(EditorManager.getActiveEditor());
    }

    /**
     * Remove code-folding functionality
     */
    function deinit() {
        _isInitialized = false;

        KeyBindingManager.removeBinding(collapseKey);
        KeyBindingManager.removeBinding(expandKey);
        KeyBindingManager.removeBinding(collapseAllKey);
        KeyBindingManager.removeBinding(expandAllKey);
        KeyBindingManager.removeBinding(collapseAllKeyMac);
        KeyBindingManager.removeBinding(expandAllKeyMac);

        //remove menus
        Menus.getMenu(Menus.AppMenuBar.VIEW_MENU).removeMenuDivider(codeFoldingMenuDivider.id);
        Menus.getMenu(Menus.AppMenuBar.VIEW_MENU).removeMenuItem(COLLAPSE);
        Menus.getMenu(Menus.AppMenuBar.VIEW_MENU).removeMenuItem(EXPAND);
        Menus.getMenu(Menus.AppMenuBar.VIEW_MENU).removeMenuItem(COLLAPSE_ALL);
        Menus.getMenu(Menus.AppMenuBar.VIEW_MENU).removeMenuItem(EXPAND_ALL);

        EditorManager.off(".CodeFolding");
        DocumentManager.off(".CodeFolding");
        ProjectManager.off(".CodeFolding");

        // Remove gutter & revert collapsed sections in all currently open editors
        Editor.forEveryEditor(function (editor) {
            CodeMirror.commands.unfoldAll(editor._codeMirror);
            removeGutter(editor);
        });
    }

    /**
     * Enable code-folding functionality
     */
    function init() {
        _isInitialized = true;

        foldCode.init();
        foldGutter.init();

        // Many CodeMirror modes specify which fold helper should be used for that language. For a few that
        // don't, we register helpers explicitly here. We also register a global helper for generic indent-based
        // folding, which cuts across all languages if enabled via preference.
        CodeMirror.registerGlobalHelper("fold", "selectionFold", function (mode, cm) {
            return prefs.getSetting("makeSelectionsFoldable");
        }, selectionFold);
        CodeMirror.registerGlobalHelper("fold", "indent", function (mode, cm) {
            return prefs.getSetting("alwaysUseIndentFold");
        }, indentFold);

        CodeMirror.registerHelper("fold", "handlebars", handlebarsFold);
        CodeMirror.registerHelper("fold", "htmlhandlebars", handlebarsFold);
        CodeMirror.registerHelper("fold", "htmlmixed", handlebarsFold);

        EditorManager.on("activeEditorChange.CodeFolding", onActiveEditorChanged);
        DocumentManager.on("documentRefreshed.CodeFolding", function (event, doc) {
            restoreLineFolds(doc._masterEditor);
        });

        ProjectManager.on("beforeProjectClose.CodeFolding beforeAppClose.CodeFolding", saveBeforeClose);

        //create menus
        codeFoldingMenuDivider = Menus.getMenu(Menus.AppMenuBar.VIEW_MENU).addMenuDivider();
        Menus.getMenu(Menus.AppMenuBar.VIEW_MENU).addMenuItem(COLLAPSE_ALL);
        Menus.getMenu(Menus.AppMenuBar.VIEW_MENU).addMenuItem(EXPAND_ALL);
        Menus.getMenu(Menus.AppMenuBar.VIEW_MENU).addMenuItem(COLLAPSE);
        Menus.getMenu(Menus.AppMenuBar.VIEW_MENU).addMenuItem(EXPAND);

        //register keybindings
        KeyBindingManager.addBinding(COLLAPSE_ALL, [ {key: collapseAllKey}, {key: collapseAllKeyMac, platform: "mac"} ]);
        KeyBindingManager.addBinding(EXPAND_ALL, [ {key: expandAllKey}, {key: expandAllKeyMac, platform: "mac"} ]);
        KeyBindingManager.addBinding(COLLAPSE, collapseKey);
        KeyBindingManager.addBinding(EXPAND, expandKey);


        // Add gutters & restore saved expand/collapse state in all currently open editors
        Editor.forEveryEditor(function (editor) {
            enableFoldingInEditor(editor);
        });
    }

    /**
      * Register change listener for the preferences file.
      */
    function watchPrefsForChanges() {
        prefs.prefsObject.on("change", function (e, data) {
            if (data.ids.indexOf("enabled") > -1) {
                // Check if enabled state mismatches whether code-folding is actually initialized (can't assume
                // since preference change events can occur when the value hasn't really changed)
                var isEnabled = prefs.getSetting("enabled");
                if (isEnabled && !_isInitialized) {
                    init();
                } else if (!isEnabled && _isInitialized) {
                    deinit();
                }
            }
        });
    }

    AppInit.htmlReady(function () {
        CommandManager.register(Strings.COLLAPSE_ALL, COLLAPSE_ALL, collapseAll);
        CommandManager.register(Strings.EXPAND_ALL, EXPAND_ALL, expandAll);
        CommandManager.register(Strings.COLLAPSE_CURRENT, COLLAPSE, collapseCurrent);
        CommandManager.register(Strings.EXPAND_CURRENT, EXPAND, expandCurrent);

        if (prefs.getSetting("enabled")) {
            init();
        }
        watchPrefsForChanges();
    });
});
