/*
 * Copyright 2011 Adobe Systems Incorporated. All Rights Reserved.
 */

if (!brackets.strings)
    brackets.strings = {};

(function() {
    var s = brackets.strings;

    /**
     * Format a string by replacing placeholder symbols with passed in arguments.
     *
     * Example: var formatted = brackets.strings.format("Hello {0}", "World");
     *
     * @param {string} str The base string
     * @param {string} ... Arguments to be substituted into the string
     *
     * @return {string} Formatted string
     */
    s.format = function(str) {
        var args = arguments;
        return str.replace(/{(\d+)}/g, function(match, num) {
            // args[0] is the string, so we need to adjust index values here
            // "num" is a string
            var i = Number(num);
            return typeof args[i + 1] !== 'undefined' ? args[i + 1] : match;
        });
    }
    
    // General file io error strings
    s.GENERIC_ERROR = "(error {0})";
    s.NOT_FOUND_ERR = "The file could not be found.";
    s.NOT_READABLE_ERR = "The file could not be read.";
    s.NO_MODIFICATION_ALLOWED_ERR = "The target directory cannot be modified.";
    
    // Project error strings
    s.ERROR_LOADING_PROJECT = "Error loading project";
    s.OPEN_DIALOG_ERROR = "An error occurred when showing the open file dialog. (error {0})";
    s.REQUEST_NATIVE_FILE_SYSTEM_ERROR = "An error occurred when trying to load the directory \"{0}\". (error {1})";
    s.READ_DIRECTORY_ENTRIES_ERROR = "An error occurred when reading the contents of the directory \"{0}\". (error {1})";
    
    // File open/save error string
    s.ERROR_OPENING_FILE_TITLE = "Error opening file";
    s.ERROR_OPENING_FILE = "An error occurred when trying to open the file \"{0}\". {1}";
    s.ERROR_SAVING_FILE_TITLE = "Error saving file";
    s.ERROR_SAVING_FILE = "An error occurred when trying to save the file \"{0}\". {1}";
    s.INVALID_FILENAME_TITLE = "Invalid file name";
    s.INVALID_FILENAME_MESSAGE = "Filenames cannot contain the following characters: /?*:;{}\\]+";
    s.FILE_ALREADY_EXISTS = "The file \"{0}\" already exists.";
    
    s.SAVE_CLOSE_TITLE = "Save Changes";
    s.SAVE_CLOSE_MESSAGE = "Do you want to save the changes you made in the document \"{0}\"?";
    
    s.OPEN_FILE = "Open File";
})();