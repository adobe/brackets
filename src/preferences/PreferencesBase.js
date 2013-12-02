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
        FileSystem        = require("filesystem/FileSystem"),
        ExtensionLoader   = require("utils/ExtensionLoader"),
        CollectionUtils   = require("utils/CollectionUtils"),
        _                 = require("thirdparty/lodash"),
        Async             = require("utils/Async"),
        globmatch         = require("thirdparty/globmatch");
    
    var PREFERENCE_CHANGE = "preferenceChange";
    
    function MergedMap() {
        this.merged = {};
        this._levels = [];
        this._mergedAtLevel = {};
        this._exclusions = {};
        this._childMaps = {};
        this._levelData = {};
    }
    
    MergedMap.prototype = {
        addLevel: function (name, options) {
            options = options || {};
            
            this._levels.unshift(name);
            var mergedAtLevel = this._mergedAtLevel;
            _.forIn(mergedAtLevel, function (value, key) {
                mergedAtLevel[key] = value + 1;
            });
            
            if (options.map) {
                var childMap = options.map;
                this._childMaps[name] = childMap;
                this.setData(name, childMap.merged);
                $(childMap).on("dataChange", function (e, data) {
                    this._performSetData(name, data);
                }.bind(this));
            } else {
                this._levelData[name] = {};
            }
        },
        
        addExclusion: function (id) {
            var merged = this.merged;
            
            this._exclusions[id] = true;
            if (merged[id] !== undefined) {
                var oldValue = merged[id];
                delete merged[id];
                delete this._mergedAtLevel[id];
                var $this = $(this);
                $this.trigger("change", {
                    id: id,
                    oldValue: oldValue,
                    newValue: undefined
                });
                $this.trigger("dataChange", merged);
            }
        },
        
        get: function (id) {
            return this.merged[id];
        },
        
        _performSet: function (levelName, id, value) {
            if (this._exclusions[id]) {
                return;
            }
            
            if (_.isArray(levelName)) {
                if (levelName.length === 1) {
                    levelName = levelName[0];
                } else {
                    var childLevel = levelName[0],
                        childMap = this._childMaps[childLevel];
                    
                    if (!childMap) {
                        console.error("Attempt to set preference with unknown level (" + childLevel + ") ", levelName, id);
                        return false;
                    }
                    childMap.set(_.rest(levelName), id, value);
                    
                    // This is not tracked as a change at this level. The
                    // handling of the dataChange event will take care of whether or not
                    // this MergedMap has changed as a result.
                    return false;
                }
            }
            
            return this._performSetAndNotification(levelName, id, value);
        },
        
        _performSetAndNotification: function (levelName, id, value, resetting) {
            var merged = this.merged,
                mergedAtLevel = this._mergedAtLevel,
                levelRank = this._levels.indexOf(levelName),
                changed = false;
            
            // Check for a reference to undefined level.
            if (levelRank === -1) {
                throw new Error("Attempt to set preference in non-existent level: " + levelName);
            }
            
            var oldValue = merged[id];
            if (resetting || oldValue === undefined || mergedAtLevel[id] >= levelRank) {
                mergedAtLevel[id] = levelRank;
                if (value !== oldValue) {
                    changed = true;
                    merged[id] = value;
                    $(this).trigger("change", {
                        id: id,
                        oldValue: oldValue,
                        newValue: value
                    });
                }
            }
            return changed;
        },
        
        set: function (levelName, id, value) {
            var changed = this._performSet(levelName, id, value);
            if (changed) {
                $(this).trigger("dataChange", this.merged);
            }
            this._levelData[id] = value;
            return changed;
        },
        
        _performSetData: function (levelName, data) {
            var hadChanges = false;
            
            _.forIn(data, function (value, key) {
                hadChanges = this._performSet(levelName, key, value) || hadChanges;
            }, this);
            
            if (_.isArray(levelName) && levelName.length === 1) {
                levelName = levelName[0];
            }
            
            if (!_.isArray(levelName)) {
                this._levelData[levelName] = data;
                
                // Look for values that have been removed
                var levelRank = this._levels.indexOf(levelName);
                _.forIn(this._mergedAtLevel, function (value, key) {
                    if (value === levelRank && data[key] === undefined) {
                        this._reset(key);
                        hadChanges = true;
                    }
                }.bind(this));
            }
            
            if (hadChanges) {
                $(this).trigger("dataChange", this.merged);
            }
        },
        
        setData: function (levelName, data) {
            this._performSetData(levelName, data);
        },
        
        _reset: function (key) {
            var levelData = this._levelData,
                mergedAtLevel = this._mergedAtLevel;
            
            this._levels.forEach(function (level, levelNumber) {
                var value = levelData[level][key];
                if (value !== undefined) {
                    this._performSetAndNotification(level, key, value, true);
                }
            }.bind(this));
        }
    };
    
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
            
            var prefFile = FileSystem.getFileForPath(path);
            prefFile.read({}, function (err, text) {
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
            var prefFile = FileSystem.getFileForPath(path);
            
            try {
                prefFile.write(JSON.stringify(newData, null, 4), {}, function (err) {
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
        MergedMap.apply(this);
        this.storage = storage;
        this.data = undefined;
        this._dirty = false;
        this.addLevel("base");
        this._layers = {};
    }
    
    Scope.prototype = new MergedMap();
    
    _.extend(Scope.prototype, {
        addLevel: function (name, options) {
            options = options || {};
            
            if (options.layer) {
                var layer = options.layer;
                
                MergedMap.prototype.addLevel.call(this, name);
                this._layers[name] = layer;
                _.each(layer.exclusions, this.addExclusion, this);
                $(layer).on("dataChange", function (e, data) {
                    MergedMap.prototype.setData.call(this, name, data);
                }.bind(this));
                layer.setData(this.data);
            } else {
                MergedMap.prototype.addLevel.call(this, name, options);
            }
        },
        load: function () {
            var result = $.Deferred();
            this.storage.load()
                .then(function (data) {
                    this.data = data;
                    this.setData("base", data);
                    _.forIn(this._layers, function (layer) {
                        layer.setData(data);
                    });
                    result.resolve();
                }.bind(this))
                .fail(function (error) {
                    result.reject(error);
                });
            return result.promise();
        },
        save: function () {
            var self = this;
            if (this._dirty) {
                return this.storage.save(this.data).done(function () {
                    self._dirty = false;
                });
            } else {
                return $.Deferred().resolve().promise();
            }
        },
        
        _normalizeLevelName: function (levelName) {
            if (_.isArray(levelName)) {
                levelName = levelName[0];
            }
            if (levelName !== "base") {
                return undefined;
            }
            return levelName;
        },
        
        set: function (levelName, id, value) {
            // Scopes do not support changing settings on layers at this
            // time. Ultimately, the need to do so will be based on
            // UI.
            levelName = this._normalizeLevelName(levelName);
            if (!levelName) {
                return false;
            }
            this._dirty = true;
            this.data[id] = value;
            return MergedMap.prototype.set.call(this, levelName, id, value);
        },
        
        setData: function (levelName, data) {
            // As with `set` above, setData is not supported on layers
            // at this time.
            levelName = this._normalizeLevelName(levelName);
            if (!levelName) {
                return false;
            }
            this._dirty = true;
            _.assign(this.data, data);
            return MergedMap.prototype.setData.call(this, levelName, data);
        }
    });
    
    function LanguageLayer() {
        this.data = undefined;
        this.language = undefined;
    }
    
    LanguageLayer.prototype = {
        exclusions: ["language"],
        
        setData: function (data) {
            this.data = data;
            this._signalChange();
        },
        
        setLanguage: function (languageID) {
            if (languageID !== this.language) {
                this.language = languageID;
                this._signalChange();
            }
        },
        
        _signalChange: function () {
            var data = this.data,
                languageData;
            if (data && data.language) {
                languageData = data.language[this.language];
            }
            if (languageData === undefined) {
                languageData = {};
            }
            $(this).trigger("dataChange", languageData);
        }
    };
    
    function PathLayer() {
        this.data = undefined;
        this.filename = undefined;
    }
    
    PathLayer.prototype = {
        exclusions: ["path"],
        
        setData: function (data) {
            this.data = data;
            this._signalChange();
        },
        
        setFilename: function (filename) {
            this.filename = filename;
            this._signalChange();
        },
        
        _signalChange: function () {
            var data = this.data,
                pathData;
            
            if (data && data.path) {
                var glob = this._findMatchingGlob(data.path);
                pathData = data.path[glob];
            }
            if (pathData === undefined) {
                pathData = {};
            }
            $(this).trigger("dataChange", pathData);
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
        }
    };
    
    function PreferencesManager() {
        MergedMap.apply(this);
        this._knownPrefs = {};
        this.addLevel("default");
        this._layers = [];
        
        this._saveInProgress = false;
        this._nextSaveDeferred = null;
    }
    
    PreferencesManager.prototype = new MergedMap();
    
    _.extend(PreferencesManager.prototype, {
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
            MergedMap.prototype.set.call(this, "default", id, initial);
        },
        
        addScope: function (id, scope) {
            if (this._levels.indexOf(id) > -1) {
                throw new Error("Attempt to redefine preferences scope: " + id);
            }
            
            // Check to see if "scope" might be a Storage instead
            if (!scope.get) {
                scope = new Scope(scope);
            }
            
            this.addLevel(id, {
                map: scope
            });
            
            this._layers.forEach(function (layer) {
                scope.addLevel(id, {
                    layer: layer
                });
            });
            
            var deferred = $.Deferred();
            
            scope.load()
                .done(function (data) {
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
            // TODO
        },
        
        addLayer: function (id, layer) {
            this._layers.push({
                id: id,
                layer: layer
            });
            _.values(this._childMaps).forEach(function (scope) {
                scope.addLevel(id, {
                    layer: layer
                });
            });
        },
        
        set: function (scopeName, id, value) {
            if (!this._childMaps[scopeName]) {
                throw new Error("Attempt to set preference in non-existent scope: " + scopeName);
            }
            return MergedMap.prototype.set.call(this, [scopeName, "base"], id, value);
        },
        
        setData: function (scopeName, data) {
            return MergedMap.prototype.setData.call(this, [scopeName, "base"], data);
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
            
            Async.doInParallel(this._levels, function (level) {
                var scope = this._childMaps[level];
                if (scope) {
                    return scope.save();
                } else {
                    return $.Deferred().resolve().promise();
                }
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
    });
    
    exports.MergedMap = MergedMap;
    exports.PreferencesManager = PreferencesManager;
    exports.Scope = Scope;
    exports.MemoryStorage = MemoryStorage;
    exports.LanguageLayer = LanguageLayer;
    exports.PathLayer = PathLayer;
    exports.FileStorage = FileStorage;
});