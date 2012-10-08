/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $ */

define(function (require, exports, module) {
    'use strict';
    
    var open = function (){
    };
    
    var close = function (){
    };

    var clearContent = function () {
        $("#bottom-panel").empty();
    };
    
    var loadContent = function ( html ) {
        $("#bottom-panel").empty();
        $("#bottom-panel").append(output);
        $("#bottom-panel").show();
    };
    
    exports.open = open;
    exports.close = close;
    exports.loadContent = loadContent;
    exports.clearContent = clearContent;
});