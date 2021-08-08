require({
        baseUrl: requirejs.isBrowser ? './' : './plugins/fromText',
        paths: {
            'text': '../../../../text/text'
        }
},      ['refine!a'],
function () {

    doh.register(
        'pluginsFromTextNoDefine',
        [
            function pluginsFromTextNoDefine(t){
                t.is('a', a.name);
             }
        ]
    );
    doh.run();
});
