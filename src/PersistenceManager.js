/*
 * Copyright 2011 Adobe Systems Incorporated. All Rights Reserved.
 */

/**
 * PersistenceManager
 *
 */
define(function(require, exports, module) {
    var exports = {}; // TODO (jasonsj): remove
    var callbacks = [];

    var PREFERENCES_KEY = "com.adobe.brackets.preferences";

    // TODO (jasonsj): interface for different storage (localStorage vs. hosted)
    var persistentStorage = localStorage;
    var prefStorage = JSON.parse( persistentStorage.getItem( PREFERENCES_KEY ) );

    if ( !prefStorage ) {
        // initialize empty preferences
        prefStorage = {};
        persistentStorage.setItem( PREFERENCES_KEY, JSON.stringify( prefStorage ) );
    }

    /**
     * Retrieves preference object for the specified plugin.
     *
     * @param {Plugin} plugin
     * @return {object} preference
     */
    function getPluginPreferences( plugin ) {
        if ( ( !plugin || !plugin.getPluginId ) ) {
            throw new Error("Invalid plugin");
        }

        var pluginPrefs = prefStorage[ plugin.getPluginId() ];

        if ( !pluginPrefs ) {
            // create empty preferences
            pluginPrefs = {};

            if ( plugin.getDefaultPreferences ) {
                // use the plugin's default preferences
                var defaults = plugin.getDefaultPreferences();

                // validate JSON object
                if ( JSON.stringify( defaults ) ) {
                    pluginPrefs = defaults;
                }
            }

            // save in-memory and initialize persistent storage
            prefStorage[ plugin.getPluginId() ] = pluginPrefs;
            saveToPersistentStorage();
        }

        return pluginPrefs;
    }

    /**
     * Registers a save participant callback for a plugin. The callback is
     * fired when Brackets quits (window.unload). When fired, callbacks may
     * persist data (e.g. preferences or current state) as valid JSON values
     * to the storage argument.
     *
     * @param {function} callback function
     * @param {object}   callback object
     */
    function addSaveParticipant( plugin, callback, callbackObject ) {
        if ( typeof callback !== "function" ) {
            throw new Error("Invalid arguments");
        }

        var callbackData = { plugin: plugin
                           , callback: callback
                           , callbackObject: callbackObject
                           , storage: getPluginPreferences( plugin ) };

        callbacks.push( callbackData );
    }

    /**
     * Save all participants
     */
    function save() {
        var max = callbacks.length
        ,   data;

        // iterate over all save participants
        for( var i = 0; i < max; i++ ) {
            data = callbacks[i];

            var callbackObject = data.callbackObject;

            // use the Plugin for thisArg if a callbackObject wasn't specified
            if ( callbackObject === undefined )
                callbackObject = data.plugin;

            // fire callback with thisArg and preference storage
            try {
                data.callback.call( callbackObject, data.storage );
            }
            catch ( e ) {
                console.log( "PersistenceManager.save(): Failed to save data for plugin " + data.plugin.getPluginId() );
            }

            // save plugin preferences
            prefStorage[ data.plugin.getPluginId() ] = data.storage;
        }

        saveToPersistentStorage();
    }

    function saveToPersistentStorage() {
        // save all preferences
        persistentStorage.setItem( PREFERENCES_KEY, JSON.stringify( prefStorage ) );
    }

    exports.getPluginPreferences = getPluginPreferences;
    exports.addSaveParticipant = addSaveParticipant;
    exports.save = save;

    return exports; // TODO (jasonsj): remove
});