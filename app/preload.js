(function () {
    "use strict";

    // expose electron renderer process modules, uncomment those required
    window.electron = {
        node: {
            process: window.process
        },
        ipc: require("ipc")
        // remote: require("remote"),
        // webFrame: require("web-frame"),
        // clipboard: require("clipboard"),
        // crashReporter: require("crash-reporter"),
        // nativeImage: require("native-image"),
        // screen: require("screen"),
        // shell: require("shell")
    };

    // notify shell about resizes
    window.onresize = function () {
        window.electron.ipc.send("resize");
    };

    // move injected node variables, do not move "process" as that'd break node.require
    ["require", "module", "__filename", "__dirname"].forEach(function (name) {
        window.electron.node[name] = window[name];
        delete window[name];
    });

    // inject appshell implementation into the browser window
    try { // TODO: remove try-catch when issue fixed - https://github.com/atom/electron/issues/1566
        window.appshell = window.brackets = window.electron.node.require("../app/appshell/index");
    } catch (e) {
        console.log(e.stack);
        throw e;
    }

    // hide WebSocket from Brackets as Electron integrates with node differently
    window.electron.WebSocket = window.WebSocket;
    window.WebSocket = window.electron.node.require("../app/MockWebSocket");

}());
