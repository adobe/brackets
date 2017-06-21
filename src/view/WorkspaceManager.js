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
* Manages layout of panels surrounding the editor area, and size of the editor area (but not its contents).
 *
 * Updates panel sizes when the window is resized. Maintains the max resizing limits for panels, based on
 * currently available window size.
 *
 * Events:
 * `workspaceUpdateLayout` When workspace size changes for any reason (including panel show/hide panel resize, or the window resize).
 *              The 2nd arg is the available workspace height.
 *              The 3rd arg is a refreshHint flag for internal use (passed in to recomputeLayout)
 */
define(function (require, exports, module) {
    "use strict";

    var AppInit                 = require("utils/AppInit"),
        EventDispatcher         = require("utils/EventDispatcher"),
        Resizer                 = require("utils/Resizer"),
        PreferencesManager      = require("preferences/PreferencesManager"),
        ContainerPanelHTML      = require("text!widgets/ContainerPanel.html"),
        PanelTabTitleHTML       = require("text!widgets/PanelTabTitle.html"),
        PanelTabContentHTML     = require("text!widgets/PanelTabContent.html"),
        Strings                 = require("strings"),
        Mustache                = require("thirdparty/mustache/mustache");

    /**
     * Constants events.
     */
    var EVENT_WORKSPACE_UPDATE_LAYOUT  = "workspaceUpdateLayout",
        EVENT_WORKSPACE_PANEL_SHOWN    = "workspacePanelShown",
        EVENT_WORKSPACE_PANEL_HIDDEN   = "workspacePanelHidden";

    /**
     * Constants for the preferences defined in this file.
     */
    var PREF_COLLAPSED                 = "collapsed";

    var prefs = PreferencesManager.getExtensionPrefs("workspace");

    /**
     * The ".content" vertical stack (editor + all header/footer panels)
     * @type {jQueryObject}
     */
    var $windowContent;

    /**
     * The "#editor-holder": has only one visible child, the current CodeMirror instance (or the no-editor placeholder)
     * @type {jQueryObject}
     */
    var $editorHolder;

    /**
     * A map from panel ID's to all reated panels
     */
    var panelIDMap = {};

    /**
     * Have we already started listening for the end of the ongoing window resize?
     * @type {boolean}
     */
    var windowResizing = false;

    /**
     * The reference of the panels' container.
     * @type {ContainerPanel}
     */
    var containerPanel;

    /**
     * Calculates the available height for the full-size Editor (or the no-editor placeholder),
     * accounting for the current size of all visible panels, toolbar, & status bar.
     * @return {number}
     */
    function calcAvailableHeight() {
        var availableHt = $windowContent.height();

        $editorHolder.siblings().each(function (i, elem) {
            var $elem = $(elem);
            if ($elem.css("display") !== "none" && $elem.css("position") !== "absolute") {
                availableHt -= $elem.outerHeight();
            }
        });

        // Clip value to 0 (it could be negative if a panel wants more space than we have)
        return Math.max(availableHt, 0);
    }

    /** Updates panel resize limits to disallow making panels big enough to shrink editor area below 0 */
    function updateResizeLimits() {
        var editorAreaHeight = $editorHolder.height();

        $editorHolder.siblings().each(function (i, elem) {
            var $elem = $(elem);
            if ($elem.css("display") === "none") {
                $elem.data("maxsize", editorAreaHeight);
            } else {
                $elem.data("maxsize", editorAreaHeight + $elem.outerHeight());
            }
        });
    }


    /**
     * Calculates a new size for editor-holder and resizes it accordingly, then and dispatches the "workspaceUpdateLayout"
     * event. (The editors within are resized by EditorManager, in response to that event).
     *
     * @param {boolean=} refreshHint  true to force a complete refresh
     */
    function triggerUpdateLayout(refreshHint) {
        // Find how much space is left for the editor
        var editorAreaHeight = calcAvailableHeight();

        $editorHolder.height(editorAreaHeight);  // affects size of "not-editor" placeholder as well

        // Resize editor to fill the space
        exports.trigger(EVENT_WORKSPACE_UPDATE_LAYOUT, editorAreaHeight, refreshHint);
    }


    /** Trigger editor area resize whenever the window is resized */
    function handleWindowResize() {
        // These are not initialized in Jasmine Spec Runner window until a test
        // is run that creates a mock document.
        if (!$windowContent || !$editorHolder) {
            return;
        }

        // FIXME (issue #4564) Workaround https://github.com/codemirror/CodeMirror/issues/1787
        triggerUpdateLayout();

        if (!windowResizing) {
            windowResizing = true;

            // We don't need any fancy debouncing here - we just need to react before the user can start
            // resizing any panels at the new window size. So just listen for first mousemove once the
            // window resize releases mouse capture.
            $(window.document).one("mousemove", function () {
                windowResizing = false;
                updateResizeLimits();
            });
        }
    }

    /** Trigger editor area resize whenever the given panel is shown/hidden/resized
     *  @param {!jQueryObject} $panel the jquery object in which to attach event handlers
     */
    function listenToResize($panel) {
        // Update editor height when shown/hidden, & continuously as panel is resized
        $panel.on("panelCollapsed panelExpanded panelResizeUpdate", function () {
            triggerUpdateLayout();
        });
        // Update max size of sibling panels when shown/hidden, & at *end* of resize gesture
        $panel.on("panelCollapsed panelExpanded panelResizeEnd", function () {
            updateResizeLimits();
        });
    }


    /**
     * Represents a panel below the editor area (a child of ".content").
     * @constructor
     * @param {!jQueryObject} $panel  The entire panel, including any chrome, already in the DOM.
     * @param {number=} minSize  Minimum height of panel in px.
     */
    function Panel($panel, minSize) {
        this.$panel = $panel;

        Resizer.makeResizable($panel[0], Resizer.DIRECTION_VERTICAL, Resizer.POSITION_TOP, minSize, false, undefined, true);
        listenToResize($panel);
    }

    /**
     * Dom node holding the rendered panel
     * @type {jQueryObject}
     */
    Panel.prototype.$panel = null;

    /**
     * Determines if the panel is visible
     * @return {boolean} true if visible, false if not
     */
    Panel.prototype.isVisible = function () {
        return this.$panel.is(":visible");
    };

    /**
     * Shows the panel
     */
    Panel.prototype.show = function () {
        Resizer.show(this.$panel[0]);
        exports.trigger(EVENT_WORKSPACE_PANEL_SHOWN, this.panelID);
    };

    /**
     * Hides the panel
     */
    Panel.prototype.hide = function () {
        Resizer.hide(this.$panel[0]);
        exports.trigger(EVENT_WORKSPACE_PANEL_HIDDEN, this.panelID);
    };

    /**
     * Sets the panel's visibility state
     * @param {boolean} visible true to show, false to hide
     */
    Panel.prototype.setVisible = function (visible) {
        if (visible) {
            this.show();
        } else {
            this.hide();
        }
    };


    /**
     * Creates a new resizable panel beneath the editor area and above the status bar footer. Panel is initially invisible.
     * The panel's size & visibility are automatically saved & restored as a view-state preference.
     *
     * @param {!string} id  Unique id for this panel. Use package-style naming, e.g. "myextension.feature.panelname"
     * @param {!jQueryObject} $panel  DOM content to use as the panel. Need not be in the document yet. Must have an id
     *      attribute, for use as a preferences key.
     * @param {number=} minSize  Minimum height of panel in px.
     * @return {!Panel}
     */
    function createBottomPanel(id, $panel, minSize) {
        $panel.insertBefore("#container-panel");
        $panel.hide();
        updateResizeLimits();  // initialize panel's max size

        panelIDMap[id] = new Panel($panel, minSize);
        panelIDMap[id].panelID = id;

        return panelIDMap[id];
    }

    /**
     * Returns an array of all panel ID's
     * @returns {Array} List of ID's of all bottom panels
     */
    function getAllPanelIDs() {
        var property, panelIDs = [];
        for (property in panelIDMap) {
            if (panelIDMap.hasOwnProperty(property)) {
                panelIDs.push(property);
            }
        }
        return panelIDs;
    }

    /**
     * Gets the Panel interface for the given ID. Can return undefined if no panel with the ID is found.
     * @param   {string} panelID
     * @returns {Object} Panel object for the ID or undefined
     */
    function getPanelForID(panelID) {
        return panelIDMap[panelID];
    }

    /**
     * Creates a new panel inside the container above the status bar footer.
     *
     * @param {!jQueryObject} $panel  DOM content to use as the panel. Need not be in the document yet. Must have an id
     *      attribute, for use as a preferences key.
     * @param {Object} params - Additional parameters to configure the panel.
     * @param {String} params.id - The unique identifier of panel. Must not contain any dot character.
     *      (If it has any dots, they will be replaced with a dash)
     * @param {String} params.title - A title to show to the user in the tab of the container.
     * @return {!PanelItem}
     */
    function addPanel($panel, params) {
        var panel = containerPanel.addPanel($panel, {
            id: params.id,
            title: params.title
        });

        return panel;
    }

    /**
     * Represents a panel inside the ContainerPanel.
     * @constructor
     * @param {ContainerPanel} container - A reference of the container.
     * @param {!jQueryObject} $panel  The entire panel, including any chrome, already in the DOM.
     * @param {Object} params - Additional parameters to configure the panel.
     * @param {String} params.id - The unique identifier of panel. Must not contain any dot character.
     *      (If it has any dots, they will be replaced with a dash)
     * @param {String} params.title - A title to show to the user in the tab of the container.
     */
    function PanelItem(container, $panel, params) {
        // params.id must not contain dot in it,
        // otherwise it'll break the bootstrap tab component.
        if (params.id.indexOf('.') > -1) {
            params.id = params.id.replace(/\./g, '-');
        }

        this._container = container;
        this.$panel = $panel;
        this._params = params;
        this.id = params.id;

        var panelTabTitleHTML = Mustache.render(PanelTabTitleHTML, {
            id: this._params.id,
            title: this._params.title,
            Strings: Strings
        });
        var panelTabContentHTML = Mustache.render(PanelTabContentHTML, {
            id: this._params.id,
            Strings: Strings
        });

        this.$tabTitle = $(panelTabTitleHTML);
        this.$tabContent = $(panelTabContentHTML);
        this.$tabContent.append(this.$panel);

        this.$tabTitle.find("a[data-toggle='tab']").click(function (e) {
            this._container.onPanelShow(this);
        }.bind(this));

        this.$tabTitle.find("button.close").click(function (e) {
            e.stopPropagation();
            this.hide();
        }.bind(this));
    }

    /**
     * The unique identifier of the panel.
     * @type {String}
     */
    PanelItem.prototype.id = null;

    /**
     * Additional parameters that represent the configuration of the panel.
     *
     * @private
     * @type {Object}
     */
    PanelItem.prototype._params = null;

    /**
     * The DOM object representing the tab title.
     * @type {!jQueryObject}
     */
    PanelItem.prototype.$tabTitle = null;

    /**
     * The DOM object representing the tab content.
     * @type {!jQueryObject}
     */
    PanelItem.prototype.$tabContent = null;

    /**
     * The DOM object representing the panel. It is inside the $tabContent.
     * @type {!jQueryObject}
     */
    PanelItem.prototype.$panel = null;

    /**
     * The reference of the container.
     * @type {ContainerPanel}
     */
    PanelItem.prototype._container = null;

    /**
     * Checks if the tab is visible.
     * @return {Boolean}
     */
    PanelItem.prototype.isVisible = function () {
        return this.$tabTitle.is(":visible");
    };

    /**
     * Shows the tab and selects it.
     * @param {Boolean} openContainer - If true shows the container.
     */
    PanelItem.prototype.show = function (openContainer) {
        var el = this.$tabTitle.find("a[data-toggle='tab']");
        el.tab('show');
        this._container.onPanelShow(this);
        if (openContainer === true) {
            this._container.show();
        }
    };

    /**
     * Shows / Hides the tab.
     * @param {Boolean} visible - If true shows the the tab, otherwise hides it.
     */
    PanelItem.prototype.setVisible = function (visible) {
        if (visible) {
            this.show();
        } else {
            this.hide();
        }
    };

    /**
     * Shows the tab without selecting it.
     */
    PanelItem.prototype.open = function () {
        this.$tabTitle.show();
        this._container.onPanelOpen(this);
    };

    /**
     * Calls open and show.
     * @param {Boolean} openContainer - If true shows the container.
     */
    PanelItem.prototype.openAndShow = function (openContainer) {
        this.open();
        this.show(openContainer);
    };

    /**
     * It hides the tab title without removing the DOM.
     * If the tab was the last open it hides the container, otherwise the last tab showed
     * become the new selected.
     */
    PanelItem.prototype.hide = function () {
        this.$tabTitle.hide();
        this._container.onPanelHide(this);
    };

    /**
     * Track the destinations that can be visited.
     * Some destinations can become non visitable but it still remembers them.
     */
    function Visitor() {
        this._visitables = []; // Booleans - true visitable
        this._destinations = []; // Order of visits. Higher = current destination
        this._index = -1;
    }

    /**
     * Get the current destination index.
     * @return {Number} the destination index
     */
    Visitor.prototype.getIndex = function () {
        return this._index;
    };

    /**
     * Add a new destination that can be visited.
     */
    Visitor.prototype.addDestination = function () {
        var i;
        for (i = 0; i < this._destinations.length; i++) {
            this._destinations[i]++;
        }
        this._destinations.push(0);
        this._visitables.push(true);
    };

    /**
     * Visit a specific destination.
     * @param {Number} index - the index of the destination
     */
    Visitor.prototype.visit = function (index) {
        if (this._destinations.length === 1) {
            console.assert(index === 0);

            this._index = index;
            return;
        }

        var currentOrder = this._destinations[this._index],
            order = this._destinations[index],
            i;

        for (i = 0; i < this._destinations.length; i++) {
            var destination = this._destinations[i];
            if (destination > order) {
                this._destinations[i] = destination - 1;
            }
        }

        this._destinations[index] = currentOrder;
        this._index = index;
    };

    /**
     * Set a specific destination as visitable or non visitable.
     * @param {Number} index - the index of the destination
     * @param {Boolean} isVisitable - true if is visitable, false otherwise
     */
    Visitor.prototype.setVisitable = function (index, isVisitable) {
        this._visitables[index] = isVisitable;
    };

    /**
     * Check if there are visitable destinations.
     * @return true if there are visitable destinations, false otherwise
     */
    Visitor.prototype.hasVisitableDestinations = function () {
        var i;
        for (i = 0; i < this._visitables.length; i++) {
            if (this._visitables[i]) {
                return true;
            }
        }
        return false;
    };

    /**
     * Get the destination index visited before the current one.
     * @return {Number} the destination index
     */
    Visitor.prototype.getPreviousIndex = function () {
        var lastOrder = this._destinations.length - 1,
            i;
        while (true) {
            for (i = 0; i < this._destinations.length; i++) {
                if (this._destinations[i] === lastOrder) {
                    if (this._visitables[i]) {
                        return i;
                    }
                }
            }
            lastOrder--;
            console.assert(lastOrder >= 0);
        }
    };


    /**
     * Represents a container to store all the panels and shows them with Bootstrap tabs.
     *
     * @constructor
     */
    function ContainerPanel() {
        var panelHTML = Mustache.render(ContainerPanelHTML, {
            Strings: Strings
        });
        this._$container = $(panelHTML);
        $(".main-view .content").append(this._$container);

        $("#container-panel-close").click(function () {
            this.hide();
        }.bind(this));

        var defaulMinSize = 100;

        Resizer.makeResizable(this._$container[0], Resizer.DIRECTION_VERTICAL, Resizer.POSITION_TOP,
                              defaulMinSize, false, undefined, true);
        updateResizeLimits();
        listenToResize(this._$container);
        Resizer.show(this._$container[0]);

        this._visitor = new Visitor();
    }

    /**
     * The DOM object representing the tab container.
     * @private
     * @type {!jQueryObject}
     */
    ContainerPanel.prototype._$container = null;

    /**
     * An array containing some useful data of the panels created.
     * @private
     * @type {Array}
     */
    ContainerPanel.prototype._panels = [];

    /**
     * A Visitor to remember the order in which the tabs are selected by the user.
     * @private
     * @type {Visitor}
     */
    ContainerPanel.prototype._visitor = null;

    /**
     * Add a panel to the container.
     * @param {!jQueryObject} $panel - The DOM of the panel to add.
     * @param {Object} params - Additional parameters to configure the panel.
     * @param {String} params.id - The unique identifier of panel. Must not contain any dot character.
     *      (If it has any dots, they will be replaced with a dash)
     * @param {String} params.title - A title to show to the user in the tab of the container.
     */
    ContainerPanel.prototype.addPanel = function ($panel, params) {
        var panelItem = new PanelItem(this, $panel, params);

        this._$container.find("#panel-title-list").append(panelItem.$tabTitle);
        this._$container.find("#panel-content-list").append(panelItem.$tabContent);

        this._panels.push({
            id: panelItem.id,
            panelItem: panelItem
        });

        this._visitor.addDestination();

        panelItem.show();

        return panelItem;
    };

    /**
     * Checks if the container is visible.
     * @return {Boolean}
     */
    ContainerPanel.prototype.isVisible = function () {
        return this._$container.is(':visible');
    };

    /**
     * Shows the container and remembers the choice.
     */
    ContainerPanel.prototype.show = function () {
        Resizer.show(this._$container[0]);
        prefs.set(PREF_COLLAPSED, true);
        prefs.save();
    };

    /**
     * Hides the container and remembers the choice.
     */
    ContainerPanel.prototype.hide = function () {
        Resizer.hide(this._$container[0]);
        prefs.set(PREF_COLLAPSED, false);
        prefs.save();
    };

    /**
     * Toggle the visibility of the container and remembers the choice.
     */
    ContainerPanel.prototype.toggle = function () {
        var isVisible = this.isVisible();
        if (isVisible) {
            this.hide();
        } else {
            this.show();
        }
    };

    /**
     * Retrieve the position of the panel in the container.
     * @private
     * @param {PanelItem} panel - A reference of the panel
     * @return {Number} The index
     */
    ContainerPanel.prototype._indexOfPanel = function (panel) {
        var i;
        for (i = 0; i < this._panels.length; i++) {
            if (this._panels[i].id === panel.id) {
                return i;
            }
        }
        console.error("Unknown panel: id = " + panel.id);
        console.assert();
    };

    /**
     * Called when a panel is opened and remembers the tab as visitable.
     * @param {PanelItem} panel - A reference of the panel
     */
    ContainerPanel.prototype.onPanelOpen = function (panel) {
        var index = this._indexOfPanel(panel);
        this._visitor.setVisitable(index, true);
    };

    /**
     * Called when a panel is showed and selects it.
     * @param {PanelItem} panel - A reference of the panel
     */
    ContainerPanel.prototype.onPanelShow = function (panel) {
        var index = this._indexOfPanel(panel);
        this._visitor.visit(index);
    };

    /**
     * Called when a panel is hidden and remembers the tab as non visitable.
     * If there aren't visitable tabs anymore it hides the container.
     * If the tab hidden was the one selected it shows the last visited one.
     * @private
     * @param {PanelItem} panel - A reference of the panel
     */
    ContainerPanel.prototype.onPanelHide = function (panel) {
        var index = this._indexOfPanel(panel);
        this._visitor.setVisitable(index, false);
        if (!this._visitor.hasVisitableDestinations()) {
            // The last tab visible was hidden: hide the container since now is empty.
            this.hide();
            return;
        }

        if (this._visitor.getIndex() === index) {
            // It was hidden the current tab: show the previous one.
            var prevIndex = this._visitor.getPreviousIndex();
            var panelItem = this._panels[prevIndex].panelItem;
            panelItem.show();
        }
    };


    /**
     * Called when an external widget has appeared and needs some of the space occupied
     *  by the mainview manager
     * @param {boolean} refreshHint true to refresh the editor, false if not
     */
    function recomputeLayout(refreshHint) {
        triggerUpdateLayout(refreshHint);
        updateResizeLimits();
    }

    // Register preferences
    prefs.definePreference(PREF_COLLAPSED, "boolean", false, {
        description: Strings.DESCRIPTION_LINTING_COLLAPSED
    })
        .on("change", function (e, data) {
            var show = prefs.get(PREF_COLLAPSED);
            if (show) {
                containerPanel.show();
            } else {
                containerPanel.hide();
            }
        });

    /* Attach to key parts of the overall UI, once created */
    AppInit.htmlReady(function () {
        $windowContent = $(".content");
        $editorHolder = $("#editor-holder");

        // Sidebar is a special case: it isn't a Panel, and is not created dynamically. Need to explicitly
        // listen for resize here.
        listenToResize($("#sidebar"));

        containerPanel = new ContainerPanel();
        var show = prefs.get(PREF_COLLAPSED);
        if (show) {
            containerPanel.show();
        } else {
            containerPanel.hide();
        }

        $("#toolbar-container-panel").click(function () {
            containerPanel.toggle();
        });
    });

    /* Unit test only: allow passing in mock DOM notes, e.g. for use with SpecRunnerUtils.createMockEditor() */
    function _setMockDOM($mockWindowContent, $mockEditorHolder) {
        $windowContent = $mockWindowContent;
        $editorHolder = $mockEditorHolder;
    }

    /* Add this as a capture handler so we're guaranteed to run it before the editor does its own
     * refresh on resize.
     */
    window.addEventListener("resize", handleWindowResize, true);


    EventDispatcher.makeEventDispatcher(exports);

    // Define public API
    exports.createBottomPanel               = createBottomPanel;
    exports.addPanel                        = addPanel;
    exports.recomputeLayout                 = recomputeLayout;
    exports.getAllPanelIDs                  = getAllPanelIDs;
    exports.getPanelForID                   = getPanelForID;
    exports._setMockDOM                     = _setMockDOM;
    exports.EVENT_WORKSPACE_UPDATE_LAYOUT   = EVENT_WORKSPACE_UPDATE_LAYOUT;
    exports.EVENT_WORKSPACE_PANEL_SHOWN     = EVENT_WORKSPACE_PANEL_SHOWN;
    exports.EVENT_WORKSPACE_PANEL_HIDDEN    = EVENT_WORKSPACE_PANEL_HIDDEN;
});
