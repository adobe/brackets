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


/*jslint vars: true, plusplus: true, browser: true, nomen: true, indent: 4, forin: true, maxerr: 50, regexp: true */
/*jshint unused: false */
/*global window, navigator, Node, console */
/*theseus instrument: false */

/**
 * RemoteFunctions define the functions to be executed in the browser. This
 * modules should define a single function that returns an object of all
 * exported functions.
 */
function RemoteFunctions(experimental) {
    "use strict";

    var lastKeepAliveTime = Date.now();

    /**
     * @type {DOMEditHandler}
     */
    var _editHandler;

    var HIGHLIGHT_CLASSNAME = "__brackets-ld-highlight",
        KEEP_ALIVE_TIMEOUT  = 3000;   // Keep alive timeout value, in milliseconds

    // determine whether an event should be processed for Live Development
    function _validEvent(event) {
        if (navigator.platform.substr(0, 3) === "Mac") {
            // Mac
            return event.metaKey;
        } else {
            // Windows
            return event.ctrlKey;
        }
    }

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
    function _screenOffset(element) {
        var elemBounds = element.getBoundingClientRect(),
            body = window.document.body,
            offsetTop,
            offsetLeft;

        if (window.getComputedStyle(body).position === "static") {
            offsetLeft = elemBounds.left + window.pageXOffset;
            offsetTop = elemBounds.top + window.pageYOffset;
        } else {
            var bodyBounds = body.getBoundingClientRect();
            offsetLeft = elemBounds.left - bodyBounds.left;
            offsetTop = elemBounds.top - bodyBounds.top;
        }
        return { left: offsetLeft, top: offsetTop };
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
            var offset = _screenOffset(this.element),
                x = offset.left,
                y = offset.top + this.element.offsetHeight;

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
        this.selector = "";
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

        _makeHighlightDiv: function (element, doAnimation) {
            var elementBounds = element.getBoundingClientRect(),
                highlight = window.document.createElement("div"),
                styles = window.getComputedStyle(element);

            // Don't highlight elements with 0 width & height
            if (elementBounds.width === 0 && elementBounds.height === 0) {
                return;
            }

            highlight.className = HIGHLIGHT_CLASSNAME;

            var offset = _screenOffset(element);

            var stylesToSet = {
                "left": offset.left + "px",
                "top": offset.top + "px",
                "width": elementBounds.width + "px",
                "height": elementBounds.height + "px",
                "z-index": 2000000,
                "margin": 0,
                "padding": 0,
                "position": "absolute",
                "pointer-events": "none",
                "border-top-left-radius": styles.borderTopLeftRadius,
                "border-top-right-radius": styles.borderTopRightRadius,
                "border-bottom-left-radius": styles.borderBottomLeftRadius,
                "border-bottom-right-radius": styles.borderBottomRightRadius,
                "border-style": "solid",
                "border-width": "1px",
                "border-color": "#00a2ff",
                "box-shadow": "0 0 1px #fff",
                "box-sizing": "border-box"
            };

            var animateStartValues = {
                "background-color": "rgba(0, 162, 255, 0.5)",
                "opacity": 0
            };

            var animateEndValues = {
                "background-color": "rgba(0, 162, 255, 0)",
                "opacity": 1
            };

            var transitionValues = {
                "-webkit-transition-property": "opacity, background-color",
                "-webkit-transition-duration": "300ms, 2.3s",
                "transition-property": "opacity, background-color",
                "transition-duration": "300ms, 2.3s"
            };

            function _setStyleValues(styleValues, obj) {
                var prop;

                for (prop in styleValues) {
                    obj.setProperty(prop, styleValues[prop]);
                }
            }

            _setStyleValues(stylesToSet, highlight.style);
            _setStyleValues(
                doAnimation ? animateStartValues : animateEndValues,
                highlight.style
            );


            if (doAnimation) {
                _setStyleValues(transitionValues, highlight.style);

                window.setTimeout(function () {
                    _setStyleValues(animateEndValues, highlight.style);
                }, 20);
            }

            window.document.body.appendChild(highlight);
        },

        add: function (element, doAnimation) {
            if (this._elementExists(element) || element === document) {
                return;
            }
            if (this.trigger) {
                _trigger(element, "highlight", 1);
            }
            this.elements.push(element);

            this._makeHighlightDiv(element, doAnimation);
        },

        clear: function () {
            var i, highlights = window.document.querySelectorAll("." + HIGHLIGHT_CLASSNAME),
                body = window.document.body;

            for (i = 0; i < highlights.length; i++) {
                body.removeChild(highlights[i]);
            }

            if (this.trigger) {
                for (i = 0; i < this.elements.length; i++) {
                    _trigger(this.elements[i], "highlight", 0);
                }
            }

            this.elements = [];
        },

        redraw: function () {
            var i, highlighted;

            // When redrawing a selector-based highlight, run a new selector
            // query to ensure we have the latest set of elements to highlight.
            if (this.selector) {
                highlighted = window.document.querySelectorAll(this.selector);
            } else {
                highlighted = this.elements.slice(0);
            }

            this.clear();
            for (i = 0; i < highlighted.length; i++) {
                this.add(highlighted[i], false);
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
        if (_validEvent(event)) {
            _localHighlight.add(event.target, true);
        }
    }

    function onMouseOut(event) {
        if (_validEvent(event)) {
            _localHighlight.clear();
        }
    }

    function onMouseMove(event) {
        onMouseOver(event);
        document.removeEventListener("mousemove", onMouseMove);
    }

    function onClick(event) {
        if (_validEvent(event)) {
            event.preventDefault();
            event.stopPropagation();
            if (event.altKey) {
                _toggleEditor(event.target);
            } else {
                _toggleMenu(event.target);
            }
        }
    }

    function onKeyUp(event) {
        if (_setup && !_validEvent(event)) {
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
        if (!_setup && _validEvent(event)) {
            document.addEventListener("keyup", onKeyUp);
            document.addEventListener("mouseover", onMouseOver);
            document.addEventListener("mouseout", onMouseOut);
            document.addEventListener("mousemove", onMouseMove);
            document.addEventListener("click", onClick);
            _localHighlight = new Highlight("#ecc", true);
            _setup = true;
        }
    }

    /** Public Commands **********************************************************/

    // keep alive. Called once a second when a Live Development connection is active.
    // If several seconds have passed without this method being called, we can assume
    // that the connection has been severed and we should remove all our code/hooks.
    function keepAlive() {
        lastKeepAliveTime = Date.now();
    }

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
            _remoteHighlight = null;
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
        _remoteHighlight.add(node, true);
    }

    // highlight a rule
    function highlightRule(rule) {
        hideHighlight();
        var i, nodes = document.querySelectorAll(rule);
        for (i = 0; i < nodes.length; i++) {
            highlight(nodes[i]);
        }
        _remoteHighlight.selector = rule;
    }

    // redraw active highlights
    function redrawHighlights() {
        if (_remoteHighlight) {
            _remoteHighlight.redraw();
        }
    }

    window.addEventListener("resize", redrawHighlights);
    // Add a capture-phase scroll listener to update highlights when
    // any element scrolls.

    function _scrollHandler(e) {
        // Document scrolls can be updated immediately. Any other scrolls
        // need to be updated on a timer to ensure the layout is correct.
        if (e.target === document) {
            redrawHighlights();
        } else {
            if (_remoteHighlight || _localHighlight) {
                window.setTimeout(redrawHighlights, 0);
            }
        }
    }

    window.addEventListener("scroll", _scrollHandler, true);

    var aliveTest = window.setInterval(function () {
        if (Date.now() > lastKeepAliveTime + KEEP_ALIVE_TIMEOUT) {
            // Remove highlights
            hideHighlight();

            // Remove listeners
            window.removeEventListener("resize", redrawHighlights);
            window.removeEventListener("scroll", _scrollHandler, true);

            // Clear this interval
            window.clearInterval(aliveTest);
        }
    }, 1000);

    /**
     * Constructor
     * @param {Document} htmlDocument
     */
    function DOMEditHandler(htmlDocument) {
        this.htmlDocument = htmlDocument;
        this.rememberedNodes = null;
        this.entityParseParent = htmlDocument.createElement("div");
    }

    /**
     * @private
     * Find the first matching element with the specified data-brackets-id
     * @param {string} id
     * @return {Element}
     */
    DOMEditHandler.prototype._queryBracketsID = function (id) {
        if (!id) {
            return null;
        }

        if (this.rememberedNodes && this.rememberedNodes[id]) {
            return this.rememberedNodes[id];
        }

        var results = this.htmlDocument.querySelectorAll("[data-brackets-id='" + id + "']");
        return results && results[0];
    };

    /**
     * @private
     * Insert a new child element
     * @param {Element} targetElement Parent element already in the document
     * @param {Element} childElement New child element
     * @param {Object} edit
     */
    DOMEditHandler.prototype._insertChildNode = function (targetElement, childElement, edit) {
        var before = this._queryBracketsID(edit.beforeID),
            after  = this._queryBracketsID(edit.afterID);

        if (edit.firstChild) {
            before = targetElement.firstChild;
        } else if (edit.lastChild) {
            after = targetElement.lastChild;
        }

        if (before) {
            targetElement.insertBefore(childElement, before);
        } else if (after && (after !== targetElement.lastChild)) {
            targetElement.insertBefore(childElement, after.nextSibling);
        } else {
            targetElement.appendChild(childElement);
        }
    };

    /**
     * @private
     * Given a string containing encoded entity references, returns the string with the entities decoded.
     * @param {string} text The text to parse.
     * @return {string} The decoded text.
     */
    DOMEditHandler.prototype._parseEntities = function (text) {
        // Kind of a hack: just set the innerHTML of a div to the text, which will parse the entities, then
        // read the content out.
        var result;
        this.entityParseParent.innerHTML = text;
        result = this.entityParseParent.textContent;
        this.entityParseParent.textContent = "";
        return result;
    };

    /**
     * @private
     * @param {Node} node
     * @return {boolean} true if node expects its content to be raw text (not parsed for entities) according to the HTML5 spec.
     */
    function _isRawTextNode(node) {
        return (node.nodeType === Node.ELEMENT_NODE && /script|style|noscript|noframes|noembed|iframe|xmp/i.test(node.tagName));
    }

    /**
     * @private
     * Replace a range of text and comment nodes with an optional new text node
     * @param {Element} targetElement
     * @param {Object} edit
     */
    DOMEditHandler.prototype._textReplace = function (targetElement, edit) {
        function prevIgnoringHighlights(node) {
            do {
                node = node.previousSibling;
            } while (node && node.className === HIGHLIGHT_CLASSNAME);
            return node;
        }
        function nextIgnoringHighlights(node) {
            do {
                node = node.nextSibling;
            } while (node && node.className === HIGHLIGHT_CLASSNAME);
            return node;
        }
        function lastChildIgnoringHighlights(node) {
            node = (node.childNodes.length ? node.childNodes.item(node.childNodes.length - 1) : null);
            if (node && node.className === HIGHLIGHT_CLASSNAME) {
                node = prevIgnoringHighlights(node);
            }
            return node;
        }

        var start           = (edit.afterID)  ? this._queryBracketsID(edit.afterID)  : null,
            startMissing    = edit.afterID && !start,
            end             = (edit.beforeID) ? this._queryBracketsID(edit.beforeID) : null,
            endMissing      = edit.beforeID && !end,
            moveNext        = start && nextIgnoringHighlights(start),
            current         = moveNext || (end && prevIgnoringHighlights(end)) || lastChildIgnoringHighlights(targetElement),
            next,
            textNode        = (edit.content !== undefined) ? this.htmlDocument.createTextNode(_isRawTextNode(targetElement) ? edit.content : this._parseEntities(edit.content)) : null,
            lastRemovedWasText,
            isText;

        // remove all nodes inside the range
        while (current && (current !== end)) {
            isText = current.nodeType === Node.TEXT_NODE;

            // if start is defined, delete following text nodes
            // if start is not defined, delete preceding text nodes
            next = (moveNext) ? nextIgnoringHighlights(current) : prevIgnoringHighlights(current);

            // only delete up to the nearest element.
            // if the start/end tag was deleted in a prior edit, stop removing
            // nodes when we hit adjacent text nodes
            if ((current.nodeType === Node.ELEMENT_NODE) ||
                    ((startMissing || endMissing) && (isText && lastRemovedWasText))) {
                break;
            } else {
                lastRemovedWasText = isText;

                if (current.remove) {
                    current.remove();
                } else if (current.parentNode && current.parentNode.removeChild) {
                    current.parentNode.removeChild(current);
                }
                current = next;
            }
        }

        if (textNode) {
            // OK to use nextSibling here (not nextIgnoringHighlights) because we do literally
            // want to insert immediately after the start tag.
            if (start && start.nextSibling) {
                targetElement.insertBefore(textNode, start.nextSibling);
            } else if (end) {
                targetElement.insertBefore(textNode, end);
            } else {
                targetElement.appendChild(textNode);
            }
        }
    };

    /**
     * @private
     * Apply an array of DOM edits to the document
     * @param {Array.<Object>} edits
     */
    DOMEditHandler.prototype.apply = function (edits) {
        var targetID,
            targetElement,
            childElement,
            self = this;

        this.rememberedNodes = {};

        edits.forEach(function (edit) {
            var editIsSpecialTag = edit.type === "elementInsert" && (edit.tag === "html" || edit.tag === "head" || edit.tag === "body");

            if (edit.type === "rememberNodes") {
                edit.tagIDs.forEach(function (tagID) {
                    var node = self._queryBracketsID(tagID);
                    self.rememberedNodes[tagID] = node;
                    if (node.remove) {
                        node.remove();
                    } else if (node.parentNode && node.parentNode.removeChild) {
                        node.parentNode.removeChild(node);
                    }
                });
                return;
            }

            targetID = edit.type.match(/textReplace|textDelete|textInsert|elementInsert|elementMove/) ? edit.parentID : edit.tagID;
            targetElement = self._queryBracketsID(targetID);

            if (!targetElement && !editIsSpecialTag) {
                console.error("data-brackets-id=" + targetID + " not found");
                return;
            }

            switch (edit.type) {
            case "attrChange":
            case "attrAdd":
                targetElement.setAttribute(edit.attribute, self._parseEntities(edit.value));
                break;
            case "attrDelete":
                targetElement.removeAttribute(edit.attribute);
                break;
            case "elementDelete":
                if (targetElement.remove) {
                    targetElement.remove();
                } else if (targetElement.parentNode && targetElement.parentNode.removeChild) {
                    targetElement.parentNode.removeChild(targetElement);
                }
                break;
            case "elementInsert":
                childElement = null;
                if (editIsSpecialTag) {
                    // If we already have one of these elements (which we should), then
                    // just copy the attributes and set the ID.
                    childElement = self.htmlDocument[edit.tag === "html" ? "documentElement" : edit.tag];
                    if (!childElement) {
                        // Treat this as a normal insertion.
                        editIsSpecialTag = false;
                    }
                }
                if (!editIsSpecialTag) {
                    childElement = self.htmlDocument.createElement(edit.tag);
                }

                Object.keys(edit.attributes).forEach(function (attr) {
                    childElement.setAttribute(attr, self._parseEntities(edit.attributes[attr]));
                });
                childElement.setAttribute("data-brackets-id", edit.tagID);

                if (!editIsSpecialTag) {
                    self._insertChildNode(targetElement, childElement, edit);
                }
                break;
            case "elementMove":
                childElement = self._queryBracketsID(edit.tagID);
                self._insertChildNode(targetElement, childElement, edit);
                break;
            case "textInsert":
                var textElement = self.htmlDocument.createTextNode(_isRawTextNode(targetElement) ? edit.content : self._parseEntities(edit.content));
                self._insertChildNode(targetElement, textElement, edit);
                break;
            case "textReplace":
            case "textDelete":
                self._textReplace(targetElement, edit);
                break;
            }
        });

        this.rememberedNodes = {};

        // update highlight after applying diffs
        redrawHighlights();
    };

    function applyDOMEdits(edits) {
        _editHandler.apply(edits);
    }

    /**
     *
     * @param {Element} elem
     */
    function _domElementToJSON(elem) {
        var json = { tag: elem.tagName.toLowerCase(), attributes: {}, children: [] },
            i,
            len,
            node,
            value;

        len = elem.attributes.length;
        for (i = 0; i < len; i++) {
            node = elem.attributes.item(i);
            value = (node.name === "data-brackets-id") ? parseInt(node.value, 10) : node.value;
            json.attributes[node.name] = value;
        }

        len = elem.childNodes.length;
        for (i = 0; i < len; i++) {
            node = elem.childNodes.item(i);

            // ignores comment nodes and visuals generated by live preview
            if (node.nodeType === Node.ELEMENT_NODE && node.className !== HIGHLIGHT_CLASSNAME) {
                json.children.push(_domElementToJSON(node));
            } else if (node.nodeType === Node.TEXT_NODE) {
                json.children.push({ content: node.nodeValue });
            }
        }

        return json;
    }

    function getSimpleDOM() {
        return JSON.stringify(_domElementToJSON(document.documentElement));
    }

    // init
    _editHandler = new DOMEditHandler(window.document);

    if (experimental) {
        window.document.addEventListener("keydown", onKeyDown);
    }

    return {
        "DOMEditHandler"        : DOMEditHandler,
        "keepAlive"             : keepAlive,
        "showGoto"              : showGoto,
        "hideHighlight"         : hideHighlight,
        "highlight"             : highlight,
        "highlightRule"         : highlightRule,
        "redrawHighlights"      : redrawHighlights,
        "applyDOMEdits"         : applyDOMEdits,
        "getSimpleDOM"          : getSimpleDOM
    };
}
