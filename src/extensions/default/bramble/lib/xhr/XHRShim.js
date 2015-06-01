/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, forin: true, maxerr: 50, regexp: true */
/* global DOMParser */
(function(global) {
    "use strict";

    // This script requires access to the transport to send
    // file requests to the editor as commands
    var transport = global._Brackets_LiveDev_Transport;

    var XMLHttpRequest = global.XMLHttpRequest;
    if(!XMLHttpRequest) {
        console.error("[Brackets LiveDev] XMLHttpRequest not supported in preview");
        return;
    }

    function sendMessage(msg) {
        if(!transport) {
            console.error("[Brackets LiveDev] No transport set");
            return;
        }

        transport.send(JSON.stringify(msg));
    }

    function nativeXHRFn(xhr, condition, fn, args) {
        if(condition) {
            return fn.apply(xhr, args) || true;
        }

        return null;
    }

    function XMLHttpRequestLiveDev() {
        var xhr = new XMLHttpRequest();
        // Internally store properties normally attached to XHR
        var _requestUrl;
        var _abortCalled = false;
        var _readyState = 0;
        var _status = 0;
        var _statusText = "";
        var _response = "";
        var _responseText = "";
        var _responseType;
        var _onreadystatechange;
        var _onerror;
        var _onload;
        var self = this;

        var $open = xhr.open;
        // The async parameter for XHRs to the local file system
        // is ignored as we cannot support synchronous requests
        // and async is implicit
        self.open = function(method, url, async, user, password) {
            if(!(/\:?\/\//.test(url) || /\s*data\:/.test(url))) {
                _requestUrl = url;
                _abortCalled = false;
            } else {
                $open.apply(xhr, arguments);
            }
        };

        var $send = xhr.send;
        self.send = function() {
            if(!_requestUrl) {
                $send.apply(xhr, arguments);
                return;
            }

            function handleError(data) {
                _status = data.status || 500;
                _statusText = data.error || "Internal Server Error";
                _readyState = 4;
                data.error = data.error || data;

                if(typeof _onreadystatechange === "function" && !_abortCalled) {
                    _onreadystatechange.call(self);
                }

                if(typeof _onerror === "function" && !_abortCalled) {
                    return _onerror.call(self, {error: data.error});
                }
            }

            function setResponse(data) {
                if(data.error && !_abortCalled) {
                    return handleError(data);
                }

                _readyState = 4;
                _status = 200;
                _statusText = "OK";

                if(!_responseType || _responseType === "") {
                    _responseType = "text";
                }

                switch(_responseType) {
                case "text":
                    _response = data.content;
                    _responseText = _response;
                    break;
                case "document":
                    _response = new DOMParser(data.content, data.mimeType);
                    _responseText = data.content;
                    break;
                case "json":
                    try {
                        _response = JSON.parse(data.content);
                        _responseText = data.content;
                    } catch(e) {
                        handleError(e);
                        return;
                    }
                    break;
                default:
                    // TODO: We should support arraybuffers and blobs
                    handleError("Response type of " + _responseType + " is not supported. Response type must be `text`, `document` or `json`.");
                    return;
                }

                if(typeof _onreadystatechange === "function" && !_abortCalled) {
                    _onreadystatechange.call(self);
                }
                if(typeof _onload === "function" && !_abortCalled) {
                    // TODO: deal with addEventListener
                    _onload.call(self);
                }
            }

            window.addEventListener("message", function(event) {
                var data = event.data;

                try {
                    data = JSON.parse(data);
                } catch(e) {
                    return;
                }

                if(data.method === "XMLHttpRequest") {
                    setResponse(data);
                }
            });

            sendMessage({
                method: "XMLHttpRequest",
                path: _requestUrl
            });

            _readyState = 1;
        };

        self.abort = function() {
            if(!nativeXHRFn(xhr, !_requestUrl, xhr.abort, arguments)) {
                _abortCalled = true;
            }
        };

        self.setRequestHeader = function() {
            nativeXHRFn(xhr, !_requestUrl, xhr.setRequestHeader, arguments);
        };

        self.getAllResponseHeaders = function() {
            return nativeXHRFn(xhr, !_requestUrl, xhr.getAllResponseHeaders, arguments);
        };

        self.getResponseHeader = function() {
            return nativeXHRFn(xhr, !_requestUrl, xhr.getResponseHeader, arguments);
        };

        self.overrideMimeType = function() {
            nativeXHRFn(xhr, !_requestUrl, xhr.overrideMimeType, arguments);
        };

        // Expose the properties on the XHR object depending on whether
        // it is using native XHR or our postmessage XHR
        Object.defineProperties(self, {
            "onreadystatechange": {
                get: function() { return _requestUrl ? _onreadystatechange : xhr.onreadystatechange; },
                set: function(fn) {
                    _onreadystatechange = xhr.onreadystatechange = fn;
                }
            },
            "onload": {
                get: function() { return _requestUrl ? _onload : xhr.onload; },
                set: function(fn) { _onload = xhr.onload = fn; }
            },
            "onerror": {
                get: function() { return _requestUrl ? _onerror : xhr.onerror; },
                set: function(fn) { _onerror = xhr.onerror = fn; }
            },
            "readyState": {
                get: function() { return _requestUrl ? _readyState : xhr.readyState; }
            },
            "response": {
                get: function() { return _requestUrl ? _response : xhr.response; }
            },
            "responseText": {
                get: function() { return _requestUrl ? _responseText : xhr.responseText; }
            },
            "responseType": {
                get: function() { return _requestUrl ? _responseType : xhr.responseType; },
                set: function(value) {
                    _responseType = xhr.responseType = value;
                }
            },
            "responseXML": {
                get: function() { return _requestUrl ? null : xhr.responseXML; }
            },
            "status": {
                get: function() { return _requestUrl ? _status : xhr.status; }
            },
            "statusText": {
                get: function() { return _requestUrl ? _statusText : xhr.statusText; }
            },
            "timeout": {
                get: function() { return _requestUrl ? null : xhr.timeout; },
                set: function(value) {
                    if(!_requestUrl) { xhr.timeout = value; }
                }
            },
            "ontimeout": {
                get: function() { return _requestUrl ? null : xhr.ontimeout; },
                set: function(fn) {
                    if(!_requestUrl) { xhr.ontimeout = fn; }
                }
            },
            "upload": {
                get: function() { return _requestUrl ? null : xhr.upload; }
            },
            "withCredentials": {
                get: function() { return _requestUrl ? null : xhr.withCredentials; },
                set: function(value) {
                    if(!_requestUrl) { xhr.withCredentials = value; }
                }
            }
        });
    }

    global.XMLHttpRequest = XMLHttpRequestLiveDev;

}(this));
