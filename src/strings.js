/*
 * Copyright 2011 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false */

define(function (require, exports, module) {
    
    'use strict';
    
    /**
     * Format a string by replacing placeholder symbols with passed in arguments.
     *
     * Example: var formatted = Strings.format("Hello {0}", "World");
     *
     * @param {string} str The base string
     * @param {...} Arguments to be substituted into the string
     *
     * @return {string} Formatted string
     */
    function format(str) {
        // arguments[0] is the base string, so we need to adjust index values here
        var args = [].slice.call(arguments, 1);
        return str.replace(/\{(\d+)\}/g, function (match, num) {
            return typeof args[num] !== 'undefined' ? args[num] : match;
        });
    }

    
    // Define public API
    exports.format                            = format;
        
    // General file io error strings
    exports.GENERIC_ERROR                     = "(error {0})";
    exports.NOT_FOUND_ERR                     = "The file could not be found.";
    exports.NOT_READABLE_ERR                  = "The file could not be read.";
    exports.NO_MODIFICATION_ALLOWED_ERR       = "The target directory cannot be modified.";
    exports.NO_MODIFICATION_ALLOWED_ERR_FILE  = "The permissions do not allow you to make modifications.";

    // Project error strings
    exports.ERROR_LOADING_PROJECT             = "Error loading project";
    exports.OPEN_DIALOG_ERROR                 = "An error occurred when showing the open file dialog. (error {0})";
    exports.REQUEST_NATIVE_FILE_SYSTEM_ERROR  = "An error occurred when trying to load the directory \"{0}\". (error {1})";
    exports.READ_DIRECTORY_ENTRIES_ERROR      = "An error occurred when reading the contents of the directory \"{0}\". (error {1})";

    // File open/save error string
    exports.ERROR_OPENING_FILE_TITLE          = "Error opening file";
    exports.ERROR_OPENING_FILE                = "An error occurred when trying to open the file \"{0}\". {1}";
    exports.ERROR_SAVING_FILE_TITLE           = "Error saving file";
    exports.ERROR_SAVING_FILE                 = "An error occurred when trying to save the file \"{0}\". {1}";
    exports.INVALID_FILENAME_TITLE            = "Invalid file name";
    exports.INVALID_FILENAME_MESSAGE          = "Filenames cannot contain the following characters: /?*:;{}<>\\|";
    exports.FILE_ALREADY_EXISTS               = "The file \"{0}\" already exists.";
    exports.ERROR_CREATING_FILE_TITLE         = "Error creating file";
    exports.ERROR_CREATING_FILE               = "An error occurred when trying to create the file \"{0}\". {1}";

    exports.SAVE_CLOSE_TITLE                  = "Save Changes";
    exports.SAVE_CLOSE_MESSAGE                = "Do you want to save the changes you made in the document \"{0}\"?";
    exports.SAVE_CLOSE_MULTI_MESSAGE          = "Do you want to save your changes to the following files?";
    exports.EXT_MODIFIED_TITLE                = "External Changes";
    exports.EXT_MODIFIED_MESSAGE              = "The following file was modified on disk, but also has unsaved changes in Brackets:"
                                                + "<br><b>{0}</b><br><br>"
                                                + "Do you want to save your changes and overwrite the version on disk, or discard "
                                                + "your changes and reload the new version from disk?";
    exports.EXT_DELETED_MESSAGE               =  "The following file was deleted on disk, but also has unsaved changes in Brackets:"
                                                + "<br><b>{0}</b><br><br>"
                                                + "Do you want to save your changes and recreate the file on disk, or discard "
                                                + "your changes and close the editor?";
    
    exports.OPEN_FILE                         = "Open File";
});
