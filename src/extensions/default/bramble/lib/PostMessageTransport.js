/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, forin: true, maxerr: 50, regexp: true */
/*global define, brackets*/

// This transport provides a PostMessage connection between Brackets and a live browser preview.

define(function (require, exports, module) {
    "use strict";

    var _iframeRef,
        connId = 1;

    var Launcher = require("lib/launcher"),
        Browser  = require("lib/iframe-browser");

    var EventDispatcher     = brackets.getModule("utils/EventDispatcher"),
        LiveDevMultiBrowser = brackets.getModule("LiveDevelopment/LiveDevMultiBrowser"),
        BlobUtils           = brackets.getModule("filesystem/impls/filer/BlobUtils"),
        BrambleEvents       = brackets.getModule("bramble/BrambleEvents"),
        Path                = brackets.getModule("filesystem/impls/filer/BracketsFiler").Path,
        BrambleStartupState = brackets.getModule("bramble/StartupState");

    // The script that will be injected into the previewed HTML to handle the other side of the post message connection.
    var PostMessageTransportRemote = require("text!lib/PostMessageTransportRemote.js");
    var Tutorial = require("lib/Tutorial");
    var MouseManager = require("lib/MouseManager");
    var LinkManager = require("lib/LinkManager");

    // An XHR shim will be injected as well to allow XHR to the file system
    var XHRShim = require("text!lib/xhr/XHRShim.js");

    EventDispatcher.makeEventDispatcher(module.exports);

    /**
     * Saves a reference of the iframe element to a local variable
     * @param {DOM element reference to an iframe}
     */
    function setIframe(iframeRef) {
        if(iframeRef) {
            _iframeRef = iframeRef;
        }
    }

    // This function maps all blob urls in a message to filesystem
    // paths based on the urls that are cached, so that Brackets can work
    // with paths vs. urls
    // For e.g. a message like `{"stylesheets": {"blob://http://url" :
    // ["blob://http://url"]}}` will be mapped into `{"stylesheets":
    // {"/file1" : ["/file1"]}}`
    function resolveLinks(message) {
        var regex = new RegExp('\\"(blob:[^"]+)\\"', 'gm');
        var resolvedMessage = message.replace(regex, function(match, url) {
            var path = BlobUtils.getFilename(url);

            return ["\"", path, "\""].join("");
        });

        return resolvedMessage;
    }

    /**
    * Message event listener
    */
    function _listener(event){
        var msgObj;

        try {
            msgObj = JSON.parse(event.data);
        } catch (e) {
            return;
        }

        if(msgObj.type === "message") {
            // Deal with the case of a user clicking a <a> to navigate to a new file.
            if(LinkManager.isNavigationRequest(msgObj.message)) {
                LinkManager.navigate(msgObj.message);
                return;
            }

            if(MouseManager.isHighlightLineRequest(msgObj.message)) {
                MouseManager.highlightLine(msgObj.message);
                return;
            }

            // Deal with user disabling Inspector via mouse click in preview
            if(MouseManager.isDisableRequest(msgObj.message)) {
                MouseManager.disableInspector();
                return;
            }

            if(msgObj.message) {
                msgObj.message = resolveLinks(msgObj.message);
            }

            //trigger message event
            module.exports.trigger("message", [connId, msgObj.message]);
        } else if (msgObj.type === "connect") {
            Browser.setListener();
            // Make sure the correct mouse cursor is set, depending on inspector state.
            MouseManager.ensurePreviewCursor();
        }
    }

    /**
    * Initializes the post message connection
    */
    function start(){
        window.addEventListener("message", _listener);

        var autoUpdate = BrambleStartupState.ui("autoUpdate");
        if(typeof autoUpdate === "boolean") {
            setAutoUpdate(autoUpdate);
        }

        // Reload whenever files are removed or renamed
        BrambleEvents.on("fileRemoved", reload);
        BrambleEvents.on("fileRenamed", reload);
    }

    /**
    * Replaces paths of linked files with blob urls
    * @param {string} message - Contains a message passed by the editor
    *     to the LiveDev preview. Some examples of these messages are:
    *     "{"method":"Runtime.evaluate","params":{"expression":"_LD.highlightRule(\"[data-brackets-id='6']\")"},"id":3}"
    *     "{"method":"Runtime.evaluate","params":{"expression":"_LD.applyDOMEdits([{\"type\":\"attrChange\",\"tagID\":13,\"attribute\":\"href\",\"value\":\"script.js\"}])"},"id":14}"
    *     "{"method":"CSS.setStylesheetText","params":{"url":"/style.css","text":"/**\n * This is a basic CSS file.  You can include and use it in\n * your web page by adding the following inside the <head>:\n * <link href=\"style.css\" rel=\"stylesheet\" type=\"text/css\">\n * /\np {\n  color: purpl;\n}\n"},"id":28}"
    *     As can be noted in the second and third examples, there are cases
    *     when a \ and/or " may or may not be present before the substring
    *     that needs to be replaced
    *
    */
    function resolvePaths(message) {
        var currentDoc = LiveDevMultiBrowser._getCurrentLiveDoc();
        if(!currentDoc) {
            return message;
        }

        var currentDir = Path.dirname(currentDoc.doc.file.fullPath);
        var linkRegex = new RegExp('(\\\\?\\"?)(href|src|url|value)(\\\\?\\"?\\s?:?\\s?\\(?\\\\?\\"?)([^\\\\"\\),]+)(\\\\?\\"?)', 'gm');
        var resolvedMessage = message.replace(linkRegex, function(match, quote1, attr, seperator, value, quote2) {
            var path = value.charAt(0) === "/" ? value : Path.join(currentDir, value);
            var url = BlobUtils.getUrl(path);
            // If BlobUtils could not find the path in the filesystem, it
            // returns the path back unmodified. However, since we are
            // resolving the path above to an absolute path, we should not
            // modify the original value that was captured if a url mapping
            // for the absolute path was not found.
            value = url === path ? value : url;

            return [quote1, attr, seperator, value, quote2].join('');
        });

        return resolvedMessage;
    }

    /**
     * Sends a transport-layer message via post message.
     * @param {number|Array.<number>} idOrArray A client ID or array of client IDs to send the message to.
     * @param {string} msgStr The message to send as a JSON string.
     */
    function send(idOrArray, msgStr){
        var win = _iframeRef.contentWindow;
        msgStr = resolvePaths(msgStr);
        var msg = JSON.parse(msgStr);
        var detachedPreview = Browser.getDetachedPreview();

        // Because we need to deal with reloads on this side (i.e., editor) of the
        // transport, check message before sending to remote, and reload if necessary
        // without actually sending to remote for processing.
        if(msg.method === "Page.reload") {
            reload();
            return;
        } else if(msg.method === "Page.navigate") {
            reload(true);
            return;
        }

        win.postMessage(msgStr, "*");

        if(detachedPreview && Tutorial.shouldPostMessage()) {
            detachedPreview.postMessage(msgStr, "*");
        }
    }

    /**
    * Removes the message event listener
    */
    function close(clientId){
        window.removeEventListener("message", _listener);
    }

    /**
     * Returns the script that should be injected into the browser to handle the other end of the transport.
     * Includes a base tag to handle external protocol-less, linked files.
     * @return {string}
     */
    function getRemoteScript() {
        var currentDoc = LiveDevMultiBrowser._getCurrentLiveDoc();
        var currentPath;
        if(currentDoc) {
            currentPath = currentDoc.doc.file.fullPath;
        }

        return '<base href="' + window.location.href + '">\n' +
            "<script>\n" + PostMessageTransportRemote + "</script>\n" +
            "<script>\n" + XHRShim + "</script>\n" +
            MouseManager.getRemoteScript(currentPath) +
            LinkManager.getRemoteScript();
    }

    // URL of document being rewritten/launched (if any)
    var _pendingReloadUrl;

    // Whether or not to allow reloads in the general case (true by default)
    var _autoUpdate = true;

    function setAutoUpdate(value) {
        _autoUpdate = value;

        // Force a reload if we switch back to auto-updates
        if(_autoUpdate) {
            reload(true);
        }
    }

    /**
     * Reload the LiveDev preview if not auto-updates aren't disabled.
     * If force=true, we ignore the current state of auto-updates and do it.
     */
    function reload(force) {
        var launcher = Launcher.getCurrentInstance();
        var liveDoc = LiveDevMultiBrowser._getCurrentLiveDoc();
        var url;

        // If auto-updates are disabled, and force wasn't passed, bail.
        if(!_autoUpdate && !force) {
            return;
        }

        // Don't go any further if we don't have a live doc yet (nothing to reload)
        if(!liveDoc) {
            return;
        }

        url = BlobUtils.getUrl(liveDoc.doc.file.fullPath);

        // Don't start rewriting a URL if it's already in process (prevents infinite loop)
        if(_pendingReloadUrl === url) {
            return;
        }

        _pendingReloadUrl = url;
        launcher.launch(url, function() {
            _pendingReloadUrl = null;
        });
    }

    // Exports
    module.exports.getRemoteScript = getRemoteScript;
    module.exports.setAutoUpdate   = setAutoUpdate;
    module.exports.setIframe       = setIframe;
    module.exports.start           = start;
    module.exports.send            = send;
    module.exports.close           = close;
    module.exports.reload          = reload;
});
