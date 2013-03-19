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
 *     var language = LanguageManager.defineLanguage("csharp", {
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
        _pendingLanguages           = {},
        _languages                  = {},
        _fileExtensionToLanguageMap = {},
        _fileNameToLanguageMap      = {},
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
        var mappedLanguage = _modeToLanguageMap[mode];
        if (mappedLanguage && !language.hasAncestor(mappedLanguage)) {
            console.warn("CodeMirror mode \"" + mode + "\" is already used by language " + mappedLanguage.getName() + ", won't register for " + language.getName());
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
     *
     * @param {!string} id Identifier for this language, use only letters a-z and _ inbetween (i.e. "cpp", "foo_bar")
     * @param {!string} name Human-readable name of the language, as it's commonly referred to (i.e. "C++")
     */
    function Language(id, name) {
        _validateString(id, "Language ID");
        // Make sure the ID is a string that can safely be used universally by the computer - as a file name, as an object key, as part of a URL, etc.
        // Hence we use "_" instead of "." since the latter often has special meaning
        if (!id.match(/^[a-z0-9]+(_[a-z0-9]+)*$/)) {
            throw new Error("Invalid language ID \"" + id + "\": Only groups of lower case letters and numbers are allowed, separated by underscores.");
        }
        if (_languages[id]) {
            throw new Error("Language \"" + id + "\" is already defined");
        }

        _validateNonEmptyString(name, "name");
        
        this._id   = id;
        this._name = name;
        
        this._fileExtensions    = [];
        this._fileNames         = [];
        this._modeToLanguageMap = {};
        this._lineCommentSyntax = [];
    }
    
    
    /** @type {string} Identifier for this language */
    Language.prototype._id = null;
    
    /** @type {string} Human-readable name of this language */
    Language.prototype._name = null;
    
    /** @type {?Language} Parent language */
    Language.prototype._parent = null;
    
    /** @type {string} CodeMirror mode for this language */
    Language.prototype._mode = null;
    
    /** @type {Array.<string>} File extensions that use this language */
    Language.prototype._fileExtensions = null;
    
    /** @type {Array.<string>} File names for extensionless files that use this language */
    Language.prototype._fileNames = null;
    
    /** @type {Array.<string>} Line comment syntax */
    Language.prototype._lineCommentSyntax = null;
    
    /** @type {{ prefix: string, suffix: string }} Block comment syntax */
    Language.prototype._blockCommentSyntax = null;
    
    /** @type {Object.<string,Language>} Which language to use for what CodeMirror mode */
    Language.prototype._modeToLanguageMap = null;
    
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
     * Set the language this language inherits from
     * @param {string|Language} parent The parent language or its ID
     */
    Language.prototype._setParent = function (parent) {
        if (!(parent instanceof Language)) {
            parent = getLanguage(parent);
        }
        this._parent = parent;
    };

    /**
     * Determines whether the language is this language's parent, or the parent's parent, etc.
     * @param {Language} The language to test
     * @return {boolean} True if language is an ancestor of this language, false otherwise
     **/
    Language.prototype.hasAncestor = function (language) {
        if (!this._parent) {
            return false;
        }
        if (this._parent === language) {
            return true;
        }
        return this._parent.hasAncestor(language);
    };
    
    /**
     * Returns the CodeMirror mode for this language.
     * @return {string} The mode
     */
    Language.prototype.getMode = function () {
        return this._mode || (this._parent && this._parent.getMode());
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
            definesOwnMode,
            mimeMode; // Mode can be an array specifying a mode plus a MIME mode defined by that mode ["clike", "text/x-c++src"]
        
        if (Array.isArray(mode)) {
            if (mode.length !== 2) {
                throw new Error("Mode must either be a string or an array containing two strings");
            }
            mimeMode = mode[1];
            mode = mode[0];
        }
        
        definesOwnMode = !this._parent || mode;
        
        if (definesOwnMode) {
            // mode must not be empty for root languages. Use "null" (the string "null") mode for plain text
            _validateNonEmptyString(mode, "mode");
        }
        
        var finish = function () {
            if (definesOwnMode && !CodeMirror.modes[mode]) {
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
            
            if (definesOwnMode) {
                // This mode is now only about what to tell CodeMirror
                // The base mode was only necessary to load the proper mode file
                self._mode = mimeMode || mode;
                self._wasModified();
            }
            
            result.resolve(self);
        };
        
        if (!definesOwnMode || CodeMirror.modes[mode]) {
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
     */
    Language.prototype.addFileExtension = function (extension) {
        extension = _normalizeFileExtension(extension);
        
        if (this._fileExtensions.indexOf(extension) === -1) {
            this._fileExtensions.push(extension);
            
            var language = _fileExtensionToLanguageMap[extension];
            if (language && !this.hasAncestor(language)) {
                console.warn("Cannot register file extension \"" + extension + "\" for " + this._name + ", it already belongs to " + language._name);
            } else {
                _fileExtensionToLanguageMap[extension] = this;
                // Must be an ancestor
                if (language) {
                    language._removeFileExtension(extension);
                }
            }
            
            this._wasModified();
        }
    };

    /**
     * Adds a file name to the language which is used to match files that don't have extensions like "Makefile" for example.
     * @param {!string} extension An extensionless file name used by this language
     */
    Language.prototype.addFileName = function (name) {
        name = name.toLowerCase();
        
        if (this._fileNames.indexOf(name) === -1) {
            this._fileNames.push(name);
            
            var language = _fileNameToLanguageMap[name];
            if (language && !this.hasAncestor(language)) {
                console.warn("Cannot register file name \"" + name + "\" for " + this._name + ", it already belongs to " + language._name);
            } else {
                _fileNameToLanguageMap[name] = this;
                // Must be an ancestor
                if (language) {
                    language._removeFileName(name);
                }
            }
            
            this._wasModified();
        }
    };
    
    /**
     * @private
     * Removes a file extension from this language
     * @param {string} extension File extension to remove
     */
    Language.prototype._removeFileExtension = function (extension) {
        var index = this._fileExtensions.indexOf(extension);
        if (index === -1) {
            return;
        }
        
        this._fileExtensions.splice(index, 1);
        this._wasModified();
    };

    /**
     * @private
     * Removes a file name from this language
     * @param {string} fileName File name to remove
     */
    Language.prototype._removeFileName = function (fileName) {
        var index = this._fileNames.indexOf(fileName);
        if (index === -1) {
            return;
        }
        
        this._fileNames.splice(index, 1);
        this._wasModified();
    };
    
    /**
     * Returns whether the line comment syntax is defined for this language.
     * @return {boolean} Whether line comments are supported
     */
    Language.prototype.hasLineCommentSyntax = function () {
        // Cast as Boolean to return false instead of null (i.e. this._parent)
        return Boolean(this._lineCommentSyntax.length > 0 || (this._parent && this._parent.hasLineCommentSyntax()));
    };
    
    /**
     * Returns an array of prefixes to use for line comments.
     * @return {Array.<string>} The prefixes
     */
    Language.prototype.getLineCommentPrefixes = function () {
        return this._lineCommentSyntax.concat(this._parent ? this._parent.getLineCommentPrefixes() : []);
    };

    /**
     * Sets the prefixes to use for line comments in this language.
     * @param {!string|Array.<string>} prefix Prefix string or and array of prefix strings
     *   to use for line comments (i.e. "//" or ["//", "#"])
     */
    Language.prototype.setLineCommentSyntax = function (prefix) {
        var prefixes = Array.isArray(prefix) ? prefix : [prefix];
        var i;
        
        if (prefixes.length) {
            this._lineCommentSyntax = [];
            for (i = 0; i < prefixes.length; i++) {
                _validateNonEmptyString(String(prefixes[i]), "prefix");
                
                this._lineCommentSyntax.push(prefixes[i]);
            }
            this._wasModified();
        } else {
            console.error("The prefix array should not be empty");
        }
    };
    
    /**
     * Returns whether the block comment syntax is defined for this language.
     * @return {boolean} Whether block comments are supported
     */
    Language.prototype.hasBlockCommentSyntax = function () {
        // Cast as Boolean to return false instead of null (i.e. this._parent)
        return Boolean(this._blockCommentSyntax || (this._parent && this._parent.hasBlockCommentSyntax()));
    };
    
    /**
     * Returns the prefix to use for block comments.
     * @return {string} The prefix
     */
    Language.prototype.getBlockCommentPrefix = function () {
        return (this._blockCommentSyntax && this._blockCommentSyntax.prefix) || (this._parent && this._parent.getBlockCommentPrefix());
    };

    /**
     * Returns the suffix to use for block comments.
     * @return {string} The suffix
     */
    Language.prototype.getBlockCommentSuffix = function () {
        return (this._blockCommentSyntax && this._blockCommentSyntax.suffix) || (this._parent && this._parent.getBlockCommentSuffix());
    };
    
    /**
     * Sets the prefix and suffix to use for blocks comments in this language.
     * @param {!string} prefix Prefix string to use for block comments (e.g. "<!--")
     * @param {!string} suffix Suffix string to use for block comments (e.g. "-->")
     */
    Language.prototype.setBlockCommentSyntax = function (prefix, suffix) {
        _validateNonEmptyString(prefix, "prefix");
        _validateNonEmptyString(suffix, "suffix");
        
        this._blockCommentSyntax = { prefix: prefix, suffix: suffix };
        this._wasModified();
    };
    
    /**
     * Returns either a language associated with the mode or the fallback language.
     * Used to disambiguate modes used by multiple languages.
     * @param {!string} mode The mode to associate the language with
     * @return {Language} This language if it uses the mode, or whatever {@link LanguageManager#_getLanguageForMode} returns
     */
    Language.prototype.getLanguageForMode = function (mode) {
        if (mode === this.getMode()) {
            return this;
        }

        return this._modeToLanguageMap[mode] || (this._parent && this._parent.getLanguageForMode(mode)) || _getLanguageForMode(mode);
    };

    /**
     * Overrides a mode-to-language association for this particular language only.
     * Used to disambiguate modes used by multiple languages.
     * @param {!string} mode The mode to associate the language with
     * @param {!Language} language The language to associate with the mode
     * @private
     */
    Language.prototype._setLanguageForMode = function (mode, language) {
        if (mode === this.getMode() && language !== this) {
            throw new Error("A language must always map its mode to itself");
        }
        this._modeToLanguageMap[mode] = language;
        this._wasModified();
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
        
        var language = new Language(id, definition.name),
            fileExtensions = definition.fileExtensions,
            fileNames = definition.fileNames,
            l,
            i;
        
        var parent = definition.parent;
        if (parent) {
            language._setParent(parent);
        }
        
        var blockComment = definition.blockComment;
        if (blockComment) {
            language.setBlockCommentSyntax(blockComment[0], blockComment[1]);
        }
        
        var lineComment = definition.lineComment;
        if (lineComment) {
            language.setLineCommentSyntax(lineComment);
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