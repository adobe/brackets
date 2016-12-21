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


/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, describe, it, expect */

define(function (require, exports, module) {
    'use strict';
    
    var StringUtils = require("utils/StringUtils"),
        kilobyte = 1024,
        megabyte = kilobyte * 1024,
        gigabyte = megabyte * 1024,
        terabyte = gigabyte * 1024;
    
    describe("StringUtils", function () {

        
        describe("prettyPrintBytes", function () {
            it("should convert a number of bytes into a human readable string", function () {
                
                var prettyBytes = StringUtils.prettyPrintBytes(1);
                expect(prettyBytes).toBe("1 B");
                
                prettyBytes = StringUtils.prettyPrintBytes(kilobyte);
                expect(prettyBytes).toBe("1 KB");
                
                prettyBytes = StringUtils.prettyPrintBytes(megabyte);
                expect(prettyBytes).toBe("1 MB");
                
                prettyBytes = StringUtils.prettyPrintBytes(gigabyte);
                expect(prettyBytes).toBe("1 GB");
                
                prettyBytes = StringUtils.prettyPrintBytes(terabyte);
                expect(prettyBytes).toBe("1 TB");
            });
        });
        

    });
});
