/*
 * Copyright (c) 2019 - present Adobe Systems Incorporated. All rights reserved.
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

"use strict";

var protocol = require("vscode-languageserver-protocol");

function ConsoleLogger() {}

ConsoleLogger.prototype.error = function (message) {
    console.error(message);
};
ConsoleLogger.prototype.warn = function (message) {
    console.warn(message);
};
ConsoleLogger.prototype.info = function (message) {
    console.info(message);
};
ConsoleLogger.prototype.log = function (message) {
    console.log(message);
};

function createConnection(reader, writer, _errorHandler, _closeHandler) {
    var logger = new ConsoleLogger(),
        connection = protocol.createProtocolConnection(reader, writer, logger);
    
    connection.onError(function (errorData) {
        _errorHandler(errorData[0], errorData[1], errorData[2]);
    });
    connection.onClose(_closeHandler);
    
    return connection;
}