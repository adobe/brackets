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
/* eslint-disable indent */
/* eslint-disable max-len */

define(function (require, exports, module) {
    "use strict";

    var CommandManager          = brackets.getModule("command/CommandManager"),
        ProjectManager          = brackets.getModule("project/ProjectManager"),
        Commands                = brackets.getModule("command/Commands"),
        AppInit                 = brackets.getModule("utils/AppInit"),
        UpdateNotification      = brackets.getModule("utils/UpdateNotification"),
        DocumentCommandHandlers = brackets.getModule("document/DocumentCommandHandlers"),
        NodeDomain              = brackets.getModule("utils/NodeDomain"),
        FileSystem              = brackets.getModule("filesystem/FileSystem"),
        PreferencesManager      = brackets.getModule("preferences/PreferencesManager"),
        FileUtils               = brackets.getModule("file/FileUtils"),
        Strings                 = brackets.getModule("strings"),
        HealthLogger            = brackets.getModule("utils/HealthLogger"),
        StateHandlerModule      = require("StateHandler"),
        MessageIds              = require("MessageIds"),
        UpdateStatus            = require("UpdateStatus"),
        UpdateInfoBar           = require("UpdateInfoBar");


    var _modulePath = FileUtils.getNativeModuleDirectoryPath(module),
        _nodePath = "node/AutoUpdateDomain",
        _domainPath = [_modulePath, _nodePath].join("/"),
        updateDomain,
        domainID;

    var appSupportDirectory = brackets.app.getApplicationSupportDirectory(),
        updateDir = appSupportDirectory + '/updateTemp',
        updateJsonPath = updateDir + '/' + 'updateHelper.json';

    var StateHandler = StateHandlerModule.StateHandler,
        StateHandlerMessages = StateHandlerModule.MessageKeys;

    var updateJsonHandler;

    var MAX_DOWNLOAD_ATTEMPTS = 6,
        downloadAttemptsRemaining;

	// Below Strings are to identify an AutoUpdate Event.
    var autoUpdateEventNames = {
        AUTOUPDATE_DOWNLOAD_START: "DownloadStarted",
        AUTOUPDATE_DOWNLOAD_COMPLETED: "DownloadCompleted",
        AUTOUPDATE_DOWNLOAD_FAILED: "DownloadFailed",
        AUTOUPDATE_DOWNLOAD_COMPLETE_USER_CLICK_RESTART: "DownloadCompletedAndUserClickedRestart",
        AUTOUPDATE_DOWNLOAD_COMPLETE_USER_CLICK_LATER: "DownloadCompletedAndUserClickedLater",
        AUTOUPDATE_DOWNLOADCOMPLETE_UPDATE_BAR_RENDERED: "DownloadCompleteUpdateBarRendered",
        AUTOUPDATE_INSTALLATION_FAILED: "InstallationFailed",
        AUTOUPDATE_INSTALLATION_SUCCESS: "InstallationSuccess",
        AUTOUPDATE_CLEANUP_FAILED: "AutoUpdateCleanUpFailed"
    };

    // function map for brackets functions
    var functionMap = {};

    var _updateParams;

    //Namespacing the event
    var APP_QUIT_CANCELLED = DocumentCommandHandlers.APP_QUIT_CANCELLED + ".auto-update";

    var _nodeErrorMessages = {
        UPDATEDIR_READ_FAILED: 0,
        UPDATEDIR_CLEAN_FAILED: 1,
        CHECKSUM_DID_NOT_MATCH: 2,
        INSTALLER_NOT_FOUND: 3,
        DOWNLOAD_ERROR: 4,
        NETWORK_SLOW_OR_DISCONNECTED: 5
    };

    var updateProgressKey = "autoUpdateInProgress",
        isAutoUpdateInitiated = false;

    /**
     * Checks if an auto update session is currently in progress
     * @returns {boolean} - true if an auto update session is currently in progress, false otherwise
     */
    function checkIfAnotherSessionInProgress() {
        var result = $.Deferred();
        if(updateJsonHandler) {
            var state = updateJsonHandler.state;

            updateJsonHandler.refresh()
                .done(function() {
                    var val = updateJsonHandler.get(updateProgressKey);
                    if(val !== null) {
                        result.resolve(val);
                    } else {
                        result.reject();
                    }
                })
                .fail(function() {
                    updateJsonHandler.state = state;
                    result.reject();
                });
        }
        return result.promise();
    }

    /**
     * Checks if auto update preference is enabled or disabled
     * @private
     * @returns {boolean} - true if preference enabled, false otherwise
     */
    function _isAutoUpdateEnabled() {
        return (PreferencesManager.get("autoUpdate.AutoUpdate") !== false);
    }

    /**
     * Receives messages from node
     * @param {object} event  - event received from node
     * @param {object}   msgObj - json containing - {
     *                          fn - function to execute on Brackets side
     *                          args - arguments to the above function
     *                          requester - ID of the current requester domain
     */
    function receiveMessageFromNode(event, msgObj) {
        if (functionMap[msgObj.fn]) {
            if(domainID === msgObj.requester) {
                functionMap[msgObj.fn].apply(null, msgObj.args);
            }
        }
    }

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
            args: getFunctionArgs(arguments),
            requester: domainID
        };
        updateDomain.exec('data', msg);
    }

     /**
     * Checks Install failure scenarios
     */
    function checkInstallationStatus() {
        var searchParams = {
                "updateDir": updateDir,
                "installErrorStr": ["ERROR:"],
                "bracketsErrorStr": ["ERROR:"],
                "encoding": "utf8"
            },
            // Below are the possible Windows Installer error strings, which will be searched for in the installer logs to track failures.
            winInstallErrorStrArr = [
                "Installation success or error status",
                "Reconfiguration success or error status"
            ];
        if (brackets.platform === "win") {
            searchParams.installErrorStr = winInstallErrorStrArr;
            searchParams.encoding = "utf16le";
        }
        postMessageToNode(MessageIds.CHECK_INSTALLER_STATUS, searchParams);
    }

     /**
     * Checks and handles the update success and failure scenarios
     */
    function checkUpdateStatus() {
        var filesToCache = ['.logs'],
            downloadCompleted = updateJsonHandler.get("downloadCompleted"),
            updateInitiatedInPrevSession = updateJsonHandler.get("updateInitiatedInPrevSession");

        if (downloadCompleted && updateInitiatedInPrevSession) {
            var isNewVersion = checkIfVersionUpdated();
            updateJsonHandler.reset();
            if (isNewVersion) {
                // We get here if the update was successful
                UpdateInfoBar.showUpdateBar({
                    type: "success",
                    title: Strings.UPDATE_SUCCESSFUL,
                    description: ""
                });
                HealthLogger.sendAnalyticsData(
                    autoUpdateEventNames.AUTOUPDATE_INSTALLATION_SUCCESS,
                    "autoUpdate",
                    "install",
                    "complete",
                    ""
                );
            } else {
                // We get here if the update started but failed
                checkInstallationStatus();
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
     * Send Installer Error Code to Analytics Server
     */

    function handleInstallationStatus(statusObj) {
        var errorCode = "",
            errorline = statusObj.installError;
        if (errorline) {
            errorCode = errorline.substr(errorline.lastIndexOf(':') + 2, errorline.length);
        }
        HealthLogger.sendAnalyticsData(
            autoUpdateEventNames.AUTOUPDATE_INSTALLATION_FAILED,
            "autoUpdate",
            "install",
            "fail",
            errorCode
        );
    }


     /**
     * Initializes the state of parsed content from updateHelper.json
     * returns Promise Object Which is resolved when parsing is success
     * and rejected if parsing is failed.
     */
    function initState() {
        var result = $.Deferred();
        updateJsonHandler.parse()
            .done(function() {
                result.resolve();
            })
            .fail(function (code) {
                var logMsg;
                switch (code) {
                case StateHandlerMessages.FILE_NOT_FOUND:
                    logMsg = "AutoUpdate : updateHelper.json cannot be parsed, does not exist";
                    break;
                case StateHandlerMessages.FILE_NOT_READ:
                    logMsg = "AutoUpdate : updateHelper.json could not be read";
                    break;
                case StateHandlerMessages.FILE_PARSE_EXCEPTION:
                    logMsg = "AutoUpdate : updateHelper.json could not be parsed, exception encountered";
                    break;
                case StateHandlerMessages.FILE_READ_FAIL:
                    logMsg = "AutoUpdate : updateHelper.json could not be parsed";
                    break;
                }
                console.log(logMsg);
                result.reject();
            });
        return result.promise();
    }



    /**
     * Sets up the Auto Update environment
     */
    function setupAutoUpdate() {
        updateJsonHandler = new StateHandler(updateJsonPath);
        updateDomain.on('data', receiveMessageFromNode);

        updateDomain.exec('initNode', {
            messageIds: MessageIds,
            updateDir: updateDir,
            requester: domainID
        });
    }


     /**
     * Generates the extension for installer file, based on platform
     * @returns {string} - OS - current OS }
     */
    function getPlatformInfo() {
        var OS = "";

        if (/Windows|Win32|WOW64|Win64/.test(window.navigator.userAgent)) {
            OS = "WIN";
        } else if (/Mac/.test(window.navigator.userAgent)) {
            OS = "OSX";
        } else if (/Linux|X11/.test(window.navigator.userAgent)) {
            OS = "LINUX32";
            if (/x86_64/.test(window.navigator.appVersion + window.navigator.userAgent)) {
                OS = "LINUX64";
            }
        }

        return OS;
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
     * Handles the auto update event, which is triggered when user clicks GetItNow in UpdateNotification dialog
     * @param {object} updateParams - json object containing update information {
     *                              installerName - name of the installer
     *                              downloadURL - download URL
     *                              latestBuildNumber - build number
     *                              checksum - checksum }
     */
    function initiateAutoUpdate(updateParams) {
        _updateParams = updateParams;
        downloadAttemptsRemaining = MAX_DOWNLOAD_ATTEMPTS;

        initializeState()
            .done(function () {

                 var setUpdateInProgress = function() {
                    var initNodeFn = function () {
                        isAutoUpdateInitiated = true;
                        postMessageToNode(MessageIds.INITIALIZE_STATE, _updateParams);
                    };

                    if (updateJsonHandler.get('latestBuildNumber') !== _updateParams.latestBuildNumber) {
                        setUpdateStateInJSON('latestBuildNumber', _updateParams.latestBuildNumber)
                            .done(initNodeFn);
                    } else {
                        initNodeFn();
                    }
                };

                checkIfAnotherSessionInProgress()
                    .done(function(inProgress) {
                        if(inProgress) {
                            UpdateInfoBar.showUpdateBar({
                                type: "error",
                                title: Strings.AUTOUPDATE_ERROR,
                                description: Strings.AUTOUPDATE_IN_PROGRESS
                            });
                        } else {
                             setUpdateStateInJSON("autoUpdateInProgress", true)
                                .done(setUpdateInProgress);

                        }
                    })
                    .fail(function() {
                        setUpdateStateInJSON("autoUpdateInProgress", true)
                            .done(setUpdateInProgress);

                    });

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
     * Typical signature of an update entry, with the most frequently used keys
     * @typedef {Object} Update~Entry
     * @property {Number} buildNumber - The build number for the update
     * @property {string} versionString - Version for the update
     * @property {string} releaseNotesURL - URL for release notes for the update
     * @property {array} newFeatures - Array of new features in the update
     * @property {boolean} prerelease - Boolean to distinguish prerelease from a stable release
     * @property {Object} platforms - JSON object, containing asset info for the update, for each platform
     *                        Asset info for each platform consists of :
     *                        @property {string} checksum - checksum of the asset
     *                        @property {string} downloadURL - download URL of the asset
     *
     */

    /**
     * Handles and processes the update info, required for app auto update
     * @private
     * @param {Array} updates - array of {...Update~Entry} update entries
     */
    function _updateProcessHandler(updates) {

            if (!updates) {
                console.warn("AutoUpdate : updates information not available.");
                return;
            }
            var OS = getPlatformInfo(),
                checksum,
                downloadURL,
                installerName,
                platforms,
                latestUpdate;

            latestUpdate = updates[0];
            platforms = latestUpdate ? latestUpdate.platforms : null;

            if (platforms && platforms[OS]) {

                //If no checksum field is present then we're setting it to 0, just as a safety check,
                // although ideally this situation should never occur in releases post its introduction.
                checksum = platforms[OS].checksum ? platforms[OS].checksum : 0,
                downloadURL = platforms[OS].downloadURL ? platforms[OS].downloadURL : "",
                installerName = downloadURL ? downloadURL.split("/").pop() : "";

            } else {
                // Update not present for current platform
                return;
            }

            if (!checksum || !downloadURL || !installerName) {
                console.warn("AutoUpdate : asset information incorrect for the update");
                return;
            }

            var updateParams = {
                downloadURL: downloadURL,
                installerName: installerName,
                latestBuildNumber: latestUpdate.buildNumber,
                checksum: checksum
            };


            //Initiate the auto update, with update params
            initiateAutoUpdate(updateParams);
    }


     /**
     * Unregisters the App Quit event handler
     */
    function resetAppQuitHandler() {
        DocumentCommandHandlers.off(APP_QUIT_CANCELLED);
    }


    /**
     * Unsets the Auto Update environment
     */
    function unsetAutoUpdate() {
        updateJsonHandler = null;
        updateDomain.off('data');
        resetAppQuitHandler();
    }


    /**
     * Defines preference to enable/disable Auto Update
     */
    function setupAutoUpdatePreference() {
        PreferencesManager.definePreference("autoUpdate.AutoUpdate", "boolean", true, {
            description: Strings.DESCRIPTION_AUTO_UPDATE
        });

        // Set or unset the auto update, based on preference state change
        PreferencesManager.on("change", "autoUpdate.AutoUpdate", function () {
            if (_isAutoUpdateEnabled()) {
                setupAutoUpdate();
                UpdateNotification.registerUpdateHandler(_updateProcessHandler);
            } else {
                unsetAutoUpdate();
                UpdateNotification.resetToDefaultUpdateHandler();
            }
        });
    }


    /**
     * Creates the Node Domain for Auto Update
     */
    function setupAutoUpdateDomain() {
        updateDomain = new NodeDomain("AutoUpdate", _domainPath);
    }


    /**
     * Overriding the appReady for Auto update
     */

    AppInit.appReady(function () {

        // Auto Update is supported on Win and Mac, as of now
        if (brackets.platform === "linux" || !(brackets.app.setUpdateParams)) {
            return;
        }
        setupAutoUpdateDomain();

        //Bail out if update domain could not be created
        if (!updateDomain) {
            return;
        }

        // Check if the update domain is properly initialised
        updateDomain.promise()
             .done(function () {
                setupAutoUpdatePreference();
                if (_isAutoUpdateEnabled()) {
                    domainID = (new Date()).getTime().toString();
                    setupAutoUpdate();
                    UpdateNotification.registerUpdateHandler(_updateProcessHandler);
                }
            })
             .fail(function (err) {
                console.error("AutoUpdate : node domain could not be initialized.");
                return;
            });
    });

    /**
     * Enables/disables the state of "Auto Update In Progress" in UpdateHandler.json
     */
    function nodeDomainInitialized(reset) {
        initState()
            .done(function () {
                var inProgress = updateJsonHandler.get(updateProgressKey);
                if (inProgress && reset) {
                    setUpdateStateInJSON(updateProgressKey, !reset)
                        .always(checkUpdateStatus);
                 } else if (!inProgress) {
                    checkUpdateStatus();
                }
            });
    }


    /**
     * Enables/disables the state of "Check For Updates" menu entry under Help Menu
     */
    function enableCheckForUpdateEntry(enable) {
        var cfuCommand = CommandManager.get(Commands.HELP_CHECK_FOR_UPDATE);
        cfuCommand.setEnabled(enable);
        UpdateNotification.enableUpdateNotificationIcon(enable);
    }

    /**
     * Checks if it is the first iteration of download
     * @returns {boolean} - true if first iteration, false if it is a retrial of download
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

        enableCheckForUpdateEntry(true);
        console.error(message);

    }

    /**
     * Sets the update state in updateHelper.json in Appdata
     * @param   {string} key   - key to be set
     * @param   {string} value - value to be set
     * @returns {$.Deferred} - a jquery promise, that is resolved with
     *                       success or failure of state update in json file
     */
    function setUpdateStateInJSON(key, value) {
         var result = $.Deferred();

        updateJsonHandler.set(key, value)
            .done(function () {
                result.resolve();
            })
            .fail(function () {
                resetStateInFailure("AutoUpdate : Could not modify updatehelper.json");
                result.reject();
            });
        return result.promise();
    }

    /**
     * Handles a safe download of the latest installer,
     * safety is ensured by cleaning up any pre-existing installers
     * from update directory before beginning a fresh download
     */
    function handleSafeToDownload() {
        var downloadFn = function () {
            if (isFirstIterationDownload()) {
                // For the first iteration of download, show download
                //status info in Status bar, and pass download to node
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

        if(!isAutoUpdateInitiated) {
            isAutoUpdateInitiated = true;
            updateJsonHandler.refresh()
                .done(function() {
                    setUpdateStateInJSON('downloadCompleted', false)
                        .done(downloadFn);
                });
        } else {
            setUpdateStateInJSON('downloadCompleted', false)
                .done(downloadFn);
        }
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
            enableCheckForUpdateEntry(true);
            UpdateStatus.cleanUpdateStatus();
            HealthLogger.sendAnalyticsData(
                autoUpdateEventNames.AUTOUPDATE_DOWNLOAD_FAILED,
                "autoUpdate",
                "download",
                "fail",
                "No Internet connection available."
            );
            UpdateInfoBar.showUpdateBar({
                type: "warning",
                title: Strings.DOWNLOAD_FAILED,
                description: Strings.INTERNET_UNAVAILABLE
            });

            setUpdateStateInJSON("autoUpdateInProgress", false);
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
            HealthLogger.sendAnalyticsData(
                autoUpdateEventNames.AUTOUPDATE_DOWNLOAD_START,
                "autoUpdate",
                "download",
                "started",
                ""
            );
            UpdateStatus.modifyUpdateStatus(statusObj);
        }
        UpdateStatus.displayProgress(statusObj);
    }

    /**
     * Handles the error messages from Node, in a popup displayed to the user.
     * @param {string} message - error string
     */
    function showErrorMessage(message) {
        var analyticsDescriptionMessage = "";

        switch (message) {
        case _nodeErrorMessages.UPDATEDIR_READ_FAILED:
            analyticsDescriptionMessage = "Update directory could not be read.";
            break;
        case _nodeErrorMessages.UPDATEDIR_CLEAN_FAILED:
            analyticsDescriptionMessage = "Update directory could not be cleaned.";
            break;
        }
        console.log("AutoUpdate : Clean-up failed! Reason : " + analyticsDescriptionMessage + ".\n");
        HealthLogger.sendAnalyticsData(
                autoUpdateEventNames.AUTOUPDATE_CLEANUP_FAILED,
                "autoUpdate",
                "cleanUp",
                "fail",
                analyticsDescriptionMessage
        );
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
     * Registers the App Quit event handler, in case of dirty
     * file save cancelled scenario, while Auto Update is scheduled to run on quit
     */
    function setAppQuitHandler() {
        resetAppQuitHandler();
        DocumentCommandHandlers.on(APP_QUIT_CANCELLED, dirtyFileSaveCancelled);
    }


    /**
     * Initiates the update process, when user clicks UpdateNow in the update popup
     * @param {string} formattedInstallerPath - formatted path to the latest installer
     * @param {string} formattedLogFilePath  - formatted path to the installer log file
     * @param {string} installStatusFilePath  -  path to the install status log file
     */
    function initiateUpdateProcess(formattedInstallerPath, formattedLogFilePath, installStatusFilePath) {

        // Get additional update parameters on Mac : installDir, appName, and updateDir
        function getAdditionalParams() {
            var retval = {};
            var installDir = FileUtils.getNativeBracketsDirectoryPath();

            if (installDir) {
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

        // Update function, to carry out app update
        var updateFn = function () {
            var infoObj = {
                installerPath: formattedInstallerPath,
                logFilePath: formattedLogFilePath,
                installStatusFilePath: installStatusFilePath
            };

            if (brackets.platform === "mac") {
                var additionalParams = getAdditionalParams(),
                    key;

                for (key in additionalParams) {
                    if (additionalParams.hasOwnProperty(key)) {
                        infoObj[key] = additionalParams[key];
                    }
                }
            }

            // Set update parameters for app update
            if (brackets.app.setUpdateParams) {
                brackets.app.setUpdateParams(JSON.stringify(infoObj), function (err) {
                    if (err) {
                        resetStateInFailure("AutoUpdate : Update parameters could not be set for the installer. Error encountered: " + err);
                    } else {
                        setAppQuitHandler();
                        CommandManager.execute(Commands.FILE_QUIT);
                    }
                });
            } else {
                resetStateInFailure("AutoUpdate : setUpdateParams could not be found in shell");
            }
        };
        setUpdateStateInJSON('updateInitiatedInPrevSession', true)
            .done(updateFn);
    }

    /**
     * Detaches the Update Bar Buttons event handlers
     */
    function detachUpdateBarBtnHandlers() {
        UpdateInfoBar.off(UpdateInfoBar.RESTART_BTN_CLICKED);
        UpdateInfoBar.off(UpdateInfoBar.LATER_BTN_CLICKED);
    }


    /**
     * Handles the installer validation callback from Node
     * @param {object} statusObj - json containing - {
     *                           valid - (boolean)true for a valid installer, false otherwise,
     *                           installerPath, logFilePath,
     *                           installStatusFilePath - for a valid installer,
     *                           err - for an invalid installer }
     */
    function handleValidationStatus(statusObj) {
        enableCheckForUpdateEntry(true);
        UpdateStatus.cleanUpdateStatus();

        if (statusObj.valid) {

            // Installer is validated successfully
            var statusValidFn = function () {

                // Restart button click handler
                var restartBtnClicked = function () {
                    HealthLogger.sendAnalyticsData(
                        autoUpdateEventNames.AUTOUPDATE_DOWNLOAD_COMPLETE_USER_CLICK_RESTART,
                        "autoUpdate",
                        "installNotification",
                        "installNow ",
                        "click"
                    );
                    detachUpdateBarBtnHandlers();
                    initiateUpdateProcess(statusObj.installerPath, statusObj.logFilePath, statusObj.installStatusFilePath);
                };

                // Later button click handler
                var laterBtnClicked = function () {
                    HealthLogger.sendAnalyticsData(
                        autoUpdateEventNames.AUTOUPDATE_DOWNLOAD_COMPLETE_USER_CLICK_LATER,
                        "autoUpdate",
                        "installNotification",
                        "cancel",
                        "click"
                    );
                    detachUpdateBarBtnHandlers();
                    setUpdateStateInJSON('updateInitiatedInPrevSession', false);
                };

                //attaching UpdateBar handlers
                UpdateInfoBar.on(UpdateInfoBar.RESTART_BTN_CLICKED, restartBtnClicked);
                UpdateInfoBar.on(UpdateInfoBar.LATER_BTN_CLICKED, laterBtnClicked);

                UpdateInfoBar.showUpdateBar({
                    title: Strings.DOWNLOAD_COMPLETE,
                    description: Strings.CLICK_RESTART_TO_UPDATE,
                    needButtons: true
                });

                setUpdateStateInJSON("autoUpdateInProgress", false);
                HealthLogger.sendAnalyticsData(
                    autoUpdateEventNames.AUTOUPDATE_DOWNLOADCOMPLETE_UPDATE_BAR_RENDERED,
                    "autoUpdate",
                    "installNotification",
                    "render",
                    ""
                );
            };

            if(!isAutoUpdateInitiated) {
                isAutoUpdateInitiated = true;
                updateJsonHandler.refresh()
                    .done(function() {
                        setUpdateStateInJSON('downloadCompleted', true)
                        .done(statusValidFn);
                });
            } else {
                 setUpdateStateInJSON('downloadCompleted', true)
                    .done(statusValidFn);
            }
        } else {

            // Installer validation failed

            if (updateJsonHandler.get("downloadCompleted")) {

                // If this was a cached download, retry downloading
                updateJsonHandler.reset();

                var statusInvalidFn = function () {
                    downloadAttemptsRemaining = MAX_DOWNLOAD_ATTEMPTS;
                    getLatestInstaller();
                };

                setUpdateStateInJSON('downloadCompleted', false)
                    .done(statusInvalidFn);
            } else {

                // If this is a new download, prompt the message on update bar
                var descriptionMessage = "",
                    analyticsDescriptionMessage = "";

                switch (statusObj.err) {
                case _nodeErrorMessages.CHECKSUM_DID_NOT_MATCH:
                    descriptionMessage = Strings.CHECKSUM_DID_NOT_MATCH;
                    analyticsDescriptionMessage = "Checksum didn't match.";
                    break;
                case _nodeErrorMessages.INSTALLER_NOT_FOUND:
                    descriptionMessage = Strings.INSTALLER_NOT_FOUND;
                    analyticsDescriptionMessage = "Installer not found.";
                    break;
                }
                HealthLogger.sendAnalyticsData(
                    autoUpdateEventNames.AUTOUPDATE_DOWNLOAD_FAILED,
                    "autoUpdate",
                    "download",
                    "fail",
                    analyticsDescriptionMessage
                );
                UpdateInfoBar.showUpdateBar({
                    type: "error",
                    title: Strings.VALIDATION_FAILED,
                    description: descriptionMessage
                });

                setUpdateStateInJSON("autoUpdateInProgress", false);
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

            // Retry the downloading
            attemptToDownload();
        } else {

            // Download could not completed, all attempts exhausted
            enableCheckForUpdateEntry(true);
            UpdateStatus.cleanUpdateStatus();

            var descriptionMessage = "",
                analyticsDescriptionMessage = "";
            if (message === _nodeErrorMessages.DOWNLOAD_ERROR) {
                descriptionMessage = Strings.DOWNLOAD_ERROR;
                analyticsDescriptionMessage = "Error occurred while downloading.";
            } else if (message === _nodeErrorMessages.NETWORK_SLOW_OR_DISCONNECTED) {
                descriptionMessage = Strings.NETWORK_SLOW_OR_DISCONNECTED;
                analyticsDescriptionMessage = "Network is Disconnected or too slow.";
            }
            HealthLogger.sendAnalyticsData(
                autoUpdateEventNames.AUTOUPDATE_DOWNLOAD_FAILED,
                "autoUpdate",
                "download",
                "fail",
                analyticsDescriptionMessage
            );
            UpdateInfoBar.showUpdateBar({
                type: "error",
                title: Strings.DOWNLOAD_FAILED,
                description: descriptionMessage
            });

            setUpdateStateInJSON("autoUpdateInProgress", false);
        }

    }


    /**
     * Handles the completion of node state initialization
     */
    function handleInitializationComplete() {
        enableCheckForUpdateEntry(false);
        getLatestInstaller();
    }


    /**
     * Handles Download completion callback from Node
     */
    function handleDownloadSuccess() {
        HealthLogger.sendAnalyticsData(
            autoUpdateEventNames.AUTOUPDATE_DOWNLOAD_COMPLETED,
            "autoUpdate",
            "download",
            "complete",
            ""
        );
        UpdateStatus.showUpdateStatus("validating-installer");
        validateChecksum();
    }


    function _handleAppClose() {
        postMessageToNode(MessageIds.REMOVE_FROM_REQUESTERS);
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
        functionMap["brackets.notifyInstallationStatus"]     = handleInstallationStatus;

        ProjectManager.on("beforeProjectClose beforeAppClose", _handleAppClose);
    }
    functionMap["brackets.nodeDomainInitialized"]     = nodeDomainInitialized;
    functionMap["brackets.registerBracketsFunctions"] = registerBracketsFunctions;

});
