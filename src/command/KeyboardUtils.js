/*
 * Copyright (c) 2014 Adobe Systems Incorporated. All rights reserved.
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


/*jslint vars: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, brackets */

/**
 * 
 */
define(function (require, exports, module) {
    "use strict";

    var altGrShortcuts = JSON.parse(require("text!command/AltGr.json"));
    
    /**
     * Checks whether the given key is part of an altGr shortcuts for the currently active keyboard layout.
     *
     * @param {string} key The single letter key used in the shortcut
     * @return {boolean} true if the key is part of the altGr shortcut used in currently active keyboard layout, 
     *                   false otherwise.
     */
    function isAltGrShortcut(key) {
        if (brackets.platform !== "win" || brackets.app.keyboard === undefined) {
            return false;
        }
        
        var langOnly = brackets.app.keyboard.substr(0, brackets.app.keyboard.indexOf("-")),
            hasAltGrShortcuts = altGrShortcuts && (altGrShortcuts[brackets.app.keyboard] || altGrShortcuts[langOnly]);
        
        if (hasAltGrShortcuts) {
            var keys1 = altGrShortcuts[brackets.app.keyboard] ? altGrShortcuts[brackets.app.keyboard][brackets.app.keyboardType] : null,
                keys2 = altGrShortcuts[brackets.app.keyboard],
                hasGeneralShortcuts = (keys2 && typeof keys2  === "string");
            
            if (!keys1 && !keys2) {
                keys1 = altGrShortcuts[langOnly][brackets.app.keyboardType];
                keys2 = altGrShortcuts[langOnly];
                hasGeneralShortcuts = (keys2 && typeof keys2  === "string");
            }
            
            if ((hasGeneralShortcuts && keys2 && keys2.indexOf(key) !== -1) ||
                    (!hasGeneralShortcuts && keys1 && keys1.indexOf(key) !== -1)) {
                return true;
            }
        }
        
        return false;
    }
    
    exports.isAltGrShortcut = isAltGrShortcut;
});
