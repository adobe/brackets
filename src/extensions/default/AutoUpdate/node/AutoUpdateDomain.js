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
(function () {
    "use strict";

    var _domainManager;

    var request = require('request'),
        progress = require('request-progress'),
        path = require('path'),
        fs = require('fs-extra'),
        crypto = require('crypto');

    // Current Date and Time needed for log filenames
    var curDate = Date.now().toString();

    //AUTOUPDATE_PRERELEASE
    //Installer log file
    var logFile = curDate + 'update.logs',
        logFilePath;

    //Install status file
    var installStatusFile = curDate + 'installStatus.logs',
        installStatusFilePath;

    var updateDir,
        _updateParams;

    var MessageIds,
        installerPath;

    // function map for node functions
    var functionMap = {};

    var _nodeErrorMessages = {
        UPDATEDIR_READ_FAILED: 0,
        UPDATEDIR_CLEAN_FAILED: 1,
        CHECKSUM_DID_NOT_MATCH: 2,
        INSTALLER_NOT_FOUND: 3,
        DOWNLOAD_ERROR: 4,
        NETWORK_SLOW_OR_DISCONNECTED: 5
    };

    /**
     * Gets the arguments to a function in an array
     * @param   {object} args - the arguments object
     * @returns {Array}   - array of actual arguments
     */
    function getFunctionArgs(args) {
        if (args.length > 1) {
            var fnArgs = new Array(args.length - 1),
                i;
            for (i = 1; i < args.length; ++i) {
                fnArgs[i - 1] = args[i];
            }
            return fnArgs;
        }
        return [];
    }


    /**
     * Posts messages to brackets
     * @param {string} messageId - Message to be passed
     */
    function postMessageToBrackets(messageId) {
        var msgObj = {
            fn: messageId,
            args: getFunctionArgs(arguments)
        };
        _domainManager.emitEvent('AutoUpdate', 'data', [msgObj]);

    }

    /**
     * Quotes and Converts a file path, to accommodate platform dependent paths
     * @param   {string} qncPath - file path
     * @param   {boolean} resolve - false if path is only to be quoted, true if both quoted and converted
     * @returns {string}  quoted and converted file path
     */
    function quoteAndConvert(qncPath, resolve) {
        if (resolve) {
            qncPath = path.resolve(qncPath);
        }
        return "\"" + qncPath + "\"";
    }


    /**
     * Validates the checksum of a file against a given checksum
     * @param {object} params - json containing {
     *                        filePath - path to the file,
     *                        expectedChecksum - the checksum to validate against }
     */
    function validateChecksum(params) {
        params = params || {
            filePath: installerPath,
            expectedChecksum: _updateParams.checksum
        };

        var hash = crypto.createHash('sha256');

        if (fs.existsSync(params.filePath)) {
            var stream = fs.createReadStream(params.filePath);

            stream.on('data', function (data) {
                hash.update(data);
            });

            stream.on('end', function () {
                var calculatedChecksum = hash.digest('hex'),
                    isValidChecksum = (params.expectedChecksum === calculatedChecksum),
                    status;

                if (isValidChecksum) {
                    if (process.platform === "darwin") {
                        status = {
                            valid: true,
                            installerPath: installerPath,
                            logFilePath: logFilePath,
                            installStatusFilePath: installStatusFilePath
                        };
                    } else if (process.platform === "win32") {
                        status = {
                            valid: true,
                            installerPath: quoteAndConvert(installerPath, true),
                            logFilePath: quoteAndConvert(logFilePath, true),
                            installStatusFilePath: installStatusFilePath
                        };
                    }
                } else {
                    status = {
                        valid: false,
                        err: _nodeErrorMessages.CHECKSUM_DID_NOT_MATCH
                    };
                }
                postMessageToBrackets(MessageIds.NOTIFY_VALIDATION_STATUS, status);
            });
        } else {
            var status = {
                valid: false,
                err: _nodeErrorMessages.INSTALLER_NOT_FOUND
            };
            postMessageToBrackets(MessageIds.NOTIFY_VALIDATION_STATUS, status);
        }
    }

	/**
     * Parse the Installer log and search for a error strings
	 * one it finds the line which has any of error String
     * it return that line and exit
     */
    function parseInstallerLog(filepath, searchstring, encoding, callback) {
        var line = "";
        var searchFn = function searchFn(str) {
            var arr = str.split('\n'),
                lineNum,
                pos;
            for (lineNum = arr.length - 1; lineNum >= 0; lineNum--) {
                var searchStrNum;
                for (searchStrNum = 0; searchStrNum < searchstring.length; searchStrNum++) {
                    pos = arr[lineNum].search(searchstring[searchStrNum]);
                    if (pos !== -1) {
                        line = arr[lineNum];
                        break;
                    }
                }
                if (pos !== -1) {
                    break;
                }
            }
            callback(line);
        };

        fs.readFile(filepath, {"encoding": encoding})
            .then(function (str) {
                return searchFn(str);
            }).catch(function () {
                callback("");
            });
    }

    /**
     * one it finds the line which has any of error String
     * after parsing the Log
     * it notifies the bracket.
     * @param{Object} searchParams is object contains Information Error String
     * Encoding of Log File Update Diectory Path.
     */
    function checkInstallerStatus(searchParams) {
        var installErrorStr = searchParams.installErrorStr,
            bracketsErrorStr = searchParams.bracketsErrorStr,
            updateDirectory = searchParams.updateDir,
            encoding =        searchParams.encoding || "utf8",
            statusObj = {installError: ": BA_UN"},
            logFileAvailable = false;

        var notifyBrackets = function notifyBrackets(errorline) {
            statusObj.installError = errorline || ": BA_UN";
            postMessageToBrackets(MessageIds.NOTIFY_INSTALLATION_STATUS, statusObj);
        };

        var parseLog = function (files) {
            files.forEach(function (file) {
                var fileExt = path.extname(path.basename(file));
                if (fileExt === ".logs") {
                    var fileName = path.basename(file),
                        fileFullPath = updateDirectory + '/' + file;
                    if (fileName.search("installStatus.logs") !== -1) {
                        logFileAvailable = true;
                        parseInstallerLog(fileFullPath, bracketsErrorStr, "utf8", notifyBrackets);
                    } else if (fileName.search("update.logs") !== -1) {
                        logFileAvailable = true;
                        parseInstallerLog(fileFullPath, installErrorStr, encoding, notifyBrackets);
                    }
                }
            });
            if (!logFileAvailable) {
                postMessageToBrackets(MessageIds.NOTIFY_INSTALLATION_STATUS, statusObj);
            }
        };

        fs.readdir(updateDirectory)
            .then(function (files) {
                return parseLog(files);
            }).catch(function () {
                postMessageToBrackets(MessageIds.NOTIFY_INSTALLATION_STATUS, statusObj);
            });
    }

    /**
     * Downloads the installer for latest Brackets release
     * @param {boolean} sendInfo   - true if download status info needs to be
     *                             sent back to Brackets, false otherwise
     * @param {object}   [updateParams=_updateParams] - json containing update parameters
     */
    function downloadInstaller(isInitialAttempt, updateParams) {
        updateParams = updateParams || _updateParams;
        try {
            var ext = path.extname(updateParams.installerName);
            var localInstallerPath = path.resolve(updateDir, Date.now().toString() + ext),
                localInstalllerFile = fs.createWriteStream(localInstallerPath),
                requestCompleted = true;
            progress(request(updateParams.downloadURL, {timeout: 30000}), {})
                .on('progress', function (state) {
                    var target = "retry-download";
                    if (isInitialAttempt) {
                        target = "initial-download";
                    }
                    var info = Math.floor(parseFloat(state.percent) * 100).toString() + '%';
                    var status = {
                        target: target,
                        spans: [{
                            id: "percent",
                            val: info
                        }]
                    };
                    postMessageToBrackets(MessageIds.SHOW_STATUS_INFO, status);
                })
                .on('error', function (err) {
                    console.log("AutoUpdate : Download failed. Error occurred : " + err.toString());
                    requestCompleted = false;
                    localInstalllerFile.end();
                    var error = err.code === 'ESOCKETTIMEDOUT' || err.code === 'ENOTFOUND' ?
                                _nodeErrorMessages.NETWORK_SLOW_OR_DISCONNECTED :
                                _nodeErrorMessages.DOWNLOAD_ERROR;
                    postMessageToBrackets(MessageIds.NOTIFY_DOWNLOAD_FAILURE, error);
                })
                .pipe(localInstalllerFile)
                .on('close', function () {
                    if (requestCompleted) {
                        try {
                            fs.renameSync(localInstallerPath, installerPath);
                            postMessageToBrackets(MessageIds.NOTIFY_DOWNLOAD_SUCCESS);
                        } catch (e) {
                            console.log("AutoUpdate : Download failed. Exception occurred : " + e.toString());
                            postMessageToBrackets(MessageIds.NOTIFY_DOWNLOAD_FAILURE,
                                                      _nodeErrorMessages.DOWNLOAD_ERROR);
                        }
                    }
                });
        } catch (e) {
            console.log("AutoUpdate : Download failed. Exception occurred : " + e.toString());
            postMessageToBrackets(MessageIds.NOTIFY_DOWNLOAD_FAILURE, _nodeErrorMessages.DOWNLOAD_ERROR);
        }
    }

    /**
     * Performs clean up for the contents in Update Directory in AppData
     * @param {Array} filesToCache - array of file types to cache
     * @param {boolean} notifyBack  - true if Brackets needs to be
     *                              notified post cleanup, false otherwise
     */
    function performCleanup(filesToCache, notifyBack) {

        function filterFilesAndNotify(files, filesToCacheArr, notifyBackToBrackets) {
            files.forEach(function (file) {
                var fileExt = path.extname(path.basename(file));
                if (filesToCacheArr.indexOf(fileExt) < 0) {
                    var fileFullPath = updateDir + '/' + file;
                    try {
                        fs.removeSync(fileFullPath);
                    } catch (e) {
                        console.log("AutoUpdate : Exception occured in removing ", fileFullPath, e);
                    }
                }
            });
            if (notifyBackToBrackets) {
                postMessageToBrackets(MessageIds.NOTIFY_SAFE_TO_DOWNLOAD);
            }
        }

        fs.stat(updateDir)
            .then(function (stats) {
                if (stats) {
                    if (filesToCache) {
                        fs.readdir(updateDir)
                            .then(function (files) {
                                filterFilesAndNotify(files, filesToCache, notifyBack);
                            })
                            .catch(function (err) {
                                console.log("AutoUpdate : Error in Reading Update Dir for Cleanup : " + err.toString());
                                postMessageToBrackets(MessageIds.SHOW_ERROR_MESSAGE,
                                                      _nodeErrorMessages.UPDATEDIR_READ_FAILED);
                            });
                    } else {
                        fs.remove(updateDir)
                            .then(function () {
                                console.log('AutoUpdate : Update Directory in AppData Cleaned: Complete');
                            })
                            .catch(function (err) {
                                console.log("AutoUpdate : Error in Cleaning Update Dir : " + err.toString());
                                postMessageToBrackets(MessageIds.SHOW_ERROR_MESSAGE,
                                                      _nodeErrorMessages.UPDATEDIR_CLEAN_FAILED);
                            });
                    }
                }
            })
            .catch(function (err) {
                console.log("AutoUpdate : Error in Reading Update Dir stats for Cleanup : " + err.toString());
                postMessageToBrackets(MessageIds.SHOW_ERROR_MESSAGE,
                                      _nodeErrorMessages.UPDATEDIR_CLEAN_FAILED);
            });
    }

    /**
     * Initializes the node with update parameters
     * @param {object} updateParams - json containing update parameters
     */
    function initializeState(updateParams) {
        _updateParams = updateParams;
        installerPath = path.resolve(updateDir, updateParams.installerName);
        postMessageToBrackets(MessageIds.NOTIFY_INITIALIZATION_COMPLETE);
    }


    /**
     * Generates a map for node side functions
     */
    function registerNodeFunctions() {
        functionMap["node.downloadInstaller"] = downloadInstaller;
        functionMap["node.performCleanup"] = performCleanup;
        functionMap["node.validateInstaller"] = validateChecksum;
        functionMap["node.initializeState"] = initializeState;
        functionMap["node.checkInstallerStatus"] = checkInstallerStatus;
    }

    /**
     * Initializes node for the auto update, registers messages and node side funtions
     * @param {object} initObj - json containing init information {
     *                         messageIds : Messages for brackets and node communication
     *                         updateDir  : update directory in Appdata }
     */
    function initNode(initObj) {
        MessageIds = initObj.messageIds;
        updateDir = path.resolve(initObj.updateDir);
        logFilePath = path.resolve(updateDir, logFile);
        installStatusFilePath = path.resolve(updateDir, installStatusFile);
        registerNodeFunctions();
        postMessageToBrackets(MessageIds.REGISTER_BRACKETS_FUNCTIONS);
    }


    /**
     * Receives messages from brackets
     * @param {object} msgObj - json containing - {
     *                          fn - function to execute on node side
     *                          args - arguments to the above function }
     */
    function receiveMessageFromBrackets(msgObj) {
        functionMap[msgObj.fn].apply(null, msgObj.args);
    }

    /**
     * Initialize the domain with commands and events related to AutoUpdate
     * @param {DomainManager} domainManager - The DomainManager for AutoUpdateDomain
     */

    function init(domainManager) {
        if (!domainManager.hasDomain("AutoUpdate")) {
            domainManager.registerDomain("AutoUpdate", {
                major: 0,
                minor: 1
            });
        }
        _domainManager = domainManager;

        domainManager.registerCommand(
            "AutoUpdate",
            "initNode",
            initNode,
            true,
            "Initializes node for the auto update",
            [
                {
                    name: "initObj",
                    type: "object",
                    description: "json object containing init information"
                }
            ],
            []
        );

        domainManager.registerCommand(
            "AutoUpdate",
            "data",
            receiveMessageFromBrackets,
            true,
            "Receives messages from brackets",
            [
                {
                    name: "msgObj",
                    type: "object",
                    description: "json object containing message info"
                }
            ],
            []
        );

        domainManager.registerEvent(
            "AutoUpdate",
            "data",
            [
                {
                    name: "msgObj",
                    type: "object",
                    description: "json object containing message info to pass to brackets"
                }
            ]
        );
    }

    exports.init = init;

}());

