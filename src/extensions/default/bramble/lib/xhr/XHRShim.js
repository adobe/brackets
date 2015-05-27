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
        var requestUrl;
        var abortCalled = false;

        var $open = xhr.open;
        // The async parameter for XHRs to the local file system
        // is ignored as we cannot support synchronous requests
        // and async is implicit
        xhr.open = function(method, url, async, user, password) {
            if(!(/\:?\/\//.test(url) || /\s*data\:/.test(url))) {
                requestUrl = url;
                abortCalled = false;
            } else {
                $open.apply(xhr, arguments);
            }
        };

        var $send = xhr.send;
        xhr.send = function() {
            if(!requestUrl) {
                $send.apply(xhr, arguments);
                return;
            }

            function handleError(data) {
                xhr.status = data.status || 500;
                xhr.statusText = data.error || "Internal Server Error";
                xhr.readyState = 4;
                data.error = data.error || data;

                if(typeof xhr.onreadystatechange === "function" && !abortCalled) {
                    xhr.onreadystatechange();
                }

                if(typeof xhr.onerror === "function" && !abortCalled) {
                    return xhr.onerror(data.error);
                }
            }

            function setResponse(data) {
                delete xhr.readyState;
                delete xhr.status;
                delete xhr.statusText;
                delete xhr.response;
                delete xhr.responseText;

                if(data.error && !abortCalled) {
                    return handleError(data);
                }

                xhr.readyState = 4;
                xhr.status = 200;
                xhr.statusText = "OK";

                var $responseType = xhr.responseType;
                if(!$responseType || $responseType === "") {
                    $responseType = "text";
                }

                switch($responseType) {
                case "text":
                    xhr.response = data.content;
                    xhr.responseText = xhr.response;
                    break;
                case "document":
                    xhr.response = new DOMParser(data.content, data.mimeType);
                    xhr.responseText = data.content;
                    break;
                case "json":
                    try {
                        xhr.response = JSON.parse(data.content);
                        xhr.responseText = data.content;
                    } catch(e) {
                        handleError(e);
                        return;
                    }
                    break;
                default:
                    // TODO: We should support arraybuffers and blobs
                    handleError("Response type of " + $responseType + " is not supported. Response type must be `text`, `document` or `json`.");
                    return;
                }

                if(typeof xhr.onreadystatechange === "function" && !abortCalled) {
                    xhr.onreadystatechange();
                }
                if(typeof xhr.onload === "function" && !abortCalled) {
                    // TODO: deal with addEventListener
                    xhr.onload();
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
                path: requestUrl
            });

            xhr.readyState = 1;
        };

        var $abort = xhr.abort;
        xhr.abort = function() {
            if(!nativeXHRFn(xhr, !requestUrl, $abort, arguments)) {
                abortCalled = true;
            }
        };

        var $setRequestHeader = xhr.setRequestHeader;
        xhr.setRequestHeader = function() {
            nativeXHRFn(xhr, !requestUrl, $setRequestHeader, arguments);
        };

        var $getAllResponseHeaders = xhr.getAllResponseHeaders;
        xhr.getAllResponseHeaders = function() {
            return nativeXHRFn(xhr, !requestUrl, $getAllResponseHeaders, arguments);
        };

        var $getResponseHeader = xhr.getResponseHeader;
        xhr.getResponseHeader = function() {
            return nativeXHRFn(xhr, !requestUrl, $getResponseHeader, arguments);
        };

        var $overrideMimeType = xhr.overrideMimeType;
        xhr.overrideMimeType = function() {
            nativeXHRFn(xhr, !requestUrl, $overrideMimeType, arguments);
        };

        return xhr;
    }

    global.XMLHttpRequest = XMLHttpRequestLiveDev;

}(this));
