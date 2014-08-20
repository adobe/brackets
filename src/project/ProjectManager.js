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
        EditorManager       = require("editor/EditorManager"),
        ProjectModel        = require("project/ProjectModel"),
        FileTreeView        = require("project/FileTreeView");
    
    
    /**
     * @private
     * Filename to use for project settings files.
     * @type {string}
     */
    var SETTINGS_FILENAME = "." + PreferencesManager.SETTINGS_FILENAME;

    /**
     * Name of the preferences for sorting directories first
     * 
     * @type {string}
     */
    var SORT_DIRECTORIES_FIRST = "sortDirectoriesFirst";

    /**
     * @private
     * A string containing all invalid characters for a specific platform.
     * This will be used to construct a regular expression for checking invalid filenames.
     * When a filename with one of these invalid characters are detected, then it is 
     * also used to substitute the place holder of the error message.
     */
    var _invalidChars;

    var _exclusionListRegEx = /\.pyc$|^\.git$|^\.gitmodules$|^\.svn$|^\.DS_Store$|^Thumbs\.db$|^\.hg$|^CVS$|^\.hgtags$|^\.idea$|^\.c9revisions$|^\.sass-cache$|^\.SyncArchive$|^\.SyncID$|^\.SyncIgnore$|\~$/;

    /**
     * @private
     * Forward declaration for the _fileSystemChange and _fileSystemRename functions to make JSLint happy.
     */
    var _fileSystemChange,
        _fileSystemRename;

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
     * Internal flag to suppress firing of selectionChanged event.
     * @type {boolean}
     */
    var _suppressSelectionChange = false;
    
    /**
     * @private
     * RegEx to validate if a filename is not allowed even if the system allows it.
     * This is done to prevent cross-platform issues.
     */
            
    var _illegalFilenamesRegEx = /^(\.+|com[1-9]|lpt[1-9]|nul|con|prn|aux|)$|\.+$/i;
    
    var suppressToggleOpen = false;
    
    var viewModel = new FileTreeView.ViewModel(),
        model = new ProjectModel.ProjectModel();
    
    var _renderTree;
    
    function Dispatcher(model, viewModel) {
        this.model = model;
        this.viewModel = viewModel;
        this._bindEvents();
    }
    
    Dispatcher.prototype._bindEvents = function () {
        this.viewModel.on(FileTreeView.CHANGE, function () {
            _renderTree();
        });
    };
    
    Dispatcher.prototype.toggleDirectory = function (path) {
        this.viewModel.toggleDirectory(path).then(_savePreferences);
    };
    
    Dispatcher.prototype.setSelected = function (path) {
        this.performRename();
        this.viewModel._setSelected(path);
        if (path && path[path.length - 1] !== "/") {
            var openResult = FileViewController.openAndSelectDocument(path, FileViewController.PROJECT_MANAGER);
        }
    };
    
    Dispatcher.prototype.selectInWorkingSet = function (path) {
        this.performRename();
        FileViewController.addToWorkingSetAndSelect(path);
    };
    
    Dispatcher.prototype.setContext = function (path) {
        this.performRename();
        this.viewModel._setContext(path);
    };
    
    Dispatcher.prototype.startRename = function (path) {
        if (!path) {
            path = this.viewModel._lastContext;
        }
        this.viewModel._setRename(path);
    };
    
    Dispatcher.prototype.setRenameValue = function (path) {
        this.viewModel._setRenameValue(path);
    };
    
    Dispatcher.prototype.cancelRename = function () {
        this.viewModel._setRename(null);
    };
    
    Dispatcher.prototype.performRename = function () {
        var oldPath = this.viewModel._lastRename;
        if (!oldPath) {
            return;
        }
        var newPath = this.viewModel._renameTo;
        renameItem(oldPath, newPath);
        this.viewModel._setRename(null);
    };
    
    Dispatcher.prototype.setSortDirectoriesFirst = function (sortDirectoriesFirst) {
        this.viewModel.setSortDirectoriesFirst(sortDirectoriesFirst);
    };
    
    Dispatcher.prototype.refresh = function () {
        this.viewModel.refresh();
    };
    
    var dispatcher = new Dispatcher(model, viewModel);
    
    /**
     * @private
     * @type {Number}
     * Tracks the timeoutID for mouseup events.
     */
    var _mouseupTimeoutId = null;

    /**
     * Returns the File or Directory corresponding to the item selected in the sidebar panel, whether in
     * the file tree OR in the working set; or null if no item is selected anywhere in the sidebar.
     * May NOT be identical to the current Document - a folder may be selected in the sidebar, or the sidebar may not
     * have the current document visible in the tree & working set.
     * @return {?(File|Directory)}
     */
    function getSelectedItem() {
        // Prefer file tree context, then selection, else use working set
        var selectedEntry = viewModel.getContext();
        if (!selectedEntry) {
            selectedEntry = viewModel.getSelected();
        }
        if (!selectedEntry) {
            var doc = DocumentManager.getCurrentDocument();
            selectedEntry = (doc && doc.file);
        }
        return selectedEntry;
    }
    
    /**
     * @private
     */
    function _hasFileSelectionFocus() {
        return FileViewController.getFileSelectionFocus() === FileViewController.PROJECT_MANAGER;
    }

    function _fileViewControllerChange() {
        if (!_hasFileSelectionFocus()) {
            dispatcher.setSelected(null);
        }
    }
    
    /**
     * Returns the root folder of the currently loaded project, or null if no project is open (during
     * startup, or running outside of app shell).
     * @return {Directory}
     */
    function getProjectRoot() {
        return model.projectRoot;
    }
    
    function _setProjectRoot(rootEntry) {
        model.projectRoot = rootEntry;
        model._resetCache();  // invalidate getAllFiles() cache as soon as _projectRoot changes
        viewModel.setProjectRoot(rootEntry).then(_reopenNodes);
    }

    /**
     * Returns the encoded Base URL of the currently loaded project, or empty string if no project
     * is open (during startup, or running outside of app shell).
     * @return {String}
     */
    function getBaseUrl() {
        return model.projectBaseUrl;
    }

    /**
     * Sets the encoded Base URL of the currently loaded project.
     * @param {String}
     */
    function setBaseUrl(projectBaseUrl) {
        var context = { location : { scope: "user",
                                     layer: "project",
                                     layerID: model.projectRoot.fullPath} };
        
        projectBaseUrl = model.setBaseUrl(projectBaseUrl);

        PreferencesManager.setViewState("project.baseUrl", projectBaseUrl, context);
    }
    
    /**
     * Returns true if absPath lies within the project, false otherwise.
     * Does not support paths containing ".."
     * @param {string|FileSystemEntry} absPathOrEntry
     * @return {boolean}
     */
    function isWithinProject(absPathOrEntry) {
        return model.isWithinProject(absPathOrEntry);
    }
    
    /**
     * If absPath lies within the project, returns a project-relative path. Else returns absPath
     * unmodified.
     * Does not support paths containing ".."
     * @param {!string} absPath
     * @return {!string}
     */
    function makeProjectRelativeIfPossible(absPath) {
        return model.makeProjectRelativeIfPossible(absPath);
    }
    
    function _getProjectViewStateContext() {
        return { location : { scope: "user",
                             layer: "project",
                             layerID: model.projectRoot.fullPath } };
    }
    
    /**
     * @private
     * Save ProjectManager project path and tree state.
     */
    function _savePreferences() {
        var context = _getProjectViewStateContext();

        // save the current project
        PreferencesManager.setViewState("projectPath", model.projectRoot.fullPath);
        
        var openNodes = viewModel._getOpenNodes();
        
        // Store the open nodes by their full path and persist to storage
        PreferencesManager.setViewState("project.treeState", openNodes, context);
    }
    
    function _reopenNodes() {
        return viewModel._reopenNodes(PreferencesManager.getViewState("project.treeState", _getProjectViewStateContext()));
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
     * @deprecated Use LanguageManager.getLanguageForPath(fullPath).isBinary()
     * Returns true if fileName's extension doesn't belong to binary (e.g. archived)
     * @param {string} fileName
     * @return {boolean}
     */
    function isBinaryFile(fileName) {
        DeprecationWarning.deprecationWarning("ProjectManager.isBinaryFile() called for " + fileName + ". Use LanguageManager.getLanguageForPath(fileName).isBinary() instead.");
        return LanguageManager.getLanguageForPath(fileName).isBinary();
    }
    
    /** 
     * @private
     * 
     * Returns the full path to the welcome project, which we open on first launch.
     * 
     * @param {string} sampleUrl URL for getting started project
     * @param {string} initialPath Path to Brackets directory (see FileUtils.getNativeBracketsDirectoryPath())
     * @return {!string} fullPath reference
     */
    function _getWelcomeProjectPath() {
        return ProjectModel._getWelcomeProjectPath(Urls.GETTING_STARTED, FileUtils.getNativeBracketsDirectoryPath());
    }
    
    /**
     * Adds the path to the list of welcome projects we've ever seen, if not on the list already.
     * 
     * @param {string} path Path to possibly add
     */
    function addWelcomeProjectPath(path) {
        var welcomeProjects = ProjectModel.addWelcomeProjectPath(path,
                                                                 PreferencesManager.getViewState("welcomeProjects"));
        PreferencesManager.setViewState("welcomeProjects", welcomeProjects);
    }


    /**
     * Returns true if the given path is the same as one of the welcome projects we've previously opened,
     * or the one for the current build.
     * 
     * @param {string} path Path to check to see if it's a welcome project path
     * @return {boolean} true if this is a welcome project path
     */
    function isWelcomeProjectPath(path) {
        return ProjectModel._isWelcomeProjectPath(path, _getWelcomeProjectPath(), PreferencesManager.getViewState("welcomeProjects"));
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
    
    _renderTree = function () {
        var projectRoot = getProjectRoot();
        if (!projectRoot) {
            return;
        }
        FileTreeView.render($projectTreeContainer[0], viewModel, dispatcher);
        return new $.Deferred().resolve();
    };

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

        FileSystem.watch(FileSystem.getDirectoryForPath(rootPath), ProjectModel._shouldShowName, function (err) {
            if (err === FileSystemError.TOO_MANY_ENTRIES) {
                _showErrorDialog(ERR_TYPE_MAX_FILES);
            } else if (err) {
                console.error("Error watching project root: ", rootPath, err);
            }
        });
        
        // Reset allFiles cache
        model._resetCache();
    }

        
    /**
     * @private
     * Close the file system and remove listeners.
     * @return {$.Promise} A promise that's resolved when the root is unwatched. Rejected if
     *     there is no project root or if the unwatch fails.
     */
    function _unwatchProjectRoot() {
        var result = new $.Deferred();
        if (!model.projectRoot) {
            result.reject();
        } else {
            FileSystem.off("change", _fileSystemChange);
            FileSystem.off("rename", _fileSystemRename);

            FileSystem.unwatch(model.projectRoot, function (err) {
                if (err) {
                    console.error("Error unwatching project root: ", model.projectRoot.fullPath, err);
                    result.reject();
                } else {
                    result.resolve();
                }
            });
            
            // Reset allFiles cache
            model.resetCache();
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

        // Some legacy code calls this API with a non-canonical path
        rootPath = ProjectModel._ensureTrailingSlash(rootPath);
        
        if (isUpdating) {
            // We're just refreshing. Don't need to unwatch the project root, so we can start loading immediately.
            startLoad.resolve();
        } else {
            if (model.projectRoot && model.projectRoot.fullPath === rootPath) {
                return (new $.Deferred()).resolve().promise();
            }
            
            // About to close current project (if any)
            if (model.projectRoot) {
                $(exports).triggerHandler("beforeProjectClose", model.projectRoot);
            }
            
            // close all the old files
            DocumentManager.closeAll();
    
            _unwatchProjectRoot().always(function () {
                // Done closing old project (if any)
                if (model.projectRoot) {
                    $(exports).triggerHandler("projectClose", model.projectRoot);
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
            if (!isUpdating) {
                PreferencesManager._stateProjectLayer.setProjectPath(rootPath);
            }
            
            // Populate file tree as long as we aren't running in the browser
            if (!brackets.inBrowser) {
                if (!isUpdating) {
                    _watchProjectRoot(rootPath);
                }
                // Point at a real folder structure on local disk
                var rootEntry = FileSystem.getDirectoryForPath(rootPath);
                rootEntry.exists(function (err, exists) {
                    if (exists) {
                        var projectRootChanged = (!model.projectRoot || !rootEntry) ||
                            model.projectRoot.fullPath !== rootEntry.fullPath;
                        var i;
                        
                        // Success!
                        var perfTimerName = PerfUtils.markStart("Load Project: " + rootPath);
                        
                        _setProjectRoot(rootEntry);
                        model.setBaseUrl(PreferencesManager.getViewState("project.baseUrl", context) || "");

                        if (projectRootChanged) {
                            _reloadProjectPreferencesScope();
                            PreferencesManager._setCurrentEditingFile(rootPath);
                        }

                        // If this is the most current welcome project, record it. In future launches, we want
                        // to substitute the latest welcome project from the current build instead of using an
                        // outdated one (when loading recent projects or the last opened project).
                        if (rootPath === _getWelcomeProjectPath()) {
                            addWelcomeProjectPath(rootPath);
                        }

                        if (projectRootChanged) {
                            // Allow asynchronous event handlers to finish before resolving result by collecting promises from them
                            var promises = [];
                            $(exports).triggerHandler({ type: "projectOpen", promises: promises }, [model.projectRoot]);
                            $.when.apply($, promises).then(result.resolve, result.reject);
                        } else {
                            $(exports).triggerHandler("projectRefresh", model.projectRoot);
                            result.resolve();
                        }
                        PerfUtils.addMeasurement(perfTimerName);
                    } else {
                        _showErrorDialog(ERR_TYPE_LOADING_PROJECT_NATIVE, null, rootPath, err || FileSystemError.NOT_FOUND)
                            .done(function () {
                                // Reset _projectRoot to null so that the following _loadProject call won't 
                                // run the 'beforeProjectClose' event a second time on the original project, 
                                // which is now partially torn down (see #6574).
                                model.projectRoot = null;

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
        return viewModel._refresh();
    }
    
    /**
     * Expands tree nodes to show the given file or folder and selects it. Silently no-ops if the
     * path lies outside the project, or if it doesn't exist.
     *
     * @param {!(File|Directory)} entry File or Directory to show
     * @return {$.Promise} Resolved when done; or rejected if not found
     */
    function showInTree(entry) {
        var deferred = new $.Deferred();
        viewModel.setSelected(entry);
        // TODO we may need to do some work to ensure that this has actually been expanded
        deferred.resolve();
        return deferred.promise();
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
                    FileSystem.showOpenDialog(false, true, Strings.CHOOSE_FOLDER, model.projectRoot.fullPath, null, function (err, files) {
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
        if (ProjectModel.isValidFilename(filename, _invalidChars)) {
            _showErrorDialog(ERR_TYPE_INVALID_FILENAME, isFolder, _invalidChars);
            return false;
        }
        return true;
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
        // TODO fixme
        
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
     * Delete file or directore from project
     * @param {!(File|Directory)} entry File or Directory to delete
     */
    function deleteItem(entry) {
        var result = new $.Deferred();

        entry.moveToTrash(function (err) {
            if (!err) {
                // TODO notify the model
                result.resolve();
            } else {
                _showErrorDialog(ERR_TYPE_DELETE, entry.isDirectory, FileUtils.getFileErrorString(err), entry.fullPath);
    
                result.reject(err);
            }
        });

        return result.promise();
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
        model._resetCache();

        // A whole-sale change event; refresh the entire file tree
        if (!entry) {
            refreshFileTree();
            return;
        }
        
        // Ignore change event when: the entry is not a directory, the directory
        // was not yet rendered or the directory is outside the current project
        if (!entry.isDirectory || !isWithinProject(entry.fullPath)) {
            return;
        }
        
        // If there is a change event with unknown added and removed sets
        // just refresh the tree.
        // 
        // TODO: in the former case we really should just refresh the affected
        // directory instead of refreshing the entire tree.
        // TODO: new implementation this should likely just update the model
        if (!added || !removed) {
            refreshFileTree();
            return;
        }
        
        
        refreshFileTree();
        return;
        // TODO probably need to move the isOpen check up before updating the model
        var wasOpen = viewModel.isOpen(entry);
        
        // Directory contents removed
        if (removed.length > 0) {
            // Synchronously remove all tree nodes
            // TODO this is just a model update
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
    
    function forceFinishRename() {
        dispatcher.performRename();
    }
    
    
    // Initialize variables and listeners that depend on the HTML DOM
    AppInit.htmlReady(function () {
        $projectTreeContainer = $("#project-files-container");
        
        $("#open-files-container").on("contentChanged", function () {
            _renderTree(); // redraw jstree when working set size changes
        });
        
        $(".main-view").click(function (jqEvent) {
            if (jqEvent.target.className !== "rename-input") {
                forceFinishRename();
            }
        });
        
        $(Menus.getContextMenu(Menus.ContextMenuIds.PROJECT_MENU)).on("beforeContextMenuClose", function () {
            dispatcher.setContext(null);
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
    
    function _reloadProjectPreferencesScope() {
        var root = getProjectRoot();
        if (root) {
            // Alias the "project" Scope to the path Scope for the project-level settings file
            PreferencesManager._setProjectSettingsFile(root.fullPath + SETTINGS_FILENAME);
        } else {
            PreferencesManager._setProjectSettingsFile();
        }
    }
    
    $(exports).on("projectOpen", _reloadProjectPreferencesScope);

    // Event Handlers
    $(FileViewController).on("documentSelectionFocusChange", _fileViewControllerChange);
    $(FileViewController).on("fileViewFocusChange", _fileViewControllerChange);
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
    
    // Define the preference to decide how to sort the Project Tree files
    PreferencesManager.definePreference(SORT_DIRECTORIES_FIRST, "boolean", brackets.platform !== "mac")
        .on("change", function () {
            dispatcher.setSortDirectoriesFirst(PreferencesManager.get(SORT_DIRECTORIES_FIRST));
        });
    
    function getContext() {
        var context = viewModel._lastContext;
        if (context) {
            context = FileSystem.getFileForPath(context);
        }
        return context;
    }
    
    function renameItemInline() {
        dispatcher.startRename();
    }
    
    function getAllFiles() {
        return model.getAllFiles();
    }

    // Define public API
    exports.getProjectRoot           = getProjectRoot;
    exports.getBaseUrl               = getBaseUrl;
    exports.setBaseUrl               = setBaseUrl;
    exports.isWithinProject          = isWithinProject;
    exports.makeProjectRelativeIfPossible = makeProjectRelativeIfPossible;
    exports.shouldShow               = ProjectModel.shouldShow;
    exports.isBinaryFile             = isBinaryFile;
    exports.openProject              = openProject;
    exports.getSelectedItem          = getSelectedItem;
    exports.getContext               = getContext;
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
    exports.dispatcher               = dispatcher;
});
