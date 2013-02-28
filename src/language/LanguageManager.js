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
 * To use that language, wait for the returned promise to be resolved:
 *     LanguageManager.defineLanguage("haskell", definition).done(function (language) {
 *         console.log("Language " + language.name + " is now available!");
 *     });
 *
 * You can also refine an existing language. Currently you can only set the comment styles:
 *     var language = LanguageManager.getLanguage("haskell");
 *     language.setLineComment("--");
 *     language.setBlockComment("{-", "-}");
 *
 * Currently, languages are also accessible this way right after calling defineLanguage,
 * even before the promise has resolved. Note, however, that their mode hasn't yet been set then.
 *
 * Some CodeMirror modes define variations of themselves. They are called MIME modes.
 * To find existing MIME modes, search for "CodeMirror.defineMIME" in thirdparty/CodeMirror2/mode
 * For instance, C++, C# and Java all use the clike (C-like) mode.
 * You can refine the mode definition by specifying the MIME mode as well:
 *     var language = LanguageManager.defineLanguage("csharp", {
 *         name: "C#",
 *         mode: ["clike", "text/x-csharp"],
 *         ...
 *     });
 * Defining the base mode is still necessary to know which file to load.
 * Later however, language.getMode() will either refer to the MIME mode,
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
 */
define(function (require, exports, module) {
    "use strict";
    
    
    // Dependencies
    var Async                 = require("utils/Async"),
        _defaultLanguagesJSON = require("text!language/languages.json");
    
    
    // State
    var _fallbackLanguage           = null,
        _languages                  = {},
        _fileExtensionToLanguageMap = {},
        _modeToLanguageMap          = {},
        _ready;
    
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
     * Resolves a file extension to a Language object.
     * @param {!string} path Path to or extension of the file to find a language for
     * @return {Language} The language for the provided file type or the fallback language
     */
    function getLanguageForFileExtension(path) {
        var extension = _normalizeFileExtension(PathUtils.filenameExtension(path)),
            language  = _fileExtensionToLanguageMap[extension];
        
        if (!language) {
            console.log("Called LanguageManager.getLanguageForFileExtension with an unhandled file extension:", extension);
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
     * @constructor
     * Model for a language.
     *
     * @param {!string} id Identifier for this language, use only letters a-z and _ inbetween (i.e. "cpp", "foo_bar")
     * @param {!string} name Human-readable name of the language, as it's commonly referred to (i.e. "C++")
     */
    function Language(id, name) {
        _validateString(id, "Language ID");
        // Make sure the ID is a string that can safely be used universally by the computer - as a file name, as an object key, as part of a URL, etc.
        // Hence we use "_" instead of "." since the latter often has special meaning
        if (!id.match(/^[a-zA-Z]+(_[a-zA-Z]+)*$/)) {
            throw new Error("Invalid language ID \"" + id + "\": Only groups of letters a-z are allowed, separated by _ (i.e. \"cpp\" or \"foo_bar\")");
        }
        if (_languages[id]) {
            throw new Error("Language \"" + id + "\" is already defined");
        }

        _validateNonEmptyString(name, "name");
        
        this._id   = id;
        this._name = name;
        
        this._fileExtensions    = [];
        this._modeToLanguageMap = {};
    }
    
    
    /** @type {string} Identifier for this language */
    Language.prototype._id = null;
    
    /** @type {string} Human-readable name of this language */
    Language.prototype._name = null;
    
    /** @type {string} CodeMirror mode for this language */
    Language.prototype._mode = null;
    
    /** @type {Array.<string>} File extensions that use this language */
    Language.prototype._fileExtensions = null;
    
    /** @type {{ prefix: string }} Line comment syntax */
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
     * Returns the human-readable name of this language.
     * @return {string} The name
     */
    Language.prototype.getName = function () {
        return this._name;
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
                throw new Error("Mode must either be a string or an array containing two strings");
            }
            mimeMode = mode[1];
            mode = mode[0];
        }

        // special handling for mode, require explicit declaration of "text/plain" if no mode is specified
        var isPlainText = (mode === "") && (mimeMode === "text/plain");

        if (!isPlainText && (!mode || mode === "")) {
            result.reject("Mode must be specified as a built-in CodeMirror mode or [\'\', 'text/plain']");
        }
        
        var finish = function () {
            var i;
            
            if (!isPlainText) {
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
                    if (modeConfig.name !== mode) {
                        result.reject("CodeMirror MIME mode \"" + mimeMode + "\" does not belong to mode \"" + mode + "\"");
                        return;
                    }
                }
            }
            
            // This mode is now only about what to tell CodeMirror
            // The base mode was only necessary to load the proper mode file
            self._mode = mimeMode || mode;
            
            result.resolve(self);
        };
        
        if (isPlainText || CodeMirror.modes[mode]) {
            finish();
        } else if (mode) {
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
     * Adds a file extension to this language.
     * Private for now since dependent code would need to by kept in sync with such changes.
     * See https://github.com/adobe/brackets/issues/2966 for plans to make this public.
     * @param {!string} extension A file extension used by this language
     * @private
     */
    Language.prototype._addFileExtension = function (extension) {
        extension = _normalizeFileExtension(extension);
        
        if (this._fileExtensions.indexOf(extension) === -1) {
            this._fileExtensions.push(extension);
            
            var language = _fileExtensionToLanguageMap[extension];
            if (language) {
                console.warn("Cannot register file extension \"" + extension + "\" for " + this.name + ", it already belongs to " + language.name);
            } else {
                _fileExtensionToLanguageMap[extension] = this;
            }
        }
    };

    /**
     * Returns whether the line comment syntax is defined for this language.
     * @return {boolean} Whether line comments are supported
     */
    Language.prototype.hasLineCommentSyntax = function () {
        return Boolean(this._lineCommentSyntax);
    };
    
    /**
     * Returns the prefix to use for line comments.
     * @return {string} The prefix
     */
    Language.prototype.getLineCommentPrefix = function () {
        if (!this._lineCommentSyntax) {
            return null;
        }
        return this._lineCommentSyntax.prefix;
    };

    /**
     * Sets the prefix to use for line comments in this language.
     * @param {!string} prefix Prefix string to use for block comments (i.e. "//")
     */
    Language.prototype.setLineCommentSyntax = function (prefix) {
        _validateNonEmptyString(prefix, "prefix");
        
        this._lineCommentSyntax = { prefix: prefix };
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
        if (!this._blockCommentSyntax) {
            return null;
        }
        return this._blockCommentSyntax.prefix;
    };

    /**
     * Returns the suffix to use for block comments.
     * @return {string} The suffix
     */
    Language.prototype.getBlockCommentSuffix = function () {
        if (!this._blockCommentSyntax) {
            return null;
        }
        return this._blockCommentSyntax.suffix;
    };
    
    /**
     * Sets the prefix and suffix to use for blocks comments in this language.
     * @param {!string} prefix Prefix string to use for block comments (i.e. "<!--")
     * @param {!string} suffix Suffix string to use for block comments (i.e. "-->")
     */
    Language.prototype.setBlockCommentSyntax = function (prefix, suffix) {
        _validateNonEmptyString(prefix, "prefix");
        _validateNonEmptyString(suffix, "suffix");
        
        this._blockCommentSyntax = { prefix: prefix, suffix: suffix };
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
     * Overrides a mode-to-language association for this particular language only.
     * Used to disambiguate modes used by multiple languages.
     * @param {!string} mode The mode to associate the language with
     * @param {!Language} language The language to associate with the mode
     * @private
     */
    Language.prototype._setLanguageForMode = function (mode, language) {
        if (mode === this._mode && language !== this) {
            throw new Error("A language must always map its mode to itself");
        }
        this._modeToLanguageMap[mode] = language;
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
     *
     * @return {$.Promise} A promise object that will be resolved with a Language object
     **/
    function defineLanguage(id, definition) {
        var result = new $.Deferred(),
            language = new Language(id, definition.name),
            fileExtensions = definition.fileExtensions,
            i;
        
        var blockComment = definition.blockComment;
        if (blockComment) {
            language.setBlockCommentSyntax(blockComment[0], blockComment[1]);
        }
        
        var lineComment = definition.lineComment;
        if (lineComment) {
            language.setLineCommentSyntax(lineComment);
        }
        
        language._loadAndSetMode(definition.mode).done(function () {
            // register language file extensions after mode has loaded
            if (fileExtensions) {
                for (i = 0; i < fileExtensions.length; i++) {
                    language._addFileExtension(fileExtensions[i]);
                }
            }
                
            // globally associate mode to language
            _setLanguageForMode(language.getMode(), language);
        
            // finally, store lanuage to _language map
            _languages[id] = language;
            
            result.resolve(language);
        }).fail(function (error) {
            console.error(error);
            result.reject(error);
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
    exports.ready                        = _ready;
    exports.defineLanguage               = defineLanguage;
    exports.getLanguage                  = getLanguage;
    exports.getLanguageForFileExtension  = getLanguageForFileExtension;
});