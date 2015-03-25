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
/*global define, d3, require, $, brackets, window, MouseEvent */

require.config({
    paths: {
        "text" : "lib/text",
        "i18n" : "lib/i18n"
    },
    locale: brackets.getLocale()
});

define(function (require, exports, module) {
    "use strict";
    var CodeMirror = brackets.getModule("thirdparty/CodeMirror2/lib/codemirror");
    var Strings = require("strings");
    var CommandManager          = brackets.getModule("command/CommandManager"),
        DocumentManager         = brackets.getModule("document/DocumentManager"),
        EditorManager           = brackets.getModule("editor/EditorManager"),
        ProjectManager          = brackets.getModule("project/ProjectManager"),
        KeyBindingManager       = brackets.getModule("command/KeyBindingManager"),
        ExtensionUtils          = brackets.getModule("utils/ExtensionUtils"),
		Menus					= brackets.getModule("command/Menus"),
        _prefs                  = require("./Prefs"),
        CODE_FOLD_EXT           = "javascript.code.folding",
        COLLAPSE_ALL            = "codefolding.collapse.all",
        COLLAPSE                = "codefolding.collapse",
        EXPAND                  = "codefolding.expand",
        EXPAND_ALL              = "codefolding.expand.all",
		CODE_FOLDING_SETTINGS	= "codefolding.settings",
        gutterName              = "CodeMirror-foldgutter",
		COLLAPSE_CUSTOM_REGIONS = "codefolding.collapse.customregions",
		SettingsDialog			= require("SettingsDialog");
    
    ExtensionUtils.loadStyleSheet(module, "main.less");

    //load code mirror addons
    brackets.getModule(["thirdparty/CodeMirror2/addon/fold/brace-fold"]);
    brackets.getModule(["thirdparty/CodeMirror2/addon/fold/comment-fold"]);
    brackets.getModule(["thirdparty/CodeMirror2/addon/fold/markdown-fold"]);
    
    //still using slightly modified versions of the foldcode.js and foldgutter.js since we
    //need to modify the gutter click handler to take care of some collapse and expand features
    //e.g. collapsing all children when 'alt' key is pressed
    require("foldhelpers/foldcode")();
    var foldGutter = require("foldhelpers/foldgutter")();

    var indentFold              = require("foldhelpers/indentFold"),
        latexFold               = require("foldhelpers/latex-fold"),
        regionFold              = require("foldhelpers/region-fold");

    //register a global fold helper based on indentation folds
    CodeMirror.registerGlobalHelper("fold", "indent", function (mode, cm) {
        return _prefs.getSetting("alwaysUseIndentFold");
    }, indentFold);
    
    CodeMirror.registerGlobalHelper("fold", "region", function (mode, cm) {
        return _prefs.getSetting("enableRegionFolding");
    }, regionFold);
    
    CodeMirror.registerHelper("fold", "stex", latexFold);
	CodeMirror.registerHelper("fold", "django", CodeMirror.helpers.fold.brace);
	CodeMirror.registerHelper("fold", "tornado", CodeMirror.helpers.fold.brace);
    
    /** gets the folded regions in the editor.
	 * @returns a map containing {linenumber: {from, to}}
	 */
	function getLineFoldsInEditor(editor) {
		var cm = editor._codeMirror, i, folds = {};
		if (cm) {
			var marks = cm.getAllMarks();
			marks.filter(function (m) {return m.__isFold; })
				.forEach(function (mark) {
					var range = mark.find();
					if (range) {
						folds[range.from.line] = range;
					}
				});
		}
		return folds;
	}
	
	/**
        Restores the linefolds in the editor using values fetched from the preference store
        Checks the document to ensure that changes have not been made (e.g., in a different editor)
        to invalidate the saved line folds.
        @param {Editor} editor  the editor whose saved line folds should be restored
    */
    function restoreLineFolds(editor) {
		var saveFolds = _prefs.getSetting("saveFoldStates");
        var rf = CodeMirror.fold.auto;
        if (editor && saveFolds) {
            var cm = editor._codeMirror, foldFunc;
            if (!cm) {return; }
            var path = editor.document.file.fullPath, keys;
            var folds = cm._lineFolds || _prefs.get(path), vp = cm.getViewport();
            cm._lineFolds = cm.getValidFolds(folds);
            _prefs.set(path, cm._lineFolds);
            Object.keys(cm._lineFolds).forEach(function (line) {
                cm.foldCode(+line);
            });
        }
    }
	
    /**Saves the line folds in the editor using the preference storage**/
    function saveLineFolds(editor) {
		var saveFolds = _prefs.getSetting("saveFoldStates");
        if (!editor || !saveFolds) { return; }
		var folds = editor._codeMirror._lineFolds || {};
		var path = editor.document.file.fullPath;
		if (Object.keys(folds).length) {
			_prefs.set(path, folds);
		} else {
			_prefs.set(path, undefined);
		}
    }
    
    function onGutterClick(cm, line, gutter, event) {
        var opts = cm.state.foldGutter.options, pos = CodeMirror.Pos(line);
        if (gutter !== opts.gutter) { return; }
        var editor = EditorManager.getActiveEditor(), range, i;
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
		Collapses all custom regions defined in the current editor
	*/
	function collapseCustomRegions() {
		var editor = EditorManager.getFocusedEditor();
		if (editor) {
			var cm = editor._codeMirror, i = cm.firstLine();
			while (i < cm.lastLine()) {
				var range = cm.foldCode(i, {rangeFinder: regionFold});
				if (range) {
					i = range.to.line;
				} else {
					i++;
				}
			}
		}
	}
	
    /**
		Collapses the code region nearest the current cursor position.
		Nearest is found by searching from the current line and moving up the document until an
		opening code-folding region is found.
	 */
    function collapseCurrent() {
        var editor = EditorManager.getFocusedEditor();
        if (editor) {
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
    }
	/**
		Expands the code region at the current cursor position.
	*/
    function expandCurrent() {
        var editor = EditorManager.getFocusedEditor();
        if (editor) {
            var cursor = editor.getCursorPos(), cm = editor._codeMirror;
            cm.unfoldCode(cursor.line);
        }
    }
    /**
        Collapses all foldable regions in the current document. Folding is done up to a level 'n' 
        which is defined in the preferences. Levels refer to fold heirarchies e.g., for the following 
        code fragment, the function is level 1, the if statement is level 2 and the forEach is level 3
        
            function sample() {
                if (debug) {
                    logMessages.forEach(function (m) {
                        console.debug(m);
                    });
                }
            }
    */
    function collapseAll() {
        var editor = EditorManager.getFocusedEditor();
        if (editor && editor._codeMirror) {
            var i, cm = editor._codeMirror, range;
            CodeMirror.commands.foldToLevel(cm);
        }
    }
    /**
        Expands all folded regions in the current document
    */
    function expandAll() {
        var editor = EditorManager.getFocusedEditor();
        if (editor && editor._codeMirror) {
            var i, cm = editor._codeMirror;
            CodeMirror.commands.unfoldAll(cm);
        }
    }
	
	function registerHandlers(editor) {
		var cm = editor._codeMirror;
		if (cm) {
			var path = editor.document.file.fullPath, _lineFolds = _prefs.get(path);
            _lineFolds = _lineFolds || {};
            cm._lineFolds = _lineFolds;
            var gutters = cm.getOption("gutters").slice(0);
            var lnIndex = gutters.indexOf("CodeMirror-linenumbers");
            gutters.splice(lnIndex + 1, 0, gutterName);
            cm.setOption("gutters",  gutters);
            cm.setOption("foldGutter", {onGutterClick: onGutterClick});
   
            $(cm.getGutterElement()).on({
                mouseenter: function () {
                    if (_prefs.getSetting("fadeFoldButtons")) {
                        foldGutter.updateInViewport(cm);
                    }
                },
                mouseleave: function () {
                    if (_prefs.getSetting("fadeFoldButtons")) {
                        foldGutter.clearGutter(cm);
                    }
                }
            });
		}
	}
	
    function onActiveEditorChanged(event, current, previous) {
		if (current && current._codeMirror.getOption("gutters").indexOf(gutterName) === -1) {
			registerHandlers(current);
			restoreLineFolds(current);
		}
		if (previous) { saveLineFolds(previous); }
    }
	
    function saveBeforeClose() {
		saveLineFolds(EditorManager.getCurrentFullEditor());
	}
	
	function showSettingsDialog() {
		SettingsDialog.show(function () {
            var editor = EditorManager.getCurrentFullEditor();
            if (editor) {
                var cm = editor._codeMirror;
                if (_prefs.getSetting("fadeFoldButtons")) {
                    foldGutter.clearGutter(cm);
                } else {
                    foldGutter.updateInViewport(cm);
                }
            }
        });
	}
	
    $(EditorManager).on("activeEditorChange", onActiveEditorChanged);
    $(DocumentManager).on("documentRefreshed", function (event, doc) {
        //restore the folds for this document
        restoreLineFolds(doc._masterEditor);
    });
    
    $(ProjectManager).on("beforeProjectClose beforeAppClose", saveBeforeClose);
    
    CommandManager.register(Strings.CODE_FOLDING_SETTINGS + "...", CODE_FOLDING_SETTINGS, showSettingsDialog);
    CommandManager.register(Strings.COLLAPSE_ALL, COLLAPSE_ALL, collapseAll);
    CommandManager.register(Strings.EXPAND_ALL, EXPAND_ALL, expandAll);
	
	CommandManager.register(Strings.COLLAPSE_CUSTOM_REGIONS, COLLAPSE_CUSTOM_REGIONS, collapseCustomRegions);

    CommandManager.register(Strings.COLLAPSE_CURRENT, COLLAPSE, collapseCurrent);
    CommandManager.register(Strings.EXPAND_CURRENT, EXPAND, expandCurrent);
    
	Menus.getMenu(Menus.AppMenuBar.VIEW_MENU).addMenuDivider();
	Menus.getMenu(Menus.AppMenuBar.VIEW_MENU).addMenuItem(CODE_FOLDING_SETTINGS);
	Menus.getMenu(Menus.AppMenuBar.VIEW_MENU).addMenuItem(COLLAPSE);
	Menus.getMenu(Menus.AppMenuBar.VIEW_MENU).addMenuItem(EXPAND);
	Menus.getMenu(Menus.AppMenuBar.VIEW_MENU).addMenuItem(COLLAPSE_ALL);
	Menus.getMenu(Menus.AppMenuBar.VIEW_MENU).addMenuItem(EXPAND_ALL);
	Menus.getMenu(Menus.AppMenuBar.VIEW_MENU).addMenuItem(COLLAPSE_CUSTOM_REGIONS);

    KeyBindingManager.addBinding(COLLAPSE, "Ctrl-Alt-C");
    KeyBindingManager.addBinding(EXPAND, "Ctrl-Alt-X");
    KeyBindingManager.addBinding(COLLAPSE_ALL, "Alt-1");
    KeyBindingManager.addBinding(EXPAND_ALL, "Shift-Alt-1");
});