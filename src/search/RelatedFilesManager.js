define(function (require, exports, module) {
    "use strict";
    
    var QuickOpen           = require("search/QuickOpen"),
        QuickOpenHelper     = require("search/QuickOpenHelper"),
        Commands            = require("command/Commands"),
        CommandManager      = require("command/CommandManager"),
        DocumentManager     = require("document/DocumentManager"),
        Strings             = require("strings"),
        EditorManager       = require("editor/EditorManager");
    
    var relatedFilesProviders    = { "all" : [] };
        
    function registerRelatedFilesProvider(providerInfo, languageIds, priority) {
        var providerObj = {
            provider: providerInfo,
            priority: priority || 0
        };
        
        if (languageIds.indexOf("all") !== -1) {
            var languageId;
            for (languageId in relatedFilesProviders) {
                if (relatedFilesProviders.hasOwnProperty(languageId)) {
                    relatedFilesProviders[languageId].push(providerObj);
                    relatedFilesProviders[languageId].sort(_providerSort);
                }
            }
        } else {
            languageIds.forEach(function (languageId) {
                if (!relatedFilesProviders[languageId]) {
                    relatedFilesProviders[languageId] = Array.prototype.concat(relatedFilesProviders.all);
                }
                relatedFilesProviders[languageId].push(providerObj);
                relatedFilesProviders[languageId].sort(_providerSort);
            });
        }
        
        addRelatedFilesPlugin();
    }
    
    function _providerSort(a, b) {
        return b.priority - a.priority;
    }
    
    function _getProvidersForLanguageIds(languageId) {
        return (relatedFilesProviders[languageId] || relatedFilesProviders['all']);
    }
    
    
     function doRelatedFilesSearch() {
        if (DocumentManager.getCurrentDocument()) {
            var currentEditor = EditorManager.getActiveEditor();
            var selectedText = (currentEditor && currentEditor.getSelectedText()) || "";
            QuickOpen.beginSearch("#", selectedText);
        }
    }
    
    function match(query) {
        return (query[0] === "#" && this.name === "Related files");
    }
    
    function addRelatedFilesPlugin() {
        var search = _getProvidersForLanguageIds("html")[0];
        QuickOpen.addQuickOpenPlugin({
            name: "Related files",
            languageIds: ["html"],
            search: search.provider.getRelatedFiles,
            match: match,
            itemFocus: QuickOpenHelper.itemFocus,
            itemSelect: QuickOpenHelper.itemSelect
    });
    }
    
    CommandManager.register(Strings.CMD_GOTO_RELATED_FILES, Commands.NAVIGATE_GOTO_RELATED_FILES, doRelatedFilesSearch);
    
    exports.registerRelatedFilesProvider = registerRelatedFilesProvider;
});