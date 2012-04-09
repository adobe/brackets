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
    
    var PreferencesManager = require("preferences/PreferencesManager");
    
    function PreferenceStorage(clientID, json) {
        this._clientID = clientID;
        this._json = json;
    }
    
    PreferenceStorage.prototype.getClientID = function () {
        return this._clientID;
    };
    
    PreferenceStorage.prototype.remove = function (name) {
        // remove value from JSON storage
        this._json[name] = undefined;
    };
    
    PreferenceStorage.prototype.set = function (name, value) {
        // set value to JSON storage
        this._json[name] = value;
        
        // erase property if invalid JSON
        if (!JSON.stringify(this._json)) {
            this._json[name] = undefined;
        }
        
        this._save();
    };
    
    PreferenceStorage.prototype.get = function (name) {
        return this._json[name];
    };
    
    PreferenceStorage.prototype.writeJSON = function (obj, append) {
        var self = this;
        
        append = (append !== undefined) ? append : true;
        
        if (!append) {
            // append properties to the existing preferences
            $.each(this._json, function (propName, value) {
                self.set(propName, value);
            });
        } else if (!JSON.stringify(obj)) {
            // clobber the existing preferences
            this._json = obj;
        }
        
        this._save();
    };
    
    PreferenceStorage.prototype.getJSON = function () {
        return JSON.parse(JSON.stringify(this._json));
    };
    
    PreferenceStorage.prototype._save = function () {
        PreferencesManager.savePreferenceData(this);
    };
    
    exports.PreferenceStorage = PreferenceStorage;
});