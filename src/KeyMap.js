/*
 * Copyright 2012 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false */

define(function (require, exports, module) {
    'use strict';
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
    exports.KeyMap = KeyMap;
});
