define('plug',{
    load: function (name, require, load, config) {
        if (!name) {
            name = 'main';
        } else if (name.charAt(0) === '/') {
            name = 'main' + name;
        }

        //Only grab the first segment of the name.
        //This is just to be different, nothing
        //that is required behavior.
        name = name.split('/').shift();

        name = 'plug/' + name;

        require([name], load);
    }
});
define('plug/c1',{
    name: 'plug!c1'
});



define('a',['c', 'c/sub'], function (c, csub) {
    return {
        c: c,
        csub: csub
    };
});

define('plug/main',{
    name: 'plug!main'
});



define('b',['c', 'c/sub'], function (c, csub) {
    return {
        c: c,
        csub: csub
    };
});

define('plug/c2',{
    name: 'plug!c2'
});



define('a/sub/one',['c', 'c/sub'], function (c, csub) {
    return {
        c: c,
        csub: csub
    };
});

require({
        baseUrl: './',
        paths: {
            a: 'a1'
        },

        map: {
            '*': {
                c: 'plug!'
            },
            'a': {
                c: 'plug!c1'
            },
            'a/sub/one': {
                'c': 'plug!c2'
            }
        }
    },
    ['a', 'b', 'c', 'a/sub/one'],
    function(a, b, c, one) {
        doh.register(
            'mapConfigPlugin',
            [
                function mapConfigPlugin(t){
                    t.is('plug!c1', a.c.name);
                    t.is('plug!c1', a.csub.name);
                    t.is('plug!c2', one.c.name);
                    t.is('plug!c2', one.csub.name);
                    t.is('plug!main', b.c.name);
                    t.is('plug!main', b.csub.name);
                    t.is('plug!main', c.name);
                }
            ]
        );
        doh.run();
    }
);

define("mapConfigPlugin-tests", function(){});

