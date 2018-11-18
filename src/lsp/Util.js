define(function (require, exports, module) {
    "use strict";
    function formatTypeDataForToken($hintObj, token) {

        $hintObj.addClass('brackets-hints-with-type-details');

        if (token.detail) {
            if (token.detail.trim() !== '?') {
                if (token.detail.length < 30) {
                    $('<span>' + token.detail.split('->').join(':').toString().trim() + '</span>').appendTo($hintObj).addClass("brackets-hints-type-details");
                }
                $('<span>' + token.detail.split('->').join(':').toString().trim() + '</span>').appendTo($hintObj).addClass("hint-description");
            }
        } else {
            if (token.keyword) {
                $('<span>keyword</span>').appendTo($hintObj).addClass("brackets-hints-keyword");
            }
        }

        if (token.documentation) {
            $hintObj.attr('title', token.documentation);
            $('<span></span>').text(token.documentation.trim()).appendTo($hintObj).addClass("hint-doc");
        }
    }

    exports.formatTypeDataForToken = formatTypeDataForToken;

});