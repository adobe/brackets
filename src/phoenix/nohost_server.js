/*
 * Copyright (c) 2021 - present core.ai . All rights reserved.
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

// jshint ignore: start
/*global navigator*/
/*eslint-env es6*/
/*eslint no-console: 0*/
/*eslint strict: ["error", "global"]*/


/** Sets up a web server for the local phoenix virtual file system root.
 * Based on https://github.com/humphd/nohost
 *
 * This module should be functionally as light weight as possible with minimal deps as it is a shell component.
 * **/


import { Workbox } from 'https://storage.googleapis.com/workbox-cdn/releases/4.0.0/workbox-window.prod.mjs';

function getRoute(){
    const pathName = window.location.pathname;
    const basePath = pathName.substring(0, pathName.lastIndexOf("/"));
    return `${basePath}/phoenix/vfs`;
}

function serverReady() {
    console.log(`Server ready! Serving files on url: ${window.location.origin + getRoute()}`);
}

function serverInstall() {
    console.log('Web server Worker installed.');
}

/**
 * Register the nohost service worker, passing `route` or other options.
 */
if ('serviceWorker' in navigator) {
    console.log(window.location.href);

    const wb = new Workbox(`nohost-sw.js?route=${getRoute()}`);
    // for debug, use this URL`nohost-sw.js?debug&route=${basePath}/phoenix/vfs`

    // Wait on the server to be fully ready to handle routing requests
    wb.controlling.then(serverReady);

    // Deal with first-run install, if necessary
    wb.addEventListener('installed', (event) => {
        if(!event.isUpdate) {
            serverInstall();
        }
    });

    wb.register();
}
