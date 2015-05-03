#!/usr/bin/env electron

/*jshint globalstrict:true, node:true*/

"use strict";

var app = require("app"); // Module to control application life
var BrowserWindow = require("browser-window"); // Module to create native browser window
var path = require("path"); // Node path module

// Report crashes to electron server
// TODO: doesn't work
// require("crash-reporter").start();

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the javascript object is GCed.
var win = null;

// Quit when all windows are closed.
app.on("window-all-closed", function () {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

// This method will be called when Electron has done everything
// initialization and ready for creating browser windows.
app.on("ready", function () {

    // create the browser window
    win = new BrowserWindow({
        width: 800,
        height: 600
    });

    // compose path to brackets' index file
    var indexPath = "file://" + path.resolve(__dirname, "..", "src", "index.html");

    // load the index.html of the app
    win.loadUrl(indexPath);

    // emitted when the window is closed
    win.on("closed", function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        win = null;
    });

});
