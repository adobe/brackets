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
/*global define, window, $, brackets */
/*unittests: ExtensionManager*/

/**
 * The ExtensionManager fetches/caches/filters the extension registry and provides
 * information about the status of installed extensions. ExtensionManager raises the 
 * following events:
 *     statusChange - indicates that the status of an extension has changed. Second 
 *          parameter is the extension's ID (or its local folder path for legacy 
 *          extensions with no package json). Third parameter is the new status, which 
 *          is one of the status constants below.
 */

define(function (require, exports, module) {
    "use strict";
    
    var FileUtils        = require("file/FileUtils"),
        NativeFileSystem = require("file/NativeFileSystem").NativeFileSystem,
        ExtensionLoader  = require("utils/ExtensionLoader");
    
    /**
     * Extension status constants.
     */
    var NOT_INSTALLED = "not_installed",
        ENABLED       = "enabled";
    
    /**
     * @private
     * @type {Object}
     * The current registry JSON downloaded from the server.
     */
    var _registry = null;
    
    /**
     * @private
     * @type {Object.<string, {metadata: Object, path: string, status: string}>}
     * A list of local extensions. The keys are either ids (for extensions that have package metadata) or
     * local file paths (for legacy extensions with no package metadata). The fields of each record are:
     *     metadata: the package metadata loaded from the local package.json, or null if it's a legacy extension
     *     path: the local path to the extension folder on disk
     *     status: the current status, one of the status constants above
     */
    var _extensions = {};
    
    /**
     * @private
     * Clears out our existing data. For unit testing only.
     */
    function _reset() {
        _registry = null;
        _extensions = {};
    }

    /**
     * Returns the registry of Brackets extensions and caches the result for subsequent
     * calls.
     *
     * @param {boolean} forceDownload Fetch the registry from S3 even if we have a cached copy.
     * @return {$.Promise} a promise that's resolved with the registry JSON data
     * or rejected if the server can't be reached.
     */
    function getRegistry(forceDownload) {
        if (!_registry || forceDownload) {
            return $.getJSON(brackets.config.extension_registry, {cache: false})
                .done(function (data) {
                    _registry = data;
                });
        } else {
            return new $.Deferred().resolve(_registry).promise();
        }
    }
    
    /**
     * @private
     * Loads the package.json file in the given extension folder.
     * @param {string} folder The extension folder.
     * @return {$.Promise} A promise object that is resolved with the parsed contents of the package.json file,
     *     or rejected if there is no package.json or the contents are not valid JSON.
     */
    function _loadPackageJson(folder) {
        var result = new $.Deferred();
        FileUtils.readAsText(new NativeFileSystem.FileEntry(folder + "/package.json"))
            .done(function (text) {
                try {
                    var json = JSON.parse(text);
                    result.resolve(json);
                } catch (e) {
                    result.reject();
                }
            })
            .fail(function () {
                result.reject();
            });
        return result.promise();
    }
    
    /**
     * @private
     * When an extension is loaded, fetches the package.json and stores the extension in our map.
     * @param {$.Event} e The event object
     * @param {string} path The local path of the loaded extension's folder.
     */
    function _handleExtensionLoad(e, path) {
        function setData(id, metadata) {
            _extensions[id] = {
                metadata: metadata,
                path: path,
                status: ENABLED
            };
            $(exports).triggerHandler("statusChange", [id, ENABLED]);
        }
        
        _loadPackageJson(path)
            .done(function (metadata) {
                setData(metadata.name, metadata);
            })
            .fail(function () {
                // If there's no package.json, this is a legacy extension. It was successfully loaded,
                // but we don't have an official ID or metadata for it, so we just store it by its
                // local path and record that it's enabled.
                setData(path, null);
            });
    }
    
    /**
     * Returns the status of the extension with the given id.
     * @param {string} id The ID of the extension, or for legacy extensions, the local file path.
     * @return {string} The extension's status; one of the constants above
     */
    function getStatus(id) {
        return (_extensions[id] && _extensions[id].status) || NOT_INSTALLED;
    }
    
    // Listen to extension load events
    $(ExtensionLoader).on("load", _handleExtensionLoad);

    // Public exports
    exports.getRegistry = getRegistry;
    exports.getStatus = getStatus;
    
    exports.NOT_INSTALLED = NOT_INSTALLED;
    exports.ENABLED = ENABLED;

    // For unit testing only
    exports._reset = _reset;
});