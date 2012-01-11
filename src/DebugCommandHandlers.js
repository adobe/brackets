/*
 * Copyright 2011 Adobe Systems Incorporated. All Rights Reserved.
 */
define(function(require, exports, module) {
    // Load dependent modules
    var CommandManager      = require("CommandManager")
    ,   Commands            = require("Commands")
    ;
     
    /**
     * Handlers for commands related to file handling (opening, saving, etc.)
     */
      
    function init(editor) {
        // Register global commands
        CommandManager.register(Commands.DEBUG_FIND, function() {
            CodeMirror.commands.find(editor);
        });
        CommandManager.register(Commands.DEBUG_FINDNEXT, function() {
            CodeMirror.commands.findNext(editor);
        });
    };
  
    exports.init = init;
});
