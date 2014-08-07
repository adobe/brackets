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
/*global define, $, brackets, FileError, window */

/**
 * ProjectManager is the model for the set of currently open project. It is responsible for
 * creating and updating the project tree when projects are opened and when changes occur to
 * the file tree.
 *
 * This module dispatches these events:
 *    - beforeProjectClose -- before `_projectRoot` changes, but working set files still open
 *    - projectClose       -- *just* before `_projectRoot` changes; working set already cleared
 *      & project root unwatched
 *    - beforeAppClose     -- before Brackets quits entirely
 *    - projectOpen        -- after `_projectRoot` changes and the tree is re-rendered
 *    - projectRefresh     -- when project tree is re-rendered for a reason other than
 *      a project being opened (e.g. from the Refresh command)
 *
 * These are jQuery events, so to listen for them you do something like this:
 *    $(ProjectManager).on("eventname", handler);
 */
define(function (require, exports, module) {
    "use strict";

    require("utils/Global");
    
    // Load dependent non-module scripts
    require("thirdparty/jstree_pre1.0_fix_1/jquery.jstree");

    var _ = require("thirdparty/lodash");

    // Load dependent modules
    var AppInit             = require("utils/AppInit"),
        PreferencesDialogs  = require("preferences/PreferencesDialogs"),
        PreferencesManager  = require("preferences/PreferencesManager"),
        DocumentManager     = require("document/DocumentManager"),
        InMemoryFile        = require("document/InMemoryFile"),
        CommandManager      = require("command/CommandManager"),
        Commands            = require("command/Commands"),
        Dialogs             = require("widgets/Dialogs"),
        DefaultDialogs      = require("widgets/DefaultDialogs"),
        DeprecationWarning  = require("utils/DeprecationWarning"),
        LanguageManager     = require("language/LanguageManager"),
        Menus               = require("command/Menus"),
        StringUtils         = require("utils/StringUtils"),
        Strings             = require("strings"),
        FileSystem          = require("filesystem/FileSystem"),
        FileViewController  = require("project/FileViewController"),
        PerfUtils           = require("utils/PerfUtils"),
        ViewUtils           = require("utils/ViewUtils"),
        FileUtils           = require("file/FileUtils"),
        FileSystemError     = require("filesystem/FileSystemError"),
        Urls                = require("i18n!nls/urls"),
        KeyEvent            = require("utils/KeyEvent"),
        Async               = require("utils/Async"),
        FileSyncManager     = require("project/FileSyncManager"),
        EditorManager       = require("editor/EditorManager");
    
    
    // Define the preference to decide how to sort the Project Tree files
    PreferencesManager.definePreference("sortDirectoriesFirst", "boolean", brackets.platform !== "mac");
    
    
    /**
     * @private
     * Forward declaration for the _fileSystemChange and _fileSystemRename functions to make JSLint happy.
     */
    var _fileSystemChange,
        _fileSystemRename;

    /**
     * @private
     * File tree sorting for mac-specific sorting behavior
     */
    var _sortPrefixDir,
        _sortPrefixFile;
    
    /**
     * @private
     * File and folder names which are not displayed or searched
     * TODO: We should add the rest of the file names that TAR excludes:
     *    http://www.gnu.org/software/tar/manual/html_section/exclude.html
     * TODO: This should be user configurable
     *    https://github.com/adobe/brackets/issues/6781
     * @type {RegExp}
     */
    var _exclusionListRegEx = /\.pyc$|^\.git$|^\.gitmodules$|^\.svn$|^\.DS_Store$|^Thumbs\.db$|^\.hg$|^CVS$|^\.hgtags$|^\.idea$|^\.c9revisions$|^\.sass-cache$|^\.SyncArchive$|^\.SyncID$|^\.SyncIgnore$|\~$/;

    /**
     * @private
     * Filename to use for project settings files.
     * @type {string}
     */
    var SETTINGS_FILENAME = "." + PreferencesManager.SETTINGS_FILENAME;

    /**
     * @const
     * @private
     * Error context to show the correct error message
     * @type {int}
     */
    var ERR_TYPE_CREATE = 1,
        ERR_TYPE_CREATE_EXISTS = 2,
        ERR_TYPE_RENAME = 3,
        ERR_TYPE_DELETE = 4,
        ERR_TYPE_LOADING_PROJECT = 5,
        ERR_TYPE_LOADING_PROJECT_NATIVE = 6,
        ERR_TYPE_MAX_FILES = 7,
        ERR_TYPE_OPEN_DIALOG = 8,
        ERR_TYPE_INVALID_FILENAME = 9;

    /**
     * @private
     * Reference to the tree control container div. Initialized by
     * htmlReady handler
     * @type {jQueryObject}
     */
    var $projectTreeContainer;
    
    /**
     * @private
     * Reference to the tree control
     * @type {jQueryObject}
     */
    var _projectTree = null;
        
    /**
     * @private
     * Reference to previous selected jstree leaf node when ProjectManager had
     * selection focus from FileViewController.
     * @type {DOMElement}
     */
    var _lastSelected = null;
    
    /**
     * @private
     * Internal flag to suppress firing of selectionChanged event.
     * @type {boolean}
     */
    var _suppressSelectionChange = false;
    
    /**
     * @private
     * Reference to the tree control UL element
     * @type {DOMElement}
     */
    var $projectTreeList;
    
    /**
     * @private
     * @see getProjectRoot()
     * @type {Directory}
     */
    var _projectRoot = null;

    /**
     * @private
     * Encoded URL
     * @see getBaseUrl(), setBaseUrl()
     */
    var _projectBaseUrl = "";
    
    /**
     * @private
     * Used to initialize jstree state
     */
    var _projectInitialLoad = null;
    
    /**
     * @private
     * A string containing all invalid characters for a specific platform.
     * This will be used to construct a regular expression for checking invalid filenames.
     * When a filename with one of these invalid characters are detected, then it is 
     * also used to substitute the place holder of the error message.
     */
    var _invalidChars;

    /**
     * @private
     * RegEx to validate if a filename is not allowed even if the system allows it.
     * This is done to prevent cross-platform issues.
     */
            
    var _illegalFilenamesRegEx = /^(\.+|com[1-9]|lpt[1-9]|nul|con|prn|aux|)$|\.+$/i;
    
    var suppressToggleOpen = false;
    
    /**
     * @private
     * @type {?jQuery.Promise.<Array<File>>}
     * A promise that is resolved with an array of all project files. Used by 
     * ProjectManager.getAllFiles().
     */
    var _allFilesCachePromise = null;
    
    /**
     * @private
     * @type {boolean}
     * Current sort order for the tree, true if directories are first. This is
     * initialized in _generateSortPrefixes.
     */
    var _dirFirst;
    
    /**
     * @private
     * @type {Number}
     * Tracks the timeoutID for mouseup events.
     */
    var _mouseupTimeoutId = null;
    
    /**
     * @private
     * Generates the prefixes used for sorting the files in the project tree
     * @return {boolean} true if the sort prefixes have changed
     */
    function _generateSortPrefixes() {
        var previousDirFirst  = _dirFirst;
        _dirFirst             = PreferencesManager.get("sortDirectoriesFirst");
        _sortPrefixDir        = _dirFirst ? "a" : "";
        _sortPrefixFile       = _dirFirst ? "b" : "";
        
        return previousDirFirst !== _dirFirst;
    }
    
    /**
     * @private
     */
    function _hasFileSelectionFocus() {
        return FileViewController.getFileSelectionFocus() === FileViewController.PROJECT_MANAGER;
    }
    
    /**
     * @private
     */
    function _redraw(selectionChanged, reveal) {
        reveal = (reveal === undefined) ? true : reveal;
        
        // redraw selection
        if ($projectTreeList) {
            if (selectionChanged && !_suppressSelectionChange) {
                $projectTreeList.triggerHandler("selectionChanged", reveal);
            }

            // reposition the selection triangle
            $projectTreeContainer.triggerHandler("selectionRedraw");
            
            // in-lieu of resize events, manually trigger contentChanged for every
            // FileViewController focus change. This event triggers scroll shadows
            // on the jstree to update. documentSelectionFocusChange fires when
            // a new file is added and removed (causing a new selection) from the working set
            _projectTree.triggerHandler("contentChanged");
        }
    }
    
    /**
     * Returns the File or Directory corresponding to the item selected in the file tree, or null
     * if no item is selected in the tree (though the working set may still have a selection; use
     * getSelectedItem() to get the selection regardless of whether it's in the tree or working set).
     * @return {?(File|Directory)}
     */
    function _getTreeSelectedItem() {
        var selected = _projectTree.jstree("get_selected");
        if (selected) {
            return selected.data("entry");
        }
        return null;
    }
    
    /**
     * Returns the File or Directory corresponding to the item selected in the sidebar panel, whether in
     * the file tree OR in the working set; or null if no item is selected anywhere in the sidebar.
     * May NOT be identical to the current Document - a folder may be selected in the sidebar, or the sidebar may not
     * have the current document visible in the tree & working set.
     * @return {?(File|Directory)}
     */
    function getSelectedItem() {
        // Prefer file tree selection, else use working set selection
        var selectedEntry = _getTreeSelectedItem();
        if (!selectedEntry) {
            var doc = DocumentManager.getCurrentDocument();
            selectedEntry = (doc && doc.file);
        }
        return selectedEntry;
    }

    function _fileViewFocusChange() {
        _redraw(true);
    }
    
    function _documentSelectionFocusChange() {
        var curFile = EditorManager.getCurrentlyViewedPath();
        if (curFile && _hasFileSelectionFocus()) {
            var nodeFound = $("#project-files-container li").is(function (index) {
                var $treeNode = $(this),
                    entry = $treeNode.data("entry");
                if (entry && entry.fullPath === curFile) {
                    if (!_projectTree.jstree("is_selected", $treeNode)) {
                        if ($treeNode.parents(".jstree-closed").length) {
                            //don't auto-expand tree to show file - but remember it if parent is manually expanded later
                            _projectTree.jstree("deselect_all");
                            _lastSelected = $treeNode;
                        } else {
                            //we don't want to trigger another selection change event, so manually deselect
                            //and select without sending out notifications
                            _projectTree.jstree("deselect_all");
                            _projectTree.jstree("select_node", $treeNode, false);  // sets _lastSelected
                        }
                    }
                    return true;
                }
                return false;
            });
            
            // file is outside project subtree, or in a folder that's never been expanded yet
            if (!nodeFound) {
                _projectTree.jstree("deselect_all");
                _lastSelected = null;
            }
        } else if (_projectTree !== null) {
            _projectTree.jstree("deselect_all");
            _lastSelected = null;
        }
        
        _redraw(true);
    }

    /**
     * Returns the root folder of the currently loaded project, or null if no project is open (during
     * startup, or running outside of app shell).
     * @return {Directory}
     */
    function getProjectRoot() {
        return _projectRoot;
    }

    /**
     * Returns the encoded Base URL of the currently loaded project, or empty string if no project
     * is open (during startup, or running outside of app shell).
     * @return {String}
     */
    function getBaseUrl() {
        return _projectBaseUrl;
    }

    /**
     * Sets the encoded Base URL of the currently loaded project.
     * @param {String}
     */
    function setBaseUrl(projectBaseUrl) {
        var context = { location : { scope: "user",
                                     layer: "project",
                                     layerID: _projectRoot.fullPath} };
        
        _projectBaseUrl = projectBaseUrl;

        // Ensure trailing slash to be consistent with _projectRoot.fullPath
        // so they're interchangable (i.e. easy to convert back and forth)
        if (_projectBaseUrl.length > 0 && _projectBaseUrl[_projectBaseUrl.length - 1] !== "/") {
            _projectBaseUrl += "/";
        }

        PreferencesManager.setViewState("project.baseUrl", _projectBaseUrl, context);
    }
    
    /**
     * Returns true if absPath lies within the project, false otherwise.
     * Does not support paths containing ".."
     * @param {string|FileSystemEntry} absPathOrEntry
     * @return {boolean}
     */
    function isWithinProject(absPathOrEntry) {
        var absPath = absPathOrEntry.fullPath || absPathOrEntry;
        return (_projectRoot && absPath.indexOf(_projectRoot.fullPath) === 0);
    }
    /**
     * If absPath lies within the project, returns a project-relative path. Else returns absPath
     * unmodified.
     * Does not support paths containing ".."
     * @param {!string} absPath
     * @return {!string}
     */
    function makeProjectRelativeIfPossible(absPath) {
        if (isWithinProject(absPath)) {
            return absPath.slice(_projectRoot.fullPath.length);
        }
        return absPath;
    }

    /**
     * @private
     * Save ProjectManager project path and tree state.
     */
    function _savePreferences() {
        
        // save the current project
        PreferencesManager.setViewState("projectPath", _projectRoot.fullPath);

        // save jstree state
        var openNodes = [],
            projectPathLength = _projectRoot.fullPath.length,
            entry,
            fullPath,
            shortPath,
            depth,
            context = { location : { scope: "user",
                                     layer: "project",
                                     layerID: _projectRoot.fullPath } };

        // Query open nodes by class selector
        $(".jstree-open:visible").each(function (index) {
            entry = $(this).data("entry");

            if (entry.fullPath) {
                fullPath = entry.fullPath;

                // Truncate project path prefix (including its last slash) AND remove trailing slash suffix
                // So "/foo/bar/projroot/abc/xyz/" -> "abc/xyz"
                shortPath = fullPath.slice(projectPathLength, -1);

                // Determine depth of the node by counting path separators.
                // Children at the root have depth of zero
                depth = shortPath.split("/").length - 1;

                // Map tree depth to list of open nodes
                if (openNodes[depth] === undefined) {
                    openNodes[depth] = [];
                }

                openNodes[depth].push(fullPath);
            }
        });

        // Store the open nodes by their full path and persist to storage
        PreferencesManager.setViewState("project.treeState", openNodes, context);
    }
    
    /**
     * @private
     */
    function _forceSelection(current, target) {
        // select_node will force the target to be revealed. Instead,
        // keep the scroller position stable.
        var savedScrollTop = $projectTreeContainer.get(0).scrollTop;
        
        // suppress selectionChanged event from firing by jstree select_node
        _suppressSelectionChange = true;
        if (current) {
            _projectTree.jstree("deselect_node", current);
        }
        _projectTree.jstree("select_node", target, false);
        _suppressSelectionChange = false;
        
        $projectTreeContainer.get(0).scrollTop = savedScrollTop;
        
        _redraw(true, false);
    }

    /**
     * Returns false when the event occured without any input present in the li closest to the DOM object
     *
     * @param {event} event to check
     * @return boolean true if an input field is present
     */
    function _isInRename(element) {
        return ($(element).closest("li").find("input").length > 0);
    }
        
    /**
     * @private
     * Reopens a set of nodes in the tree by ID.
     * @param {Array.<Array.<string>>} nodesByDepth An array of arrays of node ids to reopen. The ids within
     *     each sub-array are reopened in parallel, and the sub-arrays are reopened in order, so they should
     *     be sorted by depth within the tree.
     * @param {$.Deferred} resultDeferred A Deferred that will be resolved when all nodes have been fully
     *     reopened.
     */
    function _reopenNodes(nodesByDepth, resultDeferred) {
        if (nodesByDepth.length === 0) {
            // All paths are opened and fully rendered.
            resultDeferred.resolve();
        } else {
            var toOpenPaths = nodesByDepth.shift(),
                toOpenIds   = [],
                node        = null;

            // use path to lookup ID
            toOpenPaths.forEach(function (value, index) {
                node = _projectInitialLoad.fullPathToIdMap[value];
                
                if (node) {
                    toOpenIds.push(node);
                }
            });
            
            Async.doInParallel(
                toOpenIds,
                function (id) {
                    var result = new $.Deferred();
                    _projectTree.jstree("open_node", "#" + id, function () {
                        result.resolve();
                    }, true);
                    return result.promise();
                },
                false
            ).always(function () {
                _reopenNodes(nodesByDepth, resultDeferred);
            });
        }
    }

    /**
     * A memoized comparator of DOM nodes for use with jsTree
     * @private
     * @param {Node} First DOM node
     * @param {Node} Second DOM node
     * @return {number} Comparator value
     */
    var _projectTreeSortComparator = _.memoize(function (a, b) {
        var a1 = $(a).data("compareString"),
            b1 = $(b).data("compareString");
        
        return FileUtils.compareFilenames(a1, b1, false);
    }, function (a, b) {
        return $(a).data("compareString") + ":" + $(b).data("compareString");
    });

    /**
     * @private
     * Given an input to jsTree's json_data.data setting, display the data in the file tree UI
     * (replacing any existing file tree that was previously displayed). This input could be
     * raw JSON data, or it could be a dataprovider function. See jsTree docs for details:
     * http://www.jstree.com/documentation/json_data
     */
    function _renderTree(treeDataProvider) {
        var result = new $.Deferred();

        // For #1542, make sure the tree is scrolled to the top before refreshing.
        // If we try to do this later (e.g. after the tree has been refreshed), it
        // doesn't seem to work properly.
        $projectTreeContainer.scrollTop(0);
        
        // Instantiate tree widget
        // (jsTree is smart enough to replace the old tree if there's already one there)
        $projectTreeContainer.hide()
            .addClass("no-focus");
        _projectTree = $projectTreeContainer
            .jstree({
                plugins : ["ui", "themes", "json_data", "crrm", "sort"],
                ui : { select_limit: 1, select_multiple_modifier: "", select_range_modifier: "" },
                json_data : { data: treeDataProvider, correct_state: false },
                core : { html_titles: true, animation: 0, strings : { loading : Strings.PROJECT_LOADING, new_node : "New node" } },
                themes : { theme: "brackets", url: "styles/jsTreeTheme.css", dots: false, icons: false },
                    //(note: our actual jsTree theme CSS lives in brackets.less; we specify an empty .css
                    // file because jsTree insists on loading one itself)
                sort : _projectTreeSortComparator
            }).bind(
                "before.jstree",
                function (event, data) {
                    if (data.func === "toggle_node") {
                        // jstree will automaticaly select parent node when the parent is closed
                        // and any descendant is selected. Prevent the select_node handler from
                        // immediately toggling open again in this case.
                        suppressToggleOpen = _projectTree.jstree("is_open", data.args[0]);
                    }
                }
            ).bind(
                "select_node.jstree",
                function (event, data) {
                    var entry = data.rslt.obj.data("entry");
                    if (entry) {
                        if (entry.isFile) {
                            var openResult = FileViewController.openAndSelectDocument(entry.fullPath, FileViewController.PROJECT_MANAGER);
                        
                            openResult.done(function () {
                                // update when tree display state changes
                                _redraw(true);
                                _lastSelected = data.rslt.obj;
                            }).fail(function () {
                                if (_lastSelected) {
                                    // revert this new selection and restore previous selection
                                    _forceSelection(data.rslt.obj, _lastSelected);
                                } else {
                                    _projectTree.jstree("deselect_all");
                                    _lastSelected = null;
                                }
                            });
                        } else {
                            FileViewController.setFileViewFocus(FileViewController.PROJECT_MANAGER);
                            // show selection marker on folders
                            _redraw(true);
                            
                            // toggle folder open/closed
                            // suppress if this selection was triggered by clicking the disclousre triangle
                            if (!suppressToggleOpen) {
                                _projectTree.jstree("toggle_node", data.rslt.obj);
                            }
                        }
                    }
                    suppressToggleOpen = false;
                }
            ).bind(
                "reopen.jstree",
                function (event, data) {
                    if (_projectInitialLoad.previous) {
                        // Start reopening nodes that were previously open, starting
                        // with the first recorded depth level. As each level completes,
                        // it will trigger the next level to finish.
                        _reopenNodes(_projectInitialLoad.previous, result);
                        _projectInitialLoad.previous = null;
                    }
                }
            ).bind(
                "scroll.jstree",
                function (e) {
                    // close all dropdowns on scroll
                    Menus.closeAll();
                }
            ).bind(
                "loaded.jstree open_node.jstree close_node.jstree",
                function (event, data) {
                    if (event.type === "open_node") {
                        // select the current document if it becomes visible when this folder is opened
                        var curDoc = DocumentManager.getCurrentDocument();
                        
                        if (_hasFileSelectionFocus() && curDoc && data) {
                            var entry = data.rslt.obj.data("entry");
                            
                            if (entry && curDoc.file.fullPath.indexOf(entry.fullPath) === 0) {
                                _forceSelection(data.rslt.obj, _lastSelected);
                            } else {
                                _redraw(true, false);
                            }
                        }
                    } else if (event.type === "close_node") {
                        // always update selection marker position when collapsing a node
                        _redraw(true, false);
                    } else {
                        _redraw(false);
                    }
                    
                    _savePreferences();
                }
            ).bind(
                "mousedown.jstree",
                function (event) {
                    // select tree node on right-click
                    if (event.which === 3 || (event.ctrlKey && event.which === 1 && brackets.platform === "mac")) {
                        var treenode = $(event.target).closest("li");
                        if (treenode) {
                            var saveSuppressToggleOpen = suppressToggleOpen;
                            
                            // don't toggle open folders (just select)
                            suppressToggleOpen = true;
                            _projectTree.jstree("deselect_all");
                            _projectTree.jstree("select_node", treenode, false);
                            suppressToggleOpen = saveSuppressToggleOpen;
                        }
                    }
                }
            ).bind("mouseup.jstree", function (event) {
                if (event.button !== 0) { // 0 = Left mouse button
                    return;
                }

                var $treenode = $(event.target).closest("li"),
                    entry = $treenode.data("entry");

                // If we are already in a rename, don't re-invoke it, just cancel it.
                if (_isInRename($treenode)) {
                    return;
                }

                // Don't do the rename for folders, because clicking on a folder name collapses/expands it.
                if (entry && entry.isFile && $treenode.is($(_projectTree.jstree("get_selected")))) {
                    // wrap this in a setTimeout function so that we can check if it's a double click.
                    _mouseupTimeoutId = window.setTimeout(function () {
                        // if we get a double-click, _mouseupTimeoutId will have been set to null by the double-click handler before this runs.
                        if (_mouseupTimeoutId !== null) {
                            CommandManager.execute(Commands.FILE_RENAME);
                        }
                    }, 500);
                }
            });

        // jstree has a default event handler for dblclick that attempts to clear the
        // global window selection (presumably because it doesn't want text within the tree
        // to be selected). This ends up messing up CodeMirror, and we don't need this anyway
        // since we've turned off user selection of UI text globally. So we just unbind it,
        // and add our own double-click handler here.
        // Filed this bug against jstree at https://github.com/vakata/jstree/issues/163
        _projectTree.bind("init.jstree", function () {
            // install scroller shadows
            ViewUtils.addScrollerShadow(_projectTree.get(0));
            
            var findEventHandler = function (type, namespace, selector) {
                var events        = $._data(_projectTree[0], "events"),
                    eventsForType = events ? events[type] : null,
                    event         = eventsForType ? _.find(eventsForType, function (e) {
                        return e.namespace === namespace && e.selector === selector;
                    }) : null,
                    eventHandler  = event ? event.handler : null;
                if (!eventHandler) {
                    console.error(type + "." + namespace + " " + selector + " handler not found!");
                }
                return eventHandler;
            };
            var createCustomHandler = function (originalHandler) {
                return function (event) {
                    var $node = $(event.target).parent("li"),
                        methodName;
                    if (event.ctrlKey || event.metaKey) {
                        if (event.altKey) {
                            // collapse subtree
                            // note: expanding using open_all is a bad idea due to poor performance
                            methodName = $node.is(".jstree-open") ? "close_all" : "open_node";
                            _projectTree.jstree(methodName, $node);
                            return;
                        } else {
                            // toggle siblings
                            methodName = $node.is(".jstree-open") ? "close_node" : "open_node";
                            $node.parent().children("li").each(function () {
                                _projectTree.jstree(methodName, $(this));
                            });
                            return;
                        }
                    }
                    // original behaviour
                    originalHandler.apply(this, arguments);
                };
            };
            var originalHrefHandler = findEventHandler("click", "jstree", "a");
            var originalInsHandler = findEventHandler("click", "jstree", "li > ins");

            _projectTree
                .off("click.jstree", "a")
                .on("click.jstree", "a", createCustomHandler(originalHrefHandler))
                .off("click.jstree", "li > ins")
                .on("click.jstree", "li > ins", createCustomHandler(originalInsHandler))
                .unbind("dblclick.jstree")
                .bind("dblclick.jstree", function (event) {
                    var entry = $(event.target).closest("li").data("entry");
                    if (entry && entry.isFile && !_isInRename(event.target)) {
                        FileViewController.addToWorkingSetAndSelect(entry.fullPath);
                    }
                    if (_mouseupTimeoutId !== null) {
                        window.clearTimeout(_mouseupTimeoutId);
                        _mouseupTimeoutId = null;
                    }
                    
                });

            // fire selection changed events for sidebar-selection
            $projectTreeList = $projectTreeContainer.find("ul");
            ViewUtils.sidebarList($projectTreeContainer, "jstree-clicked", "jstree-leaf");
            $projectTreeContainer.show();
        });

        return Async.withTimeout(result.promise(), 1000);
    }
    
    function _showErrorDialog(errType, isFolder, error, path) {
        var titleType = isFolder ? Strings.DIRECTORY_TITLE : Strings.FILE_TITLE,
            entryType = isFolder ? Strings.DIRECTORY : Strings.FILE,
            title,
            message;
        path = StringUtils.breakableUrl(path);

        switch (errType) {
        case ERR_TYPE_CREATE:
            title = StringUtils.format(Strings.ERROR_CREATING_FILE_TITLE, titleType);
            message = StringUtils.format(Strings.ERROR_CREATING_FILE, entryType, path, error);
            break;
        case ERR_TYPE_CREATE_EXISTS:
            title = StringUtils.format(Strings.INVALID_FILENAME_TITLE, titleType);
            message = StringUtils.format(Strings.ENTRY_WITH_SAME_NAME_EXISTS, path);
            break;
        case ERR_TYPE_RENAME:
            title = StringUtils.format(Strings.ERROR_RENAMING_FILE_TITLE, titleType);
            message = StringUtils.format(Strings.ERROR_RENAMING_FILE, path, error, entryType);
            break;
        case ERR_TYPE_DELETE:
            title = StringUtils.format(Strings.ERROR_DELETING_FILE_TITLE, titleType);
            message = StringUtils.format(Strings.ERROR_DELETING_FILE, path, error, entryType);
            break;
        case ERR_TYPE_LOADING_PROJECT:
            title = Strings.ERROR_LOADING_PROJECT;
            message = StringUtils.format(Strings.READ_DIRECTORY_ENTRIES_ERROR, path, error);
            break;
        case ERR_TYPE_LOADING_PROJECT_NATIVE:
            title = Strings.ERROR_LOADING_PROJECT;
            message = StringUtils.format(Strings.REQUEST_NATIVE_FILE_SYSTEM_ERROR, path, error);
            break;
        case ERR_TYPE_MAX_FILES:
            title = Strings.ERROR_MAX_FILES_TITLE;
            message = Strings.ERROR_MAX_FILES;
            break;
        case ERR_TYPE_OPEN_DIALOG:
            title = Strings.ERROR_LOADING_PROJECT;
            message = StringUtils.format(Strings.OPEN_DIALOG_ERROR, error);
            break;
        case ERR_TYPE_INVALID_FILENAME:
            title = StringUtils.format(Strings.INVALID_FILENAME_TITLE, isFolder ? Strings.DIRECTORY_NAME : Strings.FILENAME);
            message = StringUtils.format(Strings.INVALID_FILENAME_MESSAGE, isFolder ? Strings.DIRECTORY_NAMES_LEDE : Strings.FILENAMES_LEDE, error);
            break;
        }

        if (title && message) {
            return Dialogs.showModalDialog(
                DefaultDialogs.DIALOG_ID_ERROR,
                title,
                message
            );
        }
        return null;
    }
    
    /**
     * @private
     * See shouldShow
     */
    function _shouldShowName(name) {
        return !name.match(_exclusionListRegEx);
    }
    
    /**
     * Returns false for files and directories that are not commonly useful to display.
     *
     * @param {FileSystemEntry} entry File or directory to filter
     * @return boolean true if the file should be displayed
     */
    function shouldShow(entry) {
        return _shouldShowName(entry.name);
    }
    
    /**
     * Returns true if fileName's extension doesn't belong to binary (e.g. archived)
     * @deprecated Use LanguageManager.getLanguageForPath(fullPath).isBinary()
     * @param {string} fileName
     * @return {boolean}
     */
    function isBinaryFile(fileName) {
        DeprecationWarning.deprecationWarning("ProjectManager.isBinaryFile() called for " + fileName + ". Use LanguageManager.getLanguageForPath(fileName).isBinary() instead.");
        return LanguageManager.getLanguageForPath(fileName).isBinary();
    }
    
    /**
     * @private
     * Generate a string suitable for sorting
     * @param {string} name
     * @param {boolean} isFolder
     * @return {string}
     */
    function _toCompareString(name, isFolder) {
        return (isFolder ? _sortPrefixDir : _sortPrefixFile) + name;
    }
    
    /**
     * @private
     * Insert a path in the fullPath-to-DOM ID cache
     * @param {!(FileSystemEntry|string)} entry Entry or full path to add to cache
     */
    function _insertTreeNodeCache(entry, id) {
        var fullPath = entry.fullPath || entry;
        _projectInitialLoad.fullPathToIdMap[fullPath] = id;
    }
    
    /**
     * @private
     * Delete a path from the fullPath-to-DOM ID cache
     * @param {!(FileSystemEntry|string)} entry Entry or full path to remove from cache
     */
    function _deleteTreeNodeCache(entry) {
        var fullPath = entry.fullPath || entry;
        delete _projectInitialLoad.fullPathToIdMap[fullPath];
    }
    
    /**
     * @private
     * Create JSON object for a jstree node. Insert mapping from full path to
     * jstree node ID.
     * 
     * For more info on jsTree's JSON format see: http://www.jstree.com/documentation/json_data
     * @param {!FileSystemEntry} entry
     * @return {data: string, attr: {id: string}, metadata: {entry: FileSystemEntry}, children: Array.<Object>, state: string}
     */
    function _entryToJSON(entry) {
        if (!shouldShow(entry)) {
            return null;
        }
        
        var jsonEntry = {
            data                : entry.name,
            attr                : { id: "node" + _projectInitialLoad.id++ },
            metadata: {
                entry           : entry,
                compareString   : _toCompareString(entry.name, entry.isDirectory)
            }
        };

        if (entry.isDirectory) {
            jsonEntry.children = [];
            jsonEntry.state = "closed";
            jsonEntry.data = _.escape(jsonEntry.data);
        } else {
            jsonEntry.data = ViewUtils.getFileEntryDisplay(entry);
        }

        // Map path to ID to initialize loaded and opened states
        _insertTreeNodeCache(entry, jsonEntry.attr.id);
        
        return jsonEntry;
    }

    /**
     * @private
     * Given an array of file system entries, returns a JSON array representing them in the format
     * required by jsTree. Saves the corresponding Entry object as metadata (which jsTree will store in
     * the DOM via $.data()).
     *
     * Does NOT recursively traverse the file system: folders are marked as expandable but are given no
     * children initially.
     *
     * @param {Array.<FileSystemEntry>} entries  Array of FileSystemEntry entry objects.
     * @return {Array} jsTree node data: array of JSON objects
     */
    function _convertEntriesToJSON(entries) {
        var jsonEntryList = [],
            entry,
            entryI,
            jsonEntry;

        for (entryI = 0; entryI < entries.length; entryI++) {
            jsonEntryList.push(_entryToJSON(entries[entryI]));
        }
        
        return jsonEntryList;
    }

    /**
     * @private
     * Called by jsTree when the user has expanded a node that has never been expanded before. We call
     * jsTree back asynchronously with the node's immediate children data once the subfolder is done
     * being fetched.
     *
     * @param {jQueryObject} $treeNode  jQ object for the DOM node being expanded
     * @param {function(Array)} jsTreeCallback  jsTree callback to provide children to
     */
    function _treeDataProvider($treeNode, jsTreeCallback) {
        var dirEntry, isProjectRoot = false, deferred = new $.Deferred();
        
        function processEntries(entries) {
            var subtreeJSON = _convertEntriesToJSON(entries),
                wasNodeOpen = false,
                emptyDirectory = (subtreeJSON.length === 0);
            
            if (emptyDirectory) {
                if (!isProjectRoot) {
                    wasNodeOpen = $treeNode.hasClass("jstree-open");
                } else {
                    // project root is a special case, add a placeholder
                    subtreeJSON.push({});
                }
            }
            
            jsTreeCallback(subtreeJSON);
            
            if (!isProjectRoot && emptyDirectory) {
                // If the directory is empty, force it to appear as an open or closed node.
                // This is a workaround for issue #149 where jstree would show this node as a leaf.
                var classToAdd = (wasNodeOpen) ? "jstree-closed" : "jstree-open";
                
                $treeNode.removeClass("jstree-leaf jstree-closed jstree-open")
                    .addClass(classToAdd);
                
                // This is a workaround for a part of issue #2085, where the file creation process
                // depends on the open_node.jstree event being triggered, which doesn't happen on
                // empty folders
                if (!wasNodeOpen) {
                    $treeNode.trigger("open_node.jstree");
                }
            }
            
            deferred.resolve();
        }

        if ($treeNode === -1) {
            // Special case: root of tree
            dirEntry = _projectRoot;
            isProjectRoot = true;
        } else {
            // All other nodes: the Directory is saved as jQ data in the tree (by _convertEntriesToJSON())
            dirEntry = $treeNode.data("entry");
        }
        
        // Fetch dirEntry's contents
        dirEntry.getContents(function (err, contents, stats, statsErrs) {
            if (err) {
                _showErrorDialog(ERR_TYPE_LOADING_PROJECT, null, err, dirEntry.fullPath);
                // Reject the render promise so we can move on.
                deferred.reject();
            } else {
                if (statsErrs) {
                    // some but not all entries failed to load, so render what we can
                    console.warn("Error reading a subset of folder " + dirEntry);
                }
                processEntries(contents);
            }
        });
    }
    
    /**
     * Forces createNewItem() to complete by removing focus from the rename field which causes
     * the new file to be written to disk
     */
    function forceFinishRename() {
        $(".jstree-rename-input").blur();
    }
    
    
    /**
     * Although Brackets is generally standardized on folder paths with a trailing "/", some APIs here
     * receive project paths without "/" due to legacy preference storage formats, etc.
     * @param {!string} fullPath  Path that may or may not end in "/"
     * @return {!string} Path that ends in "/"
     */
    function _ensureTrailingSlash(fullPath) {
        if (fullPath[fullPath.length - 1] !== "/") {
            return fullPath + "/";
        }
        return fullPath;
    }
    
    /** Returns the full path to the welcome project, which we open on first launch.
     * @private
     * @return {!string} fullPath reference
     */
    function _getWelcomeProjectPath() {
        var initialPath = FileUtils.getNativeBracketsDirectoryPath(),
            sampleUrl = Urls.GETTING_STARTED;
        if (sampleUrl) {
            // Back up one more folder. The samples folder is assumed to be at the same level as
            // the src folder, and the sampleUrl is relative to the samples folder.
            initialPath = initialPath.substr(0, initialPath.lastIndexOf("/")) + "/samples/" + sampleUrl;
        }

        return _ensureTrailingSlash(initialPath); // paths above weren't canonical
    }
    
    /**
     * Returns true if the given path is the same as one of the welcome projects we've previously opened,
     * or the one for the current build.
     */
    function isWelcomeProjectPath(path) {
        if (path === _getWelcomeProjectPath()) {
            return true;
        }
        var pathNoSlash = FileUtils.stripTrailingSlash(path);  // "welcomeProjects" pref has standardized on no trailing "/"
        var welcomeProjects = PreferencesManager.getViewState("welcomeProjects") || [];
        return welcomeProjects.indexOf(pathNoSlash) !== -1;
    }
    
    /**
     * Adds the path to the list of welcome projects we've ever seen, if not on the list already.
     */
    function addWelcomeProjectPath(path) {
        var pathNoSlash = FileUtils.stripTrailingSlash(path);  // "welcomeProjects" pref has standardized on no trailing "/"
        
        var welcomeProjects = PreferencesManager.getViewState("welcomeProjects") || [];
        if (welcomeProjects.indexOf(pathNoSlash) === -1) {
            welcomeProjects.push(pathNoSlash);
            PreferencesManager.setViewState("welcomeProjects", welcomeProjects);
        }
    }
    
    /**
     * If the provided path is to an old welcome project, returns the current one instead.
     */
    function updateWelcomeProjectPath(path) {
        if (isWelcomeProjectPath(path)) {
            return _getWelcomeProjectPath();
        } else {
            return path;
        }
    }

    /**
     * Initial project path is stored in prefs, which defaults to the welcome project on
     * first launch.
     */
    function getInitialProjectPath() {
        return updateWelcomeProjectPath(PreferencesManager.getViewState("projectPath"));
    }
    
    function _watchProjectRoot(rootPath) {
        FileSystem.on("change", _fileSystemChange);
        FileSystem.on("rename", _fileSystemRename);

        FileSystem.watch(FileSystem.getDirectoryForPath(rootPath), _shouldShowName, function (err) {
            if (err === FileSystemError.TOO_MANY_ENTRIES) {
                _showErrorDialog(ERR_TYPE_MAX_FILES);
            } else if (err) {
                console.error("Error watching project root: ", rootPath, err);
            }
        });
        
        // Reset allFiles cache
        _allFilesCachePromise = null;
    }

        
    /**
     * @private
     * Close the file system and remove listeners.
     * @return {$.Promise} A promise that's resolved when the root is unwatched. Rejected if
     *     there is no project root or if the unwatch fails.
     */
    function _unwatchProjectRoot() {
        var result = new $.Deferred();
        if (!_projectRoot) {
            result.reject();
        } else {
            FileSystem.off("change", _fileSystemChange);
            FileSystem.off("rename", _fileSystemRename);

            FileSystem.unwatch(_projectRoot, function (err) {
                if (err) {
                    console.error("Error unwatching project root: ", _projectRoot.fullPath, err);
                    result.reject();
                } else {
                    result.resolve();
                }
            });
            
            // Reset allFiles cache
            _allFilesCachePromise = null;
        }
        
        return result.promise();
    }
    
    /**
     * @private
     * Reloads the project preferences.
     */
    function _reloadProjectPreferencesScope() {
        var root = getProjectRoot();
        if (root) {
            // Alias the "project" Scope to the path Scope for the project-level settings file
            PreferencesManager._setProjectSettingsFile(root.fullPath + SETTINGS_FILENAME);
        } else {
            PreferencesManager._setProjectSettingsFile();
        }
    }
    
    /**
     * Loads the given folder as a project. Does NOT prompt about any unsaved changes - use openProject()
     * instead to check for unsaved changes and (optionally) let the user choose the folder to open.
     *
     * @param {!string} rootPath  Absolute path to the root folder of the project.
     *  A trailing "/" on the path is optional (unlike many Brackets APIs that assume a trailing "/").
     * @param {boolean=} isUpdating  If true, indicates we're just updating the tree;
     *  if false, a different project is being loaded.
     * @return {$.Promise} A promise object that will be resolved when the
     *  project is loaded and tree is rendered, or rejected if the project path
     *  fails to load.
     */
    function _loadProject(rootPath, isUpdating) {
        var result = new $.Deferred(),
            startLoad = new $.Deferred(),
            resultRenderTree;

        forceFinishRename();    // in case we're in the middle of renaming a file in the project
        
        // Some legacy code calls this API with a non-canonical path
        rootPath = _ensureTrailingSlash(rootPath);
        
        if (isUpdating) {
            // We're just refreshing. Don't need to unwatch the project root, so we can start loading immediately.
            startLoad.resolve();
        } else {
            if (_projectRoot && _projectRoot.fullPath === rootPath) {
                return (new $.Deferred()).resolve().promise();
            }
            
            // About to close current project (if any)
            if (_projectRoot) {
                $(exports).triggerHandler("beforeProjectClose", _projectRoot);
            }
            
            // close all the old files
            DocumentManager.closeAll();
    
            _unwatchProjectRoot().always(function () {
                // Finish closing old project (if any)
                if (_projectRoot) {
                    LanguageManager._resetPathLanguageOverrides();
                    PreferencesManager._reloadUserPrefs(_projectRoot);
                    $(exports).triggerHandler("projectClose", _projectRoot);
                }
                
                startLoad.resolve();
            });
        }
        
        startLoad.done(function () {
            var context = { location : { scope: "user",
                                         layer: "project" } };

            // Clear project path map
            _projectInitialLoad = {
                previous        : [],   /* array of arrays containing full paths to open at each depth of the tree */
                id              : 0,    /* incrementing id */
                fullPathToIdMap : {}    /* mapping of fullPath to tree node id attr */
            };

            if (!isUpdating) {
                PreferencesManager._stateProjectLayer.setProjectPath(rootPath);
            }
            
            // restore project tree state from last time this project was open
            _projectInitialLoad.previous = PreferencesManager.getViewState("project.treeState", context) || [];

            // Populate file tree as long as we aren't running in the browser
            if (!brackets.inBrowser) {
                if (!isUpdating) {
                    _watchProjectRoot(rootPath);
                }
                // Point at a real folder structure on local disk
                var rootEntry = FileSystem.getDirectoryForPath(rootPath);
                rootEntry.exists(function (err, exists) {
                    if (exists) {
                        var projectRootChanged = (!_projectRoot || !rootEntry) ||
                            _projectRoot.fullPath !== rootEntry.fullPath;
                        
                        // Success!
                        var perfTimerName = PerfUtils.markStart("Load Project: " + rootPath);

                        _projectRoot = rootEntry;
                        
                        if (projectRootChanged) {
                            _reloadProjectPreferencesScope();
                            PreferencesManager._setCurrentEditingFile(rootPath);
                        }

                        _projectBaseUrl = PreferencesManager.getViewState("project.baseUrl", context) || "";
                        _allFilesCachePromise = null;  // invalidate getAllFiles() cache as soon as _projectRoot changes

                        // If this is the most current welcome project, record it. In future launches, we want
                        // to substitute the latest welcome project from the current build instead of using an
                        // outdated one (when loading recent projects or the last opened project).
                        if (rootPath === _getWelcomeProjectPath()) {
                            addWelcomeProjectPath(rootPath);
                        }

                        // The tree will invoke our "data provider" function to populate the top-level items, then
                        // go idle until a node is expanded - at which time it'll call us again to fetch the node's
                        // immediate children, and so on.
                        resultRenderTree = _renderTree(_treeDataProvider);

                        resultRenderTree.always(function () {
                            if (projectRootChanged) {
                                // Allow asynchronous event handlers to finish before resolving result by collecting promises from them
                                var promises = [];
                                $(exports).triggerHandler({ type: "projectOpen", promises: promises }, [_projectRoot]);
                                $.when.apply($, promises).then(result.resolve, result.reject);
                            } else {
                                $(exports).triggerHandler("projectRefresh", _projectRoot);
                                result.resolve();
                            }
                        });
                        resultRenderTree.fail(function () {
                            PerfUtils.finalizeMeasurement(perfTimerName);
                            result.reject();
                        });
                        resultRenderTree.always(function () {
                            PerfUtils.addMeasurement(perfTimerName);
                        });
                    } else {
                        _showErrorDialog(ERR_TYPE_LOADING_PROJECT_NATIVE, null, rootPath, err || FileSystemError.NOT_FOUND)
                            .done(function () {
                                // Reset _projectRoot to null so that the following _loadProject call won't 
                                // run the 'beforeProjectClose' event a second time on the original project, 
                                // which is now partially torn down (see #6574).
                                _projectRoot = null;

                                // The project folder stored in preference doesn't exist, so load the default
                                // project directory.
                                // TODO (issue #267): When Brackets supports having no project directory
                                // defined this code will need to change
                                _loadProject(_getWelcomeProjectPath()).always(function () {
                                    // Make sure not to reject the original deferred until the fallback
                                    // project is loaded, so we don't violate expectations that there is always
                                    // a current project before continuing after _loadProject().
                                    result.reject();
                                });
                            });
                    }
                });
            }
        });
        
        return result.promise();
    }
    
    /**
     * @private
     * Lookup jQuery node for a given FileSystem Entry
     * @param {!File|Directory|string} entry String or File/Directory entry to find in the tree
     * @return {?jQuery} The jQuery node for this entry or null if not found
     */
    function _getTreeNode(entry) {
        // Special case if the entry matches the project root
        if (entry === getProjectRoot()) {
            return $projectTreeList;
        }
        
        var fullPath = entry.fullPath || entry,
            id = _projectInitialLoad.fullPathToIdMap[fullPath],
            node = null;
        
        if (id) {
            node = $("#" + id);
        }
        
        return node;
    }
    
    /**
     * Finds the tree node corresponding to the given file/folder (rejected if the path lies
     * outside the project, or if it doesn't exist).
     *
     * @param {!(File|Directory)} entry File or Directory to find
     * @return {$.Promise} Resolved with jQ obj for the jsTree tree node; or rejected if not found
     */
    function _findTreeNode(entry) {
        var result = new $.Deferred(),
            $renderedNode = _getTreeNode(entry);
        
        // Check if tree node was already rendered
        if ($renderedNode) {
            return result.resolve($renderedNode).promise();
        }
        
        var projRelativePath = makeProjectRelativeIfPossible(entry.fullPath);

        if (projRelativePath === entry.fullPath) {
            // If path not within project, ignore
            return result.reject().promise();
        } else if (entry === getProjectRoot()) {
            // If path is the project root, return the tree itself
            return result.resolve($projectTreeList).promise();
        }
        
        var treeAPI = $.jstree._reference(_projectTree);
        
        // We're going to traverse from root of tree, one segment at a time
        var pathSegments = projRelativePath.split("/");
        if (entry.isDirectory) {
            pathSegments.pop();  // Directory always has a trailing "/"
        }
        
        function findInSubtree($nodes, segmentI) {
            var seg = pathSegments[segmentI];
            var match = _.findIndex($nodes, function (node, i) {
                var entry = $(node).data("entry"),
                    nodeName = entry ? entry.name : null;
                
                return nodeName === seg;
            });
            
            if (match === -1) {
                result.reject();    // path doesn't exist
            } else {
                var $node = $nodes.eq(match);
                if (segmentI === pathSegments.length - 1) {
                    result.resolve($node);  // done searching!
                } else {
                    // Search next level down
                    var subChildren = treeAPI._get_children($node);
                    if (subChildren.length > 0) {
                        findInSubtree(subChildren, segmentI + 1);
                    } else {
                        // Subtree not loaded yet: force async load & try again
                        treeAPI.load_node($node, function (data) {
                            subChildren = treeAPI._get_children($node);
                            findInSubtree(subChildren, segmentI + 1);
                        }, function (err) {
                            result.reject();  // includes case where folder is empty
                        });
                    }
                }
            }
        }
        
        // Begin searching from root
        var topLevelNodes = treeAPI._get_children(-1);  // -1 means top level in jsTree-ese
        findInSubtree(topLevelNodes, 0);
        
        return result.promise();
    }
    
    /**
     * Internal function to refresh the project's file tree, maintaining the
     * current selection. This function is expensive and not concurrency-safe,
     * so most callers should use the synchronized and throttled version below,
     * refreshFileTree.
     * 
     * @private
     * @return {$.Promise} A promise object that will be resolved when the
     *  project tree is reloaded, or rejected if the project path
     *  fails to reload. If the previous selected entry is not found, 
     *  the promise is still resolved.
     */
    function _refreshFileTreeInternal() {
        var selectedEntry,
            deferred = new $.Deferred();

        if (_lastSelected) {
            selectedEntry = _lastSelected.data("entry");
        }
        _lastSelected = null;
        
        _loadProject(getProjectRoot().fullPath, true)
            .then(function () {
                if (selectedEntry) {
                    // restore selection, always resolve
                    _findTreeNode(selectedEntry)
                        .done(function ($node) {
                            _forceSelection(null, $node);
                        })
                        .always(deferred.resolve);
                } else {
                    deferred.resolve();
                }
            }, deferred.reject);

        return deferred.promise();
    }
    
    /**
     * @private
     * @type {?jQuery.Promise} Resolves when the currently running instance of
     *      _refreshFileTreeInternal completes, or null if there is no currently
     *      running instance.
     */
    var _refreshFileTreePromise = null;
    
    /**
     * @type {boolean} If refreshFileTree is called before _refreshFileTreePromise
     *      has resolved then _refreshPending is set, which indicates that 
     *      refreshFileTree should be called again once the promise resolves.
     */
    var _refreshPending = false;
    
    /**
     * @const
     * @private
     * @type {number} Minimum delay in milliseconds between calls to refreshFileTree
     */
    var _refreshDelay = 1000;
    
    /**
     * Refresh the project's file tree, maintaining the current selection.
     * 
     * @return {$.Promise} A promise object that will be resolved when the
     *  project tree is reloaded, or rejected if the project path
     *  fails to reload. If the previous selected entry is not found, 
     *  the promise is still resolved.
     */
    function refreshFileTree() {
        if (!_refreshFileTreePromise) {
            var internalRefreshPromise  = _refreshFileTreeInternal(),
                deferred                = new $.Deferred();

            _refreshFileTreePromise = deferred.promise();
            
            _refreshFileTreePromise.always(function () {
                _refreshFileTreePromise = null;
                
                if (_refreshPending) {
                    _refreshPending = false;
                    refreshFileTree();
                }
            });

            // Wait at least one second before resolving the promise
            window.setTimeout(function () {
                internalRefreshPromise.then(deferred.resolve, deferred.reject);
            }, _refreshDelay);
        } else {
            _refreshPending = true;
        }

        return _refreshFileTreePromise;
    }
    
    /**
     * Expands tree nodes to show the given file or folder and selects it. Silently no-ops if the
     * path lies outside the project, or if it doesn't exist.
     *
     * @param {!(File|Directory)} entry File or Directory to show
     * @return {$.Promise} Resolved when done; or rejected if not found
     */
    function showInTree(entry) {
        return _findTreeNode(entry)
            .done(function ($node) {
                // jsTree will automatically expand parent nodes to ensure visible
                _projectTree.jstree("select_node", $node, false);
            });
    }
    
    
    /**
     * Open a new project. Currently, Brackets must always have a project open, so
     * this method handles both closing the current project and opening a new project.
     *
     * @param {string=} path Optional absolute path to the root folder of the project.
     *  If path is undefined or null, displays a dialog where the user can choose a
     *  folder to load. If the user cancels the dialog, nothing more happens.
     * @return {$.Promise} A promise object that will be resolved when the
     *  project is loaded and tree is rendered, or rejected if the project path
     *  fails to load.
     */
    function openProject(path) {

        var result = new $.Deferred();

        // Confirm any unsaved changes first. We run the command in "prompt-only" mode, meaning it won't
        // actually close any documents even on success; we'll do that manually after the user also oks
        // the folder-browse dialog.
        CommandManager.execute(Commands.FILE_CLOSE_ALL, { promptOnly: true })
            .done(function () {
                if (path) {
                    // use specified path
                    _loadProject(path, false).then(result.resolve, result.reject);
                } else {
                    // Pop up a folder browse dialog
                    FileSystem.showOpenDialog(false, true, Strings.CHOOSE_FOLDER, _projectRoot.fullPath, null, function (err, files) {
                        if (!err) {
                            // If length == 0, user canceled the dialog; length should never be > 1
                            if (files.length > 0) {
                                // Load the new project into the folder tree
                                _loadProject(files[0]).then(result.resolve, result.reject);
                            } else {
                                result.reject();
                            }
                        } else {
                            _showErrorDialog(ERR_TYPE_OPEN_DIALOG, null, err);
                            result.reject();
                        }
                    });
                }
            })
            .fail(function () {
                result.reject();
            });

        // if fail, don't open new project: user canceled (or we failed to save its unsaved changes)
        return result.promise();
    }

    /**
     * Invoke project settings dialog.
     * @return {$.Promise}
     */
    function _projectSettings() {
        return PreferencesDialogs.showProjectPreferencesDialog(getBaseUrl()).getPromise();
    }
    
    /**
     * @private
     * Check a filename for illegal characters. If any are found, show an error
     * dialog and return false. If no illegal characters are found, return true.
     * Although Mac and Linux allow ?*| characters, we still cannot allow them
     * since these have special meaning for all file systems.
     *
     * @param {string} filename
     * @param {boolean} isFolder
     * @return {boolean} Returns true if no illegal characters are found
     */
    function _checkForValidFilename(filename, isFolder) {
        // Validate file name
        // Checks for valid Windows filenames:
        // See http://msdn.microsoft.com/en-us/library/windows/desktop/aa365247(v=vs.85).aspx
        if ((filename.search(new RegExp("[" + _invalidChars + "]+")) !== -1) ||
                filename.match(_illegalFilenamesRegEx)) {
            _showErrorDialog(ERR_TYPE_INVALID_FILENAME, isFolder, _invalidChars);
            return false;
        }
        return true;
    }
    
    /**
     * @private
     * Add a new node (existing FileSystemEntry or untitled file) to the project tree
     * 
     * @param {?jQueryObject} $target Parent or sibling node
     * @param {?number|string} position Position to insert
     * @param {!Object|Array.<Object>} arr Node data or array of node data
     * @param {!boolean} skipRename
     * @param {!boolean} skipRedraw
     */
    function _createNode($target, position, arr, skipRename, skipRedraw) {
        if (typeof arr === "string") {
            arr = [{ data: arr }];
        } else if (!Array.isArray(arr)) {
            arr = [arr];
        }
        
        position = position || 0;
        
        arr.forEach(function (node) {
            // Convert strings to objects
            if (typeof node === "string") {
                node = {
                    data: node,
                    metadata: { compareString: _sortPrefixFile + node }
                };
            }
            
            if (node) {
                _projectTree.jstree("create", $target, position, node, null, skipRename);
            }
        });
        
        if (!skipRedraw) {
            _redraw(true);
        }
    }

    /**
     * Create a new item in the current project.
     *
     * @param baseDir {string|Directory} Full path of the directory where the item should go.
     *   Defaults to the project root if the entry is not valid or not within the project.
     * @param initialName {string} Initial name for the item
     * @param skipRename {boolean} If true, don't allow the user to rename the item
     * @param isFolder {boolean} If true, create a folder instead of a file
     * @return {$.Promise} A promise object that will be resolved with the File
     *  of the created object, or rejected if the user cancelled or entered an illegal
     *  filename.
     */
    function createNewItem(baseDir, initialName, skipRename, isFolder) {
        // We assume the parent directory exists
        var entry               = (typeof baseDir === "string") ? FileSystem.getDirectoryForPath(baseDir) : baseDir,
            baseDirEntry        = isWithinProject(entry) ? entry : getProjectRoot(),
            $baseDirNode        = (baseDir && _getTreeNode(baseDirEntry)) || null,
            position            = "inside",
            escapeKeyPressed    = false,
            result              = new $.Deferred(),
            isRoot              = $baseDirNode === $projectTreeList,
            wasNodeOpen         = isRoot || ($baseDirNode && $baseDirNode.hasClass("jstree-open")) || false,
            newItemData         = {};
        
        // Silently fail if baseDir assumption fails
        if (!$baseDirNode) {
            return result.reject().promise();
        }
        
        // Inject jstree data for sorting
        newItemData.data = initialName;
        newItemData.metadata = { compareString: _toCompareString(initialName, isFolder) };

        _projectTree.on("create.jstree", function (event, data) {
            $(event.target).off("create.jstree");

            function errorCleanup() {
                // TODO (issue #115): If an error occurred, we should allow the user to fix the filename.
                // For now we just remove the node so you have to start again.
                var parent = data.inst._get_parent(data.rslt.obj);
                
                _projectTree.jstree("remove", data.rslt.obj);
                
                // Restore tree node state and styling when errors occur.
                // parent returns -1 when at the root
                if (parent && (parent !== -1)) {
                    var methodName = (wasNodeOpen) ? "open_node" : "close_node";
                    var classToAdd = (wasNodeOpen) ? "jstree-open" : "jstree-closed";

                    // This is a workaround for issue #149 where jstree would show this node as a leaf.
                    _projectTree.jstree(methodName, parent);
                    parent.removeClass("jstree-leaf jstree-closed jstree-open")
                        .addClass(classToAdd);
                }
                
                _redraw(true);
                
                result.reject();
            }

            if (!escapeKeyPressed) {
                // Validate file name
                if (!_checkForValidFilename(data.rslt.name, isFolder)) {
                    errorCleanup();
                    return;
                }

                var successCallback = function (entry) {
                    // Remove the temporary leaf node used for the name input
                    _projectTree.jstree("remove", data.rslt.obj);

                    _projectTree.one("create.jstree", function (event, data) {
                        // Select the new node and resolve
                        _projectTree.jstree("select_node", data.rslt.obj, true);
                        result.resolve(entry);
                    });

                    // Create a new node
                    _createNode($baseDirNode, null, _entryToJSON(entry), true, true);
                };
                
                var errorCallback = function (error) {
                    if (error === FileSystemError.ALREADY_EXISTS) {
                        _showErrorDialog(ERR_TYPE_CREATE_EXISTS, isFolder, null, data.rslt.name);
                    } else {
                        var errString = error === FileSystemError.NOT_WRITABLE ?
                                         Strings.NO_MODIFICATION_ALLOWED_ERR :
                                         StringUtils.format(Strings.GENERIC_ERROR, error);

                        _showErrorDialog(ERR_TYPE_CREATE, isFolder, errString, data.rslt.name);
                    }

                    errorCleanup();
                };
                
                var newItemPath = baseDirEntry.fullPath + data.rslt.name;
                
                FileSystem.resolve(newItemPath, function (err) {
                    if (!err) {
                        // Item already exists, fail with error
                        errorCallback(FileSystemError.ALREADY_EXISTS);
                    } else {
                        if (isFolder) {
                            var directory = FileSystem.getDirectoryForPath(newItemPath);
                            
                            directory.create(function (err) {
                                if (err) {
                                    errorCallback(err);
                                } else {
                                    successCallback(directory);
                                }
                            });
                        } else {
                            // Create an empty file
                            var file = FileSystem.getFileForPath(newItemPath);
                            
                            file.write("", function (err) {
                                if (err) {
                                    errorCallback(err);
                                } else {
                                    successCallback(file);
                                }
                            });
                        }
                    }
                });
                
            } else { //escapeKeyPressed
                errorCleanup();
            }
        });

        // There is a race condition in jstree if "open_node" and "create" are called in rapid
        // succession and the node was not yet loaded. To avoid it, first open the node and wait
        // for the open_node event before trying to create the new one. See #2085 for more details.
        if (wasNodeOpen) {
            _createNode($baseDirNode, position, newItemData, skipRename);

            if (!skipRename) {
                var $renameInput = _projectTree.find(".jstree-rename-input");
    
                $renameInput.on("keydown", function (event) {
                    // Listen for escape key on keydown, so we can remove the node in the create.jstree handler above
                    if (event.keyCode === KeyEvent.DOM_VK_ESCAPE) {
    
                        escapeKeyPressed = true;
                    }
                });
    
                ViewUtils.scrollElementIntoView(_projectTree, $renameInput, true);
            }
        } else {
            _projectTree.one("open_node.jstree", function () {
                _createNode($baseDirNode, position, newItemData, skipRename);
            });
    
            // Open the node before creating the new child
            _projectTree.jstree("open_node", $baseDirNode);
        }
        
        return result.promise();
    }

    /**
     * Rename a file/folder. This will update the project tree data structures
     * and send notifications about the rename.
     *
     * @param {string} oldName Old item name
     * @param {string} newName New item name
     * @param {boolean} isFolder True if item is a folder; False if it is a file.
     * @return {$.Promise} A promise object that will be resolved or rejected when
     *   the rename is finished.
     */
    function renameItem(oldName, newName, isFolder) {
        var result = new $.Deferred();
        
        if (oldName === newName) {
            result.resolve();
            return result.promise();
        }
        
        var entry = isFolder ? FileSystem.getDirectoryForPath(oldName) : FileSystem.getFileForPath(oldName);
        entry.rename(newName, function (err) {
            if (!err) {
                if (EditorManager.getCurrentlyViewedPath()) {
                    FileViewController.openAndSelectDocument(
                        EditorManager.getCurrentlyViewedPath(),
                        FileViewController.getFileSelectionFocus()
                    );
                }
                
                _redraw(true);
                result.resolve();
            } else {
                // Show an error alert
                var errString = err === FileSystemError.ALREADY_EXISTS ?
                                Strings.FILE_EXISTS_ERR :
                                FileUtils.getFileErrorString(err);

                _showErrorDialog(ERR_TYPE_RENAME, isFolder, errString, newName);
                result.reject(err);
            }
        });
        
        return result.promise();
    }
    
    /**
     * Initiates a rename of the selected item in the project tree, showing an inline editor
     * for input. Silently no-ops if the entry lies outside the tree or doesn't exist.
     * @param {!(File|Directory)} entry File or Directory to rename
     */
    function renameItemInline(entry) {
        // First make sure the item in the tree is visible - jsTree's rename API doesn't do anything to ensure inline input is visible
        showInTree(entry)
            .done(function ($selected) {
                // Don't try to rename again if we are already renaming
                if (_isInRename($selected)) {
                    return;
                }
                
                var isFolder = $selected.hasClass("jstree-open") || $selected.hasClass("jstree-closed");
        
                _projectTree.one("rename.jstree", function (event, data) {
                    var unescapedOldName = _.unescape(data.rslt.old_name),
                        unescapedNewName = _.unescape(data.rslt.new_name),
                        // Make sure the file was actually renamed
                        changed = (unescapedOldName !== unescapedNewName);
                    
                    var _resetOldFilename = function () {
                        _projectTree.jstree("set_text", $selected, ViewUtils.getFileEntryDisplay(entry));
                    };
                    
                    if (!changed || !_checkForValidFilename(unescapedNewName, isFolder)) {
                        // No change or invalid filename. Reset the old name and bail.
                        _resetOldFilename();
                        return;
                    }
                    
                    var oldFullPath = $selected.data("entry").fullPath;
                    // Folder paths have to end with a slash. Use look-head (?=...) to only replace the folder's name, not the slash as well
                    
                    var oldNameEndPattern = isFolder ? "(?=\/$)" : "$";
                    var oldNameRegex = new RegExp(StringUtils.regexEscape(unescapedOldName) + oldNameEndPattern);
                    var newName = oldFullPath.replace(oldNameRegex, unescapedNewName);
                    
                    renameItem(oldFullPath, newName, isFolder)
                        .done(function () {
                            _projectTree.jstree("set_text", $selected, ViewUtils.getFileEntryDisplay(entry));
                            
                            // Update caches: compareString and fullPathToIdMap
                            $selected.data("compareString", _toCompareString(entry.name, isFolder));
                            _deleteTreeNodeCache(oldFullPath);
                            _insertTreeNodeCache(entry, $selected.attr("id"));
                            
                            // If a folder was renamed, re-select it here, since openAndSelectDocument()
                            // changed the selection.
                            if (isFolder) {
                                var oldSuppressToggleOpen = suppressToggleOpen;
                                
                                // Supress the open/close toggle
                                suppressToggleOpen = true;
                                _projectTree.jstree("select_node", $selected, true);
                                suppressToggleOpen = oldSuppressToggleOpen;
                            }
                        })
                        .fail(function (err) {
                            // Error during rename. Reset to the old name and alert the user.
                            _resetOldFilename();
                        })
                        .always(function () {
                            _projectTree.jstree("sort", $selected.parent());
                            _redraw(true);
                        });
                });
                
                // Since html_titles are enabled, we have to reset the text without markup.
                // And we also need to explicitly escape all html-sensitive characters.
                var escapedName = _.escape(entry.name);
                _projectTree.jstree("set_text", $selected, escapedName);
                _projectTree.jstree("rename");

                var extension = FileUtils.getSmartFileExtension(entry.name);
                if (extension) {
                    var indexOfExtension = escapedName.length - extension.length - 1;
                    if (indexOfExtension > 0) {
                        $selected.children(".jstree-rename-input")[0].setSelectionRange(0, indexOfExtension);
                    }
                }
            });
        // No fail handler: silently no-op if file doesn't exist in tree
    }
    
    /**
     * @private
     * Deletes a node from jstree. Does not make assumptions on file existence.
     * @param {FileSystemEntry|Array.<FileSystemEntry>} target Entry or array of entries to delete
     * @param {boolean} skipRedraw
     */
    function _deleteTreeNode(target, skipRedraw) {
        var arr = !Array.isArray(target) ? [target] : target,
            oldSuppressToggleOpen = suppressToggleOpen,
            treeAPI = $.jstree._reference(_projectTree);
        
        suppressToggleOpen = true;
        
        arr.forEach(function (entry) {
            var $treeNode = _getTreeNode(entry),
                parentEntry,
                parentNode,
                siblings,
                parentWasOpen = false;

            // Save parent node open/closed state for non-root nodes
            if (entry.parentPath) {
                parentEntry = FileSystem.getDirectoryForPath(entry.parentPath);
                parentNode  = (parentEntry !== getProjectRoot()) && _getTreeNode(parentEntry);

                if (parentNode) {
                    parentWasOpen = parentNode.hasClass("jstree-open");
                }
            }
            
            if ($treeNode) {
                _projectTree.jstree("delete_node", $treeNode);
                _deleteTreeNodeCache(entry);
                
                if (parentNode) {
                    siblings    = treeAPI._get_children(parentNode);
                    
                    // Make sure it didn't turn into a leaf node. This happens if
                    // the only file in the directory was deleted
                    if (siblings.length === 0 && parentNode.hasClass("jstree-leaf")) {
                        parentNode.removeClass("jstree-leaf jstree-open jstree-closed");

                        // Only apply style if parent is a tree node (i.e. not project root)
                        if (parentWasOpen) {
                            parentNode.addClass("jstree-open");
                        } else {
                            parentNode.addClass("jstree-closed");
                        }
                    }
                }
            }
        });
        
        suppressToggleOpen = oldSuppressToggleOpen;
        
        if (!skipRedraw) {
            _redraw(true);
        }
        
        // Trigger notifications after tree updates are complete
        arr.forEach(function (entry) {
            if (DocumentManager.getCurrentDocument()) {
                DocumentManager.notifyPathDeleted(entry.fullPath);
            } else {
                EditorManager.notifyPathDeleted(entry.fullPath);
            }
        });
    }

    /**
     * Delete file or directore from project
     * @param {!(File|Directory)} entry File or Directory to delete
     */
    function deleteItem(entry) {
        var result = new $.Deferred();

        entry.moveToTrash(function (err) {
            if (!err) {
                _deleteTreeNode(entry);
                result.resolve();
            } else {
                _showErrorDialog(ERR_TYPE_DELETE, entry.isDirectory, FileUtils.getFileErrorString(err), entry.fullPath);
    
                result.reject(err);
            }
        });

        return result.promise();
    }
    
    /**
     * Returns a promise that resolves with a cached copy of all project files.
     * Used by ProjectManager.getAllFiles(). Ensures that at most one un-cached
     * directory traversal is active at a time, which is useful at project load
     * time when watchers (and hence filesystem-level caching) has not finished
     * starting up. The cache is cleared on every filesystem change event, and
     * also on project load and unload.
     * 
     * @private
     * @return {jQuery.Promise.<Array.<File>>}
     */
    function _getAllFilesCache() {
        if (!_allFilesCachePromise) {
            var deferred = new $.Deferred(),
                allFiles = [],
                allFilesVisitor = function (entry) {
                    if (shouldShow(entry)) {
                        if (entry.isFile) {
                            allFiles.push(entry);
                        }
                        return true;
                    }
                    return false;
                };

            _allFilesCachePromise = deferred.promise();
            
            getProjectRoot().visit(allFilesVisitor, function (err) {
                if (err) {
                    deferred.reject();
                    _allFilesCachePromise = null;
                } else {
                    deferred.resolve(allFiles);
                }
            });
        }
        
        return _allFilesCachePromise;
    }
    
    /**
     * Returns an Array of all files for this project, optionally including
     * files in the working set that are *not* under the project root. Files filtered
     * out by shouldShow().
     *
     * @param {function (File, number):boolean=} filter Optional function to filter
     *          the file list (does not filter directory traversal). API matches Array.filter().
     * @param {boolean=} includeWorkingSet If true, include files in the working set
     *          that are not under the project root (*except* for untitled documents).
     *
     * @return {$.Promise} Promise that is resolved with an Array of File objects.
     */
    function getAllFiles(filter, includeWorkingSet) {
        // The filter and includeWorkingSet params are both optional.
        // Handle the case where filter is omitted but includeWorkingSet is
        // specified.
        if (includeWorkingSet === undefined && typeof (filter) !== "function") {
            includeWorkingSet = filter;
            filter = null;
        }
        
        var filteredFilesDeferred = new $.Deferred();
        
        // First gather all files in project proper
        _getAllFilesCache().done(function (result) {
            // Add working set entries, if requested
            if (includeWorkingSet) {
                DocumentManager.getWorkingSet().forEach(function (file) {
                    if (result.indexOf(file) === -1 && !(file instanceof InMemoryFile)) {
                        result.push(file);
                    }
                });
            }
            
            // Filter list, if requested
            if (filter) {
                result = result.filter(filter);
            }
            
            // If a done handler attached to the returned filtered files promise
            // throws an exception that isn't handled here then it will leave
            // _allFilesCachePromise in an inconsistent state such that no
            // additional done handlers will ever be called!
            try {
                filteredFilesDeferred.resolve(result);
            } catch (e) {
                console.warn("Unhandled exception in getAllFiles handler: ", e);
            }
        });
        
        return filteredFilesDeferred.promise();
    }
    
    /**
     * Returns a filter for use with getAllFiles() that filters files based on LanguageManager language id
     * @param {!string} languageId
     * @return {!function(File):boolean}
     */
    function getLanguageFilter(languageId) {
        return function languageFilter(file) {
            return (LanguageManager.getLanguageForPath(file.fullPath).getId() === languageId);
        };
    }
        
    /**
     * @private 
     * Respond to a FileSystem change event. Note that if renames are initiated
     * externally, they may be reported as a separate removal and addition. In
     * this case, the editor state isn't currently preserved.
     * 
     * @param {$.Event} event
     * @param {?(File|Directory)} entry File or Directory changed
     * @param {Array.<FileSystemEntry>=} added If entry is a Directory, contains zero or more added children
     * @param {Array.<FileSystemEntry>=} removed If entry is a Directory, contains zero or more removed children
     */
    _fileSystemChange = function (event, entry, added, removed) {
        FileSyncManager.syncOpenDocuments();
        
        // Reset allFiles cache
        _allFilesCachePromise = null;

        // A whole-sale change event; refresh the entire file tree
        if (!entry) {
            refreshFileTree();
            return;
        }
        
        var $directoryNode = _getTreeNode(entry);
        
        // Ignore change event when: the entry is not a directory, the directory
        // was not yet rendered or the directory is outside the current project
        if (!entry.isDirectory || !$directoryNode || !isWithinProject(entry.fullPath)) {
            return;
        }
        
        // If there is a change event with unknown added and removed sets
        // just refresh the tree.
        // 
        // TODO: in the former case we really should just refresh the affected
        // directory instead of refreshing the entire tree.
        if (!added || !removed) {
            refreshFileTree();
            return;
        }

        var wasOpen = $directoryNode.hasClass("jstree-open"),
            doRedraw = false;
        
        // Directory contents removed
        if (removed.length > 0) {
            // Synchronously remove all tree nodes
            _deleteTreeNode(removed, true);
            doRedraw = true;
        }

        // Before creating new nodes, make sure it doesn't already exist
        var addedJSON = added.filter(function (addedEntry) {
            return !_getTreeNode(addedEntry);
        });

        // Convert entries to JSON objects for jstree
        addedJSON = addedJSON.map(_entryToJSON);

        // Directory contents added
        if (addedJSON.length > 0) {
            var isClosed = $directoryNode.hasClass("jstree-closed");

            // Manually force the directory to open in case it was auto-closed
            // when deleting the files in the removed file set for this event.
            // This starts an async call to load_node/Directory.getContents().
            // We do this to avoid a race condition in jstree create_node where
            // jstree attempts to load empty nodes during the create workflow,
            // resulting in duplicate nodes for the same entry, see
            // https://github.com/adobe/brackets/issues/6474.
            if (wasOpen && isClosed) {
                _projectTree.one("open_node.jstree", function () {
                    _redraw(true);
                });
        
                // Open the node before creating the new child
                _projectTree.jstree("open_node", $directoryNode);
            } else {
                // We can only incrementally create new child nodes when the 
                // DOM node for the directory is not currently empty. The reason
                // is due to the fact that jstree treats empty DOM folders as
                // not-loaded. When jstree sees this, it calls the JSON data
                // provider to populate the DOM, always. Creating a node in this
                // state leads to duplicate nodes. Avoid this by calling load_node
                // instead of create_node.
                var treeAPI = $.jstree._reference(_projectTree),
                    directoryNodeOrRoot = (entry === getProjectRoot()) ? -1 : $directoryNode,
                    hasDOMChildren = treeAPI._get_children(directoryNodeOrRoot).length > 0;
                
                if (hasDOMChildren) {
                    // The directory was already loaded and currently has
                    // children, so we can incrementally create all new nodes
                    // in a batch
                    _createNode($directoryNode, null, addedJSON, true, true);
                } else if (!isClosed) {
                    // Call load_node for the directory to add the new entries
                    // for this change event. We only call load_node immediately
                    // in the case where the empty directory DOM node was
                    // already open. If the directory is currently closed,
                    // jstree will call load_node when the user opens the node
                    // interactively
                    _projectTree.jstree("load_node", $directoryNode, function () {}, function () {
                        console.error("Error loading project tree for changed path: " + entry.fullPath);
                    });
                }
                
                doRedraw = true;
            }
        }
        
        if (doRedraw) {
            _redraw(true);
        }
    };

    /**
     * @private
     * Respond to a FileSystem rename event.
     */
    _fileSystemRename = function (event, oldName, newName) {
        // Tell the document manager about the name change. This will update
        // all of the model information and send notification to all views
        DocumentManager.notifyPathNameChanged(oldName, newName);
    };
    
    
    
    // Initialize variables and listeners that depend on the HTML DOM
    AppInit.htmlReady(function () {
        $projectTreeContainer = $("#project-files-container");
        
        $("#open-files-container").on("contentChanged", function () {
            _redraw(false); // redraw jstree when working set size changes
        });
        
        $(".main-view").click(function (jqEvent) {
            if (jqEvent.target.className !== "jstree-rename-input") {
                forceFinishRename();
            }
        });
        
        $projectTreeContainer.on("contextmenu", function () {
            forceFinishRename();
        });
    });

    /**
     * @private
     * Examine each preference key for migration of project tree states.
     * If the key has a prefix of "projectTreeState_/", then it is a project tree states
     * preference from old preference model.
     *
     * @param {string} key The key of the preference to be examined
     *      for migration of project tree states.
     * @return {?string} - the scope to which the preference is to be migrated
     */
    function _checkPreferencePrefix(key) {
        var pathPrefix = "projectTreeState_",
            projectPath;
        if (key.indexOf(pathPrefix) === 0) {
            // Get the project path from the old preference key by stripping "projectTreeState_".
            projectPath = key.substr(pathPrefix.length);
            return "user project.treeState " + projectPath;
        }
        
        pathPrefix = "projectBaseUrl_";
        if (key.indexOf(pathPrefix) === 0) {
            // Get the project path from the old preference key by stripping "projectBaseUrl_[Directory "
            // and "]".
            projectPath = key.substr(key.indexOf(" ") + 1);
            projectPath = projectPath.substr(0, projectPath.length - 1);
            return "user project.baseUrl " + projectPath;
        }

        return null;
    }
    
    // Init default project path to welcome project
    PreferencesManager.stateManager.definePreference("projectPath", "string", _getWelcomeProjectPath());

    PreferencesManager.convertPreferences(module, {
        "projectPath": "user",
        "projectTreeState_": "user",
        "welcomeProjects": "user",
        "projectBaseUrl_": "user"
    }, true, _checkPreferencePrefix);
    
    // Initialize the sort prefixes and make sure to change them when the sort pref changes
    _generateSortPrefixes();
    PreferencesManager.on("change", "sortDirectoriesFirst", function () {
        if (_generateSortPrefixes()) {
            refreshFileTree();
        }
    });
    
    // Event Handlers
    $(FileViewController).on("documentSelectionFocusChange", _documentSelectionFocusChange);
    $(FileViewController).on("fileViewFocusChange", _fileViewFocusChange);
    $(exports).on("beforeAppClose", _unwatchProjectRoot);
    
    // Commands
    CommandManager.register(Strings.CMD_OPEN_FOLDER,      Commands.FILE_OPEN_FOLDER,      openProject);
    CommandManager.register(Strings.CMD_PROJECT_SETTINGS, Commands.FILE_PROJECT_SETTINGS, _projectSettings);
    CommandManager.register(Strings.CMD_FILE_REFRESH,     Commands.FILE_REFRESH,          refreshFileTree);
    
    // Init invalid characters string 
    if (brackets.platform === "mac") {
        _invalidChars = "?*|:";
    } else if (brackets.platform === "linux") {
        _invalidChars = "?*|/";
    } else {
        _invalidChars = "/?*:<>\\|\"";  // invalid characters on Windows
    }

    // Define public API
    exports.getProjectRoot           = getProjectRoot;
    exports.getBaseUrl               = getBaseUrl;
    exports.setBaseUrl               = setBaseUrl;
    exports.isWithinProject          = isWithinProject;
    exports.makeProjectRelativeIfPossible = makeProjectRelativeIfPossible;
    exports.shouldShow               = shouldShow;
    exports.isBinaryFile             = isBinaryFile;
    exports.openProject              = openProject;
    exports.getSelectedItem          = getSelectedItem;
    exports.getInitialProjectPath    = getInitialProjectPath;
    exports.isWelcomeProjectPath     = isWelcomeProjectPath;
    exports.updateWelcomeProjectPath = updateWelcomeProjectPath;
    exports.createNewItem            = createNewItem;
    exports.renameItemInline         = renameItemInline;
    exports.deleteItem               = deleteItem;
    exports.forceFinishRename        = forceFinishRename;
    exports.showInTree               = showInTree;
    exports.refreshFileTree          = refreshFileTree;
    exports.getAllFiles              = getAllFiles;
    exports.getLanguageFilter        = getLanguageFilter;
});
