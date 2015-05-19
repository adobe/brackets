/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, Audio, clearTimeout */

// A module that provides UI utility for every component needed for taking
// a picture
define(function (require, exports, module) {
    "use strict";

    var selfieWidgetHTML = require("text!camera/selfieWidget.html");
    var base64ToBuffer = require("camera/utils").base64ToBuffer;
    var shutter = new Audio("./extensions/extra/ImageUrlCodeHints/camera/camera-shutter-click-08.mp3");

    // We hardcode the width of the video interface for now
    var _width = 320;

    // Shutter animation of a camera
    function playSnapAnimation() {
        $("#selfie-video-bg").addClass("on");
        shutter.play();
        var openShutter = setTimeout(function() {
            clearTimeout(openShutter);
            $("#selfie-video-bg").removeClass("on");
        }, 105);
    }

    function Interface(camera) {
        this.camera = camera;
        this.video = camera.video;
        this.photo = camera.photo;
        this.canvas = this.photo.canvas;
    }

    // Initialize all interfaces needed for the selfie taker
    Interface.prototype.init = function() {
        // Replace the request-access message with camera components
        var selfieContainer = $("#selfie-container");
        $("#selfie-allow-access").remove();
        selfieContainer.prepend(selfieWidgetHTML);

        // Camera component initialization
        this.video.interface = document.getElementById("selfie-video");
        this.photo.interface = document.getElementById("selfie-photo");
        this.canvas.interface = document.getElementById("selfie-canvas");

        // Camera buttons
        this.snapButton = document.getElementById("selfie-snap");
        this.saveButton = document.getElementById("selfie-use");
        this.saveButton.style.display = "initial";
    };

    // Set the video height
    Interface.prototype.setCameraSize = function(height) {
        this._height = height;
        this.video.interface.setAttribute("height", height);
        this.video.interface.setAttribute("width", _width);
        this.canvas.interface.setAttribute("height", height);
        this.canvas.interface.setAttribute("width", _width);
    };

    // Enable the Snap icon for the camera
    Interface.prototype.enableSnapIcon = function() {
        var self = this;

        this.snapButton.addEventListener("click", function(event) {
            event.preventDefault();

            self.saveButton.removeAttribute("disabled");
            playSnapAnimation();
            self.snapPhoto();
        });
    };

    // Read the snapped photo bytes and persist it
    Interface.prototype.snapPhoto = function() {
        if(!this._height) {
            return this.camera.fail();
        }

        var self = this;

        function persistPhoto() {
            var data = self.photo.data;
            if(!data) {
                return self.camera.fail();
            }

            var binaryDataStr = /^data:image\/png;base64,(.+)/.exec(data)[1];
            self.camera.savePhoto(base64ToBuffer(binaryDataStr));
        }

        var context = this.canvas.interface.getContext("2d");
        this.canvas.interface.width = _width;
        this.canvas.interface.height = this._height;
        context.drawImage(this.video.interface, 0, 0, _width, this._height);

        // Update the photo component with the snapped photo
        this.photo.update();

        this.saveButton.removeEventListener("click", persistPhoto);
        this.saveButton.addEventListener("click", persistPhoto);
    };

    // Get the width of the video
    Interface.prototype.getWidth = function() {
        return _width;
    };

    module.exports = Interface;
});
