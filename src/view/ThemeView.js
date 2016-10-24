/**
 * Brackets Themes Copyright (c) 2014 Miguel Castillo.
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

    var CodeMirror         = require("thirdparty/CodeMirror/lib/codemirror"),
        PreferencesManager = require("preferences/PreferencesManager"),
        prefs              = PreferencesManager.getExtensionPrefs("themes");

    var $scrollbars = $("<style id='scrollbars'>").appendTo("head");


    /**
     * Load scrollbar styling based on whether or not theme scrollbars are enabled.
     *
     * @param {ThemeManager.Theme} theme Is the theme object with the corresponding scrollbar style
     *   to be updated
     */
    function updateScrollbars(theme) {
        theme = theme || {};
        if (prefs.get("themeScrollbars")) {
            var scrollbar = (theme.scrollbar || []).join(" ");
            $scrollbars.text(scrollbar || "");
        } else {
            $scrollbars.text("");
        }
    }


    /**
     *  Handles updating codemirror with the current selection of themes.
     *
     * @param {CodeMirror} cm is the CodeMirror instance currently loaded
     */
    function updateThemes(cm) {
        var newTheme = prefs.get("theme"),
            cmTheme  = (cm.getOption("theme") || "").replace(/[\s]*/, ""); // Normalize themes string

        // Check if the editor already has the theme applied...
        if (cmTheme === newTheme) {
            return;
        }

        // Setup current and further documents to get the new theme...
        CodeMirror.defaults.theme = newTheme;
        cm.setOption("theme", newTheme);
    }


    exports.updateScrollbars = updateScrollbars;
    exports.updateThemes     = updateThemes;
});
