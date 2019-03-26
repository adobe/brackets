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

/*global exports, process, Promise, __dirname, global*/
/*eslint no-console: 0*/
/*eslint no-fallthrough: 0*/
/* eslint no-empty: ["error", { "allowEmptyCatch": true }] */
(function () {
    "use strict";

    var protocol = require("vscode-languageserver-protocol"),
        cp = require("child_process"),
        fs = require("fs");

    var CommunicationTypes = {
            NodeIPC: {
                type: "ipc",
                flag: "--node-ipc"
            },
            StandardIO: {
                type: "stdio",
                flag: "--stdio"
            },
            Pipe: {
                type: "pipe",
                flag: "--pipe"
            },
            Socket: {
                type: "socket",
                flag: "--socket"
            }
        },
        CLIENT_PROCESS_ID_FLAG = "--clientProcessId";

    function addCommunicationArgs(communication, processArgs, isRuntime) {
        switch (communication) {
            case CommunicationTypes.NodeIPC.type:
                {
                    if (isRuntime) {
                        processArgs.options.stdio = [null, null, null, 'ipc'];
                        processArgs.args.push(CommunicationTypes.NodeIPC.flag);
                    } else {
                        processArgs.args.push(CommunicationTypes.NodeIPC.flag);
                    }
                    break;
                }
            case CommunicationTypes.StandardIO.type:
                {
                    processArgs.args.push(CommunicationTypes.StandardIO.flag);
                    break;
                }
            case CommunicationTypes.Pipe.type:
                {
                    var pipeName = protocol.generateRandomPipeName(),
                        pipeflag = CommunicationTypes.Pipe.flag + "=" + pipeName.toString();

                    processArgs.args.push(pipeflag);
                    processArgs.pipeName = pipeName;
                    break;
                }
            default:
                {
                    if (communication && communication.type === CommunicationTypes.Socket.type) {
                        var socketFlag = CommunicationTypes.Socket.flag + "=" + communication.port.toString();
                        processArgs.args.push(socketFlag);
                    }
                }
        }

        var clientProcessIdFlag = CLIENT_PROCESS_ID_FLAG + "=" + process.pid.toString();
        processArgs.args.push(clientProcessIdFlag);
    }

    function _getEnvironment(env) {
        if (!env) {
            return process.env;
        }

        //Combine env vars
        var result = Object.assign({}, process.env, env);
        return result;
    }

    function _createReaderAndWriteByCommunicationType(resp, type) {
        var retval = null;

        switch (type) {
            case CommunicationTypes.NodeIPC.type:
                {
                    if (resp.process) {
                        resp.process.stderr.on('data', function (data) {
                            if (global.LanguageClientInfo.preferences.showServerLogsInConsole) {
                                console.error('[Server logs @ stderr] "%s"', String(data));
                            }
                        });

                        resp.process.stdout.on('data', function (data) {
                            if (global.LanguageClientInfo.preferences.showServerLogsInConsole) {
                                console.info('[Server logs @ stdout] "%s"', String(data));
                            }
                        });

                        retval = {
                            reader: new protocol.IPCMessageReader(resp.process),
                            writer: new protocol.IPCMessageWriter(resp.process)
                        };
                    }
                    break;
                }
            case CommunicationTypes.StandardIO.type:
                {
                    if (resp.process) {
                        resp.process.stderr.on('data', function (data) {
                            if (global.LanguageClientInfo.preferences.showServerLogsInConsole) {
                                console.error('[Server logs @ stderr] "%s"', String(data));
                            }
                        });

                        retval = {
                            reader: new protocol.StreamMessageReader(resp.process.stdout),
                            writer: new protocol.StreamMessageWriter(resp.process.stdin)
                        };
                    }
                    break;
                }
            case CommunicationTypes.Pipe.type:
            case CommunicationTypes.Socket.type:
                {
                    if (resp.reader && resp.writer && resp.process) {
                        resp.process.stderr.on('data', function (data) {
                            if (global.LanguageClientInfo.preferences.showServerLogsInConsole) {
                                console.error('[Server logs @ stderr] "%s"', String(data));
                            }
                        });

                        resp.process.stdout.on('data', function (data) {
                            if (global.LanguageClientInfo.preferences.showServerLogsInConsole) {
                                console.info('[Server logs @ stdout] "%s"', String(data));
                            }
                        });

                        retval = {
                            reader: resp.reader,
                            writer: resp.writer
                        };
                    }
                }
        }

        return retval;
    }

    function _createReaderAndWriter(resp) {
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
                reader: new protocol.StreamMessageReader(resp.process.stdout),
                writer: new protocol.StreamMessageWriter(resp.process.stdin)
            };

            resp.process.stderr.on('data', function (data) {
                if (global.LanguageClientInfo.preferences.showServerLogsInConsole) {
                    console.error('[Server logs @ stderr] "%s"', String(data));
                }
            });
        }

        return retval;
    }

    function _isServerProcessValid(serverProcess) {
        if (!serverProcess || !serverProcess.pid) {
            return false;
        }

        return true;
    }

    function _startServerAndGetTransports(communication, processArgs, isRuntime) {
        return new Promise(function (resolve, reject) {
            var serverProcess = null,
                result = null,
                protocolTransport = null,
                type = typeof communication === "object" ? communication.type : communication;

            var processFunc = isRuntime ? cp.spawn : cp.fork;

            switch (type) {
                case CommunicationTypes.NodeIPC.type:
                case CommunicationTypes.StandardIO.type:
                    {
                        serverProcess = processFunc(processArgs.primaryArg, processArgs.args, processArgs.options);
                        if (_isServerProcessValid(serverProcess)) {
                            result = _createReaderAndWriteByCommunicationType({
                                process: serverProcess
                            }, type);

                            resolve(result);
                        } else {
                            reject(null);
                        }
                        break;
                    }
                case CommunicationTypes.Pipe.type:
                    {
                        protocolTransport = protocol.createClientPipeTransport(processArgs.pipeName);
                    }
                case CommunicationTypes.Socket.type:
                    {
                        if (communication && communication.type === CommunicationTypes.Socket.type) {
                            protocolTransport = protocol.createClientSocketTransport(communication.port);
                        }
                        
                        if (!protocolTransport) {
                            reject("Invalid Communications Object. Can't create connection with server");
                            return;
                        }

                        protocolTransport.then(function (transportObj) {
                            serverProcess = processFunc(processArgs.primaryArg, processArgs.args, processArgs.options);
                            if (_isServerProcessValid(serverProcess)) {
                                transportObj.onConnected().then(function (protocolObj) {
                                    result = _createReaderAndWriteByCommunicationType({
                                        process: serverProcess,
                                        reader: protocolObj[0],
                                        writer: protocolObj[1]
                                    }, type);

                                    resolve(result);
                                }).catch(reject);
                            }
                        }).catch(reject);
                    }
            }
        });
    }

    function _handleOtherRuntime(serverOptions) {
        function _getArguments(sOptions) {
            var args = [];

            if (sOptions.options && sOptions.options.execArgv) {
                args = args.concat(sOptions.options.execArgv);
            }

            args.push(sOptions.module);
            if (sOptions.args) {
                args = args.concat(sOptions.args);
            }

            return args;
        }

        function _getOptions(sOptions) {
            var cwd = undefined,
                env = undefined;

            if (sOptions.options) {
                if (sOptions.options.cwd) {
                    try {
                        if (fs.lstatSync(sOptions.options.cwd).isDirectory(sOptions.options.cwd)) {
                            cwd = sOptions.options.cwd;
                        }
                    } catch (e) {}
                }

                cwd = cwd || __dirname;
                if (sOptions.options.env) {
                    env = sOptions.options.env;
                }
            }

            var options = {
                cwd: cwd,
                env: _getEnvironment(env)
            };

            return options;
        }

        var communication = serverOptions.communication || CommunicationTypes.StandardIO.type,
            args = _getArguments(serverOptions),
            options = _getOptions(serverOptions),
            processArgs = {
                args: args,
                options: options,
                primaryArg: serverOptions.runtime
            };

        addCommunicationArgs(communication, processArgs, true);
        return _startServerAndGetTransports(communication, processArgs, true);
    }

    function _handleNodeRuntime(serverOptions) {
        function _getArguments(sOptions) {
            var args = [];

            if (sOptions.args) {
                args = args.concat(sOptions.args);
            }

            return args;
        }

        function _getOptions(sOptions) {
            var cwd = undefined;

            if (sOptions.options) {
                if (sOptions.options.cwd) {
                    try {
                        if (fs.lstatSync(sOptions.options.cwd).isDirectory(sOptions.options.cwd)) {
                            cwd = sOptions.options.cwd;
                        }
                    } catch (e) {}
                }
                cwd = cwd || __dirname;
            }

            var options = Object.assign({}, sOptions.options);
            options.cwd = cwd,
                options.execArgv = options.execArgv || [];
            options.silent = true;

            return options;
        }

        var communication = serverOptions.communication || CommunicationTypes.StandardIO.type,
            args = _getArguments(serverOptions),
            options = _getOptions(serverOptions),
            processArgs = {
                args: args,
                options: options,
                primaryArg: serverOptions.module
            };

        addCommunicationArgs(communication, processArgs, false);
        return _startServerAndGetTransports(communication, processArgs, false);
    }


    function _handleServerFunction(func) {
        return func().then(function (resp) {
            var result = _createReaderAndWriter(resp);

            return result;
        });
    }

    function _handleModules(serverOptions) {
        if (serverOptions.runtime) {
            return _handleOtherRuntime(serverOptions);
        }
        return _handleNodeRuntime(serverOptions);

    }

    function _handleExecutable(serverOptions) {
        return new Promise(function (resolve, reject) {
            var command = serverOptions.command,
                args = serverOptions.args,
                options = Object.assign({}, serverOptions.options);

            var serverProcess = cp.spawn(command, args, options);
            if (!serverProcess || !serverProcess.pid) {
                reject("Failed to launch server using command :", command);
            }

            var result = _createReaderAndWriter({
                process: serverProcess,
                detached: !!options.detached
            });

            if (result) {
                resolve(result);
            } else {
                reject(result);
            }
        });
    }

    function startServerAndGetConnectionArgs(serverOptions) {
        if (typeof serverOptions === "function") {
            return _handleServerFunction(serverOptions);
        } else if (typeof serverOptions === "object") {
            if (serverOptions.module) {
                return _handleModules(serverOptions);
            } else if (serverOptions.command) {
                return _handleExecutable(serverOptions);
            }
        }

        return Promise.reject(null);
    }


    exports.startServerAndGetConnectionArgs = startServerAndGetConnectionArgs;
}());
