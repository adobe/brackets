#!/usr/bin/env electron

/*jshint globalstrict:true, node:true*/

"use strict";

var _ = require("lodash");
var fs = require("fs-extra");
var path = require("path");
var app = require("app"); // Electron module to control application life
var BrowserWindow = require("browser-window"); // Electron to create native browser window
var ipc = require("ipc"); // Electron ipc module
var SocketServer = require("./socket-server"); // Implementation of Brackets' shell server
var utils = require("./utils");

// Report crashes to electron server
// TODO: doesn't work
// require("crash-reporter").start();

var APP_NAME = "Brackets-Electron";
var SHELL_CONFIG = path.resolve(utils.convertWindowsPathToUnixPath(app.getPath("userData")), "shell-config.json");

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the javascript object is GCed.
var win = null;

// load the shell config, recreate empty if file doesn't exist
var shellConfig;
try {
    shellConfig = fs.readJsonSync(SHELL_CONFIG);
} catch (err) {
    if (err.code === "ENOENT") {
        shellConfig = fs.readJsonSync(path.resolve(__dirname, "default-shell-config.json"));
        fs.writeJsonSync(SHELL_CONFIG, shellConfig);
    } else if (err.name === "SyntaxError") {
        throw new Error("File is not a valid json: " + SHELL_CONFIG);
    } else {
        throw err;
    }
}

// fetch window position values from the window and save them to config file
function _saveWindowPosition(sync) {
    var writeJson = sync ? fs.writeJsonSync : fs.writeJson;
    var size = win.getSize();
    var pos = win.getPosition();
    shellConfig.window.posX = pos[0];
    shellConfig.window.posY = pos[1];
    shellConfig.window.width = size[0];
    shellConfig.window.height = size[1];
    shellConfig.window.maximized = win.isMaximized();
    writeJson(SHELL_CONFIG, shellConfig);
}
var saveWindowPositionSync = _.partial(_saveWindowPosition, true);
var saveWindowPosition = _.debounce(_saveWindowPosition, 100);

// Quit when all windows are closed.
app.on("window-all-closed", function () {
    app.quit();
});

// Start the socket server used by Brackets'
SocketServer.start(function (err, port) {
    if (err) {
        console.log("socket-server failed to start: " + utils.errToString(err));
    } else {
        console.log("socket-server started on port " + port);
    }
});

// This method will be called when Electron has done everything
// initialization and ready for creating browser windows.
app.on("ready", function () {

    var winOptions = {
        preload: require.resolve("./preload"),
        title: APP_NAME,
        icon: path.resolve(__dirname, "res", "appicon.png"),
        x: shellConfig.window.posX,
        y: shellConfig.window.posY,
        width: shellConfig.window.width,
        height: shellConfig.window.height
    };

    // create the browser window
    win = new BrowserWindow(winOptions);

    // build a query for brackets' window
    var queryParams = {};
    var query = "";
    if (Object.keys(queryParams).length > 0) { // check if queryParams is empty
        query = "?" + _.map(queryParams, function (value, key) {
            return key + "=" + encodeURIComponent(value);
        }).join("&");
    }

    // compose path to brackets' index file
    var indexPath = "file://" + path.resolve(__dirname, "..", "src", "index.html") + query;

    // load the index.html of the app
    win.loadUrl(indexPath);
    if (shellConfig.window.maximized) {
        win.maximize();
    }
    
    // emitted before the window is closed
    win.on("close", function () {
        saveWindowPositionSync();
    });

    // emitted when the window is closed
    win.on("closed", function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        win = null;
    });

    /* TODO: doesn't work for some reason
    win.on("page-title-updated", function (event) {
        win.setTitle(win.getTitle().replace(/Brackets/, APP_NAME));
        event.preventDefault();
    });
    */

    // this is used to remember the size from the last time
    win.on("maximize", function () {
        saveWindowPosition();
    });
    win.on("unmaximize", function () {
        saveWindowPosition();
    });
    ipc.on("resize", function () {
        saveWindowPosition();
    });

});
