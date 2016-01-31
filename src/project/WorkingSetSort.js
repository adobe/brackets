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


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define */

/**
 * Manages the workingSetList sort methods.
 */
define(function (require, exports, module) {
    "use strict";

    var Commands                = require("command/Commands"),
        CommandManager          = require("command/CommandManager"),
        MainViewManager         = require("view/MainViewManager"),
        PreferencesManager      = require("preferences/PreferencesManager"),
        FileUtils               = require("file/FileUtils"),
        AppInit                 = require("utils/AppInit"),
        Strings                 = require("strings"),
        _                       = require("thirdparty/lodash");

    /**
     * List of sorting method objects
     * @private
     * @type {Array.<Sort>}
     */
    var _sorts = [];

    /**
     * Denotes the current sort method object
     * @private
     * @type {Sort}
     */
    var _currentSort = null;

    /**
     * Denotes if automatic sorting is enabled or not
     * @private
     * @type {boolean}
     */
    var _automaticSort = false;


    /**
     * Maps Legacy sort method names  to new sort method names
     * @private
     * @type {object.<string: string>} oldname: newname
     */
    var _sortPrefConversionMap = {
        "view.sortWorkingSetByAdded" : "cmd.sortWorkingSetByAdded",
        "view.sortWorkingSetByName"  : "cmd.sortWorkingSetByName",
        "view.sortWorkingSetByType"  : "cmd.sortWorkingSetByType"
    };

    /**
     * Events which the sort command will listen for to trigger a sort
     * @constant {string}
     * @private
     */
    var _SORT_EVENT_NAMES = "workingSetAdd workingSetAddList";

    /**
     * Preference name
     * @constant {string}
     * @private
     */
    var _WORKING_SET_SORT_PREF = "workingSetSortMethod";

    /**
     * Legacy preference name
     * @constant {string}
     * @private
     */
    var _LEGACY_SORT_PREF = "currentSort";

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
     * Converts the old brackets working set sort preference into the modern paneview sort preference
     * @private
     * @param {!string} sortMethod - sort preference to convert
     * @return {?string} new sort preference string or undefined if an sortMethod is not found
     */
    function _convertSortPref(sortMethod) {
        if (!sortMethod) {
            return null;
        }

        if (_sortPrefConversionMap.hasOwnProperty(sortMethod)) {
            sortMethod = _sortPrefConversionMap[sortMethod];
            PreferencesManager.setViewState(_WORKING_SET_SORT_PREF, sortMethod);
        } else {
            sortMethod = null;
        }

        return sortMethod;
    }

    /**
     * @return {boolean} Enabled state of Automatic Sort.
     */
    function getAutomatic() {
        return _automaticSort;
    }

    /**
     * Removes the sort listeners.
     * @private
     */
    function _removeListeners() {
        MainViewManager.off(".sort");
    }

    /**
     * Enables/Disables Automatic Sort depending on the value.
     * @param {boolean} enable True to enable, false to disable.
     */
    function setAutomatic(enable) {
        _automaticSort = enable;
        PreferencesManager.setViewState("automaticSort", _automaticSort);
        CommandManager.get(Commands.CMD_WORKING_SORT_TOGGLE_AUTO).setChecked(_automaticSort);
        _currentSort.setChecked(_automaticSort);

        if (_automaticSort) {
            _currentSort.sort();
        } else {
            _removeListeners();
        }
    }

    /**
     * Adds the current sort MainViewManager listeners.
     * @private
     */
    function _addListeners() {
        if (_automaticSort && _currentSort && _currentSort.getEvents()) {
            MainViewManager
                .on(_currentSort.getEvents(), function () {
                    _currentSort.sort();
                })
                .on("_workingSetDisableAutoSort.sort", function () {
                    setAutomatic(false);
                });
        }
    }


    /**
     * Sets the current sort method and checks it on the context menu.
     * @private
     * @param {Sort} newSort
     */
    function _setCurrentSort(newSort) {
        if (_currentSort !== newSort) {
            if (_currentSort !== null) {
                _currentSort.setChecked(false);
            }
            if (_automaticSort) {
                newSort.setChecked(true);
            }

            CommandManager.get(Commands.CMD_WORKING_SORT_TOGGLE_AUTO).setEnabled(!!newSort.getEvents());
            PreferencesManager.setViewState(_WORKING_SET_SORT_PREF, newSort.getCommandID());
            _currentSort = newSort;
        }
    }


    /**
     * @constructor
     * @param {string} commandID A valid command identifier.
     * @param {function(File, File): number} compareFn A valid sort
     *      function (see register for a longer explanation).
     * @param {string} events Space-separated WorkingSetSort possible events
     *      ending with ".sort".
     */
    function Sort(commandID, compareFn, events, automaticFn) {
        this._commandID = commandID;
        this._compareFn = compareFn;
        this._events    = events;
    }

    /**
     * The Command ID
     * @return {string}
     */
    Sort.prototype.getCommandID = function () {
        return this._commandID;
    };

    /**
     * The compare function
     * @return {function(File, File): number}
     */
    Sort.prototype.getCompareFn = function () {
        return this._compareFn;
    };

    /**
     * Gets the event that this sort object is listening to
     * @return {string}
     */
    Sort.prototype.getEvents = function () {
        return this._events;
    };

    /**
     * Checks/Unchecks the command which will show a check in the menu
     * @param {boolean} value
     */
    Sort.prototype.setChecked = function (value) {
        var command = CommandManager.get(this._commandID);
        if (command) {
            command.setChecked(value);
        }
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
            MainViewManager._sortWorkingSet(MainViewManager.ALL_PANES, this._compareFn);
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


    /**
     * Command Handler for CMD_WORKING_SORT_TOGGLE_AUTO
     * @private
     */
    function _handleToggleAutoSort() {
        setAutomatic(!getAutomatic());
    }

    /**
     * Command Handler for CMD_WORKINGSET_SORT_BY_*
     * @private
     * @param {!string} commandId identifies the sort method to use
     */
    function _handleSort(commandId) {
        get(commandId).execute();
    }

    /**
     * Register Sort Methods
     */
    register(
        Commands.CMD_WORKINGSET_SORT_BY_ADDED,
        function (paneId, file1, file2) {
            var index1 = MainViewManager.findInWorkingSetByAddedOrder(paneId, file1.fullPath),
                index2 = MainViewManager.findInWorkingSetByAddedOrder(paneId, file2.fullPath);

            return index1 - index2;
        },
        _SORT_EVENT_NAMES
    );
    register(
        Commands.CMD_WORKINGSET_SORT_BY_NAME,
        function (paneId, file1, file2) {
            return FileUtils.compareFilenames(file1.name, file2.name, false);
        },
        _SORT_EVENT_NAMES
    );
    register(
        Commands.CMD_WORKINGSET_SORT_BY_TYPE,
        function (paneId, file1, file2) {
            return FileUtils.compareFilenames(file1.name, file2.name, true);
        },
        _SORT_EVENT_NAMES
    );


    /**
     * Register Command Handlers
     */
    CommandManager.register(Strings.CMD_WORKINGSET_SORT_BY_ADDED, Commands.CMD_WORKINGSET_SORT_BY_ADDED, _.partial(_handleSort, Commands.CMD_WORKINGSET_SORT_BY_ADDED));
    CommandManager.register(Strings.CMD_WORKINGSET_SORT_BY_NAME,  Commands.CMD_WORKINGSET_SORT_BY_NAME,  _.partial(_handleSort, Commands.CMD_WORKINGSET_SORT_BY_NAME));
    CommandManager.register(Strings.CMD_WORKINGSET_SORT_BY_TYPE,  Commands.CMD_WORKINGSET_SORT_BY_TYPE,  _.partial(_handleSort, Commands.CMD_WORKINGSET_SORT_BY_TYPE));
    CommandManager.register(Strings.CMD_WORKING_SORT_TOGGLE_AUTO,   Commands.CMD_WORKING_SORT_TOGGLE_AUTO,    _handleToggleAutoSort);


    /**
     * Initialize default values for sorting preferences
     */
    PreferencesManager.stateManager.definePreference("automaticSort", "boolean", false);
    PreferencesManager.convertPreferences(module, {_LEGACY_SORT_PREF: "user", "automaticSort": "user"}, true);

    /**
     * Define a default sort method that's empty so that we
     *   just convert and use the legacy sort method
     */
    PreferencesManager.stateManager.definePreference(_WORKING_SET_SORT_PREF, "string", "");

    /*
     * initializes global sort method from preference settings or the default
     */
    function initSortMethod() {
        var sortMethod = PreferencesManager.getViewState(_WORKING_SET_SORT_PREF);

        if (!sortMethod) {
            sortMethod = _convertSortPref(PreferencesManager.getViewState(_LEGACY_SORT_PREF));
        }

        if (!sortMethod) {
            sortMethod = Commands.CMD_WORKINGSET_SORT_BY_ADDED;
        }
        return sortMethod;
    }

    /**
     * Initialize items dependent on extensions/workingSetList
     */
    AppInit.appReady(function () {
        var sortMethod = initSortMethod(),
            curSort    = get(sortMethod),
            autoSort = PreferencesManager.getViewState("automaticSort");

        if (curSort) {
            _setCurrentSort(curSort);
        }
        if (autoSort) {
            setAutomatic(autoSort);
        }
        if (curSort && autoSort) {
            curSort.sort();
        }
    });

    // Public API
    exports.register        = register;
    exports.get             = get;
    exports.getAutomatic    = getAutomatic;
    exports.setAutomatic    = setAutomatic;
});
