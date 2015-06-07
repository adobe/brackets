/*global self, importScripts, require */

importScripts("thirdparty/requirejs/require.js");

(function () {
    "use strict";
    var FindInFiles, Strings, StringUtils;
    
    require(["./FindInFiles", "strings", "utils/StringUtils"], function (findInFiles, strings, stringUtils) {
        FindInFiles = findInFiles;
        Strings = strings;
        StringUtils = stringUtils;
        
        function search(queryInfo, scope, filter, replaceText, candidateFilesPromise) {
            FindInFiles.doSearchInScope(queryInfo, scope, filter, replaceText, candidateFilesPromise);
        }

        self.addEventListener('message', function (e) {
            var search_object = e.data;
            console.log(search_object.queryInfo + ";" + search_object.scope + ";" + search_object.filter + ";" + search_object.replaceText + ";");
            self.postMessage("Web worker: OK!! Done searching for \"" + search_object.queryInfo.query + "\"");
        }, false);
    });

}());
