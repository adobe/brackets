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
    
    var DocumentManager     = brackets.getModule("document/DocumentManager"),
     	Filesystem          = brackets.getModule("filesystem/FileSystem"),
        RelatedFilesManager = brackets.getModule("search/RelatedFilesManager"),
        CommandManager      = brackets.getModule("command/CommandManager"),
        Commands            = brackets.getModule("command/Commands"),
        StringMatch         = brackets.getModule("utils/StringMatch"),
        PathUtils           = brackets.getModule("thirdparty/path-utils/path-utils");

    var relatedFiles = [];
    
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

	function isRemoteURL(tagurl) {
		var pattern = RegExp('^((http|https|ftp)?:?\/\/)');
        return pattern.test(tagurl); 
	} 
    
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
    
    RelatedFiles.prototype.getRelatedFiles = function() {        
        relatedFiles = [];
        parseHTML();   
        return relatedFiles;
    };

    var relatedFiles = new RelatedFiles();
    RelatedFilesManager.registerRelatedFilesProvider(relatedFiles, ['html'], 0);
});
