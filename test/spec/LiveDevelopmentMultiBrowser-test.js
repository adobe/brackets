/*
 * Copyright (c) 2014 - present Adobe Systems Incorporated. All rights reserved.
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

/*global define, describe, beforeEach, runs, afterEach, waitsFor, it, xit, waitsForDone, expect */

define(function (require, exports, module) {
    "use strict";

    var SpecRunnerUtils = require("spec/SpecRunnerUtils");

    describe("MultiBrowser (experimental)", function () {

        this.category = "livepreview";

        var testWindow,
            brackets,
            DocumentManager,
            LiveDevelopment,
            LiveDevProtocol;

        var testFolder = SpecRunnerUtils.getTestPath("/spec/LiveDevelopment-MultiBrowser-test-files"),
            allSpacesRE = /\s+/gi;

        function fixSpaces(str) {
            return str.replace(allSpacesRE, " ");
        }

        beforeEach(function () {
            // Create a new window that will be shared by ALL tests in this spec.
            if (!testWindow) {
                runs(function () {
                    SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
                        testWindow = w;
                        // Load module instances from brackets.test
                        brackets = testWindow.brackets;
                        DocumentManager = brackets.test.DocumentManager;
                        LiveDevelopment = brackets.test.LiveDevMultiBrowser;
                        LiveDevProtocol = require("LiveDevelopment/MultiBrowserImpl/protocol/LiveDevProtocol");
                    });
                });

                runs(function () {
                    SpecRunnerUtils.loadProjectInTestWindow(testFolder);
                });
            }
        });

        afterEach(function () {
            LiveDevelopment.close();
            SpecRunnerUtils.closeTestWindow();
            testWindow = null;
            brackets = null;
            LiveDevelopment = null;
            LiveDevProtocol = null;
        });

        function waitsForLiveDevelopmentToOpen() {
            runs(function () {
                LiveDevelopment.open();
            });
            waitsFor(
                function isLiveDevelopmentActive() {
                    return LiveDevelopment.status === LiveDevelopment.STATUS_ACTIVE;
                },
                "livedevelopment.done.opened",
                5000
            );
        }

        describe("Init Session", function () {

            it("should establish a browser connection for an opened html file", function () {
                //open a file
                runs(function () {
                    waitsForDone(SpecRunnerUtils.openProjectFiles(["simple1.html"]), "SpecRunnerUtils.openProjectFiles simple1.html", 1000);
                });

                waitsForLiveDevelopmentToOpen();

                runs(function () {
                    expect(LiveDevelopment.status).toBe(LiveDevelopment.STATUS_ACTIVE);
                });
            });

            it("should establish a browser connection for an opened html file that has no 'head' tag", function () {
                //open a file
                runs(function () {
                    waitsForDone(SpecRunnerUtils.openProjectFiles(["withoutHead.html"]), "SpecRunnerUtils.openProjectFiles withoutHead.html", 1000);
                });

                waitsForLiveDevelopmentToOpen();

                runs(function () {
                    expect(LiveDevelopment.status).toBe(LiveDevelopment.STATUS_ACTIVE);
                });
            });

            it("should find an index.html in a parent directory", function () {
                runs(function () {
                    waitsForDone(SpecRunnerUtils.openProjectFiles(["sub/test.css"]), "SpecRunnerUtils.openProjectFiles sub/test.css", 1000);
                });

                waitsForLiveDevelopmentToOpen();

                runs(function () {
                    expect(LiveDevelopment._getCurrentLiveDoc().doc.url).toMatch(/\/index\.html$/);
                });
            });

            it("should send all external stylesheets as related docs on start-up", function () {
                var liveDoc;
                runs(function () {
                    waitsForDone(SpecRunnerUtils.openProjectFiles(["simple1.html"]), "SpecRunnerUtils.openProjectFiles simple1.html", 1000);
                });
                waitsForLiveDevelopmentToOpen();
                runs(function () {
                    liveDoc = LiveDevelopment._getCurrentLiveDoc();
                });
                waitsFor(
                    function relatedDocsReceived() {
                        return (Object.getOwnPropertyNames(liveDoc.getRelated().stylesheets).length > 0);
                    },
                    "relatedDocuments.done.received",
                    10000
                );
                runs(function () {
                    expect(liveDoc.isRelated(testFolder + "/simple1.css")).toBeTruthy();
                });
                runs(function () {
                    expect(liveDoc.isRelated(testFolder + "/simpleShared.css")).toBeTruthy();
                });
            });

            it("should send all import-ed stylesheets as related docs on start-up", function () {
                var liveDoc;
                runs(function () {
                    waitsForDone(SpecRunnerUtils.openProjectFiles(["simple1.html"]), "SpecRunnerUtils.openProjectFiles simple1.html", 1000);
                });
                waitsForLiveDevelopmentToOpen();
                runs(function () {
                    liveDoc = LiveDevelopment._getCurrentLiveDoc();
                });
                waitsFor(
                    function relatedDocsReceived() {
                        return (Object.getOwnPropertyNames(liveDoc.getRelated().scripts).length > 0);
                    },
                    "relatedDocuments.done.received",
                    10000
                );
                runs(function () {
                    expect(liveDoc.isRelated(testFolder + "/import1.css")).toBeTruthy();
                });
            });

            it("should send all external javascript files as related docs on start-up", function () {
                var liveDoc;
                runs(function () {
                    waitsForDone(SpecRunnerUtils.openProjectFiles(["simple1.html"]), "SpecRunnerUtils.openProjectFiles simple1.html", 1000);
                });
                waitsForLiveDevelopmentToOpen();

                runs(function () {
                    liveDoc = LiveDevelopment._getCurrentLiveDoc();
                });
                waitsFor(
                    function relatedDocsReceived() {
                        return (Object.getOwnPropertyNames(liveDoc.getRelated().scripts).length > 0);
                    },
                    "relatedDocuments.done.received",
                    10000
                );
                runs(function () {
                    expect(liveDoc.isRelated(testFolder + "/simple1.js")).toBeTruthy();
                });
            });

            it("should send notifications for added/removed stylesheets through link nodes", function () {
                var liveDoc;
                runs(function () {
                    waitsForDone(SpecRunnerUtils.openProjectFiles(["simple1.html"]), "SpecRunnerUtils.openProjectFiles simple1.html", 1000);
                });
                waitsForLiveDevelopmentToOpen();

                runs(function () {
                    liveDoc = LiveDevelopment._getCurrentLiveDoc();
                });

                runs(function () {
                    var curDoc =  DocumentManager.getCurrentDocument();
                    curDoc.replaceRange('<link href="simple2.css" rel="stylesheet">\n', {line: 8, ch: 0});
                });

                waitsFor(
                    function relatedDocsReceived() {
                        return (Object.getOwnPropertyNames(liveDoc.getRelated().stylesheets).length === 4);
                    },
                    "relatedDocuments.done.received",
                    10000
                );

                runs(function () {
                    expect(liveDoc.isRelated(testFolder + "/simple2.css")).toBeTruthy();
                });

                runs(function () {
                    var curDoc =  DocumentManager.getCurrentDocument();
                    curDoc.replaceRange('', {line: 8, ch: 0}, {line: 8, ch: 50});
                });

                waitsFor(
                    function relatedDocsReceived() {
                        return (Object.getOwnPropertyNames(liveDoc.getRelated().stylesheets).length === 3);
                    },
                    "relatedDocuments.done.received",
                    10000
                );

                runs(function () {
                    expect(liveDoc.isRelated(testFolder + "/simple2.css")).toBeFalsy();
                });
            });


            it("should push changes through browser connection when editing a related CSS", function () {
                var localText,
                    browserText,
                    liveDoc,
                    curDoc;

                runs(function () {
                    waitsForDone(SpecRunnerUtils.openProjectFiles(["simple1.html"]), "SpecRunnerUtils.openProjectFiles simple1.html", 1000);
                });

                waitsForLiveDevelopmentToOpen();

                runs(function () {
                    waitsForDone(SpecRunnerUtils.openProjectFiles(["simple1.css"]), "SpecRunnerUtils.openProjectFiles simple1.css", 1000);
                });
                runs(function () {
                    curDoc =  DocumentManager.getCurrentDocument();
                    localText = curDoc.getText();
                    localText += "\n .testClass { background-color:#090; }\n";
                    curDoc.setText(localText);
                });
                runs(function () {
                    liveDoc = LiveDevelopment.getLiveDocForPath(testFolder + "/simple1.css");
                });
                var doneSyncing = false;
                runs(function () {
                    liveDoc.getSourceFromBrowser().done(function (text) {
                        browserText = text;
                    }).always(function () {
                        doneSyncing = true;
                    });
                });
                waitsFor(function () { return doneSyncing; }, "Browser to sync changes", 5000);

                runs(function () {
                    expect(fixSpaces(browserText)).toBe(fixSpaces(localText));
                });
            });

            xit("should push in memory css changes made before the session starts", function () {
                var localText,
                    browserText;

                runs(function () {
                    waitsForDone(SpecRunnerUtils.openProjectFiles(["simple1.css"]), "SpecRunnerUtils.openProjectFiles simple1.css", 1000);
                });

                runs(function () {
                    var curDoc =  DocumentManager.getCurrentDocument();
                    localText = curDoc.getText();
                    localText += "\n .testClass { background-color:#090; }\n";
                    curDoc.setText(localText);

                    // Document should not be marked dirty
                    expect(LiveDevelopment.status).not.toBe(LiveDevelopment.STATUS_OUT_OF_SYNC);
                });

                runs(function () {
                    waitsForDone(SpecRunnerUtils.openProjectFiles(["simple1.html"]), "SpecRunnerUtils.openProjectFiles simple1.html", 1000);
                });

                waitsForLiveDevelopmentToOpen();


                var liveDoc, doneSyncing = false;
                runs(function () {
                    liveDoc = LiveDevelopment.getLiveDocForPath(testFolder + "/simple1.css");
                });

                runs(function () {
                    liveDoc.getSourceFromBrowser().done(function (text) {
                        browserText = text;
                    }).always(function () {
                        doneSyncing = true;
                    });
                });
                waitsFor(function () { return doneSyncing; }, "Browser to sync changes", 10000);

                runs(function () {
                    expect(fixSpaces(browserText)).toBe(fixSpaces(localText));
                });
            });
        });
    });
});
