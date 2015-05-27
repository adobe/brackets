/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define */

define(function (require, exports, module) {
    "use strict";

    // If you need to debug Path or Buffer, change away from .min versions here
    exports.Path = require("thirdparty/filer/dist/path.min");
    exports.Buffer = require("thirdparty/filer/dist/buffer.min");
});
