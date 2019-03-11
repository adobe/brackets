/* eslint-disable indent */
/* eslint no-console: 0*/
define(function (require, exports, module) {
	"use strict";

	var LanguageManager = require("language/LanguageManager"),
		EditorManager = require("editor/EditorManager"),
		ProjectManager = require("project/ProjectManager");

	function EventPropagationProvider(client) {
		this.client = client;
		this.previousProject = "";
		this.currentProject = ProjectManager.getProjectRoot();
	}

	EventPropagationProvider.prototype._sendDocumentOpenNotification = function (languageId, document) {
		if (!this.client) {
			return;
		}

		if (this.client._languages.includes(languageId)) {
			this.client.notifyTextDocumentOpened({
				languageId: languageId,
				filePath: (document.file._path || document.file.fullPath),
				fileContent: document.getText()
			});
		}
	};

	EventPropagationProvider.prototype.handleActiveEditorChange = function (event, current, previous) {
		var self = this;

		if (!this.client) {
			return;
		}

		if (previous) {
			previous.document
				.off("languageChanged.language-tools");
			this.client.notifyTextDocumentClosed({
				filePath: (previous.document.file._path || previous.document.file.fullPath)
			});
		}
		if (current) {
			var currentLanguageId = LanguageManager.getLanguageForPath(current.document.file.fullPath).getId();
			current.document
				.on("languageChanged.language-tools", function () {
					var languageId = LanguageManager.getLanguageForPath(current.document.file.fullPath).getId();
					self._sendDocumentOpenNotification(languageId, current.document);
				});
			self._sendDocumentOpenNotification(currentLanguageId, current.document);
		}
	};

	EventPropagationProvider.prototype.handleProjectOpen = function (event, directory) {
		if (!this.client) {
			return;
		}

		this.currentProject = directory.fullPath;

		this.client.notifyProjectRootsChanged({
			foldersAdded: [this.currentProject],
			foldersRemoved: [this.previousProject]
		});
	};

	EventPropagationProvider.prototype.handleProjectClose = function (event, directory) {
		if (!this.client) {
			return;
		}

		this.previousProject = directory.fullPath;
	};

	EventPropagationProvider.prototype.handleDocumentDirty = function (event, document) {
		if (!this.client) {
			return;
		}

		if (!document.isDirty) {
			this.client.notifyTextDocumentSave({
				filePath: (document.file._path || document.file.fullPath)
			});
		}
	};

	EventPropagationProvider.prototype.handleDocumentChange = function (event, document, changeList) {
		if (!this.client) {
			return;
		}

		this.client.notifyTextDocumentChanged({
			filePath: (document.file._path || document.file.fullPath),
			fileContent: document.getText()
		});
	};

	EventPropagationProvider.prototype.handleDocumentRename = function (event, oldName, newName) {
		if (!this.client) {
			return;
		}

		this.client.notifyTextDocumentClosed({
			filePath: oldName
		});
	};

	EventPropagationProvider.prototype.registerClientForEditorEvent = function () {
		if (this.client) {
			var handleActiveEditorChange = this.handleActiveEditorChange.bind(this),
				handleProjectOpen = this.handleProjectOpen.bind(this),
				handleProjectClose = this.handleProjectClose.bind(this),
				handleDocumentDirty = this.handleDocumentDirty.bind(this),
				handleDocumentChange = this.handleDocumentChange.bind(this),
				handleDocumentRename = this.handleDocumentRename.bind(this);

			this.client.addOnEditorChangeHandler(handleActiveEditorChange);
			this.client.addOnProjectOpenHandler(handleProjectOpen);
			this.client.addBeforeProjectCloseHandler(handleProjectClose);
			this.client.addOnDocumentDirtyFlagChangeHandler(handleDocumentDirty);
			this.client.addOnDocumentChangeHandler(handleDocumentChange);
			this.client.addOnFileRenameHandler(handleDocumentRename);
			
			this.handleActiveEditorChange(null, EditorManager.getActiveEditor(), null);
		} else {
			console.log("No client provided for event propagation");
		}
	};

	exports.EventPropagationProvider = EventPropagationProvider;
});
