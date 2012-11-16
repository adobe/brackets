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
function RemoteFunctions(experimental) {
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
        this.remove = this.remove.bind(this);
    }

    Menu.prototype = {
        onClick: function (url, event) {
            event.preventDefault();
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
            document.addEventListener("click", this.remove);
        },

        remove: function () {
            if (this.body && this.body.parentNode) {
                document.body.removeChild(this.body);
            }
            document.removeEventListener("click", this.remove);
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

        _trigger(this.element, "edit", 1);
    }

    Editor.prototype = {
        onBlur: function (event) {
            this.element.removeAttribute("contenteditable");
            this.element.removeEventListener("blur", this.onBlur);
            this.element.removeEventListener("keypress", this.onKeyPress);
            _trigger(this.element, "edit", 0, true);
        },

        onKeyPress: function (event) {
            switch (event.which) {
            case 13: // return
                this.element.blur();
                break;
            case 27: // esc
                this.element.innerHTML = this.revertText;
                this.element.blur();
                break;
            }
        }
    };

    function Highlight(color, trigger) {
        this.color = color;
        this.trigger = !!trigger;
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

        _makeHighlightDiv: function (element, skipAnimation) {
            var elementBounds = element.getBoundingClientRect(),
                highlight = window.document.createElement("div"),
                styles = window.getComputedStyle(element);
                
            highlight.className = "__LD-highlight";
            highlight.style.setProperty("left", _screenOffset(element, "offsetLeft") + "px");
            highlight.style.setProperty("top", _screenOffset(element, "offsetTop") + "px");
            highlight.style.setProperty("width", elementBounds.width + "px");
            highlight.style.setProperty("height", elementBounds.height + "px");
            highlight.style.setProperty("z-index", 2000000);
            highlight.style.setProperty("position", "absolute");
            highlight.style.setProperty("pointer-events", "none");
            if (skipAnimation) {
                highlight.style.setProperty("background", "rgba(94,167,255, 0.1)");
                highlight.style.setProperty("box-shadow", "0 0 8px 2px rgba(94,167,255, 0.3), inset 0 0 4px 1px rgba(255,255,255,0.6)");
            } else {
                highlight.style.setProperty("background", "rgba(94,167,255, 0.3)");
                highlight.style.setProperty("box-shadow", "0 0 16px 2px rgba(94,167,255, 0.8), inset 0 0 4px 1px rgba(255,255,255,1)");
            }
            highlight.style.setProperty("border-top-left-radius", styles.borderTopLeftRadius);
            highlight.style.setProperty("border-top-right-radius", styles.borderTopRightRadius);
            highlight.style.setProperty("border-bottom-left-radius", styles.borderBottomLeftRadius);
            highlight.style.setProperty("border-bottom-right-radius", styles.borderBottomRightRadius);
            
            if (!skipAnimation) {
                highlight.style.setProperty("opacity", 0);
                highlight.style.setProperty("-webkit-transition-property", "opacity, box-shadow, background");
                highlight.style.setProperty("-webkit-transition-duration", "0.3s, 0.6s, 0.6s");
                
                window.setTimeout(function () {
                    highlight.style.setProperty("opacity", 1);
                    highlight.style.setProperty("background", "rgba(94,167,255, 0.1)");
                    highlight.style.setProperty("box-shadow", "0 0 8px 2px rgba(94,167,255, 0.3), inset 0 0 4px 1px rgba(255,255,255,0.6)");
                }, 0);
            }
        
            window.document.body.appendChild(highlight);
        },
        
        add: function (element, skipAnimation) {
            if (this._elementExists(element) || element === document) {
                return;
            }
            if (this.trigger) {
                _trigger(element, "highlight", 1);
            }
            this.elements.push(element);
            
            this._makeHighlightDiv(element, skipAnimation);
        },

        clear: function () {
            var i, highlights = window.document.querySelectorAll(".__LD-highlight"),
                body = window.document.body;
        
            for (i = 0; i < highlights.length; i++) {
                body.removeChild(highlights[i]);
            }
            
            this.elements = [];
        },
        
        redraw: function () {
            var i, highlighted = this.elements.slice(0);
            
            this.clear();
            for (i in highlighted) {
                this.add(highlighted[i], true);
            }
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
            _localHighlight = new Highlight("#ecc", true);
            _setup = true;
        }
    }

    function updateHighlights(event) {
        if (_remoteHighlight) {
            _remoteHighlight.redraw();
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

    // init
    if (experimental) {
        window.document.addEventListener("keydown", onKeyDown);
    }
    
    window.addEventListener("resize", updateHighlights);
    
    // Scrolling a div can interfere with highlighting. 
    var i, divs = window.document.getElementsByTagName("div");
    for (i = 0; i < divs.length; i++) {
        divs[i].addEventListener("scroll", updateHighlights);
    }

    return {
        "showGoto": showGoto,
        "hideHighlight": hideHighlight,
        "highlight": highlight,
        "highlightRule": highlightRule
    };
}