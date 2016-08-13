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

    var LanguageManager = brackets.getModule("language/LanguageManager"),
        CodeMirror      = brackets.getModule("thirdparty/CodeMirror/lib/codemirror");

    brackets.getModule(["thirdparty/CodeMirror/mode/handlebars/handlebars"], function () {
        CodeMirror.defineMode("htmlhandlebars", function (config) {
            return CodeMirror.multiplexingMode(
                CodeMirror.getMode(config, "text/html"),
                {
                    open: "{{",
                    close: "}}",
                    mode: CodeMirror.getMode(config, "handlebars"),
                    parseDelimiters: true
                }
            );
        });
        CodeMirror.defineMIME("text/x-handlebars-template", "htmlhandlebars");

        LanguageManager.defineLanguage("handlebars", {
            name: "Handlebars",
            mode: ["htmlhandlebars", "text/x-handlebars-template"],
            fileExtensions: ["hbs", "handlebars"],
            blockComment: ["{{!", "}}"]
        });
    });
});
