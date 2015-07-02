/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, brackets, window */

define(function (require, exports, module) {
    "use strict";

    // Override SVG ImageViewer in order to display SVG's as XML
    var PreferencesManager  = brackets.getModule("preferences/PreferencesManager");
    PreferencesManager.set("openSVGasXML", true);
});
