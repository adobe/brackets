/*
 * Copyright 2011 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false */

/**
 * Manages the mapping of keyboard inputs to commands.
 */
define(function (require, exports, module) {
    'use strict';
    
    var CommandManager = require("CommandManager");
    
    /**
     * The currently installed keymap.
     */
    var _keymap = null;

    /**
     * Install the specified keymap as the current keymap, overwriting the existing keymap.
     *
     * @param {KeyMap} keymap The keymap to install.
     */
    function installKeymap(keymap) {
        _keymap = keymap;
    }

    /**
     * Process the keybinding for the current key.
     *
     * @param {string} A key-description string.
     * @return {boolean} true if the key was processed, false otherwise
     */
    function handleKey(key) {
        if (_keymap && _keymap.map[key]) {
            CommandManager.execute(_keymap.map[key]);
            return true;
        }
        return false;
    }

    
    // Define public API
    exports.installKeymap = installKeymap;
    exports.handleKey = handleKey;
});
