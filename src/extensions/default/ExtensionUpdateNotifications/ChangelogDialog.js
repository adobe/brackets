/*global brackets, define, Mustache*/

define(function (require, exports, module) {
    "use strict";

    var _                       = brackets.getModule("thirdparty/lodash");
    var Dialogs                 = brackets.getModule("widgets/Dialogs");
    var ExtensionManager        = brackets.getModule("extensibility/ExtensionManager");
    var Strings                 = brackets.getModule("strings");
    var ChangelogDownloader     = require("./ChangelogDownloader");
    var changelogDialogTemplate = require("text!ChangelogDialogTemplate.html");

    function getExtensionTitle(extensionId) {
        return ExtensionManager.extensions[extensionId].registryInfo.metadata.title;
    }

    function getCurrentVersionOfAnExtension(extensionId) {
        var installInfo = ExtensionManager.extensions[extensionId].installInfo;
        return installInfo ? installInfo.metadata.version : null;
    }

    function show(extensionId) {
        ChangelogDownloader.downloadChangelog(extensionId)
            .then(function (changelog) {

                console.log("changelog for " + extensionId);
                console.log(JSON.stringify(changelog, null, 4));

                var currentVersion = getCurrentVersionOfAnExtension(extensionId);
                if (currentVersion) {
                    var f = _.find(changelog, { version: currentVersion });
                    if (f) {
                        f.currentlyInstalled = true;
                    }
                }

                var compiledTemplate = Mustache.render(changelogDialogTemplate, {
                    title: getExtensionTitle(extensionId),
                    changelog: changelog,
                    Strings: Strings
                });

                Dialogs.showModalDialogUsingTemplate(compiledTemplate);

            })
            .catch(function (e) {
                console.error(e);
            });
    }

    exports.show = show;

});
