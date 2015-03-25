/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define */
define(function (require, exports, module) {
    "use strict";

    var Filer = require("thirdparty/filer/dist/filer");
    var fs;

    Filer.fs = function() {
        if(!fs) {
            fs = new Filer.FileSystem({provider: new Filer.FileSystem.providers.Memory()});
        }

        return fs;
    };

    module.exports = Filer;
});
