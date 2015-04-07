/*global define, brackets, it, expect, describe, beforeEach, waitsFor, runs*/

define(function (require, exports, module) {
    "use strict";

    var _                   = brackets.getModule("thirdparty/lodash");
    var ExtensionManager    = brackets.getModule("extensibility/ExtensionManager");
    var ChangelogDownloader = require("ChangelogDownloader");
    var registryDownloaded  = false;

    describe("Extension Update Notifications", function () {

        beforeEach(function () {

            runs(function () {
                if (!registryDownloaded) {
                    ExtensionManager.downloadRegistry().then(function () {
                        registryDownloaded = true;
                    });
                }
            });

            waitsFor(function () {
                return registryDownloaded;
            });

            runs(function () {
                // check that registryInfo was really downloaded
                expect(_.pluck(ExtensionManager.extensions, "registryInfo").length).toBeGreaterThan(0);
            });

        });

        describe("ChangelogDownloader", function () {

            it("getDateOfVersion should return a date when extension was published", function () {
                expect(ChangelogDownloader._getDateOfVersion("zaggino.brackets-git", "0.14.10")).toBe("2015-02-10");
            });

        });

    });
});
