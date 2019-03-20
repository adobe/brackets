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
/*eslint-env es6, node*/
/*eslint max-len: ["error", { "code": 200 }]*/
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

        execa.stdout(executablePath, ['--version']).then(function (output) {
            var matchStr = output.match(/^PHP ([^\s]+)/m);
            if (!matchStr) {
                reject("PHP_VERSION_INVALID");
                return;
            }
            var version = matchStr[1].split('-')[0];
            if (!/^\d+.\d+.\d+$/.test(version)) {
                version = version.replace(/(\d+.\d+.\d+)/, '$1-');
            }
            if (semver.lt(version, '7.0.0')) {
                reject(["PHP_UNSUPPORTED_VERSION", version]);
                return;
            }
            resolve();
        }).catch(function (err) {
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

var serverOptions = function () {
        return new Promise(function (resolve, reject) {
            var server = net.createServer(function (socket) {
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
            server.listen(0, '127.0.0.1', function () {
                var pathToPHP = __dirname + "/vendor/felixfbecker/language-server/bin/php-language-server.php";
                var childProcess = cp.spawn(executablePath, [
                    pathToPHP,
                    '--tcp=127.0.0.1:' + server.address().port
                ]);
                childProcess.stderr.on('data', function (chunk) {
                    var str = chunk.toString();
                    console.log('PHP Language Server:', str);
                });
                childProcess.on('exit', function (code, signal) {
                    console.log(
                        "Language server exited " + (signal ? "from signal " + signal : "with exit code " + code)
                    );
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
