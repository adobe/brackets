/*
 * Copyright (c) 2012 - present Adobe Systems Incorporated. All rights reserved.
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
 * EditAgent propagates changes from the in-document editor to the source
 * document.
 */
define(function EditAgent(require, exports, module) {
    "use strict";

    var Inspector = require("LiveDevelopment/Inspector/Inspector");
    var DOMAgent = require("LiveDevelopment/Agents/DOMAgent");
    var RemoteAgent = require("LiveDevelopment/Agents/RemoteAgent");
    var GotoAgent = require("LiveDevelopment/Agents/GotoAgent");

    var EditorManager = require("editor/EditorManager");

    var _editedNode;

    /** Find changed characters
     * @param {string} old value
     * @param {string} changed value
     * @return {from, to, text}
     */
    function _findChangedCharacters(oldValue, value) {
        if (oldValue === value) {
            return undefined;
        }
        var length = oldValue.length;
        var index = 0;

        // find the first character that changed
        var i;
        for (i = 0; i < length; i++) {
            if (value[i] !== oldValue[i]) {
                break;
            }
        }
        index += i;
        value = value.substr(i);
        length -= i;

        // find the last character that changed
        for (i = 0; i < length; i++) {
            if (value[value.length - 1 - i] !== oldValue[oldValue.length - 1 - i]) {
                break;
            }
        }
        length -= i;
        value = value.substr(0, value.length - i);

        return { from: index, to: index + length, text: value };
    }

    // WebInspector Event: DOM.characterDataModified
    function _onCharacterDataModified(event, res) {
        // res = {nodeId, characterData}
        if (_editedNode.nodeId !== res.nodeId) {
            return;
        }

        GotoAgent.open(DOMAgent.url);
        var editor = EditorManager.getCurrentFullEditor();
        var codeMirror = editor._codeMirror;
        var change = _findChangedCharacters(_editedNode.value, res.characterData);
        if (change) {
            var from = codeMirror.posFromIndex(_editedNode.location + change.from);
            var to = codeMirror.posFromIndex(_editedNode.location + change.to);
            exports.isEditing = true;
            editor.document.replaceRange(change.text, from, to);
            exports.isEditing = false;

            var newPos = codeMirror.posFromIndex(_editedNode.location + change.from + change.text.length);
            editor.setCursorPos(newPos.line, newPos.ch);
        }
    }

    // Remote Event: Go to the given source node
    function _onRemoteEdit(event, res) {
        // res = {nodeId, name, value}

        // detach from DOM change events
        if (res.value === "0") {
            Inspector.DOM.off(".EditAgent");
            return;
        }

        // find and store the edited node
        var node = DOMAgent.nodeWithId(res.nodeId);
        node = node.children[0];
        if (!node.location) {
            return;
        }
        _editedNode = node;

        // attach to character data modified events
        Inspector.DOM.on("characterDataModified.EditAgent", _onCharacterDataModified);
    }

    /** Initialize the agent */
    function load() {
        RemoteAgent.on("edit.EditAgent", _onRemoteEdit);
    }

    /** Initialize the agent */
    function unload() {
        RemoteAgent.off(".EditAgent");
    }

    // Export public functions
    exports.load = load;
    exports.unload = unload;
});
