/*
 * Copyright 2012 Adobe Systems Incorporated. All Rights Reserved.
 * @author Jonathan Diehl <jdiehl@adobe.com>
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, forin: true, maxerr: 50, regexp: true */
/*global define, $ */

/**
 * EditAgent propagates changes from the in-document editor to the source
 * document.
 */
define(function EditAgent(require, exports, module) {
    'use strict';

    var Inspector = require("LiveDevelopment/Inspector/Inspector");
    var DOMAgent = require("LiveDevelopment/Agents/DOMAgent");
    var RemoteAgent = require("LiveDevelopment/Agents/RemoteAgent");
    var GotoAgent = require("LiveDevelopment/Agents/GotoAgent");

    var EditorManager = require("editor/EditorManager");

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

    // Remote Event: Go to the given source node
    function _onRemoteEdit(res) {
        // res = {nodeId, name, value}
        var node = DOMAgent.nodeWithId(res.nodeId);
        node = node.children[0];
        if (!node.location) {
            return;
        }
        GotoAgent.open(DOMAgent.url);
        var editor = EditorManager.getCurrentFullEditor();
        var codeMirror = editor._codeMirror;
        var change = _findChangedCharacters(node.value, res.value);
        if (change) {
            var from = codeMirror.posFromIndex(node.location + change.from);
            var to = codeMirror.posFromIndex(node.location + change.to);
            codeMirror.replaceRange(change.text, from, to);
            codeMirror.setCursor(codeMirror.posFromIndex(node.location + change.from + change.text.length));
        }
    }

    /** Initialize the agent */
    function load() {
        Inspector.on("RemoteAgent.edit", _onRemoteEdit);
    }

    /** Initialize the agent */
    function unload() {
        Inspector.off("RemoteAgent.edit", _onRemoteEdit);
    }

    // Export public functions
    exports.load = load;
    exports.unload = unload;
});