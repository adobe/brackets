/*
 * Copyright (c) 2012 Adobe Systems Incorporated. All rights reserved.
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


/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, forin: true, maxerr: 50, regexp: true */
/*global define, $ */

/**
 * RemoteFunctions define the functions to be executed in the browser. This
 * modules should define a single function that returns an object of all
 * exported functions.
 */
function RemoteFunctions() {
    'use strict';

    var _body = document.getElementsByTagName("body")[0]; // the document body
    var _sourceHighlight; // the highlighted element in the source
    var _highlight = []; // the highlighted elements
    var _dialog; // the active dialog
    var _target; // the active target element of a dialog
    var _editor; // the editor
    var _editText; // the original editor text

    // prevent an event
    function _preventEventWhenMeta(event) {
        if (event.metaKey) {
            event.preventDefault();
            event.stopPropagation();
        }
    }

    // compute the screen offset of an element
    function _screenOffset(element, key) {
        var value = 0;
        while (element) {
            value += element[key];
            element = element.offsetParent;
        }
        return value;
    }

    // hide dialog
    function _hideDialog() {
        if (_dialog) {
            var dialog = _dialog;
            _dialog = undefined;
            _body.removeChild(dialog);
        }
    }

    // show dialog
    function _createDialog(element, drawBackground) {
        _hideDialog();

        // compute the position on screen
        var x = _screenOffset(element, "offsetLeft");
        var y = _screenOffset(element, "offsetTop") + element.offsetHeight;
        var width = element.offsetWidth;

        // create the container
        _dialog = document.createElement("div");
        _dialog.style.setProperty("z-index", 2147483647);
        _dialog.style.setProperty("position", "absolute");
        _dialog.style.setProperty("left", x + "px");
        _dialog.style.setProperty("top", y + "px");
        _dialog.style.setProperty("font-size", "11pt");
        if (drawBackground) {
            _dialog.style.setProperty("background", "#fff");
            _dialog.style.setProperty("border", "1px solid #888");
            _dialog.style.setProperty("-webkit-box-shadow", "2px 2px 6px 0px #ccc");
            _dialog.style.setProperty("border-radius", "6px");
            _dialog.style.setProperty("padding", "6px");
        }

        return _dialog;
    }

    // row background color
    function _backgroundColorForType(type, highlight) {
        switch (type) {
        case "html":
            return highlight ? "#eec" : "#ffe";
        case "css":
            return highlight ? "#cee" : "#eff";
        case "js":
            return highlight ? "#ccf" : "#eef";
        }
    }

    // set an event on a element
    function _trigger(element, name, value, autoRemove) {
        var key = "data-ld-" + name;
        if (value !== undefined && value !== null) {
            element.setAttribute(key, value);
            if (autoRemove) {
                setTimeout(element.removeAttribute.bind(element, key));
            }
        } else {
            element.removeAttribute(key);
        }
    }

    // low level node highlighting
    function _highlightNode(info) {
        if (!(info instanceof Array)) {
            info = [info, "#ecc"];
        }
        var prevColor = info[0].style.getPropertyValue("background-color");
        info[0].style.setProperty("background-color", info[1]);
        return [info[0], prevColor];
    }

    // editor key press
    function _onEditKeyUp(event) {
        switch (event.which) {
        case 13:
            // return
            _editor.blur();
            break;
        case 27:
            // esc
            _trigger(_target, "edit", _editText, true);
            _editor.blur();
            break;
        case 18:
            // nothing
            break;
        default:
            _trigger(_target, "edit", _editor.value);
        }
    }

    // open the editor
    function _showEdit(text) {
        _editText = text;
        var dialog = _createDialog(_target);
        _editor = document.createElement("input");
        _editor.setAttribute("value", text);
        _editor.setAttribute("width", _target.attributes.width);
        _editor.addEventListener("keyup", _onEditKeyUp);
        _editor.addEventListener("blur", _hideDialog);
        dialog.appendChild(_editor);
        _body.appendChild(dialog);
        _editor.focus();
    }


    /** Event Handlers ***********************************************************/

    // remove highlight on release of the meta key
    function _onKeyUp(event) {
        if (!event.metaKey && _sourceHighlight) {
            _trigger(_sourceHighlight[0], "highlight", 0, true);
            _highlightNode(_sourceHighlight);
            _sourceHighlight = undefined;
        }
    }

    // trigger highlight on mouse move
    function _onMouse(event) {
        if (!event.metaKey || event.type !== "mousemove" || !event.toElement) {
            if (_sourceHighlight) {
                _trigger(_sourceHighlight[0], "highlight", 0, true);
                _highlightNode(_sourceHighlight);
                _sourceHighlight = undefined;
            }
            return;
        }
        if (_sourceHighlight) {
            if (_sourceHighlight[0] === event.toElement) {
                return;
            }
            _trigger(_sourceHighlight[0], "highlight");
            _highlightNode(_sourceHighlight);
        }
        _trigger(event.toElement, "highlight", 1);
        _sourceHighlight = _highlightNode(event.toElement);
    }

    // trigger goto on alt-click
    function _onClick(event) {
        _hideDialog();
        if (event.metaKey && event.toElement) {
            event.preventDefault();
            event.stopPropagation();
            _target = event.toElement;
            _trigger(_target, "showgoto", 1, true);
        } else if (event.altKey && event.toElement && event.toElement.childNodes.length === 1) {
            event.preventDefault();
            event.stopPropagation();
            _target = event.toElement;
            _showEdit(_target.childNodes[0].nodeValue);
        }
    }

    // Goto dialog highlighting
    function _onGotoMouse(row, type, event) {
        if (event.type === "mouseover") {
            row.style.setProperty("background", _backgroundColorForType(type, true));
        } else {
            row.style.setProperty("background", _backgroundColorForType(type));
        }
    }

    // Goto dialog click
    function _onGotoClick(url, event) {
        _hideDialog();
        _trigger(_target, "goto", url, true);
    }


    /** Public Commands **********************************************************/

    // show goto
    function showGoto(targets) {
        var dialog = _createDialog(_target, true);
        var i, target, row, file;
        for (i in targets) {
            target = targets[i];
            row = document.createElement("div");
            row.style.setProperty("padding", "6px 12px");
            row.style.setProperty("display", "block");
            row.style.setProperty("border-bottom", "1px solid #ccc");
            row.style.setProperty("cursor", "pointer");
            row.style.setProperty("background", _backgroundColorForType(target.type));
            row.innerHTML = target.name;
            row.addEventListener("click", _onGotoClick.bind(undefined, target.url));
            row.addEventListener("mouseover", _onGotoMouse.bind(undefined, row, target.type));
            row.addEventListener("mouseout", _onGotoMouse.bind(undefined, row, target.type));
            if (target.file) {
                file = document.createElement("i");
                file.style.setProperty("float", "right");
                file.style.setProperty("margin-left", "12px");
                file.innerHTML = " " + target.file;
                row.appendChild(file);
            }
            dialog.appendChild(row);
        }
        _body.appendChild(dialog);
    }

    // remove active highlights
    function hideHighlight() {
        if (_highlight.length === 0) {
            return;
        }
        var i;
        for (i in _highlight) {
            _highlightNode(_highlight[i]);
        }
        _highlight = [];
    }

    // highlight a node
    function highlight(node) {
        _highlight.push(_highlightNode(node));
    }

    // highlight a rule
    function highlightRule(rule) {
        hideHighlight();
        var i, nodes = document.querySelectorAll(rule);
        for (i = 0; i < nodes.length; i++) {
            highlight(nodes[i]);
        }
    }

    // insert a node
    function insertNode(payload, parent, index) {
        var node;
        if (payload.value) {
            node = document.createTextNode(payload.value);
        } else {
            node = document.createElement(payload.nodeName);
        }
        var sibling;
        if (index !== undefined) {
            sibling = parent.childNodes[index];
        }
        if (sibling) {
            parent.insertBefore(node, sibling);
        } else {
            parent.appendChild(node);
        }
        return node;
    }

    // log something (for testing)
    function log() {
        var i;
        for (i in arguments) {
            console.info(arguments[i]);
        }
    }

    // install event listeners
    
    /* FUTURE
    document.addEventListener("keyup", _onKeyUp);
    document.addEventListener("mousemove", _onMouse);
    document.addEventListener("mouseout", _onMouse);
    document.addEventListener("mousedown", _preventEventWhenMeta, true);
    document.addEventListener("mouseup", _preventEventWhenMeta, true);
    document.addEventListener("click", _onClick, true);
    */
    
    return {
        "showGoto": showGoto,
        "hideHighlight": hideHighlight,
        "highlight": highlight,
        "highlightRule": highlightRule,
        "insertNode": insertNode,
        "log": log
    };
}