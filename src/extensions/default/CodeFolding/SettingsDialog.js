/**
 * Configure and change settings for the code folding extension
 * @author Patrick Oladimeji
 * @date 8/23/14 12:32:46 PM
 */
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, require, brackets, Mustache, $ */
define(function (require, exports, module) {
    "use strict";
	var Dialogs = brackets.getModule("widgets/Dialogs"),
		DefaultSettings = require("DefaultSettings"),
		Strings = require("i18n!nls/strings"),
		CommandManager = brackets.getModule("command/CommandManager"),
		settingsTemplate = require("text!htmlTemplates/settings-dialog.html"),
		preferences = require("Prefs");
	
	function setFormValues(prefs) {
		$("#min-fold-size").val(prefs.minFoldSize || 2);
        $("#max-fold-level").val(prefs.maxFoldLevel || 2);
		$("#save-fold-states").prop("checked", prefs.saveFoldStates);
		$("#always-use-indent-fold").prop("checked", prefs.alwaysUseIndentFold);
		$("#enable-region-folding").prop("checked", prefs.enableRegionFolding);
		$("#fade-fold-buttons").prop("checked", prefs.fadeFoldButtons);
	}
	
	function restoreDefaults() {
		setFormValues(DefaultSettings);
	}
	
	function showDialog(cb) {
		var template = Mustache.render(settingsTemplate, Strings);
		var dialog = Dialogs.showModalDialogUsingTemplate(template);
		var useShortcuts;
		setFormValues(preferences.getAllSettings());
		
        dialog.done(function (buttonId) {
			if (buttonId === "ok") {
				var $dialog = dialog.getElement();
				var minFoldSize = $("#min-fold-size", $dialog).val();
                var maxFoldLevel = $("#max-fold-level", $dialog).val();
				preferences.setSetting("minFoldSize", isNaN(minFoldSize) || +minFoldSize === 0 ?
									   +preferences.getSetting("minFoldSize") : +minFoldSize);
				preferences.setSetting("saveFoldStates", $("#save-fold-states", $dialog).prop("checked"));
				preferences.setSetting("maxFoldLevel", isNaN(maxFoldLevel) || +maxFoldLevel === 0 ?
									   +preferences.getSetting("maxFoldLevel") : +maxFoldLevel);
                preferences.setSetting("alwaysUseIndentFold", $("#always-use-indent-fold", $dialog).prop("checked"));
				preferences.setSetting("enableRegionFolding", $("#enable-region-folding", $dialog).prop("checked"));
				preferences.setSetting("fadeFoldButtons", $("#fade-fold-buttons", $dialog).prop("checked"));
                if (cb && typeof cb === "function") {
                    cb();
                }
			}
		});
	}
	
	function bindListeners() {
		$("button[data-button-id='defaults']").on("click", function (e) {
            e.stopPropagation();
            restoreDefaults();
        });
	}
	
	bindListeners();
	
	module.exports = {
		show: showDialog
	};
});