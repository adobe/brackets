/*
 * Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
 *  
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"), 
 * to deal in the Software without restriction, including without limitation 
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, 
 * and/or sell copies of the Software, and to permit persons to whom the 
 * Software is furnished to do so, subject to the following conditions:
 *  
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *  
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING 
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
 * DEALINGS IN THE SOFTWARE.
 * 
 */


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $, localStorage, brackets */
/*unittests: Preferences Base */

/**
 * Base infrastructure for managing preferences.
 *
 */
define(function (require, exports, module) {
    "use strict";
    
    var FileUtils         = require("file/FileUtils"),
        NativeFileSystem  = require("file/NativeFileSystem").NativeFileSystem,
        ExtensionLoader   = require("utils/ExtensionLoader"),
        CollectionUtils   = require("utils/CollectionUtils"),
        Async             = require("utils/Async");

    function MemoryStorage(data) {
        this.data = data || {};
    }
    
    MemoryStorage.prototype = {
        load: function () {
            var result = $.Deferred();
            result.resolve(this.data);
            return result.promise();
        },
        
        save: function (newData) {
            var result = $.Deferred();
            this.data = newData;
            result.resolve();
            return result.promise();
        }
    };
    
    function FileStorage(path, createIfNew) {
        this.path = path;
        this.createIfNew = createIfNew;
    }
    
    function ParsingError(message) {
        this.name = "ParsingError";
        this.message = message || "";
    }
    
    ParsingError.prototype = Error.prototype;
    
    FileStorage.prototype = {
        load: function () {
            var result = $.Deferred();
            var path = this.path;
            var createIfNew = this.createIfNew;
            
            brackets.fs.readFile(path, NativeFileSystem._FSEncodings.UTF8, function (err, text) {
                if (err) {
                    if (createIfNew) {
                        result.resolve({});
                    } else {
                        result.reject(new Error("Unable to load prefs at " + path + " " + err));
                    }
                    return;
                }
                try {
                    result.resolve(JSON.parse(text));
                } catch (e) {
                    result.reject(new ParsingError("Invalid JSON settings at " + path + "(" + e.toString() + ")"));
                }
            });
            
            return result.promise();
        },
        
        save: function (newData) {
            var result = $.Deferred();
            var path = this.path;
            try {
                brackets.fs.writeFile(path, JSON.stringify(newData, null, 4), NativeFileSystem._FSEncodings.UTF8, function (err) {
                    if (err) {
                        result.reject("Unable to save prefs at " + path + " " + err);
                    } else {
                        result.resolve();
                    }
                });
            } catch (e) {
                result.reject("Unable to convert prefs to JSON" + e.toString());
            }
            return result.promise();
        }
    };
    
    function Scope(storage) {
        this.storage = storage;
        this.data = undefined;
        this._dirty = false;
    }
    
    Scope.prototype = {
        load: function () {
            var result = $.Deferred();
            this.storage.load()
                .then(function (data) {
                    this.data = data;
                    result.resolve();
                }.bind(this))
                .fail(function (error) {
                    result.reject(error);
                });
            return result.promise();
        },
        
        save: function () {
            if (this._dirty) {
                return this.storage.save(this.data);
            } else {
                return $.Deferred().resolve().promise();
            }
        },
        
        setValue: function (id, value) {
            this._dirty = true;
            this.data[id] = value;
        },
        
        getValue: function (id, layers) {
            var layerCounter;
            for (layerCounter = 0; layerCounter < layers.length; layerCounter++) {
                var result = layers[layerCounter](this.data, id);
                if (result !== undefined) {
                    return result;
                }
            }
            return this.data[id];
        }
    };
    
    function LanguageLayer() {
    }
    
    LanguageLayer.prototype = {
        setLanguage: function (languageID) {
            this.language = languageID;
        },
        
        getValue: function (data, id) {
            if (data.language && data.language[this.language]) {
                return data.language[this.language][id];
            }
        }
    };
    
    function PreferencesManager() {
        this._knownPrefs = {};
        this._scopes = {
            "default": new Scope(new MemoryStorage())
        };
        
        // Memory-based scope loads synchronously
        this._scopes["default"].load();
        this._scopeOrder = ["default"];
        this._pendingScopes = {};
        
        
        this._layers = {};
        this._layerGetters = [];
    }
    
    PreferencesManager.prototype = {
        definePreference: function (id, type, initial, options) {
            options = options || {};
            if (this._knownPrefs.hasOwnProperty(id)) {
                throw new Error("Preference " + id + " was redefined");
            }
            this._knownPrefs[id] = {
                type: type,
                initial: initial,
                name: options.name,
                description: options.description
            };
            this.setValue("default", id, initial);
        },
        
        addToScopeOrder: function (id, addBefore) {
            if (!addBefore) {
                this._scopeOrder.unshift(id);
            } else {
                var addIndex = this._scopeOrder.indexOf(addBefore);
                if (addIndex > -1) {
                    this._scopeOrder.splice(addIndex, 0, id);
                } else {
                    var queue = this._pendingScopes[addBefore];
                    if (!queue) {
                        queue = [];
                        this._pendingScopes[addBefore] = queue;
                    }
                    queue.unshift(id);
                }
            }
            if (this._pendingScopes[id]) {
                var pending = this._pendingScopes[id];
                delete this._pendingScopes[id];
                pending.forEach(function (scopeID) {
                    this.addToScopeOrder(scopeID, id);
                }.bind(this));
            }
        },
        
        addScope: function (id, scope, addBefore) {
            if (this._scopes[id]) {
                throw new Error("Attempt to redefine preferences scope: " + id);
            }
            
            // Check to see if "scope" might be a Storage instead
            if (!scope.getValue) {
                scope = new Scope(scope);
            }
            
            var deferred = $.Deferred();
            
            scope.load()
                .then(function () {
                    this._scopes[id] = scope;
                    this.addToScopeOrder(id, addBefore);
                    deferred.resolve(id, scope);
                }.bind(this))
                .fail(function (err) {
                    // With preferences, it is valid for there to be no file.
                    // It is not valid to have an unparseable file.
                    if (err instanceof ParsingError) {
                        console.error(err);
                    }
                });
            
            return deferred.promise();
        },
        
        removeScope: function (id) {
            delete this._scopes[id];
            var scopeIndex = this._scopeOrder.indexOf(id);
            if (scopeIndex > -1) {
                this._scopeOrder.splice(scopeIndex, 1);
            }
        },
        
        addLayer: function (id, layer) {
            if (this._layers[id]) {
                throw new Error("Attempt to redefine preferences layer: " + id);
            }
            this._layers[id] = layer;
            this._layerGetters.push(layer.getValue.bind(layer));
        },
        
        setValue: function (scopeName, id, value) {
            var scope = this._scopes[scopeName];
            if (!scope) {
                throw new Error("Attempt to set preference in non-existent scope: " + scopeName);
            }
            
            scope.setValue(id, value);
        },
        
        getValue: function (id, value) {
            var scopeCounter,
                scopeOrder = this._scopeOrder,
                layerGetters = this._layerGetters;
            
            for (scopeCounter = 0; scopeCounter < scopeOrder.length; scopeCounter++) {
                var scope = this._scopes[scopeOrder[scopeCounter]];
                var result = scope.getValue(id, layerGetters);
                if (result !== undefined) {
                    return result;
                }
            }
        },
        
        save: function () {
            return Async.doInParallel(this._scopeOrder, function (id) {
                var scope = this._scopes[id];
                return scope.save();
            }.bind(this));
        }
    };
    
    exports.PreferencesManager = PreferencesManager;
    exports.Scope = Scope;
    exports.MemoryStorage = MemoryStorage;
    exports.LanguageLayer = LanguageLayer;
    exports.FileStorage = FileStorage;
});