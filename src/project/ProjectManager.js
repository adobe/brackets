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
 *    - projectOpen        -- after  _projectRoot changes
 *    - projectFilesChange -- sent if one of the project files has changed--
 *                            added, removed, renamed, etc.
 *
 * These are jQuery events, so to listen for them you do something like this:
 *    $(ProjectManager).on("eventname", handler);
 */
define(function (require, exports, module) {
    "use strict";

    require("utils/Global");
    
    // Load dependent non-module scripts
    require("thirdparty/jstree_pre1.0_fix_1/jquery.jstree");

    // Load dependent modules
    var AppInit             = require("utils/AppInit"),
        NativeFileSystem    = require("file/NativeFileSystem").NativeFileSystem,
        PreferencesDialogs  = require("preferences/PreferencesDialogs"),
        PreferencesManager  = require("preferences/PreferencesManager"),
        DocumentManager     = require("document/DocumentManager"),
        CommandManager      = require("command/CommandManager"),
        Commands            = require("command/Commands"),
        Dialogs             = require("widgets/Dialogs"),
        Menus               = require("command/Menus"),
        StringUtils         = require("utils/StringUtils"),
        Strings             = require("strings"),
        FileViewController  = require("project/FileViewController"),
        PerfUtils           = require("utils/PerfUtils"),
        ViewUtils           = require("utils/ViewUtils"),
        CollectionUtils     = require("utils/CollectionUtils"),
        FileUtils           = require("file/FileUtils"),
        NativeFileError     = require("file/NativeFileError"),
        Urls                = require("i18n!nls/urls"),
        KeyEvent            = require("utils/KeyEvent");
    
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
    
    function canonicalize(path) {
        if (path.length > 0 && path[path.length - 1] === "/") {
            return path.slice(0, -1);
        } else {
            return path;
        }
    }
    
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
     * Unique PreferencesManager clientID
     */
    var PREFERENCES_CLIENT_ID = "com.adobe.brackets.ProjectManager";
    
    /**
     * @private
     * @type {PreferenceStorage}
     */
    var _prefs = null;

    /**
     * @private
     * Used to initialize jstree state
     */
    var _projectInitialLoad = {
        previous        : [],   /* array of arrays containing full paths to open at each depth of the tree */
        id              : 0,    /* incrementing id */
        fullPathToIdMap : {}    /* mapping of fullPath to tree node id attr */
    };
    
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
            $projectTreeContainer.triggerHandler("scroll");
            
            // in-lieu of resize events, manually trigger contentChanged for every
            // FileViewController focus change. This event triggers scroll shadows
            // on the jstree to update. documentSelectionFocusChange fires when
            // a new file is added and removed (causing a new selection) from the working set
            _projectTree.triggerHandler("contentChanged");
        }
    }
    
    /**
     * Returns the FileEntry or DirectoryEntry corresponding to the selected item, or null
     * if no item is selected.
     *
     * @return {?Entry}
     */
    function getSelectedItem() {
        var selected = _projectTree.jstree("get_selected");
        if (selected) {
            return selected.data("entry");
        }
        return null;
    }

    function _fileViewFocusChange() {
        _redraw(true);
    }
    
    function _documentSelectionFocusChange() {
        var curDoc = DocumentManager.getCurrentDocument();
        if (curDoc && _hasFileSelectionFocus()) {
            $("#project-files-container li").is(function (index) {
                var entry = $(this).data("entry");
                if (entry && entry.fullPath === curDoc.file.fullPath && !_projectTree.jstree("is_selected", $(this))) {
                    //we don't want to trigger another selection change event, so manually deselect
                    //and select without sending out notifications
                    _projectTree.jstree("deselect_all");
                    _projectTree.jstree("select_node", $(this), false);
                    return true;
                }
                return false;
            });
        } else if (_projectTree !== null) {
            _projectTree.jstree("deselect_all");
            _lastSelected = null;
        }
        
        _redraw(true);
    }

    /**
     * Returns the root folder of the currently loaded project, or null if no project is open (during
     * startup, or running outside of app shell).
     * @return {DirectoryEntry}
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

                // Truncate project path prefix, remove the trailing slash
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
        _projectTree.jstree("deselect_node", current);
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
        $projectTreeContainer.hide();
        _projectTree = $projectTreeContainer
            .jstree({
                plugins : ["ui", "themes", "json_data", "crrm", "sort"],
                ui : { select_limit: 1, select_multiple_modifier: "", select_range_modifier: "" },
                json_data : { data: treeDataProvider, correct_state: false },
                core : { animation: 0 },
                themes : { theme: "brackets", url: "styles/jsTreeTheme.css", dots: false, icons: false },
                    //(note: our actual jsTree theme CSS lives in brackets.less; we specify an empty .css
                    // file because jsTree insists on loading one itself)
                strings : { loading : "Loading ...", new_node : "New node" },
                sort :  function (a, b) {
                    if (brackets.platform === "win") {
                        // Windows: prepend folder names with a '0' and file names with a '1' so folders are listed first
                        var a1 = ($(a).hasClass("jstree-leaf") ? "1" : "0") + this.get_text(a).toLowerCase(),
                            b1 = ($(b).hasClass("jstree-leaf") ? "1" : "0") + this.get_text(b).toLowerCase();
                        return (a1 > b1) ? 1 : -1;
                    } else {
                        return this.get_text(a).toLowerCase() > this.get_text(b).toLowerCase() ? 1 : -1;
                    }
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
                    
                    suppressToggleOpen = false;
                }
            ).bind(
                "reopen.jstree",
                function (event, data) {
                    // This handler fires for the initial load and subsequent
                    // reload_nodes events. For each depth level of the tree, we open
                    // the saved nodes by a fullPath lookup.
                    if (_projectInitialLoad.previous.length > 0) {
                        // load previously open nodes by increasing depth
                        var toOpenPaths = _projectInitialLoad.previous.shift(),
                            toOpenIds   = [],
                            node        = null;
        
                        // use path to lookup ID
                        $.each(toOpenPaths, function (index, value) {
                            node = _projectInitialLoad.fullPathToIdMap[value];
                            
                            if (node) {
                                toOpenIds.push(node);
                            }
                        });
        
                        // specify nodes to open and load
                        data.inst.data.core.to_open = toOpenIds;
                        _projectTree.jstree("reload_nodes", false);
                    }
                    if (_projectInitialLoad.previous.length === 0) {
                        // resolve after all paths are opened
                        result.resolve();
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
                    if (event.which === 3) {
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

        return result.promise();
    }
    
    /**
     * Returns false for files and directories that are not commonly useful to display.
     *
     * @param {Entry} entry File or directory to filter
     * @return boolean true if the file should be displayed
     */
    function shouldShow(entry) {
        if ([".git", ".gitignore", ".gitmodules", ".svn", ".DS_Store", "Thumbs.db"].indexOf(entry.name) > -1) {
            return false;
        }
        var extension = entry.name.split('.').pop();
        if (["pyc"].indexOf(extension) > -1) {
            return false;
        }
        return true;
    }

    /**
     * @private
     * Given an array of NativeFileSystem entries, returns a JSON array representing them in the format
     * required by jsTree. Saves the corresponding Entry object as metadata (which jsTree will store in
     * the DOM via $.data()).
     *
     * Does NOT recursively traverse the file system: folders are marked as expandable but are given no
     * children initially.
     *
     * @param {Array.<Entry>} entries  Array of NativeFileSystem entry objects.
     * @return {Array} jsTree node data: array of JSON objects
     */
    function _convertEntriesToJSON(entries) {
        var jsonEntryList = [],
            entry,
            entryI;

        for (entryI = 0; entryI < entries.length; entryI++) {
            entry = entries[entryI];
            
            if (shouldShow(entry)) {
                var jsonEntry = {
                    data: entry.name,
                    attr: { id: "node" + _projectInitialLoad.id++ },
                    metadata: { entry: entry }
                };
                if (entry.isDirectory) {
                    jsonEntry.children = [];
                    jsonEntry.state = "closed";
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
        var dirEntry, isProjectRoot = false;

        if (treeNode === -1) {
            // Special case: root of tree
            dirEntry = _projectRoot;
            isProjectRoot = true;
        } else {
            // All other nodes: the DirectoryEntry is saved as jQ data in the tree (by _convertEntriesToJSON())
            dirEntry = treeNode.data("entry");
        }

        // Fetch dirEntry's contents
        dirEntry.createReader().readEntries(
            function (entries) {
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
            },
            function (error) {
                Dialogs.showModalDialog(
                    Dialogs.DIALOG_ID_ERROR,
                    Strings.ERROR_LOADING_PROJECT,
                    StringUtils.format(Strings.READ_DIRECTORY_ENTRIES_ERROR,
                        StringUtils.htmlEscape(dirEntry.fullPath),
                        error.name)
                );
            }
        );

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

        return initialPath;
    }
    
    /**
     * Returns true if the given path is the same as one of the welcome projects we've previously opened,
     * or the one for the current build.
     */
    function isWelcomeProjectPath(path) {
        var canonPath = FileUtils.canonicalizeFolderPath(path);
        if (canonPath === _getWelcomeProjectPath()) {
            return true;
        }
        var welcomeProjects = _prefs.getValue("welcomeProjects") || [];
        return welcomeProjects.indexOf(canonPath) !== -1;
    }
    
    /**
     * If the provided path is to an old welcome project, updates to the current one.
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
     * Loads the given folder as a project. Normally, you would call openProject() instead to let the
     * user choose a folder.
     *
     * @param {string} rootPath  Absolute path to the root folder of the project. 
     *  If rootPath is undefined or null, the last open project will be restored.
     * @return {$.Promise} A promise object that will be resolved when the
     *  project is loaded and tree is rendered, or rejected if the project path
     *  fails to load.
     */
    function _loadProject(rootPath) {
        if (_projectRoot) {
            // close current project
            $(exports).triggerHandler("beforeProjectClose", _projectRoot);
        }

        // close all the old files
        DocumentManager.closeAll();

        // reset tree node id's
        _projectInitialLoad.id = 0;

        var result = new $.Deferred(),
            resultRenderTree;

        // restore project tree state from last time this project was open
        _projectInitialLoad.previous = _prefs.getValue(_getTreeStateKey(rootPath)) || [];

        // Populate file tree as long as we aren't running in the browser
        if (!brackets.inBrowser) {
            // Point at a real folder structure on local disk
            NativeFileSystem.requestNativeFileSystem(rootPath,
                function (fs) {
                    var rootEntry = fs.root;
                    var projectRootChanged = (!_projectRoot || !rootEntry) ||
                        _projectRoot.fullPath !== rootEntry.fullPath;
                    var i;

                    // Success!
                    var perfTimerName = PerfUtils.markStart("Load Project: " + rootPath),
                        canonPath = FileUtils.canonicalizeFolderPath(rootPath);

                    _projectRoot = rootEntry;
                    _projectBaseUrl = _prefs.getValue(_getBaseUrlKey()) || "";

                    // If this is the current welcome project, record it. In future launches, we always 
                    // want to substitute the welcome project for the current build instead of using an
                    // outdated one (when loading recent projects or the last opened project).
                    if (canonPath === _getWelcomeProjectPath()) {
                        var welcomeProjects = _prefs.getValue("welcomeProjects") || [];
                        if (welcomeProjects.indexOf(canonPath) === -1) {
                            welcomeProjects.push(canonPath);
                            _prefs.setValue("welcomeProjects", welcomeProjects);
                        }
                    }

                    // The tree will invoke our "data provider" function to populate the top-level items, then
                    // go idle until a node is expanded - at which time it'll call us again to fetch the node's
                    // immediate children, and so on.
                    resultRenderTree = _renderTree(_treeDataProvider);

                    resultRenderTree.done(function () {
                        if (projectRootChanged) {
                            // Allow asynchronous event handlers to finish before resolving result by collecting promises from them
                            var promises = [];
                            $(exports).triggerHandler({ type: "projectOpen", promises: promises }, [_projectRoot]);
                            $.when.apply($, promises).pipe(result.resolve, result.reject);
                        } else {
                            result.resolve();
                        }
                    });
                    resultRenderTree.fail(function () {
                        PerfUtils.terminateMeasurement(perfTimerName);
                        result.reject();
                    });
                    resultRenderTree.always(function () {
                        PerfUtils.addMeasurement(perfTimerName);
                    });
                },
                function (error) {
                    Dialogs.showModalDialog(
                        Dialogs.DIALOG_ID_ERROR,
                        Strings.ERROR_LOADING_PROJECT,
                        StringUtils.format(
                            Strings.REQUEST_NATIVE_FILE_SYSTEM_ERROR,
                            StringUtils.htmlEscape(rootPath),
                            error.name
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
                );
        }

        return result.promise();
    }
    
    
    /**
     * Finds the tree node corresponding to the given file/folder (rejected if the path lies
     * outside the project, or if it doesn't exist).
     * 
     * @param {!Entry} entry FileEntry or DirectoryEntry to find
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
            pathSegments.pop();  // DirectoryEntry always has a trailing "/"
        }
        
        function findInSubtree($nodes, segmentI) {
            var seg = pathSegments[segmentI];
            var match = CollectionUtils.indexOf($nodes, function (node, i) {
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
     * Expands tree nodes to show the given file or folder and selects it. Silently no-ops if the
     * path lies outside the project, or if it doesn't exist.
     * 
     * @param {!Entry} entry FileEntry or DirectoryEntry to show
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
     *  If path is undefined or null, displays a  dialog where the user can choose a
     *  folder to load. If the user cancels the dialog, nothing more happens.
     * @return {$.Promise} A promise object that will be resolved when the
     *  project is loaded and tree is rendered, or rejected if the project path
     *  fails to load.
     */
    function openProject(path) {

        var result = new $.Deferred();

        // Confirm any unsaved changes first. We run the command in "prompt-only" mode, meaning it won't
        // actually close any documents even on success; we'll do that manually after the user also oks
        //the folder-browse dialog.
        CommandManager.execute(Commands.FILE_CLOSE_ALL, { promptOnly: true })
            .done(function () {
                if (path) {
                    // use specified path
                    _loadProject(path).pipe(result.resolve, result.reject);
                } else {
                    // Pop up a folder browse dialog
                    NativeFileSystem.showOpenDialog(false, true, Strings.CHOOSE_FOLDER, _projectRoot.fullPath, null,
                        function (files) {
                            // If length == 0, user canceled the dialog; length should never be > 1
                            if (files.length > 0) {
                                // Load the new project into the folder tree
                                _loadProject(files[0]).pipe(result.resolve, result.reject);
                            } else {
                                result.reject();
                            }
                        },
                        function (error) {
                            Dialogs.showModalDialog(
                                Dialogs.DIALOG_ID_ERROR,
                                Strings.ERROR_LOADING_PROJECT,
                                StringUtils.format(Strings.OPEN_DIALOG_ERROR, error.name)
                            );
                            result.reject();
                        }
                        );
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
     */
    function _projectSettings() {
        return PreferencesDialogs.showProjectPreferencesDialog(getBaseUrl());
    }

    /**
     * @private
     *
     * Check a filename for illegal characters. If any are found, show an error
     * dialog and return false. If no illegal characters are found, return true.
     */
    function _checkForValidFilename(filename) {
        // Validate file name
        // TODO (issue #270): There are some filenames like COM1, LPT3, etc. that are not valid on Windows.
        // We may want to add checks for those here.
        // See http://msdn.microsoft.com/en-us/library/windows/desktop/aa365247(v=vs.85).aspx
        if (filename.search(/[\/?*:;\{\}<>\\|]+/) !== -1) {
            Dialogs.showModalDialog(
                Dialogs.DIALOG_ID_ERROR,
                Strings.INVALID_FILENAME_TITLE,
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
     * @return {$.Promise} A promise object that will be resolved with the FileEntry
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

        // get the FileEntry or DirectoryEntry
        if (selection) {
            selectionEntry = selection.data("entry");
        }

        // move selection to parent DirectoryEntry
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

        // use the project root DirectoryEntry
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
                if (!_checkForValidFilename(data.rslt.name)) {
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

                    // Notify listeners that the project model has changed
                    $(exports).triggerHandler("projectFilesChange");
                    
                    result.resolve(entry);
                };
                
                var errorCallback = function (error) {
                    if ((error.name === NativeFileError.PATH_EXISTS_ERR) ||
                            (error.name === NativeFileError.TYPE_MISMATCH_ERR)) {
                        Dialogs.showModalDialog(
                            Dialogs.DIALOG_ID_ERROR,
                            Strings.INVALID_FILENAME_TITLE,
                            StringUtils.format(Strings.FILE_ALREADY_EXISTS,
                                StringUtils.htmlEscape(data.rslt.name))
                        );
                    } else {
                        var errString = error.name === NativeFileError.NO_MODIFICATION_ALLOWED_ERR ?
                                         Strings.NO_MODIFICATION_ALLOWED_ERR :
                                         StringUtils.format(Strings.GENERIC_ERROR, error.name);

                        var errMsg = StringUtils.format(Strings.ERROR_CREATING_FILE,
                                        StringUtils.htmlEscape(data.rslt.name),
                                        errString);
                      
                        Dialogs.showModalDialog(
                            Dialogs.DIALOG_ID_ERROR,
                            Strings.ERROR_CREATING_FILE_TITLE,
                            errMsg
                        );
                    }

                    errorCleanup();
                };
                
                if (isFolder) {
                    // Use getDirectory() to create the new folder
                    selectionEntry.getDirectory(
                        data.rslt.name,
                        {create: true, exclusive: true},
                        successCallback,
                        errorCallback
                    );
                } else {
                    // Use getFile() to create the new file
                    selectionEntry.getFile(
                        data.rslt.name,
                        {create: true, exclusive: true},
                        successCallback,
                        errorCallback
                    );
                }
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
            return result;
        }
        
        // TODO: This should call FileEntry.moveTo(), but that isn't implemented
        // yet. For now, call directly to the low-level fs.rename()
        brackets.fs.rename(oldName, newName, function (err) {
            if (!err) {
                // Update all nodes in the project tree.
                // All other updating is done by DocumentManager.notifyPathNameChanged() below
                var nodes = _projectTree.find(".jstree-leaf, .jstree-open, .jstree-closed"),
                    i;
                
                for (i = 0; i < nodes.length; i++) {
                    var node = $(nodes[i]);
                    FileUtils.updateFileEntryPath(node.data("entry"), oldName, newName, isFolder);
                }
                
                // Notify that one of the project files has changed
                $(exports).triggerHandler("projectFilesChange");
                
                // Tell the document manager about the name change. This will update
                // all of the model information and send notification to all views
                DocumentManager.notifyPathNameChanged(oldName, newName, isFolder);
                
                // Finally, re-open the selected document
                if (DocumentManager.getCurrentDocument()) {
                    FileViewController.openAndSelectDocument(
                        DocumentManager.getCurrentDocument().file.fullPath,
                        FileViewController.getFileSelectionFocus()
                    );
                }
                
                _redraw(true);

                result.resolve();
            } else {
                // Show and error alert
                Dialogs.showModalDialog(
                    Dialogs.DIALOG_ID_ERROR,
                    Strings.ERROR_RENAMING_FILE_TITLE,
                    StringUtils.format(
                        Strings.ERROR_RENAMING_FILE,
                        StringUtils.htmlEscape(newName),
                        err === brackets.fs.ERR_FILE_EXISTS ?
                                Strings.FILE_EXISTS_ERR :
                                FileUtils.getFileErrorString(err)
                    )
                );
                
                result.reject(err);
            }
        });
        
        return result;
    }
    
    /**
     * Initiates a rename of the selected item in the project tree, showing an inline editor
     * for input. Silently no-ops if the entry lies outside the tree or doesn't exist.
     * @param {!Entry} entry FileEntry or DirectoryEntry to rename
     */
    function renameItemInline(entry) {
        // First make sure the item in the tree is visible - jsTree's rename API doesn't do anything to ensure inline input is visible
        showInTree(entry)
            .done(function (selected) {
                var isFolder = selected.hasClass("jstree-open") || selected.hasClass("jstree-closed");
        
                _projectTree.one("rename.jstree", function (event, data) {
                    // Make sure the file was actually renamed
                    if (data.rslt.old_name === data.rslt.new_name) {
                        return;
                    }
                    
                    var _resetOldFilename = function () {
                        _projectTree.jstree("set_text", selected, data.rslt.old_name);
                        _projectTree.jstree("sort", selected.parent());
                    };
                    
                    if (!_checkForValidFilename(data.rslt.new_name)) {
                        // Invalid filename. Reset the old name and bail.
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
                _projectTree.jstree("rename");
            });
        // No fail handler: silently no-op if file doesn't exist in tree
    }
    
    /**
     * Forces createNewItem() to complete by removing focus from the rename field which causes
     * the new file to be written to disk
     */
    function forceFinishRename() {
        $(".jstree-rename-input").blur();
    }

    // Initialize variables and listeners that depend on the HTML DOM
    AppInit.htmlReady(function () {
        $projectTreeContainer = $("#project-files-container");

        $("#open-files-container").on("contentChanged", function () {
            _redraw(false); // redraw jstree when working set size changes
        });
    });

    // Init PreferenceStorage
    var defaults = {
        projectPath:      _getWelcomeProjectPath()  /* initialize to welcome project */
    };
    _prefs = PreferencesManager.getPreferenceStorage(PREFERENCES_CLIENT_ID, defaults);
        
    if (!_prefs.getValue("welcomeProjectsFixed")) {
        // One-time cleanup of duplicates in the welcome projects list--there used to be a bug where
        // we would add lots of duplicate entries here.
        var welcomeProjects = _prefs.getValue("welcomeProjects");
        if (welcomeProjects) {
            var newWelcomeProjects = [];
            var i;
            for (i = 0; i < welcomeProjects.length; i++) {
                if (newWelcomeProjects.indexOf(welcomeProjects[i]) === -1) {
                    newWelcomeProjects.push(welcomeProjects[i]);
                }
            }
            _prefs.setValue("welcomeProjects", newWelcomeProjects);
            _prefs.setValue("welcomeProjectsFixed", true);
        }
    }

    // Event Handlers
    $(FileViewController).on("documentSelectionFocusChange", _documentSelectionFocusChange);
    $(FileViewController).on("fileViewFocusChange", _fileViewFocusChange);

    // Commands
    CommandManager.register(Strings.CMD_OPEN_FOLDER,      Commands.FILE_OPEN_FOLDER,      openProject);
    CommandManager.register(Strings.CMD_PROJECT_SETTINGS, Commands.FILE_PROJECT_SETTINGS, _projectSettings);

    // Define public API
    exports.getProjectRoot           = getProjectRoot;
    exports.getBaseUrl               = getBaseUrl;
    exports.setBaseUrl               = setBaseUrl;
    exports.isWithinProject          = isWithinProject;
    exports.makeProjectRelativeIfPossible = makeProjectRelativeIfPossible;
    exports.shouldShow               = shouldShow;
    exports.openProject              = openProject;
    exports.getSelectedItem          = getSelectedItem;
    exports.getInitialProjectPath    = getInitialProjectPath;
    exports.isWelcomeProjectPath     = isWelcomeProjectPath;
    exports.updateWelcomeProjectPath = updateWelcomeProjectPath;
    exports.createNewItem            = createNewItem;
    exports.renameItemInline         = renameItemInline;
    exports.forceFinishRename        = forceFinishRename;
    exports.showInTree               = showInTree;
});
