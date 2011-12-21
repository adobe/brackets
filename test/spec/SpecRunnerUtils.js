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
    },
    getBracketsSourceRoot: function() {
        var path = window.location.href;
        path = path.substr("file://".length).split("/");
        path = path.slice(0, length - 2);
        path.push("src");
        return path.join("/");
    }
};