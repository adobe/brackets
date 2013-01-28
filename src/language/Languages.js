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
/*global define, $, brackets, CodeMirror, toString, window */

define(function (require, exports, module) {
    "use strict";
    
    
    // Dependencies
    var _defaultLanguagesJSON = require("text!language/languages.json");
    
    
    // State
    var _fallbackLanguage  = null,
        _languages         = {},
        _fileExtensionsMap = {},
        _modeMap           = {};
    
    
    // Helper functions
    
    /**
     * Checks whether value is an array. Optionally checks its contents, too.
     * Throws an exception in case of a validation error.
     * @param {*}                   value         The value to validate
     * @param {!string}             description   A helpful identifier for value
     * @param {function(*, !string) validateEntry A function to validate the array's entries with
     */
    function _validateArray(value, description, validateEntry) {
        var i, entry;
        if (!$.isArray(value)) {
            throw new Error(description + " must be an array");
        }
        if (value.length === 0) {
            throw new Error(description + " must not be empty");
        }
        if (validateEntry) {
            for (i = 0; i < value.length; i++) {
                entry = value[i];
                validateEntry(entry, description + "[" + i + "]");
            }
        }
    }
    
    /**
     * Checks whether value is a string. Throws an exception otherwise.
     * @param {*}       value         The value to validate
     * @param {!string} description   A helpful identifier for value
     */
    function _validateString(value, description) {
        if (toString.call(value) !== '[object String]') {
            throw new Error(description + " must be a string");
        }
    }
        
    /**
     * Checks whether value is a non-empty string. Throws an exception otherwise.
     * @param {*}       value         The value to validate
     * @param {!string} description   A helpful identifier for value
     */
    function _validateNonEmptyString(value, description) {
        _validateString(value, description);
        if (value === "") {
            throw new Error(description + " must not be empty");
        }
    }
    
    /**
     * Monkey-patch CodeMirror to prevent modes from being overwritten by extensions.
     * We may rely on the tokens provided by some of these modes.
     */
    function _patchCodeMirror() {
        var _original_CodeMirror_defineMode = CodeMirror.defineMode;
        function _wrapped_CodeMirror_defineMode(name) {
            if (CodeMirror.modes[name]) {
                throw new Error("There already is a CodeMirror mode with the name \"" + name + "\"");
            }
            _original_CodeMirror_defineMode.apply(CodeMirror, arguments);
        }
        CodeMirror.defineMode = _wrapped_CodeMirror_defineMode;
    }
    
    /**
     * Checks whether the provided mode or MIME mode is known to CodeMirror.
     * @param {!string} mode Mode to check for
     * @return {boolean} True if this mode or MIME mode has been loaded, false otherwise
     */
    function _hasMode(mode) {
        return Boolean(CodeMirror.modes[mode] || CodeMirror.mimeModes[mode]);
    }

    /**
     * Check whether mode is a non-empty string and loaded by CodeMirror.
     * @param {!string} mode        Value to validate as a mode string
     * @param {!string} description A helpful identifier for origin of mode when reporting errors
     */
    function _validateMode(mode, description) {
        _validateNonEmptyString(mode, description);
        if (!_hasMode(mode)) {
            throw new Error("CodeMirror mode \"" + mode + "\" is not loaded");
        }
    }
    
    /**
     * Adds a global mode-to-language association.
     * @param {!string} mode The mode to associate the language with
     * @param {!Language} language The language to associate with the mode
     * @private
     */
    function _setLanguageForMode(mode, language) {
        if (!_modeMap[mode]) {
            _modeMap[mode] = [];
        } else {
            console.warn("Multiple languages are using the CodeMirror mode \"" + mode + "\"", _modeMap[mode]);
        }
        _modeMap[mode].push(language);
    }

    /**
     * Resolves a language ID to a Language object.
     * @param {!string} id Identifier for this language, use only letter a-z (i.e. "cpp")
     * @return {Language} The language with the provided identifier or undefined
     */
    function getLanguage(id) {
        return _languages[id];
    }
    
    /**
     * Resolves a file extension to a Language object
     * @param {!string} extension File extension to find a language for
     * @return {Language} The language for the provided file type or the fallback language
     */
    function getLanguageForFileExtension(extension) {
        if (extension.charAt(0) === ".") {
            extension = extension.substr(1);
        }
        
        // Make checks below case-INsensitive
        extension = extension.toLowerCase();
        
        var language = _fileExtensionsMap[extension];
        if (!language) {
            console.log("Called Languages.js getLanguageForFileExtension with an unhandled file extension: " + extension);
        }
        
        return language || _fallbackLanguage;
    }
    
    /**
     * Resolves a CodeMirror mode to a Language object
     * @param {!string} mode CodeMirror mode
     * @return {Language} The language for the provided mode or the fallback language
     */
    function getLanguageForMode(mode) {
        var i, modes = _modeMap[mode];
        
        if (modes) {
            // Prefer languages that don't just have the mode as an alias
            for (i = 0; i < modes.length; i++) {
                if (modes[i].mode === mode) {
                    return modes[i];
                }
            }
            // If all available languages only use this mode as an alias, just use the first one
            return modes[0];
        }
        
        // In case of unsupported languages
        console.log("Called Languages.js getLanguageForMode with an unhandled mode:", mode);
        return _fallbackLanguage;
    }

    /**
     * @constructor
     * Model for a language.
     *
     * @param {!string} id Identifier for this language, use only letter a-z (i.e. "cpp")
     * @param {!string} name Human-readable name of the language, as it's commonly referred to (i.e. "C++")
     */
    function Language(id, name) {
        _validateString(id, "Language ID");
        if (!id.match(/^[a-z]+$/)) {
            throw new Error("Invalid language ID \"" + id + "\": Only letters a-z are allowed");
        }
        
        _validateNonEmptyString(name, "name");
        
        this.id   = id;
        this.name = name;
        
        this._fileExtensions = [];
        this._modeMap = {};
    }
    
    /**
     * Sets the mode and optionally aliases for this language.
     *
     * 
     * @param {!string} mode Name of a CodeMirror mode or MIME mode that is already loaded
     * @param {Array.<string>} modeAliases Names of CodeMirror modes or MIME modes that are only used as submodes
     * @return {Language} This language
     */
    Language.prototype._setMode = function (mode, modeAliases) {
        var i;
        
        _validateMode(mode, "mode");
        
        this.mode = mode;
        _setLanguageForMode(mode, this);

        if (modeAliases) {
            _validateArray(modeAliases, "modeAliases", _validateNonEmptyString);
            
            this.modeAliases = modeAliases;
            for (i = 0; i < modeAliases.length; i++) {
                _setLanguageForMode(modeAliases[i], this);
            }
        }
        
        return this;
    };
    
    /**
     * Returns an array of file extensions for this language.
     * @return {Array.<string>} File extensions used by this language
     */
    Language.prototype.getFileExtensions = function () {
        return this._fileExtensions.concat();
    };
    
    /**
     * Adds a file extension to this language.
     * @param {!string} extension A file extension used by this language
     * @return {Language} This language
     * @private
     */
    Language.prototype._addFileExtension = function (extension) {
        if (this._fileExtensions.indexOf(extension) === -1) {
            this._fileExtensions.push(extension);
            
            var language = _fileExtensionsMap[extension];
            if (language) {
                console.warn("Cannot register file extension \"" + extension + "\" for " + this.name + ", it already belongs to " + language.name);
            } else {
                _fileExtensionsMap[extension] = this;
            }
        }
            
        return this;
    };

    /**
     * Sets the prefix and suffix to use for blocks comments in this language.
     * @param {!string} prefix Prefix string to use for block comments (i.e. "<!--")
     * @param {!string} suffix Suffix string to use for block comments (i.e. "-->")
     * @return {Language} This language
     * @private
     */
    Language.prototype.setBlockComment = function (prefix, suffix) {
        _validateNonEmptyString(prefix, "prefix");
        _validateNonEmptyString(suffix, "suffix");
        
        this.blockComment = { prefix: prefix, suffix: suffix };
        
        return this;
    };

    /**
     * Sets the prefix to use for line comments in this language.
     * @param {!string} prefix Prefix string to use for block comments (i.e. "//")
     * @return {Language} This language
     * @private
     */
    Language.prototype.setLineComment = function (prefix) {
        _validateNonEmptyString(prefix, "prefix");
        
        this.lineComment = { prefix: prefix };
        
        return this;
    };
    
    /**
     * Returns whether the provided mode is used by this language.
     * True if the languages's mode is the same as the provided one
     * or included in the mode aliases.
     * @return {boolean} Whether the mode is used directly or as an alias
     */
    Language.prototype.usesMode = function (mode) {
        return mode === this.mode || this.modeAliases.indexOf(mode) !== -1;
    };
    
    /**
     * Returns either a language associated with the mode or the fallback language.
     * Used to disambiguate modes used by multiple languages.
     * @param {!string} mode The mode to associate the language with
     * @return {Language} This language if it uses the mode, or whatever {@link Languages#getLanguageForMode} returns
     */
    Language.prototype.getLanguageForMode = function (mode) {
        if (this.usesMode(mode)) {
            return this;
        }

        return this._modeMap[mode] || getLanguageForMode(mode);
    };

    /**
     * Overrides a mode-to-language association for this particular language only.
     * Used to disambiguate modes used by multiple languages.
     * @param {!string} mode The mode to associate the language with
     * @param {!Language} language The language to associate with the mode
     * @return {Language} This language
     * @private
     */
    Language.prototype._setLanguageForMode = function (mode, language) {
        if (this.usesMode(mode) && language !== this) {
            throw new Error("A language must always map its mode and mode aliases to itself");
        }
        this._modeMap[mode] = language;
        
        return this;
    };
    
    
    /**
     * Defines a language.
     *
     * @param {!string}        id                        Unique identifier for this language, use only letter a-z (i.e. "cpp")
     * @param {!Object}        definition                An object describing the language
     * @param {!string}        definition.name           Human-readable name of the language, as it's commonly referred to (i.e. "C++")
     * @param {Array.<string>} definition.fileExtensions List of file extensions used by this language (i.e. ["php", "php3"])
     * @param {Array.<string>} definition.blockComment   Array with two entries defining the block comment prefix and suffix (i.e. ["<!--", "-->"])
     * @param {string}         definition.lineComment    Line comment prefix (i.e. "//")
     * @param {string}         definition.mode           Low level CodeMirror mode for this language (i.e. "clike")
     * @param {string}         definition.mimeMode       High level CodeMirror mode or MIME mode for this language (i.e. "text/x-c++src")
     * @param {Array.<string>} definition.modeAliases    Names of high level CodeMirror modes or MIME modes that are only used as submodes (i.e. ["html"])
     **/
    function defineLanguage(id, definition) {
        if (_languages[id]) {
            throw new Error("Language \"" + id + "\" is already defined");
        }
        
        var i, language = new Language(id, definition.name);
        
        var fileExtensions = definition.fileExtensions;
        if (fileExtensions) {
            for (i = 0; i < fileExtensions.length; i++) {
                language._addFileExtension(fileExtensions[i]);
            }
        }
        
        var blockComment = definition.blockComment;
        if (blockComment) {
            language.setBlockComment(blockComment[0], blockComment[1]);
        }
        
        var lineComment = definition.lineComment;
        if (lineComment) {
            language.setLineComment(lineComment);
        }
        
        var mode = definition.mode, mimeMode = definition.mimeMode, modeAliases = definition.modeAliases;
        if (mode) {
            
            var setMode = function () {
                language._setMode(mimeMode || mode, modeAliases);
            };
            
            if (_hasMode(mode)) {
                setMode();
            } else {
                require(["mode/" + mode + "/" + mode], function () {
                    setMode();
                });
            }
        }
        
        _languages[id] = language;
        
        return language;
    }
    
   
    // Prevent modes from being overwritten by extensions
    _patchCodeMirror();
    
    _defaultLanguagesJSON.html.mode = {
        "name": "htmlmixed",
        "scriptTypes": [{"matches": /\/x-handlebars-template|\/x-mustache/i,
                       "mode": null}]
    };
    
    // Load the default languages
    $.each(JSON.parse(_defaultLanguagesJSON), defineLanguage);
    
    // The fallback language
    _fallbackLanguage = getLanguage("unknown");
    
    
    // Public methods
    module.exports = {
        defineLanguage:              defineLanguage,
        getLanguage:                 getLanguage,
        getLanguageForFileExtension: getLanguageForFileExtension,
        getLanguageForMode:          getLanguageForMode
    };
});