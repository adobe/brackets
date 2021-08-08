require({
    baseUrl: requirejs.isBrowser ? './' : './plugins/fromText',
    paths: {
        'text': '../../../../text/text'
    },
    config: {
        'refine!b': {
            color: 'blue'
        },
        'refine!c': {
            color: 'cyan'
        }
    }
});

//The refine plugin changes the word refine into define.
define('refine!c', function (require, exports, module) {
    return {
        name: 'c',
        color: module.config().color
    };
});

require(['refine!b', 'refine!c'], function (b, c) {

    doh.register(
        'pluginsFromTextConfig',
        [
            function pluginsFromTextConfig(t){
                t.is('b', b.name);
                t.is('blue', b.color);
                t.is('c', c.name);
                t.is('cyan', c.color);
             }
        ]
    );
    doh.run();
});
