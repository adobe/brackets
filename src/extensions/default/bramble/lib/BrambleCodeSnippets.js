/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, brackets */

define(function (require, exports, module) {
    "use strict";
	
    var CommandManager = brackets.getModule("command/CommandManager");
    var EditorManager  = brackets.getModule("editor/EditorManager");

    var CMD_ADD_CODE_SNIPPET_ID     = "bramble.addCodeSnippet";
	
    /* Example Snippet */
    /*var snippet = 
    '<p> Hello World </p>'*/
	
    function init() {
        /**
         * Inserts a code snippet into the editor.
         * @param {string} snippet The snippet to insert.
         */
        function addCodeSnippet(snippet) {
            var editor = EditorManager.getFocusedEditor();
            if (editor) {
                var insertionPos = editor.getCursorPos();
                editor.document.replaceRange(snippet, insertionPos);
            }
        }	
	
        CommandManager.registerInternal(CMD_ADD_CODE_SNIPPET_ID, addCodeSnippet);
    }
	
    exports.init = init;
});

