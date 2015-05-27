define(function (require, exports, module) {
    "use strict";

    var _launcherInstance;

    function Launcher(options) {
        var _browser = options.browser;
        var _server = options.server;

        Object.defineProperty(this, "browser", {
            configurable: false,
            get: function () {
                return _browser;
            }
        });

        Object.defineProperty(this, "server", {
            configurable: false,
            get: function () {
                return _server;
            }
        });

        _launcherInstance = this;
    }

    Launcher.prototype.launch = function(url) {
        var server = this.server;
        var browser = this.browser;

        server.serveLiveDoc(url, function(err, urlOrHTML) {
            if(err) {
                // TODO: how to deal with this error?                
                console.error("[Launcher Error]", err);
                return;
            }
            browser.update(urlOrHTML);
        });
    };

    Launcher.getCurrentInstance = function() {
        return _launcherInstance;
    };

    // Define public API
    module.exports = Launcher;
});
