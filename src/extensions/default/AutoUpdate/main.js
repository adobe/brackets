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

define(function (require, exports, module) {
    "use strict";

    var CommandManager          = brackets.getModule("command/CommandManager"),
        MainViewManager         = brackets.getModule("view/MainViewManager"),
        Commands                = brackets.getModule("command/Commands"),
        AppInit                 = brackets.getModule("utils/AppInit"),
        UpdateNotification      = brackets.getModule("utils/UpdateNotification"),
        NodeDomain              = brackets.getModule("utils/NodeDomain"),
        FileSystem              = brackets.getModule("filesystem/FileSystem"),
        FileUtils               = brackets.getModule("file/FileUtils"),
        Strings                 = brackets.getModule("strings"),
        StateHandler            = require("StateHandler"),
        DocumentCommandHandlers = brackets.getModule("document/DocumentCommandHandlers"),
        MessageIds              = require("MessageIds"),
        UpdateStatus            = require("UpdateStatus"),
        UpdateInfoBar           = require("UpdateInfoBar");


    var _modulePath = FileUtils.getNativeModuleDirectoryPath(module),
        _nodePath = "node/AutoUpdateDomain",
        _domainPath = [_modulePath, _nodePath].join("/"),
        updateDomain = new NodeDomain("AutoUpdate", _domainPath);

    var appSupportDirectory = brackets.app.getApplicationSupportDirectory(),
        updateDir = appSupportDirectory + '/updateTemp',
        updateJsonPath = updateDir + '/' + 'updateHelper.json';

    var updateJsonHandler = new StateHandler.StateHandler(updateJsonPath);

    var MAX_DOWNLOAD_ATTEMPTS = 6,
        downloadAttemptsRemaining;

    // function map for brackets functions
    var functionMap = {};

    var _updateParams;

    var _nodeErrorMessages = {
        UPDATEDIR_READ_FAILED: 0,
        UPDATEDIR_CLEAN_FAILED: 1,
        CHECKSUM_DID_NOT_MATCH: 2,
        INSTALLER_NOT_FOUND: 3,
        DOWNLOAD_ERROR: 4
    };

    /*
     * Checks if Brackets version got updated
     * @returns {boolean}  true if version updated, false otherwise
     */
    function checkIfVersionUpdated() {

        var latestBuildNumber = updateJsonHandler.get("latestBuildNumber"),
            currentBuildNumber = Number(/-([0-9]+)/.exec(brackets.metadata.version)[1]);

        return latestBuildNumber === currentBuildNumber;
    }

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
     * Posts messages to node
     * @param {string} messageId - Message to be passed
     */
    function postMessageToNode(messageId) {
        var msg = {
            fn: messageId,
            args: getFunctionArgs(arguments)
        };
        updateDomain.exec('data', msg);
    }

    /**
     * Checks and handles the update success and failure scenarios
     */
    function checkUpdateStatus() {
        var filesToCache = null,
            downloadCompleted = updateJsonHandler.get("downloadCompleted"),
            updateInitiatedInPrevSession = updateJsonHandler.get("updateInitiatedInPrevSession");

        if (downloadCompleted && updateInitiatedInPrevSession) {
            var isNewVersion = checkIfVersionUpdated();
            if (isNewVersion) {
                // We get here if the update was successful
                UpdateInfoBar.showUpdateBar({
                    type: "success",
                    title: Strings.UPDATE_SUCCESSFUL,
                    description: ""
                });
            } else {
                // We get here if the update started but failed
                filesToCache = ['.logs']; //AUTOUPDATE_PRERELEASE
                UpdateInfoBar.showUpdateBar({
                    type: "error",
                    title: Strings.UPDATE_FAILED,
                    description: Strings.GO_TO_SITE
                });
            }
        } else if (downloadCompleted && !updateInitiatedInPrevSession) {
            // We get here if the download was complete and user selected UpdateLater
            if (brackets.platform === "mac") {
                filesToCache = ['.dmg', '.json'];
            } else if (brackets.platform === "win") {
                filesToCache = ['.msi', '.json'];
            }
        }

        postMessageToNode(MessageIds.PERFORM_CLEANUP, filesToCache);
    }

    /**
     * Initializes the state for AutoUpdate process
     * @returns {$.Deferred} - a jquery promise,
     *                       that is resolved with success or failure
     *                       of state initialization
     */
    function initializeState() {
        var result = $.Deferred();

        FileSystem.resolve(updateDir, function (err) {
            if (!err) {
                result.resolve();
            } else {
                var directory = FileSystem.getDirectoryForPath(updateDir);
                directory.create(function (error) {
                    if (error) {
                        console.error('AutoUpdate : Error in creating update directory in Appdata');
                        result.reject();
                    } else {
                        result.resolve();
                    }
                });
            }
        });

        return result.promise();
    }

    /**
     * Enables/disables the state of "Check For Updates" menu entry under Help Menu
     */
    function enableCheckForUpdateEntry(enable) {
        var cfuCommand = CommandManager.get(Commands.HELP_CHECK_FOR_UPDATE);
        cfuCommand.setEnabled(enable);
    }

    /**
     * Checks if it is the first iteration of download
     * @returns {boolean} - true if first iteration, false if is a retrial of download
     */
    function isFirstIterationDownload() {
        return (downloadAttemptsRemaining === MAX_DOWNLOAD_ATTEMPTS);
    }

    /**
     * Resets the update state in updatehelper.json in case of failure,
     * and logs an error with the message
     * @param {string} message - the message to be logged onto console
     */
    function resetStateInFailure(message) {
        updateJsonHandler.reset();
        UpdateInfoBar.showUpdateBar({
            type: "error",
            title: Strings.UPDATE_FAILED,
            description: ""
        });
        console.error(message);
    }

    /**
     * Sets the update state in updateHelper.json in Appdata
     * @param {string} key   - key to be set
     * @param {string} value  - value to be set
     * @param {function} callback - the callback function
     *                            to be called in case of
     *                            successful setting of update state
     */
    function setUpdateStateInJSON(key, value, callback) {
        var cb = callback || function() {};
        updateJsonHandler.set(key, value)
        .done(function() {
            cb();
        })
        .fail(function(){
            resetStateInFailure("AutoUpdate : Could not modify updatehelper.json");
        });
    }

    /**
     * Handles a safe download of the latest installer,
     * safety is ensured by cleaning up any pre-existing installers
     * from update directory before beginning a fresh download
     */
    function handleSafeToDownload() {

        var downloadCB = function() {
            if (isFirstIterationDownload()) {
            // For the first iteration of download, show download status info in Status bar, and pass download to node
                UpdateStatus.showUpdateStatus("initial-download");
                postMessageToNode(MessageIds.DOWNLOAD_INSTALLER, true);
            } else {
            /* For the retry iterations of download, modify the
            download status info in Status bar, and pass download to node */
                var attempt = (MAX_DOWNLOAD_ATTEMPTS - downloadAttemptsRemaining);
                if (attempt > 1) {
                    var info = attempt.toString() + "/5";
                    var status = {
                        target: "retry-download",
                        spans: [{
                            id: "attempt",
                            val: info
                        }]
                    };
                    UpdateStatus.modifyUpdateStatus(status);
                } else {
                    UpdateStatus.showUpdateStatus("retry-download");
                }
                postMessageToNode(MessageIds.DOWNLOAD_INSTALLER, false);
            }

            --downloadAttemptsRemaining;
        };
        setUpdateStateInJSON('downloadCompleted', false, downloadCB);
    }

    /**
     * Checks if there is an active internet connection available
     * @returns {boolean} - true if online, false otherwise
     */
    function checkIfOnline() {
        return window.navigator.onLine;
    }

    /**
     * Attempts a download of the latest installer, while cleaning up any existing downloaded installers
     */
    function attemptToDownload() {
        if (checkIfOnline()) {
            postMessageToNode(MessageIds.PERFORM_CLEANUP, ['.json'], true);
        } else {
            UpdateInfoBar.showUpdateBar({
                type: "warning",
                title: Strings.DOWNLOAD_FAILED,
                description: Strings.INTERNET_UNAVAILABLE
            });
        }
    }

    /**
     * Validates the checksum of a file against a given checksum
     * @param {object} params - json containing {
     *                        filePath - path to the file,
     *                        expectedChecksum - the checksum to validate against }
     */
    function validateChecksum(params) {
        postMessageToNode(MessageIds.VALIDATE_INSTALLER, params);
    }

    /**
     * Gets the latest installer, by either downloading a new one or fetching the cached download.
     */
    function getLatestInstaller() {
        var downloadCompleted = updateJsonHandler.get('downloadCompleted');
        if (!downloadCompleted) {
            attemptToDownload();
        } else {
            validateChecksum();
        }
    }

    /**
     * Handles the show status information callback from Node.
     * It modifies the info displayed on Status bar.
     * @param {object} statusObj - json containing status info {
     *                         target - id of string to display,
     *                         spans - Array containing json objects of type - {
     *                             id - span id,
     *                             val - string to fill the span element with }
     *                         }
     */
    function showStatusInfo(statusObj) {
        if (statusObj.target === "initial-download") {
            UpdateStatus.modifyUpdateStatus(statusObj);
        }
        UpdateStatus.displayProgress(statusObj);
    }

    /**
     * Handles the error messages from Node, in a popup displayed to the user.
     * @param {string} message - error string
     */
    function showErrorMessage(message) {
        var descriptionMessage;

        switch (message) {
        case _nodeErrorMessages.UPDATEDIR_READ_FAILED:
            descriptionMessage = Strings.UPDATEDIR_READ_FAILED;
            break;
        case _nodeErrorMessages.UPDATEDIR_CLEAN_FAILED:
            descriptionMessage = Strings.UPDATEDIR_CLEAN_FAILED;
            break;
        }

        UpdateInfoBar.showUpdateBar({
            type: "error",
            title: Strings.CLEANUP_FAILED,
            description: descriptionMessage
        });
    }

    /**
     * Initiates the update process, when user clicks UpdateNow in the update popup
     * @param {string} formattedInstallerPath - formatted path to the latest installer
     * @param {string} formattedLogFilePath  - formatted path to the installer log file
     * @param {string} installStatusFilePath  -  path to the install status log file
     */
    function initiateUpdateProcess(formattedInstallerPath, formattedLogFilePath, installStatusFilePath) {
        function getAdditionalParams() {
            var retval = {};
            var installDir = FileUtils.getNativeBracketsDirectoryPath();
            if (installDir.indexOf("www") < 0) {
                installDir = "/Applications/Brackets.app/Contents/www";
                // HARDCODED FOR DEBUGGING //AutoUpdate : TODO : remove this
            }
            if (installDir) {
                //AutoUpdate : TODO : For debugging purposes, change this string
                var appPath = installDir.split("/Contents/www")[0];
                installDir = appPath.substr(0, appPath.lastIndexOf('/'));
                var appName = appPath.substr(appPath.lastIndexOf('/') + 1);

                retval = {
                    installDir: installDir,
                    appName: appName,
                    updateDir: updateDir
                };
            }
            return retval;
        }

        var updateCB = function () {
            var infoObj = {
                installerPath: formattedInstallerPath,
                logFilePath: formattedLogFilePath,
                installStatusFilePath: installStatusFilePath
            };
            if (brackets.platform === "mac") {
                var additionalParams = getAdditionalParams();
                infoObj.installDir = additionalParams.installDir;
                infoObj.appName = additionalParams.appName;
                infoObj.updateDir = additionalParams.updateDir;

            }
            brackets.app.setUpdateParamsAndQuit(JSON.stringify(infoObj), function (err) {
                if (err === 0) {
                    CommandManager.execute(Commands.FILE_QUIT);
                } else {
                    resetStateInFailure("AutoUpdate : Update parameters could not be set for the installer. Error encountered: " + err);
                }
            });
        };
        setUpdateStateInJSON('updateInitiatedInPrevSession', true, updateCB);
    }

    /**
     * Handles the installer validation callback from Node
     * @param {object} statusObj - json containing - {
     *                           valid - (boolean)true for a valid installer, false otherwise,
     *                           installerPath, logFilePath, installStatusFilePath - for a valid       *                             installer,
     *                           err - for an invalid installer }
     */
    function handleValidationStatus(statusObj) {
        enableCheckForUpdateEntry(true);
        UpdateStatus.cleanUpdateStatus();
        if (statusObj.valid) {
            var statusValidCB = function(){

                var restartBtnClicked = function() {
                    MainViewManager.off(UpdateInfoBar.RESTART_BTN_CLICKED);
                    initiateUpdateProcess(statusObj.installerPath, statusObj.logFilePath, statusObj.installStatusFilePath);
                };
                var laterBtnClicked = function() {
                    MainViewManager.off(UpdateInfoBar.LATER_BTN_CLICKED);
                    setUpdateStateInJSON('updateInitiatedInPrevSession', false);
                };
                MainViewManager.on(UpdateInfoBar.RESTART_BTN_CLICKED, restartBtnClicked);
                MainViewManager.on(UpdateInfoBar.LATER_BTN_CLICKED, laterBtnClicked);
                UpdateInfoBar.showUpdateBar({
                    title: Strings.DOWNLOAD_COMPLETE,
                    description: Strings.CLICK_RESTART_TO_UPDATE,
                    needButtons: true
                });
            };
            setUpdateStateInJSON('downloadCompleted', true, statusValidCB);
        } else {
            if (updateJsonHandler.get("downloadCompleted")) {
                updateJsonHandler.reset();
                var statusInvalidCB = function() {
                    downloadAttemptsRemaining = MAX_DOWNLOAD_ATTEMPTS;
                    getLatestInstaller();
                };
                setUpdateStateInJSON('downloadCompleted', false, statusInvalidCB);

            } else {
                var descriptionMessage;
                switch (statusObj.err) {
                case _nodeErrorMessages.CHECKSUM_DID_NOT_MATCH:
                    descriptionMessage = Strings.CHECKSUM_DID_NOT_MATCH;
                    break;
                case _nodeErrorMessages.INSTALLER_NOT_FOUND:
                    descriptionMessage = Strings.INSTALLER_NOT_FOUND;
                    break;
                }
                UpdateInfoBar.showUpdateBar({
                    type: "error",
                    title: Strings.VALIDATION_FAILED,
                    description: descriptionMessage
                });
            }
        }
    }

    /**
     * Handles the download failure callback from Node
     * @param {string} message - reason of download failure
     */
    function handleDownloadFailure(message) {
        console.log("AutoUpdate : Download of latest installer failed in Attempt " +
            (MAX_DOWNLOAD_ATTEMPTS - downloadAttemptsRemaining) + ".\n Reason : " + message);
        if (downloadAttemptsRemaining) {
            attemptToDownload();
        } else {
            enableCheckForUpdateEntry(true);
            UpdateStatus.cleanUpdateStatus();
            var descriptionMessage;
            if (message === _nodeErrorMessages.DOWNLOAD_ERROR) {
                descriptionMessage = Strings.DOWNLOAD_ERROR;
            }
            UpdateInfoBar.showUpdateBar({
                type: "error",
                title: Strings.DOWNLOAD_FAILED,
                description: descriptionMessage
            });
        }

    }

    /**
     * Handles the auto update event, which is triggered when user clicks GetItNow in UpdateNotification dialog
     * @param {object} event    - event emitted on click of GetItNow
     * @param {object} updateParams - json object containing update information {
     *                              installerName - name of the installer
     *                              downloadURL - download URL
     *                              latestBuildNumber - build number
     *                              checksum - checksum }
     */
    function handleGetNow(event, updateParams) {
        _updateParams = updateParams;
        downloadAttemptsRemaining = MAX_DOWNLOAD_ATTEMPTS;
        initializeState()
            .done(function () {
                postMessageToNode(MessageIds.INITIALIZE_STATE, _updateParams);
            })
            .fail(function () {
                UpdateInfoBar.showUpdateBar({
                    type: "error",
                    title: Strings.INITIALISATION_FAILED,
                    description: ""
                });
            });
    }

    /**
     * Handles the completion of node state initialization
     */
    function handleInitializationComplete() {
        enableCheckForUpdateEntry(false);
        getLatestInstaller();
    }

    /**
     * Handles the Cancel button click by user in
     * Unsaved changes prompt, which would come up if user
     * has dirty files and he/she clicked UpdateNow
     */
    function dirtyFileSaveCancelled() {
        UpdateInfoBar.showUpdateBar({
            type: "warning",
            title: Strings.WARNING_TYPE,
            description: Strings.UPDATE_ON_NEXT_LAUNCH
        });
    }

    /**
     * Handles the scenario where auto update in progress check returns error
     */
    function handleAutoUpdateError() {
        resetStateInFailure("AutoUpdate : Error returned in auto update in progress check");
    }

    /**
     * Handles Download completion callback from Node
     */
    function handleDownloadSuccess() {
        UpdateStatus.showUpdateStatus("validating-installer");
        validateChecksum();
    }

    /**
     * Receives messages from node
     * @param {object} event  - event received from node
     * @param {object}   msgObj - json containing - {
     *                          fn - function to execute on Brackets side
     *                          args - arguments to the above function
     */
    function receiveMessageFromNode(event, msgObj) {
        functionMap[msgObj.fn].apply(null, msgObj.args);
    }

    /**
     * Generates a map for brackets side functions
     */
    function registerBracketsFunctions() {
        functionMap["brackets.notifyinitializationComplete"] = handleInitializationComplete;
        functionMap["brackets.showStatusInfo"]               = showStatusInfo;
        functionMap["brackets.notifyDownloadSuccess"]        = handleDownloadSuccess;
        functionMap["brackets.showErrorMessage"]             = showErrorMessage;
        functionMap["brackets.notifyDownloadFailure"]        = handleDownloadFailure;
        functionMap["brackets.notifySafeToDownload"]         = handleSafeToDownload;
        functionMap["brackets.notifyvalidationStatus"]       = handleValidationStatus;
    }

    functionMap["brackets.registerBracketsFunctions"] = registerBracketsFunctions;

    UpdateNotification.on(UpdateNotification.GET_AUTOUPDATE_INSTALLER, handleGetNow);
    CommandManager.on(DocumentCommandHandlers.DIRTY_FILESAVE_CANCELLED, dirtyFileSaveCancelled);
    CommandManager.on(DocumentCommandHandlers.AUTOUPDATE_ERROR, handleAutoUpdateError);

    updateDomain.exec('initNode', {
        messageIds: MessageIds,
        updateDir: updateDir
    });
    updateDomain.on('data', receiveMessageFromNode);

    AppInit.appReady(function () {
        updateJsonHandler.parse()
            .done(function () {
                checkUpdateStatus();
            })
            .fail(function (code) {
                var logMsg;
                switch(code) {
                case StateHandler.FILE_NOT_FOUND :
                    logMsg = "AutoUpdate : updateHelper.json cannot be parsed, does not exist";
                    break;
                case StateHandler.FILE_NOT_READ :
                    logMsg = "AutoUpdate : updateHelper.json could not be read";
                    break;
                case StateHandler.FILE_PARSE_EXCEPTION :
                    logMsg = "AutoUpdate : updateHelper.json could not be parsed, exception encountered";
                    break;
                case StateHandler.FILE_READ_FAIL :
                    logMsg = "AutoUpdate : updateHelper.json could not be parsed";
                    break;
                }
                console.log(logMsg);
            });
    });

});