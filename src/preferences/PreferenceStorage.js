/*
 * Copyright 2012 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, $: false */

/**
 * PreferencesData
 *
 */
define(function (require, exports, module) {
    'use strict';
    
    function PreferenceStorage(clientID, json) {
        this._clientID = clientID;
        this._json = json;
    }
    
    PreferenceStorage.prototype.getClientID = function () {
        return this._clientID;
    };
    
    PreferenceStorage.prototype.remove = function (name) {
        // remove value from JSON storage
        delete this._json[name];
    };
    
    PreferenceStorage.prototype.setValue = function (name, value) {
        // validate temporary JSON
        var temp = {};
        temp[name] = value;
        
        if (JSON.stringify(temp)) {
            // set value to JSON storage
            this._json[name] = value;
        }
    };
    
    PreferenceStorage.prototype.getValue = function (name) {
        return this._json[name];
    };
    
    PreferenceStorage.prototype.toJSON = function () {
        return JSON.parse(JSON.stringify(this._json));
    };
    
    PreferenceStorage.prototype.writeJSON = function (obj, append) {
        var self = this;
        
        append = (append !== undefined) ? append : true;
        
        // delete all exiting properties if not appending
        if (!append) {
            $.each(this._json, function (propName, value) {
                delete this._json[propName];
            });
        }
        
        // copy properties from incoming JSON object
        $.each(obj, function (propName, value) {
            self.setValue(propName, value);
        });
    };
    
    exports.PreferenceStorage = PreferenceStorage;
});