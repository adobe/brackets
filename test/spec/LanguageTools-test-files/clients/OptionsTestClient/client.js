"use strict";

var LanguageClient = require(global.LanguageClientInfo.languageClientPath).LanguageClient,
    path = require("path"),
    cp = require("child_process"),
    clientName = "OptionsTestClient",
    client = null,
    modulePath = null,
    relativeLSPathArray = ["..", "..", "server", "lsp-test-server"],
    FORWARD_SLASH = "/",
    BACKWARD_SLASH = "\\";

function getServerOptions(type) {
    var serverPath = modulePath.split(BACKWARD_SLASH)
        .join(FORWARD_SLASH).split(FORWARD_SLASH).concat(relativeLSPathArray)
        .join(FORWARD_SLASH);

    var newEnv = process.env;
    newEnv.CUSTOMENVVARIABLE = "ANYTHING";

    serverPath = path.resolve(serverPath);
    var serverOptions = null;

    switch (type) {
        case 'runtime':
            {
                // [runtime] [execArgs] [module] [args (with communication args)] (with options[env, cwd])
                serverOptions = {
                    runtime: process.execPath, //Path to node but could be anything, like php or perl
                    module: "main.js",
                    args: [
                    "--server-args" //module args
                ], //Arguments to process
                    options: {
                        cwd: serverPath, //The current directory where main.js is located
                        env: newEnv, //The process will be started CUSTOMENVVARIABLE in its environment
                        execArgv: [
                        "--no-warnings",
                        "--no-deprecation" //runtime executable args
                    ]
                    },
                    communication: "ipc"
                };
                break;
            }
        case 'function':
            {
                serverOptions = function () {
                    return new Promise(function (resolve, reject) {
                        var serverProcess = cp.spawn(process.execPath, [
                            "main.js",
                            "--stdio", //Have to add communication args manually
                        ], {
                            cwd: serverPath
                        });

                        if (serverProcess && serverProcess.pid) {
                            resolve({
                                process: serverProcess
                            });
                        } else {
                            reject("Couldn't create server process");
                        }
                    });
                };
                break;
            }
        case 'command':
            {
                // [command] [args] (with options[env, cwd])
                serverOptions = {
                    command: process.execPath, //Path to executable, mostly runtime
                    args: [
                    "--no-warnings",
                    "--no-deprecation",
                    "main.js",
                    "--stdio", //Have to add communication args manually
                    "--server-args"
                ], //Arguments to process, ORDER WILL MATTER
                    options: {
                        cwd: serverPath,
                        env: newEnv //The process will be started CUSTOMENVVARIABLE in its environment
                    }
                };
                break;
            }
    }

    return serverOptions;
}

function setModulePath(params) {
    modulePath = params.modulePath.slice(0, params.modulePath.length - 1);

    return Promise.resolve();
}

function setOptions(params) {
    if (!params || !params.optionsType) {
        return Promise.reject("Can't start server because no options type provided");
    }

    var oType = params.optionsType,
        options = {
            serverOptions: getServerOptions(oType)
        };

    client.setOptions(options);

    return Promise.resolve("Server options set successfully");
}

function init(domainManager) {
    client = new LanguageClient(clientName, domainManager);
    client.addOnRequestHandler('setModulePath', setModulePath);
    client.addOnRequestHandler('setOptions', setOptions);
}

exports.init = init;
