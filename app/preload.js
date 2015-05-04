(function () {
    "use strict";

    var require = window.require;
    // expose electron renderer process modules
    window.electron = {
        node: {
            process: window.process
        },
        ipc: require("ipc"),
        remote: require("remote"),
        webFrame: require("web-frame"),
        clipboard: require("clipboard"),
        crashReporter: require("crash-reporter"),
        nativeImage: require("native-image"),
        screen: require("screen"),
        shell: require("shell")
    };
    // hide injected node modules
    ["require", "module", "__filename", "__dirname", "WebSocket"].forEach(function (name) {
        window.electron.node[name] = window[name];
        delete window[name];
    });
    // inject brackets shell object
    // TODO: not sure which require to use (remote or node)
    require = window.electron.node.require;
    window.appshell = window.brackets = require("../app/appshell/index");
    window.WebSocket = require("../app/MockWebSocket");
}());
