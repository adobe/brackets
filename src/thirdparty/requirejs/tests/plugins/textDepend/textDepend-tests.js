require({
        baseUrl: requirejs.isBrowser ? './' : './plugins/textDepend',
        paths: {
            'text': '../../../../text/text'
        }
},      ['textDepend!a'],
function (textValue) {

    doh.register(
        'textDepend',
        [
            function textDepend(t){
                t.is('hello world', textValue);
             }
        ]
    );
    doh.run();
});
