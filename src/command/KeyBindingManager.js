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
/*global define, $, brackets */

/**
 * Manages the mapping of keyboard inputs to commands.
 */
define(function (require, exports, module) {
    'use strict';

    var CommandManager = require("command/CommandManager"),
        KeyMap = require("command/KeyMap");

    /**
     * The currently installed keymap.
     * @type {KeyMap}
     */
    var _keymap = null;

    /**
     * Allow clients to toggle key binding
     */
    var _enabled = true;

    /**
     * @private
     * Initialize an empty keymap as the current keymap. It overwrites the current keymap if there is one.
     */
    function _initializeKeymap() {
        _keymap = KeyMap.create({ "bindings": [], "platform": brackets.platform });
    }

    /**
     * @private
     * @param {string} A normalized key-description string.
     * @return {boolean} true if the key is already assigned, false otherwise.
     */
    function _isKeyAssigned(key) {
        return (_keymap && _keymap.map.hasOwnProperty(key));
    }

    /**
     * @private
     *
     * @param {string} commandID
     * @param {string} key - a single shortcut.
     * @param {?string} platform - undefined indicates all platofmrs
     */
    function _addBinding(commandID, key, platform) {
        if (!commandID || !key || (platform && platform !== brackets.platform)) {
            return;
        }

        var normalizedKey = KeyMap.normalizeKeyDescriptorString(key);
        if (!normalizedKey) {
            console.log("Fail to nomalize " + key);
        } else if (_isKeyAssigned(normalizedKey)) {
            console.log("Cannot assign " + normalizedKey + " to " + commandID +
                        ". It is already assigned to " + _keymap.map[normalizedKey]);
        } else {
            _keymap.map[normalizedKey] = commandID;
        }
    }

       
    /**
     * Install the specified keymap as the current keymap, overwriting the existing keymap.
     *
     * @param {KeyMap} keymap The keymap to install.
     */
    function installKeymap(keymap) {
        _keymap = keymap;
    }

    /**
     * Returns a copy of the keymap
     * @returns {KeyMap}
     */
    function getKeymap() {
        return $.extend({}, _keymap.map);
    }

    /**
     * Process the keybinding for the current key.
     *
     * @param {string} A key-description string.
     * @return {boolean} true if the key was processed, false otherwise
     */
    function handleKey(key) {
        if (_enabled && _keymap && _keymap.map[key]) {
            CommandManager.execute(_keymap.map[key]);
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
     *
     * @param {string} commandID
     * @param {?(string | Array.<{key: string, platform: string)}>}  keyBindings - a single key binding
     *      or an array of keybindings. Example: "Shift-Cmd-F". Mac and Win key equivalents are automatically
     *      mapped to each other.
     * @param {?string} platform - the target OS of the keyBindings. If undefined, all platforms will use
     *      the key binding.
     */
    function addBinding(commandID, keyBindings, platform) {
        if (!_keymap) { _initializeKeymap(); }

        if ($.isArray(keyBindings)) {
            var i, key, targetPlatform;
            for (i = 0; i < keyBindings.length; i++) {
                if (keyBindings[i].key !== undefined) {
                    key = keyBindings[i].key;
                    targetPlatform = keyBindings[i].platform;
                } else {
                    key = keyBindings[i];
                }
                
                _addBinding(commandID, key, targetPlatform);
            }
        } else {
            _addBinding(commandID, keyBindings, platform);
        }
    }

    /**
     * Remove a key binding from _keymap
     *
     * @param {string} key - a key-description string that may or may not be normalized.
     * @param {string} platform - the intended OS of the key.
     */
    function removeBinding(key, platform) {
        if (!key || !_keymap || (platform && platform !== brackets.platform)) {
            return;
        }

        var normalizedKey = KeyMap.normalizeKeyDescriptorString(key);
        if (!normalizedKey) {
            console.log("Fail to nomalize " + key);
        } else if (_isKeyAssigned(normalizedKey)) {
            delete _keymap.map[normalizedKey];
        }
    }

    // Define public API
    exports.installKeymap = installKeymap;
    exports.getKeymap = getKeymap;
    exports.handleKey = handleKey;
    exports.setEnabled = setEnabled;
    exports.addBinding = addBinding;
    exports.removeBinding = removeBinding;
});
