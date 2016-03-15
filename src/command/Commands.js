/*
 * Copyright (c) 2012 - present Adobe Systems Incorporated. All rights reserved.
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


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define */

define(function (require, exports, module) {
    "use strict";

    var DeprecationWarning = require("utils/DeprecationWarning");

    /**
     * List of constants for global command IDs.
     */

    // FILE
    exports.FILE_NEW_UNTITLED           = "file.newDoc";                // DocumentCommandHandlers.js   handleFileNew()
    exports.FILE_NEW                    = "file.newFile";               // DocumentCommandHandlers.js   handleFileNewInProject()
    exports.FILE_NEW_FOLDER             = "file.newFolder";             // DocumentCommandHandlers.js   handleNewFolderInProject()
    exports.FILE_OPEN                   = "file.open";                  // DocumentCommandHandlers.js   handleDocumentOpen()
    exports.FILE_OPEN_FOLDER            = "file.openFolder";            // ProjectManager.js            openProject()
    exports.FILE_SAVE                   = "file.save";                  // DocumentCommandHandlers.js   handleFileSave()
    exports.FILE_SAVE_ALL               = "file.saveAll";               // DocumentCommandHandlers.js   handleFileSaveAll()
    exports.FILE_SAVE_AS                = "file.saveAs";                // DocumentCommandHandlers.js   handleFileSaveAs()
    exports.FILE_CLOSE                  = "file.close";                 // DocumentCommandHandlers.js   handleFileClose()
    exports.FILE_CLOSE_ALL              = "file.close_all";             // DocumentCommandHandlers.js   handleFileCloseAll()
    exports.FILE_CLOSE_LIST             = "file.close_list";            // DocumentCommandHandlers.js   handleFileCloseList()
    exports.FILE_OPEN_DROPPED_FILES     = "file.openDroppedFiles";      // DragAndDrop.js               openDroppedFiles()
    exports.FILE_LIVE_FILE_PREVIEW      = "file.liveFilePreview";       // LiveDevelopment/main.js      _handleGoLiveCommand()
    exports.TOGGLE_LIVE_PREVIEW_MB_MODE = "file.toggleLivePreviewMB";   // LiveDevelopment/main.js      _toggleLivePreviewMultiBrowser()
    exports.CMD_RELOAD_LIVE_PREVIEW     = "file.reloadLivePreview";     // LiveDevelopment/main.js      _handleReloadLivePreviewCommand()
    exports.FILE_LIVE_HIGHLIGHT         = "file.previewHighlight";      // LiveDevelopment/main.js      _handlePreviewHighlightCommand()
    exports.FILE_PROJECT_SETTINGS       = "file.projectSettings";       // ProjectManager.js            _projectSettings()
    exports.FILE_RENAME                 = "file.rename";                // DocumentCommandHandlers.js   handleFileRename()
    exports.FILE_DELETE                 = "file.delete";                // DocumentCommandHandlers.js   handleFileDelete()
    exports.FILE_EXTENSION_MANAGER      = "file.extensionManager";      // ExtensionManagerDialog.js    _showDialog()
    exports.FILE_REFRESH                = "file.refresh";               // ProjectManager.js            refreshFileTree()
    exports.FILE_OPEN_PREFERENCES       = "file.openPreferences";       // PreferencesManager.js        _handleOpenPreferences()
    exports.FILE_OPEN_KEYMAP            = "file.openKeyMap";            // KeyBindingManager.js         _openUserKeyMap()

    // File shell callbacks - string must MATCH string in native code (appshell/command_callbacks.h)
    exports.FILE_CLOSE_WINDOW           = "file.close_window";          // DocumentCommandHandlers.js   handleFileCloseWindow()
    exports.FILE_QUIT                   = "file.quit";                  // DocumentCommandHandlers.js   handleFileQuit()

    // EDIT
    // File shell callbacks - string must MATCH string in native code (appshell/command_callbacks.h)
    exports.EDIT_UNDO                   = "edit.undo";                  // EditorCommandHandlers.js     handleUndo()
    exports.EDIT_REDO                   = "edit.redo";                  // EditorCommandHandlers.js     handleRedo()
    exports.EDIT_CUT                    = "edit.cut";                   // EditorCommandHandlers.js     ignoreCommand()
    exports.EDIT_COPY                   = "edit.copy";                  // EditorCommandHandlers.js     ignoreCommand()
    exports.EDIT_PASTE                  = "edit.paste";                 // EditorCommandHandlers.js     ignoreCommand()
    exports.EDIT_SELECT_ALL             = "edit.selectAll";             // EditorCommandHandlers.js     _handleSelectAll()

    exports.EDIT_SELECT_LINE            = "edit.selectLine";            // EditorCommandHandlers.js     selectLine()
    exports.EDIT_SPLIT_SEL_INTO_LINES   = "edit.splitSelIntoLines";     // EditorCommandHandlers.js     splitSelIntoLines()
    exports.EDIT_ADD_CUR_TO_NEXT_LINE   = "edit.addCursorToNextLine";   // EditorCommandHandlers.js     addCursorToNextLine()
    exports.EDIT_ADD_CUR_TO_PREV_LINE   = "edit.addCursorToPrevLine";   // EditorCommandHandlers.js     addCursorToPrevLine()
    exports.EDIT_INDENT                 = "edit.indent";                // EditorCommandHandlers.js     indentText()
    exports.EDIT_UNINDENT               = "edit.unindent";              // EditorCommandHandlers.js     unindentText()
    exports.EDIT_DUPLICATE              = "edit.duplicate";             // EditorCommandHandlers.js     duplicateText()
    exports.EDIT_DELETE_LINES           = "edit.deletelines";           // EditorCommandHandlers.js     deleteCurrentLines()
    exports.EDIT_LINE_COMMENT           = "edit.lineComment";           // EditorCommandHandlers.js     lineComment()
    exports.EDIT_BLOCK_COMMENT          = "edit.blockComment";          // EditorCommandHandlers.js     blockComment()
    exports.EDIT_LINE_UP                = "edit.lineUp";                // EditorCommandHandlers.js     moveLineUp()
    exports.EDIT_LINE_DOWN              = "edit.lineDown";              // EditorCommandHandlers.js     moveLineDown()
    exports.EDIT_OPEN_LINE_ABOVE        = "edit.openLineAbove";         // EditorCommandHandlers.js     openLineAbove()
    exports.EDIT_OPEN_LINE_BELOW        = "edit.openLineBelow";         // EditorCommandHandlers.js     openLineBelow()
    exports.TOGGLE_CLOSE_BRACKETS       = "edit.autoCloseBrackets";     // EditorOptionHandlers.js      _getToggler()
    exports.SHOW_CODE_HINTS             = "edit.showCodeHints";         // CodeHintManager.js           _startNewSession()

    // FIND
    exports.CMD_FIND                    = "cmd.find";                   // FindReplace.js               _launchFind()
    exports.CMD_FIND_IN_FILES           = "cmd.findInFiles";            // FindInFilesUI.js             _showFindBar()
    exports.CMD_FIND_IN_SUBTREE         = "cmd.findInSubtree";          // FindInFilesUI.js             _showFindBarForSubtree()
    exports.CMD_FIND_NEXT               = "cmd.findNext";               // FindReplace.js               _findNext()
    exports.CMD_FIND_PREVIOUS           = "cmd.findPrevious";           // FindReplace.js               _findPrevious()
    exports.CMD_FIND_ALL_AND_SELECT     = "cmd.findAllAndSelect";       // FindReplace.js               _findAllAndSelect()
    exports.CMD_ADD_NEXT_MATCH          = "cmd.addNextMatch";           // FindReplace.js               _expandAndAddNextToSelection()
    exports.CMD_SKIP_CURRENT_MATCH      = "cmd.skipCurrentMatch";       // FindReplace.js               _skipCurrentMatch()
    exports.CMD_REPLACE                 = "cmd.replace";                // FindReplace.js               _replace()
    exports.CMD_REPLACE_IN_FILES        = "cmd.replaceInFiles";         // FindInFilesUI.js             _showReplaceBar()
    exports.CMD_REPLACE_IN_SUBTREE      = "cmd.replaceInSubtree";       // FindInFilesUI.js             _showReplaceBarForSubtree()

    // VIEW
    exports.CMD_THEMES_OPEN_SETTINGS    = "view.themesOpenSetting";     // MenuCommands.js              Settings.open()
    exports.VIEW_HIDE_SIDEBAR           = "view.toggleSidebar";         // SidebarView.js               toggle()
    exports.VIEW_INCREASE_FONT_SIZE     = "view.increaseFontSize";      // ViewCommandHandlers.js       _handleIncreaseFontSize()
    exports.VIEW_DECREASE_FONT_SIZE     = "view.decreaseFontSize";      // ViewCommandHandlers.js       _handleDecreaseFontSize()
    exports.VIEW_RESTORE_FONT_SIZE      = "view.restoreFontSize";       // ViewCommandHandlers.js       _handleRestoreFontSize()
    exports.VIEW_SCROLL_LINE_UP         = "view.scrollLineUp";          // ViewCommandHandlers.js       _handleScrollLineUp()
    exports.VIEW_SCROLL_LINE_DOWN       = "view.scrollLineDown";        // ViewCommandHandlers.js       _handleScrollLineDown()
    exports.VIEW_TOGGLE_INSPECTION      = "view.toggleCodeInspection";  // CodeInspection.js            toggleEnabled()
    exports.TOGGLE_LINE_NUMBERS         = "view.toggleLineNumbers";     // EditorOptionHandlers.js      _getToggler()
    exports.TOGGLE_ACTIVE_LINE          = "view.toggleActiveLine";      // EditorOptionHandlers.js      _getToggler()
    exports.TOGGLE_WORD_WRAP            = "view.toggleWordWrap";        // EditorOptionHandlers.js      _getToggler()

    exports.CMD_OPEN                        = "cmd.open";
    exports.CMD_ADD_TO_WORKINGSET_AND_OPEN  = "cmd.addToWorkingSetAndOpen";          // DocumentCommandHandlers.js   handleOpenDocumentInNewPane()

    // NAVIGATE
    exports.NAVIGATE_NEXT_DOC           = "navigate.nextDoc";           // DocumentCommandHandlers.js   handleGoNextDoc()
    exports.NAVIGATE_PREV_DOC           = "navigate.prevDoc";           // DocumentCommandHandlers.js   handleGoPrevDoc()
    exports.NAVIGATE_NEXT_DOC_LIST_ORDER    = "navigate.nextDocListOrder";           // DocumentCommandHandlers.js   handleGoNextDocListOrder()
    exports.NAVIGATE_PREV_DOC_LIST_ORDER    = "navigate.prevDocListOrder";           // DocumentCommandHandlers.js   handleGoPrevDocListOrder()
    exports.NAVIGATE_SHOW_IN_FILE_TREE  = "navigate.showInFileTree";    // DocumentCommandHandlers.js   handleShowInTree()
    exports.NAVIGATE_SHOW_IN_OS         = "navigate.showInOS";          // DocumentCommandHandlers.js   handleShowInOS()
    exports.NAVIGATE_QUICK_OPEN         = "navigate.quickOpen";         // QuickOpen.js                 doFileSearch()
    exports.NAVIGATE_JUMPTO_DEFINITION  = "navigate.jumptoDefinition";  // EditorManager.js             _doJumpToDef()
    exports.NAVIGATE_GOTO_DEFINITION    = "navigate.gotoDefinition";    // QuickOpen.js                 doDefinitionSearch()
    exports.NAVIGATE_GOTO_LINE          = "navigate.gotoLine";          // QuickOpen.js                 doGotoLine()
    exports.NAVIGATE_GOTO_FIRST_PROBLEM = "navigate.gotoFirstProblem";  // CodeInspection.js            handleGotoFirstProblem()
    exports.TOGGLE_QUICK_EDIT           = "navigate.toggleQuickEdit";   // EditorManager.js             _toggleInlineWidget()
    exports.TOGGLE_QUICK_DOCS           = "navigate.toggleQuickDocs";   // EditorManager.js             _toggleInlineWidget()
    exports.QUICK_EDIT_NEXT_MATCH       = "navigate.nextMatch";         // MultiRangeInlineEditor.js    _nextRange()
    exports.QUICK_EDIT_PREV_MATCH       = "navigate.previousMatch";     // MultiRangeInlineEditor.js    _previousRange()
    exports.CSS_QUICK_EDIT_NEW_RULE     = "navigate.newRule";           // CSSInlineEditor.js           _handleNewRule()

    // HELP
    exports.HELP_CHECK_FOR_UPDATE       = "help.checkForUpdate";        // HelpCommandHandlers.js       _handleCheckForUpdates()
    exports.HELP_HOW_TO_USE_BRACKETS    = "help.howToUseBrackets";      // HelpCommandHandlers.js       _handleLinkMenuItem()
    exports.HELP_SUPPORT                = "help.support";               // HelpCommandHandlers.js       _handleLinkMenuItem()
    exports.HELP_SUGGEST                = "help.suggest";               // HelpCommandHandlers.js       _handleLinkMenuItem()
    exports.HELP_RELEASE_NOTES          = "help.releaseNotes";          // HelpCommandHandlers.js       _handleLinkMenuItem()
    exports.HELP_GET_INVOLVED           = "help.getInvolved";           // HelpCommandHandlers.js       _handleLinkMenuItem()
    exports.HELP_SHOW_EXT_FOLDER        = "help.showExtensionsFolder";  // HelpCommandHandlers.js       _handleShowExtensionsFolder()
    exports.HELP_HOMEPAGE               = "help.homepage";              // HelpCommandHandlers.js       _handleLinkMenuItem()
    exports.HELP_TWITTER                = "help.twitter";               // HelpCommandHandlers.js       _handleLinkMenuItem()

    // Working Set Configuration
    exports.CMD_WORKINGSET_SORT_BY_ADDED  = "cmd.sortWorkingSetByAdded";     // WorkingSetSort.js       _handleSort()
    exports.CMD_WORKINGSET_SORT_BY_NAME   = "cmd.sortWorkingSetByName";      // WorkingSetSort.js       _handleSort()
    exports.CMD_WORKINGSET_SORT_BY_TYPE   = "cmd.sortWorkingSetByType";      // WorkingSetSort.js       _handleSort()
    exports.CMD_WORKING_SORT_TOGGLE_AUTO  = "cmd.sortWorkingSetToggleAuto";  // WorkingSetSort.js       _handleToggleAutoSort()

    // Split View
    exports.CMD_SPLITVIEW_NONE          = "cmd.splitViewNone";          // SidebarView.js               _handleSplitNone()
    exports.CMD_SPLITVIEW_VERTICAL      = "cmd.splitViewVertical";      // SidebarView.js               _handleSplitVertical()
    exports.CMD_SPLITVIEW_HORIZONTAL    = "cmd.splitViewHorizontal";    // SidebarView.js               _handleSplitHorizontal()

    // File shell callbacks - string must MATCH string in native code (appshell/command_callbacks.h)
    exports.HELP_ABOUT                  = "help.about";                 // HelpCommandHandlers.js       _handleAboutDialog()

    // APP
    exports.APP_RELOAD                  = "app.reload";                 // DocumentCommandHandlers.js   handleReload()
    exports.APP_RELOAD_WITHOUT_EXTS     = "app.reload_without_exts";    // DocumentCommandHandlers.js   handleReloadWithoutExts()

    // File shell callbacks - string must MATCH string in native code (appshell/command_callbacks.h)
    exports.APP_ABORT_QUIT              = "app.abort_quit";             // DocumentCommandHandlers.js   handleAbortQuit()
    exports.APP_BEFORE_MENUPOPUP        = "app.before_menupopup";       // DocumentCommandHandlers.js   handleBeforeMenuPopup()

    // ADD_TO_WORKING_SET is deprectated but we need a handler for it because the new command doesn't return the same result as the legacy command
    exports.FILE_ADD_TO_WORKING_SET     = "file.addToWorkingSet";       // Deprecated through DocumentCommandHandlers.js handleFileAddToWorkingSet

    // Show or Hide sidebar
    exports.HIDE_SIDEBAR                = "view.hideSidebar";           // SidebarView.js               hide()
    exports.SHOW_SIDEBAR                = "view.showSidebar";           // SidebarView.js               show()

    // DEPRECATED: Working Set Commands
    DeprecationWarning.deprecateConstant(exports, "SORT_WORKINGSET_BY_ADDED",   "CMD_WORKINGSET_SORT_BY_ADDED");
    DeprecationWarning.deprecateConstant(exports, "SORT_WORKINGSET_BY_NAME",    "CMD_WORKINGSET_SORT_BY_NAME");
    DeprecationWarning.deprecateConstant(exports, "SORT_WORKINGSET_BY_TYPE",    "CMD_WORKINGSET_SORT_BY_TYPE");
    DeprecationWarning.deprecateConstant(exports, "SORT_WORKINGSET_AUTO",       "CMD_WORKING_SORT_TOGGLE_AUTO");
});

