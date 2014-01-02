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

/*global define, $, localStorage, brackets */
/*unittests: Preferences Base */

/**
 * Infrastructure for the preferences system.
 *
 * At the top, the level at which most people will interact, is the `PreferencesManager` object.
 * The most common operation is `get(id)`, which simply retrieve the value of a given preference.
 * 
 * The PreferencesManager has an ordered collection of Scopes. Each Scope holds one level of 
 * settings. 
 * 
 * PreferencesManager.js sets up a singleton PreferencesManager that has the following Scopes:
 *
 *  default (the default values for any settings that are explicitly registered)
 *  user (the user's customized settings – the equivalent of Brackets' old 
 *        localStorage-based system. This is the settings file that lives in AppData)
 *  project (the useful new one: .brackets.prefs file in the root of a project)
 *  session (in-memory only settings for the current editing session)
 * 
 * For example, if spaceUnits has a value set at the project level, then a call 
 * to get("spaceUnits") would return the project level value. Project values come 
 * first, user values next, default values last. If the setting is not known 
 * at all, undefined is returned.
 * 
 * Each Scope has an associated Storage object that knows how to load and 
 * save the preferences value for that Scope. There are two implementations: 
 * MemoryStorage and FileStorage.
 * 
 * The final concept used is that of Layers. A Layer applies to every Scope and 
 * provides an additional level for preference lookups. Generally, a Layer looks 
 * for a collection of preferences that are nested in some fashion in the Scope's 
 * data. Under certain circumstances (decided upon by the Layer object), 
 * those nested preferences will take precedence over the main preferences in the Scope.
 * 
 * There is a data structure that sits underneath the PreferencesManager and Scopes: 
 * the MergedMap. A MergedMap is a map-like object that merges multiple maps 
 * into a single one for lookups and sends out change notifications when there 
 * is a change to a value in the map. The PreferencesManager itself is a 
 * MergedMap and the Scopes are nested MergedMaps. The Layers are implemented as 
 * additional levels in the Scopes.
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
    
    // CONSTANTS
    var PREFERENCE_CHANGE = "preferenceChange";
    
    /**
     * A MergedMap is a map-style object that merges multiple sub-maps (called
     * "levels") into a single map. You can use `get` to retrieve the current
     * value for a key. The `merged` property contains the current merged values.
     * 
     * MergedMap has two events of note:
     * 
     * * change: object with id, oldValue and newValue emitted for each key that changes
     * * dataChange: complete map of id/values that is emitted whenever any key changes
     */
    function MergedMap() {
        this.merged = {};
        this._levels = [];
        this._mergedAtLevel = {};
        this._exclusions = {};
        this._childMaps = {};
        this._levelData = {};
    }
    
    MergedMap.prototype = {
        
        /**
         * Adds a new level from which values are merged. New levels are added
         * with the highest precedence by default. If you pass the "before"
         * option with the name of the level that this should be inserted before,
         * then this new level will be added before that named level in the 
         * precedence change.
         * 
         * @param {string} name Name for the new level
         * @param {{map: ?MergedMap, before: ?string}} options Additional options for the level.
         *                            `map` supports having a MergedMap as a level
         *                            `before` name of level before which this new level 
         *                                     should be inserted
         */
        addLevel: function (name, options) {
            options = options || {};
            
            var insertingAt = 0;
            if (options.before) {
                insertingAt = this._levels.indexOf(options.before);
                if (insertingAt === -1) {
                    insertingAt = 0;
                }
            }
            
            this._levels.splice(insertingAt, 0, name);
            var mergedAtLevel = this._mergedAtLevel;
            
            // `_mergedAtLevel` keeps track of which level each key was found at.
            // Since we're adding a level at the beginning, we need to bump all of
            // these values up by one.
            _.forIn(mergedAtLevel, function (value, key) {
                if (value >= insertingAt) {
                    mergedAtLevel[key] = value + 1;
                }
            });
            
            // If a child MergedMap has been provided, we need to merge it in now, otherwise
            // we just create a new object to hold values for this level.
            if (options.map) {
                var childMap = options.map;
                this._childMaps[name] = childMap;
                
                // Set the data for this level based on the current values in the childMap
                // and then add a listener so that this level stays up to date with changes in
                // the child.
                this.setData(name, childMap.merged);
                $(childMap).on("dataChange", function (e, data) {
                    this._performSetData(name, data);
                }.bind(this));
            } else {
                this._levelData[name] = {};
            }
        },
        
        /**
         * Deletes the named level (resetting any preferences that were set at that
         * level).
         * 
         * @param {string} name Name of level to delete.
         */
        deleteLevel: function (name) {
            var levelIndex = this._levels.indexOf(name);
            if (levelIndex === -1) {
                return;
            }
            
            this._levels.splice(levelIndex, 1);
            delete this._levelData[name];
            
            var mergedAtLevel = this._mergedAtLevel;
            
            _.forIn(mergedAtLevel, function (value, key) {
                
                // For any value set at this level, we need to reset its value
                if (value === levelIndex) {
                    this._reset(key);
                    
                // for any value set after this level, we need to move its index up by one
                } else if (value > levelIndex) {
                    mergedAtLevel[key] = value - 1;
                }
            }.bind(this));
        },
        
        /**
         * Excludes a key from this map. This is used for cases where a key is not directly
         * used for configuration (see layers farther down in this file).
         * 
         * @param {string} id Key to exclude
         */
        addExclusion: function (id) {
            var merged = this.merged;
            
            this._exclusions[id] = true;
            
            // Check to see if this exclusion is already defined. If so, we need to
            // undefine it and notify listeners of the change.
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
        
        /**
         * Retrieve the current value of the key `id` from the map.
         * 
         * @param {string} id Key to retrieve from the map
         */
        get: function (id) {
            return this.merged[id];
        },
        
        /**
         * @protected
         * 
         * The first half of setting a value in the map. This part checks to see if this `id` 
         * is excluded or if we need to recurse into child maps in order to actually do the
         * set. This is split this way for subclasses.
         * 
         * `levelName` can be an array, in which case we try to traverse the levels listed
         * in the array as childMaps.
         * 
         * @param {(string|Array.<string>)} levelName Level at which to set the value
         * @param {string} id Key to set
         * @param {*} value Value for this key
         * @return {boolean} whether the value was changed
         */
        _performSet: function (levelName, id, value) {
            // eliminate excluded ids
            if (this._exclusions[id]) {
                return;
            }
            
            // Check to see if we need to recurse into child maps
            if (_.isArray(levelName)) {
                
                // If we're on the last element of the array, we've reached the
                // end so we treat this as a set against this map.
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
            
            // Continue on to part two.
            return this._performSetAndNotification(levelName, id, value);
        },
        
        /**
         * @protected
         * 
         * The second half of setting a value on the map. This part checks to see if the ID
         * is masked by a higher precedence level. Assuming that the set will make a difference,
         * this will set the value on the merged map and send a change notification
         * 
         * @param {(string|Array.<string>)} levelName Level at which to set the value
         * @param {string} id Key to set
         * @param {*} value Value for this key
         * @param {?boolean} resetting True if we are resetting the value of this `id` (in which
         *                                  case we don't check the level ranking)
         * @return {boolean} whether value was changed
         */
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
        
        /**
         * Sets the value for `id` at the given level and sends out notifications if
         * the merged value has actually changed.
         * 
         * @param {(string|Array.<string>)} levelName Level at which to set the value
         * @param {string} id Key to set
         * @param {*} value Value for this key
         * @return {boolean} true if the value was changed
         */
        set: function (levelName, id, value) {
            var changed = this._performSet(levelName, id, value);
            if (changed) {
                $(this).trigger("dataChange", this.merged);
            }
            this._levelData[id] = value;
            return changed;
        },
        
        /**
         * @protected
         * 
         * Sets the data at the given level, sending notifications for any changed
         * properties. This function is here to allow convenient overriding.
         * 
         * @param {string} levelName Level to set
         * @param {Object} data New data for that level.
         */
        _performSetData: function (levelName, data) {
            var hadChanges = false;
            
            // TODO: if levelName is an array, shouldn't we head down through childMaps
            // until we get to the destination?
            
            // Try to set each key/value
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
        
        /**
         * Provides all-new data for the given level.
         * 
         * @param {(string|Array.<string>)} levelName Level to apply data at
         * @param {Object} data New data for the level
         */
        setData: function (levelName, data) {
            this._performSetData(levelName, data);
        },
        
        /**
         * @private
         * 
         * Resets the given key to whatever its current value should be, based on
         * precedence. If the key is not present, then we delete it.
         * 
         * @param {string} key Key to reset.
         */
        _reset: function (key) {
            var levelData = this._levelData,
                hasBeenReset = false;
            
            // Loop through the levels until we find the first that defines this
            // key.
            this._levels.forEach(function (level, levelNumber) {
                var value = levelData[level][key];
                if (value !== undefined) {
                    this._performSetAndNotification(level, key, value, true);
                    hasBeenReset = true;
                }
            }.bind(this));
            
            // If this key is not present on *any* level, then we delete it.
            if (!hasBeenReset) {
                delete this._mergedAtLevel[key];
                var oldValue = this.merged[key];
                delete this.merged[key];
                $(this).trigger("change", {
                    id: key,
                    oldValue: oldValue,
                    newValue: undefined
                });
            }
        }
    };
    
    /*
     * Storages manage the loading and saving of preference data. 
     */
    
    /**
     * MemoryStorage, as the name implies, stores the preferences in memory.
     * This is suitable for single session data or testing.
     * 
     * @param {?Object} data Initial data for the storage.
     */
    function MemoryStorage(data) {
        this.data = data || {};
    }
    
    MemoryStorage.prototype = {
        
        /**
         * *Synchronously* returns the data stored in this storage.
         * The original object (not a clone) is returned.
         * 
         * @return {Promise} promise that is already resolved
         */
        load: function () {
            var result = $.Deferred();
            result.resolve(this.data);
            return result.promise();
        },
        
        /**
         * *Synchronously* saves the data to this storage. This saves
         * the `newData` object reference without cloning it.
         * 
         * @param {Object} newData The data to store.
         * @return {Promise} promise that is already resolved
         */
        save: function (newData) {
            var result = $.Deferred();
            this.data = newData;
            result.resolve();
            return result.promise();
        }
    };
    
    /**
     * Error type for problems parsing preference files.
     * 
     * @param {string} message Error message
     */
    function ParsingError(message) {
        this.name = "ParsingError";
        this.message = message || "";
    }
    
    ParsingError.prototype = new Error();
    
    /**
     * Loads/saves preferences from a JSON file on disk.
     * 
     * @param {string} path Path to the preferences file
     * @param {boolean} createIfNew True if the file should be created if it doesn't exist.
     *                              If this is not true, an exception will be thrown if the
     *                              file does not exist.
     */
    function FileStorage(path, createIfNew) {
        this.path = path;
        this.createIfNew = createIfNew;
    }
    
    FileStorage.prototype = {
        
        /**
         * Loads the preferences from disk. Can throw an exception if the file is not
         * readable or parseable.
         * 
         * @return {Promise} Resolved with the data once it has been parsed.
         */
        load: function () {
            var result = $.Deferred();
            var path = this.path;
            var createIfNew = this.createIfNew;
            
            if (path) {
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
            } else {
                result.resolve({});
            }
            
            return result.promise();
        },
        
        /**
         * Saves the new data to disk.
         * 
         * @param {Object} newData data to save
         * @return {Promise} Promise resolved (with no arguments) once the data has been saved
         */
        save: function (newData) {
            var result = $.Deferred();
            var path = this.path;
            var prefFile = FileSystem.getFileForPath(path);
            
            if (path) {
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
            } else {
                result.resolve();
            }
            return result.promise();
        },
        
        /**
         * Changes the path to the preferences file.
         * This sends a "changed" event to listeners, regardless of whether
         * the path has changed.
         * 
         * @param {string} newPath location of this settings file
         */
        setPath: function (newPath) {
            this.path = newPath;
            $(this).trigger("changed");
        }
    };
    
    /**
     * A `Scope` is a `MergedMap` that is tied to a `Storage`. Essentially, it combines
     * the methods of `MergedMap` and `Storage`.
     * 
     * Additionally, `Scope`s support "layers" which are additional levels of preferences
     * that are stored within a single preferences file.
     * 
     * `Scope`s work by having a "base" level in the MergedMap that represents the data from
     * the `Storage` and an additional level for each layer.
     * 
     * @param {Storage} storage Storage object from which prefs are loaded/saved
     */
    function Scope(storage) {
        MergedMap.apply(this);
        this.storage = storage;
        $(storage).on("changed", this.load.bind(this));
        this.data = undefined;
        this._dirty = false;
        this.addLevel("base");
        this._layers = {};
    }
    
    Scope.prototype = new MergedMap();
    
    _.extend(Scope.prototype, {
        /**
         * Overrides the base `addLevel` call to add support for layers.
         * 
         * @param {string} name Name for the new level
         * @param {{map: ?MergedMap, layer: ?Layer}} options Additional options for the level.
         *                            `map` supports having a MergedMap as a level
         *                            `layer' adds a layer as a new level
         */
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
        
        /**
         * Loads the prefs for this `Scope` from the `Storage`.
         * 
         * @return {Promise} Promise that is resolved once loading is complete
         */
        load: function () {
            var result = $.Deferred();
            this.storage.load()
                .then(function (data) {
                    this.data = data;
                    
                    // Update the base level with the new data
                    this.setData("base", data);
                    
                    // For each layer, re-evaluate the data for the layer
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
        
        /**
         * Saves the prefs for this `Scope`.
         * 
         * @return {Promise} promise resolved once the data is saved.
         */
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
        
        /**
         * @private
         * 
         * `Scope`s suppport a more limited subset of levels than a generic `MergedMap`.
         * This function normalizes the level to those supported by `Scope`s.
         * 
         * @param {(string|Array.<string>)} levelName name to normalize
         * @return {?string} normalized name
         */
        _normalizeLevelName: function (levelName) {
            if (_.isArray(levelName)) {
                levelName = levelName[0];
            }
            if (levelName !== "base") {
                return undefined;
            }
            return levelName;
        },
        
        /**
         * Sets the value for `id` at the given level and sends out notifications if
         * the merged value has actually changed.
         * 
         * @param {(string|Array.<string>)} levelName Level at which to set the value
         * @param {string} id Key to set
         * @param {*} value Value for this key
         * @return {boolean} true if the value was changed
         */
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
        
        /**
         * Provides all-new data for the given level.
         * 
         * @param {(string|Array.<string>)} levelName Level to apply data at
         * @param {Object} data New data for the level
         */
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
    
    /**
     * A Layer which provides preferences scoped to a particular language that is being
     * edited. These are defined in the JSON file as in this example:
     * 
     * {
     *     "language": {
     *         "html": {
     *             "somePref": "someValue"
     *         }
     *     }
     * }
     */
    function LanguageLayer() {
        this.data = undefined;
        this.language = undefined;
    }
    
    LanguageLayer.prototype = {
        exclusions: ["language"],
        
        /**
         * Sets the data used by this scope.
         * 
         * @param {Object} data Data that this scope will look at to see if the layer applies
         */
        setData: function (data) {
            this.data = data;
            this._signalChange();
        },
        
        /**
         * Sets the language currently being edited (which determines the prefs applied).
         * 
         * @param {string} languageID Identifier for the language that is currently being edited.
         */
        setLanguage: function (languageID) {
            if (languageID !== this.language) {
                this.language = languageID;
                this._signalChange();
            }
        },
        
        /**
         * @private
         * 
         * Manages changes to data and language to signal that there has been a change in the
         * prefs provided by this layer. This is called whenever the data or language has
         * changed and its up to the listeners of the `dataChange` event to decide whether an
         * interesting change has occurred.
         */
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
    
    /**
     * Provides layered preferences based on file globs, generally following the model provided
     * by [EditorConfig](http://editorconfig.org/). In usage, it looks something like this
     * (switching to single line comments because the glob interferes with the multiline comment):
     */
    
//    "path": {
//        "src/thirdparty/CodeMirror2/**/*.js": {
//            "spaceUnits": 2,
//            "linting.enabled": false
//        }
//    }
    
    /**
     * There can be multiple paths and they are each checked in turn. The first that matches the
     * currently edited file wins.
     */
    
    function PathLayer() {
        this.data = undefined;
        this.filename = undefined;
    }
    
    PathLayer.prototype = {
        exclusions: ["path"],
        
        /**
         * Sets the data in use for this layer. (This and the `dataChange` event are the
         * standard parts of the Layer interface.
         * 
         * @param {Object} data Current data to be used for this layer.
         */
        setData: function (data) {
            this.data = data;
            this._signalChange();
        },
        
        /**
         * Sets the filename of the currently edited file. This filename should be
         * expressed as relative to the prefs file.
         * 
         * @param {string} filename Edited file relative to the prefs file
         */
        setFilename: function (filename) {
            this.filename = filename;
            this._signalChange();
        },
        
        /**
         * @private
         * 
         * Sends a change notification based on the current data and filename.
         */
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
        
        /**
         * @private
         * 
         * Look for a matching file glob among the collection of paths.
         * 
         * @param {Object} path The keys are globs and the values are the preferences for that glob
         */
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
    
    /**
     * PreferencesManager ties everything together to provide a simple interface for
     * managing the whole prefs system.
     * 
     * It is a MergedMap with Scopes at each level. It also keeps track of Layers that
     * are applied at each Scope.
     * 
     * It also provides the ability to register preferences, which gives a fine-grained
     * means for listening for changes and will ultimately allow for automatic UI generation.
     */
    function PreferencesManager() {
        MergedMap.apply(this);
        this._knownPrefs = {};
        this.addLevel("default");
        this._layers = [];
        
        this._saveInProgress = false;
        this._nextSaveDeferred = null;
        
        // When we signal a general change message on this manager, we also signal a change
        // on the individual preference object.
        $(this).on("change", function (e, data) {
            var pref = this._knownPrefs[data.id];
            if (pref) {
                $(pref).trigger("change", {
                    oldValue: data.oldValue,
                    newValue: data.newValue
                });
            }
        }.bind(this));
    }
    
    PreferencesManager.prototype = new MergedMap();
    
    _.extend(PreferencesManager.prototype, {
        
        /**
         * Defines a new preference.
         * 
         * @param {string} id identifier of the preference. Generally a dotted name.
         * @param {string} type Data type for the preference (generally, string, boolean, number)
         * @param {Object} initial Default value for the preference
         * @param {?Object} options Additional options for the pref. Can include name and description
         *                          that will ultimately be used in UI.
         * @return {Object} The preference object.
         */
        definePreference: function (id, type, initial, options) {
            options = options || {};
            if (this._knownPrefs.hasOwnProperty(id)) {
                throw new Error("Preference " + id + " was redefined");
            }
            var pref = this._knownPrefs[id] = {
                type: type,
                initial: initial,
                name: options.name,
                description: options.description
            };
            MergedMap.prototype.set.call(this, "default", id, initial);
            return pref;
        },
        
        /**
         * Get the preference object for the given ID.
         * 
         * @param {string} id ID of the pref to retrieve.
         */
        getPreference: function (id) {
            return this._knownPrefs[id];
        },
        
        /**
         * Adds a new Scope. New Scopes are added at the highest precedence. The new Scope
         * is automatically loaded.
         * 
         * @param {string} id Name of the Scope
         * @param {Scope} scope the Scope object itself. Can be given a Storage directly for convenience
         * @return {Promise} Promise that is resolved when the Scope is loaded. It is resolved
         *                   with id and scope.
         */
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
            
            this._layers.forEach(function (layerInfo) {
                scope.addLevel(layerInfo.id, {
                    layer: layerInfo.layer
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
        
        /**
         * Adds a Layer that applies to each Scope.
         * 
         * @param {string} id Name of the layer
         * @param {Layer} layer The Layer object itself.
         */
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
        
        /**
         * Sets a preference in the chosen Scope.
         * 
         * @param {string} scopeName Scope to set the preference in
         * @param {string} id Identifier of the preference to set
         * @param {Object} value New value for the preference
         * @return {boolean} True if the preference was changed.
         */
        set: function (scopeName, id, value) {
            if (!this._childMaps[scopeName]) {
                throw new Error("Attempt to set preference in non-existent scope: " + scopeName);
            }
            return MergedMap.prototype.set.call(this, [scopeName, "base"], id, value);
        },
        
        /**
         * Replace the data in the given Scope.
         * 
         * @param {string} scopeName Scope in which to replace the data
         * @param {Object} data New data for the Scope
         * 
         */
        setData: function (scopeName, data) {
            MergedMap.prototype.setData.call(this, [scopeName, "base"], data);
        },
        
        /**
         * Saves the preferences. If a save is already in progress, a Promise is returned for
         * that save operation.
         * 
         * @return {Promise} Resolved when the preferences are done saving.
         */
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
    
    // Public interface
    exports.MergedMap = MergedMap;
    exports.PreferencesManager = PreferencesManager;
    exports.Scope = Scope;
    exports.MemoryStorage = MemoryStorage;
    exports.LanguageLayer = LanguageLayer;
    exports.PathLayer = PathLayer;
    exports.FileStorage = FileStorage;
});