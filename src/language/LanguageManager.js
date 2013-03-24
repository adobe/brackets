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
 *     LanguageManager.defineLanguage("haskell", {
 *         name: "Haskell",
 *         mode: "haskell",
 *         fileExtensions: ["hs"],
 *         blockComment: ["{-", "-}"],
 *         lineComment: "--"
 *     });
 *
 * To use that language and its related mode, wait for the returned promise to be resolved:
 *     LanguageManager.defineLanguage("haskell", definition).done(function (language) {
 *         console.log("Language " + language.getName() + " is now available!");
 *     });
 *
 * You can also specify file names:
 *     LanguageManager.defineLanguage("makefile", {
 *         name: "Make",
 *         mode: ["null", "text/plain"],
 *         fileNames: ["Makefile"]
 *     });
 * You can combine file names and extensions, or not define them at all.
 *
 * You can also refine an existing language. Currently you can only set the comment styles:
 *     var language = LanguageManager.getLanguage("haskell");
 *     language.setLineComment("--");
 *     language.setBlockComment("{-", "-}");
 *
 * Some CodeMirror modes define variations of themselves. They are called MIME modes.
 * To find existing MIME modes, search for "CodeMirror.defineMIME" in thirdparty/CodeMirror2/mode
 * For instance, C++, C# and Java all use the clike (C-like) mode with different settings and a different MIME name.
 * You can refine the mode definition by specifying the MIME mode as well:
 *     LanguageManager.defineLanguage("csharp", {
 *         name: "C#",
 *         mode: ["clike", "text/x-csharp"],
 *         ...
 *     });
 * Defining the base mode is still necessary to know which file to load.
 * However, language.getMode() will return just the MIME mode if one was
 * specified.
 *
 * If you need to configure a mode, you can just create a new MIME mode and use that:
 *     CodeMirror.defineMIME("text/x-brackets-html", {
 *         "name": "htmlmixed",
 *         "scriptTypes": [{"matches": /\/x-handlebars-template|\/x-mustache/i,
 *                        "mode": null}]
 *     });
 *
 *     LanguageManager.defineLanguage("html", {
 *         name: "HTML",
 *         mode: ["htmlmixed", "text/x-brackets-html"],
 *         ...
 *     });
 *
 * If a mode is not shipped with our CodeMirror distribution, you need to first load it yourself.
 * If the mode is part of our CodeMirror distribution, it gets loaded automatically.
 */
define(function (require, exports, module) {
    "use strict";
    
    
    // Dependencies
    var Async                 = require("utils/Async"),
        _defaultLanguagesJSON = require("text!language/languages.json");
    
    
    // State
    var _fallbackLanguage           = null,
        _pendingLanguages           = {},
        _languages                  = {},
        _fileExtensionToLanguageMap = {},
        _fileNameToLanguageMap      = {},
        _modeToLanguageMap          = {},
        _ready;
    
    // Helper functions
    
    /**
     * Checks whether value is a non-empty string. Reports an error otherwise.
     * If no deferred is passed, console.error is called.
     * Otherwise the deferred is rejected with the error message.
     * @param {*}                value         The value to validate
     * @param {!string}          description   A helpful identifier for value
     * @param {?jQuery.Deferred} deferred      A deferred to reject with the error message in case of an error
     * @return {boolean} True if the value is a non-empty string, false otherwise
     */
    function _validateNonEmptyString(value, description, deferred) {
        var reportError = deferred ? deferred.reject : console.error;
        
        // http://stackoverflow.com/questions/1303646/check-whether-variable-is-number-or-string-in-javascript
        if (Object.prototype.toString.call(value) !== "[object String]") {
            reportError(description + " must be a string");
            return false;
        }
        if (value === "") {
            reportError(description + " must not be empty");
            return false;
        }
        return true;
    }
    
    /**
     * Lowercases the file extension and ensures it doesn't start with a dot.
     * @param {!string} extension The file extension
     * @return {string} The normalized file extension
     */
    function _normalizeFileExtension(extension) {
        // Remove a leading dot if present
        if (extension.charAt(0) === ".") {
            extension = extension.substr(1);
        }
        
        // Make checks below case-INsensitive
        return extension.toLowerCase();
    }
    
    /**
     * Monkey-patch CodeMirror to prevent modes from being overwritten by extensions.
     * We may rely on the tokens provided by some of these modes.
     */
    function _patchCodeMirror() {
        var _original_CodeMirror_defineMode = CodeMirror.defineMode;
        function _wrapped_CodeMirror_defineMode(name) {
            if (CodeMirror.modes[name]) {
                console.error("There already is a CodeMirror mode with the name \"" + name + "\"");
                return;
            }
            _original_CodeMirror_defineMode.apply(CodeMirror, arguments);
        }
        CodeMirror.defineMode = _wrapped_CodeMirror_defineMode;
    }
    
    /**
     * Adds a global mode-to-language association.
     * @param {!string} mode The mode to associate the language with
     * @param {!Language} language The language to associate with the mode
     */
    function _setLanguageForMode(mode, language) {
        if (_modeToLanguageMap[mode]) {
            console.warn("CodeMirror mode \"" + mode + "\" is already used by language " + _modeToLanguageMap[mode]._name + ", won't register for " + language._name);
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
     * Resolves a file path to a Language object.
     * @param {!string} path Path to the file to find a language for
     * @return {Language} The language for the provided file type or the fallback language
     */
    function getLanguageForPath(path) {
        var extension = _normalizeFileExtension(PathUtils.filenameExtension(path)),
            filename  = PathUtils.filename(path).toLowerCase(),
            language  = extension ? _fileExtensionToLanguageMap[extension] : _fileNameToLanguageMap[filename];
        
        if (!language) {
            console.log("Called LanguageManager.getLanguageForPath with an unhandled " + (extension ? "file extension" : "file name") + ":", extension || filename);
        }
        
        return language || _fallbackLanguage;
    }
    
    /**
     * Resolves a CodeMirror mode to a Language object.
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
     * @private
     * Notify listeners when a language is added
     * @param {!Language} language The new language
     */
    function _triggerLanguageAdded(language) {
        // finally, store language to _language map
        _languages[language.getId()] = language;
        $(exports).triggerHandler("languageAdded", [language]);
    }

    /**
     * @private
     * Notify listeners when a language is modified
     * @param {!Language} language The modified language
     */
    function _triggerLanguageModified(language) {
        $(exports).triggerHandler("languageModified", [language]);
    }
    

    /**
     * @constructor
     * Model for a language.
     */
    function Language() {
        this._fileExtensions    = [];
        this._fileNames         = [];
        this._modeToLanguageMap = {};
        this._lineCommentSyntax = [];
    }
    
    
    /** @type {string} Identifier for this language */
    Language.prototype._id = null;
    
    /** @type {string} Human-readable name of this language */
    Language.prototype._name = null;
    
    /** @type {string} CodeMirror mode for this language */
    Language.prototype._mode = null;
    
    /** @type {Array.<string>} File extensions that use this language */
    Language.prototype._fileExtensions = null;
    
    /** @type {Array.<string>} File names for extensionless files that use this language */
    Language.prototype._fileNames = null;
    
    /** @type {Array.<string>} Line comment syntax */
    Language.prototype._lineCommentSyntax = null;
    
    /** @type {Object.<string,Language>} Which language to use for what CodeMirror mode */
    Language.prototype._modeToLanguageMap = null;
    
    /** @type {{ prefix: string, suffix: string }} Block comment syntax */
    Language.prototype._blockCommentSyntax = null;
    
    /**
     * Returns the identifier for this language.
     * @return {string} The identifier
     */
    Language.prototype.getId = function () {
        return this._id;
    };
    
    /**
     * Sets the identifier for this language or prints an error to the console.
     * @param {!string} id Identifier for this language, use only letters a-z and _ inbetween (i.e. "cpp", "foo_bar")
     * @return {boolean} Whether the ID was valid and set or not
     */
    Language.prototype._setId = function (id) {
        if (!_validateNonEmptyString(id, "Language ID")) {
            return false;
        }
        // Make sure the ID is a string that can safely be used universally by the computer - as a file name, as an object key, as part of a URL, etc.
        // Hence we use "_" instead of "." since the latter often has special meaning
        if (!id.match(/^[a-z0-9]+(_[a-z0-9]+)*$/)) {
            console.error("Invalid language ID \"" + id + "\": Only groups of lower case letters and numbers are allowed, separated by underscores.");
            return false;
        }
        
        this._id = id;
        return true;
    };

    /**
     * Returns the human-readable name of this language.
     * @return {string} The name
     */
    Language.prototype.getName = function () {
        return this._name;
    };
    
    /**
     * Sets the human-readable name of this language or prints an error to the console.
     * @param {!string} name Human-readable name of the language, as it's commonly referred to (i.e. "C++")
     * @return {boolean} Whether the name was valid and set or not
     */
    Language.prototype._setName = function (name) {
        if (!_validateNonEmptyString(name, "name")) {
            return false;
        }
        
        this._name = name;
        return true;
    };
    
    /**
     * Returns the CodeMirror mode for this language.
     * @return {string} The mode
     */
    Language.prototype.getMode = function () {
        return this._mode;
    };
    
    /**
     * Loads a mode and sets it for this language.
     * 
     * @param {string|Array.<string>} mode            CodeMirror mode (i.e. "htmlmixed"), optionally with a MIME mode defined by that mode ["clike", "text/x-c++src"]
     *                                                Unless the mode is located in thirdparty/CodeMirror2/mode/<name>/<name>.js, you need to first load it yourself.
     *
     * @return {$.Promise} A promise object that will be resolved when the mode is loaded and set
     */
    Language.prototype._loadAndSetMode = function (mode) {
        var result      = new $.Deferred(),
            self        = this,
            mimeMode; // Mode can be an array specifying a mode plus a MIME mode defined by that mode ["clike", "text/x-c++src"]
        
        if (Array.isArray(mode)) {
            if (mode.length !== 2) {
                result.reject("Mode must either be a string or an array containing two strings");
                return result.promise();
            }
            mimeMode = mode[1];
            mode = mode[0];
        }
        
        // mode must not be empty. Use "null" (the string "null") mode for plain text
        if (!_validateNonEmptyString(mode, "mode", result)) {
            result.reject();
            return result.promise();
        }
        
        var finish = function () {
            if (!CodeMirror.modes[mode]) {
                result.reject("CodeMirror mode \"" + mode + "\" is not loaded");
                return;
            }
            
            if (mimeMode) {
                var modeConfig = CodeMirror.mimeModes[mimeMode];
                
                if (!modeConfig) {
                    result.reject("CodeMirror MIME mode \"" + mimeMode + "\" not found");
                    return;
                }
                
                // modeConfig can be a string or mode object
                if (modeConfig !== mode && modeConfig.name !== mode) {
                    result.reject("CodeMirror MIME mode \"" + mimeMode + "\" does not belong to mode \"" + mode + "\"");
                    return;
                }
            }
            
            // This mode is now only about what to tell CodeMirror
            // The base mode was only necessary to load the proper mode file
            self._mode = mimeMode || mode;
            self._wasModified();
            
            result.resolve(self);
        };
        
        if (CodeMirror.modes[mode]) {
            finish();
        } else {
            require(["thirdparty/CodeMirror2/mode/" + mode + "/" + mode], finish);
        }
        
        return result.promise();
    };
    
    /**
     * Returns an array of file extensions for this language.
     * @return {Array.<string>} File extensions used by this language
     */
    Language.prototype.getFileExtensions = function () {
        // Use concat to create a copy of this array, preventing external modification
        return this._fileExtensions.concat();
    };
    
    /**
     * Returns an array of file names for extensionless files that use this language.
     * @return {Array.<string>} Extensionless file names used by this language
     */
    Language.prototype.getFileNames = function () {
        // Use concat to create a copy of this array, preventing external modification
        return this._fileNames.concat();
    };

    /**
     * Adds a file extension to this language.
     * @param {!string} extension A file extension used by this language
     * @return {boolean} Whether adding the file extension was successful or not
     */
    Language.prototype.addFileExtension = function (extension) {
        extension = _normalizeFileExtension(extension);
        if (this._fileExtensions.indexOf(extension) === -1) {
            this._fileExtensions.push(extension);
            
            var language = _fileExtensionToLanguageMap[extension];
            if (language) {
                console.warn("Cannot register file extension \"" + extension + "\" for " + this._name + ", it already belongs to " + language._name);
            } else {
                _fileExtensionToLanguageMap[extension] = this;
            }
            
            this._wasModified();
        }
    };

    /**
     * Adds a file name to the language which is used to match files that don't have extensions like "Makefile" for example.
     * @param {!string} extension An extensionless file name used by this language
     * @return {boolean} Whether adding the file name was successful or not
     */
    Language.prototype.addFileName = function (name) {
        name = name.toLowerCase();
        
        if (this._fileNames.indexOf(name) === -1) {
            this._fileNames.push(name);
            
            var language = _fileNameToLanguageMap[name];
            if (language) {
                console.warn("Cannot register file name \"" + name + "\" for " + this._name + ", it already belongs to " + language._name);
            } else {
                _fileNameToLanguageMap[name] = this;
            }
            
            this._wasModified();
        }
        return true;
    };

    /**
     * Returns whether the line comment syntax is defined for this language.
     * @return {boolean} Whether line comments are supported
     */
    Language.prototype.hasLineCommentSyntax = function () {
        return this._lineCommentSyntax.length > 0;
    };
    
    /**
     * Returns an array of prefixes to use for line comments.
     * @return {Array.<string>} The prefixes
     */
    Language.prototype.getLineCommentPrefixes = function () {
        return this._lineCommentSyntax;
    };

    /**
     * Sets the prefixes to use for line comments in this language or prints an error to the console.
     * @param {!string|Array.<string>} prefix Prefix string or and array of prefix strings
     *   to use for line comments (i.e. "//" or ["//", "#"])
     * @return {boolean} Whether the syntax was valid and set or not
     */
    Language.prototype.setLineCommentSyntax = function (prefix) {
        var prefixes = Array.isArray(prefix) ? prefix : [prefix];
        var i;
        
        if (prefixes.length) {
            this._lineCommentSyntax = [];
            for (i = 0; i < prefixes.length; i++) {
                _validateNonEmptyString(String(prefixes[i]), Array.isArray(prefix) ? "prefix[" + i + "]" : "prefix");
                
                this._lineCommentSyntax.push(prefixes[i]);
            }
            this._wasModified();
        } else {
            console.error("The prefix array should not be empty");
        }
        
        return true;
    };
    
    /**
     * Returns whether the block comment syntax is defined for this language.
     * @return {boolean} Whether block comments are supported
     */
    Language.prototype.hasBlockCommentSyntax = function () {
        return Boolean(this._blockCommentSyntax);
    };
    
    /**
     * Returns the prefix to use for block comments.
     * @return {string} The prefix
     */
    Language.prototype.getBlockCommentPrefix = function () {
        return this._blockCommentSyntax && this._blockCommentSyntax.prefix;
    };

    /**
     * Returns the suffix to use for block comments.
     * @return {string} The suffix
     */
    Language.prototype.getBlockCommentSuffix = function () {
        return this._blockCommentSyntax && this._blockCommentSyntax.suffix;
    };
    
    /**
     * Sets the prefix and suffix to use for blocks comments in this language or prints an error to the console.
     * @param {!string} prefix Prefix string to use for block comments (e.g. "<!--")
     * @param {!string} suffix Suffix string to use for block comments (e.g. "-->")
     * @return {boolean} Whether the syntax was valid and set or not
     */
    Language.prototype.setBlockCommentSyntax = function (prefix, suffix) {
        if (!_validateNonEmptyString(prefix, "prefix") || !_validateNonEmptyString(suffix, "suffix")) {
            return false;
        }
        
        this._blockCommentSyntax = { prefix: prefix, suffix: suffix };
        this._wasModified();
        
        return true;
    };
    
    /**
     * Returns either a language associated with the mode or the fallback language.
     * Used to disambiguate modes used by multiple languages.
     * @param {!string} mode The mode to associate the language with
     * @return {Language} This language if it uses the mode, or whatever {@link LanguageManager#_getLanguageForMode} returns
     */
    Language.prototype.getLanguageForMode = function (mode) {
        if (mode === this._mode) {
            return this;
        }
        return this._modeToLanguageMap[mode] || _getLanguageForMode(mode);
    };

    /**
     * Overrides a mode-to-language association for this particular language only or prints an error to the console.
     * Used to disambiguate modes used by multiple languages.
     * @param {!string} mode The mode to associate the language with
     * @param {!Language} language The language to associate with the mode
     * @return {boolean} Whether the mode-to-language association was valid and set or not
     * @private
     */
    Language.prototype._setLanguageForMode = function (mode, language) {
        if (mode === this._mode && language !== this) {
            console.error("A language must always map its mode to itself");
            return false;
        }
        
        this._modeToLanguageMap[mode] = language;
        this._wasModified();
        
        return true;
    };

    /**
     * Determines whether this is the fallback language or not
     * @return {boolean} True if this is the fallback language, false otherwise
     */
    Language.prototype.isFallbackLanguage = function () {
        return this === _fallbackLanguage;
    };
    
    /**
     * Trigger the "languageModified" event if this language is registered already
     * @see _triggerLanguageModified
     * @private
     */
    Language.prototype._wasModified = function () {
        if (_languages[this._id]) {
            _triggerLanguageModified(this);
        }
    };
    
    /**
     * Defines a language.
     *
     * @param {!string}               id                        Unique identifier for this language, use only letters a-z, numbers and _ inbetween (i.e. "cpp", "foo_bar")
     * @param {!Object}               definition                An object describing the language
     * @param {!string}               definition.name           Human-readable name of the language, as it's commonly referred to (i.e. "C++")
     * @param {Array.<string>}        definition.fileExtensions List of file extensions used by this language (i.e. ["php", "php3"])
     * @param {Array.<string>}        definition.blockComment   Array with two entries defining the block comment prefix and suffix (i.e. ["<!--", "-->"])
     * @param {string|Array.<string>} definition.lineComment    Line comment prefixes (i.e. "//" or ["//", "#"])
     * @param {string|Array.<string>} definition.mode           CodeMirror mode (i.e. "htmlmixed"), optionally with a MIME mode defined by that mode ["clike", "text/x-c++src"]
     *                                                          Unless the mode is located in thirdparty/CodeMirror2/mode/<name>/<name>.js, you need to first load it yourself.
     *
     * @return {$.Promise} A promise object that will be resolved with a Language object
     **/
    function defineLanguage(id, definition) {
        var result = new $.Deferred();
        
        if (_pendingLanguages[id]) {
            result.reject("Language \"" + id + "\" is waiting to be resolved.");
            return result.promise();
        }
        if (_languages[id]) {
            result.reject("Language \"" + id + "\" is already defined");
            return result.promise();
        }

        var language       = new Language(),
            name           = definition.name,
            fileExtensions = definition.fileExtensions,
            fileNames      = definition.fileNames,
            blockComment   = definition.blockComment,
            lineComment    = definition.lineComment,
            i,
            l;
        
        if (!language._setId(id) || !language._setName(name) ||
                (blockComment && !language.setBlockCommentSyntax(blockComment[0], blockComment[1])) ||
                (lineComment && !language.setLineCommentSyntax(lineComment))) {
            result.reject();
            return result.promise();
        }
        
        // track languages that are currently loading
        _pendingLanguages[id] = language;
        
        language._loadAndSetMode(definition.mode).done(function () {
            // register language file extensions after mode has loaded
            if (fileExtensions) {
                for (i = 0, l = fileExtensions.length; i < l; i++) {
                    language.addFileExtension(fileExtensions[i]);
                }
            }
            
            // register language file names after mode has loaded
            if (fileNames) {
                for (i = 0, l = fileNames.length; i < l; i++) {
                    language.addFileName(fileNames[i]);
                }
            }
                
            // globally associate mode to language
            _setLanguageForMode(language.getMode(), language);
            
            // finally, store language to _language map
            _languages[language.getId()] = language;
            
            // fire an event to notify DocumentManager of the new language
            _triggerLanguageAdded(language);
            
            result.resolve(language);
        }).fail(function (error) {
            console.error(error);
            result.reject(error);
        }).always(function () {
            // delete from pending languages after success and failure
            delete _pendingLanguages[id];
        });
        
        return result.promise();
    }
    
   
    // Prevent modes from being overwritten by extensions
    _patchCodeMirror();
    
    // Define a custom MIME mode here instead of putting it directly into languages.json
    // because JSON files must not contain regular expressions. Also, all other modes so
    // far were strings, so we spare us the trouble of allowing more complex mode values.
    CodeMirror.defineMIME("text/x-brackets-html", {
        "name": "htmlmixed",
        "scriptTypes": [{"matches": /\/x-handlebars-template|\/x-mustache/i,
                       "mode": null}]
    });
 
    // Load the default languages
    _defaultLanguagesJSON = JSON.parse(_defaultLanguagesJSON);
    _ready = Async.doInParallel(Object.keys(_defaultLanguagesJSON), function (key) {
        return defineLanguage(key, _defaultLanguagesJSON[key]);
    }, false);
    
    // Get the object for HTML
    _ready.always(function () {
        var html = getLanguage("html");
        
        // The htmlmixed mode uses the xml mode internally for the HTML parts, so we map it to HTML
        html._setLanguageForMode("xml", html);
        
        // Currently we override the above mentioned "xml" in TokenUtils.getModeAt, instead returning "html".
        // When the CSSInlineEditor and the hint providers are no longer based on modes, this can be changed.
        // But for now, we need to associate this madeup "html" mode with our HTML language object.
        _setLanguageForMode("html", html);
        
        // The fallback language for unknown modes and file extensions
        _fallbackLanguage = getLanguage("unknown");
    });
    
    // Public methods
    exports.ready                   = _ready;
    exports.defineLanguage          = defineLanguage;
    exports.getLanguage             = getLanguage;
    exports.getLanguageForPath      = getLanguageForPath;
});