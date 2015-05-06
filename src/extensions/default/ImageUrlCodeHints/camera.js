/*jslint vars: true, plusplus: true, devel: true, nomen: true,  regexp: true, indent: 4, maxerr: 50 */
/*global define, brackets, $, window */

define(function (require, exports, module) {
    "use strict";

    var Dialog = brackets.getModule("widgets/Dialogs");
    var Buffer = brackets.getModule("filesystem/impls/filer/BracketsFiler").Buffer;
    var Strings = brackets.getModule("strings");
    var fs = brackets.getModule("fileSystemImpl");
    var selfieDialogHTML = require("text!dialog.html");
    var selfieWidgetHTML = require("text!selfieWidget.html");
    var _selfieDialog;
    var video;
    var photo;
    var retake;
    var snap;
    var canvas;
    var use;
    var deferred;
    var filePath;
    var streaming = false;
    var height;
    var width = 320;
    var vendorURL = window.URL || window.webkitURL;
    var navigator = window.navigator;
    navigator.getMedia =   (navigator.getUserMedia ||
                            navigator.webkitGetUserMedia ||
                            navigator.mozGetUserMedia ||
                            navigator.msGetUserMedia);


    /**
     * Dialog Buttons IDs
     * @const {string}
     */
    var DIALOG_BTN_CANCEL = "cancel";
    var DIALOG_BTN_OK = "ok";
    
    /**
     * Dialog Buttons Class Names
     * @const {string}
     */
    var DIALOG_BTN_CLASS_PRIMARY = "primary";
    var DIALOG_BTN_CLASS_LEFT = "left";    

    // Based on http://stackoverflow.com/questions/21797299/convert-base64-string-to-arraybuffer
    function base64ToBuffer(base64) {
        // This code will have to change to use Filer's Buffer api
        var bin = window.atob(base64);
        var len = bin.length;
        var bytes = new window.Uint8Array(len);
        for(var i = 0; i < len; i++) {
            bytes[i] = bin.charCodeAt(i);
        }

        return bytes.buffer;
    }

    function clearPhoto() {
        photo.style.display = "none";
        retake.style.display = "none";
        use.style.display = "none";
        video.style.display = "initial";
        snap.style.display = "initial";
    }

    function streamVideo() {
        if (streaming) {
            return;
        }

        height = video.videoHeight / (video.videoWidth/width);

        // Firefox currently has a bug where the height can't be read from
        // the video, so we will make assumptions if this happens.
        if (isNaN(height)) {
            height = width / (4/3);
        }

        video.setAttribute('width', width);
        video.setAttribute('height', height);
        canvas.setAttribute('width', width);
        canvas.setAttribute('height', height);
        streaming = true;
    }

    function initWidget() {
        var selfieContainer = $("#selfie-container");
        $("#selfie-allow-access").remove();
        selfieContainer.prepend(selfieWidgetHTML);
        video = document.getElementById("selfie-video");
        photo = document.getElementById("selfie-photo");
        retake = document.getElementById("selfie-retake");
        snap = document.getElementById("selfie-snap");
        canvas = document.getElementById("selfie-canvas");
        use = document.getElementById("selfie-use");
    }

    function playVideo(stream) {
        initWidget();

        video.src = vendorURL.createObjectURL(stream);

        video.addEventListener("canplay", streamVideo, false);
        video.addEventListener("pause", function() {
            vendorURL.revokeObjectURL(video.src);

            if(stream) {
                stream.stop();
                stream = null;
                streaming = false;
            }
        });
        snap.addEventListener("click", function(ev) {
            ev.preventDefault();
            snapPhoto(deferred, filePath);
        });

        video.play();
    }

    function snapPhoto() {
        var context = canvas.getContext("2d");
        var data;

        function savePhoto() {
            if(!data) {
                return deferred.reject();
            }

            var bin = /^data:image\/png;base64,(.+)/.exec(data)[1];
            save(deferred, filePath, base64ToBuffer(bin));
        }

        if(!width || !height) {
            clearPhoto();
            return deferred.reject();
        }

        canvas.width = width;
        canvas.height = height;
        context.drawImage(video, 0, 0, width, height);

        // TODO: Revoke data url on close
        data = canvas.toDataURL("image/png");
        photo.setAttribute("src", data);
        photo.style.display = "initial";
        retake.style.display = "initial";
        use.style.display = "initial";
        video.style.display = "none";
        snap.style.display = "none";
        retake.removeEventListener("click", clearPhoto);
        retake.addEventListener("click", clearPhoto);
        use.removeEventListener("click", savePhoto);
        use.addEventListener("click", savePhoto);
    }

    function attachCamera() {
        if(navigator.getMedia) { // Standard
            navigator.getMedia({video: true, audio: false}, playVideo, function(error) {
                deferred.reject(error);
            });
        }
    }

    function getSelfieDialog() {
        return _selfieDialog;
    }

    function show(path) {
        deferred = new $.Deferred();
        filePath = path;
        var obj = {
            buttons: [{ className: DIALOG_BTN_CLASS_LEFT, id: DIALOG_BTN_CANCEL, text: "Cancel" },{ className: DIALOG_BTN_CLASS_PRIMARY, id: DIALOG_BTN_OK, text: "Select Selfie" }]
        }
        selfieDialogHTML = Mustache.render(selfieDialogHTML, obj);

        _selfieDialog = Dialog.showModalDialogUsingTemplate(selfieDialogHTML);

        $("#selfie-close").on("click", function() {
            _selfieDialog.close();
            deferred.resolve();
        });

        attachCamera();

        return deferred.promise();
    }

    function save(deferred, filePath, content) {
        fs.writeFile(filePath, new Buffer(content), function(err) {
            if(err) {
                return deferred.reject(err);
            }

            deferred.resolve(filePath);
        });
    }

    exports.show = show;
    exports.getDialog = getSelfieDialog;
    exports.isSupported = !!navigator.getMedia;
});
