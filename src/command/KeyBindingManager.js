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
/*global define: false, $ */

/**
 * Manages the mapping of keyboard inputs to commands.
 */
define(function (require, exports, module) {
    'use strict';
    
    var CommandManager = require("command/CommandManager");
    
    /**
     * The currently installed keymap.
     */
    var _keymap = null;
    
    /**
     * Allow clients to toggle key binding
     */
    var _enabled = true;

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

    
    // Define public API
    exports.installKeymap = installKeymap;
    exports.getKeymap = getKeymap;
    exports.handleKey = handleKey;
    exports.setEnabled = setEnabled;
});
