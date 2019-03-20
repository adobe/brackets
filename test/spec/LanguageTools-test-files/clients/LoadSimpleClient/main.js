define(function (require, exports, module) {
    "use strict";

    var LanguageTools = brackets.getModule("languageTools/LanguageTools"),
        AppInit = brackets.getModule("utils/AppInit"),
        ExtensionUtils = brackets.getModule("utils/ExtensionUtils"),
        ProjectManager = brackets.getModule("project/ProjectManager"),
        CodeHintManager = brackets.getModule("editor/CodeHintManager"),
        ParameterHintManager = brackets.getModule("features/ParameterHintsManager"),
        JumpToDefManager = brackets.getModule("features/JumpToDefManager"),
        CodeInspection = brackets.getModule("language/CodeInspection"),
        DefaultProviders = brackets.getModule("languageTools/DefaultProviders"),
        DefaultEventHandlers = brackets.getModule("languageTools/DefaultEventHandlers");

    var clientFilePath = ExtensionUtils.getModulePath(module, "client.js"),
        clientName = "LoadSimpleClient",
        clientPromise = null;

    AppInit.appReady(function () {
        clientPromise = LanguageTools.initiateToolingService(clientName, clientFilePath, ['unknown']);
    });
    
    exports.initExtension = function () {
        var retval = $.Deferred();
        
        if ($.isFunction(clientPromise.promise)) {
            clientPromise.then(retval.resolve, retval.reject); 
        } else {
            retval.reject();
        }
        
        return retval;
    };
});
