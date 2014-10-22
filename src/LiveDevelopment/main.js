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


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, forin: true, maxerr: 50, regexp: true */
/*global define, $, less, window */

/**
 * main integrates LiveDevelopment into Brackets
 *
 * This module creates two menu items:
 *
 *  "Go Live": open or close a Live Development session and visualize the status
 *  "Highlight": toggle source highlighting
 */
define(function main(require, exports, module) {
    "use strict";
    
    var AppInit             = require("utils/AppInit"),
        PreferencesManager  = require("preferences/PreferencesManager");
        
    // active implementation
    var LiveDevelopment;

    // alternative (pre-loaded) implementations
    var liveDevImpls = {
            'default'  : require("LiveDevelopment/impls/default/main"),
            'livedev2' : require("LiveDevelopment/impls/livedev2/main")
        };

    /** Initialize LiveDevelopment */
    AppInit.appReady(function () {
        PreferencesManager.definePreference('livedev.impl', 'string', 'default');
        // choose LiveDevelopment implementation based on preference value
        LiveDevelopment = liveDevImpls[PreferencesManager.get('livedev.impl')];
        // init LiveDevelopment instance
        LiveDevelopment.init();
    });
});
