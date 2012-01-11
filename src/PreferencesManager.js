/*
 * Copyright 2012 Adobe Systems Incorporated. All Rights Reserved.
 */

/**
 * PreferencesManager
 *
 */
define(function(require, exports, module) {
    var PREFERENCES_KEY = "com.adobe.brackets.preferences";

    var callbacks           = {}
    ,   persistentStorage;

    // TODO (jasonsj): interface for different storage (localStorage vs. hosted)
    _setStorage( localStorage );

    /**
     * Retrieves preference object for the specified client.
     *
     * @param {string}  unique identifier clientID
     * @return {object} preference
     */
    function getPreferences( clientID ) {
        if ( ( clientID === undefined ) || ( clientID == null ) ) {
            throw new Error("Invalid clientID");
        }

        return prefStorage[ clientID ];
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
            storage = prefStorage[ data.clientID ];

            // fire callback with thisArg and preference storage
            try {
                data.callback.call( data.instance, storage );
            }
            catch ( e ) {
                console.log( "PreferenceManager.savePreferences(): Failed to save data for clientID " + data.clientID );
            }

            // save client preferences
            prefStorage[ data.clientID ] = storage;
        });

        saveToPersistentStorage();
    }

    /**
     * Saves to persistent storage.
     * TODO (jasonsj): local and/or hosted
     */
    function saveToPersistentStorage() {
        // save all preferences
        persistentStorage.setItem( PREFERENCES_KEY, JSON.stringify( prefStorage ) );
    }

    /**
     * @private
     * Initialize persistent storage implementation. Also used for unit tests.
     * TODO (jasonsj): expose for other persistent storage implementations.
     */
    function _setStorage( storage ) {
        persistentStorage   = storage;
        prefStorage         = JSON.parse( persistentStorage.getItem( PREFERENCES_KEY ) );

        if ( !prefStorage ) {
            // initialize empty preferences
            prefStorage = {};
            persistentStorage.setItem( PREFERENCES_KEY, JSON.stringify( prefStorage ) );
        }
    }

    /**
     * @private
     * Accessor to persistent storage implementation.
     */
    function _getStorage( storage ) {
        return persistentStorage;
    }

    // Public API
    exports.getPreferences          = getPreferences;
    exports.addPreferencesClient    = addPreferencesClient;
    exports.savePreferences         = savePreferences;

    // Internal Use Only
    exports._getStorage              = _getStorage;
    exports._setStorage              = _setStorage;
    exports._PREFERENCES_KEY         = PREFERENCES_KEY;
});