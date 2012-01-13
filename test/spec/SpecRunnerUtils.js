define(function(require, exports, module) {
    
    var TEST_PREFERENCES_KEY = "com.adobe.brackets.test.preferences"
    ,   testWindow;

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

    function beforeTestWindow(spec, callback) {
        var isReady = false;

        runs(function() {
            testWindow = window.open( getBracketsSourceRoot() + "/index.html" );
        });

        waitsFor(function() {
            return testWindow.brackets && testWindow.brackets.test;
        }, 5000); 

        runs(function() {
            // all test windows should use unit test preferences
            testWindow.brackets.test.PreferencesManager._setStorageKey( TEST_PREFERENCES_KEY );

            // callback allows specs to query the testWindow before they run
            callback.call( spec, testWindow );

            isReady = true;
        });

        waitsFor(function() { return isReady; }, 5000); 
    }

    function afterTestWindow() {
        // debug-only to see testWindow state before closing
        // waits(500);

        runs(function() {
            testWindow.close();
        });
    }

    function loadProject( path ) {
        var isReady = false
        ,   projectTreeContainer;

        runs(function() {
            // find the project tree in the testWindow
            projectTreeContainer = testWindow.$("#project-files-container");

            // begin loading project path
            testWindow.brackets.test.ProjectManager.loadProject(path);
        });

        // wait for file system to finish loading
        waitsFor(function() { 
            return testWindow.brackets.test.ProjectManager.getProjectRoot().fullPath === path;
        }, "loadProject() timeout", 1000);

        // listen for "loaded.jstree" to signal ready state
        runs(function() {
            projectTreeContainer.bind("loaded.jstree", function(event, data){
                isReady = true;
            });
        });

        waitsFor(function() { return isReady; }, "jstree timeout", 1000);
    }

    exports.TEST_PREFERENCES_KEY    = TEST_PREFERENCES_KEY;
    
    exports.getTestRoot             = getTestRoot;
    exports.getTestPath             = getTestPath;
    exports.getBracketsSourceRoot   = getBracketsSourceRoot;
    exports.beforeTestWindow        = beforeTestWindow;
    exports.afterTestWindow         = afterTestWindow;
    exports.loadProject             = loadProject;
});
