var SpecRunnerUtils = {
    getTestRoot: function () {
        // /path/to/brackets/test/SpecRunner.html
        var path = window.location.href;
        path = path.substr("file://".length);
        path = path.substr(0,path.lastIndexOf("/"));

        return path;
    },
    getTestPath: function(path) {
        return SpecRunnerUtils.getTestRoot() + path;
    }
};