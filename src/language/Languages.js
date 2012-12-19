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
		codeMirrorModeMap = {};
		
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
	
	function _validateNonEmptyArray(value, description, validateEntry) {
		_validateArray(value, description, validateEntry);
		if (value.length === 0) {
			throw new Error(description + " must not be empty");
		}
	}
	
	function _validateId(id) {
		_validateString(id, "Language ID");
		if (!id.match(/^[a-z]+$/)) {
			throw new Error("Invalid language ID \"" + id + "\": Only letters a-z are allowed");
		}
	}
	
	function _validateExtensions(extensions) {
        var i, extension, language;
		_validateNonEmptyArray(extensions, "definition.extensions", _validateNonEmptyString);
		
		for (i = 0; i < extensions.length; i++) {
			extension = extensions[i];
			language = fileExtensionsMap[extension];
			if (language) {
				console.warn("Cannot register file extension \"" + extension + "\", it already belongs to " + language.name);
			}
		}
	}
	
	function _validateSyntax(syntax) {
		// Syntax entry is optional
		if (!syntax) {
			return;
		}
		
		if (syntax.blockComment) {
			_validateNonEmptyString(syntax.blockComment.prefix, "definition.syntax.blockComment.prefix");
			_validateNonEmptyString(syntax.blockComment.suffix, "definition.syntax.blockComment.suffix");
		}
		
		if (syntax.lineComment) {
			_validateNonEmptyString(syntax.lineComment.prefix, "definition.syntax.lineComment.prefix");
		}
	}
	
	function _validateMode(mode) {
		if (!mode) {
			throw new Error("definition.mode is empty");
		}
		if (!mode.CodeMirror) {
			throw new Error("definition.mode.CodeMirror is empty");
		}
		
		if (mode.CodeMirror && !CodeMirror.modes[mode.CodeMirror]) {
			throw new Error("CodeMirror mode \"" + mode.CodeMirror + "\" not found");
		}
	}
	
	function _validateDefinition(definition) {
		if (!definition) {
			throw new Error("No language definition was passed");
		}
		_validateNonEmptyString(definition.name, "definition.name");
		_validateNonEmptyString(definition.type, "definition.type");
		
		_validateExtensions(definition.extensions);
		_validateSyntax(definition.syntax);
		_validateMode(definition.mode);
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

	function Language(id, definition) {
		this.id         = id;
		this.name       = definition.name;
		this.extensions = definition.extensions;
		this.mode       = definition.mode;
		this.syntax     = definition.syntax || {};
	}
	
	function defineLanguage(id, definition) {
        var i, language, extensions, mode;
      
		_validateId(id);
		_validateDefinition(definition);
		
		if (languages[id]) {
			throw new Error("Language \"" + id + "\" is already defined");
		}
		
		language   = new Language(id, definition);
		extensions = language.extensions;
		mode       = language.mode.CodeMirror;
		
		languages[id] = language;
		
		if (!codeMirrorModeMap[mode]) {
			codeMirrorModeMap[mode] = [];
		} else {
			console.warn("Multiple CodeMirror modes in use for the same language", codeMirrorModeMap[mode]);
		}
		codeMirrorModeMap[mode].push(language);
		
		for (i = 0; i < extensions.length; i++) {
			fileExtensionsMap[extensions[i]] = language;
		}
		
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
	
	function getLanguageForCodeMirrorMode(mode) {
		var modes = codeMirrorModeMap[mode];
		if (modes) {
			return modes[0];
		}
	}
	
	_patchCodeMirror();
	
	module.exports = {
		defineLanguage:               defineLanguage,
		getLanguage:                  getLanguage,
		getLanguageForFileExtension:  getLanguageForFileExtension,
		getLanguageForCodeMirrorMode: getLanguageForCodeMirrorMode
	};
});