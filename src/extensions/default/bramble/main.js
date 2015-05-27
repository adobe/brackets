/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4,
maxerr: 50, browser: true */
/*global define, brackets, $ */

/**
 * This extension provides in-editor livepreview through an iframe,
 * and leverages the experimental Multi Browser implementation of brackets
 * (see https://github.com/adobe/brackets/tree/master/src/LiveDevelopment/MultiBrowserImpl)
 */
define(function (require, exports, module) {
    "use strict";

    // Load dependencies
    var AppInit              = brackets.getModule("utils/AppInit"),
        CommandManager       = brackets.getModule("command/CommandManager"),
        Commands             = brackets.getModule("command/Commands"),
        EditorManager        = brackets.getModule("editor/EditorManager"),
        LiveDevServerManager = brackets.getModule("LiveDevelopment/LiveDevServerManager"),
        PreferencesManager   = brackets.getModule("preferences/PreferencesManager"),
        ProjectManager       = brackets.getModule("project/ProjectManager"),
        LiveDevelopment      = brackets.getModule("LiveDevelopment/LiveDevMultiBrowser"),
        UrlParams            = brackets.getModule("utils/UrlParams").UrlParams,
        Editor               = brackets.getModule("editor/Editor").Editor,
        Rewriter             = brackets.getModule("filesystem/impls/filer/lib/HTMLRewriter"),
        // Load nohost dependencies
        Browser              = require("lib/iframe-browser"),
        UI                   = require("lib/UI"),
        Launcher             = require("lib/launcher"),
        HTMLServer           = require("nohost/src/HTMLServer").HTMLServer,
        StaticServer         = require("nohost/src/StaticServer").StaticServer,
        ExtensionUtils       = brackets.getModule("utils/ExtensionUtils"),
        PostMessageTransport = require("lib/PostMessageTransport"),
        FileSystem           = brackets.getModule("filesystem/FileSystem"),
        Path                 = brackets.getModule("filesystem/impls/filer/BracketsFiler").Path,
        BlobUtils            = brackets.getModule("filesystem/impls/filer/BlobUtils"),
        XHRHandler           = require("lib/xhr/XHRHandler");

    ExtensionUtils.loadStyleSheet(module, "stylesheets/style.css");

    var _HTMLServer,
        _staticServer,
        codeMirror,
        parentWindow = window.parent,
        params       = new UrlParams();

    // Load initial document
    var defaultHTML = brackets.getModule("text!filesystem/impls/filer/lib/default.html");
    var defaultCSS  = require("text!lib/default-files/style.css");
    var defaultJS   = require("text!lib/default-files/script.txt");

    // Force entry to if statments on line 262 of brackets.js to create
    // a new project
    PreferencesManager.setViewState("afterFirstLaunch", false);
    params.remove("skipSampleProjectLoad");

    // Server for HTML files only
    function _getHTMLServer() {
        if (!_HTMLServer) {
            _HTMLServer = new HTMLServer({
                pathResolver    : ProjectManager.makeProjectRelativeIfPossible,
                root            : ProjectManager.getProjectRoot()
            });
        }
        return _HTMLServer;
    }

    // Server for non-HTML files only
    function _getStaticServer() {
        if (!_staticServer) {
            _staticServer = new StaticServer({
                pathResolver    : ProjectManager.makeProjectRelativeIfPossible,
                root            : ProjectManager.getProjectRoot()
            });
        }
        return _staticServer;
    }

    function parseData(data, deferred) {
        var dataReceived = data;

        try {
            data = dataReceived || null;
            data = JSON.parse(data);
            data = data || {};
        } catch(err) {
            // Quick fix: Ignore the 'process-tick' message being sent
            if(dataReceived === "process-tick") {
                return false;
            }

            console.error("Parsing message from thimble failed: ", err);

            if(deferred) {
                deferred.reject();
            }

            return false;
        }

        return data;
    }

    function handleMessage(message) {
        var currentDocUrl = Browser.getBrowserIframe().src;
        var currentDocPath = BlobUtils.getFilename(currentDocUrl);
        var currentDir = currentDocPath !== currentDocUrl ? Path.dirname(currentDocPath) : currentDocPath;
        var requestedPath;

        try {
            message = parseData(message);
        } catch(ex) {
            console.error("[Brackets Browser LiveDev Error] Cannot handle message ", message);
            return;
        }

        if(message.method === "XMLHttpRequest") {
            requestedPath = Path.resolve(currentDir, Path.normalize(message.path));
            XHRHandler.handleRequest(requestedPath);
        }
    }

    // We wait until the LiveDevelopment module is initialized and the project loaded
    // so we can safely swap our transport and launcher modules for
    // the defaults and start LiveDev.
    function _configureLiveDev() {
        // Turn preview iFrame On
        Browser.init();

        function _configureModules() {
            // Set up our transport and plug it into live-dev
            PostMessageTransport.setIframe(Browser.getBrowserIframe());
            LiveDevelopment.setTransport(PostMessageTransport);

            // Set up our launcher in a similar manner
            LiveDevelopment.setLauncher(new Launcher({
                browser: Browser,
                server: _getHTMLServer()
            }));

            LiveDevelopment.open();
        }
        LiveDevelopment.one("statusChange", _configureModules);
    }
    ProjectManager.one("projectOpen", _configureLiveDev);

    /*
     * This function is attached to the window as an event listener
     * Its purpose is to intercept post messages from bramble proxy in thimble
     * some of these being:
     * undo, redo, size changer, or any other buttons relating to menu or view
     * within event we expect to receive a JSONable object that contains a commandCategory:
     * menuCommand: "Menu Command" relating to menu commands runable
     * fontChange: refers to a method we use to change fonts size
     * editorCommand: "Editor Command" relating to functions relating ot the editor itself
     * also contains a variable of "params" which can be used to send further information needed
     */
    function _buttonListener(event) {
        var msgObj;
        var i;
        try {
            msgObj = JSON.parse(event.data);
        } catch (e) {
            return;
        }

        if(msgObj.commandCategory === "menuCommand"){
            codeMirror.focus();
            CommandManager.execute(Commands[msgObj.command]);
        }
        else if (msgObj.commandCategory === "fontChange") {
            CommandManager.execute(Commands[msgObj.command]);
            if(msgObj.params < "12") {
                for(i = 12; i > msgObj.params; i--) {
                    CommandManager.execute(Commands.VIEW_DECREASE_FONT_SIZE);
                }
            }
            else if(msgObj.params > "12") {
                for(i = 12; i < msgObj.params; i++) {
                    CommandManager.execute(Commands.VIEW_INCREASE_FONT_SIZE);
                }
            }
        }
        else if (msgObj.commandCategory === "editorCommand") {
            Editor[msgObj.command](msgObj.params);
        }
        else if (msgObj.commandCategory === "reloadCommand") {
            PostMessageTransport.reload();
        }
        else if (msgObj.commandCategory === "runJavascript") {
            if(msgObj.command) {
                Rewriter.enableScripts();
            }
            else {
                Rewriter.disableScripts();
            }
            PostMessageTransport.reload();
        }
    }

    // We configure Brackets to run the experimental live dev
    // with our nohost server and iframe combination. This has to
    // occur before the project is loaded, triggering the start of
    // the live preview.
    AppInit.extensionsLoaded(function () {
        // Flip livedev.multibrowser to true
        var prefs = PreferencesManager.getExtensionPrefs("livedev");
        prefs.set("multibrowser", true);

        ExtensionUtils.loadStyleSheet(module, "stylesheets/tutorials.css");

        // Register servers with highest priority
        LiveDevServerManager.registerServer({ create: _getStaticServer }, 9000);
        LiveDevServerManager.registerServer({ create: _getHTMLServer }, 9001);
    });

    AppInit.appReady(function (){
        function attachListeners() {
            parentWindow.postMessage(JSON.stringify({
                type: "bramble:loaded"
            }), "*");

            // Below are methods to change the preferences of brackets, more available at:
            // https://github.com/adobe/brackets/wiki/How-to-Use-Brackets#list-of-supported-preferences
            PreferencesManager.set("insertHintOnTab", true);
            // Make the spaceUnits and tabSize consistent
            PreferencesManager.set("spaceUnits", 2);
            PreferencesManager.set("tabSize", 2);
            // Allows the closeTags to indent consistently
            PreferencesManager.set("closeTags", true);

            // Once the app has loaded our file,
            // and we can be confident the editor is open,
            // get a reference to it and attach our "onchange"
            // listener to codemirror
            codeMirror = EditorManager.getActiveEditor()._codeMirror;

            parentWindow.postMessage(JSON.stringify({
                type: "bramble:change",
                sourceCode: codeMirror.getValue(),
                lastLine: codeMirror.lastLine(),
                scrollInfo: codeMirror.getScrollInfo()
            }), "*");

            codeMirror.on("change", function(){
                parentWindow.postMessage(JSON.stringify({
                    type: "bramble:change",
                    sourceCode: codeMirror.getValue(),
                    lastLine: codeMirror.lastLine()
                }), "*");
            });

            codeMirror.on("viewportChange", function() {
                parentWindow.postMessage(JSON.stringify({
                    type: "bramble:viewportChange",
                    scrollInfo: codeMirror.getScrollInfo()
                }), "*");
            });

            window.addEventListener("message", function(e) {
                var data = parseData(e.data);
                var value;
                var mark;
                var type;

                if(!data) {
                    return;
                }

                type = data.type;

                if(type === "message") {
                    handleMessage(data.message);
                    return;
                }

                if(type !== "bramble:edit") {
                    return;
                }

                if(!data.fn) {
                    console.error("No edit function sent from thimble to call on code mirror");
                    return;
                }


                // QuickFix: Hack to create a DOM element as a marker since it cannot
                // be passed in through postMessage as JSON's stringify cannot work for
                // DOM elements (because it has circular references)
                if(data.fn === "setGutterMarker" && data.params[2]) {
                    mark = document.createElement(data.params[2].name);
                    var attributes = data.params[2].attributes;
                    Object.keys(attributes).forEach(function(attrName) {
                        $(mark).attr(attrName, attributes[attrName]);
                    });
                    mark.innerHTML = data.params[2].innerHTML;
                    data.params[2] = mark;
                }

                if(data.fn === "getLineHeight") {
                    var codeMirrorLine = document.querySelector(data.params[0]);
                    value = parseFloat(window.getComputedStyle(codeMirrorLine).height);
                } else {
                    value = codeMirror[data.fn].apply(codeMirror, data.params);
                }

                if(value === undefined || value === null) {
                    return;
                }

                parentWindow.postMessage(JSON.stringify({
                    type: "bramble:edit",
                    fn: data.fn,
                    value: typeof value !== "object" ? value : undefined
                }), "*");
            });
        }

        // When the app is loaded and ready, hide the menus/toolbars
        UI.initUI(attachListeners);
    });

    // We listen for a message from Thimble containing
    // the make's initial code.
    // For now, we have a default html make for testing
    // with just Brackets.
    exports.initExtension = function() {
        var deferred = new $.Deferred();

        function _getInitialDocument(e) {
            var data = parseData(e.data, deferred);

            // Remove the listener after we confirm the event is the
            // one we're waiting for
            if (!data || data.type !== "bramble:init") {
                return;
            }

            window.removeEventListener("message", _getInitialDocument);

            window.addEventListener("message", _buttonListener);

            var fileHTML = FileSystem.getFileForPath("/index.html");
            var fileCSS  = FileSystem.getFileForPath("/style.css");
            var fileJS   = FileSystem.getFileForPath("/script.js");

            // Write the HTML file and block on it being done.
            fileHTML.write(data.source ? data.source : defaultHTML,
                function(err) {
                    if (err) {
                        deferred.reject();
                        return;
                    }

                    deferred.resolve();
                }
            );

            // Write the CSS and JS file without blocking.
            fileCSS.write(defaultCSS, function(err) {
                if (err) {
                    console.error("Couldn't write /style.css");
                    return;
                }

                fileJS.write(defaultJS, function(err) {
                    if (err) {
                        console.error("Couldn't write /script.js");
                    }
                });
            });
        }

        window.addEventListener("message", _getInitialDocument);

        // Signal to thimble that we're waiting for the
        // initial make source code
        window.parent.postMessage(JSON.stringify({
            type: "bramble:init"
        }), "*");

        return deferred.promise();
    };
});
