/*
 * Copyright 2011 Adobe Systems Incorporated. All Rights Reserved.
 */

var KeyBindingManager = {
    /**
     * The map of all registered keymaps.
     */
    _keymaps: {},

    /**
     * The map of currently active keymaps. As new keymaps come into effect, they are pushed onto the end of
     * the array. Later keymaps take precedence over earlier ones.
     */
    _activeKeymaps: {},

    /**
     * The maximum possible keymap level.
     */
    _maxLevel: -1,

    /**
     * Registers the specified keymap based on its id.
     *
     * TODO: do Closure annotations support user-defined types?
     * @param {KeyMap} keymap The keymap to register.
     */
    registerKeymap: function(keymap) {
        KeyBindingManager._keymaps[keymap.id] = keymap;
        if (keymap.level > KeyBindingManager._maxLevel) {
            KeyBindingManager._maxLevel = keymap.level;
        }
    },

    /**
     * Activate the specified keymap. This installs it at the appropriate level, replacing any other keymap
     * at that level.
     *
     * TODO: does the Closure annotation syntax support user-created types?
     * @param {string} keymap The ID of the registered keymap to install.
     */
    activateKeymap: function(id) {
        var keymap = KeyBindingManager._keymaps[id];
        if (!keymap) {
            throw new Error("Keymap " + id + " not registered");
        }
    
        KeyBindingManager._activeKeymaps[keymap.level] = keymap;
    },

    /**
     * Deactivate the keymap with the given ID. If it's not already active, does nothing.
     *
     * @param {string} id The ID of the keymap to deactivate.
     */
    deactivateKeymap: function(id) {
        for (var i = 0; i < KeyBindingManager._maxLevel; i++) {
            if (KeyBindingManager._activeKeymaps[i] && KeyBindingManager._activeKeymaps[i].id === id) {
                delete KeyBindingManager._activeKeymaps[i];
            }
        }
    },

    /**
     * Process the keybinding for the current key.
     *
     * @param {string} A key-description string.
     * @return {boolean} true if the key was processed, false otherwise
     */
    handleKey: function(key) {
        for (var i = KeyBindingManager._maxLevel; i >= 0; i--) {
            var keymap = KeyBindingManager._activeKeymaps[i];
            if (keymap && keymap.map[key]) {
                CommandManager.execute(keymap.map[key]);
                return true;
            }
        }        
        return false;
    }
};

/** class Keymap
 *
 * A keymap specifies how keys are mapped to commands. The KeyBindingManager allows for a hierarchy of
 * keymaps, specified by a numeric level. It does not dictate the semantics of these levels, but in
 * practice, level 0 is a global keymap, level 1 is a file-type-specific keymap, and deeper levels can
 * be used for more specific contexts. When a new keymap is activated, it replaces any other keymap at
 * its same level.
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
 * @param {string} id A unique ID for this keymap.
 * @param {number} level The level of this keymap. Must be an integer >= 0.
 * @param {map} map An object mapping key-description strings to command IDs.
 */
var KeyMap = function(id, level, map) {
    if (id === undefined || level === undefined || map === undefined) {
        throw new Error("All parameters to the KeyMap constructor must be specified");
    }
    
    this.id = id;
    this.level = level;
    this.map = map;
};
