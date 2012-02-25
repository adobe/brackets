/*
 * Copyright 2012 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define: false, $: false, FileError: false, brackets: false */

/**
 * Set of utilites for working with files and text content.
 */
define(function (require, exports, module) {
    'use strict';
    
    var NativeFileSystem    = require("NativeFileSystem").NativeFileSystem,
        Strings             = require("strings");
    
    /**
     * Asynchronously reads a file as UTF-8 encoded text.
     * @return {Deferred} a jQuery Deferred that will be resolved with the 
     *  file's text content plus its timestamp, or rejected with a FileError if
     *  the file can not be read.
     */
    function readAsText(fileEntry) {
        var result = new $.Deferred(),
            reader = new NativeFileSystem.FileReader();

        fileEntry.file(function (file) {
            reader.onload = function (event) {
                var text = event.target.result;
                
                fileEntry.getMetadata(
                    function (metadata) {
                        result.resolve(text, metadata.modificationTime);
                    },
                    function (error) {
                        result.reject(error);
                    }
                );
            };

            reader.onerror = function (event) {
                result.reject(event.target.error);
            };

            reader.readAsText(file, "utf8");
        });

        return result;
    }

    /** @const */
    var LINE_ENDINGS_CRLF = "CRLF";
    /** @const */
    var LINE_ENDINGS_LF = "LF";
    
    /**
     * Returns the standard line endings for the current platform
     * @return {LINE_ENDINGS_CRLF|LINE_ENDINGS_LF}
     */
    function getPlatformLineEndings() {
        return brackets.platform === "win" ? LINE_ENDINGS_CRLF : LINE_ENDINGS_LF;
    }
    
    /**
     * Scans the first 1000 chars of the text to determine how it encodes line endings. Returns
     * null if usage is mixed or if no line endings found.
     * @param {!string} text
     * @return {null|LINE_ENDINGS_CRLF|LINE_ENDINGS_LF}
     */
    function sniffLineEndings(text) {
        var subset = text.substr(0, 1000);  // (length is clipped to text.length)
        var hasCRLF = /\r\n/.test(subset);
        var hasLF = /[^\r]\n/.test(subset);
        
        if ((hasCRLF && hasLF) || (!hasCRLF && !hasLF)) {
            return null;
        } else {
            return hasCRLF ? LINE_ENDINGS_CRLF : LINE_ENDINGS_LF;
        }
    }

    function getFileErrorString(code) {
        // There are a few error codes that we have specific error messages for. The rest are
        // displayed with a generic "(error N)" message.
        var result;

        if (code === FileError.NOT_FOUND_ERR) {
            result = Strings.NOT_FOUND_ERR;
        } else if (code === FileError.NOT_READABLE_ERR) {
            result = Strings.NOT_READABLE_ERR;
        } else if (code === FileError.NO_MODIFICATION_ALLOWED_ERR) {
            result = Strings.NO_MODIFICATION_ALLOWED_ERR_FILE;
        } else {
            result = Strings.format(Strings.GENERIC_ERROR, code);
        }

        return result;
    }
    
    function showFileOpenError(code, path) {
        return brackets.showModalDialog(
            brackets.DIALOG_ID_ERROR,
            Strings.ERROR_OPENING_FILE_TITLE,
            Strings.format(
                Strings.ERROR_OPENING_FILE,
                path,
                getFileErrorString(code)
            )
        );
    }

    // Define public API
    exports.LINE_ENDINGS_CRLF        = LINE_ENDINGS_CRLF;
    exports.LINE_ENDINGS_LF          = LINE_ENDINGS_LF;
    exports.getPlatformLineEndings   = getPlatformLineEndings;
    exports.sniffLineEndings         = sniffLineEndings;
    exports.showFileOpenError        = showFileOpenError;
    exports.getFileErrorString       = getFileErrorString;
    exports.readAsText               = readAsText;
});