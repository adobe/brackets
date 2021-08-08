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
