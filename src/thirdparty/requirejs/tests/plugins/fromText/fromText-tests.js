require({
        baseUrl: requirejs.isBrowser ? './' : './plugins/fromText',
        paths: {
            'text': '../../../../text/text'
        }
},      ['refine!a'],
function (a) {

    doh.register(
        'pluginsFromText',
        [
            function pluginsFromText(t){
                t.is('a', a.name);
             }
        ]
    );
    doh.run();
});
