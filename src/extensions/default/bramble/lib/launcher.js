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

        callback = callback || function(){};

        server.serveLiveDocForUrl(url, function(err, urlOrHTML) {
            if(err) {
                console.error("[Launcher Error]", err);
                return callback();
            }
            browser.update(urlOrHTML);
            callback();
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
                // Reset the tutorial override, and fallback to normal loading. so we show something
                Tutorial.setOverride(false);
            } else {
                // Swap out the tutorial url and reload if necessary. We try hard
                // not to reload unless we have to, so the tutorial doesn't flicker.
                if(Tutorial.shouldReload()) {
                    _launch(Tutorial.getPath(), callback);
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
