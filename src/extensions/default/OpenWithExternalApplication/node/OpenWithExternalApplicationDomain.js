/*
 * Copyright (c) 2012 - present Adobe Systems Incorporated. All rights reserved.
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

/*eslint-env node */
/*jslint node: true */
"use strict";

var open     = require("open");

var _domainManager;

/**
 * @private
 *
 * @param {Object} params Object to use
 */
function _openWithExternalApplication(params) {
    var application =  "default" === params.app ? "": params.app;
    open(params.path, application);
}


/**
 * Initializes the OpenWithExternalEditor domain with its commands.
 * @param {DomainManager} domainManager The DomainManager for the server
 */
function init(domainManager) {
    _domainManager = domainManager;

    if (!domainManager.hasDomain("OpenWithExternalApplication")) {
        domainManager.registerDomain("OpenWithExternalApplication", {major: 0, minor: 1});
    }
    _domainManager.registerCommand(
        "OpenWithExternalApplication",
        "open",
        _openWithExternalApplication,
        true,
        "open document with External Application.",
        [{
            name: "params",
            type: "object",
            description: "Params Object having document and App Path."
        }],
        []
    );
}

exports.init = init;
