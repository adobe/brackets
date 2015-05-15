/*jslint vars: true, plusplus: true, devel: true, nomen: true,  regexp: true, indent: 4, maxerr: 50 */
/*global define */

// Camera component to preview the photo taken
define(function (require, exports, module) {
    "use strict";

    function Photo(context) {
        this.context = context;
        this.canvas = {};
        this.data = null;
    }

    // Update the photo with a newly taken snapshot
    Photo.prototype.update = function() {
        this.data = this.canvas.interface.toDataURL("image/png");
        this.interface.setAttribute("src", this.data);
    };

    module.exports = Photo;
});
