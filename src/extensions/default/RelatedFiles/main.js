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
    'use strict';
    
    // Load dependent modules.
    var AppInit             = brackets.getModule("utils/AppInit"),
        DocumentManager     = brackets.getModule("document/DocumentManager"),
     	Filesystem          = brackets.getModule("filesystem/FileSystem"),
        CommandManager      = brackets.getModule("command/CommandManager"),
        Commands            = brackets.getModule("command/Commands"),
        StringMatch         = brackets.getModule("utils/StringMatch"),
        RelatedFilesManager = brackets.getModule("search/RelatedFilesManager"),
        PathUtils           = brackets.getModule("thirdparty/path-utils/path-utils");

    /**
    * @private
    * 
    * Used to keep track of list of Related Files for a given document.
    *
    **/
    var relatedFiles;
    
    /**
    * Parse the current document to find out dependencies in link and script tags.
    * Identify whether a link is for local file or is a remote link.
    * Store all related files link in relatedFiles variable.
    **/
    function parseHTML()
    {
        var currentDocument = DocumentManager.getCurrentDocument();
        if (window.DOMParser && currentDocument)
        {
			var docText = currentDocument.getText();
            var document = new DOMParser().parseFromString(docText, "text/html");
        
            var linkTags = $(document).find("link[rel='stylesheet']");
            var scriptTags = $(document).find("script[src!=null]");
            
        	var i, fileURI, searchResult;
			
            // Search for href in link tag to get related file.
            for (i = 0; i < linkTags.length; i++) {
                var linkHref = linkTags[i].getAttribute("href");
                if (linkHref !== null) {
                    if (isRemoteURL(linkHref)) {
                        searchResult = getLinkFromRemoteURL(linkHref);
                    }
                    else if (PathUtils.isAbsoluteUrl(linkHref)) {
                        searchResult = getLinkFromLocalURL(linkHref);
                    }
                    else {
                        fileURI = getAbsoultePath(currentDocument.file.fullPath, linkHref);
                        searchResult = getLinkFromLocalURL(fileURI);
                    }
                    if (searchResult) {
                        relatedFiles.push(searchResult);    
                    }
                }
            }    
            // Search for src in script tag to get related files.
            for (i = 0; i < scriptTags.length; i++) {
                var scriptSrc = scriptTags[i].getAttribute("src");
                if (scriptSrc !== null) {
                    if (isRemoteURL(scriptSrc)) {
                        searchResult = getLinkFromRemoteURL(scriptSrc);
                    }
                    else if (PathUtils.isAbsoluteUrl(scriptSrc)) {
                        searchResult = getLinkFromLocalURL(scriptSrc);
                    }
                    else {
                        fileURI = getAbsoultePath(currentDocument.file.fullPath, scriptSrc);
                        searchResult = getLinkFromLocalURL(fileURI);
                    }
                    if (searchResult) {
                        relatedFiles.push(searchResult);    
                    }
                }
            }
        }
    }

    /**
    * Check whether a given string is remote url.
    * @param {string} tagurl The url which is to be checked for remote link.
    * @returns {Boolean} true if the url matches regular expression for remote url.
    **/
	function isRemoteURL(tagurl) {
		var pattern = RegExp('^((http|https|ftp)?:?\/\/)');
        return pattern.test(tagurl); 
	} 
    
    /**
    * Create a SearchResult object which has path information about the local file.
    * @params {string} tagurl The url from which file path information is to be extracted.
    * @returns {Object} SearchResult object which has file path information.
    **/
    function getLinkFromLocalURL(tagurl) {
        var searchResult = new StringMatch.SearchResult (tagurl);
        var file = Filesystem.getFileForPath(tagurl);
        searchResult.label = file._name;
        searchResult.fullPath = file._path;
        searchResult.stringRanges = [{
            text: file._path,
            matched: false,
            includesLastSegment: true
        }];
        return searchResult;
    }
    
    /**
    * Create a SearchResult object which has path information about the remote file url.
    * @params {string} tagurl The url from which file path information is to be extracted.
    * @returns {Object} SearchResult object which has remote link path information.
    **/
    function getLinkFromRemoteURL (tagurl) {
        var regex = /:\/\/(.[^/]+)/;
        var url = regex.exec(tagurl);
        if (url && url[1]) {
            var searchResult = new StringMatch.SearchResult(tagurl);
            searchResult.label =   url[1];
            searchResult.fullPath = tagurl;
            searchResult.stringRanges = [{
                text: tagurl,
                matched: false,
                includesLastSegment: false,
                includesFirstSegment: true
            }];
            return searchResult;
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
        var baseUrl = base.split("/"),
            relativeUrl = relative.split("/");
        baseUrl.pop();
    
        for(var i = 0; i < relativeUrl.length; i++) {
            if (relativeUrl[i] === ".") {
                continue;
            }
            if (relativeUrl[i] === "..") {
                baseUrl.pop();
            }
            else {
                baseUrl.push(relativeUrl[i]);
            }
        }
        return baseUrl.join("/");
    }
    
    function RelatedFiles() {
        
    }
    
    /**
    * Gets list of realted files.
    * @returns {List} List of realted files.
    **/
    RelatedFiles.prototype.getRelatedFiles = function() {        
        relatedFiles = [];
        parseHTML();   
        return relatedFiles;
    };

    AppInit.appReady(function () {
        var relatedFiles = new RelatedFiles();
    
        // Register Related files provider for HTML document.
        RelatedFilesManager.registerRelatedFilesProvider(relatedFiles, ['html'], 0);
    
        exports.relatedFiles = relatedFiles;
    });
});
