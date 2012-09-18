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
 *    - projectOpen        -- after  _projectRoot changes
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
        FileUtils           = require("file/FileUtils"),
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
     * @private
     * Given an input to jsTree's json_data.data setting, display the data in the file tree UI
     * (replacing any existing file tree that was previously displayed). This input could be
     * raw JSON data, or it could be a dataprovider function. See jsTree docs for details:
     * http://www.jstree.com/documentation/json_data
     */
    function _renderTree(treeDataProvider) {
        var result = new $.Deferred(),
            suppressToggleOpen = false;

        // For #1542, make sure the tree is scrolled to the top before refreshing.
        // If we try to do this later (e.g. after the tree has been refreshed), it 
        // doesn't seem to work properly. 
        $projectTreeContainer.scrollTop(0);
        
        // Instantiate tree widget
        // (jsTree is smart enough to replace the old tree if there's already one there)
        $projectTreeContainer.hide();
        _projectTree = $projectTreeContainer
            .jstree(
                {
                    plugins : ["ui", "themes", "json_data", "crrm", "sort"],
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
                }
            )
            .bind(
                "before.jstree",
                function (event, data) {
                    if (data.func === "toggle_node") {
                        // jstree will automaticaly select parent node when the parent is closed
                        // and any descendant is selected. Prevent the select_node handler from
                        // immediately toggling open again in this case.
                        suppressToggleOpen = _projectTree.jstree("is_open", data.args[0]);
                    }
                }
            )
            .bind(
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
            )
            .bind(
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
            )
            .bind(
                "scroll.jstree",
                function (e) {
                    // close all dropdowns on scroll
                    Menus.closeAll();
                }
            )
            .bind(
                "loaded.jstree open_node.jstree close_node.jstree",
                function (event, data) {
                    if (event.type === "open_node") {
                        // select the current document if it becomes visible when this folder is opened
                        var curDoc = DocumentManager.getCurrentDocument();
                        
                        if (_hasFileSelectionFocus() && curDoc) {
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
            )
            .bind(
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
                    if (entry && entry.isFile) {
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
    
    /** @param {Entry} entry File or directory to filter */
    function shouldShow(entry) {
        return [".git", ".svn", ".DS_Store", "Thumbs.db"].indexOf(entry.name) === -1;
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
                }
            },
            function (error) {
                Dialogs.showModalDialog(
                    Dialogs.DIALOG_ID_ERROR,
                    Strings.ERROR_LOADING_PROJECT,
                    StringUtils.format(Strings.READ_DIRECTORY_ENTRIES_ERROR,
                        StringUtils.htmlEscape(dirEntry.fullPath),
                        error.code)
                );
            }
        );

    }
    
    /** Returns the full path to the welcome project, which we open on first launch.
     * @private
     * @return {!string} fullPath reference
     */
    function _getWelcomeProjectPath() {
        var srcPath = decodeURI(window.location.pathname),
            initialPath = srcPath.substr(0, srcPath.lastIndexOf("/")),
            sampleUrl = Urls.GETTING_STARTED;
        if (sampleUrl) {
            // Back up one more folder. The samples folder is assumed to be at the same level as
            // the src folder, and the sampleUrl is relative to the samples folder.
            initialPath = initialPath.substr(0, initialPath.lastIndexOf("/")) + "/samples/" + sampleUrl;
        }

        initialPath = FileUtils.convertToNativePath(initialPath);
        return initialPath;
    }
    
    /**
     * Returns true if the given path is the same as one of the welcome projects we've previously opened,
     * or the one for the current build.
     */
    function isWelcomeProjectPath(path) {
        var welcomeProjects = _prefs.getValue("welcomeProjects") || [];
        welcomeProjects.push(_getWelcomeProjectPath());
        return welcomeProjects.indexOf(FileUtils.canonicalizeFolderPath(path)) !== -1;
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
                function (rootEntry) {
                    var projectRootChanged = (!_projectRoot || !rootEntry)
                        || _projectRoot.fullPath !== rootEntry.fullPath;

                    // Success!
                    var perfTimerName = PerfUtils.markStart("Load Project: " + rootPath),
                        canonPath = FileUtils.canonicalizeFolderPath(rootPath);

                    _projectRoot = rootEntry;
                    
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
                            $(exports).triggerHandler("projectOpen", _projectRoot);
                        }
                        
                        result.resolve();
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
                            error.code
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
                                StringUtils.format(Strings.OPEN_DIALOG_ERROR, error.code)
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
     * Create a new item in the project tree.
     *
     * @param baseDir {string} Full path of the directory where the item should go
     * @param initialName {string} Initial name for the item
     * @param skipRename {boolean} If true, don't allow the user to rename the item
     * @return {$.Promise} A promise object that will be resolved with the FileEntry
     *  of the created object, or rejected if the user cancelled or entered an illegal
     *  filename.
     */
    function createNewItem(baseDir, initialName, skipRename) {
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
                // TODO (issue #270): There are some filenames like COM1, LPT3, etc. that are not valid on Windows.
                // We may want to add checks for those here.
                // See http://msdn.microsoft.com/en-us/library/windows/desktop/aa365247(v=vs.85).aspx
                if (data.rslt.name.search(/[\/?*:;\{\}<>\\|]+/) !== -1) {
                    Dialogs.showModalDialog(
                        Dialogs.DIALOG_ID_ERROR,
                        Strings.INVALID_FILENAME_TITLE,
                        Strings.INVALID_FILENAME_MESSAGE
                    );

                    errorCleanup();
                    return;
                }

                // Use getFile() to create the new file
                selectionEntry.getFile(
                    data.rslt.name,
                    {create: true, exclusive: true},
                    function (entry) {
                        data.rslt.obj.data("entry", entry);
                        _projectTree.jstree("select_node", data.rslt.obj, true);
                        result.resolve(entry);
                    },
                    function (error) {
                        if ((error.code === FileError.PATH_EXISTS_ERR)
                                || (error.code === FileError.TYPE_MISMATCH_ERR)) {
                            Dialogs.showModalDialog(
                                Dialogs.DIALOG_ID_ERROR,
                                Strings.INVALID_FILENAME_TITLE,
                                StringUtils.format(Strings.FILE_ALREADY_EXISTS,
                                    StringUtils.htmlEscape(data.rslt.name))
                            );
                        } else {
                            var errString = error.code === FileError.NO_MODIFICATION_ALLOWED_ERR ?
                                             Strings.NO_MODIFICATION_ALLOWED_ERR :
                                             StringUtils.format(String.GENERIC_ERROR, error.code);

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
                    }
                );
            } else { //escapeKeyPressed
                errorCleanup();
            }
        });
        
        // TODO (issue #115): Need API to get tree node for baseDir.
        // In the meantime, pass null for node so new item is placed
        // relative to the selection
        node = selection;
        
        // Open the node before creating the new child
        _projectTree.jstree("open_node", node);

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
        
        return result.promise();
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
        projectPath:      _getWelcomeProjectPath()  /* initialize to brackets source */
    };
    _prefs = PreferencesManager.getPreferenceStorage(PREFERENCES_CLIENT_ID, defaults);

    // Event Handlers
    $(FileViewController).on("documentSelectionFocusChange", _documentSelectionFocusChange);
    $(FileViewController).on("fileViewFocusChange", _fileViewFocusChange);

    // Commands
    CommandManager.register(Strings.CMD_OPEN_FOLDER,    Commands.FILE_OPEN_FOLDER,  openProject);

    // Define public API
    exports.getProjectRoot           = getProjectRoot;
    exports.isWithinProject          = isWithinProject;
    exports.makeProjectRelativeIfPossible = makeProjectRelativeIfPossible;
    exports.shouldShow               = shouldShow;
    exports.openProject              = openProject;
    exports.getSelectedItem          = getSelectedItem;
    exports.getInitialProjectPath    = getInitialProjectPath;
    exports.isWelcomeProjectPath     = isWelcomeProjectPath;
    exports.updateWelcomeProjectPath = updateWelcomeProjectPath;
    exports.createNewItem            = createNewItem;
    exports.forceFinishRename        = forceFinishRename;
});
