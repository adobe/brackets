/*jslint vars: true, plusplus: true, devel: true, nomen: true,  regexp: true, indent: 4, maxerr: 50 */
/*global define, window */

// Defines a Camera API to set up the webcam functionality
// for taking pictures.
define(function (require, exports, module) {
    "use strict";

    var Interface = require("camera/interface");
    var Video = require("camera/video");
    var Photo = require("camera/photo");
    var persist = require("camera/utils").persist;

    var navigator = window.navigator;
    var getUserMedia =  navigator.getUserMedia ||
                        navigator.webkitGetUserMedia ||
                        navigator.mozGetUserMedia ||
                        navigator.msGetUserMedia;

    function Camera(deferred, savePath) {
        this._deferred = deferred;
        this.savePath = savePath;
        this.video = new Video(this);
        this.photo = new Photo(this);
        this.interface = new Interface(this);
    }
    // Expose a feature testing property for browsers that
    // do not support this functionality of HTML5
    Camera.isSupported = !!getUserMedia;

    // Initiate the camera by requesting access to the user's webcam
    Camera.prototype.start = function() {
        var self = this;

        getUserMedia.call(navigator, {video: true, audio: false}, function(stream) {
            self.video.play(stream);
        }, function(err) {
            self.fail(err);
        });
    };

    // Persist a photo (given the bytes) into the filesystem
    Camera.prototype.savePhoto = function(data) {
        var self = this;

        persist(this.savePath, data, function(err) {
            if(err) {
                 return self.fail(err);
            }

            self.success(self.savePath);
        });
    };

    // End the camera session if everything goes well
    Camera.prototype.success = function() {
        this._deferred.resolve.apply(this._deferred, arguments);
    };

    // Catch any failures that might occur
    Camera.prototype.fail = function(err) {
        this._deferred.reject(err);
    };

    module.exports = Camera;
});
