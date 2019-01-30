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
var protocol = require("vscode-languageserver-protocol"),
    cp = require("child_process");

/*

options = {
    format : function | json,
    json : {
        type : module | executable,
        module: {
            module: string
            transport?: stdio | ipc | pipe | socket;
            args?: string[];
            runtime?: string;
                options?: {
                cwd?: string;
                env?: any;
                encoding?: string;
                execArgv?: string[];
            }
        },
        executable : {
            command: string;
            args?: string[];
            options?: {
                cwd?: string;
                stdio?: string | string[];
                env?: any;
                detached?: boolean;
                shell?: boolean;
            }
        }

    },
    server : Promise for {
        return {
            type : "transport" | "process",
            processInfo : {
                process : cp,
                detached : boolean
            },
            MessageTransport : {
                type : 
                reader : reader,
                writer : writer, 
                detached : boolean
            }
        }
    }
}

MessageTransports =  {
    reader: MessageReader;
    writer: MessageWriter;
    detached?: boolean;
}
*/

function getEnvironment(env) {
    if (!env) {
        return process.env;
    }

    var result = Object.create(null);
    Object.keys(process.env).forEach(function (key) {
        result[key] = process.env[key];
    });
    Object.keys(env).forEach(function (key) {
        result[key] = env[key];
    });

    return result;
}

function _returnTransport(resolve, reject, transport, err) {
    if (transport) {
        resolve(transport);
    } else {
        reject(err);
    }
}

function _createTransports(resp) {
    var retval = null;

    if (!resp) {
        return retval;
    }

    if (resp.reader && resp.writer) {
        retval = {
            reader: resp.reader,
            writer: resp.writer
        };
    } else if (resp.process) {
        retval = {
            reader: protocol.StreamMessageReader(resp.process.stdout),
            writer: protocol.StreamMessageWriter(resp.process.stdin)
        };
        resp.process.stderr.on('data', function (data) {
            console.error('[Error] "%s"', String(data));
        });
    }
    return retval;
}

function _handleNodeModules(serverOptions, resolve, reject) {
    function _checkServerProcess(serverProcess) {
        if (!serverProcess || !serverProcess.pid) {
            _returnTransport(resolve, reject, null, `Launching server using runtime ${serverOptions.runtime} failed.`);
        }
    }

    var transport = serverOptions.transport;

    if (serverOptions.runtime) { //like php, ruby etc
        var args = [];

        var options = serverOptions.options || Object.create(null);
        if (options.execArgv) {
            options.execArgv.forEach(function (element) {
                args.push(element);
            });
        }

        args.push(serverOptions.module);
        if (serverOptions.args) {
            serverOptions.args.forEach(function (element) {
                args.push(element);
            });
        }

        var execOptions = Object.create(null);
        execOptions.cwd = __dirname;
        execOptions.env = getEnvironment(options.env);

        var pipeName = undefined;
        if (transport === "ipc") {
            execOptions.stdio = [null, null, null, 'ipc'];
            args.push('--node-ipc');
        } else if (transport === "stdio") {
            args.push('--stdio');
        } else if (transport === "pipe") {
            pipeName = protocol.generateRandomPipeName();
            args.push(`--pipe=${pipeName}`);
        } else if (transport & transport.kind === "socket") {
            args.push(`--socket=${transport.port}`);
        }

        args.push(`--clientProcessId=${process.pid.toString()}`);

        if (transport === "ipc" || transport === "stdio") {
            var serverProcess = cp.spawn(serverOptions.runtime, args, execOptions);
            _checkServerProcess(serverProcess);
            serverProcess.stderr.on('data', function (data) {
                console.error('[Error] "%s"', String(data));
            });
            if (transport === "ipc") {
                var result = _createTransport({
                    reader: new protocol.IPCMessageReader(serverProcess),
                    writer: new protocol.IPCMessageWriter(serverProcess)
                });
                serverProcess.stdout.on('data', function (data) {
                    console.info('[Output] "%s"', String(data));
                });
                resolve(result);
            } else {
                var result = _createTransport({
                    reader: new protocol.StreamMessageReader(serverProcess.stdout),
                    writer: new protocol.StreamMessageWriter(serverProcess.stdin)
                });

                resolve(result);
            }
        } else if (transport === "pipe") {
            return protocol.createClientPipeTransport(pipeName).then(function (transportObj) {
                var serverProcess = cp.spawn(serverOptions.runtime, args, execOptions);
                _checkServerProcess(serverProcess);
                serverProcess.stderr.on('data', function (data) {
                    console.error('[Error] "%s"', String(data));
                });
                serverProcess.stdout.on('data', function (data) {
                    console.info('[Output] "%s"', String(data));
                });
                transportObj.onConnected().then(function (protocolObj) {
                    var result = _createTransport({
                        reader: protocolObj[0],
                        writer: protocolObj[1]
                    });

                    resolve(result);
                });
            });
        } else if (transport & transport.kind === "socket") {
            return protocol.createClientSocketTransport(transport.port).then((transportObj) => {
                var serverProcess = cp.spawn(serverOptions.runtime, args, execOptions);
                _checkServerProcess(serverProcess);
                serverProcess.stderr.on('data', function (data) {
                    console.error('[Error] "%s"', String(data));
                });
                serverProcess.stdout.on('data', function (data) {
                    console.info('[Output] "%s"', String(data));
                });
                transport.onConnected().then(function (protocolObj) {
                    var result = _createTransport({
                        reader: protocolObj[0],
                        writer: protocolObj[1]
                    });

                    resolve(result);
                });
            });
        }

    } else {
        var pipeName = undefined;
        var args = serverOptions.args && serverOptions.args.slice() || [];
        if (transport === "ipc") {
            args.push('--node-ipc');
        } else if (transport === "stdio") {
            args.push('--stdio');
        } else if (transport === "pipe") {
            pipeName = protocol.generateRandomPipeName();
            args.push(`--pipe=${pipeName}`);
        } else if (transport & transport.kind === "socket") {
            args.push(`--socket=${transport.port}`);
        }
        args.push(`--clientProcessId=${process.pid.toString()}`);

        var options = serverOptions.options || Object.create(null);
        options.execArgv = options.execArgv || [];
        options.cwd = __dirname;
        options.silent = true;

        if (transport === "ipc" || transport === "stdio") {
            var serverProcess = cp.fork(serverOptions.module, args || [], options);
            _checkServerProcess(serverProcess);
            serverProcess.stderr.on('data', function (data) {
                console.error('[Error] "%s"', String(data));
            });
            if (transport === "ipc") {
                var result = _createTransport({
                    reader: new protocol.IPCMessageReader(serverProcess),
                    writer: new protocol.IPCMessageWriter(serverProcess)
                });
                serverProcess.stdout.on('data', function (data) {
                    console.info('[Output] "%s"', String(data));
                });
                resolve(result);
            } else {
                var result = _createTransport({
                    reader: new protocol.StreamMessageReader(serverProcess.stdout),
                    writer: new protocol.StreamMessageWriter(serverProcess.stdin)
                });

                resolve(result);
            }
        } else if (transport === "pipe") {
            return protocol.createClientPipeTransport(pipeName).then(function (transportObj) {
                var serverProcess = cp.fork(serverOptions.module, args || [], options);
                _checkServerProcess(serverProcess);
                serverProcess.stderr.on('data', function (data) {
                    console.error('[Error] "%s"', String(data));
                });
                serverProcess.stdout.on('data', function (data) {
                    console.info('[Output] "%s"', String(data));
                });
                transportObj.onConnected().then(function (protocolObj) {
                    var result = _createTransport({
                        reader: protocolObj[0],
                        writer: protocolObj[1]
                    });

                    resolve(result);
                });
            });
        } else if (transport & transport.kind === "socket") {
            return protocol.createClientSocketTransport(transport.port).then((transportObj) => {
                var serverProcess = cp.fork(serverOptions.module, args || [], options);
                _checkServerProcess(serverProcess);
                serverProcess.stderr.on('data', function (data) {
                    console.error('[Error] "%s"', String(data));
                });
                serverProcess.stdout.on('data', function (data) {
                    console.info('[Output] "%s"', String(data));
                });
                transport.onConnected().then(function (protocolObj) {
                    var result = _createTransport({
                        reader: protocolObj[0],
                        writer: protocolObj[1]
                    });

                    resolve(result);
                });
            });
        }
    }
}

//Should return type MessageTransports
function createTransports(serverOptions) {
    var retval = new Promise(function (resolve, reject) {

        if (typeof serverOptions === "function") {
            var server = serverOptions;

            server().then(function (resp) {
                var result = _createTransports(resp);

                _returnTransport(resolve, reject, result);
            });
        } else if (typeof serverOptions === "object") {
            if (serverOptions.module) {
                _handleNodeModules(serverOptions, resolve, reject);
            } else if (serverOptions.command) {
                var command = serverOptions.command,
                    args = serverOptions.args,
                    options = Object.assign({}, serverOptions.options);

                var serverProcess = cp.spawn(command, args, options);
                if (!serverProcess || !serverProcess.pid) {
                    _returnTransport(resolve, reject, null, `Launching server using command ${command.command} failed.`);
                }
                serverProcess.stderr.on('data', function (data) {
                    console.error('[Error] "%s"', String(data));
                });
                var result = _createTransports({
                    process: serverProcess,
                    detached: !!options.detached
                });

                _returnTransport(resolve, reject, result);
            }

        }
    });

    return retval;
}


exports.createTransports = createTransports;
