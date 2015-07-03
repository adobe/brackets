/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4,
maxerr: 50, browser: true */
/*global define, brackets */

/**
 * This extension provides in-editor livepreview through an iframe,
 * and leverages the experimental Multi Browser implementation of brackets
 * (see https://github.com/adobe/brackets/tree/master/src/LiveDevelopment/MultiBrowserImpl)
 */
define(function (require, exports, module) {
    "use strict";

    // Load dependencies
    var AppInit              = brackets.getModule("utils/AppInit"),
        PreferencesManager   = brackets.getModule("preferences/PreferencesManager"),
        LiveDevelopment      = brackets.getModule("LiveDevelopment/LiveDevMultiBrowser"),
        BrambleStartupState  = brackets.getModule("bramble/StartupState"),
        Browser              = require("lib/iframe-browser"),
        UI                   = require("lib/UI"),
        Launcher             = require("lib/launcher"),
        NoHost               = require("nohost/main"),
        ExtensionUtils       = brackets.getModule("utils/ExtensionUtils"),
        PostMessageTransport = require("lib/PostMessageTransport"),
        Path                 = brackets.getModule("filesystem/impls/filer/BracketsFiler").Path,
        BlobUtils            = brackets.getModule("filesystem/impls/filer/BlobUtils"),
        XHRHandler           = require("lib/xhr/XHRHandler"),
        Theme                = require("lib/Theme"),
        RemoteCommandHandler = require("lib/RemoteCommandHandler"),
        RemoteEvents         = require("lib/RemoteEvents");

    ExtensionUtils.loadStyleSheet(module, "stylesheets/style.css");
    ExtensionUtils.loadStyleSheet(module, "stylesheets/sidebarTheme.css");

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

    function startLiveDev() {
        // Turn preview iFrame On
        Browser.init();

        // Set up our transport and plug it into live-dev
        PostMessageTransport.setIframe(Browser.getBrowserIframe());
        LiveDevelopment.setTransport(PostMessageTransport);

        // Set up our launcher in a similar manner
        LiveDevelopment.setLauncher(new Launcher({
            browser: Browser,
            server: NoHost.getHTMLServer()
        }));

        LiveDevelopment.open();
    }

    function finishStartup(err) {
        if(err) {
            console.warn("Unable to preload filesystem URLs", err);
        }

        // Below are methods to change the preferences of brackets, more available at:
        // https://github.com/adobe/brackets/wiki/How-to-Use-Brackets#list-of-supported-preferences
        PreferencesManager.set("insertHintOnTab", true);
        // Make the spaceUnits and tabSize consistent
        PreferencesManager.set("spaceUnits", 2);
        PreferencesManager.set("tabSize", 2);
        // Allows the closeTags to indent consistently
        PreferencesManager.set("closeTags", true);
        // Don't warn about opening file in split view (we steal second view for iframe)
        PreferencesManager.setViewState("splitview.multipane-info", true);

        window.addEventListener("message", function(e) {
            var data = parseData(e.data);
            if(!data) {
                return;
            }
            // TODO: this needs to get done better -- xhr handing from preview.
            var type = data.type;
            if(type === "message") {
                handleMessage(data.message);
                return;
            } else if(type === "themeToggle") {
                Theme.toggle(data.theme);
                return;
            }
        }, false);

        // We're all done loading and can pass startup state info back to the host app.
        RemoteEvents.loaded();
    }

    AppInit.extensionsLoaded(function () {
        // Flip livedev.multibrowser to true
        var prefs = PreferencesManager.getExtensionPrefs("livedev");
        prefs.set("multibrowser", true);

        // Register servers
        NoHost.init();
    });

    AppInit.appReady(function() {
        // Load the two theme extensions outside of
        // the ExtensionLoader logic (avoids circular dependencies)
        Theme.init();

        // Setup the iframe browser and Blob URL live dev servers and
        // load the initial document into the preview.
        startLiveDev();

        // Preload BlobURLs for all assets in the filesystem
        BlobUtils.preload(BrambleStartupState.project("root"), function(err) {
            if(err) {
                // Possibly non-critical error, warn at least, but keep going.
                console.warn("[Bramble] unable to preload all filesystem Blob URLs", err);
            }

            UI.initUI(finishStartup);
        });
    });

    // We expect the hosting app to setup the filesystem, and give us a
    // path as a mount point for the project we open.  We block loading of the rest of the
    // app on the filesystem being setup and mounted.
    exports.initExtension = function() {
        var deferred = new $.Deferred();

        function init(e) {
            var data = parseData(e.data, deferred);
            if (!(data && data.type === "bramble:init")) {
                return;
            }

            window.removeEventListener("message", init, false);
            window.addEventListener("message", RemoteCommandHandler.handleRequest, false);

            // Set the mount point for the project we want to open and signal
            // to Brackets that it can keep going, which will pick this up.
            BrambleStartupState.project.init({
                root: data.mount.root,
                filename: data.mount.filename
            });

            // Set initial UI state values (if present)
            BrambleStartupState.ui.init({
                fontSize: data.state.fontSize,
                theme: data.state.theme,
                sidebarVisible: data.state.sidebarVisible,
                sidebarWidth: data.state.sidebarWidth,
                firstPaneWidth: data.state.firstPaneWidth,
                secondPaneWidth: data.state.secondPaneWidth,
                previewMode: data.state.previewMode,
                wordWrap: data.state.wordWrap
            });

            deferred.resolve();
        }

        window.addEventListener("message", init, false);

        RemoteEvents.start();

        return deferred.promise();
    };
});
