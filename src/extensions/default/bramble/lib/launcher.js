define(function (require, exports, module) {
    "use strict";

    var Tutorial     = require("lib/Tutorial");
    var _launcherInstance;

    function Launcher(options) {
        var _browser = options.browser;
        var _server = options.server;
        // Whether or not we're overriding the preview with a tutorial
        var _tutorialOverride;

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

        Object.defineProperty(this, "tutorialOverride", {
            configurable: false,
            get: function() {
                return _tutorialOverride;
            },
            set: function(val) {
                _tutorialOverride = val;
            }
        });

        _launcherInstance = this;
    }

    function _launch(url, callback) {
        var server = _launcherInstance.server;
        var browser = _launcherInstance.browser;

        server.serveLiveDocForUrl(url, function(err, urlOrHTML) {
            if(err) {
                // TODO: how to deal with this error?                
                console.error("[Launcher Error]", err);
                return;
            }
            browser.update(urlOrHTML);

            if(typeof callback === "function") {
                callback();
            }
        });
    }

    Launcher.prototype.launch = function(url, callback) {
        if(!Tutorial.getOverride()) {
            return _launch(url, callback);
        }

        // Hijack the preview loading if we're meant to be showing the tutorial.
        Tutorial.exists(function(tutorialExists) {
            if(!tutorialExists) {
                console.error("[Launcher Error] expected tutorial.html to exist");
                // Fallback to normal loading so we show something
                _launch(url, callback);
            } else {
                // Swap out the tutorial url and reload if necessary. We try hard
                // not to reload unless we have to, so the tutorial doesn't flicker.
                if(Tutorial.shouldReload()) {
                    _launch(Tutorial.getUrl(), callback);
                }
            }
        });
    };

    Launcher.getCurrentInstance = function() {
        return _launcherInstance;
    };

    // Define public API
    module.exports = Launcher;
});
