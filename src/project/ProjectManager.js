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
 *    - beforeProjectClose -- before _projectRoot changes
 *    - beforeAppClose     -- before Brackets quits entirely
 *    - projectOpen        -- after _projectRoot changes and the tree is re-rendered
 *    - projectRefresh     -- when project tree is re-rendered for a reason other than
 *                            a project being opened (e.g. from the Refresh command)
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
    
    
    /**
     * @private
     * Forward declaration for the _fileSystemChange and _fileSystemRename functions to make JSLint happy.
     */
    var _fileSystemChange,
        _fileSystemRename;
    
    /**
     * @private
     * File and folder names which are not displayed or searched
     * TODO: We should add the rest of the file names that TAR excludes:
     *    http://www.gnu.org/software/tar/manual/html_section/exclude.html
     * @type {RegExp}
     */
    var _exclusionListRegEx = /\.pyc$|^\.git$|^\.gitignore$|^\.gitmodules$|^\.svn$|^\.DS_Store$|^Thumbs\.db$|^\.hg$|^CVS$|^\.cvsignore$|^\.gitattributes$|^\.hgtags$|^\.c9revisions|^\.SyncArchive|^\.SyncID|^\.SyncIgnore|^\.hgignore$/;

    /**
     * @private
     * File names which are not showed in quick open dialog
     * @type {RegExp}
     */
    var _binaryExclusionListRegEx = /\.svgz$|\.jsz$|\.zip$|\.gz$|\.htmz$|\.htmlz$|\.rar$|\.tar$|\.exe$|\.bin$/;

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
     */
    var _projectRoot = null;

    /**
     * @private
     * Encoded URL
     * @ see getBaseUrl(), setBaseUrl()
     */
    var _projectBaseUrl = "";
    
    /**
     * @private
     * @type {PreferenceStorage}
     */
    var _prefs = null;

    /**
     * @private
     * Used to initialize jstree state
     */
    var _projectInitialLoad = null;
    
    /**
     * @private
     * RegEx to validate if a filename is not allowed even if the system allows it.
     * This is done to prevent cross-platform issues.
     */
    var _illegalFilenamesRegEx = /^(\.+|com[1-9]|lpt[1-9]|nul|con|prn|aux)$/i;
    
    var suppressToggleOpen = false;
    
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
     * @private
     */
    function _getBaseUrlKey() {
        return "projectBaseUrl_" + _projectRoot;
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
        _projectBaseUrl = projectBaseUrl;

        // Ensure trailing slash to be consistent with _projectRoot.fullPath
        // so they're interchangable (i.e. easy to convert back and forth)
        if (_projectBaseUrl.length > 0 && _projectBaseUrl[_projectBaseUrl.length - 1] !== "/") {
            _projectBaseUrl += "/";
        }

        _prefs.setValue(_getBaseUrlKey(), _projectBaseUrl);
    }
    
    /**
     * Returns true if absPath lies within the project, false otherwise.
     * Does not support paths containing ".."
     */
    function isWithinProject(absPath) {
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
     * Get prefs tree state lookup key for given project path.
     */
    function _getTreeStateKey(path) {
        // generate unique tree state key for this project path
        var key = "projectTreeState_" + path;

        // normalize to always have slash at end
        if (key[key.length - 1] !== "/") {
            key += "/";
        }
        return key;
    }
    
    /**
     * @private
     * Save ProjectManager project path and tree state.
     */
    function _savePreferences() {
        
        // save the current project
        _prefs.setValue("projectPath", _projectRoot.fullPath);

        // save jstree state
        var openNodes = [],
            projectPathLength = _projectRoot.fullPath.length,
            entry,
            fullPath,
            shortPath,
            depth;

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
        _prefs.setValue(_getTreeStateKey(_projectRoot.fullPath), openNodes);
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
                sort :  function (a, b) {
                    var a1 = $(a).text(),
                        b1 = $(b).text();
                    
                    // Non-mac: prepend folder names with a '0' and file names with a '1' so folders are listed first
                    if (brackets.platform !== "mac") {
                        a1 = ($(a).hasClass("jstree-leaf") ? "1" : "0") + a1;
                        b1 = ($(b).hasClass("jstree-leaf") ? "1" : "0") + b1;
                    }
                    return FileUtils.compareFilenames(a1, b1, false);
                }
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
                            
                            if (curDoc.file.fullPath.indexOf(entry.fullPath) === 0) {
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
            );

        // jstree has a default event handler for dblclick that attempts to clear the
        // global window selection (presumably because it doesn't want text within the tree
        // to be selected). This ends up messing up CodeMirror, and we don't need this anyway
        // since we've turned off user selection of UI text globally. So we just unbind it,
        // and add our own double-click handler here.
        // Filed this bug against jstree at https://github.com/vakata/jstree/issues/163
        _projectTree.bind("init.jstree", function () {
            // install scroller shadows
            ViewUtils.addScrollerShadow(_projectTree.get(0));
            
            _projectTree
                .unbind("dblclick.jstree")
                .bind("dblclick.jstree", function (event) {
                    var entry = $(event.target).closest("li").data("entry");
                    if (entry && entry.isFile && !_isInRename(event.target)) {
                        FileViewController.addToWorkingSetAndSelect(entry.fullPath);
                    }
                });

            // fire selection changed events for sidebar-selection
            $projectTreeList = $projectTreeContainer.find("ul");
            ViewUtils.sidebarList($projectTreeContainer, "jstree-clicked", "jstree-leaf");
            $projectTreeContainer.show();
        });

        return Async.withTimeout(result.promise(), 1000);
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
     * @param {string} fileName
     * @return {boolean}
     */
    function isBinaryFile(fileName) {
        return fileName.match(_binaryExclusionListRegEx);
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
            entry = entries[entryI];
            
            if (shouldShow(entry)) {
                jsonEntry = {
                    data: entry.name,
                    attr: { id: "node" + _projectInitialLoad.id++ },
                    metadata: { entry: entry }
                };

                if (entry.isDirectory) {
                    jsonEntry.children = [];
                    jsonEntry.state = "closed";
                } else {
                    jsonEntry.data = ViewUtils.getFileEntryDisplay(entry);
                }
    
                // For more info on jsTree's JSON format see: http://www.jstree.com/documentation/json_data
                jsonEntryList.push(jsonEntry);
    
                // Map path to ID to initialize loaded and opened states
                _projectInitialLoad.fullPathToIdMap[entry.fullPath] = jsonEntry.attr.id;
            }
        }
        return jsonEntryList;
    }

    /**
     * @private
     * Called by jsTree when the user has expanded a node that has never been expanded before. We call
     * jsTree back asynchronously with the node's immediate children data once the subfolder is done
     * being fetched.
     *
     * @param {jQueryObject} treeNode  jQ object for the DOM node being expanded
     * @param {function(Array)} jsTreeCallback  jsTree callback to provide children to
     */
    function _treeDataProvider(treeNode, jsTreeCallback) {
        var dirEntry, isProjectRoot = false, deferred = new $.Deferred();
        
        function processEntries(entries) {
            var subtreeJSON = _convertEntriesToJSON(entries),
                wasNodeOpen = false,
                emptyDirectory = (subtreeJSON.length === 0);
            
            if (emptyDirectory) {
                if (!isProjectRoot) {
                    wasNodeOpen = treeNode.hasClass("jstree-open");
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
                
                treeNode.removeClass("jstree-leaf jstree-closed jstree-open")
                    .addClass(classToAdd);
                
                // This is a workaround for a part of issue #2085, where the file creation process
                // depends on the open_node.jstree event being triggered, which doesn't happen on
                // empty folders
                if (!wasNodeOpen) {
                    treeNode.trigger("open_node.jstree");
                }
            }
            
            deferred.resolve();
        }

        if (treeNode === -1) {
            // Special case: root of tree
            dirEntry = _projectRoot;
            isProjectRoot = true;
        } else {
            // All other nodes: the Directory is saved as jQ data in the tree (by _convertEntriesToJSON())
            dirEntry = treeNode.data("entry");
        }
        
        // Fetch dirEntry's contents
        dirEntry.getContents(function (err, contents, stats, statsErrs) {
            if (err) {
                Dialogs.showModalDialog(
                    DefaultDialogs.DIALOG_ID_ERROR,
                    Strings.ERROR_LOADING_PROJECT,
                    StringUtils.format(
                        Strings.READ_DIRECTORY_ENTRIES_ERROR,
                        StringUtils.breakableUrl(dirEntry.fullPath),
                        err
                    )
                );
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
        var welcomeProjects = _prefs.getValue("welcomeProjects") || [];
        return welcomeProjects.indexOf(pathNoSlash) !== -1;
    }
    
    /**
     * Adds the path to the list of welcome projects we've ever seen, if not on the list already.
     */
    function addWelcomeProjectPath(path) {
        var pathNoSlash = FileUtils.stripTrailingSlash(path);  // "welcomeProjects" pref has standardized on no trailing "/"
        
        var welcomeProjects = _prefs.getValue("welcomeProjects") || [];
        if (welcomeProjects.indexOf(pathNoSlash) === -1) {
            welcomeProjects.push(pathNoSlash);
            _prefs.setValue("welcomeProjects", welcomeProjects);
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
        return updateWelcomeProjectPath(_prefs.getValue("projectPath"));
    }
    
    /**
     * Error dialog when max files in index is hit
     * @return {Dialog}
     */
    function _showMaxFilesDialog() {
        return Dialogs.showModalDialog(
            DefaultDialogs.DIALOG_ID_ERROR,
            Strings.ERROR_MAX_FILES_TITLE,
            Strings.ERROR_MAX_FILES
        );
    }
    
    function _watchProjectRoot(rootPath) {
        FileSystem.on("change", _fileSystemChange);
        FileSystem.on("rename", _fileSystemRename);

        FileSystem.watch(FileSystem.getDirectoryForPath(rootPath), _shouldShowName, function (err) {
            if (err === FileSystemError.TOO_MANY_ENTRIES) {
                _showMaxFilesDialog();
            } else if (err) {
                console.error("Error watching project root: ", rootPath, err);
            }
        });
    }

        
    /**
     * @private
     * Close the file system and remove listeners.
     */
    function _unwatchProjectRoot() {
        if (_projectRoot) {
            FileSystem.off("change", _fileSystemChange);
            FileSystem.off("rename", _fileSystemRename);

            FileSystem.unwatch(_projectRoot, function (err) {
                if (err) {
                    console.error("Error unwatching project root: ", _projectRoot.fullPath, err);
                }
            });
        }
    }
    
    /**
     * Loads the given folder as a project. Normally, you would call openProject() instead to let the
     * user choose a folder.
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
        forceFinishRename();    // in case we're in the middle of renaming a file in the project
        
        // Some legacy code calls this API with a non-canonical path
        rootPath = _ensureTrailingSlash(rootPath);
        
        if (!isUpdating) {
            if (_projectRoot && _projectRoot.fullPath === rootPath) {
                return (new $.Deferred()).resolve().promise();
            }
            if (_projectRoot) {
                // close current project
                $(exports).triggerHandler("beforeProjectClose", _projectRoot);
            }
            
            // close all the old files
            DocumentManager.closeAll();
    
            _unwatchProjectRoot();
        }
        
        // Clear project path map
        _projectInitialLoad = {
            previous        : [],   /* array of arrays containing full paths to open at each depth of the tree */
            id              : 0,    /* incrementing id */
            fullPathToIdMap : {}    /* mapping of fullPath to tree node id attr */
        };
        
        var result = new $.Deferred(),
            resultRenderTree;

        // restore project tree state from last time this project was open
        _projectInitialLoad.previous = _prefs.getValue(_getTreeStateKey(rootPath)) || [];

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
                    var i;

                    // Success!
                    var perfTimerName = PerfUtils.markStart("Load Project: " + rootPath);

                    _projectRoot = rootEntry;
                    _projectBaseUrl = _prefs.getValue(_getBaseUrlKey()) || "";

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
                    Dialogs.showModalDialog(
                        DefaultDialogs.DIALOG_ID_ERROR,
                        Strings.ERROR_LOADING_PROJECT,
                        StringUtils.format(
                            Strings.REQUEST_NATIVE_FILE_SYSTEM_ERROR,
                            StringUtils.breakableUrl(rootPath),
                            err || FileSystemError.NOT_FOUND
                        )
                    ).done(function () {
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
        return result.promise();
    }
    
    /**
     * Finds the tree node corresponding to the given file/folder (rejected if the path lies
     * outside the project, or if it doesn't exist).
     *
     * @param {!(File|Directory)} entry File or Directory to find
     * @return {$.Promise} Resolved with jQ obj for the jsTree tree node; or rejected if not found
     */
    function _findTreeNode(entry) {
        var result = new $.Deferred();
        
        // If path not within project, ignore
        var projRelativePath = makeProjectRelativeIfPossible(entry.fullPath);
        if (projRelativePath === entry.fullPath) {
            return result.reject().promise();
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
                var nodeName = $(node).data("entry").name;
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
     * Reloads the project's file tree
     * @return {$.Promise} A promise object that will be resolved when the
     *  project tree is reloaded, or rejected if the project path
     *  fails to reload.
     */
    function refreshFileTree() {
        var selectedEntry;
        if (_lastSelected) {
            selectedEntry = _lastSelected.data("entry");
        }
        _lastSelected = null;
        
        return _loadProject(getProjectRoot().fullPath, true)
            .done(function () {
                if (selectedEntry) {
                    _findTreeNode(selectedEntry).done(function (node) {
                        _forceSelection(null, node);
                    });
                }
            });
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
                            Dialogs.showModalDialog(
                                DefaultDialogs.DIALOG_ID_ERROR,
                                Strings.ERROR_LOADING_PROJECT,
                                StringUtils.format(Strings.OPEN_DIALOG_ERROR, err)
                            );
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
     * @param {string} filename
     * @param {boolean} isFolder
     * @return {boolean} Returns true if no illegal characters are found
     */
    function _checkForValidFilename(filename, isFolder) {
        // Validate file name
        // Checks for valid Windows filenames:
        // See http://msdn.microsoft.com/en-us/library/windows/desktop/aa365247(v=vs.85).aspx
        if ((filename.search(/[\/?*:;\{\}<>\\|]+/) !== -1) || filename.match(_illegalFilenamesRegEx)) {
            Dialogs.showModalDialog(
                DefaultDialogs.DIALOG_ID_ERROR,
                StringUtils.format(Strings.INVALID_FILENAME_TITLE, isFolder ? Strings.DIRECTORY : Strings.FILE),
                Strings.INVALID_FILENAME_MESSAGE
            );
            return false;
        }
        return true;
    }
    
    /**
     * Create a new item in the project tree.
     *
     * @param baseDir {string} Full path of the directory where the item should go
     * @param initialName {string} Initial name for the item
     * @param skipRename {boolean} If true, don't allow the user to rename the item
     * @param isFolder {boolean} If true, create a folder instead of a file
     * @return {$.Promise} A promise object that will be resolved with the File
     *  of the created object, or rejected if the user cancelled or entered an illegal
     *  filename.
     */
    function createNewItem(baseDir, initialName, skipRename, isFolder) {
        var node                = null,
            selection           = _projectTree.jstree("get_selected"),
            selectionEntry      = null,
            position            = "inside",
            escapeKeyPressed    = false,
            result              = new $.Deferred(),
            wasNodeOpen         = true;

        // get the File or Directory
        if (selection) {
            selectionEntry = selection.data("entry");
        }

        // move selection to parent Directory
        if (selectionEntry) {
            if (selectionEntry.isFile) {
                position = "after";
                
                var parent = $.jstree._reference(_projectTree)._get_parent(selection);
                
                if (typeof (parent.data) === "function") {
                    // get Entry from tree node
                    // note that the jstree root will return undefined
                    selectionEntry = parent.data("entry");
                } else {
                    // reset here. will be replaced with project root.
                    selectionEntry = null;
                }
            } else if (selectionEntry.isDirectory) {
                wasNodeOpen = selection.hasClass("jstree-open");
            }
        }

        // use the project root Directory
        if (!selectionEntry) {
            selectionEntry = getProjectRoot();
        }

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
                
                result.reject();
            }

            if (!escapeKeyPressed) {
                // Validate file name
                if (!_checkForValidFilename(data.rslt.name, isFolder)) {
                    errorCleanup();
                    return;
                }

                var successCallback = function (entry) {
                    data.rslt.obj.data("entry", entry);
                    if (isFolder) {
                        // If the new item is a folder, remove the leaf and folder related
                        // classes and add "jstree-closed". Selecting the item will open
                        // the folder.
                        data.rslt.obj.removeClass("jstree-leaf jstree-closed jstree-open")
                            .addClass("jstree-closed");
                    }
                    
                    // If the new item is a folder, force a re-sort here. Windows sorts folders
                    // and files separately.
                    if (isFolder) {
                        _projectTree.jstree("sort", data.rslt.obj.parent());
                    }
                    
                    _projectTree.jstree("select_node", data.rslt.obj, true);
                    
                    //If the new item is a file, generate the file display entry.
                    if (!isFolder) {
                        _projectTree.jstree("set_text", data.rslt.obj, ViewUtils.getFileEntryDisplay(entry));
                    }
                    
                    result.resolve(entry);
                };
                
                var errorCallback = function (error, entry) {
                    var entryType = isFolder ? Strings.DIRECTORY : Strings.FILE,
                        oppositeEntryType = isFolder ? Strings.FILE : Strings.DIRECTORY;
                    if (error === FileSystemError.ALREADY_EXISTS) {
                        var useOppositeType = (isFolder === entry.isFile);
                        Dialogs.showModalDialog(
                            DefaultDialogs.DIALOG_ID_ERROR,
                            StringUtils.format(Strings.INVALID_FILENAME_TITLE, entryType),
                            StringUtils.format(Strings.FILE_ALREADY_EXISTS,
                                useOppositeType ? oppositeEntryType : entryType,
                                StringUtils.breakableUrl(data.rslt.name))
                        );
                    } else {
                        var errString = error === FileSystemError.NOT_WRITABLE ?
                                         Strings.NO_MODIFICATION_ALLOWED_ERR :
                                         StringUtils.format(Strings.GENERIC_ERROR, error);

                        Dialogs.showModalDialog(
                            DefaultDialogs.DIALOG_ID_ERROR,
                            StringUtils.format(Strings.ERROR_CREATING_FILE_TITLE, entryType),
                            StringUtils.format(Strings.ERROR_CREATING_FILE, entryType,
                                StringUtils.breakableUrl(data.rslt.name), errString)
                        );
                    }

                    errorCleanup();
                };
                
                var newItemPath = selectionEntry.fullPath + data.rslt.name;
                
                FileSystem.resolve(newItemPath, function (err, item) {
                    if (!err) {
                        // Item already exists, fail with error
                        errorCallback(FileSystemError.ALREADY_EXISTS, item);
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
        
        // TODO (issue #115): Need API to get tree node for baseDir.
        // In the meantime, pass null for node so new item is placed
        // relative to the selection
        node = selection;
 
        function createNode() {
           // Create the node and open the editor
            _projectTree.jstree("create", node, position, {data: initialName}, null, skipRename);
    
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
        }

        // There is a race condition in jstree if "open_node" and "create" are called in rapid
        // succession and the node was not yet loaded. To avoid it, first open the node and wait
        // for the open_node event before trying to create the new one. See #2085 for more details.
        if (wasNodeOpen) {
            createNode();
        } else {
            _projectTree.one("open_node.jstree", createNode);
    
            // Open the node before creating the new child
            _projectTree.jstree("open_node", node);
        }
        
        return result.promise();
    }

    /**
     * Rename a file/folder. This will update the project tree data structures
     * and send notifications about the rename.
     *
     * @prarm {string} oldName Old item name
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
                Dialogs.showModalDialog(
                    DefaultDialogs.DIALOG_ID_ERROR,
                    Strings.ERROR_RENAMING_FILE_TITLE,
                    StringUtils.format(
                        Strings.ERROR_RENAMING_FILE,
                        StringUtils.breakableUrl(newName),
                        err === FileSystemError.ALREADY_EXISTS ?
                                Strings.FILE_EXISTS_ERR :
                                FileUtils.getFileErrorString(err)
                    )
                );
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
            .done(function (selected) {
                // Don't try to rename again if we are already renaming
                if (_isInRename(selected)) {
                    return;
                }
                
                var isFolder = selected.hasClass("jstree-open") || selected.hasClass("jstree-closed");
        
                _projectTree.one("rename.jstree", function (event, data) {
                    // Make sure the file was actually renamed
                    var changed = (data.rslt.old_name !== data.rslt.new_name);
                    
                    var _resetOldFilename = function () {
                        _projectTree.jstree("set_text", selected, ViewUtils.getFileEntryDisplay(entry));
                        _projectTree.jstree("sort", selected.parent());
                    };
                    
                    if (!changed || !_checkForValidFilename(data.rslt.new_name, isFolder)) {
                        // No change or invalid filename. Reset the old name and bail.
                        _resetOldFilename();
                        return;
                    }
                    
                    var oldName = selected.data("entry").fullPath;
                    // Folder paths have to end with a slash. Use look-head (?=...) to only replace the folder's name, not the slash as well
                    
                    var oldNameEndPattern = isFolder ? "(?=\/$)" : "$";
                    var oldNameRegex = new RegExp(StringUtils.regexEscape(data.rslt.old_name) + oldNameEndPattern);
                    var newName = oldName.replace(oldNameRegex, data.rslt.new_name);
                    
                    renameItem(oldName, newName, isFolder)
                        .done(function () {
                            _projectTree.jstree("set_text", selected, ViewUtils.getFileEntryDisplay(entry));
                            
                            // If a folder was renamed, re-select it here, since openAndSelectDocument()
                            // changed the selection.
                            if (isFolder) {
                                var oldSuppressToggleOpen = suppressToggleOpen;
                                
                                // Supress the open/close toggle
                                suppressToggleOpen = true;
                                _projectTree.jstree("select_node", selected, true);
                                suppressToggleOpen = oldSuppressToggleOpen;
                            }
                        })
                        .fail(function (err) {
                            // Error during rename. Reset to the old name and alert the user.
                            _resetOldFilename();
                        });
                });
                
                // since html_titles are enabled, we have to reset the text without markup
                _projectTree.jstree("set_text", selected, entry.name);
                _projectTree.jstree("rename");
            });
        // No fail handler: silently no-op if file doesn't exist in tree
    }

    /**
     * Delete file or directore from project
     * @param {!(File|Directory)} entry File or Directory to delete
     */
    function deleteItem(entry) {
        var result = new $.Deferred();

        entry.moveToTrash(function (err) {
            if (!err) {
                _findTreeNode(entry).done(function ($node) {
                    _projectTree.one("delete_node.jstree", function () {
                        // When a node is deleted, the previous node is automatically selected.
                        // This works fine as long as the previous node is a file, but doesn't 
                        // work so well if the node is a folder
                        var sel     = _projectTree.jstree("get_selected"),
                            entry   = sel ? sel.data("entry") : null;
                        
                        if (entry && entry.isDirectory) {
                            // Make sure it didn't turn into a leaf node. This happens if
                            // the only file in the directory was deleted
                            if (sel.hasClass("jstree-leaf")) {
                                sel.removeClass("jstree-leaf jstree-open");
                                sel.addClass("jstree-closed");
                            }
                        }
                    });
                    var oldSuppressToggleOpen = suppressToggleOpen;
                    suppressToggleOpen = true;
                    _projectTree.jstree("delete_node", $node);
                    suppressToggleOpen = oldSuppressToggleOpen;
                });
                
                if (DocumentManager.getCurrentDocument()) {
                    DocumentManager.notifyPathDeleted(entry.fullPath);
                } else {
                    EditorManager.notifyPathDeleted(entry.fullPath);
                }
    
                _redraw(true);
                result.resolve();
            } else {
                // Show an error alert
                Dialogs.showModalDialog(
                    Dialogs.DIALOG_ID_ERROR,
                    Strings.ERROR_DELETING_FILE_TITLE,
                    StringUtils.format(
                        Strings.ERROR_DELETING_FILE,
                        _.escape(entry.fullPath),
                        FileUtils.getFileErrorString(err)
                    )
                );
    
                result.reject(err);
            }
        });

        return result.promise();
    }
    
    /**
     * Returns an Array of all files for this project, optionally including
     * files in the working set that are *not* under the project root. Files filtered
     * out by shouldShow() OR isBinaryFile() are excluded.
     *
     * @param {function (File, number):boolean=} filter Optional function to filter
     *          the file list (does not filter directory traversal). API matches Array.filter().
     * @param {boolean=} includeWorkingSet If true, include files in the working set
     *          that are not under the project root (*except* for untitled documents).
     *
     * @return {$.Promise} Promise that is resolved with an Array of File objects.
     */
    function getAllFiles(filter, includeWorkingSet) {
        var deferred = new $.Deferred(),
            result = [];
        
        // The filter and includeWorkingSet params are both optional.
        // Handle the case where filter is omitted but includeWorkingSet is
        // specified.
        if (includeWorkingSet === undefined && typeof (filter) !== "function") {
            includeWorkingSet = filter;
            filter = null;
        }

        
        function visitor(entry) {
            if (entry.isFile && !isBinaryFile(entry.name)) {
                result.push(entry);
            }
            
            return true;
        }
        
        // First gather all files in project proper
        getProjectRoot().visit(visitor, function (err) {
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
            
            deferred.resolve(result);
        });
        
        return deferred.promise();
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
     * Respond to a FileSystem change event.
     */
    _fileSystemChange = function (event, item) {
        // TODO: Refresh file tree too - once watchers are precise enough to notify only
        // when real changes occur, instead of on every window focus!
        
        FileSyncManager.syncOpenDocuments();
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

    // Init PreferenceStorage
    var defaults = {
        projectPath:      _getWelcomeProjectPath()  /* initialize to welcome project */
    };
    _prefs = PreferencesManager.getPreferenceStorage(module, defaults);

    // Event Handlers
    $(FileViewController).on("documentSelectionFocusChange", _documentSelectionFocusChange);
    $(FileViewController).on("fileViewFocusChange", _fileViewFocusChange);
    $(exports).on("beforeAppClose", _unwatchProjectRoot);
    
    // Commands
    CommandManager.register(Strings.CMD_OPEN_FOLDER,      Commands.FILE_OPEN_FOLDER,      openProject);
    CommandManager.register(Strings.CMD_PROJECT_SETTINGS, Commands.FILE_PROJECT_SETTINGS, _projectSettings);
    CommandManager.register(Strings.CMD_FILE_REFRESH,     Commands.FILE_REFRESH, refreshFileTree);
    
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
