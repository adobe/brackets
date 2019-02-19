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

/*global exports, Promise */
/*eslint no-console: 0*/
/*eslint strict: ["error", "global"]*/
/*eslint max-len: ["error", { "code": 200 }]*/
"use strict";

var ProtocolAdapter = require("./ProtocolAdapter"),
    ServerUtils = require("./ServerUtils"),
    Connection = require("./Connection"),
    BracketsCapabilities = require("./BracketsCapabilities"),
    ToolingInfo = require("./../ToolingInfo.json"),
    NodeToBracketsInterface = require("./../Interface/bracketsInterface").NodeToBracketsInterface;

function LanguageClient(clientName, options, domainManager) {
    this._clientName = clientName;
    this._bracketsInterface = null;
    this._notifyBrackets = null;
    this._requestBrackets = null;
    this._connection = null,
    this._startUpParams = null, //_projectRoot, capabilties, workspaceFolders etc.
    this._initialized = false,
    this._options = options;


    this._init(domainManager);
}


LanguageClient.prototype._createConnection = function () {
    var restartLanguageClient = this.start.bind(this),
        stopLanguageClient = this.stop.bind(this);

    var serverOptions = this._options.serverOptions;
    return ServerUtils.startServerAndGetConnectionArgs(serverOptions)
        .then(function (connectionArgs) {
            return Connection.createConnection(connectionArgs.reader, connectionArgs.writer, restartLanguageClient, stopLanguageClient);
        }).catch(function (err) {
            console.error("Couldn't establish connection", err);
        });
};


LanguageClient.prototype.start = function (params) {
    var self = this;

    //Check to see if a connection to a language server already exists.
    if (self._connection) {
        return Promise.resolve(true);
    }

    self._connection = null;
    self._startUpParams = params ? params : self._startUpParams;

    //We default to standard capabilties
    if (!self._startUpParams.capabilities) {
        self._startUpParams.capabilities = BracketsCapabilities.getCapabilities();
    }

    return self._createConnection()
        .then(function (connection) {
            connection.listen();
            self._connection = connection;

            return ProtocolAdapter.initialize(connection, self._startUpParams);
        }).then(function (result) {
            self._initialized = result;
            ProtocolAdapter.attachOnNotificationHandlers(self._connection, self._notifyBrackets);
            ProtocolAdapter.attachOnRequestHandlers(self._connection, self._requestBrackets);
            ProtocolAdapter.initialized(self._connection);
            return result;
        }).catch(function (error) {
            console.error('Starting client failed', error);
            console.error('Couldn\'t start client :', self._clientName);

            return error;
        });
};

LanguageClient.prototype.stop = function () {
    var self = this;

    self._initialized = false;
    if (!self._connection) {
        return Promise.resolve(true);
    }


    return ProtocolAdapter.shutdown(self._connection).then(function () {
        ProtocolAdapter.exit(self._connection);
        self._connection.dispose();
        self._connection = null;
    });
};

LanguageClient.prototype.request = function (params) {
    return ProtocolAdapter.processRequest(this._connection, params);
};


LanguageClient.prototype.notify = function (params) {
    ProtocolAdapter.processNotification(this._connection, params);
};

LanguageClient.prototype._init = function (domainManager) {
    this._bracketsInterface = new NodeToBracketsInterface(domainManager, this._clientName);

    //Expose own methods for interfaceing. All these are async except notify.
    this._bracketsInterface.registerMethods([
        {
            methodName: ToolingInfo.LANGUAGE_SERVICE.START,
            methodHandle: this.start.bind(this)
        },
        {
            methodName: ToolingInfo.LANGUAGE_SERVICE.STOP,
            methodHandle: this.stop.bind(this)
        },
        {
            methodName: ToolingInfo.LANGUAGE_SERVICE.REQUEST,
            methodHandle: this.request.bind(this)
        },
        {
            methodName: ToolingInfo.LANGUAGE_SERVICE.NOTIFY,
            methodHandle: this.notify.bind(this)
        }
    ]);

    //create function interfaces for Brackets
    this._notifyBrackets = this._bracketsInterface.createInterface(ToolingInfo.LANGUAGE_SERVICE.NOTIFY);
    this._requestBrackets = this._bracketsInterface.createInterface(ToolingInfo.LANGUAGE_SERVICE.REQUEST, true);
};

exports.LanguageClient = LanguageClient;
