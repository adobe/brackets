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
/*global define, $, brackets, CodeMirror, toString */

define(function (require, exports, module) {
    "use strict";
    
    
    var _languages         = {},
        _fileExtensionsMap = {},
        _modeMap           = {};

   	
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
    
    function _validateString(value, description) {
        if (toString.call(value) !== '[object String]') {
            throw new Error(description + " must be a string");
        }
    }
        
    function _validateNonEmptyString(value, description) {
        _validateString(value, description);
        if (value === "") {
            throw new Error(description + " must not be empty");
        }
    }
    
    function _hasMode(mode) {
        return Boolean(CodeMirror.modes[mode] || CodeMirror.mimeModes[mode]);
    }

    function _validateMode(mode, description) {
        _validateNonEmptyString(mode, description);
        if (!_hasMode(mode)) {
            throw new Error("CodeMirror mode \"" + mode + "\" is not loaded");
        }
    }
    
    function _registerMode(mode, language) {
        if (!_modeMap[mode]) {
            _modeMap[mode] = [];
        } else {
            console.warn("Multiple languages are using the CodeMirror mode \"" + mode + "\"", _modeMap[mode]);
        }
        _modeMap[mode].push(language);
    }

    
    function getLanguage(id) {
        if (!_languages[id]) {
            throw new Error("No definition was provided for language \"" + id + "\"");
        }
        
        return _languages[id];
    }
    
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
        
        return language || defaultLanguage;
    }
    
    function getLanguageForMode(mode) {
        var modes = _modeMap[mode];
        if (modes) {
            return modes[0];
        }
        
        console.log("Called Languages.js getLanguageForMode with an unhandled mode:", mode);
        return defaultLanguage;
    }

    
    // Monkey-patch CodeMirror to prevent modes from being overwritten by extensions
    // We rely on the tokens provided by some of those mode
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
    

    function Language(id, name) {
        _validateString(id, "Language ID");
        if (!id.match(/^[a-z]+$/)) {
            throw new Error("Invalid language ID \"" + id + "\": Only letters a-z are allowed");
        }
        
        _validateNonEmptyString(name, "name");
        
        this.id        = id;
        this.name      = name;
        
        this._fileExtensions = [];
        this._modeMap = {};
    }
    
    Language.prototype.setMode = function (mode, modeAliases) {
        _validateMode(mode, "mode");
        
        this.mode = mode;
        _registerMode(mode, this);

        if (modeAliases) {
            _validateArray(modeAliases, "modeAliases", _validateNonEmptyString);
            
            this.modeAliases = modeAliases;
            for (var i = 0; i < modeAliases.length; i++) {
                _registerMode(modeAliases[i], this);
            }
        }
        
        return this;
    };
    Language.prototype.getFileExtensions = function () {
        return this._fileExtensions.concat();
    };
    
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
    
    Language.prototype._setBlockComment = function (prefix, suffix) {
        _validateNonEmptyString(prefix, "prefix");
        _validateNonEmptyString(suffix, "suffix");
        
        this.blockComment = { prefix: prefix, suffix: suffix };
        
        return this;
    };

    Language.prototype._setLineComment = function (prefix) {
        _validateNonEmptyString(prefix, "prefix");
        
        this.lineComment = { prefix: prefix };
        
        return this;
    };
    
    Language.prototype._isOwnMode = function (mode) {
        return mode === this.mode || this.modeAliases.indexOf(mode) !== -1;
    }
    
    Language.prototype.getLanguageForMode = function (mode) {
        if (this._isOwnMode(mode)) {
            return this;
        }

        return this._modeMap[mode] || getLanguageForMode(mode);
    };

    Language.prototype.setLanguageForMode = function (mode, language) {
        if (this._isOwnMode(mode) && language !== this) {
            throw new Error("A language must always map its mode and mode aliases to itself");
        }
        this._modeMap[mode] = language;
        
        return this;
    };
    
    
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
            language._setBlockComment(blockComment[0], blockComment[1]);
        }
        
        var lineComment = definition.lineComment;
        if (lineComment) {
            language._setLineComment(lineComment);
        }
        
        var mode = definition.mode, mimeMode = definition.mimeMode, modeAliases = definition.modeAliases;
        if (mode) {
            
            var setMode = function () {
                language.setMode(mimeMode || mode, modeAliases);
            }
            
            if (_hasMode(mode)) {
                setMode();
            } else {
                loadBuiltinMode(mode).done(function () {
                    // For some reason, passing setMode directly to done swallows the exceptions it throws
                    window.setTimeout(setMode);
                })
            }
        }
        
        _languages[id] = language;
        
        return language;
    }
    
    /**
     * Loads a mode stored in thirdparty/CodeMirror2/mode/
     * @param {!string} mode Name of the mode to load
     * @param {string} subDirectory Name of a sub directory with mode files (e.g. "rpm")
     * @return {!$.Promise} A promise object that is resolved with when the mode has been loaded
     */
    function loadBuiltinMode(mode, subDirectory) {
        var result = new $.Deferred();
        
        var modePath = mode + "/" + mode;
        if (subDirectory) {
            modePath = subDirectory + "/" + modePath;
        }
        
        if (!modePath.match(/^[a-zA-Z0-9_-]+(\/[a-zA-Z0-9_-]+)*$/)) {
            throw new Error("loadBuiltinMode call resulted in possibly unsafe path " + modePath);
        }
        
        require(["thirdparty/CodeMirror2/mode/" + modePath], result.resolve, result.reject);
        
        return result.promise();
    }

    
    _patchCodeMirror();
    
    var defaultLanguage = defineLanguage("unknown", { "name": "Unknown" });
    $.getJSON("language/languages.json", function (defaultLanguages) {
        defaultLanguages.html.mode = {
            "name": "htmlmixed",
            "scriptTypes": [{"matches": /\/x-handlebars-template|\/x-mustache/i,
                           "mode": null}]
        };
        
        $.each(defaultLanguages, defineLanguage);
    });
    
    
    exports = module.exports = {
        defaultLanguage:             defaultLanguage,
        defineLanguage:              defineLanguage,
        getLanguage:                 getLanguage,
        getLanguageForFileExtension: getLanguageForFileExtension,
        getLanguageForMode:          getLanguageForMode,
        loadBuiltinMode:             loadBuiltinMode
    };
});