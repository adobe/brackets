/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, brackets, window, Uint8Array */

// General utility methods for the camera to use
define(function (require, exports, module) {
    "use strict";

    var fs = brackets.getModule("fileSystemImpl");
    var Buffer = brackets.getModule("filesystem/impls/filer/BracketsFiler").Buffer;

    // Based on http://stackoverflow.com/questions/21797299/convert-base64-string-to-arraybuffer
    // Converts a base64 string representation of binary data to a Buffer
    function base64ToBuffer(base64Str) {
        var binary = window.atob(base64Str);
        var len = binary.length;
        var bytes = new Uint8Array(len);
        for(var i = 0; i < len; i++) {
            bytes[i] = binary.charCodeAt(i);
        }

        return new Buffer(bytes.buffer);
    }

    // Save the photo into the filesystem
    function persist(path, data, callback) {
        fs.writeFile(path, data, callback);
    }

    exports.base64ToBuffer = base64ToBuffer;
    exports.persist = persist;
});
