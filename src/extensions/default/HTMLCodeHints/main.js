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
/*global define, $, window */

define(function (require, exports, module) {
    "use strict";
    
    // Load dependent modules
    var HTMLUtils       = brackets.getModule("language/HTMLUtils"),
    	HTMLTags        = require("text!HtmlTags.json"),
    	CodeHintManager	= brackets.getModule("editor/CodeHintManager");


        /**
         * @constructor
         */
        function TagHints () {
            this.tags = this.readTagHints(HTMLTags);
        }

    	/**
    	 * @private
    	 * Parse the code hints from JSON data and extract all hints from property names.
    	 * @param {string} a JSON string that has the code hints data
    	 * @return {!Array.<string>} An array of code hints read from the JSON data source.
    	 */
    	TagHints.prototype.readTagHints = function(jsonStr) {
    	    var hintObj = JSON.parse(jsonStr);
    	    return $.map(hintObj, function (value, key) {
    	        return key;
    	    }).sort();
    	};

	    /**
	     * Filters the source list by query and returns the result
         * @param {Array.<string>}
	     */
		TagHints.prototype.search = function(query) {
	        var result = $.map(this.tags, function (item) {
	            if (item.indexOf(query) === 0) {
	                return item;
	            }
	        }).sort();

	        return result;
	        // TODO: better sorting. Should rank tags based on portion of query that is present in tag
	    };


    	/**
    	 * Figures out the text to use for the hint list query based on the text
    	 * around the cursor
    	 * Query is the text from the start of a tag to the current cursor position
    	 * @param {Editor} editor
         * @return {String} search query results will be filtered by.
         *      Return empty string to indicate code hinting should not filter and show all resukts.
         *      Return null to indicate NO hints can be provided.
    	 */
    	TagHints.prototype.getQueryString = function (editor) {
    	    var pos = editor.getCursorPos(),
    	        tagInfo = HTMLUtils.getTagInfo(editor, pos);
    	    
    	    var query = null;
    	    if (tagInfo.position.tokenType === HTMLUtils.TAG_NAME) {
    	        if (tagInfo.position.offset >= 0) {
    	        	query = tagInfo.tagName.slice(0, tagInfo.position.offset);
    	        }

    	    }

    	    return query;
    	};

    	/**
    	 * Enters the code completion text into the editor
    	 * @param {string} completion - text to insert into current code editor
         * @param {Editor} editor
    	 */
    	TagHints.prototype.handleSelect = function (completion, editor) {
    	    var start = {line: -1, ch: -1},
    	        end = {line: -1, ch: -1},
    	        cursor = editor.getCursorPos(),
    	        tagInfo = HTMLUtils.getTagInfo(editor, cursor),
    	        charCount = 0;
    	    
    	    if (tagInfo.position.tokenType === HTMLUtils.TAG_NAME) {
    	        charCount = tagInfo.tagName.length;
    	    } else if (tagInfo.position.tokenType === HTMLUtils.ATTR_NAME) {
    	        charCount = tagInfo.attr.completion.length;
    	    } else if (tagInfo.position.tokenType === HTMLUtils.ATTR_VALUE) {
    	        charCount = tagInfo.attr.value.length;
    	    }
    	    
    	    end.line = start.line = cursor.line;
    	    start.ch = cursor.ch - tagInfo.position.offset;
    	    end.ch = start.ch + charCount;
    	    
    	    if (start.ch !== "-1" && end.ch !== "-1") {
    	        editor.document.replaceRange(completion, start, end);
    	    } else {
    	        editor.document.replaceRange(completion, start);
    	    }
    	};

        /**
         * @constructor
         */
        function AttrHints () {
            // TODO Raymon
            // this.attributes = 
        }

        AttrHints.prototype.handleSelect = function (completion, editor) {
            // TODO
        };

        AttrHints.prototype.getQueryString = function (editor) {
            // TODO Peter
            return null;
        }

        AttrHints.prototype.search = function(query) {
            // TODO
        }

        var tagHints = new TagHints();
        var attrHints = new AttrHints();
    	CodeHintManager.registerHintProvider(tagHints);
        CodeHintManager.registerHintProvider(attrHints);
});