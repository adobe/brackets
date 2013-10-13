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
        _                 = require("lodash"),
        Async             = require("utils/Async"),
        globmatch         = require("thirdparty/globmatch");
    
    var PREFERENCE_CHANGE = "preferenceChange";
    
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
        },
        
        getKeys: function (layers) {
            var data = this.data,
                keys = _.keys(data);
            
            layers.forEach(function (layer) {
                keys = layer(data, keys);
            });
            return keys;
        }
    };
    
    function LanguageLayer() {
    }
    
    LanguageLayer.prototype = {
        setLanguage: function (languageID) {
            $(this).trigger("beforeLayerChange");
            this.language = languageID;
            $(this).trigger("afterLayerChange");
        },
        
        getValue: function (data, id) {
            var language = this.language;
            if (data.language && data.language[language]) {
                return data.language[language][id];
            }
        },
        
        getKeys: function (data, currentKeyList) {
            var language = this.language;
            currentKeyList = _.without(currentKeyList, "language");
            if (data.language && data.language[language]) {
                var languageKeys = Object.keys(data.language[language]);
                return _.union(currentKeyList, languageKeys);
            }
            return currentKeyList;
        }
    };
    
    function PathLayer() {
    }
    
    PathLayer.prototype = {
        setFilename: function (filename) {
            $(this).trigger("beforeLayerChange");
            this.filename = filename;
            $(this).trigger("afterLayerChange");
        },
        
        _findMatchingGlob: function (path) {
            var globs = Object.keys(path),
                filename = this.filename,
                globCounter;
            
            if (!filename) {
                return undefined;
            }
            
            for (globCounter = 0; globCounter < globs.length; globCounter++) {
                var glob = globs[globCounter];
                
                if (globmatch(filename, glob)) {
                    return glob;
                }
            }
        },
        
        getValue: function (data, id) {
            var path = data.path;
            if (path) {
                var glob = this._findMatchingGlob(path);
                if (glob) {
                    if (path[glob][id]) {
                        return path[glob][id];
                    } else {
                        return undefined;
                    }
                }
            }
            return undefined;
        },
        
        getKeys: function (data, currentKeyList) {
            var path = data.path;
            currentKeyList = _.without(currentKeyList, "path");
            if (path) {
                var glob = this._findMatchingGlob(data.path);
                if (glob) {
                    var pathKeys = Object.keys(data.path[glob]);
                    return _.union(currentKeyList, pathKeys);
                }
            }
            return currentKeyList;
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
        this._layerKeys = [];
        
        this._saveInProgress = false;
        this._nextSaveDeferred = null;
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
                    this._inspectChangesAndFire(function () {
                        this._scopes[id] = scope;
                        this.addToScopeOrder(id, addBefore);
                    }.bind(this));
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
            this._inspectChangesAndFire(function () {
                delete this._scopes[id];
                var scopeIndex = this._scopeOrder.indexOf(id);
                if (scopeIndex > -1) {
                    this._scopeOrder.splice(scopeIndex, 1);
                }
            }.bind(this));
        },
        
        _getAllKeysAndPrefs: function (extraKeys) {
            var layerKeys = this._layerKeys;
            
            var keys = _.map(this._scopes, function (scope) {
                return scope.getKeys(layerKeys);
            });
            
            keys = _.union.apply(null, keys);
            if (extraKeys) {
                keys = _.union(keys, extraKeys);
            }
            
            var prefs = _.object(keys, _.map(keys, function (key) {
                return this.getValue(key);
            }.bind(this)));
            
            return {
                keys: keys,
                prefs: prefs
            };
        },
        
        _inspectChangesAndFire: function (operation) {
            var before = this._getAllKeysAndPrefs();
            
            operation();
            
            var after = this._getAllKeysAndPrefs(before.keys);
            
            this._fireChanges(before, after);
        },
        
        _fireChanges: function (before, after) {
            var differentProps = _.map(after.keys, function (key) {
                var beforeValue = before.prefs[key],
                    afterValue = after.prefs[key];
                    
                if (afterValue !== beforeValue) {
                    return {
                        id: key,
                        oldValue: beforeValue,
                        newValue: afterValue
                    };
                }
                return undefined;
            });
            
            var self = $(this);
            differentProps.forEach(function (data) {
                if (data !== undefined) {
                    self.trigger("preferenceChange", data);
                }
            });

        },
        
        addLayer: function (id, layer) {
            if (this._layers[id]) {
                throw new Error("Attempt to redefine preferences layer: " + id);
            }
            
            this._inspectChangesAndFire(function () {
                this._layers[id] = layer;
                this._layerGetters.push(layer.getValue.bind(layer));
                this._layerKeys.push(layer.getKeys.bind(layer));
            }.bind(this));
            
            $(layer).on("beforeLayerChange", this._beforeLayerChange.bind(this));
            $(layer).on("afterLayerChange", this._afterLayerChange.bind(this));
        },
        
        _beforeLayerChange: function () {
            this._preLayerChangeData = this._getAllKeysAndPrefs();
        },
        
        _afterLayerChange: function () {
            if (!this._preLayerChangeData) {
                console.error("After layer change fired without before layer change. This should not happen.");
                return;
            }
            
            var before = this._preLayerChangeData;
            delete this._preLayerChangeData;
            
            var after = this._getAllKeysAndPrefs(before.keys);
            
            this._fireChanges(before, after);
        },
        
        setValue: function (scopeName, id, value) {
            var scope = this._scopes[scopeName];
            if (!scope) {
                throw new Error("Attempt to set preference in non-existent scope: " + scopeName);
            }
            
            var oldValue = this.getValue(id);
            scope.setValue(id, value);
            
            var newValue = this.getValue(id);
            
            if (oldValue !== newValue) {
                $(this).trigger(PREFERENCE_CHANGE, {
                    id: id,
                    newValue: newValue,
                    oldValue: oldValue
                });
            }
        },
        
        getValue: function (id) {
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
            if (this._saveInProgress) {
                if (!this._nextSaveDeferred) {
                    this._nextSaveDeferred = $.Deferred();
                }
                return this._nextSaveDeferred.promise();
            }
            
            this._saveInProgress = true;
            var deferred = this._nextSaveDeferred || $.Deferred();
            this._nextSaveDeferred = null;
            
            Async.doInParallel(this._scopeOrder, function (id) {
                var scope = this._scopes[id];
                return scope.save();
            }.bind(this))
                .then(function () {
                    this._saveInProgress = false;
                    if (this._nextSaveDeferred) {
                        this.save();
                    }
                    deferred.resolve();
                }.bind(this))
                .fail(function (err) {
                    deferred.reject(err);
                });
            
            return deferred.promise();
        }
    };
    
    exports.PreferencesManager = PreferencesManager;
    exports.Scope = Scope;
    exports.MemoryStorage = MemoryStorage;
    exports.LanguageLayer = LanguageLayer;
    exports.PathLayer = PathLayer;
    exports.FileStorage = FileStorage;
});