/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, brackets*/

define(function (require, exports, module) {
    "use strict";

    var AppInit               = brackets.getModule("utils/AppInit"),
        EditorManager         = brackets.getModule("editor/EditorManager"),
        ExtensionUtils        = brackets.getModule("utils/ExtensionUtils"),
        MainViewManager       = brackets.getModule("view/MainViewManager"),
        MarkErrors            = require("errorDisplay"),
        parse                 = require("./parser"),
        defaultFont,
        errorCache = {};


    ExtensionUtils.loadStyleSheet(module, "main.less");

    function main(){
        var editor = EditorManager.getActiveEditor();
        var error;
        var html;

        if(!editor || editor.document.getLanguage().getName() !== "HTML") {
            return;
        }

        html = editor.document.getText();
        error = parse(html);

        clearAllErrors();

        if(error) {
            errorCache.message = error.message;
            errorCache.line = editor._codeMirror.getDoc().posFromIndex(error.cursor).line;
            MarkErrors.scafoldHinter(error.cursor, error.end, errorCache);
        }
    }

    function clearAllErrors(){
        MarkErrors.cleanUp(errorCache.line);
        errorCache = {};
    }

    //Document changed event handler
    var documentChanged = function (editor, object) {
        if(editor){
            main();
        }
    };

    //Detects font change event
    var fontChange = function(editor) {
        if(editor) {
            if(defaultFont !== editor.defaultTextHeight()) {
                defaultFont = editor.defaultTextHeight();
                main();
            }
        }
    };

    //Switching editors
    var activeEditorChangeHandler = function ($event, focusedEditor, lostEditor) {
        if (lostEditor) {
            lostEditor._codeMirror.off("change", documentChanged);
            lostEditor._codeMirror.off("update", fontChange);
        }
        if (focusedEditor) {
            focusedEditor._codeMirror.on("change", documentChanged);
            focusedEditor._codeMirror.on("update", fontChange);
        }
    };

    AppInit.appReady(function(){
        EditorManager.on("activeEditorChange", activeEditorChangeHandler);

        var currentEditor = EditorManager.getActiveEditor();
        currentEditor._codeMirror.on("change", documentChanged);
        defaultFont = currentEditor._codeMirror.defaultTextHeight();
        currentEditor._codeMirror.on("update", fontChange);
        MainViewManager.on("currentFileChange", documentChanged);
    });
});

