require({
        baseUrl: requirejs.isBrowser ? './' : './plugins/pluginShim',
        paths: {
            'text': '../../../../text/text',
            'refine': '../fromText/refine'
        },
        shim: {
            'refine!a': ['!legacy']
        }
},      ['refine!a'],
function (a) {

    doh.register(
        'pluginShim',
        [
            function pluginShim(t){
                t.is('alegacy', a.name);
             }
        ]
    );
    doh.run();
});
