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
