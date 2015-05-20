/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, brackets, $, document, Mustache*/

define(function (require, exports, module) {
    "use strict";

    var EditorManager  = brackets.getModule("editor/EditorManager"),
        ExtensionUtils = brackets.getModule("utils/ExtensionUtils"),
        lineWidgetHTML = require("text!inlineWidget.html"),
        currentErrorWidget,
        errorToggle,
        isShowingDescription;
    
    ExtensionUtils.loadStyleSheet(module, "main.less");
    require("tooltipsy.source");

    //Publicly available function to remove all errors from brackets
    function cleanUp(line) {
        removeButton();
        removeHighlight(line);
        hideDescription();
        isShowingDescription = false;
    }

    //Publicly available function used to display error markings
    function scafoldHinter(errorStart, errorEnd, errorObj) {
        //Setup neccessary variables
        errorToggle = document.createElement("div");
        isShowingDescription = false;

        showButton(errorObj);

        highlight(errorObj);

        //Apply on click method to the errorToggle to display the inLineErrorWidget
        errorToggle.onclick = function() {
            if(!isShowingDescription) {
                showDescription(errorObj);
            }
            else {
                hideDescription();
            }
            isShowingDescription = !isShowingDescription;
        };
        return $(errorToggle);
    }

    //Returns the current editor we reside in
    function getActiveEditor() {
        return EditorManager.getActiveEditor();
    }

    //Returns the current instance of codeMirror
    function getCodeMirror() {
        return getActiveEditor()._codeMirror;
    }

    //Highlights the line in which the error is present
    function highlight(errorObject) {
        if(!errorObject.line) {
            return;
        }
        getCodeMirror().getDoc().addLineClass(errorObject.line, "background", "errorHighlight");
    }

    //Removes highlight from line in which error was present
    function removeHighlight(line) {
        if(!line) {
            return;
        }
        getCodeMirror().getDoc().removeLineClass(line, "background", "errorHighlight");
    }

    //Function that adds a button on the gutter (on given line nubmer) next to the line numbers
    function showButton(errorObject){
        getCodeMirror().addWidget(errorObject, errorToggle, false);
        $(errorToggle).attr("class", "hint-marker-positioning hint-marker-error").removeClass("hidden");
        //Show tooltips message
        $(".hint-marker-positioning").tooltipsy({content : "Click error icon for details", alignTo: "cursor", offset: [10, -10]});
    }

    // Function that removes gutter button
    function removeButton(){
        if(!errorToggle) {
            return;
        }
        if (errorToggle.parentNode) {
            $(errorToggle).remove();
        }

        //Destroy tooltips instance
        var tooltips = $(".hint-marker-positioning").data("tooltipsy");
        if(tooltips) {
            tooltips.destroy();
        }
        isShowingDescription = false;
    }

    //Creates the description, and then displays it
    function showDescription(error) {
        var description = document.createElement("div");
        description.className = "errorPanel";
        description.innerHTML = Mustache.render(lineWidgetHTML, {"error": error.message});
        var options = {coverGutter: false, noHScroll: false, above: false, showIfHidden: false};

        currentErrorWidget = getCodeMirror().addLineWidget(error.line, description, options);
    }

    //Destroys the description
    function hideDescription() {
        if(!currentErrorWidget) {
            return;
        }
        currentErrorWidget.clear();
        currentErrorWidget = null;
    }

    exports.cleanUp = cleanUp;
    exports.scafoldHinter = scafoldHinter;
});
