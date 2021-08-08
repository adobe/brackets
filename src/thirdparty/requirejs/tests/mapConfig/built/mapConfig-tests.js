define('c1',{
    name: 'c1'
});

define('c1/sub',{
    name: 'c1/sub'
});

define('a',['c', 'c/sub'], function (c, csub) {
    return {
        c: c,
        csub: csub
    };
});

define('c',{
    name: 'c'
});

define('c/sub',{
    name: 'c/sub'
});

define('b',['c', 'c/sub'], function (c, csub) {
    return {
        c: c,
        csub: csub
    };
});

define('c2',{
    name: 'c2'
});

define('c2/sub',{
    name: 'c2/sub'
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
            'a': {
                c: 'c1'
            },
            'a/sub/one': {
                'c': 'c2'
            }
        }
    },
    ['a', 'b', 'c', 'a/sub/one'],
    function(a, b, c, one) {
        doh.register(
            'mapConfig',
            [
                function mapConfig(t){
                    t.is('c1', a.c.name);
                    t.is('c1/sub', a.csub.name);
                    t.is('c2', one.c.name);
                    t.is('c2/sub', one.csub.name);
                    t.is('c', b.c.name);
                    t.is('c/sub', b.csub.name);
                    t.is('c', c.name);
                }
            ]
        );
        doh.run();
    }
);

define("mapConfig-tests", function(){});

