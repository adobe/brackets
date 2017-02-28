/*
 * Copyright (c) 2015 Bramble Contributors. All rights reserved.
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

/*global define, HTMLElement, MessageChannel, addEventListener*/

define([
    // Change this to filer vs. filer.min if you need to debug Filer
    "thirdparty/filer/dist/filer.min",
    "bramble/ChannelUtils",
    "bramble/thirdparty/EventEmitter/EventEmitter.min",
    "bramble/client/StateManager",
    "bramble/thirdparty/MessageChannel/message_channel"
], function(Filer, ChannelUtils, EventEmitter, StateManager) {
    "use strict";

    // PROD URL for Bramble, which can be changed below
    var PROD_BRAMBLE_URL = "https://mozillathimblelivepreview.net/bramble/dist/index.html";

    // We treat tutorial.html as a special file
    var TUTORIAL_FILENAME = "tutorial.html";

    var FilerBuffer = Filer.Buffer;
    var Path = Filer.Path;
    var UUID = ChannelUtils.UUID;

    // Logging function, replaced in Bramble.load() if options.debug is true
    var debug = function(){};

    // We only support having a single instance in the page.
    var _instance;

    function parseEventData(data) {
        debug("parseEventData", data);
        try {
            data = JSON.parse(data);
            return data || {};
        } catch(err) {
            debug("parseEventData error", err);
            return {};
        }
    }

    var Bramble = new EventEmitter();

    // Bramble ready state management
    Bramble.ERROR      = -1;// Bramble is in an error state
    Bramble.NOT_LOADED = 0; // Bramble.load() has not been called
    Bramble.LOADING    = 1; // Bramble.load() has been called, loading resources
    Bramble.MOUNTABLE  = 2; // Bramble.mount() can be executed, loading is done
    Bramble.MOUNTING   = 3; // Bramble.mount() has been called, mounting
    Bramble.READY      = 4; // Bramble.mount() has finished, Bramble is fully ready

    var _readyState = Bramble.NOT_LOADED;

    // The final err arg is optional.
    function setReadyState(newState, err) {
        var previousState = _readyState;
        _readyState = newState;

        debug("setReadyState", previousState, newState);
        Bramble.trigger("readyStateChange", [previousState, newState]);

        // When we hit the READY state, also trigger an event and pass instance up
        if (_readyState === Bramble.READY) {
            Bramble.trigger("ready", [_instance]);
        }
        // When we go into the ERROR state, also trigger an event and pass err
        else if (_readyState === Bramble.ERROR) {
            // Treat filesystem corruption as a special case
            if(err && err.code === "EFILESYSTEMERROR") {
                if(_instance._autoRecoverFileSystem) {
                    Bramble.formatFileSystem(function(err2) {
                        if(err2) {
                            console.error("[Bramble] unable to access browser filesystem:", err2);
                        } else {
                            console.log("[Bramble] browser filesystem auto-recovered, refresh page.");
                        }
                        Bramble.trigger("error", [err]);
                    });
                } else {
                    console.error("[Bramble] browser filesystem inaccessible (needs to be re-formatted, or permission denied due to private browsing mode.");
                    Bramble.trigger("error", [err]);
                }
            } else {
                Bramble.trigger("error", [err]);
            }
        }
    }
    Bramble.getReadyState = function() { return _readyState; };

    // Expose Filer for Path, Buffer, providers, etc.
    Bramble.Filer = Filer;
    var _fs = new Filer.FileSystem();
    Bramble.getFileSystem = function() {
        return _fs;
    };
    // NOTE: THIS WILL DESTROY DATA! For error cases only, or to wipe the disk.
    Bramble.formatFileSystem = function(callback) {
        _fs = new Filer.FileSystem({flags: ["FORMAT"]}, callback);
    };

    // Start loading Bramble's resources, setup communication with iframe
    Bramble.load = function(div, options) {
        if (_instance) {
            setReadyState(Bramble.ERROR, new Error("Bramble.load() called more than once."));
            return;
        }

        options = options || {};

        // Turn on logging if in debug mode
        if (options.debug) {
            debug = console.log.bind(console);
        }

        _instance = new BrambleProxy(div, options);
    };

    // After calling Bramble.load(), Bramble.mount() specifies project root entry path info
    Bramble.mount = function(root, filename) {
        if (!filename) {
            debug("no filename passed to Bramble.mount()");
        }

        if (!_instance) {
            setReadyState(Bramble.ERROR, new Error("Bramble.mount() called before Bramble.load()."));
            return;
        }

        _instance.mount(root, filename);
    };

    /**
     * A proxy object to manage communication from/to the remote Bramble app.
     */
    function BrambleProxy(div, options) {
        var self = this;
        options = options || {};

        // The id used for the iframe element
        var _id = "bramble-" + UUID.generate();

        // The iframe that will host Bramble
        var _iframe;

        // Whether or not a tutorial.html file exists in the project root
        var _tutorialExists;

        // Whether or not a tutorial.html is being used vs. file preview
        var _tutorialVisible;

        // Long-running callbacks for fs watch events
        var _watches = {};

        // The channel port for communication with this instance
        var _port;

        // The iframe's window, for postMessage
        var _brambleWindow;

        // Whether to transfer ownership of ArrayBuffers or not
        var _allowArrayBufferTransfer;

        // State info for UI
        var _state = new StateManager(options.disableUIState);

        // The project root dir that Bramble mounted
        var _root;

        // Callback functions waiting for a postMessage from Bramble
        var _callbacks = {};

        // Whether or not we want to try and auto-recover a corrupted filesystem on error
        self._autoRecoverFileSystem = options.autoRecoverFileSystem;

        // Public getters for state. Most of these aren't useful until bramble.ready()
        self.getID = function() { return _id; };
        self.getIFrame = function() { return _iframe; };
        self.getFullPath = function() { return _state.fullPath; };
        self.getFilename = function() { return _state.filename; };
        self.getPreviewMode = function() { return _state.previewMode; };
        self.getTheme = function() { return _state.theme; };
        self.getFontSize = function() { return _state.fontSize; };
        self.getSidebarVisible = function() { return _state.sidebarVisible; };
        self.getRootDir = function() { return _root; };
        self.getWordWrap = function() { return _state.wordWrap; };
        self.getAllowJavaScript = function() { return _state.allowJavaScript; };
        self.getAutoUpdate = function() { return _state.autoUpdate; };
        self.getTutorialExists = function() { return _tutorialExists; };
        self.getTutorialVisible = function() { return _tutorialVisible; };
        self.getLayout = function() {
            return {
                sidebarWidth: _state.sidebarWidth,
                firstPaneWidth: _state.firstPaneWidth,
                secondPaneWidth: _state.secondPaneWidth
            };
        };

        if (typeof div === "object"  && !(div instanceof HTMLElement)) {
            options = div;
            div = null;
        }

        function startEvents(win) {
            // Listen for resize events on the window, and let Bramble know
            addEventListener("resize", function(e) {
                self._executeRemoteCommand({commandCategory: "bramble", command: "RESIZE"});
            });

            addEventListener("message", function(e) {
                var data = parseEventData(e.data);

                // When Bramble is ready for the filesystem to be mounted, it will let us know
                if (data.type === "bramble:readyToMount") {
                    debug("bramble:readyToMount");
                    setReadyState(Bramble.MOUNTABLE);

                    // See if we have a cached mount function that we can run
                    if (typeof self._mount === "function") {
                        self._mount();
                        delete self._mount;
                    }
                }
                // Listen for requests to setup the fs
                else if (data.type === "bramble:filer") {
                    debug("bramble:filer");
                    setupChannel(win);
                }
                // Listen for Bramble to become ready/fully-loaded
                else if (data.type === "bramble:loaded") {
                    debug("bramble:loaded");
                    if (options.hideUntilReady) {
                        _iframe.style.visibility = "visible";
                    }

                    // Set intial state
                    _state.fullPath = data.fullPath;
                    _state.filename = data.filename;
                    _state.fontSize = data.fontSize;
                    _state.sidebarVisible = data.sidebarVisible;
                    _state.sidebarWidth = data.sidebarWidth;
                    _state.firstPaneWidth = data.firstPaneWidth;
                    _state.secondPaneWidth = data.secondPaneWidth;
                    _state.previewMode = data.previewMode;
                    _state.theme = data.theme;
                    _state.wordWrap = data.wordWrap;
                    _state.allowJavaScript = data.allowJavaScript;
                    _state.autoUpdate = data.autoUpdate;

                    setReadyState(Bramble.READY);
                }
                // Listen for callbacks from commands we triggered via _executeRemoteCommand
                else if(data.type === "bramble:remoteCommand:callback") {
                    debug("bramble:remoteCommand:callback");
                    // Trigger the queued callback and remove
                    _callbacks[data.callback]();
                    delete _callbacks[data.callback];
                }
                // Anything else is some kind of event we need to re-trigger
                // and alter internal state.
                else {
                    // Strip the "bramble:*" namespace off event name
                    var eventName = data.type.replace(/^bramble:/, '');
                    delete data.type;

                    // Update internal state before firing event
                    if (eventName === "layout") {
                        _state.sidebarWidth = data.sidebarWidth;
                        _state.firstPaneWidth = data.firstPaneWidth;
                        _state.secondPaneWidth = data.secondPaneWidth;
                    } else if (eventName === "activeEditorChange") {
                        _state.fullPath = data.fullPath;
                        _state.filename = data.filename;
                    } else if (eventName === "previewModeChange") {
                        _state.previewMode = data.mode;
                    } else if (eventName === "themeChange") {
                        _state.theme = data.theme;
                    } else if (eventName === "fontSizeChange") {
                        _state.fontSize = data.fontSize;
                    } else if (eventName === "sidebarChange") {
                        _state.sidebarVisible = data.visible;
                    } else if (eventName === "wordWrapChange") {
                        _state.wordWrap = data.wordWrap;
                    } else if (eventName === "allowJavaScriptChange") {
                        _state.allowJavaScript = data.allowJavaScript;
                    } else if (eventName === "tutorialVisibilityChange") {
                        _tutorialVisible = data.visible;
                    } else if (eventName === "autoUpdateChange") {
                        _state.autoUpdate = data.autoUpdate;
                    }

                    debug("triggering remote event", eventName, data);
                    self.trigger(eventName, [data]);
                }
            });
        }

        function createIFrame() {
            if (typeof div === "string") {
                div = document.querySelector(div);
            }

            if (!div) {
                div = document.body;
            }

            div.innerHTML = "<iframe id='" + _id +
                            "' frameborder='0' width='100%' height='100%'></iframe>";

            _iframe = document.getElementById(_id);
            if (options.hideUntilReady) {
                _iframe.style.visibility = "hidden";
            }

            _brambleWindow = _iframe.contentWindow;
            startEvents(_brambleWindow);

            var search = "";
            if (options.extensions) {
                // Override the extension list with what's in options
                var enable = options.extensions.enable;
                if (enable && enable.length) {
                    search += "?enableExtensions=" + enable.join(",");
                }

                var disable = options.extensions.disable;
                if (disable && disable.length) {
                    search += search.length ? "&" : "?";
                    search += "disableExtensions=" + disable.join(",");
                }
            } else {
                // If the user requests it, copy the search string from the hosting window
                if (options.useLocationSearch) {
                    search = window.location.search;
                }
            }

            if (options.locale) {
                search += search.length ? "&" : "?";
                search += options.locale;
            }

            setReadyState(Bramble.LOADING);

            // Allow custom URL to Bramble's index.html, default to prod
            var iframeUrl = (options.url ? options.url : PROD_BRAMBLE_URL) + search;
            debug("setting iframe src", iframeUrl);
            _iframe.src = iframeUrl;
        }

        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", function waitForDOM() {
                document.removeEventListener("DOMContentLoaded", waitForDOM, false);
                createIFrame();
            }, false);
        } else {
            createIFrame();
        }

        self.mount = function(root, filename) {
            function _mount() {
                setReadyState(Bramble.MOUNTING);

                root = Path.normalize(root);
                filename = Path.resolve(root, filename || (_state.fullPath || "index.html"));

                // Make sure the path we were given exists in the filesystem, and is a dir
                _fs.stat(root, function(err, stats) {
                    if (err) {
                        debug("mount stat error", err);
                        if (err.code === "ENOENT") {
                            setReadyState(Bramble.ERROR, new Error("mount path does not exist: " + root));
                        } else {
                            setReadyState(Bramble.ERROR, err);
                        }
                        return;
                    }

                    if (!stats.isDirectory()) {
                        setReadyState(Bramble.ERROR, new Error("mount path is not a directory: " + root));
                    } else {
                        _root = root;
                        self.tutorialPath = Path.join(root, TUTORIAL_FILENAME);

                        // Check to see if we have a tutorial or not
                        _fs.exists(self.tutorialPath, function(exists) {
                            _tutorialExists = exists;

                            var initMessage = {
                                type: "bramble:init",
                                mount: {
                                    root: root,
                                    filename: filename
                                },
                                state: {
                                    fontSize: _state.fontSize,
                                    theme: _state.theme,
                                    sidebarVisible: _state.sidebarVisible,
                                    sidebarWidth: _state.sidebarWidth,
                                    firstPaneWidth: _state.firstPaneWidth,
                                    secondPaneWidth: _state.secondPaneWidth,
                                    previewMode: _state.previewMode,
                                    wordWrap: _state.wordWrap,
                                    allowJavaScript: _state.allowJavaScript,
                                    autoUpdate: _state.autoUpdate
                                }
                            };
                            _brambleWindow.postMessage(JSON.stringify(initMessage), _iframe.src);
                        });
                    }
                });
            }
            if (_readyState > Bramble.MOUNTABLE) {
                setReadyState(Bramble.ERROR,
                    new Error("Bramble.mount() while already mounted, or attempting to mount."));
                return;
            } else if (_readyState < Bramble.MOUNTABLE) {
                // We can't mount yet, cache the function to be called when we are ready
                debug("mount pending, waiting on Bramble.MOUNTABLE");
                _instance._mount = _mount;
            } else {
                // MOUNTABLE, mount right now
                _mount();
            }
        };

        function setupChannel(win) {
            var channel = new MessageChannel();
            ChannelUtils.postMessage(win,
                                     [JSON.stringify({type: "bramble:filer"}),
                                     "*",
                                     [channel.port2]]);
            _port = channel.port1;
            _port.start();

            ChannelUtils.checkArrayBufferTransfer(_port, function(err, isAllowed) {
                debug("checkArrayBufferTransfer", isAllowed);
                _allowArrayBufferTransfer = isAllowed;
                _port.addEventListener("message", remoteFSCallbackHandler, false);
            });
        }

        function getCallbackFn(id) {
            // If we have a long-running callback (fs.watch()) use that,
            // otherwise generate a new one.
            if(_watches[id]) {
                return _watches[id];
            }

            return function callback(err, result) {
                var transferable;

                // If the filesystem is inaccessbile, or corrupt, we might not get proper
                // error handling in the filesystem constructor, and it might end up getting
                // here.  If it does, it's fatal, and we should trigger an error to the hosting app.
                if(err && err.code === "EFILESYSTEMERROR") {
                    setReadyState(Bramble.ERROR, err);
                    return;
                }

                // If the second arg is a Filer Buffer (i.e., wrapped Uint8Array),
                // get a reference to the underlying ArrayBuffer for transport.
                if (FilerBuffer.isBuffer(result)) {
                    result = result.buffer;

                    // If the browser allows transfer of ArrayBuffer objects over
                    // postMessage, add a reference to the transferables list.
                    if (_allowArrayBufferTransfer) {
                        transferable = [result];
                    }
                }

                _port.postMessage({callback: id, result: [err, result]}, transferable);
            };
        }

        function remoteFSCallbackHandler(e) {
            var data = e.data;
            var method = data.method;
            var callbackId = data.callback;
            var callback = getCallbackFn(callbackId);
            var wrappedCallback;
            var args = data.args;
            var shell = new _fs.Shell();
            var path, src, dest, options;

            // With successful fs operations that create, update, delete, or rename files,
            // we also trigger events on the bramble instance.
            function genericFileEventFn(type, filename, callback) {
                return function(err) {
                    if(!err) {
                        self.trigger(type, [filename]);
                    }
                    callback(err);
                };
            }
            // File Renames are special, since we care about both filenames
            function renameFileEventFn(type, oldFilename, newFilename, callback) {
                return function(err) {
                    if(!err) {
                        self.trigger(type, [oldFilename, newFilename]);
                    }
                    callback(err);
                };
            }

            // Folder Renames are special since we care about the old name,
            // the new name and all the child paths that were changed as a
            // result of the rename
            function renameFolderEventFn(type, oldFolderPath, newFolderPath, folderChildren, callback) {
                return function(err) {
                    if(!err) {
                        self.trigger(type, [{
                            oldPath: oldFolderPath,
                            newPath: newFolderPath,
                            children: folderChildren
                        }]);
                    }
                    callback(err);
                };
            }

            function deleteDirectoryRecursively(directory, callback) {
                function deleteFile(path, next) {
                    // If the current path is a directory, do nothing
                    if(path.endsWith("/")) {
                        return next();
                    }

                    _fs.unlink(path, genericFileEventFn("fileDelete", path, next));
                }

                // Delete files inside the directory and trigger a `fileDelete`
                shell.find(directory, {exec: deleteFile}, function(err) {
                    if(err) {
                        return callback(err);
                    }

                    shell.rm(directory, {recursive: true}, callback);
                });
            }

            function moveFile(filePath, destDir, callback) {
                var newFilePath = Path.join(destDir, Path.basename(filePath));

                _fs.readFile(filePath, function(err, data) {
                    if(err) {
                        return callback(err);
                    }

                    shell.mkdirp(destDir, function(err) {
                        if(err) {
                            return callback(err);
                        }

                        _fs.writeFile(newFilePath, data, genericFileEventFn("fileChange", newFilePath, callback));
                    });
                });
            }

            function moveEmptyDirectory(dirPath, destDir, callback) {
                var newEmptyDirPath = Path.join(destDir, Path.basename(dirPath));

                shell.mkdirp(newEmptyDirPath, callback);
            }

            function move(nodePath, callback) {
                var destinationDirectory = Path.join(dest, Path.basename(src), Path.dirname(Path.relative(src, nodePath)));

                if(!nodePath.endsWith("/")) {
                    return moveFile(nodePath, destinationDirectory, callback);
                }

                // If it is a directory, check to see if it contains
                // anything. If it does, ignore it as the case above
                // will eventually create it. If it is empty, create
                // an empty directory at the destination too.
                _fs.readdir(nodePath, function(err, contents) {
                    if(err) {
                        return callback(err);
                    }

                    // Directory contains something
                    if(contents.length > 0) {
                        return callback();
                    }

                    // Avoid creating the same directory inside itself
                    if(nodePath.replace(/\/?$/, "") === src.replace(/\/?$/, "")) {
                        destinationDirectory = Path.dirname(destinationDirectory);
                    }

                    moveEmptyDirectory(nodePath, destinationDirectory, callback);
                });
            }

            function getChildrenOfFolder(folderPath, callback) {
                var children = [];

                function storeRelativePath(childPath, next) {
                    // We don't care about child folders, only files because
                    // the current user of Bramble viz. Thimble does not keep
                    // track of folder paths and hence including them would be
                    // redundant (possibly problematic)
                    if(!childPath.endsWith("/")) {
                        children.push(Path.relative(folderPath, childPath));
                    }

                    next();
                }

                shell.find(folderPath, { exec: storeRelativePath }, function(err) {
                    if(err) {
                        callback(err);
                    } else {
                        callback(null, children);
                    }
                });
            }

            // Most fs methods can just get run normally, but we have to deal with
            // ArrayBuffer vs. Filer.Buffer for readFile and writeFile, and persist
            // watch callbacks. We also deal with the special case of `tutorial.html`.
            switch(method) {
            case "writeFile":
                // Convert the passed ArrayBuffer back to a FilerBuffer
                args[1] = new FilerBuffer(args[1]);
                path = args[0];
                wrappedCallback = genericFileEventFn("fileChange", path, callback);
                _fs.writeFile.apply(_fs, args.concat(function(err) {
                    // If the file written was tutorial.html, also fire an event for that
                    if(!err && path === self.tutorialPath) {
                        wrappedCallback = genericFileEventFn("tutorialAdded", path, wrappedCallback);
                        _tutorialExists = true;
                    }
                    wrappedCallback(err);
                }));
                break;
            case "rename":
                // We need to check if the rename is happening on a file or a
                // folder and accordingly trigger the right event and send the
                // right data needed by the event listener
                _fs.stat(args[0], function(err, stats) {
                    if(err) {
                        callback(err);
                    } else if(stats.isDirectory()) {
                        getChildrenOfFolder(args[0], function(err, children) {
                            if(err) {
                                callback(err);
                            } else {
                                _fs.rename.apply(
                                    _fs,
                                    args.concat(renameFolderEventFn(
                                        "folderRename",
                                        args[0], args[1], children,
                                        callback
                                    ))
                                );
                            }
                        });
                    } else {
                        wrappedCallback = renameFileEventFn("fileRename", args[0], args[1], callback);
                        _fs.rename.apply(_fs, args.concat(function(err) {
                            if(!err) {
                                // If we rename tutorial.html to something else, we're removing it
                                if(args[0] === self.tutorialPath) {
                                    wrappedCallback = genericFileEventFn("tutorialRemoved", args[0], wrappedCallback);
                                    _tutorialExists = false;
                                }
                                // If we rename something to tutorial.html, we're adding a tutorial
                                else if(args[1] === self.tutorialPath) {
                                    wrappedCallback = genericFileEventFn("tutorialAdded", args[1], wrappedCallback);
                                    _tutorialExists = true;
                                }
                            }
                            wrappedCallback(err);
                        }));
                    }
                });
                break;
            case "unlink":
                path = args[0];
                wrappedCallback = genericFileEventFn("fileDelete", args[0], callback);
                _fs.unlink.apply(_fs, args.concat(function(err) {
                    if(!err && path === self.tutorialPath) {
                        wrappedCallback = genericFileEventFn("tutorialRemoved", path, wrappedCallback);
                        _tutorialExists = false;
                    }
                    wrappedCallback(err);
                }));
                break;
            case "readFile":
                _fs.readFile.apply(_fs, args.concat(function(err, data) {
                    // Convert the FilerBuffer to an ArrayBuffer for transport
                    callback(err, data ? data.buffer : null);
                }));
                break;
            case "watch":
                // Persist watch callback until we get an unwatch();
                _watches[callbackId] = callback;
                _fs.watch.apply(_fs, data.args.concat(callback));
                break;
            case "mv":
                src = args[0];
                dest = args[1];
                _fs.stat(src, function(err, stats) {
                    if(err) {
                        return callback(err);
                    }

                    if(stats.isFile()) {
                        return moveFile(src, dest, callback);
                    }

                    shell.find(src, {exec: move}, callback);
                });

                break;
            case "rm":
                path = args[0];
                options = args[1];

                _fs.readdir(path, function(err, contents) {
                    if(err) {
                        // If the path was a file, immediately unlink
                        // trigger the event, and call the callback
                        if(err.code === "ENOTDIR") {
                            return shell.rm(path, genericFileEventFn("fileDelete", path, callback));
                        }

                        return callback(err);
                    }

                    // If the directory is empty or *should* be empty (in the
                    // case of a non-recursive rm), call shell.rm immediately
                    // without triggering a `fileDelete` event
                    if(!contents || contents.length < 1 || !options.recursive) {
                        return shell.rm(path, callback);
                    }

                    deleteDirectoryRecursively(path, callback);
                });

                break;
            default:
                if(data.shell) {
                    shell[data.method].apply(shell, args.concat(callback));
                } else {
                    _fs[data.method].apply(_fs, args.concat(callback));
                }
            }
        }

        self._executeRemoteCommand = function(options, callback) {
            if (!_brambleWindow) {
                console.error("[Bramble Error] No active instance, unable to execute command");
                return;
            }

            // Queue a callback for later when Bramble posts back to us
            callback = callback || function(){};
            options.callback = UUID.generate();
            _callbacks[options.callback] = callback;

            options.type = "bramble:remoteCommand";

            debug("executeRemoteCommand", options);
            _brambleWindow.postMessage(JSON.stringify(options), _iframe.src);
        };
    }

    BrambleProxy.prototype = new EventEmitter();
    BrambleProxy.prototype.constructor = BrambleProxy;

    BrambleProxy.prototype.undo = function(callback) {
        this._executeRemoteCommand({commandCategory: "brackets", command: "EDIT_UNDO"}, callback);
    };

    BrambleProxy.prototype.redo = function(callback) {
        this._executeRemoteCommand({commandCategory: "brackets", command: "EDIT_REDO"}, callback);
    };

    BrambleProxy.prototype.increaseFontSize = function(callback) {
        this._executeRemoteCommand({commandCategory: "brackets", command: "VIEW_INCREASE_FONT_SIZE"}, callback);
    };

    BrambleProxy.prototype.decreaseFontSize = function(callback) {
        this._executeRemoteCommand({commandCategory: "brackets", command: "VIEW_DECREASE_FONT_SIZE"}, callback);
    };

    BrambleProxy.prototype.restoreFontSize = function(callback) {
        this._executeRemoteCommand({commandCategory: "brackets", command: "VIEW_RESTORE_FONT_SIZE"}, callback);
    };

    BrambleProxy.prototype.save = function(callback) {
        this._executeRemoteCommand({commandCategory: "brackets", command: "FILE_SAVE"}, callback);
    };

    BrambleProxy.prototype.saveAll = function(callback) {
        this._executeRemoteCommand({commandCategory: "brackets", command: "FILE_SAVE_ALL"}, callback);
    };

    BrambleProxy.prototype.useHorizontalSplitView = function(callback) {
        this._executeRemoteCommand({commandCategory: "brackets", command: "CMD_SPLITVIEW_HORIZONTAL"}, callback);
    };

    BrambleProxy.prototype.useVerticalSplitView = function(callback) {
        this._executeRemoteCommand({commandCategory: "brackets", command: "CMD_SPLITVIEW_VERTICAL"}, callback);
    };

    BrambleProxy.prototype.find = function(callback) {
        this._executeRemoteCommand({commandCategory: "brackets", command: "CMD_FIND"}, callback);
    };

    BrambleProxy.prototype.findInFiles = function(callback) {
        this._executeRemoteCommand({commandCategory: "brackets", command: "CMD_FIND_IN_FILES"}, callback);
    };

    BrambleProxy.prototype.replace = function(callback) {
        this._executeRemoteCommand({commandCategory: "brackets", command: "CMD_REPLACE"}, callback);
    };

    BrambleProxy.prototype.replaceInFiles = function(callback) {
        this._executeRemoteCommand({commandCategory: "brackets", command: "CMD_REPLACE_IN_FILES"}, callback);
    };

    BrambleProxy.prototype.useLightTheme = function(callback) {
        this._executeRemoteCommand({commandCategory: "bramble", command: "BRAMBLE_LIGHT_THEME"}, callback);
    };

    BrambleProxy.prototype.useDarkTheme = function(callback) {
        this._executeRemoteCommand({commandCategory: "bramble", command: "BRAMBLE_DARK_THEME"}, callback);
    };

    BrambleProxy.prototype.showSidebar = function(callback) {
        this._executeRemoteCommand({commandCategory: "bramble", command: "BRAMBLE_SHOW_SIDEBAR"}, callback);
    };

    BrambleProxy.prototype.hideSidebar = function(callback) {
        this._executeRemoteCommand({commandCategory: "bramble", command: "BRAMBLE_HIDE_SIDEBAR"}, callback);
    };

    BrambleProxy.prototype.showStatusbar = function(callback) {
        this._executeRemoteCommand({commandCategory: "bramble", command: "BRAMBLE_SHOW_STATUSBAR"}, callback);
    };

    BrambleProxy.prototype.hideStatusbar = function(callback) {
        this._executeRemoteCommand({commandCategory: "bramble", command: "BRAMBLE_HIDE_STATUSBAR"}, callback);
    };

    BrambleProxy.prototype.refreshPreview = function(callback) {
        this._executeRemoteCommand({commandCategory: "bramble", command: "BRAMBLE_RELOAD"}, callback);
    };

    BrambleProxy.prototype.useMobilePreview = function(callback) {
        this._executeRemoteCommand({commandCategory: "bramble", command: "BRAMBLE_MOBILE_PREVIEW"}, callback);
    };

    BrambleProxy.prototype.useDesktopPreview = function(callback) {
        this._executeRemoteCommand({commandCategory: "bramble", command: "BRAMBLE_DESKTOP_PREVIEW"}, callback);
    };

    BrambleProxy.prototype.enableFullscreenPreview = function(callback) {
        this._executeRemoteCommand({commandCategory: "bramble", command: "BRAMBLE_ENABLE_FULLSCREEN_PREVIEW"}, callback);
    };

    BrambleProxy.prototype.disableFullscreenPreview = function(callback) {
        this._executeRemoteCommand({commandCategory: "bramble", command: "BRAMBLE_DISABLE_FULLSCREEN_PREVIEW"}, callback);
    };

    BrambleProxy.prototype.enableAutoUpdate = function(callback) {
        this._executeRemoteCommand({commandCategory: "bramble", command: "BRAMBLE_ENABLE_AUTO_UPDATE"}, callback);
    };

    BrambleProxy.prototype.disableAutoUpdate = function(callback) {
        this._executeRemoteCommand({commandCategory: "bramble", command: "BRAMBLE_DISABLE_AUTO_UPDATE"}, callback);
    };

    BrambleProxy.prototype.enableJavaScript = function(callback) {
        this._executeRemoteCommand({commandCategory: "bramble", command: "BRAMBLE_ENABLE_SCRIPTS"}, callback);
    };

    BrambleProxy.prototype.disableJavaScript = function(callback) {
        this._executeRemoteCommand({commandCategory: "bramble", command: "BRAMBLE_DISABLE_SCRIPTS"}, callback);
    };

    BrambleProxy.prototype.enableInspector = function(callback) {
        this._executeRemoteCommand({commandCategory: "bramble", command: "BRAMBLE_ENABLE_INSPECTOR"}, callback);
    };

    BrambleProxy.prototype.disableInspector = function(callback) {
        this._executeRemoteCommand({commandCategory: "bramble", command: "BRAMBLE_DISABLE_INSPECTOR"}, callback);
    };

    BrambleProxy.prototype.enableWordWrap = function(callback) {
        this._executeRemoteCommand({commandCategory: "bramble", command: "BRAMBLE_ENABLE_WORD_WRAP"}, callback);
    };

    BrambleProxy.prototype.disableWordWrap = function(callback) {
        this._executeRemoteCommand({commandCategory: "bramble", command: "BRAMBLE_DISABLE_WORD_WRAP"}, callback);
    };

    BrambleProxy.prototype.showTutorial = function(callback) {
        this._executeRemoteCommand({commandCategory: "bramble", command: "BRAMBLE_SHOW_TUTORIAL"}, callback);
    };

    BrambleProxy.prototype.hideTutorial = function(callback) {
        this._executeRemoteCommand({commandCategory: "bramble", command: "BRAMBLE_HIDE_TUTORIAL"}, callback);
    };

    BrambleProxy.prototype.showUploadFilesDialog = function(callback) {
        this._executeRemoteCommand({commandCategory: "bramble", command: "BRAMBLE_SHOW_UPLOAD_FILES_DIALOG"}, callback);
    };

    BrambleProxy.prototype.addNewFile = function(options, callback) {
        // We only support writing textual data this way
        if(typeof(options.contents) !== "string") {
            callback(new Error("expected string for file contents"));
            return;
        }

        this._executeRemoteCommand({
            commandCategory: "bramble",
            command: "BRAMBLE_ADD_NEW_FILE",
            args: [options]
        }, callback);
    };

    BrambleProxy.prototype.addNewFolder = function(callback) {
        this._executeRemoteCommand({commandCategory: "brackets", command: "FILE_FOLDER"}, callback);
    };

    BrambleProxy.prototype.export = function(callback) {
        this._executeRemoteCommand({commandCategory: "bramble", command: "BRAMBLE_EXPORT"}, callback);
    };
	
    BrambleProxy.prototype.addCodeSnippet = function(options, callback) {
        this._executeRemoteCommand({
            commandCategory: "bramble",
            command: "BRAMBLE_ADD_CODE_SNIPPET",
            args: [options]
        }, callback);
    };

    return Bramble;
});
