#!/usr/bin/env electron

/*jshint globalstrict:true, node:true*/

"use strict";

var _ = require("lodash");
var app = require("app"); // Module to control application life
var BrowserWindow = require("browser-window"); // Module to create native browser window
var ipc = require("ipc");
var path = require("path"); // Node path module
var SocketServer = require("./socket-server"); // Implementation to replace shell server

// Report crashes to electron server
// TODO: doesn't work
// require("crash-reporter").start();

var APP_NAME = "Brackets-Electron";
// TODO: load these from somewhere
var sizeX = 800;
var sizeY = 600;
var maximized = false;

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
    // winOptions.x = ?;
    // winOptions.y = ?;
    winOptions.width = sizeX;
    winOptions.height = sizeY;

    // create the browser window
    win = new BrowserWindow(winOptions);

    // build a query for brackets' window
    var queryParams = {
        hasNativeMenus: true
    };
    var query = "?" + _.map(queryParams, function (value, key) {
        return key + "=" + encodeURIComponent(value);
    }).join("&");

    // compose path to brackets' index file
    var indexPath = "file://" + path.resolve(__dirname, "..", "src", "index.html") + query;

    // load the index.html of the app
    win.loadUrl(indexPath);

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
        maximized = true;
        // TODO: save somewhere
    });
    win.on("unmaximize", function () {
        maximized = false;
        // TODO: save somewhere
    });
    ipc.on("resize", function () {
        var size = win.getSize();
        sizeX = size[0];
        sizeY = size[1];
        // TODO: save somewhere
    });

});
