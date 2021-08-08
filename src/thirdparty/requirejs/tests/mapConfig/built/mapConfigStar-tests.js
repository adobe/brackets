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

define('another/minor',{
    name: 'another/minor'
});


define('another/c',['./minor'], function (minor) {
    return {
        name: 'another/c',
        minorName: minor.name
    };
});

define('another/c/dim',{
    name: 'another/c/dim'
});

define('another/c/sub',['./dim'], function (dim) {
    return {
        name: 'another/c/sub',
        dimName: dim.name
    };
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
                'c': 'another/c'
            },
            'a': {
                c: 'c1'
            },
            'a/sub/one': {
                'c': 'c2',
                'c/sub': 'another/c/sub'
            }
        }
    },
    ['a', 'b', 'c', 'a/sub/one'],
    function(a, b, c, one) {
        doh.register(
            'mapConfigStar',
            [
                function mapConfigStar(t){
                    t.is('c1', a.c.name);
                    t.is('c1/sub', a.csub.name);
                    t.is('c2', one.c.name);
                    t.is('another/c/sub', one.csub.name);
                    t.is('another/c/dim', one.csub.dimName);
                    t.is('another/c', b.c.name);
                    t.is('another/minor', b.c.minorName);
                    t.is('another/c/sub', b.csub.name);
                    t.is('another/c', c.name);
                    t.is('another/minor', c.minorName);
                }
            ]
        );
        doh.run();
    }
);

define("mapConfigStar-tests", function(){});

