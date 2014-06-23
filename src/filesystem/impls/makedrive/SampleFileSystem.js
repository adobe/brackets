/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, appshell, $, window */

// Generate a sample set of files and folders

define(function (require, exports, module) {
    "use strict";

    exports.ensureSampleFileSystem = function(fs) {

        var create = function createFileIfMissing(path, contents, callback) {
            callback = callback || function(){};
            fs.exists(path, function(exists) {
                if(exists) {
                    return callback(null);
                }

                fs.writeFile(path, contents, callback);
            });
        };

        create('/index.html', '<html>\n<head><link rel="stylesheet" type="text/css" href="styles.css"></head>\n<body>\n<p>Why hello there, Brackets running in a browser!</p>\n</body>\n</html>');
        create('/styles.css', 'p { color: green; }');

/**
        fs.mkdir('/project1', function() {
            create('/project1/index.html', '<script src="code.js"></script>');
//            create('/project1/code.js', require('text!filesystem/impls/makedrive/MakeDriveFileSystem.js'));
        });

        fs.mkdir('/dialogs', function() {
            create('/dialogs/open-dialog.html', require('text!filesystem/impls/makedrive/open-dialog.html'));
            create('/dialogs/open-dialog.js', require('text!filesystem/impls/makedrive/open-dialog.js'));
        });

**/
    };
});
