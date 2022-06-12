/*
 * Copyright (c) 2013 - present Adobe Systems Incorporated. All rights reserved.
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

define(function (require, exports, module) {
    "use strict";


    var AppInit              = brackets.getModule("utils/AppInit"),
        PreferencesManager   = brackets.getModule("preferences/PreferencesManager"),
        Strings              = brackets.getModule("strings"),
        FileViewController   = brackets.getModule("project/FileViewController"),
        ExtensionUtils       = brackets.getModule("utils/ExtensionUtils"),
        NodeDomain           = brackets.getModule("utils/NodeDomain"),
        FileUtils            = brackets.getModule("file/FileUtils"),
        FileSystem           = brackets.getModule("filesystem/FileSystem"),
        GraphicsFile         = require("GraphicsFile");

    /**
     * @private
     * @type {string} fullPath of the OpenWithExternalEditor Domain implementation
     */
    var _domainPath = ExtensionUtils.getModulePath(module, "node/OpenWithExternalApplicationDomain");

    /**
     * @private
     * @type {NodeDomain}
     */
    var _nodeDomain = new NodeDomain("OpenWithExternalApplication", _domainPath);

    var extensionToExtApplicationMap = {};

    function convertUnixPathToWindowsPath(path) {
        if (brackets.platform === "win" && path && FileSystem.isAbsolutePath(path)) {
           path = path.replace(RegExp('/','g'), '\\');
        }
        return path;
    }

    function _openWithExternalApplication(event, path) {
        _nodeDomain.exec("open", {
            path: convertUnixPathToWindowsPath(path),
            app: extensionToExtApplicationMap[FileUtils.getFileExtension(path).toLowerCase()]
        });
    }

    PreferencesManager.definePreference("externalApplications", "object", {}, {
        description: Strings.DESCRIPTION_EXTERNAL_APPLICATION_ASSOCIATE
    });

    PreferencesManager.on("change", "externalApplications", function () {
        extensionToExtApplicationMap = PreferencesManager.get("externalApplications");
        FileUtils.addExtensionToExternalAppList(Object.keys(extensionToExtApplicationMap));
    });

    FileViewController.on("openWithExternalApplication", _openWithExternalApplication);

    AppInit.appReady(function () {
        
        GraphicsFile.init(_nodeDomain);
        extensionToExtApplicationMap = PreferencesManager.get("externalApplications");
        FileUtils.addExtensionToExternalAppList(Object.keys(extensionToExtApplicationMap));
    });
});
