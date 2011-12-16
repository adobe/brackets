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
    
    // Project error strings
    s.ERROR_LOADING_PROJECT = "Error loading project";
    s.OPEN_DIALOG_ERROR = "An error occurred when showing the open file dialog. (error {0})";
    s.REQUEST_NATIVE_FILE_SYSTEM_ERROR = "An error occurred when trying to load the directory \"{0}\". (error {1})";
    s.READ_DIRECTORY_ENTRIES_ERROR = "An error occurred when reading the contents of the directory \"{0}\". (error {1})";
    
    s.SAVE_CLOSE_TITLE = "Save Changes";
    s.SAVE_CLOSE_MESSAGE = "Do you want to save the changes you made in the document \"{0}\"?";
})();