/*
 * Copyright (c) 2012 - present Adobe Systems Incorporated. All rights reserved.
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

/*unittests: LanguageManager*/

/**
 * LanguageManager provides access to the languages supported by Brackets
 *
 * To find out which languages we support by default, have a look at languages.json.
 *
 * To get access to an existing language, call getLanguage():
 *
 *     var language = LanguageManager.getLanguage("<id>");
 *
 * To define your own languages, call defineLanguage():
 *
 *     LanguageManager.defineLanguage("haskell", {
 *         name: "Haskell",
 *         mode: "haskell",
 *         fileExtensions: ["hs"],
 *         blockComment: ["{-", "-}"],
 *         lineComment: ["--"]
 *     });
 *
 * To use that language and its related mode, wait for the returned promise to be resolved:
 *
 *     LanguageManager.defineLanguage("haskell", definition).done(function (language) {
 *         console.log("Language " + language.getName() + " is now available!");
 *     });
 *
 * The extension can also contain dots:
 *
 *     LanguageManager.defineLanguage("literatecoffeescript", {
 *         name: "Literate CoffeeScript",
 *         mode: "coffeescript",
 *         fileExtensions: ["litcoffee", "coffee.md"]
 *     });
 *
 * You can also specify file names:
 *
 *     LanguageManager.defineLanguage("makefile", {
 *         name: "Make",
 *         mode: ["null", "text/plain"],
 *         fileNames: ["Makefile"]
 *     });
 *
 * You can combine file names and extensions, or not define them at all.
 *
 * You can also refine an existing language:
 *
 *     var language = LanguageManager.getLanguage("haskell");
 *     language.setLineCommentSyntax(["--"]);
 *     language.setBlockCommentSyntax("{-", "-}");
 *     language.addFileExtension("lhs");
 *
 * Some CodeMirror modes define variations of themselves. They are called MIME modes.
 * To find existing MIME modes, search for "CodeMirror.defineMIME" in thirdparty/CodeMirror/mode
 * For instance, C++, C# and Java all use the clike (C-like) mode with different settings and a different MIME name.
 * You can refine the mode definition by specifying the MIME mode as well:
 *
 *     LanguageManager.defineLanguage("csharp", {
 *         name: "C#",
 *         mode: ["clike", "text/x-csharp"],
 *         ...
 *     });
 *
 * Defining the base mode is still necessary to know which file to load.
 * However, language.getMode() will return just the MIME mode if one was
 * specified.
 *
 * If you need to configure a mode, you can just create a new MIME mode and use that:
 *
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
 *
 * You can also defines binary file types, i.e. Brackets supports image files by default,
 * such as *.jpg, *.png etc.
 * Binary files do not require mode because modes are specific to CodeMirror, which
 * only handles text based file types.
 * To register a binary language the isBinary flag must be set, i.e.
 *
 *     LanguageManager.defineLanguage("audio", {
 *         name: "Audio",
 *         fileExtensions: ["mp3", "wav", "aif", "aiff", "ogg"],
 *         isBinary: true
 *     });
 *
 *
 * LanguageManager dispatches two events:
 *
 *  - languageAdded -- When any new Language is added. 2nd arg is the new Language.
 *  - languageModified -- When the attributes of a Language change, or when the Language gains or loses
 *          file extension / filename mappings. 2nd arg is the modified Language.
 */
define(function (require, exports, module) {
    "use strict";


    // Dependencies
    var CodeMirror            = require("thirdparty/CodeMirror/lib/codemirror"),
        EventDispatcher       = require("utils/EventDispatcher"),
        Async                 = require("utils/Async"),
        FileUtils             = require("file/FileUtils"),
        Strings               = require("strings"),
        _defaultLanguagesJSON = require("text!language/languages.json"),
        _                     = require("thirdparty/lodash"),

        // PreferencesManager is loaded near the end of the file
        PreferencesManager;

    // State
    var _fallbackLanguage               = null,
        _pendingLanguages               = {},
        _languages                      = {},
        _baseFileExtensionToLanguageMap = {},
        _fileExtensionToLanguageMap     = Object.create(_baseFileExtensionToLanguageMap),
        _fileNameToLanguageMap          = {},
        _filePathToLanguageMap          = {},
        _modeToLanguageMap              = {},
        _ready;

    // Constants

    var _EXTENSION_MAP_PREF = "language.fileExtensions",
        _NAME_MAP_PREF      = "language.fileNames";

    // Tracking for changes to mappings made by preferences
    var _prefState = {};

    _prefState[_EXTENSION_MAP_PREF] = {
        last: {},
        overridden: {},
        add: "addFileExtension",
        remove: "removeFileExtension",
        get: "getLanguageForExtension"
    };

    _prefState[_NAME_MAP_PREF] = {
        last: {},
        overridden: {},
        add: "addFileName",
        remove: "removeFileName",
        get: "getLanguageForPath"
    };

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
            console.warn("CodeMirror mode \"" + mode + "\" is already used by language " + _modeToLanguageMap[mode]._name + " - cannot fully register language " + language._name +
                         " using the same mode. Some features will treat all content with this mode as language " + _modeToLanguageMap[mode]._name);
            return;
        }

        _modeToLanguageMap[mode] = language;
    }

    /**
     * Resolves a language ID to a Language object.
     * File names have a higher priority than file extensions.
     * @param {!string} id Identifier for this language: lowercase letters, digits, and _ separators (e.g. "cpp", "foo_bar", "c99")
     * @return {Language} The language with the provided identifier or undefined
     */
    function getLanguage(id) {
        return _languages[id];
    }

    /**
     * Resolves a file extension to a Language object.
     * *Warning:* it is almost always better to use getLanguageForPath(), since Language can depend
     * on file name and even full path. Use this API only if no relevant file/path exists.
     * @param {!string} extension Extension that language should be resolved for
     * @return {?Language} The language for the provided extension or null if none exists
     */
    function getLanguageForExtension(extension) {
        return _fileExtensionToLanguageMap[extension.toLowerCase()];
    }

    /**
     * Resolves a file path to a Language object.
     * @param {!string} path Path to the file to find a language for
     * @param {?boolean} ignoreOverride If set to true will cause the lookup to ignore any
     *      overrides and return default binding. By default override is not ignored.
     *
     * @return {Language} The language for the provided file type or the fallback language
     */
    function getLanguageForPath(path, ignoreOverride) {
        var fileName,
            language = _filePathToLanguageMap[path],
            extension,
            parts;

        // if there's an override, return it
        if (!ignoreOverride && language) {
            return language;
        }

        fileName = FileUtils.getBaseName(path).toLowerCase();
        language = _fileNameToLanguageMap[fileName];

        // If no language was found for the file name, use the file extension instead
        if (!language) {
            // Split the file name into parts:
            //   "foo.coffee.md"   => ["foo", "coffee", "md"]
            //   ".profile.bak"    => ["", "profile", "bak"]
            //   "1. Vacation.txt" => ["1", " Vacation", "txt"]
            parts = fileName.split(".");

            // A leading dot does not indicate a file extension, but marks the file as hidden => remove it
            if (parts[0] === "") {
                // ["", "profile", "bak"] => ["profile", "bak"]
                parts.shift();
            }

            // The first part is assumed to be the title, not the extension => remove it
            //   ["foo", "coffee", "md"]   => ["coffee", "md"]
            //   ["profile", "bak"]        => ["bak"]
            //   ["1", " Vacation", "txt"] => [" Vacation", "txt"]
            parts.shift();

            // Join the remaining parts into a file extension until none are left or a language was found
            while (!language && parts.length) {
                // First iteration:
                //   ["coffee", "md"]     => "coffee.md"
                //   ["bak"]              => "bak"
                //   [" Vacation", "txt"] => " Vacation.txt"
                // Second iteration (assuming no language was found for "coffee.md"):
                //   ["md"]  => "md"
                //   ["txt"] => "txt"
                extension = parts.join(".");
                language  = _fileExtensionToLanguageMap[extension];
                // Remove the first part
                // First iteration:
                //   ["coffee", "md"]     => ["md"]
                //   ["bak"]              => []
                //   [" Vacation", "txt"] => ["txt"]
                // Second iteration:
                //   ["md"]  => []
                //   ["txt"] => []
                parts.shift();
            }
        }

        return language || _fallbackLanguage;
    }

    /**
     * Returns a map of all the languages currently defined in the LanguageManager. The key to
     * the map is the language id and the value is the language object.
     *
     * @return {Object.<string, Language>} A map containing all of the
     *      languages currently defined.
     */
    function getLanguages() {
        return $.extend({}, _languages); // copy to prevent modification
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
        exports.trigger("languageAdded", language);
    }

    /**
     * @private
     * Notify listeners when a language is modified
     * @param {!Language} language The modified language
     */
    function _triggerLanguageModified(language) {
        exports.trigger("languageModified", language);
    }

    /**
     * Adds a language mapping for the specified fullPath. If language is falsy (null or undefined), the mapping
     * is removed. The override is NOT persisted across Brackets sessions.
     *
     * @param {!fullPath} fullPath absolute path of the file
     * @param {?object} language language to associate the file with or falsy value to remove any existing override
     */
    function setLanguageOverrideForPath(fullPath, language) {
        var oldLang = getLanguageForPath(fullPath);
        if (!language) {
            delete _filePathToLanguageMap[fullPath];
        } else {
            _filePathToLanguageMap[fullPath] = language;
        }
        var newLang = getLanguageForPath(fullPath);

        // Old language changed since this path is no longer mapped to it
        _triggerLanguageModified(oldLang);
        // New language changed since a path is now mapped to it that wasn't before
        _triggerLanguageModified(newLang);
    }

    /**
     * Resets all the language overrides for file paths. Used by unit tests only.
     */
    function _resetPathLanguageOverrides() {
        _filePathToLanguageMap = {};
    }

    /**
     * Get the file extension (excluding ".") given a path OR a bare filename.
     * Returns "" for names with no extension.
     * If the only `.` in the file is the first character,
     * returns "" as this is not considered an extension.
     * This method considers known extensions which include `.` in them.
     *
     * @param {string} fullPath full path to a file or directory
     * @return {string} Returns the extension of a filename or empty string if
     * the argument is a directory or a filename with no extension
     */
    function getCompoundFileExtension(fullPath) {
        var baseName = FileUtils.getBaseName(fullPath),
            parts = baseName.split(".");

        // get rid of file name
        parts.shift();
        if (baseName[0] === ".") {
            // if starts with a `.`, then still consider it as file name
            parts.shift();
        }

        var extension = [parts.pop()], // last part is always an extension
            i = parts.length;
        while (i--) {
            if (getLanguageForExtension(parts[i])) {
                extension.unshift(parts[i]);
            } else {
                break;
            }
        }
        return extension.join(".");
    }



    /**
     * Model for a language.
     * @constructor
     */
    function Language() {
        this._fileExtensions    = [];
        this._fileNames         = [];
        this._modeToLanguageMap = {};
        this._lineCommentSyntax = [];
    }


    /**
     * Identifier for this language
     * @type {string}
     */
    Language.prototype._id = null;

    /**
     * Human-readable name of this language
     * @type {string}
     */
    Language.prototype._name = null;

    /**
     * CodeMirror mode for this language
     * @type {string}
     */
    Language.prototype._mode = null;

    /**
     * File extensions that use this language
     * @type {Array.<string>}
     */
    Language.prototype._fileExtensions = null;

    /**
     * File names for extensionless files that use this language
     * @type {Array.<string>}
     */
    Language.prototype._fileNames = null;

    /**
     * Line comment syntax
     * @type {Array.<string>}
     */
    Language.prototype._lineCommentSyntax = null;

    /**
     * Which language to use for what CodeMirror mode
     * @type {Object.<string,Language>}
     */
    Language.prototype._modeToLanguageMap = null;

    /**
     * Block comment syntax
     * @type {{ prefix: string, suffix: string }}
     */
    Language.prototype._blockCommentSyntax = null;

    /**
     * Whether or not the language is binary
     * @type {boolean}
     */
    Language.prototype._isBinary = false;

    /**
     * Returns the identifier for this language.
     * @return {string} The identifier
     */
    Language.prototype.getId = function () {
        return this._id;
    };

    /**
     * Sets the identifier for this language or prints an error to the console.
     * @param {!string} id Identifier for this language: lowercase letters, digits, and _ separators (e.g. "cpp", "foo_bar", "c99")
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
     * @param {!string} name Human-readable name of the language, as it's commonly referred to (e.g. "C++")
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
     * @param {(string|Array.<string>)} mode  CodeMirror mode (e.g. "htmlmixed"), optionally paired with a MIME mode defined by
     *      that mode (e.g. ["clike", "text/x-c++src"]). Unless the mode is located in thirdparty/CodeMirror/mode/<name>/<name>.js,
     *      you need to first load it yourself.
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
            require(["thirdparty/CodeMirror/mode/" + mode + "/" + mode], finish);
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
     * Adds one or more file extensions to this language.
     * @param {!string|Array.<string>} extension A file extension (or array thereof) used by this language
     */
    Language.prototype.addFileExtension = function (extension) {
        if (Array.isArray(extension)) {
            extension.forEach(this._addFileExtension.bind(this));
        } else {
            this._addFileExtension(extension);
        }
    };
    Language.prototype._addFileExtension = function (extension) {
        // Remove a leading dot if present
        if (extension.charAt(0) === ".") {
            extension = extension.substr(1);
        }

        // Make checks below case-INsensitive
        extension = extension.toLowerCase();

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
     * Unregisters one or more file extensions from this language.
     * @param {!string|Array.<string>} extension File extension (or array thereof) to stop using for this language
     */
    Language.prototype.removeFileExtension = function (extension) {
        if (Array.isArray(extension)) {
            extension.forEach(this._removeFileExtension.bind(this));
        } else {
            this._removeFileExtension(extension);
        }
    };
    Language.prototype._removeFileExtension = function (extension) {
        // Remove a leading dot if present
        if (extension.charAt(0) === ".") {
            extension = extension.substr(1);
        }

        // Make checks below case-INsensitive
        extension = extension.toLowerCase();

        var index = this._fileExtensions.indexOf(extension);
        if (index !== -1) {
            this._fileExtensions.splice(index, 1);

            delete _fileExtensionToLanguageMap[extension];

            this._wasModified();
        }
    };

    /**
     * Adds one or more file names to the language which is used to match files that don't have extensions like "Makefile" for example.
     * @param {!string|Array.<string>} extension An extensionless file name (or array thereof) used by this language
     */
    Language.prototype.addFileName = function (name) {
        if (Array.isArray(name)) {
            name.forEach(this._addFileName.bind(this));
        } else {
            this._addFileName(name);
        }
    };
    Language.prototype._addFileName = function (name) {
        // Make checks below case-INsensitive
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
    };

    /**
     * Unregisters one or more file names from this language.
     * @param {!string|Array.<string>} extension An extensionless file name (or array thereof) used by this language
     */
    Language.prototype.removeFileName = function (name) {
        if (Array.isArray(name)) {
            name.forEach(this._removeFileName.bind(this));
        } else {
            this._removeFileName(name);
        }
    };
    Language.prototype._removeFileName = function (name) {
        // Make checks below case-INsensitive
        name = name.toLowerCase();

        var index = this._fileNames.indexOf(name);
        if (index !== -1) {
            this._fileNames.splice(index, 1);

            delete _fileNameToLanguageMap[name];

            this._wasModified();
        }
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
     * @param {!(string|Array.<string>)} prefix Prefix string or an array of prefix strings
     *   to use for line comments (e.g. "//" or ["//", "#"])
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
     * @return {Language} This language if it uses the mode, or whatever {@link #_getLanguageForMode} returns
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
     * @see #_triggerLanguageModified
     * @private
     */
    Language.prototype._wasModified = function () {
        if (_languages[this._id]) {
            _triggerLanguageModified(this);
        }
    };

    /**
     * Indicates whether or not the language is binary (e.g., image or audio).
     * @return {boolean}
     */
    Language.prototype.isBinary = function () {
        return this._isBinary;
    };

    /**
     * Sets whether or not the language is binary
     * @param {!boolean} isBinary
     */
    Language.prototype._setBinary = function (isBinary) {
        this._isBinary = isBinary;
    };

    /**
     * Defines a language.
     *
     * @param {!string}               id                        Unique identifier for this language: lowercase letters, digits, and _ separators (e.g. "cpp", "foo_bar", "c99")
     * @param {!Object}               definition                An object describing the language
     * @param {!string}               definition.name           Human-readable name of the language, as it's commonly referred to (e.g. "C++")
     * @param {Array.<string>}        definition.fileExtensions List of file extensions used by this language (e.g. ["php", "php3"] or ["coffee.md"] - may contain dots)
     * @param {Array.<string>}        definition.fileNames      List of exact file names (e.g. ["Makefile"] or ["package.json]). Higher precedence than file extension.
     * @param {Array.<string>}        definition.blockComment   Array with two entries defining the block comment prefix and suffix (e.g. ["<!--", "-->"])
     * @param {(string|Array.<string>)} definition.lineComment  Line comment prefixes (e.g. "//" or ["//", "#"])
     * @param {(string|Array.<string>)} definition.mode         CodeMirror mode (e.g. "htmlmixed"), optionally with a MIME mode defined by that mode ["clike", "text/x-c++src"]
     *                                                          Unless the mode is located in thirdparty/CodeMirror/mode/<name>/<name>.js, you need to first load it yourself.
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

        function _finishRegisteringLanguage() {
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

            language._setBinary(!!definition.isBinary);

            // store language to language map
            _languages[language.getId()] = language;
        }

        if (!language._setId(id) || !language._setName(name) ||
                (blockComment && !language.setBlockCommentSyntax(blockComment[0], blockComment[1])) ||
                (lineComment && !language.setLineCommentSyntax(lineComment))) {
            result.reject();
            return result.promise();
        }


        if (definition.isBinary) {
            // add file extensions and store language to language map
            _finishRegisteringLanguage();

            result.resolve(language);
            // Not notifying DocumentManager via event LanguageAdded, because DocumentManager
            // does not care about binary files.
        } else {
            // track languages that are currently loading
            _pendingLanguages[id] = language;

            language._loadAndSetMode(definition.mode).done(function () {

                // globally associate mode to language
                _setLanguageForMode(language.getMode(), language);

                // add file extensions and store language to language map
                _finishRegisteringLanguage();

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
        }

        return result.promise();
    }

    /**
     * @private
     *
     * If a default file extension or name was overridden by a pref, restore it.
     *
     * @param {string} name Extension or filename that should be restored
     * @param {{overridden: string, add: string}} prefState object for the pref that is currently being updated
     */
    function _restoreOverriddenDefault(name, state) {
        if (state.overridden[name]) {
            var language = getLanguage(state.overridden[name]);
            language[state.add](name);
            delete state.overridden[name];
        }
    }

    /**
     * @private
     *
     * Updates extension and filename mappings from languages based on the current preferences values.
     *
     * The preferences look like this in a prefs file:
     *
     * Map *.foo to javascript, *.vm to html
     *
     *     "language.fileExtensions": {
     *         "foo": "javascript",
     *         "vm": "html"
     *     }
     *
     * Map "Gemfile" to ruby:
     *
     *     "language.fileNames": {
     *         "Gemfile": "ruby"
     *     }
     */
    function _updateFromPrefs(pref) {
        var newMapping = PreferencesManager.get(pref),
            newNames = Object.keys(newMapping),
            state = _prefState[pref],
            last = state.last,
            overridden = state.overridden;

        // Look for added and changed names (extensions or filenames)
        newNames.forEach(function (name) {
            var language;
            if (newMapping[name] !== last[name]) {
                if (last[name]) {
                    language = getLanguage(last[name]);
                    if (language) {
                        language[state.remove](name);

                        // If this name that was previously mapped was overriding a default
                        // restore it now.
                        _restoreOverriddenDefault(name, state);
                    }
                }

                language = exports[state.get](name);
                if (language) {
                    language[state.remove](name);

                    // We're removing a name that was defined in Brackets or an extension,
                    // so keep track of how it used to be mapped.
                    if (!overridden[name]) {
                        overridden[name] = language.getId();
                    }
                }
                language = getLanguage(newMapping[name]);
                if (language) {
                    language[state.add](name);
                }
            }
        });

        // Look for removed names (extensions or filenames)
        _.difference(Object.keys(last), newNames).forEach(function (name) {
            var language = getLanguage(last[name]);
            if (language) {
                language[state.remove](name);
                _restoreOverriddenDefault(name, state);
            }
        });
        state.last = newMapping;
    }


    EventDispatcher.makeEventDispatcher(exports);

    // Prevent modes from being overwritten by extensions
    _patchCodeMirror();

    // Define a custom MIME mode here instead of putting it directly into languages.json
    // because JSON files can't contain regular expressions. Also, all other modes so
    // far were strings, so we spare us the trouble of allowing more complex mode values.
    CodeMirror.defineMIME("text/x-brackets-html", {
        "name": "htmlmixed",
        "scriptTypes": [
            {
                "matches": /\/x-handlebars|\/x-mustache|\/ng-template$|^text\/html$/i,
                "mode": "htmlmixed"
            },
            {
                "matches": /^text\/(babel|jsx)$/i,
                "mode": "jsx"
            }
        ]
    });

    // Define SVG MIME type so an SVG language can be defined for SVG-specific code hints.
    // Currently, SVG uses XML mode so it has generic XML syntax highlighting. This can
    // be removed when SVG gets its own CodeMirror mode with SVG syntax highlighting.
    CodeMirror.defineMIME("image/svg+xml", "xml");

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

        // Similarly, the php mode uses clike internally for the PHP parts
        var php = getLanguage("php");
        php._setLanguageForMode("clike", php);

        // Similar hack to the above for dealing with SCSS/CSS.
        var scss = getLanguage("scss");
        scss._setLanguageForMode("css", scss);

        // The fallback language for unknown modes and file extensions
        _fallbackLanguage = getLanguage("unknown");

        // There is a circular dependency between FileUtils and LanguageManager which
        // was introduced in 254b01e2f2eebea4416026d0f40d017b8ca6dbc9
        // and may be preventing us from importing PreferencesManager (which also
        // depends on FileUtils) here. Using the async form of require fixes this.
        require(["preferences/PreferencesManager"], function (pm) {
            PreferencesManager = pm;
            pm.definePreference(_EXTENSION_MAP_PREF, "object", {}, {
                description: Strings.DESCRIPTION_LANGUAGE_FILE_EXTENSIONS
            }).on("change", function () {
                _updateFromPrefs(_EXTENSION_MAP_PREF);
            });
            pm.definePreference(_NAME_MAP_PREF, "object", {}, {
                description: Strings.DESCRIPTION_LANGUAGE_FILE_NAMES
            }).on("change", function () {
                _updateFromPrefs(_NAME_MAP_PREF);
            });
            _updateFromPrefs(_EXTENSION_MAP_PREF);
            _updateFromPrefs(_NAME_MAP_PREF);
        });
    });

    // Private for unit tests
    exports._EXTENSION_MAP_PREF         = _EXTENSION_MAP_PREF;
    exports._NAME_MAP_PREF              = _NAME_MAP_PREF;
    exports._resetPathLanguageOverrides = _resetPathLanguageOverrides;

    // Public methods
    exports.ready                       = _ready;
    exports.defineLanguage              = defineLanguage;
    exports.getLanguage                 = getLanguage;
    exports.getLanguageForExtension     = getLanguageForExtension;
    exports.getLanguageForPath          = getLanguageForPath;
    exports.getLanguages                = getLanguages;
    exports.setLanguageOverrideForPath  = setLanguageOverrideForPath;
    exports.getCompoundFileExtension    = getCompoundFileExtension;
});
