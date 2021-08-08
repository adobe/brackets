require.config({
        baseUrl: requirejs.isBrowser ? './' : './plugins/fromTextEvalError',
        paths: {
            'refine': '../fromText/refine',
            'text': '../../../../text/text'
        }
});

require(['refine!a'], function (a) {
    //This should not be called
}, function (err) {
    var message = err + '';

    doh.register(
        'pluginsFromTextEvalError',
        [
            function pluginsFromTextEvalError(t){
                t.is(-1, message.indexOf('timeout'));
             }
        ]
    );
    doh.run();
});
