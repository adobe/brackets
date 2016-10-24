/*
 * Copyright (c) 2015 - present Adobe Systems Incorporated. All rights reserved.
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

define(function (require, exports, module) {
    "use strict";

    // Load dependencies.
    var AppInit             = brackets.getModule("utils/AppInit"),
        CodeHintManager     = brackets.getModule("editor/CodeHintManager"),
        PreferencesManager  = brackets.getModule("preferences/PreferencesManager"),
        XMLUtils            = brackets.getModule("language/XMLUtils"),
        StringMatch         = brackets.getModule("utils/StringMatch"),
        ExtensionUtils      = brackets.getModule("utils/ExtensionUtils"),
        ColorUtils          = brackets.getModule("utils/ColorUtils"),
        Strings             = brackets.getModule("strings"),
        _                   = brackets.getModule("thirdparty/lodash"),
        SVGTags             = require("text!SVGTags.json"),
        SVGAttributes       = require("text!SVGAttributes.json"),
        cachedAttributes    = {},
        tagData,
        attributeData,
        isSVGEnabled;

    var stringMatcherOptions = {
        preferPrefixMatches: true
    };

    // Define our own pref for hinting.
    PreferencesManager.definePreference("codehint.SVGHints", "boolean", true, {
        description: Strings.DESCRIPTION_SVG_HINTS
    });

    // Preferences to control hint.
    function _isSVGHintsEnabled() {
        return (PreferencesManager.get("codehint.SVGHints") !== false &&
                PreferencesManager.get("showCodeHints") !== false);
    }

    PreferencesManager.on("change", "codehint.SVGHints", function () {
        isSVGEnabled = _isSVGHintsEnabled();
    });

    PreferencesManager.on("change", "showCodeHints", function () {
        isSVGEnabled = _isSVGHintsEnabled();
    });

    // Check if SVG Hints are available.
    isSVGEnabled = _isSVGHintsEnabled();

    /**
     * Returns a list of attributes used by a tag.
     *
     * @param {string} tagName name of the SVG tag.
     * @return {Array.<string>} list of attributes.
     */
    function getTagAttributes(tagName) {
        var tag;

        if (!cachedAttributes.hasOwnProperty(tagName)) {
            tag = tagData.tags[tagName];
            cachedAttributes[tagName] = [];
            if (tag.attributes) {
                cachedAttributes[tagName] =  cachedAttributes[tagName].concat(tag.attributes);
            }
            tag.attributeGroups.forEach(function (group) {
                if (tagData.attributeGroups.hasOwnProperty(group)) {
                    cachedAttributes[tagName] = cachedAttributes[tagName].concat(tagData.attributeGroups[group]);
                }
            });
            cachedAttributes[tagName] = _.uniq(cachedAttributes[tagName].sort(), true);
        }
        return cachedAttributes[tagName];
    }

    /*
     * Returns a sorted and formatted list of hints with the query substring
     * highlighted.
     *
     * @param {Array.<Object>} hints - the list of hints to format
     * @param {string} query - querystring used for highlighting matched
     *      portions of each hint
     * @return {Array.jQuery} sorted Array of jQuery DOM elements to insert
     */
    function formatHints(hints, query) {
        var hasColorSwatch = hints.some(function (token) {
            return token.color;
        });

        StringMatch.basicMatchSort(hints);
        return hints.map(function (token) {
            var $hintObj = $("<span>").addClass("brackets-svg-hints");

            // highlight the matched portion of each hint
            if (token.stringRanges) {
                token.stringRanges.forEach(function (item) {
                    if (item.matched) {
                        $hintObj.append($("<span>")
                            .text(item.text)
                            .addClass("matched-hint"));
                    } else {
                        $hintObj.append(item.text);
                    }
                });
            } else {
                $hintObj.text(token.value);
            }

            if (hasColorSwatch) {
                $hintObj = ColorUtils.formatColorHint($hintObj, token.color);
            }

            return $hintObj;
        });
    }

    /**
     * @constructor
     */
    function SVGCodeHints() {
        this.tagInfo = null;
    }

    /**
     * Determines whether SVG code hints are available in the current editor.
     *
     * @param {!Editor} editor An instance of Editor
     * @param {string} implicitChar A single character that was inserted by the
     * user or null if the request was explicity made to start hinting session.
     *
     * @return {boolean} Determines whether or not hints are available in the current context.
     */
    SVGCodeHints.prototype.hasHints = function (editor, implicitChar) {
        if (isSVGEnabled && editor.getModeForSelection() === "image/svg+xml") {
            this.editor = editor;
            this.tagInfo = XMLUtils.getTagInfo(this.editor, this.editor.getCursorPos());

            if (this.tagInfo && this.tagInfo.tokenType) {
                return true;
            }
        }
        return false;
    };

    /**
     * Returns a list of hints that are available in the current context,
     * or null if there are no hints available.
     *
     * @param {string} implicitChar A character that the user typed in the hinting session.
     * @return {!{hints: Array.<jQueryObject>, match: string, selectInitial: boolean, handleWideResults: boolean}}
     */
    SVGCodeHints.prototype.getHints = function (implicitChar) {
        var hints = [], query, tagInfo, attributes = [], options = [], index, isMultiple, tagSpecificOptions;

        tagInfo  = XMLUtils.getTagInfo(this.editor, this.editor.getCursorPos());
        this.tagInfo = tagInfo;

        if (tagInfo && tagInfo.tokenType) {
            query = tagInfo.token.string.substr(0, tagInfo.offset).trim();

            if (tagInfo.tokenType === XMLUtils.TOKEN_TAG) {
                hints = $.map(Object.keys(tagData.tags), function (tag) {
                    var match = StringMatch.stringMatch(tag, query, stringMatcherOptions);
                    if (match) {
                        return match;
                    }
                });
            } else if (tagInfo.tokenType === XMLUtils.TOKEN_ATTR) {
                if (!tagData.tags[tagInfo.tagName]) {
                    return null;
                }
                // Get attributes.
                attributes = getTagAttributes(tagInfo.tagName);
                hints = $.map(attributes, function (attribute) {
                    if (tagInfo.exclusionList.indexOf(attribute) === -1) {
                        var match = StringMatch.stringMatch(attribute, query, stringMatcherOptions);
                        if (match) {
                            return match;
                        }
                    }
                });
            } else if (tagInfo.tokenType === XMLUtils.TOKEN_VALUE) {
                index = tagInfo.tagName + "/" + tagInfo.attrName;
                tagSpecificOptions = attributeData[index];

                if (!tagData.tags[tagInfo.tagName] && !(attributeData[tagInfo.attrName] || tagSpecificOptions)) {
                    return null;
                }

                // Get attribute options.
                // Prefer tag/attribute for specific tags, else use general options for attributes.
                if (tagSpecificOptions) {
                    options = tagSpecificOptions.attribOptions;
                    isMultiple = tagSpecificOptions.multiple;
                } else if (attributeData[tagInfo.attrName]) {
                    options = attributeData[tagInfo.attrName].attribOptions;
                    isMultiple = attributeData[tagInfo.attrName].multiple;

                    if (attributeData[tagInfo.attrName].type === "color") {
                        options = ColorUtils.COLOR_NAMES.map(function (color) {
                            return { text: color, color: color };
                        });
                        options = options.concat(["currentColor", "transparent"]);
                    }
                }

                // Stop if the attribute doesn't support multiple options.
                if (!isMultiple && /\s+/.test(tagInfo.token.string)) {
                    return null;
                }

                query = XMLUtils.getValueQuery(tagInfo);
                hints = $.map(options, function (option) {
                    if (tagInfo.exclusionList.indexOf(option) === -1) {
                        var match = StringMatch.stringMatch(option.text || option, query, stringMatcherOptions);
                        if (match) {
                            if (option.color) {
                                match.color = option.color;
                            }

                            return match;
                        }
                    }
                });
            }
            return {
                hints: formatHints(hints, query),
                match: null,
                selectInitial: true,
                handleWideResults: false
            };
        }
        return null;
    };

    /**
     * Insert the selected hint into the editor
     *
     * @param {string} completion The string that user selected from the list
     * @return {boolean} Determines whether or not to continue the hinting session
     */
    SVGCodeHints.prototype.insertHint = function (completion) {
        var tagInfo = this.tagInfo,
            pos     = this.editor.getCursorPos(),
            start   = {line: -1, ch: -1},
            end     = {line: -1, ch: -1},
            query,
            startChar,
            endChar,
            quoteChar;

        if (completion.jquery) {
            completion = completion.text();
        }
        start.line = end.line = pos.line;

        if (tagInfo.tokenType === XMLUtils.TOKEN_TAG) {
            start.ch = pos.ch - tagInfo.offset;
            end.ch = tagInfo.token.end;
            this.editor.document.replaceRange(completion, start, end);
            return false;
        } else if (tagInfo.tokenType === XMLUtils.TOKEN_ATTR) {
            if (!tagInfo.shouldReplace) {
                completion += "=\"\"";

                // In case the current token is whitespace, start and end will be same.
                if (XMLUtils.regexWhitespace.test(tagInfo.token.string)) {
                    start.ch = end.ch = pos.ch;
                } else {
                    start.ch = pos.ch - tagInfo.offset;
                    end.ch = pos.ch;
                }
                this.editor.document.replaceRange(completion, start, end);
                this.editor.setCursorPos(start.line, start.ch + completion.length - 1);
                return true;
            } else {
                // We don't append ="" again, just replace the attribute token.
                start.ch = tagInfo.token.start;
                end.ch = tagInfo.token.end;
                this.editor.document.replaceRange(completion, start, end);
                this.editor.setCursorPos(start.line, start.ch + completion.length);
                return false;
            }
        } else if (tagInfo.tokenType === XMLUtils.TOKEN_VALUE) {
            startChar = tagInfo.token.string.charAt(0);
            endChar = tagInfo.token.string.substr(-1, 1);

            // Get the quote character.
            if (/^['"]$/.test(startChar)) {
                quoteChar = startChar;
            } else {
                quoteChar = "\"";
            }

            // Append quotes to attribute value if not already.
            if (!/^['"]$/.test(startChar)) {
                completion = quoteChar + completion;
            }
            if (!/^['"]$/.test(endChar) || tagInfo.token.string.length === 1) {
                completion = completion + quoteChar;
            }

            query = XMLUtils.getValueQuery(tagInfo);
            start.ch = pos.ch - query.length;
            end.ch = pos.ch;
            this.editor.document.replaceRange(completion, start, end);

            // Place cursor outside the quote if the next char is quote.
            if (/^['"]$/.test(tagInfo.token.string.substr(tagInfo.offset, 1))) {
                this.editor.setCursorPos(pos.line, start.ch + completion.length + 1);
            }
            return false;
        }
    };

    AppInit.appReady(function () {
        tagData = JSON.parse(SVGTags);
        attributeData = JSON.parse(SVGAttributes);

        var hintProvider = new SVGCodeHints();
        CodeHintManager.registerHintProvider(hintProvider, ["svg"], 0);

        ExtensionUtils.loadStyleSheet(module, "styles/brackets-svg-hints.css");
        exports.hintProvider = hintProvider;
    });
});
