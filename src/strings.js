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
     * Example: var formatted = brackets.string.format("Hello {0}", "World");
     *
     * @param {string} str The base string
     * @param {string} ... Arguments to be subsituted into the string
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
    s.OPEN_DIALOG_ERROR = "An error occured when showing the open file dialog. (error {0})";
    s.REQUEST_NATIVE_FILE_SYSTEM_ERROR = "An error occured when trying to load the directory '{0}'. (error {1})";
    s.READ_DIRECTORY_ENTRIES_ERROR = "An error occured when reading the contents of the directory '{0}'. (error {1})";
})();