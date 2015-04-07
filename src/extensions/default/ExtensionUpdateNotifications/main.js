/*global $, brackets, define*/

define(function (require, exports, module) {
    "use strict";

    var AppInit         = brackets.getModule("utils/AppInit"),
        ExtensionUtils  = brackets.getModule("utils/ExtensionUtils"),
        Strings         = brackets.getModule("strings"),
        ChangelogDialog = require("./ChangelogDialog"),
        Watchers        = require("./Watchers");

    ExtensionUtils.loadStyleSheet(module, "styles.css");

    function onExtensionManagerOpen($modalBody) {

        // wait until buttons are loaded (spinner goes away) and attach additional buttons
        Watchers.watchChildren($modalBody, "button.install,button.remove", function ($installBtn) {
            $("<button>")
                .addClass("btn btn-mini show-changelog")
                .attr("data-extension-id", $installBtn.attr("data-extension-id"))
                .text(Strings.SEE_CHANGELOG)
                .appendTo($installBtn.parent());
        }, {
            watchOnce: true
        });

        // attach an event for the new buttons
        $modalBody.on("click", "button.show-changelog", function () {
            ChangelogDialog.show($(this).attr("data-extension-id"));
        });

    }

    AppInit.appReady(function () {
        Watchers.watchChildren(document.body, ".extension-manager-dialog > .modal-body", onExtensionManagerOpen);
    });

});
