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
        AppInit                 = require("utils/AppInit"),
        Strings                 = require("strings");
        
    var PREFERENCES_CLIENT_ID = "com.adobe.brackets.WorkingSetSort",
        defaultPrefs = {
            currentSort:   Commands.SORT_WORKINGSET_BY_ADDED,
            automaticSort: false
        };
    
    /**
     * @private
     * @type {PreferenceStorage}
     */
    var _prefs = {};
    
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
     * @param {string} commandID
     * @return {Sort}
     */
    function get(commandID) {
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
     * Sets the value of Automatic Sort and updates the menu item.
     * @param {boolean} value
     */
    function _setAutomatic(value) {
        _automaticSort = value;
        _prefs.setValue("automaticSort", _automaticSort);
        CommandManager.get(Commands.SORT_WORKINGSET_AUTO).setChecked(_automaticSort);
    }
    
    /**
     * @private
     * Removes current sort DocumentManager listeners.
     */
    function _removeListeners() {
        if (_currentSort && _currentSort.getEvents()) {
            $(DocumentManager).off(".sort");
        }
    }
    
    /**
     * @private
     * Disables Automatic Sort.
     */
    function _disableAutomatic() {
        _setAutomatic(false);
        _removeListeners();
    }
    
    /**
     * @private
     * Adds current sort DocumentManager listeners.
     */
    function _addListeners() {
        if (_automaticSort && _currentSort && _currentSort.getEvents()) {
            $(DocumentManager)
                .on(_currentSort.getEvents(), function (event) {
                    _currentSort.callAutomaticFn(event);
                })
                .on("workingSetReorder.sort", function () {
                    _disableAutomatic();
                });
        }
    }
    
    /**
     * @private
     * Enables Automatic Sort.
     */
    function _enableAutomatic() {
        _setAutomatic(true);
        _addListeners();
    }
    
    /**
     * Enables/Disables Automatic Sort depending on the value.
     * @param {boolean} value
     */
    function setAutomatic(value) {
        if (value) {
            _enableAutomatic();
        } else {
            _disableAutomatic();
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
            _prefs.setValue("currentSort", _currentSort.getCommandID());
        }
    }
    
    
    /**
     * @constructor
     * @private
     *
     * @param {!string} commandID - valid command identifier.
     * @param {!function(FileEntry, FileEntry)} compareFn - a valid sort function (see register for a longer explanation).
     * @param {!string} events - space-separated DocumentManager possible events ending on ".sort".
     * @param {!function($.Event)} automaticFn - the function that will be called when an automatic sort event is triggered.
     */
    function Sort(commandID, compareFn, events, automaticFn) {
        this._commandID   = commandID;
        this._compareFn   = compareFn;
        this._events      = events;
        this._automaticFn = automaticFn;
    }
    
    /** @return {CommandID} */
    Sort.prototype.getCommandID = function () {
        return this._commandID;
    };
    
    /** @return {CompareFn} */
    Sort.prototype.getCompareFn = function () {
        return this._compareFn;
    };
    
    /** @return {Events} */
    Sort.prototype.getEvents = function () {
        return this._events;
    };
    
    /** Calls automaticFn */
    Sort.prototype.callAutomaticFn = function (event) {
        return this._automaticFn(event);
    };
    
    /**
     * Performs the sort and makes it the current sort method
     */
    Sort.prototype.execute = function () {
        _removeListeners();
        _setCurrentSort(this);
        _addListeners();
        this.sort();
    };
    
    /**
     * Only performs the working set sort if this is the current sort
     */
    Sort.prototype.sort = function () {
        if (_currentSort === this) {
            DocumentManager.sortWorkingSet(this._compareFn);
        }
    };
    
    
    /**
     * Registers a working set sort method.
     * @param {!string} commandID - valid command identifier used for the sort method.
     *      Core commands in Brackets use a simple command title as an id, for example "open.file".
     *      Extensions should use the following format: "author.myextension.mycommandname". 
     *      For example, "lschmitt.csswizard.format.css".
     * @param {!function(FileEntry, FileEntry)} compareFn - the function that will be used inside JavaScript's
     *      sort function. The return a value should be >0 (sort a to a lower index than b), =0 (leaves a and b
     *      unchanged with respect to each other) or <0 (sort b to a lower index than a) and must always returns
     *      the same value when given a specific pair of elements a and b as its two arguments.
     *      Documentation: https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/sort
     * @param {?string} events - one or more space-separated event types that DocumentManger uses.
     *      Each event passed will trigger the automatic sort. If no events are passed, the automatic
     *      sort will be disabled for that sort method.
     * @param {?function($.Event)} automaticFn - the function that will be called when an automatic sort
     *      event is triggered. If no function is passed the automatic sort will just call the sort function.
     * @return {?Sort}
     */
    function register(commandID, compareFn, events, automaticFn) {
        if (_sorts[commandID]) {
            console.log("Attempting to register an already-registered sort: " + commandID);
            return;
        }
        if (!commandID || !compareFn) {
            console.log("Attempting to register a sort with a missing id, or compare function: " + commandID);
            return;
        }
        
        // Adds ".sort" to the end of each event to make them specific for the automatic sort
        if (events) {
            events = events.split(" ");
            events.forEach(function (event, index) {
                events[index] = events[index].trim() + ".sort";
            });
            events = events.join(" ");
        }
        
        automaticFn = automaticFn || function (event) {
            _currentSort.sort();
        };
        
        var sort = new Sort(commandID, compareFn, events, automaticFn);
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
            return file1.name.toLocaleLowerCase().localeCompare(file2.name.toLocaleLowerCase());
        },
        "workingSetAdd workingSetAddList"
    );
    register(
        Commands.SORT_WORKINGSET_BY_TYPE,
        function (file1, file2) {
            var ext1 = file1.name.split('.').pop(),
                ext2 = file2.name.split('.').pop(),
                cmp  = ext1.localeCompare(ext2);
            
            if (cmp === 0) {
                return file1.name.toLocaleLowerCase().localeCompare(file2.name.toLocaleLowerCase());
            } else {
                return cmp;
            }
        },
        "workingSetAdd workingSetAddList"
    );
    
    
    // Register Command Handlers
    CommandManager.register(Strings.CMD_SORT_WORKINGSET_BY_ADDED, Commands.SORT_WORKINGSET_BY_ADDED, _handleSortWorkingSetByAdded);
    CommandManager.register(Strings.CMD_SORT_WORKINGSET_BY_NAME,  Commands.SORT_WORKINGSET_BY_NAME,  _handleSortWorkingSetByName);
    CommandManager.register(Strings.CMD_SORT_WORKINGSET_BY_TYPE,  Commands.SORT_WORKINGSET_BY_TYPE,  _handleSortWorkingSetByType);
    CommandManager.register(Strings.CMD_SORT_WORKINGSET_AUTO,     Commands.SORT_WORKINGSET_AUTO,     _handleAutomaticSort);
    
    
    // Initialize PreferenceStorage
    _prefs = PreferencesManager.getPreferenceStorage(PREFERENCES_CLIENT_ID, defaultPrefs);
    
    
    // Initialize items dependent on extensions/workingSet
    AppInit.appReady(function () {
        var curSort  = get(_prefs.getValue("currentSort")),
            autoSort = _prefs.getValue("automaticSort");
        
        if (curSort) {
            _setCurrentSort(curSort);
        }
        if (autoSort) {
            _enableAutomatic();
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
