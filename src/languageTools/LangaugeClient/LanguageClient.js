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

/*global exports */
/*global process, Buffer*/

//Will handle to and fro from brackets
//Request/response
//To and fro notification
//Will connect with protocol adapter and not the vscode-protocol directly
//Make this an independent module which internally routes to LanguageClient
//which then routes to ProtocolAdapter, which then constructs params and then
//uses the connection object to route the request to the server


"use strict";

var ProtocolAdapter = require("./ProtocolAdapter"),
    Transport = require("./Transport"),
    Connection = require("./Connection"),
    EventEmitter = require("events"),
    crypto  = require("crypto"),
    _eventHandler = new EventEmitter();


function btoa(str) {
    return Buffer.from(str).toString('base64');
}

var ClientStates = {
    "Initial" : 0,
    "Starting" : 1,
    "StartFailed" : 2,
    "Running" : 3,
    "Stopping" : 4,
    "Stopped" : 5
}

var CloseAction = {
    "DoNotRestart" : 0,
    "Restart" : 1
}

var ErrorAction = {
    "Continue" : 0,
    "Shutdown" : 1
}

function DefaultErrorHandler(clientId) {
    this.clientId = clientId;
    this.restarts = [];
}

DefaultErrorHandler.prototype.error = function (_error, _message, count) {
    if (count && count <= 3) {
        return ErrorAction.Continue;
    }
    return ErrorAction.Shutdown;
};

DefaultErrorHandler.prototype.closed = function () {
    this.restarts.push(Date.now());
    if (this.restarts.length < 5) {
        return CloseAction.Restart;
    }
    else {
        var diff = this.restarts[this.restarts.length - 1] - this.restarts[0];
        if (diff <= 3 * 60 * 1000) {
            console.error("The " + this.name + " server crashed 5 times in the last 3 minutes. The server will not be restarted.");
            return CloseAction.DoNotRestart;
        }
        else {
            this.restarts.shift();
            return CloseAction.Restart;
        }
    }
};



function LanguageClient(clientFullPath, options, domainManager) {
    var _domainManager = domainManager,
        _clientId = btoa(clientFullPath),
        _connection = null,
        _connectionPromise = null,
        _capabilities = null,
        _serverProcess = null, //have to get somehow
        _isServerProcessDetached = false,
        _state = ClientStates.Initial,
        _errorHandler = options.clientOptions.errorHandler || new DefaultErrorHandler(this._clientId),
        _initialized = false,
        _options = options;
    
    var _onNotificationCallback = function(params) {
        _eventHandler.emit('languageClientEvent.' + _clientId, params);
    }
    
    var _onRequestCallback = function(params) {
        return new Promise(function (resolve, request) {
            var requestHash = crypto.createHash('md5').update(Date.now().toString()).digest('hex'),
                responseEvent = 'onRequestResponse.' + requestHash;
            
            params.requestHash = requestHash;
            _eventHandler.emit('languageClientEvent.' + _clientId, params);
            
            _eventHandler.once(responseEvent, function(err, response) {
                if (!err) {
                    resolve(response);
                } else {
                    reject(null);
                }
            })
        });
    }

    var self = this;
    _eventHandler.on('languageClientEvent.' + _clientId, function (msgObj) {
        self.postMessageToBrackets(msgObj);
    });

    this.init();
}

LanguageClient.prototype.handleConnectionClosed = function() {
    // Check whether this is a normal shutdown in progress or the client stopped normally.
    if (this.state === ClientState.Stopping || this.state === ClientState.Stopped) {
        return;
    }
    try {
        if (this._Connection) {
            this._connection.dispose();
        }
    }
    catch (error) {
        // Disposing a connection could fail if error cases.
    }
    let action = CloseAction.DoNotRestart;
    try {
        action = this._errorHandler.closed();
    }
    catch (error) {
        // Ignore errors coming from the error handler.
    }
    this._connectionPromise = null;
    this._resolvedConnection = null;
    if (action === CloseAction.DoNotRestart) {
        this.error('Connection to server got closed. Server will not be restarted.');
        this.state = ClientState.Stopped;
        this.cleanUp(false, true);
    }
    else if (action === CloseAction.Restart) {
        this.info('Connection to server got closed. Server will restart.');
        this.cleanUp(false, false);
        this.state = ClientState.Initial;
        this.restart();
    }
}

LanguageClient.prototype.handleConnectionError = function (error, message, count) {
    var action = this._errorHandler.error(error, message, count);
    if (action === ErrorAction.Shutdown) {
        console.error('Connection to server is erroring. Shutting down server.');
        this.stop();
    }
}

LanguageClient.prototype.restart = function () {
    this.postMessageToBrackets({ type : "restart" });
}

LanguageClient.prototype.createConnection = function () {
    var self = this;
    var errorHandler = function (error, message, count) {
        self.handleConnectionError(error, message, count);
    };
    
    var closeHandler = function () {
        self.handleConnectionClosed();
    };
    
    var serverOptions = this._options.serverOptions;
    return Transport.createTransports(serverOptions)
        .then(function (transports) {
            return Connection.createConnection(transports.reader, transports.writer, errorHandler, closeHandler);
        });
}

LanguageClient.prototype.resolveConnection = function (error, message, count) {
    if (!this._connectionPromise) {
        this._connectionPromise = this.createConnection();
    }
    return this._connectionPromise;
}



LanguageClient.prototype.start = function(msgObj, resolver, progress) {
    //Async function so we use legacy callback to resolve request
    //This will be handled by ProtocolAdapter.processRequest internally
    var self = this;
    self._state = ClientState.Starting;
    self._capabilities = msgObj.params.capabilities;
    self.resolveConnection()
        .then(function () {
            connection.listen();
            
            return self.initialize(connection, msgObj);
        }).then(function (result) {
            resolver(null, result);
        }, function (error) {
            self._state = ClientState.StartFailed;
            resolver(error, null);
            console.error('Starting client failed', error);
            console.error(`Couldn't start client ${this._name}`); //TODO: Show in UI
        });  
};

LanguageClient.prototype.initialize = function(connection, msgObj) {
    var self = this;
    
    return new Promise(resolve, request) {
        ProtocolAdapter.processRequest(connection, msgObj)
        .then(function (result) {
            self._connection = connection;
            self._initialized = result;
            self._state = ClientStates.Running;
            ProtocolAdapter.attachOnNotificationHandlers(connection, self._onNotificationCallback);
            ProtocolAdapter.attachOnRequestHandlers(connection, self._onRequestCallback);
            ProtocolAdapter.initialized(connection);
            
            return result
        }).then(function (result){
            resolve(result);
        }, function (error) {
            reject(error);
        });
    }
};

LanguageClient.prototype.stop = function(msgObj, resolver, progress) {
    var self = this;
    
    self._initialized = false;
    if (!self._connection) {
        self._state = ClientStates.Stopped;
        resolver(null, true);
    }
    
    if (self.state === ClientStates.Stopping && self._onStop) {
        resolver(null, true);
    }
    this.state = ClientState.Stopping;
    //Any cleanup work?
    self._onStop = self.resolveConnection().then(function(connection) {
        return connection.shutdown().then(function() {
            connection.exit();
            connection.dispose();
            self._state = ClientState.Stopped;
            self._onStop = null;
            self._connectionPromise = null;
            selfß._connection = null;
        }).then(function () {
            resolver(null, result);
        });
    });
};

LanguageClient.prototype.postMessageToBrackets = function(data) {
    this._domainManager.emitEvent(this._clientId, 'data', [data]);
};

LanguageClient.prototype.receiveRequestFromBrackets = function(msgObj, resolver, progress) {
    if (msgObj.clientId !== this.clientId) {
        return;
    }
    //Async function so we use legacy callback to resolve request
    //This will be handled by ProtocolAdapter.processRequest internally
    ProtocolAdapter.processRequest(connection, msgObj)
        .then(function (result) {
            resolver(null, result);
        })
        .fail(function (err) {
            resolver(err, null);
        });
};

LanguageClient.prototype.receiveRequestRepsonseFromBrackets = function(response, resolver, progress) {
    if (msgObj.clientId !== this.clientId) {
        return;
    }
    
    var event = "onRequestResponse." + response.requestHash;
    if (response.response) {
        _eventHandler.emit(event, false, response.response);
    } else {
        _eventHandler.emit(event, true);
    }
};

LanguageClient.prototype.receiveNotificationFromBrackets =  function(msgObj) {
    if (msgObj.clientId !== this.clientId) {
        return;
    }
    this._languageClient.postNotificationToLanguageClient(msgObj);
};

 LanguageClient.prototype._init = function() {
    if (!this._domainManager.hasDomain(this._clientId)) {
        this._domainManager.registerDomain(this._clientId, {major: 0, minor: 1});
    }

    //Server related requests will also come here
     this._domainManager.registerCommand(
        this._clientId,
        "start",
        this.start,
        true,
        "Receives request from brackets",
        [
            {
                name: "msgObj",
                type: "object",
                description: "json object containing message info"
            }
        ],
        []
    );
     
    //Server related requests will also come here
     this._domainManager.registerCommand(
        this._clientId,
        "stop",
        this.stop,
        true,
        "Receives request from brackets",
        [
            {
                name: "msgObj",
                type: "object",
                description: "json object containing message info"
            }
        ],
        []
    );

    this._domainManager.registerCommand(
        this._clientId,
        "request",
        this.receiveRequestFromBrackets,
        true,
        "Receives request from brackets",
        [
            {
                name: "msgObj",
                type: "object",
                description: "json object containing message info"
            }
        ],
        []
    );
     
    this._domainManager.registerCommand(
        this._clientId,
        "requestResponse",
        this.receiveRequestResponseFromBrackets,
        true,
        "Receives request from brackets",
        [
            {
                name: "msgObj",
                type: "object",
                description: "json object containing message info"
            }
        ],
        []
    );


    this._domainManager.registerCommand(
        this._clientId,
        "notification",
        this.receiveNotificationFromBrackets,
        false,
        "Receives notification from brackets",
        [
            {
                name: "msgObj",
                type: "object",
                description: "json object containing message info"
            }
        ],
        []
    );

    this._domainManager.registerEvent(
        this._clientId,
        "data",
        [
            {
                name: "msgObj",
                type: "object",
                description: "json object containing message info to pass to brackets"
            }
        ]
    );
};


