/**
 * Brackets Themes Copyright (c) 2014 Miguel Castillo.
 *
 * Licensed under MIT
 */


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global $, define, require */

define(function(require) {
    "use strict";

    var FileUtils = require("file/FileUtils");
    var cm_path   = FileUtils.getNativeBracketsDirectoryPath() + "/thirdparty/CodeMirror2";

    return {
        "fontSize": 12,
        "lineHeight": '1.3em',
        "fontType": "'SourceCodePro-Medium', ＭＳ ゴシック, 'MS Gothic', monospace",
        "customScrollbars": true,
        "theme": ["default"],
        "paths": [
            {path:require.toUrl("./") + "../../themes"},
            {path:require.toUrl("./theme/")},
            {path:cm_path + "/theme"}
        ]
    };
});
