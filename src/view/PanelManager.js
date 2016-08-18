/*
 * Copyright (c) 2014 - present Adobe Systems Incorporated. All rights reserved.
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
 * @deprecated This module provided for backwards compatibility.  Use WorkspaceManager instead.
 */
define(function (require, exports, module) {
    "use strict";

    var WorkspaceManager        = require("view/WorkspaceManager"),
        EventDispatcher         = require("utils/EventDispatcher"),
        DeprecationWarning      = require("utils/DeprecationWarning");

    /**
     * Creates a deprecation warning event handler
     * @param {!string} the event being deprecated
     * @param {!string} the new event to use
     */
    function _deprecateEvent(oldEventName, newEventName) {
        DeprecationWarning.deprecateEvent(exports,
                                          WorkspaceManager,
                                          oldEventName,
                                          newEventName,
                                          "PanelManager." + oldEventName,
                                          "MainViewManager." + newEventName);
    }

    // Define public API
    exports.createBottomPanel   = function (id, $panel, minSize) {
        DeprecationWarning.deprecationWarning("Use WorkspaceManager.createBottomPanel() instead of PanelManager.createBottomPanel().", true);
        return WorkspaceManager.createBottomPanel(id, $panel, minSize);
    };

    // Deprecated PanelManager events
    EventDispatcher.makeEventDispatcher(exports);
    _deprecateEvent("editorAreaResize", "workspaceUpdateLayout");
});
