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


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $, window */

/**
 * Manages the workingSet sort methods.
 */
define(function (require, exports, module) {
    "use strict";
    
    var Commands                = require("command/Commands"),
        CommandManager          = require("command/CommandManager"),
        DocumentManager         = require("document/DocumentManager"),
        PreferencesManager      = require("preferences/PreferencesManager"),
        FileUtils               = require("file/FileUtils"),
        AppInit                 = require("utils/AppInit"),
        Strings                 = require("strings");
    
    var defaultPrefs = {
        currentSort:   Commands.SORT_WORKINGSET_BY_ADDED,
        automaticSort: false
    };
    
    /**
     * @private
     * @type {Array.<Sort>}
     */
    var _sorts = [];
    
    /**
     * @private
     * @type {Sort}
     */
    var _currentSort = null;
    
    /**
     * @private
     * @type {boolean}
     */
    var _automaticSort = false;
    
    /**
     * @private
     * @type {boolean}
     * Used to know when to do the automatic sort for MRU order.
     */
    var _openedDocument = false;
    
    /**
     * Retrieves a Sort object by id
     * @param {(string|Command)} command A command ID or a command object.
     * @return {?Sort}
     */
    function get(command) {
        var commandID;
        if (!command) {
            console.error("Attempting to get a Sort method with a missing required parameter: command");
            return;
        }
        
        if (typeof command === "string") {
            commandID = command;
        } else {
            commandID = command.getID();
        }
        return _sorts[commandID];
    }
    
    /**
     * @return {boolean} Enabled state of Automatic Sort.
     */
    function getAutomatic() {
        return _automaticSort;
    }
    
    /**
     * @private
     * Removes the sort DocumentManager listeners.
     */
    function _removeListeners() {
        $(DocumentManager).off(".sort");
    }
    
    /**
     * Enables/Disables Automatic Sort depending on the value.
     * @param {boolean} enable True to enable, false to disable.
     */
    function setAutomatic(enable) {
        _automaticSort = enable;
        PreferencesManager.setViewState("automaticSort", _automaticSort);
        CommandManager.get(Commands.SORT_WORKINGSET_AUTO).setChecked(_automaticSort);
        
        if (enable) {
            _currentSort.sort();
        } else {
            _removeListeners();
        }
    }
    
    /**
     * @private
     * Adds the current sort DocumentManager listeners.
     */
    function _addListeners() {
        if (_automaticSort && _currentSort && _currentSort.getEvents()) {
            $(DocumentManager)
                .on(_currentSort.getEvents(), function () {
                    _currentSort.sort();
                })
                .on("workingSetDisableAutoSorting.sort", function () {
                    setAutomatic(false);
                });
        }
    }
    
    
    /**
     * @private
     * Sets the current sort method and checks it on the context menu.
     * @param {Sort} newSort
     */
    function _setCurrentSort(newSort) {
        var command;
        if (_currentSort !== newSort) {
            if (_currentSort !== null) {
                command = CommandManager.get(_currentSort.getCommandID());
                if (command) {
                    command.setChecked(false);
                }
            }
            command = CommandManager.get(newSort.getCommandID());
            if (command) {
                command.setChecked(true);
            }
            
            CommandManager.get(Commands.SORT_WORKINGSET_AUTO).setEnabled(!!newSort.getEvents());
            _currentSort = newSort;
            PreferencesManager.setViewState("currentSort", _currentSort.getCommandID());
        }
    }
    
    
    /**
     * @constructor
     * @private
     *
     * @param {string} commandID A valid command identifier.
     * @param {function(File, File): number} compareFn A valid sort
     *      function (see register for a longer explanation).
     * @param {string} events Space-separated DocumentManager possible events
     *      ending with ".sort".
     */
    function Sort(commandID, compareFn, events, automaticFn) {
        this._commandID = commandID;
        this._compareFn = compareFn;
        this._events    = events;
    }
    
    /** @return {string} The Command ID */
    Sort.prototype.getCommandID = function () {
        return this._commandID;
    };
    
    /** @return {function(File, File): number} The compare function */
    Sort.prototype.getCompareFn = function () {
        return this._compareFn;
    };
    
    /** @return {string} The DocumentManager events */
    Sort.prototype.getEvents = function () {
        return this._events;
    };
    
    /**
     * Performs the sort and makes it the current sort method.
     */
    Sort.prototype.execute = function () {
        _setCurrentSort(this);
        this.sort();
    };
    
    /**
     * Only performs the working set sort if this is the current sort.
     */
    Sort.prototype.sort = function () {
        if (_currentSort === this) {
            _removeListeners();
            DocumentManager.sortWorkingSet(this._compareFn);
            _addListeners();
        }
    };
    
    
    /**
     * Registers a working set sort method.
     * @param {(string|Command)} command A command ID or a command object
     * @param {function(File, File): number} compareFn The function that
     *      will be used inside JavaScript's sort function. The return a value
     *      should be >0 (sort a to a lower index than b), =0 (leaves a and b
     *      unchanged with respect to each other) or <0 (sort b to a lower index
     *      than a) and must always returns the same value when given a specific
     *      pair of elements a and b as its two arguments. Documentation at:
     *      https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/sort
     * @param {?string} events One or more space-separated event types that
     *      DocumentManger uses. Each event passed will trigger the automatic
     *      sort. If no events are passed, the automatic sort will be disabled
     *      for that sort method.
     * @return {?Sort}
     */
    function register(command, compareFn, events) {
        var commandID = "";
        
        if (!command || !compareFn) {
            console.log("Attempting to register a Sort method with a missing required parameter: command or compare function");
            return;
        }
        if (typeof command === "string") {
            commandID = command;
        } else {
            commandID = command.getID();
        }
        
        if (_sorts[commandID]) {
            console.log("Attempting to register an already-registered Sort method: " + command);
            return;
        }
        
        // Adds ".sort" to the end of each event to make them specific for the automatic sort.
        if (events) {
            events = events.split(" ");
            events.forEach(function (event, index) {
                events[index] = events[index].trim() + ".sort";
            });
            events = events.join(" ");
        }
        
        var sort = new Sort(commandID, compareFn, events);
        _sorts[commandID] = sort;
        return sort;
    }
    
    
    /** Command Handlers */
    function _handleSortWorkingSetByAdded() {
        get(Commands.SORT_WORKINGSET_BY_ADDED).execute();
    }
    
    function _handleSortWorkingSetByName() {
        get(Commands.SORT_WORKINGSET_BY_NAME).execute();
    }
    
    function _handleSortWorkingSetByType() {
        get(Commands.SORT_WORKINGSET_BY_TYPE).execute();
    }
    
    function _handleAutomaticSort() {
        setAutomatic(!getAutomatic());
    }
    
    
    // Register Sort Methods
    register(
        Commands.SORT_WORKINGSET_BY_ADDED,
        function (file1, file2) {
            var index1 = DocumentManager.findInWorkingSetAddedOrder(file1.fullPath),
                index2 = DocumentManager.findInWorkingSetAddedOrder(file2.fullPath);
            
            return index1 - index2;
        },
        "workingSetAdd workingSetAddList"
    );
    register(
        Commands.SORT_WORKINGSET_BY_NAME,
        function (file1, file2) {
            return FileUtils.compareFilenames(file1.name, file2.name, false);
        },
        "workingSetAdd workingSetAddList"
    );
    register(
        Commands.SORT_WORKINGSET_BY_TYPE,
        function (file1, file2) {
            return FileUtils.compareFilenames(file1.name, file2.name, true);
        },
        "workingSetAdd workingSetAddList"
    );
    
    
    // Register Command Handlers
    CommandManager.register(Strings.CMD_SORT_WORKINGSET_BY_ADDED, Commands.SORT_WORKINGSET_BY_ADDED, _handleSortWorkingSetByAdded);
    CommandManager.register(Strings.CMD_SORT_WORKINGSET_BY_NAME,  Commands.SORT_WORKINGSET_BY_NAME,  _handleSortWorkingSetByName);
    CommandManager.register(Strings.CMD_SORT_WORKINGSET_BY_TYPE,  Commands.SORT_WORKINGSET_BY_TYPE,  _handleSortWorkingSetByType);
    CommandManager.register(Strings.CMD_SORT_WORKINGSET_AUTO,     Commands.SORT_WORKINGSET_AUTO,     _handleAutomaticSort);
    
    
    // Initialize default values for sorting preferences
    PreferencesManager.stateManager.definePreference("currentSort", "string", Commands.SORT_WORKINGSET_BY_ADDED);
    PreferencesManager.stateManager.definePreference("automaticSort", "boolean", false);
    
    PreferencesManager.convertPreferences(module, {"currentSort": "user", "automaticSort": "user"}, true);
    
    // Initialize items dependent on extensions/workingSet
    AppInit.appReady(function () {
        var curSort  = get(PreferencesManager.getViewState("currentSort")),
            autoSort = PreferencesManager.getViewState("automaticSort");
        
        if (curSort) {
            _setCurrentSort(curSort);
        }
        if (autoSort) {
            setAutomatic(true);
        }
        if (curSort && autoSort) {
            curSort.sort();
        }
    });
    
    
    // Define public API
    exports.register        = register;
    exports.get             = get;
    exports.getAutomatic    = getAutomatic;
    exports.setAutomatic    = setAutomatic;
});
