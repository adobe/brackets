define(function (require) {
    return {
        dotPath: require.toUrl('.'),
        html: require('text!./util.html'),
        auxHtml: require('text!../auxil.html'),
        thing: require('./nested/thing')
    };
});
