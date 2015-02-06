/*global define*/

define(function (require, exports, module) {
    "use strict";

    var ChangelogDownloader = require("./ChangelogDownloader");

    function show(extensionId) {
        ChangelogDownloader.downloadChangelog(extensionId)
            .then(function (changelog) {
                console.log("changelog for " + extensionId);
                console.log(JSON.stringify(changelog, null, 4));
            })
            .catch(function (e) {
                console.error(e);
            });
    }

    exports.show = show;

});
