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


/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, brackets */

define(function (require, exports, module) {
    'use strict';

    /**
     * @private
     * builds the keyDescriptor string from the given parts
     * @param {boolean} hasCtrl Is Ctrl key enabled
     * @param {boolean} hasAlt Is Alt key enabled
     * @param {boolean} hasShift Is Shift key enabled
     * @param {string} key The key that's pressed
     * @return {string} The normalized key descriptor
     */
    function _buildKeyDescriptor(hasCtrl, hasAlt, hasShift, key) {
        if (!key) {
            console.log("KeyMap _buildKeyDescriptor() - No key provided!");
            return "";
        }
        
        var keyDescriptor = [];
       
        if (hasAlt) {
            keyDescriptor.push("Alt");
        }
        if (hasShift) {
            keyDescriptor.push("Shift");
        }

        if (hasCtrl) {
            // Windows display Ctrl first, Mac displays Command symbol last
            if (brackets.platform === "win") {
                keyDescriptor.unshift("Ctrl");
            } else {
                keyDescriptor.push("Ctrl");
            }
        }

        keyDescriptor.push(key);
        
        return keyDescriptor.join("-");
    }
    
    /**
     * @private
     * normalizes the incoming key descriptor so the modifier keys are always specified in the correct order
     * @param {string} The string for a key descriptor, can be in any order, the result will be Ctrl-Alt-Shift-<Key>
     * @return {string} The normalized key descriptor
     */
    function _normalizeKeyDescriptorString(origDescriptor) {
        var hasCtrl = false,
            hasAlt = false,
            hasShift = false,
            key = "";
        
        function _isModifier(left, right, previouslyFound) {
            if (!left || !right) {
                return false;
            }
            left = left.trim().toLowerCase();
            right = right.trim().toLowerCase();
            var matched = (left.length > 0 && left === right);
            if (matched && previouslyFound) {
                console.log("KeyMap _normalizeKeyDescriptorString() - Modifier defined twice: " + origDescriptor);
            }
            return matched;
        }
        
        origDescriptor.split("-").forEach(function parseDescriptor(ele, i, arr) {
            if (_isModifier("ctrl", ele, hasCtrl)) {
                hasCtrl = true;
            } else if (_isModifier("cmd", ele, hasCtrl)) {
                console.log("KeyMap _normalizeKeyDescriptorString() - Cmd getting mapped to Ctrl from: " + origDescriptor);
                hasCtrl = true;
            } else if (_isModifier("alt", ele, hasAlt)) {
                hasAlt = true;
            } else if (_isModifier("opt", ele, hasAlt)) {
                console.log("KeyMap _normalizeKeyDescriptorString() - Opt getting mapped to Alt from: " + origDescriptor);
                hasAlt = true;
            } else if (_isModifier("shift", ele, hasShift)) {
                hasShift = true;
            } else if (key.length > 0) {
                console.log("KeyMap _normalizeKeyDescriptorString() - Multiple keys defined. Using key: " + key + " from: " + origDescriptor);
            } else {
                key = ele;
            }
        });
        
        return _buildKeyDescriptor(hasCtrl, hasAlt, hasShift, key);
    }
    
    /**
     * @private
     * normalizes the incoming map so all the key descriptors are specified the correct way
     * @param {map} map The string for a key descriptor, can be in any order, the result will be Ctrl-Alt-Shift-<Key>
     * @return {map} The normalized map
     */
    function _normalizeMap(map) {
        var finalMap = {};
        Object.keys(map).forEach(function normalizeKey(ele, i, arr) {
            var val = map[ele];
            var normalizedKey = _normalizeKeyDescriptorString(ele);
            if (normalizedKey.length === 0) {
                console.log("KeyMap _normalizeMap() - Rejecting malformed key: " + ele + " (value: " + val + ")");
            } else if (!val) {
                console.log("KeyMap _normalizeMap() - Rejecting key for falsy value: " + ele + " (value: " + val + ")");
            } else if (finalMap[normalizedKey]) {
                console.log("KeyMap _normalizeMap() - Rejecting key because it was defined twice: " + ele + " (value: " + val + ")");
            } else {
                if (normalizedKey !== ele) {
                    console.log("KeyMap _normalizeMap() - Corrected a malformed key: " + ele + " (value: " + val + ")");
                }
                finalMap[normalizedKey] = val;
            }
        });
        return finalMap;
    }
    
    /**
     * @private
     * given a list of bindings, goes through and turns them into a map. The list is filter based 
     * on platform, so if I binding has no specific platform or needs to match the given platform
     * @param [{bindings}] bindings A list of binding objects
     * @param {string} platform The platform to filter on
     */
    function _bindingsToMap(bindings, platform) {
        var map = {};
        bindings.forEach(function transformToMap(ele, i, arr) {
            var keys = Object.keys(ele);
            var platformIndex = keys.indexOf("platform");
            if (platformIndex > -1) {
                if (ele.platform !== platform) {
                    return; //don't add this to the map
                }
                keys.splice(platformIndex, 1);
            }
            if (keys.length !== 1) {
                console.log("KeyMap _bindingsToMap() - bindings list has unknown keys: " + bindings);
                return;
            }
            var key = keys[0];
            map[key] = ele[key];
        });
        return map;
    }
    
    /** class Keymap
     *
     * A keymap specifies how keys are mapped to commands. This currently just holds the map, but in future
     * it will likely be extended to include other metadata about the keymap.
     *
     * Keys are described by strings of the form "[modifier-modifier-...-]key", where modifier is one of
     * Ctrl, Alt, or Shift. If multiple modifiers are specified, they will get normalized to the form
     * "Ctrl-Alt-Shift-<Key>" so modifiers are always stored and lookedup in that order.
     *    -- Ctrl maps to Cmd on Mac. (This means that you can't specifically bind to the Ctrl key on Mac.)
     *    -- Alt maps to the Option key on Mac.
     *    -- Letters must be uppercase, but do not require Shift by default. To indicate that Shift must be held
     *       down, you must specifically include Shift.
     *
     * @constructor
     * @param {args} An object with a list of objects mapping key-description strings to command IDs and a platform
     */
    var KeyMap = function (args) {
        if (args === undefined) {
            throw new Error("All parameters to the KeyMap constructor must be specified");
        }
        this.map = _normalizeMap(_bindingsToMap(args.bindings, args.platform));
    };
    
    /**
     * simple creator
     * @param {map} map An object mapping key-description strings to command IDs.
     */
    function create(map) {
        return new KeyMap(map);
    }
    
    /**
     * Takes a keyboard event and translates it into a key in a key map
     */
    function translateKeyboardEvent(event) {
        var hasCtrl = (event.metaKey || event.ctrlKey),
            hasAlt = (event.altKey),
            hasShift = (event.shiftKey),
            key = String.fromCharCode(event.keyCode);
        
        //From the W3C, if we can get the KeyboardEvent.keyIdentifier then look here
        //As that will let us use keys like then function keys "F5" for commands. The
        //full set of values we can use is here
        //http://www.w3.org/TR/2007/WD-DOM-Level-3-Events-20071221/keyset.html#KeySet-Set
        var ident = event.keyIdentifier;
        if (ident) {
            if (ident.charAt(0) === "U" && ident.charAt(1) === "+") {
                //This is a unicode code point like "U+002A", get the 002A and use that
                key = String.fromCharCode(parseInt(ident.substring(2), 16));
            } else {
                //This is some non-character key, just use the raw identifier
                key = ident;
            }
        }
        
        // Translate some keys to their common names }
        if (key === "\t") { key = "Tab"; }

        return _buildKeyDescriptor(hasCtrl, hasAlt, hasShift, key);
    }
    
    // Define public API
    exports.create = create;
    exports.translateKeyboardEvent = translateKeyboardEvent;
});
