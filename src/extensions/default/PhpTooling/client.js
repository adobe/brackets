/*
 * Copyright (c) 2019 - present Adobe. All rights reserved.
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
/*global process */
"use strict";

var LanguageClient = require(global.LanguageClientInfo.languageClientPath).LanguageClient,
    net = require("net"),
    cp = require("child_process"),
    execa = require("execa"),
    semver = require('semver'),
    clientName = "PhpClient",
    executablePath = "",
    memoryLimit = "";

function validatePhpExecutable(confParams) {
    executablePath = confParams["executablePath"] ||
        confParams["validate_executablePath"] ||
        (process.platform === 'win32' ? 'php.exe' : 'php');

    memoryLimit = confParams["memoryLimit"] || 'default';
    memoryLimit = memoryLimit === "default" ? '4095M' : memoryLimit;

    return new Promise(function (resolve, reject) {
        if (memoryLimit !== '-1' && !/^\d+[KMG]?$/.exec(memoryLimit)) {
            reject("PHP_SERVER_MEMORY_LIMIT_INVALID");
            return;
        }

        // Check path (if PHP is available and version is ^7.0.0)
        execa.stdout(executablePath, ['--version'])
        .then(function (stdout) {
             // Parse version and discard OS info like 7.0.8--0ubuntu0.16.04.2
            const match = stdout.match(/^PHP ([^\s]+)/m);
            if (!match) {
                reject("PHP_VERSION_INVALID");
                return;
            }
            let version = match[1].split('-')[0];
            // Convert PHP prerelease format like 7.0.0rc1 to 7.0.0-rc1
            if (!/^\d+.\d+.\d+$/.test(version)) {
                version = version.replace(/(\d+.\d+.\d+)/, '$1-');
            }
            if (semver.lt(version, '7.0.0')) {
                reject(["PHP_UNSUPPORTED_VERSION", version]);
                return;
            }
            resolve();
        })
        .catch(function(err) {
            if (err.code === 'ENOENT') {
                reject("PHP_EXECUTABLE_NOT_FOUND");
            } else {
                reject(["PHP_PROCESS_SPAWN_ERROR", err.code]);
                console.error(err);
            }
            return;
        });

    });
}

var serverOptions = function (){
        return new Promise(function (resolve, reject) {
            // Use a TCP socket because of problems with blocking STDIO
            var server = net.createServer(function (socket) {
                // 'connection' listener
                console.log('PHP process connected');
                socket.on('end', function () {
                    console.log('PHP process disconnected');
                });
                server.close();
                resolve({
                    reader: socket,
                    writer: socket
                });
            });
            // Listen on random port
            server.listen(0, '127.0.0.1', function () {
                var pathToPHP = __dirname + "/vendor/bin/php-language-server.php";
                // The server is implemented in PHP
                var childProcess = cp.spawn(executablePath, [
                    pathToPHP,
                    '--tcp=127.0.0.1:' + server.address().port
                ]);
                childProcess.stderr.on('data', function (chunk) {
                    var str = chunk.toString();
                    console.log('PHP Language Server:', str);
                });
                childProcess.on('exit', function (code, signal) {
                    console.log("Language server exited " + (signal ? "from signal " + signal : "with exit code " + code));
                });
                return childProcess;
            });
        });
    },
    options = {
        serverOptions: serverOptions
    };


function init(domainManager) {
    var client = new LanguageClient(clientName, domainManager, options);
    client.addOnRequestHandler('validatePhpExecutable', validatePhpExecutable);
}

exports.init = init;
