/*jslint vars: true, plusplus: true, devel: true, nomen: true,  regexp: true, indent: 4, maxerr: 50 */
/*global define, window */

// Camera component to stream a video feed from the user's webcam
define(function (require, exports, module) {
    "use strict";

    var vendorURL = window.URL || window.webkitURL;

    function Video(context) {
        this.context = context;
        this.streaming = false;
    }

    // Begine playing the video
    Video.prototype.play = function(stream) {
        var self = this;
        var mainInterface = this.context.interface;
        // We need to initialize all interfaces first
        mainInterface.init();
        var videoInterface = this.interface;

        var playVideo = function() {
            videoInterface.removeEventListener("playing", playVideo);
            self.startStream();
        };
        var pauseVideo = function() {
            videoInterface.removeEventListener("pause", pauseVideo);
            self.endStream();
        };
        var videoError = function(ev) {
            videoInterface.removeEventListener("playing", playVideo);
            videoInterface.removeEventListener("pause", pauseVideo);
            self.endStream();
            this.context.fail(new Error("Failed to load " + ev.target.src));
        };

        this.stream = stream;
        videoInterface.src = vendorURL.createObjectURL(stream);
        videoInterface.addEventListener("playing", playVideo, false);
        videoInterface.addEventListener("pause", pauseVideo);
        videoInterface.addEventListener("error", videoError);

        mainInterface.enableSnapIcon();
        videoInterface.play();
    };

    // Pipe the stream from the webcam to the video component
    Video.prototype.startStream = function() {
        if(this.streaming) {
            return;
        }

        var width = this.context.interface.getWidth();
        var height = this.interface.videoHeight / (this.interface.videoWidth/width);
        // Firefox currently has a bug where the height can't be read from
        // the video, so we will make assumptions if this happens.
        if (isNaN(height)) {
            height = width / (4/3);
        }

        this.context.interface.setCameraSize(height);

        this.streaming = true;
    };

    // Cleanup streaming resources used by the video
    Video.prototype.endStream = function() {
        vendorURL.revokeObjectURL(this.interface.src);

        if(this.stream) {
            this.stream.stop();
            this.stream = null;
            this.streaming = false;
        }
    };

    module.exports = Video;
});
