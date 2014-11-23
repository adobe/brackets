/*
 * Copyright (c) 2012 Adobe Systems Incorporated. All rights reserved.
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
/*global $, define, brackets, window */

/**
 * This file provides the interface to user visible strings in Brackets. Code that needs
 * to display strings should should load this module by calling `var Strings = require("strings")`.
 * The i18n plugin will dynamically load the strings for the right locale and populate
 * the exports variable. See src\nls\strings.js for the master file of English strings.
 */
define(function (require, exports, module) {
    "use strict";
    
    var _ = require("thirdparty/lodash");
    
    var strings     = require("i18n!nls/strings"),
        urls        = require("i18n!nls/urls"),
        stringsApp  = require("i18n!nls/strings-app"),
        StringUtils = require("utils/StringUtils");

    // make sure the global brackets variable is loaded
    require("utils/Global");

    // Add URLs as additional globals
    var additionalGlobals = $.extend({}, urls),
        parsedVersion = /([0-9]+)\.([0-9]+)\.([0-9]+)/.exec(brackets.metadata.version);
    
    additionalGlobals.APP_NAME      = brackets.metadata.name || strings.APP_NAME;
    additionalGlobals.APP_TITLE     = brackets.config.app_title || strings.APP_NAME;
    additionalGlobals.TWITTER_NAME  = brackets.config.twitter_name;
    additionalGlobals.VERSION       = brackets.metadata.version;
    additionalGlobals.VERSION_MAJOR = parsedVersion[1];
    additionalGlobals.VERSION_MINOR = parsedVersion[2];
    additionalGlobals.VERSION_PATCH = parsedVersion[3];

    var isDevBuild = !StringUtils.endsWith(decodeURI(window.location.pathname), "/www/index.html");
    if (isDevBuild) {
        additionalGlobals.BUILD_TYPE = strings.DEVELOPMENT_BUILD;
    } else {
        var isReleaseBuild = (brackets.platform === "mac" || brackets.platform === "win");
        additionalGlobals.BUILD_TYPE = (isReleaseBuild ? strings.RELEASE_BUILD : strings.EXPERIMENTAL_BUILD);
    }
    
    // Insert application strings
    _.forEach(strings, function (value, key) {
        _.forEach(additionalGlobals, function (item, name) {
            strings[key] = strings[key].replace(new RegExp("{" + name + "}", "g"), additionalGlobals[name]);
        });
    });
    
    // Append or overlay additional, product-specific strings
    _.forEach(stringsApp, function (value, key) {
        _.forEach(additionalGlobals, function (item, name) {
            stringsApp[key] = stringsApp[key].replace(new RegExp("{" + name + "}", "g"), additionalGlobals[name]);
        });
        strings[key] = stringsApp[key];
    });

    module.exports = strings;

});
