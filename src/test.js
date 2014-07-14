
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global require, define, window, brackets, navigator */

/**
 * The boostrapping module for brackets. This module sets up the require 
 * configuration and loads the brackets module.
 */
require.config({
    paths: {
        "text"              : "thirdparty/text/text",
        "i18n"              : "thirdparty/i18n/i18n",
        
        // The file system implementation. Change this value to use different 
        // implementations (e.g. cloud-based storage).
        "fileSystemImpl"    : "filesystem/impls/appshell/AppshellFileSystem1"
    }
});

define(function (require, exports, module) {
    "use strict";
    
    // Load the brackets module. This is a self-running module that loads and runs the entire application.
    require("test2");
});
