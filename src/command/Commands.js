/*
 * Copyright (c) 2012 Adobe Systems Incorporated. All rights reserved.
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
    
    /**
     * List of constants for global command IDs.
     */

    // FILE
    exports.FILE_NEW_UNTITLED           = "file.newDoc";                // DocumentCommandHandlers.js   handleFileNew()
    exports.FILE_NEW                    = "file.newFile";               // DocumentCommandHandlers.js   handleFileNewInProject()
    exports.FILE_NEW_FOLDER             = "file.newFolder";             // DocumentCommandHandlers.js   handleNewFolderInProject()
    exports.FILE_OPEN                   = "file.open";                  // DocumentCommandHandlers.js   handleFileOpen()
    exports.FILE_OPEN_FOLDER            = "file.openFolder";            // ProjectManager.js            openProject()
    exports.FILE_SAVE                   = "file.save";                  // DocumentCommandHandlers.js   handleFileSave()
    exports.FILE_SAVE_ALL               = "file.saveAll";               // DocumentCommandHandlers.js   handleFileSaveAll()
    exports.FILE_SAVE_AS                = "file.saveAs";                // DocumentCommandHandlers.js   handleFileSaveAs()
    exports.FILE_CLOSE                  = "file.close";                 // DocumentCommandHandlers.js   handleFileClose()
    exports.FILE_CLOSE_ALL              = "file.close_all";             // DocumentCommandHandlers.js   handleFileCloseAll()
    exports.FILE_CLOSE_LIST             = "file.close_list";            // DocumentCommandHandlers.js   handleFileCloseList()
    exports.FILE_ADD_TO_WORKING_SET     = "file.addToWorkingSet";       // DocumentCommandHandlers.js   handleFileAddToWorkingSet()
    exports.FILE_OPEN_DROPPED_FILES     = "file.openDroppedFiles";      // DragAndDrop.js               openDroppedFiles()
    exports.FILE_LIVE_FILE_PREVIEW      = "file.liveFilePreview";       // LiveDevelopment/main.js      _handleGoLiveCommand()
    exports.FILE_LIVE_HIGHLIGHT         = "file.previewHighlight";      // LiveDevelopment/main.js      _handlePreviewHighlightCommand()
    exports.FILE_PROJECT_SETTINGS       = "file.projectSettings";       // ProjectManager.js            _projectSettings()
    exports.FILE_RENAME                 = "file.rename";                // DocumentCommandHandlers.js   handleFileRename()
    exports.FILE_DELETE                 = "file.delete";                // DocumentCommandHandlers.js   handleFileDelete()
    exports.FILE_EXTENSION_MANAGER      = "file.extensionManager";      // ExtensionManagerDialog.js    _showDialog()
    exports.FILE_REFRESH                = "file.refresh";               // ProjectManager.js            refreshFileTree()
    
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
    exports.EDIT_FIND                   = "edit.find";                  // FindReplace.js               _launchFind()
    exports.EDIT_FIND_IN_FILES          = "edit.findInFiles";           // FindInFiles.js               _doFindInFiles()
    exports.EDIT_FIND_IN_SUBTREE        = "edit.findInSubtree";         // FindInFiles.js               _doFindInSubtree()
    exports.EDIT_FIND_NEXT              = "edit.findNext";              // FindReplace.js               _findNext()
    exports.EDIT_FIND_PREVIOUS          = "edit.findPrevious";          // FindReplace.js               _findPrevious()
    exports.EDIT_REPLACE                = "edit.replace";               // FindReplace.js               _replace()
    exports.EDIT_INDENT                 = "edit.indent";                // EditorCommandHandlers.js     indentText()
    exports.EDIT_UNINDENT               = "edit.unindent";              // EditorCommandHandlers.js     unidentText()
    exports.EDIT_DUPLICATE              = "edit.duplicate";             // EditorCommandHandlers.js     duplicateText()
    exports.EDIT_DELETE_LINES           = "edit.deletelines";           // EditorCommandHandlers.js     deleteCurrentLines()
    exports.EDIT_LINE_COMMENT           = "edit.lineComment";           // EditorCommandHandlers.js     lineComment()
    exports.EDIT_BLOCK_COMMENT          = "edit.blockComment";          // EditorCommandHandlers.js     blockComment()
    exports.EDIT_LINE_UP                = "edit.lineUp";                // EditorCommandHandlers.js     moveLineUp()
    exports.EDIT_LINE_DOWN              = "edit.lineDown";              // EditorCommandHandlers.js     moveLineDown()
    exports.EDIT_OPEN_LINE_ABOVE        = "edit.openLineAbove";         // EditorCommandHandlers.js     openLineAbove()
    exports.EDIT_OPEN_LINE_BELOW        = "edit.openLineBelow";         // EditorCommandHandlers.js     openLineBelow()
    exports.TOGGLE_CLOSE_BRACKETS       = "edit.autoCloseBrackets";     // EditorOptionHandlers.js      _toggleCloseBrackets()
    exports.SHOW_CODE_HINTS             = "edit.showCodeHints";         // CodeHintManager.js           _startNewSession()

    // VIEW
    exports.VIEW_HIDE_SIDEBAR           = "view.hideSidebar";           // SidebarView.js               toggle()
    exports.VIEW_INCREASE_FONT_SIZE     = "view.increaseFontSize";      // ViewCommandHandlers.js       _handleIncreaseFontSize()
    exports.VIEW_DECREASE_FONT_SIZE     = "view.decreaseFontSize";      // ViewCommandHandlers.js       _handleDecreaseFontSize()
    exports.VIEW_RESTORE_FONT_SIZE      = "view.restoreFontSize";       // ViewCommandHandlers.js       _handleRestoreFontSize()
    exports.VIEW_SCROLL_LINE_UP         = "view.scrollLineUp";          // ViewCommandHandlers.js       _handleScrollLineUp()
    exports.VIEW_SCROLL_LINE_DOWN       = "view.scrollLineDown";        // ViewCommandHandlers.js       _handleScrollLineDown()
    exports.VIEW_TOGGLE_INSPECTION      = "view.toggleCodeInspection";  // CodeInspection.js            toggleEnabled()
    exports.TOGGLE_LINE_NUMBERS         = "view.toggleLineNumbers";     // EditorOptionHandlers.js      _toggleLineNumbers()
    exports.TOGGLE_ACTIVE_LINE          = "view.toggleActiveLine";      // EditorOptionHandlers.js      _toggleActiveLine()
    exports.TOGGLE_WORD_WRAP            = "view.toggleWordWrap";        // EditorOptionHandlers.js      _toggleWordWrap()
    exports.SORT_WORKINGSET_BY_ADDED    = "view.sortWorkingSetByAdded"; // WorkingSetSort.js            _handleSortWorkingSetByAdded()
    exports.SORT_WORKINGSET_BY_NAME     = "view.sortWorkingSetByName";  // WorkingSetSort.js            _handleSortWorkingSetByName()
    exports.SORT_WORKINGSET_BY_TYPE     = "view.sortWorkingSetByType";  // WorkingSetSort.js            _handleSortWorkingSetByType()
    exports.SORT_WORKINGSET_AUTO        = "view.sortWorkingSetAuto";    // WorkingSetSort.js            _handleAutomaticSort()
    
    // NAVIGATE
    exports.NAVIGATE_NEXT_DOC           = "navigate.nextDoc";           // DocumentCommandHandlers.js   handleGoNextDoc()
    exports.NAVIGATE_PREV_DOC           = "navigate.prevDoc";           // DocumentCommandHandlers.js   handleGoPrevDoc()
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
    exports.HELP_FORUM                  = "help.forum";                 // HelpCommandHandlers.js       _handleLinkMenuItem()
    exports.HELP_RELEASE_NOTES          = "help.releaseNotes";          // HelpCommandHandlers.js       _handleLinkMenuItem()
    exports.HELP_REPORT_AN_ISSUE        = "help.reportAnIssue";         // HelpCommandHandlers.js       _handleLinkMenuItem()
    exports.HELP_SHOW_EXT_FOLDER        = "help.showExtensionsFolder";  // HelpCommandHandlers.js       _handleShowExtensionsFolder()
    exports.HELP_TWITTER                = "help.twitter";               // HelpCommandHandlers.js       _handleLinkMenuItem()
    
    // File shell callbacks - string must MATCH string in native code (appshell/command_callbacks.h)
    exports.HELP_ABOUT                  = "help.about";                 // HelpCommandHandlers.js       _handleAboutDialog()

    // APP
    exports.APP_RELOAD                  = "app.reload";                 // DocumentCommandHandlers.js   handleReload()
    exports.APP_RELOAD_WITHOUT_EXTS     = "app.reload_without_exts";    // DocumentCommandHandlers.js   handleReloadWithoutExts()
    
    // File shell callbacks - string must MATCH string in native code (appshell/command_callbacks.h)
    exports.APP_ABORT_QUIT              = "app.abort_quit";             // DocumentCommandHandlers.js   handleAbortQuit()
    exports.APP_BEFORE_MENUPOPUP        = "app.before_menupopup";       // DocumentCommandHandlers.js   handleBeforeMenuPopup()
});

