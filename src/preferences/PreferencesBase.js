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
/*jslint plusplus:true, vars: true, nomen: true */
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
        this.storage = storage;
        $(storage).on("changed", this.load.bind(this));
        this.data = {};
        this._dirty = false;
        this._layers = [];
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
                return this.storage.save(this.data).done(function () {
                    self._dirty = false;
                });
            } else {
                return $.Deferred().resolve().promise();
            }
        },
        
        /**
         * Sets the value for `id` at the given level and sends out notifications if
         * the merged value has actually changed.
         * 
         * @param {string} id Key to set
         * @param {*} value Value for this key
         * @return {boolean} true if the value was changed
         */
        set: function (id, value) {
            // Scopes do not support changing settings on layers at this
            // time. Ultimately, the need to do so will be based on
            // UI.
            this._dirty = true;
            this.data[id] = value;
        },
        
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
                return this.data[id];
            }
        },
        
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
        
        addLayer: function (layer) {
            this._layers.push(layer);
            this._exclusions.push(layer.key);
            $(this).trigger(PREFERENCE_CHANGE, {
                ids: layer.getKeys(this.data[layer.key], {})
            });
        }
    });
    
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
            if (!data) {
                return;
            }
            
            var relativeFilename = _getRelativeFilename(this.prefFilePath, context.filename);
            
            if (!relativeFilename) {
                return;
            }
            
            var glob = this._findMatchingGlob(data, relativeFilename);
            
            if (!glob) {
                return;
            }
            
            return data[glob][id];
        },
        
        getKeys: function (data, context) {
            if (!data) {
                return;
            }
            
            var relativeFilename = _getRelativeFilename(this.prefFilePath, context.filename);
            
            if (relativeFilename) {
                var glob = this._findMatchingGlob(data, relativeFilename);
                if (glob) {
                    return _.keys(data[glob]);
                } else {
                    return [];
                }
            }
            return _.union.apply(null, _.map(_.values(data), _.keys));
        },
        
        /**
         * @private
         * 
         * Look for a matching file glob among the collection of paths.
         * 
         * @param {Object} pathData The keys are globs and the values are the preferences for that glob
         * @param {string} filename relative filename to match against the globs
         */
        _findMatchingGlob: function (pathData, filename) {
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
    };
    
    function PathScopeAdder(filename, scopeName, scopeGenerator, before) {
        this.filename = filename;
        this.scopeName = scopeName;
        this.scopeGenerator = scopeGenerator;
        this.before = before;
    }
    
    PathScopeAdder.prototype = {
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
    
    function Preference(properties) {
        _.extend(this, properties);
    }
    
    _.extend(Preference.prototype, {
        on: function (event, handler) {
            $(this).on(event, handler);
        },
        
        off: function (event, handler) {
            $(this).off(event, handler);
        }
    });
    
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
        this._knownPrefs = {};
        this._scopes = {
            "default": new Scope(new MemoryStorage())
        };
        
        this._scopes["default"].load();
        
        this._defaultContext = {
            scopeOrder: ["default"]
        };
        
        this._pendingScopes = {};
        
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
            var pref = this._knownPrefs[id] = new Preference({
                type: type,
                initial: initial,
                name: options.name,
                description: options.description
            });
            this.set("default", id, initial);
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
        
        _addToScopeOrder: function (id, addBefore) {
            var defaultScopeOrder = this._defaultContext.scopeOrder;
            
            if (!addBefore) {
                defaultScopeOrder.unshift(id);
            } else {
                var addIndex = defaultScopeOrder.indexOf(addBefore);
                if (addIndex > -1) {
                    defaultScopeOrder.splice(addIndex, 0, id);
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
         * Adds a new Scope. New Scopes are added at the highest precedence. The new Scope
         * is automatically loaded.
         * 
         * @param {string} id Name of the Scope
         * @param {Scope} scope the Scope object itself. Can be given a Storage directly for convenience
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
            
            $(scope).on(PREFERENCE_CHANGE, function (e, data) {
                $(this).trigger(PREFERENCE_CHANGE, data);
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
         * Removes a Scope from this PreferencesManager. Returns without doing anything
         * if the Scope does not exist.
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
        
        get: function (id, context) {
            var scopeCounter,
                scopeOrder = this._defaultContext.scopeOrder;
            
            context = context || this._defaultContext;
            
            for (scopeCounter = 0; scopeCounter < scopeOrder.length; scopeCounter++) {
                var scope = this._scopes[scopeOrder[scopeCounter]];
                var result = scope.get(id, context);
                if (result !== undefined) {
                    return result;
                }
            }
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
            var scope = this._scopes[scopeName];
            if (!scope) {
                throw new Error("Attempt to set preference in non-existent scope: " + scopeName);
            }
            
            scope.set(id, value);
            $(this).trigger(PREFERENCE_CHANGE, {
                ids: [id]
            });
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
         * `setPathScopeContext` to activate the path scopes.
         * 
         * The `scopeGenerator` is an object that provides the following:
         * * `before`: all scopes added will be before (higher precedence) this named scope
         * * `checkExists`: takes an absolute filename and determines if there is a valid file there. Returns a promise resolving to a boolean.
         * * `getScopeForFile`: Called after checkExists. Synchronously returns a Scope object for the given file. Only called where `checkExists` is true.
         * 
         * @param {string} preferencesFilename Name for the preferences files managed by this scopeGenerator (e.g. `.brackets.prefs`)
         * @param {Object} scopeGenerator defines the behavior used to generate scopes for these files
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
        }
    });
    
    // Public interface
    exports.PreferencesManager = PreferencesManager;
    exports.Scope = Scope;
    exports.MemoryStorage = MemoryStorage;
    exports.PathLayer = PathLayer;
    exports.FileStorage = FileStorage;
});