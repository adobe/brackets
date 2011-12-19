define(function(require, exports, module) { 
       
    function getTestRoot() {
        // /path/to/brackets/test/SpecRunner.html
        var path = window.location.href;
        path = path.substr("file://".length);
        path = path.substr(0,path.lastIndexOf("/"));

        return path;
    }
    
    function getTestPath(path) {
        return getTestRoot() + path;
    }
    
    // Export the public API 
    exports.getTestRoot = getTestRoot;
    exports.getTestPath = getTestPath;
});

