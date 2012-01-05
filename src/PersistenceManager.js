/*
 * Copyright 2011 Adobe Systems Incorporated. All Rights Reserved.
 */

/**
 * PersistenceManager
 */
 var PersistenceManager = (function() { // TODO (jasonsj): remove
//define(function(require, exports, module) {
    var exports = {}; // TODO (jasonsj): remove
    var callbacks = [];

    /**
     * Registers a save participant callback

     * @param {function} callback function
     * @param {object}   callback object
     */
    function addSaveParticipant( callback, callbackObject ) {
        if ( ( !callback || !callbackObject ) ||
             ( typeof callback !== "function" ) ||
             ( typeof callbackObject !== "object" ) ) {
            throw new Error("Invalid arguments");
        }

        var data = { callback: callback, callbackObject: callbackObject };
        callbacks.push( data );
    }

    /**
     * Save all participants
     */
    function save() {
        var max = callbacks.length
        ,   data;

        for( var i = 0; i < max; i++ ) {
            data = callbacks[i];
            data.callback.call( data.callbackObject );
        }
    }

    exports.addSaveParticipant = addSaveParticipant;
    exports.save = save;

    return exports; // TODO (jasonsj): remove
//});
})();