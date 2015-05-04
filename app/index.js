#!/usr/bin/env electron

/*jshint globalstrict:true, node:true*/

"use strict";

var _ = require("lodash");
var fs = require("fs");
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
// TODO: load these from somewhere
var windowPosition = {
    posX: undefined,
    posY: undefined,
    width: 800,
    height: 600,
    maximized: false
};

var shellConfigRaw = fs.readFileSync(SHELL_CONFIG);
var shellConfig = JSON.parse(shellConfigRaw) || {};
shellConfig.position = shellConfig.position || {};

windowPosition = _.defaults(shellConfig.position, windowPosition);

function _saveWindowPosition() {
    var size = win.getSize(),
        pos = win.getPosition(),
        windowPosition = {
            posX: pos[0],
            posY: pos[1],
            width: size[0],
            height: size[1],
            maximized: win.isMaximized()
        };
    
    shellConfig.position = windowPosition;
    var shellConfigRaw = JSON.stringify(shellConfig, null, "    ");
    fs.writeFileSync(SHELL_CONFIG, shellConfigRaw);
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the javascript object is GCed.
var win = null;

// Quit when all windows are closed.
app.on("window-all-closed", function () {
    app.quit();
});

SocketServer.start(function (err, port) {
    if (err) {
        console.log("socket-server failed to start: " + err);
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
        icon: path.resolve(__dirname, "res", "appicon.png")
    };

    // TODO: load these variables from previous state
    winOptions.x = windowPosition.posX;
    winOptions.y = windowPosition.posY;
    winOptions.width = windowPosition.width;
    winOptions.height = windowPosition.height;

    // create the browser window
    win = new BrowserWindow(winOptions);

    // build a query for brackets' window
    var queryParams = {
    },
        query = "";
    if (Object.keys(queryParams).length > 0) { // check if queryParams is empty
        query = "?" + _.map(queryParams, function (value, key) {
            return key + "=" + encodeURIComponent(value);
        }).join("&");
    }

    // compose path to brackets' index file
    var indexPath = "file://" + path.resolve(__dirname, "..", "src", "index.html") + query;

    // load the index.html of the app
    win.loadUrl(indexPath);
    if (windowPosition.maximized) {
        win.maximize();
    }
    
    // emitted before the window is closed
    win.on("close", function () {
        _saveWindowPosition();
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
        _saveWindowPosition(windowPosition);
    });
    win.on("unmaximize", function () {
        _saveWindowPosition(windowPosition);
    });
    ipc.on("resize", function () {
        _saveWindowPosition(windowPosition);
    });

});
