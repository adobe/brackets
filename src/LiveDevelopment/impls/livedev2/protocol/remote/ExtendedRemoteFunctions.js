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


/*jslint vars: true, plusplus: true, browser: true, nomen: true, indent: 4, forin: true, maxerr: 50, regexp: true */
/*global define, $, window, navigator, Node, console */

/**
 * ExtendRemoteFunctions defines the addtional functions to be executed in the browser. 
 */
function ExtendRemoteFunctions(obj) {
    "use strict";

    var ExtendedObj = function () {};
    ExtendedObj.prototype = obj;

    ExtendedObj.prototype.reloadCSS = function reloadCSS(url, text) {
        var i,
            node;

        var head = document.getElementsByTagName('head')[0];
        // create an style element to replace the one loaded with <link>
        var s = document.createElement('style');
        s.type = 'text/css';
        s.appendChild(document.createTextNode(text));

        for (i = 0; i < document.styleSheets.length; i++) {
            node = document.styleSheets[i];
            if (node.ownerNode.id === url) {
                head.insertBefore(s, node.ownerNode); // insert the style element here
                // now can remove the style element previously created (if any)
                node.ownerNode.parentNode.removeChild(node.ownerNode);
            } else if (node.href === url  && !node.disabled) {
                // if the link element to change 
                head.insertBefore(s, node.ownerNode); // insert the style element here
                node.disabled = true;
                i++; // since we have just inserted a stylesheet
            }
        }
        s.id = url;
    };
    return new ExtendedObj();
}