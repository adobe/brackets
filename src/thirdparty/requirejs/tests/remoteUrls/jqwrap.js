define(function (require) {
    //Tests detecting a full URL dependency inside simplified wrapper.
    require('https://ajax.googleapis.com/ajax/libs/jquery/1.6.4/jquery.min.js');

    function noop() {};

    return {
        isFunction: jQuery.isFunction(noop)
    };
});
