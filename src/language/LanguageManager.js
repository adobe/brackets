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
/*global define, $, CodeMirror, PathUtils */

/**
 * LanguageManager provides access to the languages supported by Brackets
 *
 * To find out which languages we support by default, have a look at languages.json.
 *
 * To get access to an existing language, call getLanguage():
 *     var language = LanguageManager.getLanguage("<id>");
 *
 * To define your own languages, call defineLanguage():
 *     var language = LanguageManager.defineLanguage("haskell", {
 *         name: "Haskell",
 *         mode: "haskell",
 *         fileExtensions: ["hs"],
 *         blockComment: ["{-", "-}"],
 *         lineComment: "--"
 *     });
 *
 * You can also refine an existing language. Currently you can only set the comment styles:
 *     language.setLineComment("--");
 *     language.setBlockComment("{-", "-}");
 *
 * Some CodeMirror modes define variations of themselves. They are called MIME modes.
 * To find out existing MIME modes, search for "CodeMirror.defineMIME" in thirdparty/CodeMirror2/mode
 * For instance, C++, C# and Java all use the clike mode.
 * You can refine the mode definition by specifying the MIME mode as well:
 *     var language = LanguageManager.defineLanguage("csharp", {
 *         name: "C#",
 *         mode: ["clike", "text/x-csharp"],
 *         ...
 *     });
 * Definining the base mode is still necessary to know which file to load.
 * Later however, language.mode will either refer to the MIME mode,
 * or the base mode if no MIME mode has been specified.
 *
 * If you need to configure a mode, you can just create a new MIME mode and use that:
 *     CodeMirror.defineMIME("text/x-brackets-html", {
 *         "name": "htmlmixed",
 *         "scriptTypes": [{"matches": /\/x-handlebars-template|\/x-mustache/i,
 *                        "mode": null}]
 *     });
 *
 *     var language = LanguageManager.defineLanguage("html", {
 *         name: "HTML",
 *         mode: ["htmlmixed", "text/x-brackets-html"],
 *         ...
 *     });
 *
 * If a mode is not shipped with our CodeMirror distribution, you need to first load it yourself.
 * If the mode is part of our CodeMirror distribution, it gets loaded automatically.
 *
 * To wait until the mode is loaded and set, use the language.modeReady promise:
 *     language.modeReady.done(function () {
 *         // ...
 *     });
 * Note that this will never resolve for languages without a mode.
 */
define(function (require, exports, module) {
    "use strict";
    
    
    // Dependencies
    var _defaultLanguagesJSON = require("text!language/languages.json");
    
    
    // State
    var _fallbackLanguage            = null,
        _languages                   = {},
        _fileExtensionsToLanguageMap = {},
        _modeToLanguageMap           = {};
    
    
    // Helper functions
    
    /**
     * Checks whether value is a string. Throws an exception otherwise.
     * @param {*}       value         The value to validate
     * @param {!string} description   A helpful identifier for value
     */
    function _validateString(value, description) {
        // http://stackoverflow.com/questions/1303646/check-whether-variable-is-number-or-string-in-javascript
        if (Object.prototype.toString.call(value) !== "[object String]") {
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
     * Adds a global mode-to-language association.
     * @param {!string} mode The mode to associate the language with
     * @param {!Language} language The language to associate with the mode
     * @private
     */
    function _setLanguageForMode(mode, language) {
        if (_modeToLanguageMap[mode]) {
            console.warn("CodeMirror mode \"" + mode + "\" is already used by language " + _modeToLanguageMap[mode].name + ", won't register for " + language.name);
            return;
        }

        _modeToLanguageMap[mode] = language;
    }

    /**
     * Resolves a language ID to a Language object.
     * @param {!string} id Identifier for this language, use only letters a-z and _ inbetween (i.e. "cpp", "foo_bar")
     * @return {Language} The language with the provided identifier or undefined
     */
    function getLanguage(id) {
        return _languages[id];
    }
    
    /**
     * Resolves a file extension to a Language object
     * @param {!string} path Path to or extension of the file to find a language for
     * @return {Language} The language for the provided file type or the fallback language
     */
    function getLanguageForFileExtension(path) {
        var extension = PathUtils.filenameExtension(path);
    
        if (extension.charAt(0) === ".") {
            extension = extension.substr(1);
        }
        
        // Make checks below case-INsensitive
        extension = extension.toLowerCase();
        
        var language = _fileExtensionsToLanguageMap[extension];
        if (!language) {
            console.log("Called LanguageManager.getLanguageForFileExtension with an unhandled file extension: " + extension);
        }
        
        return language || _fallbackLanguage;
    }
    
    /**
     * Resolves a CodeMirror mode to a Language object
     * @param {!string} mode CodeMirror mode
     * @return {Language} The language for the provided mode or the fallback language
     */
    function _getLanguageForMode(mode) {
        var language = _modeToLanguageMap[mode];
        if (language) {
            return language;
        }
        
        // In case of unsupported languages
        console.log("Called LanguageManager._getLanguageForMode with a mode for which no language has been registered:", mode);
        return _fallbackLanguage;
    }

    /**
     * @constructor
     * Model for a language.
     *
     * @param {!string} id Identifier for this language, use only letters a-z and _ inbetween (i.e. "cpp", "foo_bar")
     * @param {!string} name Human-readable name of the language, as it's commonly referred to (i.e. "C++")
     */
    function Language(id, name) {
        _validateString(id, "Language ID");
        // Make sure the ID is a string that can safely be used universally by the computer - as a file name, as an object key, as part of a URL, etc.
        // Hence we use _ instead of "." since this makes it easier to parse a file name containing a language ID
        if (!id.match(/^[a-z]+(\.[a-z]+)*$/)) {
            throw new Error("Invalid language ID \"" + id + "\": Only groups of letters a-z are allowed, separated by _ (i.e. \"cpp\" or \"foo_bar\")");
        }
        if (_languages[id]) {
            throw new Error("Language \"" + id + "\" is already defined");
        }

        _validateNonEmptyString(name, "name");
        
        this.id   = id;
        this.name = name;
        
        this._fileExtensions    = [];
        this._modeToLanguageMap = {};
        
        // Since setting the mode is asynchronous when the mode hasn't been loaded yet, offer a reliable way to wait until it is ready
        this._modeReady = new $.Deferred();
        this.modeReady = this._modeReady.promise();
        
        _languages[id] = this;
    }
    
    /** @type {string} Identifier for this language */
    Language.prototype.id = null;

    /** @type {string} Human-readable name of the language */
    Language.prototype.name = null;
    
    /** @type {$.Promise} Promise that resolves when the mode has been loaded and set */
    Language.prototype.modeReady = null;
    
    /**
     * Sets the mode for this language.
     * 
     * @param {string|Array.<string>} definition.mode        CodeMirror mode (i.e. "htmlmixed"), optionally with a MIME mode defined by that mode ["clike", "text/x-c++src"]
     *                                                       Unless the mode is located in thirdparty/CodeMirror2/mode/<name>/<name>.js, you need to first load it yourself.
     * @return {Language} This language
     */
    Language.prototype._setMode = function (mode) {
        if (!mode) {
            return;
        }
        
        var language = this;
        // Mode can be an array specifying a mode plus a MIME mode defined by that mode ["clike", "text/x-c++src"]
        var mimeMode;
        if ($.isArray(mode)) {
            if (mode.length !== 2) {
                throw new Error("Mode must either be a string or an array containing two strings");
            }
            mimeMode = mode[1];
            mode = mode[0];
        }

        _validateNonEmptyString(mode, "mode");
        
        var finish = function () {
            var i;
            
            if (!CodeMirror.modes[mode]) {
                throw new Error("CodeMirror mode \"" + mode + "\" is not loaded");
            }
            
            if (mimeMode) {
                var modeConfig = CodeMirror.mimeModes[mimeMode];
                if (!modeConfig) {
                    throw new Error("CodeMirror MIME mode \"" + mimeMode + "\" not found");
                }
                if (modeConfig.name !== mode) {
                    throw new Error("CodeMirror MIME mode \"" + mimeMode + "\" does not belong to mode \"" + mode + "\"");
                }
            }
            
            // This mode is now only about what to tell CodeMirror
            // The base mode was only necessary to load the proper mode file
            language.mode = mimeMode || mode;
            _setLanguageForMode(language.mode, language);
            
            language._modeReady.resolve(language);
        };
        
        if (CodeMirror.modes[mode]) {
            finish();
        } else {
            require(["thirdparty/CodeMirror2/mode/" + mode + "/" + mode], finish);
        }
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
     * Private for now since dependent code would need to by kept in sync with such changes.
     * In case we ever open this up, we should think about whether we want to make this
     * configurable by the user. If so, the user has to be able to override these calls.
     * @param {!string} extension A file extension used by this language
     * @return {Language} This language
     * @private
     */
    Language.prototype._addFileExtension = function (extension) {
        extension = extension.toLowerCase();
        if (this._fileExtensions.indexOf(extension) === -1) {
            this._fileExtensions.push(extension);
            
            var language = _fileExtensionsToLanguageMap[extension];
            if (language) {
                console.warn("Cannot register file extension \"" + extension + "\" for " + this.name + ", it already belongs to " + language.name);
            } else {
                _fileExtensionsToLanguageMap[extension] = this;
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
     * Returns either a language associated with the mode or the fallback language.
     * Used to disambiguate modes used by multiple languages.
     * @param {!string} mode The mode to associate the language with
     * @return {Language} This language if it uses the mode, or whatever {@link LanguageManager#_getLanguageForMode} returns
     */
    Language.prototype.getLanguageForMode = function (mode) {
        if (mode === this.mode) {
            return this;
        }

        return this._modeToLanguageMap[mode] || _getLanguageForMode(mode);
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
        if (mode === this.mode && language !== this) {
            throw new Error("A language must always map its mode to itself");
        }
        this._modeToLanguageMap[mode] = language;
        
        return this;
    };
    
    
    /**
     * Defines a language.
     *
     * @param {!string}               id                        Unique identifier for this language, use only letters a-z and _ inbetween (i.e. "cpp", "foo_bar")
     * @param {!Object}               definition                An object describing the language
     * @param {!string}               definition.name           Human-readable name of the language, as it's commonly referred to (i.e. "C++")
     * @param {Array.<string>}        definition.fileExtensions List of file extensions used by this language (i.e. ["php", "php3"])
     * @param {Array.<string>}        definition.blockComment   Array with two entries defining the block comment prefix and suffix (i.e. ["<!--", "-->"])
     * @param {string}                definition.lineComment    Line comment prefix (i.e. "//")
     * @param {string|Array.<string>} definition.mode           CodeMirror mode (i.e. "htmlmixed"), optionally with a MIME mode defined by that mode ["clike", "text/x-c++src"]
     *                                                          Unless the mode is located in thirdparty/CodeMirror2/mode/<name>/<name>.js, you need to first load it yourself.
     *                                                          {@link Language#modeReady} is a promise that resolves when a mode has been loaded and set.
     *                                                          It will not resolve when no mode is specified.
     *
     * @return {Language} The new language
     **/
    function defineLanguage(id, definition) {
        var language = new Language(id, definition.name);
        
        var fileExtensions = definition.fileExtensions,
            i;
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
        
        var mode = definition.mode;
        if (mode) {
            language._setMode(mode);
        } else {
            language._modeReady.reject();
        }
        
        return language;
    }
    
   
    // Prevent modes from being overwritten by extensions
    _patchCodeMirror();
    
    // Define a custom MIME mode here because JSON files must not contain regular expressions
    // Also, all other modes so far were strings, so we spare us the trouble of allowing
    // more complex mode values.
    CodeMirror.defineMIME("text/x-brackets-html", {
        "name": "htmlmixed",
        "scriptTypes": [{"matches": /\/x-handlebars-template|\/x-mustache/i,
                       "mode": null}]
    });
 
    // Load the default languages
    $.each(JSON.parse(_defaultLanguagesJSON), defineLanguage);
    
    // Get the object for HTML
    var html = getLanguage("html");
    
    // The htmlmixed mode uses the xml mode internally for the HTML parts, so we map it to HTML
    html._setLanguageForMode("xml", html);
    
    // Currently we override the above mentioned "xml" in TokenUtils.getModeAt, instead returning "html".
    // When the CSSInlineEditor and the hint providers are no longer based on modes, this can be changed.
    // But for now, we need to associate this madeup "html" mode with our HTML language object.
    _setLanguageForMode("html", html);
    
    // The fallback language for unknown modes and file extensions
    _fallbackLanguage = getLanguage("unknown");
    
    // Public methods
    exports.defineLanguage               = defineLanguage;
    exports.getLanguage                  = getLanguage;
    exports.getLanguageForFileExtension  = getLanguageForFileExtension;
});