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

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, brackets, $*/

define(function (require, exports, module) {
    "use strict";

    // Load dependencies.
    var AppInit             = brackets.getModule("utils/AppInit"),
        CodeHintManager     = brackets.getModule("editor/CodeHintManager"),
        PreferencesManager  = brackets.getModule("preferences/PreferencesManager"),
        StringMatch         = brackets.getModule("utils/StringMatch"),
        ExtensionUtils      = brackets.getModule("utils/ExtensionUtils"),
        EditorManager       = brackets.getModule("editor/EditorManager"),
        LanguageManager     = brackets.getModule("language/LanguageManager"),
        JSONUtils           = brackets.getModule("language/JSONUtils"),
        Strings             = brackets.getModule("strings"),
        ThemeManager        = brackets.getModule("view/ThemeManager"),
        CodeInspection      = brackets.getModule("language/CodeInspection"),
        _                   = brackets.getModule("thirdparty/lodash"),
        languages           = LanguageManager.getLanguages(),
        isPrefDocument      = false,
        isPrefHintsEnabled  = false;

    // Stores data of preferences used by Brackets and its core/thirdparty extensions.
    var data = {
        language: {
            type: "object",
            description: Strings.DESCRIPTION_LANGUAGE
        },
        path: {
            type: "object",
            description: Strings.DESCRIPTION_PATH
        }
    };

    var stringMatcherOptions = {
        preferPrefixMatches: true
    };

    // List of parent keys for which no key hints will be provided.
    var parentKeyBlacklist = [
        "language.fileExtensions",
        "language.fileNames",
        "path"
    ];

    // Define a preference for code hinting.
    PreferencesManager.definePreference("codehint.PrefHints", "boolean", true, {
        description: Strings.DESCRIPTION_PREF_HINTS
    });

    /**
     * @private
     *
     * Determines whether or not the current document is a preferences document and
     * user has enabled code hints
     *
     * @return {Boolean}
     */
    function _isPrefHintsEnabled() {
        return (isPrefDocument &&
                PreferencesManager.get("showCodeHints") !== false &&
                PreferencesManager.get("codehint.PrefHints") !== false);
    }

    /**
     * @private
     *
     * Determines whether or not the name of a file matches the preferences files
     *
     * @param {!Document} document
     * @return {Boolean}
     */
    function _isPrefDocument(document) {
        return (/^\.?brackets\.json$/).test(document.file._name);
    }

    // Set listeners on preference, editor and language changes.
    PreferencesManager.on("change", "showCodeHints", function () {
        isPrefHintsEnabled = _isPrefHintsEnabled();
    });
    PreferencesManager.on("change", "codehint.PrefHints", function () {
        isPrefHintsEnabled = _isPrefHintsEnabled();
    });
    EditorManager.on("activeEditorChange", function (e, editor) {
        if (editor) {
            isPrefDocument = _isPrefDocument(editor.document);
        }
        isPrefHintsEnabled = _isPrefHintsEnabled();
    });
    LanguageManager.on("languageAdded", function () {
        languages = LanguageManager.getLanguages();
    });

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

        var hasMetadata = hints.some(function (token) {
            return token.type || token.description;
        });

        StringMatch.basicMatchSort(hints);
        return hints.map(function (token) {
            var $hintItem = $("<span>").addClass("brackets-pref-hints"),
                $hintObj  = $("<span>").addClass("hint-obj");

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

            $hintItem.append($hintObj);

            if (hasMetadata) {
                $hintItem.data("type", token.type);
                if (token.description) {
                    $hintItem.append($("<span>")
                                        .addClass("hint-description")
                                        .text(token.description));
                }
            }
            return $hintItem;
        });
    }

    /**
     * @constructor
     */
    function PrefsCodeHints() {
        this.ctxInfo = null;

        // Add all the preferences defined except the excluded ones.
        var preferences = PreferencesManager.getAllPreferences(),
            preference;
        Object.keys(preferences).forEach(function (pref) {
            preference = preferences[pref];
            if (preference.excludeFromHints) {
                return;
            }
            data[pref] = $.extend(data[pref], preference);

            // If child keys found, add them.
            if (preference.keys) {
                data[pref].keys = _.clone(preference.keys);
            }
        });
    }

    /**
     * Determines whether or not hints are available in the current context
     *
     * @param {!Editor} editor
     * @param {String} implicitChar
     * @return {Boolean}
     */
    PrefsCodeHints.prototype.hasHints = function (editor, implicitChar) {
        if (isPrefHintsEnabled && editor.getModeForSelection() === "application/json") {
            this.editor = editor;
            this.ctxInfo = JSONUtils.getContextInfo(this.editor, this.editor.getCursorPos(), true);

            if (this.ctxInfo && this.ctxInfo.tokenType) {
                // Disallow hints for blacklisted keys.
                if (this.ctxInfo.tokenType === JSONUtils.TOKEN_KEY &&
                        parentKeyBlacklist.indexOf(this.ctxInfo.parentKeyName) !== -1) {
                    return false;
                }
                return true;
            }
        }
        return false;
    };

    /**
     * Returns a list of hints available in the current context
     *
     * @param {String} implicitChar
     * @return {!{hints: Array.<jQueryObject>, match: string, selectInitial: boolean, handleWideResults: boolean}}
     */
    PrefsCodeHints.prototype.getHints = function (implicitChar) {
        var hints = [], ctxInfo, query, keys, values, option = {type: null, description: null, values: null};

        ctxInfo = this.ctxInfo = JSONUtils.getContextInfo(this.editor, this.editor.getCursorPos(), true);

        if (ctxInfo && ctxInfo.token) {
            query = JSONUtils.stripQuotes(ctxInfo.token.string.substr(0, ctxInfo.offset)).trim();
            if (JSONUtils.regexAllowedChars.test(query)) {
                query = "";
            }

            if (ctxInfo.tokenType === JSONUtils.TOKEN_KEY) {
                // Provide hints for keys

                // Get options for parent key else use general options.
                if (data[ctxInfo.parentKeyName] && data[ctxInfo.parentKeyName].keys) {
                    keys = data[ctxInfo.parentKeyName].keys;
                } else if (ctxInfo.parentKeyName === "language") {
                    keys = languages;
                    option.type = "object";
                } else {
                    keys = data;
                }

                hints = $.map(Object.keys(keys), function (key) {
                    if (ctxInfo.exclusionList.indexOf(key) === -1) {
                        var match = StringMatch.stringMatch(key, query, stringMatcherOptions);
                        if (match) {
                            match.type = keys[key].type || option.type;
                            match.description = keys[key].description || null;
                            return match;
                        }
                    }
                });
            } else if (ctxInfo.tokenType === JSONUtils.TOKEN_VALUE) {
                // Provide hints for values.

                // Get the key from data.
                if (data[ctxInfo.parentKeyName] && data[ctxInfo.parentKeyName].keys &&
                        data[ctxInfo.parentKeyName].keys[ctxInfo.keyName]) {
                    option = data[ctxInfo.parentKeyName].keys[ctxInfo.keyName];
                } else if (data[ctxInfo.keyName]) {
                    option = data[ctxInfo.keyName];
                }

                // Get the values depending on the selected key.
                if (option && option.type === "boolean") {
                    values = ["false", "true"];
                } else if (option && option.values && (["number", "string"].indexOf(option.type) !== -1 ||
                                                       (option.type === "array" && ctxInfo.isArray))) {
                    values = option.values;
                } else if (ctxInfo.isArray && ctxInfo.keyName === "linting.prefer" && languages[ctxInfo.parentKeyName]) {
                    values = CodeInspection.getProviderIDsForLanguage(ctxInfo.parentKeyName);
                } else if (ctxInfo.keyName === "themes.theme") {
                    values = ThemeManager.getAllThemes().map(function (theme) {
                        return theme.name;
                    });
                } else if (ctxInfo.parentKeyName === "language.fileExtensions" ||
                           ctxInfo.parentKeyName === "language.fileNames") {
                    values = Object.keys(languages);
                } else {
                    return null;
                }

                // Convert integers to strings, so StringMatch.stringMatch can match it.
                if (option.type === "number" || option.valueType === "number") {
                    values = values.map(function (val) {
                        return val.toString();
                    });
                }

                // filter through the values.
                hints = $.map(values, function (value) {
                    var match = StringMatch.stringMatch(value, query, stringMatcherOptions);
                    if (match) {
                        match.type = option.valueType || option.type;
                        match.description = option.description || null;
                        return match;
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
     * Inserts a completion at current position
     *
     * @param {!String} completion
     * @return {Boolean}
     */
    PrefsCodeHints.prototype.insertHint = function (completion) {
        var ctxInfo = JSONUtils.getContextInfo(this.editor, this.editor.getCursorPos(), false, true),
            pos     = this.editor.getCursorPos(),
            start   = {line: -1, ch: -1},
            end     = {line: -1, ch: -1},
            startChar,
            quoteChar,
            type;

        if (completion.jquery) {
            type = completion.data("type");
            completion = completion.find(".hint-obj").text();
        }
        start.line = end.line = pos.line;

        if (ctxInfo.tokenType === JSONUtils.TOKEN_KEY) {
            startChar = ctxInfo.token.string.charAt(0);

            // Get the quote char.
            if (/^['"]$/.test(startChar)) {
                quoteChar = startChar;
            }

            // Put quotes around completion.
            completion = quoteChar + completion + quoteChar;

            // Append colon and braces, brackets and quotes.
            if (!ctxInfo.shouldReplace) {
                completion += ": ";

                switch (type) {
                case "object":
                    completion += "{}";
                    break;

                case "array":
                    completion += "[]";
                    break;

                case "string":
                    completion += "\"\"";
                    break;
                }
            }

            start.ch = pos.ch - ctxInfo.offset;
            end.ch = ctxInfo.token.end;
            this.editor.document.replaceRange(completion, start, end);

            // Place cursor inside the braces, brackets or quotes.
            if (["object", "array", "string"].indexOf(type) !== -1) {
                this.editor.setCursorPos(start.line, start.ch + completion.length - 1);

                // Start a new session in case it is an array or string.
                if (type !== "object" && !ctxInfo.shouldReplace) {
                    return true;
                }
                return false;
            }
            return true;
        } else if (ctxInfo.tokenType === JSONUtils.TOKEN_VALUE) {
            // In case the current token is a white-space, start and end will be same.
            if (JSONUtils.regexAllowedChars.test(ctxInfo.token.string)) {
                start.ch = end.ch = pos.ch;
            } else if (ctxInfo.shouldReplace) {
                start.ch = ctxInfo.token.start;
                end.ch = ctxInfo.token.end;
            } else {
                start.ch = pos.ch - ctxInfo.offset;
                end.ch = ctxInfo.token.end;
            }

            if (!type || type === "string") {
                startChar = ctxInfo.token.string.charAt(0);
                if (/^['"]$/.test(startChar)) {
                    quoteChar = startChar;
                } else {
                    quoteChar = "\"";
                }
                completion = quoteChar + completion + quoteChar;
            }

            this.editor.document.replaceRange(completion, start, end);
            return false;
        }
    };

    /**
     * @private
     *
     * `isPrefHintsEnabled` must be set to true to allow code hints
     *
     * It also loads a set of preferences that we need for running unit tests, this
     * will not break unit tests in case we add new preferences in the future.
     *
     * @param {!Document} testDocument
     * @param {!Object} testPreferences
     */
    function _setupTestEnvironment(testDocument, testPreferences) {
        isPrefHintsEnabled = _isPrefDocument(testDocument);
        data = testPreferences;
    }

    AppInit.appReady(function () {
        var hintProvider = new PrefsCodeHints();
        CodeHintManager.registerHintProvider(hintProvider, ["json"], 0);
        ExtensionUtils.loadStyleSheet(module, "styles/brackets-prefs-hints.css");

        // For unit tests only.
        exports.hintProvider            = hintProvider;
        exports._setupTestEnvironment   = _setupTestEnvironment;
    });

});
