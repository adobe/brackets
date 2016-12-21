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

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, node: true */
/*global */

(function () {
    "use strict";

    /**
     * @private
     * @type {DomainManager}
     * The DomainManager passed in at init.
     */
    var _domainManager = null;


    /**
     * @private
     * @type {Buffer}
     */
    var _buffer = new Buffer(18);
    
    // write some bytes into the buffer with varied alignments
    _buffer.writeUInt8(1, 0);
    _buffer.writeUInt32LE(Math.pow(2, 32) - 1, 1);
    _buffer.writeFloatBE(3.141592, 5);
    _buffer.writeDoubleLE(Number.MAX_VALUE, 9);
    _buffer.writeInt8(-128, 17);
        
    /**
     * @private
     * @return {Buffer}
     */
    function _getBufferSync() {
        return _buffer;
    }
    
    /**
     * @private
     * @param {function(?string, Buffer=)} callback
     */
    function _getBufferAsync(callback) {
        process.nextTick(function () {
            callback(null, _buffer);
        });
    }
    
    /**
     * @param {DomainManager} DomainManager The DomainManager for the server
     */
    function init(DomainManager) {
        _domainManager = DomainManager;
        if (!_domainManager.hasDomain("test")) {
            _domainManager.registerDomain("test", {major: 0, minor: 1});
        }
        _domainManager.registerCommand(
            "binaryTest",
            "getBufferSync",
            _getBufferSync,
            false,
            "Get a byte array synchronously",
            [],
            {name: "bytes", type: "Buffer"}
        );
        _domainManager.registerCommand(
            "binaryTest",
            "getBufferAsync",
            _getBufferAsync,
            true,
            "Get a byte array asynchronously",
            [],
            {name: "bytes", type: "Buffer"}
        );
    }
    
    exports.init = init;
    
}());
