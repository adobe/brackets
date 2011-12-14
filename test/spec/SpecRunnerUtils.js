var SpecRunnerUtils = {
    getTestRoot: function () {
        var path = window.location.href;
        path = path.substr("file://".length);
        path = path.substr(0,path.lastIndexOf("/"));

        return path;
    }
};