define('a',[], {});

define('text!template.html',[],function () { return 'TEXT';});

define('b',['text!template.html'], function(tmpl) {
    return 'b ' + tmpl;
});

define('c',['text!template.html'], function(tmpl) {
    return 'c ' + tmpl;
});

require(['a'], function (a) {
    require({
        paths: {
            'text': '../../../text/text'
        }
    }, ['b', 'c'], function(b, c) {

        doh.register(
            "issue379",
            [
                function issue379(t){
                    t.is('b TEXT', b);
                    t.is('c TEXT', c);
                }
            ]
        );
        doh.run();
    });
});