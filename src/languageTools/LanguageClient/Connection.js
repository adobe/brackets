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
/*eslint no-console: 0*/
/* eslint no-empty: ["error", { "allowEmptyCatch": true }] */
(function () {
    "use strict";

    var protocol = require("vscode-languageserver-protocol");

    var Actions = {
        OnClose: {
            Stop: 0,
            Restart: 1
        },
        OnError: {
            Ignore: 0,
            Stop: 1
        }
    };

    function ActionController() {
        this.retartsTimes = [];
    }

    ActionController.prototype.getOnErrorAction = function (errorData) {
        var errorCount = errorData[2];

        if (errorCount <= 3) {
            return Actions.OnError.Ignore;
        }

        return Actions.OnError.Restart;
    };

    ActionController.prototype.getOnCloseAction = function () {
        var currentTime = Date.now();
        this.retartsTimes.push(currentTime);

        var numRestarts = this.restarts.length;
        if (numRestarts < 5) {
            return Actions.OnClose.Restart;
        }

        var timeBetweenFiveRestarts = this.restartsTimes[numRestarts - 1] - this.restarts[0];
        if (timeBetweenFiveRestarts <= 3 * 60 * 1000) { //3 minutes
            return Actions.OnClose.Stop;
        }

        this.restarts.shift();
        return Actions.OnClose.Restart;
    };

    function _getOnCloseHandler(connection, actionController, restartLanguageClient) {
        return function () {
            try {
                if (connection) {
                    connection.dispose();
                }
            } catch (error) {}

            var action = Actions.OnClose.Stop;
            try {
                action = actionController.getOnCloseAction();
            } catch (error) {}


            if (action === Actions.OnClose.Restart) {
                restartLanguageClient();
            }
        };
    }

    function _getOnErrorHandler(actionController, stopLanguageClient) {
        return function (errorData) {
            var action = actionController.getOnErrorAction(errorData);

            if(action === Actions.OnError.Stop) {
                stopLanguageClient();
            }
        };
    }

    function Logger() {}

    Logger.prototype.error = function (message) {
        console.error(message);
    };
    Logger.prototype.warn = function (message) {
        console.warn(message);
    };
    Logger.prototype.info = function (message) {
        console.info(message);
    };
    Logger.prototype.log = function (message) {
        console.log(message);
    };

    function createConnection(reader, writer, restartLanguageClient, stopLanguageClient) {
        var logger = new Logger(),
            actionController = new ActionController(),
            connection = protocol.createProtocolConnection(reader, writer, logger),
            errorHandler = _getOnErrorHandler(actionController, stopLanguageClient),
            closeHandler = _getOnCloseHandler(connection, actionController, restartLanguageClient);

        connection.onError(errorHandler);
        connection.onClose(closeHandler);

        return connection;
    }

    exports.createConnection = createConnection;
}());
