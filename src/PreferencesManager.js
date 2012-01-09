/*
 * Copyright 2011 Adobe Systems Incorporated. All Rights Reserved.
 */

/**
 * PreferencesManager
 *
 */
define(function(require, exports, module) {
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
    function getPreferences( clientID ) {
        if ( ( clientID === undefined ) || ( clientID == null ) ) {
            throw new Error("Invalid clientID");
        }

        return prefStorage[ clientID ];
    }

    /**
     * Registers a save participant callback for a plugin. The callback is
     * fired when Brackets quits (window.unload). When fired, callbacks may
     * persist data (e.g. preferences or current state) as valid JSON values
     * to the storage argument.
     *
     * @param {string}   unique identifier clientID for this client
     * @param {function} callback function
     * @param {object}   optional "this" object for the callback
     * @param {object}   optional default preferences object for this client
     */
    function addPreferencesClient( clientID, callback, instance, defaults ) {
        if ( typeof callback !== "function" ) {
            throw new Error("Invalid arguments");
        }

        // attempt to load existing preferences
        var clientPrefs = getPreferences( clientID );

        // if clientPrefs is undefined, try defaults
        if ( ( clientPrefs === undefined ) && ( JSON.stringify( defaults ) ) ) {
            clientPrefs = defaults;
        }

        var callbackData = { clientID: clientID
                           , callback: callback
                           , instance: instance };

        // add to callbacks list
        callbacks.push( callbackData );

        // save in-memory and initialize persistent storage
        prefStorage[ clientID ] = clientPrefs;
        saveToPersistentStorage();
    }

    /**
     * Save all participants.
     */
    function savePreferences() {
        var max = callbacks.length
        ,   data
        ,   storage;

        // iterate over all save participants
        for( var i = 0; i < max; i++ ) {
            data = callbacks[i];
            storage = prefStorage[ data.clientID ];

            // fire callback with thisArg and preference storage
            try {
                data.callback.call( data.instance, storage );
            }
            catch ( e ) {
                console.log( "PersistenceManager.save(): Failed to save data for plugin " + data.plugin.getPluginId() );
            }

            // save plugin preferences
            prefStorage[ data.clientID ] = storage;
        }

        saveToPersistentStorage();
    }

    function saveToPersistentStorage() {
        // save all preferences
        persistentStorage.setItem( PREFERENCES_KEY, JSON.stringify( prefStorage ) );
    }

    // Public API
    exports.getPreferences          = getPreferences;
    exports.addPreferencesClient    = addPreferencesClient;
    exports.savePreferences         = savePreferences;
});