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
/*global define, $, window, brackets */

define(function (require, exports, module) {
    "use strict";
    
    // Load dependent modules
    var HTMLTags        = require("text!codehint/HtmlTags.json"),
        HTMLAttributes  = require("text!codehint/HtmlAttributes.json"),
        CSSHints        = require("text!codehint/CssHints.json");
        
    // Constants
    var HTML_TAG        = "tag",
        HTML_ATTRIBUTE  = "attribute",
        AT_RULE         = "at-rule",
        PSEUDO_SELECTOR = "pseudo";

    var tags = null,
        attributes = null,
        cssHints = null,
        atRule = null,
        pseudo = null;

    function getCodeHints(type) {
        if (type === HTML_TAG) {
            if (!tags) {
                tags = JSON.parse(HTMLTags);
            }
            return tags;
        }
        if (type === HTML_ATTRIBUTE) {
            if (!attributes) {
                attributes = JSON.parse(HTMLAttributes);
            }
            return attributes;
        }
        if (type === AT_RULE) {
            if (!cssHints) {
                cssHints = JSON.parse(CSSHints);
            }
            if (cssHints && cssHints.atRule) {
                atRule = cssHints.atRule.values;
            }
            return atRule;
        }
        if (type === PSEUDO_SELECTOR) {
            if (!cssHints) {
                cssHints = JSON.parse(CSSHints);
            }
            if (cssHints && cssHints.pseudo) {
                pseudo = cssHints.pseudo.values;
            }
            return pseudo;
        }
    }
    
    // Define public API
    exports.HTML_TAG        = HTML_TAG;
    exports.HTML_ATTRIBUTE  = HTML_ATTRIBUTE;
    exports.AT_RULE         = AT_RULE;
    exports.PSEUDO_SELECTOR = PSEUDO_SELECTOR;
    exports.getCodeHints    = getCodeHints;
});
