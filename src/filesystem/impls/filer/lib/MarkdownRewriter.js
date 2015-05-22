/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define */
define(function (require, exports) {
    "use strict";

    var marked = require("thirdparty/marked/marked.min");

    function rewrite(path, markdown) {
        // Run the markdown through https://github.com/chjj/marked to get HTML
        return marked(markdown);
    }

    exports.rewrite = rewrite;
});
