/*
 * Copyright (c) 2012 - present Adobe Systems Incorporated. All rights reserved.
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

/*global beforeEach, afterEach, beforeFirst, afterLast, jasmine */

// Set the baseUrl to brackets/src
require.config({
    baseUrl: "../src",
    paths: {
        "test"                          : "../test",
        "perf"                          : "../test/perf",
        "spec"                          : "../test/spec",
        "text"                          : "thirdparty/text/text",
        "i18n"                          : "thirdparty/i18n/i18n",
        "react"                         : "thirdparty/react",
        "fileSystemImpl"                : "filesystem/impls/appshell/AppshellFileSystem",
        "preferences/PreferencesImpl"   : "../test/TestPreferencesImpl"
    },
    map: {
        "*": {
            "thirdparty/react":	"react"
        }
    }
});

define(function (require, exports, module) {
    'use strict';

    // Utility dependencies
    var AppInit                 = require("utils/AppInit"),
        SpecRunnerUtils         = require("spec/SpecRunnerUtils"),
        ExtensionLoader         = require("utils/ExtensionLoader"),
        Async                   = require("utils/Async"),
        FileSystem              = require("filesystem/FileSystem"),
        FileUtils               = require("file/FileUtils"),
        UrlParams               = require("utils/UrlParams").UrlParams,
        UnitTestReporter        = require("test/UnitTestReporter").UnitTestReporter,
        NodeConnection          = require("utils/NodeConnection"),
        BootstrapReporterView   = require("test/BootstrapReporterView").BootstrapReporterView,
        NativeApp               = require("utils/NativeApp");

    // Load modules for later use
    require("language/CodeInspection");
    require("thirdparty/lodash");
    require("editor/CodeHintManager");
    require("utils/Global");
    require("command/Menus");
    require("utils/NodeDomain");
    require("utils/ColorUtils");
    require("preferences/PreferencesBase");

    // Load modules that self-register and just need to get included in the test-runner window
    require("document/ChangedDocumentTracker");

    // TODO (#2155): These are used by extensions via brackets.getModule(), so tests that run those
    // extensions need these to be required up front. We need a better solution for this eventually.
    require("utils/ExtensionUtils");

    // Load both top-level suites. Filtering is applied at the top-level as a filter to BootstrapReporter.
    require("test/UnitTestSuite");
    require("test/PerformanceTestSuite");

    // Load JUnitXMLReporter
    require("test/thirdparty/jasmine-reporters/jasmine.junit_reporter");

    // Load CodeMirror add-ons--these attach themselves to the CodeMirror module
    require("thirdparty/CodeMirror/addon/fold/xml-fold");
    require("thirdparty/CodeMirror/addon/edit/matchtags");
    require("thirdparty/CodeMirror/addon/edit/matchbrackets");
    require("thirdparty/CodeMirror/addon/edit/closebrackets");
    require("thirdparty/CodeMirror/addon/edit/closetag");
    require("thirdparty/CodeMirror/addon/selection/active-line");
    require("thirdparty/CodeMirror/addon/mode/multiplex");
    require("thirdparty/CodeMirror/addon/mode/overlay");
    require("thirdparty/CodeMirror/addon/search/searchcursor");
    require("thirdparty/CodeMirror/keymap/sublime");

    var selectedSuites,
        params          = new UrlParams(),
        reporter,
        reporterView,
        _writeResults   = new $.Deferred(),
        resultsPath;

    /**
     * @const
     * Amount of time to wait before automatically rejecting the connection
     * deferred. If we hit this timeout, we'll never have a node connection
     * for the installer in this run of Brackets.
     */
    var NODE_CONNECTION_TIMEOUT = 30000; // 30 seconds - TODO: share with StaticServer?

    // parse URL parameters
    params.parse();
    resultsPath = params.get("resultsPath");

    function _loadExtensionTests() {
        // augment jasmine to identify extension unit tests
        var addSuite = jasmine.Runner.prototype.addSuite;
        jasmine.Runner.prototype.addSuite = function (suite) {
            suite.category = "extension";
            addSuite.call(this, suite);
        };

        var bracketsPath = FileUtils.getNativeBracketsDirectoryPath(),
            paths = ["default"];

        // load dev and user extensions only when running the extension test suite
        if (selectedSuites.indexOf("extension") >= 0) {
            paths.push("dev");
            paths.push(ExtensionLoader.getUserExtensionPath());
        }

        // This returns path to test folder, so convert to src
        bracketsPath = bracketsPath.replace(/\/test$/, "/src");

        return Async.doInParallel(paths, function (dir) {
            var extensionPath = dir;

            // If the item has "/" in it, assume it is a full path. Otherwise, load
            // from our source path + "/extensions/".
            if (dir.indexOf("/") === -1) {
                extensionPath = bracketsPath + "/extensions/" + dir;
            }

            return ExtensionLoader.testAllExtensionsInNativeDirectory(extensionPath);
        });
    }

    function _documentReadyHandler() {
        if (brackets.app.showDeveloperTools) {
            $("#show-dev-tools").click(function () {
                brackets.app.showDeveloperTools();
            });
        } else {
            $("#show-dev-tools").remove();
        }

        $("#reload").click(function () {
            window.location.reload(true);
        });

        if (selectedSuites.length === 1) {
            $("#" + (selectedSuites[0])).closest("li").toggleClass("active", true);
        }

        AppInit._dispatchReady(AppInit.APP_READY);

        jasmine.getEnv().execute();
    }

    function writeResults(path, text) {
        // check if the file already exists
        var file = FileSystem.getFileForPath(path);

        file.exists(function (err, exists) {
            if (err) {
                _writeResults.reject(err);
                return;
            }

            if (exists) {
                // file exists, do not overwrite
                _writeResults.reject();
            } else {
                // file not found, write the new file with xml content
                FileUtils.writeText(file, text)
                    .done(function () {
                        _writeResults.resolve();
                    })
                    .fail(function (err) {
                        _writeResults.reject(err);
                    });
            }
        });
    }

    /**
     * Listener for UnitTestReporter "runnerEnd" event. Attached only if
     * "resultsPath" URL parameter exists. Does not overwrite existing file.
     *
     * @param {!$.Event} event
     * @param {!UnitTestReporter} reporter
     */
    function _runnerEndHandler(event, reporter) {
        if (resultsPath && resultsPath.substr(-5) === ".json") {
            writeResults(resultsPath, reporter.toJSON());
        }

        _writeResults.always(function () { brackets.app.quit(); });
    }

    /**
     * Patch JUnitXMLReporter to use FileSystem and to consolidate all results
     * into a single file.
     */
    function _patchJUnitReporter() {
        jasmine.JUnitXmlReporter.prototype.reportSpecResultsOriginal = jasmine.JUnitXmlReporter.prototype.reportSpecResults;
        jasmine.JUnitXmlReporter.prototype.getNestedOutputOriginal = jasmine.JUnitXmlReporter.prototype.getNestedOutput;

        jasmine.JUnitXmlReporter.prototype.reportSpecResults = function (spec) {
            if (spec.results().skipped) {
                return;
            }

            this.reportSpecResultsOriginal(spec);
        };

        jasmine.JUnitXmlReporter.prototype.getNestedOutput = function (suite) {
            if (suite.results().totalCount === 0) {
                return "";
            }

            return this.getNestedOutputOriginal(suite);
        };

        jasmine.JUnitXmlReporter.prototype.reportRunnerResults = function (runner) {
            var suites = runner.suites(),
                output = '<?xml version="1.0" encoding="UTF-8" ?>',
                i;

            output += "\n<testsuites>";

            for (i = 0; i < suites.length; i++) {
                var suite = suites[i];
                if (!suite.parentSuite) {
                    output += this.getNestedOutput(suite);
                }
            }

            output += "\n</testsuites>";
            writeResults(resultsPath, output);

            // When all done, make it known on JUnitXmlReporter
            jasmine.JUnitXmlReporter.finished_at = (new Date()).getTime();
        };

        jasmine.JUnitXmlReporter.prototype.writeFile = function (path, filename, text) {
            // do nothing
        };
    }

    function _registerBeforeAfterHandlers() {
        // Initiailize unit test preferences for each spec
        beforeEach(function () {
            // Unique key for unit testing
            window.localStorage.setItem("preferencesKey", SpecRunnerUtils.TEST_PREFERENCES_KEY);

            // Reset preferences from previous test runs
            window.localStorage.removeItem("doLoadPreferences");
            window.localStorage.removeItem(SpecRunnerUtils.TEST_PREFERENCES_KEY);

            SpecRunnerUtils.runBeforeFirst();
        });

        // Revert unit test preferences after each spec
        afterEach(function () {
            // Clean up preferencesKey
            window.localStorage.removeItem("preferencesKey");

            SpecRunnerUtils.runAfterLast();
        });

        // Delete temp folder before running the first test
        beforeFirst(function () {
            SpecRunnerUtils.removeTempDirectory();
        });

        // Delete temp folder after running the last test
        afterLast(function () {
            SpecRunnerUtils.removeTempDirectory();
        });
    }

    function init() {
        selectedSuites = (params.get("suite") || window.localStorage.getItem("SpecRunner.suite") || "unit").split(",");

        // Create a top-level filter to show/hide performance and extensions tests
        var runAll = (selectedSuites.indexOf("all") >= 0);

        var topLevelFilter = function (spec) {
            // special case "all" suite to run unit, perf, extension, and integration tests
            if (runAll) {
                return true;
            }

            var currentSuite = spec.suite,
                category = spec.category;

            if (!category) {
                // find the category from the closest suite
                while (currentSuite) {
                    if (currentSuite.category) {
                        category = currentSuite.category;
                        break;
                    }

                    currentSuite = currentSuite.parentSuite;
                }
            }

            // if unit tests are selected, make sure there is no category in the heirarchy
            // if not a unit test, make sure the category is selected
            return (selectedSuites.indexOf("unit") >= 0 && category === undefined) ||
                (selectedSuites.indexOf(category) >= 0);
        };

        /*
         * TODO (jason-sanjose): extension unit tests should only load the
         * extension and the extensions dependencies. We should not load
         * unrelated extensions. Currently, this solution is all or nothing.
         */

        // configure spawned test windows to load extensions
        SpecRunnerUtils.setLoadExtensionsInTestWindow(selectedSuites.indexOf("extension") >= 0);

        _loadExtensionTests(selectedSuites).always(function () {
            var jasmineEnv = jasmine.getEnv();
            jasmineEnv.updateInterval = 1000;

            _registerBeforeAfterHandlers();

            // Create the reporter, which is really a model class that just gathers
            // spec and performance data.
            reporter = new UnitTestReporter(jasmineEnv, topLevelFilter, params.get("spec"));
            SpecRunnerUtils.setUnitTestReporter(reporter);

            // Optionally emit JUnit XML file for automated runs
            if (resultsPath) {
                if (resultsPath.substr(-4) === ".xml") {
                    _patchJUnitReporter();
                    jasmineEnv.addReporter(new jasmine.JUnitXmlReporter(null, true, false));
                }

                // Close the window
                $(reporter).on("runnerEnd", _runnerEndHandler);
            } else {
                _writeResults.resolve();
            }

            jasmineEnv.addReporter(reporter);

            // Create the view that displays the data from the reporter. (Usually in
            // Jasmine this is part of the reporter, but we separate them out so that
            // we can more easily grab just the model data for output during automatic
            // testing.)
            reporterView = new BootstrapReporterView(window.document, reporter);

            // remember the suite for the next unit test window launch
            window.localStorage.setItem("SpecRunner.suite", selectedSuites);

            $(window.document).ready(_documentReadyHandler);
        });


        // Prevent clicks on any link from navigating to a different page (which could lose unsaved
        // changes). We can't use a simple .on("click", "a") because of http://bugs.jquery.com/ticket/3861:
        // jQuery hides non-left clicks from such event handlers, yet middle-clicks still cause CEF to
        // navigate. Also, a capture handler is more reliable than bubble.
        window.document.body.addEventListener("click", function (e) {
            // Check parents too, in case link has inline formatting tags
            var node = e.target, url;

            while (node) {
                if (node.tagName === "A") {
                    url = node.getAttribute("href");
                    if (url && url.match(/^http/)) {
                        NativeApp.openURLInDefaultBrowser(url);
                        e.preventDefault();
                    }
                    break;
                }
                node = node.parentElement;
            }
        }, true);
    }

    function connectToTestDomain() {
        var _nodeConnectionDeferred = new $.Deferred(),
            _nodeConnection = new NodeConnection();

        _nodeConnection.connect(true).then(function () {
            var domainPath = FileUtils.getNativeBracketsDirectoryPath() + "/" + FileUtils.getNativeModuleDirectoryPath(module) + "/../test/node/TestingDomain";

            _nodeConnection.loadDomains(domainPath, true)
                .then(init, function () {
                    // Failed to connect
                    console.error("[SpecRunner] Failed to connect to node", arguments);

                    var container = $('<div class="container-fluid">');
                    container.append('<div class="alert alert-error">Failed to connect to Node</div>');

                    $(window.document.body).append(container);
                });
        });

        Async.withTimeout(_nodeConnectionDeferred.promise(), NODE_CONNECTION_TIMEOUT);

        brackets.testing = { nodeConnection: _nodeConnection };
    }

    connectToTestDomain();
});
