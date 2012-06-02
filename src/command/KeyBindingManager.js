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


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true */
/*global define, $, brackets, window */

/**
 * Manages the mapping of keyboard inputs to commands.
 */
define(function (require, exports, module) {
    'use strict';

    var CommandManager = require("command/CommandManager");

    /**
     * @type {Object.<string, {{commandID: string, key: string, displayKey: string}}}
     */
    var _keyMap = {};

    /**
     * @type {Object.<string, Array.<{{key: string, displayKey: string}}>}
     */
    var _commandMap = {};

    /**
     * Allow clients to toggle key binding
     */
    var _enabled = true;

    /**
     * @private
     */
    function _reset() {
        _keyMap = {};
        _commandMap = {};
    }

    /**
     * @private
     * Initialize an empty keymap as the current keymap. It overwrites the current keymap if there is one.
     * builds the keyDescriptor string from the given parts
     * @param {boolean} hasCtrl Is Ctrl key enabled
     * @param {boolean} hasAlt Is Alt key enabled
     * @param {boolean} hasShift Is Shift key enabled
     * @param {string} key The key that's pressed
     * @return {string} The normalized key descriptor
     */
    function _buildKeyDescriptor(hasCtrl, hasAlt, hasShift, key) {
        if (!key) {
            console.log("KeyBindingManager _buildKeyDescriptor() - No key provided!");
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
    
    function _isModifier(left, right, previouslyFound, origDescriptor) {
        if (!left || !right) {
            return false;
        }
        left = left.trim().toLowerCase();
        right = right.trim().toLowerCase();
        var matched = (left.length > 0 && left === right);
        if (matched && previouslyFound) {
            console.log("KeyBindingManager normalizeKeyDescriptorString() - Modifier defined twice: " + origDescriptor);
        }
        return matched;
    }
    
    /**
     * normalizes the incoming key descriptor so the modifier keys are always specified in the correct order
     * @param {string} The string for a key descriptor, can be in any order, the result will be Ctrl-Alt-Shift-<Key>
     * @return {string} The normalized key descriptor or null if the descriptor invalid
     */
    function normalizeKeyDescriptorString(origDescriptor) {
        var hasCtrl = false,
            hasAlt = false,
            hasShift = false,
            key = "",
            error = false;
        
        origDescriptor.split("-").forEach(function parseDescriptor(ele, i, arr) {
            if (_isModifier("ctrl", ele, hasCtrl)) {
                hasCtrl = true;
            } else if (_isModifier("cmd", ele, hasCtrl, origDescriptor)) {
                console.log("KeyBindingManager normalizeKeyDescriptorString() - Cmd getting mapped to Ctrl from: " + origDescriptor);
                hasCtrl = true;
            } else if (_isModifier("alt", ele, hasAlt, origDescriptor)) {
                hasAlt = true;
            } else if (_isModifier("opt", ele, hasAlt, origDescriptor)) {
                console.log("KeyBindingManager normalizeKeyDescriptorString() - Opt getting mapped to Alt from: " + origDescriptor);
                hasAlt = true;
            } else if (_isModifier("shift", ele, hasShift, origDescriptor)) {
                hasShift = true;
            } else if (key.length > 0) {
                console.log("KeyBindingManager normalizeKeyDescriptorString() - Multiple keys defined. Using key: " + key + " from: " + origDescriptor);
                error = true;
            } else {
                key = ele;
            }
        });
        
        if (error) {
            return null;
        }

        // Check to see if the binding is for "-".
        if (key === "" && origDescriptor.search(/^.+--$/) !== -1) {
            key = "-";
        }
        
        return _buildKeyDescriptor(hasCtrl, hasAlt, hasShift, key);
    }
    
    /**
     * @private
     * Looks for keycodes that have os-inconsistent keys and fixes them.
     * @param {number} The keycode from the keyboard event.
     * @param {string} The current best guess at what the key is.
     * @return {string} If the key is OS-inconsistent, the correct key; otherwise, the original key.
     **/
    function _mapKeycodeToKey(keycode, key) {
        switch (keycode) {
        case 186:
            return ";";
        case 187:
            return "=";
        case 188:
            return ",";
        case 189:
            return "-";
        case 190:
            return ".";
        case 191:
            return "/";
        case 192:
            return "`";
        case 219:
            return "[";
        case 220:
            return "\\";
        case 221:
            return "]";
        case 222:
            return "'";
        default:
            return key;
        }
    }
    
    /**
     * Takes a keyboard event and translates it into a key in a key map
     */
    function _translateKeyboardEvent(event) {
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
        
        // Translate some keys to their common names
        if (key === "\t") { key = "Tab"; }
        key = _mapKeycodeToKey(event.keyCode, key);

        return _buildKeyDescriptor(hasCtrl, hasAlt, hasShift, key);
    }
    
    /**
     * Convert normalized key representation to display appropriate for platform.
     * @param {!string} descriptor Normalized key descriptor.
     * @return {!string} Display/Operating system appropriate string
     */
    function formatKeyDescriptor(descriptor) {
        var displayStr;
        
        if (brackets.platform === "mac") {
            displayStr = descriptor.replace(/-/g, "");        // remove dashes
            displayStr = displayStr.replace("Ctrl", "\u2318");  // Ctrl > command symbol
            displayStr = displayStr.replace("Shift", "\u21E7"); // Shift > shift symbol
            displayStr = displayStr.replace("Alt", "\u2325");   // Alt > option symbol
        } else {
            displayStr = descriptor.replace(/-/g, "+");
        }

        return displayStr;
    }

    /**
     * @private
     * @param {string} A normalized key-description string.
     * @return {boolean} true if the key is already assigned, false otherwise.
     */
    function _isKeyAssigned(key) {
        return (_keyMap[key] !== undefined);
    }

    /**
     * @private
     *
     * @param {string} commandID
     * @param {string|{{key: string, displayKey: string}}} keyBinding - a single shortcut.
     * @param {?string} platform - undefined indicates all platforms
     * @return {?{key: string, displayKey:String}} Returns a record for valid key bindings
     */
    function _addBinding(commandID, keyBinding, platform) {
        var key,
            result = null,
            normalized,
            normalizedDisplay,
            targetPlatform = keyBinding.platform || platform || brackets.platform,
            command;
        
        // skip if this binding doesn't match the current platform
        if (targetPlatform !== brackets.platform) {
            return null;
        }
        
        key = (keyBinding.key) || keyBinding;
        normalized = normalizeKeyDescriptorString(key);
        
        // skip if the key binding is invalid 
        if (!normalized) {
            console.log("Failed to normalize " + key);
            return null;
        }
        
        // skip if the key is already assigned
        if (_isKeyAssigned(normalized)) {
            console.log("Cannot assign " + normalized + " to " + commandID +
                        ". It is already assigned to " + _keyMap[normalized]);
            return null;
        }
        
        // optional display-friendly string (e.g. CMD-+ instead of CMD-=)
        normalizedDisplay = (keyBinding.displayKey) ? normalizeKeyDescriptorString(keyBinding.displayKey) : normalized;
        
        // 1-to-many commandID mapping to key binding
        if (!_commandMap[commandID]) {
            _commandMap[commandID] = [];
        }
        
        result = {key: normalized, displayKey: normalizedDisplay};
        _commandMap[commandID].push(result);
        
        // 1-to-1 key binding to commandID
        _keyMap[normalized] = {commandID: commandID, key: normalized, displayKey: normalizedDisplay};
        
        // notify listeners
        command = CommandManager.get(commandID);
        
        if (command) {
            $(command).triggerHandler("keyBindingAdded", [result]);
        }
        
        return result;
    }

    /**
     * Returns a copy of the keymap
     * @returns {!{commandID:string, displayKey:string}}
     */
    function getKeymap() {
        return $.extend({}, _keyMap);
    }

    /**
     * Process the keybinding for the current key.
     *
     * @param {string} A key-description string.
     * @return {boolean} true if the key was processed, false otherwise
     */
    function handleKey(key) {
        if (_enabled && _keyMap[key]) {
            CommandManager.execute(_keyMap[key].commandID);
            return true;
        }
        return false;
    }

    // TODO (issue #414): Replace this temporary fix with a more robust solution to handle focus and modality
    /**
     * Enable or disable key bindings. Clients such as dialogs may wish to disable 
     * global key bindings temporarily.
     *
     * @param {string} A key-description string.
     * @return {boolean} true if the key was processed, false otherwise
     */
    function setEnabled(value) {
        _enabled = value;
    }

    /**
     * Add one or more key bindings to a particular Command.
     * 
     * @param {string} commandID
     * @param {?({key: string, displayKey: string} | Array.<{key: string, displayKey: string, platform: string)}>}  keyBindings - a single key binding
     *      or an array of keybindings. Example: "Shift-Cmd-F". Mac and Win key equivalents are automatically
     *      mapped to each other. Use displayKey property to display a different string (e.g. "CMD+" instead of "CMD=").
     * @param {?string} platform - the target OS of the keyBindings either "mac" or "win". If undefined, all platforms will use
     *      the key binding. Ignored if keyBindings is passed an Array.
     * @return {{key: string, displayKey:String}|Array.<{key: string, displayKey:String}>} Returns record(s) for valid key binding(s)
     */
    function addBinding(commandID, keyBindingRequests, platform) {
        if ((commandID === null) || (commandID === undefined) || !keyBindingRequests) {
            return;
        }
        
        var normalizedBindings = [],
            targetPlatform,
            results;

        if ($.isArray(keyBindingRequests)) {
            var keyBinding;
            results = [];
                                            
            keyBindingRequests.forEach(function (keyBindingRequest) {
                targetPlatform = keyBindingRequest.platform || brackets.platform;
                keyBinding = _addBinding(commandID, keyBindingRequest, targetPlatform);
                
                if (keyBinding) {
                    results.push(keyBinding);
                }
            });
        } else {
            targetPlatform = platform || brackets.platform;
            results = _addBinding(commandID, keyBindingRequests, targetPlatform);
        }
        
        return results;
    }

    /**
     * Remove a key binding from _keymap
     *
     * @param {string} key - a key-description string that may or may not be normalized.
     * @param {string} platform - the intended OS of the key.
     */
    function removeBinding(key, platform) {
        if (!key || ((platform !== null) && (platform !== undefined) && (platform !== brackets.platform))) {
            return;
        }

        var normalizedKey = normalizeKeyDescriptorString(key);
        
        if (!normalizedKey) {
            console.log("Fail to nomalize " + key);
        } else if (_isKeyAssigned(normalizedKey)) {
            var binding = _keyMap[normalizedKey],
                command = CommandManager.get(binding.commandID),
                bindings = _commandMap[binding.commandID];
            
            // delete key binding record
            delete _keyMap[normalizedKey];
            
            if (bindings) {
                // delete mapping from command to key binding
                _commandMap[binding.commandID] = bindings.filter(function (b) {
                    return (b.key !== normalizedKey);
                });
    
                if (command) {
                    $(command).triggerHandler("keyBindingRemoved", [{key: normalizedKey, displayKey: binding.displayKey}]);
                }
            }
        }
    }
    
    /**
     * Retrieve key bindings currently associated with a command
     *
     * @param {!string} command - A command ID
     * @return {!Array.<{{key: string, displayKey: string}}>} An array of associated key bindings.
     */
    function getKeyBindings(commandID) {
        var bindings = _commandMap[commandID];
        return bindings || [];
    }

    /**
     * Install keydown event listener.
     */
    function init() {
        // init
        window.document.body.addEventListener(
            "keydown",
            function (event) {
                if (handleKey(_translateKeyboardEvent(event))) {
                    event.stopPropagation();
                }
            },
            true
        );
    }

    // unit test only
    exports._reset = _reset;

    // Define public API
    exports.init = init;
    exports.getKeymap = getKeymap;
    exports.handleKey = handleKey;
    exports.setEnabled = setEnabled;
    exports.addBinding = addBinding;
    exports.removeBinding = removeBinding;
    exports.formatKeyDescriptor = formatKeyDescriptor;
    exports.getKeyBindings = getKeyBindings;
});
