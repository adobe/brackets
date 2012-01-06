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
    
    function getBracketsSourceRoot() {
        var path = window.location.href;
        path = path.substr("file://".length).split("/");
        path = path.slice(0, length - 2);
        path.push("src");
        return path.join("/");
    }
    
    exports.getTestRoot             = getTestRoot;
    exports.getTestPath             = getTestPath;
    exports.getBracketsSourceRoot   = getBracketsSourceRoot;
});
