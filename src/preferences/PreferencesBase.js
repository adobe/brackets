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

/*global define, $, localStorage, brackets, console */
/*unittests: Preferences Base */

/**
 * Infrastructure for the preferences system.
 *
 * At the top, the level at which most people will interact, is the `PreferencesSystem` object.
 * The most common operation is `get(id)`, which simply retrieves the value of a given preference.
 * 
 * The PreferencesSystem has a collection of Scopes, which it traverses in a specified order. 
 * Each Scope holds one level of settings. 
 * 
 * PreferencesManager.js sets up a singleton PreferencesSystem that has the following Scopes:
 *
 * * default (the default values for any settings that are explicitly registered)
 * *  user (the user's customized settings – the equivalent of Brackets' old 
 *        localStorage-based system. This is the settings file that lives in AppData)
 * * Additional scopes for each .brackets.json file going upward in the file tree from the
 *        current file
 * 
 * For example, if spaceUnits has a value set in a .brackets.json file near the open file, 
 * then a call to get("spaceUnits") would return the value from that file. File values come 
 * first, user values next, default values last. If the setting is not known 
 * at all, undefined is returned.
 * 
 * Each Scope has an associated Storage object that knows how to load and 
 * save the preferences value for that Scope. There are two implementations: 
 * MemoryStorage and FileStorage.
 * 
 * The final concept used is that of Layers, which can be added to Scopes. Generally, a Layer looks 
 * for a collection of preferences that are nested in some fashion in the Scope's 
 * data. Under certain circumstances (decided upon by the Layer object), 
 * those nested preferences will take precedence over the main preferences in the Scope.
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
    var PREFERENCE_CHANGE = "change";
    
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
        },
        
        /**
         * MemoryStorage is not stored in a file, so fileChanged is ignored.
         * 
         * @param {string} filename File that has changed
         */
        fileChanged: function (filename) {
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
        this._lineEndings = FileUtils.getPlatformLineEndings();
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
            var self = this;
            
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
                    
                    self._lineEndings = FileUtils.sniffLineEndings(text);
                    
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
                    var text = JSON.stringify(newData, null, 4);
                    
                    // maintain the original line endings
                    text = FileUtils.translateLineEndings(text, this._lineEndings);
                    prefFile.write(text, {}, function (err) {
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
        },
        
        /**
         * If the filename matches this Storage's path, a changed message is triggered.
         * 
         * @param {string} filename File that has changed
         */
        fileChanged: function (filename) {
            if (filename === this.path) {
                $(this).trigger("changed");
            }
        }
    };
    
    /**
     * A `Scope` is a data container that is tied to a `Storage`.
     * 
     * Additionally, `Scope`s support "layers" which are additional levels of preferences
     * that are stored within a single preferences file.
     * 
     * @param {Storage} storage Storage object from which prefs are loaded/saved
     */
    function Scope(storage) {
        this.storage = storage;
        $(storage).on("changed", this.load.bind(this));
        this.data = {};
        this._dirty = false;
        this._layers = [];
        this._layerMap = {};
        this._exclusions = [];
    }
    
    _.extend(Scope.prototype, {
        /**
         * Loads the prefs for this `Scope` from the `Storage`.
         * 
         * @return {Promise} Promise that is resolved once loading is complete
         */
        load: function () {
            var result = $.Deferred();
            this.storage.load()
                .then(function (data) {
                    var oldKeys = this.getKeys();
                    this.data = data;
                    result.resolve();
                    $(this).trigger(PREFERENCE_CHANGE, {
                        ids: _.union(this.getKeys(), oldKeys)
                    });
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
                self._dirty = false;
                return this.storage.save(this.data);
            } else {
                return $.Deferred().resolve().promise();
            }
        },
        
        /**
         * Sets the value for `id`. The value is set at the location given, or at the current
         * location for the preference if no location is specified. If an invalid location is
         * given, nothing will be set and no exception is thrown.
         * 
         * @param {string} id Key to set
         * @param {*} value Value for this key
         * @param {Object=} context Optional additional information about the request (typically used for layers)
         * @param {{layer: ?string, layerID: ?Object}=} location Optional location in which to set the value.
         *                                                      If the object is empty, the value will be
         *                                                      set at the Scope's base level.
         * @return {boolean} true if the value was set
         */
        set: function (id, value, context, location) {
            if (!location) {
                location = this.getPreferenceLocation(id, context);
            }
            if (location && location.layer) {
                var layer = this._layerMap[location.layer];
                if (layer) {
                    var wasSet = layer.set(this.data[layer.key], id, value, context, location.layerID);
                    this._dirty = this._dirty || wasSet;
                    return wasSet;
                } else {
                    return false;
                }
            } else {
                return this._performSet(id, value);
            }
        },
        
        /**
         * @private
         * 
         * Performs the set operation on this Scope's data, deleting the given ID if
         * the new value is undefined. The dirty flag will be set as well.
         * 
         * @param {string} id key to set or delete
         * @param {*} value value for this key (undefined to delete)
         * @return {boolean} always returns true
         */
        _performSet: function (id, value) {
            this._dirty = true;
            if (value === undefined) {
                delete this.data[id];
            } else {
                this.data[id] = value;
            }
            return true;
        },
        
        /**
         * Get the value for id, given the context. The context is provided to layers
         * which may override the value from the main data of the Scope. Note that
         * layers will often exclude values from consideration.
         * 
         * @param {string} id Preference to retrieve
         * @param {?Object} context Optional additional information about the request
         * @return {*} Current value of the Preference
         */
        get: function (id, context) {
            var layerCounter,
                layers = this._layers,
                layer,
                data = this.data,
                result;
            
            context = context || {};
            
            for (layerCounter = 0; layerCounter < layers.length; layerCounter++) {
                layer = layers[layerCounter];
                result = layer.get(data[layer.key], id, context);
                if (result !== undefined) {
                    return result;
                }
            }
            
            if (this._exclusions.indexOf(id) === -1) {
                return data[id];
            }
        },
        
        /**
         * Get the location in this Scope (if any) where the given preference is set.
         * 
         * @param {string} id Name of the preference for which the value should be retrieved
         * @param {Object=} context Optional context object to change the preference lookup
         * @return {{layer: ?string, layerID: ?object}|undefined} Object describing where the preferences came from. 
         *                                              An empty object means that it was defined in the Scope's
         *                                              base data. Undefined means the pref is not
         *                                              defined in this Scope.
         */
        getPreferenceLocation: function (id, context) {
            var layerCounter,
                layers = this._layers,
                layer,
                data = this.data,
                result;
            
            context = context || {};
            
            for (layerCounter = 0; layerCounter < layers.length; layerCounter++) {
                layer = layers[layerCounter];
                result = layer.getPreferenceLocation(data[layer.key], id, context);
                if (result !== undefined) {
                    return {
                        layer: layer.key,
                        layerID: result
                    };
                }
            }
            
            if (this._exclusions.indexOf(id) === -1 && data[id] !== undefined) {
                // The value is defined in this Scope, which means we need to return an
                // empty object as a signal to the PreferencesSystem that this pref
                // is defined in this Scope (in the base data)
                return {};
            }
            
            // return undefined when this Scope does not have the requested pref
            return undefined;
        },
        
        /**
         * Get the preference IDs that are set in this Scope. All layers are added
         * in. If context is not provided, the set of all keys in the Scope including
         * all keys in each layer will be returned.
         * 
         * @param {?Object} context Optional additional information for looking up the keys
         * @return {Array.<string>} Set of preferences set by this Scope
         */
        getKeys: function (context) {
            context = context || {};
            
            var layerCounter,
                layers = this._layers,
                layer,
                data = this.data;
            
            var keySets = [_.difference(_.keys(data), this._exclusions)];
            for (layerCounter = 0; layerCounter < layers.length; layerCounter++) {
                layer = layers[layerCounter];
                keySets.push(layer.getKeys(data[layer.key], context));
            }
            
            return _.union.apply(null, keySets);
        },
        
        /**
         * Adds a Layer to this Scope. The Layer object should define a `key`, which
         * represents the subset of the preference data that the Layer works with.
         * Layers should also define `get` and `getKeys` operations that are like their
         * counterparts in Scope but take "data" as the first argument.
         * 
         * Listeners are notified of potential changes in preferences with the addition of
         * this layer.
         * 
         * @param {Layer} layer Layer object to add to this Scope
         */
        addLayer: function (layer) {
            this._layers.push(layer);
            this._layerMap[layer.key] = layer;
            this._exclusions.push(layer.key);
            $(this).trigger(PREFERENCE_CHANGE, {
                ids: layer.getKeys(this.data[layer.key], {})
            });
        },
        
        /**
         * Tells the Scope that the given file has been changed so that the
         * Storage can be reloaded if needed.
         * 
         * @param {string} filename Name of the file that has changed
         */
        fileChanged: function (filename) {
            this.storage.fileChanged(filename);
        }
    });
    
    // Utility functions for the PathLayer
    
    /**
     * @private
     * 
     * Finds the directory name of the given path. Ensures that the result always ends with a "/".
     * 
     * @param {string} filename Filename from which to extract the dirname
     * @return {string} directory containing the file (ends with "/")
     */
    function _getDirName(filename) {
        if (!filename) {
            return "/";
        }
        
        var rightMostSlash = filename.lastIndexOf("/");
        return filename.substr(0, rightMostSlash + 1);
    }
    
    /**
     * @private
     * 
     *
     * Computes filename as relative to the basePath. For example:
     * basePath: /foo/bar/, filename: /foo/bar/baz.txt
     * returns: baz.txt
     * 
     * The net effect is that the common prefix is returned. If basePath is not
     * a prefix of filename, then undefined is returned.
     * 
     * @param {string} basePath Path against which we're computing the relative path
     * @param {string} filename Full path to the file for which we are computing a relative path
     * @return {string} relative path
     */
    function _getRelativeFilename(basePath, filename) {
        if (!filename || filename.substr(0, basePath.length) !== basePath) {
            return;
        }
        
        return filename.substr(basePath.length);
    }
    
    /**
     * @private
     * 
     * Look for a matching file glob among the collection of paths.
     * 
     * @param {Object} pathData The keys are globs and the values are the preferences for that glob
     * @param {string} filename relative filename to match against the globs
     * @return {?string} glob pattern that matched, if any
     */
    function _findMatchingGlob(pathData, filename) {
        var globs = Object.keys(pathData),
            globCounter;

        if (!filename) {
            return;
        }

        for (globCounter = 0; globCounter < globs.length; globCounter++) {
            var glob = globs[globCounter];

            if (globmatch(filename, glob)) {
                return glob;
            }
        }
    }

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
     * 
     * @param {string} prefFilePath path to the preference file
     */
    function PathLayer(prefFilePath) {
        this.prefFilePath = _getDirName(prefFilePath);
    }
    
    PathLayer.prototype = {
        key: "path",
        
        /**
         * Retrieve the current value based on the filename in the context
         * object, comparing globs relative to the prefFilePath that this
         * PathLayer was set up with.
         * 
         * @param {Object} data the preference data from the Scope
         * @param {string} id preference ID to look up
         * @param {Object} context Object with filename that will be compared to the globs
         */
        get: function (data, id, context) {
            var glob = this.getPreferenceLocation(data, id, context);
            
            if (!glob) {
                return;
            }
            
            return data[glob][id];
        },
        
        /**
         * Gets the location in which the given pref was set, if it was set within
         * this path layer for the current path.
         * 
         * @param {Object} data the preference data from the Scope
         * @param {string} id preference ID to look up
         * @param {Object} context Object with filename that will be compared to the globs
         * @return {string} the Layer ID, in this case the glob that matched
         */
        getPreferenceLocation: function (data, id, context) {
            if (!data) {
                return;
            }
            
            var relativeFilename = _getRelativeFilename(this.prefFilePath, context.filename);
            if (!relativeFilename) {
                return;
            }
            
            return _findMatchingGlob(data, relativeFilename);
        },
        
        /**
         * Sets the preference value in the given data structure for the layerID provided. If no
         * layerID is provided, then the current layer is used. If a layerID is provided and it
         * does not exist, it will be created.
         * 
         * This function returns whether or not a value was set.
         * 
         * @param {Object} data the preference data from the Scope
         * @param {string} id preference ID to look up
         * @param {Object} value new value to assign to the preference
         * @param {Object} context Object with filename that will be compared to the globs
         * @param {string=} layerID Optional: glob pattern for a specific section to set the value in
         * @return {boolean} true if the value was set
         */
        set: function (data, id, value, context, layerID) {
            if (!layerID) {
                layerID = this.getPreferenceLocation(data, id, context);
            }
            
            if (!layerID) {
                return false;
            }
            
            var section = data[layerID];
            if (!section) {
                data[layerID] = section = {};
            }
            if (value === undefined) {
                delete section[id];
            } else {
                section[id] = value;
            }
            return true;
        },
        
        /**
         * Retrieves the keys provided by this layer object. If context with a filename is provided,
         * only the keys for the matching file glob are given. Otherwise, all keys for all globs
         * are provided.
         * 
         * @param {Object} data the preference data from the Scope
         * @param {?Object} context Additional context data (filename in particular is important)
         */
        getKeys: function (data, context) {
            if (!data) {
                return;
            }
            
            var relativeFilename = _getRelativeFilename(this.prefFilePath, context.filename);
            
            if (relativeFilename) {
                var glob = _findMatchingGlob(data, relativeFilename);
                if (glob) {
                    return _.keys(data[glob]);
                } else {
                    return [];
                }
            }
            return _.union.apply(null, _.map(_.values(data), _.keys));
        }
        
    };
    
    /**
     * Helper object to add a new path-based Scope to the PreferencesSystem. When a path-based
     * Scope will be added, its existence is first checked and *then* this PathScopeAdder will be
     * used.
     * 
     * @param {string} filename Filename of the preferences file
     * @param {string} scopeName Name of the new Scope to add
     * @param {ScopeGenerator} scopeGenerator ScopeGenerator object that knows how to create the
     *                      Scope with the correct kind of Storage object
     * @param {string} before Name of the default Scope before which the new Scope should be added
     */
    function PathScopeAdder(filename, scopeName, scopeGenerator, before) {
        this.filename = filename;
        this.scopeName = scopeName;
        this.scopeGenerator = scopeGenerator;
        this.before = before;
    }
    
    PathScopeAdder.prototype = {
        /**
         * Adds the new Scope to the given PreferencesSystem.
         * 
         * @param {PreferencesSystem} pm PreferencesSystem to which the Scope will be added
         * @param {string} before Name of the Scope before which the new Scope should be added
         * @return {Promise} Promise resolved once the Scope is loaded
         */
        add: function (pm, before) {
            var scope = this.scopeGenerator.getScopeForFile(this.filename);
            if (scope) {
                var pathLayer = new PathLayer(this.filename);
                scope.addLayer(pathLayer);
                return pm.addScope(this.scopeName, scope,
                    {
                        before: before
                    });
            }
        }
    };
    
    /**
     * Represents a single, known Preference.
     * 
     * @param {Object} properties Information about the Preference that is stored on this object
     */
    function Preference(properties) {
        _.extend(this, properties);
    }
    
    _.extend(Preference.prototype, {
        /**
         * Sets an event handler on this Preference.
         * 
         * @param {string} event Event name
         * @param {Function} handler Function to handle the event
         */
        on: function (event, handler) {
            $(this).on(event, handler);
        },
        
        /**
         * Removes an event handler from this Preference
         * 
         * @param {string} event Event name
         * @param {?Function} handler Optional specific function to stop receiving events 
         */
        off: function (event, handler) {
            $(this).off(event, handler);
        }
    });
    
    /**
     * Provides a subset of the PreferencesSystem functionality with preference
     * access always occurring with the given prefix.
     * 
     * @param {PreferencesSystem} baseSystem The real PreferencesSystem that is backing this one
     * @param {string} prefix Prefix that is used for preferences lookup. Any separator characters should already be added.
     */
    function PrefixedPreferencesSystem(base, prefix) {
        this.base = base;
        this.prefix = prefix;
        this._listenerInstalled = false;
    }
    
    PrefixedPreferencesSystem.prototype = {
        /**
         * Defines a new (prefixed) preference.
         * 
         * @param {string} id unprefixed identifier of the preference. Generally a dotted name.
         * @param {string} type Data type for the preference (generally, string, boolean, number)
         * @param {Object} initial Default value for the preference
         * @param {?Object} options Additional options for the pref. Can include name and description
         *                          that will ultimately be used in UI.
         * @return {Object} The preference object.
         */
        definePreference: function (id, type, initial, options) {
            return this.base.definePreference(this.prefix + id, type, initial, options);
        },
        
        /**
         * Get the prefixed preference object
         * 
         * @param {string} id ID of the pref to retrieve.
         */
        getPreference: function (id) {
            return this.base.getPreference(this.prefix + id);
        },
        
        /**
         * Gets the prefixed preference
         * 
         * @param {string} id Name of the preference for which the value should be retrieved
         * @param {Object=} context Optional context object to change the preference lookup
         */
        get: function (id, context) {
            return this.base.get(this.prefix + id, context);
        },
        
        /**
         * Gets the location in which the value of a prefixed preference has been set.
         * 
         * @param {string} id Name of the preference for which the value should be retrieved
         * @param {Object=} context Optional context object to change the preference lookup
         * @return {{scope: string, layer: ?string, layerID: ?object}} Object describing where the preferences came from
         */
        getPreferenceLocation: function (id, context) {
            return this.base.getPreferenceLocation(this.prefix + id, context);
        },
        
        /**
         * Sets the prefixed preference
         * 
         * @param {string} id Identifier of the preference to set
         * @param {Object} value New value for the preference
         * @param {{location: ?Object, context: ?Object}=} options Specific location in which to set the value or the context to use when setting the value
         * @return {boolean} true if a value was set
         */
        set: function (id, value, options) {
            return this.base.set(this.prefix + id, value, options);
        },
        
        /**
         * @private
         * 
         * Listens for events on the base PreferencesSystem to filter down to the
         * events that consumers of this PreferencesSystem would be interested in.
         */
        _installListener: function () {
            if (this._listenerInstalled) {
                return;
            }
            var $this = $(this),
                prefix = this.prefix;
            
            var onlyWithPrefix = function (id) {
                if (id.substr(0, prefix.length) === prefix) {
                    return true;
                }
                return false;
            };
            
            var withoutPrefix = function (id) {
                return id.substr(prefix.length);
            };
            
            $(this.base).on(PREFERENCE_CHANGE, function (e, data) {
                var prefixedIds = data.ids.filter(onlyWithPrefix);
                
                if (prefixedIds.length > 0) {
                    $this.trigger(PREFERENCE_CHANGE, {
                        ids: prefixedIds.map(withoutPrefix)
                    });
                }
            });
            
            this._listenerInstalled = true;
        },
        
        /**
         * Sets up a listener for events for this PrefixedPreferencesSystem. Only prefixed events
         * will notify. Optionally, you can set up a listener for a
         * specific preference.
         * 
         * @param {string} event Name of the event to listen for
         * @param {string|Function} preferenceID Name of a specific preference or the handler function
         * @param {?Function} handler Handler for the event
         */
        on: function (event, preferenceID, handler) {
            if (typeof preferenceID === "function") {
                handler = preferenceID;
                preferenceID = null;
            }
            
            if (preferenceID) {
                var pref = this.getPreference(preferenceID);
                pref.on(event, handler);
            } else {
                this._installListener();
                $(this).on(event, handler);
            }
        },
        
        /**
         * Turns off the event handlers for a given event, optionally for a specific preference
         * or a specific handler function.
         * 
         * @param {string} event Name of the event for which to turn off listening
         * @param {string|Function} preferenceID Name of a specific preference or the handler function
         * @param {?Function} handler Specific handler which should stop being notified
         */
        off: function (event, preferenceID, handler) {
            if (typeof preferenceID === "function") {
                handler = preferenceID;
                preferenceID = null;
            }
            
            if (preferenceID) {
                var pref = this.getPreference(preferenceID);
                pref.off(event, handler);
            } else {
                $(this).off(event, handler);
            }
        },
        
        /**
         * Saves the preferences. If a save is already in progress, a Promise is returned for
         * that save operation.
         * 
         * @return {Promise} Resolved when the preferences are done saving.
         */
        save: function () {
            return this.base.save();
        }
    };
    
    /**
     * PreferencesSystem ties everything together to provide a simple interface for
     * managing the whole prefs system.
     * 
     * It keeps track of multiple Scope levels and also manages path-based Scopes.
     * 
     * It also provides the ability to register preferences, which gives a fine-grained
     * means for listening for changes and will ultimately allow for automatic UI generation.
     */
    function PreferencesSystem() {
        this._knownPrefs = {};
        this._scopes = {
            "default": new Scope(new MemoryStorage())
        };
        
        this._scopes["default"].load();
        
        this._defaultContext = {
            scopeOrder: ["default"]
        };
        
        this._pendingScopes = {};
        this._pendingEvents = {};
        
        this._saveInProgress = false;
        this._nextSaveDeferred = null;
        
        this._pathScopes = {};
        
        var notifyPrefChange = function (id) {
            var pref = this._knownPrefs[id];
            if (pref) {
                $(pref).trigger(PREFERENCE_CHANGE);
            }
        }.bind(this);
        
        // When we signal a general change message on this manager, we also signal a change
        // on the individual preference object.
        $(this).on(PREFERENCE_CHANGE, function (e, data) {
            data.ids.forEach(notifyPrefChange);
        }.bind(this));
    }
    
    _.extend(PreferencesSystem.prototype, {
        
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
            var pref = this._knownPrefs[id] = new Preference({
                type: type,
                initial: initial,
                name: options.name,
                description: options.description
            });
            this.set(id, initial, {
                location: {
                    scope: "default"
                }
            });
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
         * @private
         * 
         * Adds the new Scope to the scope order in the correct place.
         * If the Scope before which this new Scope is being added does not
         * yet exist, the Scope is held in a "pending scopes" list to be added
         * once the before Scope is ready.
         * 
         * Adding a Scope "before" another Scope means that the new Scope's preferences
         * will take priority over the "before" Scope's preferences.
         * 
         * @param {string} id Name of the new Scope
         * @param {?string} addBefore Name of the Scope before which this new one is added
         */
        _addToScopeOrder: function (id, addBefore) {
            var defaultScopeOrder = this._defaultContext.scopeOrder;
            
            if (!addBefore) {
                defaultScopeOrder.unshift(id);
                this._processPendingEvents(id);
            } else {
                var addIndex = defaultScopeOrder.indexOf(addBefore);
                if (addIndex > -1) {
                    defaultScopeOrder.splice(addIndex, 0, id);
                    this._processPendingEvents(id);
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
                    this._addToScopeOrder(scopeID, id);
                }.bind(this));
            }
        },
        
        /**
         * @private
         * 
         * When a Scope is loading and hasn't yet been added to the `scopeOrder`,
         * we accumulate any change notifications that it sends and re-send them
         * once the Scope has been added to `scopeOrder`. If the notifications were
         * sent out before the Scope has been added, then listeners who request the
         * changed values will actually get the old values.
         * 
         * @param {string} id Name of the Scope that has been added.
         */
        _processPendingEvents: function (id) {
            // Remove the preload listener and add the final listener
            var $scope = $(this._scopes[id]);
            $scope.off(".preload");
            $scope.on(PREFERENCE_CHANGE, function (e, data) {
                $(this).trigger(PREFERENCE_CHANGE, data);
            }.bind(this));
            
            // Resend preference IDs from the preload events
            if (this._pendingEvents[id]) {
                var ids = _.union.apply(null, this._pendingEvents[id]);
                delete this._pendingEvents[id];
                $(this).trigger(PREFERENCE_CHANGE, {
                    ids: ids
                });
            }
        },
        
        /**
         * Adds a new Scope. New Scopes are added at the highest precedence, unless the "before" option
         * is given. The new Scope is automatically loaded.
         * 
         * @param {string} id Name of the Scope
         * @param {Scope|Storage} scope the Scope object itself. Optionally, can be given a Storage directly for convenience
         * @param {{before: string}} options optional behavior when adding (e.g. setting which scope this comes before)
         * @return {Promise} Promise that is resolved when the Scope is loaded. It is resolved
         *                   with id and scope.
         */
        addScope: function (id, scope, options) {
            options = options || {};
            
            if (this._scopes[id]) {
                throw new Error("Attempt to redefine preferences scope: " + id);
            }
            
            // Check to see if "scope" might be a Storage instead
            if (!scope.get) {
                scope = new Scope(scope);
            }
            
            // Change events from the Scope should propagate to listeners
            $(scope).on(PREFERENCE_CHANGE + ".preload", function (e, data) {
                if (!this._pendingEvents[id]) {
                    this._pendingEvents[id] = [];
                }
                this._pendingEvents[id].push(data.ids);
            }.bind(this));
            
            var deferred = $.Deferred();
            
            scope.load()
                .then(function () {
                    this._scopes[id] = scope;
                    this._addToScopeOrder(id, options.before);
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
         * Removes a Scope from this PreferencesSystem. Returns without doing anything
         * if the Scope does not exist. Notifies listeners of preferences that may have
         * changed.
         * 
         * @param {string} id Name of the Scope to remove
         */
        removeScope: function (id) {
            var scope = this._scopes[id];
            if (!scope) {
                return;
            }
            delete this._scopes[id];
            _.pull(this._defaultContext.scopeOrder, id);
            $(scope).off(PREFERENCE_CHANGE);
            var keys = scope.getKeys();
            $(this).trigger(PREFERENCE_CHANGE, {
                ids: keys
            });
        },
        
        /**
         * Get the current value of a preference. The optional context provides a way to
         * change scope ordering or the reference filename for path-based scopes.
         * 
         * @param {string} id Name of the preference for which the value should be retrieved
         * @param {?Object} context Optional context object to change the preference lookup
         */
        get: function (id, context) {
            var scopeCounter;
            
            context = context || this._defaultContext;
            
            var scopeOrder = context.scopeOrder || this._defaultContext.scopeOrder;
            
            for (scopeCounter = 0; scopeCounter < scopeOrder.length; scopeCounter++) {
                var scope = this._scopes[scopeOrder[scopeCounter]];
                var result = scope.get(id, context);
                if (result !== undefined) {
                    return result;
                }
            }
        },
        
        /**
         * Gets the location in which the value of a preference has been set.
         * 
         * @param {string} id Name of the preference for which the value should be retrieved
         * @param {Object=} context Optional context object to change the preference lookup
         * @return {{scope: string, layer: ?string, layerID: ?object}} Object describing where the preferences came from
         */
        getPreferenceLocation: function (id, context) {
            var scopeCounter,
                scopeName;
            
            context = context || this._defaultContext;
            
            var scopeOrder = context.scopeOrder || this._defaultContext.scopeOrder;
            
            for (scopeCounter = 0; scopeCounter < scopeOrder.length; scopeCounter++) {
                scopeName = scopeOrder[scopeCounter];
                var scope = this._scopes[scopeName];
                var result = scope.getPreferenceLocation(id, context);
                if (result !== undefined) {
                    result.scope = scopeName;
                    return result;
                }
            }
        },
        
        /**
         * Sets a preference and notifies listeners that there may
         * have been a change. By default, the preference is set in the same location in which
         * it was defined except for the "default" scope. If the current value of the preference
         * comes from the "default" scope, the new value will be set at the level just above
         * default.
         * 
         * @param {string} id Identifier of the preference to set
         * @param {Object} value New value for the preference
         * @param {{location: ?Object, context: ?Object}=} options Specific location in which to set the value or the context to use when setting the value
         * @return {boolean} true if a value was set
         */
        set: function (id, value, options) {
            options = options || {};
            var context = options.context || this._defaultContext,
                
                // The case where the "default" scope was chosen specifically is special.
                // Usually "default" would come up only when a preference did not have any
                // user-set value, in which case we'd want to set the value in a different scope.
                forceDefault = options.location && options.location.scope === "default" ? true : false,
                location = options.location || this.getPreferenceLocation(id, context);
            
            if (!location || (location.scope === "default" && !forceDefault)) {
                // The default scope for setting a preference is the lowest priority
                // scope after "default".
                if (context.scopeOrder.length > 1) {
                    location = {
                        scope: context.scopeOrder[context.scopeOrder.length - 2]
                    };
                } else {
                    return false;
                }
            }
            var scope = this._scopes[location.scope];
            if (!scope) {
                return false;
            }
            
            var wasSet = scope.set(id, value, context, location);
            if (wasSet) {
                $(this).trigger(PREFERENCE_CHANGE, {
                    ids: [id]
                });
            }
            return wasSet;
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
            
            Async.doInParallel(_.values(this._scopes), function (scope) {
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
        },
        
        /**
         * Path Scopes provide special handling for scopes that are managed by a
         * collection of files in the file tree. The idea is that files are
         * searched for going up the file tree to the root.
         * 
         * This function just sets up the path scopes. You need to call
         * `setPathScopeContext` to activate the path scopes. If a path scope context
         * is already set, the new path scopes will be activated automatically.
         * 
         * The `scopeGenerator` is an object that provides the following:
         * * `before`: all scopes added will be before (higher precedence) this named scope
         * * `checkExists`: takes an absolute filename and determines if there is a valid file there. Returns a promise resolving to a boolean.
         * * `getScopeForFile`: Called after checkExists. Synchronously returns a Scope object for the given file. Only called where `checkExists` is true.
         * 
         * @param {string} preferencesFilename Name for the preferences files managed by this scopeGenerator (e.g. `.brackets.json`)
         * @param {ScopeGenerator} scopeGenerator defines the behavior used to generate scopes for these files
         * @return {Promise} promise resolved when the scopes have been added.
         */
        addPathScopes: function (preferencesFilename, scopeGenerator) {
            this._pathScopes[preferencesFilename] = scopeGenerator;
            
            if (this._defaultContext.filename) {
                return this.setPathScopeContext(this._defaultContext.filename);
            } else {
                return new $.Deferred().resolve().promise();
            }
        },
        
        /**
         * Sets the current path scope context. This causes a reloading of paths as needed.
         * Paths that are common between the old and new context files are not reloaded.
         * All path scopes are updated by this function.
         * 
         * Notifications are sent for any preferences that may have changed value as a result
         * of this operation.
         * 
         * @param {string} contextFilename New filename used to resolve preferences
         * @return {Promise} resolved when the path scope context change is complete. Note that *this promise is resolved before the scopes are done loading*.
         */
        setPathScopeContext: function (contextFilename) {
            var defaultContext = this._defaultContext,
                oldFilename = this._defaultContext.filename,
                oldContext = {
                    filename: oldFilename
                },
                oldParts = oldFilename ? oldFilename.split("/") : [],
                parts = _.initial(contextFilename.split("/")),
                loadingPromises = [],
                self = this,
                result = new $.Deferred(),
                scopesToCheck = [],
                scopeAdders = [],
                notificationKeys = [];
            
            defaultContext.filename = contextFilename;
            
            // Loop over the path scopes
            _.forIn(this._pathScopes, function (scopeGenerator, preferencesFilename) {
                var lastSeen = scopeGenerator.before,
                    counter,
                    scopeNameToRemove;
                
                // First, look for how much is common with the old filename
                for (counter = 0; counter < parts.length && counter < oldParts.length; counter++) {
                    if (parts[counter] !== oldParts[counter]) {
                        break;
                    }
                }
                
                // Remove all of the scopes that weren't the same in old and new
                for (counter = counter + 1; counter < oldParts.length; counter++) {
                    scopeNameToRemove = "path:" + _.first(oldParts, counter).join("/") + "/" + preferencesFilename;
                    self.removeScope(scopeNameToRemove);
                }
                
                // Now add new scopes as required
                _.forEach(parts, function (part, i) {
                    var prefDirectory, filename, scope, scopeName, pathLayer, pathLayerFilename;
                    prefDirectory = _.first(parts, i + 1).join("/") + "/";
                    filename = prefDirectory + preferencesFilename;
                    scopeName = "path:" + filename;
                    scope = self._scopes[scopeName];
                    
                    // Check to see if the scope already exists
                    if (scope) {
                        lastSeen = scopeName;
                        // The old values could have changed, as well as the new values
                        notificationKeys.push(scope.getKeys(oldContext));
                        notificationKeys.push(scope.getKeys(defaultContext));
                    } else {
                        // New scope. First check to see if the file exists.
                        scopesToCheck.unshift(scopeGenerator.checkExists(filename));
                        
                        // Keep a function closure for the scope that will be added
                        // if checkExists is true. We store these so that we can
                        // run them in order.
                        scopeAdders.unshift(new PathScopeAdder(filename, scopeName, scopeGenerator, lastSeen));
                    }
                });
            });
            
            // Notify listeners of all possible key changes for already loaded scopes
            // New scopes will notify as soon as the data is loaded.
            if (notificationKeys.length > 0) {
                $(this).trigger(PREFERENCE_CHANGE, {
                    ids: _.union.apply(null, notificationKeys)
                });
            }
            
            // When all of the scope checks are done, run through them in order
            // and then call the adders for each file that exists.
            $.when.apply(this, scopesToCheck).done(function () {
                var i, before, scopeAdder;
                for (i = 0; i < arguments.length; i++) {
                    if (arguments[i]) {
                        scopeAdder = scopeAdders[i];
                        if (!before) {
                            before = scopeAdder.before;
                        }
                        loadingPromises.push(scopeAdder.add(self, before));
                    }
                }
                result.resolve();
            });
            
            return result.promise();
        },
        
        /**
         * Augments the context object passed in with information from the default context.
         * For example, if you want to create a context for a specific file while maintaining
         * the default scopeOrder, you can pass in an object with just the filename and the
         * scopeOrder will be added.
         * 
         * *This method changes the object passed in.*
         * 
         * @param {Object} context context object to augment
         * @return {Object} the same context object that was passed in.
         */
        buildContext: function (context) {
            return _.defaults(context, this._defaultContext);
        },
        
        /**
         * Sets up a listener for events. Optionally, you can set up a listener for a
         * specific preference.
         * 
         * @param {string} event Name of the event to listen for
         * @param {string|Function} preferenceID Name of a specific preference or the handler function
         * @param {?Function} handler Handler for the event
         */
        on: function (event, preferenceID, handler) {
            if (typeof preferenceID === "function") {
                handler = preferenceID;
                preferenceID = null;
            }
            
            if (preferenceID) {
                var pref = this.getPreference(preferenceID);
                pref.on(event, handler);
            } else {
                $(this).on(event, handler);
            }
        },
        
        /**
         * Turns off the event handlers for a given event, optionally for a specific preference
         * or a specific handler function.
         * 
         * @param {string} event Name of the event for which to turn off listening
         * @param {string|Function} preferenceID Name of a specific preference or the handler function
         * @param {?Function} handler Specific handler which should stop being notified
         */
        off: function (event, preferenceID, handler) {
            if (typeof preferenceID === "function") {
                handler = preferenceID;
                preferenceID = null;
            }
            
            if (preferenceID) {
                var pref = this.getPreference(preferenceID);
                pref.off(event, handler);
            } else {
                $(this).off(event, handler);
            }
        },
        
        /**
         * Tells the PreferencesSystem that the given file has been changed so that any
         * related Scopes can be reloaded.
         * 
         * @param {string} filename Name of the file that has changed
         */
        fileChanged: function (filename) {
            _.forEach(this._scopes, function (scope) {
                scope.fileChanged(filename);
            });
        },
        
        /**
         * Retrieves a PreferencesSystem in which all preference access is prefixed.
         * This helps provide namespacing so that different preferences consumers do
         * not interfere with one another.
         * 
         * The prefix provided has a `.` character appended when preference lookups are
         * done.
         */
        getPrefixedSystem: function (prefix) {
            return new PrefixedPreferencesSystem(this, prefix + ".");
        }
    });
    
    // Public interface
    exports.PreferencesSystem  = PreferencesSystem;
    exports.Scope              = Scope;
    exports.MemoryStorage      = MemoryStorage;
    exports.PathLayer          = PathLayer;
    exports.FileStorage        = FileStorage;
});