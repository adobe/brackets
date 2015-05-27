/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, brackets */
define(function (require, exports, module) {
    "use strict";

    var BaseServer              = brackets.getModule("LiveDevelopment/Servers/BaseServer").BaseServer,
        BlobUtils               = brackets.getModule("filesystem/impls/filer/BlobUtils"),
        Filer                   = brackets.getModule("filesystem/impls/filer/BracketsFiler");

    function StaticServer(config) {
        config = config || {};
        BaseServer.call(this, config);
    }

    StaticServer.prototype = Object.create(BaseServer.prototype);
    StaticServer.prototype.constructor = StaticServer;

    //Returns a pre-generated blob url based on path
    StaticServer.prototype.pathToUrl = function(path) {
        return BlobUtils.getUrl(path);
    };
    //Returns a path based on blob url
    StaticServer.prototype.urlToPath = function(url) {
        return BlobUtils.getFilename(url);
    };

    StaticServer.prototype.start = function() {
        this.fs = Filer.fs();
    };

    StaticServer.prototype.stop = function() {
        this.fs = null;
    };

    exports.StaticServer = StaticServer;
});
