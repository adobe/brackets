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
/*unittests: KeyBindingManager */

/**
 * Manages the mapping of keyboard inputs to commands.
 */
define(function (require, exports, module) {
    "use strict";

    require("utils/Global");

    var AppInit             = require("utils/AppInit"),
        Commands            = require("command/Commands"),
        CommandManager      = require("command/CommandManager"),
        DefaultDialogs      = require("widgets/DefaultDialogs"),
        FileSystem          = require("filesystem/FileSystem"),
        FileSystemError     = require("filesystem/FileSystemError"),
        FileUtils           = require("file/FileUtils"),
        KeyEvent            = require("utils/KeyEvent"),
        Strings             = require("strings"),
        StringUtils         = require("utils/StringUtils"),
        _                   = require("thirdparty/lodash");

    var KeyboardPrefs       = JSON.parse(require("text!base-config/keyboard.json"));
    
    var KEYMAP_FILENAME     = "keymap.json",
        _userKeyMapFilePath = brackets.app.getApplicationSupportDirectory() + "/" + KEYMAP_FILENAME;

    /**
     * @private
     * Maps normalized shortcut descriptor to key binding info.
     * @type {!Object.<string, {commandID: string, key: string, displayKey: string}>}
     */
    var _keyMap            = {};
    var _keyMapCache       = {};

    var _customKeyMap      = {},
        _customKeyMapCache = {};
    
    /**
     * @private
     * Maps commandID to the list of shortcuts that are bound to it.
     * @type {!Object.<string, Array.<{key: string, displayKey: string}>>}
     */
    var _commandMap  = {},
        _allCommands = [];
    
    var _specialCommands = [Commands.EDIT_UNDO, Commands.EDIT_REDO, Commands.EDIT_SELECT_ALL,
                            Commands.EDIT_CUT, Commands.EDIT_COPY, Commands.EDIT_PASTE];
    
    var _macReservedShortcuts = ["Cmd-,", "Cmd-H", "Cmd-Alt-H", "Cmd-M", "Cmd-Q"];

    /**
     * @private
     * Allow clients to toggle key binding
     * @type {boolean}
     */
    var _enabled = true;
    
    /**
     * @private
     * Stack of registered global keydown hooks.
     * @type {Array.<function(Event): boolean>}
     */
    var _globalKeydownHooks = [];

    /**
     * @private
     */
    function _reset() {
        _keyMap = {};
        _commandMap = {};
        _globalKeydownHooks = [];
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
    function _buildKeyDescriptor(hasMacCtrl, hasCtrl, hasAlt, hasShift, key) {
        if (!key) {
            console.log("KeyBindingManager _buildKeyDescriptor() - No key provided!");
            return "";
        }
        
        var keyDescriptor = [];
       
        if (hasMacCtrl) {
            keyDescriptor.push("Ctrl");
        }
        if (hasAlt) {
            keyDescriptor.push("Alt");
        }
        if (hasShift) {
            keyDescriptor.push("Shift");
        }

        if (hasCtrl) {
            // Windows display Ctrl first, Mac displays Command symbol last
            if (brackets.platform === "mac") {
                keyDescriptor.push("Cmd");
            } else {
                keyDescriptor.unshift("Ctrl");
            }
        }

        if (key.length === 1 && /[a-z]/.test(key)) {
            key = key.toUpperCase();
        }
        
        keyDescriptor.push(key);
        
        return keyDescriptor.join("-");
    }
    
    
    /**
     * normalizes the incoming key descriptor so the modifier keys are always specified in the correct order
     * @param {string} The string for a key descriptor, can be in any order, the result will be Ctrl-Alt-Shift-<Key>
     * @return {string} The normalized key descriptor or null if the descriptor invalid
     */
    function normalizeKeyDescriptorString(origDescriptor) {
        var hasMacCtrl = false,
            hasCtrl = false,
            hasAlt = false,
            hasShift = false,
            key = "",
            error = false;

        function _compareModifierString(left, right) {
            if (!left || !right) {
                return false;
            }
            left = left.trim().toLowerCase();
            right = right.trim().toLowerCase();
            
            return (left.length > 0 && left === right);
        }
        
        origDescriptor.split("-").forEach(function parseDescriptor(ele, i, arr) {
            if (_compareModifierString("ctrl", ele)) {
                if (brackets.platform === "mac") {
                    hasMacCtrl = true;
                } else {
                    hasCtrl = true;
                }
            } else if (_compareModifierString("cmd", ele)) {
                hasCtrl = true;
            } else if (_compareModifierString("alt", ele)) {
                hasAlt = true;
            } else if (_compareModifierString("opt", ele)) {
                hasAlt = true;
            } else if (_compareModifierString("shift", ele)) {
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
        
        // '+' char is valid if it's the only key. Keyboard shortcut strings should use
        // unicode characters (unescaped). Keyboard shortcut display strings may use
        // unicode escape sequences (e.g. \u20AC euro sign)
        if ((key.indexOf("+")) >= 0 && (key.length > 1)) {
            return null;
        }
        
        return _buildKeyDescriptor(hasMacCtrl, hasCtrl, hasAlt, hasShift, key);
    }
    
    /**
     * @private
     * Looks for keycodes that have os-inconsistent keys and fixes them.
     * @param {number} The keycode from the keyboard event.
     * @param {string} The current best guess at what the key is.
     * @return {string} If the key is OS-inconsistent, the correct key; otherwise, the original key.
     **/
    function _mapKeycodeToKey(keycode, key) {
        // If keycode represents one of the digit keys (0-9), then return the corresponding digit
        // by subtracting KeyEvent.DOM_VK_0 from keycode. ie. [48-57] --> [0-9]
        if (keycode >= KeyEvent.DOM_VK_0 && keycode <= KeyEvent.DOM_VK_9) {
            return String(keycode - KeyEvent.DOM_VK_0);
        // Do the same with the numpad numbers
        // by subtracting KeyEvent.DOM_VK_NUMPAD0 from keycode. ie. [96-105] --> [0-9]
        } else if (keycode >= KeyEvent.DOM_VK_NUMPAD0 && keycode <= KeyEvent.DOM_VK_NUMPAD9) {
            return String(keycode - KeyEvent.DOM_VK_NUMPAD0);
        }
        
        
        switch (keycode) {
        case KeyEvent.DOM_VK_SEMICOLON:
            return ";";
        case KeyEvent.DOM_VK_EQUALS:
            return "=";
        case KeyEvent.DOM_VK_COMMA:
            return ",";
        case KeyEvent.DOM_VK_SUBTRACT:
        case KeyEvent.DOM_VK_DASH:
            return "-";
        case KeyEvent.DOM_VK_ADD:
            return "+";
        case KeyEvent.DOM_VK_DECIMAL:
        case KeyEvent.DOM_VK_PERIOD:
            return ".";
        case KeyEvent.DOM_VK_DIVIDE:
        case KeyEvent.DOM_VK_SLASH:
            return "/";
        case KeyEvent.DOM_VK_BACK_QUOTE:
            return "`";
        case KeyEvent.DOM_VK_OPEN_BRACKET:
            return "[";
        case KeyEvent.DOM_VK_BACK_SLASH:
            return "\\";
        case KeyEvent.DOM_VK_CLOSE_BRACKET:
            return "]";
        case KeyEvent.DOM_VK_QUOTE:
            return "'";
        default:
            return key;
        }
    }
    
    /**
     * Takes a keyboard event and translates it into a key in a key map
     */
    function _translateKeyboardEvent(event) {
        var hasMacCtrl = (brackets.platform === "mac") ? (event.ctrlKey) : false,
            hasCtrl = (brackets.platform !== "mac") ? (event.ctrlKey) : (event.metaKey),
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
        if (key === "\t") {
            key = "Tab";
        } else if (key === " ") {
            key = "Space";
        } else {
            key = _mapKeycodeToKey(event.keyCode, key);
        }

        return _buildKeyDescriptor(hasMacCtrl, hasCtrl, hasAlt, hasShift, key);
    }
    
    /**
     * Convert normalized key representation to display appropriate for platform.
     * @param {!string} descriptor Normalized key descriptor.
     * @return {!string} Display/Operating system appropriate string
     */
    function formatKeyDescriptor(descriptor) {
        var displayStr;
        
        if (brackets.platform === "mac") {
            displayStr = descriptor.replace(/-(?!$)/g, "");     // remove dashes
            displayStr = displayStr.replace("Ctrl", "\u2303");  // Ctrl > control symbol
            displayStr = displayStr.replace("Cmd", "\u2318");   // Cmd > command symbol
            displayStr = displayStr.replace("Shift", "\u21E7"); // Shift > shift symbol
            displayStr = displayStr.replace("Alt", "\u2325");   // Alt > option symbol
        } else {
            displayStr = descriptor.replace("Ctrl", Strings.KEYBOARD_CTRL);   // Ctrl
            displayStr = displayStr.replace("Shift", Strings.KEYBOARD_SHIFT); // Shift > shift symbol
            displayStr = displayStr.replace("Space", Strings.KEYBOARD_SPACE); // Alt > option symbol
            displayStr = displayStr.replace(/-(?!$)/g, "+");
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
     * Remove a key binding from _keymap
     *
     * @param {!string} key - a key-description string that may or may not be normalized.
     * @param {?string} platform - OS from which to remove the binding (all platforms if unspecified)
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
     * @private
     *
     * @param {string} commandID
     * @param {string|{{key: string, displayKey: string}}} keyBinding - a single shortcut.
     * @param {?string} platform
     *     - "all" indicates all platforms, not overridable
     *     - undefined indicates all platforms, overridden by platform-specific binding
     * @return {?{key: string, displayKey:String}} Returns a record for valid key bindings.
     *     Returns null when key binding platform does not match, binding does not normalize,
     *     or is already assigned.
     */
    function _addBinding(commandID, keyBinding, platform) {
        var key,
            result = null,
            normalized,
            normalizedDisplay,
            explicitPlatform = keyBinding.platform || platform,
            targetPlatform,
            command,
            bindingsToDelete = [],
            existing;

        // For platform: "all", use explicit current plaform
        if (explicitPlatform && explicitPlatform !== "all") {
            targetPlatform = explicitPlatform;
        } else {
            targetPlatform = brackets.platform;
        }
        
        // if the request does not specify an explicit platform, and we're
        // currently on a mac, then replace Ctrl with Cmd.
        key = (keyBinding.key) || keyBinding;
        if (brackets.platform === "mac" && (explicitPlatform === undefined || explicitPlatform === "all")) {
            key = key.replace("Ctrl", "Cmd");
            if (keyBinding.displayKey !== undefined) {
                keyBinding.displayKey = keyBinding.displayKey.replace("Ctrl", "Cmd");
            }
        }
        normalized = normalizeKeyDescriptorString(key);
        
        // skip if the key binding is invalid 
        if (!normalized) {
            console.error("Unable to parse key binding " + key + ". Permitted modifiers: Ctrl, Cmd, Alt, Opt, Shift; separated by '-' (not '+').");
            return null;
        }
        
        // check for duplicate key bindings
        existing = _keyMap[normalized];
        
        // for cross-platform compatibility
        if (exports.useWindowsCompatibleBindings) {
            // windows-only key bindings are used as the default binding
            // only if a default binding wasn't already defined
            if (explicitPlatform === "win") {
                // search for a generic or platform-specific binding if it
                // already exists
                if (existing && (!existing.explicitPlatform ||
                                 existing.explicitPlatform === brackets.platform ||
                                 existing.explicitPlatform === "all")) {
                    // do not clobber existing binding with windows-only binding
                    return null;
                }
                
                // target this windows binding for the current platform
                targetPlatform = brackets.platform;
            }
        }
        
        // skip if this binding doesn't match the current platform
        if (targetPlatform !== brackets.platform) {
            return null;
        }
        
        // skip if the key is already assigned
        if (existing) {
            if (!existing.explicitPlatform && explicitPlatform) {
                // remove the the generic binding to replace with this new platform-specific binding
                removeBinding(normalized);
                existing = false;
            }
        }
        
        // delete existing bindings when
        // (1) replacing a windows-compatible binding with a generic or
        //     platform-specific binding
        // (2) replacing a generic binding with a platform-specific binding
        var existingBindings = _commandMap[commandID] || [],
            isWindowsCompatible,
            isReplaceGeneric,
            ignoreGeneric;
        
        existingBindings.forEach(function (binding) {
            // remove windows-only bindings in _commandMap
            isWindowsCompatible = exports.useWindowsCompatibleBindings &&
                binding.explicitPlatform === "win";
            
            // remove existing generic binding
            isReplaceGeneric = !binding.explicitPlatform &&
                explicitPlatform;
            
            if (isWindowsCompatible || isReplaceGeneric) {
                bindingsToDelete.push(binding);
            } else {
                // existing binding is platform-specific and the requested binding is generic
                ignoreGeneric = binding.explicitPlatform && !explicitPlatform;
            }
        });

        if (ignoreGeneric) {
            // explicit command binding overrides this one
            return null;
        }
        
        if (existing) {
            // do not re-assign a key binding
            console.error("Cannot assign " + normalized + " to " + commandID + ". It is already assigned to " + _keyMap[normalized].commandID);
            return null;
        }
        
        // remove generic or windows-compatible bindings
        bindingsToDelete.forEach(function (binding) {
            removeBinding(binding.key);
        });
        
        // optional display-friendly string (e.g. CMD-+ instead of CMD-=)
        normalizedDisplay = (keyBinding.displayKey) ? normalizeKeyDescriptorString(keyBinding.displayKey) : normalized;
        
        // 1-to-many commandID mapping to key binding
        if (!_commandMap[commandID]) {
            _commandMap[commandID] = [];
        }
        
        result = {
            key                 : normalized,
            displayKey          : normalizedDisplay,
            explicitPlatform    : explicitPlatform
        };
        
        _commandMap[commandID].push(result);
        
        // 1-to-1 key binding to commandID
        _keyMap[normalized] = {
            commandID           : commandID,
            key                 : normalized,
            displayKey          : normalizedDisplay,
            explicitPlatform    : explicitPlatform
        };
        
        // notify listeners
        command = CommandManager.get(commandID);
        
        if (command) {
            $(command).triggerHandler("keyBindingAdded", [result]);
        }
        
        return result;
    }

    /**
     * Returns a copy of the keymap
     * @return {!Object.<string, {commandID: string, key: string, displayKey: string}>}
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
    function _handleKey(key) {
        if (_enabled && _keyMap[key]) {
            // The execute() function returns a promise because some commands are async.
            // Generally, commands decide whether they can run or not synchronously,
            // and reject immediately, so we can test for that synchronously.
            var promise = CommandManager.execute(_keyMap[key].commandID);
            return (promise.state() !== "rejected");
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
     * @private
     *
     * Sort objects by platform property. Objects with a platform property come
     * before objects without a platform property.
     */
    function _sortByPlatform(a, b) {
        var a1 = (a.platform) ? 1 : 0,
            b1 = (b.platform) ? 1 : 0;
        return b1 - a1;
    }

    /**
     * Add one or more key bindings to a particular Command.
     *
     * @param {!string | Command} command - A command ID or command object
     * @param {?({key: string, displayKey: string}|Array.<{key: string, displayKey: string, platform: string}>)} keyBindings
     *     A single key binding or an array of keybindings. Example:
     *     "Shift-Cmd-F". Mac and Win key equivalents are automatically
     *     mapped to each other. Use displayKey property to display a different
     *     string (e.g. "CMD+" instead of "CMD=").
     * @param {?string} platform The target OS of the keyBindings either
     *     "mac", "win" or "linux". If undefined, all platforms not explicitly
     *     defined will use the key binding.
     * @return {{key: string, displayKey:String}|Array.<{key: string, displayKey:String}>}
     *     Returns record(s) for valid key binding(s)
     */
    function addBinding(command, keyBindings, platform) {
        var commandID           = "",
            results;
        
        if (!command) {
            console.error("addBinding(): missing required parameter: command");
            return;
        }
        
        if (!keyBindings) { return; }
        
        if (typeof (command) === "string") {
            commandID = command;
        } else {
            commandID = command.getID();
        }
        
        if (Array.isArray(keyBindings)) {
            var keyBinding;
            results = [];

            // process platform-specific bindings first
            keyBindings.sort(_sortByPlatform);
            
            keyBindings.forEach(function addSingleBinding(keyBindingRequest) {
                // attempt to add keybinding
                keyBinding = _addBinding(commandID, keyBindingRequest, keyBindingRequest.platform);
                
                if (keyBinding) {
                    results.push(keyBinding);
                }
            });
        } else {
            results = _addBinding(commandID, keyBindings, platform);
        }
        
        return results;
    }

    /**
     * Retrieve key bindings currently associated with a command
     *
     * @param {!string | Command} command - A command ID or command object
     * @return {!Array.<{{key: string, displayKey: string}}>} An array of associated key bindings.
     */
    function getKeyBindings(command) {
        var bindings    = [],
            commandID   = "";
        
        if (!command) {
            console.error("getKeyBindings(): missing required parameter: command");
            return [];
        }
        
        if (typeof (command) === "string") {
            commandID = command;
        } else {
            commandID = command.getID();
        }
        
        bindings = _commandMap[commandID];
        return bindings || [];
    }
    
    /**
     * Adds default key bindings when commands are registered to CommandManager
     * @param {$.Event} event jQuery event
     * @param {Command} command Newly registered command
     */
    function _handleCommandRegistered(event, command) {
        var commandId   = command.getID(),
            defaults    = KeyboardPrefs[commandId];
        
        if (defaults) {
            addBinding(commandId, defaults);
        }
    }
    
    /**
     * Adds a global keydown hook that gets first crack at keydown events 
     * before standard keybindings do. This is intended for use by modal or 
     * semi-modal UI elements like dialogs or the code hint list that should 
     * execute before normal command bindings are run. 
     * 
     * The hook is passed one parameter, the original keyboard event. If the 
     * hook handles the event (or wants to block other global hooks from 
     * handling the event), it should return true. Note that this will *only*
     * stop other global hooks and KeyBindingManager from handling the
     * event; to prevent further event propagation, you will need to call
     * stopPropagation(), stopImmediatePropagation(), and/or preventDefault()
     * as usual.
     *
     * Multiple keydown hooks can be registered, and are executed in order, 
     * most-recently-added first.
     * 
     * (We have to have a special API for this because (1) handlers are normally
     * called in least-recently-added order, and we want most-recently-added; 
     * (2) native DOM events don't have a way for us to find out if 
     * stopImmediatePropagation()/stopPropagation() has been called on the
     * event, so we have to have some other way for one of the hooks to 
     * indicate that it wants to block the other hooks from running.)
     *
     * @param {function(Event): boolean} hook The global hook to add.
     */
    function addGlobalKeydownHook(hook) {
        _globalKeydownHooks.push(hook);
    }
    
    /**
     * Removes a global keydown hook added by `addGlobalKeydownHook`.
     * Does not need to be the most recently added hook.
     *
     * @param {function(Event): boolean} hook The global hook to remove.
     */
    function removeGlobalKeydownHook(hook) {
        var index = _globalKeydownHooks.indexOf(hook);
        if (index !== -1) {
            _globalKeydownHooks.splice(index, 1);
        }
    }
    
    /**
     * Handles a given keydown event, checking global hooks first before
     * deciding to handle it ourselves.
     * @param {Event} The keydown event to handle.
     */
    function _handleKeyEvent(event) {
        var i, handled = false;
        for (i = _globalKeydownHooks.length - 1; i >= 0; i--) {
            if (_globalKeydownHooks[i](event)) {
                handled = true;
                break;
            }
        }
        if (!handled && _handleKey(_translateKeyboardEvent(event))) {
            event.stopPropagation();
            event.preventDefault();
        }
    }

    AppInit.htmlReady(function () {
        // Install keydown event listener.
        window.document.body.addEventListener(
            "keydown",
            _handleKeyEvent,
            true
        );
        
        exports.useWindowsCompatibleBindings = (brackets.platform !== "mac") &&
            (brackets.platform !== "win");
    });
    
    /**
     * @private
     */
    function _showErrorsAndOpenKeyMap(err, message) {
        // Asynchronously loading Dialogs module to avoid the circular dependency
        require(["widgets/Dialogs"], function (dialogsModule) {
            var Dialogs = dialogsModule,
                errorMessage = Strings.ERROR_KEYMAP_CORRUPT;
            
            if (err === FileSystemError.UNSUPPORTED_ENCODING) {
                errorMessage = Strings.ERROR_LOADING_KEYMAP;
            } else if (message) {
                errorMessage = message;
            }
            
            Dialogs.showModalDialog(
                DefaultDialogs.DIALOG_ID_ERROR,
                Strings.ERROR_KEYMAP_TITLE,
                errorMessage
            )
                .done(function () {
                    if (err !== FileSystemError.UNSUPPORTED_ENCODING) {
                        CommandManager.execute(Commands.FILE_OPEN_KEYMAP);
                    }
                });
        });
    }
    
    function _isSpecialCommand(commandID) {
        if (brackets.platform === "mac" && commandID === "file.quit") {
            return true;
        }
        
        return (_specialCommands.indexOf(commandID) > -1);
    }
    
    function _isMacReservedShortcuts(normalizedKey) {
        if (brackets.platform !== "mac") {
            return false;
        }
        
        if (_macReservedShortcuts.indexOf(normalizedKey) > -1) {
            return true;
        }
        
        var isRestricted = _.some(_specialCommands, function (commandID) {
            var existingBindings = _commandMap[commandID] || [];
            return (existingBindings.length && existingBindings[0].key === normalizedKey);
        });
        
        return isRestricted;
    }
    
    function _getBulletList(list) {
        var message = "<ul class='dialog-list'>";
        list.forEach(function (info) {
            message += "<li>" + info + "</li>";
        });
        message += "</ul>";
        return message;
    }
    
    function _getDisplayKey(normalizedKey) {
        var displayKey = "";
        if (brackets.platform === "mac" && /(Up|Down|Left|Right)$/i.test(normalizedKey)) {
            normalizedKey = normalizedKey.replace(/Up$/i, "\u2191");
            normalizedKey = normalizedKey.replace(/Down$/i, "\u2193");
            normalizedKey = normalizedKey.replace(/Left$/i, "\u2190");
            normalizedKey = normalizedKey.replace(/Right$/i, "\u2192");
            displayKey = normalizedKey;
        }
        return displayKey;
    }
    
    function _applyUserKeyBindings() {
        var remappedCommands   = [],
            restrictedCommands = [],
            restrictedKeys     = [],
            invalidKeys        = [],
            invalidCommands    = [],
            multipleKeys       = [],
            errorMessage       = "";
        
        if (_.size(_customKeyMap)) {
            _.forEach(_customKeyMap, function (commandID, key) {
                var normalizedKey    = normalizeKeyDescriptorString(key),
                    existingBindings = _commandMap[commandID] || [];

                if (_isSpecialCommand(commandID)) {
                    restrictedCommands.push(commandID);
                    return;
                }

                if (_isMacReservedShortcuts(normalizedKey)) {
                    restrictedKeys.push(key);
                    return;
                }

                if (_isKeyAssigned(normalizedKey)) {
                    if (_keyMap[normalizedKey].commandID === commandID) {
                        commandID = undefined;
                    } else {
                        removeBinding(normalizedKey);
                    }
                } else if (!normalizedKey) {
                    invalidKeys.push(key);
                } else if (existingBindings.length) {
                    existingBindings.forEach(function (binding) {
                        removeBinding(binding.key);
                    });
                }
                
                if (commandID) {
                    if (_allCommands.indexOf(commandID) !== -1) {
                        if (remappedCommands.indexOf(commandID) === -1) {
                            var keybinding = { key: normalizedKey };
                                
                            keybinding.displayKey = _getDisplayKey(normalizedKey);
                            addBinding(commandID, keybinding.displayKey ? keybinding : normalizedKey, brackets.platform);
                            remappedCommands.push(commandID);
                        } else {
                            multipleKeys.push(commandID);
                        }
                    } else {
                        invalidCommands.push(commandID);
                    }
                }
            });
            
            if (restrictedCommands.length) {
                errorMessage = StringUtils.format(Strings.ERROR_RESTRICTED_COMMANDS, _getBulletList(restrictedCommands));
            }
            
            if (restrictedKeys.length) {
                errorMessage += StringUtils.format(Strings.ERROR_RESTRICTED_SHORTCUTS, _getBulletList(restrictedKeys));
            }
            
            if (multipleKeys.length) {
                errorMessage = StringUtils.format(Strings.ERROR_MULTIPLE_SHORTCUTS, _getBulletList(multipleKeys));
            }
            
            if (invalidKeys.length) {
                errorMessage += StringUtils.format(Strings.ERROR_INVALID_SHORTCUTS, _getBulletList(invalidKeys));
            }
            
            if (invalidCommands.length) {
                errorMessage += StringUtils.format(Strings.ERROR_NONEXISTENT_COMMANDS, _getBulletList(invalidCommands));
            }
            
            if (errorMessage) {
                _showErrorsAndOpenKeyMap("", errorMessage);
            }
        }
    }
    
    function _undonePriorUserKeyBindings() {
        if (_.size(_customKeyMapCache)) {
            _.forEach(_customKeyMapCache, function (commandID, key) {
                var normalizedKey  = normalizeKeyDescriptorString(key),
                    defaults       = KeyboardPrefs[commandID],
                    defaultCommand = _keyMapCache[normalizedKey];

                if (_isSpecialCommand(commandID) ||
                        _isMacReservedShortcuts(normalizedKey)) {
                    return;
                }

                if (_isKeyAssigned(normalizedKey) &&
                        _customKeyMap[key] !== commandID && _customKeyMap[normalizedKey] !== commandID) {
                    removeBinding(normalizedKey);
                
                    if (defaults.length) {
                        addBinding(commandID, defaults);
                    }
                    
                    if (defaultCommand && defaultCommand.key) {
                        addBinding(defaultCommand.commandID, defaultCommand.key, brackets.platform);
                    }
                }
            });
        }
    }
    
    /**
     * @private
     */
    function _readUserKeyMap() {
        var file   = FileSystem.getFileForPath(_userKeyMapFilePath),
            result = new $.Deferred();
       
        file.exists(function (err, doesExist) {
            if (doesExist) {
                FileUtils.readAsText(file)
                    .done(function (text) {
                        var keyMap = {};
                        try {
                            if (text) {
                                var json = JSON.parse(text);
                                if (json) {
                                    // If no overrides, return an empty key map.
                                    result.resolve(json.overrides || keyMap);
                                }
                            } else {
                                // The file is empty, so return an empty key map.
                                result.resolve(keyMap);
                            }
                        } catch (e) {
                            result.reject(e);
                        }
                    })
                    .fail(function (e) {
                        result.reject(e);
                    });
            }
        });
        return result.promise();
    }

    /**
     * @private
     */
    function _loadUserKeyMap() {
        _readUserKeyMap()
            .then(function (keyMap) {
                if (_.size(_customKeyMap)) {
                    _customKeyMapCache = _.cloneDeep(_customKeyMap);
                }
                _customKeyMap = keyMap;
                _undonePriorUserKeyBindings();
                _applyUserKeyBindings();
            }, function (err) {
                _showErrorsAndOpenKeyMap(err);
            });
    }
        
    /**
     * @private
     */
    function _openUserKeyMap() {
        var file = FileSystem.getFileForPath(_userKeyMapFilePath);
        file.exists(function (err, doesExist) {
            if (doesExist) {
                CommandManager.execute(Commands.FILE_OPEN, { fullPath: _userKeyMapFilePath });
            } else {
                var defaultContent = "{\n    \"documentation\": \"https://github.com/adobe/brackets/wiki/Key-Bindings\"," +
                                     "\n    \"overrides\": {" +
                                     "\n        \n    }\n}\n";
                
                FileUtils.writeText(file, defaultContent, true)
                    .done(function () {
                        CommandManager.execute(Commands.FILE_OPEN, { fullPath: _userKeyMapFilePath });
                    });
            }
        });
    }

    $(CommandManager).on("commandRegistered", _handleCommandRegistered);
    CommandManager.register(Strings.CMD_OPEN_KEYMAP, Commands.FILE_OPEN_KEYMAP, _openUserKeyMap);

    // Asynchronously loading DocumentManager to avoid the circular dependency
    require(["document/DocumentManager"], function (docManager) {
        var DocumentManager = docManager;
        $(DocumentManager).on("documentSaved", function checkKeyMapUpdates(e, doc) {
            if (doc && doc.file.fullPath === _userKeyMapFilePath) {
                _loadUserKeyMap();
            }
        });
    });
    
    AppInit.extensionsLoaded(function () {
        _allCommands = CommandManager.getAll();
        _keyMapCache = _.cloneDeep(_keyMap);
        _loadUserKeyMap();
    });

    function _setUserKeyMapFilePath(fullPath) {
        _userKeyMapFilePath = fullPath;
    }
    
    // unit test only
    exports._reset = _reset;
    exports._setUserKeyMapFilePath = _setUserKeyMapFilePath;

    // Define public API
    exports.getKeymap = getKeymap;
    exports.setEnabled = setEnabled;
    exports.addBinding = addBinding;
    exports.removeBinding = removeBinding;
    exports.formatKeyDescriptor = formatKeyDescriptor;
    exports.getKeyBindings = getKeyBindings;
    exports.addGlobalKeydownHook = addGlobalKeydownHook;
    exports.removeGlobalKeydownHook = removeGlobalKeydownHook;
    
    /**
     * Use windows-specific bindings if no other are found (e.g. Linux).
     * Core Brackets modules that use key bindings should always define at
     * least a generic keybinding that is applied for all platforms. This
     * setting effectively creates a compatibility mode for third party
     * extensions that define explicit key bindings for Windows and Mac, but
     * not Linux.
     */
    exports.useWindowsCompatibleBindings = false;
    
    // For unit testing only
    exports._handleKey = _handleKey;
    exports._handleKeyEvent = _handleKeyEvent;
});