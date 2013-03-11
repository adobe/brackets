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


/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true,
indent: 4, maxerr: 50 */
/*global define, describe, it, xit, expect, beforeEach, afterEach, waits,
waitsFor, runs, $, brackets, waitsForDone */

define(function (require, exports, module) {
    "use strict";
    
    var AppInit              = require("utils/AppInit"),
        ExtensionUtils       = require("utils/ExtensionUtils"),
        FileUtils            = require("file/FileUtils"),
        StringUtils          = require("utils/StringUtils"),
        Strings              = require("strings"),
        NodeConnection       = require("utils/NodeConnection");
    
    /**
     * @const
     * Amount of time to wait before automatically rejecting the connection
     * deferred. If we hit this timeout, we'll never have a node connection
     * for the static server in this run of Brackets.
     */
    var NODE_CONNECTION_TIMEOUT = 30000; // 30 seconds
    
    /**
     * @private
     * @type{jQuery.Deferred.<NodeConnection>}
     * A deferred which is resolved with a NodeConnection or rejected if
     * we are unable to connect to Node.
     */
    var _nodeConnectionDeferred = $.Deferred();
    
    function validate(path) {
        var d = $.Deferred();
        _nodeConnectionDeferred.done(function (nodeConnection) {
            if (nodeConnection.connected()) {
                nodeConnection.domains.extensions.validate(path)
                    .done(function (result) {
                        var i;
                        var errors = result[0];
                        for (i = 0; i < errors.length; i++) {
                            var formatArguments = errors[i];
                            formatArguments[0] = Strings[formatArguments[0]];
                            errors[i] = StringUtils.format.apply(window, formatArguments);
                        }
                        
                        d.resolve({
                            errors: result[0],
                            metadata: result[1]
                        });
                    });
            }
        });
        return d.promise();
    }
    
    /**
     * Allows access to the deferred that manages the node connection. This
     * is *only* for unit tests. Messing with this not in testing will
     * potentially break everything.
     *
     * @private
     * @return {jQuery.Deferred} The deferred that manages the node connection
     */
    function _getNodeConnectionDeferred() {
        return _nodeConnectionDeferred;
    }
    
    AppInit.appReady(function () {
        // Start up the node connection, which is held in the
        // _nodeConnectionDeferred module variable. (Use 
        // _nodeConnectionDeferred.done() to access it.
        var connectionTimeout = setTimeout(function () {
            console.error("[Extensions] Timed out while trying to connect to node");
            _nodeConnectionDeferred.reject();
        }, NODE_CONNECTION_TIMEOUT);
        
        var _nodeConnection = new NodeConnection();
        _nodeConnection.connect(true).then(function () {
            var domainPath = FileUtils.getNativeBracketsDirectoryPath() + "/" + FileUtils.getNativeModuleDirectoryPath(module) + "/node/ExtensionsDomain";
            _nodeConnection.loadDomains(domainPath, true)
                .then(
                    function () {
                        clearTimeout(connectionTimeout);
                        _nodeConnectionDeferred.resolveWith(null, [_nodeConnection]);
                    },
                    function () { // Failed to connect
                        console.error("[Extensions] Failed to connect to node", arguments);
                        _nodeConnectionDeferred.reject();
                    }
                );
        });
    });

    // For unit tests only
    exports._getNodeConnectionDeferred = _getNodeConnectionDeferred;

    
    exports.validate = validate;
});