/*
 * Copyright (c) 2018 - present Adobe Systems Incorporated. All rights reserved.
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

define(function (require, exports, module) {
    "use strict";

    var ProjectManager          = require("project/ProjectManager");
    
    class Client{
        /**
         * Get name of the LSP Server. Client needs to implement this method
         * @returns {string}  Name of the LSP server clent wants to register
         */
        getServerName(){
            throw "Must implement getServerName() in Client";
        }

        /**
         * Get path to the LSP Server. Client needs to implement this method
         * @returns {string}  Path to the LSP server clent wants to register
         */
        getServerPath(){
            throw "Must implement getServerPath() in Client";
        }

        /**
         * Get Language Id of the language client wants to register server for
         * @returns {string}  Language Id of the labguage server supports.
         */
        getLanguageId(){
            throw "Must implement getLanguageId() in Client";
        }
    }

    module.exports = Client;
});