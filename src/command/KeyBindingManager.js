/*
 * Copyright (c) 2012 - present Adobe Systems Incorporated. All rights reserved.
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

/*jslint regexp: true */
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
        EventDispatcher     = require("utils/EventDispatcher"),
        FileSystem          = require("filesystem/FileSystem"),
        FileSystemError     = require("filesystem/FileSystemError"),
        FileUtils           = require("file/FileUtils"),
        KeyEvent            = require("utils/KeyEvent"),
        Strings             = require("strings"),
        StringUtils         = require("utils/StringUtils"),
        UrlParams           = require("utils/UrlParams").UrlParams,
        _                   = require("thirdparty/lodash");

    var KeyboardPrefs       = JSON.parse(require("text!base-config/keyboard.json"));

    var KEYMAP_FILENAME     = "keymap.json",
        _userKeyMapFilePath = brackets.app.getApplicationSupportDirectory() + "/" + KEYMAP_FILENAME;

    /**
     * @private
     * Maps normalized shortcut descriptor to key binding info.
     * @type {!Object.<string, {commandID: string, key: string, displayKey: string}>}
     */
    var _keyMap            = {},    // For the actual key bindings including user specified ones
        // For the default factory key bindings, cloned from _keyMap after all extensions are loaded.
        _defaultKeyMap     = {};

    /**
     * @typedef {{shortcut: !string,
     *            commandID: ?string}} UserKeyBinding
     */

    /**
     * @private
     * Maps shortcut descriptor to a command id.
     * @type {UserKeyBinding}
     */
    var _customKeyMap      = {},
        _customKeyMapCache = {};

    /**
     * @private
     * Maps commandID to the list of shortcuts that are bound to it.
     * @type {!Object.<string, Array.<{key: string, displayKey: string}>>}
     */
    var _commandMap  = {};

    /**
     * @private
     * An array of command ID for all the available commands including the commands
     * of installed extensions.
     * @type {Array.<string>}
     */
    var _allCommands = [];

    /**
     * @private
     * Maps key names to the corresponding unicode symols
     * @type {{key: string, displayKey: string}}
     */
    var _displayKeyMap        = { "up":    "\u2191",
                                  "down":  "\u2193",
                                  "left":  "\u2190",
                                  "right": "\u2192",
                                  "-":     "\u2212" };

    var _specialCommands      = [Commands.EDIT_UNDO, Commands.EDIT_REDO, Commands.EDIT_SELECT_ALL,
                                 Commands.EDIT_CUT, Commands.EDIT_COPY, Commands.EDIT_PASTE],
        _reservedShortcuts    = ["Ctrl-Z", "Ctrl-Y", "Ctrl-A", "Ctrl-X", "Ctrl-C", "Ctrl-V"],
        _macReservedShortcuts = ["Cmd-,", "Cmd-H", "Cmd-Alt-H", "Cmd-M", "Cmd-Shift-Z", "Cmd-Q"],
        _keyNames             = ["Up", "Down", "Left", "Right", "Backspace", "Enter", "Space", "Tab",
                                 "PageUp", "PageDown", "Home", "End", "Insert", "Delete"];

    /**
     * @private
     * Flag to show key binding errors in the key map file. Default is true and
     * it will be set to false when reloading without extensions. This flag is not
     * used to suppress errors in loading or parsing the key map file. So if the key
     * map file is corrupt, then the error dialog still shows up.
     *
     * @type {boolean}
     */
    var _showErrors = true;

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
     * Forward declaration for JSLint.
     * @type {Function}
     */
    var _loadUserKeyMap;

    /**
     * @private
     * States of Ctrl key down detection
     * @enum {number}
     */
    var CtrlDownStates = {
        "NOT_YET_DETECTED"    : 0,
        "DETECTED"            : 1,
        "DETECTED_AND_IGNORED": 2   // For consecutive ctrl keydown events while a Ctrl key is being hold down
    };

    /**
     * @private
     * Flags used to determine whether right Alt key is pressed. When it is pressed,
     * the following two keydown events are triggered in that specific order.
     *
     *    1. _ctrlDown - flag used to record { ctrlKey: true, keyIdentifier: "Control", ... } keydown event
     *    2. _altGrDown - flag used to record { ctrlKey: true, altKey: true, keyIdentifier: "Alt", ... } keydown event
     *
     * @type {CtrlDownStates|boolean}
     */
    var _ctrlDown = CtrlDownStates.NOT_YET_DETECTED,
        _altGrDown = false;

    /**
     * @private
     * Used to record the timeStamp property of the last keydown event.
     * @type {number}
     */
    var _lastTimeStamp;

    /**
     * @private
     * Used to record the keyIdentifier property of the last keydown event.
     * @type {string}
     */
    var _lastKeyIdentifier;

    /*
     * @private
     * Constant used for checking the interval between Control keydown event and Alt keydown event.
     * If the right Alt key is down we get Control keydown followed by Alt keydown within 30 ms. if
     * the user is pressing Control key and then Alt key, the interval will be larger than 30 ms.
     * @type {number}
     */
    var MAX_INTERVAL_FOR_CTRL_ALT_KEYS = 30;

    /**
     * @private
     * Forward declaration for JSLint.
     * @type {Function}
     */
    var _onCtrlUp;

    /**
     * @private
     * Resets all the flags and removes _onCtrlUp event listener.
     *
     */
    function _quitAltGrMode() {
        _enabled = true;
        _ctrlDown = CtrlDownStates.NOT_YET_DETECTED;
        _altGrDown = false;
        _lastTimeStamp = null;
        _lastKeyIdentifier = null;
        $(window).off("keyup", _onCtrlUp);
    }

    /**
     * @private
     * Detects the release of AltGr key by checking all keyup events
     * until we receive one with ctrl key code. Once detected, reset
     * all the flags and also remove this event listener.
     *
     * @param {!KeyboardEvent} e keyboard event object
     */
    _onCtrlUp = function (e) {
        var key = e.keyCode || e.which;
        if (_altGrDown && key === KeyEvent.DOM_VK_CONTROL) {
            _quitAltGrMode();
        }
    };

    /**
     * @private
     * Detects whether AltGr key is pressed. When it is pressed, the first keydown event has
     * ctrlKey === true with keyIdentifier === "Control". The next keydown event with
     * altKey === true, ctrlKey === true and keyIdentifier === "Alt" is sent within 30 ms. Then
     * the next keydown event with altKey === true, ctrlKey === true and keyIdentifier === "Control"
     * is sent. If the user keep holding AltGr key down, then the second and third
     * keydown events are repeatedly sent out alternately. If the user is also holding down Ctrl
     * key, then either keyIdentifier === "Control" or keyIdentifier === "Alt" is repeatedly sent
     * but not alternately.
     *
     * Once we detect the AltGr key down, then disable KeyBindingManager and set up a keyup
     * event listener to detect the release of the altGr key so that we can re-enable KeyBindingManager.
     * When we detect the addition of Ctrl key besides AltGr key, we also quit AltGr mode and re-enable
     * KeyBindingManager.
     *
     * @param {!KeyboardEvent} e keyboard event object
     */
    function _detectAltGrKeyDown(e) {
        if (brackets.platform !== "win") {
            return;
        }

        if (!_altGrDown) {
            if (_ctrlDown !== CtrlDownStates.DETECTED_AND_IGNORED && e.ctrlKey && e.keyIdentifier === "Control") {
                _ctrlDown = CtrlDownStates.DETECTED;
            } else if (e.repeat && e.ctrlKey && e.keyIdentifier === "Control") {
                // We get here if the user is holding down left/right Control key. Set it to false
                // so that we don't misidentify the combination of Ctrl and Alt keys as AltGr key.
                _ctrlDown = CtrlDownStates.DETECTED_AND_IGNORED;
            } else if (_ctrlDown === CtrlDownStates.DETECTED && e.altKey && e.ctrlKey && e.keyIdentifier === "Alt" &&
                        (e.timeStamp - _lastTimeStamp) < MAX_INTERVAL_FOR_CTRL_ALT_KEYS) {
                _altGrDown = true;
                _lastKeyIdentifier = "Alt";
                _enabled = false;
                $(window).on("keyup", _onCtrlUp);
            } else {
                // Reset _ctrlDown so that we can start over in detecting the two key events
                // required for AltGr key.
                _ctrlDown = CtrlDownStates.NOT_YET_DETECTED;
            }
            _lastTimeStamp = e.timeStamp;
        } else if (e.keyIdentifier === "Control" || e.keyIdentifier === "Alt") {
            // If the user is NOT holding down AltGr key or is also pressing Ctrl key,
            // then _lastKeyIdentifier will be the same as keyIdentifier in the current
            // key event. So we need to quit AltGr mode to re-enable KBM.
            if (e.altKey && e.ctrlKey && e.keyIdentifier === _lastKeyIdentifier) {
                _quitAltGrMode();
            } else {
                _lastKeyIdentifier = e.keyIdentifier;
            }
        }
    }

    /**
     * @private
     */
    function _reset() {
        _keyMap = {};
        _defaultKeyMap = {};
        _customKeyMap = {};
        _customKeyMapCache = {};
        _commandMap = {};
        _globalKeydownHooks = [];
        _userKeyMapFilePath = brackets.app.getApplicationSupportDirectory() + "/" + KEYMAP_FILENAME;
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
                if (brackets.platform === "mac") {
                    hasCtrl = true;
                } else {
                    error = true;
                }
            } else if (_compareModifierString("alt", ele)) {
                hasAlt = true;
            } else if (_compareModifierString("opt", ele)) {
                if (brackets.platform === "mac") {
                    hasAlt = true;
                } else {
                    error = true;
                }
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

        // Ensure that the first letter of the key name is in upper case and the rest are
        // in lower case. i.e. 'a' => 'A' and 'up' => 'Up'
        if (/^[a-z]/i.test(key)) {
            key = _.capitalize(key.toLowerCase());
        }

        // Also make sure that the second word of PageUp/PageDown has the first letter in upper case.
        if (/^Page/.test(key)) {
            key = key.replace(/(up|down)$/, function (match, p1) {
                return _.capitalize(p1);
            });
        }

        // No restriction on single character key yet, but other key names are restricted to either
        // Function keys or those listed in _keyNames array.
        if (key.length > 1 && !/F\d+/.test(key) &&
                _keyNames.indexOf(key) === -1) {
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
        } else if (key === "\b") {
            key = "Backspace";
        } else if (key === "Help") {
            key = "Insert";
        } else if (event.keyCode === KeyEvent.DOM_VK_DELETE) {
            key = "Delete";
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
            displayStr = descriptor.replace("Ctrl", Strings.KEYBOARD_CTRL);
            displayStr = displayStr.replace("Shift", Strings.KEYBOARD_SHIFT);
            displayStr = displayStr.replace(/-(?!$)/g, "+");
        }

        displayStr = displayStr.replace("Space", Strings.KEYBOARD_SPACE);

        displayStr = displayStr.replace("PageUp", Strings.KEYBOARD_PAGE_UP);
        displayStr = displayStr.replace("PageDown", Strings.KEYBOARD_PAGE_DOWN);
        displayStr = displayStr.replace("Home", Strings.KEYBOARD_HOME);
        displayStr = displayStr.replace("End", Strings.KEYBOARD_END);

        displayStr = displayStr.replace("Ins", Strings.KEYBOARD_INSERT);
        displayStr = displayStr.replace("Del", Strings.KEYBOARD_DELETE);

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
                    command.trigger("keyBindingRemoved", {key: normalizedKey, displayKey: binding.displayKey});
                }
            }
        }
    }

    /**
     * @private
     *
     * Updates _allCommands array and _defaultKeyMap with the new key binding
     * if it is not yet in the _allCommands array. _allCommands array is initialized
     * only in extensionsLoaded event. So any new commands or key bindings added after
     * that will be updated here.
     *
     * @param {{commandID: string, key: string, displayKey:string, explicitPlatform: string}} newBinding
     */
    function _updateCommandAndKeyMaps(newBinding) {
        if (_allCommands.length === 0) {
            return;
        }

        if (newBinding && newBinding.commandID && _allCommands.indexOf(newBinding.commandID) === -1) {
            _defaultKeyMap[newBinding.commandID] = _.cloneDeep(newBinding);

            // Process user key map again to catch any reassignment to all new key bindings added from extensions.
            _loadUserKeyMap();
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
     * @param {boolean=} userBindings true if adding a user key binding or undefined otherwise.
     * @return {?{key: string, displayKey:String}} Returns a record for valid key bindings.
     *     Returns null when key binding platform does not match, binding does not normalize,
     *     or is already assigned.
     */
    function _addBinding(commandID, keyBinding, platform, userBindings) {
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


        // Skip if the key binding is not for this platform.
        if (explicitPlatform === "mac" && brackets.platform !== "mac") {
            return null;
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

        if (!userBindings) {
            _updateCommandAndKeyMaps(_keyMap[normalized]);
        }

        // notify listeners
        command = CommandManager.get(commandID);

        if (command) {
            command.trigger("keyBindingAdded", result);
        }

        return result;
    }

    /**
     * Returns a copy of the current key map. If the optional 'defaults' parameter is true,
     * then a copy of the default key map is returned.
     * @param {boolean=} defaults true if the caller wants a copy of the default key map.
     *                            Otherwise, the current active key map is returned.
     * @return {!Object.<string, {commandID: string, key: string, displayKey: string}>}
     */
    function getKeymap(defaults) {
        return $.extend({}, defaults ? _defaultKeyMap : _keyMap);
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
     *     NOTE: If platform is not specified, Ctrl will be replaced by Cmd for "mac" platform
     * @return {{key: string, displayKey:String}|Array.<{key: string, displayKey:String}>}
     *     Returns record(s) for valid key binding(s)
     */
    function addBinding(command, keyBindings, platform) {
        var commandID = "",
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
        _detectAltGrKeyDown(event);
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
     * Displays an error dialog and also opens the user key map file for editing only if
     * the error is not the loading file error.
     *
     * @param {?string} err Error type returned from JSON parser or open file operation
     * @param {string=} message Error message to be displayed in the dialog
     */
    function _showErrorsAndOpenKeyMap(err, message) {
        // Asynchronously loading Dialogs module to avoid the circular dependency
        require(["widgets/Dialogs"], function (Dialogs) {
            var errorMessage = Strings.ERROR_KEYMAP_CORRUPT;

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

    /**
     * @private
     *
     * Checks whether the given command ID is a special command that the user can't bind
     * to another shortcut.
     * @param {!string} commandID A string referring to a specific command
     * @return {boolean} true if normalizedKey is a special command, false otherwise.
     */
    function _isSpecialCommand(commandID) {
        if (brackets.platform === "mac" && commandID === "file.quit") {
            return true;
        }

        return (_specialCommands.indexOf(commandID) > -1);
    }

    /**
     * @private
     *
     * Checks whether the given key combination is a shortcut of a special command
     * or a Mac system command that the user can't reassign to another command.
     * @param {!string} normalizedKey A key combination string used for a keyboard shortcut
     * @return {boolean} true if normalizedKey is a restricted shortcut, false otherwise.
     */
    function _isReservedShortcuts(normalizedKey) {
        if (!normalizedKey) {
            return false;
        }

        if (_reservedShortcuts.indexOf(normalizedKey) > -1 ||
                _reservedShortcuts.indexOf(normalizedKey.replace("Cmd", "Ctrl")) > -1) {
            return true;
        }

        if (brackets.platform === "mac" && _macReservedShortcuts.indexOf(normalizedKey) > -1) {
            return true;
        }

        return false;
    }

    /**
     * @private
     *
     * Creates a bullet list item for any item in the given list.
     * @param {Array.<string>} list An array of strings to be converted into a
     * message string with a bullet list.
     * @return {string} the html text version of the list
     */
    function _getBulletList(list) {
        var message = "<ul class='dialog-list'>";
        list.forEach(function (info) {
            message += "<li>" + info + "</li>";
        });
        message += "</ul>";
        return message;
    }

    /**
     * @private
     *
     * Gets the corresponding unicode symbol of an arrow key for display in the menu.
     * @param {string} key The non-modifier key used in the shortcut. It does not need to be normalized.
     * @return {string} An empty string if key is not one of those we want to show with the unicode symbol.
     *                  Otherwise, the corresponding unicode symbol is returned.
     */
    function _getDisplayKey(key) {
        var displayKey = "",
            match = key ? key.match(/(Up|Down|Left|Right|\-)$/i) : null;
        if (match && !/Page(Up|Down)/.test(key)) {
            displayKey = key.substr(0, match.index) + _displayKeyMap[match[0].toLowerCase()];
        }
        return displayKey;
    }

    /**
     * @private
     *
     * Applies each user key binding to all the affected commands and updates _keyMap.
     * Shows errors in a dialog and then opens the user key map file if any of the following
     * is detected while applying the user key bindings.
     *     - A key binding is attempting to modify a special command.
     *     - A key binding is attempting to assign a shortcut of a special command to another one.
     *     - Multiple key bindings are specified for the same command ID.
     *     - The same key combination is listed for multiple key bindings.
     *     - A key binding has any invalid key syntax.
     *     - A key binding is referring to a non-existent command ID.
     */
    function _applyUserKeyBindings() {
        var remappedCommands   = [],
            remappedKeys       = [],
            restrictedCommands = [],
            restrictedKeys     = [],
            invalidKeys        = [],
            invalidCommands    = [],
            multipleKeys       = [],
            duplicateBindings  = [],
            errorMessage       = "";

        _.forEach(_customKeyMap, function (commandID, key) {
            var normalizedKey    = normalizeKeyDescriptorString(key),
                existingBindings = _commandMap[commandID] || [];

            // Skip this since we don't allow user to update key binding of a special
            // command like cut, copy, paste, undo, redo and select all.
            if (_isSpecialCommand(commandID)) {
                restrictedCommands.push(commandID);
                return;
            }

            // Skip this since we don't allow user to update a shortcut used in
            // a special command or any Mac system command.
            if (_isReservedShortcuts(normalizedKey)) {
                restrictedKeys.push(key);
                return;
            }

            // Skip this if the key is invalid.
            if (!normalizedKey) {
                invalidKeys.push(key);
                return;
            }

            if (_isKeyAssigned(normalizedKey)) {
                if (remappedKeys.indexOf(normalizedKey) !== -1) {
                    // JSON parser already removed all the duplicates that have the exact
                    // same case or order in their keys. So we're only detecting duplicate
                    // bindings that have different orders or different cases used in the key.
                    duplicateBindings.push(key);
                    return;
                }
                // The same key binding already exists, so skip this.
                if (_keyMap[normalizedKey].commandID === commandID) {
                    // Still need to add it to the remappedCommands so that
                    // we can detect any duplicate later on.
                    remappedCommands.push(commandID);
                    return;
                }
                removeBinding(normalizedKey);
            }

            if (remappedKeys.indexOf(normalizedKey) === -1) {
                remappedKeys.push(normalizedKey);
            }

            // Remove another key binding if the new key binding is for a command
            // that has a different key binding. e.g. "Ctrl-W": "edit.selectLine"
            // requires us to remove "Ctrl-W" from "file.close" command, but we
            // also need to remove "Ctrl-L" from "edit.selectLine".
            if (existingBindings.length) {
                existingBindings.forEach(function (binding) {
                    removeBinding(binding.key);
                });
            }

            if (commandID) {
                if (_allCommands.indexOf(commandID) !== -1) {
                    if (remappedCommands.indexOf(commandID) === -1) {
                        var keybinding = { key: normalizedKey };

                        keybinding.displayKey = _getDisplayKey(normalizedKey);
                        _addBinding(commandID, keybinding.displayKey ? keybinding : normalizedKey, brackets.platform, true);
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
            errorMessage += StringUtils.format(Strings.ERROR_MULTIPLE_SHORTCUTS, _getBulletList(multipleKeys));
        }

        if (duplicateBindings.length) {
            errorMessage += StringUtils.format(Strings.ERROR_DUPLICATE_SHORTCUTS, _getBulletList(duplicateBindings));
        }

        if (invalidKeys.length) {
            errorMessage += StringUtils.format(Strings.ERROR_INVALID_SHORTCUTS, _getBulletList(invalidKeys));
        }

        if (invalidCommands.length) {
            errorMessage += StringUtils.format(Strings.ERROR_NONEXISTENT_COMMANDS, _getBulletList(invalidCommands));
        }

        if (_showErrors && errorMessage) {
            _showErrorsAndOpenKeyMap("", errorMessage);
        }
    }

    /**
     * @private
     *
     * Restores the default key bindings for all the commands that are modified by each key binding
     * specified in _customKeyMapCache (old version) but no longer specified in _customKeyMap (new version).
     */
    function _undoPriorUserKeyBindings() {
        _.forEach(_customKeyMapCache, function (commandID, key) {
            var normalizedKey  = normalizeKeyDescriptorString(key),
                defaults       = _.find(_.toArray(_defaultKeyMap), { "commandID": commandID }),
                defaultCommand = _defaultKeyMap[normalizedKey];

            // We didn't modified this before, so skip it.
            if (_isSpecialCommand(commandID) ||
                    _isReservedShortcuts(normalizedKey)) {
                return;
            }

            if (_isKeyAssigned(normalizedKey) &&
                    _customKeyMap[key] !== commandID && _customKeyMap[normalizedKey] !== commandID) {
                // Unassign the key from any command. e.g. "Cmd-W": "file.open" in _customKeyMapCache
                // will require us to remove Cmd-W shortcut from file.open command.
                removeBinding(normalizedKey);
            }

            // Reassign the default key binding. e.g. "Cmd-W": "file.open" in _customKeyMapCache
            // will require us to reassign Cmd-O shortcut to file.open command.
            if (defaults) {
                addBinding(commandID, defaults, brackets.platform);
            }

            // Reassign the default key binding of the previously modified command.
            // e.g. "Cmd-W": "file.open" in _customKeyMapCache will require us to reassign Cmd-W
            // shortcut to file.close command.
            if (defaultCommand && defaultCommand.key) {
                addBinding(defaultCommand.commandID, defaultCommand.key, brackets.platform);
            }
        });
    }

    /**
     * @private
     *
     * Gets the full file path to the user key map file. In testing environment
     * a different file path is returned so that running integration tests won't
     * pop up the error dialog showing the errors from the actual user key map file.
     *
     * @return {string} full file path to the user key map file.
     */
    function _getUserKeyMapFilePath() {
        if (window.isBracketsTestWindow) {
            return brackets.app.getApplicationSupportDirectory() + "/_test_/" + KEYMAP_FILENAME;
        }
        return _userKeyMapFilePath;
    }

    /**
     * @private
     *
     * Reads in the user key map file and parses its content into JSON.
     * Returns the user key bindings if JSON has "overrides".
     * Otherwise, returns an empty object or an error if the file
     * cannot be parsed or loaded.
     *
     * @return {$.Promise} a jQuery promise that will be resolved with the JSON
     * object if the user key map file has "overrides" property or an empty JSON.
     * If the key map file cannot be read or cannot be parsed by the JSON parser,
     * then the promise is rejected with an error.
     */
    function _readUserKeyMap() {
        var file   = FileSystem.getFileForPath(_getUserKeyMapFilePath()),
            result = new $.Deferred();

        file.exists(function (err, doesExist) {
            if (doesExist) {
                FileUtils.readAsText(file)
                    .done(function (text) {
                        var keyMap = {};
                        try {
                            if (text) {
                                var json = JSON.parse(text);
                                // If no overrides, return an empty key map.
                                result.resolve((json && json.overrides) || keyMap);
                            } else {
                                // The file is empty, so return an empty key map.
                                result.resolve(keyMap);
                            }
                        } catch (err) {
                            // Cannot parse the text read from the key map file.
                            result.reject(err);
                        }
                    })
                    .fail(function (err) {
                        // Key map file cannot be loaded.
                        result.reject(err);
                    });
            } else {
                // Just resolve if no user key map file
                result.resolve();
            }
        });
        return result.promise();
    }

    /**
     * @private
     *
     * Reads in the user key bindings and updates the key map with each user key
     * binding by removing the existing one assigned to each key and adding
     * new one for the specified command id. Shows errors and opens the user
     * key map file if it cannot be parsed.
     *
     * This function is wrapped with debounce so that its execution is always delayed
     * by 200 ms. The delay is required because when this function is called some
     * extensions may still be adding some commands and their key bindings asychronously.
     */
    _loadUserKeyMap = _.debounce(function () {
        _readUserKeyMap()
            .then(function (keyMap) {
                // Some extensions may add a new command without any key binding. So
                // we always have to get all commands again to ensure that we also have
                // those from any extensions installed during the current session.
                _allCommands = CommandManager.getAll();

                _customKeyMapCache = _.cloneDeep(_customKeyMap);
                _customKeyMap = keyMap;
                _undoPriorUserKeyBindings();
                _applyUserKeyBindings();
            }, function (err) {
                _showErrorsAndOpenKeyMap(err);
            });
    }, 200);

    /**
     * @private
     *
     * Opens the existing key map file or creates a new one with default content
     * if it does not exist.
     */
    function _openUserKeyMap() {
        var userKeyMapPath = _getUserKeyMapFilePath(),
            file = FileSystem.getFileForPath(userKeyMapPath);
        file.exists(function (err, doesExist) {
            if (doesExist) {
                CommandManager.execute(Commands.FILE_OPEN, { fullPath: userKeyMapPath });
            } else {
                var defaultContent = "{\n    \"documentation\": \"https://github.com/adobe/brackets/wiki/User-Key-Bindings\"," +
                                     "\n    \"overrides\": {" +
                                     "\n        \n    }\n}\n";

                FileUtils.writeText(file, defaultContent, true)
                    .done(function () {
                        CommandManager.execute(Commands.FILE_OPEN, { fullPath: userKeyMapPath });
                    });
            }
        });
    }

    // Due to circular dependencies, not safe to call on() directly
    EventDispatcher.on_duringInit(CommandManager, "commandRegistered", _handleCommandRegistered);
    CommandManager.register(Strings.CMD_OPEN_KEYMAP, Commands.FILE_OPEN_KEYMAP, _openUserKeyMap);

    // Asynchronously loading DocumentManager to avoid the circular dependency
    require(["document/DocumentManager"], function (DocumentManager) {
        DocumentManager.on("documentSaved", function checkKeyMapUpdates(e, doc) {
            if (doc && doc.file.fullPath === _userKeyMapFilePath) {
                _loadUserKeyMap();
            }
        });
    });

    /**
     * @private
     *
     * Initializes _allCommands array and _defaultKeyMap so that we can use them for
     * detecting non-existent commands and restoring the original key binding.
     */
    function _initCommandAndKeyMaps() {
        _allCommands = CommandManager.getAll();
        // Keep a copy of the default key bindings before loading user key bindings.
        _defaultKeyMap = _.cloneDeep(_keyMap);
    }

    /**
     * @private
     *
     * Sets the full file path to the user key map file. Only used by unit tests
     * to load a test file instead of the actual user key map file.
     *
     * @param {string} fullPath file path to the user key map file.
     */
    function _setUserKeyMapFilePath(fullPath) {
        _userKeyMapFilePath = fullPath;
    }

    AppInit.extensionsLoaded(function () {
        var params  = new UrlParams();
        params.parse();
        if (params.get("reloadWithoutUserExts") === "true") {
            _showErrors = false;
        }

        _initCommandAndKeyMaps();
        _loadUserKeyMap();
    });

    // unit test only
    exports._reset = _reset;
    exports._setUserKeyMapFilePath = _setUserKeyMapFilePath;
    exports._getDisplayKey = _getDisplayKey;
    exports._loadUserKeyMap = _loadUserKeyMap;
    exports._initCommandAndKeyMaps = _initCommandAndKeyMaps;
    exports._onCtrlUp = _onCtrlUp;

    // Define public API
    exports.getKeymap = getKeymap;
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
