/*
 * Copyright (c) 2018 - present Adobe Systems Incorporated. All rights reserved.
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

/*global exports */
/*global process*/

"use strict";

var serverPath = "/../vendor/bin/php-language-server.php";
var child_process = require("child_process");
var { SocketMessageReader, SocketMessageWriter } = require("vscode-jsonrpc");
var net = require('net');

let messageId = -1;
let reader = null;
let writer = null;
let message = null;

function send(method, params) {
    let message = {
        jsonrpc: "2.0",
        id: messageId++,
        method: method,
        params: params
    };
    writer.write(message);
}


function initialize() {
    if(message){
        writer.write(message);
    }
}

const server = net.createServer((socket) => {
    server.close();
    reader = new SocketMessageReader(socket);
    reader.listen((data) => {
        process.send(data);
    });
    writer = new SocketMessageWriter(socket);
    initialize();
    process.on('message', (json)=>{
        writer.write(json);
    });
});

process.once('message', (json)=>{
    message = json;
});

server.listen(0, () => {
    child_process.spawn("php", [
        __dirname+serverPath,
        '--tcp=127.0.0.1:'+ server.address().port
    ]);
});
