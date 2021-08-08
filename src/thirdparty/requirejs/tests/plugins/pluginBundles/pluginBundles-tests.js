require({
    bundles: {
        'main': ['text', 'text!template.html']
    }
}, ['text!template.html'], function (template) {

    doh.register(
        'pluginBundles',
        [
            function pluginBundles(t){
                t.is('main template', template);
            }
        ]
    );
    doh.run();

});
