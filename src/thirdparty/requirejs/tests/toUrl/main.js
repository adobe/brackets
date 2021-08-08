define(function (require) {
    return {
        html: require('text!./main.html'),
        noext: require('text!sub/noext'),
        hidden: require('text!.hidden.html'),
        util: require('sub/util')
    };
});