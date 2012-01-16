/*
 * Copyright 2012 Adobe Systems Incorporated. All Rights Reserved.
 */

/**
 * PreferencesManager
 *
 */
define(function(require, exports, module) {
    var PREFERENCES_KEY = "com.adobe.brackets.preferences";

    // Private Properties
    var preferencesKey      = PREFERENCES_KEY
    ,   callbacks           = {}
    ,   prefStorage
    ,   persistentStorage;

    // Use localStorage by default
    _initStorage( localStorage );

    /**
     * Retrieves a copy of the client's preferences object.
     *
     * @param {string}  unique identifier clientID
     * @return {object} preference
     */
    function getPreferences( clientID ) {
        if ( ( clientID === undefined ) || ( clientID == null ) ) {
            throw new Error("Invalid clientID");
        }

        var prefs = prefStorage[ clientID ];

        if ( prefs === undefined )
            return undefined;

        // create a deep copy to return to the client
        return JSON.parse( JSON.stringify( prefs ) );
    }

    /**
     * Registers a save participant callback for a client. The callback is
     * fired when Brackets quits (window.unload). When fired, callbacks may
     * persist data (e.g. preferences or current state) as valid JSON values
     * to the storage argument.
     *
     * @param {string}          unique identifier clientID for this client
     * @param {function(...)}   callback function
     * @param {object}          optional "this" object for the callback
     * @param {object}          optional default preferences object for this client
     */
    function addPreferencesClient( clientID, callback, instance, defaults ) {
        if ( typeof callback !== "function" ) {
            throw new Error("Invalid arguments");
        }

        // attempt to load existing preferences
        var clientPrefs = getPreferences( clientID );

        // if clientPrefs is undefined, try defaults
        if ( clientPrefs === undefined ) {
            if ( JSON.stringify( defaults ) ) {
                // use defaults if it is a valid JSON object
                clientPrefs = defaults;
            }
            else {
                // use empty defaults if JSON validation fails
                clientPrefs = {};
            }

            // save defaults in-memory, storage
            prefStorage[ clientID ] = clientPrefs;
            saveToPersistentStorage();
        }

        var callbackData = { clientID: clientID
                           , callback: callback
                           , instance: instance };

        // add to callbacks list
        callbacks[ clientID ] = callbackData;
    }

    /**
     * Save all participants.
     */
    function savePreferences() {
        var data
        ,   storage;

        // iterate over all preference clients
        $.each( callbacks, function( index, value ) {
            data = callbacks[ index ];
            storage = getPreferences( data.clientID );

            // fire callback with thisArg and preference storage
            try {
                data.callback.call( data.instance, storage );
            }
            catch ( e ) {
                console.log( "PreferenceManager.savePreferences(): Failed to save data for clientID " + data.clientID );
            }

            // only save preferences that can be serialized with JSON
            if ( JSON.stringify( storage )) {
                prefStorage[ data.clientID ] = storage;
            }
        });

        saveToPersistentStorage();
    }

    /**
     * Saves to persistent storage.
     * TODO (jasonsj): local and/or hosted
     */
    function saveToPersistentStorage() {
        // save all preferences
        persistentStorage.setItem( preferencesKey, JSON.stringify( prefStorage ) );
    }

    /**
     * @private
     * Redirects preference storage to another key in persistent storage. 
     * Allows unit test preferences to be stored in the same mechanism as
     * production preferences without clobbering.
     * 
     * @return {string} Previous key
     */
    function _setStorageKey( key ) {
        var oldKey = preferencesKey;

        preferencesKey = key;

        // re-init in-memory prefs when changing keys
        _initStorage( persistentStorage );

        return oldKey;
    }

    /**
     * @private
     * Initialize persistent storage implementation
     */
    function _initStorage( storage ) {
        persistentStorage = storage;
        prefStorage = JSON.parse( persistentStorage.getItem( preferencesKey ) );

        // initialize empty preferences if none were found in storage
        if ( !prefStorage ) {
            _reset();
        }
    }

    /**
     * @private
     * Reset preferences and callbacks
     */
    function _reset() {
        callbacks = {};
        prefStorage = {};

        // Note that storage.clear() is not used. Production and unit test code
        // both rely on the same backing storage but unique item keys.
        persistentStorage.setItem( preferencesKey, JSON.stringify( prefStorage ) );
    }

    // Public API
    exports.getPreferences          = getPreferences;
    exports.addPreferencesClient    = addPreferencesClient;
    exports.savePreferences         = savePreferences;

    // Internal Use Only
    exports._reset                  = _reset;
    exports._setStorageKey          = _setStorageKey;
    exports._PREFERENCES_KEY        = PREFERENCES_KEY;
});