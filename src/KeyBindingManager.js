/*
 * Copyright 2011 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false */

define(function (require, exports, module) {
    'use strict';
    
    var CommandManager = require("CommandManager");

    // TODO: Move KeyMap into separate module
    
    /**
     * Manages the mapping of keyboard inputs to commands.
     */
    var KeyBindingManager = {
        /**
         * The currently installed keymap.
         */
        _keymap: null,

        /**
         * Install the specified keymap as the current keymap, overwriting the existing keymap.
         *
         * @param {KeyMap} keymap The keymap to install.
         */
        installKeymap: function (keymap) {
            this._keymap = keymap;
        },

        /**
         * Process the keybinding for the current key.
         *
         * @param {string} A key-description string.
         * @return {boolean} true if the key was processed, false otherwise
         */
        handleKey: function (key) {
            if (this._keymap && this._keymap.map[key]) {
                CommandManager.execute(this._keymap.map[key]);
                return true;
            }
            return false;
        }
    };

    /** class Keymap
     *
     * A keymap specifies how keys are mapped to commands. This currently just holds the map, but in future
     * it will likely be extended to include other metadata about the keymap.
     *
     * Keys are described by strings of the form "[modifier-modifier-...-]key", where modifier is one of
     * Ctrl, Alt, or Shift. If multiple modifiers are specified, they must be specified in that order
     * (i.e. "Ctrl-Alt-Shift-P" is legal, "Alt-Ctrl-Shift-P" is not). 
     * (TODO: the above restriction is to simplify mapping--is it too onerous?)
     *    -- Ctrl maps to Cmd on Mac. (This means that you can't specifically bind to the Ctrl key on Mac.)
     *    -- Alt maps to the Option key on Mac.
     *    -- Letters must be uppercase, but do not require Shift by default. To indicate that Shift must be held
     *       down, you must specifically include Shift.
     *
     * @constructor
     * @param {map} map An object mapping key-description strings to command IDs.
     */
    var KeyMap = function (map) {
        if (map === undefined) {
            throw new Error("All parameters to the KeyMap constructor must be specified");
        }
        this.map = map;
    };
    
    // Define public API
    // TODO: Once KeyMap is moved into separate module, export KeyBindingManager methods instead of the entire object
    exports.KeyBindingManager = KeyBindingManager;
    exports.KeyMap = KeyMap;
});
