require({
    paths: {
        'text': '../../../../text/text'
    },
    bundles: {
        'main': ['text!template.html']
    }
}, ['text!template.html', 'text!second.html'], function (template, secondTemplate) {

    doh.register(
        'pluginBundlesSeparateText',
        [
            function pluginBundlesSeparateText(t){
                t.is('main template', template);
                t.is('second template', secondTemplate);
            }
        ]
    );
    doh.run();

});
