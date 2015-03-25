/*
 * Copyright (c) 2015 Adobe Systems Incorporated. All rights reserved.
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
/*global define, $ */

define(function (require, exports, module) {
    "use strict";
    
    var ExtensionManager = require("extensibility/ExtensionManager");
    
    /**
     * Get the OS Version
     * @return {String} version of OS 
     */
    function getOSVersion() {
        var winOSStrings = {
            "5.0" : "Windows 2000",
            "5.1" : "Windows XP",
            "5.2" : "Windows XP | Windows Server 2003 | Windows Home Server",
            "6.0" : "Windows Vista | Windows Server 2008",
            "6.1" : "Windows 7 | Widnows Server 2008 | Widnows Home Server 2011",
            "6.2" : "Windows 8 | Windows Server 2012",
            "6.3" : "Windows 8.1 | Windows Server 2012 R2",
            "10.0" : "Windows 10"
        };
        
        var windowRegex = /Windows NT (\d+\.\d+)/i,
            macRegex    = /Macintosh;\s([\w\W]+?)(\)|;)[\w\W]+/i,
            linuxRegex  = /X11;\s([\w\W]+?)(\)|;)[\w\W]+/i;
        
        var userAgent = navigator.userAgent;
        var osVersion = userAgent;
        
        if (/Windows/.test(userAgent)) {
            osVersion = winOSStrings[windowRegex.exec(userAgent)[1]] || osVersion;
        } else if (/Mac/.test(userAgent)) {
            osVersion = macRegex.exec(userAgent)[1] || osVersion;
        } else if (/X11/.test(userAgent)) {
            osVersion = linuxRegex.exec(userAgent) || osVersion;
        }
        
        return osVersion;
    }
    
    /**
     * @private
     * Check for each user installed extensions if present in registry.
     * @param {Object} object that contains information about extensions fetched from registry
     * @param {Object} all user installed extensions
     * return {Array} userInstalledExtensions
     */
    function getUserExtensionsInRegistry(registryObject, userExtensions) {
        var userInstalledExtensions = [];
        Object.keys(userExtensions).forEach(function (extensionId) {
            
            var extension = userExtensions[extensionId],
                registryExtension = registryObject[extensionId];
            
            if (extension && extension.installInfo && registryExtension) {
                userInstalledExtensions.push({"name" : extension.installInfo.metadata.name, "version" : extension.installInfo.metadata.version});
            }
        });
        
        return userInstalledExtensions;
    }
   
    /**
     * Utility function to get the user installed extension which are present in the registry
     */
    function getInstalledExtensions() {
        var result = new $.Deferred();
        var registryExtensions = ExtensionManager.registryObject,
            userExtensions = ExtensionManager.userExtensions;
        
        if (Object.keys(registryExtensions).length === 0) {
            ExtensionManager.downloadRegistry().done(function () {
                return result.resolve(getUserExtensionsInRegistry(ExtensionManager.registryObject, userExtensions));
            })
                .fail(function () {
                    return result.resolve([]);
                });
        } else {
            return result.resolve(getUserExtensionsInRegistry(registryExtensions, userExtensions));
        }
        
        return result.promise();
    }
    
    exports.getOSVersion             = getOSVersion;
    exports.getInstalledExtensions   = getInstalledExtensions;
});