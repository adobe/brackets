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
/*global define, CodeMirror */

define(function(require) {
    "use strict";

    var CodeMirror = require("thirdparty/CodeMirror2/lib/codemirror");

    // Load CodeMirror add-ons--these attach themselves to the CodeMirror module
    require("thirdparty/CodeMirror2/addon/fold/xml-fold");
    require("thirdparty/CodeMirror2/addon/edit/matchtags");
    require("thirdparty/CodeMirror2/addon/edit/matchbrackets");
    require("thirdparty/CodeMirror2/addon/edit/closebrackets");
    require("thirdparty/CodeMirror2/addon/edit/closetag");
    require("thirdparty/CodeMirror2/addon/scroll/scrollpastend");
    require("thirdparty/CodeMirror2/addon/selection/active-line");
    require("thirdparty/CodeMirror2/addon/mode/multiplex");
    require("thirdparty/CodeMirror2/addon/mode/overlay");
    require("thirdparty/CodeMirror2/addon/search/match-highlighter");
    require("thirdparty/CodeMirror2/addon/search/searchcursor");
    require("thirdparty/CodeMirror2/keymap/sublime");

});
