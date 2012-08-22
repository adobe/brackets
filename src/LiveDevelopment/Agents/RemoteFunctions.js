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


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, forin: true, maxerr: 50, regexp: true */
/*global define, $, window, document */

/**
 * RemoteFunctions define the functions to be executed in the browser. This
 * modules should define a single function that returns an object of all
 * exported functions.
 */
function RemoteFunctions() {
    "use strict";

    // determine the color for a type
    function _typeColor(type, highlight) {
        switch (type) {
        case "html":
            return highlight ? "#eec" : "#ffe";
        case "css":
            return highlight ? "#cee" : "#eff";
        case "js":
            return highlight ? "#ccf" : "#eef";
        default:
            return highlight ? "#ddd" : "#eee";
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

    // set an event on a element
    function _trigger(element, name, value, autoRemove) {
        var key = "data-ld-" + name;
        if (value !== undefined && value !== null) {
            element.setAttribute(key, value);
            if (autoRemove) {
                window.setTimeout(element.removeAttribute.bind(element, key));
            }
        } else {
            element.removeAttribute(key);
        }
    }

    // construct the info menu
    function Menu(element) {
        this.element = element;
        _trigger(this.element, "showgoto", 1, true);
        window.setTimeout(window.remoteShowGoto);
    }

    Menu.prototype = {
        onClick: function (url, event) {
            _trigger(this.element, "goto", url, true);
            this.remove();
        },

        createBody: function () {
            if (this.body) {
                return;
            }

            // compute the position on screen
            var x = _screenOffset(this.element, "offsetLeft");
            var y = _screenOffset(this.element, "offsetTop") + this.element.offsetHeight;

            // create the container
            this.body = document.createElement("div");
            this.body.style.setProperty("z-index", 2147483647);
            this.body.style.setProperty("position", "absolute");
            this.body.style.setProperty("left", x + "px");
            this.body.style.setProperty("top", y + "px");
            this.body.style.setProperty("font-size", "11pt");

            // draw the background
            this.body.style.setProperty("background", "#fff");
            this.body.style.setProperty("border", "1px solid #888");
            this.body.style.setProperty("-webkit-box-shadow", "2px 2px 6px 0px #ccc");
            this.body.style.setProperty("border-radius", "6px");
            this.body.style.setProperty("padding", "6px");
        },

        addItem: function (target) {
            var item = document.createElement("div");
            item.style.setProperty("padding", "2px 6px");
            if (this.body.childNodes.length > 0) {
                item.style.setProperty("border-top", "1px solid #ccc");
            }
            item.style.setProperty("cursor", "pointer");
            item.style.setProperty("background", _typeColor(target.type));
            item.innerHTML = target.name;
            item.addEventListener("click", this.onClick.bind(this, target.url));

            if (target.file) {
                var file = document.createElement("i");
                file.style.setProperty("float", "right");
                file.style.setProperty("margin-left", "12px");
                file.innerHTML = " " + target.file;
                item.appendChild(file);
            }
            this.body.appendChild(item);
        },

        show: function () {
            if (!this.body) {
                this.body = this.createBody();
            }
            if (!this.body.parentNode) {
                document.body.appendChild(this.body);
            }
        },

        remove: function () {
            if (this.body && this.body.parentNode) {
                document.body.removeChild(this.body);
            }
        }

    };

    function Editor(element) {
        this.onBlur = this.onBlur.bind(this);
        this.onKeyPress = this.onKeyPress.bind(this);

        this.element = element;
        this.element.setAttribute("contenteditable", "true");
        this.element.focus();
        this.element.addEventListener("blur", this.onBlur);
        this.element.addEventListener("keypress", this.onKeyPress);

        this.revertText = this.element.innerHTML;
    }

    Editor.prototype = {
        onBlur: function (event) {
            this.element.removeAttribute("contenteditable");
            this.element.removeEventListener("blur", this.onBlur);
            this.element.removeEventListener("keypress", this.onKeyPress);
            _trigger(this.element, "edit");
        },

        onKeyPress: function (event) {
            switch (event.which) {
            case 13: // return
                this.element.blur();
                break;
            case 27: // esc
                _trigger(this.element, "edit", this.revertText, true);
                this.element.blur();
                break;
            }
        },

        onChange: function (event) {
            window.setTimeout(_trigger.bind(undefined, this.element, "edit", this.element.innerHTML));
        }
    };

    function Highlight(color, autoclear) {
        this.color = color;
        this.autoclear = !!autoclear;
        this.elements = [];
        this.orgColors = [];
    }

    Highlight.prototype = {
        _elementExists: function (element) {
            var i;
            for (i in this.elements) {
                if (this.elements[i] === element) {
                    return true;
                }
            }
            return false;
        },

        add: function (element) {
            if (this._elementExists(element) || element === document) {
                return;
            }
            if (this.autoclear) {
                this.clear();
            }
            this.elements.push(element);
            this.orgColors.push(element.style.getPropertyValue("background-color"));
            element.style.setProperty("background-color", this.color);
        },

        clear: function () {
            var i;
            for (i in this.elements) {
                var e = this.elements[i];
                e.style.setProperty("background-color", this.orgColors[i]);
            }
            this.elements = [];
            this.orgColors = [];
        }
    };

    var _currentEditor;
    function _toggleEditor(element) {
        _currentEditor = new Editor(element);
    }

    var _currentMenu;
    function _toggleMenu(element) {
        if (_currentMenu) {
            _currentMenu.remove();
        }
        _currentMenu = new Menu(element);
    }

    var _localHighlight;
    var _remoteHighlight;
    var _setup = false;


    /** Event Handlers ***********************************************************/

    function onMouseOver(event) {
        if (!event.metaKey) {
            return;
        }
        _localHighlight.add(event.target);
    }

    function onMouseOut(event) {
        if (!event.metaKey) {
            return;
        }
        _localHighlight.clear();
    }

    function onMouseMove(event) {
        onMouseOver(event);
        document.removeEventListener("mousemove", onMouseMove);
    }

    function onClick(event) {
        if (!event.metaKey) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        if (event.altKey) {
            _toggleEditor(event.target);
        } else {
            _toggleMenu(event.target);
        }
    }

    function onKeyUp(event) {
        if (_setup && !event.metaKey) {
            document.removeEventListener("keyup", onKeyUp);
            document.removeEventListener("mouseover", onMouseOver);
            document.removeEventListener("mouseout", onMouseOut);
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("click", onClick);
            _localHighlight.clear();
            _localHighlight = undefined;
            _setup = false;
        }
    }

    function onKeyDown(event) {
        if (!_setup && event.metaKey) {
            document.addEventListener("keyup", onKeyUp);
            document.addEventListener("mouseover", onMouseOver);
            document.addEventListener("mouseout", onMouseOut);
            document.addEventListener("mousemove", onMouseMove);
            document.addEventListener("click", onClick);
            _localHighlight = new Highlight("#ecc");
            _setup = true;
        }
    }


    /** Public Commands **********************************************************/

    // show goto
    function showGoto(targets) {
        if (!_currentMenu) {
            return;
        }
        _currentMenu.createBody();
        var i;
        for (i in targets) {
            _currentMenu.addItem(targets[i]);
        }
        _currentMenu.show();
    }

    // remove active highlights
    function hideHighlight() {
        if (_remoteHighlight) {
            _remoteHighlight.clear();
        }
    }

    // highlight a node
    function highlight(node, clear) {
        if (!_remoteHighlight) {
            _remoteHighlight = new Highlight("#cfc");
        }
        if (clear) {
            _remoteHighlight.clear();
        }
        _remoteHighlight.add(node);
    }

    // highlight a rule
    function highlightRule(rule) {
        hideHighlight();
        var i, nodes = document.querySelectorAll(rule);
        for (i = 0; i < nodes.length; i++) {
            highlight(nodes[i]);
        }
    }

    // install event listeners
    /* FUTURE
    window.document.addEventListener("keydown", onKeyDown);
    */

    return {
        "showGoto": showGoto,
        "hideHighlight": hideHighlight,
        "highlight": highlight,
        "highlightRule": highlightRule
    };
}