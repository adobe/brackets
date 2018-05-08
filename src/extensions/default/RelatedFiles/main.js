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

/*global DOMParser */
/*global Promise */

define(function (require, exports, module) {
    'use strict';

    // Load dependent modules.
    var AppInit             = brackets.getModule("utils/AppInit"),
        DocumentManager     = brackets.getModule("document/DocumentManager"),
        Filesystem          = brackets.getModule("filesystem/FileSystem"),
        StringMatch         = brackets.getModule("utils/StringMatch"),
        FileUtils           = brackets.getModule("file/FileUtils"),
        PathUtils           = brackets.getModule("thirdparty/path-utils/path-utils");

    /**
    * @private
    *
    * Used to keep track of list of Related Files for a given document.
    *
    **/
    var relatedFiles, domParser;

    // Creates a SearchResult object with given parameters.
    function createSearchResultObject(label, fullPath, includesFirstSegment, includesLastSegment) {
        var searchResult = new StringMatch.SearchResult(fullPath);
        searchResult.label = label;
        searchResult.fullPath = fullPath;
        searchResult.stringRanges = [{
            text: fullPath,
            match: false,
            includesFisrtSegment: includesFirstSegment,
            includesLastSegment: includesLastSegment
        }];
        return searchResult;
    }

    /**
    * Check whether a given string is remote url.
    * @param {string} tagurl The url which is to be checked for remote link.
    * @returns {Boolean} true if the url matches regular expression for remote url.
    **/
    function isRemoteURL(tagurl) {
        var pattern = new RegExp('^((http|https|ftp)?:?\/\/)');
        return pattern.test(tagurl);
    }

    /**
    * Create a SearchResult object which has path information about the local file.
    * @params {string} tagurl The url from which file path information is to be extracted.
    * @returns {Object} SearchResult object which has file path information.
    **/
    function getLinkFromLocalURL(tagurl) {
        var file = Filesystem.getFileForPath(tagurl);
        return createSearchResultObject(file._name, file._path, false, true);
    }

    /**
    * Create a SearchResult object which has path information about the remote file url.
    * @params {string} tagurl The url from which file path information is to be extracted.
    * @returns {Object} SearchResult object which has remote link path information.
    **/
    function getLinkFromRemoteURL(tagurl) {
        var url = FileUtils.getParentPath(tagurl);
        if (url) {
            return createSearchResultObject(url, tagurl, true, false);
        }
        return null;
    }

    /**
    * Create abosulte path for a file from relative path.
    * @params {string} base Path of the current document.
    * @params {string} relative Relative path of a file which is to be converted to absolute path.
    * @returns {string} Absolute path of the given relative path with calculated wrt base.
    **/
    function getAbsoultePath(base, relative) {
        var relativeUrl = relative.split("/");
        var baseUrl = base.split("/");

        var i;
        for (i = 0; i < relativeUrl.length; i++) {
            if (relativeUrl[i] === "..") {
                baseUrl.pop();
            }
            if (relativeUrl[i] !== ".") {
                baseUrl.push(relativeUrl[i]);
            }
        }
        return baseUrl.join("/");
    }

    function getBasePath(base) {
        var baseUrl = base.split("/");
        baseUrl.pop();
        return baseUrl.join("/");
    }

    /**
    * Extract related files name from link/script tag and update relatedFiles list.
    * @param {Object} currentDocument Object of current document.
    * @param {List} tagList List of link/script tags.
    * @param {List} attribute Tag attribute that is to be extracted depending on the tag type.
    **/
    function extractRelatedFilesFromTagAttribute(currentDocument, tagList, attribute) {
        var fileURI, searchResult;

        var basePath = getBasePath(currentDocument.file.fullPath);
        var i;
        for (i = 0; i < tagList.length; i++) {
            var fileLink = tagList[i].getAttribute(attribute);
            if (fileLink !== null) {
                if (isRemoteURL(fileLink)) {
                    searchResult = getLinkFromRemoteURL(fileLink);
                } else if (PathUtils.isAbsoluteUrl(fileLink)) {
                    searchResult = getLinkFromLocalURL(fileLink);
                } else {
                    fileURI = getAbsoultePath(basePath, fileLink);
                    searchResult = getLinkFromLocalURL(fileURI);
                }
                if (searchResult) {
                    relatedFiles.push(searchResult);
                }
            }
        }
    }

    /**
    * Parse the current document to find out dependencies in link and script tags.
    * Identify whether a link is for local file or is a remote link.
    * Store all related files link in relatedFiles variable.
    **/
    function parseHTML(currentDocument) {
        if (currentDocument === null) {
            currentDocument = DocumentManager.getCurrentDocument();
        }
        if (domParser && currentDocument.getLanguage().getId() === 'html') {
            var docText = currentDocument.getText();
            var document = domParser.parseFromString(docText, "text/html");

            var linkTags = $(document).find("link[rel='stylesheet']");
            var scriptTags = $(document).find("script[src!=null]");

            // Search for href in link tag to get related file.
            extractRelatedFilesFromTagAttribute(currentDocument, linkTags, "href");

            // Search for src in script tag to get related files.
            extractRelatedFilesFromTagAttribute(currentDocument, scriptTags, "src");
        }
    }

    function RelatedFiles() {
        if (window.DOMParser) {
            domParser = new DOMParser();
        }
    }

    /**
    * Gets list of realted files.
    * @returns {Promise} Promise has list of realted files.
    **/
    RelatedFiles.prototype.getRelatedFiles = function (currentDocument) {
        relatedFiles = [];
        parseHTML(currentDocument);
        return new Promise(function (resolve, reject) {
            resolve(relatedFiles);
        });
    };

    AppInit.appReady(function () {
        exports.relatedFiles = relatedFiles;
    });
});
