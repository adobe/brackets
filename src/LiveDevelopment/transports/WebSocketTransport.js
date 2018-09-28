/*
 * Copyright (c) 2017 - present Adobe Systems Incorporated. All rights reserved.
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

/** 
 * This transport provides a WebSocket connection between Brackets and a live browser preview.
 * This is just a thin wrapper around the Node extension (WebSocketTransportDomain) that actually
 * provides the WebSocket server and handles the communication. We also rely on an injected script in
 * the browser for the other end of the transport.
 */

define(function (require, exports, module) {
    "use strict";

    var FileUtils           = require("file/FileUtils"),
        NodeDomain          = require("utils/NodeDomain"),
        EditorManager       = require("editor/EditorManager"),
        Inspector           = require("LiveDevelopment/Inspector/Inspector"),
        LiveDevelopment     = require("LiveDevelopment/LiveDevelopment"),
        HTMLInstrumentation = require("language/HTMLInstrumentation");

    // The node extension that actually provides the WebSocket server.

    var domainPath = FileUtils.getNativeBracketsDirectoryPath() + "/" + FileUtils.getNativeModuleDirectoryPath(module) + "/node/WebSocketTransportDomain";

    var WebSocketTransportDomain = new NodeDomain("webSocketTransport", domainPath);

    // Events

    WebSocketTransportDomain.on("message", function (obj, message) {
        console.log("WebSocketTransport - event - message" + " - " + message);
        if (message === "stickyhighlightchanged") {
            Inspector.trigger("stickyhighlightchanged");
        } else {
            try {
                LiveDevelopment.pauseSelectionSync(true);
                var selectionId = parseInt(message, 10);
                if (Number.isNaN(selectionId)) {
                    // maybe it is json
                    try {
                        var editor = EditorManager.getActiveEditor();
                        selectionId = JSON.parse(message);
                        var positions = [];
                        selectionId.forEach(function (selId) {
                            positions.push(HTMLInstrumentation.getPositionFromTagId(editor, parseInt(selId, 10)));
                        });
                        positions = positions.map(function (position) {
                            return { "start": {
                                "line": position.line,
                                "ch": position.ch
                            }, "end": {
                                "line": position.line,
                                "ch": position.ch
                            }
                            };
                        });
                        editor.setSelections(positions);
                    } catch (e) {
                        // do nothing;
                        console.log("message of undefined type - " + message);
                    }
                } else {
                    var editor = EditorManager.getActiveEditor(),
                        position = HTMLInstrumentation.getPositionFromTagId(editor, parseInt(message, 10));
                    if (position) {
                        editor.setCursorPos(position.line, position.ch, true);
                    }
                }
                LiveDevelopment.pauseSelectionSync(false);
            } catch (e) {
                LiveDevelopment.pauseSelectionSync(false);
            }
        }
    });
    
    function createWebSocketServer(port) {
        WebSocketTransportDomain.exec("start", parseInt(port, 10));
    }
    
    function closeWebSocketServer() {
        WebSocketTransportDomain.exec("close");
    }
    
    exports.createWebSocketServer = createWebSocketServer;
    exports.closeWebSocketServer  = closeWebSocketServer;
});
