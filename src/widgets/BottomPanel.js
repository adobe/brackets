/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $ */

define(function (require, exports, module) {
    'use strict';
    
    var EditorManager   = require("editor/EditorManager");
    
    var open = function() {
        //foo
    };
    
    var close = function() {
        //foo
    };

    var clearContent = function() {
        $("#bottom-panel").empty();
        $("#bottom-panel").hide();
        EditorManager.resizeEditor();
    };
    
    var loadContent = function(html) {
        clearContent();
        
        $("#bottom-panel").append(html);
        $("#bottom-panel").show();
        EditorManager.resizeEditor();
    };
    
    exports.open = open;
    exports.close = close;
    exports.loadContent = loadContent;
    exports.clearContent = clearContent;
});