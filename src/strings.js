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
    
    'use strict';
        
    // General file io error strings
    exports.GENERIC_ERROR                     = "(error {0})";
    exports.NOT_FOUND_ERR                     = "The file could not be found.";
    exports.NOT_READABLE_ERR                  = "The file could not be read.";
    exports.NO_MODIFICATION_ALLOWED_ERR       = "The target directory cannot be modified.";
    exports.NO_MODIFICATION_ALLOWED_ERR_FILE  = "The permissions do not allow you to make modifications.";

    // Project error strings
    exports.ERROR_LOADING_PROJECT             = "Error loading project";
    exports.OPEN_DIALOG_ERROR                 = "An error occurred when showing the open file dialog. (error {0})";
    exports.REQUEST_NATIVE_FILE_SYSTEM_ERROR  = "An error occurred when trying to load the directory <span class='dialog-filename'>{0}</span>. (error {1})";
    exports.READ_DIRECTORY_ENTRIES_ERROR      = "An error occurred when reading the contents of the directory <span class='dialog-filename'>{0}</span>. (error {1})";

    // File open/save error string
    exports.ERROR_OPENING_FILE_TITLE          = "Error opening file";
    exports.ERROR_OPENING_FILE                = "An error occurred when trying to open the file <span class='dialog-filename'>{0}</span>. {1}";
    exports.ERROR_RELOADING_FILE_TITLE        = "Error reloading changes from disk";
    exports.ERROR_RELOADING_FILE              = "An error occurred when trying to reload the file <span class='dialog-filename'>{0}</span>. {1}";
    exports.ERROR_SAVING_FILE_TITLE           = "Error saving file";
    exports.ERROR_SAVING_FILE                 = "An error occurred when trying to save the file <span class='dialog-filename'>{0}</span>. {1}";
    exports.INVALID_FILENAME_TITLE            = "Invalid file name";
    exports.INVALID_FILENAME_MESSAGE          = "Filenames cannot contain the following characters: /?*:;{}<>\\|";
    exports.FILE_ALREADY_EXISTS               = "The file <span class='dialog-filename'>{0}</span> already exists.";
    exports.ERROR_CREATING_FILE_TITLE         = "Error creating file";
    exports.ERROR_CREATING_FILE               = "An error occurred when trying to create the file <span class='dialog-filename'>{0}</span>. {1}";

    // Application error strings
    exports.ERROR_BRACKETS_IN_BROWSER_TITLE   = "Oops! Brackets doesn't run in browsers yet.";
    exports.ERROR_BRACKETS_IN_BROWSER         = "Brackets is built in HTML, but right now it runs as a desktop app so you can use it to edit local files. Please use the application shell in the <b>github.com/adobe/brackets-app</b> repo to run Brackets.";

    // FileIndexManager error string
    exports.ERROR_MAX_FILES_TITLE             = "Error Indexing Files";
    exports.ERROR_MAX_FILES                   = "The maximum number of files have been indexed. Actions that look up files in the index may function incorrectly.";
    
    // CSSManager error strings
    exports.ERROR_PARSE_TITLE                 = "Error parsing CSS file(s):";

    // Live Development error strings
    exports.ERROR_LAUNCHING_BROWSER_TITLE     = "Error launching browser";
    exports.ERROR_CANT_FIND_CHROME            = "The Google Chrome browser could not be found. Please make sure it is installed.";
    exports.ERROR_LAUNCHING_BROWSER           = "An error occurred when launching the browser. (error {0})";
    
    exports.LIVE_DEVELOPMENT_ERROR_TITLE      = "Live Development Error";
    exports.LIVE_DEVELOPMENT_ERROR_MESSAGE    = "A live development connection to Chrome could not be established. "
                                                + "For live development to work, Chrome needs to be started with remote debugging enabled."
                                                + "<br><br>Would you like to relaunch Chrome and enable remote debugging?";
    exports.LIVE_DEV_NEED_HTML_MESSAGE        = "Open an HTML file in order to launch live preview.";
    
    exports.LIVE_DEV_STATUS_TIP_NOT_CONNECTED = "Live File Preview";
    exports.LIVE_DEV_STATUS_TIP_PROGRESS1     = "Live File Preview: Connecting...";
    exports.LIVE_DEV_STATUS_TIP_PROGRESS2     = "Live File Preview: Initializing...";
    exports.LIVE_DEV_STATUS_TIP_CONNECTED     = "Disconnect Live File Preview";
    
    exports.SAVE_CLOSE_TITLE                  = "Save Changes";
    exports.SAVE_CLOSE_MESSAGE                = "Do you want to save the changes you made in the document <span class='dialog-filename'>{0}</span>?";
    exports.SAVE_CLOSE_MULTI_MESSAGE          = "Do you want to save your changes to the following files?";
    exports.EXT_MODIFIED_TITLE                = "External Changes";
    exports.EXT_MODIFIED_MESSAGE              = "<span class='dialog-filename'>{0}</span> has been modified on disk, but also has unsaved changes in Brackets."
                                                + "<br><br>"
                                                + "Which version do you want to keep?";
    exports.EXT_DELETED_MESSAGE               = "<span class='dialog-filename'>{0}</span> has been deleted on disk, but has unsaved changes in Brackets."
                                                + "<br><br>"
                                                + "Do you want to keep your changes?";
    
    exports.OPEN_FILE                         = "Open File";



    /**
     * Command Name Constants
     *
    */

    // File menu commands
    exports.FILE_MENU                           = "File";
    exports.CMD_FILE_NEW                        = "New";
    exports.CMD_FILE_OPEN                       = "Open\u2026";
    exports.CMD_ADD_TO_WORKING_SET              = "Add To Working Set";
    exports.CMD_OPEN_FOLDER                     = "Open Folder\u2026";
    exports.CMD_FILE_CLOSE                      = "Close";
    exports.CMD_FILE_CLOSE_ALL                  = "Close All";
    exports.CMD_FILE_SAVE                       = "Save";
    exports.CMD_LIVE_FILE_PREVIEW               = "Live File Preview";
    exports.CMD_QUIT                            = "Quit";

    // Edit menu commands
    exports.EDIT_MENU                           = "Edit";
    exports.CMD_SELECT_ALL                      = "Select All";
    exports.CMD_FIND                            = "Find";
    exports.CMD_FIND_IN_FILES                   = "Find in Files";
    exports.CMD_FIND_NEXT                       = "Find Next";
    exports.CMD_FIND_PREVIOUS                   = "Find Previous";
    exports.CMD_REPLACE                         = "Replace";
    exports.CMD_DUPLICATE                       = "Duplicate";
    exports.CMD_COMMENT                         = "Comment/Uncomment Lines";
     
    // View menu commands
    exports.VIEW_MENU                           = "View";
    exports.CMD_HIDE_SIDEBAR                    = "Hide Sidebar";
    exports.CMD_SHOW_SIDEBAR                    = "Show Sidebar";
    exports.CMD_INCREASE_FONT_SIZE              = "Increase Font Size";
    exports.CMD_DECREASE_FONT_SIZE              = "Decrease Font Size";

    // Navigate menu Commands
    exports.NAVIGATE_MENU                       = "Navigate";
    exports.CMD_QUICK_OPEN                      = "Quick Open";
    exports.CMD_GOTO_LINE                       = "Go to Line";
    exports.CMD_GOTO_DEFINITION                 = "Go to Definition";
    exports.CMD_SHOW_INLINE_EDITOR              = "Quick Edit";
    exports.CMD_QUICK_EDIT_PREV_MATCH           = "Previous Match";
    exports.CMD_QUICK_EDIT_NEXT_MATCH           = "Next Match";
    exports.CMD_NEXT_DOC                        = "Next Document";
    exports.CMD_PREV_DOC                        = "Previous Document";
    
    // Debug menu commands
    exports.DEBUG_MENU                          = "Debug";
    exports.CMD_REFRESH_WINDOW                  = "Reload Window";
    exports.CMD_CLOSE_WINDOW                    = "Close Window";
    exports.CMD_SHOW_DEV_TOOLS                  = "Show Developer Tools";
    exports.CMD_RUN_UNIT_TESTS                  = "Run Tests";
    exports.CMD_JSLINT                          = "Enable JSLint";
    exports.CMD_SHOW_PERF_DATA                  = "Show Perf Data";
    exports.CMD_EXPERIMENTAL                    = "Experimental";
    exports.CMD_NEW_BRACKETS_WINDOW             = "New Window";
    exports.CMD_CLOSE_ALL_LIVE_BROWSERS         = "Close Browsers";
    exports.CMD_USE_TAB_CHARS                   = "Use Tab Characters";

    // Help menu commands
    exports.CMD_ABOUT                           = "About";

});
