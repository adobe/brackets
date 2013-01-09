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
	
	var languages         = {},
		fileExtensionsMap = {},
		modeMap           = {};
		
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
	
	function Language(id, name, mimeType) {
		_validateString(id, "Language ID");
		if (!id.match(/^[a-z]+$/)) {
			throw new Error("Invalid language ID \"" + id + "\": Only letters a-z are allowed");
		}
		
		_validateNonEmptyString(name, "name");
		_validateNonEmptyString(mimeType, "type");
		
		this.id       = id;
		this.name     = name;
		this.mimeType = mimeType;
		
		this.fileExtensions = [];
		this.modeMap = {};
	}
	
	Language.prototype.addFileExtension = function (extension) {
		if (this.fileExtensions.indexOf(extension) === -1) {
			this.fileExtensions.push(extension);
			
			var language = fileExtensionsMap[extension];
			if (language) {
				console.warn("Cannot register file extension \"" + extension + "\" for " + this.name + ", it already belongs to " + language.name);
			} else {
				fileExtensionsMap[extension] = this;
			}
		}
			
		return this;
	};
	
	Language.prototype.setBlockComment = function (prefix, suffix) {
		_validateNonEmptyString(prefix, "prefix");
		_validateNonEmptyString(suffix, "suffix");
		
		this.blockComment = { prefix: prefix, suffix: suffix };
		
		return this;
	};

	Language.prototype.setLineComment = function (prefix) {
		_validateNonEmptyString(prefix, "prefix");
		
		this.lineComment = { prefix: prefix };
		
		return this;
	};
	
	Language.prototype.setMode = function (mode) {
		_validateNonEmptyString(mode, "mode");
		if (!CodeMirror.modes[mode]) {
			throw new Error("CodeMirror mode \"" + mode + "\" is not loaded");
		}
		
		this.mode = mode;
		if (!modeMap[mode]) {
			modeMap[mode] = [];
		} else {
			console.warn("Multiple languages are using the CodeMirror mode \"" + mode + "\"", modeMap[mode]);
		}
		modeMap[mode].push(this);
		
		return this;
	};
	
	Language.prototype.getLanguageForMode = function (mode) {
		if (mode === this.mode) {
			return this;
		}

		return this.modeMap[mode] || getLanguageForMode(mode);
	}

	Language.prototype.setLanguageForMode = function (mode, language) {
		if (mode === this.mode && language !== this) {
			throw new Exception("A language must always map its mode to itself");
		}
		this.modeMap[mode] = language;
		
		return this;
	}
	
	function defineLanguage(id, name, mimeType) {
		if (languages[id]) {
			throw new Error("Language \"" + id + "\" is already defined");
		}
		
		var language = new Language(id, name, mimeType);
		languages[id] = language;
		
		return language;
	}
	
	function getLanguage(id) {
		if (!languages[id]) {
			throw new Error("No definition was provided for language \"" + id + "\"");
		}
		
		return languages[id];
	}
	
	function getLanguageForFileExtension(extension) {
		return fileExtensionsMap[extension];
	}
	
	function getLanguageForMode(mode) {
		var modes = modeMap[mode];
		if (modes) {
			return modes[0];
		}
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

	_patchCodeMirror();
	
	module.exports = {
		defineLanguage:              defineLanguage,
		getLanguage:                 getLanguage,
		getLanguageForFileExtension: getLanguageForFileExtension,
		getLanguageForMode:          getLanguageForMode
	};
});